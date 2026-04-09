import { db, auth, collection, query, where, orderBy, onSnapshot, doc, updateDoc, increment, addDoc, serverTimestamp, getDoc } from '../firebase-config.js';

function getTimeAgo(dateStr) {
  try {
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return 'Az önce';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} dk önce`;
    const hrs = Math.floor(minutes / 60);
    if (hrs < 24) return `${hrs} sa önce`;
    return `${Math.floor(hrs / 24)} gün önce`;
  } catch(e) { return '...'; }
}

export function initQAForum() {
  const qaForm = document.getElementById('qaForm');
  const qaFeed = document.getElementById('qaFeed');
  const qaFilters = document.querySelectorAll('.qa-filter-btn');
  const qaSortBtns = document.querySelectorAll('.qa-sort-btn');

  if (!qaForm || !qaFeed) return;

  let questions = [];
  let currentCategory = 'all';
  let currentSort = 'newest';

  // Listen to Firestore "forum" collection
  const q = query(collection(db, "forum"), where("status", "==", "approved"), orderBy("time", "desc"));

  onSnapshot(q, (snapshot) => {
    questions = [];
    snapshot.forEach((docSnap) => {
      questions.push({ id: docSnap.id, ...docSnap.data() });
    });

    if (questions.length === 0) {
      questions = [
        {
          id: 'default1',
          name: 'Ahmet Y.',
          text: 'Merhaba, Kreuzberg civarında uygun fiyatlı ve nezih bir kiralık ev bulmak için hangi siteleri önerirsiniz?',
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

  function renderFeed() {
    let filtered = [...questions];
    if (currentCategory !== 'all') {
      filtered = filtered.filter(qItem => qItem.category === currentCategory);
    }

    if (currentSort === 'newest') {
      filtered.sort((a, b) => new Date(b.time) - new Date(a.time));
    } else {
      filtered.sort((a, b) => (b.karma + (b.replies?.length || 0)) - (a.karma + (a.replies?.length || 0)));
    }

    qaFeed.innerHTML = filtered.map(qItem => `
      <div class="qa-card glass-panel reveal-small" data-id="${qItem.id}">
        <div class="qa-header">
          <div class="qa-author-box">
            <div class="qa-avatar">${(qItem.name || 'A').charAt(0).toUpperCase()}</div>
            <div>
              <div class="qa-author">${qItem.name}</div>
              <div class="qa-time">${getTimeAgo(qItem.time)}</div>
            </div>
          </div>
          <span class="qa-badge-category">${qItem.category || 'Genel'}</span>
        </div>
        <div class="qa-body">${qItem.text}</div>

        ${qItem.replies && qItem.replies.length > 0 ? `
          <div class="qa-replies-section">
            ${qItem.replies.map(r => `
              <div class="qa-reply-item">
                <div class="qa-reply-author"><strong>${r.name}</strong> • ${getTimeAgo(r.time)}</div>
                <div class="qa-reply-text">${r.text}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="qa-actions">
          <button class="qa-action-btn upvote" data-action="upvote-qa" data-id="${qItem.id}"><i class="fas fa-arrow-up"></i> ${qItem.karma}</button>
          <button class="qa-action-btn reply-toggle" data-action="toggle-reply-form" data-id="${qItem.id}"><i class="far fa-comment-alt"></i> ${qItem.replies?.length || 0} Yanıt</button>
        </div>

        <div class="qa-reply-form-wrapper" id="reply-form-${qItem.id}" style="display:none">
          <div class="qa-reply-input-group">
            <input type="text" placeholder="Adınız" class="reply-name-input" id="reply-name-${qItem.id}">
            <textarea placeholder="Yanıtınızı yazın..." class="reply-text-input" id="reply-text-${qItem.id}"></textarea>
            <button class="reply-submit-btn" data-action="submit-reply" data-id="${qItem.id}">Gönder</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  const upvoteQA = async (id) => {
    const qDoc = doc(db, "forum", id);
    try {
      await updateDoc(qDoc, {
        karma: increment(1)
      });
    } catch(e) { console.error('Upvote failed:', e); }
  };

  const toggleReplyForm = (id) => {
    const form = document.getElementById(`reply-form-${id}`);
    if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
  };

  const submitReply = async (id) => {
    const nameInput = document.getElementById(`reply-name-${id}`);
    const textInput = document.getElementById(`reply-text-${id}`);
    const name = nameInput.value.trim() || 'Anonim';
    const text = textInput.value.trim();

    if (!text) return;

    const qDoc = doc(db, "forum", id);
    const qFound = questions.find(x => x.id === id);
    if (qFound) {
      const newReplies = [...(qFound.replies || []), {
        name,
        text,
        time: new Date().toISOString()
      }];
      try {
        await updateDoc(qDoc, { replies: newReplies });
        nameInput.value = '';
        textInput.value = '';
        toggleReplyForm(id);
      } catch(e) { console.error('Reply failed:', e); }
    }
  };

  // ── Olay Dinleyicisi (Event Delegation) ──
  qaFeed.addEventListener('click', (e) => {
    const upvoteBtn = e.target.closest('[data-action="upvote-qa"]');
    if (upvoteBtn) {
      upvoteQA(upvoteBtn.dataset.id);
      return;
    }

    const toggleReplyBtn = e.target.closest('[data-action="toggle-reply-form"]');
    if (toggleReplyBtn) {
      toggleReplyForm(toggleReplyBtn.dataset.id);
      return;
    }

    const submitReplyBtn = e.target.closest('[data-action="submit-reply"]');
    if (submitReplyBtn) {
      submitReply(submitReplyBtn.dataset.id);
      return;
    }
  });

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
      replies: [],
      status: 'pending'
    };

    try {
      const orgHtml = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gönderiliyor...';
      console.log('[Forum] Soru gönderiliyor...', newQ);
      await addDoc(collection(db, "forum"), newQ);
      console.log('[Forum] Soru başarıyla eklendi.');

      alert("Sorunuz alındı ve kontrol edildikten sonra yayına girecektir.");

      textInput.value = '';
      nameInput.value = '';
      btn.innerHTML = 'Gönderildi <i class="fas fa-check"></i>';
      btn.style.background = '#22c55e';
      setTimeout(() => {
        btn.innerHTML = orgHtml;
        btn.style.background = '';
      }, 2000);
    } catch(err) {
      console.error('[Forum] Gönderim hatası:', err);
      alert('Soru gönderilemedi: ' + err.message);
    }
  });

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

/** 
 * Alternative QA init used below line 2690.
 */
export function initQA() {
  const qaForm = document.getElementById('qaForm');
  // Avoid conflict if the same form ID is used. Assuming it might be on another page or we override.
  const qaFeed = document.getElementById('qaFeed');
  if (!qaForm || !qaFeed) return;

  // The logic is somewhat redundant with initQAForum, however keeping both just in case.
}

window.initQAForum = initQAForum;
