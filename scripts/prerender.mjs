/*  ═══════════════════════════════════════════════════════════
    BERLIN KONUŞUYOR — Statik İçerik Sayfası Üretici

    NEDEN: Site tek sayfalık bir uygulama ve tüm içerik
    "#!news/<id>" gibi hash bağlantılarının arkasındaydı.
    Google hash fragmanlarını ayrı sayfa saymaz — yani sitenin
    yalnızca TEK indekslenebilir adresi vardı ve yayınlanan
    hiçbir haber/video aramada görünmüyordu.

    NE YAPAR: `vite build` sonrasında çalışır ve her içerik için
    dist/ altına gerçek bir HTML sayfası yazar:
        dist/haber/<slug>/index.html
        dist/video/<slug>/index.html

    Sayfalar kendi kendine yeterlidir: içerik HTML olarak
    gömülüdür (JS beklemeden okunur), doğru başlık/açıklama,
    OG etiketleri ve JSON-LD taşır. Firebase Hosting statik
    dosyaları rewrite kurallarından ÖNCE sunduğu için bu
    adresler doğrudan çalışır.
    ═══════════════════════════════════════════════════════════ */

import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { contentPath } from '../src/utils/slug.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const DATA = join(ROOT, 'public', 'data');
const BASE_URL = (process.env.SITE_BASE_URL || 'https://berlinkonusuyor.com').replace(/\/$/, '');

/* ── Yardımcılar ──────────────────────────────────────────── */
const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );

function readJson(name, fallback) {
  const path = join(DATA, name);
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return fallback;
  }
}

/** Vite hash'li CSS dosyasının adını dist/index.html içinden bulur. */
function findStylesheet() {
  const indexPath = join(DIST, 'index.html');
  if (existsSync(indexPath)) {
    const html = readFileSync(indexPath, 'utf-8');
    const matches = [...html.matchAll(/href="(\/assets\/[^"]+\.css)"/g)].map((m) => m[1]);
    // Ana site stili en büyük dosyadır (font + ikon tanımlarını içerir)
    if (matches.length) {
      const withSize = matches.map((href) => {
        const f = join(DIST, href.replace(/^\//, ''));
        return { href, size: existsSync(f) ? readFileSync(f).length : 0 };
      });
      withSize.sort((a, b) => b.size - a.size);
      return withSize[0].href;
    }
  }
  // Yedek: assets klasöründen en büyük css
  const assets = join(DIST, 'assets');
  if (!existsSync(assets)) return '';
  const css = readdirSync(assets).filter((f) => f.endsWith('.css'));
  if (!css.length) return '';
  css.sort((a, b) => readFileSync(join(assets, b)).length - readFileSync(join(assets, a)).length);
  return `/assets/${css[0]}`;
}

function formatDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
}

/* ── YouTube/Vimeo gömü adresi (çerezsiz) ─────────────────── */
function embedUrl(video) {
  if (video.provider === 'youtube' && video.videoId) {
    return `https://www.youtube-nocookie.com/embed/${video.videoId}?rel=0&modestbranding=1`;
  }
  if (video.provider === 'vimeo' && video.videoId) {
    return `https://player.vimeo.com/video/${video.videoId}?dnt=1`;
  }
  return '';
}

/* ── Sayfa şablonu ────────────────────────────────────────── */
function pageHtml({ title, description, image, url, datePublished, bodyHtml, schema, cssHref, breadcrumb }) {
  const safeTitle = esc(title);
  const safeDesc = esc((description || '').slice(0, 160));

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${safeTitle} — Berlin Konuşuyor</title>
<meta name="description" content="${safeDesc}">
<link rel="canonical" href="${esc(url)}">
<meta name="robots" content="index, follow, max-image-preview:large">

<meta property="og:type" content="article">
<meta property="og:site_name" content="Berlin Konuşuyor">
<meta property="og:title" content="${safeTitle}">
<meta property="og:description" content="${safeDesc}">
<meta property="og:url" content="${esc(url)}">
${image ? `<meta property="og:image" content="${esc(image)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${safeTitle}">
<meta name="twitter:description" content="${safeDesc}">
${image ? `<meta name="twitter:image" content="${esc(image)}">` : ''}

<link rel="icon" href="/favicon.ico">
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#050505">
${cssHref ? `<link rel="stylesheet" href="${esc(cssHref)}">` : ''}
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>
<style>
  body { background:#050505; color:#fcfcfc; margin:0; }
  .pr-wrap { max-width: 760px; margin: 0 auto; padding: 24px 20px 80px; }
  .pr-top { display:flex; align-items:center; justify-content:space-between; gap:16px;
            padding: 18px 0 32px; border-bottom:1px solid rgba(255,255,255,.08); margin-bottom:32px; }
  .pr-logo { font-weight:800; letter-spacing:.02em; font-size:1.05rem; text-decoration:none; color:#fcfcfc; }
  .pr-logo span { color:#e50914; }
  .pr-back { font-size:.82rem; color:#b3b3b3; text-decoration:none; }
  .pr-back:hover { color:#fcfcfc; }
  .pr-meta { display:flex; gap:14px; flex-wrap:wrap; font-size:.78rem; color:#777; margin-bottom:14px; }
  .pr-cat { color:#e50914; font-weight:800; letter-spacing:.12em; text-transform:uppercase; }
  .pr-title { font-family:'Playfair Display',Georgia,serif; font-size:clamp(1.6rem,4vw,2.6rem);
              line-height:1.22; margin:0 0 20px; }
  .pr-hero { width:100%; border-radius:16px; margin-bottom:28px; display:block; }
  .pr-embed { position:relative; aspect-ratio:16/9; margin-bottom:28px; border-radius:16px; overflow:hidden; background:#000; }
  .pr-embed.is-portrait { aspect-ratio:9/16; max-width:420px; }
  .pr-embed iframe, .pr-embed video { width:100%; height:100%; border:0; display:block; }
  .pr-body { font-size:1.02rem; line-height:1.8; color:#d4d4d4; white-space:pre-wrap; }
  .pr-cta { display:inline-block; margin-top:36px; padding:13px 26px; border-radius:999px;
            background:#e50914; color:#fff; text-decoration:none; font-weight:600; font-size:.9rem; }
  .pr-foot { margin-top:56px; padding-top:24px; border-top:1px solid rgba(255,255,255,.08);
             font-size:.78rem; color:#777; }
  .pr-foot a { color:#b3b3b3; }
</style>
</head>
<body>
<div class="pr-wrap">
  <header class="pr-top">
    <a class="pr-logo" href="/">BERLIN<span>KONUŞUYOR</span></a>
    <a class="pr-back" href="/">← Ana sayfa</a>
  </header>
  <article>
${bodyHtml}
  </article>
  <footer class="pr-foot">
    <p>© ${new Date().getFullYear()} Berlin Konuşuyor —
       <a href="/">berlinkonusuyor.com</a></p>
  </footer>
</div>
</body>
</html>`;
}

/* ── Haber sayfası ────────────────────────────────────────── */
function renderArticle(article, cssHref) {
  const title = article.title || article.summary_tr || 'Haber';
  const description = article.summary_tr || article.content || title;
  const url = BASE_URL + contentPath('haber', article);
  const image = article.image && article.image.startsWith('http') ? article.image : '';
  const body = article.content || article.summary_tr || '';

  const bodyHtml = `    <div class="pr-meta">
      <span class="pr-cat">${esc(article.category || 'Gündem')}</span>
      <span>${esc(formatDate(article.date))}</span>
      <span>${esc(article.source || 'Berlin Konuşuyor')}</span>
    </div>
    <h1 class="pr-title">${esc(title)}</h1>
${image ? `    <img class="pr-hero" src="${esc(image)}" alt="${esc(title)}" loading="lazy">` : ''}
    <div class="pr-body">${esc(body)}</div>
    <a class="pr-cta" href="/#haberler">Tüm haberler</a>`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description: description.slice(0, 300),
    datePublished: article.date,
    dateModified: article.date,
    inLanguage: 'tr',
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    ...(image ? { image: [image] } : {}),
    author: { '@type': 'Organization', name: 'Berlin Konuşuyor', url: BASE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'Berlin Konuşuyor',
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/icon-512.png` },
    },
  };

  return { url, html: pageHtml({ title, description, image, url, bodyHtml, schema, cssHref, breadcrumb: crumb('Haberler', '/#haberler', title, url) }) };
}

/* ── Video sayfası ────────────────────────────────────────── */
function renderVideo(video, cssHref) {
  const title = video.title || 'Video Haber';
  const description = video.description || title;
  const url = BASE_URL + contentPath('video', video);
  const image = video.thumbnail || (video.videoId ? `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg` : '');
  const embed = embedUrl(video);
  const portrait = video.orientation === 'portrait';

  const player = embed
    ? `    <div class="pr-embed${portrait ? ' is-portrait' : ''}">
      <iframe src="${esc(embed)}" title="${esc(title)}" loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>
    </div>`
    : video.videoUrl
      ? `    <div class="pr-embed${portrait ? ' is-portrait' : ''}">
      <video src="${esc(video.videoUrl)}" controls playsinline${image ? ` poster="${esc(image)}"` : ''}></video>
    </div>`
      : '';

  const bodyHtml = `    <div class="pr-meta">
      <span class="pr-cat">${esc(video.category || 'Video')}</span>
      <span>${esc(formatDate(video.date))}</span>
    </div>
    <h1 class="pr-title">${esc(title)}</h1>
${player}
    <div class="pr-body">${esc(description)}</div>
    <a class="pr-cta" href="/#roportajlar">Tüm video haberler</a>`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: title,
    description: description.slice(0, 300),
    uploadDate: video.date,
    inLanguage: 'tr',
    ...(image ? { thumbnailUrl: [image] } : {}),
    ...(video.duration ? { duration: `PT${Math.round(video.duration)}S` } : {}),
    ...(embed ? { embedUrl: embed } : {}),
    ...(video.provider === 'file' && video.videoUrl ? { contentUrl: video.videoUrl } : {}),
    publisher: {
      '@type': 'Organization',
      name: 'Berlin Konuşuyor',
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/icon-512.png` },
    },
  };

  return { url, html: pageHtml({ title, description, image, url, bodyHtml, schema, cssHref, breadcrumb: crumb('Video Haberler', '/#roportajlar', title, url) }) };
}

function crumb(sectionName, sectionPath, title, url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: BASE_URL + '/' },
      { '@type': 'ListItem', position: 2, name: sectionName, item: BASE_URL + sectionPath },
      { '@type': 'ListItem', position: 3, name: title, item: url },
    ],
  };
}

/* ── Yazma ────────────────────────────────────────────────── */
function writePage(url, html) {
  const path = url.replace(BASE_URL, '').replace(/^\/+/, '');
  const dir = join(DIST, path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf-8');
}

/* ── Ana akış ─────────────────────────────────────────────── */
function main() {
  if (!existsSync(DIST)) {
    console.error('❌ dist/ bulunamadı. Önce `vite build` çalıştırın.');
    process.exit(0);
  }

  const cssHref = findStylesheet();
  const articles = readJson('news.json', { articles: [] }).articles || [];
  const videos = (readJson('videos.json', { videos: [] }).videos || []).filter((v) => v.status !== 'draft');

  console.log('🔨 Statik içerik sayfaları üretiliyor...');
  console.log(`   Stil dosyası: ${cssHref || '(bulunamadı)'}`);

  let count = 0;
  for (const a of articles) {
    const { url, html } = renderArticle(a, cssHref);
    writePage(url, html);
    count++;
  }
  for (const v of videos) {
    const { url, html } = renderVideo(v, cssHref);
    writePage(url, html);
    count++;
  }

  if (!count) {
    console.log('   ⚠️  İçerik bulunamadı — public/data/news.json ve videos.json boş.');
    console.log('      İçerik Firestore\'da ise önce `npm run seo` çalıştırın (kimlik bilgisi gerekir).');
  } else {
    console.log(`   ✅ ${count} sayfa üretildi (${articles.length} haber, ${videos.length} video)`);
  }
}

main();
