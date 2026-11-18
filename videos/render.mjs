#!/usr/bin/env node
/*
 * Sahneyi kare kare render eder, sesi sentezler ve ikisini MP4'te birleştirir.
 *
 *   node render.mjs 01-enerjik                 # tam video  -> out/01-enerjik.mp4
 *   node render.mjs 01-enerjik --stills 2,9.5  # yalnızca kareler -> out/stills/
 *   node render.mjs all                        # tüm sahneler
 *   node render.mjs 01-enerjik --audio-only    # yalnızca sesi yeniden üret ve birleştir
 *   node render.mjs 05-bauhaus --voice         # Türkçe seslendirmeli sürüm -> out/05-bauhaus.seslendirme.mp4
 *
 * Gerekenler: Playwright (Chromium), ffmpeg, python3 + numpy + scipy.
 */
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { extname, join, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, 'out');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json' };

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}

function serve() {
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
    try {
      const body = await readFile(join(ROOT, path));
      res.writeHead(200, { 'content-type': MIME[extname(path)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

/** Parçalı doğrusal eşleme: düğümler [[T, t], ...] */
function interp(T, knots) {
  if (T <= knots[0][0]) return knots[0][1];
  for (let i = 1; i < knots.length; i++) {
    const [a, sa] = knots[i - 1];
    const [b, sb] = knots[i];
    if (T <= b) return sa + ((T - a) / (b - a)) * (sb - sa);
  }
  return knots[knots.length - 1][1];
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['pipe', 'inherit', 'inherit'], ...opts });
    p.on('error', reject);
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} çıkış kodu ${code}`))));
    if (opts.input) p.stdin.end(opts.input);
  });
}

async function renderScene(browser, port, name) {
  const fps = Number(arg('fps', 30));
  const stills = arg('stills');
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('console', (m) => m.type() === 'error' && console.error(`[${name}]`, m.text()));
  page.on('pageerror', (e) => console.error(`[${name}]`, e));
  await page.goto(`http://127.0.0.1:${port}/scenes/${name}.html`);
  await page.waitForFunction(() => window.SCENE, null, { timeout: 30000 });
  const { duration: sceneDuration, cues, segments } = await page.evaluate(() => window.SCENE);
  let duration = sceneDuration;

  if (stills) {
    await mkdir(join(OUT, 'stills'), { recursive: true });
    for (const t of stills.split(',').map(Number)) {
      await page.evaluate((t) => window.seek(t), t);
      await page.screenshot({ path: join(OUT, 'stills', `${name}-${t.toFixed(2)}.jpg`), type: 'jpeg', quality: 85 });
    }
    console.log(`[${name}] ${stills.split(',').length} kare -> out/stills/`);
    await page.close();
    return;
  }

  const cuesPath = join(OUT, `${name}.cues.json`);
  await writeFile(cuesPath, JSON.stringify({ duration, fps, cues, segments }, null, 1));

  // --voice: Türkçe seslendirme. Video zamanı konuşmaya göre yeniden eşlenir.
  const voice = process.argv.includes('--voice');
  let map = null;
  if (voice) {
    await run('python3', [join(ROOT, 'voice', 'voiceover.py'), 'plan', name, cuesPath]);
    map = JSON.parse(await readFile(join(OUT, 'voice', name, 'timemap.json'), 'utf8'));
    duration = map.duration;
  }

  const tag = voice ? '.seslendirme' : '';
  const silent = join(OUT, `${name}${tag}.silent.mp4`);
  const started = Date.now();
  const toScene = map ? (T) => interp(T, map.knots) : (T) => T;
  if (!process.argv.includes('--audio-only')) await renderFrames(page, name, duration, fps, silent, toScene);
  await page.close();

  const wav = join(OUT, `${name}${tag}.wav`);
  if (voice) await run('python3', [join(ROOT, 'voice', 'voiceover.py'), 'mix', name, wav]);
  else await run('python3', [join(ROOT, 'audio', `${name}.py`), cuesPath, wav]);
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-i', wav, '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', join(OUT, `${name}${tag}.mp4`)]);
  console.log(`[${name}] hazır -> out/${name}${tag}.mp4  (${((Date.now() - started) / 1000).toFixed(0)} sn)`);
}

/** Kareleri sırayla çizip ffmpeg'e akıtır (sessiz video). */
async function renderFrames(page, name, duration, fps, silent, toScene) {
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
  const ffDone = new Promise((resolve, reject) => ff.on('exit', (c) => (c === 0 ? resolve() : reject(new Error('ffmpeg ' + c)))));

  const frames = Math.round(duration * fps);
  const started = Date.now();
  for (let f = 0; f < frames; f++) {
    await page.evaluate((t) => window.seek(t), toScene(f / fps));
    const buf = await page.screenshot({ type: 'jpeg', quality: 94 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % (fps * 5) === 0) console.log(`[${name}] ${((f / frames) * 100).toFixed(0)}%  (${((Date.now() - started) / 1000).toFixed(0)} sn)`);
  }
  ff.stdin.end();
  await ffDone;
}

const target = process.argv[2];
if (!target) {
  console.error('Kullanım: node render.mjs <sahne|all> [--stills t1,t2] [--fps 30]');
  process.exit(1);
}
await mkdir(OUT, { recursive: true });
const names = target === 'all'
  ? (await readdir(join(ROOT, 'scenes'))).filter((f) => f.endsWith('.html')).map((f) => f.replace('.html', '')).sort()
  : [target];

const server = await serve();
const browser = await chromium.launch();
try {
  for (const n of names) await renderScene(browser, server.address().port, n);
} finally {
  await browser.close();
  server.close();
}
