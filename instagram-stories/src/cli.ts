import { mkdirSync, writeFileSync } from 'node:fs';
import { config } from './config.ts';
import { prepareEdition, produce, publishEdition } from './edition.ts';
import { requireEnv } from './env.ts';
import { renderSlides } from './render/render.ts';
import { editionSlides } from './render/templates.ts';
import { SAMPLE_STORIES } from './sample.ts';
import * as storage from './storage.ts';
import { sendMessage } from './telegram.ts';
import { localParts, zonedTime } from './time.ts';

/*
 * Usage:
 *   tsx src/cli.ts prepare [--now] [--force] [--date YYYY-MM-DD]
 *   tsx src/cli.ts publish [--now] [--date YYYY-MM-DD]
 *   tsx src/cli.ts preview [--sample]        → ./out/*.jpg, nothing uploaded
 *
 * Scheduled runs pass no flags and decide from the Berlin clock whether this
 * is the right run (the cron fires for both UTC offsets). --now skips that
 * check and the veto wait – for manual runs from the Actions tab.
 */

const [command = 'help', ...args] = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const option = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const now = new Date();
const isoDate = option('--date') ?? localParts(now).isoDate;
const immediate = flag('--now');

const ALL_SECRETS = [
  'ANTHROPIC_API_KEY',
  'FIREBASE_SERVICE_ACCOUNT',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHAT_ID',
  'IG_USER_ID',
  'IG_ACCESS_TOKEN',
];

async function main(): Promise<void> {
  switch (command) {
    case 'prepare': {
      requireEnv(...ALL_SECRETS);
      const hour = localParts(now).hour;
      if (!immediate && hour !== config.prepareHour) {
        console.log(`Berlin hour is ${hour}, prepare runs at ${config.prepareHour} – skipping (other DST slot)`);
        return;
      }
      if (!flag('--force') && (await storage.exists(isoDate, 'manifest'))) {
        console.log(`Edition ${isoDate} is already prepared – skipping (use --force to redo)`);
        return;
      }
      await prepareEdition(isoDate, now);
      return;
    }

    case 'publish': {
      requireEnv(...ALL_SECRETS);
      const publishAt = zonedTime(isoDate, config.publishAt.hour, config.publishAt.minute);
      const minutesFromTarget = (now.getTime() - publishAt.getTime()) / 60_000;
      if (!immediate && (minutesFromTarget < -40 || minutesFromTarget > config.maxPublishDelayHours * 60)) {
        console.log(`${Math.round(minutesFromTarget)} min from publish time – outside the window, skipping`);
        return;
      }
      await publishEdition(isoDate, { immediate });
      return;
    }

    case 'preview': {
      const stories = flag('--sample') ? SAMPLE_STORIES : null;
      const rendered = stories
        ? await renderSlides(editionSlides(stories, isoDate, 'Tasarım Örneği'))
        : (requireEnv('ANTHROPIC_API_KEY'), (await produce(isoDate, now)).rendered);
      mkdirSync('out', { recursive: true });
      for (const slide of rendered) {
        writeFileSync(`out/${slide.name}.jpg`, slide.jpeg);
        console.log(`out/${slide.name}.jpg${slide.overflow.length > 0 ? `  ⚠ overflow: ${slide.overflow.join(', ')}` : ''}`);
      }
      return;
    }

    default:
      console.log('Usage: tsx src/cli.ts <prepare|publish|preview> [--now] [--force] [--sample] [--date YYYY-MM-DD]');
      process.exitCode = command === 'help' ? 0 : 1;
  }
}

main().catch(async (err: Error) => {
  console.error(err);
  process.exitCode = 1;
  // The editor should hear about a failed morning from Telegram, not from silence.
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID && command !== 'preview') {
    await sendMessage(`❌ <b>${command}</b> başarısız (${isoDate}):\n${escapeText(err.message)}`).catch(() => {});
  }
});

function escapeText(text: string): string {
  return text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
}
