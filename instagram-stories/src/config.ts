/**
 * Everything an editor may want to tune lives here. Secrets never do – they
 * come from the environment (see .env.example and env.ts).
 */

/** Where a feed's items usually belong; the editor model makes the final call. */
export type Region = 'BERLIN' | 'DE' | 'WORLD' | 'MIXED';

export interface FeedSource {
  name: string;
  url: string;
  region: Region;
}

export const config = {
  timeZone: 'Europe/Berlin',

  /** Local Berlin time the stories go live. */
  publishAt: { hour: 9, minute: 0 },
  /**
   * A scheduled prepare run only proceeds inside this local hour. The cron
   * fires twice (summer and winter UTC offset); this check discards the wrong
   * one without having to edit the workflow at every DST switch.
   */
  prepareHour: 8,
  /** If the preview reached Telegram late, the veto window is at least this long. */
  minVetoMinutes: 10,
  /** A publish run started later than this after publishAt gives up for the day. */
  maxPublishDelayHours: 4,

  /** News slides per day, plus one cover. */
  storyCount: 5,
  /** Fewer usable stories than this and the edition is not produced at all. */
  minStoryCount: 3,
  /** Covers the evening before and the night – the window a 9 am digest owes its readers. */
  maxItemAgeHours: 20,
  maxItemsPerFeed: 25,

  brand: {
    name: 'Berlin Konuşuyor',
    wordmark: 'BERLİN KONUŞUYOR',
    handle: process.env.BRAND_HANDLE || '@berlin.konusuyor',
  },

  model: 'claude-opus-5-5',
  /**
   * Selecting five stories from ~100 headlines and writing them in Turkish is
   * a routine editorial task; medium keeps the daily cost at a few cents.
   */
  effort: 'medium',

  /**
   * Feeds are only used to find out *what* happened. The model writes every
   * line itself, in Turkish, and the slides name the outlets as sources.
   * Check each outlet's feed terms before monetising the account – rbb24, for
   * example, licenses its feed for non-commercial use only.
   */
  feeds: [
    { name: 'tagesschau', url: 'https://www.tagesschau.de/inland/index~rss2.xml', region: 'DE' },
    { name: 'tagesschau', url: 'https://www.tagesschau.de/ausland/index~rss2.xml', region: 'WORLD' },
    { name: 'rbb24', url: 'https://www.rbb24.de/aktuell/index.xml/feed=rss.xml', region: 'BERLIN' },
    { name: 'DW Türkçe', url: 'https://rss.dw.com/rdf/rss-tur-all', region: 'MIXED' },
    { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', region: 'WORLD' },
  ] satisfies FeedSource[],

  /** Story images are deleted from Firebase Storage after this many days. */
  retentionDays: 14,
} as const;
