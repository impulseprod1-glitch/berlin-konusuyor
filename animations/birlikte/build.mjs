// Tek dosyalık oynatıcıyı üretir: dist/birlikte.html
// Yazı tipleri, GSAP, ses sentezi ve film kodu dosyaya gömülür; dış kaynak yoktur.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(here, p), 'utf8');
const b64 = (p) => readFileSync(join(here, 'node_modules', p)).toString('base64');

const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const LATIN_EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';

const face = (family, file, style, extra, range) =>
  `@font-face{font-family:'${family}';font-style:${style};font-display:block;${extra}src:url(data:font/woff2;base64,${b64(file)}) format('woff2');unicode-range:${range}}`;

const fonts = [
  face('Archivo Variable', '@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2', 'normal', 'font-weight:100 900;font-stretch:62% 125%;', LATIN),
  face('Archivo Variable', '@fontsource-variable/archivo/files/archivo-latin-ext-wdth-normal.woff2', 'normal', 'font-weight:100 900;font-stretch:62% 125%;', LATIN_EXT),
  face('Playfair Display Variable', '@fontsource-variable/playfair-display/files/playfair-display-latin-wght-italic.woff2', 'italic', 'font-weight:400 900;', LATIN),
  face('Playfair Display Variable', '@fontsource-variable/playfair-display/files/playfair-display-latin-ext-wght-italic.woff2', 'italic', 'font-weight:400 900;', LATIN_EXT),
].join('\n');

// String.replace'in "$" kalıplarına takılmamak için fonksiyonla değiştir
const html = read('src/film.html')
  .replace('/*__FONTS__*/', () => fonts)
  .replace('/*__GSAP__*/', () => readFileSync(join(here, 'node_modules/gsap/dist/gsap.min.js'), 'utf8'))
  .replace('/*__AUDIO__*/', () => read('src/audio.js'))
  .replace('/*__FILM__*/', () => read('src/film.js'));

mkdirSync(join(here, 'dist'), { recursive: true });
writeFileSync(join(here, 'dist/birlikte.html'), html);
console.log(`dist/birlikte.html  ${(html.length / 1024).toFixed(0)} KB`);

// 2. stil: kinetik kurgu (dünya + sanal kamera) → dist/kinetik.html
{
  const snips = (card) => {
    const base = read('src/film.html');
    const seg = base.slice(base.indexOf(`id="${card}"`)).split('<div class="big hd"')[0];
    return seg.match(/<svg class="art[^>]*ic"[\s\S]*?<\/svg>/g) || [];
  };
  const baseCss = read('src/film.html').split('<style>')[1].split('</style>')[0].replace('/*__FONTS__*/', () => fonts);
  const k = read('src/kinetic.html')
    .replace('/*__BASECSS__*/', () => baseCss)
    .replace(/<!--SVG:(c\d):(\d)-->/g, (_, c, i) => snips(c)[+i])
    .replace('/*__GSAP__*/', () => readFileSync(join(here, 'node_modules/gsap/dist/gsap.min.js'), 'utf8'))
    .replace('/*__AUDIO__*/', () => read('src/audio.js'))
    .replace('/*__ART__*/', () => read('src/art.js'))
    .replace('/*__FILM__*/', () => read('src/kinetic.js'));
  writeFileSync(join(here, 'dist/kinetik.html'), k);
  console.log(`dist/kinetik.html   ${(k.length / 1024).toFixed(0)} KB`);
}

// Gövdesiz sürüm: kendi <html>/<head>/<body> iskeletini ekleyen yayın ortamları için
const fragment = html
  .replace(/^[\s\S]*?<title>/, '<meta name="claude:viewport-fit-sides" content="cover">\n<title>')
  .replace('</head>\n<body>', '')
  .replace(/<\/body>\s*<\/html>\s*$/, '');
writeFileSync(join(here, 'dist/birlikte.fragment.html'), fragment);
