/*
 * VİDEO 5 — "Soruşturma Panosu" · seslendirmeli (Emel), merak uyandıran pano estetiği
 * A cork board with pinned evidence cards; the camera visits each card, red string
 * connects them to a question note, and three sticky notes weigh the possibilities.
 */
(() => {
  const TL = window.TIMELINE;
  const S = id => seg(id);
  const PAPER = '#f7f2e7', INK = '#1d1a16', RED = '#c8281e', MUTED = '#7b7064', YEL = '#ffd84a';
  const SERIF = (s, w = 600) => `${w} ${s}px Fraunces`;
  const ISERIF = (s, w = 500) => `italic ${w} ${s}px Fraunces`;
  const SANS = (s, w = 600) => `${w} ${s}px Inter`;
  const MONO = (s, w = 700) => `${w} ${s}px "JetBrains Mono"`;
  const HAND = s => `700 ${s}px Caveat`;
  const BW = 1600, BH = 2600;

  // ---------- cork texture (visual only) ----------
  const cork = document.createElement('canvas'); cork.width = BW; cork.height = BH;
  { const g = cork.getContext('2d'); const r = rng(21);
    const grd = g.createLinearGradient(0, 0, BW, BH); grd.addColorStop(0, '#b0814f'); grd.addColorStop(1, '#9c6f42');
    g.fillStyle = grd; g.fillRect(0, 0, BW, BH);
    for (let i = 0; i < 60000; i++) {
      const x = r() * BW, y = r() * BH, s = 1 + r() * 3.5, v = r();
      g.fillStyle = v < 0.5 ? `rgba(70,40,15,${0.15 + r() * 0.25})` : `rgba(235,200,150,${0.1 + r() * 0.2})`;
      g.fillRect(x, y, s, s * (0.6 + r()));
    }
    // a few old pin holes
    for (let i = 0; i < 160; i++) { g.fillStyle = 'rgba(40,20,5,0.5)'; g.beginPath(); g.arc(r() * BW, r() * BH, 2.5, 0, 6.283); g.fill(); }
  }

  const CARDS = [
    { id: 'ms', x: 420, y: 600, rot: -0.06, icon: 'mail', date: '12 KASIM', title: 'Microsoft 365', lines: ['Outlook · Teams · Copilot', '18+ saat kesinti'], quote: 'sunucu sorunları', hand: '18 saat!?' },
    { id: 'faa', x: 1180, y: 640, rot: 0.05, icon: 'plane', date: '13 KASIM', title: 'Gökyüzü kapandı', lines: ['Tüm ABD havalimanları', '10.000+ uçuş rötar'], quote: 'tek bir router', hand: '3 yıldır ilk!' },
    { id: 'banks', x: 420, y: 1380, rot: 0.04, icon: 'bank', date: '16 KASIM', title: 'Bankalar', lines: ['Chase · Wells Fargo', 'BofA · Zelle'], quote: 'yazılım hatası', hand: 'binlerce şikayet' },
    { id: 'nsa', x: 1180, y: 1400, rot: -0.05, icon: 'eye', date: '17 KASIM', title: 'NSA gizli ağı', lines: ['İç iletişim ağı çöktü', 'Personel kademeli girişte'], quote: 'rutin bakım', hand: 'bugün!' },
    { id: 'gulf', x: 800, y: 2300, rot: 0.02, icon: 'ship', date: 'AYNI HAFTA', title: 'Orta Doğu', lines: ['3. uçak gemisi bölgede', 'İran ablukası sürüyor'], quote: null, hand: '~50.000 asker' },
  ];
  const CW = 460, CH = 560;
  const Q = { x: 800, y: 1000, rot: -0.04 };
  const NOTES = [
    { id: 'p1', x: 400, y: 1880, rot: -0.07, col: '#ffe066', text: 'Eskiyen altyapı\nçatırdıyor?' },
    { id: 'p2', x: 800, y: 1910, rot: 0.04, col: '#ff9fb2', text: 'Domino etkisi:\ntek hata, hepsi\nsarsılıyor?' },
    { id: 'p3', x: 1200, y: 1880, rot: -0.03, col: '#9fd8ff', text: 'Perde arkasında\nbilinmeyen bir şey?\n(kanıt yok)' },
  ];

  // ---------- camera ----------
  const cam = [];
  const key = (t, x, y, z) => cam.push({ t, x, y, z });
  key(0, 800, 1380, 0.62); key(S('ms').start - 0.6, 800, 1320, 0.68);
  for (const c of CARDS) {
    const s = S(c.id);
    key(s.start - 0.1, c.x, c.y + 20, 1.38); key(s.end - 0.2, c.x + 10, c.y + 10, 1.48);
  }
  key(S('string').start + 0.4, 800, 1400, 0.62); key(S('string').end, 800, 1360, 0.66);
  key(S('p1').start - 0.1, 800, 1520, 0.78); key(S('p3').end, 800, 1540, 0.82);
  key(S('close').start + 0.5, 800, 1400, 0.62); key(TL.duration, 800, 1380, 0.58);
  cam.sort((a, b) => a.t - b.t);

  // ---------- drawing helpers (board coordinates) ----------
  function pin(ctx, x, y, col = RED) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(x + 5, y + 7, 14, 0, 6.283); ctx.fill();
    const g = ctx.createRadialGradient(x - 5, y - 5, 2, x, y, 15);
    g.addColorStop(0, '#ff8a80'); g.addColorStop(1, col);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 15, 0, 6.283); ctx.fill();
  }

  function icon(ctx, kind, x, y) {
    ctx.save(); ctx.translate(x, y); ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineWidth = 7; ctx.lineJoin = 'round';
    if (kind === 'mail') { ctx.strokeRect(-80, -52, 160, 104); ctx.beginPath(); ctx.moveTo(-80, -52); ctx.lineTo(0, 12); ctx.lineTo(80, -52); ctx.stroke();
      ctx.strokeStyle = RED; ctx.beginPath(); ctx.moveTo(-95, -70); ctx.lineTo(95, 70); ctx.moveTo(95, -70); ctx.lineTo(-95, 70); ctx.stroke(); }
    if (kind === 'plane') { ctx.scale(0.75, 0.75); ctx.beginPath();
      ctx.moveTo(120, 0); ctx.quadraticCurveTo(110, -12, 80, -12); ctx.lineTo(-90, -10); ctx.lineTo(-120, -50); ctx.lineTo(-138, -50); ctx.lineTo(-118, -6);
      ctx.lineTo(-118, 6); ctx.lineTo(-138, 18); ctx.lineTo(-120, 18); ctx.lineTo(-90, 10); ctx.lineTo(80, 12); ctx.quadraticCurveTo(110, 12, 120, 0); ctx.fill();
      ctx.beginPath(); ctx.moveTo(10, -8); ctx.lineTo(-40, -95); ctx.lineTo(-62, -95); ctx.lineTo(-30, -8); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(10, 8); ctx.lineTo(-40, 95); ctx.lineTo(-62, 95); ctx.lineTo(-30, 8); ctx.closePath(); ctx.fill();
      ctx.lineWidth = 14; ctx.strokeStyle = RED; ctx.beginPath(); ctx.arc(0, 0, 130, 0, 6.283); ctx.moveTo(-92, -92); ctx.lineTo(92, 92); ctx.stroke(); }
    if (kind === 'bank') { ctx.beginPath(); ctx.moveTo(-95, -30); ctx.lineTo(0, -80); ctx.lineTo(95, -30); ctx.closePath(); ctx.fill();
      for (let i = 0; i < 5; i++) ctx.fillRect(-80 + i * 38, -20, 18, 80); ctx.fillRect(-100, 66, 200, 14);
      txt(ctx, '!', 0, -38, { font: SERIF(40, 800), color: PAPER, align: 'center' }); }
    if (kind === 'eye') { ctx.beginPath(); ctx.moveTo(-100, 0); ctx.quadraticCurveTo(0, -80, 100, 0); ctx.quadraticCurveTo(0, 80, -100, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 28, 0, 6.283); ctx.fill(); ctx.fillStyle = INK; ctx.fillRect(-120, -14, 240, 28); }
    if (kind === 'ship') { ctx.beginPath(); ctx.moveTo(-120, 20); ctx.lineTo(-135, 0); ctx.lineTo(130, 0); ctx.lineTo(112, 20); ctx.fill();
      ctx.fillRect(30, -34, 24, 34); ctx.fillRect(38, -52, 6, 20);
      ctx.strokeStyle = '#3b6ea5'; ctx.lineWidth = 4; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-140 + i * 20, 40 + i * 14); ctx.lineTo(140 - i * 20, 40 + i * 14); ctx.stroke(); } }
    ctx.restore();
  }

  function card(ctx, c, t) {
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-CW / 2 + 12, -CH / 2 + 16, CW, CH);
    ctx.fillStyle = PAPER; ctx.fillRect(-CW / 2, -CH / 2, CW, CH);
    // date stamp
    ctx.save(); ctx.translate(-CW / 2 + 110, -CH / 2 + 62); ctx.rotate(-0.08);
    ctx.strokeStyle = RED; ctx.lineWidth = 4; ctx.strokeRect(-85, -26, 170, 52);
    txt(ctx, c.date, 0, 10, { font: MONO(24, 800), color: RED, align: 'center', ls: 2 });
    ctx.restore();
    icon(ctx, c.icon, 0, -CH / 2 + 205);
    txt(ctx, c.title, -CW / 2 + 32, 60, { font: SERIF(fit(ctx, c.title, s => SERIF(s), 50, CW - 60)), color: INK });
    c.lines.forEach((l, i) => txt(ctx, l, -CW / 2 + 32, 108 + i * 36, { font: SANS(25, 500), color: '#3d362d' }));
    if (c.quote) {
      ctx.fillStyle = '#d9cfbd'; ctx.fillRect(-CW / 2 + 32, 168, CW - 64, 2);
      txt(ctx, 'AÇIKLAMA:', -CW / 2 + 32, 210, { font: MONO(19, 800), color: MUTED, ls: 2 });
      txt(ctx, '“' + c.quote + '”', -CW / 2 + 32, 252, { font: ISERIF(32), color: INK });
    }
    ctx.restore();
    pin(ctx, c.x + Math.sin(c.rot) * (CH / 2 - 26), c.y - Math.cos(c.rot) * (CH / 2 - 26));
    // marker circle + handwritten note when the card is being discussed
    const s = S(c.id), p = ease.inOutCubic(prog(t, s.start + 0.5, 0.9));
    if (p > 0) {
      ctx.save(); ctx.translate(c.x, c.y); ctx.strokeStyle = 'rgba(200,40,30,0.9)'; ctx.lineWidth = 9; ctx.lineCap = 'round';
      ctx.beginPath();
      const n = Math.floor(80 * p * 1.08);
      for (let i = 0; i <= n; i++) {
        const a = -2.2 + (i / 80) * 6.283 * 1.08, wob = 1 + 0.03 * Math.sin(i * 0.7);
        const x = Math.cos(a) * (CW * 0.66) * wob, y = Math.sin(a) * (CH * 0.62) * wob;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke(); ctx.restore();
      const hp = prog(t, s.start + 1.4, 0.5);
      if (hp > 0) {
        ctx.save(); ctx.translate(c.x + CW * 0.18, c.y + CH * 0.62); ctx.rotate(-0.12);
        ctx.globalAlpha = hp; ctx.beginPath(); ctx.rect(-300, -80, 600 * hp, 120); ctx.clip();
        txt(ctx, c.hand, 0, 0, { font: HAND(68), color: RED, align: 'center' });
        ctx.restore();
      }
    }
  }

  function sticky(ctx, x, y, rot, col, text, t0, t, size = 50, w = 330, h = 300) {
    if (t < t0) return;
    const k = ease.outBack(prog(t, t0, 0.35), 2);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(lerp(1.3, 1, k), lerp(1.3, 1, k)); ctx.globalAlpha = prog(t, t0, 0.12);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-w / 2 + 10, -h / 2 + 14, w, h);
    ctx.fillStyle = col; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.06)'; ctx.fillRect(-w / 2, -h / 2, w, 40);
    const ls = text.split('\n');
    ls.forEach((l, i) => txt(ctx, l, 0, -((ls.length - 1) * size * 0.95) / 2 + i * size * 0.95 + size * 0.35, { font: HAND(size), color: INK, align: 'center' }));
    ctx.restore();
    pin(ctx, x, y - h / 2 + 22, '#2a6fdb');
  }

  function string(ctx, ax, ay, bx, by, p) {
    if (p <= 0) return;
    const mx = (ax + bx) / 2, my = (ay + by) / 2 + 60 + Math.hypot(bx - ax, by - ay) * 0.06;
    ctx.save(); ctx.strokeStyle = '#b3121b'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowOffsetY = 6; ctx.shadowBlur = 4;
    ctx.beginPath(); ctx.moveTo(ax, ay);
    const N = 30;
    for (let i = 1; i <= Math.floor(N * p); i++) {
      const k = i / N, x = (1 - k) * (1 - k) * ax + 2 * (1 - k) * k * mx + k * k * bx, y = (1 - k) * (1 - k) * ay + 2 * (1 - k) * k * my + k * k * by;
      ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.restore();
  }

  let corkPat = null;
  const pinOf = c => [c.x + Math.sin(c.rot) * (CH / 2 - 26), c.y - Math.cos(c.rot) * (CH / 2 - 26)];
  const CHUNKS = buildChunks(TL.words, 4);

  function board(ctx, t) {
    const c = keyframes(cam, t, ease.inOutCubic);
    ctx.save();
    ctx.translate(540, 900); ctx.scale(c.z, c.z); ctx.translate(-c.x, -c.y);
    if (!corkPat) corkPat = ctx.createPattern(cork, 'repeat');
    ctx.fillStyle = corkPat; ctx.fillRect(-1600, -1600, BW + 3200, BH + 3200);
    // title tape
    ctx.save(); ctx.translate(800, 150); ctx.rotate(-0.02);
    ctx.fillStyle = 'rgba(240,228,200,0.92)'; ctx.fillRect(-330, -55, 660, 110);
    txt(ctx, 'ABD · 12–17 KASIM', 0, 22, { font: HAND(74), color: INK, align: 'center' });
    ctx.restore();
    // strings first (under the cards' pins is fine; they run over the paper like a real board)
    const st = S('string');
    for (const cd of CARDS) card(ctx, cd, t);
    const qt = st.start + 0.2;
    sticky(ctx, Q.x, Q.y, Q.rot, YEL, 'NE\nOLUYOR?', qt, t, 92, 380, 360);
    CARDS.forEach((cd, i) => {
      const [px, py] = pinOf(cd);
      string(ctx, px, py, Q.x, Q.y - 158, ease.inOutCubic(prog(t, st.start + 1.0 + i * 0.75, 0.8)));
    });
    NOTES.forEach(n => {
      const s = S(n.id);
      sticky(ctx, n.x, n.y, n.rot, n.col, n.text, s.start - 0.1, t, 52);
      string(ctx, Q.x, Q.y - 158, n.x, n.y - 128, ease.inOutCubic(prog(t, s.start - 0.1, 0.6)));
    });
    ctx.restore();
  }

  function draw(ctx, t) {
    ctx.fillStyle = '#1a120b'; ctx.fillRect(0, 0, W, H);
    board(ctx, t);
    // warm desk-lamp light
    const g = ctx.createRadialGradient(540, 780, 200, 540, 900, 1250);
    g.addColorStop(0, 'rgba(255,220,160,0.08)'); g.addColorStop(1, 'rgba(10,5,0,0.7)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // header strip
    ctx.fillStyle = 'rgba(20,14,8,0.88)'; ctx.fillRect(0, 100, W, 110);
    txt(ctx, 'SORUŞTURMA PANOSU', 60, 172, { font: SANS(38, 900), color: '#f7f2e7', ls: 4 });
    ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(1000, 160, 12, 0, 6.283); ctx.fill();
    // count of pinned evidence
    const n = CARDS.filter(c => t >= S(c.id).start + 0.5).length;
    txt(ctx, `KANIT ${n}/5`, 975, 172, { font: MONO(26, 800), color: n ? YEL : '#8a7f70', align: 'right' });
    if (t < TL.duration - 3.2) captions(ctx, t, CHUNKS, { font: SANS(56, 900), color: '#ffffff', dim: 'rgba(255,255,255,0.5)', active: INK, activeBg: YEL, y: 1490, maxW: 900, lineH: 74, band: 'rgba(20,14,8,0.88)' });
    // end card
    const ea = prog(t, TL.duration - 3.2, 0.5);
    if (ea > 0) {
      ctx.save(); ctx.globalAlpha = ea; ctx.fillStyle = 'rgba(20,14,8,0.93)'; ctx.fillRect(0, 0, W, H);
      txt(ctx, 'Sence hangisi?', 540, 860, { font: HAND(130), color: YEL, align: 'center' });
      txt(ctx, 'BERLİN KONUŞUYOR', 540, 990, { font: SANS(60, 900), color: '#f7f2e7', align: 'center', ls: 4 });
      txt(ctx, 'Yorumlara yaz ↓', 540, 1070, { font: SANS(36, 500), color: '#cbbfa9', align: 'center' });
      txt(ctx, 'Kaynaklar: CNN · AP · ABC News · Al Jazeera · Washington Post · CBS · INSS', 540, 1480, { font: SANS(20, 500), color: '#8a7f70', align: 'center' });
      ctx.restore();
    }
    const fb = 1 - Math.min(prog(t, 0, 0.5), prog(-t, -TL.duration, 0.6));
    if (fb > 0) { ctx.fillStyle = `rgba(0,0,0,${fb})`; ctx.fillRect(0, 0, W, H); }
  }

  const st = S('string');
  window.VIDEO = {
    duration: TL.duration, draw,
    cues: [
      ...CARDS.map(c => ({ t: S(c.id).start + 0.5, type: 'marker' })),
      ...CARDS.map(c => ({ t: S(c.id).start - 0.1, type: 'whoosh', gain: 0.4 })),
      { t: st.start + 0.2, type: 'slap' },
      ...CARDS.map((c, i) => ({ t: st.start + 1.0 + i * 0.75, type: 'twang' })),
      ...NOTES.map(n => ({ t: S(n.id).start - 0.1, type: 'slap' })),
      { t: TL.duration - 3.2, type: 'end' },
    ],
  };
})();
