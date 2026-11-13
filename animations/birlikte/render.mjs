// MP4 üretir: out/birlikte.mp4 (1080×1920, H.264 + AAC)
//   node build.mjs && node render.mjs            → 60 fps
//   FPS=30 node render.mjs                       → 30 fps (hızlı önizleme)
// Kareler, zaman çizelgesi saniye saniye sarılarak başsız Chromium'dan alınır
// (gerçek zamanlı kayıt yok → takılma yok). Ses src/audio.js'ten sentezlenir.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cpus } from 'node:os';
import './src/audio.js';

const { chromium } = createRequire(import.meta.url)('playwright');
const here = dirname(fileURLToPath(import.meta.url));
const FPS = +(process.env.FPS || 60), DUR = 60, TOTAL = FPS * DUR;
const WORKERS = +(process.env.WORKERS || Math.max(1, Math.min(6, cpus().length)));
const out = join(here, 'out'), frames = join(out, '.frames');
rmSync(frames, { recursive: true, force: true }); mkdirSync(frames, { recursive: true });

const audio = globalThis.BKAudio.render(48000);
writeFileSync(join(out, 'birlikte.wav'), globalThis.BKAudio.wav(audio));

const browser = await chromium.launch();
let done = 0;
const t0 = Date.now();
async function worker(k) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto('file://' + join(here, 'dist/birlikte.html') + '?render');
  await page.waitForFunction('window.BK && window.BK.ready');
  // her işçi kendi dilimini baştan sona, sırayla işler
  for (let f = Math.floor((TOTAL * k) / WORKERS); f < Math.floor((TOTAL * (k + 1)) / WORKERS); f++) {
    await page.evaluate((t) => window.BK.seek(t), f / FPS);
    await page.screenshot({ path: join(frames, String(f).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 96 });
    if (++done % 300 === 0) console.log(`${done}/${TOTAL} kare  (${((Date.now() - t0) / 1000).toFixed(0)} sn)`);
  }
  await page.close();
}
await Promise.all(Array.from({ length: WORKERS }, (_, k) => worker(k)));
await browser.close();

const mp4 = join(out, process.env.OUT || 'birlikte.mp4');
await new Promise((res, rej) => {
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(frames, '%05d.jpg'), '-i', join(out, 'birlikte.wav'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', '-t', String(DUR), mp4], { stdio: 'inherit' });
  ff.on('exit', (c) => (c ? rej(new Error('ffmpeg ' + c)) : res()));
});
rmSync(frames, { recursive: true, force: true });
console.log(`${mp4}  (${((Date.now() - t0) / 1000).toFixed(0)} sn)`);
