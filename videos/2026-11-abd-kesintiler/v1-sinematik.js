/*
 * VİDEO 1 — "Sessiz Çöküş" · sakin, sinematik, düşündürücü · 90 sn
 * A constellation stands for the country's systems; each outage puts out
 * one cluster. The ocean scene carries the Iran storyline.
 */
(() => {
  const INK = '#07090d', CREAM = '#F3EFE6', MUTED = '#9a958b', EMBER = '#D63F27', GOLD = '#E8C27A';
  const SERIF = (s, w = 300) => `${w} ${s}px Fraunces`;
  const ISERIF = (s, w = 300) => `italic ${w} ${s}px Fraunces`;
  const SANS = (s, w = 500) => `${w} ${s}px Inter`;

  // ---------- network ----------
  const R = rng(11);
  const MAIN = [
    { label: 'E-POSTA', sub: 'Microsoft 365', x: 300, y: 520, fail: 15.2 },
    { label: 'GÖKYÜZÜ', sub: 'FAA · hava trafiği', x: 790, y: 440, fail: 27.6 },
    { label: 'PARA', sub: 'Bankalar', x: 320, y: 930, fail: 40.6 },
    { label: 'SIRLAR', sub: 'NSA', x: 770, y: 870, fail: 52.6 },
  ];
  const nodes = MAIN.map((m, i) => ({ ...m, main: true, idx: i }));
  let guard = 0;
  while (nodes.length < 64 && guard++ < 5000) {
    const a = R() * Math.PI * 2, r = Math.sqrt(R());
    const x = 540 + Math.cos(a) * r * 470, y = 700 + Math.sin(a) * r * 360;
    if (nodes.every(n => Math.hypot(n.x - x, n.y - y) > 62)) nodes.push({ x, y, main: false });
  }
  // Each minor node belongs to its nearest main node; darkness spreads outward from it.
  for (const n of nodes) {
    if (n.main) continue;
    let best = 0, bd = 1e9;
    MAIN.forEach((m, i) => { const d = Math.hypot(m.x - n.x, m.y - n.y); if (d < bd) { bd = d; best = i; } });
    n.idx = best; n.fail = MAIN[best].fail + bd / 260; n.r = 2 + R() * 2.5; n.ph = R() * 6.28;
  }
  const edges = [];
  nodes.forEach((n, i) => {
    const near = nodes.map((m, j) => ({ j, d: Math.hypot(m.x - n.x, m.y - n.y) })).filter(o => o.j !== i)
      .sort((a, b) => a.d - b.d).slice(0, n.main ? 5 : 3);
    for (const o of near) if (!edges.some(e => (e.a === i && e.b === o.j) || (e.a === o.j && e.b === i)))
      edges.push({ a: i, b: o.j, sp: 0.12 + R() * 0.25, ph: R() });
  });
  const RECOVER = 77.5;
  function health(n, t) {
    if (t < n.fail) return 1;
    const dt = t - n.fail;
    let h = dt < 0.9 ? (hash(Math.floor(t * 24) + n.x) > 0.45 ? 0.9 : 0.15) * (1 - dt / 0.9) + 0.1 : 0.07;
    if (t > RECOVER) h = lerp(h, 0.55, ease.inOutSine(prog(t, RECOVER + (n.x / W) * 1.5, 3)));
    return h;
  }

  // Camera focus per segment.
  const CAM = [
    { t: 0, x: 540, y: 700, z: 1.0 }, { t: 12, x: 540, y: 700, z: 1.0 },
    { t: 16, x: 420, y: 600, z: 1.16 }, { t: 24, x: 440, y: 610, z: 1.12 },
    { t: 28, x: 660, y: 560, z: 1.18 }, { t: 37, x: 640, y: 580, z: 1.12 },
    { t: 41, x: 420, y: 820, z: 1.18 }, { t: 49, x: 440, y: 800, z: 1.12 },
    { t: 53, x: 660, y: 780, z: 1.2 }, { t: 60, x: 640, y: 770, z: 1.16 },
    { t: 74, x: 540, y: 700, z: 1.08 }, { t: 90, x: 540, y: 700, z: 0.96 },
  ];

  const motes = Array.from({ length: 150 }, () => ({ x: R() * W, y: R() * H, z: 0.2 + R() * 0.8, ph: R() * 6.28 }));

  // Planes over the network during the FAA segment.
  const planes = Array.from({ length: 7 }, (_, i) => ({ y0: 250 + i * 95 + R() * 40, dir: i % 2 ? -1 : 1, off: R() * 300, curve: 40 + R() * 60 }));
  const STOP = 28.4;
  function planeDist(t) { // distance travelled; decelerates to a halt at STOP
    const v = 70; const td = 1.6;
    if (t < STOP - td) return v * t;
    const k = clamp((t - (STOP - td)) / td);
    return v * (STOP - td) + v * td * (k - k * k / 2);
  }

  // Grain texture (visual only) breaks up banding in the dark gradients.
  const grain = document.createElement('canvas'); grain.width = grain.height = 256;
  { const g = grain.getContext('2d'); const d = g.createImageData(256, 256); const gr = rng(3);
    for (let i = 0; i < d.data.length; i += 4) { const v = gr() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    g.putImageData(d, 0, 0); }

  function background(ctx, t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#05070b'); g.addColorStop(0.55, '#0b0e15'); g.addColorStop(1, '#06080c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // slow warm light leak
    const lx = 540 + Math.sin(t * 0.07) * 380, ly = 300 + Math.cos(t * 0.05) * 200;
    const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, 900);
    lg.addColorStop(0, 'rgba(214,63,39,0.07)'); lg.addColorStop(1, 'rgba(214,63,39,0)');
    ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
  }

  function drawMotes(ctx, t, a) {
    ctx.save();
    for (const m of motes) {
      const x = (m.x + t * 8 * m.z) % W, y = (m.y - t * 14 * m.z + H * 10) % H;
      ctx.globalAlpha = a * (0.15 + 0.35 * m.z) * (0.6 + 0.4 * Math.sin(t * 0.8 + m.ph));
      ctx.fillStyle = CREAM; ctx.beginPath(); ctx.arc(x, y, 1 + m.z * 1.6, 0, 6.283); ctx.fill();
    }
    ctx.restore();
  }

  function glow(ctx, x, y, r, color, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color.replace('A', a)); g.addColorStop(1, color.replace('A', 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  function network(ctx, t, alpha) {
    if (alpha <= 0) return;
    const c = keyframes(CAM, t);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(540, 700); ctx.scale(c.z, c.z); ctx.translate(-c.x, -c.y);
    const hs = nodes.map(n => health(n, t));
    // edges
    ctx.lineWidth = 1.4 / c.z;
    for (const e of edges) {
      const A = nodes[e.a], B = nodes[e.b]; const h = Math.min(hs[e.a], hs[e.b]);
      ctx.strokeStyle = `rgba(243,239,230,${0.05 + 0.16 * h})`;
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      if (h > 0.4) { // data pulse
        const k = (t * e.sp + e.ph) % 1; const px = lerp(A.x, B.x, k), py = lerp(A.y, B.y, k);
        glow(ctx, px, py, 10, 'rgba(232,194,122,A)', 0.55 * h);
      }
    }
    // nodes
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i], h = hs[i];
      if (n.main) {
        const failing = t > n.fail && t < n.fail + 2.5;
        glow(ctx, n.x, n.y, 90, failing ? 'rgba(214,63,39,A)' : 'rgba(232,194,122,A)', (failing ? 0.5 : 0.35) * Math.max(h, failing ? 0.6 : 0));
        ctx.fillStyle = h > 0.3 ? CREAM : '#3a3a40';
        ctx.beginPath(); ctx.arc(n.x, n.y, 9, 0, 6.283); ctx.fill();
        ctx.strokeStyle = `rgba(243,239,230,${0.25 + 0.4 * h})`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(n.x, n.y, 22 + Math.sin(t * 1.4 + i) * 3, 0, 6.283); ctx.stroke();
        const la = win(t, 7.5 + i * 0.4, 200, 1.2, 1);
        txt(ctx, n.label, n.x, n.y - 44, { font: SANS(22, 600), color: h > 0.3 ? CREAM : MUTED, align: 'center', ls: 5, alpha: la * (0.5 + 0.5 * h) });
        txt(ctx, n.sub, n.x, n.y + 56, { font: ISERIF(24), color: MUTED, align: 'center', alpha: la * 0.85 });
      } else {
        glow(ctx, n.x, n.y, 26, 'rgba(232,194,122,A)', 0.25 * h);
        ctx.fillStyle = `rgba(243,239,230,${0.2 + 0.7 * h})`;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 6.283); ctx.fill();
      }
    }
    // planes (FAA)
    const pa = win(t, 24.8, 35.5, 1.2, 1.5);
    if (pa > 0) {
      planes.forEach((p, i) => {
        const d = planeDist(t - 22) + p.off;
        const x = p.dir > 0 ? (d % 1300) - 110 : 1190 - (d % 1300);
        const y = p.y0 + Math.sin(x / 260 + i) * p.curve * 0.3;
        const stopped = t > STOP;
        const blink = stopped ? (Math.floor((t - STOP) * 2.5) % 2 ? 1 : 0.35) : 1;
        ctx.save(); ctx.globalAlpha = alpha * pa * blink; ctx.translate(x, y); ctx.scale(p.dir * 1.7, 1.7);
        ctx.fillStyle = stopped ? EMBER : CREAM;
        ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-8, -7); ctx.lineTo(-4, 0); ctx.lineTo(-8, 7); ctx.closePath(); ctx.fill();
        if (!stopped) { ctx.strokeStyle = 'rgba(243,239,230,0.25)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-70, 0); ctx.stroke(); }
        ctx.restore();
      });
    }
    ctx.restore();
  }

  // ---------- ocean ----------
  const OR = rng(5);
  const ships = [
    { kind: 'cv', depth: 0.55, x0: -260, v: 9 }, { kind: 'cv', depth: 0.8, x0: 260, v: 7 }, { kind: 'cv', depth: 1.0, x0: -820, v: 12 },
    { kind: 'dd', depth: 0.35, x0: 60, v: 6 }, { kind: 'dd', depth: 0.42, x0: 620, v: 5 }, { kind: 'dd', depth: 0.7, x0: -40, v: 8 },
    { kind: 'dd', depth: 0.3, x0: 860, v: 4 }, { kind: 'dd', depth: 0.9, x0: 700, v: 10 },
  ].sort((a, b) => a.depth - b.depth);
  const waves = Array.from({ length: 70 }, (_, i) => ({ k: i / 70, ph: OR() * 6.28, len: 60 + OR() * 220, x: OR() * W }));
  const HOR = 1010;

  function ship(ctx, kind, s) {
    ctx.beginPath();
    if (kind === 'cv') { // aircraft carrier: long flat deck + island
      ctx.moveTo(-160 * s, 0); ctx.lineTo(-175 * s, -16 * s); ctx.lineTo(170 * s, -16 * s); ctx.lineTo(150 * s, 0);
      ctx.rect(40 * s, -40 * s, 26 * s, 24 * s); ctx.rect(48 * s, -58 * s, 6 * s, 20 * s);
    } else { // destroyer
      ctx.moveTo(-70 * s, 0); ctx.lineTo(-78 * s, -9 * s); ctx.lineTo(80 * s, -9 * s); ctx.lineTo(62 * s, 0);
      ctx.rect(-10 * s, -22 * s, 30 * s, 13 * s); ctx.rect(4 * s, -38 * s, 4 * s, 18 * s);
    }
    ctx.fill();
  }

  function ocean(ctx, t, alpha) {
    if (alpha <= 0) return;
    const lt = t - 59;
    ctx.save(); ctx.globalAlpha = alpha;
    const z = 1 + lt * 0.006; ctx.translate(540, HOR); ctx.scale(z, z); ctx.translate(-540, -HOR);
    const sky = ctx.createLinearGradient(0, 0, 0, HOR);
    sky.addColorStop(0, '#04060a'); sky.addColorStop(0.7, '#0d1220'); sky.addColorStop(1, '#2a1a1c');
    ctx.fillStyle = sky; ctx.fillRect(-100, -100, W + 200, HOR + 100);
    glow(ctx, 540, HOR, 700, 'rgba(214,63,39,A)', 0.22);
    // moon
    glow(ctx, 760, 760, 260, 'rgba(243,239,230,A)', 0.14);
    ctx.fillStyle = 'rgba(243,239,230,0.9)'; ctx.beginPath(); ctx.arc(760, 760, 46, 0, 6.283); ctx.fill();
    // sea
    const sea = ctx.createLinearGradient(0, HOR, 0, H);
    sea.addColorStop(0, '#141722'); sea.addColorStop(1, '#030407');
    ctx.fillStyle = sea; ctx.fillRect(-100, HOR, W + 200, H - HOR + 100);
    for (const w of waves) {
      const y = HOR + Math.pow(w.k, 1.8) * (H - HOR);
      const x = ((w.x + lt * (10 + w.k * 30)) % (W + 300)) - 150;
      const len = w.len * (0.4 + w.k);
      const nearMoon = Math.max(0, 1 - Math.abs(x + len / 2 - 760) / 260);
      ctx.strokeStyle = `rgba(243,239,230,${(0.04 + 0.28 * nearMoon) * (0.6 + 0.4 * Math.sin(lt * 1.5 + w.ph))})`;
      ctx.lineWidth = 1 + w.k * 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(243,239,230,0.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-100, HOR); ctx.lineTo(W + 100, HOR); ctx.stroke();
    // ships
    for (const s of ships) {
      const sc = 0.5 + s.depth * 1.1; const y = HOR + 8 + s.depth * 150;
      const x = s.x0 + lt * s.v + (s.kind === 'cv' ? 120 : 0);
      ctx.save(); ctx.translate(x, y);
      ctx.fillStyle = '#020305'; ship(ctx, s.kind, sc);
      ctx.strokeStyle = 'rgba(243,239,230,0.2)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-200 * sc, 3); ctx.lineTo(-420 * sc, 3); ctx.stroke(); // wake
      // navigation light
      ctx.globalAlpha *= 0.5 + 0.5 * Math.sin(t * 3 + s.x0);
      ctx.fillStyle = EMBER; ctx.beginPath(); ctx.arc((s.kind === 'cv' ? 52 : 6) * sc, (s.kind === 'cv' ? -60 : -40) * sc, 2.4, 0, 6.283); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------- text ----------
  const BODY = { font: SERIF(52), emFont: ISERIF(52, 400), color: CREAM, emColor: GOLD, maxW: 900, lineH: 66, mode: 'rise', stagger: 0.09, dur: 1.1 };
  const HEAD = { font: SERIF(72, 350), emFont: ISERIF(72, 400), color: CREAM, emColor: GOLD, maxW: 900, lineH: 84, mode: 'blur', stagger: 0.1, dur: 1.2 };

  /** Date label + headline + body block, bottom-anchored inside the safe zone (or at the top). */
  function segment(ctx, t, s, e, date, head, body, bodyStart, o = {}) {
    const a = win(t, s, e, 0.6, 0.9); if (a <= 0) return;
    const HO = { ...HEAD, start: s + 0.3 }, BO = { ...BODY, font: SERIF(42), emFont: ISERIF(42, 450), lineH: 56, start: bodyStart };
    const hn = lineCount(ctx, head, HO), bn = body ? lineCount(ctx, body, BO) : 0;
    const hh = hn * HO.lineH, bh = body ? 26 + (bn - 1) * BO.lineH : -HO.lineH + (hn ? 0 : 0);
    const y0 = o.top ? 300 : 1545 - 40 - hh - bh - (body ? 0 : 0);
    ctx.save(); ctx.globalAlpha = a;
    const sc = o.top ? ctx.createLinearGradient(0, y0 + hh + bh + 200, 0, 0) : ctx.createLinearGradient(0, y0 - 300, 0, H);
    sc.addColorStop(0, 'rgba(4,6,10,0)'); sc.addColorStop(0.35, 'rgba(4,6,10,0.78)'); sc.addColorStop(1, 'rgba(4,6,10,0.92)');
    ctx.fillStyle = sc; ctx.fillRect(0, o.top ? 0 : y0 - 300, W, o.top ? y0 + hh + bh + 200 : H);
    const dp = ease.outCubic(prog(t, s, 1));
    ctx.fillStyle = EMBER; ctx.fillRect(90, y0 - 58, 56 * dp, 3);
    txt(ctx, date, 166, y0 - 46, { font: SANS(24, 600), color: CREAM, ls: 6, alpha: dp });
    words(ctx, head, 90, y0 + 40, t, HO);
    if (body) words(ctx, body, 90, y0 + 40 + hh + 26, t, BO);
    if (o.redact) { // a bar sweeps over the first headline line and pulls back
      const L = layout(ctx, head, HO).lines[0];
      const p = ease.inOutCubic(prog(t, o.redact, 0.7)), q = 1 - ease.inOutCubic(prog(t, o.redact + 1.3, 0.6));
      const x0 = 90 + L.width * (1 - q) * 0, w = L.width * p - L.width * (1 - q);
      if (w > 0) { ctx.fillStyle = EMBER; ctx.fillRect(90 + L.width * (1 - q), y0 + 40 - 62, w, 80); }
    }
    ctx.restore();
  }

  function center(ctx, t, s, e, text, y, o = {}) {
    const a = win(t, s, e, 0.6, 1.0); if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    words(ctx, text, 540, y, t, { ...BODY, font: SERIF(o.size || 70), emFont: ISERIF(o.size || 70, 400), lineH: (o.size || 70) * 1.22, align: 'center', start: s, ...o });
    ctx.restore();
  }

  function endCard(ctx, t) {
    const a = win(t, 86.6, 95, 1.0, 1); if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(5,7,11,0.6)'; ctx.fillRect(0, 0, W, H);
    const lp = ease.inOutCubic(prog(t, 86.8, 1.2));
    ctx.fillStyle = EMBER; ctx.fillRect(540 - 120 * lp, 900, 240 * lp, 3);
    txt(ctx, 'BERLİN KONUŞUYOR', 540, 860, { font: SERIF(64, 500), color: CREAM, align: 'center', ls: 10 });
    words(ctx, 'Sen ne düşünüyorsun?\n*Yorumlarda konuşalım.*', 540, 1000, t, { ...BODY, font: SERIF(46), emFont: ISERIF(46, 400), lineH: 60, align: 'center', start: 87.4 });
    txt(ctx, 'Kaynaklar: CNN · AP · ABC News · Al Jazeera · Washington Post · CBS', 540, 1480, { font: SANS(20, 500), color: MUTED, align: 'center', alpha: 0.8 });
    ctx.restore();
  }

  function draw(ctx, t) {
    ctx.save();
    background(ctx, t);
    const netA = Math.min(win(t, 6, 60.5, 2.5, 1.5) + win(t, 74.5, 200, 2.5, 1), 1);
    const oceanA = win(t, 59, 75.5, 1.8, 1.8);
    drawMotes(ctx, t, 1 - oceanA * 0.7);
    network(ctx, t, netA);
    ocean(ctx, t, oceanA);
    // vignette
    const v = ctx.createRadialGradient(540, 800, 300, 540, 900, 1250);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);

    // opening
    center(ctx, t, 0.8, 6.3, 'Bazen bir ülke\n*sessizce* yavaşlar.', 900, { size: 84, stagger: 0.28, dur: 1.6 });
    segment(ctx, t, 7.2, 13.6, 'BİR HAFTA · ABD', 'Her şey birbirine bağlı.', 'Biz buna *sistem* diyoruz. Peki bir sistem, *tek tek* sönmeye başlarsa?', 9.4);
    segment(ctx, t, 14.2, 24.8, '12 KASIM · PERŞEMBE', 'Microsoft 365 *durdu.*', 'Outlook, Teams, Copilot… *18 saatten uzun* süren bir kesinti. Dünyanın dört bir yanında.', 17.0);
    segment(ctx, t, 25.4, 38.0, '13 KASIM · CUMA', 'ABD\'de *tüm* havalimanlarında uçuşlar durdu.', 'Bakan Duffy\'ye göre sebep: bakırdan fibere geçerken ağı istek yağmuruna tutan *tek bir router.*', 30.2);
    segment(ctx, t, 38.6, 50.2, '16 KASIM · PAZARTESİ', 'Chase, Bank of America, Wells Fargo…', 'Binlerce kişi hesabına ulaşamadı. Açıklama: *“Yazılım hatası. Siber saldırı değil.”*', 42.6);
    segment(ctx, t, 50.8, 59.6, '17 KASIM · BUGÜN', 'NSA\'nın gizli iç ağı *karardı.*', 'Resmi açıklama: *“Rutin bakım.”* Siber saldırı kanıtı yok.', 55.0, { redact: 52.3 });
    // ocean
    center(ctx, t, 60.6, 65.0, 'Ve aynı günlerde,\n*dünyanın öbür ucunda…*', 420, { size: 66, stagger: 0.2 });
    segment(ctx, t, 65.4, 74.6, '16 KASIM · ORTA DOĞU', 'Üçüncü ABD uçak gemisi bölgeye ulaştı.', 'Üç uçak gemisi. Onlarca savaş gemisi. İran\'a karşı süren bir *abluka.*', 69.0, { top: true });
    // closing
    center(ctx, t, 75.4, 79.4, 'Her biri tek başına\nbir *teknik arıza.*', 1380, { size: 64 });
    center(ctx, t, 79.6, 83.4, 'Hepsi aynı hafta.\n*Tesadüf mü, uyarı mı?*', 1380, { size: 64 });
    center(ctx, t, 83.6, 87.0, 'Belki asıl soru şu:\nBu kadar bağlı bir dünyada\n*ne kadar sağlamız?*', 1340, { size: 60, stagger: 0.12 });
    endCard(ctx, t);

    // grain + fade from/to black
    ctx.globalAlpha = 0.05; ctx.globalCompositeOperation = 'overlay';
    const gx = Math.floor(hash(Math.floor(t * 30)) * 256), gy = Math.floor(hash(Math.floor(t * 30) + 7) * 256);
    ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.translate(-gx, -gy); ctx.fillRect(0, 0, W + 256, H + 256);
    ctx.restore();
    const fb = 1 - Math.min(prog(t, 0, 0.8), prog(-t, -90, 0.8));
    if (fb > 0) { ctx.fillStyle = `rgba(0,0,0,${fb})`; ctx.fillRect(0, 0, W, H); }
  }

  window.VIDEO = {
    duration: 90, draw,
    // Sound cues: soft impacts when a system goes dark, swells into the ocean and the end.
    cues: [
      ...MAIN.map(m => ({ t: m.fail, type: 'impact', gain: 0.8 })),
      ...MAIN.map(m => ({ t: m.fail, type: 'swell', gain: 0.5 })),
      { t: 60.2, type: 'boom', gain: 1 }, { t: 75.2, type: 'swell', gain: 0.6 }, { t: 86.8, type: 'chime', gain: 0.8 },
    ],
  };
})();
