import './style.css';
import { 
  db, auth, googleProvider,
  collection, query, orderBy, onSnapshot, addDoc, 
  serverTimestamp, doc, updateDoc, increment, getDocs,
  signInWithPopup, signOut, onAuthStateChanged
} from './firebase-config.js';

let currentLang = localStorage.getItem('bk-lang') || 'tr';


/* ═══════════════════════════════════════════
   BERLIN KONUŞUYOR — Main JS
   i18n · Dynamic News · Scroll Reveal · Mobile Menu
   ═══════════════════════════════════════════ */

// ── AI Dashboard Rendering ──────────────────
function renderAIDashboard(insights) {
  if (insights) {
    if (insights.weatherAdvice) {
      document.getElementById('aiWeatherAdvice').innerText = insights.weatherAdvice;
    }
    if (insights.newsBrief) {
      document.getElementById('aiBriefText').innerText = insights.newsBrief;
    }
  }
}

// ── Dashboard Utilities ─────────────────────
function updateTime() {
  const now = new Date();
  const berlinTime = now.toLocaleTimeString('tr-TR', { timeZone: 'Europe/Berlin' });
  const clockEl = document.getElementById('berlinClock');
  if (clockEl) clockEl.innerText = berlinTime;
}

function initDashboardUtils() {
  updateTime();
  setInterval(updateTime, 1000);
  
  // Mock Dynamic Status for Premium feel
  const statusContainer = document.querySelector('.ai-stats');
  if (statusContainer) {
    // Clear existing to avoid double-appending on re-init if any
    const existingDynamic = statusContainer.querySelectorAll('.dynamic-stat');
    existingDynamic.forEach(e => e.remove());

    statusContainer.innerHTML += `
      <div class="stat-item reveal dynamic-stat">
        <span class="stat-label">Hava Kalitesi</span>
        <span class="stat-value">İyi (24 AQI)</span>
      </div>
      <div class="stat-item reveal dynamic-stat">
        <span class="stat-label">S-Bahn Durumu</span>
        <span class="stat-value text-success">Normal</span>
      </div>
    `;
  }

  // 2. Hava Durumu (Basit Fetch)
  fetch('https://wttr.in/Berlin?format=%t+%C')
    .then(res => res.text())
    .then(data => {
      const parts = data.split(' ');
      const temp = parts[0];
      const desc = parts.slice(1).join(' ');
      const tempEl = document.getElementById('berlinTemp');
      const descEl = document.getElementById('weatherDesc');
      if (tempEl) tempEl.innerText = temp;
      if (descEl) descEl.innerText = desc;
    })
    .catch(() => {
      const tempEl = document.getElementById('berlinTemp');
      if (tempEl) tempEl.innerText = "12°C"; // Fallback
    });
}

// ── Navbar & Interactions ───────────────────────
const translations = {
  tr: {
    nav_news: 'Haberler',
    nav_interviews: 'Röportajlar',
    nav_guide: 'Rehber',
    nav_contact: 'İletişim',
    hero_eyebrow: 'Dijital Medya Platformu',
    hero_line1: "Berlin'in Nabzı,",
    hero_line2: 'Sizin Sesiniz.',
    hero_sub: 'Sokak röportajları, güncel haberler ve şehir rehberi — hepsi bir arada.',
    hero_cta: 'Keşfet',
    news_tag: 'Güncel',
    news_title: 'Son Haberler',
    interviews_tag: 'Video',
    interviews_title: 'Röportajlar',
    yt_desc: 'Sokak röportajları, Berlin haberleri ve şehir yaşamı — hepsini kanalımızda izleyin.',
    yt_subscribe: 'Kanala Abone Ol →',
    guide_tag: 'Rehber',
    guide_title: 'Berlin Rehberi',
    guide_housing: 'Ev Bulma',
    guide_housing_desc: 'Kiralık ev arama, başvuru süreci ve ipuçları.',
    guide_official: 'Resmi İşlemler',
    guide_official_desc: 'Anmeldung, vize, çalışma izni ve daha fazlası.',
    guide_events: 'Etkinlikler',
    guide_events_desc: 'Haftalık kültür, sanat ve sosyal etkinlikler.',
    guide_transport: 'Ulaşım',
    guide_transport_desc: 'U-Bahn, S-Bahn, bilet çeşitleri ve rotalar.',
    guide_jobs: 'İş Bulmak',
    guide_jobs_desc: 'İş arama, CV hazırlama ve mülakat ipuçları.',
    guide_food: 'Yeme & İçme',
    guide_food_desc: 'En iyi restoranlar, kafeler ve gece hayatı.',
    footer_rights: 'Tüm hakları saklıdır.',
    ticker_label: 'SON DAKİKA',
    search_placeholder: 'Haber veya rehber ara...',
    filter_all: 'Tümü',
    filter_politics: 'Siyaset',
    filter_culture: 'Kültür',
    filter_economy: 'Ekonomi',
    filter_lifestyle: 'Yaşam',
    read_time: 'dk okuma',
    meta_title: "Berlin Konuşuyor — Berlin'in Nabzı, Sizin Sesiniz",
    meta_desc: "Berlin'in en güncel haberleri, sokak röportajları ve kapsamlı şehir rehberi. Berlin'deki Türk toplumu ve gurbetçiler için dijital medya platformu.",
    legal_impressum: "Impressum",
    legal_privacy: "Gizlilik Politikası",
    ai_dashboard_title: "Berlin AI Insight",
    widget_weather_title: "Hava Durumu & Vibe",
    widget_brief_title: "AI Haber Özeti",
    widget_time_title: "Berlin Saati",
    widget_time_desc: "Berlin'de hayat devam ediyor.",
    stat_subscribers: "Abone",
    stat_videos: "Video",
    stat_languages: "Dil",
    stat_reach: "Aylık Erişim",
    newsletter_tag: "Bülten",
    newsletter_title: "Berlin'den haberdar ol",
    newsletter_desc: "En güncel haberler, etkinlikler ve rehber içeriklerini doğrudan e-postanıza gönderin.",
    newsletter_placeholder: "E-posta adresiniz",
    newsletter_btn: "Abone Ol",
    newsletter_privacy: "Gizliliğinize saygı duyuyoruz. İstediğiniz zaman abonelikten çıkabilirsiniz.",
    map_tag: "Keşfet",
    map_title: "İnteraktif Şehir Haritası",
    map_desc: "Önemli lokasyonları, konsoloslukları ve Berlin'in ikonik mekanlarını harita üzerinde inceleyin.",
    events_cal_tag: "Takvim",
    events_cal_title: "Yaklaşan Etkinlikler",
    listen_news: "Dinle",
    read_time: "dk okuma"
  },
  de: {
    nav_news: 'Nachrichten',
    nav_interviews: 'Interviews',
    nav_guide: 'Stadtführer',
    nav_contact: 'Kontakt',
    hero_eyebrow: 'Digitale Medienplattform',
    hero_line1: 'Der Puls Berlins,',
    hero_line2: 'Eure Stimme.',
    hero_sub: 'Straßeninterviews, aktuelle Nachrichten und Stadtführer — alles an einem Ort.',
    hero_cta: 'Entdecken',
    news_tag: 'Aktuell',
    news_title: 'Neueste Nachrichten',
    interviews_tag: 'Video',
    interviews_title: 'Interviews',
    yt_desc: 'Straßeninterviews, Berlin-Nachrichten und Stadtleben — alles auf unserem Kanal.',
    yt_subscribe: 'Kanal Abonnieren →',
    guide_tag: 'Stadtführer',
    guide_title: 'Berlin Guide',
    guide_housing: 'Wohnungssuche',
    guide_housing_desc: 'Mietwohnungen suchen, Bewerbung und Tipps.',
    guide_official: 'Behördengänge',
    guide_official_desc: 'Anmeldung, Visum, Arbeitserlaubnis und mehr.',
    guide_events: 'Veranstaltungen',
    guide_events_desc: 'Wöchentliche Kultur-, Kunst- und Sozialevents.',
    guide_transport: 'Nahverkehr',
    guide_transport_desc: 'U-Bahn, S-Bahn, Fahrscheine und Routen.',
    guide_jobs: 'Jobsuche',
    guide_jobs_desc: 'Stellensuche, Lebenslauf und Bewerbungstipps.',
    guide_food: 'Essen & Trinken',
    guide_food_desc: 'Die besten Restaurants, Cafés und das Nachtleben.',
    footer_rights: 'Alle Rechte vorbehalten.',
    ticker_label: 'BREAKING NEWS',
    search_placeholder: 'Suchen...',
    filter_all: 'Alle',
    filter_politics: 'Politik',
    filter_culture: 'Kultur',
    filter_economy: 'Wirtschaft',
    filter_lifestyle: 'Lifestyle',
    read_time: 'Min. Lesezeit',
    meta_title: "Berlin Konuşuyor — Am Puls Berlins, Deine Stimme",
    meta_desc: "Aktuelle Nachrichten aus Berlin, Straßeninterviews und umfangreicher Stadtführer. Die digitale Plattform für die türkische Community.",
    legal_impressum: "Impressum",
    legal_privacy: "Datenschutzerklärung",
    ai_dashboard_title: "Berlin AI Insight",
    widget_weather_title: "Wetter & Vibe",
    widget_brief_title: "AI News Brief",
    widget_time_title: "Berlin Zeit",
    widget_time_desc: "Das Leben in Berlin geht weiter.",
    stat_subscribers: "Abonnenten",
    stat_videos: "Videos",
    stat_languages: "Sprachen",
    stat_reach: "Monatl. Reichweite",
    newsletter_tag: "Newsletter",
    newsletter_title: "Bleib informiert über Berlin",
    newsletter_desc: "Erhalte die neuesten Nachrichten, Veranstaltungen und Stadtführer direkt in dein E-Mail-Postfach.",
    newsletter_placeholder: "E-Mail-Adresse",
    newsletter_btn: "Abonnieren",
    newsletter_privacy: "Wir respektieren deine Privatsphäre. Du kannst dich jederzeit abmelden.",
    map_tag: "Entdecken",
    map_title: "Interaktiver Stadtplan",
    map_desc: "Entdecken Sie wichtige Orte, Konsulate und ikonische Berliner Schauplätze auf der Karte.",
    events_cal_tag: "Kalender",
    events_cal_title: "Anstehende Veranstaltungen",
    events_cal_desc: "Was ist dieses Wochenende in Berlin los?",
    listen_news: "Hören",
    read_time: "Min. Lesezeit"
  },
  en: {
    nav_news: 'News',
    nav_interviews: 'Interviews',
    nav_guide: 'City Guide',
    nav_contact: 'Contact',
    hero_eyebrow: 'Digital Media Platform',
    hero_line1: 'The Pulse of Berlin,',
    hero_line2: 'Your Voice.',
    hero_sub: 'Street interviews, breaking news and city guide — all in one place.',
    hero_cta: 'Explore',
    news_tag: 'Latest',
    news_title: 'Latest News',
    interviews_tag: 'Video',
    interviews_title: 'Interviews',
    yt_desc: 'Street interviews, Berlin news and city life — watch it all on our channel.',
    yt_subscribe: 'Subscribe to Channel →',
    guide_tag: 'Guide',
    guide_title: 'Berlin Guide',
    guide_housing: 'Finding a Home',
    guide_housing_desc: 'Apartment search, application process and tips.',
    guide_official: 'Official Procedures',
    guide_official_desc: 'Registration, visa, work permit and more.',
    guide_events: 'Events',
    guide_events_desc: 'Weekly culture, art and social events.',
    guide_transport: 'Transport',
    guide_transport_desc: 'U-Bahn, S-Bahn, tickets and routes.',
    guide_jobs: 'Finding Work',
    guide_jobs_desc: 'Job search, CV preparation and interview tips.',
    guide_food: 'Food & Drink',
    guide_food_desc: 'Best restaurants, cafés and nightlife.',
    footer_rights: 'All rights reserved.',
    ticker_label: 'LATEST NEWS',
    search_placeholder: 'Search for news...',
    filter_all: 'All',
    filter_politics: 'Politics',
    filter_culture: 'Culture',
    filter_economy: 'Economy',
    filter_lifestyle: 'Lifestyle',
    read_time: 'min read',
    meta_title: "Berlin Konuşuyor — Berlin's Pulse, Your Voice",
    meta_desc: "Latest Berlin news, street interviews, and comprehensive city guide. Digital media platform for global Berliners.",
    legal_impressum: "Imprint",
    legal_privacy: "Privacy Policy",
    ai_dashboard_title: "Berlin AI Insight",
    widget_weather_title: "Weather & Vibe",
    widget_brief_title: "AI News Brief",
    widget_time_title: "Berlin Time",
    widget_time_desc: "Life goes on in Berlin.",
    stat_subscribers: "Subscribers",
    stat_videos: "Videos",
    stat_languages: "Languages",
    stat_reach: "Monthly Reach",
    newsletter_tag: "Newsletter",
    newsletter_title: "Stay updated from Berlin",
    newsletter_desc: "Get the latest news, events and city guide content delivered to your inbox.",
    newsletter_placeholder: "Your email address",
    newsletter_btn: "Subscribe",
    newsletter_privacy: "We respect your privacy. Unsubscribe anytime.",
    map_tag: "Explore",
    map_title: "Interactive City Map",
    map_desc: "Explore important locations, consulates, and iconic Berlin spots on the map.",
    events_cal_tag: "Calendar",
    events_cal_title: "Upcoming Events",
    events_cal_desc: "What's happening in Berlin this weekend?",
    listen_news: "Listen",
  },
};

// ── Set Language ────────────────────────────
function setLanguage(lang) {
  const elements = document.querySelectorAll('[data-i18n]');
  const t = translations[lang];
  if (!t) return;

  elements.forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.textContent = t[key];
  });

  document.documentElement.lang = lang === 'tr' ? 'tr' : lang === 'de' ? 'de' : 'en';

  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key]) el.placeholder = t[key];
  });

  localStorage.setItem('bk-lang', lang);
  currentLang = lang;
  updateMeta(lang);
}

// ── Dynamic Meta UI Update ───────────────────
function updateMeta(lang) {
  const t = translations[lang];
  if (!t) return;

  // Title
  document.title = t.meta_title;
  
  // Meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', t.meta_desc);

  // Open Graph
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', t.meta_title);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', t.meta_desc);
}

// ── Dynamic News Loading ────────────────────
const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&q=80';
let globalNews = [];

function formatDate(isoDate) {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '';
  }
}


// ── News Rendering ──────────────────────────
// ── News Rendering ──────────────────────────
function renderNews(articles, category = 'all') {
  const container = document.getElementById('newsGrid');
  const countSpan = document.getElementById('newsCount');
  if (!container) return;

  const filtered = category === 'all' 
    ? articles 
    : articles.filter(a => a.category === category);

  if (countSpan) {
    const total = filtered.length;
    countSpan.textContent = `${total} ${translations[currentLang].news_title}`;
  }

  container.innerHTML = filtered.map((article, index) => {
    const readTime = calculateReadTime(article.description || article.summary_tr || article.title || '');
    return `
      <article class="news-card reveal" style="animation-delay: ${index * 0.1}s" onclick="openNewsModal(${index})">
        <div class="news-card-img" style="background-image: url('${article.image || PLACEHOLDER_IMG}')"></div>
        <div class="news-card-content">
          <div class="news-meta">
            <span class="news-source-tag">${article.source}</span>
            <span class="news-read-time">
              <i class="far fa-clock"></i> ${readTime} ${translations[currentLang].read_time}
            </span>
          </div>
          <h3 class="news-card-title">${article.summary_tr || article.title}</h3>
          <div class="news-card-actions">
            <button class="action-btn share-trigger" title="Paylaş" onclick="event.stopPropagation(); shareNews('${article.title.replace(/'/g, "\\'")}');"><i class="fas fa-share-alt"></i></button>
            <button class="action-btn bookmark-trigger" title="Kaydet" onclick="event.stopPropagation(); toggleBookmark(${index});"><i class="far fa-bookmark"></i></button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

window.shareNews = (title) => {
  if (navigator.share) {
    navigator.share({
      title: 'Berlin Konuşuyor',
      text: title,
      url: window.location.href
    }).catch(console.error);
  } else {
    alert('Paylaş: ' + title);
  }
};

window.toggleBookmark = (index) => {
  const btn = event.currentTarget;
  const icon = btn.querySelector('i');
  icon.classList.toggle('fas');
  icon.classList.toggle('far');
  console.log('Bookmarked article index:', index);
};

function calculateReadTime(text) {
  const wordsPerMinute = 200;
  const noOfWords = (text || '').trim().split(/\s+/).length || 1;
  const minutes = Math.ceil(noOfWords / wordsPerMinute);
  return minutes || 1;
}

function renderTicker(articles) {
  const ticker = document.getElementById('tickerContent');
  if (!ticker || !articles.length) return;

  const items = [...articles, ...articles].map((a, i) => `
    <span class="ticker-item" onclick="openNewsModal(${i % articles.length})">${a.summary_tr || a.title}</span>
  `).join('');

  ticker.innerHTML = items;
}

async function loadNews() {
  const grid = document.getElementById('newsGrid');
  if (grid) grid.innerHTML = '<div class="skeleton-card"></div>'.repeat(4);

  console.log('[News] loadNews triggered with DB:', db);
  if (!db) {
    console.warn('[News] DB not ready yet, retrying in 500ms...');
    setTimeout(loadNews, 500);
    return;
  }

  try {
    const q = query(collection(db, "news"), orderBy("date", "desc"));
    console.log('[News] Firestore query created.');
    
    onSnapshot(q, async (snapshot) => {
      let firestoreNews = [];
      snapshot.forEach((doc) => {
        firestoreNews.push({ id: doc.id, ...doc.data() });
      });

      if (firestoreNews.length === 0) {
        console.log('[News] Firestore empty, fetching local fallback...');
        const localRes = await fetch('/data/news.json');
        if (localRes.ok) {
          const localData = await localRes.json();
          firestoreNews = localData.articles || [];
        }
      }

      globalNews = firestoreNews;
      console.log(`[Firestore] Haber akışı güncellendi: ${globalNews.length} haber.`);
      renderNews(globalNews);
      renderTicker(globalNews);
      if (globalNews.length > 0) renderHeroFeatured(globalNews[0]);
      initBerlinPulse(globalNews);
    });

  } catch (err) {
    console.error('[News] Firestore error:', err);
    // Fallback if query fails
    fetch('/data/news.json').then(res => res.json()).then(data => {
      globalNews = data.articles || [];
      renderNews(globalNews);
      renderTicker(globalNews);
    });
  }
}

function getTimeAgo(isoDate) {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'az önce';
  if (mins < 60) return `${mins} dakika önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}

// ── Dynamic Events Loading ──────────────────
async function loadEvents() {
  console.log('[Events] loadEvents triggered with DB:', db);
  if (!db) {
    console.warn('[Events] DB not ready yet, retrying in 500ms...');
    setTimeout(loadEvents, 500);
    return;
  }

  try {
    const q = query(collection(db, "events"), orderBy("date", "asc"));
    
    onSnapshot(q, (snapshot) => {
      let firestoreEvents = [];
      snapshot.forEach((doc) => {
        firestoreEvents.push({ id: doc.id, ...doc.data() });
      });

      if (firestoreEvents.length > 0) {
        console.log(`[Firestore] ${firestoreEvents.length} etkinlik güncellendi.`);
        renderEvents(firestoreEvents);
        window.globalEvents = firestoreEvents;
      } else {
        console.log('[Events] Firestore empty, fetching local fallback...');
        fetch('/data/events.json').then(res => res.json()).then(data => {
          if (data.events) {
            renderEvents(data.events);
            window.globalEvents = data.events;
          }
        });
      }
    });
  } catch (err) {
    console.error('[Events] Firestore error:', err);
    // Fallback
    fetch('/data/events.json').then(res => res.json()).then(data => {
      if (data.events) renderEvents(data.events);
    });
  }
}
async function loadPodcasts() {
  try {
    const res = await fetch('/data/podcasts.json');
    if (!res.ok) throw new Error('Podcasts fetch failed');
    const data = await res.json();
    
    const grid = document.getElementById('podcastGrid');
    if (!grid || !data.podcasts) return;

    const html = data.podcasts.map(p => `
      <div class="yt-mini-card glass-panel" onclick="playPodcast('${p.title.replace(/'/g, "\\'")}', '${p.desc.replace(/'/g, "\\'")}', '${p.src}', '${p.thumbClass}')">
        <div class="yt-mini-thumb ${p.thumbClass}">
          <div class="yt-play-mini"><i class="fas fa-play"></i></div>
        </div>
        <span class="yt-mini-title">${p.title}</span>
      </div>
    `).join('');

    grid.innerHTML = html;
  } catch (err) {
    console.log('Podcast listesi yüklenemedi:', err);
  }
}

function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('.reveal, .reveal-small').forEach((el) => observer.observe(el));
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    e.preventDefault();

    const target = document.querySelector(targetId);
    if (target) {
      const offset = 80;
      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// ── Navbar scroll effect ────────────────────
function initNavbar() {
  const navbar = document.getElementById('navbar');

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    if (currentScroll > 100) {
      navbar.style.background = 'rgba(0, 0, 0, 0.95)';
    } else {
        navbar.style.background = 'rgba(0, 0, 0, 0.85)';
    }
  });
}

// ── Configuration ───────────────────────────
const APP_VERSION = '1.0.9-NUCLEAR';
console.info(`%c Berlin Konuşuyor %c v${APP_VERSION} `, 'background: #000; color: #fff; font-weight: bold;', 'background: #ff3e00; color: #fff;');

// ── Translations ─────────────────────────────
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (!hamburger || !navLinks) return;

  const toggleMenu = (forceClose = false) => {
    const isOpen = forceClose ? false : !navLinks.classList.contains('open');
    
    hamburger.classList.toggle('active', isOpen);
    navLinks.classList.toggle('open', isOpen);
    
    // Premium: Scroll Lock
    document.body.style.overflow = isOpen ? 'hidden' : '';
    
    // Optional: Close on backdrop click (if we had a separate backdrop, but nav-links is full screen)
  };

  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Close when clicking links
  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => toggleMenu(true));
  });

  // Close on window resize if larger than mobile
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && navLinks.classList.contains('open')) {
      toggleMenu(true);
    }
  });
}

function initMobileDock() {
  const dock = document.getElementById('mobileDock');
  const searchBtn = document.getElementById('dockSearchBtn');
  const aiBtn = document.getElementById('dockAiBtn');
  if (!dock) return;

  if (window.innerWidth > 768) {
    console.log('Mobile Dock: Hidden (Desktop Viewport)');
    return;
  }
  // Scroll visibility logic
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    if (window.innerWidth > 768) return;
    
    const currentScroll = window.pageYOffset;
    if (currentScroll <= 0) {
      dock.classList.remove('hidden');
      return;
    }

    if (currentScroll > lastScroll && !dock.classList.contains('hidden')) {
      // Scrolling down
      dock.classList.add('hidden');
    } else if (currentScroll < lastScroll && dock.classList.contains('hidden')) {
      // Scrolling up
      dock.classList.remove('hidden');
    }
    lastScroll = currentScroll;
  });

  // Dock functional buttons
  searchBtn?.addEventListener('click', () => {
    const searchToggle = document.getElementById('searchToggle');
    searchToggle?.click();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  aiBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const chatbot = document.getElementById('chatbot');
    if (chatbot) chatbot.classList.add('active');
  });

  // Highlight active link on click
  const dockItems = dock.querySelectorAll('.dock-item');
  dockItems.forEach(item => {
    item.addEventListener('click', () => {
      dockItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });
}

function initBerlinPulse(articles) {
  const container = document.getElementById('berlinPulse');
  if (!container) return;
  
  if (!articles || !articles.length) {
    console.warn('Berlin Pulse: No articles to render');
    return;
  }

  console.log(`Berlin Pulse: Initializing with ${articles.length} articles`);

  // Select top 6 dynamic topics/articles
  const pulsers = articles.slice(0, 6).map((article, index) => {
    let label = 'Berlin';
    const lowerTitle = article.title.toLowerCase();
    
    if (article.source === 'Anadolu Ajansı') label = 'Dünya';
    else if (lowerTitle.includes('union') || lowerTitle.includes('alba') || lowerTitle.includes('füchse')) label = 'Spor';
    else if (lowerTitle.includes('brand') || lowerTitle.includes('kaza')) label = 'Flaş';

    return `
      <div class="pulse-bubble" onclick="openNewsModal(${index})">
        <div class="pulse-avatar-wrapper">
          <div class="pulse-avatar" style="background-image: url('${article.image || 'https://images.unsplash.com/photo-1560969184-10fe8719e047?q=80&w=200&auto=format&fit=crop'}')"></div>
        </div>
        <span class="pulse-label">${label}: ${article.summary_tr || article.title}</span>
      </div>
    `;
  }).join('');

  container.innerHTML = pulsers;
}


// ── Language Switcher (Placeholder) ──

const BERLIN_HISTORY_EVENTS = [
  {
    date: "9 KASIM 1989",
    title: "Berlin Duvarı Yıkılıyor",
    text: "Soğuk Savaş'ın simgesi olan Berlin Duvarı, halkın baskısı ve yanlış anlaşılan bir basın açıklaması sonucu açıldı. Binlerce Doğu ve Batı Berlinli, Brandenburg Kapısı'nda kucaklaştı.",
    image: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?q=80&w=800&auto=format&fit=crop"
  },
  {
    date: "16 MART 1920",
    title: "Altın Yirmili Yıllar Başlıyor",
    text: "Berlin, sanatın ve eğlencenin dünya başkenti haline geldi. Bauhaus akımı, kabareler ve sinema şehre eşsiz bir ruh kattı.",
    image: "https://images.unsplash.com/photo-1549413204-c36399990818?q=80&w=800&auto=format&fit=crop"
  },
  {
    date: "27 ŞUBAT 1933",
    title: "Reichstag Yangını",
    text: "Alman Parlamento binası Reichstag'ın kundaklanması, ülkenin kaderini değiştiren karanlık bir dönemin başlangıcı oldu.",
    image: "https://images.unsplash.com/photo-1510443425977-889a7f347101?q=80&w=800&auto=format&fit=crop"
  },
  {
    date: "1 AĞUSTOS 1936",
    title: "Berlin Olimpiyatları",
    text: "Berlin, o güne kadar görülmüş en görkemli olimpiyatlara ev sahipliği yaptı. Jesse Owens'ın başarısı tarihe geçti.",
    image: "https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=800&auto=format&fit=crop"
  },
  {
    date: "24 HAZİRAN 1948",
    title: "Berlin Hava Köprüsü",
    text: "Sovyet ablukası altındaki Batı Berlin'e müttefik uçakları tarafından aylar boyu gıda ve kömür taşındı. 'Şeker Bombacıları' efsanesi doğdu.",
    image: "https://images.unsplash.com/photo-1524338198850-8a2ff63aaceb?q=80&w=800&auto=format&fit=crop"
  }
];

function initShakeHistory() {
  const modal = document.getElementById('historyModal');
  const hint = document.getElementById('shakeHint');
  let shakeThreshold = 15;
  let lastX, lastY, lastZ;
  let lastUpdate = 0;
  let isShaking = false;

  // Show hint after 10s on mobile once
  if (window.innerWidth < 768) {
    setTimeout(() => {
      if (!localStorage.getItem('bk-shake-hint-shown')) {
        hint?.classList.add('visible');
        setTimeout(() => hint?.classList.remove('visible'), 5000);
        localStorage.setItem('bk-shake-hint-shown', 'true');
      }
    }, 10000);
  }

  const handleMotion = (event) => {
    const acceleration = event.accelerationIncludingGravity;
    const curTime = Date.now();

    if ((curTime - lastUpdate) > 100) {
      const diffTime = curTime - lastUpdate;
      lastUpdate = curTime;

      const x = acceleration.x;
      const y = acceleration.y;
      const z = acceleration.z;

      const speed = Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime * 10000;

      if (speed > shakeThreshold && !isShaking && !modal.classList.contains('active')) {
        isShaking = true;
        triggerHistoryPortal();
        setTimeout(() => { isShaking = false; }, 2000);
      }

      lastX = x;
      lastY = y;
      lastZ = z;
    }
  };

  // Permission handling for iOS
  const requestPermission = () => {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission()
        .then(response => {
          if (response === 'granted') {
            window.addEventListener('devicemotion', handleMotion);
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener('devicemotion', handleMotion);
    }
  };

  // Trigger on user interaction to satisfy iOS
  document.addEventListener('click', requestPermission, { once: true });

  window.triggerHistoryPortal = () => {
    const event = BERLIN_HISTORY_EVENTS[Math.floor(Math.random() * BERLIN_HISTORY_EVENTS.length)];
    
    document.getElementById('historyDate').textContent = event.date;
    document.getElementById('historyTitle').textContent = event.title;
    document.getElementById('historyText').textContent = event.text;
    document.getElementById('historyImage').style.backgroundImage = `url('${event.image}')`;
    
    modal.classList.add('active');
    const container = modal.querySelector('.history-portal-container');
    container.classList.add('portal-open');
    
    // Haptic feedback if available
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
  };

  window.closeHistoryModal = () => {
    modal.classList.remove('active');
    modal.querySelector('.history-portal-container').classList.remove('portal-open');
  };
}

function initSwipeToDismiss() {
  const modals = document.querySelectorAll('.modal, .news-modal');
  
  modals.forEach(modal => {
    const content = modal.querySelector('.modal-container, .modal-content, .news-modal-content, .history-portal-container');
    if (!content) return;

    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    content.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
      isDragging = true;
      content.style.transition = 'none';
    }, { passive: true });

    content.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      currentY = e.touches[0].clientY - startY;

      if (currentY > 0) {
        // Apply resistance (rubber-band effect)
        const resistance = 0.4;
        const translateY = currentY * resistance;
        content.style.transform = `translateY(${translateY}px) scale(${1 - translateY / 2000})`;
        modal.style.backgroundColor = `rgba(0, 0, 0, ${0.8 - translateY / 1000})`;
      }
    }, { passive: true });

    content.addEventListener('touchend', () => {
      if (!isDragging) return;
      isDragging = false;
      content.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

      if (currentY > 150) {
        // Dismiss
        if (modal.id === 'newsModal') closeNewsModal();
        else if (modal.id === 'historyModal') closeHistoryModal();
        else {
          modal.classList.remove('active');
          document.body.style.overflow = '';
        }
      }

      // Reset
      content.style.transform = '';
      modal.style.backgroundColor = '';
      currentY = 0;
    });
  });
}

// ── Language Switcher ───────────────────────
function initLangSwitcher() {
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
    setLanguage('tr'); // Default language
  }
}

// ── Legal Modals ─────────────────────────────
const legalDocs = {
  tr: {
    impressum: `
      <h2>Impressum (Künye)</h2>
      <p><strong>Berlin Konuşuyor Medya</strong></p>
      <p>Berlin, Almanya</p>
      <p><strong>Sorumlu:</strong> Berlin Konuşuyor Ekibi</p>
      <p><strong>İletişim:</strong> info@berlinkonusuyor.com</p>
      <h3>Yasal Uyarı</h3>
      <p>İçeriklerimizin izinsiz kopyalanması yasaktır. Harici linklerin içeriğinden sorumlu değiliz.</p>
    `,
    privacy: `
      <h2>Gizlilik Politikası</h2>
      <p>Kullanıcı verileriniz AB Veri Koruma Yönetmeliği (DSGVO) uyarınca korunmaktadır.</p>
      <p><strong>Çerezler:</strong> Sitemiz sadece teknik olarak gerekli çerezleri kullanır.</p>
      <p><strong>Haklarınız:</strong> Verilerinize erişme, düzeltme ve silme hakkına sahipsiniz.</p>
    `
  },
  de: {
    impressum: `
      <h2>Impressum</h2>
      <p><strong>Berlin Konuşuyor Media</strong></p>
      <p>Berlin, Deutschland</p>
      <p><strong>Verantwortlich für den Inhalt:</strong> Team Berlin Konuşuyor</p>
      <p><strong>Kontakt:</strong> info@berlinkonusuyor.com</p>
      <h3>Haftungsausschluss</h3>
      <p>Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links.</p>
    `,
    privacy: `
      <h2>Datenschutzerklärung</h2>
      <p>Der Schutz Ihrer persönlichen Daten ist uns ein wichtiges Anliegen.</p>
      <h3>DSGVO Konformität</h3>
      <p>Wir verarbeiten Daten gemäß der Datenschutz-Grundverordnung (DSGVO).</p>
      <p><strong>Cookies:</strong> Wir verwenden nur technisch notwendige Cookies.</p>
    `
  },
  en: {
    impressum: `
      <h2>Imprint</h2>
      <p><strong>Berlin Konuşuyor Media</strong></p>
      <p>Berlin, Germany</p>
      <p><strong>Responsible:</strong> Berlin Konuşuyor Team</p>
      <p><strong>Contact:</strong> info@berlinkonusuyor.com</p>
      <h3>Disclaimer</h3>
      <p>We do not assume liability for the content of external links.</p>
    `,
    privacy: `
      <h2>Privacy Policy</h2>
      <p>Your privacy is important to us. We comply with GDPR regulations.</p>
      <p><strong>Cookies:</strong> We use only strictly necessary cookies.</p>
    `
  }
};

window.openLegal = (type) => {
  const lang = localStorage.getItem('bk-lang') || 'tr';
  const content = legalDocs[lang][type] || legalDocs['en'][type];
  document.getElementById('legalContent').innerHTML = content;
  document.getElementById('legalModal').classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.closeLegal = () => {
  document.getElementById('legalModal').classList.remove('active');
  document.body.style.overflow = '';
};

window.openNewsModal = (index) => {
  const article = globalNews[index];
  if (!article) return;
  
  document.getElementById('newsModalImg').style.backgroundImage = `url('${article.image || PLACEHOLDER_IMG}')`;
  document.getElementById('newsModalTitle').innerText = article.summary_tr || article.title;
  document.getElementById('newsModalSource').innerText = article.source;
  document.getElementById('newsModalDate').innerText = formatDate(article.date);
  document.getElementById('newsModalDesc').innerText = article.description || 'Haberin devamı için kaynağa gidiniz.';
  document.getElementById('newsModalLink').href = article.url;
  const modal = document.getElementById('newsModal');
  modal.style.display = 'block';
  setTimeout(() => modal.classList.add('active'), 10);
  document.body.style.overflow = 'hidden';
};

window.closeNewsModal = () => {
  const modal = document.getElementById('newsModal');
  modal.classList.remove('active');
  setTimeout(() => {
    modal.style.display = 'none';
    document.body.style.overflow = '';
    stopTTS();
  }, 400);
};

// Close modal on click outside
window.onclick = (event) => {
  const legalModal = document.getElementById('legalModal');
  const newsModal = document.getElementById('newsModal');
  const loginModal = document.getElementById('loginModal');
  if (event.target == legalModal) closeLegal();
  if (event.target == newsModal) closeNewsModal();
  if (event.target == loginModal) closeLoginModal();
};

// ── Podcast Audio Player ────────────────────
const mainAudio = document.getElementById('mainAudio');
const podcastPlayer = document.getElementById('podcastPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const progressFill = document.getElementById('progressFill');
const progressBg = document.getElementById('progressBg');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');

let isCurrentlyPlaying = false;

window.playPodcast = (title, desc, audioUrl, thumbClass) => {
  document.getElementById('playerTitle').innerText = title;
  document.getElementById('playerDesc').innerText = desc;
  
  const thumb = document.getElementById('playerThumb');
  thumb.className = `player-thumb ${thumbClass}`; // carry over the background class

  mainAudio.src = audioUrl;
  mainAudio.load();
  mainAudio.play();
  
  isCurrentlyPlaying = true;
  updatePlayBtnIcon();
  podcastPlayer.classList.add('active');
};

window.closePodcast = () => {
  podcastPlayer.classList.remove('active');
  mainAudio.pause();
  isCurrentlyPlaying = false;
  updatePlayBtnIcon();
};

window.togglePlay = () => {
  if (mainAudio.paused) {
    mainAudio.play();
    isCurrentlyPlaying = true;
  } else {
    mainAudio.pause();
    isCurrentlyPlaying = false;
  }
  updatePlayBtnIcon();
};

window.skipPodcast = (seconds) => {
  mainAudio.currentTime += seconds;
};

function updatePlayBtnIcon() {
  if (isCurrentlyPlaying) {
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    playPauseBtn.classList.add('playing');
  } else {
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    playPauseBtn.classList.remove('playing');
  }
}

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

if (mainAudio) {
  mainAudio.addEventListener('timeupdate', () => {
    const cur = mainAudio.currentTime;
    const dur = mainAudio.duration;
    currentTimeEl.innerText = formatTime(cur);
    if (dur) {
      totalTimeEl.innerText = formatTime(dur);
      progressFill.style.width = `${(cur / dur) * 100}%`;
    }
  });

  mainAudio.addEventListener('ended', () => {
    isCurrentlyPlaying = false;
    updatePlayBtnIcon();
  });

  progressBg?.addEventListener('click', (e) => {
    const rect = progressBg.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    mainAudio.currentTime = pos * mainAudio.duration;
  });
}


// ── Text-to-Speech (TTS) ───────────────────
let synth = window.speechSynthesis;
let isSpeaking = false;

window.toggleTTS = () => {
  const ttsBtn = document.getElementById('ttsBtn');
  const titleEl = document.getElementById('newsModalTitle');
  const descEl = document.getElementById('newsModalDesc');
  if (!titleEl || !descEl) return;
  const title = titleEl.innerText;
  const desc = descEl.innerText;
  
  if (!synth) return;

  if (isSpeaking) {
    synth.cancel();
    isSpeaking = false;
    if(ttsBtn) ttsBtn.innerHTML = '<i class="fas fa-volume-up"></i> <span data-i18n="listen_news">Dinle</span>';
    return;
  }

  const textToRead = title + '. ' + desc;
  const utterance = new SpeechSynthesisUtterance(textToRead);
  utterance.lang = localStorage.getItem('bk-lang') === 'tr' ? 'tr-TR' : localStorage.getItem('bk-lang') === 'de' ? 'de-DE' : 'en-US';
  
  utterance.onend = () => {
    isSpeaking = false;
    if(ttsBtn) ttsBtn.innerHTML = '<i class="fas fa-volume-up"></i> <span data-i18n="listen_news">Dinle</span>';
  };

  synth.speak(utterance);
  isSpeaking = true;
  if(ttsBtn) ttsBtn.innerHTML = '<i class="fas fa-stop"></i> <span data-i18n="listen_stop">Durdur</span>';
};

window.stopTTS = () => {
  if (synth && isSpeaking) {
    synth.cancel();
    isSpeaking = false;
    const ttsBtn = document.getElementById('ttsBtn');
    if (ttsBtn) ttsBtn.innerHTML = '<i class="fas fa-volume-up"></i> <span data-i18n="listen_news">Dinle</span>';
  }
};

// ── User Auth (Mock LocalStorage) ───────────
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const loginView = document.getElementById('loginView');
const profileView = document.getElementById('profileView');

function checkAuthStatus(user) {
  const profileEmail = document.getElementById('profileEmail');
  const loginBtn = document.getElementById('loginBtn');
  if (user) {
    if(loginBtn) { 
      loginBtn.innerHTML = '<i class="fas fa-user-circle"></i> Profil';
      loginBtn.onclick = () => window.location.href = '/profile.html';
    }
    if(profileEmail) { profileEmail.textContent = user.email; }
  } else {
    if(loginBtn) { 
      loginBtn.innerHTML = 'Giriş Yap';
      loginBtn.onclick = () => openLoginModal();
    }
  }
}

// 1. Firebase Auth State Listener
onAuthStateChanged(auth, (user) => {
  checkAuthStatus(user);
});

window.openLoginModal = () => {
  const user = auth.currentUser;
  if(user) {
    loginView.style.display = 'none';
    profileView.style.display = 'block';
  } else {
    loginView.style.display = 'block';
    profileView.style.display = 'none';
  }
  
  loginModal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.closeLoginModal = () => {
  loginModal.classList.remove('active');
  document.body.style.overflow = '';
};

window.mockLogin = async () => {
  const btn = loginView.querySelector('button');
  const orgHtml = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Bağlanıyor...';
  
  try {
    await signInWithPopup(auth, googleProvider);
    closeLoginModal();
  } catch (err) {
    console.error("Login Error:", err);
    alert("Giriş başarısız oldu. Lütfen tekrar deneyin.");
  } finally {
    btn.innerHTML = orgHtml;
  }
};

window.mockLogout = async () => {
  try {
    await signOut(auth);
    closeLoginModal();
  } catch (err) {
    console.error("Logout Error:", err);
  }
};

// Check on load
// Eliminated old DOMContentLoaded trigger for auth check as onAuthStateChanged handles it


// ── Community Q&A Forum (LocalStorage) ──────
// ── Community Q&A Forum (Enhanced with Categories & Replies) ──────
function initQAForum() {
  const qaForm = document.getElementById('qaForm');
  const qaFeed = document.getElementById('qaFeed');
  const qaFilters = document.querySelectorAll('.qa-filter-btn');
  const qaSortBtns = document.querySelectorAll('.qa-sort-btn');
  
  if (!qaForm || !qaFeed) return;

  let questions = [];
  let currentCategory = 'all';
  let currentSort = 'newest';

  // 1. Listen to Firestore "forum" collection
  const q = query(collection(db, "forum"), orderBy("time", "desc"));
  
  onSnapshot(q, (snapshot) => {
    questions = [];
    snapshot.forEach((doc) => {
      questions.push({ id: doc.id, ...doc.data() });
    });
    
    // Fallback defaults if firestore is totally empty
    if (questions.length === 0) {
      questions = [
        { 
          id: 'default1', 
          name: 'Ahmet Y.', 
          text: 'Merhaba, Kreuzberg civarında uygun fiyatlı ve nezih bir kiralık ev bulmak için hangi siteleri önerirsiniz?', 
          time: new Date(Date.now() - 7200000).toISOString(), 
          karma: 14, 
          category: 'Ev & Kira',
          replies: [
            { name: 'BerlinGezgini', text: 'Immobilienscout24 ve WG-Gesucht klasik ama en iyileridir.', time: new Date(Date.now() - 3600000).toISOString() }
          ]
        }
      ];
    }
    renderFeed();
  });

  function getTimeAgo(dateStr) {
    try {
      const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
      if (seconds < 60) return 'Az önce';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes} dk önce`;
      const hrs = Math.floor(minutes / 60);
      if (hrs < 24) return `${hrs} sa önce`;
      return `${Math.floor(hrs / 24)} gün önce`;
    } catch(e) { return '...'; }
  }

  function renderFeed() {
    let filtered = [...questions];
    if (currentCategory !== 'all') {
      filtered = filtered.filter(q => q.category === currentCategory);
    }

    if (currentSort === 'newest') {
      filtered.sort((a, b) => new Date(b.time) - new Date(a.time));
    } else {
      filtered.sort((a, b) => (b.karma + (b.replies?.length || 0)) - (a.karma + (a.replies?.length || 0)));
    }

    qaFeed.innerHTML = filtered.map(q => `
      <div class="qa-card glass-panel reveal-small" data-id="${q.id}">
        <div class="qa-header">
          <div class="qa-author-box">
            <div class="qa-avatar">${q.name.charAt(0).toUpperCase()}</div>
            <div>
              <div class="qa-author">${q.name}</div>
              <div class="qa-time">${getTimeAgo(q.time)}</div>
            </div>
          </div>
          <span class="qa-badge-category">${q.category || 'Genel'}</span>
        </div>
        <div class="qa-body">${q.text}</div>
        
        ${q.replies && q.replies.length > 0 ? `
          <div class="qa-replies-section">
            ${q.replies.map(r => `
              <div class="qa-reply-item">
                <div class="qa-reply-author"><strong>${r.name}</strong> • ${getTimeAgo(r.time)}</div>
                <div class="qa-reply-text">${r.text}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="qa-actions">
          <button class="qa-action-btn upvote" onclick="window.upvoteQA('${q.id}')"><i class="fas fa-arrow-up"></i> ${q.karma}</button>
          <button class="qa-action-btn reply-toggle" onclick="window.toggleReplyForm('${q.id}')"><i class="far fa-comment-alt"></i> ${q.replies?.length || 0} Yanıt</button>
        </div>

        <div class="qa-reply-form-wrapper" id="reply-form-${q.id}" style="display:none">
          <div class="qa-reply-input-group">
            <input type="text" placeholder="Adınız" class="reply-name-input" id="reply-name-${q.id}">
            <textarea placeholder="Yanıtınızı yazın..." class="reply-text-input" id="reply-text-${q.id}"></textarea>
            <button class="reply-submit-btn" onclick="window.submitReply('${q.id}')">Gönder</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  window.upvoteQA = async (id) => {
    const qDoc = doc(db, "forum", id);
    try {
      await updateDoc(qDoc, {
        karma: increment(1)
      });
    } catch(e) { console.error('Upvote failed:', e); }
  };

  window.toggleReplyForm = (id) => {
    const form = document.getElementById(`reply-form-${id}`);
    if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
  };

  window.submitReply = async (id) => {
    const nameInput = document.getElementById(`reply-name-${id}`);
    const textInput = document.getElementById(`reply-text-${id}`);
    const name = nameInput.value.trim() || 'Anonim';
    const text = textInput.value.trim();

    if (!text) return;

    const qDoc = doc(db, "forum", id);
    const q = questions.find(x => x.id === id);
    if (q) {
      const newReplies = [...(q.replies || []), { 
        name, 
        text, 
        time: new Date().toISOString() 
      }];
      try {
        await updateDoc(qDoc, { replies: newReplies });
        nameInput.value = '';
        textInput.value = '';
        window.toggleReplyForm(id);
      } catch(e) { console.error('Reply failed:', e); }
    }
  };

  qaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('qaName');
    const textInput = document.getElementById('qaQuestion');
    const categorySelect = document.getElementById('qaCategory');
    const btn = qaForm.querySelector('.qa-submit');

    if(!textInput.value.trim()) return;

    const newQ = {
      name: nameInput.value.trim() || 'Anonim',
      text: textInput.value.trim(),
      category: categorySelect ? categorySelect.value : 'Genel',
      time: new Date().toISOString(),
      karma: 0,
      replies: []
    };

    try {
      console.log('[Forum] Soru gönderiliyor...', newQ);
      await addDoc(collection(db, "forum"), newQ);
      console.log('[Forum] Soru başarıyla eklendi.');
      
      textInput.value = '';
      nameInput.value = '';
      const org = btn.innerHTML;
      btn.innerHTML = 'Gönderildi <i class="fas fa-check"></i>';
      btn.style.background = '#22c55e';
      setTimeout(() => {
        btn.innerHTML = org;
        btn.style.background = '';
      }, 2000);
    } catch(err) {
      console.error('[Forum] Gönderim hatası:', err);
      alert('Soru gönderilemedi: ' + err.message);
    }
  });

  // Filter Event Listeners
  if (qaFilters) {
    qaFilters.forEach(btn => {
      btn.addEventListener('click', () => {
        qaFilters.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        renderFeed();
      });
    });
  }

  // Sort Event Listeners
  if (qaSortBtns) {
    qaSortBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        qaSortBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSort = btn.dataset.sort;
        renderFeed();
      });
    });
  }

  renderFeed();
}

// ── Job Board Module (Phase 4 Extension) ─────
async function initJobBoard() {
  const jobsGrid = document.getElementById('jobsGrid');
  if (!jobsGrid) return;

  const jobFilters = document.querySelectorAll('.job-filter-btn');
  let currentJobType = 'all';

  onSnapshot(query(collection(db, "jobs"), orderBy("createdAt", "desc")), (snapshot) => {
    let jobs = [];
    snapshot.forEach(doc => jobs.push({ id: doc.id, ...doc.data() }));
    renderJobs(jobs);
  });

  function renderJobs(jobs) {
    let filtered = currentJobType === 'all' ? jobs : jobs.filter(j => j.type === currentJobType);
    
    if (filtered.length === 0) {
      jobsGrid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Henüz ilan yok. İlk ilanı sen Ver!</div>';
      return;
    }

    jobsGrid.innerHTML = filtered.map(job => `
      <div class="job-card reveal-small">
        <span class="job-badge">${job.type}</span>
        <h3 class="job-title">${job.title}</h3>
        <p class="job-company">${job.company}</p>
        <div class="job-meta">
          <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
          <span><i class="fas fa-calendar-alt"></i> ${job.createdAt?.toDate ? formatDate(job.createdAt.toDate()) : 'Bugün'}</span>
        </div>
        <a href="mailto:${job.contact}" class="job-apply-btn">Başvur / İletişime Geç</a>
      </div>
    `).join('');
  }

  jobFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      jobFilters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentJobType = btn.dataset.type;
      // Re-render handled by snapshot naturally if we kept jobs in scope, but for simplicity:
      getDocs(collection(db, "jobs")).then(snap => {
        let jobs = [];
        snap.forEach(doc => jobs.push({ id: doc.id, ...doc.data() }));
        renderJobs(jobs);
      });
    });
  });
}

window.openJobModal = () => {
  if (!auth.currentUser) {
    alert("İlan vermek için giriş yapmalısınız.");
    openLoginModal();
    return;
  }
  const title = prompt("İş Başlığı (örn: Garson):");
  const company = prompt("Şirket/Mekan Adı:");
  const location = prompt("Bölge (örn: Kreuzberg):");
  const type = prompt("İş Tipi (Tam Zamanlı, Yarı Zamanlı, Minijob):", "Tam Zamanlı");
  const contact = prompt("İletişim E-postası:");

  if (title && company && contact) {
    addDoc(collection(db, "jobs"), {
      title, company, location, type, contact,
      postedBy: auth.currentUser.uid,
      createdAt: serverTimestamp()
    }).then(() => {
      alert("İlanınız başarıyla eklendi.");
    }).catch(err => console.error(err));
  }
};

// ── Bookmark System ─────────────────────────
window.toggleBookmark = async (id, type) => {
  if (!auth.currentUser) {
    alert("Kaydetmek için giriş yapmalısınız.");
    openLoginModal();
    return;
  }

  const userRef = doc(db, "users", auth.currentUser.uid);
  // Simple check via localStorage for UI speed, but should be Firestore based
  let bookmarks = JSON.parse(localStorage.getItem(`bookmarks_${auth.currentUser.uid}`) || '[]');
  
  if (bookmarks.includes(id)) {
    bookmarks = bookmarks.filter(b => b !== id);
    alert("Kaydedilenlerden kaldırıldı.");
  } else {
    bookmarks.push(id);
    alert("Kaydedildi!");
  }
  
  localStorage.setItem(`bookmarks_${auth.currentUser.uid}`, JSON.stringify(bookmarks));
  await updateDoc(userRef, { bookmarks }).catch(async (err) => {
    // If user doc doesn't exist, create it (not ideal here, but common for simple setup)
    if (err.code === 'not-found') {
      // Create user doc logic
    }
  });
};

// ── AI Chatbot Assistant (Knowledge-Base Powered) ──────────
const BERLIN_KB = [
  { keys: ['anmeldung','adres','kayıt','registration','adresse','anmelden'], answer: '📋 **Anmeldung (Adres Kaydı)**\n\nBerlin\'e taşındıktan sonra **14 gün içinde** Bürgeramt\'a gidip adres kaydı yaptırmanız gerekir.\n\n🔹 Gerekli belgeler:\n• Kimlik/Pasaport\n• Kira sözleşmesi\n• Wohnungsgeberbestätigung (ev sahibinden onay formu)\n\n🔹 Online randevu: service.berlin.de\n\n💡 İpucu: Randevu bulmak zor olabilir. Her sabah 08:00\'da yeni randevular açılır!' },
  { keys: ['ev','kira','wohnung','daire','kiralık','ev bulma','mietwohnung','housing'], answer: '🏠 **Berlin\'de Ev Bulma**\n\nPopüler arama siteleri:\n• immobilienscout24.de\n• wg-gesucht.de (paylaşımlı ev)\n• ebay-kleinanzeigen.de\n• immowelt.de\n\n🔹 Ortalama kira (soğuk):\n• 1+1: 600-900€\n• 2+1: 900-1.300€\n• WG odası: 400-650€\n\n💡 İpucu: Schufa (kredi raporu) hazır bulundurun. Başvurularda öz-tanıtım mektubu çok işe yarar!' },
  { keys: ['vize','visum','visa','oturum','çalışma izni','aufenthaltstitel','blue card','mavi kart'], answer: '🛂 **Vize & Oturum İzni**\n\n🔹 Türk vatandaşları için:\n• Turist vizesi: Schengen vizesi (90 gün)\n• Çalışma vizesi: İş teklifi + Ausländerbehörde başvurusu\n• Mavi Kart (Blue Card): Üniversite diploması + yıllık min. ~43.800€ maaş\n\n🔹 Ausländerbehörde randevu:\notv.verwalt-berlin.de\n\n💡 İpucu: Başvuru öncesi tüm belgelerin noter onaylı çevirilerini hazırlayın.' },
  { keys: ['ulaşım','transport','bvg','u-bahn','s-bahn','bilet','fahrkarte','ticket','metro'], answer: '🚇 **Berlin Ulaşım Rehberi**\n\n🔹 Bilet türleri (AB Bölgesi):\n• Tek bilet: 3.20€\n• Günlük: 9.50€\n• Aylık: 86€\n• Deutschland-Ticket: 49€/ay (tüm Almanya!)\n\n🔹 Uygulamalar: BVG app, DB Navigator\n\n💡 İpucu: Deutschland-Ticket (49€) en mantıklı seçenek — bütün şehir içi + bölgesel trenlerde geçerli!' },
  { keys: ['iş','job','arbeit','çalışmak','maaş','gehalt','iş bulma','bewerbung'], answer: '💼 **Berlin\'de İş Bulma**\n\nPopüler iş arama platformları:\n• linkedin.com\n• indeed.de\n• stepstone.de\n• xing.com\n• arbeitsagentur.de\n\n🔹 Ortalama maaşlar (brüt):\n• IT Uzmanı: 55-75k€\n• Gastronomi: 28-35k€\n• Ofis işleri: 35-50k€\n\n💡 İpucu: Almanca bilmek büyük avantaj! VHS (Volkshochschule) kursları oldukça uygun fiyatlı.' },
  { keys: ['yeme','restoran','restaurant','yemek','cafe','kafe','döner','türk','essen','food'], answer: '🍽️ **Yeme & İçme Rehberi**\n\nKreuzberg\'in en iyileri:\n• Hasır (Adalbertstr.) — Klasik Türk mutfağı\n• Mustafa\'s Gemüse Kebap — Efsanevi döner\n• Five Elephant — Specialty kahve\n• Markthalle Neun — Street food cenneti\n\n🔹 Neukölln:\n• Sonnenallee ("Arap Sokağı") — Ortadoğu lezzetleri\n• Lavanderia Vecchia — İtalyan fine dining\n\n💡 İpucu: Öğle yemeklerinde "Mittagstisch" menülerine bakın — 7-12€ arası!' },
  { keys: ['sağlık','arzt','doktor','hastane','sigorta','versicherung','krankenhaus','health'], answer: '🏥 **Sağlık Sistemi**\n\n🔹 Sigorta:\n• Zorunlu sağlık sigortası (gesetzliche KV): TK, AOK, Barmer\n• Aylık: Maaşın ~%14.6\'sı (yarısını işveren öder)\n\n🔹 Acil durumlar:\n• Acil: 112 numarayı arayın\n• Ärztlicher Bereitschaftsdienst: 116 117\n\n💡 İpucu: Doctolib uygulaması ile kolayca doktor randevusu alabilirsiniz.' },
  { keys: ['dil','almanca','deutsch','sprache','kurs','öğrenmek','lernen','language'], answer: '📚 **Almanca Öğrenme**\n\nÜcretsiz/uygun kaynaklar:\n• VHS (Volkshochschule) — dönemlik kurslar (~100-200€)\n• DW (Deutsche Welle) — ücretsiz online kurs\n• Goethe Institut — profesyonel kurslar\n• Tandem dil uygulamaları\n\n🔹 Önemli seviyeler:\n• A1-A2: Günlük yaşam\n• B1: Oturum izni için gerekli\n• B2-C1: İş dünyası\n\n💡 İpucu: Kreuzberg ve Neukölln\'de Türkçe konuşanlar çok ama Almanca pratik için Prenzlauer Berg idealdir!' },
  { keys: ['gece','nightlife','club','party','techno','berghain','bar','eğlence'], answer: '🎶 **Berlin Gece Hayatı**\n\nEfsanevi kulüpler:\n• Berghain/Panorama Bar — Techno tapınağı\n• Tresor — Endüstriyel techno\n• Watergate — Spree nehri manzaralı\n• KitKat Club — Öncü\n• Sisyphos — Açık hava partisi\n\n💡 İpucu: Berghain\'e giriş garanti değil! Sade giyinin, küçük gruplarla gidin ve Almanca konuşun.' },
  { keys: ['hava','wetter','weather','sıcaklık','yağmur','mevsim'], answer: '🌤️ **Berlin Hava Durumu**\n\nMevsimsel ortalamalar:\n• Yaz (Haz-Ağu): 20-30°C, uzun günler\n• Kış (Kas-Şub): -5 ile 5°C, erken karanlık\n• İlkbahar/Sonbahar: 8-18°C, değişken\n\n💡 İpucu: Kış çok karanlık olabilir, D vitamini almanız önerilir. Yaz aylarında parklar ve göller harikadır!' },
  { keys: ['banka','konto','hesap','bank','n26','finans'], answer: '🏦 **Banka Hesabı Açma**\n\nPopüler bankalar:\n• N26 — %100 online, hızlı açılım\n• Deutsche Bank — Geleneksel\n• Commerzbank — Yaygın ATM ağı\n• ING — Ücretsiz Girokonto\n\n🔹 Gerekli belgeler:\n• Kimlik/Pasaport\n• Anmeldung belgesi\n• Bazen Schufa (kredi raporu)\n\n💡 İpucu: N26 veya Wise ile Anmeldung\'dan bile önce hesap açabilirsiniz!' },
  { keys: ['kültür','museum','müze','sanat','kultur','galeri','ausstellung'], answer: '🎭 **Kültür & Müzeler**\n\nÜcretsiz/indirimli müzeler:\n• Museumsinsel (UNESCO) — kombi bilet 22€\n• East Side Gallery — ücretsiz\n• Gedenkstätte Berliner Mauer — ücretsiz\n• Her ayın ilk Pazar günü birçok müze ücretsiz!\n\n💡 İpucu: Museum Pass Berlin (3 gün) 36€ — 30+ müzeye giriş!' },
  { keys: ['çocuk','kita','kreş','okul','schule','kindergarten','aile'], answer: '👶 **Çocuk & Eğitim**\n\nBerlin\'de Kita (kreş):\n• Başvuru: kita-navigator.berlin.de\n• 0-6 yaş arası ücretsiz (son yıl zorunlu)\n• Erken başvuru yapın — bekleme listesi uzun!\n\n🔹 Okullar:\n• Devlet okulları ücretsiz\n• Türk-Alman Eğitim Merkezi Kreuzberg\'de\n\n💡 İpucu: Kita başvurusunu doğumdan hemen sonra yapın!' },
  { keys: ['merhaba','selam','hello','hi','hey','naber','nasılsın'], answer: 'Merhaba! 👋 Ben Berlin Konuşuyor Asistanı. Size Berlin hakkında her konuda yardımcı olabilirim.\n\nŞu konularda sorular sorabilirsiniz:\n📋 Anmeldung & Resmi işlemler\n🏠 Ev bulma\n🛂 Vize & Oturum\n🚇 Ulaşım\n💼 İş arama\n🍽️ Yeme & İçme\n🎶 Gece hayatı\n\nYa da aşağıdaki hızlı butonları kullanın!' },
  { keys: ['teşekkür','sağol','danke','thanks','eyvallah'], answer: 'Rica ederim! 😊 Berlin\'de size yardımcı olmaktan mutluluk duyarım. Başka sorunuz olursa çekinmeden sorun!\n\n📧 Daha detaylı sorularınız için: hello@berlinkonusuyor.com' },
  { keys: ['schufa','kredi','kredit','credit'], answer: '📊 **Schufa (Kredi Raporu)**\n\nSchufa, Almanya\'daki kredi itibar sistemidir.\n\n🔹 Nasıl alınır?\n• meineschufa.de → Ücretsiz kopyayı "Datenkopie" bölümünden talep edin\n• Ücretli anında erişim: ~29.95€\n\n🔹 Neden önemli?\n• Ev kiralama başvurularında şart\n• Telefon aboneliği, kredi kartı\n\n💡 İpucu: Ücretsiz Schufa kopyası yılda 1 kez hakkınızdır!' },
  { keys: ['spor','sport','fitness','gym','yüzme','schwimmen'], answer: '🏋️ **Spor İmkanları**\n\nUygun fiyatlı seçenekler:\n• Fitness First, McFit: ~20-30€/ay\n• Urban Sports Club: ~50-100€/ay (çoklu tesis)\n• Berlin\'deki açık hava spor alanları ücretsiz!\n• Halk yüzme havuzları: ~5-6€/giriş\n\n💡 İpucu: Tiergarten ve Tempelhofer Feld koşu için mükemmel!' },
];

const chatbotWindow = document.getElementById('chatbotWindow');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotForm = document.getElementById('chatbotForm');
const chatbotInput = document.getElementById('chatbotInput');

window.toggleChatbot = () => {
  chatbotWindow.classList.toggle('active');
  if (chatbotWindow.classList.contains('active') && chatbotInput) {
    setTimeout(() => chatbotInput.focus(), 300);
  }
};

function findBestAnswer(query) {
  const q = query.toLowerCase().replace(/[?.!,]/g, '');
  const words = q.split(/\s+/);

  let bestMatch = null;
  let bestScore = 0;

  for (const item of BERLIN_KB) {
    let score = 0;
    for (const key of item.keys) {
      const keyLower = key.toLowerCase();
      // Exact substring match in query
      if (q.includes(keyLower)) {
        score += keyLower.length * 3;
      }
      // Individual word match
      for (const word of words) {
        if (word.length < 2) continue;
        if (keyLower.includes(word) || word.includes(keyLower)) {
          score += word.length;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  if (bestScore >= 4 && bestMatch) {
    return bestMatch.answer;
  }
  return null;
}

function formatBotMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/• /g, '&bull; ');
}

function addChatMsg(content, cls, id = '') {
  const div = document.createElement('div');
  div.className = `chat-msg ${cls}`;
  div.innerHTML = content;
  if (id) div.id = id;
  if (chatbotMessages) {
    chatbotMessages.appendChild(div);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }
}

function handleChatQuery(query) {
  addChatMsg(query, 'user-msg');

  // Show typing indicator
  const typingId = 'typing-' + Date.now();
  addChatMsg('<div class="typing-indicator"><span></span><span></span><span></span></div>', 'bot-msg', typingId);

  setTimeout(() => {
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();

    const answer = findBestAnswer(query);
    if (answer) {
      addChatMsg(formatBotMessage(answer), 'bot-msg');
    } else {
      addChatMsg(formatBotMessage('🤔 Bu konuda henüz bilgi bankamda yeterli veri yok. Ama size yardımcı olmak isterim!\n\n📧 Detaylı sorularınız için: <a href="mailto:hello@berlinkonusuyor.com" style="color:var(--accent);text-decoration:underline;">hello@berlinkonusuyor.com</a>\n\nŞu konularda sorular sorabilirsiniz:\n📋 Anmeldung\n🏠 Ev bulma\n🛂 Vize\n🚇 Ulaşım\n💼 İş bulma\n🍽️ Restoran'), 'bot-msg');
    }
  }, 800 + Math.random() * 600);
}

if (chatbotForm) {
  chatbotForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const txt = chatbotInput.value.trim();
    if (!txt) return;
    chatbotInput.value = '';
    handleChatQuery(txt);
  });
}

// Quick Reply Buttons
document.querySelectorAll('.quick-reply-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const query = btn.dataset.query;
    if (query) handleChatQuery(query);
  });
});

// ═══════════════════════════════════════════
// PREMIUM ENHANCEMENTS
// ═══════════════════════════════════════════

// ── Splash Screen ───────────────────────────
function initSplash() {
  const splash = document.getElementById('splashScreen');
  if (!splash) return;

  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    splash.classList.add('hidden');
    document.body.style.overflow = '';
  }, 2600);
}

// ── Scroll Progress Bar ─────────────────────
function initScrollProgress() {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;

  window.addEventListener('scroll', () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = (window.scrollY / docHeight) * 100;
    bar.style.width = scrolled + '%';
  }, { passive: true });
}

// ── Cursor Ring (Cursor 2.0) ─────────────────
function initCursorPremium() {
  const glow = document.getElementById('cursorGlow');
  const ring = document.getElementById('cursorRing');
  if (!glow || !ring || window.matchMedia('(max-width: 768px)').matches) return;

  let mouseX = 0, mouseY = 0;
  let glowX = 0, glowY = 0;
  let ringX = 0, ringY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!glow.classList.contains('active')) glow.classList.add('active');
  });

  document.addEventListener('mouseleave', () => {
    glow.classList.remove('active');
  });

  function animate() {
    glowX += (mouseX - glowX) * 0.08;
    glowY += (mouseY - glowY) * 0.08;
    glow.style.left = glowX + 'px';
    glow.style.top = glowY + 'px';

    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;
    ring.style.left = ringX + 'px';
    ring.style.top = ringY + 'px';
    
    requestAnimationFrame(animate);
  }
  animate();

  // Hover effects
  const targets = 'a, button, .news-card, .yt-mini-card, .event-card';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(targets)) ring.classList.add('hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(targets)) ring.classList.remove('hover');
  });
}

// ── Parallax Hero ───────────────────────────
function initParallax() {
  const heroBg = document.querySelector('.hero::before') ? document.querySelector('.hero') : null;
  if (!heroBg) return;

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    if (scrolled < window.innerHeight) {
      const parallaxEl = heroBg.querySelector('.hero-content');
      if (parallaxEl) {
        parallaxEl.style.transform = `translateY(${scrolled * 0.15}px)`;
        parallaxEl.style.opacity = 1 - (scrolled / window.innerHeight) * 0.6;
      }
    }
  }, { passive: true });
}


// ── Tilt Effects ────────────────────────────
function initTiltEffects() {
  const cards = document.querySelectorAll('.glass-panel, .magnetic-card');
  if (window.matchMedia('(max-width: 768px)').matches) return;

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
  });
}

// ── Animated Counter ────────────────────────
function initCounters() {
  const counters = document.querySelectorAll('.stat-number');
  if (!counters.length) return;

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 2000;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuart(progress);
      const current = Math.round(target * eased);

      if (target >= 1000) {
        el.textContent = current.toLocaleString('de-DE') + suffix;
      } else {
        el.textContent = current + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    requestAnimationFrame(update);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const nums = entry.target.querySelectorAll('.stat-number');
          nums.forEach((el, i) => {
            setTimeout(() => animateCounter(el), i * 200);
          });
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  const statsBar = document.getElementById('statsBar');
  if (statsBar) observer.observe(statsBar);
}

// ── Magnetic Buttons ────────────────────────
function initMagneticButtons() {
  const btns = document.querySelectorAll('.magnetic-btn');
  if (!btns.length || window.matchMedia('(max-width: 768px)').matches) return;

  btns.forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0, 0)';
    });
  });
}

// ── Text Reveal Animation ───────────────────
function initTextReveal() {
  const heroLines = document.querySelectorAll('.hero-line');
  heroLines.forEach((line) => {
    const text = line.textContent;
    const words = text.split(' ');
    line.innerHTML = '';
    line.style.animation = 'none';
    line.style.opacity = '1';

    words.forEach((word, i) => {
      const span = document.createElement('span');
      span.className = 'word-span';
      span.textContent = word;
      span.style.animationDelay = `${0.4 + (line.classList.contains('hero-line-accent') ? 0.3 : 0) + i * 0.12}s`;
      line.appendChild(span);
      if (i < words.length - 1) {
        line.appendChild(document.createTextNode(' '));
      }
    });
  });
}

// ── Newsletter Form (Formsubmit.co & Brevo Template) ──────────
function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault(); // AJAX ile gönderim için standart formu engelle
    
    const input = form.querySelector('.newsletter-input');
    const btn = form.querySelector('.newsletter-btn');
    const email = input.value.trim();
    
    // Basic Validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailPattern.test(email)) {
      btn.textContent = 'Geçersiz E-posta!';
      btn.style.background = '#e74c3c';
      setTimeout(() => resetNewsletterBtn(btn), 2000);
      return;
    }

    // Loading State
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    // OPSİYONEL: Brevo Entegrasyonu (Gelecekte API Key ile aktifleştirilebilir)
    // subscribeToBrevo(email).then(success => { ... });

    // Submit via AJAX to Formsubmit (Current Stable Flow)
    fetch('https://formsubmit.co/ajax/hello@berlinkonusuyor.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        _subject: 'Yeni Bülten Aboneliği (Berlin Konuşuyor)'
      })
    })
    .then(response => response.json())
    .then(data => {
      // Success UI
      btn.innerHTML = 'Kayıt Başarılı <i class="fas fa-check"></i>';
      btn.style.background = '#22c55e';
      input.value = '';
      const msg = document.getElementById('newsletterMessage');
      if (msg) {
        msg.textContent = '✅ Başarıyla abone olundu! Teşekkürler.';
        msg.className = 'newsletter-message show success';
      }
      setTimeout(() => resetNewsletterBtn(btn), 3000);
    })
    .catch(error => {
      console.error(error);
      btn.textContent = 'Bağlantı Hatası';
      btn.style.background = '#e74c3c';
      const msg = document.getElementById('newsletterMessage');
      if (msg) {
        msg.textContent = '❌ Bir sorun oluştu, lütfen tekrar deneyin.';
        msg.className = 'newsletter-message show error';
      }
      setTimeout(() => resetNewsletterBtn(btn), 2500);
    });
  });
}

/**
 * Brevo API Entegrasyon Şablonu
 * Not: Bu kodu frontend'de kullanmak API anahtarını açık eder. 
 * Güvenli kullanım için Netlify/Vercel Functions kullanılmalıdır.
 */
async function subscribeToBrevo(email) {
  try {
    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': 'BREVO_API_KEY_BURAYA', // ← GÜVENLİK NOTU: API anahtarını asla buraya yazmayın!
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        updateEnabled: true
      })
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

function resetNewsletterBtn(btn) {
  const lang = localStorage.getItem('bk-lang') || 'tr';
  btn.textContent = translations[lang]?.newsletter_btn || 'Abone Ol';
  btn.style.background = '';
}

// ── Init ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSplash();
  initTextReveal();
  loadNews();
  loadEvents();
  loadPodcasts();
  initReveal();
  initNavbar();
  initMobileMenu();
  initMobileDock();
  // initBerlinPulse(globalNews); // Removed from here (moved to loadNews)
  initShakeHistory();
  initSwipeToDismiss();
  initLangSwitcher();
  initDashboardUtils();
  initScrollProgress();
  initCursorPremium();
  initParallax();
  initTiltEffects();
  initCounters();
  initMagneticButtons();
  initNewsletter();
  initQAForum();
  initServiceWorker();
  initMap();
  initSearch();
  initTheme();
  initFilters();
});

// ── Service Worker Registration ─────────────
// ── Service Worker Registration & Layout Fail-safe ─────────────
function initServiceWorker() {
  // Fix for Hero Height Collapse
  const hero = document.getElementById('hero');
  if (hero) {
    const h = hero.offsetHeight;
    if (h < 100) { // If height is collapsed
      hero.style.height = '100vh';
      hero.style.minHeight = '100vh';
      hero.style.display = 'flex';
      console.warn('⚠️ Hero height fail-safe activated');
    }
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('✅ SW Registered');
        })
        .catch(err => {
          console.error('❌ SW Failed', err);
        });
    });
  }
}

// ── Weekly Polls (Anket) Logic ─────────────────
async function initPolls() {
  const pollQuestionEl = document.getElementById('pollQuestion');
  const pollOptionsEl = document.getElementById('pollOptions');
  const pollTotalEl = document.getElementById('pollTotal');
  const pollResetBtn = document.getElementById('pollReset');

  if (!pollQuestionEl || !pollOptionsEl) return;

  try {
    // Get active poll from Firestore
    const pollsRef = collection(db, 'polls');
    const q = query(pollsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      pollQuestionEl.innerText = "Şu an aktif bir anket bulunmuyor.";
      return;
    }

    const pollDoc = querySnapshot.docs[0];
    const pollId = pollDoc.id;
    const pollData = pollDoc.data();

    pollQuestionEl.innerText = pollData.question;
    
    // Check if user already voted (LocalStorage for simplicity in demo)
    const votedId = localStorage.getItem(`bk-poll-${pollId}`);
    
    renderPollOptions(pollId, pollData, votedId);

    pollResetBtn.addEventListener('click', () => {
      localStorage.removeItem(`bk-poll-${pollId}`);
      renderPollOptions(pollId, pollData, null);
      pollResetBtn.classList.add('hidden');
    });

    if (votedId) pollResetBtn.classList.remove('hidden');

  } catch (error) {
    console.error("Poll error:", error);
    pollQuestionEl.innerText = "Anket yüklenirken bir hata oluştu.";
  }
}

function renderPollOptions(pollId, pollData, votedId) {
  const pollOptionsEl = document.getElementById('pollOptions');
  const pollTotalEl = document.getElementById('pollTotal');
  const options = pollData.options || [];
  const totalVotes = options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
  
  pollTotalEl.innerText = `Toplam ${totalVotes} oy`;

  pollOptionsEl.innerHTML = options.map((option, index) => {
    const percent = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
    const isVoted = votedId !== null;
    const isSelected = votedId === String(index);

    return `
      <button class="poll-option-btn ${isVoted ? 'voted' : ''} ${isSelected ? 'selected' : ''}" 
              onclick="votePoll('${pollId}', ${index})" 
              ${isVoted ? 'disabled' : ''}>
        <div class="poll-progress-bg" style="width: ${isVoted ? percent : 0}%"></div>
        <span class="poll-option-text">${option.text}</span>
        <span class="poll-option-percent">${percent}%</span>
      </button>
    `;
  }).join('');
}

window.votePoll = async (pollId, optionIndex) => {
  try {
    const pollRef = doc(db, 'polls', pollId);
    
    // Get latest data to update correctly
    const querySnapshot = await getDocs(query(collection(db, 'polls')));
    const pollDoc = querySnapshot.docs.find(d => d.id === pollId);
    if (!pollDoc) return;

    const pollData = pollDoc.data();
    const options = [...pollData.options];
    options[optionIndex].votes = (options[optionIndex].votes || 0) + 1;

    await updateDoc(pollRef, { options });
    
    localStorage.setItem(`bk-poll-${pollId}`, String(optionIndex));
    
    // Re-render
    renderPollOptions(pollId, { ...pollData, options }, String(optionIndex));
    document.getElementById('pollReset').classList.remove('hidden');

  } catch (error) {
    console.error("Vote error:", error);
  }
};

// ── Interactive Map Initialization ──────────
function initMap() {
  const mapEl = document.getElementById('berlinMap');
  // Check if Leaflet is loaded and mapEl exists
  if (!mapEl || typeof L === 'undefined') return;

  // Dark mode map tiles (CartoDB Dark Matter)
  const map = L.map('berlinMap', { scrollWheelZoom: false }).setView([52.5050, 13.3850], 11);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  const locations = [
    { name: "T.C. Berlin Başkonsolosluğu", coords: [52.4965, 13.2985], desc: "Resmi işlemleriniz için başkonsolosluk adresi." },
    { name: "Kreuzberg Merkez (SO36)", coords: [52.5003, 13.4243], desc: "Küçük İstanbul olarak da bilinir, Türk nüfusunun yoğun yaşadığı, hareketli bölge." },
    { name: "Brandenburg Kapısı", coords: [52.5163, 13.3777], desc: "Berlin'in sembolü ve en bilinen turistik noktası." },
    { name: "Alexanderplatz", coords: [52.5219, 13.4132], desc: "Şehrin en kalabalık ve merkezi noktalarından biri." },
    { name: "East Side Gallery", coords: [52.5050, 13.4396], desc: "Berlin Duvarı'nın en uzun kalıntısı ve açık hava galerisi." },
    { name: "Neukölln", coords: [52.4811, 13.4354], desc: "Son yılların popüler, çok kültürlü ve kafeleriyle ünlü semti." }
  ];

  const customIcon = L.icon({
    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  locations.forEach(loc => {
    L.marker(loc.coords, {icon: customIcon})
      .addTo(map)
      .bindPopup(`<strong>${loc.name}</strong><br>${loc.desc}`);
  });
}

// ── Search Logic (Enhanced with Results Overlay & Shortcut) ──────
function initSearch() {
  const toggle = document.getElementById('searchToggle');
  const wrapper = document.getElementById('searchInputWrapper');
  const close = document.getElementById('searchClose');
  const input = document.getElementById('searchInput');
  const overlay = document.getElementById('searchResultsOverlay');
  const resultsList = document.getElementById('searchResultsList');

  if (!toggle || !wrapper || !close || !input || !overlay) return;

  function openSearch() {
    wrapper.classList.add('active');
    overlay.classList.add('active');
    setTimeout(() => input.focus(), 100);
  }

  function closeSearch() {
    wrapper.classList.remove('active');
    overlay.classList.remove('active');
    input.value = '';
    resultsList.innerHTML = '';
  }

  toggle.addEventListener('click', openSearch);
  close.addEventListener('click', closeSearch);

  // Keyboard Shortcut: Ctrl + K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
    if (e.key === 'Escape') closeSearch();
  });

  input.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (query.length < 2) {
      resultsList.innerHTML = '';
      return;
    }

    // Search in News, Events (globalNews, globalEvents)
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
      news.slice(0, 5).forEach(n => {
        html += `
          <div class="search-result-item" onclick="openNewsModal(${globalNews.indexOf(n)})">
            <i class="fas fa-newspaper"></i>
            <div>
              <div class="search-result-title">${n.title}</div>
              <div class="search-result-meta">${n.source} • ${formatDate(n.date)}</div>
            </div>
          </div>
        `;
      });
    }

    if (events.length > 0) {
      html += `<div class="search-category-title">Etkinlikler (${events.length})</div>`;
      events.slice(0, 5).forEach(ev => {
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

// ── Theme Logic ─────────────────────────────
function initTheme() {

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

// ── Render Hero Featured Article ─────────────
function renderHeroFeatured(article) {
  const container = document.getElementById('heroFeaturedNews');
  if (!container || !article) return;

  container.innerHTML = `
    <article class="news-card magnetic-card" onclick="openNewsModal(0)">
      <div class="news-card-img" style="background-image: url('${article.image || PLACEHOLDER_IMG}')"></div>
      <div class="news-card-content">
        <div class="news-meta">
          <span class="news-source-tag">${article.source}</span>
          <span class="news-date">${formatDate(article.date)}</span>
        </div>
        <h3 class="news-card-title">${article.summary_tr || article.title}</h3>
      </div>
    </article>
  `;
  container.classList.add('visible');
}

// ── Category Filters Logic ─────────────────
function initFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle active states
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const category = btn.dataset.category;
      renderNews(globalNews, category);
      
      // Smooth scroll back to top of news if needed
      if (window.innerWidth < 1024) {
        document.getElementById('haberler').scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// ── Initialize App ──────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initJobBoard();
  initPolls();
});
