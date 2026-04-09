export let currentLang = localStorage.getItem('bk-lang') || 'tr';

export const translations = {
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
    listen_news: "Dinle"
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
    listen_news: "Hören"
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
    listen_news: "Listen"
  },
};

export function setLanguage(lang) {
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

export function updateMeta(lang) {
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

// Global register for HTML inline events
window.setLanguage = setLanguage;
