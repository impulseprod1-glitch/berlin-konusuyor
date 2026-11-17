/*
 * VİDEO 4 — "Durum Odası" · seslendirmeli (Ahmet), gerilimli HUD estetiği
 * Dot-matrix US map with outage pins, a radar for the Gulf, and three hypothesis cards.
 * All timing comes from window.TIMELINE (voice.py), so the picture follows the voice.
 */
(() => {
  const BG = '#040a12', CY = '#3fd2ff', AM = '#ffb21e', RED = '#ff4a3d', WH = '#eaf6ff', DIM = '#5d7385';
  const MONO = (s, w = 600) => `${w} ${s}px "JetBrains Mono"`;
  const SANS = (s, w = 800) => `${w} ${s}px Inter`;
  const TL = window.TIMELINE;
  const S = id => seg(id);

  // ---------- US dot map ----------
  const US = [[-124.7, 48.4], [-122.8, 49], [-95.2, 49], [-95.2, 49.4], [-94.8, 48.8], [-89.6, 48], [-84.8, 46.5], [-82.5, 45.3],
    [-82.4, 43], [-79, 43.3], [-76.5, 44.2], [-75, 45], [-71.5, 45], [-70, 46.7], [-69.2, 47.4], [-67.8, 47.1], [-67, 45], [-70.2, 43.6],
    [-70.8, 42.6], [-70, 41.7], [-71.9, 41.3], [-73.9, 40.6], [-74.1, 39.7], [-75, 38.8], [-75.9, 37.2], [-76, 36.9], [-75.5, 35.2],
    [-77, 34.6], [-79.1, 33.4], [-80.9, 32], [-81.4, 30.7], [-80.6, 28.4], [-80, 26.7], [-80.4, 25.2], [-81.1, 25.1], [-81.8, 26.1],
    [-82.7, 27.5], [-82.8, 29], [-84, 30], [-85.4, 29.7], [-86.5, 30.4], [-88, 30.4], [-89.6, 30.2], [-89.4, 29], [-90.2, 29.1],
    [-91.5, 29.5], [-93.8, 29.7], [-94.8, 29.3], [-96.8, 28], [-97.4, 26], [-99.1, 26.4], [-100, 28], [-101.4, 29.8], [-103.1, 29],
    [-104.7, 30], [-106.5, 31.8], [-108.2, 31.8], [-108.2, 31.3], [-111.1, 31.3], [-114.8, 32.5], [-117.1, 32.5], [-118.5, 34],
    [-120.6, 34.6], [-121.9, 36.6], [-122.5, 37.8], [-123.7, 39], [-124.2, 40.4], [-124.4, 42], [-124, 44.6], [-124, 46.3]];
  const K = 20.4, COS = Math.cos(38 * Math.PI / 180), MX = 66, MY = 560;
  const proj = (lon, lat) => [MX + (lon + 125) * K * COS, MY + (49.6 - lat) * K];
  const poly = US.map(([a, b]) => proj(a, b));
  function inside(x, y) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  const DOTS = [];
  for (let y = MY - 10; y < MY + 540; y += 15) for (let x = 40; x < 1040; x += 15) if (inside(x, y)) DOTS.push({ x, y, r: hash(x * 3 + y) });

  const PINS = [
    { id: 'ms', ll: [-122.1, 47.7], sys: 0, date: '12 KASIM · PERŞEMBE', title: 'MICROSOFT 365', sub: 'OUTLOOK · TEAMS · COPILOT  ▸  18+ SAAT' },
    { id: 'faa', ll: [-92.7, 33.2], sys: 1, date: '13 KASIM · CUMA', title: 'TÜM UÇUŞLAR DURDU', sub: 'FAA ▸ 10.000+ RÖTAR ▸ SEBEP: TEK ROUTER' },
    { id: 'workday', ll: [-121.9, 37.7], sys: 2, date: '13–14 KASIM', title: 'WORKDAY ÇÖKTÜ', sub: 'İK VE BORDRO PLATFORMU ERİŞİLEMEDİ' },
    { id: 'banks', ll: [-74.0, 40.7], sys: 3, date: '16 KASIM · PAZARTESİ', title: 'BANKALAR KİLİTLENDİ', sub: 'CHASE · WELLS FARGO · BOFA · ZELLE' },
    { id: 'nsa', ll: [-76.8, 39.1], sys: 4, date: '17 KASIM · BUGÜN', title: 'NSA AĞI KARARDI', sub: 'RESMİ AÇIKLAMA: “RUTİN BAKIM”' },
  ].map(p => { const [x, y] = proj(...p.ll); return { ...p, x, y, t: S(p.id).start + 0.2 }; });
  const SYS = ['E-POSTA · MICROSOFT', 'HAVA TRAFİĞİ · FAA', 'İK · WORKDAY', 'BANKACILIK', 'İSTİHBARAT · NSA'];

  // flights between big airports; they freeze when the FAA stops traffic
  const CITIES = [[-118.4, 33.9], [-87.9, 41.98], [-73.8, 40.6], [-84.4, 33.6], [-97, 32.9], [-122.4, 37.6], [-104.7, 39.9], [-80.3, 25.8], [-122.3, 47.4], [-71, 42.4], [-112, 33.4], [-95.3, 29.98]].map(c => proj(...c));
  const R = rng(4);
  const FLIGHTS = Array.from({ length: 18 }, () => { const a = Math.floor(R() * 12); let b = Math.floor(R() * 12); if (b === a) b = (a + 5) % 12; return { a: CITIES[a], b: CITIES[b], ph: R(), sp: 0.05 + R() * 0.05 }; });
  const FREEZE = S('faa').start + 3.4;
  const fpos = (f, t) => { const k = t < FREEZE ? t : FREEZE; return (f.ph + k * f.sp) % 1; };

  const MAP_END = S('gulf').start, MAP_BACK = S('close').start - 0.2;
  const CHUNKS = buildChunks(TL.words, 4);

  function bg(ctx, t) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(63,210,255,0.05)'; ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    const g = ctx.createRadialGradient(540, 820, 100, 540, 900, 1200);
    g.addColorStop(0, 'rgba(20,60,90,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  function hud(ctx, t) {
    txt(ctx, '◉ DURUM ODASI', 60, 150, { font: MONO(30, 800), color: CY, ls: 4 });
    const live = Math.floor(t * 2) % 2;
    ctx.fillStyle = live ? RED : '#601b16'; ctx.beginPath(); ctx.arc(830, 140, 9, 0, 6.283); ctx.fill();
    txt(ctx, 'CANLI', 850, 150, { font: MONO(26, 800), color: RED, ls: 3 });
    const tc = `T+${String(Math.floor(t / 60)).padStart(2, '0')}:${(t % 60).toFixed(1).padStart(4, '0')}`;
    txt(ctx, 'ABD · 12–17 KASIM 2026', 60, 192, { font: MONO(22, 500), color: DIM, ls: 2 });
    txt(ctx, tc, 1020, 192, { font: MONO(22, 500), color: DIM, align: 'right' });
    ctx.fillStyle = 'rgba(63,210,255,0.3)'; ctx.fillRect(60, 214, 960, 2);
    // system status panel
    const failed = PINS.filter(p => t >= p.t).length;
    SYS.forEach((s, i) => {
      const p = PINS.find(p => p.sys === i); const down = t >= p.t;
      const blink = down && t < p.t + 1.2 ? Math.floor(t * 8) % 2 : 1;
      const y = 262 + i * 40;
      txt(ctx, s, 60, y, { font: MONO(24, 600), color: down ? WH : DIM });
      ctx.globalAlpha = blink;
      txt(ctx, down ? '■ ARIZA' : '● ÇEVRİMİÇİ', 700, y, { font: MONO(24, 800), color: down ? RED : '#3ddc84' });
      ctx.globalAlpha = 1;
    });
    txt(ctx, `${failed}/5`, 1020, 268, { font: MONO(56, 800), color: failed ? RED : CY, align: 'right' });
    txt(ctx, 'ARIZA', 1020, 300, { font: MONO(20, 700), color: DIM, align: 'right', ls: 3 });
  }

  function map(ctx, t, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    const reveal = prog(t, 0.3, 2.5);
    for (const d of DOTS) {
      if (d.r > reveal * 1.2) continue;
      let col = 'rgba(63,210,255,0.62)', rad = 5;
      for (const p of PINS) {
        if (t < p.t) continue;
        const dist = Math.hypot(d.x - p.x, d.y - p.y), dt = t - p.t;
        const ring = Math.abs(dist - dt * 520);
        if (ring < 26 && dt < 2) { col = 'rgba(255,90,70,1)'; rad = 7; }
        else if (dist < 40 + Math.min(dt, 3) * 45) { col = `rgba(255,74,61,${0.85 - Math.min(dist / 400, 0.4)})`; rad = 5.5; }
      }
      ctx.fillStyle = col; ctx.fillRect(d.x - rad / 2, d.y - rad / 2, rad, rad);
    }
    // flights
    const fa = win(t, 1.5, S('banks').start + 0.5, 1, 1);
    if (fa > 0) for (const f of FLIGHTS) {
      const k = fpos(f, t); const x = lerp(f.a[0], f.b[0], k), y = lerp(f.a[1], f.b[1], k) - Math.sin(k * Math.PI) * 60;
      const frozen = t >= FREEZE;
      ctx.globalAlpha = a * fa * (frozen ? (Math.floor(t * 3) % 2 ? 1 : 0.4) : 1);
      ctx.fillStyle = frozen ? RED : AM; ctx.fillRect(x - 4, y - 4, 8, 8);
    }
    ctx.globalAlpha = a;
    // pins
    for (const p of PINS) {
      if (t < p.t) continue;
      const dt = t - p.t, drop = ease.outBack(prog(t, p.t, 0.4), 2.5);
      for (let k = 0; k < 2; k++) {
        const rr = ((dt * 0.8 + k * 0.5) % 1); ctx.strokeStyle = `rgba(255,74,61,${1 - rr})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(p.x, p.y, 10 + rr * 60, 0, 6.283); ctx.stroke();
      }
      ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(p.x, p.y - (1 - drop) * 80, 11, 0, 6.283); ctx.fill();
      ctx.fillStyle = WH; ctx.beginPath(); ctx.arc(p.x, p.y - (1 - drop) * 80, 4, 0, 6.283); ctx.fill();
    }
    ctx.restore();
  }

  /** Detail card for the currently reported outage. */
  function detail(ctx, t) {
    const cur = [...PINS].reverse().find(p => t >= p.t);
    if (!cur || t >= MAP_END - 0.3) return;
    const a = Math.min(prog(t, cur.t, 0.3), clamp((MAP_END - 0.3 - t) / 0.3));
    const y = 1140;
    ctx.save(); ctx.globalAlpha = a;
    // leader line from pin to card
    ctx.strokeStyle = 'rgba(255,74,61,0.7)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(cur.x, cur.y + 14); ctx.lineTo(cur.x, y - 10); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(4,10,18,0.92)'; ctx.strokeStyle = RED; ctx.lineWidth = 3;
    rrect(ctx, 60, y, 960, 190, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = RED; ctx.fillRect(60, y, 14, 190);
    txt(ctx, cur.date, 100, y + 46, { font: MONO(24, 700), color: AM, ls: 2 });
    const typed = cur.title.slice(0, Math.floor((t - cur.t) * 40));
    txt(ctx, typed, 100, y + 112, { font: SANS(fit(ctx, cur.title, s => SANS(s), 60, 880)), color: WH });
    txt(ctx, cur.sub, 100, y + 160, { font: MONO(22, 600), color: CY });
    ctx.restore();
  }

  // ---------- radar ----------
  const RC = [540, 820], RR = 330;
  const BLIPS = [];
  { const r = rng(8);
    [['ROOSEVELT', 0.55, -0.4], ['BUSH', 0.35, 0.9], ['WASHINGTON', 0.62, 2.3]].forEach(([n, d, a]) => BLIPS.push({ n, d, a, cv: true }));
    for (let i = 0; i < 15; i++) BLIPS.push({ d: 0.2 + r() * 0.75, a: r() * 6.283, cv: false, cr: i >= 13 }); }

  function radar(ctx, t, a) {
    if (a <= 0) return;
    const s0 = S('gulf').start;
    ctx.save(); ctx.globalAlpha = a;
    const [cx, cy] = RC;
    ctx.strokeStyle = 'rgba(63,210,255,0.35)'; ctx.lineWidth = 2;
    for (let k = 1; k <= 4; k++) { ctx.beginPath(); ctx.arc(cx, cy, RR * k / 4, 0, 6.283); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(cx - RR, cy); ctx.lineTo(cx + RR, cy); ctx.moveTo(cx, cy - RR); ctx.lineTo(cx, cy + RR); ctx.stroke();
    const sw = (t - s0) * 2.2;
    const g = ctx.createConicGradient ? ctx.createConicGradient(sw - 0.9, cx, cy) : null;
    if (g) { g.addColorStop(0, 'rgba(63,210,255,0)'); g.addColorStop(0.14, 'rgba(63,210,255,0.35)'); g.addColorStop(0.145, 'rgba(63,210,255,0)'); g.addColorStop(1, 'rgba(63,210,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, RR, 0, 6.283); ctx.fill(); }
    BLIPS.forEach((b, i) => {
      const appear = s0 + 0.8 + (b.cv ? i * 0.6 : 2.5 + i * 0.08);
      if (t < appear) return;
      const since = ((sw - b.a) % 6.283 + 6.283) % 6.283;
      const glow = 0.35 + 0.65 * Math.exp(-since * 1.5);
      const x = cx + Math.cos(b.a) * b.d * RR, y = cy + Math.sin(b.a) * b.d * RR;
      ctx.globalAlpha = a * glow * prog(t, appear, 0.3);
      if (b.cv) {
        ctx.fillStyle = AM; ctx.beginPath(); ctx.moveTo(x, y - 16); ctx.lineTo(x + 14, y + 10); ctx.lineTo(x - 14, y + 10); ctx.closePath(); ctx.fill();
        txt(ctx, b.n, x + 22, y + 8, { font: MONO(22, 700), color: AM });
      } else { ctx.fillStyle = b.cr ? WH : CY; ctx.fillRect(x - 5, y - 5, 10, 10); }
    });
    ctx.globalAlpha = a;
    txt(ctx, 'CENTCOM BÖLGESİ · İRAN ABLUKASI', cx, cy - RR - 30, { font: MONO(24, 700), color: CY, align: 'center', ls: 2 });
    // force counters
    const ca = prog(t, s0 + 3.0, 0.4);
    ctx.globalAlpha = a * ca;
    [['3', 'UÇAK GEMİSİ', AM], ['13', 'MUHRİP', CY], ['~50.000', 'ASKER', WH]].forEach(([n, l, c], i) => {
      const x = 60 + i * 330;
      ctx.fillStyle = 'rgba(4,10,18,0.9)'; ctx.strokeStyle = c; ctx.lineWidth = 2; rrect(ctx, x, 1200, 300, 130, 6); ctx.fill(); ctx.stroke();
      txt(ctx, n, x + 150, 1268, { font: SANS(n.length > 3 ? 50 : 62), color: c, align: 'center' });
      txt(ctx, l, x + 150, 1310, { font: MONO(20, 700), color: DIM, align: 'center', ls: 2 });
    });
    ctx.restore();
  }

  // ---------- question + hypotheses ----------
  const HYP = [
    { id: 'p1', n: 'İHTİMAL 1', h: 'ESKİYEN ALTYAPI', tag: 'KAYNAK: ULAŞTIRMA BAKANI' },
    { id: 'p2', n: 'İHTİMAL 2', h: 'DOMİNO ETKİSİ', tag: 'ÖRNEK: TEK ROUTER → TÜM ÜLKE' },
    { id: 'p3', n: 'İHTİMAL 3', h: 'BİLİNMEYEN ETKEN', tag: 'KANIT: HENÜZ YOK' },
  ];
  function question(ctx, t) {
    const q = S('q'); const a = win(t, q.start - 0.1, S('close').start - 0.2, 0.2, 0.4); if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    const gl = t < q.start + 0.5 ? (hash(Math.floor(t * 30)) - 0.5) * 30 : 0;
    const big = 1 - prog(t, S('p1').start - 0.3, 0.6);
    const y = lerp(470, 820, big);
    const size = lerp(56, 112, big);
    ctx.globalCompositeOperation = 'lighter';
    if (gl) { txt(ctx, 'ACABA NE', 540 - gl, y, { font: SANS(size, 900), color: '#ff2050', align: 'center' }); txt(ctx, 'ACABA NE', 540 + gl, y, { font: SANS(size, 900), color: '#00d0ff', align: 'center' }); }
    ctx.globalCompositeOperation = 'source-over';
    txt(ctx, 'ACABA NE', 540, y, { font: SANS(size, 900), color: WH, align: 'center' });
    txt(ctx, 'OLUYOR?', 540, y + size * 1.05, { font: SANS(size, 900), color: AM, align: 'center' });
    HYP.forEach((h, i) => {
      const s = S(h.id); if (t < s.start - 0.15) return;
      const k = ease.outExpo(prog(t, s.start - 0.15, 0.5));
      const active = t >= s.start - 0.15 && t < s.end + 0.3;
      const yy = 680 + i * 190;
      ctx.save(); ctx.globalAlpha = a * k * (active ? 1 : 0.55); ctx.translate((1 - k) * 200, 0);
      ctx.fillStyle = 'rgba(4,10,18,0.92)'; ctx.strokeStyle = active ? AM : DIM; ctx.lineWidth = active ? 4 : 2;
      rrect(ctx, 60, yy, 960, 160, 6); ctx.fill(); ctx.stroke();
      txt(ctx, h.n, 100, yy + 48, { font: MONO(24, 800), color: active ? AM : DIM, ls: 3 });
      txt(ctx, h.h, 100, yy + 110, { font: SANS(54), color: WH });
      txt(ctx, h.tag, 1000, yy + 48, { font: MONO(20, 700), color: i === 2 ? RED : CY, align: 'right' });
      if (active) { ctx.fillStyle = AM; ctx.fillRect(60, yy + 156, 960 * prog(t, s.start, s.end - s.start), 4); }
      ctx.restore();
    });
    ctx.restore();
  }

  function closing(ctx, t) {
    const c = S('close'); const a = prog(t, c.start - 0.2, 0.6); if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    // connect all pins: is it a pattern?
    const lp = ease.inOutCubic(prog(t, c.start, 2.5));
    ctx.strokeStyle = 'rgba(255,178,30,0.8)'; ctx.lineWidth = 2.5; ctx.setLineDash([10, 8]);
    for (let i = 0; i < PINS.length; i++) for (let j = i + 1; j < PINS.length; j++) {
      const A = PINS[i], B = PINS[j];
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(lerp(A.x, B.x, lp), lerp(A.y, B.y, lp)); ctx.stroke();
    }
    ctx.setLineDash([]);
    const ta = prog(t, c.start + 1.6, 0.5);
    ctx.globalAlpha = a * ta;
    ctx.fillStyle = 'rgba(4,10,18,0.92)'; ctx.strokeStyle = AM; ctx.lineWidth = 3; rrect(ctx, 60, 1140, 960, 200, 6); ctx.fill(); ctx.stroke();
    txt(ctx, 'TESADÜF MÜ?', 540, 1225, { font: SANS(76, 900), color: AM, align: 'center' });
    txt(ctx, 'SEN NE DÜŞÜNÜYORSUN? ▸ YORUMLARA YAZ', 540, 1290, { font: MONO(26, 700), color: WH, align: 'center' });
    ctx.restore();
    const ea = prog(t, TL.duration - 3.2, 0.5);
    if (ea > 0) {
      ctx.save(); ctx.globalAlpha = ea; ctx.fillStyle = 'rgba(4,10,18,0.94)'; ctx.fillRect(0, 0, W, H);
      txt(ctx, 'BERLİN KONUŞUYOR', 540, 900, { font: SANS(84, 900), color: WH, align: 'center', ls: 2 });
      txt(ctx, '◉ DURUM ODASI', 540, 980, { font: MONO(32, 800), color: CY, align: 'center', ls: 6 });
      txt(ctx, 'KAYNAKLAR: CNN · AP · ABC NEWS · AL JAZEERA · WASHINGTON POST · CBS · INSS', 540, 1480, { font: MONO(18, 500), color: DIM, align: 'center' });
      ctx.restore();
    }
  }

  function draw(ctx, t) {
    bg(ctx, t);
    hud(ctx, t);
    const mapA = Math.max(win(t, 0, MAP_END + 0.2, 0.6, 0.6), prog(t, MAP_BACK, 0.8)) * (1 - 0.65 * win(t, S('q').start - 0.2, MAP_BACK, 0.3, 0.3));
    map(ctx, t, mapA);
    detail(ctx, t);
    radar(ctx, t, win(t, MAP_END, S('q').start, 0.6, 0.3));
    question(ctx, t);
    closing(ctx, t);
    // scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    for (let y = (t * 30) % 4; y < H; y += 4) ctx.fillRect(0, y, W, 1);
    if (t < TL.duration - 3) captions(ctx, t, CHUNKS, { font: SANS(56, 900), color: WH, dim: 'rgba(234,246,255,0.45)', active: BG, activeBg: AM, upper: true, y: 1480, maxW: 900, lineH: 74, band: 'rgba(4,10,18,0.9)' });
    const fb = 1 - Math.min(prog(t, 0, 0.4), prog(-t, -TL.duration, 0.6));
    if (fb > 0) { ctx.fillStyle = `rgba(0,0,0,${fb})`; ctx.fillRect(0, 0, W, H); }
  }

  window.VIDEO = {
    duration: TL.duration, draw,
    cues: [
      ...PINS.map(p => ({ t: p.t, type: 'alert' })),
      { t: FREEZE, type: 'freeze' },
      { t: MAP_END, type: 'whoosh' }, { t: S('q').start - 0.1, type: 'glitch' },
      ...HYP.map(h => ({ t: S(h.id).start - 0.15, type: 'card' })),
      { t: S('close').start, type: 'whoosh' }, { t: TL.duration - 3.2, type: 'end' },
    ],
  };
})();
