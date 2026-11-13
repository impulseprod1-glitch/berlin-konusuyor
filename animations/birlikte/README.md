# Birlikte Büyüttük – 60 saniyelik çizgi animasyon

Almanya'daki ve Berlin'deki Türkiye kökenli toplumun hikâyesi: 1961 anlaşmasından
bugüne nüfus, ekonomi, bilim ve kültür. 1080×1920 (9:16), 60 sn, 120 BPM.

Her şey koddan üretilir; görsel ya da ses dosyası yoktur:

| Dosya | İçerik |
| --- | --- |
| `src/film.html` | Sahne iskeleti, stil ve SVG çizimleri |
| `src/film.js` | Zaman çizelgesi (GSAP), geçişler, oynatıcı |
| `src/audio.js` | Müzik ve ses efektleri – saf JavaScript sentezi (bağlama, darbuka, bas, efektler) |
| `build.mjs` | Tek dosyalık oynatıcıyı üretir (`dist/birlikte.html`, yazı tipleri ve GSAP gömülü) |
| `render.mjs` | Kare kare MP4 üretir (`out/birlikte.mp4`) |
| `shot.mjs` | Geliştirme için belirli saniyelerden kontak tabakası alır |

## Komutlar

```bash
npm ci
npm run build                 # dist/birlikte.html – tarayıcıda aç, dokun, sesli izle
npm run render                # out/birlikte.mp4 (60 fps; Playwright + ffmpeg gerekir)
FPS=30 node render.mjs        # hızlı önizleme
node audio.mjs                # yalnızca ses: out/birlikte.wav
node shot.mjs out/a.png 2.4 15.2 31.6   # kareleri kontrol et
```

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
