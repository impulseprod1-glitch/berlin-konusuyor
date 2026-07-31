/*  ═══════════════════════════════════════════════════════════
    BERLIN KONUŞUYOR — İçerik & SEO Yayıncısı

    Bu script YALNIZCA sitenin kendi içeriğini işler.
    Dış kaynaklardan haber çekme (RSS kazıma / haber API'si)
    telif ve yayıncı hakları nedeniyle tamamen kaldırılmıştır.
    Ayrıntı: docs/ANALIZ.md → "Hukuki Durum"

    Görevleri:
      1. Firestore'daki kendi haber/video içeriğini okur
         (kimlik bilgisi yoksa public/data/*.json yedeğini kullanır)
      2. sitemap.xml üretir
      3. rss.xml üretir (kendi içeriğimizin akışı)
      4. public/data/videos.json çevrimdışı yedeğini tazeler
      5. notifications_queue'daki bekleyen push bildirimlerini gönderir
    ═══════════════════════════════════════════════════════════ */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as dotenv from 'dotenv';
import admin from 'firebase-admin';
import { contentPath } from '../src/utils/slug.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const BASE_URL = process.env.SITE_BASE_URL || 'https://berlinkonusuyor.com';

const paths = {
  news: join(PUBLIC, 'data', 'news.json'),
  videos: join(PUBLIC, 'data', 'videos.json'),
  weather: join(PUBLIC, 'data', 'weather.json'),
  sitemap: join(PUBLIC, 'sitemap.xml'),
  rss: join(PUBLIC, 'rss.xml'),
};

// Sitemap'e girecek statik bölümler
const STATIC_SECTIONS = [
  '', '#haberler', '#roportajlar', '#kesfet', '#rehber',
  '#etkinlikler', '#is-ilanlari', '#anket', '#topluluk',
];

/* ── Firebase Admin (opsiyonel) ───────────────────────────── */
let db = null;
let messaging = null;

function initFirebase() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log('⚠️  FIREBASE_SERVICE_ACCOUNT yok → yerel JSON yedeği kullanılacak.');
    return;
  }
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    });
    db = admin.firestore();
    messaging = admin.messaging();
    console.log('✅ Firebase Admin bağlandı.');
  } catch (err) {
    console.error('❌ Firebase Admin kurulamadı:', err.message);
  }
}

/* ── Yardımcılar ──────────────────────────────────────────── */
function xmlEscape(str = '') {
  return String(str).replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]
  );
}

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return fallback;
  }
}

function isoDay(value) {
  const d = new Date(value);
  return (Number.isNaN(d.getTime()) ? new Date() : d).toISOString().split('T')[0];
}

function toDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

/* ── 1. İçeriği topla ─────────────────────────────────────── */
async function collectContent() {
  let news = [];
  let videos = [];

  if (db) {
    try {
      const newsSnap = await db.collection('news').orderBy('date', 'desc').limit(200).get();
      news = newsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      console.log(`  📰 Firestore: ${news.length} haber`);
    } catch (err) {
      console.warn('  ⚠️  Haberler okunamadı:', err.message);
    }

    try {
      const videoSnap = await db.collection('videos').orderBy('date', 'desc').limit(200).get();
      videos = videoSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((v) => v.status !== 'draft');
      console.log(`  🎬 Firestore: ${videos.length} video`);
    } catch (err) {
      console.warn('  ⚠️  Videolar okunamadı:', err.message);
    }
  }

  if (!news.length) {
    news = readJson(paths.news, { articles: [] }).articles || [];
    if (news.length) console.log(`  📂 Yerel yedek: ${news.length} haber`);
  }
  if (!videos.length) {
    videos = readJson(paths.videos, { videos: [] }).videos || [];
    if (videos.length) console.log(`  📂 Yerel yedek: ${videos.length} video`);
  }

  return { news, videos };
}

/* ── 2. Sitemap ───────────────────────────────────────────── */
function generateSitemap({ news, videos }) {
  const today = isoDay(Date.now());
  const parts = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ];

  STATIC_SECTIONS.forEach((section, i) => {
    parts.push(
      '  <url>',
      `    <loc>${BASE_URL}/${section}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      `    <changefreq>${i === 0 ? 'daily' : 'weekly'}</changefreq>`,
      `    <priority>${i === 0 ? '1.0' : '0.7'}</priority>`,
      ...(i === 0
        ? [
            `    <xhtml:link rel="alternate" hreflang="tr" href="${BASE_URL}/?lang=tr"/>`,
            `    <xhtml:link rel="alternate" hreflang="de" href="${BASE_URL}/?lang=de"/>`,
            `    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/?lang=en"/>`,
          ]
        : []),
      '  </url>'
    );
  });

  news.forEach((a) => {
    parts.push(
      '  <url>',
      `    <loc>${xmlEscape(BASE_URL + contentPath('haber', a))}</loc>`,
      `    <lastmod>${isoDay(a.date)}</lastmod>`,
      '    <changefreq>weekly</changefreq>',
      '    <priority>0.6</priority>',
      '  </url>'
    );
  });

  videos.forEach((v) => {
    parts.push(
      '  <url>',
      `    <loc>${xmlEscape(BASE_URL + contentPath('video', v))}</loc>`,
      `    <lastmod>${isoDay(v.date)}</lastmod>`,
      '    <changefreq>weekly</changefreq>',
      '    <priority>0.8</priority>',
      '  </url>'
    );
  });

  parts.push('</urlset>');
  writeFileSync(paths.sitemap, parts.join('\n'), 'utf-8');
  console.log(`  ✅ sitemap.xml — ${STATIC_SECTIONS.length + news.length + videos.length} URL`);
}

/* ── 3. RSS (yalnızca kendi içeriğimiz) ───────────────────── */
function generateRSS({ news, videos }) {
  const items = [
    ...news.map((a, i) => ({
      id: a.id || `news-${i}`,
      path: contentPath('haber', a),
      title: a.title || a.summary_tr || 'Berlin Konuşuyor',
      description: a.summary_tr || a.content || '',
      date: toDate(a.date),
    })),
    ...videos.map((v, i) => ({
      id: v.id || `video-${i}`,
      path: contentPath('video', v),
      title: v.title || 'Video Haber',
      description: v.description || '',
      date: toDate(v.date),
    })),
  ]
    .sort((a, b) => b.date - a.date)
    .slice(0, 50);

  const parts = [
    '<?xml version="1.0" encoding="UTF-8" ?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    '  <title>Berlin Konuşuyor — Berlin\'in Nabzı</title>',
    `  <link>${BASE_URL}</link>`,
    '  <description>Berlin\'den kendi haberlerimiz, sokak röportajları ve şehir rehberi.</description>',
    '  <language>tr</language>',
    `  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    `  <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />`,
  ];

  items.forEach((item) => {
    const link = BASE_URL + item.path;
    parts.push(
      '  <item>',
      `    <title><![CDATA[${item.title}]]></title>`,
      `    <link>${xmlEscape(link)}</link>`,
      `    <guid isPermaLink="false">${xmlEscape(item.id)}</guid>`,
      `    <pubDate>${item.date.toUTCString()}</pubDate>`,
      `    <description><![CDATA[${item.description || item.title}]]></description>`,
      '  </item>'
    );
  });

  parts.push('</channel>', '</rss>');
  writeFileSync(paths.rss, parts.join('\n'), 'utf-8');
  console.log(`  ✅ rss.xml — ${items.length} kayıt`);
}

/* ── 4. Çevrimdışı yedekler ───────────────────────────────
   Bu dosyalar iki işe yarar: (a) Firestore erişilemezse site
   yine içerik gösterir, (b) prerender script'i kimlik bilgisi
   olmadan da statik sayfa üretebilir. */
function writeFallbacks({ news, videos }) {
  if (!db) return; // Firestore yoksa mevcut yedekleri bozmayalım

  writeFileSync(
    paths.videos,
    JSON.stringify({ lastUpdated: new Date().toISOString(), count: videos.length, videos }, null, 2),
    'utf-8'
  );
  console.log(`  ✅ public/data/videos.json — ${videos.length} video`);

  const existing = readJson(paths.news, {});
  writeFileSync(
    paths.news,
    JSON.stringify(
      {
        lastUpdated: new Date().toISOString(),
        count: news.length,
        articles: news,
        insights: existing.insights || {},
      },
      null,
      2
    ),
    'utf-8'
  );
  console.log(`  ✅ public/data/news.json — ${news.length} haber`);
}

/* ── 4b. Berlin hava durumu (sunucu tarafında) ─────────────
   Eskiden tarayıcı doğrudan wttr.in'e istek atıyordu; bu, her
   ziyaretçinin IP adresini üçüncü tarafa aktarıyordu. Artık veri
   burada, günde iki kez çekilip statik dosyaya yazılıyor. */
async function fetchWeather() {
  try {
    const res = await fetch('https://wttr.in/Berlin?format=%t+%C', {
      headers: { 'User-Agent': 'curl/8' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = (await res.text()).trim();
    if (!text || text.includes('Unknown') || text.includes('<')) throw new Error('geçersiz yanıt');
    writeFileSync(paths.weather, text, 'utf-8');
    console.log(`  ✅ Hava durumu: ${text}`);
  } catch (err) {
    console.warn(`  ⚠️  Hava durumu alınamadı (mevcut dosya korunuyor): ${err.message}`);
  }
}

/* ── 5. Bekleyen push bildirimlerini gönder ───────────────── */
async function processNotificationQueue() {
  if (!db || !messaging) {
    console.log('  ⏭️  Bildirim kuyruğu atlandı (kimlik bilgisi yok).');
    return;
  }

  const pending = await db
    .collection('notifications_queue')
    .where('sent', '==', false)
    .limit(5)
    .get()
    .catch(() => null);

  // 'sent' alanı hiç yazılmamış eski kayıtlar için ikinci deneme
  const queue = pending && !pending.empty
    ? pending.docs
    : (await db.collection('notifications_queue').orderBy('createdAt', 'desc').limit(5).get()).docs
        .filter((d) => d.data().sent !== true);

  if (!queue.length) {
    console.log('  🔕 Bekleyen bildirim yok.');
    return;
  }

  const tokenSnap = await db.collection('fcm_tokens').get();
  const tokens = tokenSnap.docs.map((d) => d.data().token).filter(Boolean);

  if (!tokens.length) {
    console.log('  ⚠️  Kayıtlı cihaz yok, bildirim gönderilemiyor.');
    return;
  }

  for (const docSnap of queue) {
    const item = docSnap.data();
    try {
      const res = await messaging.sendEachForMulticast({
        notification: {
          title: item.title || 'Berlin Konuşuyor',
          body: item.body || '',
          ...(item.image ? { imageUrl: item.image } : {}),
        },
        data: { url: item.url || BASE_URL },
        tokens,
      });
      console.log(`  🚀 "${item.title}" → ${res.successCount}/${tokens.length} cihaz`);

      // Geçersiz tokenları temizle
      const dead = [];
      res.responses.forEach((r, i) => {
        const code = r.error?.code || '';
        if (code.includes('registration-token-not-registered') || code.includes('invalid-argument')) {
          dead.push(tokens[i]);
        }
      });
      for (const token of dead) {
        const stale = await db.collection('fcm_tokens').where('token', '==', token).get();
        await Promise.all(stale.docs.map((d) => d.ref.delete()));
      }
      if (dead.length) console.log(`  🧹 ${dead.length} geçersiz token silindi.`);

      await docSnap.ref.update({
        sent: true,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        successCount: res.successCount,
      });
    } catch (err) {
      console.error(`  ❌ Bildirim hatası (${docSnap.id}):`, err.message);
      await docSnap.ref.update({ sent: true, error: err.message }).catch(() => {});
    }
  }
}

/* ── Ana akış ─────────────────────────────────────────────── */
async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  Berlin Konuşuyor — İçerik & SEO Yayıncısı  ║');
  console.log('╚════════════════════════════════════════════╝\n');

  initFirebase();

  console.log('\n📥 İçerik toplanıyor...');
  const content = await collectContent();

  console.log('\n🗺️  SEO dosyaları üretiliyor...');
  generateSitemap(content);
  generateRSS(content);
  writeFallbacks(content);

  console.log('\n🌤️  Hava durumu güncelleniyor...');
  await fetchWeather();

  console.log('\n🔔 Bildirim kuyruğu işleniyor...');
  await processNotificationQueue().catch((err) =>
    console.error('  ❌ Kuyruk hatası:', err.message)
  );

  console.log('\n✅ Tamamlandı.\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Beklenmeyen hata:', err.message);
  // Derlemeyi bloke etmemek için 0 ile çık: SEO dosyaları isteğe bağlıdır.
  process.exit(0);
});
