# ABD kesintileri – 3 animasyon haber (12–17 Kasım 2026)

Beş adet 85–90 saniyelik, 1080×1920 (9:16) sosyal medya videosu. Görüntü ve müzik
tamamen kodla üretilir; dışarıdan görsel, stok müzik veya ses kaydı kullanılmaz.

| Dosya | Ton | Görsel dil | Müzik |
| --- | --- | --- | --- |
| `v1-sinematik.js` | Sakin, düşündürücü | Sönen sistemler takımyıldızı, gece okyanusu | Re minör pad + piyano, ~yavaş |
| `v2-kinetik.js` | Enerjik, kinetik | Vuruşa oturan Anton tipografi, sarı/kırmızı | 128 BPM, La minör, drop |
| `v3-analiz.js` | Analiz haber | Berlin Konuşuyor gazete paleti, veri kartları | 100 BPM nabız + çan motifi |
| `v4-durum-odasi.js` | Seslendirmeli, gerilimli (erkek ses) | HUD, noktalı ABD haritası, radar, 3 ihtimal kartı | 96 BPM, sesin altında kısılır |
| `v5-sorusturma-panosu.js` | Seslendirmeli, merak uyandıran (kadın ses) | Mantar pano, iğneli kanıt kartları, kırmızı ip | 90 BPM pizzicato, sesin altında kısılır |

Seslendirmeli videolar kanıtlanmamış hiçbir şeyi gerçek gibi sunmaz: "Acaba ne oluyor?"
diye sorup üç ihtimali tartar ve kanıt olmadığını açıkça söyler. Seslendirme
`voice.py` ile Microsoft Edge'in ücretsiz Türkçe nöral sesleriyle (edge-tts) üretilir;
kelime zamanlamaları altyazı için `<ad>.timeline.js` dosyasına yazılır.

Müzikte gürültü üreteci yoktur (hışırtı, cızırtı, "whoosh" gürültüsü yok); geçişler
perdeli süpürmelerle yapılır.

## Üretim

```bash
cd videos/2026-11-abd-kesintiler
node render.cjs stills v2-kinetik 5,20,40   # out/stills/ altına önizleme kareleri
node render.cjs video v1-sinematik          # out/v1-sinematik.video.mp4 + cues.json
python3 voice.py v4-durum-odasi             # yalnızca v4/v5: seslendirme + zamanlama (pip install edge-tts)
python3 music.py v1-sinematik               # out/v1-sinematik.wav (numpy + scipy; v4/v5'te sesle karıştırır)
./mux.sh v1-sinematik                       # out/v1-sinematik.mp4 (son dosya)
```

Tarayıcıda canlı önizleme: yerel bir sunucu ile `index.html?v=v2-kinetik&play`
(tek kare için `&t=12.5`).

Fontlar (OFL): Fraunces, Inter, Anton, JetBrains Mono – `fonts/` içinde.

## Kaynaklar

CNN, AP, ABC News, Al Jazeera, Washington Post, CBS News, Fox Business, GovExec, INSS.
