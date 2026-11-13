// Seslendirmeyi üretir: src/narration.json → voice/NN.mp3 (ElevenLabs)
//   ELEVENLABS_API_KEY=... [VOICE_ID=...] node voice.mjs          tüm satırlar
//   node voice.mjs 4 5                                             yalnızca 4. ve 5. satır
// Anahtar yoksa istek anahtarsız gider; yalnızca anahtarı ağ katmanında ekleyen
// ortamlarda çalışır. VOICE_ID verilmezse hesaptaki ilk ses kullanılır ve adı yazılır.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const API = 'https://api.elevenlabs.io/v1';
const headers = { 'xi-api-key': process.env.ELEVENLABS_API_KEY || 'injected-by-proxy', 'content-type': 'application/json' };
const { lines } = JSON.parse(readFileSync(join(here, 'src/narration.json'), 'utf8'));
const only = process.argv.slice(2).map(Number);

let voice = process.env.VOICE_ID;
if (!voice) {
  const r = await fetch(`${API}/voices`, { headers });
  if (!r.ok) throw new Error(`Ses listesi alınamadı: ${r.status} ${await r.text()}`);
  const { voices } = await r.json();
  console.log('Hesaptaki sesler:\n' + voices.map((v) => `  ${v.voice_id}  ${v.name}`).join('\n'));
  voice = voices[0].voice_id;
  console.log(`VOICE_ID verilmedi → ${voices[0].name} kullanılıyor`);
}

mkdirSync(join(here, 'voice'), { recursive: true });
for (const [i, line] of lines.entries()) {
  if (only.length && !only.includes(i)) continue;
  const r = await fetch(`${API}/text-to-speech/${voice}?output_format=mp3_44100_128`, {
    method: 'POST', headers,
    body: JSON.stringify({
      text: line.text,
      model_id: process.env.MODEL_ID || 'eleven_multilingual_v2',
      voice_settings: { stability: 0.4, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true, speed: 1.1 },
    }),
  });
  if (!r.ok) throw new Error(`Satır ${i} üretilemedi: ${r.status} ${await r.text()}`);
  const file = join(here, 'voice', String(i).padStart(2, '0') + '.mp3');
  writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  console.log(`${String(i).padStart(2, '0')}  ${line.t.toFixed(1)} sn  ${line.text}`);
}
