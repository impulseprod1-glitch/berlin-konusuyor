import { config } from './config.ts';
import { writeStories, type Story } from './editor.ts';
import { fetchFeeds } from './feeds.ts';
import { GraphError, publishStory } from './instagram.ts';
import { renderSlides, type RenderedSlide } from './render/render.ts';
import { editionSlides } from './render/templates.ts';
import * as storage from './storage.ts';
import * as telegram from './telegram.ts';
import { addDays, sleep, turkishDate, zonedTime } from './time.ts';

/*
 * One edition per Berlin calendar day, in two steps:
 *   prepare (~08:10) – news → stories → slides → Storage → Telegram preview
 *   publish (09:00)  – read the veto, then post the slides as stories
 * Every step leaves a marker in Firebase Storage, so a re-run (the second cron in
 * summer, or a manual run) resumes where the last one stopped and never posts
 * a slide twice.
 */

export interface Manifest {
  isoDate: string;
  preparedAt: string;
  stories: Story[];
  /** Cover first, then one image per story. */
  imageUrls: string[];
  failedFeeds: string[];
}

export interface Production {
  stories: Story[];
  rendered: RenderedSlide[];
  failedFeeds: string[];
}

const pad = (n: number) => String(n).padStart(2, '0');
export const publishTimeLabel = () => `${pad(config.publishAt.hour)}:${pad(config.publishAt.minute)}`;

/** News in, rendered slides out. No side effects besides API calls. */
export async function produce(isoDate: string, now: Date): Promise<Production> {
  const previous = process.env.FIREBASE_SERVICE_ACCOUNT
    ? await storage.loadJson<Manifest>(addDays(isoDate, -1), 'manifest')
    : null;
  const { items, failed } = await fetchFeeds(config.feeds, now);
  console.log(`${items.length} fresh items, ${failed.length} feeds failed`);
  if (items.length < config.minStoryCount) {
    throw new Error(`Only ${items.length} fresh news items – feeds may be down (${failed.join(', ') || 'none failed'})`);
  }

  const stories = await writeStories(items, {
    isoDate,
    previousHeadlines: previous?.stories.map((s) => s.headline) ?? [],
  });
  if (stories.length < config.minStoryCount) {
    throw new Error(`Only ${stories.length} usable stories – not enough for an edition`);
  }

  const rendered = await renderSlides(editionSlides(stories, isoDate));
  return { stories, rendered, failedFeeds: failed };
}

async function uploadAll(isoDate: string, rendered: RenderedSlide[]): Promise<string[]> {
  return Promise.all(rendered.map((slide) => storage.uploadImage(isoDate, slide.name, slide.jpeg)));
}

export async function prepareEdition(isoDate: string, now: Date): Promise<Manifest> {
  const { stories, rendered, failedFeeds } = await produce(isoDate, now);
  const manifest: Manifest = {
    isoDate,
    preparedAt: new Date().toISOString(),
    stories,
    imageUrls: await uploadAll(isoDate, rendered),
    failedFeeds,
  };
  await storage.saveJson(isoDate, 'manifest', manifest);

  const { date, weekday } = turkishDate(isoDate);
  await telegram.sendAlbum(manifest.imageUrls);
  await telegram.sendMessage(
    telegram.previewText({
      dateLabel: `${date} ${weekday}`,
      publishTime: publishTimeLabel(),
      stories,
      failedFeeds,
      warnings: rendered.filter((r) => r.overflow.length > 0).map((r) => `${r.name}: metin kutuya sığmadı`),
    }),
  );
  console.log(`Prepared ${stories.length} stories for ${isoDate}`);
  return manifest;
}

export async function publishEdition(isoDate: string, opts: { immediate: boolean }): Promise<void> {
  if (await storage.exists(isoDate, 'state-done')) {
    console.log(`Edition ${isoDate} already finished – nothing to do`);
    return;
  }

  let manifest = await storage.loadJson<Manifest>(isoDate, 'manifest');
  if (!manifest) {
    // The prepare run was skipped or failed; produce now and still give the
    // editor a short veto window rather than posting unseen content.
    console.warn('No prepared edition found – preparing now');
    manifest = await prepareEdition(isoDate, new Date());
  }

  let decision = await storage.loadJson<telegram.Decision>(isoDate, 'state-decision');
  if (!decision) {
    const preparedAt = new Date(manifest.preparedAt);
    const publishAt = zonedTime(isoDate, config.publishAt.hour, config.publishAt.minute);
    const deadline = opts.immediate
      ? new Date()
      : new Date(Math.max(publishAt.getTime(), preparedAt.getTime() + config.minVetoMinutes * 60_000));
    const wait = deadline.getTime() - Date.now();
    if (wait > 0) {
      console.log(`Waiting ${Math.round(wait / 1000)} s for the veto window to close`);
      await sleep(wait);
    }
    decision = telegram.applyCommands(await telegram.readCommands(preparedAt, deadline), manifest.stories.length);
    // Persisted because Telegram hands out each command only once.
    await storage.saveJson(isoDate, 'state-decision', decision);
  }

  if (decision.cancelled) {
    await storage.saveJson(isoDate, 'state-done', { status: 'cancelled', at: new Date().toISOString() });
    await telegram.sendMessage('⏸️ Bugünkü bülten iptal edildi. Instagram\'da hiçbir şey yayınlanmadı.');
    return;
  }

  let imageUrls = manifest.imageUrls;
  if (decision.removed.length > 0) {
    // Removing a story changes the cover list and every "02 / 05" counter.
    const kept = manifest.stories.filter((_, i) => !decision.removed.includes(i + 1));
    imageUrls = await uploadAll(isoDate, await renderSlides(editionSlides(kept, isoDate)));
    console.log(`Re-rendered without stories ${decision.removed.join(', ')}`);
  }

  for (const [i, url] of imageUrls.entries()) {
    const marker = `state-published-${pad(i)}`;
    if (await storage.exists(isoDate, marker)) continue;
    try {
      const mediaId = await publishStory(url);
      await storage.saveJson(isoDate, marker, { mediaId, at: new Date().toISOString() });
      console.log(`Published slide ${i + 1}/${imageUrls.length}: ${mediaId}`);
    } catch (err) {
      if (err instanceof GraphError && err.isAuth) {
        throw new Error(`Instagram token geçersiz veya süresi dolmuş (README → Token). Detay: ${err.message}`);
      }
      throw new Error(`Slide ${i + 1}/${imageUrls.length} could not be published: ${(err as Error).message}`);
    }
  }

  await storage.saveJson(isoDate, 'state-done', { status: 'published', count: imageUrls.length, at: new Date().toISOString() });
  await telegram.sendMessage(`✅ Yayında: ${imageUrls.length} story (kapak + ${imageUrls.length - 1} haber).`);

  const deleted = await storage.deleteOlderThan(config.retentionDays, new Date()).catch((err: Error) => {
    console.warn(`Cleanup failed: ${err.message}`);
    return 0;
  });
  if (deleted > 0) console.log(`Deleted ${deleted} old story files`);
}
