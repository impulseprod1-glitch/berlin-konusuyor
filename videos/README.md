# "Tehlikeli derecede eğitimli ol." — animasyon videoları

Aynı metnin dört farklı stilde dikey (1080×1920, 30 fps) kinetik tipografi
videosu. Her sahne bir HTML sayfasıdır (GSAP zaman çizelgesi + canvas);
`render.mjs` sayfayı kare kare Chromium'da çizer, ses ise `audio/` altındaki
betiklerle numpy/scipy kullanılarak sıfırdan sentezlenir (örnek dosyası ve
lisans sorunu yoktur). Ses efektleri sahnenin yazdığı ipuçlarına (`cues`)
kare hassasiyetinde oturur.

| Sahne | Stil | Süre |
| --- | --- | --- |
| `01-enerjik` | Siyah & altın, 120 BPM, vuruşa oturan "slam" tipografi, kesilen "KESKİN", drop'ta altın yağmuru | 44 sn |
| `02-karizmatik` | Ağır, sinematik: Cormorant Garamond, ışık huzmesi, duman, film greni, Re minör dron + piyano | 68 sn |
| `03-daktilo` | Eski kâğıda harf harf daktilo, satır başı zili, sonunda kırmızı kalemle işaretler, lo-fi piyano | ~55 sn |
| `04-glitch` | "Manipüle edilemeyen zihin": şifre çözülür gibi beliren metin, saldıran kelimeler üstü çizilip dağılır, "ZORDUR." sarsılmaz kalır | 50 sn |

## Çalıştırma

```bash
cd videos
npm ci
pip install numpy scipy
node render.mjs 01-enerjik              # -> out/01-enerjik.mp4
node render.mjs all                     # hepsi
node render.mjs 04-glitch --stills 5,40 # sadece önizleme kareleri -> out/stills/
```

Gerekenler: Node 18+, Playwright (Chromium), ffmpeg, Python 3 + numpy + scipy.
Ses `loudnorm` ile -14 LUFS'a (Instagram/TikTok/YouTube Shorts seviyesi) getirilir.

Bir sahneyi tarayıcıda canlı izlemek için `videos/` klasöründe bir statik sunucu
açıp (`npx serve .`) sahneyi açın ve konsolda `seek(12.5)` ile istediğiniz ana gidin.
