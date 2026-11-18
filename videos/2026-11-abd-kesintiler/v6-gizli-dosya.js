/*
 * VİDEO 6 — "Gizli Dosya" · seslendirmesiz, gizemli · 90 sn
 * A dossier on a desk: typed pages, redactions, rubber stamps and polaroids.
 */
(() => {
  const PAPER = '#f3eddc', INK = '#1f1c17', RED = '#b8241b', GREY = '#7a7266', MANILA = '#d6b06a';
  const MONO = (s, w = 600) => `${w} ${s}px "JetBrains Mono"`;
  const SANS = (s, w = 900) => `${w} ${s}px Inter`;
  const HAND = s => `700 ${s}px Caveat`;
  const SERIF = (s, w = 600) => `${w} ${s}px Fraunces`;

  // ---------- desk texture ----------
  const desk = document.createElement('canvas'); desk.width = 1300; desk.height = 2200;
  { const g = desk.getContext('2d'); const r = rng(31);
    g.fillStyle = '#3a2416'; g.fillRect(0, 0, 1300, 2200);
    for (let x = 0; x < 1300; x += 2) {
      const v = Math.sin(x * 0.013) * 0.5 + Math.sin(x * 0.051 + 2) * 0.3 + Math.sin(x * 0.0021) * 0.6;
      g.fillStyle = `rgba(${90 + v * 25},${55 + v * 15},${32 + v * 10},0.55)`; g.fillRect(x, 0, 2, 2200);
    }
    for (let i = 0; i < 900; i++) { g.strokeStyle = `rgba(30,15,6,${0.08 + r() * 0.15})`; g.lineWidth = 1 + r() * 2;
      const x = r() * 1300; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + r() * 30 - 15, 700, x + r() * 30 - 15, 1500, x + r() * 20 - 10, 2200); g.stroke(); }
  }

  function icon(ctx, kind, x, y, col) {
    ctx.save(); ctx.translate(x, y); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 7; ctx.lineJoin = 'round';
    if (kind === 'mail') { ctx.strokeRect(-70, -45, 140, 90); ctx.beginPath(); ctx.moveTo(-70, -45); ctx.lineTo(0, 10); ctx.lineTo(70, -45); ctx.stroke(); }
    if (kind === 'plane') { ctx.scale(0.62, 0.62); ctx.beginPath();
      ctx.moveTo(120, 0); ctx.quadraticCurveTo(110, -12, 80, -12); ctx.lineTo(-90, -10); ctx.lineTo(-120, -50); ctx.lineTo(-138, -50); ctx.lineTo(-118, -6);
      ctx.lineTo(-118, 6); ctx.lineTo(-138, 18); ctx.lineTo(-120, 18); ctx.lineTo(-90, 10); ctx.lineTo(80, 12); ctx.quadraticCurveTo(110, 12, 120, 0); ctx.fill();
      ctx.beginPath(); ctx.moveTo(10, -8); ctx.lineTo(-40, -95); ctx.lineTo(-62, -95); ctx.lineTo(-30, -8); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(10, 8); ctx.lineTo(-40, 95); ctx.lineTo(-62, 95); ctx.lineTo(-30, 8); ctx.closePath(); ctx.fill(); }
    if (kind === 'bank') { ctx.beginPath(); ctx.moveTo(-80, -25); ctx.lineTo(0, -70); ctx.lineTo(80, -25); ctx.closePath(); ctx.fill();
      for (let i = 0; i < 5; i++) ctx.fillRect(-68 + i * 32, -15, 15, 66); ctx.fillRect(-85, 56, 170, 12); }
    if (kind === 'eye') { ctx.beginPath(); ctx.moveTo(-85, 0); ctx.quadraticCurveTo(0, -70, 85, 0); ctx.quadraticCurveTo(0, 70, -85, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 24, 0, 6.283); ctx.fill(); }
    if (kind === 'ship') { ctx.beginPath(); ctx.moveTo(-100, 16); ctx.lineTo(-112, 0); ctx.lineTo(108, 0); ctx.lineTo(92, 16); ctx.fill();
      ctx.fillRect(24, -28, 20, 28); ctx.fillRect(31, -44, 5, 17); }
    ctx.restore();
  }

  // ---------- pages ----------
  const P = [
    { s: 7.5, e: 18, ek: 'EK-1 · 12 KASIM', head: 'E-POSTA ÇÖKTÜ', title: 'OLAY: MICROSOFT 365', icon: 'mail', stamp: 'RESMİ: ARIZA', hand: '18 saat!?',
      lines: [['TARİH', '12.11.2026 · PERŞEMBE'], ['HEDEF', 'e-posta, iş iletişimi'], ['ETKİ', 'Outlook · Teams · Copilot'], ['SÜRE', '18+ saat'], ['KAPSAM', 'bazı raporlara göre 74 ülke'], ['AÇIKLAMA', '“sunucu arızaları”']] },
    { s: 18, e: 29.5, ek: 'EK-2 · 13 KASIM', head: 'GÖKYÜZÜ KAPANDI', title: 'OLAY: FAA UÇUŞ DURDURMA', icon: 'plane', stamp: 'RESMİ: ARIZA', hand: 'tek router = tüm ülke?',
      lines: [['TARİH', '13.11.2026 · CUMA'], ['HEDEF', 'hava trafiği'], ['ETKİ', 'ABD\'de tüm kalkışlar durdu'], ['RÖTAR', '10.000+ uçuş'], ['ÖNCEKİ', 'Ocak 2023'], ['AÇIKLAMA', '“tek bir router”']],
      sticky: 'Aynı günlerde:\nWorkday de çöktü' },
    { s: 29.5, e: 40, ek: 'EK-3 · 16 KASIM', head: 'PARA KİLİTLENDİ', title: 'OLAY: BANKA KESİNTİSİ', icon: 'bank', stamp: 'RESMİ: ARIZA', hand: 'hesaplara erişim yok',
      lines: [['TARİH', '16.11.2026 · PAZARTESİ'], ['HEDEF', 'bankacılık'], ['ETKİ', 'Chase · BofA'], ['', 'Wells Fargo · Zelle'], ['ŞİKAYET', '~5.000 (yalnızca Chase)'], ['AÇIKLAMA', '“yazılım hatası”'], ['SİBER?', '“değil” (Chase)']] },
    { s: 40, e: 50.5, ek: 'EK-4 · 17 KASIM', head: 'İSTİHBARAT KARARDI', title: 'OLAY: NSA NET', icon: 'eye', stamp: 'RESMİ: BAKIM', hand: 'bugün!',
      lines: [['TARİH', '17.11.2026 · BUGÜN'], ['HEDEF', 'istihbarat iletişimi'], ['SİSTEM', 'NSA\'nın gizli iç ağı'], ['DURUM', 'çöktü'], ['PERSONEL', 'kademeli giriş'], ['AÇIKLAMA', '“rutin bakım”'], ['SİBER?', 'kanıt yok']], redact: [3] },
    { s: 50.5, e: 61, ek: 'EK-5 · ORTA DOĞU', head: 'VE AYNI HAFTA…', title: 'DURUM: İRAN CEPHESİ', icon: 'ship', stamp: 'AKTİF', hand: 'tesadüf mü?',
      lines: [['TARİH', '16.11.2026'], ['BÖLGE', 'Orta Doğu'], ['UÇAK GEMİSİ', '3 · yeni: Roosevelt'], ['MUHRİP', '13'], ['ASKER', '~50.000'], ['DURUM', 'İran ablukası sürüyor']] },
  ];
  const EVAL = { s: 61, e: 77 };
  const CLOSE = 77, END = 86.2;
  const CPS = 46;

  /** Text typed out over time, starting at t0. Returns end time. */
  function typed(ctx, s, x, y, t, t0, font, color) {
    const n = clamp(Math.floor((t - t0) * CPS), 0, s.length);
    if (n <= 0) return t0 + s.length / CPS;
    txt(ctx, s.slice(0, n), x, y, { font, color });
    if (n < s.length && Math.floor(t * 6) % 2) { ctx.font = font; const w = ctx.measureText(s.slice(0, n)).width; ctx.fillStyle = color; ctx.fillRect(x + w + 3, y - 30, 16, 36); }
    return t0 + s.length / CPS;
  }

  function stamp(ctx, s, x, y, rot, t, t0, size = 54, col = RED) {
    if (t < t0) return;
    const k = ease.outBack(prog(t, t0, 0.22), 1.4);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(lerp(2.2, 1, k), lerp(2.2, 1, k));
    ctx.globalAlpha = Math.min(1, prog(t, t0, 0.08)) * 0.85;
    ctx.font = MONO(size, 800); ctx.letterSpacing = '4px'; const w = ctx.measureText(s).width + 50;
    ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.strokeRect(-w / 2, -size * 0.85, w, size * 1.5);
    ctx.lineWidth = 2; ctx.strokeRect(-w / 2 + 8, -size * 0.85 + 8, w - 16, size * 1.5 - 16);
    txt(ctx, s, 0, size * 0.32, { font: MONO(size, 800), color: col, align: 'center', ls: 4 });
    ctx.restore();
  }

  function polaroid(ctx, kind, x, y, rot, t, t0) {
    if (t < t0) return;
    const k = ease.outCubic(prog(t, t0, 0.5));
    ctx.save(); ctx.translate(x + (1 - k) * 300, y); ctx.rotate(rot + (1 - k) * 0.4); ctx.globalAlpha = k;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-130, -140, 270, 310);
    ctx.fillStyle = '#fbfaf6'; ctx.fillRect(-140, -150, 270, 310);
    const g = ctx.createLinearGradient(0, -130, 0, 100); g.addColorStop(0, '#3b4652'); g.addColorStop(1, '#1c232b');
    ctx.fillStyle = g; ctx.fillRect(-122, -132, 234, 220);
    icon(ctx, kind, -5, -22, '#e8e2d2');
    ctx.fillStyle = '#9a9a9a'; ctx.fillRect(-135, -170, 50, 34); // paper clip shadowish tab
    ctx.restore();
  }

  function sticky(ctx, text, x, y, rot, t, t0) {
    if (t < t0) return;
    const k = ease.outBack(prog(t, t0, 0.35), 2);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(lerp(1.3, 1, k), lerp(1.3, 1, k));
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-150, -95, 310, 200);
    ctx.fillStyle = '#ffe066'; ctx.fillRect(-160, -105, 310, 200);
    text.split('\n').forEach((l, i) => txt(ctx, l, -5, -20 + i * 54, { font: HAND(50), color: INK, align: 'center' }));
    ctx.restore();
  }

  function paper(ctx, rot, dx) {
    ctx.save(); ctx.translate(540 + dx, 1000); ctx.rotate(rot);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-440, -585, 900, 1200);
    ctx.fillStyle = PAPER; ctx.fillRect(-450, -600, 900, 1200);
    ctx.fillStyle = 'rgba(120,90,40,0.06)'; for (let i = 0; i < 6; i++) ctx.fillRect(-450, -600 + i * 200 + 90, 900, 2);
  }

  function page(ctx, p, t, i) {
    const out = ease.inCubic(prog(t, p.e - 0.5, 0.6));
    const rot = (i % 2 ? 0.015 : -0.012) - out * 0.35;
    paper(ctx, rot, -out * 1400);
    // header
    txt(ctx, 'DOSYA NO: 2026-11-ABD', -390, -520, { font: MONO(24, 700), color: GREY });
    txt(ctx, 'GİZLİ', 390, -520, { font: MONO(28, 800), color: RED, align: 'right', ls: 6 });
    ctx.fillStyle = INK; ctx.fillRect(-390, -495, 780, 3);
    const t0 = p.s + 0.7;
    let tt = typed(ctx, p.title, -390, -430, t, t0, MONO(42, 800), INK) + 0.15;
    p.lines.forEach(([k, v], li) => {
      const y = -330 + li * 74;
      txt(ctx, k.padEnd(9, ' '), -390, y, { font: MONO(30, 700), color: GREY, alpha: t >= tt ? 1 : 0 });
      const endT = typed(ctx, v, -170, y, t, tt, MONO(32, 600), INK);
      if (p.redact && p.redact.includes(li)) { // black bar covers the value, then lifts
        const lift = ease.inOutCubic(prog(t, p.s + 5.6, 0.6));
        if (t >= tt) { ctx.fillStyle = '#111'; ctx.fillRect(-180, y - 34, 560 * (1 - lift), 46); }
      }
      tt = endT + 0.12;
    });
    const tEnd = tt;
    stamp(ctx, p.stamp, 200, 350, -0.14, t, Math.min(tEnd + 0.3, p.e - 3.5), 50);
    ctx.save(); ctx.translate(-10, 490); ctx.rotate(-0.06);
    const hp = prog(t, Math.min(tEnd + 1.0, p.e - 2.6), 0.6);
    if (hp > 0) { ctx.beginPath(); ctx.rect(-220, -70, 700 * hp, 110); ctx.clip(); txt(ctx, p.hand, 0, 0, { font: HAND(64), color: RED }); }
    ctx.restore();
    ctx.restore();
    if (out < 0.05) {
      polaroid(ctx, p.icon, 290, 1310, -0.07, t, p.s + 1.4);
      if (p.sticky) sticky(ctx, p.sticky, 800, 1205, 0.06, t, p.s + 6.2);
    }
  }

  function evalPage(ctx, t) {
    const { s, e } = EVAL;
    const out = ease.inCubic(prog(t, e - 0.5, 0.6));
    paper(ctx, 0.01 - out * 0.3, -out * 1400);
    txt(ctx, 'DEĞERLENDİRME', -390, -500, { font: MONO(44, 800), color: INK });
    ctx.fillStyle = INK; ctx.fillRect(-390, -478, 780, 3);
    const t0 = s + 0.6;
    let tt = typed(ctx, 'ORTAK NOKTALAR:', -390, -400, t, t0, MONO(32, 800), GREY) + 0.1;
    ['- aynı hafta', '- hepsi kritik altyapı', '- siber saldırı kanıtı: YOK'].forEach((l, i) => { tt = typed(ctx, l, -390, -340 + i * 58, t, tt, MONO(32, 600), INK) + 0.1; });
    tt = typed(ctx, 'İHTİMALLER:', -390, -110, t, tt + 0.4, MONO(32, 800), GREY) + 0.2;
    const opts = [['Eskiyen altyapı', 'Bakan: “sistem eski”'], ['Domino etkisi', 'tek hata, zincirleme'], ['Bilinmeyen etken', 'kanıt yok']];
    opts.forEach(([a, b], i) => {
      const y = -20 + i * 150, ti = s + 6.0 + i * 2.6;
      if (t < ti) return;
      const k = prog(t, ti, 0.3);
      ctx.globalAlpha = k;
      ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.strokeRect(-390, y - 40, 50, 50);
      txt(ctx, a, -310, y, { font: MONO(38, 800), color: INK });
      txt(ctx, b, -310, y + 48, { font: MONO(26, 500), color: GREY });
      const q = prog(t, ti + 1.0, 0.4);
      if (q > 0) { ctx.save(); ctx.beginPath(); ctx.rect(-400, y - 90, 80, 160 * q); ctx.clip(); txt(ctx, '?', -365, y + 14, { font: HAND(96), color: RED, align: 'center' }); ctx.restore(); }
      ctx.globalAlpha = 1;
    });
    const hp = prog(t, s + 14.0, 0.6);
    if (hp > 0) { ctx.save(); ctx.translate(-80, 500); ctx.rotate(-0.05); ctx.beginPath(); ctx.rect(-320, -90, 700 * hp, 130); ctx.clip();
      txt(ctx, 'Hangisi?', 0, 0, { font: HAND(96), color: RED, align: 'center' }); ctx.restore(); }
    ctx.restore();
  }

  function folder(ctx, t) {
    // folder back
    ctx.save(); ctx.translate(540, 1010); ctx.rotate(-0.02);
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(-475, -625, 970, 1290);
    ctx.fillStyle = MANILA; ctx.fillRect(-485, -640, 970, 1290);
    ctx.fillRect(-485, -700, 320, 70);
    ctx.restore();
  }

  function cover(ctx, t) {
    // closed cover: on during the hook, slides off, slides back at the end
    const off = ease.inOutCubic(prog(t, 7.0, 0.8)) * (1 - ease.inOutCubic(prog(t, CLOSE, 0.8)));
    if (off >= 0.999) return;
    ctx.save(); ctx.translate(540 - off * 1300, 1010 + off * 200); ctx.rotate(-0.02 - off * 0.25);
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(-470, -615, 970, 1290);
    ctx.fillStyle = '#ddb977'; ctx.fillRect(-485, -640, 970, 1290);
    ctx.fillStyle = PAPER; ctx.fillRect(-300, -420, 600, 220);
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(-300, -420, 600, 220);
    txt(ctx, 'DOSYA NO: 2026-11-ABD', 0, -350, { font: MONO(28, 700), color: GREY, align: 'center' });
    const atEnd = t > CLOSE;
    txt(ctx, '6 GÜN · 5 ÇÖKÜŞ', 0, -270, { font: MONO(52, 800), color: INK, align: 'center' });
    stamp(ctx, 'GİZLİ', 0, 120, -0.12, t, 1.6, 120);
    if (atEnd) stamp(ctx, 'SORUŞTURMA SÜRÜYOR', 0, 380, 0.08, t, CLOSE + 1.2, 52);
    ctx.restore();
  }

  function band(ctx, t) {
    let kicker = 'ABD · 12–17 KASIM 2026', head = 'BU NORMAL DEĞİL.', s0 = 0;
    for (const p of P) if (t >= p.s) { kicker = p.ek; head = p.head; s0 = p.s; }
    if (t >= EVAL.s) { kicker = 'DEĞERLENDİRME'; head = 'ACABA NE OLUYOR?'; s0 = EVAL.s; }
    if (t >= CLOSE) { kicker = 'DOSYA KAPANMADI'; head = 'SENCE HANGİSİ?'; s0 = CLOSE; }
    const k = ease.outExpo(prog(t, s0 + 0.05, 0.4));
    // oxblood band with stitched edges, condensed stencil-like headline, typed file tag
    ctx.fillStyle = '#7d1a12'; ctx.fillRect(0, 92, W, 190);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, 270, W, 12);
    ctx.strokeStyle = 'rgba(243,229,200,0.45)'; ctx.lineWidth = 3; ctx.setLineDash([14, 10]);
    ctx.beginPath(); ctx.moveTo(0, 106); ctx.lineTo(W, 106); ctx.moveTo(0, 266); ctx.lineTo(W, 266); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = MONO(26, 800); ctx.letterSpacing = '3px'; const tw = ctx.measureText(kicker).width + 36; ctx.letterSpacing = '0px';
    ctx.save(); ctx.translate(60, 122); ctx.rotate(-0.015);
    ctx.fillStyle = '#efe3c6'; ctx.fillRect(0, 0, tw * k, 44);
    if (k > 0.6) txt(ctx, kicker, 18, 32, { font: MONO(26, 800), color: '#3a1410', ls: 3 });
    ctx.restore();
    const ANTON = sz => `400 ${sz}px Anton`;
    txt(ctx, head, 60 - (1 - k) * 40, 252, { font: ANTON(fit(ctx, head, ANTON, 92, 960, 3)), color: '#f3e5c8', ls: 3, alpha: k });
  }

  function draw(ctx, t) {
    const dx = Math.sin(t * 0.3) * 18, dy = Math.cos(t * 0.23) * 14;
    ctx.save(); ctx.translate(-110 + dx, -140 + dy); ctx.drawImage(desk, 0, 0); ctx.restore();
    ctx.save(); ctx.translate(dx * 0.3, dy * 0.3);
    folder(ctx, t);
    // pages: draw the next one below the current one so it is revealed as the top page slides away
    const all = [...P.map((p, i) => ({ kind: 'p', p, i, s: p.s, e: p.e })), { kind: 'eval', s: EVAL.s, e: EVAL.e }];
    const cur = all.findIndex(o => t >= o.s && t < o.e);
    const draws = cur >= 0 ? [all[cur + 1], all[cur]].filter(Boolean) : (t < 7.5 ? [all[0]] : []);
    for (const o of draws) o.kind === 'p' ? page(ctx, o.p, Math.max(t, o.s), o.i) : evalPage(ctx, Math.max(t, o.s));
    cover(ctx, t);
    ctx.restore();
    // lamp light
    const g = ctx.createRadialGradient(560, 820, 150, 540, 1000, 1250);
    g.addColorStop(0, 'rgba(255,225,170,0.10)'); g.addColorStop(1, 'rgba(0,0,0,0.72)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    band(ctx, t);
    // hook line under the closed cover
    const ha = win(t, 3.0, 7.2, 0.5, 0.4);
    if (ha > 0) { ctx.fillStyle = `rgba(12,8,5,${0.85 * ha})`; ctx.fillRect(0, 1440, W, 140);
      words(ctx, 'Tek tek bakınca masum.\nYan yana koyunca *değil.*', 540, 1495, t, { font: SANS(44, 800), emFont: SANS(44, 900), color: '#f6efe0', emColor: '#ff6b5e', maxW: 960, lineH: 56, align: 'center', start: 3.0, stagger: 0.12, alpha: ha }); }
    const ca = win(t, CLOSE + 2.2, END, 0.5, 0.4);
    if (ca > 0) { ctx.fillStyle = `rgba(12,8,5,${0.85 * ca})`; ctx.fillRect(0, 1440, W, 140);
      txt(ctx, 'Yorumlara yaz: altyapı mı, domino mu, başka bir şey mi?', 540, 1525, { font: SANS(34, 800), color: '#f6efe0', align: 'center', alpha: ca }); }
    const ea = prog(t, END, 0.6);
    if (ea > 0) {
      ctx.save(); ctx.globalAlpha = ea; ctx.fillStyle = 'rgba(12,8,5,0.95)'; ctx.fillRect(0, 0, W, H);
      txt(ctx, 'BERLİN KONUŞUYOR', 540, 900, { font: SANS(80), color: '#f6efe0', align: 'center', ls: 2 });
      txt(ctx, 'GİZLİ DOSYA · AÇIK SORULAR', 540, 980, { font: MONO(30, 800), color: '#e0574b', align: 'center', ls: 4 });
      txt(ctx, 'Kaynaklar: CNN · AP · ABC News · Al Jazeera · Washington Post · CBS · INSS', 540, 1480, { font: MONO(18, 500), color: '#8f8576', align: 'center' });
      ctx.restore();
    }
    const fb = 1 - Math.min(prog(t, 0, 0.5), prog(-t, -90, 0.6));
    if (fb > 0) { ctx.fillStyle = `rgba(0,0,0,${fb})`; ctx.fillRect(0, 0, W, H); }
  }

  // typing schedule (mirrors page()) for the stamp and key-click cues
  const sched = p => { let tt = p.s + 0.7 + p.title.length / CPS + 0.15; const typing = [[p.s + 0.7, tt - 0.15]];
    for (const [, v] of p.lines) { typing.push([tt, tt + v.length / CPS]); tt += v.length / CPS + 0.12; }
    return { stamp: Math.min(tt + 0.3, p.e - 3.5), typing }; };
  const cues = [{ t: 1.6, type: 'stamp' }, { t: 7.0, type: 'slide' }];
  P.forEach(p => { const sc = sched(p); cues.push({ t: sc.stamp, type: 'stamp' }); sc.typing.forEach(([a, b]) => cues.push({ t: a, type: 'typing', len: b - a })); });
  P.forEach(p => { cues.push({ t: p.s, type: 'slide' }); cues.push({ t: p.s + 1.4, type: 'photo' }); });
  cues.push({ t: EVAL.s, type: 'slide' });
  [0, 1, 2].forEach(i => cues.push({ t: EVAL.s + 7.0 + i * 2.6, type: 'mark' }));
  cues.push({ t: CLOSE, type: 'slide' }, { t: CLOSE + 1.2, type: 'stamp' }, { t: END, type: 'end' });
  window.VIDEO = { duration: 90, draw, cues, stampsFrom: P };
})();
