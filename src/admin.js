import { 
  db, auth, collection, addDoc, getDocs, query, orderBy, onSnapshot, serverTimestamp, 
  onAuthStateChanged 
} from './firebase-config.js';

const statNews = document.getElementById('statNews');
const statEvents = document.getElementById('statEvents');
const statSubs = document.getElementById('statSubs');

const updateStats = () => {
  // Real-time stats
  onSnapshot(collection(db, "news"), (snap) => {
    if (statNews) statNews.textContent = snap.size;
  });
  onSnapshot(collection(db, "events"), (snap) => {
    if (statEvents) statEvents.textContent = snap.size;
  });
  // Subscribers stat (if we have a collection for it)
  onSnapshot(collection(db, "subscribers"), (snap) => {
    if (statSubs) statSubs.textContent = snap.size;
  });
};

// Auth Check (Basic)
onAuthStateChanged(auth, (user) => {
  if (!user) {
    console.warn("Unauthorized access to admin panel.");
    // In a real app, we would redirect: window.location.href = '/';
  } else {
    console.log("Admin authenticated:", user.email);
  }
});

// Add News
const addNewsForm = document.getElementById('addNewsForm');
if (addNewsForm) {
  addNewsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    btn.textContent = 'Yayınlanıyor...';

    const newsData = {
      title: document.getElementById('newsTitle').value,
      category: document.getElementById('newsCat').value,
      source: document.getElementById('newsSource').value || 'Berlin Konuşuyor',
      image: document.getElementById('newsImg').value || 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=800',
      summary_tr: document.getElementById('newsSummary').value,
      date: new Date().toISOString(),
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, "news"), newsData);
      alert('Haber başarıyla eklendi!');
      e.target.reset();
    } catch (err) {
      console.error("Error adding news:", err);
      alert("Hata oluştu.");
    } finally {
      btn.disabled = false;
      btn.textContent = 'Haberi Yayınla';
    }
  });
}

// Add Event
const addEventForm = document.getElementById('addEventForm');
if (addEventForm) {
  addEventForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    btn.textContent = 'Kaydediliyor...';

    const eventData = {
      title: document.getElementById('eventTitle').value,
      date: document.getElementById('eventDate').value,
      venue: document.getElementById('eventVenue').value,
      category: document.getElementById('eventCat').value,
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, "events"), eventData);
      alert('Etkinlik başarıyla eklendi!');
      e.target.reset();
    } catch (err) {
      console.error("Error adding event:", err);
      alert("Hata oluştu.");
    } finally {
      btn.disabled = false;
      btn.textContent = 'Etkinliği Kaydet';
    }
  });
}

// Export Data (Backup)
const exportBtn = document.getElementById('exportData');
if (exportBtn) {
  exportBtn.addEventListener('click', async () => {
    const newsSnap = await getDocs(collection(db, "news"));
    const eventsSnap = await getDocs(collection(db, "events"));
    
    const data = {
      news: newsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      events: eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `berlin_konusuyor_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  });
}

updateStats();
