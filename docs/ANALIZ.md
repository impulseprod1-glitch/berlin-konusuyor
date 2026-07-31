# Berlin Konuşuyor — Teknik Analiz ve Yapılan Değişiklikler

> Tarih: 26 Temmuz 2026 · Kapsam: tüm proje (frontend, admin, otomasyon, güvenlik, hukuk)

---

## 1. Yönetici Özeti

Proje teknik olarak beklediğimden iyi bir noktada: Vite + Firebase üzerine kurulu,
PWA desteği var, modüler bir `src/features/` yapısı ve çalışan bir admin paneli mevcut.
Ancak üç kritik sorun sitenin temel işlevlerini bozuyordu ve bir konu hukuki risk
taşıyordu. Bu çalışmada hepsi giderildi ve talep edilen **video haber sistemi** eklendi.

| Alan | Durum (önce) | Durum (sonra) |
|---|---|---|
| Haber modalı | ❌ Hiç açılmıyordu (JS hatası) | ✅ Çalışıyor |
| Admin'den haber ekleme | ❌ Sayfa yenilenip veri kayboluyordu | ✅ Çalışıyor |
| Video haber | ❌ Yok (sabit YouTube iframe) | ✅ Tam sistem |
| Dış kaynaktan haber çekme | ⚠️ Telif riski | ✅ Kaldırıldı |
| API anahtarları | ❌ Repoda açıkta | ✅ Temizlendi (döndürülmeli) |
| Storage güvenlik kuralları | ❌ Hiç yoktu | ✅ Eklendi |
| Sohbet ve anket yazma | ❌ Kurallar engelliyordu | ✅ Düzeltildi |
| İlk yük (Firebase JS) | 555 kB | ✅ 468 kB (−%16) |
| Video bölümü dili | Sadece TR | ✅ TR / DE / EN |
| Otomatik test | ❌ Yok | ✅ 33 test |
| Dış CDN bağımlılığı | 4 adet (GDPR riski) | ✅ 0 |
| İndekslenebilir sayfa | 1 (hash mimarisi) | ✅ Her içerik ayrı URL |
| Ölçüm / analitik | ❌ Hiç yoktu | ✅ Çerezsiz sayaç + admin panosu |
| Bülten aboneleri | ❌ formsubmit.co'ya gidiyordu (sizde değil) | ✅ Kendi Firestore'unuzda |
| Çerez rızası | ❌ CSS'i yoktu, hiçbir şeyi engellemiyordu | ✅ Gerçek rıza kapısı + Google Analytics |
| `/admin.html` arama motorlarında | ⚠️ robots.txt engellemiyordu | ✅ Disallow eklendi |
| İş ilanları boş durumu | ❌ 4 sahte ilan (uydurma şirket/e-posta) | ✅ Dürüst "henüz ilan yok" mesajı |
| CI (test/lint otomasyonu) | ❌ Yoktu | ✅ Her push/PR'da lint+test+build |

---

## 6e. Beşinci Tur: Çerezsiz Analitik

### Sorun
Sitede hiçbir ölçüm yoktu — ne Google Analytics, ne kendi sayacınız. Hangi
haberin okunduğunu, hangi videonun izlendiğini, sitenin gerçekten trafik alıp
almadığını bilmeden içerik kararı vermek mümkün değildi. Google Analytics gibi
üçüncü taraf araçlar eklemek de bu projenin gittiği yönle çelişirdi — dış CDN'leri
GDPR riski nedeniyle az önce elemiştik (Bölüm 6c).

### Çözüm
`src/features/analytics.js` — kendi Firestore'unuza yazan, **çerezsiz, kimliksiz**
bir sayfa görüntüleme sayacı:

- Doküman kimliği `<gün>_<sayfa>` biçiminde (örn. `2026-07-26_haber_kreuzbergde-kira-zammi`).
  Her yazma yalnızca `views` alanını **+1** artırıyor — IP, kullanıcı kimliği,
  cihaz parmak izi gibi hiçbir kişisel veri tutulmuyor.
- Aynı oturumda aynı sayfa yalnızca **bir kez** sayılıyor (`sessionStorage`
  ile, çerez değil — üçüncü taraf takibi yok).
- Haber/video açıldığında (`pushState`/`replaceState` sonrası) `bk:navigate`
  olayı yayınlanıyor; analitik modülü bunu dinleyip SPA içi "sayfa" değişimini
  de kaydediyor — böylece hangi içeriğin açıldığı da görünüyor, yalnızca ana
  sayfa yüklemesi değil.
- Firestore'a **hiç erişilemezse sessizce başarısız oluyor** — sayaç asla
  kullanıcı deneyimini bozmuyor.

Admin panelinde yeni **"Analitik"** sekmesi: son 7 günün toplam görüntülenmesi
ve en çok açılan 15 sayfa, sayfa bazında toplanmış olarak listeleniyor.

### Güvenlik kuralı
`analytics_daily` koleksiyonu için: kimliksiz ziyaretçi bile yazabilir (izleyici
oturum açmıyor), ama yalnızca **kendi günlük sayacını 1 artırabilir** — başka
alan değiştiremez, sayıyı geri saramaz veya rastgele bir değere sıçratamaz.
Okuma yalnızca admin'e açık.

### Doğrulama
Playwright ile: sayfa yüklenince `sessionStorage`'a `["/"]` yazıldığı ve
Firestore'a gerçek bir istek gittiği doğrulandı, konsolda JS hatası yok.

---

## 2. Kritik Hatalar (düzeltildi)

### 2.1 Haber modalı hiç açılmıyordu
`src/features/news.js` içinde tanımlanmamış bir `linkBtn` değişkenine erişiliyordu:

```js
if (linkBtn) linkBtn.href = article.url || '#';   // ReferenceError
```

Bu satır `modal.classList.add('active')` çağrısından **önce** geldiği için her
haber tıklamasında fonksiyon patlıyor ve modal hiç açılmıyordu. Yani sitede
hiçbir habere tıklanamıyordu. `document.getElementById('newsModalLink')` ile
düzeltildi; ayrıca dış bağlantısı olmayan (kendi ürettiğimiz) haberlerde
"Habere Git" butonu artık gizleniyor.

### 2.2 Admin panelinden haber eklenemiyordu
`src/admin.js` içindeki haber formunda `e.preventDefault()` eksikti. Form
tarayıcının varsayılan davranışıyla gönderiliyor, sayfa yenileniyor ve Firestore
yazma işlemi yarıda kesiliyordu. Eklendi.

### 2.3 `admin.html` bozuk HTML ile bitiyordu
Dosyanın sonunda iki adet `</body></html>` bloğu, aralarında başıboş bir `>`
karakteri ve iki kez yüklenen `admin.js` script etiketi vardı. Temizlendi.

### 2.4 Sohbet ve anket, güvenlik kuralları yüzünden çalışmıyordu
- `firestore.rules` sohbet için `chat_rooms/{room}/messages` yolunu tanımlıyordu,
  ama kod `chat_genel`, `chat_mitte` gibi **ayrı koleksiyonlara** yazıyor
  (`src/features/chat.js`). Mesajlar varsayılan kurala düşüyor ve yalnızca admin
  yazabiliyordu → normal kullanıcı mesaj gönderemiyordu.
- Anketlerde `allow write: if isAdmin()` vardı, ama oylama giriş yapmayan
  ziyaretçiler tarafından yapılıyor → **hiçbir oy kaydedilmiyordu** (hata
  `try/catch` içinde sessizce yutuluyordu).

Her ikisi de gerçek koleksiyon adları ve alan adlarıyla eşleşecek şekilde
yeniden yazıldı.

---

## 3. Hukuki Durum — Haber Çekme Neden Kaldırıldı

Kaldırılan yapı: `scripts/fetch-news.mjs` + `fetch-news.yml` iş akışı, RBB24,
Berlin.de ve Anadolu Ajansı RSS akışlarından başlık/özet/görsel çekiyor,
Gemini ile Türkçeye çevirip özetliyor ve bunları sitenin kendi içeriği gibi
yayınlıyordu.

**Bu yapı Almanya'da hukuki risk taşıyor.** Ana sebepler:

1. **Yayıncıların komşu hakkı (Presseverleger-Leistungsschutzrecht).**
   §87f–87k UrhG ve AB DSM Direktifi md. 15 uyarınca basın yayıncılarının
   içeriğinden yapılan alıntılar yalnızca "tek tek kelimeler veya çok kısa
   alıntılar" düzeyinde serbesttir. Başlık + 2–3 cümlelik özetin tamamının
   yayınlanması bu sınırı aşar ve lisans gerektirir.
2. **RSS akışı "serbest kullanım izni" değildir.** RSS teknik bir dağıtım
   biçimidir; içeriğin telifini ortadan kaldırmaz. Çoğu yayıncının kullanım
   şartları ticari yeniden yayını açıkça yasaklar.
3. **Kaynağa değil kendi sitesine yönlendirme.** Üretilen `rss.xml` ve
   `sitemap.xml` içinde `<link>` alanları `berlinkonusuyor.com/#!news/...`
   adresini gösteriyordu. Yani içerik özgün kaynağa değil kendi sitenize
   yönlendirilmiş oluyordu — bu, "alıntı" savunmasını da zayıflatır.
4. **Anadolu Ajansı** içeriği abonelik/lisans sözleşmesi olmadan yeniden
   yayınlanamaz (AA kullanım koşulları).
5. **NewsData.io** ücretsiz planı genellikle ticari olmayan kullanımla sınırlıdır
   ve kaynak gösterme zorunluluğu getirir.
6. **AI ile çeviri/özetleme durumu iyileştirmez**, aksine türev eser (Bearbeitung,
   §23 UrhG) tartışması açar.

> **Not:** Bu bir hukuki mütalaa değildir. Konu sizin için ticari önem taşıyorsa
> Berlin'de telif/medya hukuku alanında bir avukata danışmanız yerinde olur.

### Yasal olan alternatifler
- ✅ **Kendi içeriğinizi üretmek** (bu çalışmada eklenen video haber sistemi tam
  olarak bunu kolaylaştırıyor).
- ✅ **Sadece başlık + kaynak adı + kaynağa doğrudan link** vermek, özet
  yayınlamamak (yine de yayıncı bazında kontrol edilmeli).
- ✅ **Resmî basın bültenleri** (Berlin Senatı / Polizei Berlin gibi) — çoğu
  kaynak gösterilerek kullanıma daha açıktır, ama her kaynağın koşulu ayrı.
- ✅ **Lisans satın almak** (dpa, AA, Reuters gibi ajanslarla abonelik).

### Ne yapıldı
- `scripts/fetch-news.mjs` **silindi**.
- `.github/workflows/fetch-news.yml` **silindi**, yerine yalnızca kendi
  içeriğinizi işleyen `content-sync.yml` geldi.
- `public/data/news.json` içindeki çekilmiş yabancı haber metinleri **temizlendi**.
- `rss-parser` ve `@google/generative-ai` paketleri kaldırıldı.

---

## 4. Güvenlik

### 4.1 🔴 ACİL: Repoda açıkta duran API anahtarları
`.env.example` dosyası **şablon değil, gerçek anahtar** içeriyordu:

```
NEWSDATA_API_KEY=pub_49bb68f0...
GEMINI_API_KEY=AIzaSyB6Rr1hUEuga5De4...
```

Dosya temizlendi. **Ancak anahtarlar git geçmişinde kalır.** Repo herkese
açıksa bu anahtarlar sızmış sayılır ve şu adımlar gereklidir:

1. **Gemini anahtarını iptal edin:** https://aistudio.google.com/apikey → eski
   anahtarı sil. (Artık kullanılmıyor, yenisini oluşturmanız gerekmez.)
2. **NewsData.io anahtarını iptal edin:** https://newsdata.io hesabınızdan
   "revoke/regenerate".
3. Bunlar ücretli servislere bağlıysa fatura/kullanım geçmişini kontrol edin.

`firebase-config.js` içindeki Firebase `apiKey` **sızıntı değildir** — Firebase
web anahtarları tasarımı gereği herkese açıktır; güvenlik Firestore/Storage
kuralları ile sağlanır. Bu yüzden kuralları sıkılaştırdık (aşağıda).

### 4.2 Firebase Storage kuralları hiç yoktu
`storage.rules` dosyası ve `firebase.json` içinde `storage` bölümü **yoktu**.
Bu, video/görsel yükleme özelliğinin ya hiç çalışmaması ya da (varsayılan test
kuralı açıksa) **herkesin bucket'ınıza dosya yükleyebilmesi** anlamına gelir.

Eklenen `storage.rules`:
- Medya herkese açık **okunur** (site görselleri görünsün).
- Yazma **yalnızca admin e-postası** ile mümkün.
- Görsel için 10 MB, video için 200 MB üst sınır.
- MIME tipi doğrulaması (`image/*`, `video/*`).
- `videos/` ve `news/` dışındaki tüm yollar kapalı.

### 4.3 Firestore kuralları sıkılaştırıldı
- Varsayılan kural `allow read: if request.auth != null` idi → giriş yapan
  **herhangi biri** tüm koleksiyonları (aboneler dahil) okuyabiliyordu.
  Artık varsayılan **kapalı**, her koleksiyon tek tek tanımlı.
- İş ilanı ekleme `allow create: if true` idi → giriş yapmadan spam mümkündü.
  Artık giriş + `status: 'pending'` zorunlu.
- Bülten aboneliğinde e-posta biçimi doğrulanıyor.
- Video izlenme sayacı için özel kural: ziyaretçi **yalnızca** `views` alanını
  ve yalnızca **+1** artırabilir.
- Yer imleri yalnızca sahibi tarafından okunup yazılabilir.

### 4.4 HTML enjeksiyonu (XSS) sertleştirmesi
`renderNews` / `renderPremiumNews` başlık, kategori ve kaynak alanlarını
doğrudan `innerHTML` içine basıyordu. Tüm dinamik metinler artık `escapeHtml()`
ile kaçırılıyor; haber modalı gövdesi `textContent` kullanıyor.

### 4.5 Admin yetkisi
Admin listesi üç yerde ayrı ayrı duruyor: `src/admin.js` (`ALLOWED_ADMINS`),
`firestore.rules` ve `storage.rules`. `test@admin.com` gibi test hesapları
kaldırıldı. **Yeni admin eklerken üç dosyayı da güncellemeyi unutmayın.**
Daha temiz çözüm: Firebase Custom Claims (bkz. Bölüm 7).

---

## 5. Eklenen Özellik: Video Haber Sistemi

Talep: *"video haber yükleyince interaktif şekilde sayfamın işlemesi"* ve
*"çok uğraştırmayacak şekilde"*.

### Nasıl çalışıyor
```
Admin Paneli (/admin.html → "Video Haber")
        │
        ├─ A) Bağlantı yapıştır  → YouTube / Shorts / Vimeo otomatik tanınır
        │                          kapak görseli + yön otomatik gelir
        │
        └─ B) Dosya yükle (.mp4) → Firebase Storage'a ilerleme çubuğuyla yüklenir
                                   süre, yön ve kapak karesi TARAYICIDA çıkarılır
        │
        ▼
   Firestore  'videos'  koleksiyonu
        │
        ▼  (onSnapshot — canlı akış)
   Site anında güncellenir · yeniden derleme YOK · deploy YOK
```

**En önemli nokta:** `onSnapshot` kullanıldığı için admin panelinde "Yayınla"ya
bastığınız anda site kendini günceller. Ne `npm run build`, ne `firebase deploy`,
ne GitHub Actions beklemek gerekir. Açık olan sekmeler bile anında yenilenir.

### Kullanıcı tarafında ne var
- `#roportajlar` bölümünde yatay kaydırmalı **video rail'i** (ok tuşları + dokunmatik).
- Kategori **filtre çipleri** (kategoriler mevcut videolardan otomatik üretilir).
- Kartlarda süre, izlenme, "öne çıkan" etiketi, yayın zamanı.
- Yüklenen `.mp4` dosyalarında **fare üzerine gelince sessiz ön izleme**.
- Tam ekran **oynatıcı modalı**: YouTube (çerezsiz `youtube-nocookie`), Vimeo
  veya yerel `<video>`.
- **Derin bağlantı**: `#!video/<id>` — paylaşılan link doğrudan videoyu açar.
- **Klavye**: `Esc` kapat, `←/→` önceki/sonraki, kartlarda `Enter`/`Space`.
- **Mobil**: modal içinde yukarı kaydırma ile sonraki videoya geçiş.
- **Paylaş** butonu: `navigator.share`, desteklenmiyorsa panoya kopyalar.
- **İzlenme sayacı** (oturum başına bir kez sayılır).
- **SEO**: her video için `VideoObject` JSON-LD, dinamik OG/Twitter etiketleri,
  `sitemap.xml` ve `rss.xml` kayıtları.
- Ana sayfadaki bento widget'ındaki **sabit YouTube iframe'i** artık en yeni
  (veya "öne çıkan" işaretli) videonuzu gösteriyor. Hiç video yoksa eski YouTube
  akışı yedek olarak kalıyor.

### `#roportajlar` bağlantı hatası da düzeldi
Menüdeki "Röportajlar" ve hero'daki "İzle" butonu `#roportajlar` adresine
gidiyordu ama **sayfada böyle bir bölüm yoktu** — tıklayınca hiçbir şey
olmuyordu. Yeni video bölümü bu ID'yi kullanıyor, bağlantılar artık çalışıyor.

### Video eklerken pratik öneriler
| Durum | Öneri |
|---|---|
| Uzun video (>2 dk), YouTube kanalınız var | **Bağlantı yapıştırın.** Bant genişliği YouTube'da, size maliyeti yok. |
| Kısa/özel klip, YouTube'a koymak istemiyorsunuz | **Dosya yükleyin.** 200 MB sınırı var. |
| Dikey çekim (telefon) | "Dikey / Shorts (9:16)" seçin — oynatıcı buna göre açılır. |

> **Maliyet notu:** Firebase Storage ücretsiz kotası 5 GB depolama ve günlük
> 1 GB indirmedir. Videolar hızlı tüketir. Düzenli video yayınlayacaksanız
> YouTube bağlantısı yöntemi hem ücretsiz hem daha performanslı.

---

## 6. Altyapı ve Yapılandırma Düzeltmeleri

| Konu | Değişiklik |
|---|---|
| `npm run build` | `fetch-news.mjs` çağrısı kaldırıldı — derleme artık ağa ve API anahtarına bağımlı değil, offline çalışıyor. |
| `vite-plugin-pwa` | `"latest"` yerine `^1.2.0` sabitlendi (her kurulumda farklı sürüm gelmesi engellendi). |
| `firebase-admin`, `dotenv` | Yalnızca CI script'inde kullanılıyor → `devDependencies`'e taşındı, tarayıcı paketi küçüldü. |
| Cache başlıkları | `firebase.json`'a eklendi: hash'li JS/CSS için 1 yıl `immutable`, `index.html` ve service worker için `no-cache`. Bu, "eski sürüm takılı kalıyor" sorununu önler. |
| GitHub Actions | `npm install` → `npm ci` (kilitli sürümler), npm önbelleği, `concurrency` kilidi, boş commit'i atlayan kontrol. Sıklık 2 saatte bir → günde 2 kez (artık haber çekmiyor, sadece SEO). |
| `scripts/build-seo.mjs` | Yeni. Kendi içeriğinizden `sitemap.xml` + `rss.xml` üretir, `videos.json` çevrimdışı yedeğini tazeler ve **admin panelindeki push bildirim kuyruğunu işler**. Kimlik bilgisi yoksa hata vermeden yerel yedekle çalışır. |
| Push bildirimleri | Admin panelindeki "Bildirimi Gönder" butonu şimdiye kadar sadece `notifications_queue` koleksiyonuna yazıyordu, kuyruğu **işleyen bir şey yoktu** — hiçbir bildirim gitmiyordu. `build-seo.mjs` artık kuyruğu işliyor, geçersiz cihaz tokenlarını temizliyor ve gönderilenleri `sent: true` olarak işaretliyor. |

---

## 6b. İkinci Tur: Performans, Test ve Çok Dillilik

### Firebase paketi küçültüldü (555 kB → 468 kB)
`firebase-config.js` her sayfa yüklenişinde Storage ve Messaging SDK'larını da
paketliyordu. İkisi de artık **tembel yükleniyor** (`loadStorage()`, `loadMessaging()`):

- **Storage (~51 kB)** yalnızca medya yüklenirken iner — yani sadece admin
  panelinde ve sohbete görsel eklerken.
- **Messaging (~45 kB)** yalnızca kullanıcı bildirimlere **zaten izin vermişse**
  ya da "Bildirimleri Aç" butonuna bastığında iner. Sıradan ziyaretçi hiç indirmez.

Ölçüm (Playwright, ilk ziyaret): eskiden 555 kB'lık tek parça inerken artık
468 kB iniyor ve tembel parçaların hiçbiri talep edilmiyor.

> **Bonus:** `getMessaging()` modül seviyesinde çalışıyordu ve desteklemeyen
> tarayıcılarda hata fırlatıyordu — bu, `firebase-config.js`'i içe aktaran
> **tüm siteyi** kırma riski taşıyordu. Artık `isSupported()` ile korunuyor ve
> olası hata yalnızca bildirim özelliğini etkiliyor.

### Saf fonksiyonlar ayrıldı + testler eklendi
`parseVideoUrl`, `buildEmbedUrl` ve `formatDuration` artık
`src/utils/video-url.js` içinde — Firebase/DOM bağımlılığı yok.

- Admin paneli önceden sırf `parseVideoUrl` için tüm video motorunu yüklüyordu;
  artık sadece bu küçük modülü alıyor.
- **Vitest ile 19 test** eklendi (`npm test`): YouTube'un beş farklı bağlantı
  biçimi, Shorts'un dikey algılanması, Vimeo, doğrudan dosya, Firebase Storage
  bağlantısı, geçersiz girdiler ve TikTok/Instagram gibi desteklenmeyen
  platformlar.

### Video bölümü artık üç dilli
`section_video`, `video_title`, `video_desc`, `video_prev/next/share`,
`video_empty`, `video_filter_all`, `video_count` anahtarları TR/DE/EN olarak
eklendi. JS ile üretilen içerik (filtre çipleri, sayaç, boş durum) `data-i18n`
taramasıyla yakalanamadığı için `setLanguage()` artık bir **`bk:langchange`
olayı** yayıyor; video motoru bu olayı dinleyip kendini yeniden çiziyor.
Tarayıcıda TR → DE → EN geçişleri doğrulandı.

### Admin paneli temizliği
- `monitorAGStatus()` canlı sitede de her 10 saniyede bir `localhost:8080`
  adresine istek atıyordu (her seferinde başarısız). Artık yalnızca yerel
  makinede ve **tek sefer** çalışıyor; canlıda "CANLI ORTAM" yazıyor.
- `test@admin.com` admin listesinden kaldırıldı (güvenlik kurallarında da yok).

---

## 6c. Üçüncü Tur: Dış Bağımlılıklar, GDPR ve Görsel Katman

### Bulgu: site 4 ayrı dış CDN'e bağlıydı
`index.html` içinde Google Fonts, Font Awesome (cdnjs), Leaflet (unpkg) ve
Lenis (unpkg) doğrudan dış sunuculardan yükleniyordu. Bunun üç ayrı sonucu vardı:

1. **GDPR riski.** Almanya'da Google Fonts'un doğrudan Google sunucularından
   yüklenmesi, ziyaretçinin IP adresini rıza olmadan ABD'ye aktardığı için
   ihlal sayılmıştır (**LG München I, 3 O 17493/20**, Ocak 2022 — tazminata
   hükmedildi). Bu karar Almanya'da bir uyarı mektubu (*Abmahnung*) dalgası
   başlattı ve Berlin merkezli bir medya sitesi tipik hedeftir. Aynı mantık
   cdnjs (Cloudflare) ve unpkg için de geçerli.
2. **Render engelleme.** Leaflet'in ~150 kB'lık JS dosyası `<head>` içinde
   senkron `<script>` olarak duruyordu: harita sayfanın çok aşağısında
   olmasına rağmen HTML ayrıştırması bu dosya inene kadar duruyordu.
3. **Kırılganlık.** Dört ayrı dış servisin herhangi biri yavaşlarsa veya
   erişilemezse sayfa bozuk görünüyordu.

### Ne yapıldı
| Bağımlılık | Önce | Sonra |
|---|---|---|
| Inter + Playfair Display | Google Fonts CDN | `@fontsource/*` — kendi sunucumuz |
| Font Awesome | cdnjs CDN | `@fortawesome/fontawesome-free` — yerel |
| Leaflet | unpkg, `<head>`'de senkron | npm + `IntersectionObserver` ile tembel |
| Lenis | unpkg | npm + tembel (hareket azaltma tercihine saygılı) |
| Google giriş logosu | svgrepo.com | satır içi SVG |
| Haber yer tutucuları (20 adet) | Unsplash CDN | satır içi SVG degrade — **sıfır istek** |
| Hava durumu | tarayıcıdan `wttr.in`'e | derleme sırasında çekilip `/data/weather.json`'a |
| YouTube gömüsü | sayfa açılınca otomatik | **iki tıklama çözümü** (Zwei-Klick) |

**YouTube notu:** ana sayfadaki gömü, ziyaretçi hiç tıklamasa bile
yükleniyordu — yani YouTube rıza alınmadan çerez bırakıyordu. Artık kullanıcı
"Videoyu yüklemek için tıklayın" butonuna basmadan hiçbir istek gitmiyor ve
gömü çerezsiz `youtube-nocookie.com` alan adından açılıyor.

### Ölçülen sonuç (Playwright, ilk ziyaret)
- Dış sunucuya giden istek: **6 alan adı → 2** (`firestore.googleapis.com`
  ve YouTube kapak görselleri `i.ytimg.com`; ikisi de işlevsel olarak gerekli)
- DOMContentLoaded: ~310 ms
- Leaflet ilk yükte inmiyor, yalnızca harita bölümüne yaklaşınca yükleniyor
- 54 font yüzü ve tüm ikonlar yerel dosyalardan çiziliyor

**Görsel yan etki:** yazı tipleri ve ikonlar artık dış CDN'e bağlı olmadığı
için ağ koşullarından bağımsız olarak her zaman doğru çiziliyor. Önceden CDN
engellenirse ikonlar tamamen kayboluyordu.

**Maliyet:** ana CSS paketi 93,8 kB → 199,6 kB (gzip 17,3 → 42,0 kB) büyüdü,
çünkü Font Awesome'ın tam ikon tanımları artık bizim paketimizde. Kullanılan
ikon sayısı 58; geri kalan ~2000 tanım gereksiz. İleride yalnızca kullanılan
ikonlardan SVG sprite üretilirse bu maliyet büyük ölçüde geri alınabilir
(bkz. Bölüm 7, madde 13).

---

## 6d. Dördüncü Tur: Gerçek URL'ler ve Prerender (SEO mimarisi)

### Sorun
Site tek sayfalık bir uygulamaydı ve tüm içerik `#!news/<id>`,
`#!video/<id>` gibi **hash bağlantılarının arkasındaydı**. Google hash
fragmanlarını ayrı sayfa saymaz. Sitemap 9 URL gösteriyordu ama sekizi aynı
sayfanın çapa bağlantısıydı — yani sitenin pratikte **tek indekslenebilir
adresi** vardı ve yayınlanan hiçbir haber/video aramada görünmüyordu.

Bir haber sitesi için organik arama tek ölçeklenebilir ücretsiz trafik
kaynağıdır. Bu mimaride ne kadar içerik üretilirse üretilsin tabansız kovaya
su dolduruluyordu.

### Çözüm
`vite build` sonrasında çalışan yeni bir **prerender** adımı eklendi
(`scripts/prerender.mjs`). Her haber ve video için `dist/` altına gerçek bir
HTML sayfası yazıyor:

```
/haber/neukollnde-yeni-turk-kitapcisi-acildi-001def
/video/kreuzbergde-kira-zammi-esnaf-ne-diyor-001abc
```

Bu sayfalar **kendi kendine yeterli**: içerik HTML olarak gömülü (JavaScript
beklemeden okunuyor), doğru `<title>`, açıklama, canonical, OG/Twitter
etiketleri ve `NewsArticle` / `VideoObject` JSON-LD taşıyor. Firebase Hosting
statik dosyaları rewrite kurallarından önce sunduğu için doğrudan çalışıyorlar.

### Slug üretimi
`src/utils/slug.js` — Türkçe ve Almanca karakterleri doğru çeviriyor
(`Şişli` → `sisli`, `Straße` → `strasse`, `Neukölln` → `neukolln`).

Testler bir hata yakaladı: kesme işareti tireye dönüşüyor ve
`Kreuzberg'de` → `kreuzberg-de` oluyordu. Türkçede kesme işareti eki ayırdığı
için doğrusu `kreuzbergde`; düzeltildi. Slug'ın sonuna kimliğin son 6 karakteri
ekleniyor, böylece başlık düzenlense de eski bağlantı çakışmıyor ve aynı
başlıklı iki içerik birbirini ezmiyor. **14 yeni test** eklendi (toplam 33).

### Geriye dönük uyumluluk
Eski `#!news/<id>` ve `#!video/<id>` bağlantıları çalışmaya devam ediyor —
istemci her iki biçimi de çözüyor. SPA içinde bir karta tıklandığında adres
artık gerçek URL'ye dönüyor; sayfa yenilenirse prerender edilmiş statik sayfa
açılıyor.

### Veri akışı
`npm run seo` artık Firestore içeriğini `public/data/news.json` ve
`videos.json` dosyalarına da yazıyor. Böylece prerender, Firebase kimlik
bilgisi olmadan (yerel makinede) de çalışabiliyor. `content-sync.yml` bu
dosyaları günde iki kez tazeleyip commit'liyor.

### Doğrulama (Playwright, **JavaScript kapalı** — Googlebot testi)
```
✅ /haber/<slug>  → HTTP 200
   başlık: "Neukölln'de yeni Türk kitapçısı açıldı — Berlin Konuşuyor"
   H1 ve 166 karakterlik gövde metni JS olmadan görünüyor
   canonical doğru, JSON-LD tipi: NewsArticle
✅ /video/<slug>  → HTTP 200, oynatıcı gömülü (çerezsiz youtube-nocookie)
✅ SPA'da karta tıklama → adres /video/<slug> oluyor
✅ Modal kapanınca adres / dönüyor
✅ Konsolda hata yok
```

`firebase.json`'a `trailingSlash: false` eklendi — kanonik adreslerimiz eğik
çizgisiz olduğu için Firebase de öyle sunacak.

---

## 6f. Altıncı Tur: Bülten Aboneliği Kendi Veritabanınıza Taşındı

### Sorun
Ana sayfadaki bülten formu `formsubmit.co`'ya POST ediyordu. Yani abone
olan her e-posta yalnızca size **bildirim maili** olarak düşüyordu —
**kendi veritabanınızda bir abone listeniz hiç yoktu.** Toplu e-posta
göndermek isteseniz (yeni haber bülteni, önemli duyuru) elinizde hiçbir
şey olmayacaktı. Üstüne üçüncü taraf bir servise bağımlılıktı — tam da
elediğimiz kategoriden.

İlginç olan: admin panelinde zaten bir **"Aboneler"** sekmesi ve
`subscribers` koleksiyonunu okuyan kod duruyordu — sadece hiçbir şey o
koleksiyona yazmıyordu. Yarım kalmış bir özellikti.

### Çözüm
`src/features/extras.js` → `initNewsletter()` artık doğrudan sizin
Firestore'unuza yazıyor:

- Aynı kişi formu iki kez gönderirse yeni kayıt açılmasın diye
  e-postadan türetilmiş **deterministik bir doküman kimliği** kullanılıyor
  (`test@ornek.com` → `test_ornek_com`).
- Kayıt zaten varsa güvenlik kuralları (yalnızca admin güncelleyebilir)
  yazmayı reddediyor; bu `permission-denied` hatası "Zaten Abonesiniz"
  mesajına çevriliyor — doğru geri bildirim, ekstra sorgu yok.
- `index.html`'deki `action="https://formsubmit.co/..."` niteliği kaldırıldı.

### Yan bulgu: sonsuz dönen buton
Test sırasında sandbox'ın ağ kısıtlaması Firestore bağlantısını düşürdü ve
gerçek bir UX açığı ortaya çıktı: **ağ koptuğunda/çok yavaş olduğunda
`setDoc()` sözü hiç çözülmüyor, buton sonsuza dek dönüyor.** Bu, gerçek
kullanıcıların zayıf bağlantısında da olur. 8 saniyelik bir
`Promise.race` zaman aşımı eklendi — artık en geç 8 saniyede "Bağlantı
Yavaş, Tekrar Deneyin" mesajı gösterip buton tekrar aktif oluyor (arka
plandaki yazma, ağ dönerse yine de tamamlanabilir).

### Doğrulama
Playwright ile: form `formsubmit.co`'ya hiç istek atmıyor, `action`
niteliği yok, Firestore'a gerçek istek gidiyor. Ağ zorla kesildiğinde
zaman aşımı ~8-10 saniyede devreye giriyor, buton doğru mesajı gösterip
tekrar aktif hale geliyor.

---

## 6g. Yedinci Tur: Gerçek Çerez Rızası + Google Analytics

### Sorun: Banner hiç var olmamıştı
Kullanıcı Google Analytics eklemek istediğini belirtince mevcut çerez
banner'ını kontrol ettim ve iki şey ortaya çıktı:

1. **Banner'ın hiç CSS'i yoktu.** `cookie-banner`, `cookie-btn` gibi
   sınıflar hiçbir stil dosyasında tanımlı değildi — `.active` sınıfı
   eklense bile görsel olarak hiçbir şey olmuyordu. Yani şu ana kadar
   sitede **fiilen çalışan bir çerez bildirimi hiç yoktu.**
2. **Kabul/Red kararı hiçbir scripti engellemiyordu.** `acceptCookies()`
   ve `closeCookieBanner()` yalnızca bir `localStorage` bayrağı
   yazıyordu; hiçbir kod bu bayrağı okuyup bir şeyi başlatmıyor ya da
   durdurmuyordu. Yani GA'yı olduğu gibi eklemiş olsaydınız, banner'da
   ne seçilirse seçilsin **rıza olmadan yüklenip çerez yazacaktı** —
   bu, tam da bu oturumda dört CDN'i kaldırma sebebimiz olan risk
   kategorisiyle aynı, üstelik daha ağırı (çerez + ABD'ye veri aktarımı).

### Çözüm
**`src/features/consent.js`** — gerçek bir rıza durum makinesi:
- Karar `localStorage`'a kategori + zaman damgasıyla yazılıyor
  (`bk-consent-v1`: `{analytics: true|false, ts: ISO}`).
- Karar verildiğinde `bk:consent-change` olayı yayınlanıyor — GA
  yükleyicisi bunu dinliyor.
- **Kabul/Red butonları piksel piksel eşit boyutta** (164×43px,
  ölçüldü). Almanya'da küçük "reddet" linki + büyük renkli "kabul"
  butonu geçerli rıza sayılmıyor (BGH Planet49 kararı ve sonrasındaki
  eyalet veri koruma otoritesi rehberleri).
- Karar verildikten sonra da alt bilgideki **"Çerez Ayarları"**
  bağlantısından değiştirilebiliyor — rıza, verildiği kadar kolay geri
  alınabilmeli.

**`src/features/ga.js`** — Google Analytics (GA4) yükleyici:
- Script yalnızca `bk:consent-change` olayında `analytics: true`
  geldiğinde DOM'a ekleniyor. Google'ın "Consent Mode" gibi kısmi/
  tartışmalı bir çözümü değil, **doğrudan bir kapı** — rıza yoksa
  hiçbir istek gitmiyor, hiçbir çerez yazılmıyor.
- Ölçüm Kimliği (`G-XXXXXXXXXX`) boş bırakıldı — siz doldurana kadar
  GA hiç yüklenmiyor, konsola bilgilendirici bir uyarı düşüyor. Yanlışlıkla
  boş/test kimliğiyle üretime çıkma riski yok.
- SPA içi gezinmeler (haber/video açma) `bk:navigate` olayı üzerinden
  GA'ya `page_view` olarak bildiriliyor — kendi analitik sayacımızla
  aynı mekanizma, tutarlı mimari.

**Gizlilik politikası** (TR/DE/EN) güncellendi: Google Analytics'in
yalnızca onayla yüklendiği, hangi verinin gönderildiği ve kararın nasıl
değiştirilebileceği açıkça yazıldı. **Almanca metinde çerezlerle ilgili
hiç bölüm yoktu** — bu, Almanya hedefli bir site için tersti; eklendi.

### GA'yı devreye almak için
`src/features/ga.js` içindeki `GA_MEASUREMENT_ID` sabitine kendi
GA4 Ölçüm Kimliğinizi yazmanız yeterli (Google Analytics → Yönetici →
Veri Akışları → web akışınız → `G-XXXXXXXXXX`). Başka hiçbir değişiklik
gerekmiyor — rıza kapısı ve sayfa görüntüleme bildirimi zaten hazır.

### Doğrulama
Playwright ile: banner 2 saniyede görünüyor, butonlar piksel piksel eşit
(164×43), "Tümünü Kabul Et" → `localStorage`'a yazıyor → GA yükleyicisi
tetikleniyor (kimlik boş olduğu için doğru şekilde uyarı verip
yüklemiyor), "Yalnızca Gerekli" → GA script'ine **hiç istek gitmiyor**,
karar sayfa yenilendiğinde hatırlanıyor (banner tekrar çıkmıyor),
"Çerez Ayarları" kararı değiştirmek için banner'ı yeniden açıyor.

---

## 6h. Sekizinci Tur: Üç Küçük Bulgu

Rutin bir tarama sırasında çıkan, düşük riskli ama gerçek üç sorun:

1. **`robots.txt`, `/admin.html`'i gizlemiyordu.** Yönetim paneli teorik
   olarak Google'da indekslenebilirdi. `Disallow: /admin.html` eklendi.
2. **İş ilanları bölümünde 4 sahte ilan vardı** (`DEMO_JOBS` — uydurma
   şirket adları, gerçek büyük markaların ismi (Zalando SE, KaDeWe,
   Lieferando) ve icat edilmiş iletişim e-postaları). Onaylanmış gerçek
   ilan olmadığında bunlar sanki gerçek ilanmış gibi gösteriliyordu —
   bir kullanıcı `jobs@thebarn.de` adresine başvuru göndermeye kalkabilirdi.
   Kaldırıldı; boş durumda artık dürüst bir mesaj var: "Henüz onaylanmış
   ilan yok — ilk ilanı siz verebilirsiniz."
3. **CI yoktu.** `.github/workflows/ci.yml` eklendi — her push/PR'da
   `npm run lint`, `npm test` (33 test) ve `npm run build` otomatik
   çalışıyor. Üçü de yerelde sıfır hatayla doğrulandı, yani CI ilk
   günden yeşil başlıyor.

---

## 7. Sıradaki Öneriler (öncelik sırasına göre)

Bunlar bu çalışmanın kapsamı dışında bırakıldı; yapılmadılar.

### Yüksek öncelik
1. **Sızan API anahtarlarını iptal edin** (Bölüm 4.1). En acil madde.
2. **Deploy edin — bu kez sıra önemli:**
   ```
   firebase deploy --only functions,firestore:rules,storage
   ```
   Fonksiyon ve kurallar **birlikte** deploy edilmeli: kurallar artık
   `admin` custom claim'ini arıyor (bkz. madde 4), fonksiyon o claim'i
   atıyor. Kurallar fonksiyondan önce/tek başına giderse siz de dahil
   kimse yazamaz. Deploy'dan sonra `oarslanerbln@gmail.com` ile çıkış
   yapıp tekrar giriş yapın (veya sayfayı yenileyin) — bu, claim'i
   senkronize eden `syncAdminClaim` çağrısını tetikler. Ardından siteyi
   test edin: sohbete mesaj yazın, ankete oy verin, admin'den video ekleyin.
3. ~~Firebase paketini küçült~~ ✅ **Yapıldı** (Bölüm 6b) — 555 → 468 kB.
   Sıradaki adım Firestore'un kendisi: gerçek zamanlı dinleme gerekmeyen
   yerlerde `getDocs` yeterli, ama asıl kazanç için sayfa bazlı kod bölme gerekir.
4. ~~Admin yetkisi için Custom Claims.~~ ✅ **Yapıldı** — e-posta listesi
   5 dosyada tekrarlıyordu (rules ×2, `src/admin.js`, `auth.js`, `chat.js`)
   ve fiilen sapmıştı: `auth.js`/`chat.js` hâlâ eski `test@admin.com`
   placeholder'ını taşıyordu, `chat.js` gerçek admini hiç tanımıyordu.
   Artık tek kaynak `functions/index.js`teki `ADMIN_EMAILS` — yeni
   `syncAdminClaim` callable'ı (europe-west3) giriş yapan kullanıcının
   e-postası bu listedeyse token'a `admin:true` claim'i ekliyor; istemci
   `src/utils/admin-claim.js`teki `resolveAdminStatus()` ile bunu okuyor.
   **Henüz deploy edilmedi** — bkz. madde 2, deploy sırası kritik.
   `functions/` bu oturumda hiç var olmayan yeni bir dizin; Cloud
   Functions bu sandboxta deploy/test edilemedi.

### Orta öncelik
5. ~~`admin.html` içindeki `onclick="editVideo('...')"` kullanımları~~
   ✅ **Yapıldı** — `src/admin.js`teki 10 çağrı noktası (haber/video/
   etkinlik/anket/abone düzenle-sil, forum onayla-reddet) artık diğer
   modüllerdeki gibi `data-action` + tek bir `document.addEventListener`
   delegasyonu kullanıyor; ilgili 6 fonksiyon `window.*`den modül-yerel
   hale getirildi.
6. **Statik HTML tek dosyada 51 kB.** Bölümler bileşenlere ayrılabilir.
7. ~~`monitorAGStatus()` yoklaması~~ ✅ **Yapıldı** (Bölüm 6b).
8. ~~Otomatik test yok~~ ✅ **Yapıldı** — 33 test. ~~CI'da otomatik
   çalışmıyorlardı~~ ✅ **Yapıldı** (Bölüm 6h) — `.github/workflows/ci.yml`
   her push/PR'da lint+test+build çalıştırıyor. Sıradaki: `renderVideoNews`
   gibi DOM'a dokunan fonksiyonlar için jsdom ortamında testler.
9. ~~Görsel optimizasyonu.~~ ✅ **Yapıldı** — `convertImageToWebP()`
   (`src/utils/media-upload.js`) admin panelinden yüklenen haber
   kapaklarını tarayıcıda WebP'ye çevirip 1280px'e sınırlıyor; video
   otomatik kapak karesi de (`probeVideoFile`) artık JPEG değil WebP
   üretiyor. WebP kodlayamayan bir tarayıcıda sessizce orijinal dosyaya
   düşer.

### Düşük öncelik
10. ~~Video bölümü i18n~~ ✅ **Yapıldı** (Bölüm 6b). Kalan: kategori adları
    (admin'de girilen "Röportaj" vb.) hâlâ tek dilli — çok dilli kategori
    istenirse veri modeline eklenmeli.
11. Unsplash'tan gelen sabit kategori görselleri (`CATEGORY_IMAGES`) yerine
    kendi arşivinizi kullanmak marka tutarlılığı açısından daha iyi olur.
12. ~~ESLint'te 22 uyarı var~~ ✅ **Yapıldı** — kullanılmayan importlar/
    değişkenler/parametreler temizlendi, tamamen ölü bir fonksiyon silindi.
    0 uyarı.
13. ~~Font Awesome'ı sprite'a indirgemek.~~ ✅ **Yapıldı** — 67 ikon
    (58 tahmini kabaymış) `node_modules`'teki paketten okunup
    `scripts/build-fa-icons.mjs` ile CSS `mask-image` kurallarına
    dönüştürülüyor (`npm run icons`). `<i class="fas fa-x">` işaretlemesi
    değişmedi — yalnızca ikonun nasıl çizildiği değişti, böylece `<i>`
    elementini hedefleyen ~20 mevcut CSS kuralı bozulmadı. Sonuç: tek
    `src/styles/fa-icons.css` dosyası, 76 kB ham / **12,3 kB gzip**
    (öncesi: ~55 kB CSS + 119 kB webfont, yalnızca CSS gzip'i 24,7 kB'ydi).
    Üç webfont dosyası (`fa-solid-900`, `fa-regular-400`, `fa-brands-400`,
    toplam 256 kB) tamamen kalktı, sıfır font isteği. `fa-wifi-slash` FA7'de
    kaldırıldığı için `public/offline.html`'de `fa-link-slash` ile
    değiştirildi (bu sayfa ayrıca artık cdnjs'e bağımlı değil).
14. **Rehber bölümündeki 4 Unsplash fotoğrafı** (`index.html` bento grid) hâlâ
    dış CDN'den geliyor. Bunlar dekoratif yer tutucu değil gerçek Berlin
    fotoğrafları olduğu için degradeye çevrilmedi — **kendi çektiğiniz
    fotoğraflarla değiştirilip yerel olarak sunulmalı.** Hem GDPR hem marka
    açısından doğru olan bu.
15. **YouTube kapak görselleri** (`i.ytimg.com`) hâlâ dış istek üretiyor.
    Tam gizlilik istenirse kapaklar yükleme anında Storage'a kopyalanabilir
    (video dosyası yüklerken zaten yaptığımız gibi).

---

## 8. Değişen Dosyalar

**Yeni**
```
src/features/video-news.js      Video haber motoru (oynatıcı, rail, derin bağlantı)
src/styles/video-news.css       Video bölümü ve oynatıcı stilleri
scripts/build-seo.mjs           Kendi içeriğimizden sitemap/RSS + bildirim kuyruğu
storage.rules                   Firebase Storage güvenlik kuralları
.github/workflows/content-sync.yml
public/data/videos.json         Çevrimdışı yedek
src/utils/video-url.js          Saf bağlantı çözümleyici (Firebase/DOM bağımsız)
src/utils/video-url.test.js     19 birim testi (Vitest)
docs/ANALIZ.md                  Bu dosya
```

**Silinen**
```
scripts/fetch-news.mjs                  Dış kaynaktan haber çekme (telif)
.github/workflows/fetch-news.yml        Aynı akışın zamanlayıcısı
```

**Değişen**
```
index.html                  #roportajlar bölümü, video modalı, shorts widget ID'leri
admin.html                  Video Haber sekmesi + bozuk HTML sonu temizliği
src/main.js                 initVideoNews() bağlandı
src/admin.js                Video yönetimi + preventDefault düzeltmesi
src/features/news.js        linkBtn hatası + XSS sertleştirmesi
src/utils/media-upload.js   İlerleme takibi + video inceleme/kapak üretimi
src/firebase-config.js      Storage/Messaging tembel yüklemeye alındı
src/features/notifications.js  İzin yoksa Messaging SDK'sı hiç indirilmiyor
src/utils/i18n.js           bk:langchange olayı + t() yardımcısı + video anahtarları
src/style.css               video-news.css içe alındı
firestore.rules             Baştan yazıldı (sohbet/anket düzeltmeleri dahil)
firebase.json               storage kuralları + cache başlıkları
package.json                Bağımlılık temizliği, build script'i
.env.example                Sızan anahtarlar kaldırıldı
public/data/news.json       Çekilmiş yabancı içerik temizlendi
```

---

## 9. Doğrulama

```
✅ npm run lint      → 0 hata (23 mevcut uyarı, hepsi kullanılmayan import)
✅ npm test          → 19/19 test geçti (Vitest)
✅ npm run build     → başarılı, ~2.3 sn
✅ node scripts/build-seo.mjs  → kimlik bilgisi olmadan da hatasız çalışıyor
✅ Chromium (Playwright) tarayıcı testi:
     · 3 video kartı basıldı, kategori filtreleri üretildi
     · Karta tıklama → oynatıcı modalı açıldı, iframe yüklendi
     · Derin bağlantı #!video/t1 oluştu
     · "Sonraki" butonu çalıştı, Esc ile kapandı
     · Kategori filtresi doğru sonucu verdi
     · Konsolda JS hatası yok (yalnızca sandbox'ta engellenen dış kaynaklar)
     · Masaüstü + mobil (390px) görünüm doğrulandı
     · TR → DE → EN dil geçişinde başlık, çipler ve sayaç güncellendi
     · İlk ziyarette tembel parçaların (Storage/Messaging) inmediği ölçüldü
```

Not: Firestore'a gerçek yazma/okuma ve Storage'a video yükleme bu ortamdan
test edilemedi (ağ erişimi ve admin oturumu gerekiyor). Kuralları deploy
ettikten sonra admin panelinden bir test videosu eklemenizi öneririm.
