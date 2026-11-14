# Birlikte Büyüttük – 60 saniyelik çizgi animasyon

Almanya'daki ve Berlin'deki Türkiye kökenli toplumun hikâyesi: 1961 anlaşmasından
bugüne nüfus, ekonomi, bilim ve kültür. 1080×1920 (9:16), 60 sn, 120 BPM.

Her şey koddan üretilir; görsel ya da ses dosyası yoktur:

| Dosya | İçerik |
| --- | --- |
| `src/film.html` | Sahne iskeleti, stil ve SVG çizimleri |
| `src/film.js` | Zaman çizelgesi (GSAP), geçişler, oynatıcı |
| `src/audio.js` | Müzik ve ses efektleri – saf JavaScript sentezi (pop davul, melodik bas, elektrikli piyano, yaylılar, bağlama, darbuka) |
| `src/narration.json` | Seslendirme metni ve her cümlenin başladığı saniye |
| `voice.mjs` | Seslendirmeyi ElevenLabs ile üretir (`voice/NN.mp3`) |
| `src/kinetic.html`, `src/kinetic.js`, `src/art.js` | 2. stil – kinetik kurgu: tek bir "dünya" üzerinde gezen sanal kamera, harf harf yazım, harf blokları ve tuğla kuleler |
| `build.mjs` | Tek dosyalık oynatıcıyı üretir (`dist/birlikte.html`, yazı tipleri ve GSAP gömülü) |
| `render.mjs` | Kare kare MP4 üretir (`out/birlikte.mp4`) |
| `shot.mjs` | Geliştirme için belirli saniyelerden kontak tabakası alır |

## Komutlar

```bash
npm ci
npm run build                 # dist/birlikte.html – tarayıcıda aç, dokun, sesli izle
npm run render                # out/birlikte.mp4 (60 fps; Playwright + ffmpeg gerekir)
FPS=30 node render.mjs        # hızlı önizleme
FILM=kinetik OUT=birlikte-kinetik.mp4 node render.mjs   # 2. stil (dist/kinetik.html)
FILM=dist/kinetik.html node shot.mjs out/k.png 2.2 31.9   # 2. stilden kare
node audio.mjs                # yalnızca ses: out/birlikte.wav
ELEVENLABS_API_KEY=… VOICE_ID=… npm run voice   # seslendirme: voice/00.mp3 … 21.mp3
node voice.mjs 4 5            # yalnızca 4. ve 5. cümleyi yeniden üret
node shot.mjs out/a.png 2.4 15.2 31.6   # kareleri kontrol et
```

## Seslendirme

`voice/` klasöründeki klipler depodadır; `npm run render` onları kullanır. Yeniden üretmek için iki yol var:

- **Yerel, anahtarsız (şu an kullanılan):** açık kaynaklı Chatterbox Multilingual.
  `pip install chatterbox-tts faster-whisper num2words` (Python 3.11, ~6 GB), sonra
  `REF=tts/ref/ref_tr_fast.wav python tts/best_voice.py`. Her cümle için birkaç aday üretir,
  Whisper ile geri dinler, hem metne uyan hem sahnesine sığan adayı seçer; puanlar
  `voice/scores.json` içinde. `REF` sesi ve okuma hızını belirler: kendi sesinden 5–15 sn'lik
  temiz bir kayıt verirsen anlatım o sesle çıkar.
- **ElevenLabs:** `ELEVENLABS_API_KEY=… npm run voice` (aşağıya bakın).

`voice.mjs` varsayılan olarak `eleven_v3` modelini kullanır; metindeki `[coşkulu]` gibi köşeli
parantezli yönergeleri okur (`MODEL_ID=eleven_multilingual_v2` verilirse yönergeler silinir).
`drop: true` olan cümlelerde müzik bir anlığına susar.

`voice/` klasöründe klip varsa `render.mjs` her cümleyi `narration.json`'daki saniyesine
yerleştirir, yerine sığmayan cümleyi en çok %30 hızlandırır ve müziği seslendirmenin
altında kendiliğinden kısar (≈6 dB). Klasör boşsa video yalnızca müzikle çıkar;
`NO_VOICE=1` seslendirmeyi atlar, `VOICE_GAIN=1.6` ses düzeyini ayarlar.
`VOICE_ID` verilmezse `voice.mjs` hesaptaki sesleri listeler ve ilkini kullanır.

## Müzik

120 BPM, Re hicaz. Akor yürüyüşü: Re · Mi♭maj7 · Do m7 · Re7. Bağlama, Karplus-Strong tel
modeliyle sentezlenir: çift ince tel + oktav pesten bam teli, tekne rezonansı, aşağı/yukarı
mızrap, çarpma, tril ve dem telleri ayrı ayrı modellenir. Hicazın 2. ve 3. dereceleri
tampere değil, saz perdesine yakın akortlanır (`KOMA`).

## Zamanlama

1 vuruş = 0,5 sn, 1 ölçü = 2 sn. Sahne kesmeleri ölçü başlarındadır; `film.js` ve
`audio.js` aynı saniyeleri kullanır. Bir sahnenin süresini değiştirirsen ikisini de güncelle.

| Sn | Sahne |
| --- | --- |
| 0–4 | Soru: "Berlin'i Berlin yapan kim?" |
| 4–10 | 30 Ekim 1961 – işgücü anlaşması |
| 10–18 | Almanya: 2,6 milyon |
| 18–24 | Berlin: yaklaşık 200.000 |
| 24–34 | Ekonomi: girişimci, istihdam, ciro |
| 34–40 | Döner |
| 40–46 | Bilim: BioNTech |
| 46–54 | Kültür: sinema, futbol, edebiyat, müzik |
| 54–60 | Final |

## Rakamların kaynağı

Rakam değiştirirken kaynağı da güncelle; ekranda küçük puntoyla gösteriliyor.

| Ekrandaki ifade | Kaynak |
| --- | --- |
| 2,6 milyon · nüfusun %3,2'si · en büyük göçmen kökenli topluluk | Destatis, Mikrozensus 2025 (Ekim 2026 açıklaması) |
| Yaklaşık 200.000 Türkiye kökenli Berlinli | Tahmin; resmî kayıtta yalnızca Türkiye vatandaşları ~100.000 (Amt für Statistik Berlin-Brandenburg) |
| 80.000 girişimci | TD-IHK (Tagesspiegel) |
| 500.000 istihdam · 50 milyar € ciro | deutschland.de (Almanya Dışişleri portalı, 2019) |
| Döner: 2,4 milyar € ciro · 60.000 istihdam | ATDiD (sektör derneği) |
| Altın Ayı 2004 · EURO 2024 kaptanlığı · Büchner Ödülü 2022 · ilk onaylı mRNA aşısı | Kamuya açık bilgiler |
