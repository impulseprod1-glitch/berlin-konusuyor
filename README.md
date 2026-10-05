# Berlin Konuşuyor

Berlin'deki Türkçe konuşan topluluk için haber, etkinlik, şehir rehberi ve
topluluk platformu. Vite ile derlenen bir PWA; arka uç Firebase (Hosting,
Auth, Firestore, Storage, Cloud Messaging).

## Yapı

| Yol | İçerik |
| --- | --- |
| `index.html`, `src/main.js`, `src/features/` | Site ve özellikler |
| `admin.html`, `src/admin.js` | Yönetim paneli (yalnızca `src/utils/admins.js`'teki hesap) |
| `firestore.rules`, `storage.rules` | Güvenlik kuralları – asıl koruma burada |
| `tests/rules/` | Kuralların emülatör testleri |
| `src/data/owner.js` | Impressum bilgileri (canlıya çıkmadan doldurulmalı) |
| `scripts/fetch-news.mjs` | 2 saatte bir haber + hava durumu (`fetch-news.yml`) |
| `scripts/stock-images.mjs` | Unsplash görsellerini yayın sırasında kendi sunucumuza indirir |
| `instagram-stories/` | Her sabah 09:00 Instagram story bülteni ([README](instagram-stories/README.md)) |

## Komutlar

```bash
npm ci
npm run dev                         # geliştirme sunucusu
npx vite build                      # derleme (npm run build ayrıca haber çeker, API anahtarı ister)
node scripts/check-third-party.mjs  # derlemede izinsiz dış kaynak var mı?
npm run lint
cd tests/rules && npm ci && npm test   # güvenlik kuralı testleri (Java 21 gerekir)
```

## Yayın

- **Pull request:** CI derler, kuralları test eder ve 7 gün geçerli bir önizleme linki yorum olarak eklenir.
- **Canlı:** *Actions → Deploy → Run workflow*
  - `rules`: yalnızca güvenlik kurallarını yükler. Her zaman güvenle çalıştırılabilir.
  - `production`: siteyi ve kuralları yükler. Impressum'da yer tutucu varsa durur.

Gerekli secret: `FIREBASE_SERVICE_ACCOUNT`. Haber botu ayrıca `GEMINI_API_KEY` ve
`NEWSDATA_API_KEY` kullanır. Servis hesabının *Firebase Hosting Admin*,
*Firebase Rules Admin* ve *Storage Object Admin* rollerine sahip olması gerekir.

## Kurallar

- **Dış kaynak yok:** Font, ikon ve kütüphaneler npm üzerinden paketlenir. Google
  Fonts, CDN veya hotlink kullanılmaz. Harita ve YouTube yalnızca ziyaretçi
  tıklayınca yüklenir (`src/features/consent-embed.js`).
- **Kural değişikliği = test:** `firestore.rules` değişirse `tests/rules` da güncellenir.
- **Admin listesi üç yerde:** `src/utils/admins.js`, `firestore.rules`, `storage.rules`.
- **Mobil:** Grid kolonları `minmax(0, 1fr)` kullanır. Her değişiklik 390 px'de kontrol edilir.

## Yayına çıkış listesi

1. Sızan Gemini ve NewsData anahtarlarını iptal edip yenile, GitHub Secrets'ı güncelle.
2. *Deploy → rules* çalıştır. Admin arka kapısını canlı veritabanında kapatır.
3. `src/data/owner.js` dosyasını gerçek bilgilerle doldur.
4. Alan adını al (`berlinkonusuyor.com` boşta) ve Firebase Hosting'e bağla.
5. *Deploy → production*.
