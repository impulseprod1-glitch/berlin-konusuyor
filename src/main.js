import './style.css';

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
  // Show skeletons
  if (grid) grid.innerHTML = '<div class="skeleton-card"></div>'.repeat(4);

  try {
    // 1. Önce AI tarafından üretilmiş yerel haberleri ve insightları çek
    const localRes = await fetch('/data/news.json');
    if (localRes.ok) {
      const localData = await localRes.json();
      if (localData.articles && localData.articles.length) {
        globalNews = localData.articles;
        renderNews(globalNews); // Use the new renderNews
        renderTicker(globalNews);
        renderHeroFeatured(globalNews[0]);
        
        // AI Dashboard'u güncelle
        if (localData.insights) {
          renderAIDashboard(localData.insights);
        }

        // Initialize Berlin Pulse
        initBerlinPulse(globalNews);

        const badge = document.getElementById('newsSource');
        if (badge) {
          const ago = getTimeAgo(localData.lastUpdated || new Date());
          badge.textContent = `AI Destekli Akış (Son: ${ago})`;
        }
        return; // Yerel haberler yüklendiyse TRT fallback'e gerek yok
      }
    }

    // 2. Fallback: RSS-to-JSON API to fetch live news from TRT Haber (Eğer yerel veri yoksa)
    const rssUrl = 'https://www.trthaber.com/manset_articles.rss';
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error('RSS fetch failed');
    const data = await res.json();

    if (data.status === 'ok' && data.items?.length) {
      // API dönüşünü kendi modelimize uyarlıyoruz
      const articles = data.items.slice(0, 5).map(item => ({
        id: Math.random().toString(36).substr(2, 9),
        title: item.title,
        summary_tr: item.title,
        description: item.description.replace(/<[^>]*>?/gm, '').trim(), // HTML etiketlerini temizle
        image: item.thumbnail || (item.enclosure && item.enclosure.link) || PLACEHOLDER_IMG,
        date: item.pubDate,
        source: "TRT Haber",
        url: item.link,
        category: 'Politics' // Default category for RSS fallback
      }));

      globalNews = articles;
      renderNews(articles); 
      renderTicker(articles);
      renderHeroFeatured(articles[0]);

      // Show last updated info
      const badge = document.getElementById('newsSource');
      if (badge && articles.length > 0) {
        const ago = getTimeAgo(articles[0].date);
        badge.textContent = `Canlı Akış (Son: ${ago})`;
      }
    } else {
      throw new Error('Geçersiz RSS veri yapısı');
    }
  } catch (err) {
    console.log('Canlı haber akışı yüklenemedi:', err);
    const badge = document.getElementById('newsSource');
    if (badge) badge.textContent = 'Haber akışı güncellenemedi.';
    if (grid) grid.innerHTML = '<p class="error-message">Haberler yüklenemedi. Lütfen daha sonra tekrar deneyin.</p>';
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
function renderEvents(events) {
  const track = document.getElementById('eventsTrack');
  if (!track || !events.length) return;

  const html = events.map(e => {
    const d = new Date(e.date);
    const day = d.toLocaleDateString('tr-TR', { day: '2-digit' });
    const month = d.toLocaleDateString('tr-TR', { month: 'short' });
    
    return `
      <div class="event-card">
        <div class="event-img" style="background-image: url('${e.image}')">
          <span class="event-category">${e.category}</span>
        </div>
        <div class="event-body">
          <div class="event-date-box">
            <span class="event-day">${day}</span>
            <span class="event-month">${month}</span>
          </div>
          <h4 class="event-title">${e.title}</h4>
          <div class="event-location">
            <i class="fas fa-map-marker-alt"></i> ${e.location}
          </div>
        </div>
      </div>
    `;
  }).join('');

  track.innerHTML = html;
}

async function loadEvents() {
  try {
    const res = await fetch('/data/events.json');
    if (!res.ok) throw new Error('Events fetch failed');
    const data = await res.json();
    if (data.events?.length) {
      renderEvents(data.events);
    }
  } catch (err) {
    console.log('Etkinlikler yüklenemedi.');
  }
}

// ── Dynamic Podcasts Loading ────────────────
async function loadPodcasts() {
  try {
    const res = await fetch('/data/podcasts.json');
    if (!res.ok) throw new Error('Podcasts fetch failed');
    const data = await res.json();
    
    const grid = document.getElementById('podcastGrid');
    if (!grid || !data.podcasts) {
      console.log('Podcast grid element not found or no data.');
      return;
    }

    console.log(`Rendering ${data.podcasts.length} podcasts...`);

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

// ── Reveal Logic Enhancement ───────────────
function initReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
  );

  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
}

// ── Smooth Section Navigation ─────────────
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

// ── Mobile Menu ─────────────────────────────
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
  if (!container || !articles.length) return;

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

function checkAuthStatus() {
  const user = localStorage.getItem('bk_user');
  if (user) {
    // Logged In State
    if(loginBtn) { loginBtn.innerHTML = '<i class="fas fa-user-circle"></i> Profil'; }
    if(loginBtn) { loginBtn.style.background = 'transparent'; }
    if(loginBtn) { loginBtn.style.border = '1px solid var(--accent)'; }
    if(loginBtn) { loginBtn.style.color = 'var(--text-primary)'; }
  } else {
    // Logged Out State
    if(loginBtn) { loginBtn.innerHTML = 'Giriş Yap'; }
    if(loginBtn) { loginBtn.style.background = ''; }
    if(loginBtn) { loginBtn.style.border = ''; }
    if(loginBtn) { loginBtn.style.color = ''; }
  }
}

window.openLoginModal = () => {
  const user = localStorage.getItem('bk_user');
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

window.mockLogin = () => {
  // Simulate network request
  const btn = loginView.querySelector('button');
  const orgHtml = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Bağlanıyor...';
  
  setTimeout(() => {
    localStorage.setItem('bk_user', JSON.stringify({ email: 'demo@berlinkonusuyor.com', name: 'Berlin Sever' }));
    checkAuthStatus();
    btn.innerHTML = orgHtml;
    closeLoginModal();
  }, 1000);
};

window.mockLogout = () => {
  localStorage.removeItem('bk_user');
  checkAuthStatus();
  closeLoginModal();
};

// Check on load
document.addEventListener('DOMContentLoaded', checkAuthStatus);


// ── Community Q&A Forum (LocalStorage) ──────
function initQAForum() {
  const qaForm = document.getElementById('qaForm');
  const qaFeed = document.getElementById('qaFeed');
  if (!qaForm || !qaFeed) return;

  let questions = [];
  try {
    questions = JSON.parse(localStorage.getItem('bk_qa') || '[]');
  } catch(e) {}

  // Load defaults if empty
  if (questions.length === 0) {
    questions = [
      { id: 1, name: 'Ahmet Y.', text: 'Merhaba, Kreuzberg civarında uygun fiyatlı ve nezih bir kiralık ev bulmak için hangi siteleri önerirsiniz?', time: '2 saat önce', karma: 14, tags: ['Ev & Kira', 'Kreuzberg'] },
      { id: 2, name: 'Anonim', text: 'Mavi kart başvurum 3 aydır Ausländerbehörde\'de bekliyor. Süreci hızlandırmak için avukat tutmalı mıyım?', time: '5 saat önce', karma: 32, tags: ['Vize', 'Bürokrasi'] }
    ];
    localStorage.setItem('bk_qa', JSON.stringify(questions));
  }

  function renderFeed() {
    qaFeed.innerHTML = questions.map(q => `
      <div class="qa-card glass-panel">
        <div class="qa-header">
          <div class="qa-author-box">
            <div class="qa-avatar">${q.name.charAt(0).toUpperCase()}</div>
            <div>
              <div class="qa-author">${q.name}</div>
              <div class="qa-time">${q.time}</div>
            </div>
          </div>
          <div class="qa-tags">
            ${(q.tags || []).map(t => `<span class="qa-tag">${t}</span>`).join('')}
          </div>
        </div>
        <div class="qa-body">
          ${q.text}
        </div>
        <div class="qa-actions">
          <button class="qa-action-btn" onclick="upvoteQA(${q.id})"><i class="fas fa-arrow-up"></i> ${q.karma}</button>
          <button class="qa-action-btn"><i class="far fa-comment-alt"></i> Yanıtla</button>
        </div>
      </div>
    `).join('');
  }

  window.upvoteQA = (id) => {
    const q = questions.find(x => x.id === id);
    if (q) {
      q.karma++;
      localStorage.setItem('bk_qa', JSON.stringify(questions));
      renderFeed();
    }
  };

  qaForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('qaName');
    const textInput = document.getElementById('qaQuestion');
    const btn = qaForm.querySelector('.qa-submit');
    
    if(!textInput.value.trim()) return;

    const newQ = {
      id: Date.now(),
      name: nameInput.value.trim() || 'Anonim',
      text: textInput.value.trim(),
      time: 'Az önce',
      karma: 0,
      tags: ['Yeni Soru']
    };

    questions.unshift(newQ);
    localStorage.setItem('bk_qa', JSON.stringify(questions));
    
    // UI Feedback
    textInput.value = '';
    nameInput.value = '';
    const org = btn.innerHTML;
    btn.innerHTML = 'Gönderildi <i class="fas fa-check"></i>';
    btn.style.background = '#22c55e';
    
    renderFeed();

    setTimeout(() => {
      btn.innerHTML = org;
      btn.style.background = '';
    }, 2000);
  });

  renderFeed();
}

// ── AI Chatbot Assistant ──────────────────────
const chatbotWindow = document.getElementById('chatbotWindow');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotForm = document.getElementById('chatbotForm');
const chatbotInput = document.getElementById('chatbotInput');

window.toggleChatbot = () => {
  chatbotWindow.classList.toggle('active');
  if (chatbotWindow.classList.contains('active')) {
    setTimeout(() => chatbotInput.focus(), 300);
  }
};

if (chatbotForm) {
  chatbotForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const txt = chatbotInput.value.trim();
    if (!txt) return;

    // Add user msg
    addChatMsg(txt, 'user-msg');
    chatbotInput.value = '';

    // Show typing
    const typingId = 'typing-' + Date.now();
    addChatMsg('<i class="fas fa-ellipsis-h fa-fade"></i>', 'bot-msg', typingId);

    // Mock AI Response
    setTimeout(() => {
      const typingEl = document.getElementById(typingId);
      if (typingEl) typingEl.remove();

      const reply = "Merhaba! 👋 Ben Berlin Konuşuyor Asistanı. Şu an geliştirme aşamasındayım ve test ediliyorum. İhtiyaçlarınız ve sorularınız için bizimle doğrudan iletişime geçebilirsiniz: <br><br> <a href='mailto:hello@berlinkonusuyor.com' style='color:var(--accent);text-decoration:underline;'>hello@berlinkonusuyor.com</a>";

      addChatMsg(reply, 'bot-msg');
    }, 1500);
  });
}

function addChatMsg(content, cls, id = '') {
  const div = document.createElement('div');
  div.className = `chat-msg ${cls}`;
  div.innerHTML = content;
  if (id) div.id = id;
  chatbotMessages.appendChild(div);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

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
  initBerlinPulse(globalNews);
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
function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('SW registered: ', registration);
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
}

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

// ── Search Logic ────────────────────────────
function initSearch() {
  const toggle = document.getElementById('searchToggle');
  const wrapper = document.getElementById('searchInputWrapper');
  const close = document.getElementById('searchClose');
  const input = document.getElementById('searchInput');

  if (!toggle || !wrapper || !close || !input) return;

  toggle.addEventListener('click', () => {
    wrapper.classList.add('active');
    setTimeout(() => input.focus(), 100);
  });

  close.addEventListener('click', () => {
    wrapper.classList.remove('active');
    input.value = '';
  });

  input.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    if (query.length < 3) return;
    
    // In a real app, this would filter articles or show an overlay
    console.log('Searching for:', query);
  });
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
