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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_PATH = join(__dirname, '..', 'public', 'data', 'news.json');
const WIDGETS_PATH = join(__dirname, '..', 'public', 'data', 'widgets.json');

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
};

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
        const prompt = `Aşağıdaki haberi 2-3 cümle ile Türkçe'ye özet olarak çevir. Sadece özeti yaz, başka bir şey ekleme:\n\nBaşlık: ${article.title}\nİçerik: ${article.description.substring(0, 500)}`;

        const result = await model.generateContent(prompt);
        const summary = result.response.text();

        if (summary && summary.length > 20) {
          article.summary_tr = summary.trim();
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

  console.log(`\n📊 Toplam benzersiz haber: ${allArticles.length}`);

  // Katman 4: AI Insights
  console.log('\n🤖 Katman 4: AI Insights...');
  const aiInsights = await generateAIInsights(allArticles);

  // Katman 3: AI Özetleme
  console.log('\n🤖 Katman 3: AI Özetleme...');
  allArticles = await summarizeWithAI(allArticles);

  // JSON'a kaydet
  const output = {
    lastUpdated: new Date().toISOString(),
    count: allArticles.length,
    articles: allArticles,
    insights: aiInsights
  };

  writeFileSync(DATA_PATH, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n💾 Kaydedildi: ${DATA_PATH}`);
  console.log('✅ Tamamlandı!\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Hata:', err.message);
  process.exit(1);
});
