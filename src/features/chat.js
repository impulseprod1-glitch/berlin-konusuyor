import { db, auth, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, signInWithPopup, googleProvider, getDoc, doc } from '../firebase-config.js';
import { uploadMedia } from '../utils/media-upload.js';

let currentRoom = 'genel';
let unsubscribe = null;

export function initChat() {
  const chatTabs = document.getElementById('chatTabs');
  const chatForm = document.getElementById('chatForm');

  if (!chatTabs || !chatForm) return;

  chatTabs.addEventListener('click', (e) => {
    if (e.target.classList.contains('chat-tab-btn')) {
      document.querySelectorAll('.chat-tab-btn').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      const room = e.target.dataset.room;
      switchRoom(room, e.target.innerText);
    }
  });

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;

    if (!auth.currentUser) {
      alert("Mesaj göndermek için giriş yapmalısınız.");
      return;
    }

    sendChatMessage(msg);
  });
}

export async function sendChatMessage(text, imageUrl = null) {
  if (!auth.currentUser) return;
  
  const input = document.getElementById('chatInput');
  input.value = '';
  
  try {
    await addDoc(collection(db, `chat_${currentRoom}`), {
      text: text,
      image: imageUrl,
      senderId: auth.currentUser.uid,
      senderName: auth.currentUser.displayName || "Maskeli Balo",
      senderPhoto: auth.currentUser.photoURL || "",
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error("Mesaj gönderilemedi:", err);
  }
}

// Global Image Upload Handler for Chat
window.handleChatImage = async (event) => {
  const file = event.target.files[0];
  if (!file || !auth.currentUser) return;

  // Permission Check: Admin or Approved
  const ALLOWED_ADMINS = ['test@admin.com']; // Sync with admin.js or store in DB
  const isAdmin = ALLOWED_ADMINS.includes(auth.currentUser.email);
  
  // Also check "Approved" status from Firestore if needed
  // For now: Only Admins can upload in the prototype
  if (!isAdmin) {
    alert("Resim paylaşma yetkisi sadece onaylı üyeler ve adminlere aittir.");
    return;
  }

  const statusEl = document.getElementById('chatRoomStatus');
  const originalText = statusEl.innerText;
  statusEl.innerText = "Resim yükleniyor...";

  try {
    const fileName = `chat/${currentRoom}/${Date.now()}_${file.name}`;
    const url = await uploadMedia(file, fileName);
    await sendChatMessage("", url);
  } catch (err) {
    alert("Resim yüklenemedi.");
  } finally {
    statusEl.innerText = originalText;
  }
};

export function updateChatAuthState(user) {
  const barrier = document.getElementById('chatAuthBarrier');
  if (!barrier) return;
  if (user) {
    barrier.classList.add('hidden');
  } else {
    barrier.classList.remove('hidden');
    barrier.innerHTML = `Sohbete katılmak için <button id="chatLoginBtn" style="background:transparent; border:none; color:var(--accent); font-weight:bold; cursor:pointer; font-size:1rem;">Giriş Yapmalısınız</button>`;
    
    document.getElementById('chatLoginBtn').addEventListener('click', (e) => {
      e.preventDefault();
      signInWithPopup(auth, googleProvider).catch(err => console.error(err));
    });
  }
}

function switchRoom(roomId, roomName) {
  currentRoom = roomId;
  const statusEl = document.getElementById('chatRoomStatus');
  if (statusEl) statusEl.innerText = `${roomName} Odası Canlı`;

  const messagesContainer = document.getElementById('chatMessages');
  messagesContainer.innerHTML = `<div class="chat-empty-state"><p>Yükleniyor...</p></div>`;

  if (unsubscribe) {
    unsubscribe();
  }

  const q = query(collection(db, `chat_${roomId}`), orderBy("timestamp", "asc"));
  unsubscribe = onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      messagesContainer.innerHTML = `
        <div class="chat-empty-state">
          <i class="fas fa-comments"></i>
          <p>Burası oldukça sessiz. İlk mesajı siz atın!</p>
        </div>
      `;
      return;
    }

    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const isMine = auth.currentUser && data.senderId === auth.currentUser.uid;
      const typeClass = isMine ? 'sent' : 'received';
      
      let timeString = '';
      if (data.timestamp) {
        const d = data.timestamp.toDate();
        const hours = d.getHours().toString().padStart(2, '0');
        const mins = d.getMinutes().toString().padStart(2, '0');
        timeString = `${hours}:${mins}`;
      }

      html += `
        <div class="chat-bubble ${typeClass}">
          ${!isMine ? `<div class="chat-sender">
                         ${data.senderPhoto ? `<img src="${data.senderPhoto}" class="chat-sender-avatar">` : `<div class="chat-sender-avatar"></div>`}
                         ${data.senderName}
                       </div>` : ''}
          <div class="chat-text">
            ${data.image ? `<img src="${data.image}" class="chat-attached-image" onclick="window.open('${data.image}', '_blank')">` : ''}
            ${data.text || ''}
          </div>
          ${timeString ? `<div class="chat-time">${timeString}</div>` : ''}
        </div>
      `;
    });

    messagesContainer.innerHTML = html;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, err => {
    console.error("Sohbet dinlenemedi:", err);
    messagesContainer.innerHTML = `<div class="chat-empty-state"><p>Bağlantı hatası.</p></div>`;
  });
}
