/*
 * VİDEO 8 — "Bildirim Yağmuru" · seslendirmesiz, telefon ekranı · 90 sn
 * The whole frame is a lock screen: days flip, notifications pile up, and the
 * video ends with a poll asking which explanation viewers believe.
 * App names are generic (Banka, Havayolu…), never real apps' branding.
 */
(() => {
  const WHITE = '#ffffff', INK = '#111318', GREY = '#5b6070';
  const SANS = (s, w = 700) => `${w} ${s}px Inter`;
  const MONO = (s, w = 700) => `${w} ${s}px "JetBrains Mono"`;

  const APPS = {
    news: { name: 'HABER', col: '#e5322d', g: 'N' }, mail: { name: 'E-POSTA', col: '#2f7cf6', g: 'mail' },
    chat: { name: 'İŞ SOHBETİ', col: '#6b5cf6', g: 'chat' }, air: { name: 'HAVAYOLU', col: '#14a3c7', g: 'plane' },
    hr: { name: 'İK UYGULAMASI', col: '#1f9d55', g: 'İK' }, bank: { name: 'BANKA', col: '#1f3a68', g: 'bank' },
    pay: { name: 'PARA TRANSFERİ', col: '#0f9488', g: '₺' }, alert: { name: 'SON DAKİKA', col: '#e5322d', g: '!' },
  };
  const DAYS = [
    { s: 6.6, e: 17, date: 'Perşembe, 12 Kasım', clock: '18:12', n: [
      [7.4, 'mail', 'Sunucuya bağlanılamıyor', 'Gelen kutunuz şu anda yüklenemiyor.'],
      [9.0, 'chat', 'Bağlantı kesildi', 'Yeniden bağlanmaya çalışılıyor…'],
      [11.0, 'news', 'Microsoft 365\'te küresel kesinti', 'Outlook, Teams ve Copilot 18 saati aşan sorun yaşadı.'],
      [13.6, 'news', 'Açıklama: “sunucu arızaları”', 'Bazı raporlara göre 74 ülke etkilendi.']] },
    { s: 17, e: 30.2, date: 'Cuma, 13 Kasım', clock: '16:20', n: [
      [17.8, 'air', 'Uçuşunuz ertelendi', 'Yeni kalkış saati henüz belli değil.'],
      [19.8, 'air', 'Tüm ABD\'de kalkışlar durduruldu', 'FAA ülke çapında uçuş durdurma ilan etti.'],
      [22.2, 'news', '10.000+ uçuş rötar yaptı', 'Ocak 2023\'ten beri ilk ülke çapında durdurma.'],
      [24.8, 'news', 'Sebep: tek bir router?', 'Bakan Duffy: “Beceriksizlik mi, arızalı cihaz mı?”'],
      [27.4, 'hr', 'Hizmet kullanılamıyor', 'Workday şu anda erişilemiyor.']] },
    { s: 30.2, e: 42, date: 'Pazartesi, 16 Kasım', clock: '09:12', n: [
      [31.0, 'bank', 'İşleminiz gerçekleştirilemedi', 'Lütfen daha sonra tekrar deneyin.'],
      [33.0, 'pay', 'Transfer gecikmesi', 'Diğer bankalara gönderimler gecikebilir.'],
      [35.4, 'news', 'Chase, BofA ve Wells Fargo\'da kesinti', 'Yalnızca Chase için ~5.000 şikayet.'],
      [38.0, 'news', 'Chase: “Yazılım hatası”', '“Siber saldırı değil.”']] },
    { s: 42, e: 52, date: 'Salı, 17 Kasım', clock: '08:47', n: [
      [42.8, 'news', 'NSA\'nın gizli ağı çöktü', 'Ajansın iç iletişim ağı devre dışı.'],
      [45.4, 'news', 'NSA: “Rutin bakım”', 'Personel kademeli olarak işe çağrıldı.'],
      [48.0, 'news', 'Siber saldırı kanıtı yok', 'Normale dönüş için tarih verilmedi.']] },
    { s: 52, e: 60.5, date: 'Aynı hafta · Orta Doğu', clock: '20:31', n: [
      [52.8, 'alert', '3. uçak gemisi İran açıklarında', 'USS Theodore Roosevelt bölgeye ulaştı.'],
      [55.4, 'news', '3 uçak gemisi · 13 muhrip', 'Bölgede ~50.000 ABD askeri. Abluka sürüyor.']] },
  ];
  const ALL = DAYS.flatMap(d => d.n);
  const PILE = { s: 60.5, e: 66 }, ASK = { s: 66, e: 69 }, POLL = { s: 69, e: 85.6 }, END = 85.6;

  // ---------- wallpaper ----------
  const BLOBS = [['#5b2bd6', 260, 500, 620], ['#e0306a', 860, 1300, 560], ['#1a6fe0', 700, 380, 520], ['#ff7a3d', 180, 1600, 480]];
  function wallpaper(ctx, t, dim) {
    ctx.fillStyle = '#0c0b1f'; ctx.fillRect(0, 0, W, H);
    BLOBS.forEach(([c, x, y, r], i) => {
      const bx = x + Math.sin(t * 0.21 + i * 2) * 90, by = y + Math.cos(t * 0.17 + i) * 120;
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, r);
      g.addColorStop(0, c + 'aa'); g.addColorStop(1, c + '00');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    });
    if (dim > 0) { ctx.fillStyle = `rgba(5,5,12,${dim})`; ctx.fillRect(0, 0, W, H); }
  }

  function glyph(ctx, g, x, y) {
    ctx.save(); ctx.translate(x, y); ctx.strokeStyle = WHITE; ctx.fillStyle = WHITE; ctx.lineWidth = 5; ctx.lineJoin = 'round';
    if (g === 'mail') { ctx.strokeRect(-22, -15, 44, 30); ctx.beginPath(); ctx.moveTo(-22, -15); ctx.lineTo(0, 3); ctx.lineTo(22, -15); ctx.stroke(); }
    else if (g === 'chat') { rrect(ctx, -22, -18, 44, 30, 8); ctx.fill(); ctx.beginPath(); ctx.moveTo(-10, 10); ctx.lineTo(-16, 22); ctx.lineTo(2, 10); ctx.fill(); }
    else if (g === 'plane') { ctx.rotate(-0.6); ctx.beginPath(); ctx.moveTo(26, 0); ctx.lineTo(-20, -4); ctx.lineTo(-26, -14); ctx.lineTo(-30, -14); ctx.lineTo(-26, 0); ctx.lineTo(-30, 14); ctx.lineTo(-26, 14); ctx.lineTo(-20, 4); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(4, -2); ctx.lineTo(-8, -24); ctx.lineTo(-14, -24); ctx.lineTo(-6, -2); ctx.moveTo(4, 2); ctx.lineTo(-8, 24); ctx.lineTo(-14, 24); ctx.lineTo(-6, 2); ctx.fill(); }
    else if (g === 'bank') { ctx.beginPath(); ctx.moveTo(-24, -8); ctx.lineTo(0, -24); ctx.lineTo(24, -8); ctx.closePath(); ctx.fill();
      for (let i = 0; i < 4; i++) ctx.fillRect(-19 + i * 11, -4, 5, 20); ctx.fillRect(-25, 18, 50, 5); }
    else txt(ctx, g, 0, 13, { font: SANS(g.length > 1 ? 30 : 40, 900), color: WHITE, align: 'center' });
    ctx.restore();
  }

  const CH = 196, GAPY = 18, X0 = 44, CW = 992;
  function notif(ctx, n, y, a, sc = 1, highlight = 0) {
    const [, app, title, body] = n; const A = APPS[app];
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(540, y + CH / 2); ctx.scale(sc, sc); ctx.translate(-540, -CH / 2);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; rrect(ctx, X0 + 4, 8, CW, CH, 42); ctx.fill();
    ctx.fillStyle = app === 'alert' ? 'rgba(255,236,234,0.95)' : 'rgba(248,248,252,0.86)'; rrect(ctx, X0, 0, CW, CH, 42); ctx.fill();
    if (highlight > 0) { ctx.strokeStyle = `rgba(229,50,45,${highlight})`; ctx.lineWidth = 6; rrect(ctx, X0, 0, CW, CH, 42); ctx.stroke(); }
    ctx.fillStyle = A.col; rrect(ctx, X0 + 30, 34, 84, 84, 22); ctx.fill();
    glyph(ctx, A.g, X0 + 72, 76);
    txt(ctx, A.name, X0 + 140, 62, { font: SANS(26, 700), color: app === 'alert' ? '#c4231e' : GREY, ls: 1.5 });
    txt(ctx, 'şimdi', X0 + CW - 34, 62, { font: SANS(26, 500), color: GREY, align: 'right' });
    txt(ctx, title, X0 + 140, 110, { font: SANS(fit(ctx, title, s => SANS(s, 800), 38, CW - 180), 800), color: INK });
    words(ctx, body, X0 + 140, 156, 0, { font: SANS(31, 500), color: '#2b2f3a', maxW: CW - 180, lineH: 38 });
    ctx.restore();
  }

  function clock(ctx, t) {
    let d = DAYS[0];
    for (const x of DAYS) if (t >= x.s) d = x;
    const hook = t < DAYS[0].s;
    const date = hook ? 'Salı, 17 Kasım' : d.date, time = hook ? '23:41' : d.clock;
    const sw = hook ? 0 : d.s;
    const p = ease.outCubic(prog(t, sw, 0.5));
    const a = 1 - win(t, PILE.s, END + 5, 0.5, 0.1) * 0.75;
    ctx.save(); ctx.globalAlpha = a;
    // status bar
    txt(ctx, '●●●● 5G', 60, 72, { font: SANS(28, 700), color: WHITE });
    ctx.strokeStyle = WHITE; ctx.lineWidth = 3; rrect(ctx, 930, 48, 70, 32, 8); ctx.stroke(); ctx.fillStyle = WHITE; ctx.fillRect(936, 54, 40, 20);
    txt(ctx, date, 540, 250 + (1 - p) * 30, { font: SANS(46, 600), color: WHITE, align: 'center', alpha: p });
    txt(ctx, time, 540, 470 + (1 - p) * 40, { font: SANS(230, 300), color: WHITE, align: 'center', alpha: p, ls: -4 });
    ctx.restore();
    // rewind effect: dates spinning backwards during the hook
    const rw = win(t, 3.6, DAYS[0].s, 0.2, 0.3);
    if (rw > 0) {
      const list = ['17 Kasım', '16 Kasım', '15 Kasım', '14 Kasım', '13 Kasım', '12 Kasım'];
      const k = Math.min(list.length - 1, Math.floor(prog(t, 3.8, 2.4) * list.length));
      ctx.fillStyle = `rgba(5,5,12,${0.6 * rw})`; ctx.fillRect(0, 0, W, H);
      txt(ctx, '⟲ GERİ SAR', 540, 860, { font: MONO(40), color: '#ffd84a', align: 'center', alpha: rw, ls: 6 });
      txt(ctx, list[k], 540, 1010, { font: SANS(120, 900), color: WHITE, align: 'center', alpha: rw });
    }
  }

  function stack(ctx, t) {
    const day = DAYS.find(d => t >= d.s && t < d.e);
    const hookN = [2.0, 'alert', '6 günde 5 büyük çöküş', 'Bu normal değil. Geri saralım…'];
    let list = day ? day.n.filter(n => t >= n[0]) : (t < DAYS[0].s && t >= hookN[0] ? [hookN] : []);
    const endT = day ? day.e : DAYS[0].s - 0.4;
    const out = ease.inCubic(prog(t, endT - 0.45, 0.45)); // clear the day: cards fly up
    list.forEach((n, i) => {
      let y = 560;
      for (let j = i + 1; j < list.length; j++) y += (CH + GAPY) * ease.outCubic(prog(t, list[j][0], 0.35));
      const inP = ease.outBack(prog(t, n[0], 0.4), 1.3);
      y -= out * 900;
      notif(ctx, n, y - (1 - inP) * 80, prog(t, n[0], 0.15) * (1 - out), lerp(0.9, 1, inP));
    });
  }

  function pile(ctx, t) {
    const a = win(t, PILE.s, PILE.e, 0.4, 0.4); if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    // all notifications fall into one stack
    ALL.forEach((n, i) => {
      const k = ease.outCubic(prog(t, PILE.s + i * 0.07, 0.5));
      const yy = lerp(-300, 640 + (ALL.length - i) * 8, k);
      notif(ctx, n, yy, k, 0.86 + i * 0.008);
    });
    const ba = prog(t, PILE.s + 1.6, 0.3);
    ctx.globalAlpha = a * ba; ctx.fillStyle = '#e5322d'; ctx.beginPath(); ctx.arc(960, 650, 48, 0, 6.283); ctx.fill();
    txt(ctx, String(ALL.length), 960, 666, { font: SANS(44, 900), color: WHITE, align: 'center' });
    ctx.globalAlpha = a;
    words(ctx, 'Tek tek bakınca: *arıza.*\nYan yana koyunca: *?*', 540, 1180, t, { font: SANS(66, 900), emFont: SANS(66, 900), color: WHITE, emColor: '#ffd84a', maxW: 980, lineH: 84, align: 'center', start: PILE.s + 2.0, stagger: 0.12 });
    ctx.restore();
  }

  function ask(ctx, t) {
    const a = win(t, ASK.s, ASK.e, 0.3, 0.3); if (a <= 0) return;
    const k = ease.outBack(prog(t, ASK.s, 0.5), 1.6);
    ctx.save(); ctx.globalAlpha = a; ctx.translate(540, 900); ctx.scale(k, k);
    txt(ctx, 'ACABA NE', 0, -30, { font: SANS(140, 900), color: WHITE, align: 'center' });
    txt(ctx, 'OLUYOR?', 0, 120, { font: SANS(140, 900), color: '#ffd84a', align: 'center' });
    ctx.restore();
  }

  const OPTS = [['Eskiyen altyapı', 'Bakan Duffy: “sistem eski”'], ['Domino etkisi', 'Her şey bağlı; tek hata zincirleme yayılıyor'], ['Bilinmeyen etken', 'Perde arkasında bir şey mi? Kanıt yok.']];
  function poll(ctx, t) {
    const a = win(t, POLL.s, POLL.e, 0.4, 0.4); if (a <= 0) return;
    const k = ease.outBack(prog(t, POLL.s, 0.5), 1.3);
    ctx.save(); ctx.globalAlpha = a; ctx.translate(0, (1 - k) * 200);
    ctx.fillStyle = 'rgba(248,248,252,0.95)'; rrect(ctx, 44, 420, 992, 1060, 48); ctx.fill();
    txt(ctx, 'ANKET', 100, 500, { font: SANS(28, 800), color: '#e5322d', ls: 4 });
    txt(ctx, 'Sence hangisi?', 100, 590, { font: SANS(76, 900), color: INK });
    txt(ctx, 'Kanıtlanmış bir bağlantı yok. Karar senin.', 100, 645, { font: SANS(32, 500), color: GREY });
    OPTS.forEach(([h, d], i) => {
      const ti = POLL.s + 1.2 + i * 3.6, on = t >= ti, act = on && t < ti + 3.6 && i < 3;
      const y = 720 + i * 210, p = ease.outCubic(prog(t, ti, 0.4));
      ctx.fillStyle = act ? 'rgba(229,50,45,0.08)' : 'rgba(17,19,24,0.04)'; rrect(ctx, 90, y, 900, 180, 30); ctx.fill();
      ctx.strokeStyle = act ? '#e5322d' : 'rgba(17,19,24,0.18)'; ctx.lineWidth = act ? 5 : 3; rrect(ctx, 90, y, 900, 180, 30); ctx.stroke();
      ctx.strokeStyle = act ? '#e5322d' : GREY; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(160, y + 90, 26, 0, 6.283); ctx.stroke();
      if (act) { ctx.fillStyle = '#e5322d'; ctx.beginPath(); ctx.arc(160, y + 90, 14 * p, 0, 6.283); ctx.fill(); }
      txt(ctx, h, 220, y + 80, { font: SANS(46, 900), color: INK });
      txt(ctx, d, 220, y + 130, { font: SANS(28, 500), color: GREY, alpha: on ? 1 : 0.5 });
    });
    const ca = prog(t, POLL.s + 12, 0.4);
    if (ca > 0) { ctx.globalAlpha = a * ca; ctx.fillStyle = INK; rrect(ctx, 90, 1370, 900, 80, 40); ctx.fill();
      txt(ctx, 'Oyunu yorumlara yaz ↓', 540, 1422, { font: SANS(36, 800), color: WHITE, align: 'center' }); }
    ctx.restore();
  }

  function draw(ctx, t) {
    const dim = Math.min(0.55, 0.55 * win(t, PILE.s, END + 5, 0.6, 0.1));
    wallpaper(ctx, t, dim);
    clock(ctx, t);
    stack(ctx, t);
    pile(ctx, t); ask(ctx, t); poll(ctx, t);
    // home indicator
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; rrect(ctx, 390, 1870, 300, 10, 5); ctx.fill();
    const ea = prog(t, END, 0.6);
    if (ea > 0) {
      ctx.save(); ctx.globalAlpha = ea; ctx.fillStyle = '#0c0b1f'; ctx.fillRect(0, 0, W, H);
      txt(ctx, 'BERLİN KONUŞUYOR', 540, 900, { font: SANS(80, 900), color: WHITE, align: 'center', ls: 2 });
      txt(ctx, 'BİLDİRİMLERİ AÇIK TUT', 540, 980, { font: MONO(30), color: '#ffd84a', align: 'center', ls: 5 });
      txt(ctx, 'Kaynaklar: CNN · AP · ABC News · Al Jazeera · Washington Post · CBS · INSS', 540, 1480, { font: MONO(18, 500), color: '#8c8aa8', align: 'center' });
      ctx.restore();
    }
    const fb = 1 - Math.min(prog(t, 0, 0.4), prog(-t, -90, 0.6));
    if (fb > 0) { ctx.fillStyle = `rgba(0,0,0,${fb})`; ctx.fillRect(0, 0, W, H); }
  }

  const cues = [{ t: 2.0, type: 'ding', gain: 1.2 }, { t: 3.6, type: 'rewind' }];
  ALL.forEach(n => cues.push({ t: n[0], type: n[1] === 'alert' ? 'alert' : 'ding' }));
  DAYS.forEach(d => cues.push({ t: d.e - 0.45, type: 'swipe' }));
  cues.push({ t: PILE.s, type: 'pile' }, { t: ASK.s, type: 'hit' });
  OPTS.forEach((_, i) => cues.push({ t: POLL.s + 1.2 + i * 3.6, type: 'select' }));
  cues.push({ t: END, type: 'end' });
  window.VIDEO = { duration: 90, draw, cues };
})();
