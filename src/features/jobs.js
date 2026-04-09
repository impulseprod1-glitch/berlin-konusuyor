import { db, auth, collection, query, where, orderBy, onSnapshot, getDocs, addDoc, serverTimestamp } from '../firebase-config.js';

export const DEMO_JOBS = [
  { id: 'demo1', title: 'Barista / Servis Elemanı', company: 'The Barn Coffee Roasters', location: 'Mitte', type: 'Part-time', contact: 'jobs@thebarn.de', status: 'approved' },
  { id: 'demo2', title: 'Senior Software Engineer', company: 'Zalando SE', location: 'Friedrichshain', type: 'Full-time', contact: 'careers@zalando.de', status: 'approved' },
  { id: 'demo3', title: 'Satış Danışmanı', company: 'KaDeWe', location: 'Schöneberg', type: 'Minijob', contact: 'hr@kadewe.de', status: 'approved' },
  { id: 'demo4', title: 'Kurye / Teslimat Sorumlusu', company: 'Lieferando', location: 'Berlin Geneli', type: 'Full-time', contact: 'apply@lieferando.de', status: 'approved' }
];

export async function initJobBoard() {
  const jobsGrid = document.getElementById('jobsGrid');
  const jobFilters = document.querySelectorAll('.job-filter-btn');
  if (!jobsGrid) return;

  try {
    const jobsRef = collection(db, "jobs");
    const q = query(jobsRef, where("status", "==", "approved"), orderBy("createdAt", "desc"));

    onSnapshot(q, (snap) => {
      let jobs = [];
      snap.forEach(doc => jobs.push({ id: doc.id, ...doc.data() }));

      if (jobs.length === 0) {
        console.log('[Jobs] Firestore empty, showing demo jobs.');
        renderJobs(DEMO_JOBS);
      } else {
        renderJobs(jobs);
      }
    });

  } catch (error) {
    console.error("Jobs error:", error);
  }

  jobFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      jobFilters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const type = btn.dataset.type;

      getDocs(query(collection(db, "jobs"), where("status", "==", "approved"))).then(snap => {
        let jobs = [];
        snap.forEach(doc => jobs.push({ id: doc.id, ...doc.data() }));
        if (type !== 'all') {
            jobs = jobs.filter(j => j.type === type);
        }
        renderJobs(jobs);
      });
    });
  });
}

export function renderJobs(jobs) {
  const jobsGrid = document.getElementById('jobsGrid');
  if (!jobsGrid) return;

  if (!jobs.length) {
    jobsGrid.innerHTML = '<p class="no-data">Gösterilecek ilan bulunmuyor.</p>';
    return;
  }

  jobsGrid.innerHTML = jobs.map(job => `
    <div class="job-card reveal glass-panel">
      <div class="job-badge">${job.type}</div>
      <div class="job-logo-wrapper">
        <div class="job-logo-placeholder">${(job.company || 'B').charAt(0).toUpperCase()}</div>
      </div>
      <h3 class="job-title">${job.title}</h3>
      <p class="job-company">${job.company}</p>
      <div class="job-meta">
        <span><i class="fas fa-map-marker-alt"></i> ${job.location || 'Berlin'}</span>
      </div>
      <a href="mailto:${job.contact}" class="job-apply-btn">Başvur / İletişime Geç</a>
    </div>
  `).join('');

  const reveals = jobsGrid.querySelectorAll('.reveal');
  if (window.revealObserver) {
    reveals.forEach(el => window.revealObserver.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('visible'));
  }
}

window.openJobModal = () => {
  if (!auth.currentUser) {
    alert("İlan vermek için giriş yapmalısınız.");
    // openLoginModal();
    return;
  }
  
  // We have a modal #jobModal in newer version
  const modal = document.getElementById('jobModal');
  if (modal) {
    modal.classList.add('active');
  } else {
    // Old prompt method fallback
    const title = prompt("İş Başlığı (örn: Garson):");
    const company = prompt("Şirket/Mekan Adı:");
    const location = prompt("Bölge (örn: Kreuzberg):");
    const type = prompt("İş Tipi (Tam Zamanlı, Yarı Zamanlı, Minijob):", "Tam Zamanlı");
    const contact = prompt("İletişim E-postası:");

    if (title && company && contact) {
      addDoc(collection(db, "jobs"), {
        title, company, location, type, contact,
        postedBy: auth.currentUser.uid,
        status: 'pending',
        createdAt: serverTimestamp()
      }).then(() => {
        alert("İlanınız başarıyla alındı ve kontrol edildikten sonra yayına girecektir.");
      }).catch(err => console.error(err));
    }
  }
};

window.closeJobModal = () => {
  const modal = document.getElementById('jobModal');
  if (modal) modal.classList.remove('active');
};
