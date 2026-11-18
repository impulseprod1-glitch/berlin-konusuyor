"""Google Cloud Text-to-Speech (Chirp 3 HD) ile Türkçe seslendirme.

Her cümle ayrı ayrı sentezlenir; böylece her cümlenin süresi kesin olarak
bilinir ve animasyonlar konuşmaya göre yeniden zamanlanabilir.

  python3 voice/tts.py samples              # 4 erkek sesten deneme -> out/voice/samples/
  python3 voice/tts.py render Charon 0.92   # seçilen sesle tüm cümleler -> out/voice/<ses>/

Anahtar: ortamda GOOGLE_TTS_API_KEY değişkeni varsa o kullanılır; yoksa istek
anahtarsız gönderilir (anahtar ortamın ağ sırrı olarak proxy tarafından eklenir).
"""
import base64
import json
import os
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out', 'voice')
API = 'https://texttospeech.googleapis.com/v1/text:synthesize'

# Anlatım cümleleri (metin aynen korunur)
PHRASES = [
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
    'İyi yaşanmış, iyi bilgilenmiş bir zihin',
    'manipüle etmek, korkutmak veya bastırmak açısından son derece zordur.',
]
# Derin/sakin erkek adaylar (Chirp 3 HD)
CANDIDATES = ['Charon', 'Orus', 'Algenib', 'Iapetus']


def synth(text, voice, rate=0.92, path=None):
    body = {
        'input': {'text': text},
        'voice': {'languageCode': 'tr-TR', 'name': f'tr-TR-Chirp3-HD-{voice}'},
        'audioConfig': {'audioEncoding': 'LINEAR16', 'sampleRateHertz': 48000, 'speakingRate': rate},
    }
    headers = {'Content-Type': 'application/json'}
    key = os.environ.get('GOOGLE_TTS_API_KEY')
    if key:
        headers['X-Goog-Api-Key'] = key
    req = urllib.request.Request(API, data=json.dumps(body).encode(), headers=headers)
    with urllib.request.urlopen(req, timeout=60) as r:
        audio = base64.b64decode(json.load(r)['audioContent'])
    if path:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'wb') as f:
            f.write(audio)
    return audio


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else 'samples'
    if mode == 'samples':
        text = 'Tehlikeli derecede eğitimli ol. İyi yaşanmış, iyi bilgilenmiş bir zihin, manipüle etmek, korkutmak veya bastırmak açısından son derece zordur.'
        for v in CANDIDATES:
            p = os.path.join(OUT, 'samples', f'{v}.wav')
            synth(text, v, 0.92, p)
            print('örnek:', p)
    else:
        voice = sys.argv[2]
        rate = float(sys.argv[3]) if len(sys.argv) > 3 else 0.92
        for i, ph in enumerate(PHRASES):
            p = os.path.join(OUT, voice, f'{i:02d}.wav')
            synth(ph, voice, rate, p)
            print(p)
        with open(os.path.join(OUT, voice, 'phrases.json'), 'w') as f:
            json.dump(PHRASES, f, ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
