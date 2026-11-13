// Geliştirme yardımcısı: verilen saniyelerde kare alır ve tek bir kontak tabakası yapar.
//   node shot.mjs out.png 0.5 2.2 4.6 ...
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
const here = dirname(fileURLToPath(import.meta.url));
const [out, ...times] = process.argv.slice(2);
const tmp = join(here, 'out/.shots'); rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
p.on('console', (m) => m.type() === 'error' && console.log('console:', m.text()));
p.on('pageerror', (e) => console.log('pageerror:', e.message));
await p.goto('file://' + join(here, 'dist/birlikte.html') + '?render');
await p.waitForFunction('window.BK && window.BK.ready');
let i = 0;
for (const t of times) {
  await p.evaluate((t) => window.BK.seek(t), +t);
  await p.screenshot({ path: join(tmp, String(i++).padStart(3, '0') + '.png') });
}
await b.close();
const cols = Math.min(times.length, +(process.env.COLS || 6));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-pattern_type', 'glob', '-i', join(tmp, '*.png'), '-vf', `scale=${process.env.W || 360}:-1,tile=${cols}x${Math.ceil(times.length / cols)}:padding=6:color=0x444444`, '-frames:v', '1', out]);
console.log('wrote', out);
