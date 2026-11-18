# Berlin Konuşuyor – çalışma notları

Site ve altyapı için `README.md`'ye bak. Bu dosya, kullanıcıyla birlikte oturmuş tercihleri saklar.

## Animasyon haber videoları (`videos/`)

Örnek ve araçlar: `videos/2026-11-abd-kesintiler/` (README orada). Yeni bir haber için
o klasörü şablon olarak kopyala; `engine.js`, `render.cjs`, `mux.sh`, `score.py`, `voice.py` yeniden kullanılır.

### Ses tasarımı (kullanıcının onayladığı yöntem — varsayılan bu)
- Müzik ve efektler **`score.py`** ile yapılır: gerçek enstrüman örnekleri (FluidR3 GM soundfont,
  MIT lisanslı) + fluidsynth. Kurulum: `apt-get install -y fluidsynth fluid-soundfont-gm && pip install mido`.
- Sahne sahne bestelenmiş, tek tonda (ör. Re minör, ~104 BPM) belgesel/araştırmacı habercilik
  havası; katmanlar hikâyeyle birlikte artar (pizzicato+pad → yaylılar+bas → piyano ostinatosu →
  çello, timpani, korno), "soru" anında neredeyse sessizlik, finalde uzun akor.
- Efektler müzikle **aynı tonda perdeli enstrümanlar**: bildirimlerde glockenspiel/vibrafon/çelesta/
  marimba, geçişlerde arp glissandosu, vurgu anlarında timpani, geri sarmada tersten çalınan piyano,
  telefon titreşimi için kısa alçak sinüs.
- **Hışırtı yok:** zil, hi-hat, gürültü üreteci, gürültülü "whoosh" kullanma. Sessiz anlarda gürültü
  tabanını ölç (≈ -90 dB olmalı).
- Ses seviyesi: iki geçişli loudnorm ile -15 LUFS, -1.5 dBTP.
- `music.py` içindeki ham sentez yalnızca eski videolar için duruyor; kullanıcı onu "klas değil"
  buldu, yeni işlerde kullanma.

### Seslendirme
- Ücretsiz Türkçe nöral ses: `voice.py` (edge-tts; erkek `tr-TR-AhmetNeural`, kadın `tr-TR-EmelNeural`).
  Proxy CA'sı için betikteki SSL ayarı gerekli. Kelime zamanlarıyla karaoke altyazı üretir.
- Sayıları yazıyla yaz ("on iki Kasım"); kısaltmalar harf harf okunur, altyazıda birleştirilir.

### İçerik ve dil
- Dil dikkat çekici ve sorgulayıcı olsun ("Bu normal değil", "Acaba ne oluyor?"), olasılıkları tart;
  **kanıtlanmamış iddiayı gerçek gibi sunma**, kanıt yoksa açıkça "kanıt yok" de.
- Gerçek kurum/uygulama markalarını taklit etme (bildirimlerde "Banka", "Havayolu" gibi genel adlar).
- Kaynaklar yalnızca son karede küçük yazıyla.
- Kullanıcının beğendiği görsel stiller: **Bildirim Yağmuru** (telefon kilit ekranı, en çok beğenilen)
  ve **Soruşturma Panosu** (mantar pano, kırmızı ip).

### Teknik
- 1080×1920, 30 fps, ~90 sn; önemli yazılar y ≈ 220–1570 arasında (sosyal medya güvenli alanı).
- Kontrol: `node render.cjs stills <ad> t1,t2,...` + `python3 sheet.py` ile kare önizlemesi; MP4'ler
  `out/` altında, git'e girmez.
