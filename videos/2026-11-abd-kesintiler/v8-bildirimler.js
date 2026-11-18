/*
 * VİDEO 8 — "Bildirim Yağmuru" · seslendirmesiz, telefon ekranı · 90 sn
 * The whole frame is a lock screen: a flood of alerts, a rewind to 12 November,
 * day-by-day notifications (failure counter, draining battery, highlighted official
 * explanations), the four explanations side by side, and a poll.
 * App names are generic (Banka, Havayolu…), never real apps' branding.
 */
(() => {
  const WHITE = '#ffffff', INK = '#111318', GREY = '#5b6070', YEL = '#ffd84a', RED = '#e5322d';
  const SANS = (s, w = 700) => `${w} ${s}px Inter`;
  const MONO = (s, w = 700) => `${w} ${s}px "JetBrains Mono"`;

  const APPS = {
    news: { name: 'HABER', col: '#e5322d', g: 'N' }, mail: { name: 'E-POSTA', col: '#2f7cf6', g: 'mail' },
    chat: { name: 'İŞ SOHBETİ', col: '#6b5cf6', g: 'chat' }, air: { name: 'HAVAYOLU', col: '#14a3c7', g: 'plane' },
    hr: { name: 'İK UYGULAMASI', col: '#1f9d55', g: 'İK' }, bank: { name: 'BANKA', col: '#1f3a68', g: 'bank' },
    pay: { name: 'PARA TRANSFERİ', col: '#0f9488', g: '₺' }, alert: { name: 'SON DAKİKA', col: '#e5322d', g: '!' },
    bk: { name: 'BERLİN KONUŞUYOR', col: '#111318', g: 'BK' },
  };
  // [time, app, title, body, failure-counter-after (optional)]
  const DAYS = [
    { s: 6.6, e: 17, date: 'Perşembe, 12 Kasım', clock: [18, 12], bat: 78, n: [
      [7.4, 'mail', 'Sunucuya bağlanılamıyor', 'Gelen kutunuz şu anda yüklenemiyor.', 1],
      [9.0, 'chat', 'Bağlantı kesildi', 'Yeniden bağlanmaya çalışılıyor…'],
      [11.0, 'news', 'Microsoft 365\'te küresel kesinti', 'Outlook, Teams ve Copilot 18 saati aşan sorun yaşadı.'],
      [13.6, 'news', 'Açıklama: “sunucu arızaları”', 'Bazı raporlara göre 74 ülke etkilendi.']] },
    { s: 17, e: 30.2, date: 'Cuma, 13 Kasım', clock: [16, 20], bat: 61, n: [
      [17.8, 'air', 'Uçuşunuz ertelendi', 'Yeni kalkış saati henüz belli değil.', 2],
      [19.8, 'alert', 'Tüm ABD\'de kalkışlar durduruldu', 'FAA ülke çapında uçuş durdurma ilan etti.'],
      [22.2, 'news', '10.000+ uçuş rötar yaptı', 'Ocak 2023\'ten beri ilk ülke çapında durdurma.'],
      [24.8, 'news', 'Açıklama: “tek bir router”', 'Bakan Duffy: “Beceriksizlik mi, arızalı cihaz mı?”'],
      [27.4, 'hr', 'Hizmet kullanılamıyor', 'Workday şu anda erişilemiyor.', 3]] },
    { s: 30.2, e: 42, date: 'Pazartesi, 16 Kasım', clock: [9, 12], bat: 34, n: [
      [31.0, 'bank', 'İşleminiz gerçekleştirilemedi', 'Lütfen daha sonra tekrar deneyin.', 4],
      [33.0, 'pay', 'Transfer gecikmesi', 'Diğer bankalara gönderimler gecikebilir.'],
      [35.4, 'news', 'Chase, BofA ve Wells Fargo\'da kesinti', 'Yalnızca Chase için ~5.000 şikayet.'],
      [38.0, 'news', 'Açıklama: “yazılım hatası”', 'Chase: “Siber saldırı değil.”']] },
    { s: 42, e: 52, date: 'Salı, 17 Kasım', clock: [8, 47], bat: 19, n: [
      [42.8, 'alert', 'NSA\'nın gizli ağı çöktü', 'Ajansın iç iletişim ağı devre dışı.', 5],
      [45.4, 'news', 'Açıklama: “rutin bakım”', 'Personel kademeli olarak işe çağrıldı.'],
      [48.0, 'news', 'Siber saldırı kanıtı yok', 'Normale dönüş için tarih verilmedi.']] },
    { s: 52, e: 60.5, date: 'Aynı hafta · Orta Doğu', clock: [20, 31], bat: 9, n: [
      [52.8, 'alert', '3. uçak gemisi İran açıklarında', 'USS Theodore Roosevelt bölgeye ulaştı.'],
      [55.4, 'news', '3 uçak gemisi · 13 muhrip', 'Bölgede ~50.000 ABD askeri. Abluka sürüyor.']] },
  ];
  const ALL = DAYS.flatMap(d => d.n);
  const FLOOD = [0, 2, 5, 6, 9, 12, 13, 15].map((k, i) => ({ n: ALL[k], t: 0.45 + i * 0.22 }));
  const PILE = { s: 60.5, e: 67.6 }, ASK = { s: 67.6, e: 70.6 }, POLL = { s: 70.6, e: 86 }, END = 86;
  const QUOTES = ['sunucu arızaları', 'tek bir router', 'yazılım hatası', 'rutin bakım'];

  // ---------- wallpaper (also rendered small for the frosted-glass cards) ----------
  const BLOBS = [['#5b2bd6', 260, 500, 620], ['#e0306a', 860, 1300, 560], ['#1a6fe0', 700, 380, 520], ['#ff7a3d', 180, 1600, 480]];
  const small = document.createElement('canvas'); small.width = 135; small.height = 240;
  const sctx = small.getContext('2d');
  function paintWall(c, t, sc) {
    c.save(); c.scale(sc, sc);
    c.fillStyle = '#0c0b1f'; c.fillRect(0, 0, W, H);
    BLOBS.forEach(([col, x, y, r], i) => {
      const bx = x + Math.sin(t * 0.21 + i * 2) * 90, by = y + Math.cos(t * 0.17 + i) * 120;
      const g = c.createRadialGradient(bx, by, 0, bx, by, r);
      g.addColorStop(0, col + 'aa'); g.addColorStop(1, col + '00');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    });
    c.restore();
  }

  function glyph(ctx, g, x, y) {
    ctx.save(); ctx.translate(x, y); ctx.strokeStyle = WHITE; ctx.fillStyle = WHITE; ctx.lineWidth = 5; ctx.lineJoin = 'round';
    if (g === 'mail') { ctx.strokeRect(-22, -15, 44, 30); ctx.beginPath(); ctx.moveTo(-22, -15); ctx.lineTo(0, 3); ctx.lineTo(22, -15); ctx.stroke(); }
    else if (g === 'chat') { rrect(ctx, -22, -18, 44, 30, 8); ctx.fill(); ctx.beginPath(); ctx.moveTo(-10, 10); ctx.lineTo(-16, 22); ctx.lineTo(2, 10); ctx.fill(); }
    else if (g === 'plane') { ctx.rotate(-0.6); ctx.beginPath(); ctx.moveTo(26, 0); ctx.lineTo(-20, -4); ctx.lineTo(-26, -14); ctx.lineTo(-30, -14); ctx.lineTo(-26, 0); ctx.lineTo(-30, 14); ctx.lineTo(-26, 14); ctx.lineTo(-20, 4); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(4, -2); ctx.lineTo(-8, -24); ctx.lineTo(-14, -24); ctx.lineTo(-6, -2); ctx.moveTo(4, 2); ctx.lineTo(-8, 24); ctx.lineTo(-14, 24); ctx.lineTo(-6, 2); ctx.fill(); }
    else if (g === 'bank') { ctx.beginPath(); ctx.moveTo(-24, -8); ctx.lineTo(0, -24); ctx.lineTo(24, -8); ctx.closePath(); ctx.fill();
      for (let i = 0; i < 4; i++) ctx.fillRect(-19 + i * 11, -4, 5, 20); ctx.fillRect(-25, 18, 50, 5); }
    else txt(ctx, g, 0, 13, { font: SANS(g.length > 1 ? 28 : 40, 900), color: WHITE, align: 'center' });
    ctx.restore();
  }

  const CH = 200, GAPY = 16, X0 = 40, CW = 1000;
  const ago = s => (s < 3.5 ? 'şimdi' : `${Math.min(59, Math.floor(s / 3.5))} dk önce`);

  /** One frosted notification card. born: when it arrived (for the relative time and the highlighter). */
  function notif(ctx, n, y, a, sc, t, born) {
    const [, app, title, body] = n; const A = APPS[app];
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(540, y + CH / 2); ctx.scale(sc, sc); ctx.translate(-540, -CH / 2);
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; rrect(ctx, X0 + 2, 10, CW, CH, 44); ctx.fill();
    // frosted glass: the blurred wallpaper behind the card, then a milky layer
    ctx.save(); rrect(ctx, X0, 0, CW, CH, 44); ctx.clip();
    const m = ctx.getTransform(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(small, 0, 0, W, H); ctx.setTransform(m);
    ctx.fillStyle = app === 'alert' ? 'rgba(255,232,229,0.82)' : app === 'bk' ? 'rgba(255,246,214,0.9)' : 'rgba(246,246,251,0.74)';
    ctx.fillRect(X0, 0, CW, CH);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2; rrect(ctx, X0 + 1, 1, CW - 2, CH - 2, 43); ctx.stroke();
    ctx.fillStyle = A.col; rrect(ctx, X0 + 30, 34, 88, 88, 22); ctx.fill();
    glyph(ctx, A.g, X0 + 74, 78);
    txt(ctx, A.name, X0 + 146, 62, { font: SANS(26, 700), color: app === 'alert' ? '#c4231e' : GREY, ls: 1.5 });
    txt(ctx, ago(t - born), X0 + CW - 34, 62, { font: SANS(26, 500), color: GREY, align: 'right' });
    const tf = SANS(fit(ctx, title, s => SANS(s, 800), 40, CW - 190), 800);
    // highlighter under a quoted official explanation
    const q = title.indexOf('“');
    if (q >= 0) {
      ctx.font = tf; const x1 = ctx.measureText(title.slice(0, q)).width, w = ctx.measureText(title.slice(q)).width;
      const hp = ease.inOutCubic(prog(t, born + 0.6, 0.5));
      ctx.fillStyle = 'rgba(255,216,74,0.85)'; ctx.fillRect(X0 + 140 + x1, 84, (w + 12) * hp, 36);
    }
    txt(ctx, title, X0 + 146, 112, { font: tf, color: INK });
    words(ctx, body, X0 + 146, 158, 0, { font: SANS(31, 500), color: '#2b2f3a', maxW: CW - 190, lineH: 38 });
    ctx.restore();
  }

  function curDay(t) { let d = null; for (const x of DAYS) if (t >= x.s) d = x; return d; }
  function failures(t) { let c = 0; for (const n of ALL) if (n[4] && t >= n[0]) c = n[4]; return c; }

  function statusBar(ctx, t, bat) {
    // signal bars
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i < 3 || Math.floor(t * 2) % 2 ? WHITE : 'rgba(255,255,255,0.35)'; rrect(ctx, 60 + i * 16, 74 - i * 7 - 10, 10, 10 + i * 7, 3); ctx.fill(); }
    txt(ctx, '5G', 136, 76, { font: SANS(28, 700), color: WHITE });
    const low = bat < 20;
    txt(ctx, bat + '%', 912, 76, { font: SANS(26, 700), color: low ? '#ff5a52' : WHITE, align: 'right' });
    ctx.strokeStyle = WHITE; ctx.lineWidth = 3; rrect(ctx, 926, 50, 72, 32, 9); ctx.stroke();
    ctx.fillStyle = WHITE; rrect(ctx, 1001, 60, 5, 12, 2); ctx.fill();
    ctx.fillStyle = low ? '#ff5a52' : WHITE; rrect(ctx, 932, 56, 60 * bat / 100, 20, 5); ctx.fill();
  }

  function lockHeader(ctx, t) {
    const d = curDay(t);
    const hook = !d;
    const date = hook ? 'Salı, 17 Kasım' : d.date;
    let [hh, mm] = hook ? [23, 41] : d.clock;
    if (!hook) mm += Math.floor((t - d.s) / 2.5);
    hh = (hh + Math.floor(mm / 60)) % 24; mm %= 60;
    const time = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    const bat = hook ? 9 : d.bat;
    const p = ease.outCubic(prog(t, hook ? 0.3 : d.s, 0.5));
    const fade = 1 - 0.7 * win(t, PILE.s, END + 5, 0.5, 0.1);
    ctx.save(); ctx.globalAlpha = fade;
    statusBar(ctx, t, bat);
    txt(ctx, date, 540, 240 + (1 - p) * 30, { font: SANS(46, 600), color: WHITE, align: 'center', alpha: p });
    txt(ctx, time, 540, 450 + (1 - p) * 40, { font: SANS(220, 300), color: WHITE, align: 'center', alpha: p, ls: -4 });
    // failure counter chip
    if (!hook && t < PILE.s) {
      const f = failures(t), gulf = t >= DAYS[4].s;
      const label = gulf ? `ÇÖKÜŞ 5/5  ·  + ORTA DOĞU` : `ÇÖKÜŞ ${f}/5`;
      const last = ALL.filter(n => n[4] && t >= n[0]).pop();
      const pop = last ? ease.outBack(prog(t, last[0], 0.35), 3) : 1;
      ctx.font = MONO(28, 800); ctx.letterSpacing = '3px'; const w = ctx.measureText(label).width + 56; ctx.letterSpacing = '0px';
      if (f > 0) { ctx.save(); ctx.translate(540, 510); ctx.scale(lerp(0.85, 1, pop), lerp(0.85, 1, pop));
        ctx.fillStyle = 'rgba(229,50,45,0.92)'; rrect(ctx, -w / 2, -26, w, 52, 26); ctx.fill();
        txt(ctx, label, 0, 10, { font: MONO(28, 800), color: WHITE, align: 'center', ls: 3 }); ctx.restore(); }
    }
    ctx.restore();
  }

  function stackDay(ctx, t) {
    const day = DAYS.find(d => t >= d.s && t < d.e); if (!day) return;
    const list = day.n.filter(n => t >= n[0]);
    const out = ease.inCubic(prog(t, day.e - 0.45, 0.45));
    list.forEach((n, i) => {
      let y = 570;
      for (let j = i + 1; j < list.length; j++) y += (CH + GAPY) * ease.outCubic(prog(t, list[j][0], 0.35));
      const inP = ease.outBack(prog(t, n[0], 0.45), 1.4);
      notif(ctx, n, y - (1 - inP) * 120 - out * 1000, prog(t, n[0], 0.12) * (1 - out), lerp(0.92, 1, inP), t, n[0]);
    });
  }

  function hook(ctx, t) {
    if (t >= DAYS[0].s) return;
    // flood of alerts
    const out = ease.inCubic(prog(t, 3.7, 0.5));
    FLOOD.forEach((f, i) => {
      if (t < f.t) return;
      let y = 570;
      for (let j = i + 1; j < FLOOD.length; j++) y += (CH + GAPY) * ease.outCubic(prog(t, FLOOD[j].t, 0.2));
      const inP = ease.outBack(prog(t, f.t, 0.3), 1.4);
      notif(ctx, f.n, y - (1 - inP) * 120 - out * 1300, prog(t, f.t, 0.08) * (1 - out), lerp(0.9, 1, inP), t, f.t);
    });
    // big statement
    const sa = win(t, 2.35, 3.9, 0.15, 0.3);
    if (sa > 0) {
      ctx.fillStyle = `rgba(5,5,12,${0.72 * sa})`; ctx.fillRect(0, 0, W, H);
      [['6 GÜN.', 2.35, WHITE, 760], ['5 ÇÖKÜŞ.', 2.7, WHITE, 920], ['BU NORMAL DEĞİL.', 3.05, YEL, 1080]].forEach(([s, t0, c, y]) => {
        const k = ease.outBack(prog(t, t0, 0.25), 2); if (k <= 0) return;
        ctx.save(); ctx.globalAlpha = sa; ctx.translate(540, y); ctx.scale(k, k);
        txt(ctx, s, 0, 0, { font: SANS(fit(ctx, s, z => SANS(z, 900), 150, 980), 900), color: c, align: 'center' }); ctx.restore();
      });
    }
    // rewind to 12 November
    const rw = win(t, 3.9, DAYS[0].s, 0.2, 0.3);
    if (rw > 0) {
      const list = ['17', '16', '15', '14', '13', '12'];
      const k = Math.min(5, Math.floor(ease.inOutCubic(prog(t, 4.0, 2.2)) * 6));
      ctx.fillStyle = `rgba(5,5,12,${0.65 * rw})`; ctx.fillRect(0, 0, W, H);
      const spin = (Math.floor(t * 20) % 2) * 4;
      txt(ctx, '⟲ GERİ SARILIYOR', 540, 800, { font: MONO(40), color: YEL, align: 'center', alpha: rw, ls: 6 });
      txt(ctx, list[k], 540, 1060 + spin, { font: SANS(260, 900), color: WHITE, align: 'center', alpha: rw });
      txt(ctx, 'KASIM', 540, 1150, { font: SANS(56, 800), color: 'rgba(255,255,255,0.7)', align: 'center', alpha: rw, ls: 10 });
    }
  }

  function pile(ctx, t) {
    const a = win(t, PILE.s, PILE.e, 0.4, 0.4); if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    ALL.forEach((n, i) => {
      const k = ease.outCubic(prog(t, PILE.s + i * 0.05, 0.45));
      const yy = lerp(-300, 330 + (ALL.length - i) * 7, k);
      notif(ctx, n, yy, k, 0.84 + i * 0.008, t, n[0]);
    });
    const ba = ease.outBack(prog(t, PILE.s + 1.2, 0.3), 3);
    if (ba > 0) { ctx.save(); ctx.translate(960, 340); ctx.scale(ba, ba); ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(0, 0, 50, 0, 6.283); ctx.fill();
      txt(ctx, String(ALL.length), 0, 16, { font: SANS(46, 900), color: WHITE, align: 'center' }); ctx.restore(); }
    // four institutions, four explanations
    const ht = PILE.s + 1.6;
    txt(ctx, '4 kurum. 4 açıklama:', 540, 690, { font: SANS(62, 900), color: WHITE, align: 'center', alpha: prog(t, ht, 0.3) });
    QUOTES.forEach((q, i) => {
      const t0 = ht + 0.6 + i * 0.55, k = ease.outBack(prog(t, t0, 0.35), 2); if (k <= 0) return;
      const y = 790 + i * 120;
      ctx.save(); ctx.translate(540, y); ctx.scale(k, k);
      const s = `“${q}”`; ctx.font = SANS(54, 800); const w = ctx.measureText(s).width + 70;
      ctx.fillStyle = YEL; rrect(ctx, -w / 2, -48, w, 92, 46); ctx.fill();
      txt(ctx, s, 0, 18, { font: SANS(54, 800), color: INK, align: 'center' });
      ctx.restore();
    });
    const ca = ease.outBack(prog(t, ht + 3.4, 0.4), 2);
    if (ca > 0) { ctx.save(); ctx.translate(540, 1330); ctx.scale(ca, ca);
      ctx.strokeStyle = '#ff5a52'; ctx.lineWidth = 6; rrect(ctx, -380, -58, 760, 104, 18); ctx.stroke();
      txt(ctx, 'SİBER SALDIRI KANITI: YOK', 0, 16, { font: MONO(44, 800), color: '#ff5a52', align: 'center', ls: 2 }); ctx.restore(); }
    ctx.restore();
  }

  function ask(ctx, t) {
    const a = win(t, ASK.s, ASK.e, 0.3, 0.3); if (a <= 0) return;
    const k = ease.outBack(prog(t, ASK.s, 0.5), 1.6);
    ctx.save(); ctx.globalAlpha = a; ctx.translate(540, 880); ctx.scale(k, k);
    txt(ctx, 'Tek tek bakınca: arıza.', 0, -190, { font: SANS(50, 700), color: 'rgba(255,255,255,0.8)', align: 'center' });
    txt(ctx, 'ACABA NE', 0, -10, { font: SANS(150, 900), color: WHITE, align: 'center' });
    txt(ctx, 'OLUYOR?', 0, 150, { font: SANS(150, 900), color: YEL, align: 'center' });
    ctx.restore();
  }

  const OPTS = [['Eskiyen altyapı', 'Bakan Duffy: “sistem eski”'], ['Domino etkisi', 'Her şey bağlı; tek hata zincirleme yayılıyor'], ['Bilinmeyen etken', 'Perde arkasında bir şey mi? Kanıt yok.']];
  const OPT_T = i => POLL.s + 1.4 + i * 3.4;
  function poll(ctx, t) {
    const a = win(t, POLL.s, POLL.e, 0.4, 0.4); if (a <= 0) return;
    const k = ease.outBack(prog(t, POLL.s, 0.55), 1.3);
    ctx.save(); ctx.globalAlpha = a; ctx.translate(0, (1 - k) * 220);
    ctx.save(); rrect(ctx, 40, 400, 1000, 1110, 52); ctx.clip(); ctx.drawImage(small, 0, 0, W, H);
    ctx.fillStyle = 'rgba(248,248,252,0.9)'; ctx.fillRect(40, 400, 1000, 1110); ctx.restore();
    txt(ctx, 'ANKET', 100, 482, { font: SANS(28, 800), color: RED, ls: 4 });
    txt(ctx, 'Sence hangisi?', 100, 572, { font: SANS(80, 900), color: INK });
    txt(ctx, 'Kanıtlanmış bir bağlantı yok. Karar senin.', 100, 628, { font: SANS(32, 500), color: GREY });
    OPTS.forEach(([h, d], i) => {
      const ti = OPT_T(i), on = t >= ti, act = on && t < ti + 3.4;
      const y = 690 + i * 220, p = ease.outCubic(prog(t, ti, 0.35));
      ctx.fillStyle = act ? 'rgba(229,50,45,0.08)' : 'rgba(17,19,24,0.04)'; rrect(ctx, 90, y, 900, 190, 32); ctx.fill();
      ctx.strokeStyle = act ? RED : 'rgba(17,19,24,0.16)'; ctx.lineWidth = act ? 5 : 3; rrect(ctx, 90, y, 900, 190, 32); ctx.stroke();
      ctx.strokeStyle = act ? RED : GREY; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(162, y + 95, 26, 0, 6.283); ctx.stroke();
      if (act) { ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(162, y + 95, 14 * p, 0, 6.283); ctx.fill(); }
      txt(ctx, h, 222, y + 86, { font: SANS(48, 900), color: INK });
      txt(ctx, d, 222, y + 138, { font: SANS(28, 500), color: GREY, alpha: on ? 1 : 0.5 });
      // finger-tap ripple
      const rp = prog(t, ti - 0.05, 0.6);
      if (rp > 0 && rp < 1) { ctx.strokeStyle = `rgba(229,50,45,${1 - rp})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(600, y + 95, 30 + rp * 120, 0, 6.283); ctx.stroke();
        ctx.fillStyle = `rgba(17,19,24,${0.25 * (1 - rp)})`; ctx.beginPath(); ctx.arc(600, y + 95, 34, 0, 6.283); ctx.fill(); }
    });
    const ca = ease.outBack(prog(t, POLL.s + 11.8, 0.4), 2);
    if (ca > 0) { ctx.save(); ctx.translate(540, 1420); ctx.scale(ca, ca); ctx.fillStyle = INK; rrect(ctx, -450, -44, 900, 88, 44); ctx.fill();
      txt(ctx, 'Oyunu yorumlara yaz ↓', 0, 14, { font: SANS(38, 800), color: WHITE, align: 'center' }); ctx.restore(); }
    ctx.restore();
  }

  const BKN = [END + 0.5, 'bk', 'Sence hangisi? Yorumlara yaz.', 'Altyapı mı, domino mu, başka bir şey mi?'];
  function endCard(ctx, t) {
    const a = prog(t, END, 0.5); if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(5,5,12,0.55)'; ctx.fillRect(0, 0, W, H);
    txt(ctx, 'BERLİN KONUŞUYOR', 540, 980, { font: SANS(84, 900), color: WHITE, align: 'center', ls: 2 });
    txt(ctx, 'BİLDİRİMLERİ AÇIK TUT', 540, 1060, { font: MONO(30), color: YEL, align: 'center', ls: 5 });
    txt(ctx, 'Kaynaklar: CNN · AP · ABC News · Al Jazeera · Washington Post · CBS · INSS', 540, 1480, { font: MONO(18, 500), color: '#b3b0cc', align: 'center' });
    if (t >= BKN[0]) { const k = ease.outBack(prog(t, BKN[0], 0.45), 1.4); notif(ctx, BKN, 560 - (1 - k) * 120, prog(t, BKN[0], 0.12), lerp(0.92, 1, k), t, BKN[0]); }
    ctx.restore();
  }

  // haptic shake on alerts
  const SHAKES = [...ALL.filter(n => n[1] === 'alert').map(n => n[0]), 2.35, 2.7, 3.05];
  function draw(ctx, t) {
    paintWall(sctx, t, small.width / W);
    let sh = 0; for (const s of SHAKES) if (t >= s && t - s < 0.35) sh += Math.exp(-(t - s) * 12);
    ctx.save(); ctx.translate(Math.sin(t * 120) * 7 * sh, 0);
    ctx.save(); const z = 1.04 + Math.sin(t * 0.1) * 0.02; ctx.translate(540, 960); ctx.scale(z, z); ctx.translate(-540, -960);
    paintWall(ctx, t, 1); ctx.restore();
    const dim = 0.5 * win(t, PILE.s, END + 5, 0.6, 0.1);
    if (dim > 0) { ctx.fillStyle = `rgba(5,5,12,${dim})`; ctx.fillRect(0, 0, W, H); }
    lockHeader(ctx, t);
    hook(ctx, t);
    stackDay(ctx, t);
    pile(ctx, t); ask(ctx, t); poll(ctx, t); endCard(ctx, t);
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; rrect(ctx, 390, 1872, 300, 10, 5); ctx.fill();
    ctx.restore();
    const wake = 1 - prog(t, 0.05, 0.35), fo = prog(t, 89.4, 0.6), fb = Math.max(wake, fo);
    if (fb > 0) { ctx.fillStyle = `rgba(0,0,0,${fb})`; ctx.fillRect(0, 0, W, H); }
  }

  const cues = [{ t: 0.1, type: 'wake' }];
  FLOOD.forEach(f => cues.push({ t: f.t, type: 'ding', gain: 0.7, app: f.n[1] }));
  [2.35, 2.7, 3.05].forEach(t => cues.push({ t, type: 'hit' }));
  cues.push({ t: 3.9, type: 'rewind' });
  ALL.forEach(n => cues.push({ t: n[0], type: n[1] === 'alert' ? 'alert' : 'ding', app: n[1] }));
  ALL.filter(n => n[2].includes('“')).forEach(n => cues.push({ t: n[0] + 0.6, type: 'marker' }));
  DAYS.forEach(d => cues.push({ t: d.e - 0.45, type: 'swipe' }));
  cues.push({ t: PILE.s, type: 'pile' });
  QUOTES.forEach((_, i) => cues.push({ t: PILE.s + 2.2 + i * 0.55, type: 'pop' }));
  cues.push({ t: PILE.s + 5.0, type: 'hit' }, { t: ASK.s, type: 'hit' });
  OPTS.forEach((_, i) => cues.push({ t: OPT_T(i), type: 'select' }));
  cues.push({ t: END, type: 'end' }, { t: BKN[0], type: 'ding', app: 'bk' });
  window.VIDEO = { duration: 90, draw, cues, days: DAYS.map(d => [d.s, d.e]) };
})();
