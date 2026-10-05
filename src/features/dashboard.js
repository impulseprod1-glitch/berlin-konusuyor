export function renderAIDashboard(insights) {
  if (insights) {
    if (insights.weatherAdvice) {
      const el = document.getElementById('aiWeatherAdvice');
      if (el) el.innerText = insights.weatherAdvice;
    }
    if (insights.newsBrief) {
      const el = document.getElementById('aiBriefText');
      if (el) {
        // Premium: Typewriter or Smooth Fade-in effect for the brief
        el.style.opacity = '0';
        el.innerText = insights.newsBrief;
        setTimeout(() => {
          el.style.transition = 'opacity 1s ease';
          el.style.opacity = '1';
        }, 100);
      }
    }
    if (insights.temp) {
      const el = document.getElementById('berlinTemp');
      if (el) el.innerText = insights.temp;
    }
    if (insights.desc) {
      const el = document.getElementById('weatherDesc');
      if (el) el.innerText = insights.desc;
    }
  }
}

export function updateTime() {
  const now = new Date();
  const berlinTime = now.toLocaleTimeString('tr-TR', { timeZone: 'Europe/Berlin' });
  const clockEl = document.getElementById('berlinClock');
  if (clockEl) clockEl.innerText = berlinTime;
}

export function initDashboardUtils() {
  updateTime();
  setInterval(updateTime, 1000);

  // Mock Dynamic Status for Premium feel
  const statusContainer = document.querySelector('.ai-stats');
  if (statusContainer) {
    // Clear existing to avoid double-appending on re-init if any
    const existingDynamic = statusContainer.querySelectorAll('.dynamic-stat');
    existingDynamic.forEach(e => e.remove());

    statusContainer.innerHTML += `
      <div class="stat-item reveal dynamic-stat">
        <span class="stat-label">Hava Kalitesi</span>
        <span class="stat-value">İyi (24 AQI)</span>
      </div>
      <div class="stat-item reveal dynamic-stat">
        <span class="stat-label">S-Bahn Durumu</span>
        <span class="stat-value text-success">Normal</span>
      </div>
    `;
  }

  // Hava durumu: scripts/fetch-news.mjs writes it every two hours, so the
  // browser never contacts the weather service itself. If the job could not
  // refresh it for a while, showing nothing beats showing yesterday's weather.
  const WEATHER_MAX_AGE_MS = 6 * 60 * 60 * 1000;
  fetch('/data/weather.json')
    .then(res => {
      if (!res.ok) throw new Error('Weather data missing');
      return res.json();
    })
    .then(({ tempC, description, updatedAt }) => {
      if (!updatedAt || Date.now() - Date.parse(updatedAt) > WEATHER_MAX_AGE_MS) {
        throw new Error('Weather data stale');
      }
      const tempEl = document.getElementById('berlinTemp');
      const descEl = document.getElementById('weatherDesc');
      if (tempEl && Number.isFinite(tempC)) tempEl.innerText = `${Math.round(tempC)}°C`;
      if (descEl && description) descEl.innerText = description;
    })
    .catch(() => {
      const tempEl = document.getElementById('berlinTemp');
      if (tempEl) tempEl.innerText = '—';
    });

  // Footer yılını dinamik yap
  const yearEl = document.getElementById('footerYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // AI Brief fallback — 10 saniye sonra hâlâ yükleniyorsa mesaj güncelle
  setTimeout(() => {
    const briefEl = document.getElementById('aiBriefText');
    if (briefEl && briefEl.textContent.includes('analiz ediliyor')) {
      briefEl.textContent = 'Berlin\'de bugün yeni gelişmeler takip ediliyor. Haberler bölümünden detaylara ulaşabilirsiniz.';
    }
  }, 10000);
}
