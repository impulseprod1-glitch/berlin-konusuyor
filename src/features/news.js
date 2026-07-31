import { db, auth, collection, query, orderBy, onSnapshot, setDoc, doc, serverTimestamp, deleteDoc } from '../firebase-config.js';
import { renderAIDashboard } from './dashboard.js';
import { contentPath } from '../utils/slug.js';

/* Kategori yer tutucu görselleri.
   Önceden her biri Unsplash CDN'inden yükleniyordu: sayfa başına 20'ye
   varan dış istek, ziyaretçi IP'sinin üçüncü tarafa aktarılması ve CDN
   yavaşlarsa boş kartlar. Artık tamamı satır içi SVG degrade —
   sıfır ağ isteği, anında çizim, marka renkleriyle tutarlı. */
const CATEGORY_PALETTES = {
  politics:  [['#2b1216', '#7f1d1d'], ['#1a1020', '#4c1d95']],
  culture:   [['#101a24', '#0e7490'], ['#1d1526', '#7e22ce']],
  economy:   [['#0f1a14', '#166534'], ['#141a10', '#3f6212']],
  lifestyle: [['#241505', '#b45309'], ['#2a1207', '#9a3412']],
  default:   [['#101010', '#2a2a2a'], ['#0d1117', '#1f2937']],
};

function gradientDataUri([from, to], seed = 0) {
  const angle = seed % 2 === 0 ? '135' : '45';
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice">` +
    `<defs><linearGradient id="g" gradientTransform="rotate(${angle})">` +
    `<stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/>` +
    `</linearGradient></defs><rect width="800" height="450" fill="url(#g)"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const PLACEHOLDER_IMG = gradientDataUri(CATEGORY_PALETTES.default[0]);
export let globalNews = [];

export function getNewsImage(article) {
  if (article.image && article.image.startsWith('http')) return article.image;

  // Başlıktan kategori tahmini
  const title = (article.title || '').toLowerCase();
  let category = article.category || 'default';

  if (title.includes('ekonomi') || title.includes('enflasyon') || title.includes('euro')) category = 'economy';
  if (title.includes('sinema') || title.includes('sergi') || title.includes('konser')) category = 'culture';
  if (title.includes('grev') || title.includes('siyaset') || title.includes('scholz')) category = 'politics';
  if (title.includes('mekan') || title.includes('restoran') || title.includes('gezi')) category = 'lifestyle';

  const palettes = CATEGORY_PALETTES[category] || CATEGORY_PALETTES.default;
  const str = article.title || article.summary_tr || article.id || 'berlin';
  const seed = Array.from(str).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return gradientDataUri(palettes[seed % palettes.length], seed);
}

export function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
}

export function formatDate(isoDate) {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '';
  }
}

export function calculateReadTime(text) {
  const wordsPerMinute = 200;
  const noOfWords = (text || '').trim().split(/\s+/).length || 1;
  const minutes = Math.ceil(noOfWords / wordsPerMinute);
  return minutes || 1;
}

export function getTimeAgo(isoDate) {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'az önce';
  if (mins < 60) return `${mins} dakika önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}

export let currentEngineIndex = 0;
export let currentEngineArticles = [];

export function renderNews(articles, category = 'all') {
  const dashboardContainer = document.getElementById('newsEngine') || document.getElementById('newsGrid');
  const premiumContainer = document.getElementById('premiumNewsEngine');
  const countSpan = document.getElementById('newsCount');
  
  if (!dashboardContainer) return;

  let filtered = category === 'all'
    ? articles
    : articles.filter(a => a.category === category);
    
  // 1. Horizontal Dashboard (Metin Odaklı - Infinite Ticker)
  const dashboardArticles = filtered.slice(0, 10);
  
  // Duplicate for seamless loop if enough articles
  const tickerArticles = dashboardArticles.length > 3 
    ? [...dashboardArticles, ...dashboardArticles] 
    : dashboardArticles;

  dashboardContainer.innerHTML = tickerArticles.map((article) => {
    const rawTitle = article.summary_tr || article.title || '';
    const globalIdx = globalNews.indexOf(article);
    
    return `
      <article class="text-news-block reveal" data-action="open-news" data-index="${globalIdx}">
        <div class="text-news-top">
          <span class="text-news-category">${escapeHtml(article.category || 'GÜNDEM')}</span>
          <h3 class="text-news-title">${escapeHtml(rawTitle)}</h3>
        </div>
        <div class="text-news-footer">
          <span class="text-news-source">${escapeHtml(article.source || '')}</span>
          <a href="#" class="text-news-action">Oku <i class="fas fa-chevron-right"></i></a>
        </div>
      </article>
    `;
  }).join('');

  // Auto-scroll logic trigger
  initTickerEngine(dashboardContainer);


  // 2. Premium Discovery (Sonraki 6 haber)
  if (premiumContainer) {
    const premiumArticles = filtered.slice(10, 16);
    renderPremiumNews(premiumArticles, premiumContainer);
  }

  if (countSpan) {
    countSpan.textContent = `Berlin Rehberi: ${filtered.length} Aktif Gelişme`;
  }

  // Re-observe
  if (window.revealObserver) {
    dashboardContainer.querySelectorAll('.reveal').forEach(el => window.revealObserver.observe(el));
  }
}

export function renderPremiumNews(articles, container) {
  if (articles.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>Bu bölümde henüz analiz bulunmuyor.</p></div>`;
    return;
  }

  container.innerHTML = articles.map((article) => {
    const rawTitle = article.summary_tr || article.title || '';
    const globalIdx = globalNews.indexOf(article);
    const imgUrl = getNewsImage(article);
    const readTime = calculateReadTime(article.content || rawTitle);

    return `
      <article class="premium-news-card reveal" data-action="open-news" data-index="${globalIdx}">
        <div class="card-bg" style="background-image: url('${imgUrl}')"></div>
        <div class="card-overlay"></div>
        <div class="card-content">
          <span class="card-category">${escapeHtml(article.category || 'ANALİZ')}</span>
          <h3 class="card-title">${escapeHtml(rawTitle)}</h3>
          <p class="card-desc">${escapeHtml(article.content || rawTitle)}</p>
          <div class="card-footer">
            <div class="source-badge">
              <div class="source-icon"><i class="fas fa-feather-alt"></i></div>
              <span>${escapeHtml(article.source || '')}</span>
            </div>
            <span class="read-time"><i class="far fa-clock"></i> ${readTime} dk okuma</span>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Re-observe elements if observer exists
  if (window.revealObserver) {
    container.querySelectorAll('.reveal').forEach(el => window.revealObserver.observe(el));
  }
}

export function initTickerEngine(container) {
  if (!container) return;
  
  let scrollPos = 0;
  let isPaused = false;
  let animationId = null;

  function step() {
    if (!isPaused) {
      scrollPos += 0.8; // Speed of the ticker
      
      // Infinite loop check: if we scrolled half of the container content
      if (scrollPos >= container.scrollWidth / 2) {
        scrollPos = 0;
      }
      
      container.style.transform = `translateX(-${scrollPos}px)`;
    }
    animationId = requestAnimationFrame(step);
  }

  // Cleanup previous
  if (window._tickerId) cancelAnimationFrame(window._tickerId);
  
  container.addEventListener('mouseenter', () => isPaused = true);
  container.addEventListener('mouseleave', () => isPaused = false);
  
  // Start engine
  animationId = requestAnimationFrame(step);
  window._tickerId = animationId;
}



export function renderTicker(articles) {
  const ticker = document.getElementById('tickerContent');
  if (!ticker || !articles.length) return;

  const items = [...articles, ...articles].map((a, i) => `
    <span class="ticker-item" data-action="open-news" data-index="${i % articles.length}">${escapeHtml(a.summary_tr || a.title || '')}</span>
  `).join('');

  ticker.innerHTML = items;
}

export async function fetchFallbackNews() {
  try {
    const res = await fetch('/data/news.json');
    if (!res.ok) throw new Error('News fallback fetch failed');
    const data = await res.json();
    if (data.articles && data.articles.length > 0) {
      globalNews = data.articles;
      renderNews(globalNews);
      renderTicker(globalNews);

      if (data.insights && typeof renderAIDashboard === 'function') {
        renderAIDashboard(data.insights);
      }
      if (window.initBerlinPulse) window.initBerlinPulse(globalNews);
    }
  } catch (err) {
    console.error('[News] Fallback error:', err);
  }
}

export async function loadNews() {
  const grid = document.getElementById('newsGrid');
  if (grid) grid.innerHTML = '<div class="skeleton-card"></div>'.repeat(4);

  if (!db) {
    setTimeout(loadNews, 500);
    return;
  }

  try {
    let newsLoadingTimeout = setTimeout(() => {
      fetchFallbackNews();
    }, 5000);

    const q = query(collection(db, "news"), orderBy("date", "desc"));

    onSnapshot(q, async (snapshot) => {
      if (newsLoadingTimeout) clearTimeout(newsLoadingTimeout);
      let firestoreNews = [];
      snapshot.forEach((doc) => {
        firestoreNews.push({ id: doc.id, ...doc.data() });
      });

      if (firestoreNews.length === 0) {
        fetchFallbackNews();
      } else {
        globalNews = firestoreNews;
        renderNews(globalNews);
        renderTicker(globalNews);
        if (window.initBerlinPulse) window.initBerlinPulse(globalNews);
      }
    }, (error) => {
      console.error('[News] onSnapshot error:', error);
      if (newsLoadingTimeout) clearTimeout(newsLoadingTimeout);
      fetchFallbackNews();
    });

  } catch (err) {
    console.error('[News] Firestore error:', err);
    fetchFallbackNews();
  }
}

export function shareNews(title) {
  if (navigator.share) {
    navigator.share({
      title: 'Berlin Konuşuyor',
      text: title,
      url: window.location.href
    }).catch(console.error);
  } else {
    alert('Paylaş: ' + title);
  }
}

export async function toggleBookmark(index, btnEl) {
  const btn = btnEl || event.currentTarget;
  if (!auth.currentUser) {
    alert("Haberleri kaydetmek için lütfen önce Giriş Yapınız.");
    return;
  }

  const article = globalNews[index];
  if (!article) return;

  const icon = btn.querySelector('i');
  const isBookmarking = !icon.classList.contains('fas'); 
  
  icon.classList.toggle('fas', isBookmarking);
  icon.classList.toggle('far', !isBookmarking);

  try {
    const safeTitle = (article.title || '').replace(/[^a-zA-Z0-9]/g, '').substring(0, 25);
    const docId = `${auth.currentUser.uid}_${safeTitle}`;
    const bookmarkRef = doc(db, "bookmarks", docId);

    if (isBookmarking) {
      await setDoc(bookmarkRef, {
        userId: auth.currentUser.uid,
        title: article.summary_tr || article.title,
        source: article.source || 'Haber',
        dateAdded: serverTimestamp()
      });
    } else {
      await deleteDoc(bookmarkRef);
    }
  } catch (err) {
    console.error('Bookmark toggle DB error:', err);
  }
}

// ── Dynamic SEO Update ──
function updateNewsMeta(article) {
  if (!article) return;
  const title = article.summary_tr || article.title;
  const desc = (article.content || title).substring(0, 160);
  const img = getNewsImage(article);
  const url = 'https://berlinkonusuyor.com' + contentPath('haber', article);

  document.title = `${title} — Berlin Konuşuyor`;
  
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', desc);

  // OG Tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', title);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', desc);

  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) ogImage.setAttribute('content', img);

  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute('content', url);

  // JSON-LD NewsArticle
  let newsSchema = document.getElementById('newsEntrySchema');
  if (!newsSchema) {
    newsSchema = document.createElement('script');
    newsSchema.id = 'newsEntrySchema';
    newsSchema.type = 'application/ld+json';
    document.head.appendChild(newsSchema);
  }
  
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": title,
    "image": [img],
    "datePublished": article.date || new Date().toISOString(),
    "author": { "@type": "Organization", "name": "Berlin Konuşuyor" },
    "publisher": { 
      "@type": "Organization", 
      "name": "Berlin Konuşuyor", 
      "logo": { "@type": "ImageObject", "url": "https://berlinkonusuyor.com/icon-512.png" }
    }
  };
  newsSchema.text = JSON.stringify(schemaData);

  // Twitter Tags
  const twTitle = document.querySelector('meta[property="twitter:title"]');
  if (twTitle) twTitle.setAttribute('content', title);

  const twImage = document.querySelector('meta[property="twitter:image"]');
  if (twImage) twImage.setAttribute('content', img);
}

window.renderNews = renderNews;

// ── Haber Modalı Mantığı & Deep Linking ──
window.openNewsModal = (index) => {
  const modal = document.getElementById('newsModal');
  const article = globalNews[index];
  if (!modal || !article) return;

  // Gerçek URL: yenilenirse prerender edilmiş statik sayfa açılır.
  window.history.pushState(null, '', contentPath('haber', article));
  window.dispatchEvent(new CustomEvent('bk:navigate'));

  // UI Güncelleme
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
  };

  setText('newsModalTitle', article.summary_tr || article.title);
  setText('newsModalSource', article.source || 'Berlin Konuşuyor');
  setText('newsModalDate', formatDate(article.date));

  const descEl = document.getElementById('newsModalDesc');
  if (descEl) {
    descEl.textContent = article.content || article.summary_tr || article.title || '';
    descEl.style.whiteSpace = 'pre-wrap';
  }

  const imgEl = document.getElementById('newsModalImg');
  if (imgEl) imgEl.style.backgroundImage = `url('${getNewsImage(article)}')`;

  // Kaynak bağlantısı yalnızca dış bir URL varsa gösterilir.
  const linkBtn = document.getElementById('newsModalLink');
  if (linkBtn) {
    if (article.url) {
      linkBtn.href = article.url;
      linkBtn.style.display = '';
    } else {
      linkBtn.removeAttribute('href');
      linkBtn.style.display = 'none';
    }
  }

  updateNewsMeta(article);

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.closeNewsModal = () => {
  const modal = document.getElementById('newsModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Adresi ana sayfaya döndür
    if (window.location.pathname.startsWith('/haber/') || window.location.hash.includes('!news/')) {
        window.history.pushState('', document.title, '/' + window.location.search);
        // Reset Meta if needed (or let i18n handle it)
        if (window.updateMeta && window.currentLang) {
          window.updateMeta(window.currentLang);
        }
        // Remove article schema
        const newsSchema = document.getElementById('newsEntrySchema');
        if (newsSchema) newsSchema.remove();
    }
  }
};

// Sayfa yüklendiğinde veya hash değiştiğinde modalı kontrol et
function handleHashNavigation() {
    // Yeni biçim: /haber/<slug>-<idEki>   Eski biçim: #!news/<id>
    const { pathname, hash } = window.location;
    let index = -1;

    if (pathname.startsWith('/haber/')) {
        const slug = pathname.replace(/^\/haber\//, '').replace(/\/$/, '');
        index = globalNews.findIndex(n => contentPath('haber', n).endsWith('/' + slug));
    } else if (hash.startsWith('#!news/')) {
        const id = hash.replace('#!news/', '');
        index = globalNews.findIndex(n => n.id === id || `news-${globalNews.indexOf(n)}` === id);
    }

    if (index !== -1) {
        setTimeout(() => window.openNewsModal(index), 500); // Verilerin yüklenmesini bekle
    }
}

window.addEventListener('hashchange', handleHashNavigation);
window.addEventListener('popstate', handleHashNavigation);

// loadNews fonksiyonuna kanca atalım (veriler yüklendiğinde kontrol için)
const originalLoadNews = loadNews;
export async function loadNewsWithDeepLink() {
    await originalLoadNews();
    handleHashNavigation();
}


// ── Olay Dinleyicisi (Event Delegation) ──
document.addEventListener('click', (e) => {
  const nextCardBtn = e.target.closest('[data-action="next-news-card"]');
  if (nextCardBtn) {
    if (currentEngineIndex < currentEngineArticles.length - 1) {
      currentEngineIndex++;
      updateEngineUI();
    } else {
      // Loop or stop? Let's just stop or reset
      // To create a cool effect, we can stop at the last one or reset to 0
    }
  }

  const openNewsBtn = e.target.closest('[data-action="open-news"]');
  if (openNewsBtn) {
    e.stopPropagation(); // Avoid triggering nextCardBtn if "Oku" is clicked
    const index = parseInt(openNewsBtn.dataset.index);
    if(window.openNewsModal) window.openNewsModal(index);
  }

  const shareNewsBtn = e.target.closest('[data-action="share-news"]');
  if (shareNewsBtn) {
    e.stopPropagation();
    shareNews(shareNewsBtn.dataset.title);
  }

  const bookmarkBtn = e.target.closest('[data-action="toggle-bookmark"]');
  if (bookmarkBtn) {
    e.stopPropagation();
    const index = parseInt(bookmarkBtn.dataset.index);
    toggleBookmark(index, bookmarkBtn);
  }
});
