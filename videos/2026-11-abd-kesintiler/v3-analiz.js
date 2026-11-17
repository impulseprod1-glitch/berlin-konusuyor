/*
 * VİDEO 3 — "Analiz: Bir haftada beş kesinti" · analiz haber · 90 sn
 * Newspaper palette of the Berlin Konuşuyor stories, data cards on a 100 BPM bed.
 */
(() => {
  const BT = 0.6; // 100 BPM
  const PAPER = '#F3EFE6', PAPER2 = '#E8E2D5', INK = '#141413', INK2 = '#33312C', MUTED = '#8A8377', RED = '#D63F27';
  const SERIF = (s, w = 400) => `${w} ${s}px Fraunces`;
  const ISERIF = (s, w = 400) => `italic ${w} ${s}px Fraunces`;
  const SANS = (s, w = 500) => `${w} ${s}px Inter`;
  const MONO = (s, w = 600) => `${w} ${s}px "JetBrains Mono"`;
  const X = 80, CW = 920;

  const CUES = [];
  const tick = t => (CUES.push({ t, type: 'tick' }), t);

  /** Fade + slide-in envelope for an element appearing at t0 inside a scene ending at e. */
  function enter(t, t0, e, d = 0.55) {
    const p = ease.outCubic(prog(t, t0, d));
    const out = clamp((e - t) / 0.4);
    return { a: p * out, dy: (1 - p) * 40 };
  }

  function title(ctx, t, s, e, kicker, head) {
    const k = enter(t, s + 0.1, e);
    ctx.save(); ctx.globalAlpha = k.a;
    ctx.fillStyle = RED; ctx.fillRect(X, 296 + k.dy, 14, 14);
    txt(ctx, kicker, X + 30, 311 + k.dy, { font: SANS(24, 700), color: RED, ls: 4 });
    ctx.restore();
    ctx.save(); ctx.globalAlpha = clamp((e - t) / 0.4);
    words(ctx, head, X, 400, t, { font: SERIF(70, 450), emFont: ISERIF(70, 450), color: INK, emColor: RED, maxW: CW, lineH: 80, start: s + 0.25, stagger: 0.05, dur: 0.6 });
    ctx.restore();
  }

  function card(ctx, x, y, w, h, fill = '#fff', stroke = null) {
    ctx.fillStyle = fill; rrect(ctx, x, y, w, h, 18); ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  }

  function carrierIcon(ctx, x, y, s, color) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(-160, 0); ctx.lineTo(-180, -18); ctx.lineTo(175, -18); ctx.lineTo(150, 0); ctx.fill();
    ctx.fillRect(40, -46, 30, 28); ctx.fillRect(50, -66, 7, 22);
    ctx.restore();
  }
  function shipIcon(ctx, x, y, s, color) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(-70, 0); ctx.lineTo(-78, -10); ctx.lineTo(80, -10); ctx.lineTo(62, 0); ctx.fill();
    ctx.fillRect(-12, -24, 30, 14); ctx.fillRect(2, -40, 5, 18);
    ctx.restore();
  }

  // ---------- scenes ----------
  const SC = {
    title: [0, 7.2], timeline: [7.2, 16.8], faa: [16.8, 28.8], banks: [28.8, 40.8], table: [40.8, 50.4],
    force: [50.4, 62.4], reads: [62.4, 76.8], qs: [76.8, 86.4], end: [86.4, 90],
  };

  function sTitle(ctx, t) {
    const [s, e] = SC.title; if (t >= e) return;
    const out = clamp((e - t) / 0.4);
    const k = enter(t, 0.3, e);
    ctx.save(); ctx.globalAlpha = k.a;
    ctx.fillStyle = RED; rrect(ctx, X, 560 + k.dy, 190, 56, 6); ctx.fill();
    txt(ctx, 'ANALİZ', X + 95, 598 + k.dy, { font: SANS(28, 800), color: PAPER, align: 'center', ls: 6 });
    ctx.restore();
    ctx.save(); ctx.globalAlpha = out;
    words(ctx, 'Bir haftada\nbeş kesinti.', X, 760, t, { font: SERIF(118, 500), color: INK, maxW: CW, lineH: 124, start: 0.6, stagger: 0.12, dur: 0.8 });
    words(ctx, '*Tesadüf mü,\nsistem mi?*', X, 1030, t, { font: SERIF(118, 500), emFont: ISERIF(118, 400), color: INK, emColor: RED, maxW: CW, lineH: 124, start: 2.0, stagger: 0.12, dur: 0.8 });
    const lp = ease.inOutCubic(prog(t, 3.0, 1.0));
    ctx.fillStyle = INK; ctx.fillRect(X, 1220, CW * lp, 3);
    words(ctx, '12–17 Kasım arasında ABD\'de olanları sırayla, sakin bir gözle okuyalım.', X, 1300, t, { font: SANS(38, 400), color: INK2, maxW: 860, lineH: 54, start: 3.6, stagger: 0.04, dur: 0.6 });
    ctx.restore();
  }

  const TL = [
    { d: '12 KAS', h: 'Microsoft 365', s: 'Outlook, Teams, Copilot · 18+ saat' },
    { d: '13 KAS', h: 'FAA', s: 'Tüm ABD havalimanlarında uçuş durdurma' },
    { d: '13–14 KAS', h: 'Workday', s: 'İK ve bordro platformu erişilemedi' },
    { d: '16 KAS', h: 'Bankalar', s: 'Chase, BofA, Wells Fargo, Zelle…' },
    { d: '17 KAS', h: 'NSA Net', s: 'Gizli iç iletişim ağı çöktü' },
  ];
  TL.forEach((_, i) => tick(SC.timeline[0] + 1.2 + i * 0.95));
  tick(SC.timeline[0] + 6.4);

  function sTimeline(ctx, t) {
    const [s, e] = SC.timeline; if (t < s || t >= e) return;
    title(ctx, t, s, e, 'KRONOLOJİ', 'Altı gün, *beş kesinti*');
    const out = clamp((e - t) / 0.4);
    ctx.save(); ctx.globalAlpha = out;
    const lp = ease.inOutCubic(prog(t, s + 0.8, 4.8));
    ctx.fillStyle = INK; ctx.fillRect(X + 20, 540, 3, 830 * lp);
    TL.forEach((it, i) => {
      const t0 = s + 1.2 + i * 0.95, y = 580 + i * 160, k = enter(t, t0, e);
      if (k.a <= 0) return;
      ctx.save(); ctx.globalAlpha = k.a * out;
      ctx.fillStyle = PAPER; ctx.strokeStyle = RED; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(X + 21, y - 12, 14 * ease.outBack(prog(t, t0, 0.4)), 0, 6.283); ctx.fill(); ctx.stroke();
      txt(ctx, it.d, X + 70, y + k.dy * 0.3, { font: MONO(28, 700), color: RED, ls: 1 });
      txt(ctx, it.h, X + 290, y + k.dy * 0.3, { font: SANS(44, 700), color: INK });
      txt(ctx, it.s, X + 290, y + 50 + k.dy * 0.3, { font: SANS(30, 400), color: INK2 });
      ctx.restore();
    });
    // the outside track
    const k = enter(t, s + 6.4, e);
    if (k.a > 0) {
      ctx.save(); ctx.globalAlpha = k.a * out;
      card(ctx, X, 1400 + k.dy, CW, 150, INK);
      txt(ctx, 'AYNI GÜNLERDE · DIŞARIDA', X + 36, 1450 + k.dy, { font: SANS(24, 700), color: RED, ls: 4 });
      txt(ctx, '16 Kas · 3. ABD uçak gemisi Orta Doğu\'da', X + 36, 1510 + k.dy, { font: SANS(38, 600), color: PAPER });
      ctx.restore();
    }
    ctx.restore();
  }

  const FAA_STATS = [['4+ saat', 'ülke çapında uçuş durdurma'], ['10.000+', 'rötar yapan uçuş'], ['2023', 'son benzer olay'], ['50 mlr $', 'Duffy\'nin Kongre\'den istediği']];
  FAA_STATS.forEach((_, i) => tick(SC.faa[0] + 1.0 + i * 0.6));
  [0, 1, 2].forEach(i => tick(SC.faa[0] + 4.2 + i * 1.2));
  tick(SC.faa[0] + 8.2);

  function sFaa(ctx, t) {
    const [s, e] = SC.faa; if (t < s || t >= e) return;
    title(ctx, t, s, e, 'HAVACILIK · 13 KASIM', 'Tek bir router, *bütün gökyüzü*');
    const out = clamp((e - t) / 0.4);
    FAA_STATS.forEach(([n, l], i) => {
      const k = enter(t, s + 1.0 + i * 0.6, e); if (k.a <= 0) return;
      const x = X + (i % 2) * 470, y = 560 + Math.floor(i / 2) * 200 + k.dy;
      ctx.save(); ctx.globalAlpha = k.a;
      card(ctx, x, y, 450, 180, '#fff');
      txt(ctx, n, x + 32, y + 98, { font: SERIF(76, 600), color: i === 1 ? RED : INK });
      txt(ctx, l, x + 32, y + 148, { font: SANS(27, 500), color: INK2 });
      ctx.restore();
    });
    // cause chain
    const steps = ['Bakır hattan fibere geçiş', 'Router ağı istek yağmuruna tuttu', 'Telekom kesildi, uçuşlar durdu'];
    steps.forEach((st, i) => {
      const k = enter(t, s + 4.2 + i * 1.2, e); if (k.a <= 0) return;
      const x = X + i * 320, y = 1000;
      ctx.save(); ctx.globalAlpha = k.a;
      card(ctx, x, y + k.dy, 280, 200, i === 2 ? INK : PAPER2);
      txt(ctx, '0' + (i + 1), x + 26, y + 52 + k.dy, { font: MONO(26, 700), color: RED });
      words(ctx, st, x + 26, y + 100 + k.dy, t, { font: SANS(32, 600), color: i === 2 ? PAPER : INK, maxW: 235, lineH: 40 });
      if (i < 2) { ctx.fillStyle = INK; const ax = x + 290, ay = y + 100;
        ctx.beginPath(); ctx.moveTo(ax, ay - 14); ctx.lineTo(ax + 22, ay); ctx.lineTo(ax, ay + 14); ctx.fill(); }
      ctx.restore();
    });
    const k = enter(t, s + 8.2, e);
    if (k.a > 0) {
      ctx.save(); ctx.globalAlpha = k.a;
      ctx.fillStyle = RED; ctx.fillRect(X, 1270 + k.dy, 6, 190);
      words(ctx, '“Beceriksizlik miydi, yoksa arızalı bir router mı? Bunu belirlemeye çalışıyoruz.”', X + 36, 1320 + k.dy, t, { font: ISERIF(42), color: INK, maxW: 860, lineH: 54 });
      txt(ctx, 'SEAN DUFFY · ULAŞTIRMA BAKANI', X + 36, 1450 + k.dy, { font: SANS(24, 700), color: MUTED, ls: 3 });
      ctx.restore();
    }
    ctx.globalAlpha = 1; void out;
  }

  tick(SC.banks[0] + 1.0); tick(SC.banks[0] + 1.6); tick(SC.banks[0] + 4.0); tick(SC.banks[0] + 6.4);
  function sBanks(ctx, t) {
    const [s, e] = SC.banks; if (t < s || t >= e) return;
    title(ctx, t, s, e, 'FİNANS · 16 KASIM', 'Bankalar: *bir hata, binlerce şikayet*');
    let k = enter(t, s + 0.8, e);
    ctx.save(); ctx.globalAlpha = k.a;
    txt(ctx, 'DOWNDETECTOR ŞİKAYETLERİ · ZİRVE', X, 600, { font: SANS(24, 700), color: MUTED, ls: 3 });
    [['Chase', 5000, '~5.000'], ['Wells Fargo', 800, '800+']].forEach(([n, v, l], i) => {
      const y = 650 + i * 130, p = ease.outCubic(prog(t, s + 1.0 + i * 0.6, 1.4));
      txt(ctx, n, X, y + 40, { font: SANS(36, 700), color: INK });
      ctx.fillStyle = PAPER2; ctx.fillRect(X + 250, y, 670, 64);
      ctx.fillStyle = i ? INK2 : RED; ctx.fillRect(X + 250, y, 670 * (v / 5000) * p, 64);
      const bw = 670 * (v / 5000) * p;
      if (bw > 300) txt(ctx, l, X + 250 + bw - 20, y + 46, { font: MONO(34, 700), color: PAPER, align: 'right' });
      else txt(ctx, l, X + 250 + bw + 16, y + 46, { font: MONO(34, 700), color: INK });
    });
    ctx.restore();
    // fix label colour inside the full red bar
    k = enter(t, s + 4.0, e);
    if (k.a > 0) {
      ctx.save(); ctx.globalAlpha = k.a;
      txt(ctx, 'AYRICA BİLDİRİLDİ', X, 990 + k.dy, { font: SANS(24, 700), color: MUTED, ls: 3 });
      let x = X; const y = 1020 + k.dy;
      ['Bank of America', 'U.S. Bank', 'Truist', 'Capital One', 'Zelle'].forEach((n, i) => {
        const w = measure(ctx, n, SANS(30, 600)) + 40; let yy = y;
        if (x + w > X + CW) { x = X; }
        if (i >= 3) yy = y + 76;
        if (i === 3) x = X;
        ctx.strokeStyle = INK; ctx.lineWidth = 2; rrect(ctx, x, yy, w, 60, 30); ctx.stroke();
        txt(ctx, n, x + 20, yy + 41, { font: SANS(30, 600), color: INK });
        x += w + 14;
      });
      ctx.restore();
    }
    k = enter(t, s + 6.4, e);
    if (k.a > 0) {
      ctx.save(); ctx.globalAlpha = k.a;
      card(ctx, X, 1210 + k.dy, CW, 300, INK);
      txt(ctx, 'JPMORGAN CHASE', X + 40, 1265 + k.dy, { font: SANS(24, 700), color: RED, ls: 4 });
      words(ctx, '“Kurum içi bir donanım sisteminde *yazılım hatası.* Siber kaynaklı değil.”', X + 40, 1330 + k.dy, t, { font: SERIF(42, 400), emFont: ISERIF(42, 500), color: PAPER, emColor: '#F0B9AE', maxW: 840, lineH: 54 });
      txt(ctx, 'Zelle transferleri gecikti · Pazartesi akşamı normale döndü', X + 40, 1470 + k.dy, { font: SANS(26, 500), color: '#bdb6a8' });
      ctx.restore();
    }
  }

  const ROWS = [['Microsoft 365', 'Sunucu arızaları', 'AÇIKLANMADI'], ['FAA', 'Eskimiş sistem, router', 'YOK'], ['JPMorgan Chase', 'Yazılım hatası', 'YOK'], ['NSA', '“Rutin bakım”', 'KANIT YOK']];
  ROWS.forEach((_, i) => tick(SC.table[0] + 1.2 + i * 0.8));
  tick(SC.table[0] + 5.2);
  function sTable(ctx, t) {
    const [s, e] = SC.table; if (t < s || t >= e) return;
    title(ctx, t, s, e, 'RESMİ AÇIKLAMALAR', 'Dört kurum, *dört açıklama*');
    let k = enter(t, s + 0.8, e);
    ctx.save(); ctx.globalAlpha = k.a;
    const cols = [X, X + 330, X + 700];
    ['KURUM', 'AÇIKLAMA', 'SİBER SALDIRI'].forEach((h, i) => txt(ctx, h, cols[i], 600, { font: SANS(22, 700), color: MUTED, ls: 3 }));
    ctx.fillStyle = INK; ctx.fillRect(X, 620, CW, 3);
    ctx.restore();
    ROWS.forEach((r, i) => {
      const t0 = s + 1.2 + i * 0.8; k = enter(t, t0, e); if (k.a <= 0) return;
      const y = 700 + i * 120;
      ctx.save(); ctx.globalAlpha = k.a;
      txt(ctx, r[0], cols[0], y + k.dy * 0.4, { font: SANS(36, 700), color: INK });
      txt(ctx, r[1], cols[1], y + k.dy * 0.4, { font: SANS(32, 400), color: INK2 });
      const sp = ease.outBack(prog(t, t0 + 0.3, 0.35), 2.5); // stamp
      ctx.save(); ctx.translate(cols[2] + 105, y - 12); ctx.rotate(-0.06); ctx.scale(sp, sp);
      ctx.strokeStyle = RED; ctx.lineWidth = 3; rrect(ctx, -105, -28, 210, 56, 6); ctx.stroke();
      txt(ctx, r[2], 0, 10, { font: MONO(r[2].length > 9 ? 20 : 24, 800), color: RED, align: 'center', ls: 1 });
      ctx.restore();
      ctx.fillStyle = PAPER2; ctx.fillRect(X, y + 46, CW, 2);
      ctx.restore();
    });
    txt(ctx, 'Microsoft tam bir neden açıklamadı; bazı yayınlara göre siber saldırı dışlandı.', X, 1215, { font: SANS(22, 400), color: MUTED, alpha: enter(t, s + 2, e).a });
    k = enter(t, s + 5.2, e);
    if (k.a > 0) {
      ctx.save(); ctx.globalAlpha = k.a;
      card(ctx, X, 1270 + k.dy, CW, 250, RED);
      words(ctx, 'Ortak nokta: Hepsi *içeriden* bir arızayı işaret ediyor. Hiçbiri bağlantılı değil — en azından resmi olarak.', X + 40, 1350 + k.dy, t, { font: SERIF(44, 450), emFont: ISERIF(44, 500), color: PAPER, emColor: PAPER, maxW: 840, lineH: 56, start: s + 5.4, stagger: 0.04 });
      ctx.restore();
    }
  }

  tick(SC.force[0] + 1.0); tick(SC.force[0] + 1.6); tick(SC.force[0] + 2.2); tick(SC.force[0] + 4.0); tick(SC.force[0] + 6.4); tick(SC.force[0] + 8.0);
  function sForce(ctx, t) {
    const [s, e] = SC.force; if (t < s || t >= e) return;
    title(ctx, t, s, e, 'AYNI HAFTA · ORTA DOĞU', 'İran\'a karşı *üç uçak gemisi*');
    ['USS Theodore Roosevelt', 'USS George H.W. Bush', 'USS George Washington'].forEach((n, i) => {
      const t0 = s + 1.0 + i * 0.6, k = enter(t, t0, e); if (k.a <= 0) return;
      const y = 600 + i * 95;
      ctx.save(); ctx.globalAlpha = k.a;
      carrierIcon(ctx, X + 100 - (1 - ease.outCubic(prog(t, t0, 0.6))) * 60, y + 10, 0.5, INK);
      txt(ctx, n, X + 230, y + 4, { font: SANS(34, 700), color: INK });
      if (i === 0) txt(ctx, 'YENİ · 16 KAS', X + CW, y + 4, { font: MONO(22, 700), color: RED, align: 'right' });
      ctx.restore();
    });
    let k = enter(t, s + 4.0, e);
    if (k.a > 0) {
      ctx.save(); ctx.globalAlpha = k.a;
      txt(ctx, 'ARAP DENİZİ\'NDE EŞLİK EDEN GEMİLER (AP, NAVY)', X, 920, { font: SANS(22, 700), color: MUTED, ls: 2 });
      for (let i = 0; i < 16; i++) {
        const p = prog(t, s + 4.0 + i * 0.06, 0.3); if (p <= 0) continue;
        const x = X + 50 + (i % 8) * 112, y = 1000 + Math.floor(i / 8) * 60;
        ctx.globalAlpha = k.a * p;
        shipIcon(ctx, x, y, 0.55, i < 13 ? INK : i < 15 ? RED : MUTED);
      }
      ctx.globalAlpha = k.a;
      txt(ctx, '13 muhrip', X, 1130, { font: SANS(30, 700), color: INK });
      txt(ctx, '2 kruvazör', X + 200, 1130, { font: SANS(30, 700), color: RED });
      txt(ctx, '1 kıyı savaş gemisi', X + 400, 1130, { font: SANS(30, 700), color: MUTED });
      ctx.restore();
    }
    k = enter(t, s + 6.4, e);
    if (k.a > 0) {
      ctx.save(); ctx.globalAlpha = k.a;
      const p = ease.outCubic(prog(t, s + 6.4, 1.2));
      txt(ctx, '~' + fmtNum(50000 * p), X, 1250, { font: SERIF(80, 600), color: INK });
      txt(ctx, 'ABD personeli bölgede (INSS)', X + 330, 1238, { font: SANS(30, 500), color: INK2 });
      ctx.restore();
    }
    k = enter(t, s + 8.0, e);
    if (k.a > 0) {
      ctx.save(); ctx.globalAlpha = k.a;
      card(ctx, X, 1300 + k.dy, CW, 220, INK);
      txt(ctx, 'İRAN ABLUKASI · SÜRÜYOR', X + 36, 1350 + k.dy, { font: SANS(24, 700), color: RED, ls: 3 });
      words(ctx, 'Trump: savaş *“askeri olarak fiilen bitti”* — ama yeni saldırı seçeneği masada. Donanma görevleri uzatılıyor.', X + 36, 1405 + k.dy, t, { font: SANS(32, 500), emFont: ISERIF(34, 500), color: PAPER, emColor: '#F0B9AE', maxW: 850, lineH: 44 });
      ctx.restore();
    }
  }

  const READS = [
    ['Eskiyen altyapı', 'Kritik sistemler onlarca yıllık teknolojiye dayanıyor. Bunu bizzat Ulaştırma Bakanı söylüyor.'],
    ['Tek nokta, büyük etki', 'Bir router, bir sağlayıcı, bir yazılım hatası. Bağımlılık arttıkça kırılganlık da artıyor.'],
    ['Zamanlama', 'Savaş ve abluka sürerken ABD\'nin dijital sinir sistemi bir hafta boyunca tekledi. Bağlantı kanıtlanmadı — ama soru meşru.'],
  ];
  READS.forEach((_, i) => tick(SC.reads[0] + 1.0 + i * 3.6));
  function sReads(ctx, t) {
    const [s, e] = SC.reads; if (t < s || t >= e) return;
    title(ctx, t, s, e, 'YORUM', 'Bu tabloyu okumanın *üç yolu*');
    READS.forEach(([h, b], i) => {
      const t0 = s + 1.0 + i * 3.6, k = enter(t, t0, e); if (k.a <= 0) return;
      const y = 540 + i * 330 + k.dy;
      ctx.save(); ctx.globalAlpha = k.a;
      const focus = t < s + 1.0 + (i + 1) * 3.6 || i === 2;
      card(ctx, X, y, CW, 300, focus ? '#fff' : PAPER2);
      txt(ctx, String(i + 1), X + 40, y + 140, { font: SERIF(130, 600), color: RED });
      txt(ctx, h, X + 170, y + 80, { font: SANS(42, 800), color: INK });
      words(ctx, b, X + 170, y + 136, t, { font: SANS(31, 400), color: INK2, maxW: 710, lineH: 42, start: t0 + 0.3, stagger: 0.03 });
      ctx.restore();
    });
  }

  const QS = ['Router testleri ne gösterecek: insan hatası mı, arızalı cihaz mı?', 'NSA\'nın gizli ağı ne zaman tamamen geri dönecek?', 'Altyapı yenilenmezse, sıradaki kesinti nerede?'];
  QS.forEach((_, i) => tick(SC.qs[0] + 1.0 + i * 2.2));
  function sQs(ctx, t) {
    const [s, e] = SC.qs; if (t < s || t >= e) return;
    title(ctx, t, s, e, 'TAKİPTE', 'Önümüzdeki günlerin *üç sorusu*');
    QS.forEach((q, i) => {
      const t0 = s + 1.0 + i * 2.2, k = enter(t, t0, e); if (k.a <= 0) return;
      const y = 620 + i * 280 + k.dy;
      ctx.save(); ctx.globalAlpha = k.a;
      ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(X + 40, y + 10, 40, 0, 6.283); ctx.fill();
      txt(ctx, '?', X + 40, y + 28, { font: SERIF(54, 700), color: PAPER, align: 'center' });
      words(ctx, q, X + 120, y + 26, t, { font: SERIF(50, 450), color: INK, maxW: 790, lineH: 62, start: t0 + 0.15, stagger: 0.05 });
      ctx.fillStyle = PAPER2; ctx.fillRect(X, y + 210, CW, 2);
      ctx.restore();
    });
  }
  CUES.push({ t: SC.end[0], type: 'chime', gain: 0.8 });

  function sEnd(ctx, t) {
    const [s] = SC.end; if (t < s - 0.6) return;
    const p = ease.inOutCubic(prog(t, s - 0.6, 0.8));
    ctx.fillStyle = INK; ctx.fillRect(0, H * (1 - p), W, H * p);
    if (t < s) return;
    ctx.save(); ctx.globalAlpha = prog(t, s, 0.5);
    words(ctx, 'Sen ne\n*düşünüyorsun?*', X, 820, t, { font: SERIF(110, 450), emFont: ISERIF(110, 400), color: PAPER, emColor: '#F0B9AE', maxW: CW, lineH: 120, start: s + 0.1, stagger: 0.12 });
    ctx.fillStyle = RED; ctx.fillRect(X, 1000, 120, 6);
    txt(ctx, 'BERLİN KONUŞUYOR · ANALİZ', X, 1080, { font: SANS(30, 700), color: PAPER, ls: 5 });
    txt(ctx, 'Yorumlarda tartışalım.', X, 1140, { font: SANS(34, 400), color: '#bdb6a8' });
    txt(ctx, 'Kaynaklar: CNN · AP · ABC News · Al Jazeera · Washington Post · CBS · INSS', X, 1480, { font: SANS(21, 500), color: MUTED });
    ctx.restore();
  }

  function chrome(ctx, t) {
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
    // faint baseline grid
    ctx.fillStyle = 'rgba(20,20,19,0.035)';
    for (let y = 0; y < H; y += 60) ctx.fillRect(0, y, W, 1);
    txt(ctx, 'BERLİN KONUŞUYOR', X, 168, { font: SANS(24, 800), color: INK, ls: 5 });
    txt(ctx, '17.11.2026', X + CW, 168, { font: MONO(24, 600), color: RED, align: 'right' });
    ctx.fillStyle = PAPER2; ctx.fillRect(X, 196, CW, 4);
    ctx.fillStyle = RED; ctx.fillRect(X, 196, CW * clamp(t / 86.4), 4);
  }

  function draw(ctx, t) {
    chrome(ctx, t);
    sTitle(ctx, t); sTimeline(ctx, t); sFaa(ctx, t); sBanks(ctx, t); sTable(ctx, t);
    sForce(ctx, t); sReads(ctx, t); sQs(ctx, t); sEnd(ctx, t);
    const fb = 1 - Math.min(prog(t, 0, 0.5), prog(-t, -90, 0.6));
    if (fb > 0) { ctx.fillStyle = `rgba(20,20,19,${fb})`; ctx.fillRect(0, 0, W, H); }
  }

  const sceneCuts = Object.values(SC).slice(1).map(([s]) => ({ t: s, type: 'whoosh', gain: 0.6 }));
  window.VIDEO = { duration: 90, bpm: 100, draw, cues: [...CUES, ...sceneCuts] };
})();
