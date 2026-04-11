import { db, auth, collection, query, orderBy, onSnapshot, setDoc, doc, serverTimestamp, deleteDoc } from '../firebase-config.js';
import { translations, currentLang } from '../utils/i18n.js';
import { renderAIDashboard } from './dashboard.js';

export const CATEGORY_IMAGES = {
  politics: [
    'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80',
    'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&q=80',
    'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=800&q=80',
    'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?w=800&q=80'
  ],
  culture: [
    'https://images.unsplash.com/photo-1580655653885-65763b2597ad?w=800&q=80',
    'https://images.unsplash.com/photo-1499364615650-ec38552f4ba8?w=800&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=80'
  ],
  economy: [
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80',
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80',
    'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=800&q=80'
  ],
  lifestyle: [
    'https://images.unsplash.com/photo-1559564484-e484c2076b46?w=800&q=80',
    'https://images.unsplash.com/photo-1444491741275-3747c53d95c4?w=800&q=80',
    'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&q=80',
    'https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=800&q=80'
  ],
  default: [
    'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&q=80',
    'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80',
    'https://images.unsplash.com/photo-1502899576159-f224dc2349fa?w=800&q=80',
    'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80'
  ]
};

export const PLACEHOLDER_IMG = CATEGORY_IMAGES.default[0];
export let globalNews = [];

export function getNewsImage(article) {
  if (article.image && article.image.startsWith('http')) return article.image;
  
  // Gelişmiş Keyword Eşleme
  const title = (article.title || '').toLowerCase();
  let category = article.category || 'default';
  
  if (title.includes('ekonomi') || title.includes('enflasyon') || title.includes('euro')) category = 'economy';
  if (title.includes('sinema') || title.includes('sergi') || title.includes('konser')) category = 'culture';
  if (title.includes('grev') || title.includes('siyaset') || title.includes('scholz')) category = 'politics';
  if (title.includes('mekan') || title.includes('restoran') || title.includes('gezi')) category = 'lifestyle';

  const categoryPool = CATEGORY_IMAGES[category] || CATEGORY_IMAGES.default;
  const str = article.title || article.summary_tr || article.id || "berlin";
  const index = Array.from(str).reduce((acc, char) => acc + char.charCodeAt(0), 0) % categoryPool.length;
  return categoryPool[index];
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

  dashboardContainer.innerHTML = tickerArticles.map((article, idx) => {
    const rawTitle = article.summary_tr || article.title || '';
    const globalIdx = globalNews.indexOf(article);
    
    return `
      <article class="text-news-block reveal" data-action="open-news" data-index="${globalIdx}">
        <div class="text-news-top">
          <span class="text-news-category">${article.category || 'GÜNDEM'}</span>
          <h3 class="text-news-title">${rawTitle}</h3>
        </div>
        <div class="text-news-footer">
          <span class="text-news-source">${article.source}</span>
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
    const safeTitle = rawTitle.replace(/"/g, '&quot;');
    const globalIdx = globalNews.indexOf(article);
    const imgUrl = getNewsImage(article);
    const readTime = calculateReadTime(article.content || rawTitle);

    return `
      <article class="premium-news-card reveal" data-action="open-news" data-index="${globalIdx}">
        <div class="card-bg" style="background-image: url('${imgUrl}')"></div>
        <div class="card-overlay"></div>
        <div class="card-content">
          <span class="card-category">${article.category || 'ANALİZ'}</span>
          <h3 class="card-title">${rawTitle}</h3>
          <p class="card-desc">${article.content || rawTitle}</p>
          <div class="card-footer">
            <div class="source-badge">
              <div class="source-icon"><i class="fas fa-feather-alt"></i></div>
              <span>${article.source}</span>
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
    <span class="ticker-item" data-action="open-news" data-index="${i % articles.length}">${a.summary_tr || a.title}</span>
  `).join('');

  ticker.innerHTML = items;
}

export function renderHeroFeatured(article) {
  // Hero featured kutusu kaldırıldı.
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
  const url = `https://berlinkonusuyor.com/#!news/${article.id || ''}`;

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

  // Deep Linking: Update URL Hash
  const newsId = article.id || `news-${index}`;
  window.history.pushState(null, null, `#!news/${newsId}`);

  // UI Güncelleme
  document.getElementById('newsModalTitle').innerText = article.summary_tr || article.title;
  document.getElementById('newsModalSource').innerText = article.source || 'Berlin Konuşuyor';
  document.getElementById('newsModalDate').innerText = formatDate(article.date);
  document.getElementById('newsModalDesc').innerHTML = article.content || article.summary_tr || article.title;
  document.getElementById('newsModalImg').style.backgroundImage = `url('${getNewsImage(article)}')`;
  
  if (linkBtn) linkBtn.href = article.url || '#';

  updateNewsMeta(article);

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.closeNewsModal = () => {
  const modal = document.getElementById('newsModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Deep Linking: Clear Hash
    if (window.location.hash.includes('!news/')) {
        window.history.pushState("", document.title, window.location.pathname + window.location.search);
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
    const hash = window.location.hash;
    if (hash.startsWith('#!news/')) {
        const id = hash.replace('#!news/', '');
        const index = globalNews.findIndex(n => n.id === id || `news-${globalNews.indexOf(n)}` === id);
        if (index !== -1) {
            setTimeout(() => window.openNewsModal(index), 500); // Küçük bir gecikme ile verilerin yüklenmesini bekle
        }
    }
}

window.addEventListener('hashchange', handleHashNavigation);

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
