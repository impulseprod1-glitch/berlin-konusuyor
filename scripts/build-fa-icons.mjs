/*  ═══════════════════════════════════════════════════════════
    BERLIN KONUŞUYOR — Font Awesome İkon CSS Üretici

    NEDEN: Site, kullanılan ~67 ikon için tüm Font Awesome
    kütüphanesini (~55 kB CSS + 119 kB webfont, ~2000+ ikon)
    indiriyordu. Bu script yalnızca gerçekten kullanılan
    ikonların SVG yol verisini `@fortawesome/fontawesome-free`
    paketinden (node_modules — yayına gitmiyor) okuyup her biri
    için bir CSS `mask-image` kuralı üretir. Element font glyph
    yerine `background-color: currentColor` + SVG mask ile
    çizilir; hiç webfont indirilmez.

    NE YAPAR: `src/styles/fa-icons.css` dosyasını yazar. Mevcut
    `<i class="fas fa-star">` işaretlemesi HİÇ değişmez — yalnızca
    görselin nasıl çizildiği değişir. Yeni bir ikon eklenirse
    aşağıdaki ICONS listesine [stil, isim] olarak eklenip bu
    script tekrar çalıştırılmalı: `npm run icons`
    ═══════════════════════════════════════════════════════════ */

import { writeFileSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SVG_ROOT = join(ROOT, 'node_modules/@fortawesome/fontawesome-free/svgs');
const OUT_FILE = join(ROOT, 'src/styles/fa-icons.css');

// [stil, ikon-adı] — kod tabanında `grep -rhoE 'fa-[a-z0-9-]+'` ile
// tarandı (bkz. src/**/*.js, *.html). `wifi-slash` FA7'de kaldırıldığı
// için `link-slash` ile değiştirildi (public/offline.html).
const ICONS = [
  ['solid', 'arrow-left'],
  ['solid', 'arrow-right'],
  ['solid', 'arrow-up'],
  ['solid', 'bell'],
  ['solid', 'bolt'],
  ['solid', 'bookmark'],
  ['solid', 'briefcase'],
  ['solid', 'calendar-alt'],
  ['solid', 'chart-line'],
  ['solid', 'chart-pie'],
  ['solid', 'check'],
  ['solid', 'chevron-left'],
  ['solid', 'chevron-right'],
  ['solid', 'comment'],
  ['solid', 'comments'],
  ['solid', 'cookie-bite'],
  ['solid', 'download'],
  ['solid', 'envelope'],
  ['solid', 'envelope-open-text'],
  ['solid', 'external-link-alt'],
  ['solid', 'feather-alt'],
  ['solid', 'file-signature'],
  ['solid', 'film'],
  ['solid', 'home'],
  ['solid', 'hourglass-half'],
  ['solid', 'image'],
  ['solid', 'landmark'],
  ['solid', 'link-slash'],
  ['solid', 'location-arrow'],
  ['solid', 'map-marked-alt'],
  ['solid', 'map-marker-alt'],
  ['solid', 'mobile-alt'],
  ['solid', 'moon'],
  ['solid', 'newspaper'],
  ['solid', 'paper-plane'],
  ['solid', 'pause'],
  ['solid', 'pen'],
  ['solid', 'play'],
  ['solid', 'poll'],
  ['solid', 'redo-alt'],
  ['solid', 'robot'],
  ['solid', 'search'],
  ['solid', 'share-alt'],
  ['solid', 'share-nodes'],
  ['solid', 'sign-out-alt'],
  ['solid', 'spinner'],
  ['solid', 'star'],
  ['solid', 'stop'],
  ['solid', 'sun'],
  ['solid', 'sync-alt'],
  ['solid', 'times'],
  ['solid', 'train'],
  ['solid', 'undo-alt'],
  ['solid', 'user'],
  ['solid', 'user-circle'],
  ['solid', 'user-shield'],
  ['solid', 'users-cog'],
  ['solid', 'utensils'],
  ['solid', 'video'],
  ['solid', 'video-slash'],
  ['solid', 'volume-up'],
  ['regular', 'clock'],
  ['regular', 'comment-alt'],
  ['regular', 'eye'],
  ['brands', 'instagram'],
  ['brands', 'tiktok'],
  ['brands', 'youtube'],
];

function readIconSvg(style, name) {
  const raw = readFileSync(join(SVG_ROOT, style, `${name}.svg`), 'utf-8');
  const viewBox = raw.match(/viewBox="([^"]+)"/)?.[1];
  const inner = raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .trim();
  if (!viewBox || !inner) {
    throw new Error(`${style}/${name}.svg ayrıştırılamadı`);
  }
  return { viewBox, inner };
}

// encodeURIComponent %-kaçışlar her karakteri (boşluk, virgül, nokta dahil) —
// SVG yol verisinde bunlardan binlerce var. Yalnızca URI/HTML açısından
// gerçekten sorunlu karakterleri kaçırmak dosyayı ~%45 küçültüyor.
function toDataUri(viewBox, inner) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${inner}</svg>`;
  const encoded = svg
    .replace(/"/g, "'")
    .replace(/%/g, '%25')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/&/g, '%26')
    .replace(/#/g, '%23')
    .replace(/\s+/g, ' ');
  return `data:image/svg+xml,${encoded}`;
}

const rules = ICONS.slice()
  .sort(([, a], [, b]) => a.localeCompare(b))
  .map(([style, name]) => {
    const { viewBox, inner } = readIconSvg(style, name);
    const uri = toDataUri(viewBox, inner);
    return `.fa-${name} { -webkit-mask-image: url("${uri}"); mask-image: url("${uri}"); }`;
  });

const css = `/* Otomatik üretildi: npm run icons (scripts/build-fa-icons.mjs). Elle düzenlemeyin. */

.fas, .far, .fab {
  display: inline-block;
  width: 1em;
  height: 1em;
  background-color: currentColor;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: contain;
  mask-size: contain;
  vertical-align: -0.125em;
}

@keyframes fa-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.fa-spin { animation: fa-spin 2s infinite linear; }

${rules.join('\n')}
`;

writeFileSync(OUT_FILE, css);
console.log(`${ICONS.length} ikon → ${OUT_FILE} (${(css.length / 1024).toFixed(1)} kB)`);
