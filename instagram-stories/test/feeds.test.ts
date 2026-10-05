import { describe, expect, it } from 'vitest';
import { normalizeEntries, selectRecent } from '../src/feeds.ts';

const feed = { name: 'tagesschau', url: 'https://example.com/rss', region: 'DE' as const };
const now = new Date('2026-10-05T06:00:00Z');

describe('normalizeEntries', () => {
  it('strips markup, falls back to dc:date and drops entries without a date', () => {
    const items = normalizeEntries(feed, [
      { title: ' Bahn <em>streikt</em> ', link: 'https://a', contentSnippet: 'Text&nbsp;hier', 'dc:date': '2026-10-05T05:00:00Z' },
      { title: 'Ohne Datum', link: 'https://b' },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ title: 'Bahn streikt', summary: 'Text hier', publishedAt: '2026-10-05T05:00:00.000Z' });
  });
});

describe('selectRecent', () => {
  const base = { source: 'tagesschau', region: 'DE' as const, summary: '' };

  it('keeps fresh items, newest first, and removes duplicates by link and title', () => {
    const items = selectRecent(
      [
        { ...base, title: 'Alt', link: 'https://old', publishedAt: '2026-10-04T05:00:00Z' },
        { ...base, title: 'Erste Meldung', link: 'https://1', publishedAt: '2026-10-05T04:00:00Z' },
        { ...base, title: 'Zweite Meldung', link: 'https://2', publishedAt: '2026-10-05T05:00:00Z' },
        { ...base, title: 'Zweite Meldung!', link: 'https://3', publishedAt: '2026-10-05T03:00:00Z' },
        { ...base, title: 'Anders', link: 'https://1', publishedAt: '2026-10-05T02:00:00Z' },
      ],
      now,
      20,
    );
    expect(items.map((i) => [i.id, i.link])).toEqual([
      ['n1', 'https://2'],
      ['n2', 'https://1'],
    ]);
  });
});
