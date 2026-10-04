import Parser from 'rss-parser';
import { config, type FeedSource, type Region } from './config.ts';

export interface NewsItem {
  /** Short stable handle ("n12") the editor model cites back. */
  id: string;
  source: string;
  region: Region;
  title: string;
  summary: string;
  link: string;
  publishedAt: string;
}

/** What a feed entry looks like before normalisation. */
export interface RawEntry {
  title?: string;
  link?: string;
  contentSnippet?: string;
  content?: string;
  summary?: string;
  isoDate?: string;
  pubDate?: string;
  'dc:date'?: string;
}

type Candidate = Omit<NewsItem, 'id'>;

const parser: Parser<Record<string, never>, RawEntry> = new Parser({
  timeout: 15_000,
  headers: { 'User-Agent': 'BerlinKonusuyorDigest/1.0' },
  // DW publishes RDF, whose dates live in dc:date rather than pubDate.
  customFields: { item: ['dc:date'] },
});

export async function fetchFeeds(
  feeds: readonly FeedSource[],
  now: Date,
): Promise<{ items: NewsItem[]; failed: string[] }> {
  const results = await Promise.allSettled(feeds.map((feed) => parser.parseURL(feed.url)));
  const candidates: Candidate[] = [];
  const failed: string[] = [];

  results.forEach((result, i) => {
    const feed = feeds[i]!;
    if (result.status === 'rejected') {
      // One broken feed must not cost the whole edition; it is reported in the preview.
      console.warn(`Feed failed: ${feed.name} (${feed.url}): ${String(result.reason)}`);
      failed.push(feed.name);
      return;
    }
    candidates.push(...normalizeEntries(feed, result.value.items ?? []));
  });

  return { items: selectRecent(candidates, now), failed };
}

export function normalizeEntries(feed: FeedSource, entries: RawEntry[]): Candidate[] {
  const out: Candidate[] = [];
  for (const entry of entries) {
    const title = clean(entry.title);
    const link = entry.link?.trim();
    const date = parseDate(entry.isoDate ?? entry.pubDate ?? entry['dc:date']);
    if (!title || !link || !date) continue;
    out.push({
      source: feed.name,
      region: feed.region,
      title,
      summary: truncate(clean(entry.contentSnippet ?? entry.summary ?? entry.content), 400),
      link,
      publishedAt: date.toISOString(),
    });
  }
  return out.slice(0, config.maxItemsPerFeed);
}

/** Fresh items only, duplicates removed, newest first, with short ids. */
export function selectRecent(
  candidates: Candidate[],
  now: Date,
  maxAgeHours: number = config.maxItemAgeHours,
): NewsItem[] {
  const cutoff = now.getTime() - maxAgeHours * 3_600_000;
  const seenLinks = new Set<string>();
  const seenTitles = new Set<string>();

  return candidates
    .filter((c) => {
      const t = Date.parse(c.publishedAt);
      return t >= cutoff && t <= now.getTime() + 3_600_000;
    })
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .filter((c) => {
      const titleKey = c.title.toLocaleLowerCase('de-DE').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
      if (seenLinks.has(c.link) || seenTitles.has(titleKey)) return false;
      seenLinks.add(c.link);
      seenTitles.add(titleKey);
      return true;
    })
    .map((c, i) => ({ id: `n${i + 1}`, ...c }));
}

function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : new Date(t);
}

function clean(value: string | undefined): string {
  return (value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}
