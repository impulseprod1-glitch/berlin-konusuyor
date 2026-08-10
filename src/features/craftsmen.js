import { db, auth, collection, query, where, orderBy, onSnapshot, getDocs, addDoc, serverTimestamp } from '../firebase-config.js';

const TRADE_LABELS = {
  'boya-badana': 'Boya & Badana',
  'tesisatci': 'Tesisatçı',
  'elektrikci': 'Elektrikçi',
  'laminat-parke': 'Laminat & Parke',
  'nakliyat': 'Nakliyat',
  'temizlik': 'Temizlik',
  'diger': 'Diğer İşler',
};

function digitsOnly(phone) {
  return (phone || '').replace(/[^\d+]/g, '').replace(/^00/, '+');
}

export async function initCraftsmenBoard() {
  const grid = document.getElementById('craftsmenGrid');
  const filters = document.querySelectorAll('.craftsman-filter-btn');
  if (!grid) return;

  try {
    const ref = collection(db, 'craftsmen');
    const q = query(ref, where('status', '==', 'approved'), orderBy('createdAt', 'desc'));

    onSnapshot(q, (snap) => {
      const craftsmen = [];
      snap.forEach((doc) => craftsmen.push({ id: doc.id, ...doc.data() }));
      renderCraftsmen(craftsmen);
    });
  } catch (error) {
    console.error('Craftsmen error:', error);
  }

  filters.forEach((btn) => {
    btn.addEventListener('click', () => {
      filters.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const trade = btn.dataset.trade;

      getDocs(query(collection(db, 'craftsmen'), where('status', '==', 'approved'))).then((snap) => {
        let craftsmen = [];
        snap.forEach((doc) => craftsmen.push({ id: doc.id, ...doc.data() }));
        if (trade !== 'all') {
          craftsmen = craftsmen.filter((c) => c.trade === trade);
        }
        renderCraftsmen(craftsmen);
      });
    });
  });

  document.getElementById('craftsmanForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert('İlan vermek için giriş yapmalısınız.');
      return;
    }

    const name = document.getElementById('craftsmanName').value.trim();
    const trade = document.getElementById('craftsmanTrade').value;
    const district = document.getElementById('craftsmanDistrict').value.trim();
    const phone = document.getElementById('craftsmanPhone').value.trim();
    const description = document.getElementById('craftsmanDescription').value.trim();
    if (!name || !trade || !phone) return;

    try {
      await addDoc(collection(db, 'craftsmen'), {
        name, trade, district, phone, description,
        postedBy: auth.currentUser.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      alert('Kaydınız alındı, kontrol edildikten sonra yayına girecek.');
      e.target.reset();
      window.closeCraftsmanModal();
    } catch (err) {
      console.error('Craftsman submit error:', err);
      alert('Kayıt gönderilemedi, lütfen tekrar deneyin.');
    }
  });
}

export function renderCraftsmen(craftsmen) {
  const grid = document.getElementById('craftsmenGrid');
  if (!grid) return;

  if (!craftsmen.length) {
    grid.innerHTML = '<p class="no-data">Henüz onaylanmış usta yok — ilk kaydı siz oluşturabilirsiniz.</p>';
    return;
  }

  grid.innerHTML = craftsmen.map((c) => {
    const waLink = `https://wa.me/${digitsOnly(c.phone).replace('+', '')}`;
    return `
    <div class="job-card reveal glass-panel">
      <div class="job-badge">${TRADE_LABELS[c.trade] || c.trade}</div>
      <div class="job-logo-wrapper">
        <div class="job-logo-placeholder">${(c.name || 'U').charAt(0).toUpperCase()}</div>
      </div>
      <h3 class="job-title">${c.name}</h3>
      ${c.description ? `<p class="job-company">${c.description}</p>` : ''}
      <div class="job-meta">
        <span><i class="fas fa-map-marker-alt"></i> ${c.district || 'Berlin'}</span>
      </div>
      <a href="${waLink}" target="_blank" rel="noopener" class="job-apply-btn"><i class="fab fa-whatsapp"></i> WhatsApp'tan Yaz</a>
    </div>
  `;
  }).join('');

  const reveals = grid.querySelectorAll('.reveal');
  if (window.revealObserver) {
    reveals.forEach((el) => window.revealObserver.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('visible'));
  }
}

window.openCraftsmanModal = () => {
  if (!auth.currentUser) {
    alert('Kayıt oluşturmak için giriş yapmalısınız.');
    return;
  }
  document.getElementById('craftsmanModal')?.classList.add('active');
};

window.closeCraftsmanModal = () => {
  document.getElementById('craftsmanModal')?.classList.remove('active');
};
