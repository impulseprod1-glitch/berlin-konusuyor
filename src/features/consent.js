/*  ═══════════════════════════════════════════════════════════
    BERLIN KONUŞUYOR — Çerez Rızası (GDPR/DSGVO)

    Önceden site "çerez banner'ı" gösteriyordu ama hiçbir CSS'i
    yoktu (görünmüyordu) ve kabul/red seçimi hiçbir scripti
    gerçekten engellemiyordu — tamamen dekoratifti.

    Bu modül gerçek bir rıza durum makinesi kurar:
      - Karar localStorage'a yazılır (kategori + zaman damgası)
      - "bk:consent-change" olayı yayınlanır — Google Analytics
        yükleyicisi (features/ga.js) bunu dinler ve YALNIZCA
        "Analitik" onaylanmışsa script'i DOM'a ekler
      - Kabul/Red butonları EŞİT görsel ağırlıkta (Alman
        mahkeme içtihadı — Planet49/BGH — küçük "reddet"
        linki + büyük renkli "kabul" butonu geçersiz sayılıyor)
      - Karar verildikten sonra da alt bilgideki "Çerez
        Ayarları" linkinden değiştirilebilir (rıza, verildiği
        kadar kolay geri alınabilmeli)
    ═══════════════════════════════════════════════════════════ */

const CONSENT_KEY = 'bk-consent-v1';

/** @returns {{analytics:boolean, ts:string}|null} */
export function getConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * @param {'necessary'|'analytics'} category
 * @returns {boolean}
 */
export function hasConsent(category) {
  if (category === 'necessary') return true; // her zaman gerekli, seçime tabi değil
  const consent = getConsent();
  return !!(consent && consent[category]);
}

function saveConsent(analytics) {
  const consent = { analytics, ts: new Date().toISOString() };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch {
    /* localStorage kapalıysa (gizli sekme vb.) sessizce geç — banner her ziyarette tekrar sorar */
  }
  window.dispatchEvent(new CustomEvent('bk:consent-change', { detail: consent }));
}

function hideBanner() {
  document.getElementById('cookieBanner')?.classList.remove('active');
}

function showBanner() {
  document.getElementById('cookieBanner')?.classList.add('active');
}

export function acceptAllCookies() {
  saveConsent(true);
  hideBanner();
}

export function rejectOptionalCookies() {
  saveConsent(false);
  hideBanner();
}

/** Alt bilgideki "Çerez Ayarları" linki — kararı değiştirmek için banner'ı yeniden açar. */
export function openCookieSettings(e) {
  e?.preventDefault();
  showBanner();
}

export function initConsentBanner() {
  const banner = document.getElementById('cookieBanner');
  if (!banner) return;

  const existing = getConsent();
  if (existing) {
    // Karar zaten verilmiş: banner gösterilmez, ama dinleyicilerin
    // (GA yükleyicisi gibi) mevcut kararı bilmesi için olay yine yayınlanır.
    window.dispatchEvent(new CustomEvent('bk:consent-change', { detail: existing }));
    return;
  }

  setTimeout(showBanner, 1500);
}

window.acceptAllCookies = acceptAllCookies;
window.rejectOptionalCookies = rejectOptionalCookies;
window.openCookieSettings = openCookieSettings;
