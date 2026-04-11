import { translations, currentLang, setLanguage } from '../utils/i18n.js';
import { globalNews } from './news.js';
import { globalEvents } from './events.js';

export function initSplash() {
  const splash = document.getElementById('splashScreen');
  if (!splash) return;
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    splash.classList.add('hidden');
    document.body.style.overflow = '';
  }, 2600);
}

export function initScrollProgress() {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = (window.scrollY / docHeight) * 100;
    bar.style.width = scrolled + '%';
  }, { passive: true });
}

export function initTextReveal() {
  const heroLines = document.querySelectorAll('.hero-line');
  heroLines.forEach((line) => {
    // Fail-safe: if i18n updated textContent, we need to handle it
    const text = line.textContent.trim();
    if (!text) return;

    line.innerHTML = '';
    line.style.opacity = '1';
    line.classList.add('visible'); // Force visibility if observer is slow

    const words = text.split(' ');
    words.forEach((word, i) => {
      const span = document.createElement('span');
      span.className = 'word-span';
      span.textContent = word;
      // Staggered animation
      span.style.animationDelay = `${0.2 + (line.classList.contains('hero-line-accent') ? 0.4 : 0) + i * 0.1}s`;
      line.appendChild(span);
      if (i < words.length - 1) {
        line.appendChild(document.createTextNode(' '));
      }
    });
  });

  // Ensure CTA buttons are also visible
  document.querySelectorAll('.hero-cta, .hero-secondary-cta').forEach(btn => {
    btn.classList.add('visible');
  });
}
window.initTextReveal = initTextReveal;

export function initNavbar() {
  const navbar = document.getElementById('navbar');
  if(!navbar) return;
  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    if (currentScroll > 100) {
      navbar.style.background = 'rgba(0, 0, 0, 0.95)';
    } else {
        navbar.style.background = 'rgba(0, 0, 0, 0.85)';
    }
  });
}

export function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (!hamburger || !navLinks) return;

  const toggleMenu = (forceClose = false) => {
    const isOpen = forceClose ? false : !navLinks.classList.contains('open');
    hamburger.classList.toggle('active', isOpen);
    navLinks.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => toggleMenu(true));
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && navLinks.classList.contains('open')) {
      toggleMenu(true);
    }
  });
}

export function initMobileDock() {
  const dock = document.getElementById('mobileDock');
  const searchBtn = document.getElementById('dockSearchBtn');
  const aiBtn = document.getElementById('dockAiBtn');
  if (!dock) return;

  if (window.innerWidth > 768) return;
  
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    if (window.innerWidth > 768) return;

    const currentScroll = window.pageYOffset;
    if (currentScroll <= 0) {
      dock.classList.remove('hidden');
      return;
    }

    if (currentScroll > lastScroll && !dock.classList.contains('hidden')) {
      dock.classList.add('hidden');
    } else if (currentScroll < lastScroll && dock.classList.contains('hidden')) {
      dock.classList.remove('hidden');
    }
    lastScroll = currentScroll;
  });

  searchBtn?.addEventListener('click', () => {
    const searchToggle = document.getElementById('searchToggle');
    searchToggle?.click();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  aiBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const chatbotWindow = document.getElementById('chatbotWindow');
    if (chatbotWindow) chatbotWindow.classList.add('active');
  });

  const dockItems = dock.querySelectorAll('.dock-item');
  dockItems.forEach(item => {
    item.addEventListener('click', () => {
      dockItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });
}

export function initLenis() {
  if (typeof Lenis !== 'undefined') {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }
}

export function initServiceWorker() {
  const hero = document.getElementById('hero');
  if (hero) {
    const h = hero.offsetHeight;
    if (h < 100) {
      hero.style.height = '100vh';
      hero.style.minHeight = '100vh';
      hero.style.display = 'flex';
      console.warn('⚠️ Hero height fail-safe activated');
    }
  }

  // Service worker is now automatically registered by vite-plugin-pwa (injectRegister: 'auto')
}

export function initTheme() {
  const toggle = document.getElementById('themeToggle');
  const body = document.body;
  const icon = toggle?.querySelector('i');

  const savedTheme = localStorage.getItem('bk-theme');
  if (savedTheme === 'light') {
    body.classList.add('light-theme');
    if (icon) icon.className = 'fas fa-sun';
  }

  toggle?.addEventListener('click', () => {
    body.classList.toggle('light-theme');
    const isLight = body.classList.contains('light-theme');
    localStorage.setItem('bk-theme', isLight ? 'light' : 'dark');
    if (icon) icon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
  });
}

export function initSearch() {
  const toggle = document.getElementById('searchToggle');
  const overlay = document.getElementById('searchOverlay');
  const close = document.getElementById('searchClose');
  const input = document.getElementById('searchInput');
  const resultsList = document.getElementById('searchResultsList');

  if (!toggle || !overlay || !close || !input) return;

  function openSearch() {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => input.focus(), 100);
  }

  function closeSearch() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    input.value = '';
    resultsList.innerHTML = '';
  }

  toggle.addEventListener('click', openSearch);
  close.addEventListener('click', closeSearch);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeSearch();
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeSearch();
    }
  });

  input.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (query.length < 2) {
      resultsList.innerHTML = '';
      return;
    }

    const newsResults = (globalNews || []).filter(n =>
      (n.title && n.title.toLowerCase().includes(query)) ||
      (n.summary_tr && n.summary_tr.toLowerCase().includes(query))
    );

    const eventResults = (globalEvents || []).filter(ev =>
      (ev.title && ev.title.toLowerCase().includes(query)) ||
      (ev.description && ev.description.toLowerCase().includes(query))
    );

    renderSearchResults(newsResults, eventResults);
  });

  function renderSearchResults(news, events) {
    if (news.length === 0 && events.length === 0) {
      resultsList.innerHTML = '<div class="search-no-results">Sonuç bulunamadı...</div>';
      return;
    }

    let html = '';

    if (news.length > 0) {
      html += `<div class="search-category-title">Haberler (${news.length})</div>`;
      news.slice(0, 6).forEach(n => {
        html += `
          <div class="search-result-item" onclick="openNewsModal(${globalNews.indexOf(n)})">
            <i class="fas fa-newspaper"></i>
            <div>
              <div class="search-result-title">${n.title}</div>
              <div class="search-result-meta">${n.source}</div>
            </div>
          </div>
        `;
      });
    }

    if (events.length > 0) {
      html += `<div class="search-category-title">Etkinlikler (${events.length})</div>`;
      events.slice(0, 4).forEach(ev => {
        html += `
          <div class="search-result-item">
            <i class="fas fa-calendar-alt"></i>
            <div>
              <div class="search-result-title">${ev.title}</div>
              <div class="search-result-meta">${ev.date || 'Yakında'} • ${ev.venue || 'Berlin'}</div>
            </div>
          </div>
        `;
      });
    }

    resultsList.innerHTML = html;
  }
}

export function initLangSwitcher() {
  const buttons = document.querySelectorAll('.lang-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setLanguage(btn.dataset.lang);
    });
  });

  const saved = localStorage.getItem('bk-lang');
  if (saved && translations[saved]) {
    setLanguage(saved);
  } else {
    setLanguage('tr');
  }
}
