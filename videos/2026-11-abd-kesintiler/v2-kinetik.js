/*
 * VİDEO 2 — "6 Gün, 5 Çöküş" · enerjik, kinetik · 90 sn
 * Every cut lands on the beat of a 128 BPM track (48 bars = 90 s).
 */
(() => {
  const BPM = 128, BT = 60 / BPM, at = b => b * BT;
  const BG = '#0b0b0c', Y = '#FFD400', RED = '#FF3B2F', WH = '#F5F5F0', GREY = '#6d6d6d';
  const A = s => `400 ${s}px Anton`;
  const M = (s, w = 600) => `${w} ${s}px "JetBrains Mono"`;

  // Beats on which something slams in; they drive camera shake and audio hits.
  const HITS = [];
  let REG = true;
  const hit = (b, amp = 1) => { if (REG) HITS.push({ t: at(b), amp }); return b; };

  /** Text that slams in at beat b with RGB split, scaled to fit maxW. */
  function slam(ctx, t, b, s, x, y, o = {}) {
    const t0 = at(b); if (t < t0) return;
    const f = o.font || A;
    const size = fit(ctx, s, f, o.size || 160, o.maxW || 920, o.ls || 0);
    const p = prog(t, t0, 0.24), e = ease.outExpo(p);
    const sc = 1 + (1 - e) * (o.from || 0.8);
    ctx.save();
    ctx.translate(x, y); ctx.scale(sc, sc);
    ctx.font = f(size); ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = (o.ls || 0) + 'px';
    ctx.globalAlpha = clamp((t - t0) / 0.04) * (o.alpha == null ? 1 : o.alpha);
    const k = (1 - prog(t, t0, 0.2)) * 22;
    if (k > 0.5) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = '#ff2a4a'; ctx.fillText(s, -k, 0);
      ctx.fillStyle = '#00d5ff'; ctx.fillText(s, k, 0);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.fillStyle = o.color || WH; ctx.fillText(s, 0, 0);
    ctx.restore();
    return size;
  }

  /** Small mono label that types itself in. */
  function type(ctx, t, b, s, x, y, o = {}) {
    const t0 = at(b); if (t < t0) return;
    const n = Math.floor((t - t0) * 60);
    const shown = s.slice(0, n);
    txt(ctx, shown + (n < s.length && Math.floor(t * 8) % 2 ? '▌' : ''), x, y, { font: M(o.size || 34), color: o.color || Y, align: o.align || 'left', ls: 2 });
  }

  function counter(ctx, t, b, to, x, y, o = {}) {
    const t0 = at(b); if (t < t0) return;
    const v = to * ease.outCubic(prog(t, t0, o.dur || BT * 3));
    slam(ctx, t, b, (o.pre || '') + fmtNum(v) + (o.post || ''), x, y, { ...o, from: 0.3 });
  }

  function strike(ctx, t, b, x, y, w, color = RED) {
    const p = ease.outExpo(prog(t, at(b), 0.25)); if (p <= 0) return;
    ctx.fillStyle = color; ctx.fillRect(x, y - 7, w * p, 14);
  }

  /** Big outlined index, date chip and section title. */
  function header(ctx, t, b, num, date, title, bEnd) {
    const t0 = at(b); if (t < t0 || t > at(bEnd)) return;
    const p = ease.outExpo(prog(t, t0, 0.4));
    ctx.save();
    ctx.globalAlpha = p;
    txt(ctx, num, 80 - (1 - p) * 120, 520, { font: A(260), stroke: Y, lw: 4 });
    const dp = ease.outExpo(prog(t, t0 + BT, 0.35));
    ctx.font = A(46); ctx.letterSpacing = '3px'; const dw = ctx.measureText(date).width + 44;
    ctx.fillStyle = Y; ctx.fillRect(80, 560, dw * dp, 70);
    if (dp > 0.6) txt(ctx, date, 102, 612, { font: A(46), color: BG, ls: 3 });
    ctx.restore();
    slam(ctx, t, b + 2, title, 80, 730, { size: 120, align: 'left', from: 0.4 });
  }

  /** Full-screen yellow wipe that fully covers the frame at beat b. */
  function wipe(ctx, t, b, color = Y) {
    const p = prog(t, at(b) - 0.32, 0.64); if (p <= 0 || p >= 1) return;
    const x = lerp(-1700, 1700, ease.inOutCubic(p));
    ctx.save(); ctx.fillStyle = color; ctx.translate(x, 0);
    ctx.beginPath(); ctx.moveTo(-500, 0); ctx.lineTo(1500, 0); ctx.lineTo(1100, H); ctx.lineTo(-900, H); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function plane(ctx, x, y, s, color) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(120, 0); ctx.quadraticCurveTo(110, -12, 80, -12); ctx.lineTo(-90, -10); ctx.lineTo(-120, -50); ctx.lineTo(-138, -50); ctx.lineTo(-118, -6);
    ctx.lineTo(-118, 6); ctx.lineTo(-138, 18); ctx.lineTo(-120, 18); ctx.lineTo(-90, 10); ctx.lineTo(80, 12); ctx.quadraticCurveTo(110, 12, 120, 0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(10, -8); ctx.lineTo(-40, -95); ctx.lineTo(-62, -95); ctx.lineTo(-30, -8); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(10, 8); ctx.lineTo(-40, 95); ctx.lineTo(-62, 95); ctx.lineTo(-30, 8); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function router(ctx, t, b, x, y) {
    const t0 = at(b); if (t < t0) return;
    const p = ease.outBack(prog(t, t0, 0.35));
    ctx.save(); ctx.translate(x, y); ctx.scale(p, p);
    // request flood
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2 + 0.1;
      ctx.strokeStyle = 'rgba(255,212,0,0.18)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * 150, Math.sin(a) * 80); ctx.lineTo(Math.cos(a) * 600, Math.sin(a) * 340); ctx.stroke();
      for (let k = 0; k < 3; k++) {
        const q = ((t - t0) * 2.2 + k / 3 + hash(i) ) % 1;
        const r = lerp(150, 600, q);
        ctx.fillStyle = Y; ctx.globalAlpha = 1 - q;
        ctx.fillRect(Math.cos(a) * r - 5, Math.sin(a) * r * 0.567 - 5, 10, 10);
      }
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = BG; ctx.strokeStyle = WH; ctx.lineWidth = 6;
    rrect(ctx, -150, -45, 300, 90, 16); ctx.fill(); ctx.stroke();
    ctx.fillRect(-110, -110, 8, 65); ctx.fillRect(102, -110, 8, 65);
    ctx.fillStyle = WH; ctx.fillRect(-110, -110, 8, 65); ctx.fillRect(102, -110, 8, 65);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = hash(Math.floor(t * 14) * 7 + i) > 0.4 ? RED : '#3a1210';
      ctx.beginPath(); ctx.arc(-90 + i * 45, 0, 10, 0, 6.283); ctx.fill();
    }
    ctx.restore();
  }

  function carrier(ctx, x, y, s, color) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(-160, 0); ctx.lineTo(-180, -18); ctx.lineTo(175, -18); ctx.lineTo(150, 0); ctx.fill();
    ctx.fillRect(40, -46, 30, 28); ctx.fillRect(50, -66, 7, 22);
    ctx.restore();
  }

  function chips(ctx, t, b, list, y0) {
    ctx.font = A(62); ctx.letterSpacing = '2px';
    let x = 80, y = y0; const h = 100, gap = 18;
    list.forEach((s, i) => {
      const w = ctx.measureText(s).width + 52;
      if (x + w > 1000) { x = 80; y += h + gap; }
      const t0 = at(b + i);
      if (t >= t0) {
        const p = ease.outBack(prog(t, t0, 0.3), 2.2);
        ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(p, p);
        ctx.fillStyle = '#1b1b1d'; ctx.strokeStyle = WH; ctx.lineWidth = 4;
        rrect(ctx, -w / 2, -h / 2, w, h, 14); ctx.fill(); ctx.stroke();
        txt(ctx, s, 0, 22, { font: A(62), color: WH, align: 'center', ls: 2 });
        // goes down: red bar slams across
        const d = ease.outExpo(prog(t, at(b + 8) + i * BT * 0.3, 0.2));
        if (d > 0) { ctx.fillStyle = RED; ctx.globalAlpha = 0.92; rrect(ctx, -w / 2, -h / 2, w * d, h, 14); ctx.fill();
          ctx.globalAlpha = 1; if (d > 0.9) txt(ctx, 'DOWN', 0, 22, { font: A(62), color: WH, align: 'center', ls: 6 }); }
        ctx.restore();
      }
      x += w + gap;
    });
  }

  // ---------- shots: [fromBeat, toBeat, draw] — hard cuts between them ----------
  const SHOTS = [];
  const shot = (b0, b1, fn) => SHOTS.push({ b0, b1, fn });

  // HOOK
  shot(0, 4, (c, t) => { type(c, t, 0, 'ABD · 12–17 KASIM 2026', 540, 640, { align: 'center' }); slam(c, t, hit(0, 1.4), '6 GÜN', 540, 960, { size: 380 }); });
  shot(4, 8, (c, t) => slam(c, t, hit(4, 1.4), '5 ÇÖKÜŞ', 540, 960, { size: 330, color: Y }));
  shot(8, 12, (c, t) => slam(c, t, hit(8, 1.4), '1 SORU', 540, 960, { size: 380, color: RED }));
  shot(12, 16, (c, t) => { slam(c, t, hit(12), 'TESADÜF', 540, 820, { size: 260 }); slam(c, t, hit(13.5, 1.5), 'MÜ?', 540, 1150, { size: 300, color: Y }); });

  // 01 MICROSOFT
  const S1 = 16;
  shot(S1, S1 + 10, (c, t) => {
    header(c, t, hit(S1), '01', '12 KASIM · PERŞEMBE', 'MICROSOFT 365', 999);
    ['OUTLOOK', 'TEAMS', 'COPILOT', 'EXCHANGE'].forEach((s, i) => {
      const b = hit(S1 + 4 + i * 0.5, 0.5); const y = 900 + i * 130;
      const dim = prog(t, at(S1 + 7 + i * 0.25), 0.2);
      slam(c, t, b, s, 80, y, { size: 110, align: 'left', from: 0.3, color: dim > 0.5 ? GREY : WH });
      c.font = A(110); const w = c.measureText(s).width;
      strike(c, t, S1 + 7 + i * 0.25, 70, y, w + 20);
    });
  });
  shot(S1 + 10, S1 + 20, (c, t) => {
    header(c, t, S1, '01', '12 KASIM · PERŞEMBE', 'MICROSOFT 365', 999);
    counter(c, t, hit(S1 + 10), 18, 80, 1000, { post: '+', size: 330, color: Y, align: 'left' });
    slam(c, t, S1 + 12, 'SAAT KESİNTİ', 80, 1170, { size: 90, align: 'left', from: 0.3 });
    slam(c, t, hit(S1 + 14), 'DÜNYA ÇAPINDA', 80, 1330, { size: 120, align: 'left', color: Y });
    type(c, t, S1 + 15, 'BAZI RAPORLARA GÖRE 74 ÜLKE', 80, 1430);
  });

  // 02 FAA
  const S2 = 36;
  shot(S2, S2 + 12, (c, t) => {
    header(c, t, hit(S2), '02', '13 KASIM · CUMA', 'HAVA SAHASI', 999);
    const stop = at(S2 + 6), start = at(S2 + 3);
    if (t > start) { // plane glides in and brakes hard on the beat
      const k = ease.outExpo(prog(t, start, stop - start));
      plane(c, lerp(-300, 560, k), 935, 1.05, t > stop ? RED : WH);
    }
    slam(c, t, hit(S2 + 6, 1.6), 'DUR.', 540, 1200, { size: 260, color: RED });
    slam(c, t, S2 + 8, 'ABD\'DEKİ TÜM HAVALİMANLARINDA', 540, 1390, { size: 64, from: 0.2 });
    slam(c, t, S2 + 9, 'UÇUŞLAR DURDURULDU', 540, 1470, { size: 64, from: 0.2, color: Y });
  });
  shot(S2 + 12, S2 + 20, (c, t) => {
    header(c, t, S2, '02', '13 KASIM · CUMA', 'HAVA SAHASI', 999);
    counter(c, t, hit(S2 + 12), 10000, 80, 960, { post: '+', size: 250, color: Y, align: 'left' });
    slam(c, t, S2 + 13, 'UÇUŞ RÖTAR', 80, 1100, { size: 80, align: 'left', from: 0.3 });
    slam(c, t, hit(S2 + 16), '4+ SAAT', 80, 1280, { size: 170, align: 'left' });
    type(c, t, S2 + 17, '2023\'TEN BERİ İLK ÜLKE ÇAPINDA DURMA', 80, 1390);
  });
  shot(S2 + 20, S2 + 28, (c, t) => {
    slam(c, t, hit(S2 + 20, 1.3), 'SEBEP?', 540, 560, { size: 200, color: Y });
    router(c, t, S2 + 22, 540, 960);
    slam(c, t, hit(S2 + 23, 1.2), 'TEK BİR ROUTER.', 540, 1330, { size: 140 });
    type(c, t, S2 + 24, '4–5 SANİYEDE 1.000+ BAĞLANTI İSTEĞİ', 540, 1430, { align: 'center', size: 32 });
  });
  shot(S2 + 28, S2 + 32, (c, t) => {
    slam(c, t, hit(S2 + 28), 'AYNI GÜNLERDE', 540, 860, { size: 110 });
    slam(c, t, hit(S2 + 29.5, 1.2), 'WORKDAY DE ÇÖKTÜ', 540, 1040, { size: 150, color: Y });
  });

  // 03 BANKS
  const S3 = 68;
  shot(S3, S3 + 16, (c, t) => {
    header(c, t, hit(S3), '03', '16 KASIM · PAZARTESİ', 'BANKALAR', 999);
    [0, 1, 2, 3, 4, 5, 6].forEach(i => hit(S3 + 4 + i, 0.4));
    chips(c, t, S3 + 4, ['CHASE', 'BANK OF AMERICA', 'WELLS FARGO', 'U.S. BANK', 'CAPITAL ONE', 'TRUIST', 'ZELLE'], 830);
  });
  shot(S3 + 16, S3 + 28, (c, t) => {
    header(c, t, S3, '03', '16 KASIM · PAZARTESİ', 'BANKALAR', 999);
    counter(c, t, hit(S3 + 16), 5000, 80, 960, { pre: '~', size: 250, color: Y, align: 'left' });
    slam(c, t, S3 + 17, 'ŞİKAYET · SADECE CHASE\'TE', 80, 1090, { size: 64, align: 'left', from: 0.3 });
    if (t > at(S3 + 20)) txt(c, '“', 70, 1400, { font: A(260), color: Y, alpha: ease.outExpo(prog(t, at(S3 + 20), 0.3)) });
    slam(c, t, hit(S3 + 20), 'YAZILIM HATASI.', 200, 1270, { size: 110, align: 'left', from: 0.3, maxW: 800 });
    slam(c, t, hit(S3 + 22, 1.2), 'SİBER SALDIRI DEĞİL.', 200, 1390, { size: 90, align: 'left', from: 0.3, color: RED, maxW: 800 });
    type(c, t, S3 + 23, '— JPMORGAN CHASE', 200, 1480, { color: GREY });
  });
  shot(S3 + 28, S3 + 36, (c, t) => {
    slam(c, t, hit(S3 + 28), 'AKŞAM DÜZELDİ.', 540, 860, { size: 140 });
    slam(c, t, hit(S3 + 32, 1.6), 'AMA…', 540, 1100, { size: 300, color: Y });
  });

  // 04 NSA (breakdown)
  const S4 = 104;
  shot(S4, S4 + 12, (c, t) => {
    header(c, t, hit(S4), '04', '17 KASIM · BUGÜN', 'NSA', 999);
    ['ABD\'NİN', 'EN GİZLİ', 'İLETİŞİM AĞI'].forEach((s, i) => {
      const y = 900 + i * 135;
      slam(c, t, hit(S4 + 4 + i, 0.5), s, 80, y, { size: 120, align: 'left', from: 0.3 });
      const r = ease.outExpo(prog(t, at(S4 + 8 + i * 0.5), 0.3));
      if (r > 0) { c.font = A(120); const w = c.measureText(s).width + 30; c.fillStyle = Y; c.fillRect(70, y - 80, w * r, 150); }
    });
  });
  shot(S4 + 12, S4 + 16, (c, t) => {
    const fl = t < at(S4 + 13.5) ? (hash(Math.floor(t * 20)) > 0.45 ? 1 : 0.1) : 1;
    slam(c, t, hit(S4 + 12, 1.5), 'KARANLIK.', 540, 960, { size: 230, alpha: fl });
  });
  shot(S4 + 16, S4 + 24, (c, t) => {
    type(c, t, S4 + 16, 'RESMİ AÇIKLAMA:', 540, 820, { align: 'center', size: 40 });
    slam(c, t, hit(S4 + 17, 1.2), '“RUTİN BAKIM.”', 540, 980, { size: 160 });
    slam(c, t, S4 + 20, 'SİBER SALDIRI KANITI YOK.', 540, 1150, { size: 70, color: Y, from: 0.2 });
    type(c, t, S4 + 21, 'PERSONEL KADEMELİ GİRİŞE GEÇTİ', 540, 1240, { align: 'center', size: 30, color: GREY });
  });
  shot(S4 + 24, S4 + 28, (c, t) => { // build-up
    const p = prog(t, at(S4 + 24), at(4));
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * 6.283, r0 = 200 + ((t * (300 + p * 900) + hash(i) * 800) % 900);
      c.strokeStyle = `rgba(255,212,0,${0.08 + p * 0.25})`; c.lineWidth = 3;
      c.beginPath(); c.moveTo(540 + Math.cos(a) * r0, 960 + Math.sin(a) * r0); c.lineTo(540 + Math.cos(a) * (r0 + 60 + p * 140), 960 + Math.sin(a) * (r0 + 60 + p * 140)); c.stroke();
    }
    c.save(); c.translate(540, 960); const s = 0.7 + ease.inCubic(p) * 0.6; c.scale(s, s);
    txt(c, 'VE BU ARADA…', 0, 0, { font: A(150), color: p > 0.75 ? Y : WH, align: 'center', base: 'middle' });
    c.restore();
  });

  // 05 IRAN (drop)
  const S5 = 132;
  shot(S5, S5 + 12, (c, t) => {
    header(c, t, hit(S5, 1.8), '05', 'ORTA DOĞU · 16 KASIM', 'İRAN\'A KARŞI', 999);
    slam(c, t, hit(S5 + 2), '3. UÇAK GEMİSİ', 80, 880, { size: 150, align: 'left', color: Y });
    type(c, t, S5 + 4, 'USS THEODORE ROOSEVELT BÖLGEDE', 80, 980, { size: 34 });
    ['ROOSEVELT', 'BUSH', 'WASHINGTON'].forEach((n, i) => {
      const b = hit(S5 + 8 + i * 0.5, 0.6); if (t < at(b)) return;
      const k = ease.outExpo(prog(t, at(b), 0.35)); const y = 1150 + i * 140;
      carrier(c, lerp(-300, 330, k), y, 1.2, WH);
      txt(c, n, 640, y - 4, { font: A(64), color: WH, alpha: k, ls: 2 });
    });
  });
  shot(S5 + 12, S5 + 20, (c, t) => {
    [['3', 'UÇAK GEMİSİ'], ['13', 'MUHRİP'], ['2', 'KRUVAZÖR']].forEach(([n, l], i) => {
      const b = hit(S5 + 12 + i * 2, 1); const y = 760 + i * 230;
      slam(c, t, b, n, 300, y, { size: 210, align: 'right', color: Y, from: 0.4 });
      slam(c, t, b + 0.5, l, 340, y + 10, { size: 90, align: 'left', from: 0.2, maxW: 660 });
    });
    type(c, t, S5 + 18, 'ARAP DENİZİ · NAVY VERİLERİ (AP)', 80, 1500, { size: 28, color: GREY });
  });
  shot(S5 + 20, S5 + 32, (c, t) => {
    counter(c, t, hit(S5 + 20, 1.2), 50000, 540, 820, { pre: '~', size: 250, color: WH });
    slam(c, t, S5 + 21, 'ABD ASKERİ BÖLGEDE', 540, 960, { size: 80, color: Y, from: 0.2 });
    const tp = ease.outExpo(prog(t, at(hit(S5 + 24, 1.3)), 0.4));
    if (tp > 0) { // warning tape
      c.save(); c.translate(540, 1200); c.rotate(-0.08); c.fillStyle = Y; c.fillRect(-800 * tp, -70, 1600 * tp, 140);
      const off = (t * 220) % 900;
      for (let k = -2; k < 3; k++) txt(c, 'İRAN ABLUKASI SÜRÜYOR ·', -700 + k * 900 + off, 28, { font: A(76), color: BG, ls: 2, alpha: tp });
      c.restore();
    }
    slam(c, t, hit(S5 + 28), 'HÜRMÜZ\'DE GERİLİM', 540, 1440, { size: 110, color: WH });
  });

  // OUTRO
  const S6 = 164;
  shot(S6, S6 + 8, (c, t) => {
    ['MICROSOFT', 'UÇUŞLAR', 'WORKDAY', 'BANKALAR', 'NSA'].forEach((s, i) => {
      const y = 620 + i * 170; const b = hit(S6 + i, 0.6);
      slam(c, t, b, s, 80, y, { size: 130, align: 'left', from: 0.3 });
      slam(c, t, b + 0.5, '✕', 1000, y, { size: 130, align: 'right', color: RED, font: s2 => `700 ${s2}px Inter`, from: 0.6 });
    });
  });
  shot(S6 + 8, S6 + 12, (c, t) => {
    slam(c, t, hit(S6 + 8, 1.2), 'HEPSİ “ARIZA”.', 540, 860, { size: 150 });
    slam(c, t, hit(S6 + 10, 1.2), 'HEPSİ AYNI HAFTA.', 540, 1060, { size: 130, color: Y });
  });
  shot(S6 + 12, S6 + 16, (c, t) => {
    slam(c, t, hit(S6 + 12, 1.8), 'SENCE?', 540, 940, { size: 340, color: Y });
    slam(c, t, S6 + 14, 'TESADÜF MÜ, UYARI MI?', 540, 1160, { size: 80, from: 0.2 });
  });
  shot(S6 + 16, 200, (c, t) => {
    slam(c, t, hit(S6 + 16, 1.4), 'BERLİN', 540, 860, { size: 200 });
    slam(c, t, S6 + 17, 'KONUŞUYOR', 540, 1060, { size: 200, color: Y });
    type(c, t, S6 + 19, 'YORUMA YAZ ↓', 540, 1230, { align: 'center', size: 44, color: WH });
    if (t > at(S6 + 20)) txt(c, 'KAYNAKLAR: CNN · AP · ABC NEWS · AL JAZEERA · WASHINGTON POST · CBS', 540, 1500, { font: M(20, 500), color: GREY, align: 'center' });
  });

  // ---------- frame ----------
  const SECTIONS = [[16, '01'], [36, '02'], [68, '03'], [104, '04'], [132, '05']];
  const R = rng(9);
  const flecks = Array.from({ length: 40 }, () => ({ x: R() * W, y: R() * H, s: 2 + R() * 4, v: 40 + R() * 160 }));

  function background(ctx, t, b) {
    const dark = win(t, at(104), at(128), 0.3, 0.3);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    // moving diagonal stripes
    ctx.save(); ctx.globalAlpha = 0.035 * (1 - dark * 0.7); ctx.strokeStyle = WH; ctx.lineWidth = 28;
    const off = (t * 60) % 120;
    for (let x = -H; x < W + H; x += 120) { ctx.beginPath(); ctx.moveTo(x + off, 0); ctx.lineTo(x + off - H * 0.6, H); ctx.stroke(); }
    ctx.restore();
    // beat pulse: a yellow glow from the bottom on every downbeat
    const ph = b - Math.floor(b);
    const pulse = Math.exp(-ph * 5) * (1 - dark) * (t < at(188) ? 1 : 0);
    const g = ctx.createRadialGradient(540, H + 200, 0, 540, H + 200, 1300);
    g.addColorStop(0, `rgba(255,212,0,${0.16 * pulse})`); g.addColorStop(1, 'rgba(255,212,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (const f of flecks) {
      ctx.fillStyle = `rgba(245,245,240,${0.08 + 0.1 * pulse})`;
      ctx.fillRect(f.x, (f.y - t * f.v + H * 50) % H, f.s, f.s);
    }
    if (dark > 0) { // scanlines during the NSA section
      ctx.fillStyle = `rgba(0,0,0,${0.35 * dark})`;
      for (let y = (t * 40) % 6; y < H; y += 6) ctx.fillRect(0, y, W, 2);
    }
  }

  function chrome(ctx, t) {
    if (t > at(180)) return;
    // ticker band
    ctx.fillStyle = Y; ctx.fillRect(0, 120, W, 64);
    const label = 'SİSTEM ARIZASI  ✕  BERLİN KONUŞUYOR  ✕  ';
    const lw = measure(ctx, label, A(40), 3);
    const off = (t * 140) % lw;
    for (let x = -off; x < W; x += lw) txt(ctx, label, x, 167, { font: A(40), color: BG, ls: 3 });
    // section progress
    SECTIONS.forEach(([b, n], i) => {
      const active = t >= at(b) && (i === SECTIONS.length - 1 ? t < at(164) : t < at(SECTIONS[i + 1][0]));
      const done = t >= at(b);
      txt(ctx, n, 600 + i * 84, 250, { font: M(30, 700), color: active ? Y : done ? WH : '#3a3a3a', align: 'left' });
      if (active) { ctx.fillStyle = Y; ctx.fillRect(600 + i * 84, 262, 52, 5); }
    });
    txt(ctx, 'ABD', 80, 250, { font: M(30, 700), color: WH });
  }

  function draw(ctx, t) {
    const b = t / BT;
    ctx.save();
    // camera shake from recent hits
    let sh = 0;
    for (const h of HITS) if (t >= h.t && t - h.t < 0.5) sh += h.amp * Math.exp(-(t - h.t) * 14);
    ctx.translate(Math.sin(t * 93) * sh * 9, Math.cos(t * 71) * sh * 9);
    background(ctx, t, b);
    chrome(ctx, t);
    const s = SHOTS.find(s => b >= s.b0 && b < s.b1);
    if (s) s.fn(ctx, t);
    ctx.restore();
    [35.5, 67.5, 131.5].forEach(w => wipe(ctx, t, w + 0.5, w === 131.5 ? WH : Y));
    // white flash on the drop
    const fl = Math.exp(-Math.max(0, t - at(132)) * 8) * (t >= at(132) ? 1 : 0);
    if (fl > 0.01) { ctx.fillStyle = `rgba(255,255,255,${fl * 0.6})`; ctx.fillRect(0, 0, W, H); }
    const fo = prog(t, 89.3, 0.7); if (fo > 0) { ctx.fillStyle = `rgba(0,0,0,${fo})`; ctx.fillRect(0, 0, W, H); }
  }

  // Register hits once (shots call hit() on draw; run every shot at its end time).
  SHOTS.forEach(s => { const c = document.createElement('canvas').getContext('2d'); s.fn(c, at(s.b1) - 0.001); });
  const seen = new Set();
  const cues = HITS.filter(h => { const k = h.t.toFixed(3); if (seen.has(k)) return false; seen.add(k); return true; })
    .map(h => ({ t: h.t, type: 'hit', gain: Math.min(h.amp, 1.8) }));
  HITS.length = 0; cues.forEach(c => HITS.push({ t: c.t, amp: c.gain }));
  REG = false;

  window.VIDEO = {
    duration: 90, bpm: BPM, draw,
    cues: [...cues, { t: at(35.5), type: 'whoosh' }, { t: at(67.5), type: 'whoosh' }, { t: at(124), type: 'riser', len: at(8) }, { t: at(132), type: 'boom', gain: 1 }],
  };
})();
