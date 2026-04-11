export let globalPodcasts = [];

export async function loadPodcasts() {
  const grid = document.getElementById('podcastGrid');
  if (grid) grid.innerHTML = '<div class="skeleton-card"></div>'.repeat(3);

  try {
    const res = await fetch('/data/podcasts.json');
    if (!res.ok) throw new Error('Podcasts fetch failed');
    const data = await res.json();

    if (!grid || !data.podcasts) return;

    const html = data.podcasts.map(p => `
      <div class="yt-mini-card glass-panel" data-action="play-podcast" data-title="${p.title.replace(/"/g, '&quot;')}" data-desc="${p.desc.replace(/"/g, '&quot;')}" data-src="${p.src}" data-thumbclass="${p.thumbClass}">
        <div class="yt-mini-thumb ${p.thumbClass}">
          <div class="yt-play-mini"><i class="fas fa-play"></i></div>
        </div>
        <span class="yt-mini-title">${p.title}</span>
      </div>
    `).join('');

    globalPodcasts = data.podcasts;
    grid.innerHTML = html;
  } catch (err) {
    // console.log removed
  }
}

// ── Podcast Audio Player DOM Elements & Logic ────────────────────
let mainAudio;
let podcastPlayer;
let playPauseBtn;
let progressFill;
let progressBg;
let currentTimeEl;
let totalTimeEl;
let isCurrentlyPlaying = false;

export function initPodcastsUI() {
  mainAudio = document.getElementById('mainAudio');
  podcastPlayer = document.getElementById('podcastPlayer');
  playPauseBtn = document.getElementById('playPauseBtn');
  progressFill = document.getElementById('progressFill');
  progressBg = document.getElementById('progressBg');
  currentTimeEl = document.getElementById('currentTime');
  totalTimeEl = document.getElementById('totalTime');

  if (mainAudio) {
    mainAudio.addEventListener('timeupdate', () => {
      const cur = mainAudio.currentTime;
      const dur = mainAudio.duration;
      if (currentTimeEl) currentTimeEl.innerText = formatTime(cur);
      if (dur && progressFill) {
        if (totalTimeEl) totalTimeEl.innerText = formatTime(dur);
        progressFill.style.width = `${(cur / dur) * 100}%`;
      }
    });

    mainAudio.addEventListener('ended', () => {
      isCurrentlyPlaying = false;
      updatePlayBtnIcon();
    });

    progressBg?.addEventListener('click', (e) => {
      const rect = progressBg.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      if (mainAudio.duration) {
        mainAudio.currentTime = pos * mainAudio.duration;
      }
    });
  }
}

export function playPodcast(title, desc, audioUrl, thumbClass) {
  document.getElementById('playerTitle').innerText = title;
  document.getElementById('playerDesc').innerText = desc;

  const thumb = document.getElementById('playerThumb');
  thumb.className = `player-thumb ${thumbClass}`;

  if(mainAudio) {
    mainAudio.src = audioUrl;
    mainAudio.load();
    mainAudio.play();
  }

  isCurrentlyPlaying = true;
  updatePlayBtnIcon();
  if(podcastPlayer) podcastPlayer.classList.add('active');
}

export function closePodcast() {
  if(podcastPlayer) podcastPlayer.classList.remove('active');
  if(mainAudio) mainAudio.pause();
  isCurrentlyPlaying = false;
  updatePlayBtnIcon();
}

export function togglePlay() {
  if(!mainAudio) return;
  if (mainAudio.paused) {
    mainAudio.play();
    isCurrentlyPlaying = true;
  } else {
    mainAudio.pause();
    isCurrentlyPlaying = false;
  }
  updatePlayBtnIcon();
}

export function skipPodcast(seconds) {
  if(mainAudio) mainAudio.currentTime += seconds;
}

function updatePlayBtnIcon() {
  if(!playPauseBtn) return;
  if (isCurrentlyPlaying) {
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    podcastPlayer?.classList.add('is-playing');
  } else {
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    podcastPlayer?.classList.remove('is-playing');
  }
}

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

window.playPodcast = playPodcast;
window.closePodcast = closePodcast;
window.togglePlay = togglePlay;
window.skipPodcast = skipPodcast;

// ── Olay Dinleyicisi (Event Delegation) ──
document.addEventListener('click', (e) => {
  const playPodcastBtn = e.target.closest('[data-action="play-podcast"]');
  if (playPodcastBtn) {
    playPodcast(
      playPodcastBtn.dataset.title,
      playPodcastBtn.dataset.desc,
      playPodcastBtn.dataset.src,
      playPodcastBtn.dataset.thumbclass
    );
  }
});
