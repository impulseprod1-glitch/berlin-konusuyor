/*  ═══════════════════════════════════════════════════════════
    BERLIN KONUŞUYOR — Video Haber Motoru
    Admin panelinden bir video yayınlandığı anda (Firestore
    onSnapshot) site kendini yeniden derlemeye gerek kalmadan
    canlı olarak güncellenir.
    ═══════════════════════════════════════════════════════════ */

import {
  db, collection, query, orderBy, onSnapshot, doc, updateDoc, increment
} from '../firebase-config.js';
import { parseVideoUrl, buildEmbedUrl, formatDuration } from '../utils/video-url.js';
import { t } from '../utils/i18n.js';
import { contentPath } from '../utils/slug.js';

// Geriye dönük uyumluluk: bu modülden de dışa aktarılıyor.
export { parseVideoUrl, buildEmbedUrl };

export let videoList = [];
let activeCategory = 'all';
let currentIndex = -1;
let hoverTimer = null;

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (!Number.isFinite(diff) || diff < 0) return 'yeni';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'az önce';
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} gün önce`;
  return new Date(dateStr).toLocaleDateString('tr-TR');
}

function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
}

function posterFor(video) {
  if (video.thumbnail) return video.thumbnail;
  if (video.provider === 'youtube' && video.videoId) {
    return `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;
  }
  return '';
}

/* ── Kart Üretimi ─────────────────────────────────────────── */
function cardHtml(video, index) {
  const poster = posterFor(video);
  const dur = formatDuration(video.duration);
  const isPortrait = video.orientation === 'portrait';

  return `
    <article class="video-card ${isPortrait ? 'is-portrait' : ''} reveal"
             data-action="open-video" data-index="${index}"
             tabindex="0" role="button"
             aria-label="${escapeHtml(video.title)} videosunu oynat">
      <div class="video-card-media">
        <div class="video-card-thumb video-card-thumb--empty"><i class="fas fa-film"></i></div>
        ${
          poster
            ? `<img class="video-card-thumb" src="${escapeHtml(poster)}" alt="${escapeHtml(video.title)}"
                 loading="lazy" decoding="async" style="position:absolute; inset:0;">`
            : ''
        }
        ${
          video.provider === 'file'
            ? `<video class="video-card-preview" muted loop playsinline preload="none" src="${escapeHtml(video.videoUrl)}"></video>`
            : ''
        }
        <span class="video-card-play"><i class="fas fa-play"></i></span>
        ${dur ? `<span class="video-card-duration">${dur}</span>` : ''}
        ${video.featured ? '<span class="video-card-flag">ÖNE ÇIKAN</span>' : ''}
      </div>
      <div class="video-card-body">
        <span class="video-card-cat">${escapeHtml(video.category || 'Gündem')}</span>
        <h3 class="video-card-title">${escapeHtml(video.title)}</h3>
        <div class="video-card-meta">
          <span><i class="far fa-clock"></i> ${timeAgo(video.date)}</span>
          <span><i class="far fa-eye"></i> ${Number(video.views || 0).toLocaleString('tr-TR')}</span>
        </div>
      </div>
    </article>`;
}

function filteredVideos() {
  if (activeCategory === 'all') return videoList;
  return videoList.filter((v) => (v.category || '').toLowerCase() === activeCategory.toLowerCase());
}

export function renderVideoNews() {
  const rail = document.getElementById('videoNewsRail');
  if (!rail) return;

  const list = filteredVideos();
  const countEl = document.getElementById('videoNewsCount');
  if (countEl) countEl.textContent = `${videoList.length} ${t('video_count', 'video haber')}`;

  if (!list.length) {
    rail.innerHTML = `
      <div class="video-empty">
        <i class="fas fa-video-slash"></i>
        <p>${t('video_empty', 'Bu kategoride henüz video yayınlanmadı.')}</p>
      </div>`;
    return;
  }

  rail.innerHTML = list.map((v) => cardHtml(v, videoList.indexOf(v))).join('');

  // Kapak görseli yüklenemezse (ör. YouTube hqdefault yok) yedek ikona düş.
  rail.querySelectorAll('img.video-card-thumb').forEach((img) => {
    img.addEventListener('error', () => img.classList.add('is-broken'), { once: true });
  });

  if (window.revealObserver) {
    rail.querySelectorAll('.reveal').forEach((el) => window.revealObserver.observe(el));
  }
  renderCategoryChips();
}

function renderCategoryChips() {
  const wrap = document.getElementById('videoNewsFilters');
  if (!wrap) return;
  const cats = ['all', ...new Set(videoList.map((v) => v.category).filter(Boolean))];
  const signature = [document.documentElement.lang, ...cats].join('|');
  if (wrap.dataset.signature === signature) {
    wrap.querySelectorAll('.video-chip').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.category === activeCategory);
    });
    return;
  }
  wrap.dataset.signature = signature;
  wrap.innerHTML = cats
    .map(
      (c) =>
        `<button class="video-chip ${c === activeCategory ? 'active' : ''}" data-category="${escapeHtml(c)}">${
          c === 'all' ? t('video_filter_all', 'Tümü') : escapeHtml(c)
        }</button>`
    )
    .join('');
}

/* ── Öne Çıkan Video (Bento kenar widget'ı) ───────────────── */
function renderShortsWidget() {
  const frame = document.getElementById('shortsPlayerFrame');
  if (!frame) return;

  const hero = videoList.find((v) => v.featured) || videoList[0];
  if (!hero) return;

  const titleEl = document.getElementById('shortsWidgetTitle');
  const descEl = document.getElementById('shortsWidgetDesc');
  if (titleEl) titleEl.textContent = hero.title;
  if (descEl) descEl.textContent = (hero.description || '').slice(0, 120) || 'Berlin gündemi, kendi kameramızdan.';

  const poster = posterFor(hero);
  frame.innerHTML = `
    <button class="shorts-poster" data-action="open-video" data-index="${videoList.indexOf(hero)}"
            aria-label="${escapeHtml(hero.title)} videosunu oynat">
      ${poster ? `<img src="${escapeHtml(poster)}" alt="${escapeHtml(hero.title)}" loading="lazy">` : ''}
      <span class="shorts-poster-play"><i class="fas fa-play"></i></span>
    </button>`;
}

/* ── Oynatıcı Modalı ──────────────────────────────────────── */
function stagePlayer(video) {
  const stage = document.getElementById('videoModalStage');
  if (!stage) return;

  if (video.provider === 'file') {
    stage.innerHTML = `<video class="video-player" src="${escapeHtml(video.videoUrl)}" controls autoplay playsinline
      ${posterFor(video) ? `poster="${escapeHtml(posterFor(video))}"` : ''}></video>`;
  } else {
    stage.innerHTML = `<iframe class="video-player" src="${buildEmbedUrl(video, true)}"
      title="${escapeHtml(video.title)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write;
      encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
  }
}

function clearPlayer() {
  const stage = document.getElementById('videoModalStage');
  if (stage) stage.innerHTML = '';
}

export function openVideo(index) {
  const video = videoList[index];
  const modal = document.getElementById('videoModal');
  if (!video || !modal) return;

  currentIndex = index;

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setText('videoModalTitle', video.title || '');
  setText('videoModalCategory', video.category || 'Gündem');
  setText('videoModalDate', timeAgo(video.date));
  setText('videoModalDesc', video.description || '');
  setText('videoModalViews', `${Number(video.views || 0).toLocaleString('tr-TR')} görüntülenme`);

  modal.classList.toggle('is-portrait', video.orientation === 'portrait');
  stagePlayer(video);
  updateNav();
  updateVideoMeta(video);

  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  if (video.id) {
    // Gerçek URL: yenilenirse prerender edilmiş statik sayfa açılır.
    window.history.replaceState(null, '', contentPath('video', video));
    window.dispatchEvent(new CustomEvent('bk:navigate'));
    countView(video);
  }
  document.getElementById('videoModalClose')?.focus();
}

export function closeVideo() {
  const modal = document.getElementById('videoModal');
  if (!modal) return;
  clearPlayer();
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  currentIndex = -1;
  if (window.location.pathname.startsWith('/video/') || window.location.hash.startsWith('#!video/')) {
    window.history.replaceState(null, '', '/' + window.location.search);
  }
}

function step(delta) {
  const list = filteredVideos();
  if (!list.length) return;
  const pos = list.indexOf(videoList[currentIndex]);
  const next = list[(pos + delta + list.length) % list.length];
  if (next) openVideo(videoList.indexOf(next));
}

function updateNav() {
  const list = filteredVideos();
  const pos = list.indexOf(videoList[currentIndex]);
  const label = document.getElementById('videoModalPosition');
  if (label && pos > -1) label.textContent = `${pos + 1} / ${list.length}`;
}

/* Görüntüleme sayacı — oturum başına bir kez, sessizce başarısız olur. */
const viewed = new Set();
async function countView(video) {
  if (!video.id || viewed.has(video.id)) return;
  viewed.add(video.id);
  video.views = Number(video.views || 0) + 1;
  try {
    await updateDoc(doc(db, 'videos', video.id), { views: increment(1) });
  } catch {
    /* kurallar izin vermiyorsa sessizce geç */
  }
}

/* ── SEO / Paylaşım Meta Güncellemesi ─────────────────────── */
function updateVideoMeta(video) {
  const title = `${video.title} — Berlin Konuşuyor`;
  document.title = title;

  const setMeta = (selector, value) => {
    const el = document.querySelector(selector);
    if (el && value) el.setAttribute('content', value);
  };
  const desc = (video.description || video.title || '').slice(0, 160);
  setMeta('meta[name="description"]', desc);
  setMeta('meta[property="og:title"]', video.title);
  setMeta('meta[property="og:description"]', desc);
  setMeta('meta[property="og:image"]', posterFor(video));
  setMeta('meta[property="og:type"]', 'video.other');
  setMeta('meta[property="og:url"]', 'https://berlinkonusuyor.com' + contentPath('video', video));
  setMeta('meta[property="twitter:title"]', video.title);
  setMeta('meta[property="twitter:image"]', posterFor(video));

  let schema = document.getElementById('videoEntrySchema');
  if (!schema) {
    schema = document.createElement('script');
    schema.id = 'videoEntrySchema';
    schema.type = 'application/ld+json';
    document.head.appendChild(schema);
  }
  schema.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: desc,
    thumbnailUrl: posterFor(video) ? [posterFor(video)] : undefined,
    uploadDate: video.date,
    duration: video.duration ? `PT${Math.round(video.duration)}S` : undefined,
    contentUrl: video.provider === 'file' ? video.videoUrl : undefined,
    embedUrl: video.provider !== 'file' ? buildEmbedUrl(video, false) : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Berlin Konuşuyor',
      logo: { '@type': 'ImageObject', url: 'https://berlinkonusuyor.com/icon-512.png' },
    },
  });
}

async function shareCurrent() {
  const video = videoList[currentIndex];
  if (!video) return;
  const url = window.location.origin + contentPath('video', video);
  try {
    if (navigator.share) {
      await navigator.share({ title: video.title, text: video.description || '', url });
    } else {
      await navigator.clipboard.writeText(url);
      const btn = document.getElementById('videoShareBtn');
      if (btn) {
        const old = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Kopyalandı';
        setTimeout(() => (btn.innerHTML = old), 1800);
      }
    }
  } catch {
    /* kullanıcı iptal etti */
  }
}

/* ── Veri Katmanı ─────────────────────────────────────────── */
function normalize(raw) {
  const parsed = parseVideoUrl(raw.videoUrl || '') || {};
  return {
    ...raw,
    provider: raw.provider || parsed.provider || 'file',
    videoId: raw.videoId || parsed.videoId || '',
    videoUrl: raw.videoUrl || parsed.videoUrl || '',
    thumbnail: raw.thumbnail || parsed.thumbnail || '',
    orientation: raw.orientation || parsed.orientation || 'landscape',
    date: raw.date || new Date().toISOString(),
    views: Number(raw.views || 0),
  };
}

function applyData(items) {
  videoList = items
    .filter((v) => v.videoUrl && v.status !== 'draft')
    .map(normalize)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  renderVideoNews();
  renderShortsWidget();
  handleVideoHash();
}

async function loadStaticFallback() {
  try {
    const res = await fetch('/data/videos.json');
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data.videos) && data.videos.length) applyData(data.videos);
  } catch {
    /* çevrimdışı */
  }
}

function handleVideoHash() {
  // Yeni biçim: /video/<slug>-<idEki>   Eski biçim: #!video/<id>
  const { pathname, hash } = window.location;
  let index = -1;

  if (pathname.startsWith('/video/')) {
    const slug = pathname.replace(/^\/video\//, '').replace(/\/$/, '');
    index = videoList.findIndex((v) => contentPath('video', v).endsWith('/' + slug));
  } else if (hash.startsWith('#!video/')) {
    const id = hash.replace('#!video/', '');
    index = videoList.findIndex((v) => v.id === id);
  }

  if (index > -1 && currentIndex !== index) openVideo(index);
}

/* ── Hover ön izleme (yüklenen mp4 dosyaları için) ────────── */
function bindHoverPreview(rail) {
  rail.addEventListener(
    'mouseenter',
    (e) => {
      const card = e.target.closest?.('.video-card');
      const preview = card?.querySelector('.video-card-preview');
      if (!preview || window.matchMedia('(hover: none)').matches) return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        preview.play().catch(() => {});
        card.classList.add('is-previewing');
      }, 320);
    },
    true
  );

  rail.addEventListener(
    'mouseleave',
    (e) => {
      const card = e.target.closest?.('.video-card');
      const preview = card?.querySelector('.video-card-preview');
      if (!preview) return;
      clearTimeout(hoverTimer);
      preview.pause();
      preview.currentTime = 0;
      card.classList.remove('is-previewing');
    },
    true
  );
}

/* ── Kaydırma okları ──────────────────────────────────────── */
function bindRailScroll(rail) {
  const scrollBy = (dir) => {
    const card = rail.querySelector('.video-card');
    const amount = card ? card.getBoundingClientRect().width + 20 : rail.clientWidth * 0.8;
    rail.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };
  document.getElementById('videoRailPrev')?.addEventListener('click', () => scrollBy(-1));
  document.getElementById('videoRailNext')?.addEventListener('click', () => scrollBy(1));
}

/* ── Başlatıcı ────────────────────────────────────────────── */
export function initVideoNews() {
  const rail = document.getElementById('videoNewsRail');
  if (rail) {
    rail.innerHTML = '<div class="video-skeleton"></div>'.repeat(4);
    bindHoverPreview(rail);
    bindRailScroll(rail);
  }

  // Firestore canlı akış — admin bir video yayınlar, sayfa anında güncellenir.
  if (db) {
    const fallbackTimer = setTimeout(loadStaticFallback, 5000);
    try {
      onSnapshot(
        query(collection(db, 'videos'), orderBy('date', 'desc')),
        (snap) => {
          clearTimeout(fallbackTimer);
          const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          if (items.length) applyData(items);
          else loadStaticFallback();
        },
        (err) => {
          clearTimeout(fallbackTimer);
          console.warn('[Video] Firestore akışı okunamadı:', err.message);
          loadStaticFallback();
        }
      );
    } catch (err) {
      clearTimeout(fallbackTimer);
      console.warn('[Video] Firestore hatası:', err.message);
      loadStaticFallback();
    }
  } else {
    loadStaticFallback();
  }

  // Tıklama delegasyonu
  document.addEventListener('click', (e) => {
    const openBtn = e.target.closest('[data-action="open-video"]');
    if (openBtn) {
      e.preventDefault();
      openVideo(parseInt(openBtn.dataset.index, 10));
      return;
    }
    // İki tıklama çözümü: kullanıcı onaylayınca YouTube gömüsünü yükle
    const ytBtn = e.target.closest('[data-action="load-youtube"]');
    if (ytBtn) {
      const frame = ytBtn.parentElement;
      frame.innerHTML = `<iframe src="${ytBtn.dataset.src}" title="${escapeHtml(ytBtn.dataset.title || '')}"
        frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>`;
      return;
    }

    if (e.target.closest('[data-action="close-video"]')) return closeVideo();
    if (e.target.closest('[data-action="next-video"]')) return step(1);
    if (e.target.closest('[data-action="prev-video"]')) return step(-1);
    if (e.target.closest('[data-action="share-video"]')) return shareCurrent();

    const chip = e.target.closest('.video-chip');
    if (chip) {
      activeCategory = chip.dataset.category;
      renderVideoNews();
    }
  });

  // Klavye erişilebilirliği
  document.addEventListener('keydown', (e) => {
    const card = e.target.closest?.('.video-card');
    if (card && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openVideo(parseInt(card.dataset.index, 10));
      return;
    }
    if (currentIndex < 0) return;
    if (e.key === 'Escape') closeVideo();
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });

  // Mobil: modal içinde yukarı/aşağı kaydırma ile video değiştir
  const modal = document.getElementById('videoModal');
  if (modal) {
    let startY = 0;
    let startX = 0;
    modal.addEventListener(
      'touchstart',
      (e) => {
        startY = e.touches[0].clientY;
        startX = e.touches[0].clientX;
      },
      { passive: true }
    );
    modal.addEventListener(
      'touchend',
      (e) => {
        const dy = e.changedTouches[0].clientY - startY;
        const dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dy) > 90 && Math.abs(dy) > Math.abs(dx)) step(dy < 0 ? 1 : -1);
      },
      { passive: true }
    );
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeVideo();
    });
  }

  window.addEventListener('hashchange', handleVideoHash);
  window.addEventListener('popstate', handleVideoHash);
  window.addEventListener('bk:langchange', () => renderVideoNews());
}

window.openVideo = openVideo;
window.closeVideo = closeVideo;
