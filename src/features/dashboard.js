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

  // Hava Durumu (Basit Fetch) — 8sn timeout ile
  const weatherController = new AbortController();
  const weatherTimeout = setTimeout(() => weatherController.abort(), 8000);

  fetch('https://wttr.in/Berlin?format=%t+%C', { signal: weatherController.signal })
    .then(res => {
      clearTimeout(weatherTimeout);
      if (!res.ok) throw new Error('Weather service unreachable');
      return res.text();
    })
    .then(data => {
      if (!data || data.includes('Unknown') || data.includes('html')) throw new Error('Invalid weather data');
      const parts = data.split(' ');
      const temp = parts[0];
      const desc = parts.slice(1).join(' ');

      const tempEl = document.getElementById('berlinTemp');
      const descEl = document.getElementById('weatherDesc');
      if (tempEl && temp.includes('°')) tempEl.innerText = temp;
      if (descEl && desc) descEl.innerText = desc;
    })
    .catch(() => {
      clearTimeout(weatherTimeout);
      const tempEl = document.getElementById('berlinTemp');
      const descEl = document.getElementById('weatherDesc');
      if (tempEl) tempEl.innerText = "12°C";
      if (descEl) descEl.innerText = "Veri alınamadı";
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
