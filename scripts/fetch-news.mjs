/*  ═══════════════════════════════════════════
    BERLIN KONUŞUYOR — 3 Katmanlı Haber Çekici
    Katman 1: RSS Feed
    Katman 2: NewsData.io API
    Katman 3: Gemini AI Özetleme
    ═══════════════════════════════════════════ */

import Parser from 'rss-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_PATH = join(__dirname, '..', 'public', 'data', 'news.json');
const WIDGETS_PATH = join(__dirname, '..', 'public', 'data', 'widgets.json');
const SITEMAP_PATH = join(__dirname, '..', 'public', 'sitemap.xml');
const RSS_PATH = join(__dirname, '..', 'public', 'rss.xml');

// ── Configuration ───────────────────────────
const CONFIG = {
  // NewsData.io — ücretsiz API key (https://newsdata.io adresinden alın)
  NEWSDATA_API_KEY: process.env.NEWSDATA_API_KEY || '',

  // Google Gemini — ücretsiz API key (https://aistudio.google.com/apikey)
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',

  // RSS Feed kaynakları
  RSS_FEEDS: [
    {
      name: 'RBB24 Berlin',
      url: 'https://www.rbb24.de/aktuell/index.xml/feed=rss.xml',
      lang: 'de',
      category: 'berlin',
    },
    {
      name: 'Berlin.de',
      url: 'https://www.berlin.de/presse/pressemitteilungen/index.php/rss',
      lang: 'de',
      category: 'berlin',
    },
    {
      name: 'Anadolu Ajansı',
      url: 'https://www.aa.com.tr/tr/rss/default?cat=guncel',
      lang: 'tr',
      category: 'almanya',
    },
  ],

  // Max haber sayısı
  MAX_NEWS: 20,
  MAX_RSS_PER_FEED: 5,

  // Push Bildirim Ayarları
  IMPORTANCE_THRESHOLD: 7, // 0-10 arası, 7 ve üzeri bildirim atar
  PUSH_LIMIT_PER_RUN: 1,  // Her çalışmada max kaç haberi bildirime çevirsin
};

// ── Firebase Admin Kurulumu ──────────────────
let fcmApp = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    fcmApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin SDK — Başarıyla kuruldu');
  } catch (err) {
    console.error('❌ Firebase Admin SDK — Kurulum hatası:', err.message);
  }
} else {
  console.log('⚠️ Firebase Admin SDK — FIREBASE_SERVICE_ACCOUNT eksik, bildirimler pasif');
}

// ── Katman 1: RSS Feed Çekme ────────────────
async function fetchRSSFeeds() {
  const parser = new Parser({
    timeout: 10000,
    headers: { 'User-Agent': 'BerlinKonusuyor/1.0' },
  });

  const allItems = [];

  for (const feed of CONFIG.RSS_FEEDS) {
    try {
      console.log(`  📡 RSS çekiliyor: ${feed.name}...`);
      const result = await parser.parseURL(feed.url);
      const items = (result.items || []).slice(0, CONFIG.MAX_RSS_PER_FEED).map((item) => ({
        title: item.title || '',
        description: item.contentSnippet || item.content || '',
        url: item.link || '',
        image: item.enclosure?.url || extractImgFromContent(item['content:encoded'] || item.content || '') || '',
        date: item.isoDate || item.pubDate || new Date().toISOString(),
        source: feed.name,
        lang: feed.lang,
        category: feed.category,
        type: 'rss',
      }));
      allItems.push(...items);
      console.log(`    ✅ ${items.length} haber alındı`);
    } catch (err) {
      console.log(`    ⚠️  ${feed.name} atlandı: ${err.message}`);
    }
  }

  return allItems;
}

// ── Katman 2: NewsData.io API ───────────────
async function fetchNewsAPI() {
  if (!CONFIG.NEWSDATA_API_KEY) {
    console.log('  ⏭️  NewsData.io atlandı (API key yok)');
    return [];
  }

  const query = encodeURIComponent('Berlin');
  const url = `https://newsdata.io/api/1/latest?apikey=${CONFIG.NEWSDATA_API_KEY}&q=${query}&country=de&language=de,tr,en&size=10`;

  try {
    console.log('  🔍 NewsData.io API çağrılıyor...');
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'success' || !data.results) {
      console.log(`    ⚠️  API hata: ${data.message || 'Bilinmeyen hata'}`);
      return [];
    }

    const items = data.results.map((item) => ({
      title: item.title || '',
      description: item.description || '',
      url: item.link || '',
      image: item.image_url || '',
      date: item.pubDate || new Date().toISOString(),
      source: item.source_name || item.source_id || 'NewsData',
      lang: item.language || 'de',
      category: 'berlin',
      type: 'api',
    }));

    console.log(`    ✅ ${items.length} haber alındı`);
    return items;
  } catch (err) {
    console.log(`    ⚠️  NewsData.io atlandı: ${err.message}`);
    return [];
  }
}

// ── Katman 3: Gemini AI Özetleme ────────────
async function summarizeWithAI(articles) {
  if (!CONFIG.GEMINI_API_KEY) {
    console.log('  ⏭️  AI özetleme atlandı (API key yok)');
    return articles;
  }

  try {
    console.log('  🤖 Gemini AI ile özetleniyor...');
    const genAI = new GoogleGenerativeAI(CONFIG.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const toSummarize = articles.filter((a) => a.lang !== 'tr' && a.description.length > 100);
    let summarized = 0;

    for (const article of toSummarize.slice(0, 8)) {
      try {
        const prompt = `Aşağıdaki haberi analiz et.
          1. Türkçe 2-3 cümlelik çok kaliteli bir özet yaz.
          2. Haberin önem derecesini (0-10 arası) belirle. (Berlin'deki S-Bahn grevleri, büyük kazalar, yeni yasalar 8-10 arası olmalı).
          3. Yanıtı mutlaka şu JSON formatında ver: {"summary": "...", "importance": 8}
          Sadece JSON döndür.
          
          Haber Başlığı: ${article.title}
          Habere İçeriği: ${article.description.substring(0, 500)}`;

        const result = await model.generateContent(prompt);
        let rawText = result.response.text().trim();
        
        // Bazı durumlarda Gemini markdown ```json şeklinde dönebilir
        if (rawText.startsWith('```json')) {
          rawText = rawText.replace(/```json|```/g, '').trim();
        }

        const data = JSON.parse(rawText);

        if (data.summary && data.importance >= 0) {
          article.summary_tr = data.summary;
          article.importance = data.importance;
          summarized++;
        }

        // Rate limit: 15 istek/dk → ~5sn arası bekle
        await sleep(5000);
      } catch (err) {
        console.log(`    ⚠️  Özetleme hatası: ${err.message}`);
      }
    }

    console.log(`    ✅ ${summarized} haber özetlendi`);
  } catch (err) {
    console.log(`    ⚠️  AI modülü atlandı: ${err.message}`);
  }

  return articles;
}

// ── Katman 4: AI Insights (Widgets) ──────────
async function generateAIInsights(articles) {
  if (!CONFIG.GEMINI_API_KEY) {
    console.log('  ⏭️  AI Insight atlandı (API key yok)');
    return { weatherAdvice: "Berlin'de güzel bir gün dileriz!", newsBrief: "Berlin gündemi her zaman hareketli." };
  }

  try {
    console.log('  🤖 Gemini AI — Berlin Insight üretiliyor...');
    const genAI = new GoogleGenerativeAI(CONFIG.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // 1. Haber Özeti (Flash ile hızlı)
    const titles = articles.slice(0, 5).map(a => a.title).join('\n');
    const briefPrompt = `Aşağıdaki haber başlıklarını analiz et ve Berlin halkı için 1-2 cümlelik çok çarpıcı, modern dilli bir "Bugün Bilmeniz Gerekenler" özeti yaz. Sadece özeti yaz:\n\n${titles}`;
    
    const briefResult = await model.generateContent(briefPrompt);
    const newsBrief = briefResult.response.text().trim();

    // 2. AI Vibe/Hava Tavsiyesi (Demo için sabit hava verisi, ilerde API eklenebilir)
    const vibePrompt = `Bugün Berlin'de havanın değişken olduğunu varsayarak, Berlin'deki Türk toplumuna (özellikle gençler ve gurbetçilere) hitaben 1 cümlelik çok samimi, şık ve premium bir "vibe" tavsiyesi ver. Örn: 'Hava biraz kapalı ama Kreuzberg'de içeceğin bir Flat White günü aydınlatmaya yeter!'`;
    
    const vibeResult = await model.generateContent(vibePrompt);
    const weatherAdvice = vibeResult.response.text().trim();

    return { weatherAdvice, newsBrief };
  } catch (err) {
    console.log(`    ⚠️  AI Insight hatası: ${err.message}`);
    return { weatherAdvice: "Berlin'in tadını çıkarın!", newsBrief: "Haberleri takipte kalın." };
  }
}

// ── Katman 5: Push Bildirim Gönderme ─────────
async function sendPushNotifications(articles) {
  if (!fcmApp) return;

  // Sadece yüksek öncelikli ve henüz bildirim gönderilmemiş haberleri seç
  const importantArticles = articles.filter(a => 
    a.importance >= CONFIG.IMPORTANCE_THRESHOLD && 
    !a.notified
  ).slice(0, CONFIG.PUSH_LIMIT_PER_RUN);

  if (importantArticles.length === 0) {
    console.log('  🔕 Gönderilecek önemli yeni haber bulunamadı.');
    return;
  }

  // Firestore'dan aboneleri çek
  const db = admin.firestore();
  console.log('  👥 Bildirim aboneleri taranıyor...');
  const snapshot = await db.collection('fcm_tokens').get();
  const tokens = snapshot.docs.map(doc => doc.data().token);

  if (tokens.length === 0) {
    console.log('  ⚠️ Abone bulunamadı, bildirim gönderilemiyor.');
    return;
  }

  for (const article of importantArticles) {
    console.log(`  🚀 Bildirim gönderiliyor: ${article.title}`);
    
    const message = {
      notification: {
        title: '🚨 Berlin Konuşuyor | Önemli Gelişme',
        body: article.summary_tr || article.title,
        image: article.image || 'https://berlinkonusuyor.com/icon-512.png'
      },
      data: {
        url: article.url || 'https://berlinkonusuyor.com'
      },
      tokens: tokens
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`    ✅ ${response.successCount} cihaza başarıyla gönderildi.`);
      article.notified = true; // Haberi ödüllendir/işaretle ki tekrar atmasın
    } catch (err) {
      console.error('    ❌ Bildirim hatası:', err.message);
    }
  }
}

// ── Helpers ─────────────────────────────────
function extractImgFromContent(html) {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : '';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function deduplicateByTitle(articles) {
  const seen = new Set();
  return articles.filter((a) => {
    const key = a.title.toLowerCase().trim().substring(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Katman 6: Sitemap & RSS Üretimi ──────────
function generateSitemap(articles) {
  console.log('\n🗺️  Sitemap üretiliyor...');
  const baseUrl = 'https://berlinkonusuyor.com';
  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="tr" href="${baseUrl}/?lang=tr"/>
    <xhtml:link rel="alternate" hreflang="de" href="${baseUrl}/?lang=de"/>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/?lang=en"/>
  </url>`;

  articles.forEach((article, index) => {
    const id = article.id || `news-${index}`;
    const priority = article.importance >= 8 ? '0.8' : '0.5';
    xml += `
  <url>
    <loc>${baseUrl}/#!news/${id}</loc>
    <lastmod>${new Date(article.date).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
  });

  xml += '\n</urlset>';
  writeFileSync(SITEMAP_PATH, xml, 'utf-8');
  console.log(`    ✅ Sitemap güncellendi: ${SITEMAP_PATH}`);
}

function generateRSS(articles) {
  console.log('📡 RSS Feed üretiliyor...');
  const baseUrl = 'https://berlinkonusuyor.com';

  let xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2004/atom">
<channel>
  <title>Berlin Konuşuyor — Berlin'in Nabzı</title>
  <link>${baseUrl}</link>
  <description>Berlin'in en güncel haberleri, sokak röportajları ve şehir rehberi.</description>
  <language>tr</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />`;

  articles.forEach((article, index) => {
    const id = article.id || `news-${index}`;
    const title = article.summary_tr || article.title;
    xml += `
  <item>
    <title><![CDATA[${title}]]></title>
    <link>${baseUrl}/#!news/${id}</link>
    <guid isPermaLink="false">${id}</guid>
    <pubDate>${new Date(article.date).toUTCString()}</pubDate>
    <description><![CDATA[${article.description || title}]]></description>
    <source url="${article.url}">${article.source}</source>
  </item>`;
  });

  xml += '\n</channel>\n</rss>';
  writeFileSync(RSS_PATH, xml, 'utf-8');
  console.log(`    ✅ RSS güncellendi: ${RSS_PATH}`);
}

// ── Main ────────────────────────────────────
async function main() {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║  Berlin Konuşuyor — Haber Çekici      ║');
  console.log('╚═══════════════════════════════════════╝\n');

  // Katman 1: RSS
  console.log('📡 Katman 1: RSS Feed...');
  const rssArticles = await fetchRSSFeeds();

  // Katman 2: API
  console.log('\n🔍 Katman 2: NewsData.io API...');
  const apiArticles = await fetchNewsAPI();

  // Birleştir ve tekrarları kaldır
  let allArticles = deduplicateByTitle([...rssArticles, ...apiArticles]);

  // Tarihe göre sırala (en yeni ilk)
  allArticles.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Limitle
  allArticles = allArticles.slice(0, CONFIG.MAX_NEWS);

  // Eski verileri yükle (Zaten bildirim gönderilenleri korumak için)
  let oldData = { articles: [] };
  if (existsSync(DATA_PATH)) {
    try {
      oldData = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
      console.log(`  📂 Eski veriler yüklendi (${oldData.articles.length} haber)`);
    } catch (e) {
      console.warn('  ⚠️ Eski veri okuma hatası, yeni liste temiz oluşturuluyor.');
    }
  }

  // Özetleme ve Önem Analizi (Katman 3)
  console.log('\n🤖 Katman 3: AI Özetleme & Analiz...');
  allArticles = await summarizeWithAI(allArticles);

  // Eski bildirim durumlarını yeni listeye aktar
  allArticles.forEach(a => {
    const old = oldData.articles.find(oa => oa.title === a.title);
    if (old && old.notified) {
      a.notified = true;
    }
  });

  // Katman 5: Push Bildirimleri (Haberler analiz edildikten SONRA)
  console.log('\n🚀 Katman 5: Push Bildirim Kontrolü...');
  await sendPushNotifications(allArticles);

  console.log(`\n📊 Toplam benzersiz haber: ${allArticles.length}`);

  // Katman 4: AI Insights
  console.log('\n🤖 Katman 4: AI Insights...');
  const aiInsights = await generateAIInsights(allArticles);

  // JSON'a kaydet
  const output = {
    lastUpdated: new Date().toISOString(),
    count: allArticles.length,
    articles: allArticles,
    insights: aiInsights
  };

  writeFileSync(DATA_PATH, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n💾 Kaydedildi: ${DATA_PATH}`);

  // Katman 6: SEO Dosyaları
  generateSitemap(allArticles);
  generateRSS(allArticles);

  console.log('✅ Tamamlandı!\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Hata:', err.message);
  process.exit(1);
});
