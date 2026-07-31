/*  ═══════════════════════════════════════════════════════════
    BERLIN KONUŞUYOR — Google Analytics (GA4) Yükleyici

    Script yalnızca kullanıcı "Analitik" çerezlerini kabul
    ettiğinde DOM'a ekleniyor (features/consent.js → bk:consent-change
    olayı). Rıza yoksa hiçbir istek gitmiyor, hiçbir çerez
    yazılmıyor — "Consent Mode" gibi kısmi/tartışmalı bir yol
    değil, doğrudan ve tartışmasız bir kapı.

    KURULUM: Aşağıya kendi GA4 Ölçüm Kimliğinizi yazın
    (Google Analytics → Yönetici → Veri Akışları → web akışınız
    → "G-XXXXXXXXXX"). Boş bırakılırsa GA hiç yüklenmez —
    üretime yanlışlıkla boş/test kimliğiyle çıkmazsınız.
    ═══════════════════════════════════════════════════════════ */

const GA_MEASUREMENT_ID = ''; // USER: "G-XXXXXXXXXX" buraya

let loaded = false;

function inject() {
  if (loaded) return;
  if (!GA_MEASUREMENT_ID) {
    console.warn('[GA] Ölçüm Kimliği tanımlı değil (src/features/ga.js) — Analytics yüklenmedi.');
    return;
  }
  loaded = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID);
}

/** SPA içi gerçek gezinmeleri (haber/video açma) GA'ya sayfa görüntülemesi olarak bildirir. */
function sendPageview() {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', 'page_view', {
    page_path: window.location.pathname,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function initGoogleAnalytics() {
  // Dinleyici, consent.js'in ilk kararı yayınlamasından ÖNCE kurulmalı
  // (main.js'te initGoogleAnalytics() → initConsentBanner() sırasıyla çağrılır).
  window.addEventListener('bk:consent-change', (e) => {
    if (e.detail?.analytics) inject();
  });
  window.addEventListener('bk:navigate', sendPageview);
}
