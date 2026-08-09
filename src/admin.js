import {
  db, auth, collection, addDoc, getDocs, getDoc, query, orderBy, onSnapshot, serverTimestamp,
  doc, updateDoc, deleteDoc, where, onAuthStateChanged
} from './firebase-config.js';
import { uploadMedia, probeVideoFile, convertImageToWebP } from './utils/media-upload.js';
import { parseVideoUrl } from './utils/video-url.js';
import { resolveAdminStatus } from './utils/admin-claim.js';
import { categoryLabel } from './features/news.js';

// --- ADMIN AUTH BARRIER ---
// Gerçek yetki sınırı firestore.rules/storage.rules'taki "admin" custom
// claim kontrolü — bu yalnızca UX için: admin olmayan bir kullanıcıyı
// paneli açık tutup konsolda uyarmak yerine net biçimde bilgilendirir.
onAuthStateChanged(auth, async (user) => {
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

  const isAdmin = await resolveAdminStatus(user);
  if (!isAdmin) {
    console.warn(`[GÜVENLİK UYARISI] ${user.email} admin yetkisine sahip değil. firebase.rules devreye girdiğinde verileri değiştiremeyeceksiniz.`);
    return;
  }

  // Firestore sorguları admin claim'i doğrulanmadan (yani auth henüz
  // hazır değilken) başlatılırsa "permission-denied" ile kalıcı olarak
  // durur — onSnapshot bu hatadan sonra otomatik yeniden denemez.
  updateStats();
  loadVerificationList();
});

// Elements
const statNews = document.getElementById('statNews');
const statEvents = document.getElementById('statEvents');
const statSubs = document.getElementById('statSubs');
const statTokens = document.getElementById('statTokens');

// Sidebar Tab Logic
const navItems = document.querySelectorAll('.nav-item');
const contents = document.querySelectorAll('.tab-content');
const pageTitle = document.getElementById('pageTitle');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const target = item.dataset.tab;
    if (!target) return; // For non-tab items (export, etc)

    navItems.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));
    
    item.classList.add('active');
    const targetEl = document.getElementById(target);
    if (targetEl) targetEl.classList.add('active');
    
    // Update Page Title
    if (pageTitle) {
      pageTitle.textContent = item.innerText.trim();
    }

    // Auto-load data if needed
    if (target === 'tab-subscribers') loadSubscribersList();
    if (target === 'tab-community') loadVerificationList();
    if (target === 'tab-notifications') loadTokenStats();
    if (target === 'tab-news') loadNewsList();
    if (target === 'tab-videos') loadVideosList();
    if (target === 'tab-events') loadEventsList();
    if (target === 'tab-polls') loadPollsList();
    if (target === 'tab-analytics') loadAnalytics();
  });
});

/* ── Analitik ─────────────────────────────────────────────
   analytics_daily koleksiyonundaki günlük+sayfa sayaçlarını
   son 7 gün için istemci tarafında toplar. Yazma tarafı
   src/features/analytics.js içindedir. */
async function loadAnalytics() {
  const list = document.getElementById('analyticsList');
  const totalEl = document.getElementById('analyticsTotal');
  if (!list) return;
  list.innerHTML = '<p class="empty-list">Yükleniyor...</p>';

  try {
    const since = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const snap = await getDocs(query(collection(db, 'analytics_daily'), where('date', '>=', since)));

    const byPath = {};
    let total = 0;
    snap.forEach((d) => {
      const { path, views } = d.data();
      byPath[path] = (byPath[path] || 0) + (views || 0);
      total += views || 0;
    });

    if (totalEl) totalEl.textContent = total.toLocaleString('tr-TR');

    const rows = Object.entries(byPath).sort((a, b) => b[1] - a[1]).slice(0, 15);
    list.innerHTML =
      rows
        .map(
          ([path, views]) => `
        <div class="data-item">
          <div class="item-info">
            <div class="item-title">${path}</div>
          </div>
          <div class="item-meta">${views.toLocaleString('tr-TR')} görüntülenme</div>
        </div>`
        )
        .join('') || '<p class="empty-list">Henüz veri yok.</p>';
  } catch (err) {
    console.error('[Admin] Analytics Error:', err);
    list.innerHTML = '<p class="empty-list">Analitik yüklenirken hata oluştu.</p>';
  }
}

/**
 * Antigravity OS durum göstergesi (yalnızca yerel geliştirme).
 *
 * Eskiden canlı sitede de her 10 saniyede bir localhost:8080'e istek
 * atıyordu; bu istek üretimde her zaman başarısız oluyor, konsolu
 * kirletiyor ve boşuna zamanlayıcı çalıştırıyordu. Artık yalnızca
 * yerel makinede ve tek sefer kontrol ediliyor.
 */
async function monitorAGStatus() {
  const statusDot = document.querySelector('.ag-status-dot');
  const statusText = document.getElementById('agStatusText');
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);

  if (!isLocal) {
    if (statusDot) statusDot.style.background = '#666';
    if (statusText) statusText.textContent = 'CANLI ORTAM';
    return;
  }

  try {
    await fetch('http://localhost:8080/api/status', { mode: 'no-cors' });
    if (statusDot) statusDot.style.background = '#00ff88';
    if (statusText) statusText.textContent = 'SYSTEM ACTIVE: V3.0';
  } catch {
    if (statusDot) statusDot.style.background = '#666';
    if (statusText) statusText.textContent = 'DISCONNECTED';
  }
}

const updateStats = () => {
  onSnapshot(collection(db, "news"), snap => { if (statNews) statNews.textContent = snap.size; });
  onSnapshot(collection(db, "events"), snap => { if (statEvents) statEvents.textContent = snap.size; });
  onSnapshot(collection(db, "subscribers"), snap => { if (statSubs) statSubs.textContent = snap.size; });
  onSnapshot(collection(db, "fcm_tokens"), snap => { if (statTokens) statTokens.textContent = snap.size; });
  onSnapshot(collection(db, "videos"), snap => {
    const el = document.getElementById('statVideos');
    if (el) el.textContent = snap.size;
  });
};


// --- NEWS MANAGEMENT ---
const addNewsForm = document.getElementById('addNewsForm');
const newsSubmitBtn = document.getElementById('newsSubmitBtn');

if (addNewsForm) {
  addNewsForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Olmadan sayfa yenilenir ve haber kaydedilmez.
    const id = document.getElementById('newsId').value;
    const fileInput = document.getElementById('newsImgFile');
    const btn = newsSubmitBtn;
    
    btn.disabled = true;
    btn.textContent = id ? 'Güncelleniyor...' : 'Yayınlanıyor...';

    let imageUrl = document.getElementById('newsImg').value;
    
    // Media Management: Handle file upload if present
    if (fileInput && fileInput.files[0]) {
      const file = await convertImageToWebP(fileInput.files[0]);
      const fileName = `${Date.now()}_${file.name}`;
      imageUrl = await uploadMedia(file, `news/${fileName}`);
    }

    const newsData = {
      title: document.getElementById('newsTitle').value,
      category: document.getElementById('newsCat').value,
      source: document.getElementById('newsSource').value || 'Berlin Konuşuyor',
      image: imageUrl || '', // Boşsa istemci tarafında degrade yer tutucu üretilir
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
            <div class="item-meta">${categoryLabel(data.category)} | ${data.date ? new Date(data.date).toLocaleDateString('tr-TR') : 'Tarih yok'}</div>
          </div>
          <div class="item-actions">
            <button class="action-btn" data-action="edit-news" data-id="${d.id}">Düzenle</button>
            <button class="action-btn action-delete" data-action="delete-item" data-col="news" data-id="${d.id}">Sil</button>
          </div>
        </div>
      `;
    }).join('') || '<p class="empty-list">Haber bulunamadı.</p>';
  } catch (err) {
    console.error('[Admin] Load News Error:', err);
    list.innerHTML = '<p class="empty-list">Haberler yüklenirken hata oluştu.</p>';
  }
}

async function editNews(id) {
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
}

/* ═══════════════════════════════════════════════════════════
   VIDEO HABER YÖNETİMİ
   Bağlantı yapıştır → kapak otomatik gelir.
   Dosya yükle → süre, yön ve kapak karesi tarayıcıda çıkarılır.
   Kaydet → Firestore 'videos' koleksiyonuna yazılır ve site
   onSnapshot sayesinde anında güncellenir.
   ═══════════════════════════════════════════════════════════ */

const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200 MB güvenlik sınırı

const videoUrlInput = document.getElementById('videoUrl');
const videoFileInput = document.getElementById('videoFile');
const videoPreviewBox = document.getElementById('videoPreviewBox');
const videoPreviewImg = document.getElementById('videoPreviewImg');
const videoUrlHint = document.getElementById('videoUrlHint');
const videoFileHint = document.getElementById('videoFileHint');
const videoUploadBar = document.getElementById('videoUploadBar');
const videoUploadFill = document.getElementById('videoUploadFill');

// Dosyadan çıkarılan veriler burada bekletilir.
let pendingVideoProbe = null;

function setPreview(src) {
  if (!videoPreviewBox || !videoPreviewImg) return;
  if (src) {
    videoPreviewImg.src = src;
    videoPreviewBox.style.display = 'block';
  } else {
    videoPreviewImg.removeAttribute('src');
    videoPreviewBox.style.display = 'none';
  }
}

videoUrlInput?.addEventListener('input', () => {
  const parsed = parseVideoUrl(videoUrlInput.value);
  if (!videoUrlInput.value.trim()) {
    if (videoUrlHint) videoUrlHint.textContent = 'Bağlantı yapıştırıldığında kapak görseli otomatik alınır.';
    setPreview('');
    return;
  }
  if (!parsed) {
    if (videoUrlHint) videoUrlHint.textContent = '⚠️ Bağlantı tanınamadı. YouTube, Shorts, Vimeo veya .mp4 bağlantısı kullanın.';
    setPreview('');
    return;
  }
  if (videoUrlHint) {
    const label = { youtube: 'YouTube', vimeo: 'Vimeo', file: 'Doğrudan video dosyası' }[parsed.provider];
    videoUrlHint.textContent = `✅ ${label} algılandı.`;
  }
  setPreview(parsed.thumbnail);
  const orientationEl = document.getElementById('videoOrientation');
  if (orientationEl && parsed.orientation) orientationEl.value = parsed.orientation;
});

videoFileInput?.addEventListener('change', async () => {
  const file = videoFileInput.files?.[0];
  pendingVideoProbe = null;
  if (!file) {
    if (videoFileHint) videoFileHint.textContent = '';
    return;
  }

  if (file.size > MAX_VIDEO_BYTES) {
    if (videoFileHint) {
      videoFileHint.textContent = `⚠️ Dosya çok büyük (${(file.size / 1048576).toFixed(0)} MB). En fazla 200 MB. Uzun videolar için YouTube bağlantısı önerilir.`;
    }
    videoFileInput.value = '';
    return;
  }

  if (videoFileHint) videoFileHint.textContent = '⏳ Video inceleniyor (süre + kapak karesi)...';
  pendingVideoProbe = await probeVideoFile(file);

  const orientationEl = document.getElementById('videoOrientation');
  if (orientationEl) orientationEl.value = pendingVideoProbe.orientation;

  if (pendingVideoProbe.poster) setPreview(URL.createObjectURL(pendingVideoProbe.poster));

  if (videoFileHint) {
    const mins = Math.floor(pendingVideoProbe.duration / 60);
    const secs = Math.round(pendingVideoProbe.duration % 60);
    videoFileHint.textContent = `✅ Hazır — ${mins}:${String(secs).padStart(2, '0')} · ${(file.size / 1048576).toFixed(1)} MB · kapak otomatik oluşturuldu.`;
  }
});

document.getElementById('addVideoForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('videoId').value;
  const btn = document.getElementById('videoSubmitBtn');
  const file = videoFileInput?.files?.[0];
  const linkValue = videoUrlInput?.value.trim() || '';

  if (!file && !linkValue) {
    alert('Bir video bağlantısı yapıştırın veya bir video dosyası seçin.');
    return;
  }

  btn.disabled = true;
  btn.textContent = id ? 'Güncelleniyor...' : 'Yayınlanıyor...';

  try {
    let provider = 'file';
    let videoId = '';
    let videoUrl = linkValue;
    let thumbnail = '';
    let duration = 0;

    if (file) {
      // 1) Videoyu Storage'a yükle (ilerleme çubuğu ile)
      if (videoUploadBar) videoUploadBar.style.display = 'block';
      const stamp = Date.now();
      const safeName = file.name.replace(/[^\w.\-]+/g, '_');
      videoUrl = await uploadMedia(file, `videos/${stamp}_${safeName}`, (pct) => {
        if (videoUploadFill) videoUploadFill.style.width = `${pct}%`;
        btn.textContent = `Yükleniyor… %${pct}`;
      });

      // 2) Tarayıcıda üretilen kapak karesini yükle
      if (pendingVideoProbe?.poster) {
        try {
          thumbnail = await uploadMedia(pendingVideoProbe.poster, `videos/thumbs/${stamp}.webp`);
        } catch (err) {
          console.warn('Kapak yüklenemedi, video kapaksız kaydedilecek:', err.message);
        }
      }
      duration = pendingVideoProbe?.duration || 0;
    } else {
      const parsed = parseVideoUrl(linkValue);
      if (!parsed) {
        alert('Bağlantı tanınamadı. YouTube, Shorts, Vimeo veya doğrudan .mp4 bağlantısı kullanın.');
        return;
      }
      provider = parsed.provider;
      videoId = parsed.videoId;
      videoUrl = parsed.videoUrl;
      thumbnail = parsed.thumbnail;
    }

    const videoData = {
      title: document.getElementById('videoTitle').value.trim(),
      category: document.getElementById('videoCat').value,
      description: document.getElementById('videoDesc').value.trim(),
      orientation: document.getElementById('videoOrientation').value,
      featured: document.getElementById('videoFeatured').checked,
      status: document.getElementById('videoDraft').checked ? 'draft' : 'published',
      provider,
      videoId,
      videoUrl,
      updatedAt: serverTimestamp(),
    };

    if (thumbnail) videoData.thumbnail = thumbnail;
    if (duration) videoData.duration = Math.round(duration);

    if (id) {
      await updateDoc(doc(db, 'videos', id), videoData);
      alert('Video güncellendi ve sitede anında yayınlandı.');
    } else {
      videoData.date = new Date().toISOString();
      videoData.views = 0;
      videoData.createdAt = serverTimestamp();
      await addDoc(collection(db, 'videos'), videoData);
      alert('Video yayınlandı! Ana sayfada anında görünür.');
    }

    resetVideoForm();
    loadVideosList();
  } catch (err) {
    console.error('[Admin] Video kaydetme hatası:', err);
    alert(`Video kaydedilemedi: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = document.getElementById('videoId').value ? 'Güncelle' : 'Videoyu Yayınla';
    if (videoUploadBar) videoUploadBar.style.display = 'none';
    if (videoUploadFill) videoUploadFill.style.width = '0%';
  }
});

function resetVideoForm() {
  const form = document.getElementById('addVideoForm');
  if (form) form.reset();
  document.getElementById('videoId').value = '';
  document.getElementById('videoFormTitle').textContent = 'Yeni Video Haber';
  document.getElementById('videoSubmitBtn').textContent = 'Videoyu Yayınla';
  document.getElementById('cancelEditVideo').style.display = 'none';
  pendingVideoProbe = null;
  setPreview('');
  if (videoFileHint) videoFileHint.textContent = '';
  if (videoUrlHint) videoUrlHint.textContent = 'Bağlantı yapıştırıldığında kapak görseli otomatik alınır.';
}

document.getElementById('cancelEditVideo')?.addEventListener('click', resetVideoForm);

async function loadVideosList() {
  const list = document.getElementById('videosList');
  if (!list) return;
  list.innerHTML = '<p class="empty-list">Yükleniyor...</p>';
  try {
    const snap = await getDocs(query(collection(db, 'videos'), orderBy('date', 'desc')));
    list.innerHTML =
      snap.docs
        .map((d) => {
          const v = d.data();
          const badge = v.status === 'draft' ? ' · TASLAK' : '';
          const star = v.featured ? ' ⭐' : '';
          const dur = v.duration ? ` · ${Math.floor(v.duration / 60)}:${String(Math.round(v.duration % 60)).padStart(2, '0')}` : '';
          return `
        <div class="data-item">
          <div class="item-info">
            <div class="item-title">${v.title || 'Başlıksız'}${star}</div>
            <div class="item-meta">${v.category || '—'} · ${v.provider || '—'}${dur} · ${v.views || 0} izlenme${badge}</div>
          </div>
          <div class="item-actions">
            <button class="action-btn" data-action="edit-video" data-id="${d.id}">Düzenle</button>
            <button class="action-btn action-delete" data-action="delete-item" data-col="videos" data-id="${d.id}">Sil</button>
          </div>
        </div>`;
        })
        .join('') || '<p class="empty-list">Henüz video yok. İlk videonuzu ekleyin!</p>';
  } catch (err) {
    console.error('[Admin] Load Videos Error:', err);
    list.innerHTML = '<p class="empty-list">Videolar yüklenirken hata oluştu.</p>';
  }
}

async function editVideo(id) {
  try {
    const snap = await getDoc(doc(db, 'videos', id));
    if (!snap.exists()) return;
    const v = snap.data();

    document.getElementById('videoId').value = id;
    document.getElementById('videoTitle').value = v.title || '';
    document.getElementById('videoCat').value = v.category || 'Röportaj';
    document.getElementById('videoDesc').value = v.description || '';
    document.getElementById('videoOrientation').value = v.orientation || 'landscape';
    document.getElementById('videoFeatured').checked = !!v.featured;
    document.getElementById('videoDraft').checked = v.status === 'draft';
    if (videoUrlInput) videoUrlInput.value = v.videoUrl || '';
    setPreview(v.thumbnail || '');

    document.getElementById('videoFormTitle').textContent = 'Videoyu Düzenle';
    document.getElementById('videoSubmitBtn').textContent = 'Güncelle';
    document.getElementById('cancelEditVideo').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    console.error('[Admin] Edit Video Error:', err);
    alert('Video bilgileri alınamadı.');
  }
}

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
            <button class="action-btn" data-action="edit-event" data-id="${d.id}">Düzenle</button>
            <button class="action-btn action-delete" data-action="delete-item" data-col="events" data-id="${d.id}">Sil</button>
          </div>
        </div>
      `;
    }).join('') || '<p class="empty-list">Etkinlik bulunamadı.</p>';
  } catch (err) {
    console.error('[Admin] Load Events Error:', err);
    list.innerHTML = '<p class="empty-list">Etkinlikler yüklenirken hata oluştu.</p>';
  }
}

async function editEvent(id) {
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
}

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
            <button class="action-btn action-delete" data-action="delete-item" data-col="polls" data-id="${d.id}">Sil</button>
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
          <button class="action-btn action-delete" data-action="delete-item" data-col="subscribers" data-id="${d.id}">Sil</button>
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
            <button class="v-btn v-btn-approve" data-action="approve-item" data-col="${item.col}" data-id="${item.id}">Onayla</button>
            <button class="v-btn v-btn-reject" data-action="reject-item" data-col="${item.col}" data-id="${item.id}">Reddet</button>
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

async function approveItem(col, id) {
  try {
    await updateDoc(doc(db, col, id), { status: 'approved' });
    alert('Onaylandı!');
    loadVerificationList();
  } catch (err) {
    console.error('[Admin] Approve Item Error:', err);
    alert('İşlem başarısız.');
  }
}

async function rejectItem(col, id) {
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
}

// Generic Delete
async function deleteItem(col, id) {
  if (confirm('Emin misiniz? Bu işlem geri alınamaz.')) {
    try {
      await deleteDoc(doc(db, col, id));
      alert('Silindi.');
      if (col === 'news') loadNewsList();
      if (col === 'videos') loadVideosList();
      if (col === 'events') loadEventsList();
      if (col === 'polls') loadPollsList();
      if (col === 'subscribers') loadSubscribersList();
    } catch (err) {
      console.error('[Admin] Delete Item Error:', err);
      alert('Silinemedi.');
    }
  }
}

// ── Global Event Delegation (Data-Action) ──
document.addEventListener('click', (e) => {
  const actionEl = e.target.closest('[data-action]');
  if (!actionEl) return;

  const { action, col, id } = actionEl.dataset;

  switch (action) {
    case 'edit-news': editNews(id); break;
    case 'edit-video': editVideo(id); break;
    case 'edit-event': editEvent(id); break;
    case 'approve-item': approveItem(col, id); break;
    case 'reject-item': rejectItem(col, id); break;
    case 'delete-item': deleteItem(col, id); break;
  }
});

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
monitorAGStatus(); // Tek sefer — sürekli yoklama kaldırıldı.


