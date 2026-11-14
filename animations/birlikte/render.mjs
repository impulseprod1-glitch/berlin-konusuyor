// MP4 üretir: out/birlikte.mp4 (1080×1920, H.264 + AAC)
//   node build.mjs && node render.mjs            → 60 fps
//   FPS=30 node render.mjs                       → 30 fps (hızlı önizleme)
// Kareler, zaman çizelgesi saniye saniye sarılarak başsız Chromium'dan alınır
// (gerçek zamanlı kayıt yok → takılma yok). Ses src/audio.js'ten sentezlenir.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
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

// Seslendirme (voice/NN.mp3 varsa): her cümle kendi saniyesine yerleşir, yerine sığmıyorsa
// hafifçe hızlanır; müzik seslendirmenin altında kendiliğinden kısılır.
let track = join(out, 'birlikte.wav');
{
  const { lines } = JSON.parse(readFileSync(join(here, 'src/narration.json'), 'utf8'));
  const clips = lines.map((l, i) => { const b = join(here, 'voice', String(i).padStart(2, '0')); return { ...l, i, file: existsSync(b + '.wav') ? b + '.wav' : b + '.mp3' }; }).filter((c) => existsSync(c.file));
  if (clips.length && !process.env.NO_VOICE) {
    // ses zinciri: gövde temizliği, varlık (presence) artışı, sıkı kompresör → reklam/fragman tınısı
    const VOX = 'highpass=f=85,equalizer=f=250:t=q:w=1.2:g=-2,equalizer=f=3200:t=q:w=1.4:g=4,equalizer=f=9000:t=q:w=1:g=2,acompressor=threshold=0.08:ratio=4:attack=4:release=90:makeup=2.2';
    const args = ['-y', '-loglevel', 'error', '-i', track], f = [];
    // önce her klibin baş/son sessizliği atılır, cümle içi duraklamalar kısaltılır → cümle tam saniyesinde başlar
    const tmp = join(out, '.vo'); rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
    for (const c of clips) {
      const t = join(tmp, String(c.i).padStart(2, '0') + '.wav');
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', c.file, '-af', 'silenceremove=start_periods=1:start_threshold=-40dB:start_silence=0.02:stop_periods=-1:stop_threshold=-40dB:stop_duration=0.18:stop_silence=0.18', t]);
      c.file = t;
      c.dur = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', t]).toString();
      const next = lines[c.i + 1], slot = (next ? next.t : DUR) - c.t - 0.08;
      c.tempo = Math.min(1.25, Math.max(1, c.dur / slot));
      if (c.dur / slot > 1.25) console.warn(`Uyarı: ${c.i}. cümle yerine sığmıyor (${c.dur.toFixed(1)} sn → ${slot.toFixed(1)} sn)`);
    }
    // drop: true olan cümlelerde müzik tamamen susar (vurgu için)
    const drops = clips.filter((c) => c.drop).map((c) => `between(t,${(c.t - 0.05).toFixed(2)},${(c.t + Math.min(c.dur / c.tempo, 2.2) * 0.9).toFixed(2)})`);
    clips.forEach((c, k) => {
      const tempo = c.tempo;
      args.push('-i', c.file);
      f.push(`[${k + 1}:a]aresample=48000,aformat=channel_layouts=stereo,atempo=${tempo.toFixed(3)},${VOX},adelay=${Math.round(c.t * 1000)}:all=1[v${k}]`);
    });
    f.push(`${clips.map((_, k) => `[v${k}]`).join('')}amix=inputs=${clips.length}:normalize=0,volume=${process.env.VOICE_GAIN || 1.9},asplit[vo][key]`);
    f.push(`[0:a]volume='if(${drops.length ? drops.join('+') : '0'},0.12,1)':eval=frame[bed0]`);
    f.push('[bed0][key]sidechaincompress=threshold=0.015:ratio=8:attack=8:release=220[bed]');
    f.push('[bed][vo]amix=inputs=2:normalize=0,alimiter=limit=0.89:level=disabled[out]');
    track = join(out, 'birlikte-mix.wav');
    execFileSync('ffmpeg', [...args, '-filter_complex', f.join(';'), '-map', '[out]', '-t', String(DUR), track]);
    rmSync(tmp, { recursive: true, force: true });
    console.log(`Seslendirme eklendi: ${clips.length}/${lines.length} cümle`);
  } else console.log('Seslendirme yok (voice/ boş) → yalnızca müzik');
}

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
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(frames, '%05d.jpg'), '-i', track,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', '-t', String(DUR), mp4], { stdio: 'inherit' });
  ff.on('exit', (c) => (c ? rej(new Error('ffmpeg ' + c)) : res()));
});
rmSync(frames, { recursive: true, force: true });
console.log(`${mp4}  (${((Date.now() - t0) / 1000).toFixed(0)} sn)`);
