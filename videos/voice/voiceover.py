"""Türkçe seslendirme (Microsoft Edge "Ahmet" nöral sesi) + zaman eşleme + mix.

  python3 voice/voiceover.py narrate                 # cümleleri sentezle, kelime zamanlarını kaydet
  python3 voice/voiceover.py plan  <sahne> <cues>    # sahne için ses izi ve zaman haritası
  python3 voice/voiceover.py mix   <sahne> <çıkış>   # ses + müzik (konuşurken kısılır)

Zaman haritası: video zamanı T -> sahne zamanı t. Her segmentin giriş ve çıkış
animasyonları 1:1 hızda kalır; aradaki "bekleme" kısmı konuşmanın süresine
göre uzar ya da kısalır. Böylece her cümle tam söylendiği anda ekranda olur.
"""
import asyncio
import json
import os
import subprocess
import sys

import numpy as np
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, 'audio'))
from synth import SR, filt, reverb  # noqa: E402

OUT = os.path.join(ROOT, 'out', 'voice')
VOICE = 'tr-TR-AhmetNeural'
RATE, PITCH = '-12%', '-6Hz'

# Okunan cümleler. (Sondaki virgül yalnızca nefes için; ekrandaki metin değişmez.)
SENTENCES = [
    'Tehlikeli derecede eğitimli ol.',
    'Bilgili bir insan ol.',
    'Aldatılması daha zor.',
    'Sohbette daha keskin.',
    'Durumları okumada daha iyi.',
    'Yüzyılların bilgeliği ve bilgisine başvurabilme yeteneğine sahip.',
    'Daha bilgili.',
    'Daha ilginç.',
    'Daha yetkin.',
    'Durmaksızın öğren.',
    'İyi yaşanmış, iyi bilgilenmiş bir zihin, manipüle etmek, korkutmak veya bastırmak açısından son derece zordur.',
]

# Sahne segmentleri -> okunan parçalar: (cümle, ilk kelime, son kelime dahil)
LAST = 10
COMMON = [[(0, 0, None)], [(1, 0, None)], [(2, 0, None)], [(3, 0, None)], [(4, 0, None)], [(5, 0, None)],
          [(6, 0, None), (7, 0, None), (8, 0, None)], [(9, 0, None)], [(LAST, 0, 5)]]
SEGMAP = {
    '04-glitch': COMMON + [[(LAST, 6, 10)], [(LAST, 11, 13)], [(LAST, 14, 14)]],
    '05-bauhaus': COMMON + [[(LAST, 6, 13)], [(LAST, 14, 14)]],
    '06-brutalist': COMMON + [[(LAST, 6, 13)], [(LAST, 14, 14)]],
}
# Duraklamalar (sn)
GAP_SENT = 0.45      # aynı segmentteki cümleler arası
GAP_SEG = 0.95       # segmentler arası
GAP_FINAL = 1.25     # "zordur." öncesi dramatik es
LEAD = 0.45          # metin, sesten bu kadar önce belirmeye başlar
TAIL = 3.4           # son kelimeden sonra kalan süre


# ------------------------------------------------------------------ sentez

async def _synth(i, text):
    import edge_tts
    proxy = os.environ.get('HTTPS_PROXY') or os.environ.get('https_proxy')
    com = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH, boundary='WordBoundary', proxy=proxy)
    audio = bytearray()
    words = []
    async for ch in com.stream():
        if ch['type'] == 'audio':
            audio += ch['data']
        elif ch['type'] == 'WordBoundary':
            words.append({'w': ch['text'], 's': ch['offset'] / 1e7, 'e': (ch['offset'] + ch['duration']) / 1e7})
    mp3 = os.path.join(OUT, 'raw', f'{i:02d}.mp3')
    with open(mp3, 'wb') as f:
        f.write(audio)
    wav = os.path.join(OUT, 'raw', f'{i:02d}.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', mp3, '-ar', str(SR), '-ac', '1', wav], check=True)
    return words


def polish(x):
    """Sıcak, yakın, "belgesel anlatıcısı" ses zinciri."""
    x = filt(x, 'highpass', 75, 2)
    low = filt(x, 'lowpass', 220, 2)
    air = filt(x, 'highpass', 7500, 2)
    x = x + low * 0.35 + air * 0.25
    # yumuşak kompresör (RMS takipli)
    env = np.sqrt(filt(x ** 2, 'lowpass', 12, 1).clip(1e-9))
    thr = 0.08
    gain = np.where(env > thr, (thr / env) ** (1 - 1 / 2.6), 1.0)
    x = x * gain
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.9
    return x


def narrate():
    os.makedirs(os.path.join(OUT, 'raw'), exist_ok=True)
    meta = []
    for i, s in enumerate(SENTENCES):
        words = asyncio.run(_synth(i, s))
        sr, x = wavfile.read(os.path.join(OUT, 'raw', f'{i:02d}.wav'))
        x = polish(x.astype(np.float64) / 32768)
        wavfile.write(os.path.join(OUT, 'raw', f'{i:02d}.p.wav'), SR, (x * 32767).astype(np.int16))
        meta.append({'text': s, 'words': words, 'dur': len(x) / SR})
        print(f'{i:02d} {len(words)} kelime, {len(x) / SR:.2f} sn  {s}')
    with open(os.path.join(OUT, 'words.json'), 'w') as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)


# ------------------------------------------------------------------ plan

def load_sentence(i):
    sr, x = wavfile.read(os.path.join(OUT, 'raw', f'{i:02d}.p.wav'))
    return x.astype(np.float64) / 32768


def piece(meta, i, a, b):
    """Cümle i'nin a..b kelimelerini (b dahil) kes; kısa kenar yumuşatma."""
    x = load_sentence(i)
    W = meta[i]['words']
    b = len(W) - 1 if b is None else b
    s = 0 if a == 0 else W[a]['s'] - 0.06
    e = len(x) / SR if b == len(W) - 1 else W[b]['e'] + 0.08
    # cümle başındaki/sonundaki sessizliği kırp
    if a == 0:
        s = max(0, W[0]['s'] - 0.06)
    if b == len(W) - 1:
        e = min(len(x) / SR, W[-1]['e'] + 0.35)
    y = x[int(s * SR):int(e * SR)].copy()
    f = int(0.012 * SR)
    y[:f] *= np.linspace(0, 1, f)
    y[-f:] *= np.linspace(1, 0, f)
    return y, W[a]['s'] - s


def plan(scene, cues_path):
    meta = json.load(open(os.path.join(OUT, 'words.json')))
    cues = json.load(open(cues_path))
    segs = cues['segments']
    spec = SEGMAP[scene]
    assert len(spec) == len(segs), (len(spec), len(segs))
    parts = []
    t = 1.0  # ilk sözden önce kısa nefes
    seg_voice = []
    for k, sp in enumerate(spec):
        if k > 0:
            t += GAP_FINAL if k == len(spec) - 1 else GAP_SEG
        v0 = None
        for j, (i, a, b) in enumerate(sp):
            if j > 0:
                t += GAP_SENT
            y, lead_sil = piece(meta, i, a, b)
            if v0 is None:
                v0 = t + lead_sil
            parts.append((t, y))
            t += len(y) / SR
        seg_voice.append([v0, t])
    total = t + TAIL
    voice = np.zeros(int(total * SR) + SR)
    for st, y in parts:
        i = int(st * SR)
        voice[i:i + len(y)] += y
    voice = voice[: int(total * SR)]

    # zaman haritası düğümleri (video T, sahne t)
    knots = [(0.0, 0.0)]
    n = len(segs)
    for k in range(n):
        t0, t1 = segs[k]
        V0 = max(knots[-1][0] + 0.05, seg_voice[k][0] - LEAD)
        V1 = (seg_voice[k + 1][0] - LEAD) if k + 1 < n else total
        if k == n - 1:
            # final: animasyon 1:1 akar, sahne sonu videonun sonuna denk gelir
            knots.append((V0, t0))
            knots.append((total, cues['duration']))
            break
        span_s, span_v = t1 - t0, V1 - V0
        e = min(1.3, span_s * 0.45, span_v * 0.45)
        x = min(0.5, span_s * 0.2, span_v * 0.2)
        knots += [(V0, t0), (V0 + e, t0 + e), (V1 - x, t1 - x)]
    # monoton ve tekrarsız
    clean = []
    for T, s in knots:
        if clean and T <= clean[-1][0] + 1e-4:
            continue
        clean.append((round(T, 4), round(s, 4)))
    d = os.path.join(OUT, scene)
    os.makedirs(d, exist_ok=True)
    wavfile.write(os.path.join(d, 'voice.wav'), SR, (voice * 32767).astype(np.int16))
    json.dump({'duration': round(total, 3), 'knots': clean, 'seg_voice': seg_voice}, open(os.path.join(d, 'timemap.json'), 'w'), indent=1)
    print(f'{scene}: {total:.1f} sn, {len(clean)} düğüm')


# ------------------------------------------------------------------ mix

def scene_to_video(knots, t):
    T = [k[0] for k in knots]
    S = [k[1] for k in knots]
    return float(np.interp(t, S, T))


def mix(scene, out_wav):
    from beds import bauhaus, brutalist, glitch, render_bed
    from music import duck
    d = os.path.join(OUT, scene)
    tm = json.load(open(os.path.join(d, 'timemap.json')))
    cues = json.load(open(os.path.join(ROOT, 'out', f'{scene}.cues.json')))['cues']
    dur = tm['duration']
    kn = tm['knots']
    sv = tm['seg_voice']
    final = sv[-1][0] - 0.05
    sr, v = wavfile.read(os.path.join(d, 'voice.wav'))
    v = v.astype(np.float64) / 32768
    if scene == '05-bauhaus':
        acc = [scene_to_video(kn, c['t']) for c in cues if c['type'] == 'hl' and not c.get('final')]
        song = bauhaus(dur, acc, final)
    elif scene == '04-glitch':
        atk = (scene_to_video(kn, 37.0), scene_to_video(kn, 41.0))
        song = glitch(dur, [], atk, final)
    else:
        acc = [scene_to_video(kn, c['t']) for c in cues if c['type'] == 'stamp' and c['t'] < 39]
        song = brutalist(dur, acc, final)
    bed = render_bed(song, os.path.join(d, 'bed_raw.wav'), dur)
    # konuşma zarfı -> müziği kıs
    env = np.abs(v)
    env = filt(env, 'lowpass', 8, 1)
    env = np.clip(env / (np.percentile(env, 99) + 1e-9), 0, 1)
    bed = duck(bed, env, depth=0.5)
    vv = reverb(v, 1.1, 0.07, bright=6000)[: len(v)]
    n = len(bed)
    out = bed * 0.42
    out[: min(n, len(vv))] += vv[:n] * 0.95
    out /= np.max(np.abs(out)) + 1e-9
    out *= 0.9
    wavfile.write(out_wav, SR, (out * 32767).astype(np.int16))
    print('mix:', out_wav)


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'narrate':
        narrate()
    elif cmd == 'plan':
        plan(sys.argv[2], sys.argv[3])
    elif cmd == 'mix':
        mix(sys.argv[2], sys.argv[3])
