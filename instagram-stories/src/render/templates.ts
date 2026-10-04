import { config } from '../config.ts';
import type { Category, Story } from '../editor.ts';
import { turkishDate } from '../time.ts';
import { fontFaceCss } from './fonts.ts';

/*
 * Design: a printed morning paper, not a social graphic. Monochrome paper
 * and ink, one vermilion accent, a serif for what is said and a grotesk for
 * the furniture around it. No photos: agency images cannot be licensed for
 * this, and stock photos would illustrate the wrong thing half the time.
 *
 * Instagram draws its own UI over the top ~13 % and bottom ~15 % of a story,
 * so text stays between y=230 and y=1620; only decoration bleeds outside.
 */

export interface SlideSource {
  name: string;
  html: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

const BASE_CSS = `
:root{
  --ink:#141413; --ink-soft:#33312C; --paper:#F3EFE6; --paper-deep:#E8E2D5;
  --mute:#8A8377; --accent:#D63F27;
  --serif:'Fraunces',Georgia,serif; --sans:'Inter',system-ui,sans-serif;
}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden}
body{font-family:var(--sans);-webkit-font-smoothing:antialiased;font-kerning:normal;font-feature-settings:'kern','liga'}
.frame{position:relative;width:1080px;height:1920px;overflow:hidden;display:flex;flex-direction:column;padding:228px 84px 300px}
.frame::after{content:'';position:absolute;inset:0;background-image:${GRAIN};opacity:.07;pointer-events:none}
.masthead{position:relative;z-index:1;display:flex;justify-content:space-between;align-items:baseline;padding-bottom:26px;border-bottom:2px solid currentColor}
.wordmark{font-weight:700;font-size:25px;letter-spacing:.3em}
.masthead .right{font-weight:500;font-size:25px;letter-spacing:.08em;font-variant-numeric:tabular-nums}
.serif{font-family:var(--serif)}
`;

const FIT_SCRIPT = `
<script>
window.__ready = async () => {
  await document.fonts.ready;
  const overflow = [];
  for (const el of document.querySelectorAll('[data-fit]')) {
    const max = Number(el.dataset.max), min = Number(el.dataset.min), maxh = Number(el.dataset.maxh);
    let size = max;
    el.style.fontSize = size + 'px';
    while (el.scrollHeight > maxh && size > min) { size -= 2; el.style.fontSize = size + 'px'; }
    if (el.scrollHeight > maxh) overflow.push(el.dataset.fit);
  }
  return overflow;
};
</script>`;

function page(body: string, css: string): string {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>${fontFaceCss()}${BASE_CSS}${css}</style></head><body>${body}${FIT_SCRIPT}</body></html>`;
}

const COVER_CSS = `
.cover{background:var(--ink);color:var(--paper)}
.cover .masthead{border-color:rgba(243,239,230,.9)}
.dateline{display:flex;justify-content:space-between;align-items:baseline;margin-top:44px}
.dateline .weekday{font-weight:600;font-size:26px;letter-spacing:.24em;text-transform:uppercase;color:rgba(243,239,230,.6)}
.dateline .date{font-family:var(--serif);font-size:46px;font-weight:400;font-variation-settings:'opsz' 72}
.title{font-family:var(--serif);font-weight:380;font-size:236px;line-height:.88;letter-spacing:-.045em;margin-top:70px;font-variation-settings:'opsz' 144,'SOFT' 30}
.title em{font-style:italic;font-weight:300;font-variation-settings:'opsz' 144,'SOFT' 100,'WONK' 1}
.title .dot{color:var(--accent)}
.toc{list-style:none;margin-top:auto}
.toc li{display:grid;grid-template-columns:76px minmax(0,1fr);column-gap:8px;padding:.62em 0;border-top:1.5px solid rgba(243,239,230,.2)}
.toc li:last-child{border-bottom:1.5px solid rgba(243,239,230,.2)}
.toc .num{font-weight:600;font-size:.62em;letter-spacing:.06em;color:var(--accent);padding-top:.42em;font-variant-numeric:tabular-nums}
.toc .cat{display:block;font-weight:600;font-size:.5em;letter-spacing:.24em;color:rgba(243,239,230,.55);margin-bottom:.32em}
.toc .head{font-family:var(--serif);font-weight:420;line-height:1.14;letter-spacing:-.01em;font-variation-settings:'opsz' 36;text-wrap:balance}
.footline{display:flex;justify-content:space-between;margin-top:40px;font-weight:500;font-size:24px;letter-spacing:.06em;color:rgba(243,239,230,.6)}
.footline .cta{color:var(--paper)}
`;

export function coverHtml(stories: Story[], isoDate: string, label: string): string {
  const { date, weekday } = turkishDate(isoDate);
  const toc = stories
    .map(
      (s, i) => `<li><span class="num">${pad(i + 1)}</span><span><span class="cat">${escapeHtml(s.category)}</span><span class="head">${escapeHtml(s.headline)}</span></span></li>`,
    )
    .join('');
  return page(
    `<main class="frame cover">
      <header class="masthead"><span class="wordmark">${escapeHtml(config.brand.wordmark)}</span><span class="right">${escapeHtml(label)}</span></header>
      <div class="dateline"><span class="weekday">${escapeHtml(weekday)}</span><span class="date">${escapeHtml(date)}</span></div>
      <h1 class="title">Günün<br><em>özeti</em><span class="dot">.</span></h1>
      <ol class="toc" data-fit="cover-toc" data-max="38" data-min="28" data-maxh="760">${toc}</ol>
      <footer class="footline"><span>${stories.length} haber · ${escapeHtml(config.brand.handle)}</span><span class="cta">Okumak için dokun →</span></footer>
    </main>`,
    COVER_CSS,
  );
}

const STORY_CSS = `
.story{background:var(--paper);color:var(--ink)}
.bignum{position:absolute;z-index:0;right:-40px;top:250px;font-family:var(--serif);font-weight:300;font-size:880px;line-height:1;letter-spacing:-.06em;color:var(--paper-deep);font-variation-settings:'opsz' 144,'SOFT' 50;font-variant-numeric:lining-nums}
.content{position:relative;z-index:1;margin-top:auto;display:flex;flex-direction:column}
.tags{display:flex;align-items:center;gap:22px;margin-bottom:38px}
.tag{font-weight:700;font-size:22px;letter-spacing:.24em;padding:12px 18px 11px 20px;border:2px solid var(--ink)}
.tag--BERLİN{background:var(--accent);border-color:var(--accent);color:var(--paper)}
.tag--ALMANYA{background:var(--ink);color:var(--paper)}
.tag--DÜNYA{background:transparent;color:var(--ink)}
.kicker{font-family:var(--serif);font-style:italic;font-size:36px;font-weight:400;color:var(--ink-soft);font-variation-settings:'opsz' 36}
.headline{font-family:var(--serif);font-weight:540;line-height:1.04;letter-spacing:-.016em;font-variation-settings:'opsz' 60,'SOFT' 0;text-wrap:balance}
.bar{width:104px;height:7px;background:var(--accent);margin:48px 0 40px}
.summary{font-weight:400;line-height:1.42;color:var(--ink-soft);text-wrap:pretty;font-variation-settings:'opsz' 28}
.meta{display:flex;justify-content:space-between;align-items:baseline;gap:24px;margin-top:56px;padding-top:24px;border-top:1.5px solid rgba(20,20,19,.18);font-weight:500;font-size:22px;letter-spacing:.04em;color:var(--mute)}
.meta b{font-weight:600;color:var(--ink-soft)}
`;

export function storyHtml(story: Story, index: number, total: number, isoDate: string): string {
  const { date } = turkishDate(isoDate);
  const category: Category = story.category;
  return page(
    `<main class="frame story">
      <div class="bignum" aria-hidden="true">${pad(index + 1)}</div>
      <header class="masthead"><span class="wordmark">${escapeHtml(config.brand.wordmark)}</span><span class="right">${pad(index + 1)} / ${pad(total)}</span></header>
      <section class="content">
        <div class="tags"><span class="tag tag--${category}">${escapeHtml(category)}</span><span class="kicker">${escapeHtml(story.kicker)}</span></div>
        <h2 class="headline" data-fit="headline" data-max="100" data-min="58" data-maxh="560">${escapeHtml(story.headline)}</h2>
        <div class="bar"></div>
        <p class="summary" data-fit="summary" data-max="40" data-min="30" data-maxh="400">${escapeHtml(story.summary)}</p>
        <footer class="meta"><span>Kaynak: <b>${escapeHtml(story.sources.join(' · '))}</b></span><span>${escapeHtml(date)}</span></footer>
      </section>
    </main>`,
    STORY_CSS,
  );
}

export function editionSlides(stories: Story[], isoDate: string, label = 'Sabah Bülteni'): SlideSource[] {
  return [
    { name: '00-cover', html: coverHtml(stories, isoDate, label) },
    ...stories.map((story, i) => ({ name: `${pad(i + 1)}-story`, html: storyHtml(story, i, stories.length, isoDate) })),
  ];
}
