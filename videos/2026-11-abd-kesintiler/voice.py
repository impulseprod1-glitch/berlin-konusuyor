"""
Turkish voice-over with Microsoft Edge's free neural voices (edge-tts), plus word timings.

    python3 voice.py v4-durum-odasi   → out/v4-durum-odasi.vo.wav, out/v4-durum-odasi.timeline.json,
                                         v4-durum-odasi.timeline.js (loaded by index.html)

Each script segment is synthesised separately so scenes can start exactly when their
sentence starts. Numbers are written out so the voice reads them naturally.
"""
import asyncio
import json
import os
import ssl
import subprocess
import sys

import numpy as np
import edge_tts
import edge_tts.communicate as ec

# The session's HTTPS proxy re-signs TLS; edge-tts pins certifi, so point it at the proxy CA when present.
if os.path.exists('/root/.ccr/ca-bundle.crt'):
    ec._SSL_CTX = ssl.create_default_context(cafile='/root/.ccr/ca-bundle.crt')

SR = 48000

SCRIPTS = {
    'v4-durum-odasi': {
        'voice': 'tr-TR-AhmetNeural', 'rate': '+12%', 'pitch': '-2Hz', 'lead': 0.5, 'gap': 0.35, 'tail': 3.5,
        'segments': [
            ('hook', 'Bu normal değil. Altı günde, dünyanın en güçlü ülkesinde beş kritik sistem çöktü. '
                     'Ve her seferinde aynı açıklama: teknik arıza.'),
            ('ms', 'On iki Kasım. Microsoft çöküyor. Outlook ve Teams, on sekiz saatten uzun karanlıkta.'),
            ('faa', 'Ertesi gün Amerika\'nın gökyüzü kapanıyor. Bütün havalimanlarında uçuşlar durduruluyor. '
                    'Sebep: tek bir router.'),
            ('workday', 'Aynı günlerde Workday de çöküyor.'),
            ('banks', 'On altı Kasım. Sıra parada. Chase, Wells Fargo, Bank of America. '
                      'Binlerce kişi parasına ulaşamıyor. Açıklama: yazılım hatası.'),
            ('nsa', 'Ve bugün. N S A\'nın gizli iç ağı karardı. Açıklama: rutin bakım.'),
            ('gulf', 'Üstelik tüm bunlar, Amerika savaşın ortasındayken oluyor. Üçüncü uçak gemisi İran açıklarında. '
                     'Abluka sürüyor.'),
            ('q', 'Peki, acaba ne oluyor?'),
            ('p1', 'Birinci ihtimal: Onlarca yıllık altyapı artık yükü kaldıramıyor. '
                   'Bunu Ulaştırma Bakanı\'nın kendisi söylüyor.'),
            ('p2', 'İkinci ihtimal: Her şey o kadar bağlı ki, tek bir hata domino gibi yayılıyor.'),
            ('p3', 'Üçüncü ihtimal: Perde arkasında, henüz bilmediğimiz bir şey var. Ama şu an buna dair bir kanıt yok.'),
            ('close', 'Hangisi doğru? Henüz kimse bilmiyor. Sen ne düşünüyorsun? Yorumlara yaz.'),
        ],
    },
    'v5-sorusturma-panosu': {
        'voice': 'tr-TR-EmelNeural', 'rate': '+6%', 'pitch': '+0Hz', 'lead': 0.6, 'gap': 0.45, 'tail': 3.5,
        'segments': [
            ('hook', 'Bu panoya iyi bakın. Tek tek bakınca masum görünüyorlar. Yan yana koyunca, hiç de değil.'),
            ('ms', 'Bir. On iki Kasım. Microsoft çöktü. On sekiz saat. Açıklama: sunucu sorunları.'),
            ('faa', 'İki. Amerika\'nın bütün havalimanlarında uçuşlar durdu. Üç yıldır görülmemiş bir şey. '
                    'Açıklama: tek bir router.'),
            ('banks', 'Üç. Büyük bankalarda insanlar hesaplarına giremedi. Açıklama: yazılım hatası.'),
            ('nsa', 'Dört. Bugün. N S A\'nın gizli ağı karardı. Açıklama: rutin bakım.'),
            ('gulf', 'Ve beş. Aynı hafta, üçüncü uçak gemisi İran\'a karşı bölgede. Abluka sürüyor.'),
            ('string', 'Şimdi ipi çekelim. Aynı hafta. Dört kesinti. Dört farklı açıklama. '
                       'Hiçbirinde siber saldırı kanıtı yok. Peki, acaba ne oluyor?'),
            ('p1', 'Belki eskiyen altyapı çatırdıyor.'),
            ('p2', 'Belki sistemler o kadar iç içe ki, tek bir hata hepsini sarsıyor.'),
            ('p3', 'Belki de perde arkasında, henüz göremediğimiz bir şey var. Kanıt yok. Ama soru ortada.'),
            ('close', 'Sence hangisi? Kararı sen ver, ama sormaktan vazgeçme. Yorumlara yaz.'),
        ],
    },
}


async def synth(text, cfg, path):
    com = edge_tts.Communicate(text, cfg['voice'], rate=cfg['rate'], pitch=cfg['pitch'], boundary='WordBoundary',
                               proxy=os.environ.get('HTTPS_PROXY'))
    words = []
    with open(path, 'wb') as f:
        async for chunk in com.stream():
            if chunk['type'] == 'audio':
                f.write(chunk['data'])
            elif chunk['type'] == 'WordBoundary':
                words.append({'t0': chunk['offset'] / 1e7, 't1': (chunk['offset'] + chunk['duration']) / 1e7, 'w': chunk['text']})
    return words


def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def trim(x, thr=0.004):
    """Drops leading/trailing silence; returns trimmed audio and the seconds cut from the start."""
    idx = np.where(np.abs(x) > thr)[0]
    if not len(idx):
        return x, 0.0
    a = max(0, idx[0] - int(0.02 * SR)); b = min(len(x), idx[-1] + int(0.08 * SR))
    return x[a:b], a / SR


async def main(name):
    cfg = SCRIPTS[name]
    os.makedirs('out/vo', exist_ok=True)
    t = cfg['lead']
    parts, segs, words = [], [], []
    for sid, text in cfg['segments']:
        p = f'out/vo/{name}-{sid}.mp3'
        ws = await synth(text, cfg, p)
        x, cut = trim(decode(p))
        dur = len(x) / SR
        segs.append({'id': sid, 'start': round(t, 3), 'end': round(t + dur, 3), 'text': text})
        for w in ws:
            words.append({'t0': round(t + w['t0'] - cut, 3), 't1': round(t + w['t1'] - cut, 3), 'w': w['w'], 'seg': sid})
        parts.append((t, x))
        t += dur + cfg['gap']
    total = round(t - cfg['gap'] + cfg['tail'], 2)
    vo = np.zeros(int(total * SR) + SR)
    for t0, x in parts:
        i = int(t0 * SR); vo[i:i + len(x)] += x
    vo = vo[: int(total * SR)]
    # gentle presence: normalise speech peaks to -3 dBFS
    vo *= 0.7 / max(np.abs(vo).max(), 1e-9)
    from scipy.io import wavfile
    wavfile.write(f'out/{name}.vo.wav', SR, (vo * 32767).astype(np.int16))
    tl = {'duration': total, 'segments': segs, 'words': words}
    json.dump(tl, open(f'out/{name}.timeline.json', 'w'), ensure_ascii=False, indent=1)
    open(f'{name}.timeline.js', 'w').write('window.TIMELINE = ' + json.dumps(tl, ensure_ascii=False) + ';\n')
    print(name, 'duration', total, 's,', len(words), 'words')
    for s in segs:
        print(f"  {s['id']:8s} {s['start']:6.2f} → {s['end']:6.2f}")


if __name__ == '__main__':
    asyncio.run(main(sys.argv[1]))
