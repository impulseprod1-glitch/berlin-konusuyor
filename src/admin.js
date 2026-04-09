import {
  db, auth, collection, addDoc, getDocs, getDoc, query, orderBy, onSnapshot, serverTimestamp,
  doc, updateDoc, deleteDoc, where, onAuthStateChanged
} from './firebase-config.js';
import { uploadMedia } from './utils/media-upload.js';

// --- ADMIN AUTH BARRIER ---
const ALLOWED_ADMINS = ['test@admin.com', 'oarslanerbln@gmail.com']; // Kendi e-postanızı buraya yazıp yetki alabilirsiniz

onAuthStateChanged(auth, (user) => {
  if (!user) {
    document.body.innerHTML = `
      <div style="display:flex; height:100vh; align-items:center; justify-content:center; flex-direction:column; background:#050505; color:white; font-family:sans-serif;">
        <h2>Lütfen Giriş Yapın</h2>
        <p>Admin paneline erişmek için oturum açmalısınız.</p>
        <a href="/" style="color:#e50914; margin-top:20px; text-decoration:none;">Ana Sayfaya Dön</a>
      </div>
    `;
    return;
  }
  
  // Güvenlik uyarısı (Konsolda)
  if(ALLOWED_ADMINS.length > 0 && !ALLOWED_ADMINS.includes(user.email)) {
    console.warn(`[GÜVENLİK UYARISI] ${user.email} admin yetkisine sahip değil. firebase.rules devreye girdiğinde verileri değiştiremeyeceksiniz.`);
  }
});

// Elements
const statNews = document.getElementById('statNews');
const statEvents = document.getElementById('statEvents');
const statSubs = document.getElementById('statSubs');
const statTokens = document.getElementById('statTokens');

// Tab Logic
const tabs = document.querySelectorAll('.nav-tab');
const contents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(target).classList.add('active');

    // Auto-load data if needed
    if (target === 'tab-subscribers') loadSubscribersList();
    if (target === 'tab-community') loadVerificationList();
    if (target === 'tab-notifications') loadTokenStats();
  });
});

const updateStats = () => {
  onSnapshot(collection(db, "news"), snap => { if (statNews) statNews.textContent = snap.size; });
  onSnapshot(collection(db, "events"), snap => { if (statEvents) statEvents.textContent = snap.size; });
  onSnapshot(collection(db, "subscribers"), snap => { if (statSubs) statSubs.textContent = snap.size; });
  onSnapshot(collection(db, "fcm_tokens"), snap => { if (statTokens) statTokens.textContent = snap.size; });
};

// --- NEWS MANAGEMENT ---
const addNewsForm = document.getElementById('addNewsForm');
const newsSubmitBtn = document.getElementById('newsSubmitBtn');

if (addNewsForm) {
  addNewsForm.addEventListener('submit', async (e) => {
    const id = document.getElementById('newsId').value;
    const fileInput = document.getElementById('newsImgFile');
    const btn = newsSubmitBtn;
    
    btn.disabled = true;
    btn.textContent = id ? 'Güncelleniyor...' : 'Yayınlanıyor...';

    let imageUrl = document.getElementById('newsImg').value;
    
    // Media Management: Handle file upload if present
    if (fileInput && fileInput.files[0]) {
      const file = fileInput.files[0];
      const fileName = `${Date.now()}_${file.name}`;
      imageUrl = await uploadMedia(file, `news/${fileName}`);
    }

    const newsData = {
      title: document.getElementById('newsTitle').value,
      category: document.getElementById('newsCat').value,
      source: document.getElementById('newsSource').value || 'Berlin Konuşuyor',
      image: imageUrl || 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=800',
      summary_tr: document.getElementById('newsSummary').value,
      updatedAt: serverTimestamp()
    };

    try {
      if (id) {
        await updateDoc(doc(db, "news", id), newsData);
        alert('Haber güncellendi!');
      } else {
        newsData.createdAt = serverTimestamp();
        newsData.date = new Date().toISOString();
        await addDoc(collection(db, "news"), newsData);
        alert('Haber yayınlandı!');
      }
      resetNewsForm();
      loadNewsList();
    } catch (err) {
      console.error(err);
      alert('Hata oluştu.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Haberi Yayınla';
    }
  });
}

function resetNewsForm() {
  addNewsForm.reset();
  document.getElementById('newsId').value = '';
  document.getElementById('newsFormTitle').textContent = 'Yeni Haber Ekle';
  document.getElementById('newsSubmitBtn').textContent = 'Haberi Yayınla';
  document.getElementById('cancelEditNews').style.display = 'none';
}

document.getElementById('cancelEditNews')?.addEventListener('click', resetNewsForm);

async function loadNewsList() {
  const list = document.getElementById('newsList');
  if (!list) return;
  list.innerHTML = '<p class="empty-list">Yükleniyor...</p>';
  try {
    const snap = await getDocs(query(collection(db, "news"), orderBy("createdAt", "desc")));
    list.innerHTML = snap.docs.map(d => {
      const data = d.data();
      return `
        <div class="data-item">
          <div class="item-info">
            <div class="item-title">${data.title}</div>
            <div class="item-meta">${data.category} | ${data.date ? new Date(data.date).toLocaleDateString('tr-TR') : 'Tarih yok'}</div>
          </div>
          <div class="item-actions">
            <button class="action-btn" onclick="editNews('${d.id}')">Düzenle</button>
            <button class="action-btn action-delete" onclick="deleteItem('news', '${d.id}')">Sil</button>
          </div>
        </div>
      `;
    }).join('') || '<p class="empty-list">Haber bulunamadı.</p>';
  } catch (err) {
    console.error('[Admin] Load News Error:', err);
    list.innerHTML = '<p class="empty-list">Haberler yüklenirken hata oluştu.</p>';
  }
}

window.editNews = async (id) => {
  try {
    const snap = await getDoc(doc(db, "news", id));
    if (snap.exists()) {
      const news = snap.data();
      document.getElementById('newsId').value = id;
      document.getElementById('newsTitle').value = news.title;
      document.getElementById('newsCat').value = news.category;
      document.getElementById('newsSource').value = news.source || '';
      document.getElementById('newsImg').value = news.image || '';
      document.getElementById('newsSummary').value = news.summary_tr || '';

      document.getElementById('newsFormTitle').textContent = 'Haberi Düzenle';
      document.getElementById('newsSubmitBtn').textContent = 'Güncelle';
      document.getElementById('cancelEditNews').style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  } catch (err) {
    console.error('[Admin] Edit News Error:', err);
    alert('Haber bilgileri alınamadı.');
  }
};

// --- EVENTS MANAGEMENT ---
async function loadEventsList() {
  const list = document.getElementById('eventsList');
  if (!list) return;
  list.innerHTML = '<p class="empty-list">Yükleniyor...</p>';
  try {
    const snap = await getDocs(query(collection(db, "events"), orderBy("date", "asc")));
    list.innerHTML = snap.docs.map(d => {
      const data = d.data();
      return `
        <div class="data-item">
          <div class="item-info">
            <div class="item-title">${data.title}</div>
            <div class="item-meta">${data.date || ''} | ${data.venue || ''}</div>
          </div>
          <div class="item-actions">
            <button class="action-btn" onclick="editEvent('${d.id}')">Düzenle</button>
            <button class="action-btn action-delete" onclick="deleteItem('events', '${d.id}')">Sil</button>
          </div>
        </div>
      `;
    }).join('') || '<p class="empty-list">Etkinlik bulunamadı.</p>';
  } catch (err) {
    console.error('[Admin] Load Events Error:', err);
    list.innerHTML = '<p class="empty-list">Etkinlikler yüklenirken hata oluştu.</p>';
  }
}

window.editEvent = async (id) => {
  try {
    const snap = await getDoc(doc(db, "events", id));
    if (snap.exists()) {
      const ev = snap.data();
      document.getElementById('eventId').value = id;
      document.getElementById('eventTitle').value = ev.title;
      document.getElementById('eventDate').value = ev.date || '';
      document.getElementById('eventVenue').value = ev.venue || '';
      document.getElementById('eventCat').value = ev.category || '';

      document.getElementById('eventFormTitle').textContent = 'Etkinliği Düzenle';
      document.getElementById('eventSubmitBtn').textContent = 'Güncelle';
      document.getElementById('cancelEditEvent').style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  } catch (err) {
    console.error('[Admin] Edit Event Error:', err);
    alert('Etkinlik bilgileri alınamadı.');
  }
};

function resetEventForm() {
  const form = document.getElementById('addEventForm');
  if (form) form.reset();
  document.getElementById('eventId').value = '';
  document.getElementById('eventFormTitle').textContent = 'Yeni Etkinlik Ekle';
  document.getElementById('eventSubmitBtn').textContent = 'Etkinliği Kaydet';
  document.getElementById('cancelEditEvent').style.display = 'none';
}

document.getElementById('cancelEditEvent')?.addEventListener('click', resetEventForm);

document.getElementById('addEventForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('eventId').value;
  const data = {
    title: document.getElementById('eventTitle').value,
    date: document.getElementById('eventDate').value,
    venue: document.getElementById('eventVenue').value,
    category: document.getElementById('eventCat').value,
    updatedAt: serverTimestamp()
  };

  try {
    if (id) {
      await updateDoc(doc(db, "events", id), data);
      alert('Etkinlik güncellendi!');
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, "events"), data);
      alert('Etkinlik eklendi!');
    }
    resetEventForm();
    loadEventsList();
  } catch(err) {
    console.error(err);
    alert('Hata oluştu.');
  }
});

// --- POLLS MANAGEMENT ---
document.getElementById('addPollForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const options = [
    { text: document.getElementById('pollOpt1').value, votes: 0 },
    { text: document.getElementById('pollOpt2').value, votes: 0 }
  ];
  const opt3 = document.getElementById('pollOpt3').value;
  if (opt3) options.push({ text: opt3, votes: 0 });

  const data = {
    question: document.getElementById('pollQuestion').value,
    options: options,
    active: true,
    createdAt: serverTimestamp()
  };

  await addDoc(collection(db, "polls"), data);
  alert('Anket başlatıldı!');
  e.target.reset();
  loadPollsList();
});

async function loadPollsList() {
  const list = document.getElementById('pollsList');
  if (!list) return;
  list.innerHTML = '<p class="empty-list">Yükleniyor...</p>';
  try {
    const snap = await getDocs(query(collection(db, "polls"), orderBy("createdAt", "desc")));
    list.innerHTML = snap.docs.map(d => {
      const data = d.data();
      const total = data.options?.reduce((a, b) => a + (b.votes || 0), 0) || 0;
      return `
        <div class="data-item">
          <div class="item-info">
            <div class="item-title">${data.question}</div>
            <div class="item-meta">Toplam Oy: ${total} | Başlangıç: ${data.createdAt?.toDate().toLocaleDateString('tr-TR') || ''}</div>
          </div>
          <div class="item-actions">
            <button class="action-btn action-delete" onclick="deleteItem('polls', '${d.id}')">Sil</button>
          </div>
        </div>
      `;
    }).join('') || '<p class="empty-list">Anket bulunamadı.</p>';
  } catch (err) {
    console.error('[Admin] Load Polls Error:', err);
    list.innerHTML = '<p class="empty-list">Anketler yüklenirken hata oluştu.</p>';
  }
}

// --- SUBSCRIBERS ---
async function loadSubscribersList() {
  const list = document.getElementById('subscribersList');
  if (!list) return;
  list.innerHTML = '<p class="empty-list">Yükleniyor...</p>';
  try {
    const snap = await getDocs(collection(db, "subscribers"));
    list.innerHTML = snap.docs.map(d => `
      <div class="data-item">
        <div class="item-info">
          <div class="item-title">${d.data().email}</div>
          <div class="item-meta">Katılım: ${d.data().timestamp?.toDate().toLocaleDateString('tr-TR') || 'Bilinmiyor'}</div>
        </div>
        <div class="item-actions">
          <button class="action-btn action-delete" onclick="deleteItem('subscribers', '${d.id}')">Sil</button>
        </div>
      </div>
    `).join('') || '<p class="empty-list">Abone yok.</p>';
  } catch (err) {
    console.error('[Admin] Load Subscribers Error:', err);
    list.innerHTML = '<p class="empty-list">Aboneler yüklenirken hata oluştu.</p>';
  }
}

// --- MODERATION ---
async function loadVerificationList() {
  const list = document.getElementById('verificationList');
  const miniList = document.getElementById('miniVerificationList');
  if (!list) return;

  try {
    const forumSnap = await getDocs(query(collection(db, "forum"), where("status", "==", "pending")));
    const jobsSnap = await getDocs(query(collection(db, "jobs"), where("status", "==", "pending")));

    const items = [];
    forumSnap.forEach(d => items.push({ id: d.id, col: 'forum', ...d.data() }));
    jobsSnap.forEach(d => items.push({ id: d.id, col: 'jobs', ...d.data() }));

    const html = items.map(item => {
      let title = item.title || item.name || 'Başlıksız';
      let body = item.text || '';
      if (item.col === 'jobs') {
        body = `${item.company || ''} | ${item.location || ''}<br>${item.contact || ''}`;
      }

      return `
        <div class="verification-card">
          <div class="verification-info">
            <div class="verification-type">${item.col === 'forum' ? 'Forum' : 'İş İlanı'}</div>
            <div class="verification-title">${title}</div>
            <p class="verification-body">${body}</p>
          </div>
          <div class="verification-actions">
            <button class="v-btn v-btn-approve" onclick="approveItem('${item.col}', '${item.id}')">Onayla</button>
            <button class="v-btn v-btn-reject" onclick="rejectItem('${item.col}', '${item.id}')">Reddet</button>
          </div>
        </div>
      `;
    }).join('');

    list.innerHTML = html || '<p class="empty-list">Bekleyen onay yok. ✅</p>';
    if (miniList) miniList.innerHTML = html || '<p class="empty-list">Temiz!</p>';
  } catch (err) {
    console.error('[Admin] Loading Verification Error:', err);
    list.innerHTML = '<p class="empty-list">Yüklenirken hata oluştu.</p>';
  }
}

window.approveItem = async (col, id) => {
  try {
    await updateDoc(doc(db, col, id), { status: 'approved' });
    alert('Onaylandı!');
    loadVerificationList();
  } catch (err) {
    console.error('[Admin] Approve Item Error:', err);
    alert('İşlem başarısız.');
  }
};

window.rejectItem = async (col, id) => {
  if (confirm('Silinsin mi?')) {
    try {
      await deleteDoc(doc(db, col, id));
      alert('Silindi.');
      loadVerificationList();
    } catch (err) {
      console.error('[Admin] Reject Item Error:', err);
      alert('İşlem başarısız.');
    }
  }
};

// Generic Delete
window.deleteItem = async (col, id) => {
  if (confirm('Emin misiniz? Bu işlem geri alınamaz.')) {
    try {
      await deleteDoc(doc(db, col, id));
      alert('Silindi.');
      if (col === 'news') loadNewsList();
      if (col === 'events') loadEventsList();
      if (col === 'polls') loadPollsList();
      if (col === 'subscribers') loadSubscribersList();
    } catch (err) {
      console.error('[Admin] Delete Item Error:', err);
      alert('Silinemedi.');
    }
  }
};

// Global Export
document.getElementById('exportData')?.addEventListener('click', async () => {
  try {
    const newsSnap = await getDocs(collection(db, "news"));
    const news = newsSnap.docs.map(d => d.data());
    const data = { news, timestamp: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${new Date().getTime()}.json`;
    a.click();
    alert('Yedek oluşturuldu.');
  } catch (err) {
    console.error('[Admin] Export Error:', err);
    alert('Yedekleme sırasında hata oluştu.');
  }
});

// --- PUSH NOTIFICATIONS ---
async function loadTokenStats() {
  const snap = await getDocs(collection(db, "fcm_tokens"));
  if (statTokens) statTokens.textContent = snap.size;
}

document.getElementById('pushForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('pushSubmitBtn');
  btn.disabled = true;
  btn.textContent = 'Gönderiliyor...';

  const pushData = {
    title: document.getElementById('pushTitle').value,
    body: document.getElementById('pushBody').value,
    url: document.getElementById('pushUrl').value || '/',
    type: document.getElementById('pushType').value,
    createdAt: serverTimestamp()
  };

  try {
    // Note: To send a real FCM push from the client, we usually need a Cloud Function.
    // Here we save the notification to a 'notifications_queue' collection.
    // A background trigger (or a script) will process this queue.
    await addDoc(collection(db, "notifications_queue"), pushData);
    alert('Bildirim kuyruğa alındı! Yakında tüm cihazlara iletilecek.');
    e.target.reset();
  } catch (err) {
    console.error(err);
    alert('Bildirim gönderilirken hata oluştu.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Bildirimi Gönder';
  }
});

// Init
updateStats();
loadVerificationList();

