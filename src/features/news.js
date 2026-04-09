import { db, auth, collection, query, orderBy, onSnapshot, setDoc, doc, serverTimestamp, deleteDoc } from '../firebase-config.js';
import { translations, currentLang } from '../utils/i18n.js';
import { renderAIDashboard } from './dashboard.js';

export const CATEGORY_IMAGES = {
  politics: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80',
  culture: 'https://images.unsplash.com/photo-1580655653885-65763b2597ad?w=800&q=80',
  economy: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80',
  lifestyle: 'https://images.unsplash.com/photo-1559564484-e484c2076b46?w=800&q=80',
  default: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&q=80'
};

export const PLACEHOLDER_IMG = CATEGORY_IMAGES.default;
export let globalNews = [];

export function getNewsImage(article) {
  if (article.image && article.image.startsWith('http')) return article.image;
  return CATEGORY_IMAGES[article.category] || CATEGORY_IMAGES.default;
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
  const container = document.getElementById('newsEngine') || document.getElementById('newsGrid');
  const countSpan = document.getElementById('newsCount');
  if (!container) return;

  let filtered = category === 'all'
    ? articles
    : articles.filter(a => a.category === category);
    
  // Limit to daily 10 headlines
  filtered = filtered.slice(0, 10);
  currentEngineArticles = filtered;
  currentEngineIndex = 0;

  if (countSpan) {
    countSpan.textContent = `Günün Öne Çıkan ${filtered.length} Haberi`;
  }

  updateEngineUI();
}

export function updateEngineUI() {
  const container = document.getElementById('newsEngine') || document.getElementById('newsGrid');
  if (!container || !currentEngineArticles) return;

  if (currentEngineArticles.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>Bu kategoride haber bulunamadı.</p></div>`;
    return;
  }

  container.innerHTML = currentEngineArticles.map((article, index) => {
    const rawTitle = article.summary_tr || article.title || '';
    const safeTitle = rawTitle.replace(/"/g, '&quot;');
    const timeAgo = getTimeAgo(article.date || new Date().toISOString());
    const globalIdx = globalNews.indexOf(article);
    const imgUrl = getNewsImage(article);

    return `
      <article class="news-card" data-action="open-news" data-index="${globalIdx}">
        <div class="news-card-img">
          <img src="${imgUrl}" alt="${safeTitle}" loading="lazy" onerror="this.onerror=null;this.src='/img/placeholder.png';" style="width:100%; height:100%; object-fit:cover;">
        </div>
        <div class="news-card-content">
          <div class="news-meta">
            <span class="news-source-tag">${article.source}</span>
            <span class="news-read-time"><i class="far fa-clock"></i> ${timeAgo}</span>
          </div>
          <h3 class="news-card-title">${rawTitle}</h3>
          <div class="news-card-actions">
            <!-- Share button must stop propagation or be checked in event listener -->
            <button class="action-btn share-trigger" style="z-index:10; position:relative;" data-action="share-news" data-title="${safeTitle}" title="Paylaş">
              <i class="fas fa-share-alt"></i>
            </button>
            <button class="action-btn" title="Oku">
              <i class="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
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
  const container = document.getElementById('heroFeaturedNews');
  if (!container || !article) return;

  container.innerHTML = `
    <article class="news-card magnetic-card" data-action="open-news" data-index="0">
      <div class="news-card-img" style="background-image: url('${getNewsImage(article)}')"></div>
      <div class="news-card-content">
        <div class="news-meta">
          <span class="news-source-tag">${article.source}</span>
          <span class="news-date">${formatDate(article.date)}</span>
        </div>
        <h3 class="news-card-title">${article.summary_tr || article.title}</h3>
      </div>
    </article>
  `;

  if (window.revealObserver) {
    container.querySelectorAll('.reveal').forEach(el => window.revealObserver.observe(el));
  }
}

export async function fetchFallbackNews() {
  console.log('[News] Fetching local fallback news...');
  try {
    const res = await fetch('/data/news.json');
    if (!res.ok) throw new Error('News fallback fetch failed');
    const data = await res.json();
    if (data.articles && data.articles.length > 0) {
      globalNews = data.articles;
      renderNews(globalNews);
      renderTicker(globalNews);
      renderHeroFeatured(globalNews[0]);

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

  console.log('[News] loadNews triggered with DB:', db);
  if (!db) {
    console.warn('[News] DB not ready yet, retrying in 500ms...');
    setTimeout(loadNews, 500);
    return;
  }

  try {
    let newsLoadingTimeout = setTimeout(() => {
      console.warn('[News] Firestore timeout reaching 5s, using fallback');
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
        if (globalNews.length > 0) renderHeroFeatured(globalNews[0]);
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
      console.log('Bookmarked saved');
    } else {
      await deleteDoc(bookmarkRef);
      console.log('Bookmark removed');
    }
  } catch (err) {
    console.error('Bookmark toggle DB error:', err);
  }
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
  
  const linkBtn = document.getElementById('newsModalLink');
  if (linkBtn) linkBtn.href = article.url || '#';

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
