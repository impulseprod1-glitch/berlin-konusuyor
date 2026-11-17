/*
 * Tiny deterministic motion-graphics engine for canvas.
 * Every frame is a pure function of time t (seconds), so frames can be
 * rendered in any order and the render matches the browser preview exactly.
 */
const W = 1080, H = 1920;

const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
/** Progress of t through [s, s+d], clamped to 0..1. */
const prog = (t, s, d) => clamp((t - s) / d);
/** Alpha that fades in over fi after s and out over fo before e. */
const win = (t, s, e, fi = 0.5, fo = 0.5) => Math.min(clamp((t - s) / fi), clamp((e - t) / fo));

const ease = {
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inCubic: t => t * t * t,
  inOutCubic: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuint: t => 1 - Math.pow(1 - t, 5),
  outExpo: t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inExpo: t => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  inOutExpo: t => t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
};

function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Stable pseudo-random value for an integer key (used for flicker). */
const hash = n => { const r = rng(n * 9973 + 17); r(); return r(); };

function txt(ctx, s, x, y, o = {}) {
  ctx.save();
  ctx.font = o.font || '400 40px Inter';
  ctx.fillStyle = o.color || '#fff';
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.base || 'alphabetic';
  ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha;
  ctx.letterSpacing = (o.ls || 0) + 'px';
  if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.lw || 2; ctx.strokeText(s, x, y); }
  else ctx.fillText(s, x, y);
  ctx.restore();
}

function measure(ctx, s, font, ls = 0) {
  ctx.save(); ctx.font = font; ctx.letterSpacing = ls + 'px';
  const w = ctx.measureText(s).width; ctx.restore(); return w;
}

/** Largest font size (<= size) at which s fits into maxW. fontFn(size) -> font string. */
function fit(ctx, s, fontFn, size, maxW, ls = 0) {
  const w = measure(ctx, s, fontFn(size), ls);
  return w <= maxW ? size : Math.floor(size * maxW / w);
}

/*
 * Word layout with *emphasis* markup and \n line breaks.
 * Returns { lines: [{ words: [{ s, em, x, w }], width }], lineH }.
 */
function layout(ctx, text, o) {
  const tokens = [];
  text.split('\n').forEach((para, pi) => {
    if (pi) tokens.push({ br: true });
    // *a b c* emphasises a phrase; split into words keeping the flag.
    const parts = para.split('*');
    parts.forEach((part, i) => part.split(/\s+/).filter(Boolean).forEach(w => tokens.push({ s: w, em: i % 2 === 1 })));
  });
  const space = measure(ctx, ' ', o.font, o.ls || 0);
  const lines = []; let cur = { words: [], width: 0 };
  for (const tk of tokens) {
    if (tk.br) { lines.push(cur); cur = { words: [], width: 0 }; continue; }
    const f = tk.em ? (o.emFont || o.font) : o.font;
    const w = measure(ctx, tk.s, f, o.ls || 0);
    const add = (cur.words.length ? space : 0) + w;
    if (cur.words.length && cur.width + add > o.maxW) { lines.push(cur); cur = { words: [], width: 0 }; }
    tk.x = cur.width + (cur.words.length ? space : 0); tk.w = w;
    cur.words.push(tk); cur.width = tk.x + w;
  }
  lines.push(cur);
  return { lines, lineH: o.lineH };
}

/*
 * Draws text word by word with a staggered entrance.
 * o: font, emFont, color, emColor, maxW, lineH, align, start, stagger, dur, mode ('rise'|'fade'|'slide'|'blur'), alpha
 * Returns the block height.
 */
function words(ctx, text, x, y, t, o) {
  const L = layout(ctx, text, o);
  const stagger = o.stagger == null ? 0.06 : o.stagger, dur = o.dur || 0.7;
  let i = 0;
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.letterSpacing = (o.ls || 0) + 'px';
  L.lines.forEach((ln, li) => {
    const ox = o.align === 'center' ? x - ln.width / 2 : o.align === 'right' ? x - ln.width : x;
    const ly = y + li * o.lineH;
    for (const wd of ln.words) {
      const p = o.start == null ? 1 : prog(t, o.start + i * stagger, dur);
      i++;
      if (p <= 0) continue;
      const e = ease.outCubic(p);
      ctx.globalAlpha = e * (o.alpha == null ? 1 : o.alpha);
      ctx.font = wd.em ? (o.emFont || o.font) : o.font;
      ctx.fillStyle = wd.em ? (o.emColor || o.color) : o.color;
      let dx = 0, dy = 0;
      const mode = o.mode || 'rise';
      if (mode === 'rise') dy = (1 - e) * (o.lineH * 0.35);
      if (mode === 'slide') dx = (1 - e) * 60;
      if (mode === 'blur' && p < 1) ctx.filter = `blur(${(1 - e) * 12}px)`;
      ctx.fillText(wd.s, ox + wd.x + dx, ly + dy);
      if (mode === 'blur') ctx.filter = 'none';
    }
  });
  ctx.restore();
  return L.lines.length * o.lineH;
}

/** Number of lines text would take (for stacking blocks). */
const lineCount = (ctx, text, o) => layout(ctx, text, o).lines.length;

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

/** Smoothly interpolated keyframes: [{t, ...numbers}] -> object at time t. */
function keyframes(list, t, e = ease.inOutSine) {
  if (t <= list[0].t) return list[0];
  for (let i = 0; i < list.length - 1; i++) {
    const a = list[i], b = list[i + 1];
    if (t < b.t) {
      const k = e((t - a.t) / (b.t - a.t)); const o = {};
      for (const key in a) o[key] = typeof a[key] === 'number' ? lerp(a[key], b[key], k) : a[key];
      return o;
    }
  }
  return list[list.length - 1];
}

/** Count-up number formatted with Turkish thousands separator. */
const fmtNum = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
