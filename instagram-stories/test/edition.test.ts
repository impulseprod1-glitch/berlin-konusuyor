import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SAMPLE_STORIES } from '../src/sample.ts';

/*
 * The publish step is where mistakes become public: a double post, a story
 * the editor vetoed, a cancelled day that goes out anyway. These tests pin
 * that behaviour with every external service mocked.
 */

const store = new Map<string, unknown>();

vi.mock('../src/storage.ts', () => ({
  exists: vi.fn(async (_d: string, name: string) => [...store.keys()].some((k) => k.startsWith(name))),
  loadJson: vi.fn(async (_d: string, name: string) => store.get(name) ?? null),
  saveJson: vi.fn(async (_d: string, name: string, data: unknown) => void store.set(name, data)),
  uploadImage: vi.fn(async (_d: string, name: string) => `https://storage/rerendered-${name}.jpg`),
  deleteOlderThan: vi.fn(async () => 0),
}));
vi.mock('../src/telegram.ts', async (orig) => ({
  ...(await orig<typeof import('../src/telegram.ts')>()),
  readCommands: vi.fn(async () => []),
  sendMessage: vi.fn(async () => undefined),
  sendAlbum: vi.fn(async () => undefined),
}));
vi.mock('../src/instagram.ts', async (orig) => ({
  ...(await orig<typeof import('../src/instagram.ts')>()),
  publishStory: vi.fn(async (url: string) => `media-for-${url}`),
}));
vi.mock('../src/render/render.ts', () => ({
  renderSlides: vi.fn(async (slides: { name: string }[]) => slides.map((s) => ({ name: s.name, jpeg: Buffer.from(''), overflow: [] }))),
}));

const { publishEdition } = await import('../src/edition.ts');
const instagram = await import('../src/instagram.ts');
const telegram = await import('../src/telegram.ts');

const stories = SAMPLE_STORIES.slice(0, 3);
const manifest = {
  isoDate: '2026-10-05',
  preparedAt: '2026-10-05T06:15:00Z',
  stories,
  imageUrls: ['https://storage/cover.jpg', 'https://storage/1.jpg', 'https://storage/2.jpg', 'https://storage/3.jpg'],
  failedFeeds: [],
};

beforeEach(() => {
  store.clear();
  store.set('manifest', manifest);
  vi.clearAllMocks();
});

describe('publishEdition', () => {
  it('publishes cover and stories in order, then marks the day done', async () => {
    await publishEdition('2026-10-05', { immediate: true });
    expect(vi.mocked(instagram.publishStory).mock.calls.map((c) => c[0])).toEqual(manifest.imageUrls);
    expect(store.get('state-done')).toMatchObject({ status: 'published', count: 4 });
  });

  it('resumes after a partial run without posting a slide twice', async () => {
    store.set('state-decision', { cancelled: false, removed: [] });
    store.set('state-published-00', {});
    store.set('state-published-01', {});
    await publishEdition('2026-10-05', { immediate: true });
    expect(vi.mocked(instagram.publishStory).mock.calls.map((c) => c[0])).toEqual(manifest.imageUrls.slice(2));
  });

  it('posts nothing when the editor cancelled', async () => {
    vi.mocked(telegram.readCommands).mockResolvedValueOnce([{ type: 'cancel' }]);
    await publishEdition('2026-10-05', { immediate: true });
    expect(instagram.publishStory).not.toHaveBeenCalled();
    expect(store.get('state-done')).toMatchObject({ status: 'cancelled' });
  });

  it('re-renders without a removed story and keeps the decision for re-runs', async () => {
    vi.mocked(telegram.readCommands).mockResolvedValueOnce([{ type: 'remove', stories: [2] }]);
    await publishEdition('2026-10-05', { immediate: true });
    expect(vi.mocked(instagram.publishStory).mock.calls.map((c) => c[0])).toEqual([
      'https://storage/rerendered-00-cover.jpg',
      'https://storage/rerendered-01-story.jpg',
      'https://storage/rerendered-02-story.jpg',
    ]);
    expect(store.get('state-decision')).toEqual({ cancelled: false, removed: [2] });
  });

  it('does nothing once the day is done', async () => {
    store.set('state-done', { status: 'published' });
    await publishEdition('2026-10-05', { immediate: true });
    expect(instagram.publishStory).not.toHaveBeenCalled();
  });
});
