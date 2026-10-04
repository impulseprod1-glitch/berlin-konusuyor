import { currentLang } from '../utils/i18n.js';

/*
 * Map tiles (CARTO / OpenStreetMap) and YouTube receive the visitor's IP
 * address the moment they load. Under GDPR that needs consent, so both stay a
 * placeholder until the visitor asks for them. The choice is remembered per
 * service and can be withdrawn by clearing site data.
 */

const TEXT = {
  tr: { load: 'Yükle', remember: 'Bu tercihi hatırla', notice: (p) => `Bu içerik ${p} sunucularından yüklenir. Yüklediğinizde IP adresiniz bu hizmete iletilir.`, privacy: 'Gizlilik' },
  de: { load: 'Laden', remember: 'Auswahl merken', notice: (p) => `Dieser Inhalt wird von Servern von ${p} geladen. Dabei wird Ihre IP-Adresse an diesen Dienst übertragen.`, privacy: 'Datenschutz' },
  en: { load: 'Load', remember: 'Remember my choice', notice: (p) => `This content is loaded from ${p} servers. Loading it sends your IP address to that service.`, privacy: 'Privacy' },
};

const storageKey = (service) => `bk-consent-${service}`;

export function hasConsent(service) {
  try {
    return localStorage.getItem(storageKey(service)) === 'granted';
  } catch {
    return false;
  }
}

function rememberConsent(service) {
  try {
    localStorage.setItem(storageKey(service), 'granted');
  } catch {
    // Private mode: consent then lasts for this page view only.
  }
}

export function consentGate(container, { service, title, provider, onLoad }) {
  if (hasConsent(service)) {
    onLoad();
    return;
  }
  const t = TEXT[currentLang] || TEXT.tr;
  container.innerHTML = `
    <div class="consent-gate">
      <p class="consent-gate__title">${title}</p>
      <p class="consent-gate__text">${t.notice(provider)} <a href="#" data-legal="privacy">${t.privacy}</a></p>
      <button type="button" class="consent-gate__btn">${t.load}</button>
      <label class="consent-gate__remember"><input type="checkbox" checked> ${t.remember}</label>
    </div>`;
  container.querySelector('.consent-gate__btn').addEventListener('click', () => {
    if (container.querySelector('.consent-gate__remember input').checked) rememberConsent(service);
    container.innerHTML = '';
    onLoad();
  });
}

/** Turns every [data-youtube-src] placeholder into a consent-gated iframe. */
export function initYouTubeEmbeds() {
  document.querySelectorAll('[data-youtube-src]').forEach((el) => {
    consentGate(el, {
      service: 'youtube',
      title: el.dataset.title || 'YouTube',
      provider: 'YouTube (Google)',
      onLoad: () => {
        const frame = document.createElement('iframe');
        frame.src = el.dataset.youtubeSrc;
        frame.title = el.dataset.title || 'YouTube';
        frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        frame.allowFullscreen = true;
        frame.loading = 'lazy';
        el.replaceChildren(frame);
      },
    });
  });
}
