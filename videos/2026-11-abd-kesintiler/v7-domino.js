/*
 * VİDEO 7 — "Domino Etkisi" · seslendirmesiz, sade ve aydınlık · 90 sn
 * Each system is a domino that tips over on its day; three small demos weigh the
 * possibilities, and a lone "?" domino asks what falls next.
 */
(() => {
  const NAVY = '#18202e', RED = '#e0392b', GREY = '#6b7483', LIGHT = '#f2f4f7';
  const SANS = (s, w = 900) => `${w} ${s}px Inter`;
  const MONO = (s, w = 700) => `${w} ${s}px "JetBrains Mono"`;
  const FLOOR = 1250, DW = 160, DH = 480, GAP = 420, FALL = 0.55;

  const D = [
    { n: 1, label: 'E-POSTA', sub: 'Microsoft 365', date: '12 KASIM', icon: 'mail', s: 6.5, e: 14, head: 'E-posta *devrildi.*', detail: 'Microsoft 365 · 18+ saat kesinti', pill: 'Açıklama: “sunucu arızaları”' },
    { n: 2, label: 'GÖKYÜZÜ', sub: 'FAA', date: '13 KASIM', icon: 'plane', s: 14, e: 23.5, head: 'Gökyüzü *kapandı.*', detail: 'ABD\'de tüm uçuşlar durdu · 10.000+ rötar', pill: 'Açıklama: “tek bir router”' },
    { n: 3, label: 'İK', sub: 'Workday', date: '13–14 KASIM', icon: 'doc', s: 23.5, e: 29.5, head: 'Workday de *çöktü.*', detail: 'İK ve bordro platformu erişilemedi', pill: 'Aynı günlerde' },
    { n: 4, label: 'PARA', sub: 'Bankalar', date: '16 KASIM', icon: 'bank', s: 29.5, e: 38.5, head: 'Para *kilitlendi.*', detail: 'Chase · BofA · Wells Fargo · Zelle', pill: 'Açıklama: “yazılım hatası”' },
    { n: 5, label: 'İSTİHBARAT', sub: 'NSA', date: '17 KASIM', icon: 'eye', s: 38.5, e: 46, head: 'İstihbarat *karardı.*', detail: 'NSA\'nın gizli iç ağı çöktü', pill: 'Açıklama: “rutin bakım”' },
  ].map((d, i) => ({ ...d, x: i * GAP, fall: d.s + 1.7 }));
  const GULF = { s: 46, e: 57 }, ASK = { s: 57, e: 61 };
  const SC = [{ s: 61, e: 66.4 }, { s: 66.4, e: 71.8 }, { s: 71.8, e: 77.2 }];
  const NEXT = { s: 77.2, e: 86.2 }, END = 86.2;

  function icon(ctx, kind, x, y, s, col) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 7; ctx.lineJoin = 'round';
    if (kind === 'mail') { ctx.strokeRect(-45, -30, 90, 60); ctx.beginPath(); ctx.moveTo(-45, -30); ctx.lineTo(0, 6); ctx.lineTo(45, -30); ctx.stroke(); }
    if (kind === 'plane') { ctx.rotate(-Math.PI / 2); ctx.scale(0.38, 0.38); ctx.beginPath();
      ctx.moveTo(120, 0); ctx.quadraticCurveTo(110, -12, 80, -12); ctx.lineTo(-90, -10); ctx.lineTo(-120, -50); ctx.lineTo(-138, -50); ctx.lineTo(-118, -6);
      ctx.lineTo(-118, 6); ctx.lineTo(-138, 18); ctx.lineTo(-120, 18); ctx.lineTo(-90, 10); ctx.lineTo(80, 12); ctx.quadraticCurveTo(110, 12, 120, 0); ctx.fill();
      ctx.beginPath(); ctx.moveTo(10, -8); ctx.lineTo(-40, -95); ctx.lineTo(-62, -95); ctx.lineTo(-30, -8); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(10, 8); ctx.lineTo(-40, 95); ctx.lineTo(-62, 95); ctx.lineTo(-30, 8); ctx.closePath(); ctx.fill(); }
    if (kind === 'doc') { ctx.strokeRect(-32, -42, 64, 84); for (let i = 0; i < 3; i++) ctx.fillRect(-20, -22 + i * 20, 40, 6); }
    if (kind === 'bank') { ctx.beginPath(); ctx.moveTo(-48, -14); ctx.lineTo(0, -42); ctx.lineTo(48, -14); ctx.closePath(); ctx.fill();
      for (let i = 0; i < 4; i++) ctx.fillRect(-38 + i * 22, -8, 10, 40); ctx.fillRect(-50, 34, 100, 8); }
    if (kind === 'eye') { ctx.beginPath(); ctx.moveTo(-50, 0); ctx.quadraticCurveTo(0, -42, 50, 0); ctx.quadraticCurveTo(0, 42, -50, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 14, 0, 6.283); ctx.fill(); }
    if (kind === 'q') txt(ctx, '?', 0, 30, { font: SANS(96), color: col, align: 'center' });
    ctx.restore();
  }

  /** Angle of a domino that starts falling at tf (gravity-like ease, small bounce). */
  function angle(t, tf, dur = FALL) {
    if (t < tf) return 0;
    const p = clamp((t - tf) / dur);
    let a = (Math.PI / 2) * p * p;
    if (p >= 1) { const b = t - tf - dur; a = Math.PI / 2 - Math.abs(Math.sin(b * 18)) * Math.exp(-b * 9) * 0.12; }
    return a;
  }

  /** Angles for a row: each falling domino leans on its standing neighbour, and follows it down. */
  function rowAngles(t, falls, gap, s, dur = FALL) {
    const w = DW * s, h = DH * s, n = falls.length, out = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
      const free = angle(t, falls[i], dur);
      if (i === n - 1) { out[i] = free; continue; }
      const phi = out[i + 1];
      const target = Math.asin(clamp((gap - w + h * Math.sin(phi)) / h, 0, 1));
      out[i] = Math.min(free, target, Math.acos(w / h)); // finally rests on top of the fallen neighbour
    }
    return out;
  }

  /** A domino standing on the floor at (x, floor), pivoting on its right bottom edge. */
  function domino(ctx, x, floor, a, s, d, o = {}) {
    const w = DW * s, h = DH * s, dep = 22 * s;
    // shadow
    ctx.fillStyle = 'rgba(24,32,46,0.16)';
    ctx.beginPath(); ctx.ellipse(x + w / 2 + Math.sin(a) * h * 0.5, floor + 6, w * 0.7 + Math.sin(a) * h * 0.5, 12 * s, 0, 0, 6.283); ctx.fill();
    ctx.save(); ctx.translate(x + w, floor); ctx.rotate(a + (o.wob || 0));
    // depth faces
    ctx.fillStyle = o.side || '#0d131d';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(dep, -dep * 0.7); ctx.lineTo(dep, -h - dep * 0.7); ctx.lineTo(0, -h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = o.top || '#2e3a50';
    ctx.beginPath(); ctx.moveTo(-w, -h); ctx.lineTo(-w + dep, -h - dep * 0.7); ctx.lineTo(dep, -h - dep * 0.7); ctx.lineTo(0, -h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = o.face || NAVY; rrect(ctx, -w, -h, w, h, 10 * s); ctx.fill();
    if (o.cracks) { ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2.5 * s; ctx.beginPath();
      ctx.moveTo(-w * 0.8, -h * 0.9); ctx.lineTo(-w * 0.55, -h * 0.75); ctx.lineTo(-w * 0.65, -h * 0.6); ctx.lineTo(-w * 0.35, -h * 0.45);
      ctx.moveTo(-w * 0.2, -h * 0.3); ctx.lineTo(-w * 0.45, -h * 0.18); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(-w * 0.85, -h / 2 - 2 * s, w * 0.7, 4 * s);
    if (d) {
      icon(ctx, d.icon, -w / 2, -h * 0.74, s, '#ffffff');
      txt(ctx, String(d.n), -w / 2, -h * 0.17, { font: SANS(80 * s), color: a > 0.1 ? RED : '#ffffff', align: 'center' });
    }
    ctx.restore();
  }

  // ---------- camera ----------
  const mid = (D[4].x + DW) / 2;
  const CAM = [{ t: 0, x: mid + 60, z: 0.5 }, { t: 5.5, x: mid + 60, z: 0.53 }];
  D.forEach(d => { CAM.push({ t: d.s + 0.2, x: d.x + DW + 100, z: 0.95 }, { t: d.e - 0.6, x: d.x + DW + 130, z: 1.0 }); });
  CAM.push({ t: 45.5, x: mid + 200, z: 0.45 }, { t: 90, x: mid + 200, z: 0.43 });

  function row(ctx, t) {
    const c = keyframes(CAM, t, ease.inOutCubic);
    const a = win(t, -1, GULF.s + 0.3, 0.1, 0.5) + 0.22 * win(t, ASK.s, SC[0].s, 0.3, 0.3);
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = Math.max(0, a);
    ctx.translate(540, FLOOR); ctx.scale(c.z, c.z); ctx.translate(-c.x, -FLOOR);
    const ang = rowAngles(t, D.map(d => d.fall), GAP, 1);
    for (const [i, d] of D.entries()) {
      domino(ctx, d.x, FLOOR, ang[i], 1, d);
      const fa = d.fall < t ? 1 : 0.55;
      txt(ctx, d.label, d.x + DW / 2, FLOOR + 70, { font: SANS(34, 900), color: NAVY, align: 'center', alpha: fa });
      txt(ctx, d.date, d.x + DW / 2, FLOOR + 112, { font: MONO(24), color: RED, align: 'center', alpha: fa });
    }
    ctx.restore();
  }

  function bg(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#f6f7f9'); g.addColorStop(FLOOR / H, '#e9ecf1'); g.addColorStop(FLOOR / H + 0.001, '#dde2e9'); g.addColorStop(1, '#cfd5de');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(24,32,46,0.12)'; ctx.fillRect(0, FLOOR, W, 2);
  }

  const HEAD = { font: SANS(96), emFont: SANS(96), color: NAVY, emColor: RED, maxW: 940, lineH: 104, align: 'left', stagger: 0.08, dur: 0.6 };

  function block(ctx, t, s, e, kicker, head, detail, pill, y = 360) {
    const a = win(t, s, e, 0.3, 0.35); if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    if (kicker) { const k = ease.outExpo(prog(t, s, 0.4)); ctx.fillStyle = RED; ctx.fillRect(70, y - 40, 60 * k, 6);
      txt(ctx, kicker, 150, y - 26, { font: MONO(30), color: RED, ls: 3, alpha: k }); }
    const hh = words(ctx, head, 70, y + 80, t, { ...HEAD, start: s + 0.3 }) ;
    if (detail) words(ctx, detail, 70, y + 80 + hh, t, { font: SANS(38, 600), color: GREY, maxW: 940, lineH: 50, start: s + 1.6, stagger: 0.04 });
    if (pill) { const p = ease.outBack(prog(t, s + 3.0, 0.35), 2); if (p > 0) {
      ctx.font = SANS(34, 800); const w = ctx.measureText(pill).width + 60;
      ctx.save(); ctx.translate(70, 1470); ctx.scale(p, p); ctx.fillStyle = NAVY; rrect(ctx, 0, -46, w, 76, 38); ctx.fill();
      txt(ctx, pill, 30, 4, { font: SANS(34, 800), color: '#ffffff' }); ctx.restore(); } }
    ctx.restore();
  }

  function gulf(ctx, t) {
    const a = win(t, GULF.s, GULF.e, 0.5, 0.4); if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    // sea strip on the floor line
    const g = ctx.createLinearGradient(0, 1080, 0, 1500); g.addColorStop(0, '#2a4a6e'); g.addColorStop(1, '#14263b');
    ctx.fillStyle = g; ctx.fillRect(0, 1120, W, 360);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 3;
    for (let i = 0; i < 9; i++) { const y = 1150 + i * 36, off = (t * 40 + i * 70) % 160;
      ctx.beginPath(); for (let x = -160 + off; x < W + 160; x += 160) { ctx.moveTo(x, y); ctx.lineTo(x + 70, y); } ctx.stroke(); }
    ['ROOSEVELT', 'BUSH', 'WASHINGTON'].forEach((n, i) => {
      const k = ease.outCubic(prog(t, GULF.s + 1.6 + i * 0.5, 0.8)); if (k <= 0) return;
      const x = lerp(-300, 220 + i * 330, k), y = 1125;
      ctx.save(); ctx.translate(x, y); ctx.fillStyle = NAVY;
      ctx.beginPath(); ctx.moveTo(-130, 0); ctx.lineTo(-146, -16); ctx.lineTo(142, -16); ctx.lineTo(122, 0); ctx.fill();
      ctx.fillRect(34, -42, 26, 26); ctx.fillRect(42, -60, 6, 20); ctx.restore();
      txt(ctx, n, x, 1190, { font: MONO(24), color: '#ffffff', align: 'center' });
    });
    block(ctx, t, GULF.s, GULF.e, 'AYNI HAFTA · ORTA DOĞU', 'Ve tam bu sırada…', 'Üçüncü uçak gemisi İran açıklarına ulaştı.', null);
    [['3', 'uçak gemisi'], ['13', 'muhrip'], ['~50.000', 'asker']].forEach(([n, l], i) => {
      const k = ease.outBack(prog(t, GULF.s + 4.5 + i * 0.5, 0.4), 2); if (k <= 0) return;
      const x = 70 + i * 320;
      ctx.save(); ctx.translate(x + 140, 1310); ctx.scale(k, k);
      ctx.fillStyle = '#ffffff'; rrect(ctx, -140, -70, 290, 140, 20); ctx.fill();
      txt(ctx, n, 5, 6, { font: SANS(n.length > 3 ? 52 : 64), color: RED, align: 'center' });
      txt(ctx, l, 5, 48, { font: SANS(26, 700), color: GREY, align: 'center' });
      ctx.restore();
    });
    const pa = prog(t, GULF.s + 7, 0.4);
    if (pa > 0) { ctx.fillStyle = NAVY; rrect(ctx, 70, 1430, 520, 76, 38); ctx.fill(); txt(ctx, 'İran ablukası sürüyor', 100, 1480, { font: SANS(34, 800), color: '#fff', alpha: pa }); }
    ctx.restore();
  }

  /** Mini row of five dominoes for the scenario demos. falls: array of fall times. */
  function mini(ctx, t, falls, o = {}) {
    const s = 0.5, x0 = 110, gap = 170;
    const ang = rowAngles(t, falls, gap, s, o.fast ? 0.32 : FALL);
    for (let i = 0; i < 5; i++) {
      const wob = o.wobble && t < falls[i] ? Math.sin(t * 9 + i * 1.7) * 0.03 : 0;
      domino(ctx, x0 + i * gap, 1250, ang[i], s, D[i], { cracks: o.cracks, wob });
    }
  }

  function scenario(ctx, t, i) {
    const { s, e } = SC[i]; const a = win(t, s, e, 0.3, 0.3); if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    const heads = ['Eskiyen *altyapı*', 'Domino *etkisi*', 'Bilinmeyen *bir el?*'];
    const det = ['Sistemler yaşlandı, kendi kendine devriliyor. Bakan Duffy de “sistem eski” diyor.',
      'Her şey birbirine bağlı. Tek bir hata hepsini yıkıyor; tek router bütün gökyüzünü kapattı.',
      'Görünmeyen bir etken mi? Şu an buna dair hiçbir kanıt yok. Ama soru ortada.'];
    block(ctx, t, s, e, `İHTİMAL ${i + 1} / 3`, heads[i], det[i], null, 340);
    if (i === 0) mini(ctx, t, [s + 1.6, s + 3.4, s + 2.3, s + 4.2, s + 2.9], { cracks: true, wobble: true });
    if (i === 1) {
      const t0 = s + 1.8; mini(ctx, t, [0, 1, 2, 3, 4].map(k => t0 + k * 0.25), { fast: true });
      const px = lerp(-40, 95, ease.inCubic(prog(t, t0 - 0.5, 0.5)));
      ctx.fillStyle = RED; ctx.beginPath(); ctx.moveTo(px, 1080); ctx.lineTo(px - 60, 1050); ctx.lineTo(px - 60, 1110); ctx.closePath(); ctx.fill();
      ctx.fillRect(px - 120, 1070, 64, 20);
    }
    if (i === 2) {
      const t0 = s + 2.2;
      const sh = prog(t, s + 0.6, 1.2) * (1 - prog(t, t0 + 0.6, 0.8));
      ctx.save(); ctx.globalAlpha = a * 0.55 * sh; ctx.fillStyle = '#0b0f17';
      ctx.beginPath(); ctx.ellipse(70, 1060, 110, 200, 0, 0, 6.283); ctx.fill();
      txt(ctx, '?', 70, 1110, { font: SANS(160), color: '#ffffff', align: 'center' }); ctx.restore();
      mini(ctx, t, [0, 1, 2, 3, 4].map(k => t0 + k * 0.32), { fast: true });
    }
    ctx.restore();
  }

  function next(ctx, t) {
    const { s, e } = NEXT; const a = win(t, s, END + 1, 0.4, 0.4); if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    const wob = Math.sin(t * 5.5) * 0.06 * (0.6 + 0.4 * Math.sin(t * 1.3));
    domino(ctx, 460, 1240, 0, 0.85, { n: '?', icon: 'q' }, { wob, face: RED, side: '#9a2318', top: '#f0675a' });
    block(ctx, t, s, e, 'VE ŞİMDİ', 'Sıradaki *hangisi?*', 'Kanıt yok. Ama soru ortada.', 'Sence? Yorumlara yaz', 340);
    ctx.restore();
  }

  function draw(ctx, t) {
    bg(ctx);
    row(ctx, t);
    block(ctx, t, 0.3, 6.2, 'ABD · 12–17 KASIM', 'Bu normal *değil.*', '6 günde 5 kritik sistem devrildi. Hepsinin açıklaması: “arıza”.', null);
    D.forEach(d => block(ctx, t, d.s, d.e - 0.1, d.date, d.head, d.detail, d.pill));
    gulf(ctx, t);
    const qa = win(t, ASK.s, ASK.e + 0.2, 0.3, 0.3);
    if (qa > 0) { ctx.save(); ctx.globalAlpha = qa;
      const k = ease.outBack(prog(t, ASK.s, 0.5), 1.6); ctx.translate(540, 800); ctx.scale(k, k);
      txt(ctx, 'ACABA NE', 0, -40, { font: SANS(140), color: NAVY, align: 'center' });
      txt(ctx, 'OLUYOR?', 0, 110, { font: SANS(140), color: RED, align: 'center' }); ctx.restore(); }
    SC.forEach((_, i) => scenario(ctx, t, i));
    next(ctx, t);
    const ea = prog(t, END, 0.6);
    if (ea > 0) {
      ctx.save(); ctx.globalAlpha = ea; ctx.fillStyle = NAVY; ctx.fillRect(0, 0, W, H);
      txt(ctx, 'BERLİN KONUŞUYOR', 540, 900, { font: SANS(80), color: '#fff', align: 'center', ls: 2 });
      txt(ctx, 'DOMİNO ETKİSİ', 540, 980, { font: MONO(32), color: '#ff6b5e', align: 'center', ls: 6 });
      txt(ctx, 'Kaynaklar: CNN · AP · ABC News · Al Jazeera · Washington Post · CBS · INSS', 540, 1480, { font: MONO(18, 500), color: '#9aa3b2', align: 'center' });
      ctx.restore();
    }
    const fb = 1 - Math.min(prog(t, 0, 0.4), prog(-t, -90, 0.6));
    if (fb > 0) { ctx.fillStyle = `rgba(0,0,0,${fb})`; ctx.fillRect(0, 0, W, H); }
  }

  const cues = [];
  D.forEach(d => { cues.push({ t: d.fall + FALL, type: 'knock', gain: 1 }); cues.push({ t: d.s, type: 'whoosh' }); });
  cues.push({ t: GULF.s, type: 'whoosh' }, { t: ASK.s, type: 'hit' });
  [[1.6, 3.4, 2.3, 4.2, 2.9].map(x => SC[0].s + x + FALL), [0, 1, 2, 3, 4].map(k => SC[1].s + 1.8 + k * 0.25 + 0.32), [0, 1, 2, 3, 4].map(k => SC[2].s + 2.2 + k * 0.32 + 0.32)]
    .flat().forEach(t => cues.push({ t, type: 'knock', gain: 0.5 }));
  SC.forEach(s => cues.push({ t: s.s, type: 'whoosh' }));
  cues.push({ t: NEXT.s, type: 'hit' }, { t: END, type: 'end' });
  window.VIDEO = { duration: 90, draw, cues };
})();
