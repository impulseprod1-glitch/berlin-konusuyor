import { CATEGORY_IMAGES, PLACEHOLDER_IMG } from './news.js';

/**
 * Berlin Pulse (Şehrin Nabzı) özelliğini başlatır.
 * Haberleri kategorilere göre gruplar ve öne çıkan başlıkları kabarcık (bubble) olarak sunar.
 */
export function initBerlinPulse(articles) {
  const container = document.getElementById('berlinPulse');
  if (!container || !articles || articles.length === 0) return;

  // 1. Kategorileri ve en son haberleri belirle
  const pulseItems = [];
  const categoriesSeen = new Set();

  // En yeni 5 haberi "Yeni" etiketiyle ekle
  articles.slice(0, 5).forEach((article, idx) => {
    pulseItems.push({
      id: article.id || `news-${idx}`,
      label: article.title.substring(0, 15) + '...',
      img: article.image || CATEGORY_IMAGES[article.category] || PLACEHOLDER_IMG,
      action: () => {
        if (window.openNewsModal) window.openNewsModal(articles.indexOf(article));
      },
      isNew: true
    });
  });

  // Kategorilere göre "Hızlı Göz At" kabarcıkları ekle
  const categories = [...new Set(articles.map(a => a.category))];
  categories.forEach(cat => {
    if (!cat) return;
    const firstOfCat = articles.find(a => a.category === cat);
    pulseItems.push({
      id: `cat-${cat}`,
      label: translateCategory(cat),
      img: CATEGORY_IMAGES[cat] || PLACEHOLDER_IMG,
      action: () => {
        const filterBtn = document.querySelector(`.filter-btn[data-category="${cat}"]`);
        if (filterBtn) {
           filterBtn.click();
           filterBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      },
      isNew: false
    });
  });

  // 2. HTML Üretimi
  container.innerHTML = pulseItems.map(item => `
    <div class="pulse-bubble ${item.isNew ? 'pulse-new' : ''}" data-pulse-id="${item.id}">
      <div class="pulse-avatar-wrapper">
        <div class="pulse-avatar" style="background-image: url('${item.img}')"></div>
      </div>
      <span class="pulse-label">${item.label}</span>
    </div>
  `).join('');

  // 3. Click Eventleri
  container.querySelectorAll('.pulse-bubble').forEach((el, idx) => {
    el.addEventListener('click', () => {
      pulseItems[idx].action();
      
      // İzleme efekti
      el.classList.add('pulse-viewed');
    });
  });
}

/**
 * Kategori isimlerini Türkçeleştirir
 */
function translateCategory(cat) {
  const dict = {
    politics: 'Siyaset',
    culture: 'Kültür',
    economy: 'Ekonomi',
    lifestyle: 'Yaşam',
    berlin: 'Berlin',
    almanya: 'Almanya'
  };
  return dict[cat] || cat;
}

// Global erişim için window nesnesine ekle
window.initBerlinPulse = initBerlinPulse;
