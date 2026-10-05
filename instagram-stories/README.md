# Berlin Konuşuyor – Günlük Story Bülteni

Her sabah Almanya, Berlin ve dünya haberlerinden 5 tanesini seçer, Türkçe yazar,
gazete tarzında story görselleri üretir ve **09:00'da** Instagram'da yayınlar.
Yayından önce bülten Telegram'a gelir; istemediğin şeyi tek mesajla durdurursun.

```
08:10  Haberler toplanır (tagesschau, rbb24, DW Türkçe, BBC)
       → Claude 5 haber seçer ve Türkçe yazar
       → kapak + 5 story görseli (1080×1920) üretilir
       → Telegram'a önizleme gelir
08:10–09:00  Kontrol penceresi: /iptal · /cikar 2 · /devam
09:00  Story'ler sırayla yayınlanır → Telegram'a "✅ Yayında" mesajı
```

## Telegram komutları

| Komut | Etkisi |
| --- | --- |
| `/iptal` | Bugün hiçbir şey yayınlanmaz. |
| `/cikar 2` | 2 numaralı haber çıkarılır. Kapak ve numaralar yeniden üretilir. Birden fazlası için: `/cikar 2 4` |
| `/devam` | O güne kadar verilen bütün komutları geri alır. |

Komutlar 09:00'a kadar okunur. Bir şey ters giderse (kaynak okunamadı, token
süresi doldu, Instagram hata verdi) Telegram'a ❌ mesajı gelir; GitHub da
başarısız run için e-posta gönderir.

## Kurulum (bir kerelik)

### 1. Instagram ve Meta

Instagram API'si sadece **profesyonel hesaplarla** (İşletme veya İçerik Üreticisi)
çalışır.

1. Instagram'da: *Ayarlar → Hesap türü → Profesyonel hesaba geç*. Ardından hesabı
   bir **Facebook Sayfasına** bağla.
2. [developers.facebook.com](https://developers.facebook.com) → *Uygulama oluştur*
   → tür: **Business**. Uygulamaya *Instagram* ürününü ekle.
   Sadece kendi hesabına paylaşım yapacağın için Meta'nın App Review sürecine
   gerek yok; uygulamada rolün olması yeterli.
3. **Süresiz token (önerilen):** business.facebook.com → *Ayarlar → Sistem
   kullanıcıları* → Admin rolünde bir sistem kullanıcısı oluştur → ona Facebook
   Sayfasını, Instagram hesabını ve uygulamayı ata → *Token oluştur*. Şu izinleri
   seç: `instagram_basic`, `instagram_content_publish`, `pages_show_list`,
   `pages_read_engagement`, `business_management`. Bu token'ın süresi dolmaz →
   **IG_ACCESS_TOKEN**
4. **IG_USER_ID:** Graph API Explorer'da bu token ile
   `GET /me/accounts?fields=instagram_business_account` sorgusunu çalıştır.
   Dönen `instagram_business_account.id` değeri senin IG_USER_ID'n.

> Alternatif olarak "Instagram Login" kullanılabilir (Facebook Sayfası gerekmez).
> O zaman `IG_GRAPH_BASE` değişkenine `https://graph.instagram.com/v26.0`
> yazılır. Ancak bu yolda token 60 günde bir yenilenmeli.

### 2. Telegram botu

1. Telegram'da **@BotFather** → `/newbot` → verilen token → **TELEGRAM_BOT_TOKEN**
2. Yeni bota herhangi bir mesaj yaz.
3. Tarayıcıda `https://api.telegram.org/bot<TOKEN>/getUpdates` adresini aç.
   `message.chat.id` değeri → **TELEGRAM_CHAT_ID**. Bot yalnızca bu sohbetten
   gelen komutları dinler.

### 3. Görsel depolama (Firebase Storage)

Instagram görselleri sadece herkese açık bir URL'den alıyor. Görseller sitenin
kendi Firebase Storage alanında `stories/` klasörüne yükleniyor; ayrı bir hesap
gerekmez. Repoda haber botu için zaten bulunan **FIREBASE_SERVICE_ACCOUNT**
secret'ı kullanılır. Bu servis hesabının Google Cloud'da *Storage Object Admin*
rolü olmalı (Firebase Admin SDK hesabında varsayılan olarak vardır). 14 günden
eski story dosyaları otomatik silinir.

### 4. Claude API

[console.anthropic.com](https://console.anthropic.com) → *API Keys* → **ANTHROPIC_API_KEY**

### 5. GitHub Secrets

Repo → *Settings → Secrets and variables → Actions → New repository secret*:

`ANTHROPIC_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `IG_USER_ID`,
`IG_ACCESS_TOKEN` (`FIREBASE_SERVICE_ACCOUNT` zaten var)

İsteğe bağlı olarak *Variables* sekmesine: `BRAND_HANDLE` (görsellerde yazan
kullanıcı adı, varsayılanı `@berlin.konusuyor`) ve `IG_GRAPH_BASE`.

Bir secret eksikse run en başta açık bir hata mesajıyla durur. Hiçbir adım
sessizce atlanmaz.

### 6. İlk test

1. *Actions → Stories: prepare → Run workflow* → Telegram'a önizleme gelmeli.
2. Görseller iyi görünüyorsa: *Actions → Stories: publish → Run workflow*,
   „Publish immediately" işaretli → story'ler yayınlanır.
3. Ertesi gün itibarıyla akış kendiliğinden çalışır.

## Yerelde çalıştırma

```bash
cd instagram-stories
npm ci
npm run preview -- --sample    # örnek verilerle tasarım → out/*.jpg
npm run preview                # gerçek haberler + Claude (ANTHROPIC_API_KEY gerekli)
npm run typecheck && npm test
```

Google Chrome kurulu değilse: `CHROME_PATH=/path/to/chrome npm run preview -- --sample`

## Ayarlar

Hepsi `src/config.ts` içinde: yayın saati, haber sayısı, haber kaynakları, model.
Görsel tasarım `src/render/templates.ts` içinde. Editoryal kurallar (seçim,
doğruluk, dil) `src/editor.ts` içindeki sistem promptunda.

Yayın saatini değiştirirsen kök dizindeki `.github/workflows/stories-*.yml` cron saatlerini de
kaydır: hazırlık yayından ~50 dakika önce, publish ~25 dakika önce başlamalı.

## Maliyet

| Kalem | Tahmini |
| --- | --- |
| Claude API (günde 1 çağrı) | ~0,05–0,15 $/gün |
| GitHub Actions | public repoda ücretsiz |
| Firebase Storage | ücretsiz kota içinde (günde ~1,5 MB) |

## Hukuki notlar

- **Görseller:** Haber ajanslarının ve yayın kuruluşlarının fotoğrafları
  kullanılmaz. Tasarım bilinçli olarak tamamen tipografik.
- **Metinler:** Claude haberleri kaynak cümlelerini çevirmeden, kendi cümleleriyle
  özetler; her story'de kaynak belirtilir. Kaynakların RSS kullanım koşullarını
  kontrol et. Örneğin rbb24, RSS akışının ticari kullanımına izin vermiyor.
  Hesaptan gelir elde etmeye başlarsan bu kaynağı `config.ts`'den çıkar.
- **Yapay zekâ beyanı (AB Yapay Zekâ Yasası, md. 50):** Yapay zekâyla yazılmış
  haber metinleri için beyan zorunlu. Metin insan kontrolünden geçmiş ve
  editoryal sorumluluğu biri üstlenmişse bu zorunluluk kalkar. Telegram
  önizlemesi tam olarak bu kontrol adımıdır, bu yüzden her sabah gerçekten göz at.
- **Impressum:** Almanya'da ticari ve gazetecilik içerikli sosyal medya
  hesaplarının bir Impressum'u (§ 5 DDG) ve içerikten sorumlu bir kişisi
  (§ 18 MStV, V.i.S.d.P.) olmalı. Profil bağlantısında bir Impressum sayfası olsun.

## Sorun giderme

| Belirti | Neden / Çözüm |
| --- | --- |
| ❌ „Instagram token geçersiz" | Token iptal edilmiş ya da süresi dolmuş → yeni token oluştur, `IG_ACCESS_TOKEN`'ı güncelle. |
| ⚠️ „Okunamayan kaynak: …" | Bir RSS akışı geçici olarak yanıt vermiyor. Diğer kaynaklarla devam edilir. Kalıcıysa URL'yi `config.ts`'de düzelt. |
| Önizleme 08:30'dan geç geliyor | GitHub zamanlanmış görevleri bazen 10–20 dakika geç başlatıyor. Yayın yine 09:00'da çıkar; önizleme geç gelirse kontrol penceresi en az 10 dakika olur. |
| Hiç önizleme gelmedi | *Actions* sekmesinde „Stories: prepare" çalıştı mı? Publish adımı hazır bülten bulamazsa onu kendisi hazırlar ve 10 dakika bekler. |
