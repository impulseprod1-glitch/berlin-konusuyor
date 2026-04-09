import { db, collection, query, orderBy, onSnapshot } from '../firebase-config.js';
import { currentLang } from '../utils/i18n.js';
import { PLACEHOLDER_IMG } from './news.js';

export let globalEvents = [];

export async function fetchFallbackEvents() {
  try {
    const res = await fetch('/data/events.json');
    if (!res.ok) throw new Error('Events fallback fetch failed');
    const data = await res.json();
    if (data.events && data.events.length > 0) {
      globalEvents = data.events;
      renderEvents(globalEvents);
    }
  } catch (err) {
    console.error('[Events] Fallback error:', err);
  }
}

export function renderEvents(events) {
  const container = document.getElementById('eventsTrack');
  if (!container) return;

  try {
    container.innerHTML = events.map((event, index) => {
      let day = '--';
      let month = 'AY';

      try {
        const eventDate = new Date(event.date);
        if (!isNaN(eventDate.getTime())) {
          day = eventDate.getDate();
          month = eventDate.toLocaleString(currentLang === 'tr' ? 'tr-TR' : 'de-DE', { month: 'short' }).toUpperCase();
        }
      } catch (e) {
        console.error('Date error:', e);
      }

      return `
        <div class="event-card reveal" style="animation-delay: ${index * 0.1}s" data-action="open-event" data-url="${event.url || '#'}">
          <div class="event-img-wrapper">
            <img src="${event.image || PLACEHOLDER_IMG}" 
                 class="event-img" 
                 alt="${event.title}" 
                 loading="lazy"
                 onerror="this.src='${PLACEHOLDER_IMG}'">
            ${event.category ? `<span class="event-category">${event.category}</span>` : ''}
          </div>
          <div class="event-body">
            <div class="event-date-box">
              <span class="event-day">${day}</span>
              <span class="event-month">${month}</span>
            </div>
            <h3 class="event-title">${event.summary_tr || event.title}</h3>
            <p class="event-location"><i class="fas fa-map-marker-alt"></i> ${event.location || event.venue || 'Berlin'}</p>
          </div>
        </div>
      `;
    }).join('');

    // Re-observe
    const reveals = container.querySelectorAll('.reveal');
    if (window.revealObserver) {
      reveals.forEach(el => window.revealObserver.observe(el));
    } else {
      reveals.forEach(el => el.classList.add('visible'));
    }
  } catch (err) {
    console.error('renderEvents crash:', err);
    container.innerHTML = '<p class="error-msg">Etkinlikler yüklenirken bir hata oluştu.</p>';
  }
}

export async function loadEvents() {
  const track = document.getElementById('eventsTrack');
  if (track) track.innerHTML = '<div class="skeleton-event"></div>'.repeat(3);

  if (!db) {
    console.warn('[Events] DB not ready yet, retrying in 500ms...');
    setTimeout(loadEvents, 500);
    return;
  }

  try {
    let eventsLoadingTimeout = setTimeout(() => {
      console.warn('[Events] Firestore timeout reaching 5s, using fallback');
      fetchFallbackEvents();
    }, 5000);

    const q = query(collection(db, "events"), orderBy("date", "asc"));

    onSnapshot(q, (snapshot) => {
      if (eventsLoadingTimeout) clearTimeout(eventsLoadingTimeout);
      let firestoreEvents = [];
      snapshot.forEach((doc) => {
        firestoreEvents.push({ id: doc.id, ...doc.data() });
      });

      if (firestoreEvents.length > 0) {
        globalEvents = firestoreEvents;
        renderEvents(globalEvents);
      } else {
        fetchFallbackEvents();
      }
    }, (error) => {
      console.error('[Events] onSnapshot error:', error);
      if (eventsLoadingTimeout) clearTimeout(eventsLoadingTimeout);
      fetchFallbackEvents();
    });
  } catch (err) {
    console.error('[Events] Firestore error:', err);
    fetchFallbackEvents();
  }
}

// ── Olay Dinleyicisi (Event Delegation) ──
document.addEventListener('click', (e) => {
  const openEventBtn = e.target.closest('[data-action="open-event"]');
  if (openEventBtn && openEventBtn.dataset.url !== '#') {
    window.open(openEventBtn.dataset.url, '_blank');
  }
});
