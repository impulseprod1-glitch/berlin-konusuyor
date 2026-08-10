/*  ═══════════════════════════════════════════════════════════
    BERLIN KONUŞUYOR — Admin Custom Claims

    NEDEN: Admin listesi eskiden 5 dosyada tekrarlanıyordu
    (firestore.rules, storage.rules, src/admin.js, src/features/
    auth.js, src/features/chat.js) — biri güncellenip diğerleri
    unutulunca gerçek admin bazı yerlerde tanınmıyordu (chat.js
    hâlâ eski 'test@admin.com' placeholder'ını taşıyordu).

    NE YAPAR: Tek admin listesi burada. Giriş yapmış bir kullanıcı
    e-postası bu listedeyse `syncAdminClaim` çağrısıyla kendi
    Firebase Auth token'ına `admin:true` custom claim'i eklenir.
    Güvenlik kuralları (firestore.rules/storage.rules) ve istemci
    kodu artık e-posta listesi değil, bu claim'i kontrol ediyor.

    Yeni admin eklemek için: ADMIN_EMAILS'e ekleyip
    `firebase deploy --only functions` çalıştırın; yeni admin bir
    dahaki girişinde (veya sayfayı yenileyince) otomatik claim alır.
    ═══════════════════════════════════════════════════════════ */

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

initializeApp();

// Firestore/Storage verisi eur3'te (AB) barındığı için fonksiyon da
// aynı bölgede — GDPR/gecikme açısından verinin yanında kalır.
const REGION = 'europe-west3';

const ADMIN_EMAILS = ['oarslanerbln@gmail.com'];

export const syncAdminClaim = onCall({ region: REGION }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Giriş yapmalısınız.');
  }

  const { uid, token } = request.auth;
  const shouldBeAdmin = ADMIN_EMAILS.includes(token.email);

  if (Boolean(token.admin) !== shouldBeAdmin) {
    await getAuth().setCustomUserClaims(uid, shouldBeAdmin ? { admin: true } : null);
  }

  return { admin: shouldBeAdmin };
});

/*  ═══════════════════════════════════════════════════════════
    Push Bildirimleri

    NEDEN: admin.js'teki "Bildirimi Gönder" formu her zaman
    notifications_queue koleksiyonuna yazıyordu, ama o kuyruğu
    işleyen hiçbir şey yoktu — bildirimler asla gönderilmiyordu.
    Bu, kuyruğun beklediği tetikleyici.
    ═══════════════════════════════════════════════════════════ */

const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

async function sendToAllTokens({ title, body, url }) {
  const db = getFirestore();
  const tokens = (await db.collection('fcm_tokens').get()).docs.map((d) => d.id);
  if (!tokens.length) return;

  const messaging = getMessaging();
  // sendEachForMulticast 500 token/çağrı ile sınırlı — parti parti gönder.
  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500);
    const res = await messaging.sendEachForMulticast({
      tokens: batch,
      notification: { title, body },
      webpush: { fcmOptions: { link: url || '/' } },
    });

    // Geçersiz/silinmiş token'ları temizle — yoksa her gönderimde
    // ölü token'lara boşuna istek atılır.
    const deletions = res.responses
      .map((r, idx) => (!r.success && DEAD_TOKEN_CODES.has(r.error?.code) ? batch[idx] : null))
      .filter(Boolean)
      .map((t) => db.collection('fcm_tokens').doc(t).delete());
    await Promise.all(deletions);
  }
}

export const sendQueuedPush = onDocumentCreated(
  { region: REGION, document: 'notifications_queue/{id}' },
  async (event) => {
    const data = event.data.data();
    await sendToAllTokens({ title: data.title, body: data.body, url: data.url });
  }
);
