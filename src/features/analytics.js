/*  ═══════════════════════════════════════════════════════════
    BERLIN KONUŞUYOR — Çerezsiz Sayfa Görüntüleme Sayacı

    NEDEN: Site hiçbir ölçüm yapmıyordu — hangi haberin, hangi
    videonun tuttuğunu bilmeden içerik kararı vermek mümkün değil.
    Google Analytics gibi üçüncü taraf araçlar GDPR açısından
    (çerez rızası, IP aktarımı) ek yük getirir; bu proje zaten
    dış servisleri elemeye çalışıyor (bkz. docs/ANALIZ.md).

    Bunun yerine: kendi Firestore'unuza, günlük+sayfa bazında
    TEK bir sayaç yazan minimal bir modül. Çerez yok, kullanıcı
    kimliği yok, IP saklanmıyor — yalnızca "bu gün, bu sayfa,
    +1" biçiminde toplu (aggregate) veri. Oturum başına bir
    sayfa yalnızca bir kez sayılır (sessionStorage ile).
    ═══════════════════════════════════════════════════════════ */

import { db, doc, setDoc, increment } from '../firebase-config.js';

const SESSION_KEY = 'bk-pv-seen';
const MAX_TRACKED_PATHS_PER_SESSION = 100; // sessionStorage şişmesin diye üst sınır

function pathToId(pathname) {
  const clean = pathname === '/' ? 'home' : pathname.replace(/^\/+|\/+$/g, '').replace(/\//g, '_');
  return clean || 'home';
}

function alreadyCounted(pathname) {
  try {
    const seen = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]');
    return seen.includes(pathname);
  } catch {
    return false;
  }
}

function markCounted(pathname) {
  try {
    const seen = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]');
    seen.push(pathname);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(seen.slice(-MAX_TRACKED_PATHS_PER_SESSION)));
  } catch {
    /* sessionStorage kapalıysa (gizli sekme vb.) sessizce geç */
  }
}

/**
 * Bir sayfa görüntülemesini kaydeder. Aynı oturumda aynı yol için
 * bir kez sayılır. Firestore erişilemezse (kimlik/ağ hatası)
 * sessizce başarısız olur — sayaç asla kullanıcı deneyimini bozmaz.
 * @param {string} [pathname] Varsayılan: mevcut sayfa yolu
 */
export async function trackPageview(pathname = window.location.pathname) {
  if (!db || alreadyCounted(pathname)) return;
  markCounted(pathname);

  const today = new Date().toISOString().slice(0, 10);
  const docId = `${today}_${pathToId(pathname)}`;

  try {
    await setDoc(
      doc(db, 'analytics_daily', docId),
      { date: today, path: pathname, views: increment(1) },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Analytics] Kaydedilemedi:', err.message);
  }
}

export function initAnalytics() {
  trackPageview();

  // Geri/ileri tuşu
  window.addEventListener('popstate', () => trackPageview());

  // SPA içi gerçek URL değişimleri (haber/video açma) — news.js ve
  // video-news.js pushState/replaceState sonrası bu olayı yayınlıyor.
  window.addEventListener('bk:navigate', () => trackPageview());
}
