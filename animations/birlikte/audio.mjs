// Parçayı tek başına WAV olarak yazar: node audio.mjs [çıktı.wav]
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import './src/audio.js';
const here = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || join(here, 'out/birlikte.wav');
mkdirSync(dirname(out), { recursive: true });
const t = Date.now();
const a = globalThis.BKAudio.render(48000);
writeFileSync(out, globalThis.BKAudio.wav(a));
console.log(`${out}  ${(a.L.length / a.sr).toFixed(1)} sn  (${Date.now() - t} ms)`);
