import { requestNotificationPermission } from './notifications.js';
import { auth } from '../firebase-config.js';

const DISMISS_KEY = 'pushPromptDismissedAt';
const DISMISS_DAYS = 7;
const SHOW_AFTER_MS = 20000;

const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
// iOS Safari yalnızca ana ekrana eklenmiş (standalone) modda push alabilir —
// sekmede açıkken izin ekranı görünse bile bildirim hiç ulaşmaz.
const isStandalone =
  window.navigator.standalone === true ||
  window.matchMedia('(display-mode: standalone)').matches;

function recentlyDismissed() {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const days = (Date.now() - Number(raw)) / (1000 * 60 * 60 * 24);
  return days < DISMISS_DAYS;
}

export function initPushPrompt() {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'default') return;
  if (recentlyDismissed()) return;

  scheduleShow(() => showBanner(isIOS && !isStandalone));
}

// Sayfada ~20sn geçince ya da kullanıcı ilk haberi açtığında —
// hangisi önce olursa — bildirim istemini göster. Sayfa açılır açılmaz
// izin sormak (çoğu tarayıcının/kullanıcının nefret ettiği bir kalıp)
// yerine gerçek bir ilgi sinyali bekliyoruz.
function scheduleShow(cb) {
  let fired = false;
  const fire = () => {
    if (fired) return;
    fired = true;
    clearTimeout(timer);
    document.removeEventListener('click', onClick, true);
    cb();
  };
  const timer = setTimeout(fire, SHOW_AFTER_MS);
  const onClick = (e) => {
    if (e.target.closest('[data-action="open-news"]')) fire();
  };
  document.addEventListener('click', onClick, true);
}

function dismiss(banner) {
  localStorage.setItem(DISMISS_KEY, String(Date.now()));
  banner.classList.remove('active');
  setTimeout(() => banner.remove(), 400);
}

function showBanner(needsHomeScreen) {
  const banner = document.createElement('div');
  banner.className = 'push-prompt-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Bildirim izni');

  banner.innerHTML = needsHomeScreen
    ? `
      <div class="push-prompt-panel glass-panel">
        <i class="fas fa-mobile-screen-button push-prompt-icon"></i>
        <div class="push-prompt-body">
          <strong>Yeni haberleri kaçırmayın</strong>
          <p>iPhone'da bildirim alabilmek için önce bu siteyi ana ekranınıza
          ekleyin: <i class="fas fa-arrow-up-from-bracket"></i> paylaş
          simgesine, ardından "Ana Ekrana Ekle"ye dokunun.</p>
        </div>
        <button type="button" class="push-prompt-close" aria-label="Kapat"><i class="fas fa-xmark"></i></button>
      </div>`
    : `
      <div class="push-prompt-panel glass-panel">
        <i class="fas fa-bell push-prompt-icon"></i>
        <div class="push-prompt-body">
          <strong>Yeni haberlerden anında haberdar olun</strong>
          <p>Berlin'den son dakika gelişmeleri için bildirimleri açın.</p>
        </div>
        <button type="button" class="push-prompt-allow btn-push-subscribe"><i class="fas fa-bell"></i> Bildirimleri Aç</button>
        <button type="button" class="push-prompt-close" aria-label="Kapat"><i class="fas fa-xmark"></i></button>
      </div>`;

  document.body.appendChild(banner);
  requestAnimationFrame(() => banner.classList.add('active'));

  banner.querySelector('.push-prompt-close').addEventListener('click', () => dismiss(banner));

  const allowBtn = banner.querySelector('.push-prompt-allow');
  if (allowBtn) {
    allowBtn.addEventListener('click', async () => {
      allowBtn.disabled = true;
      allowBtn.textContent = 'İşleniyor...';
      await requestNotificationPermission(auth.currentUser?.email);
      dismiss(banner);
    });
  }
}
