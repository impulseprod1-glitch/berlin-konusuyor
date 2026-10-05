import { describe, expect, it } from 'vitest';
import { resolveDraft } from '../src/editor.ts';
import type { NewsItem } from '../src/feeds.ts';

const item = (id: string, source: string): NewsItem => ({
  id,
  source,
  region: 'DE',
  title: 't',
  summary: '',
  link: `https://example.com/${id}`,
  publishedAt: '2026-10-05T05:00:00Z',
});

describe('resolveDraft', () => {
  it('attributes stories from cited items and drops stories that cite nothing real', () => {
    const stories = resolveDraft(
      {
        stories: [
          { sourceIds: ['n1', 'n2', 'n1'], category: 'ALMANYA', kicker: ' Kira ', headline: 'Başlık.', summary: ' Özet  metni ' },
          { sourceIds: ['n99'], category: 'DÜNYA', kicker: 'x', headline: 'Uydurma', summary: '' },
        ],
      },
      [item('n1', 'tagesschau'), item('n2', 'DW Türkçe')],
      5,
    );
    expect(stories).toEqual([
      {
        category: 'ALMANYA',
        kicker: 'Kira',
        headline: 'Başlık',
        summary: 'Özet metni',
        sources: ['tagesschau', 'DW Türkçe'],
        links: ['https://example.com/n1', 'https://example.com/n2'],
      },
    ]);
  });

  it('caps the number of stories', () => {
    const draft = { stories: Array.from({ length: 7 }, () => ({ sourceIds: ['n1'], category: 'DÜNYA' as const, kicker: 'k', headline: 'h', summary: 's' })) };
    expect(resolveDraft(draft, [item('n1', 'BBC News')], 5)).toHaveLength(5);
  });
});
