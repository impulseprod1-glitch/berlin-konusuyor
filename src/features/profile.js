import { auth, db, onAuthStateChanged, collection, query, where, getDocs, signOut } from '../firebase-config.js';

let currentUser = null;

// Gamification Badges Demo Data
const BADGES = {
  newbie: { icon: '🌱', title: 'Yeni Berlinli', desc: 'Topluluğa yeni katıldı' },
  helper: { icon: '🤝', title: 'Yardımsever', desc: 'Sorulara cevap verdi' },
  reporter: { icon: '📰', title: 'Haberci', desc: 'Faydalı bağlantılar paylaştı' }
};

document.addEventListener('DOMContentLoaded', () => {
  initProfileAuth();
  initProfileEvents();
});

function initProfileAuth() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      document.getElementById('userName').innerText = user.displayName || 'İsimsiz Kullanıcı';
      document.getElementById('userEmail').innerText = user.email;
      
      const avatarEl = document.getElementById('profileAvatar');
      if (user.photoURL) {
        avatarEl.innerHTML = `<img src="${user.photoURL}" style="width:100%; height:100%; border-radius:50%">`;
      } else {
        avatarEl.innerText = (user.displayName || 'B K').split(' ').map(n => n[0]).join('');
      }

      // Load Mock Gamification Stats (In real app, fetch from users collection)
      renderGamification(150, ['newbie', 'helper']);

      // Load initial tab
      loadBookmarks(user.uid);
    } else {
      window.location.href = '/';
    }
  });
}

function initProfileEvents() {
  document.addEventListener('click', (e) => {
    const actionEl = e.target.closest('[data-action]');
    if (!actionEl) return;
    
    const action = actionEl.dataset.action;
    if (action === 'logout') {
      signOut(auth).then(() => { window.location.href = '/'; });
    } else if (action === 'switch-tab') {
      const tabName = actionEl.dataset.tab;
      
      // Update UI active state
      document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
      actionEl.classList.add('active');
      
      // Load Tab Content
      if (tabName === 'bookmarks') {
        if (currentUser) loadBookmarks(currentUser.uid);
      } else if (tabName === 'my-posts') {
        if (currentUser) loadMyPosts(currentUser.uid);
      }
    }
  });
}

function renderGamification(points, userBadges) {
  const container = document.getElementById('gamificationContainer');
  if (!container) return;

  let badgesHtml = userBadges.map(bId => {
    const b = BADGES[bId];
    return `<div class="badge-item" title="${b.desc}">
              <span class="badge-icon">${b.icon}</span>
              <span class="badge-title">${b.title}</span>
            </div>`;
  }).join('');

  container.innerHTML = `
    <div class="gamification-card">
      <div class="g-points">
        <i class="fas fa-star" style="color:#f1c40f;"></i>
        <span>${points} Puan</span>
      </div>
      <div class="g-badges">
        ${badgesHtml}
      </div>
    </div>
  `;
}

async function loadBookmarks(uid) {
  const content = document.getElementById('tabContent');
  content.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size:2rem; color:var(--accent);"></i></div>';
  
  try {
    const q = query(collection(db, "bookmarks"), where("userId", "==", uid));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      content.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-bookmark"></i>
          <p>Henüz bir haber kaydetmediniz.</p>
        </div>
      `;
      return;
    }

    let html = '<div class="news-grid">';
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      html += `
        <article class="news-card glass-panel" style="padding: 15px; cursor: pointer;" onclick="window.open('${data.url || '#'}', '_blank')">
          <h3 style="font-size: 1.1rem; margin-bottom: 10px;">${data.title}</h3>
          <p style="font-size: 0.9rem; color: var(--text-secondary);"><i class="fas fa-newspaper"></i> Kaynak: ${data.source}</p>
        </article>
      `;
    });
    html += '</div>';
    content.innerHTML = html;

  } catch (err) {
    console.error("Favoriler yüklenirken hata:", err);
    content.innerHTML = '<p style="text-align:center; color:#e74c3c;">Favoriler yüklenirken bir hata oluştu.</p>';
  }
}

async function loadMyPosts(uid) {
  const content = document.getElementById('tabContent');
  content.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size:2rem; color:var(--accent);"></i></div>';
  
  try {
    // Topluluk Forumu Soruları
    const qForum = query(collection(db, "qa_forum"), where("userId", "==", uid));
    const forumSnap = await getDocs(qForum);
    
    const posts = [];
    forumSnap.forEach(docSnap => {
      posts.push({ id: docSnap.id, type: 'forum', ...docSnap.data() });
    });

    if (posts.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-pen"></i>
          <p>Henüz bir paylaşım yapmadınız. Soru sormak için "Topluluk" bölümünü kullanabilirsiniz.</p>
        </div>
      `;
      return;
    }

    // Sort descending by date (basic parsing since createdAt could be string or timestamp)
    posts.sort((a, b) => b.createdAt - a.createdAt);

    let html = '<div class="my-posts-list">';
    posts.forEach(post => {
      const dateStr = post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('tr-TR') : 'Bilinmeyen Tarih';
      
      html += `
        <div class="post-item glass-panel" style="padding: 20px; margin-bottom: 15px; border-radius: 12px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
            <span style="background:var(--bg-tertiary); color:var(--accent); padding:4px 10px; border-radius:20px; font-size:0.8rem;">${post.category || 'Forum'}</span>
            <span style="color:var(--text-muted); font-size:0.85rem;">${dateStr}</span>
          </div>
          <p style="font-size:1.1rem; line-height:1.5;">${post.question || post.text || 'Görüntülenemeyen içerik'}</p>
          <div style="margin-top: 15px; display:flex; gap:15px; color:var(--text-secondary); font-size:0.9rem;">
             <span><i class="fas fa-comment"></i> ${post.replies?.length || 0} Cevap</span>
             <span><i class="fas fa-arrow-up"></i> ${post.upvotes || 0} Oy</span>
          </div>
        </div>
      `;
    });
    html += '</div>';
    
    content.innerHTML = html;

  } catch (err) {
    console.error("Paylaşımlar yüklenirken hata:", err);
    content.innerHTML = '<p style="text-align:center; color:#e74c3c;">Paylaşımlarınız yüklenirken bir hata oluştu.</p>';
  }
}
