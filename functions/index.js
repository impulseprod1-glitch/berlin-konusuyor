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
import { onCall, HttpsError } from 'firebase-functions/v2/https';

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
