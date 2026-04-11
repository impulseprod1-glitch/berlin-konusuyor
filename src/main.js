import './style.css';
import './news-engine.css';
import './chat.css';
import './bento-grid.css';
import { initLangSwitcher } from './features/ui.js';
import { initAuthListener } from './features/auth.js';
import { initDashboardUtils } from './features/dashboard.js';
import { loadNewsWithDeepLink } from './features/news.js';
import { loadEvents } from './features/events.js';
import { loadPodcasts, initPodcastsUI } from './features/podcasts.js';
import { initQAForum } from './features/forum.js';
import { initJobBoard } from './features/jobs.js';
import { initChat } from './features/chat.js';
import { 
  initSplash, initScrollProgress, initTextReveal, initNavbar, 
  initMobileMenu, initMobileDock, initLenis, initServiceWorker, 
  initTheme, initSearch 
} from './features/ui.js';
import { initCookieBanner } from './features/legal.js';
import { 
  initChatbot, initPolls, initShakeHistory, initSwipeToDismiss, 
  initCursorPremium, initParallax, initTiltEffects, initCounters, 
  initMagneticButtons, initNewsletter, initPullToRefresh
} from './features/extras.js';
import { initMap } from './features/map.js';
import { initNotifications, requestNotificationPermission } from './features/notifications.js';
import { auth } from './firebase-config.js';
import { initBridge } from './features/bridge.js';
import './features/pulse.js';


// Setup Intersection Observer on global window object so modules can reuse it
const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
window.revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            window.revealObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

function startGlobalObserving() {
    const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    reveals.forEach(el => window.revealObserver.observe(el));
}

document.addEventListener('DOMContentLoaded', () => {
    // Phase 1: Bridge to Antigravity OS
    initBridge();
    
    // Basic UI Setup
    initLenis();

    initSplash();
    initTheme();
    initLangSwitcher();
    initCookieBanner();
    initNavbar();
    initMobileMenu();
    initMobileDock();
    initSearch();
    
    // Start observing existing elements
    startGlobalObserving();
    
    // Core Features
    initAuthListener();
    initDashboardUtils();
    loadNewsWithDeepLink();
    loadEvents();
    loadPodcasts();
    initPodcastsUI();
    initQAForum();
    initJobBoard();
    initChat();
    initServiceWorker();
    
    // Extra UI / Interactions
    initParallax();
    initScrollProgress();
    initTextReveal();
    initCursorPremium();
    initTiltEffects();
    initCounters();
    initMagneticButtons();
    initNewsletter();
    initMap();
    initPolls();
    initChatbot();
    
    // Mobile Features
    initSwipeToDismiss();
    initShakeHistory();
    initServiceWorker();
    initPullToRefresh();
    initNotifications();
    
    // Notification listener for CTA
    const pushBtn = document.getElementById('pushSubscribeBtn');
    if (pushBtn) {
      pushBtn.addEventListener('click', async () => {
        pushBtn.disabled = true;
        pushBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> İşleniyor...';
        const ok = await requestNotificationPermission(auth.currentUser?.email);
        if (ok) {
          pushBtn.innerHTML = '<i class="fas fa-check"></i> Bildirimler Açıldı';
          pushBtn.classList.add('success');
        } else {
          pushBtn.innerHTML = '<i class="fas fa-bell"></i> Bildirimleri Aç';
          pushBtn.disabled = false;
        }
      });
    }

    document.querySelectorAll('.reveal, .reveal-small, .reveal-left, .reveal-right').forEach((el) => {
        window.revealObserver.observe(el);
    });
});

// ── Global Event Delegation (Data-Action) ──
document.addEventListener('click', (e) => {
  const actionEl = e.target.closest('[data-action]');
  if (!actionEl) return;
  
  const action = actionEl.dataset.action;

  switch (action) {
    case 'open-job-modal':
      if (window.openJobModal) window.openJobModal();
      break;
    case 'close-job-modal':
      if (window.closeJobModal) window.closeJobModal();
      break;
    case 'open-legal':
      e.preventDefault();
      if (window.openLegal) window.openLegal(actionEl.dataset.legal);
      break;
    case 'close-legal-modal':
      if (window.closeLegal) window.closeLegal();
      break;
    case 'login-google':
      if (window.login) window.login();
      if (window.closeLoginModal) window.closeLoginModal();
      break;
    case 'close-login-modal':
      if (window.closeLoginModal) window.closeLoginModal();
      break;
    case 'close-news-modal':
      if (window.closeNewsModal) window.closeNewsModal();
      break;
    case 'toggle-tts':
      if (window.toggleTTS) window.toggleTTS();
      break;
    case 'close-podcast':
      if (window.closePodcast) window.closePodcast();
      break;
    case 'toggle-play':
      if (window.togglePlay) window.togglePlay();
      break;
    case 'skip-podcast':
      if (window.skipPodcast && actionEl.dataset.skip) {
        window.skipPodcast(parseInt(actionEl.dataset.skip));
      }
      break;
    case 'toggle-chatbot':
      if (window.toggleChatbot) window.toggleChatbot();
      break;
    case 'close-history-modal':
      if (window.closeHistoryModal) window.closeHistoryModal();
      break;
    case 'accept-cookies':
      if (window.acceptCookies) window.acceptCookies();
      break;
    case 'reject-cookies':
      if (window.closeCookieBanner) window.closeCookieBanner();
      break;
    case 'toggle-map-filter':
      // This is now handled in map.js but kept here for potential future delegation
      break;
    case 'scroll-to-top':
      if (window.scrollToTop) window.scrollToTop(e);
      break;
  }
});

// ── Premium Interactions (Magnetic & Tilt) ──────────
function initPremiumInteractions() {
  // Magnetic Buttons
  document.addEventListener('mousemove', (e) => {
    const magnets = document.querySelectorAll('.magnetic-btn');
    magnets.forEach((btn) => {
      const bound = btn.getBoundingClientRect();
      const x = e.clientX - (bound.left + bound.width / 2);
      const y = e.clientY - (bound.top + bound.height / 2);
      
      const distance = Math.sqrt(x * x + y * y);
      const maxDistance = 80;

      if (distance < maxDistance) {
        const moveX = (x / maxDistance) * 15;
        const moveY = (y / maxDistance) * 15;
        btn.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.05)`;
      } else {
        btn.style.transform = '';
      }
    });
  });

  // 3D Tilt for Premium Cards
  const tiltCards = document.querySelectorAll('.premium-news-card');
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const bound = card.getBoundingClientRect();
      const x = (e.clientX - bound.left) / bound.width;
      const y = (e.clientY - bound.top) / bound.height;
      
      const tiltX = (y - 0.5) * 10;
      const tiltY = (x - 0.5) * -10;
      
      card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-10px) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// Re-init when news is rendered
const originalRenderNews = window.renderNews;
window.renderNews = (articles, category) => {
  if (originalRenderNews) originalRenderNews(articles, category);
  setTimeout(initPremiumInteractions, 100);
};

// Initial call
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initPremiumInteractions, 2000); // Give time for first render
});
