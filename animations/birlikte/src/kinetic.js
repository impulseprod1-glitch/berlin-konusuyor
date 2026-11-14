/* "Birlikte Büyüttük" – kinetik kurgu (2. stil). 60 sn, 1080×1920, 120 BPM.
   Bütün sahneler tek bir büyük düzlemde ("dünya") durur; sanal kamera aralarında uçar,
   döner, yakınlaşır. Metin harf harf yazılır ve kamera imleci izler; vurgu anlarında
   harf blokları yerine oturur, tuğla kuleler yükselir.
   Zamanlar film.js / audio.js / narration.json ile aynıdır. */
(() => {
  const DUR = 60;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RENDER = new URLSearchParams(location.search).has('render');
  if (RENDER) document.body.classList.add('render');
  gsap.config({ force3D: false, nullTargetWarn: false });
  gsap.ticker.lagSmoothing(0);
  const A = window.BKArt, P = A.P;
  const INK = '#0c0d12', CREAM = '#f4eee3', RED = '#e50914', GOLD = '#f7c443', TEAL = '#0fb5a5';
  let seed = 4711;
  const rnd = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; };
  const cues = { thud: [], tick: [] }; // ses için: blok/tuğla inişleri ve harf tıkırtıları

  /* ───────────── dünya ve kamera ───────────── */
  const world = $('#world');
  const cam = { x: 0, y: 0, rot: 0, s: 1, rx: 0, ry: 0 };
  const S = {};
  function station(id, cx, cy, r) {
    const el = $('#' + id);
    el.style.left = cx - 540 + 'px'; el.style.top = cy - 960 + 'px'; el.style.transform = `rotate(${r}deg)`;
    S[id] = { el, cx, cy, r };
  }
  // istasyonun yerel koordinatı → dünya koordinatı
  const W = (id, lx, ly) => {
    const st = S[id], a = (st.r * Math.PI) / 180, dx = lx - 540, dy = ly - 960;
    return { x: st.cx + dx * Math.cos(a) - dy * Math.sin(a), y: st.cy + dx * Math.sin(a) + dy * Math.cos(a) };
  };
  function applyCam() {
    const tilt = cam.rx || cam.ry ? `rotateX(${cam.rx.toFixed(3)}deg) rotateY(${cam.ry.toFixed(3)}deg) ` : '';
    world.style.transform = `translate(540px,960px) ${tilt}scale(${cam.s.toFixed(5)}) rotate(${(-cam.rot).toFixed(4)}deg) translate(${(-cam.x).toFixed(2)}px,${(-cam.y).toFixed(2)}px)`;
  }

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' }, onUpdate: applyCam });
  // kamera hareketi: yerel (lx,ly) noktasına bak
  function look(t, dur, id, lx, ly, s, o = {}) {
    const p = W(id, lx, ly), v = { x: p.x, y: p.y, s, duration: dur, ease: o.ease || 'power2.inOut' };
    if (!o.keepRot) v.rot = S[id].r + (o.rot || 0);
    if (o.rx != null) v.rx = o.rx; if (o.ry != null) v.ry = o.ry;
    tl.to(cam, v, t);
  }
  // sahneler arası uçuş: T anında yeni sahneye varır; yolda uzaklaşıp döner
  function fly(T, id, lx, ly, s, o = {}) {
    const p = W(id, lx, ly), d = o.dur || 0.78, a = T - d * 0.54;
    tl.to(cam, { x: p.x, y: p.y, rot: S[id].r + (o.rot || 0), rx: o.rx || 0, ry: o.ry || 0, duration: d, ease: 'power3.inOut' }, a);
    tl.to(cam, { s: o.mid || 0.4, duration: d * 0.46, ease: 'power2.in' }, a);
    tl.to(cam, { s, duration: d * 0.54, ease: 'power3.out' }, a + d * 0.46);
  }

  /* ───────────── yardımcılar ───────────── */
  const fmtInt = (v) => Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const fmtDec = (v) => v.toFixed(1).replace('.', ',');
  const draw = (sel, t, dur = 0.8, stg = 0, ease = 'power2.inOut') => {
    tl.to(sel, { opacity: 1, duration: 0.001, stagger: stg }, t);
    tl.to(sel, { strokeDashoffset: 0, duration: dur, stagger: stg, ease }, t);
  };
  const rise = (sel, t, dur = 0.6, stg = 0.09) => tl.fromTo($$(sel).flatMap((e) => $$('.ln>span', e)), { yPercent: 118 }, { yPercent: 0, duration: dur, stagger: stg, ease: 'expo.out' }, t);
  const slam = (sel, t, { from = 2.3, dur = 0.36 } = {}) => tl.fromTo(sel, { scale: from, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: dur, ease: 'expo.out' }, t);
  const pop = (sel, t, stg = 0, dur = 0.42) => tl.fromTo(sel, { scale: 0, autoAlpha: 0, transformOrigin: '50% 50%' }, { scale: 1, autoAlpha: 1, duration: dur, stagger: stg, ease: 'back.out(2.4)' }, t);
  const fadeUp = (sel, t, dur = 0.5, stg = 0) => tl.fromTo(sel, { y: 36, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: dur, stagger: stg }, t);
  const tagIn = (sel, t) => {
    tl.fromTo(sel + ' i', { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: 'expo.out' }, t);
    tl.fromTo(sel + ' span', { autoAlpha: 0, x: -24 }, { autoAlpha: 1, x: 0, duration: 0.45 }, t + 0.08);
  };
  const count = (el, t, dur, to, fmt, ease = 'power1.out') => { const o = { v: 0 }; el = $(el); tl.to(o, { v: to, duration: dur, ease, onUpdate: () => { el.textContent = fmt(o.v); } }, t); };
  const shake = (t, a = 16) => tl.to('#shk', { keyframes: [{ x: a, y: -a * 0.6 }, { x: -a * 0.8, y: a * 0.5 }, { x: a * 0.5, y: a * 0.3 }, { x: -a * 0.3, y: -a * 0.2 }, { x: 0, y: 0 }], duration: 0.3, ease: 'none' }, t);
  const flash = (t, color, o = 0.5, dur = 0.3) => tl.fromTo('#flash', { opacity: o, backgroundColor: color }, { opacity: 0, duration: dur, ease: 'power2.out', immediateRender: false }, t);
  const punch = (sel, t, s = 1.07) => tl.fromTo(sel, { scale: s }, { scale: 1, duration: 0.4, ease: 'power2.out', immediateRender: false }, t);
  const hud = (t, color, chap, mono = false) => { tl.set('#hud', { color, className: mono ? 'mono' : '' }, t); if (chap) tl.set('#chap', { textContent: chap }, t); };

  function fitText() {
    $$('.fit').forEach((el) => { el.style.fontSize = '100px'; const w = el.offsetWidth; el.style.fontSize = ((100 * +el.dataset.w) / w).toFixed(2) + 'px'; });
  }
  function chars(el) {
    const t = el.textContent; el.textContent = '';
    return [...t].map((ch) => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch === ' ' ? ' ' : ch; el.appendChild(s); return s; });
  }
  // öğenin istasyon kutusundaki merkez konumu (dönüşümlerden etkilenmez)
  function lp(el, id) {
    let x = 0, y = 0, e = el; const box = S[id].el;
    while (e && e !== box) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    return { x: x + el.offsetWidth / 2, y: y + el.offsetHeight / 2 };
  }

  /* harf harf yazım; follow verilirse kamera imleci izler */
  function type(sel, t, per = 0.06, o = {}) {
    const cs = chars($(sel)).filter((c) => c.textContent.trim());
    tl.fromTo(cs, { autoAlpha: 0, y: o.y ?? -70, rotation: o.rot ?? -14, scale: o.sc ?? 1.7 }, { autoAlpha: 1, y: 0, rotation: 0, scale: 1, duration: o.dur || 0.24, stagger: per, ease: 'back.out(2.2)' }, t);
    cs.forEach((c, i) => cues.tick.push(t + i * per));
    if (o.follow) {
      const kf = cs.map((c) => { const p = lp(c, o.follow), w = W(o.follow, p.x + (o.lead || 0), p.y + (o.dy || 0)); return { x: w.x, y: w.y, duration: per }; });
      tl.to(cam, { keyframes: kf, easeEach: 'none', ease: 'none' }, t);
    }
    return t + cs.length * per;
  }

  /* harf blokları: her blok kameraya doğru yukarıdan düşer ve t anında yerine oturur */
  function buildBlocks(el) {
    const size = parseFloat(getComputedStyle(el).fontSize), n = Math.max(4, Math.round(size * 0.075));
    const sh = Array.from({ length: n }, (_, i) => `${i + 1}px ${i + 1}px 0 var(--sc)`).join(',');
    for (const ch of el.dataset.text) {
      const b = document.createElement('span');
      if (ch === ' ') b.className = 'blk sp'; else { b.className = 'blk'; b.innerHTML = `<b>${ch}</b>`; b.style.boxShadow = sh; }
      el.appendChild(b);
    }
  }
  function blockWord(sel, t, per = 0.06, o = {}) {
    const el = typeof sel === 'string' ? $(sel) : sel, fall = o.fall || 0.3;
    const bs = $$('.blk:not(.sp)', el);
    bs.forEach((b, i) => {
      const land = t + i * per;
      tl.fromTo(b, { z: o.z || 950, rotationX: (rnd() - 0.5) * 80, rotationY: (rnd() - 0.5) * 60, rotation: (rnd() - 0.5) * 36, autoAlpha: 0 },
        { z: 0, rotationX: 0, rotationY: 0, rotation: 0, autoAlpha: 1, duration: fall, ease: 'power2.in' }, land - fall);
      tl.fromTo(b, { scaleX: 1.16, scaleY: 0.84 }, { scaleX: 1, scaleY: 1, duration: 0.34, ease: 'elastic.out(1,0.5)', immediateRender: false }, land);
      tl.fromTo(b, { filter: 'brightness(2.1)' }, { filter: 'brightness(1)', duration: 0.3, immediateRender: false }, land);
      cues.thud.push([land, o.g || 0.6]);
    });
    return t + bs.length * per;
  }

  /* tuğla kule / duvar */
  function buildTower(el) {
    const rows = +el.dataset.rows, w = el.offsetWidth;
    for (let r = 0; r < rows; r++) {
      let x = 0;
      for (const f of r % 2 ? [0.36, 0.64] : [0.64, 0.36]) {
        const b = document.createElement('div'); b.className = 'brick';
        b.style.cssText = `left:${x}px;top:${-(r + 1) * 58}px;width:${f * w - 4}px`;
        el.appendChild(b); x += f * w;
      }
    }
  }
  function buildWall(el) {
    const rows = +el.dataset.rows, cols = +el.dataset.cols, bw = el.offsetWidth / cols;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols + (r % 2); c++) {
      const b = document.createElement('div'); b.className = 'brick';
      b.style.cssText = `left:${c * bw - (r % 2 ? bw / 2 : 0)}px;top:${r * 58}px;width:${bw - 4}px`;
      el.appendChild(b);
    }
  }
  function bricks(sel, t0, t1, o = {}) {
    const bs = $$(sel + ' .brick'), per = (t1 - t0) / bs.length;
    bs.forEach((b, i) => {
      const land = t0 + i * per;
      tl.fromTo(b, { y: o.from || -380, rotation: (rnd() - 0.5) * 26, autoAlpha: 0 }, { y: 0, rotation: 0, autoAlpha: 1, duration: 0.2, ease: 'power2.in' }, land - 0.2);
      if (i % (o.every || 1) === 0) cues.thud.push([land, o.g || 0.32]);
    });
  }

  /* DNA sarmalı */
  let dnaA, dnaB, dnaR; const DNA_H = 2500;
  function dnaBuild() {
    const el = $('#k7dna'); let r = '';
    for (let i = 0; i < 46; i++) r += '<line class="d rung" style="stroke-width:4"/>';
    el.innerHTML = `${r}<path class="d" id="dnaA" stroke="${TEAL}"/><path class="d" id="dnaB" stroke="${GOLD}"/>`;
    dnaA = $('#dnaA'); dnaB = $('#dnaB'); dnaR = $$('.rung', el); dnaR.forEach((l) => l.setAttribute('stroke', CREAM));
  }
  function dnaUpdate(ph) {
    const k = (2 * Math.PI) / 440, Am = 104, cx = 150; let a = '', b = '';
    for (let y = 0; y <= DNA_H; y += 10) { const s = Math.sin(k * y + ph); a += (y ? 'L' : 'M') + (cx + Am * s).toFixed(1) + ' ' + y; b += (y ? 'L' : 'M') + (cx - Am * s).toFixed(1) + ' ' + y; }
    dnaA.setAttribute('d', a); dnaB.setAttribute('d', b);
    dnaR.forEach((l, i) => {
      const y = 30 + i * 53, s = Math.sin(k * y + ph);
      l.setAttribute('x1', (cx + Am * s * 0.9).toFixed(1)); l.setAttribute('x2', (cx - Am * s * 0.9).toFixed(1)); l.setAttribute('y1', y); l.setAttribute('y2', y);
      l.style.strokeOpacity = (0.25 + 0.6 * Math.abs(s)).toFixed(2);
    });
  }

  function grain() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d'), im = x.createImageData(256, 256); let s = 1234567;
    for (let i = 0; i < im.data.length; i += 4) { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; const v = s & 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    x.putImageData(im, 0, 0); $('#grain').style.backgroundImage = `url(${c.toDataURL()})`;
  }

  function buildArt() {
    // istasyonların dünyadaki yeri ve açısı – her geçişte kamera döner
    station('k1', 0, 0, 0); station('k2', 9500, 0, -90); station('k3', 9500, 9500, 0);
    station('k4', 18500, 9500, 90); station('k5', 18500, 1000, 90); station('k6', 27500, 0, 180);
    station('k7', 27500, 9500, 270);
    station('k8a', 37000, 3000, 270); station('k8b', 41400, 3000, 360); station('k8c', 41400, 7600, 450); station('k8d', 37000, 7600, 540);
    station('k9', 50500, 5000, 720);
    $('#k1sky').innerHTML = A.skyline('c-red'); $('#k4sky').innerHTML = A.skyline('c-gold'); $('#k9sky').innerHTML = A.skyline('c-red');
    $('#k2train').innerHTML = A.trainSVG();
    $('#k3ppl').style.cssText += ';display:flex;flex-wrap:wrap;gap:18px 16px';
    $('#k3ppl').innerHTML = Array.from({ length: 26 }, A.personSVG).join('');
    $('#k6doner').innerHTML = A.donerSVG(); $('#k8ball').innerHTML = A.ballSVG();
    $$('.star5').forEach((p) => p.setAttribute('d', A.star(+p.dataset.cx, +p.dataset.cy, +p.dataset.r, +(p.dataset.rot || -90))));
    dnaBuild(); dnaUpdate(0);
    $$('.bw').forEach(buildBlocks); $$('.tower').forEach(buildTower); $$('.wall').forEach(buildWall);
    $$('.d').forEach((e) => e.setAttribute('pathLength', '1'));
    grain();
  }

  /* ───────────── kurgu ───────────── */
  function build() {
    tl.fromTo('#barf', { scaleX: 0 }, { scaleX: 1, duration: DUR, ease: 'none' }, 0);

    /* 1 · SORU 0–4: kamera yazılan cümleyi yakından izler, sonra geri çekilip şehri gösterir */
    { const p = W('k1', 60, 760); Object.assign(cam, { x: p.x, y: p.y, s: 0.86, rot: -5, ry: -20, rx: 6 }); }
    tl.to(cam, { rot: 4, duration: 1.5, ease: 'none' }, 0.3);
    const e1 = type('#k1line .fit', 0.3, 0.07, { follow: 'k1', lead: -230, dy: 70 });
    look(e1 - 0.02, 0.42, 'k1', 2790, 1070, 0.74, { rx: 0, ry: 0 });
    blockWord('#k1kim', 1.92, 0.09, { g: 0.9 }); shake(1.92, 14); shake(2.19, 20); flash(2.19, RED, 0.35);
    look(2.5, 0.7, 'k1', 1760, 1420, 0.3);
    draw('#k1sky .d', 2.35, 0.7, 0.012);
    look(3.2, 0.36, 'k1', 1760, 1420, 0.32, { ease: 'none', ry: 6 });
    fly(4.0, 'k2', 540, 780, 0.98);

    /* 2 · 1961 4–10: tarih blokları, ardından trenle İstanbul'dan Münih'e kaydırmalı çekim */
    hud(4.0, INK, '02 — 1961'); shake(4.0, 10);
    tagIn('#k2tag', 4.05); type('#k2a .fit', 4.1, 0.05);
    blockWord('#k2yr', 4.75, 0.11, { g: 0.8 }); shake(4.75, 10);
    look(5.3, 0.48, 'k2', 2560, 1240, 0.9, { rot: 3 });
    pop('#k2ist', 5.4); fadeUp('#k2istl', 5.4, 0.3);
    tl.fromTo('#k2train', { x: 2180 }, { x: -1480, duration: 1.85, ease: 'power2.inOut' }, 5.8);
    tl.to('#k2train .wh', { rotation: -360 * 6, duration: 1.85, ease: 'power2.inOut', transformOrigin: '50% 50%' }, 5.8);
    look(5.8, 1.85, 'k2', -1290, 1090, 0.8, { rot: -3 });
    pop('#k2mun', 7.45); fadeUp('#k2munl', 7.45, 0.3);
    const e2 = type('#k2say', 7.8, 0.058, { y: -90 });
    draw('#k2ul', e2 - 0.1, 0.35); shake(e2, 8);
    tl.fromTo('#k2ded', { autoAlpha: 0, x: -40 }, { autoAlpha: 1, x: 0, duration: 0.4 }, e2 + 0.15);
    look(8.9, 0.66, 'k2', -1290, 1090, 0.86, { ease: 'none', rot: -1 });
    fly(10.0, 'k3', 540, 1585, 1.12, { rx: 18 });

    /* 3 · ALMANYA 10–18: üç sıra blok duvar gibi örülür, kamera yukarı tırmanır */
    hud(10.0, CREAM, '03 — ALMANYA', true);
    blockWord('#k3r1', 10.0, 0.045, { g: 0.8 }); shake(10.0, 16);
    look(10.7, 0.3, 'k3', 540, 1441, 1.12);
    blockWord('#k3r2', 11.0, 0.04, { g: 0.8 }); shake(11.0, 16);
    look(11.7, 0.3, 'k3', 540, 1297, 1.12);
    blockWord('#k3r3', 12.0, 0.045, { g: 0.8 }); shake(12.0, 16);
    look(12.62, 0.68, 'k3', 540, 250, 0.95, { rx: 0 });
    tagIn('#k3tag', 13.05);
    slam('#k3num', 13.0, { from: 1.5 }); count('#k3cnt', 13.05, 1.9, 2.6, fmtDec);
    pop('#k3ppl .pp', 13.15, 0.068, 0.3);
    blockWord('#k3mil', 15.0, 0.05, { g: 0.9 }); shake(15.0, 22); punch('#k3num', 15.0, 1.08); flash(15.0, CREAM, 0.3);
    fadeUp('#k3leg', 15.2, 0.4);
    tl.fromTo('#k3badge', { scale: 0, autoAlpha: 0, rotation: -50 }, { scale: 1, autoAlpha: 1, rotation: -10, duration: 0.5, ease: 'back.out(2.2)' }, 15.25);
    rise('#k3cap', 15.5);
    tl.fromTo('#k3chip', { scale: 0.5, autoAlpha: 0, transformOrigin: '0% 50%' }, { scale: 1, autoAlpha: 1, duration: 0.45, ease: 'back.out(2)' }, 16.4);
    fadeUp('#k3 .src', 16.6, 0.4);
    look(16.7, 0.86, 'k3', 540, 650, 0.6); // geri çekil: sayı, duvarın tepesinde
    fly(18.0, 'k4', 540, 900, 0.96, { ry: -12 });

    /* 4 · BERLİN 18–24 */
    hud(18.0, CREAM, '04 — BERLİN'); shake(18.0, 14);
    tl.fromTo('#k4marq', { x: 60 }, { x: -1100, duration: 6.3, ease: 'none' }, 17.9);
    draw('#k4sky .d', 18.0, 0.8, 0.02);
    tagIn('#k4tag', 18.15);
    slam('#k4num', 18.45, { from: 1.5 }); count('#k4cnt', 18.5, 1.95, 200000, fmtInt);
    tl.to(cam, { s: 1.08, ry: 0, duration: 1.9, ease: 'none' }, 18.5);
    punch('#k4num', 20.5, 1.08); shake(20.5, 12);
    look(20.45, 0.5, 'k4', 540, 1040, 0.98);
    rise('#k4cap', 20.5); fadeUp('#k4 .src', 20.8, 0.4);
    $$('.k4d').forEach((el, i) => { blockWord(el, 21.0 + i * 0.5, 0.028, { g: 0.55, z: 700 }); shake(21.0 + i * 0.5, 6); });
    look(22.4, 1.0, 'k4', 540, 1010, 0.93, { ease: 'none' });
    fly(24.0, 'k5', 540, 760, 1.0);

    /* 5 · EKONOMİ 24–34: üç kule tuğla tuğla yükselir, kamera sonuncusuyla birlikte tırmanır */
    hud(24.0, INK, '05 — EKONOMİ'); shake(24.0, 12);
    type('#k5title .fit', 24.1, 0.07, { sc: 2.2 }); tagIn('#k5tag', 24.5);
    look(25.45, 0.5, 'k5', 300, 1440, 1.4);
    bricks('#k5A', 26.0, 26.5, { g: 0.4 });
    fadeUp('.k5la', 26.05, 0.3); count('#k5a', 26.05, 1.1, 80000, fmtInt); punch('.k5la', 27.15, 1.12);
    look(27.5, 0.45, 'k5', 610, 1330, 1.22);
    bricks('#k5B', 28.0, 28.9, { g: 0.4 });
    fadeUp('.k5lb', 28.05, 0.3); count('#k5b', 28.05, 1.1, 500000, fmtInt); punch('.k5lb', 29.15, 1.12);
    look(29.45, 0.5, 'k5', 760, 1450, 1.05);
    bricks('#k5C', 30.05, 31.42, { g: 0.26, every: 3, from: -520 });
    { const p = W('k5', 540, -330); tl.to(cam, { x: p.x, y: p.y, s: 0.98, duration: 1.42, ease: 'power2.in' }, 30.05); tl.to(cam, { rx: 16, duration: 0.7, ease: 'sine.inOut' }, 30.05); tl.to(cam, { rx: 0, duration: 0.6, ease: 'power2.out' }, 31.0); }
    blockWord('#k5c1', 31.5, 0.035, { g: 0.9 }); blockWord('#k5c2', 31.95, 0.06, { g: 1 });
    shake(31.5, 22); flash(31.5, CREAM, 0.45); shake(31.95, 12);
    fadeUp('#k5c3', 32.3, 0.4);
    look(32.6, 0.9, 'k5', 540, 560, 0.41); fadeUp('#k5 .src', 32.9, 0.3);
    fly(34.0, 'k6', 540, 800, 1.0);

    /* 6 · DÖNER 34–40: kamera şişle birlikte ağır ağır döner */
    hud(34.0, CREAM, '06 — LEZZET'); shake(34.0, 14);
    blockWord('#k6word', 34.0, 0.05, { g: 0.85 });
    draw('#k6doner .d', 34.05, 0.9, 0.035);
    tl.fromTo('#k6doner .heat', { x: 0 }, { x: -10, duration: 0.25, repeat: 19, yoyo: true, ease: 'sine.inOut', stagger: 0.08 }, 34.8);
    tl.fromTo('#k6doner .knife', { y: -150 }, { y: 70, duration: 0.5, repeat: 9, yoyo: true, ease: 'sine.inOut' }, 34.5);
    tl.to(cam, { rot: S.k6.r + 6, duration: 4.9, ease: 'sine.inOut' }, 34.45);
    look(34.55, 0.55, 'k6', 540, 1150, 1.1, { keepRot: true });
    type('#k6a .fit', 35.0, 0.045, { y: -50 }); shake(35.0, 8);
    type('#k6b .fit', 36.0, 0.045, { y: -50 }); shake(36.0, 8);
    look(36.9, 0.6, 'k6', 540, 1400, 1.12, { keepRot: true });
    fadeUp('.k6box', 37.0, 0.5, 0.2); count('#k6n1', 37.0, 1.0, 2.4, fmtDec); count('#k6n2', 37.2, 1.0, 60000, fmtInt);
    fadeUp('#k6 .src', 37.8, 0.4);
    look(38.3, 1.0, 'k6', 540, 960, 0.94, { keepRot: true });
    fly(40.0, 'k7', 600, 720, 1.0);

    /* 7 · BİLİM 40–46: kamera sarmal boyunca aşağı iner */
    hud(40.0, CREAM, '07 — BİLİM');
    const ph = { v: 0 };
    tl.to(ph, { v: Math.PI * 2.6, duration: 6.4, ease: 'none', onUpdate: () => dnaUpdate(ph.v) }, 39.9);
    draw('#dnaA', 40.0, 2.2); draw('#dnaB', 40.1, 2.2); draw('#k7dna .rung', 40.2, 0.4, 0.04);
    tagIn('#k7tag', 40.4);
    type('#k7a1 .fit', 40.5, 0.05); type('#k7a2 .fit', 40.72, 0.05);
    pop('#k7amp', 41.3);
    type('#k7b1 .fit', 41.5, 0.05); type('#k7b2 .fit', 41.76, 0.05);
    look(40.45, 2.9, 'k7', 600, 900, 1.02, { ease: 'none' });
    rise('#k7c', 42.5); rise('#k7d', 42.9, 0.6, 0.12);
    look(43.4, 0.62, 'k7', 620, 2200, 1.12);
    tl.fromTo('#k7rings .rg', { scale: 0.2, opacity: 0.9, transformOrigin: '50% 50%' }, { scale: 5.2, opacity: 0, duration: 1.5, repeat: 1, stagger: 0.5, ease: 'power1.out', immediateRender: false }, 44.1);
    blockWord('#k7e', 44.1, 0.04, { g: 0.7 }); blockWord('#k7f', 44.6, 0.05, { g: 0.9 }); shake(44.6, 12);
    fly(46.0, 'k8a', 540, 930, 1.0, { mid: 0.5 });

    /* 8 · KÜLTÜR 46–54: dört kart, her kesmede kamera 90° döner */
    const card = (id, T, fg, n, per) => {
      hud(T, fg, '08 — KÜLTÜR ' + n + '/4', n === 1); shake(T, 8);
      tagIn(`#${id} .tag`, T - 0.05);
      draw(`#${id} .ic .d`, T - 0.1, 0.7, 0.05);
      type(`#${id} .nm .fit`, T + 0.08, per, { y: -60 });
      blockWord($(`#${id} .aw`), T + 0.9, 0.035, { g: 0.7, z: 800 }); shake(T + 0.9, 8);
      rise(`#${id} .dt`, T + 1.2, 0.45, 0.08);
      tl.to(cam, { s: 1.07, ry: 0, duration: 1.25, ease: 'none' }, T + 0.42);
    };
    card('k8a', 46, CREAM, 1, 0.04);
    fly(48.0, 'k8b', 540, 930, 1.0, { dur: 0.6, mid: 0.6, ry: 12 }); card('k8b', 48, INK, 2, 0.045);
    tl.to('#k8ball', { rotation: 80, duration: 2.4, ease: 'none', transformOrigin: '50% 50%' }, 47.8);
    fly(50.0, 'k8c', 540, 930, 1.0, { dur: 0.6, mid: 0.6, ry: -12 }); card('k8c', 50, CREAM, 3, 0.05);
    fly(52.0, 'k8d', 540, 960, 1.0, { dur: 0.6, mid: 0.6, ry: 12 }); card('k8d', 52, INK, 4, 0.06);
    fly(54.0, 'k9', 540, 920, 1.0);

    /* 9 · FİNAL 54–60 */
    hud(54.0, CREAM, '09 — BİRLİKTE'); shake(54.0, 22);
    type('#k9a .fit', 54.1, 0.045, { y: -50 }); type('#k9b .fit', 54.5, 0.05, { y: -50 });
    draw('#k9strike', 55.0, 0.28, 0, 'power3.in');
    tl.to('#k9a,#k9b', { opacity: 0.4, duration: 0.2 }, 55.3);
    look(55.1, 0.36, 'k9', 540, 1090, 1.0);
    blockWord('#k9c1', 55.5, 0.07, { g: 1 }); blockWord('#k9c2', 55.64, 0.032, { g: 0.8 });
    shake(55.5, 24); flash(55.5, GOLD, 0.4);
    tl.to(cam, { s: 1.08, duration: 0.6, ease: 'none' }, 55.9);
    look(56.52, 0.5, 'k9', 540, 3095, 1.0, { ease: 'power3.inOut' }); // final sayfasına in
    tl.to('#hud .chap, #hud .bar, #hud .barf, #hud .wm, #hud .yr', { autoAlpha: 0, duration: 0.3 }, 56.6);
    draw('#k9moon .d', 56.9, 0.9, 0.3);
    rise('#k9s', 57.1);
    blockWord('#k9d', 57.0, 0.04, { g: 1 }); shake(57.0, 24); flash(57.0, CREAM, 0.6, 0.4);
    blockWord('#k9e', 57.5, 0.04, { g: 0.9 }); shake(57.5, 14);
    bricks('#k9wall', 57.3, 58.3, { g: 0.3, every: 2, from: -300 });
    draw('#k9sky .d', 57.4, 1.2, 0.03);
    fadeUp('#k9logo', 58.3, 0.6); punch('#k9logo', 58.3, 1.12);
    tl.fromTo('#k9sub', { autoAlpha: 0 }, { autoAlpha: 0.7, duration: 0.6 }, 58.7);
    tl.to(cam, { s: 1.06, duration: 2.5, ease: 'none' }, 57.5);

    tl.set({}, {}, DUR);
  }

  /* ───────────── oynatıcı ───────────── */
  const stage = $('#stage'), box = $('#box'), ui = $('#ui'), ctl = $('#ctl');
  function layout() {
    const fit = $('#fit'), cs = getComputedStyle(fit), px = (k) => parseFloat(cs[k]) || 0;
    const s = Math.min((fit.clientWidth - px('paddingLeft') - px('paddingRight')) / 1080, (fit.clientHeight - px('paddingTop') - px('paddingBottom')) / 1920);
    box.style.width = 1080 * s + 'px'; box.style.height = 1920 * s + 'px'; stage.style.transform = `scale(${s})`;
  }
  addEventListener('resize', layout); layout();
  let ctx, buf, src, t0 = 0, pos = 0, playing = false, raf = 0;
  const seek = (t) => { tl.time(Math.max(0.0001, Math.min(DUR, t)), false); applyCam(); ctl.firstElementChild.style.width = (t / DUR) * 100 + '%'; };
  function tick() {
    const t = ctx ? ctx.currentTime - t0 : (performance.now() - t0) / 1000;
    if (t >= DUR) { seek(DUR); stop(true); return; }
    seek(t); raf = requestAnimationFrame(tick);
  }
  function start(from = 0) {
    pos = from;
    if (ctx && buf) { src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination); t0 = ctx.currentTime - from + 0.06; src.start(ctx.currentTime + 0.06, from); } else t0 = performance.now() - from * 1000;
    playing = true; ui.classList.add('off'); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
  }
  function stop(ended) {
    if (!playing) return;
    pos = ended ? 0 : (ctx ? ctx.currentTime - t0 : (performance.now() - t0) / 1000);
    playing = false; cancelAnimationFrame(raf);
    try { src && src.stop(); } catch (e) { /* zaten durmuş */ }
    $('#uis').textContent = ended ? 'Tekrar izlemek için dokun' : 'Devam etmek için dokun'; ui.classList.remove('off');
  }
  async function prepare() {
    if (buf || !window.BKAudio) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)(); await ctx.resume();
      $('#uis').textContent = 'Ses hazırlanıyor…'; await new Promise((r) => setTimeout(r, 40));
      const a = BKAudio.render(ctx.sampleRate, cues);
      buf = ctx.createBuffer(2, a.L.length, a.sr); buf.copyToChannel(a.L, 0); buf.copyToChannel(a.R, 1);
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
      await Promise.all([document.fonts.load('900 100px "Archivo Variable"', 'İŞĞÜÖÇ'), document.fonts.load('italic 500 100px "Playfair Display Variable"', 'ışğ')]);
      await document.fonts.ready;
    } catch (e) { /* sistem yazı tipiyle devam */ }
    buildArt(); fitText(); build(); seek(RENDER ? 0 : 2.9);
    window.BK = { tl, DUR, seek, cues, ready: true };
  }
  init();
})();
