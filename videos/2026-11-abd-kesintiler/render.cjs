/*
 * Renders a scene file to video frames with headless Chromium and pipes them to ffmpeg.
 *
 *   node render.cjs stills v1-sinematik 3,15,30      → out/stills/v1-sinematik-3.png …
 *   node render.cjs video  v1-sinematik [fps]         → out/v1-sinematik.video.mp4 + out/v1-sinematik.cues.json
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'out');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2' };

function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(rsp);
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}

async function open(name) {
  const srv = await serve();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 600, height: 1000 } });
  page.on('pageerror', e => console.error('pageerror', e));
  page.on('console', m => m.type() === 'error' && console.error('console', m.text()));
  await page.goto(`http://127.0.0.1:${srv.address().port}/index.html?v=${name}`);
  await page.waitForFunction('window.READY === true', null, { timeout: 30000 });
  return { page, close: async () => { await browser.close(); srv.close(); } };
}

async function stills(name, times) {
  const { page, close } = await open(name);
  fs.mkdirSync(path.join(OUT, 'stills'), { recursive: true });
  for (const t of times) {
    const url = await page.evaluate(t => { renderFrame(t); return document.getElementById('c').toDataURL('image/png'); }, t);
    const f = path.join(OUT, 'stills', `${name}-${t}.png`);
    fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64'));
    console.log(f);
  }
  await close();
}

async function video(name, fps) {
  const { page, close } = await open(name);
  fs.mkdirSync(OUT, { recursive: true });
  const meta = await page.evaluate(() => ({ duration: VIDEO.duration, cues: VIDEO.cues || [] }));
  fs.writeFileSync(path.join(OUT, `${name}.cues.json`), JSON.stringify(meta, null, 1));
  const file = path.join(OUT, `${name}.video.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(fps), file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round(meta.duration * fps);
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const url = await page.evaluate(t => frameJpeg(t, 0.95), i / fps);
    const buf = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`${name}: ${i}/${n} frames, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on('close', c => (c ? rej(new Error('ffmpeg ' + c)) : res())));
  await close();
  console.log('done', file);
}

const [mode, name, arg] = process.argv.slice(2);
(mode === 'stills' ? stills(name, (arg || '1').split(',').map(Number)) : video(name, Number(arg || 30)))
  .catch(e => { console.error(e); process.exit(1); });
