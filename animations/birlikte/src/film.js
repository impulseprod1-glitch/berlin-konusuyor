/* "Birlikte Büyüttük" – 60 sn, 1080×1920. Zaman çizelgesi 120 BPM'e oturur:
   1 vuruş = 0,5 sn, 1 ölçü = 2 sn. Sahne geçişleri ölçü başlarına denk gelir
   ve src/audio.js içindeki ses olaylarıyla aynı saniyeleri kullanır. */
(() => {
  const DUR = 60;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RENDER = new URLSearchParams(location.search).has('render');
  if (RENDER) document.body.classList.add('render');
  const STYLE = new URLSearchParams(location.search).get('style');
  if (STYLE) document.getElementById('stage').classList.add('st-' + STYLE);
  gsap.config({ force3D: false, nullTargetWarn: false });
  gsap.ticker.lagSmoothing(0);

  const INK = '#0c0d12', CREAM = '#f4eee3', RED = '#e50914', GOLD = '#f7c443', TEAL = '#0fb5a5';

  /* ───────────── çizimler ───────────── */
  const P = (d, cls = '') => `<path class="d ${cls}" d="${d}"/>`;

  function skyline(towerCls) {
    const cols = [240, 280, 320, 360, 400, 440].map((x) => P(`M${x} 410 V296 h20 V410`, 'sk-gate')).join('');
    return [
      P('M-40 410 H1120', 'sk-g'),
      P('M24 410 V300 H92 V410'), P('M92 410 V250 H150 V410'), P('M150 410 V332 H196 V410'),
      P('M108 280 H134 M108 310 H134 M108 340 H134 M108 370 H134 M42 330 H74 M42 362 H74'),
      P('M196 410 V342 H228 M472 342 H504 V410'),
      cols,
      '<rect class="d sk-gate" x="228" y="266" width="244" height="30"/>',
      '<rect class="d sk-gate" x="290" y="238" width="120" height="28"/>',
      P('M322 238 q4 -22 16 -14 M340 238 q4 -26 16 -16 M358 238 L367 206 L376 238 M367 206 V190 h14 v9 h-14', 'sk-gate'),
      P('M521 410 V386'), '<circle class="d" cx="521" cy="373" r="13"/>',
      P('M574 410 L590 378 M626 410 L610 378', towerCls),
      P('M590 410 L596 198 M610 410 L604 198', towerCls),
      `<circle class="d ${towerCls}" cx="600" cy="170" r="30"/>`,
      P('M571 177 Q600 188 629 177', towerCls),
      P('M594 141 L597 110 H603 L606 141 M600 110 V26 M593 84 H607 M595 58 H605', towerCls),
      P('M660 410 V388'), '<circle class="d" cx="660" cy="375" r="13"/>',
      P('M690 410 V330 H900 V410'),
      P('M690 330 V306 H712 V330 M878 330 V306 H900 V330 M701 306 V282 h15 M889 306 V282 h15'),
      P('M749 330 A46 50 0 0 1 841 330 M772 330 Q774 296 795 281 M818 330 Q816 296 795 281 M795 330 V266'),
      P('M726 398 V352 M750 398 V352 M774 398 V352 M798 398 V352 M822 398 V352 M846 398 V352 M870 398 V352'),
      P('M930 410 V270 H984 V410'), P('M984 410 V322 H1040 V410'), P('M1040 410 V354 H1090'),
      P('M944 300 H970 M944 330 H970 M944 360 H970 M1000 350 H1024 M1000 378 H1024'),
    ].join('');
  }

  function trainSVG() {
    const win = (x) => `<rect x="${x}" y="80" width="34" height="30" rx="4"/>`;
    const car = (x) => `<rect x="${x}" y="62" width="232" height="90" rx="8"/>${[18, 68, 118, 168].map((o) => win(x + o)).join('')}<path stroke="${RED}" d="M${x} 130 H${x + 232}"/>`;
    const wheel = (cx) => `<g class="wh"><circle cx="${cx}" cy="172" r="17"/><path d="M${cx - 17} 172 H${cx + 17} M${cx} 155 V189"/></g>`;
    return `<g fill="${CREAM}" stroke="${INK}" stroke-width="5">
      <path d="M250 142 H268 M500 142 H518"/>
      <path d="M30 152 H250 V62 H98 Q62 62 46 98 L30 132 Z"/>
      <path d="M68 104 Q78 78 102 78 H122 V104 Z"/>
      <rect x="142" y="80" width="38" height="30" rx="4"/><rect x="194" y="80" width="38" height="30" rx="4"/>
      <path stroke="${RED}" d="M36 130 H250"/>
      ${car(268)}${car(518)}
      ${[72, 122, 212, 306, 462, 556, 712].map(wheel).join('')}
    </g>`;
  }

  function donerSVG() {
    let s = '';
    for (let y = 176; y <= 440; y += 44) {
      const xl = 112 + (y - 132) * 0.0952, xr = 288 - (y - 132) * 0.0952;
      s += P(`M${xl.toFixed(1)} ${y} Q200 ${y + 20} ${xr.toFixed(1)} ${y}`, 'c-ink');
    }
    return [
      P('M200 14 V600'), '<circle class="d" cx="200" cy="34" r="11"/>',
      '<ellipse class="d c-gold" cx="200" cy="80" rx="36" ry="20"/>',
      P('M112 132 Q200 100 288 132 L256 468 Q200 492 144 468 Z'),
      s,
      '<ellipse class="d" cx="200" cy="512" rx="150" ry="24"/>',
      P('M70 544 H330 M112 544 V592 M288 544 V592 M56 600 H344'),
      '<rect class="d" x="338" y="150" width="46" height="300" rx="10"/>',
      P('M350 190 H372 M350 228 H372 M350 266 H372 M350 304 H372 M350 342 H372 M350 380 H372 M350 418 H372', 'c-gold'),
      P('M316 196 q-10 14 0 28 q10 14 0 28', 'c-gold heat'), P('M316 282 q-10 14 0 28 q10 14 0 28', 'c-gold heat'), P('M316 368 q-10 14 0 28 q10 14 0 28', 'c-gold heat'),
      `<g class="knife">${P('M34 232 L112 326 Q102 340 90 332 L22 248 Z')}${P('M30 238 L4 204', 'c-ink')}</g>`,
      P('M96 392 q-16 10 -8 28', 'c-gold shav'), P('M78 436 q-14 12 -2 28', 'c-gold shav'), P('M112 440 q-12 12 -2 26', 'c-gold shav'),
    ].join('');
  }

  function gearPath(cx, cy, n, ro, ri) {
    let d = '';
    const w = (2 * Math.PI) / n;
    for (let i = 0; i < n; i++) {
      const a = i * w;
      [[ri, a - w * 0.02], [ro, a + w * 0.12], [ro, a + w * 0.38], [ri, a + w * 0.52]].forEach(([r, t], j) => {
        d += (i + j ? 'L' : 'M') + (cx + r * Math.cos(t)).toFixed(1) + ' ' + (cy + r * Math.sin(t)).toFixed(1);
      });
    }
    return d + 'Z';
  }
  function gearsSVG() {
    return `<g class="gr g1">${P(gearPath(118, 178, 10, 96, 76))}<circle class="d c-cream" cx="118" cy="178" r="34"/>${P('M118 144 V212 M84 178 H152', 'c-cream')}</g>
      <g class="gr g2">${P(gearPath(229, 100, 6, 58, 42), 'c-cream')}<circle class="d" cx="229" cy="100" r="16"/></g>`;
  }

  function star(cx, cy, r, rot = -90) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = ((rot + i * 36) * Math.PI) / 180, rr = i % 2 ? r * 0.4 : r;
      d += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1);
    }
    return d + 'Z';
  }

  function ballSVG() {
    const c = 120, R = 104, pt = (r, deg) => [(c + r * Math.cos((deg * Math.PI) / 180)).toFixed(1), (c + r * Math.sin((deg * Math.PI) / 180)).toFixed(1)].join(' ');
    let pent = '', sp = '', rim = '';
    for (let i = 0; i < 5; i++) {
      const a = -90 + i * 72;
      pent += (i ? 'L' : 'M') + pt(36, a);
      sp += `M${pt(36, a)} L${pt(72, a)} `;
      rim += `M${pt(72, a)} L${pt(96, a + 25)} L${pt(96, a + 47)} L${pt(72, a + 72)} M${pt(96, a + 25)} L${pt(R, a + 30)} M${pt(96, a + 47)} L${pt(R, a + 42)} `;
    }
    return `<circle class="d" cx="${c}" cy="${c}" r="${R}"/>${P(pent + 'Z', 'c-red')}${P(sp)}${P(rim)}`;
  }

  function personSVG() {
    return '<svg class="pp" viewBox="0 0 56 100" width="56" height="100" style="overflow:visible;fill:none;stroke:currentColor;stroke-width:5.5;stroke-linecap:round"><circle cx="28" cy="18" r="12"/><path d="M8 96 V58 Q8 38 28 38 Q48 38 48 58 V96"/></svg>';
  }

  /* DNA sarmalı: faz ilerledikçe dönüyormuş gibi görünür */
  let dnaA, dnaB, dnaR;
  function dnaBuild() {
    const el = $('#s7dna');
    let r = '';
    for (let i = 0; i < 22; i++) r += '<line class="d rung" style="stroke-width:4"/>';
    el.innerHTML = `${r}<path class="d" id="dnaA" stroke="${TEAL}"/><path class="d" id="dnaB" stroke="${GOLD}"/>`;
    dnaA = $('#dnaA'); dnaB = $('#dnaB'); dnaR = $$('.rung', el);
    dnaR.forEach((l) => l.setAttribute('stroke', CREAM));
  }
  function dnaUpdate(ph) {
    const k = (2 * Math.PI) / 440, A = 104, cx = 150;
    let a = '', b = '';
    for (let y = 0; y <= 1180; y += 10) {
      const s = Math.sin(k * y + ph);
      a += (y ? 'L' : 'M') + (cx + A * s).toFixed(1) + ' ' + y;
      b += (y ? 'L' : 'M') + (cx - A * s).toFixed(1) + ' ' + y;
    }
    dnaA.setAttribute('d', a); dnaB.setAttribute('d', b);
    dnaR.forEach((l, i) => {
      const y = 30 + i * 53, s = Math.sin(k * y + ph);
      l.setAttribute('x1', (cx + A * s * 0.9).toFixed(1)); l.setAttribute('x2', (cx - A * s * 0.9).toFixed(1));
      l.setAttribute('y1', y); l.setAttribute('y2', y);
      l.style.strokeOpacity = (0.25 + 0.6 * Math.abs(s)).toFixed(2);
    });
  }

  function grain() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d'), im = x.createImageData(256, 256);
    let s = 1234567;
    for (let i = 0; i < im.data.length; i += 4) {
      s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
      const v = s & 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255;
    }
    x.putImageData(im, 0, 0);
    $('#grain').style.backgroundImage = `url(${c.toDataURL()})`;
  }

  function buildArt() {
    $('#s1sky').innerHTML = skyline('c-red');
    $('#s4sky').innerHTML = skyline('c-gold');
    $('#s9sky').innerHTML = skyline('c-red');
    $('#s2train').innerHTML = trainSVG();
    $('#s3ppl').style.cssText += ';display:flex;flex-wrap:wrap;gap:18px 16px';
    $('#s3ppl').innerHTML = Array.from({ length: 26 }, personSVG).join('');
    $('#s5gear').innerHTML = gearsSVG();
    $('#s6doner').innerHTML = donerSVG();
    $('#c2ball').innerHTML = ballSVG();
    $$('.star5').forEach((p) => p.setAttribute('d', star(+p.dataset.cx, +p.dataset.cy, +p.dataset.r, +(p.dataset.rot || -90))));
    dnaBuild(); dnaUpdate(0);
    $$('.d').forEach((e) => e.setAttribute('pathLength', '1'));
    grain();
  }

  function fitText() {
    $$('.fit').forEach((el) => {
      el.style.fontSize = '100px';
      const w = el.offsetWidth;
      el.style.fontSize = ((100 * +el.dataset.w) / w).toFixed(2) + 'px';
    });
  }
  function chars(el) {
    const t = el.textContent; el.textContent = '';
    return [...t].map((ch) => {
      const s = document.createElement('span');
      s.style.display = 'inline-block'; s.textContent = ch === ' ' ? ' ' : ch;
      el.appendChild(s); return s;
    });
  }

  /* ───────────── zaman çizelgesi ───────────── */
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
  const fmtInt = (v) => Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const fmtDec = (v) => v.toFixed(1).replace('.', ',');

  const vis = (sel, a, b) => { if (a != null) tl.set(sel, { visibility: 'visible' }, a); if (b != null) tl.set(sel, { visibility: 'hidden' }, b); };
  const draw = (sel, t, dur = 0.8, stg = 0, ease = 'power2.inOut') => {
    tl.to(sel, { opacity: 1, duration: 0.001, stagger: stg }, t);
    tl.to(sel, { strokeDashoffset: 0, duration: dur, stagger: stg, ease }, t);
  };
  const rise = (sel, t, dur = 0.6, stg = 0.09) => tl.fromTo($$(sel).flatMap((e) => $$('.ln>span', e)), { yPercent: 118 }, { yPercent: 0, duration: dur, stagger: stg, ease: 'expo.out' }, t);
  const slam = (sel, t, { from = 2.3, dur = 0.36, stg = 0 } = {}) => tl.fromTo(sel, { scale: from, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: dur, stagger: stg, ease: 'expo.out' }, t);
  const pop = (sel, t, stg = 0, dur = 0.42) => tl.fromTo(sel, { scale: 0, autoAlpha: 0, transformOrigin: '50% 50%' }, { scale: 1, autoAlpha: 1, duration: dur, stagger: stg, ease: 'back.out(2.4)' }, t);
  const fadeUp = (sel, t, dur = 0.5, stg = 0) => tl.fromTo(sel, { y: 36, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: dur, stagger: stg }, t);
  const tagIn = (sel, t) => {
    tl.fromTo(sel + ' i', { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: 'expo.out' }, t);
    tl.fromTo(sel + ' span', { autoAlpha: 0, x: -24 }, { autoAlpha: 1, x: 0, duration: 0.45 }, t + 0.08);
  };
  const count = (el, t, dur, to, fmt, ease = 'power2.out') => {
    const o = { v: 0 }; el = $(el);
    tl.to(o, { v: to, duration: dur, ease, onUpdate: () => { el.textContent = fmt(o.v); } }, t);
  };
  const shake = (t, a = 16) => tl.to('#shk', { keyframes: [{ x: a, y: -a * 0.6 }, { x: -a * 0.8, y: a * 0.5 }, { x: a * 0.5, y: a * 0.3 }, { x: -a * 0.3, y: -a * 0.2 }, { x: 0, y: 0 }], duration: 0.3, ease: 'none' }, t);
  const flash = (t, color, o = 0.55, dur = 0.3) => tl.fromTo('#flash', { opacity: o, backgroundColor: color }, { opacity: 0, duration: dur, ease: 'power2.out', immediateRender: false }, t);
  const punch = (sel, t, s = 1.07) => tl.fromTo(sel, { scale: s }, { scale: 1, duration: 0.4, ease: 'power2.out', immediateRender: false }, t);
  const cam = (sel, a, b, s = 1.06) => tl.fromTo(sel + ' .cam', { scale: 1 }, { scale: s, duration: b - a, ease: 'none' }, a);
  const hud = (t, color, chap, mono = false) => { tl.set('#hud', { color, className: mono ? 'mono' : '' }, t); if (chap) tl.set('#chap', { textContent: chap }, t); };

  /* geçişler – T, kesmenin denk geldiği ölçü başıdır */
  const bars = (T, cols) => ['#bar1', '#bar2', '#bar3'].forEach((id, i) => {
    tl.set(id, { visibility: 'visible', backgroundColor: cols[i], rotation: 14, x: -2500 }, T - 0.36);
    tl.to(id, { x: 0, duration: 0.28, ease: 'power3.in' }, T - 0.32 + i * 0.05);
    tl.to(id, { x: 2500, duration: 0.34, ease: 'power3.out' }, T + 0.08 + i * 0.06);
    tl.set(id, { visibility: 'hidden' }, T + 0.6);
  });
  const iris = (T, x, y, color, s = 21) => {
    tl.set('#iris', { visibility: 'visible', left: x, top: y, backgroundColor: color, scale: 0 }, T - 0.4);
    tl.to('#iris', { scale: s, duration: 0.38, ease: 'power3.in' }, T - 0.38);
    tl.set('#iris', { visibility: 'hidden' }, T);
  };
  const shutter = (T) => {
    tl.set('#fx .bl', { visibility: 'visible', scaleY: 0 }, T - 0.42);
    tl.to('#fx .bl', { scaleY: 1.01, duration: 0.22, stagger: 0.04, ease: 'power3.in' }, T - 0.38);
    tl.set('#fx .bl', { visibility: 'hidden' }, T);
  };
  const doors = (T) => {
    tl.set('.door', { visibility: 'visible' }, T - 0.34);
    tl.fromTo('#doorT', { yPercent: -101 }, { yPercent: 0, duration: 0.3, ease: 'power4.in', immediateRender: false }, T - 0.3);
    tl.fromTo('#doorB', { yPercent: 101 }, { yPercent: 0, duration: 0.3, ease: 'power4.in', immediateRender: false }, T - 0.3);
    tl.set('.door', { visibility: 'hidden' }, T);
  };

  function build() {
    tl.fromTo('#barf', { scaleX: 0 }, { scaleX: 1, duration: DUR, ease: 'none' }, 0);

    /* 1 · KANCA  0–4 */
    cam('#s1', 0, 4.2, 1.07);
    draw('#s1sky .d', 0.05, 1.5, 0.035);
    slam('#s1a', 0.5); slam('#s1b', 1.0); slam('#s1c', 1.5);
    slam('#s1d', 2.0, { from: 3.4, dur: 0.45 }); shake(2.0, 24); flash(2.0, RED, 0.4);
    tl.to('#s1d', { rotation: -2.5, duration: 0.1, yoyo: true, repeat: 5, ease: 'sine.inOut' }, 2.5);
    punch('#s1d', 3.0, 1.06); punch('#s1d', 3.5, 1.09);
    // ↑ yukarı kaydırma
    tl.to('#s1', { yPercent: -100, duration: 0.44, ease: 'expo.inOut' }, 3.78);
    tl.fromTo('#s2', { yPercent: 100 }, { yPercent: 0, duration: 0.44, ease: 'expo.inOut' }, 3.78);
    vis('#s1', null, 4.24); vis('#s2', 3.78, 10.0);

    /* 2 · 1961  4–10 */
    hud(4.0, INK, '02 — 1961');
    cam('#s2', 3.8, 10, 1.05); shake(4.0, 14);
    tagIn('#s2tag', 4.05); rise('#s2a', 4.1);
    slam(chars($('#s2b .fit')), 4.2, { from: 2.6, stg: 0.1, dur: 0.4 });
    tl.fromTo('#s2track', { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'expo.out' }, 4.2);
    tl.fromTo('#s2ties', { autoAlpha: 0 }, { autoAlpha: 0.35, duration: 0.5 }, 4.5);
    tl.fromTo('#s2train', { x: 1130 }, { x: -800, duration: 5.3, ease: 'power1.inOut' }, 4.4);
    tl.to('#s2train .wh', { rotation: -360 * 5, duration: 5.3, ease: 'power1.inOut', transformOrigin: '50% 50%' }, 4.4);
    pop('#s2route .pop:nth-of-type(1)', 5.0); fadeUp('.s2lab:nth-of-type(1)', 5.0, 0.4);
    draw('#s2arc', 5.05, 1.25);
    pop('#s2route .pop:nth-of-type(2)', 6.3); draw('#s2route .ring', 6.3, 0.5);
    fadeUp('.s2lab.c-red', 6.3, 0.4);
    rise('#s2c .ln:nth-child(1)', 6.0); draw('#s2case .d', 6.0, 0.8, 0.12);
    rise('#s2c .ln:nth-child(2)', 7.0);
    tl.fromTo('#s2d', { autoAlpha: 0, x: -40 }, { autoAlpha: 1, x: 0, duration: 0.4 }, 8.0);
    tl.fromTo('#s2d .hl b', { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: 'expo.out' }, 8.0);
    shake(8.0, 8);
    iris(10.0, 540, 960, RED); vis('#s3', 10.0, 18.08);

    /* 3 · ALMANYA  10–18 */
    hud(10.0, CREAM, '03 — ALMANYA', true);
    const w = $$('.s3w');
    const word = (i, t, bg, fg, end) => {
      tl.set('#s3', { backgroundColor: bg }, t); tl.set(w[i], { color: fg }, t);
      slam(w[i], t, { from: 2.8, dur: 0.32 }); shake(t, 18);
      tl.to(w[i], { scale: 1.06, duration: end - t - 0.32, ease: 'none' }, t + 0.32);
      tl.set(w[i], { autoAlpha: 0 }, end);
    };
    word(0, 10.0, RED, CREAM, 11.0); word(1, 11.0, INK, GOLD, 12.0);
    hud(11.0, CREAM);
    word(2, 12.0, CREAM, RED, 13.0); hud(12.0, INK);
    tl.set('#s3', { backgroundColor: RED }, 13.0); hud(13.0, CREAM, null, true);
    flash(13.0, CREAM, 0.7, 0.3);
    cam('#s3', 13, 18, 1.05);
    tagIn('#s3tag', 13.05);
    slam('#s3num', 13.0, { from: 1.5 }); count('#s3cnt', 13.05, 1.9, 2.6, fmtDec, 'power1.out');
    pop('#s3ppl .pp', 13.15, 0.068, 0.3);
    slam('#s3mil', 15.0, { from: 2.8 }); shake(15.0, 24); punch('#s3num', 15.0, 1.08); flash(15.0, CREAM, 0.35);
    fadeUp('#s3leg', 15.2, 0.4);
    tl.fromTo('#s3badge', { scale: 0, autoAlpha: 0, rotation: -50 }, { scale: 1, autoAlpha: 1, rotation: -10, duration: 0.5, ease: 'back.out(2.2)' }, 15.25);
    rise('#s3cap', 15.5);
    tl.fromTo('#s3chip', { scale: 0.5, autoAlpha: 0, transformOrigin: '0% 50%' }, { scale: 1, autoAlpha: 1, duration: 0.45, ease: 'back.out(2)' }, 16.5);
    fadeUp('#s3 .src', 16.8, 0.4);
    // içinden geçiş
    tl.to('#s3', { scale: 5, autoAlpha: 0, duration: 0.34, ease: 'power3.in' }, 17.7);
    vis('#s4', 17.96, 24.0);
    tl.fromTo('#s4', { scale: 0.5 }, { scale: 1, duration: 0.5, ease: 'expo.out' }, 17.96);
    flash(18.0, CREAM, 0.5, 0.3);

    /* 4 · BERLİN  18–24 */
    hud(18.0, CREAM, '04 — BERLİN');
    cam('#s4', 18, 24, 1.03); shake(18.0, 18);
    tl.fromTo('#s4marq', { x: 60 }, { x: -1100, duration: 6.3, ease: 'none' }, 17.9);
    draw('#s4sky .d', 18.05, 1.3, 0.03);
    tagIn('#s4tag', 18.4);
    slam('#s4num', 19.0, { from: 1.5 }); count('#s4cnt', 19.0, 1.5, 200000, fmtInt, 'power1.out');
    punch('#s4num', 20.5, 1.08); shake(20.5, 12);
    rise('#s4cap', 20.5); fadeUp('#s4 .src', 20.8, 0.4);
    $$('.s4chip').forEach((c, i) => {
      pop(c, 21.0 + i * 0.5);
      tl.to(c, { backgroundColor: i === 1 ? TEAL : i === 2 ? GOLD : RED, color: i === 0 ? CREAM : INK, borderColor: 'transparent', duration: 0.2 }, 21.2 + i * 0.5);
    });
    rise('#s4line', 22.5, 0.6, 0.12);
    bars(24.0, [RED, CREAM, GOLD]); vis('#s5', 24.0, 34.0);

    /* 5 · EKONOMİ  24–34 */
    hud(24.0, INK, '05 — EKONOMİ');
    shake(24.0, 14);
    slam(chars($('#s5title .fit')), 24.06, { from: 2.4, stg: 0.045, dur: 0.4 });
    tagIn('#s5tag', 24.4); draw('#s5ul', 24.6, 0.55);
    punch('#s5title', 25.0, 1.05); punch('#s5title', 25.5, 1.05);
    const panel = (id, t, from, end) => {
      vis(id, t - 0.26, end);
      tl.fromTo(id, from, { xPercent: 0, yPercent: 0, duration: 0.3, ease: 'expo.out' }, t - 0.24);
      shake(t, 10);
    };
    const facts = (id, t, numSel, to) => {
      slam(`${id} .num`, t + 0.05, { from: 1.5 }); count(numSel, t + 0.05, 1.1, to, fmtInt, 'power1.out');
      punch(`${id} .num`, t + 1.15, 1.07);
      slam(`${id} .lab`, t + 1.15, { from: 2.2, dur: 0.3 });
      rise(`${id} .sub`, t + 1.25, 0.5, 0.08);
    };
    // A – girişimci
    tl.to('#s5t', { xPercent: -120, duration: 0.3, ease: 'power3.in' }, 25.72);
    panel('#s5A', 26.0, { xPercent: 100 }, 28.3);
    hud(26.0, INK);
    draw('#s5shop .d', 26.0, 0.7, 0.07); facts('#s5A', 26.0, '#s5a', 80000);
    // B – istihdam
    panel('#s5B', 28.0, { xPercent: 100 }, 30.3);
    hud(27.95, GOLD);
    draw('#s5gear .d', 28.0, 0.8, 0.08); facts('#s5B', 28.0, '#s5b', 500000);
    tl.to('#s5gear .g1', { rotation: 150, svgOrigin: '118 178', duration: 2.7, ease: 'none' }, 27.7);
    tl.to('#s5gear .g2', { rotation: -250, svgOrigin: '229 100', duration: 2.7, ease: 'none' }, 27.7);
    // C – ciro
    panel('#s5C', 30.0, { yPercent: 100 }, 34.0);
    hud(29.95, INK);
    cam('#s5', 30, 34, 1.04);
    draw('#s5chart .d:nth-child(1)', 30.0, 0.5); draw('#s5chart .ax', 30.1, 0.5);
    draw('#s5line', 30.3, 1.15, 0, 'power2.in'); draw('#s5arrow', 31.42, 0.14, 0, 'none');
    slam('#s5C .num', 30.05, { from: 1.5 }); count('#s5c', 30.3, 1.2, 50, fmtInt, 'power2.in');
    slam('#s5eur', 31.5, { from: 2.6 }); punch('#s5C .num', 31.5, 1.1); shake(31.5, 22); flash(31.5, CREAM, 0.5);
    slam('#s5C .lab', 32.0, { from: 2.2, dur: 0.3 }); shake(32.0, 8);
    rise('#s5C .sub', 32.5, 0.5); fadeUp('#s5C .src', 32.8, 0.4);
    iris(34.0, 944, 358, TEAL, 32); vis('#s6', 34.0, 40.0);

    /* 6 · DÖNER  34–40 */
    hud(34.0, CREAM, '06 — LEZZET');
    cam('#s6', 34, 40, 1.05); shake(34.0, 16);
    slam(chars($('#s6word .fit')), 34.02, { from: 2.2, stg: 0.05, dur: 0.38 });
    draw('#s6doner .d', 34.05, 0.9, 0.035);
    tl.fromTo('#s6doner .heat', { x: 0 }, { x: -10, duration: 0.25, repeat: 19, yoyo: true, ease: 'sine.inOut', stagger: 0.08 }, 34.8);
    tl.fromTo('#s6doner .knife', { y: -150 }, { y: 70, duration: 0.5, repeat: 9, yoyo: true, ease: 'sine.inOut' }, 34.5);
    tl.fromTo('#s6doner .shav', { y: -30 }, { y: 60, duration: 0.5, repeat: 9, ease: 'power1.in', stagger: 0.12, immediateRender: false }, 35.2);
    slam('#s6a', 35.0, { from: 1.7 }); shake(35.0, 10);
    slam('#s6b', 36.0, { from: 1.7 }); shake(36.0, 10);
    fadeUp('.s6box', 37.0, 0.5, 0.2);
    count('#s6n1', 37.0, 1.0, 2.4, fmtDec); count('#s6n2', 37.2, 1.0, 60000, fmtInt);
    fadeUp('#s6 .src', 37.8, 0.4);
    shutter(40.0); vis('#s7', 40.0, 46.24);

    /* 7 · BİLİM  40–46 */
    hud(40.0, CREAM, '07 — BİLİM');
    cam('#s7', 40, 46.2, 1.05);
    const ph = { v: 0 };
    tl.to(ph, { v: Math.PI * 2.6, duration: 6.4, ease: 'none', onUpdate: () => dnaUpdate(ph.v) }, 39.9);
    draw('#dnaA', 40.0, 1.3); draw('#dnaB', 40.1, 1.3); draw('#s7dna .rung', 40.2, 0.4, 0.045);
    tagIn('#s7tag', 40.4);
    rise('#s7a', 41.0, 0.6, 0.1); pop('#s7amp', 41.4); rise('#s7b', 41.5, 0.6, 0.1);
    rise('#s7c', 42.5); rise('#s7d', 42.9, 0.6, 0.12);
    tl.fromTo('#s7rings .rg', { scale: 0.2, opacity: 0.9, transformOrigin: '50% 50%' }, { scale: 5.2, opacity: 0, duration: 1.5, repeat: 1, stagger: 0.5, ease: 'power1.out', immediateRender: false }, 44.0);
    slam('#s7e', 44.0, { from: 1.7 }); slam('#s7f', 44.5, { from: 1.7 }); shake(44.5, 12);
    // ← sola kaydırma
    tl.to('#s7', { xPercent: -100, duration: 0.44, ease: 'expo.inOut' }, 45.78);
    tl.fromTo('#s8', { xPercent: 100 }, { xPercent: 0, duration: 0.44, ease: 'expo.inOut' }, 45.78);
    vis('#s8', 45.78, 54.0);

    /* 8 · KÜLTÜR  46–54 (4 × 2 sn) */
    const card = (id, t, fg, n) => {
      hud(t, fg, '08 — KÜLTÜR ' + n + '/4', n === 1);
      shake(t, 10);
      tagIn(`${id} .tag`, t - 0.1);
      draw(`${id} .ic .d`, t - 0.1, 0.7, 0.05);
      slam(`${id} .hd`, t + 0.02, { from: 2.0, dur: 0.32 });
      slam(`${id} .hd2`, t + 0.5, { from: 2.0, dur: 0.32 }); shake(t + 0.5, 6);
      rise(`${id} .dt`, t + 0.9, 0.5, 0.08);
      tl.fromTo(`${id} .ic`, { scale: 0.94 }, { scale: 1.05, duration: 2.3, ease: 'none', transformOrigin: '50% 50%' }, t - 0.2);
    };
    card('#c1', 46, CREAM, 1);
    const push = (a, b, T, axis) => {
      tl.to(a, { [axis]: -100, duration: 0.4, ease: 'expo.inOut' }, T - 0.2);
      tl.fromTo(b, { [axis]: 100 }, { [axis]: 0, duration: 0.4, ease: 'expo.inOut' }, T - 0.2);
    };
    push('#c1', '#c2', 48, 'xPercent'); card('#c2', 48, INK, 2);
    tl.to('#c2ball', { rotation: 80, duration: 2.4, ease: 'none', transformOrigin: '50% 50%' }, 47.8);
    push('#c2', '#c3', 50, 'yPercent'); card('#c3', 50, CREAM, 3);
    push('#c3', '#c4', 52, 'xPercent'); card('#c4', 52, INK, 4);
    doors(54.0); vis('#s9', 54.0, null);

    /* 9 · FİNAL  54–60 */
    hud(54.0, CREAM, '09 — BİRLİKTE');
    cam('#s9', 54, 60, 1.06); shake(54.0, 26);
    slam('#s9a', 54.04, { from: 1.6 }); slam('#s9b', 54.5, { from: 1.6 });
    draw('#s9strike', 55.0, 0.28, 0, 'power3.in');
    tl.to('#s9a,#s9b', { opacity: 0.4, duration: 0.2 }, 55.3);
    slam('#s9c', 55.5, { from: 3 }); shake(55.5, 22); flash(55.5, GOLD, 0.4);
    punch('#s9c', 56.0, 1.05); punch('#s9c', 56.5, 1.07);
    tl.to('#s9p1', { scale: 0.86, autoAlpha: 0, duration: 0.24, ease: 'power3.in', transformOrigin: '50% 50%' }, 56.74);
    flash(57.0, CREAM, 0.75, 0.4); shake(57.0, 26);
    draw('#s9moon .d', 57.0, 0.9, 0.3);
    rise('#s9s', 57.1);
    slam('#s9d', 57.0, { from: 2.6 }); slam('#s9e', 57.5, { from: 2.6 }); shake(57.5, 14);
    draw('#s9sky .d', 57.3, 1.3, 0.03);
    tl.to('#hud .chap, #hud .bar, #hud .barf, #hud .wm, #hud .yr', { autoAlpha: 0, duration: 0.3 }, 56.8);
    fadeUp('#s9logo', 58.2, 0.6); tl.fromTo('#s9sub', { autoAlpha: 0 }, { autoAlpha: 0.7, duration: 0.6 }, 58.6);
    punch('#s9logo', 58.2, 1.12);

    tl.set({}, {}, DUR);
  }

  /* ───────────── oynatıcı ───────────── */
  const stage = $('#stage'), box = $('#box'), ui = $('#ui'), ctl = $('#ctl');
  function layout() {
    const fit = $('#fit'), cs = getComputedStyle(fit), px = (k) => parseFloat(cs[k]) || 0;
    const s = Math.min((fit.clientWidth - px('paddingLeft') - px('paddingRight')) / 1080, (fit.clientHeight - px('paddingTop') - px('paddingBottom')) / 1920);
    box.style.width = 1080 * s + 'px'; box.style.height = 1920 * s + 'px';
    stage.style.transform = `scale(${s})`;
  }
  addEventListener('resize', layout); layout();

  let ctx, buf, src, t0 = 0, pos = 0, playing = false, raf = 0;
  const seek = (t) => { tl.time(Math.max(0.0001, Math.min(DUR, t)), false); ctl.firstElementChild.style.width = (t / DUR) * 100 + '%'; };
  function tick() {
    const t = ctx ? ctx.currentTime - t0 : (performance.now() - t0) / 1000;
    if (t >= DUR) { seek(DUR); stop(true); return; }
    seek(t); raf = requestAnimationFrame(tick);
  }
  function start(from = 0) {
    pos = from;
    if (ctx && buf) {
      src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination);
      t0 = ctx.currentTime - from + 0.06; src.start(ctx.currentTime + 0.06, from);
    } else t0 = performance.now() - from * 1000;
    playing = true; ui.classList.add('off'); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
  }
  function stop(ended) {
    if (!playing) return;
    pos = ended ? 0 : (ctx ? ctx.currentTime - t0 : (performance.now() - t0) / 1000);
    playing = false; cancelAnimationFrame(raf);
    try { src && src.stop(); } catch (e) { /* zaten durmuş */ }
    $('#uis').textContent = ended ? 'Tekrar izlemek için dokun' : 'Devam etmek için dokun';
    ui.classList.remove('off');
  }
  async function prepare() {
    if (buf || !window.BKAudio) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      await ctx.resume();
      $('#uis').textContent = 'Ses hazırlanıyor…';
      await new Promise((r) => setTimeout(r, 40));
      const a = BKAudio.render(ctx.sampleRate);
      buf = ctx.createBuffer(2, a.L.length, a.sr);
      buf.copyToChannel(a.L, 0); buf.copyToChannel(a.R, 1);
    } catch (e) { ctx = null; buf = null; }
  }
  ui.addEventListener('click', async () => { await prepare(); start(pos); });
  stage.addEventListener('click', () => { if (playing) stop(false); });
  ctl.addEventListener('click', (e) => {
    const r = ctl.getBoundingClientRect(), t = ((e.clientX - r.left) / r.width) * DUR;
    if (playing) { try { src && src.stop(); } catch (er) { /* */ } start(t); } else { pos = t; seek(t); }
  });
  addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); playing ? stop(false) : ui.click(); } });

  async function init() {
    try {
      await Promise.all([
        document.fonts.load('900 100px "Archivo Variable"', 'İŞĞÜÖÇ'),
        document.fonts.load('italic 500 100px "Playfair Display Variable"', 'ışğ'),
      ]);
      await document.fonts.ready;
    } catch (e) { /* sistem yazı tipiyle devam */ }
    buildArt(); fitText(); build(); seek(RENDER ? 0 : 2.45); // oynatıcıda kapak karesi: "KİM?"
    window.BK = { tl, DUR, seek, ready: true };
  }
  init();
})();
