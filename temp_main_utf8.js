import './style.css';
import { 
  db, auth, googleProvider,
  collection, query, orderBy, onSnapshot, addDoc, 
  serverTimestamp, doc, updateDoc, increment, getDocs,
  signInWithPopup, signOut, onAuthStateChanged
} from './firebase-config.js';

let currentLang = localStorage.getItem('bk-lang') || 'tr';


/* ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
   BERLIN KONU┼×UYOR ÔÇö Main JS
   i18n ┬À Dynamic News ┬À Scroll Reveal ┬À Mobile Menu
   ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ */

// ÔöÇÔöÇ AI Dashboard Rendering ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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

// ÔöÇÔöÇ Dashboard Utilities ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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
        <span class="stat-value">─░yi (24 AQI)</span>
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
      if (tempEl) tempEl.innerText = "12┬░C"; // Fallback
    });
}

// ÔöÇÔöÇ Navbar & Interactions ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
const translations = {
  tr: {
    nav_news: 'Haberler',
    nav_interviews: 'R├Âportajlar',
    nav_guide: 'Rehber',
    nav_contact: '─░leti┼ƒim',
    hero_eyebrow: 'Dijital Medya Platformu',
    hero_line1: "Berlin'in Nabz─▒,",
    hero_line2: 'Sizin Sesiniz.',
    hero_sub: 'Sokak r├Âportajlar─▒, g├╝ncel haberler ve ┼ƒehir rehberi ÔÇö hepsi bir arada.',
    hero_cta: 'Ke┼ƒfet',
    news_tag: 'G├╝ncel',
    news_title: 'Son Haberler',
    interviews_tag: 'Video',
    interviews_title: 'R├Âportajlar',
    yt_desc: 'Sokak r├Âportajlar─▒, Berlin haberleri ve ┼ƒehir ya┼ƒam─▒ ÔÇö hepsini kanal─▒m─▒zda izleyin.',
    yt_subscribe: 'Kanala Abone Ol ÔåÆ',
    guide_tag: 'Rehber',
    guide_title: 'Berlin Rehberi',
    guide_housing: 'Ev Bulma',
    guide_housing_desc: 'Kiral─▒k ev arama, ba┼ƒvuru s├╝reci ve ipu├ºlar─▒.',
    guide_official: 'Resmi ─░┼ƒlemler',
    guide_official_desc: 'Anmeldung, vize, ├ºal─▒┼ƒma izni ve daha fazlas─▒.',
    guide_events: 'Etkinlikler',
    guide_events_desc: 'Haftal─▒k k├╝lt├╝r, sanat ve sosyal etkinlikler.',
    guide_transport: 'Ula┼ƒ─▒m',
    guide_transport_desc: 'U-Bahn, S-Bahn, bilet ├ºe┼ƒitleri ve rotalar.',
    guide_jobs: '─░┼ƒ Bulmak',
    guide_jobs_desc: '─░┼ƒ arama, CV haz─▒rlama ve m├╝lakat ipu├ºlar─▒.',
    guide_food: 'Yeme & ─░├ºme',
    guide_food_desc: 'En iyi restoranlar, kafeler ve gece hayat─▒.',
    footer_rights: 'T├╝m haklar─▒ sakl─▒d─▒r.',
    ticker_label: 'SON DAK─░KA',
    search_placeholder: 'Haber veya rehber ara...',
    filter_all: 'T├╝m├╝',
    filter_politics: 'Siyaset',
    filter_culture: 'K├╝lt├╝r',
    filter_economy: 'Ekonomi',
    filter_lifestyle: 'Ya┼ƒam',
    read_time: 'dk okuma',
    meta_title: "Berlin Konu┼ƒuyor ÔÇö Berlin'in Nabz─▒, Sizin Sesiniz",
    meta_desc: "Berlin'in en g├╝ncel haberleri, sokak r├Âportajlar─▒ ve kapsaml─▒ ┼ƒehir rehberi. Berlin'deki T├╝rk toplumu ve gurbet├ºiler i├ºin dijital medya platformu.",
    legal_impressum: "Impressum",
    legal_privacy: "Gizlilik Politikas─▒",
    ai_dashboard_title: "Berlin AI Insight",
    widget_weather_title: "Hava Durumu & Vibe",
    widget_brief_title: "AI Haber ├ûzeti",
    widget_time_title: "Berlin Saati",
    widget_time_desc: "Berlin'de hayat devam ediyor.",
    stat_subscribers: "Abone",
    stat_videos: "Video",
    stat_languages: "Dil",
    stat_reach: "Ayl─▒k Eri┼ƒim",
    newsletter_tag: "B├╝lten",
    newsletter_title: "Berlin'den haberdar ol",
    newsletter_desc: "En g├╝ncel haberler, etkinlikler ve rehber i├ºeriklerini do─ƒrudan e-postan─▒za g├Ânderin.",
    newsletter_placeholder: "E-posta adresiniz",
    newsletter_btn: "Abone Ol",
    newsletter_privacy: "Gizlili─ƒinize sayg─▒ duyuyoruz. ─░stedi─ƒiniz zaman abonelikten ├º─▒kabilirsiniz.",
    map_tag: "Ke┼ƒfet",
    map_title: "─░nteraktif ┼×ehir Haritas─▒",
    map_desc: "├ûnemli lokasyonlar─▒, konsolosluklar─▒ ve Berlin'in ikonik mekanlar─▒n─▒ harita ├╝zerinde inceleyin.",
    events_cal_tag: "Takvim",
    events_cal_title: "Yakla┼ƒan Etkinlikler",
    listen_news: "Dinle",
    read_time: "dk okuma"
  },
  de: {
    nav_news: 'Nachrichten',
    nav_interviews: 'Interviews',
    nav_guide: 'Stadtf├╝hrer',
    nav_contact: 'Kontakt',
    hero_eyebrow: 'Digitale Medienplattform',
    hero_line1: 'Der Puls Berlins,',
    hero_line2: 'Eure Stimme.',
    hero_sub: 'Stra├ƒeninterviews, aktuelle Nachrichten und Stadtf├╝hrer ÔÇö alles an einem Ort.',
    hero_cta: 'Entdecken',
    news_tag: 'Aktuell',
    news_title: 'Neueste Nachrichten',
    interviews_tag: 'Video',
    interviews_title: 'Interviews',
    yt_desc: 'Stra├ƒeninterviews, Berlin-Nachrichten und Stadtleben ÔÇö alles auf unserem Kanal.',
    yt_subscribe: 'Kanal Abonnieren ÔåÆ',
    guide_tag: 'Stadtf├╝hrer',
    guide_title: 'Berlin Guide',
    guide_housing: 'Wohnungssuche',
    guide_housing_desc: 'Mietwohnungen suchen, Bewerbung und Tipps.',
    guide_official: 'Beh├Ârdeng├ñnge',
    guide_official_desc: 'Anmeldung, Visum, Arbeitserlaubnis und mehr.',
    guide_events: 'Veranstaltungen',
    guide_events_desc: 'W├Âchentliche Kultur-, Kunst- und Sozialevents.',
    guide_transport: 'Nahverkehr',
    guide_transport_desc: 'U-Bahn, S-Bahn, Fahrscheine und Routen.',
    guide_jobs: 'Jobsuche',
    guide_jobs_desc: 'Stellensuche, Lebenslauf und Bewerbungstipps.',
    guide_food: 'Essen & Trinken',
    guide_food_desc: 'Die besten Restaurants, Caf├®s und das Nachtleben.',
    footer_rights: 'Alle Rechte vorbehalten.',
    ticker_label: 'BREAKING NEWS',
    search_placeholder: 'Suchen...',
    filter_all: 'Alle',
    filter_politics: 'Politik',
    filter_culture: 'Kultur',
    filter_economy: 'Wirtschaft',
    filter_lifestyle: 'Lifestyle',
    read_time: 'Min. Lesezeit',
    meta_title: "Berlin Konu┼ƒuyor ÔÇö Am Puls Berlins, Deine Stimme",
    meta_desc: "Aktuelle Nachrichten aus Berlin, Stra├ƒeninterviews und umfangreicher Stadtf├╝hrer. Die digitale Plattform f├╝r die t├╝rkische Community.",
    legal_impressum: "Impressum",
    legal_privacy: "Datenschutzerkl├ñrung",
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
    newsletter_title: "Bleib informiert ├╝ber Berlin",
    newsletter_desc: "Erhalte die neuesten Nachrichten, Veranstaltungen und Stadtf├╝hrer direkt in dein E-Mail-Postfach.",
    newsletter_placeholder: "E-Mail-Adresse",
    newsletter_btn: "Abonnieren",
    newsletter_privacy: "Wir respektieren deine Privatsph├ñre. Du kannst dich jederzeit abmelden.",
    map_tag: "Entdecken",
    map_title: "Interaktiver Stadtplan",
    map_desc: "Entdecken Sie wichtige Orte, Konsulate und ikonische Berliner Schaupl├ñtze auf der Karte.",
    events_cal_tag: "Kalender",
    events_cal_title: "Anstehende Veranstaltungen",
    events_cal_desc: "Was ist dieses Wochenende in Berlin los?",
    listen_news: "H├Âren",
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
    hero_sub: 'Street interviews, breaking news and city guide ÔÇö all in one place.',
    hero_cta: 'Explore',
    news_tag: 'Latest',
    news_title: 'Latest News',
    interviews_tag: 'Video',
    interviews_title: 'Interviews',
    yt_desc: 'Street interviews, Berlin news and city life ÔÇö watch it all on our channel.',
    yt_subscribe: 'Subscribe to Channel ÔåÆ',
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
    guide_food_desc: 'Best restaurants, caf├®s and nightlife.',
    footer_rights: 'All rights reserved.',
    ticker_label: 'LATEST NEWS',
    search_placeholder: 'Search for news...',
    filter_all: 'All',
    filter_politics: 'Politics',
    filter_culture: 'Culture',
    filter_economy: 'Economy',
    filter_lifestyle: 'Lifestyle',
    read_time: 'min read',
    meta_title: "Berlin Konu┼ƒuyor ÔÇö Berlin's Pulse, Your Voice",
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

// ÔöÇÔöÇ Set Language ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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

// ÔöÇÔöÇ Dynamic Meta UI Update ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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

// ÔöÇÔöÇ Dynamic News Loading ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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


// ÔöÇÔöÇ News Rendering ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
// ÔöÇÔöÇ News Rendering ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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
            <button class="action-btn share-trigger" title="Payla┼ƒ" onclick="event.stopPropagation(); shareNews('${article.title.replace(/'/g, "\\'")}');"><i class="fas fa-share-alt"></i></button>
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
      title: 'Berlin Konu┼ƒuyor',
      text: title,
      url: window.location.href
    }).catch(console.error);
  } else {
    alert('Payla┼ƒ: ' + title);
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
      console.log(`[Firestore] Haber ak─▒┼ƒ─▒ g├╝ncellendi: ${globalNews.length} haber.`);
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
  if (mins < 1) return 'az ├Ânce';
  if (mins < 60) return `${mins} dakika ├Ânce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat ├Ânce`;
  const days = Math.floor(hours / 24);
  return `${days} g├╝n ├Ânce`;
}

// ÔöÇÔöÇ Dynamic Events Loading ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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
        console.log(`[Firestore] ${firestoreEvents.length} etkinlik g├╝ncellendi.`);
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
    console.log('Podcast listesi y├╝klenemedi:', err);
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

// ÔöÇÔöÇ Navbar scroll effect ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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

// ÔöÇÔöÇ Configuration ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
const APP_VERSION = '1.0.9-NUCLEAR';
console.info(`%c Berlin Konu┼ƒuyor %c v${APP_VERSION} `, 'background: #000; color: #fff; font-weight: bold;', 'background: #ff3e00; color: #fff;');

// ÔöÇÔöÇ Translations ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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
    
    if (article.source === 'Anadolu Ajans─▒') label = 'D├╝nya';
    else if (lowerTitle.includes('union') || lowerTitle.includes('alba') || lowerTitle.includes('f├╝chse')) label = 'Spor';
    else if (lowerTitle.includes('brand') || lowerTitle.includes('kaza')) label = 'Fla┼ƒ';

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


// ÔöÇÔöÇ Language Switcher (Placeholder) ÔöÇÔöÇ

const BERLIN_HISTORY_EVENTS = [
  {
    date: "9 KASIM 1989",
    title: "Berlin Duvar─▒ Y─▒k─▒l─▒yor",
    text: "So─ƒuk Sava┼ƒ'─▒n simgesi olan Berlin Duvar─▒, halk─▒n bask─▒s─▒ ve yanl─▒┼ƒ anla┼ƒ─▒lan bir bas─▒n a├º─▒klamas─▒ sonucu a├º─▒ld─▒. Binlerce Do─ƒu ve Bat─▒ Berlinli, Brandenburg Kap─▒s─▒'nda kucakla┼ƒt─▒.",
    image: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?q=80&w=800&auto=format&fit=crop"
  },
  {
    date: "16 MART 1920",
    title: "Alt─▒n Yirmili Y─▒llar Ba┼ƒl─▒yor",
    text: "Berlin, sanat─▒n ve e─ƒlencenin d├╝nya ba┼ƒkenti haline geldi. Bauhaus ak─▒m─▒, kabareler ve sinema ┼ƒehre e┼ƒsiz bir ruh katt─▒.",
    image: "https://images.unsplash.com/photo-1549413204-c36399990818?q=80&w=800&auto=format&fit=crop"
  },
  {
    date: "27 ┼×UBAT 1933",
    title: "Reichstag Yang─▒n─▒",
    text: "Alman Parlamento binas─▒ Reichstag'─▒n kundaklanmas─▒, ├╝lkenin kaderini de─ƒi┼ƒtiren karanl─▒k bir d├Ânemin ba┼ƒlang─▒c─▒ oldu.",
    image: "https://images.unsplash.com/photo-1510443425977-889a7f347101?q=80&w=800&auto=format&fit=crop"
  },
  {
    date: "1 A─×USTOS 1936",
    title: "Berlin Olimpiyatlar─▒",
    text: "Berlin, o g├╝ne kadar g├Âr├╝lm├╝┼ƒ en g├Ârkemli olimpiyatlara ev sahipli─ƒi yapt─▒. Jesse Owens'─▒n ba┼ƒar─▒s─▒ tarihe ge├ºti.",
    image: "https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=800&auto=format&fit=crop"
  },
  {
    date: "24 HAZ─░RAN 1948",
    title: "Berlin Hava K├Âpr├╝s├╝",
    text: "Sovyet ablukas─▒ alt─▒ndaki Bat─▒ Berlin'e m├╝ttefik u├ºaklar─▒ taraf─▒ndan aylar boyu g─▒da ve k├Âm├╝r ta┼ƒ─▒nd─▒. '┼×eker Bombac─▒lar─▒' efsanesi do─ƒdu.",
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

// ÔöÇÔöÇ Language Switcher ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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

// ÔöÇÔöÇ Legal Modals ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
const legalDocs = {
  tr: {
    impressum: `
      <h2>Impressum (K├╝nye)</h2>
      <p><strong>Berlin Konu┼ƒuyor Medya</strong></p>
      <p>Berlin, Almanya</p>
      <p><strong>Sorumlu:</strong> Berlin Konu┼ƒuyor Ekibi</p>
      <p><strong>─░leti┼ƒim:</strong> info@berlinkonusuyor.com</p>
      <h3>Yasal Uyar─▒</h3>
      <p>─░├ºeriklerimizin izinsiz kopyalanmas─▒ yasakt─▒r. Harici linklerin i├ºeri─ƒinden sorumlu de─ƒiliz.</p>
    `,
    privacy: `
      <h2>Gizlilik Politikas─▒</h2>
      <p>Kullan─▒c─▒ verileriniz AB Veri Koruma Y├Ânetmeli─ƒi (DSGVO) uyar─▒nca korunmaktad─▒r.</p>
      <p><strong>├çerezler:</strong> Sitemiz sadece teknik olarak gerekli ├ºerezleri kullan─▒r.</p>
      <p><strong>Haklar─▒n─▒z:</strong> Verilerinize eri┼ƒme, d├╝zeltme ve silme hakk─▒na sahipsiniz.</p>
    `
  },
  de: {
    impressum: `
      <h2>Impressum</h2>
      <p><strong>Berlin Konu┼ƒuyor Media</strong></p>
      <p>Berlin, Deutschland</p>
      <p><strong>Verantwortlich f├╝r den Inhalt:</strong> Team Berlin Konu┼ƒuyor</p>
      <p><strong>Kontakt:</strong> info@berlinkonusuyor.com</p>
      <h3>Haftungsausschluss</h3>
      <p>Trotz sorgf├ñltiger inhaltlicher Kontrolle ├╝bernehmen wir keine Haftung f├╝r die Inhalte externer Links.</p>
    `,
    privacy: `
      <h2>Datenschutzerkl├ñrung</h2>
      <p>Der Schutz Ihrer pers├Ânlichen Daten ist uns ein wichtiges Anliegen.</p>
      <h3>DSGVO Konformit├ñt</h3>
      <p>Wir verarbeiten Daten gem├ñ├ƒ der Datenschutz-Grundverordnung (DSGVO).</p>
      <p><strong>Cookies:</strong> Wir verwenden nur technisch notwendige Cookies.</p>
    `
  },
  en: {
    impressum: `
      <h2>Imprint</h2>
      <p><strong>Berlin Konu┼ƒuyor Media</strong></p>
      <p>Berlin, Germany</p>
      <p><strong>Responsible:</strong> Berlin Konu┼ƒuyor Team</p>
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
  document.getElementById('newsModalDesc').innerText = article.description || 'Haberin devam─▒ i├ºin kayna─ƒa gidiniz.';
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

// ÔöÇÔöÇ Podcast Audio Player ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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


// ÔöÇÔöÇ Text-to-Speech (TTS) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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

// ÔöÇÔöÇ User Auth (Mock LocalStorage) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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
      loginBtn.innerHTML = 'Giri┼ƒ Yap';
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
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ba─ƒlan─▒yor...';
  
  try {
    await signInWithPopup(auth, googleProvider);
    closeLoginModal();
  } catch (err) {
    console.error("Login Error:", err);
    alert("Giri┼ƒ ba┼ƒar─▒s─▒z oldu. L├╝tfen tekrar deneyin.");
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


// ÔöÇÔöÇ Community Q&A Forum (LocalStorage) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
// ÔöÇÔöÇ Community Q&A Forum (Enhanced with Categories & Replies) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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
          text: 'Merhaba, Kreuzberg civar─▒nda uygun fiyatl─▒ ve nezih bir kiral─▒k ev bulmak i├ºin hangi siteleri ├Ânerirsiniz?', 
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
      if (seconds < 60) return 'Az ├Ânce';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes} dk ├Ânce`;
      const hrs = Math.floor(minutes / 60);
      if (hrs < 24) return `${hrs} sa ├Ânce`;
      return `${Math.floor(hrs / 24)} g├╝n ├Ânce`;
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
                <div class="qa-reply-author"><strong>${r.name}</strong> ÔÇó ${getTimeAgo(r.time)}</div>
                <div class="qa-reply-text">${r.text}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="qa-actions">
          <button class="qa-action-btn upvote" onclick="window.upvoteQA('${q.id}')"><i class="fas fa-arrow-up"></i> ${q.karma}</button>
          <button class="qa-action-btn reply-toggle" onclick="window.toggleReplyForm('${q.id}')"><i class="far fa-comment-alt"></i> ${q.replies?.length || 0} Yan─▒t</button>
        </div>

        <div class="qa-reply-form-wrapper" id="reply-form-${q.id}" style="display:none">
          <div class="qa-reply-input-group">
            <input type="text" placeholder="Ad─▒n─▒z" class="reply-name-input" id="reply-name-${q.id}">
            <textarea placeholder="Yan─▒t─▒n─▒z─▒ yaz─▒n..." class="reply-text-input" id="reply-text-${q.id}"></textarea>
            <button class="reply-submit-btn" onclick="window.submitReply('${q.id}')">G├Ânder</button>
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
      console.log('[Forum] Soru g├Ânderiliyor...', newQ);
      await addDoc(collection(db, "forum"), newQ);
      console.log('[Forum] Soru ba┼ƒar─▒yla eklendi.');
      
      textInput.value = '';
      nameInput.value = '';
      const org = btn.innerHTML;
      btn.innerHTML = 'G├Ânderildi <i class="fas fa-check"></i>';
      btn.style.background = '#22c55e';
      setTimeout(() => {
        btn.innerHTML = org;
        btn.style.background = '';
      }, 2000);
    } catch(err) {
      console.error('[Forum] G├Ânderim hatas─▒:', err);
      alert('Soru g├Ânderilemedi: ' + err.message);
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

// ÔöÇÔöÇ Job Board Module (Phase 4 Extension) ÔöÇÔöÇÔöÇÔöÇÔöÇ
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
      jobsGrid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Hen├╝z ilan yok. ─░lk ilan─▒ sen Ver!</div>';
      return;
    }

    jobsGrid.innerHTML = filtered.map(job => `
      <div class="job-card reveal-small">
        <span class="job-badge">${job.type}</span>
        <h3 class="job-title">${job.title}</h3>
        <p class="job-company">${job.company}</p>
        <div class="job-meta">
          <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
          <span><i class="fas fa-calendar-alt"></i> ${job.createdAt?.toDate ? formatDate(job.createdAt.toDate()) : 'Bug├╝n'}</span>
        </div>
        <a href="mailto:${job.contact}" class="job-apply-btn">Ba┼ƒvur / ─░leti┼ƒime Ge├º</a>
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
    alert("─░lan vermek i├ºin giri┼ƒ yapmal─▒s─▒n─▒z.");
    openLoginModal();
    return;
  }
  const title = prompt("─░┼ƒ Ba┼ƒl─▒─ƒ─▒ (├Ârn: Garson):");
  const company = prompt("┼×irket/Mekan Ad─▒:");
  const location = prompt("B├Âlge (├Ârn: Kreuzberg):");
  const type = prompt("─░┼ƒ Tipi (Tam Zamanl─▒, Yar─▒ Zamanl─▒, Minijob):", "Tam Zamanl─▒");
  const contact = prompt("─░leti┼ƒim E-postas─▒:");

  if (title && company && contact) {
    addDoc(collection(db, "jobs"), {
      title, company, location, type, contact,
      postedBy: auth.currentUser.uid,
      createdAt: serverTimestamp()
    }).then(() => {
      alert("─░lan─▒n─▒z ba┼ƒar─▒yla eklendi.");
    }).catch(err => console.error(err));
  }
};

// ÔöÇÔöÇ Bookmark System ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
window.toggleBookmark = async (id, type) => {
  if (!auth.currentUser) {
    alert("Kaydetmek i├ºin giri┼ƒ yapmal─▒s─▒n─▒z.");
    openLoginModal();
    return;
  }

  const userRef = doc(db, "users", auth.currentUser.uid);
  // Simple check via localStorage for UI speed, but should be Firestore based
  let bookmarks = JSON.parse(localStorage.getItem(`bookmarks_${auth.currentUser.uid}`) || '[]');
  
  if (bookmarks.includes(id)) {
    bookmarks = bookmarks.filter(b => b !== id);
    alert("Kaydedilenlerden kald─▒r─▒ld─▒.");
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

// ÔöÇÔöÇ AI Chatbot Assistant (Knowledge-Base Powered) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
const BERLIN_KB = [
  { keys: ['anmeldung','adres','kay─▒t','registration','adresse','anmelden'], answer: '­ƒôï **Anmeldung (Adres Kayd─▒)**\n\nBerlin\'e ta┼ƒ─▒nd─▒ktan sonra **14 g├╝n i├ºinde** B├╝rgeramt\'a gidip adres kayd─▒ yapt─▒rman─▒z gerekir.\n\n­ƒö╣ Gerekli belgeler:\nÔÇó Kimlik/Pasaport\nÔÇó Kira s├Âzle┼ƒmesi\nÔÇó Wohnungsgeberbest├ñtigung (ev sahibinden onay formu)\n\n­ƒö╣ Online randevu: service.berlin.de\n\n­ƒÆí ─░pucu: Randevu bulmak zor olabilir. Her sabah 08:00\'da yeni randevular a├º─▒l─▒r!' },
  { keys: ['ev','kira','wohnung','daire','kiral─▒k','ev bulma','mietwohnung','housing'], answer: '­ƒÅá **Berlin\'de Ev Bulma**\n\nPop├╝ler arama siteleri:\nÔÇó immobilienscout24.de\nÔÇó wg-gesucht.de (payla┼ƒ─▒ml─▒ ev)\nÔÇó ebay-kleinanzeigen.de\nÔÇó immowelt.de\n\n­ƒö╣ Ortalama kira (so─ƒuk):\nÔÇó 1+1: 600-900Ôé¼\nÔÇó 2+1: 900-1.300Ôé¼\nÔÇó WG odas─▒: 400-650Ôé¼\n\n­ƒÆí ─░pucu: Schufa (kredi raporu) haz─▒r bulundurun. Ba┼ƒvurularda ├Âz-tan─▒t─▒m mektubu ├ºok i┼ƒe yarar!' },
  { keys: ['vize','visum','visa','oturum','├ºal─▒┼ƒma izni','aufenthaltstitel','blue card','mavi kart'], answer: '­ƒøé **Vize & Oturum ─░zni**\n\n­ƒö╣ T├╝rk vatanda┼ƒlar─▒ i├ºin:\nÔÇó Turist vizesi: Schengen vizesi (90 g├╝n)\nÔÇó ├çal─▒┼ƒma vizesi: ─░┼ƒ teklifi + Ausl├ñnderbeh├Ârde ba┼ƒvurusu\nÔÇó Mavi Kart (Blue Card): ├£niversite diplomas─▒ + y─▒ll─▒k min. ~43.800Ôé¼ maa┼ƒ\n\n­ƒö╣ Ausl├ñnderbeh├Ârde randevu:\notv.verwalt-berlin.de\n\n­ƒÆí ─░pucu: Ba┼ƒvuru ├Âncesi t├╝m belgelerin noter onayl─▒ ├ºevirilerini haz─▒rlay─▒n.' },
  { keys: ['ula┼ƒ─▒m','transport','bvg','u-bahn','s-bahn','bilet','fahrkarte','ticket','metro'], answer: '­ƒÜç **Berlin Ula┼ƒ─▒m Rehberi**\n\n­ƒö╣ Bilet t├╝rleri (AB B├Âlgesi):\nÔÇó Tek bilet: 3.20Ôé¼\nÔÇó G├╝nl├╝k: 9.50Ôé¼\nÔÇó Ayl─▒k: 86Ôé¼\nÔÇó Deutschland-Ticket: 49Ôé¼/ay (t├╝m Almanya!)\n\n­ƒö╣ Uygulamalar: BVG app, DB Navigator\n\n­ƒÆí ─░pucu: Deutschland-Ticket (49Ôé¼) en mant─▒kl─▒ se├ºenek ÔÇö b├╝t├╝n ┼ƒehir i├ºi + b├Âlgesel trenlerde ge├ºerli!' },
  { keys: ['i┼ƒ','job','arbeit','├ºal─▒┼ƒmak','maa┼ƒ','gehalt','i┼ƒ bulma','bewerbung'], answer: '­ƒÆ╝ **Berlin\'de ─░┼ƒ Bulma**\n\nPop├╝ler i┼ƒ arama platformlar─▒:\nÔÇó linkedin.com\nÔÇó indeed.de\nÔÇó stepstone.de\nÔÇó xing.com\nÔÇó arbeitsagentur.de\n\n­ƒö╣ Ortalama maa┼ƒlar (br├╝t):\nÔÇó IT Uzman─▒: 55-75kÔé¼\nÔÇó Gastronomi: 28-35kÔé¼\nÔÇó Ofis i┼ƒleri: 35-50kÔé¼\n\n­ƒÆí ─░pucu: Almanca bilmek b├╝y├╝k avantaj! VHS (Volkshochschule) kurslar─▒ olduk├ºa uygun fiyatl─▒.' },
  { keys: ['yeme','restoran','restaurant','yemek','cafe','kafe','d├Âner','t├╝rk','essen','food'], answer: '­ƒì¢´©Å **Yeme & ─░├ºme Rehberi**\n\nKreuzberg\'in en iyileri:\nÔÇó Has─▒r (Adalbertstr.) ÔÇö Klasik T├╝rk mutfa─ƒ─▒\nÔÇó Mustafa\'s Gem├╝se Kebap ÔÇö Efsanevi d├Âner\nÔÇó Five Elephant ÔÇö Specialty kahve\nÔÇó Markthalle Neun ÔÇö Street food cenneti\n\n­ƒö╣ Neuk├Âlln:\nÔÇó Sonnenallee ("Arap Soka─ƒ─▒") ÔÇö Ortado─ƒu lezzetleri\nÔÇó Lavanderia Vecchia ÔÇö ─░talyan fine dining\n\n­ƒÆí ─░pucu: ├û─ƒle yemeklerinde "Mittagstisch" men├╝lerine bak─▒n ÔÇö 7-12Ôé¼ aras─▒!' },
  { keys: ['sa─ƒl─▒k','arzt','doktor','hastane','sigorta','versicherung','krankenhaus','health'], answer: '­ƒÅÑ **Sa─ƒl─▒k Sistemi**\n\n­ƒö╣ Sigorta:\nÔÇó Zorunlu sa─ƒl─▒k sigortas─▒ (gesetzliche KV): TK, AOK, Barmer\nÔÇó Ayl─▒k: Maa┼ƒ─▒n ~%14.6\'s─▒ (yar─▒s─▒n─▒ i┼ƒveren ├Âder)\n\n­ƒö╣ Acil durumlar:\nÔÇó Acil: 112 numaray─▒ aray─▒n\nÔÇó ├ärztlicher Bereitschaftsdienst: 116 117\n\n­ƒÆí ─░pucu: Doctolib uygulamas─▒ ile kolayca doktor randevusu alabilirsiniz.' },
  { keys: ['dil','almanca','deutsch','sprache','kurs','├Â─ƒrenmek','lernen','language'], answer: '­ƒôÜ **Almanca ├û─ƒrenme**\n\n├£cretsiz/uygun kaynaklar:\nÔÇó VHS (Volkshochschule) ÔÇö d├Ânemlik kurslar (~100-200Ôé¼)\nÔÇó DW (Deutsche Welle) ÔÇö ├╝cretsiz online kurs\nÔÇó Goethe Institut ÔÇö profesyonel kurslar\nÔÇó Tandem dil uygulamalar─▒\n\n­ƒö╣ ├ûnemli seviyeler:\nÔÇó A1-A2: G├╝nl├╝k ya┼ƒam\nÔÇó B1: Oturum izni i├ºin gerekli\nÔÇó B2-C1: ─░┼ƒ d├╝nyas─▒\n\n­ƒÆí ─░pucu: Kreuzberg ve Neuk├Âlln\'de T├╝rk├ºe konu┼ƒanlar ├ºok ama Almanca pratik i├ºin Prenzlauer Berg idealdir!' },
  { keys: ['gece','nightlife','club','party','techno','berghain','bar','e─ƒlence'], answer: '­ƒÄÂ **Berlin Gece Hayat─▒**\n\nEfsanevi kul├╝pler:\nÔÇó Berghain/Panorama Bar ÔÇö Techno tap─▒na─ƒ─▒\nÔÇó Tresor ÔÇö End├╝striyel techno\nÔÇó Watergate ÔÇö Spree nehri manzaral─▒\nÔÇó KitKat Club ÔÇö ├ûnc├╝\nÔÇó Sisyphos ÔÇö A├º─▒k hava partisi\n\n­ƒÆí ─░pucu: Berghain\'e giri┼ƒ garanti de─ƒil! Sade giyinin, k├╝├º├╝k gruplarla gidin ve Almanca konu┼ƒun.' },
  { keys: ['hava','wetter','weather','s─▒cakl─▒k','ya─ƒmur','mevsim'], answer: '­ƒîñ´©Å **Berlin Hava Durumu**\n\nMevsimsel ortalamalar:\nÔÇó Yaz (Haz-A─ƒu): 20-30┬░C, uzun g├╝nler\nÔÇó K─▒┼ƒ (Kas-┼×ub): -5 ile 5┬░C, erken karanl─▒k\nÔÇó ─░lkbahar/Sonbahar: 8-18┬░C, de─ƒi┼ƒken\n\n­ƒÆí ─░pucu: K─▒┼ƒ ├ºok karanl─▒k olabilir, D vitamini alman─▒z ├Ânerilir. Yaz aylar─▒nda parklar ve g├Âller harikad─▒r!' },
  { keys: ['banka','konto','hesap','bank','n26','finans'], answer: '­ƒÅª **Banka Hesab─▒ A├ºma**\n\nPop├╝ler bankalar:\nÔÇó N26 ÔÇö %100 online, h─▒zl─▒ a├º─▒l─▒m\nÔÇó Deutsche Bank ÔÇö Geleneksel\nÔÇó Commerzbank ÔÇö Yayg─▒n ATM a─ƒ─▒\nÔÇó ING ÔÇö ├£cretsiz Girokonto\n\n­ƒö╣ Gerekli belgeler:\nÔÇó Kimlik/Pasaport\nÔÇó Anmeldung belgesi\nÔÇó Bazen Schufa (kredi raporu)\n\n­ƒÆí ─░pucu: N26 veya Wise ile Anmeldung\'dan bile ├Ânce hesap a├ºabilirsiniz!' },
  { keys: ['k├╝lt├╝r','museum','m├╝ze','sanat','kultur','galeri','ausstellung'], answer: '­ƒÄ¡ **K├╝lt├╝r & M├╝zeler**\n\n├£cretsiz/indirimli m├╝zeler:\nÔÇó Museumsinsel (UNESCO) ÔÇö kombi bilet 22Ôé¼\nÔÇó East Side Gallery ÔÇö ├╝cretsiz\nÔÇó Gedenkst├ñtte Berliner Mauer ÔÇö ├╝cretsiz\nÔÇó Her ay─▒n ilk Pazar g├╝n├╝ bir├ºok m├╝ze ├╝cretsiz!\n\n­ƒÆí ─░pucu: Museum Pass Berlin (3 g├╝n) 36Ôé¼ ÔÇö 30+ m├╝zeye giri┼ƒ!' },
  { keys: ['├ºocuk','kita','kre┼ƒ','okul','schule','kindergarten','aile'], answer: '­ƒæÂ **├çocuk & E─ƒitim**\n\nBerlin\'de Kita (kre┼ƒ):\nÔÇó Ba┼ƒvuru: kita-navigator.berlin.de\nÔÇó 0-6 ya┼ƒ aras─▒ ├╝cretsiz (son y─▒l zorunlu)\nÔÇó Erken ba┼ƒvuru yap─▒n ÔÇö bekleme listesi uzun!\n\n­ƒö╣ Okullar:\nÔÇó Devlet okullar─▒ ├╝cretsiz\nÔÇó T├╝rk-Alman E─ƒitim Merkezi Kreuzberg\'de\n\n­ƒÆí ─░pucu: Kita ba┼ƒvurusunu do─ƒumdan hemen sonra yap─▒n!' },
  { keys: ['merhaba','selam','hello','hi','hey','naber','nas─▒ls─▒n'], answer: 'Merhaba! ­ƒæï Ben Berlin Konu┼ƒuyor Asistan─▒. Size Berlin hakk─▒nda her konuda yard─▒mc─▒ olabilirim.\n\n┼×u konularda sorular sorabilirsiniz:\n­ƒôï Anmeldung & Resmi i┼ƒlemler\n­ƒÅá Ev bulma\n­ƒøé Vize & Oturum\n­ƒÜç Ula┼ƒ─▒m\n­ƒÆ╝ ─░┼ƒ arama\n­ƒì¢´©Å Yeme & ─░├ºme\n­ƒÄÂ Gece hayat─▒\n\nYa da a┼ƒa─ƒ─▒daki h─▒zl─▒ butonlar─▒ kullan─▒n!' },
  { keys: ['te┼ƒekk├╝r','sa─ƒol','danke','thanks','eyvallah'], answer: 'Rica ederim! ­ƒÿè Berlin\'de size yard─▒mc─▒ olmaktan mutluluk duyar─▒m. Ba┼ƒka sorunuz olursa ├ºekinmeden sorun!\n\n­ƒôº Daha detayl─▒ sorular─▒n─▒z i├ºin: hello@berlinkonusuyor.com' },
  { keys: ['schufa','kredi','kredit','credit'], answer: '­ƒôè **Schufa (Kredi Raporu)**\n\nSchufa, Almanya\'daki kredi itibar sistemidir.\n\n­ƒö╣ Nas─▒l al─▒n─▒r?\nÔÇó meineschufa.de ÔåÆ ├£cretsiz kopyay─▒ "Datenkopie" b├Âl├╝m├╝nden talep edin\nÔÇó ├£cretli an─▒nda eri┼ƒim: ~29.95Ôé¼\n\n­ƒö╣ Neden ├Ânemli?\nÔÇó Ev kiralama ba┼ƒvurular─▒nda ┼ƒart\nÔÇó Telefon aboneli─ƒi, kredi kart─▒\n\n­ƒÆí ─░pucu: ├£cretsiz Schufa kopyas─▒ y─▒lda 1 kez hakk─▒n─▒zd─▒r!' },
  { keys: ['spor','sport','fitness','gym','y├╝zme','schwimmen'], answer: '­ƒÅï´©Å **Spor ─░mkanlar─▒**\n\nUygun fiyatl─▒ se├ºenekler:\nÔÇó Fitness First, McFit: ~20-30Ôé¼/ay\nÔÇó Urban Sports Club: ~50-100Ôé¼/ay (├ºoklu tesis)\nÔÇó Berlin\'deki a├º─▒k hava spor alanlar─▒ ├╝cretsiz!\nÔÇó Halk y├╝zme havuzlar─▒: ~5-6Ôé¼/giri┼ƒ\n\n­ƒÆí ─░pucu: Tiergarten ve Tempelhofer Feld ko┼ƒu i├ºin m├╝kemmel!' },
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
    .replace(/ÔÇó /g, '&bull; ');
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
      addChatMsg(formatBotMessage('­ƒñö Bu konuda hen├╝z bilgi bankamda yeterli veri yok. Ama size yard─▒mc─▒ olmak isterim!\n\n­ƒôº Detayl─▒ sorular─▒n─▒z i├ºin: <a href="mailto:hello@berlinkonusuyor.com" style="color:var(--accent);text-decoration:underline;">hello@berlinkonusuyor.com</a>\n\n┼×u konularda sorular sorabilirsiniz:\n­ƒôï Anmeldung\n­ƒÅá Ev bulma\n­ƒøé Vize\n­ƒÜç Ula┼ƒ─▒m\n­ƒÆ╝ ─░┼ƒ bulma\n­ƒì¢´©Å Restoran'), 'bot-msg');
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

// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
// PREMIUM ENHANCEMENTS
// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ

// ÔöÇÔöÇ Splash Screen ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
function initSplash() {
  const splash = document.getElementById('splashScreen');
  if (!splash) return;

  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    splash.classList.add('hidden');
    document.body.style.overflow = '';
  }, 2600);
}

// ÔöÇÔöÇ Scroll Progress Bar ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
function initScrollProgress() {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;

  window.addEventListener('scroll', () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = (window.scrollY / docHeight) * 100;
    bar.style.width = scrolled + '%';
  }, { passive: true });
}

// ÔöÇÔöÇ Cursor Ring (Cursor 2.0) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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

// ÔöÇÔöÇ Parallax Hero ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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


// ÔöÇÔöÇ Tilt Effects ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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

// ÔöÇÔöÇ Animated Counter ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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

// ÔöÇÔöÇ Magnetic Buttons ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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

// ÔöÇÔöÇ Text Reveal Animation ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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

// ÔöÇÔöÇ Newsletter Form (Formsubmit.co & Brevo Template) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault(); // AJAX ile g├Ânderim i├ºin standart formu engelle
    
    const input = form.querySelector('.newsletter-input');
    const btn = form.querySelector('.newsletter-btn');
    const email = input.value.trim();
    
    // Basic Validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailPattern.test(email)) {
      btn.textContent = 'Ge├ºersiz E-posta!';
      btn.style.background = '#e74c3c';
      setTimeout(() => resetNewsletterBtn(btn), 2000);
      return;
    }

    // Loading State
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    // OPS─░YONEL: Brevo Entegrasyonu (Gelecekte API Key ile aktifle┼ƒtirilebilir)
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
        _subject: 'Yeni B├╝lten Aboneli─ƒi (Berlin Konu┼ƒuyor)'
      })
    })
    .then(response => response.json())
    .then(data => {
      // Success UI
      btn.innerHTML = 'Kay─▒t Ba┼ƒar─▒l─▒ <i class="fas fa-check"></i>';
      btn.style.background = '#22c55e';
      input.value = '';
      const msg = document.getElementById('newsletterMessage');
      if (msg) {
        msg.textContent = 'Ô£à Ba┼ƒar─▒yla abone olundu! Te┼ƒekk├╝rler.';
        msg.className = 'newsletter-message show success';
      }
      setTimeout(() => resetNewsletterBtn(btn), 3000);
    })
    .catch(error => {
      console.error(error);
      btn.textContent = 'Ba─ƒlant─▒ Hatas─▒';
      btn.style.background = '#e74c3c';
      const msg = document.getElementById('newsletterMessage');
      if (msg) {
        msg.textContent = 'ÔØî Bir sorun olu┼ƒtu, l├╝tfen tekrar deneyin.';
        msg.className = 'newsletter-message show error';
      }
      setTimeout(() => resetNewsletterBtn(btn), 2500);
    });
  });
}

/**
 * Brevo API Entegrasyon ┼×ablonu
 * Not: Bu kodu frontend'de kullanmak API anahtar─▒n─▒ a├º─▒k eder. 
 * G├╝venli kullan─▒m i├ºin Netlify/Vercel Functions kullan─▒lmal─▒d─▒r.
 */
async function subscribeToBrevo(email) {
  try {
    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': 'BREVO_API_KEY_BURAYA', // ÔåÉ G├£VENL─░K NOTU: API anahtar─▒n─▒ asla buraya yazmay─▒n!
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

// ÔöÇÔöÇ Init ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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

// ÔöÇÔöÇ Service Worker Registration ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Register either name to avoid 404s
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('Ô£à SW Registered: ', registration);
        })
        .catch(registrationError => {
          console.error('ÔØî SW Registration failed: ', registrationError);
        });
    });
  }
}

// ÔöÇÔöÇ Weekly Polls (Anket) Logic ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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
      pollQuestionEl.innerText = "┼×u an aktif bir anket bulunmuyor.";
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
    pollQuestionEl.innerText = "Anket y├╝klenirken bir hata olu┼ƒtu.";
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

// ÔöÇÔöÇ Interactive Map Initialization ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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
    { name: "T.C. Berlin Ba┼ƒkonsoloslu─ƒu", coords: [52.4965, 13.2985], desc: "Resmi i┼ƒlemleriniz i├ºin ba┼ƒkonsolosluk adresi." },
    { name: "Kreuzberg Merkez (SO36)", coords: [52.5003, 13.4243], desc: "K├╝├º├╝k ─░stanbul olarak da bilinir, T├╝rk n├╝fusunun yo─ƒun ya┼ƒad─▒─ƒ─▒, hareketli b├Âlge." },
    { name: "Brandenburg Kap─▒s─▒", coords: [52.5163, 13.3777], desc: "Berlin'in sembol├╝ ve en bilinen turistik noktas─▒." },
    { name: "Alexanderplatz", coords: [52.5219, 13.4132], desc: "┼×ehrin en kalabal─▒k ve merkezi noktalar─▒ndan biri." },
    { name: "East Side Gallery", coords: [52.5050, 13.4396], desc: "Berlin Duvar─▒'n─▒n en uzun kal─▒nt─▒s─▒ ve a├º─▒k hava galerisi." },
    { name: "Neuk├Âlln", coords: [52.4811, 13.4354], desc: "Son y─▒llar─▒n pop├╝ler, ├ºok k├╝lt├╝rl├╝ ve kafeleriyle ├╝nl├╝ semti." }
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

// ÔöÇÔöÇ Search Logic (Enhanced with Results Overlay & Shortcut) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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
      resultsList.innerHTML = '<div class="search-no-results">Sonu├º bulunamad─▒...</div>';
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
              <div class="search-result-meta">${n.source} ÔÇó ${formatDate(n.date)}</div>
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
              <div class="search-result-meta">${ev.date || 'Yak─▒nda'} ÔÇó ${ev.venue || 'Berlin'}</div>
            </div>
          </div>
        `;
      });
    }

    resultsList.innerHTML = html;
  }
}

// ÔöÇÔöÇ Theme Logic ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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

// ÔöÇÔöÇ Render Hero Featured Article ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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

// ÔöÇÔöÇ Category Filters Logic ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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

// ÔöÇÔöÇ Initialize App ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
document.addEventListener('DOMContentLoaded', () => {
  initJobBoard();
  initPolls();
});
