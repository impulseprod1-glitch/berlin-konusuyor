import { env } from './env.ts';
import type { Story } from './editor.ts';

/*
 * Telegram is the editor's desk: the preview arrives there, and replying
 * /iptal or /cikar 3 is the veto. Commands are read with getUpdates at
 * publish time, so no webhook server is needed. Only messages from
 * TELEGRAM_CHAT_ID count.
 */

export type Command = { type: 'cancel' } | { type: 'remove'; stories: number[] } | { type: 'reset' };

export interface Decision {
  cancelled: boolean;
  /** 1-based story numbers, as shown in the preview. */
  removed: number[];
}

interface Update {
  update_id: number;
  message?: { date: number; text?: string; chat: { id: number | string } };
}

async function call<T>(method: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://api.telegram.org/bot${env('TELEGRAM_BOT_TOKEN')}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; result?: T; description?: string };
  // The URL holds the bot token, so it is never part of an error message.
  if (!json.ok) throw new Error(`Telegram ${method} failed: ${json.description ?? `HTTP ${res.status}`}`);
  return json.result as T;
}

export function sendMessage(html: string): Promise<unknown> {
  return call('sendMessage', {
    chat_id: env('TELEGRAM_CHAT_ID'),
    text: html,
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
  });
}

export async function sendAlbum(imageUrls: string[]): Promise<void> {
  // Telegram groups at most ten media per album.
  for (let i = 0; i < imageUrls.length; i += 10) {
    await call('sendMediaGroup', {
      chat_id: env('TELEGRAM_CHAT_ID'),
      media: imageUrls.slice(i, i + 10).map((url) => ({ type: 'photo', media: url })),
    });
  }
}

export function previewText(opts: {
  dateLabel: string;
  publishTime: string;
  stories: Story[];
  failedFeeds: string[];
  warnings: string[];
}): string {
  const list = opts.stories
    .map((s, i) => {
      const links = s.links.map((l, j) => `<a href="${escape(l)}">${j + 1}</a>`).join(' ');
      return `<b>${i + 1}.</b> [${escape(s.category)}] ${escape(s.headline)}\n    Kaynak: ${escape(s.sources.join(', '))} ${links}`;
    })
    .join('\n');
  const notes = [
    ...(opts.failedFeeds.length > 0 ? [`⚠️ Okunamayan kaynak: ${escape(opts.failedFeeds.join(', '))}`] : []),
    ...opts.warnings.map((w) => `⚠️ ${escape(w)}`),
  ];
  return [
    `<b>Berlin Konuşuyor · ${escape(opts.dateLabel)}</b>`,
    `Bu story'ler <b>${opts.publishTime}</b>'da otomatik yayınlanacak.`,
    '',
    list,
    ...(notes.length > 0 ? ['', ...notes] : []),
    '',
    'Durdurmak için: /iptal',
    'Bir haberi çıkarmak için: /cikar 2 (birden fazla: /cikar 2 4)',
    'Kararı geri almak için: /devam',
  ].join('\n');
}

export function parseCommand(text: string): Command | null {
  const normalized = text
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğışöü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ş: 's', ö: 'o', ü: 'u' })[c]!)
    .replace(/^\//, '')
    .replace(/@\w+/, '')
    .trim();
  const [word, ...rest] = normalized.split(/[\s,]+/);
  if (word === 'iptal' || word === 'dur') return { type: 'cancel' };
  if (word === 'devam' || word === 'sifirla') return { type: 'reset' };
  if (word === 'cikar') {
    const stories = rest.map(Number).filter((n) => Number.isInteger(n) && n > 0);
    return stories.length > 0 ? { type: 'remove', stories } : null;
  }
  return null;
}

/** Commands apply in the order they were sent; /devam wipes everything before it. */
export function applyCommands(commands: Command[], storyCount: number): Decision {
  let cancelled = false;
  const removed = new Set<number>();
  for (const cmd of commands) {
    if (cmd.type === 'cancel') cancelled = true;
    else if (cmd.type === 'reset') {
      cancelled = false;
      removed.clear();
    } else cmd.stories.filter((n) => n <= storyCount).forEach((n) => removed.add(n));
  }
  if (removed.size >= storyCount) cancelled = true;
  return { cancelled, removed: [...removed].sort((a, b) => a - b) };
}

/** Commands sent from the editor's chat between `from` and `until`. */
export async function readCommands(from: Date, until: Date): Promise<Command[]> {
  const chatId = String(env('TELEGRAM_CHAT_ID'));
  const updates = await call<Update[]>('getUpdates', { timeout: 0, allowed_updates: ['message'] });
  const commands = updates
    .filter((u) => u.message && String(u.message.chat.id) === chatId)
    .filter((u) => u.message!.date * 1000 >= from.getTime() && u.message!.date * 1000 <= until.getTime())
    .sort((a, b) => a.update_id - b.update_id)
    .map((u) => parseCommand(u.message!.text ?? ''))
    .filter((c): c is Command => c !== null);

  // Acknowledge what was read so tomorrow starts with an empty queue.
  const last = updates.at(-1);
  if (last) await call('getUpdates', { offset: last.update_id + 1, timeout: 0 });
  return commands;
}

function escape(text: string): string {
  return text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}
