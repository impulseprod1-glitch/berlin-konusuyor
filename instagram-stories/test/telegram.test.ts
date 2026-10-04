import { describe, expect, it } from 'vitest';
import { applyCommands, parseCommand, previewText } from '../src/telegram.ts';

describe('parseCommand', () => {
  it.each([
    ['/iptal', { type: 'cancel' }],
    ['İPTAL', { type: 'cancel' }],
    ['/iptal@BerlinBot', { type: 'cancel' }],
    ['/devam', { type: 'reset' }],
    ['/cikar 2 4', { type: 'remove', stories: [2, 4] }],
    ['çıkar 3,5', { type: 'remove', stories: [3, 5] }],
  ])('parses %s', (text, expected) => {
    expect(parseCommand(text)).toEqual(expected);
  });

  it('ignores chatter and empty removals', () => {
    expect(parseCommand('günaydın')).toBeNull();
    expect(parseCommand('/cikar')).toBeNull();
  });
});

describe('applyCommands', () => {
  it('collects removals in order and lets /devam reset everything', () => {
    expect(applyCommands([{ type: 'remove', stories: [2] }, { type: 'cancel' }, { type: 'reset' }, { type: 'remove', stories: [4] }], 5)).toEqual({
      cancelled: false,
      removed: [4],
    });
  });

  it('ignores story numbers that do not exist', () => {
    expect(applyCommands([{ type: 'remove', stories: [9] }], 5)).toEqual({ cancelled: false, removed: [] });
  });

  it('treats removing every story as a cancellation', () => {
    expect(applyCommands([{ type: 'remove', stories: [1, 2, 3] }], 3).cancelled).toBe(true);
  });
});

describe('previewText', () => {
  it('escapes model text before it reaches Telegram HTML', () => {
    const text = previewText({
      dateLabel: '5 Ekim 2026 Pazartesi',
      publishTime: '09:00',
      stories: [{ category: 'DÜNYA', kicker: 'x', headline: 'A <b>B</b> & C', summary: '', sources: ['BBC News'], links: ['https://example.com/?a=1&b=2'] }],
      failedFeeds: ['rbb24'],
      warnings: [],
    });
    expect(text).toContain('A &lt;b&gt;B&lt;/b&gt; &amp; C');
    expect(text).toContain('href="https://example.com/?a=1&amp;b=2"');
    expect(text).toContain('Okunamayan kaynak: rbb24');
  });
});
