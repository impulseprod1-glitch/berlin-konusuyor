/* Çizgi çizimler – film.js ile aynı çizimler, kinetik kurgu (kinetic.js) için ayrı modül. */
(function (root) {
  const INK = '#0c0d12', CREAM = '#f4eee3', RED = '#e50914', GOLD = '#f7c443', TEAL = '#0fb5a5';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const P = (d, cls = '') => `<path class="d ${cls}" d="${d}"/>`;

  function skyline(towerCls) {
    const cols = [240, 280, 320, 360, 400, 440].map((x) => P(`M${x} 410 V296 h20 V410`, 'sk-gate')).join('');
    return [
      P('M-40 410 H1120', 'sk-g'),
      P('M24 410 V300 H92 V410'), P('M92 410 V250 H150 V410'), P('M150 410 V332 H196 V410'),
      P('M108 280 H134 M108 310 H134 M108 340 H134 M108 370 H134 M42 330 H74 M42 362 H74'),
      P('M196 410 V342 H228 M472 342 H504 V410'),
      cols,
      '<rect class="d sk-gate" x="228" y="266" width="244" height="30"/>',
      '<rect class="d sk-gate" x="290" y="238" width="120" height="28"/>',
      P('M322 238 q4 -22 16 -14 M340 238 q4 -26 16 -16 M358 238 L367 206 L376 238 M367 206 V190 h14 v9 h-14', 'sk-gate'),
      P('M521 410 V386'), '<circle class="d" cx="521" cy="373" r="13"/>',
      P('M574 410 L590 378 M626 410 L610 378', towerCls),
      P('M590 410 L596 198 M610 410 L604 198', towerCls),
      `<circle class="d ${towerCls}" cx="600" cy="170" r="30"/>`,
      P('M571 177 Q600 188 629 177', towerCls),
      P('M594 141 L597 110 H603 L606 141 M600 110 V26 M593 84 H607 M595 58 H605', towerCls),
      P('M660 410 V388'), '<circle class="d" cx="660" cy="375" r="13"/>',
      P('M690 410 V330 H900 V410'),
      P('M690 330 V306 H712 V330 M878 330 V306 H900 V330 M701 306 V282 h15 M889 306 V282 h15'),
      P('M749 330 A46 50 0 0 1 841 330 M772 330 Q774 296 795 281 M818 330 Q816 296 795 281 M795 330 V266'),
      P('M726 398 V352 M750 398 V352 M774 398 V352 M798 398 V352 M822 398 V352 M846 398 V352 M870 398 V352'),
      P('M930 410 V270 H984 V410'), P('M984 410 V322 H1040 V410'), P('M1040 410 V354 H1090'),
      P('M944 300 H970 M944 330 H970 M944 360 H970 M1000 350 H1024 M1000 378 H1024'),
    ].join('');
  }

  function trainSVG() {
    const win = (x) => `<rect x="${x}" y="80" width="34" height="30" rx="4"/>`;
    const car = (x) => `<rect x="${x}" y="62" width="232" height="90" rx="8"/>${[18, 68, 118, 168].map((o) => win(x + o)).join('')}<path stroke="${RED}" d="M${x} 130 H${x + 232}"/>`;
    const wheel = (cx) => `<g class="wh"><circle cx="${cx}" cy="172" r="17"/><path d="M${cx - 17} 172 H${cx + 17} M${cx} 155 V189"/></g>`;
    return `<g fill="${CREAM}" stroke="${INK}" stroke-width="5">
      <path d="M250 142 H268 M500 142 H518"/>
      <path d="M30 152 H250 V62 H98 Q62 62 46 98 L30 132 Z"/>
      <path d="M68 104 Q78 78 102 78 H122 V104 Z"/>
      <rect x="142" y="80" width="38" height="30" rx="4"/><rect x="194" y="80" width="38" height="30" rx="4"/>
      <path stroke="${RED}" d="M36 130 H250"/>
      ${car(268)}${car(518)}
      ${[72, 122, 212, 306, 462, 556, 712].map(wheel).join('')}
    </g>`;
  }

  function donerSVG() {
    let s = '';
    for (let y = 176; y <= 440; y += 44) {
      const xl = 112 + (y - 132) * 0.0952, xr = 288 - (y - 132) * 0.0952;
      s += P(`M${xl.toFixed(1)} ${y} Q200 ${y + 20} ${xr.toFixed(1)} ${y}`, 'c-ink');
    }
    return [
      P('M200 14 V600'), '<circle class="d" cx="200" cy="34" r="11"/>',
      '<ellipse class="d c-gold" cx="200" cy="80" rx="36" ry="20"/>',
      P('M112 132 Q200 100 288 132 L256 468 Q200 492 144 468 Z'),
      s,
      '<ellipse class="d" cx="200" cy="512" rx="150" ry="24"/>',
      P('M70 544 H330 M112 544 V592 M288 544 V592 M56 600 H344'),
      '<rect class="d" x="338" y="150" width="46" height="300" rx="10"/>',
      P('M350 190 H372 M350 228 H372 M350 266 H372 M350 304 H372 M350 342 H372 M350 380 H372 M350 418 H372', 'c-gold'),
      P('M316 196 q-10 14 0 28 q10 14 0 28', 'c-gold heat'), P('M316 282 q-10 14 0 28 q10 14 0 28', 'c-gold heat'), P('M316 368 q-10 14 0 28 q10 14 0 28', 'c-gold heat'),
      `<g class="knife">${P('M34 232 L112 326 Q102 340 90 332 L22 248 Z')}${P('M30 238 L4 204', 'c-ink')}</g>`,
      P('M96 392 q-16 10 -8 28', 'c-gold shav'), P('M78 436 q-14 12 -2 28', 'c-gold shav'), P('M112 440 q-12 12 -2 26', 'c-gold shav'),
    ].join('');
  }

  function gearPath(cx, cy, n, ro, ri) {
    let d = '';
    const w = (2 * Math.PI) / n;
    for (let i = 0; i < n; i++) {
      const a = i * w;
      [[ri, a - w * 0.02], [ro, a + w * 0.12], [ro, a + w * 0.38], [ri, a + w * 0.52]].forEach(([r, t], j) => {
        d += (i + j ? 'L' : 'M') + (cx + r * Math.cos(t)).toFixed(1) + ' ' + (cy + r * Math.sin(t)).toFixed(1);
      });
    }
    return d + 'Z';
  }
  function gearsSVG() {
    return `<g class="gr g1">${P(gearPath(118, 178, 10, 96, 76))}<circle class="d c-cream" cx="118" cy="178" r="34"/>${P('M118 144 V212 M84 178 H152', 'c-cream')}</g>
      <g class="gr g2">${P(gearPath(229, 100, 6, 58, 42), 'c-cream')}<circle class="d" cx="229" cy="100" r="16"/></g>`;
  }

  function star(cx, cy, r, rot = -90) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = ((rot + i * 36) * Math.PI) / 180, rr = i % 2 ? r * 0.4 : r;
      d += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1);
    }
    return d + 'Z';
  }

  function ballSVG() {
    const c = 120, R = 104, pt = (r, deg) => [(c + r * Math.cos((deg * Math.PI) / 180)).toFixed(1), (c + r * Math.sin((deg * Math.PI) / 180)).toFixed(1)].join(' ');
    let pent = '', sp = '', rim = '';
    for (let i = 0; i < 5; i++) {
      const a = -90 + i * 72;
      pent += (i ? 'L' : 'M') + pt(36, a);
      sp += `M${pt(36, a)} L${pt(72, a)} `;
      rim += `M${pt(72, a)} L${pt(96, a + 25)} L${pt(96, a + 47)} L${pt(72, a + 72)} M${pt(96, a + 25)} L${pt(R, a + 30)} M${pt(96, a + 47)} L${pt(R, a + 42)} `;
    }
    return `<circle class="d" cx="${c}" cy="${c}" r="${R}"/>${P(pent + 'Z', 'c-red')}${P(sp)}${P(rim)}`;
  }

  function personSVG() {
    return '<svg class="pp" viewBox="0 0 56 100" width="56" height="100" style="overflow:visible;fill:none;stroke:currentColor;stroke-width:5.5;stroke-linecap:round"><circle cx="28" cy="18" r="12"/><path d="M8 96 V58 Q8 38 28 38 Q48 38 48 58 V96"/></svg>';
  }

  /* DNA sarmalı: faz ilerledikçe dönüyormuş gibi görünür */
  let dnaA, dnaB, dnaR;
  function dnaBuild() {
    const el = $('#s7dna');
    let r = '';
    for (let i = 0; i < 22; i++) r += '<line class="d rung" style="stroke-width:4"/>';
    el.innerHTML = `${r}<path class="d" id="dnaA" stroke="${TEAL}"/><path class="d" id="dnaB" stroke="${GOLD}"/>`;
    dnaA = $('#dnaA'); dnaB = $('#dnaB'); dnaR = $$('.rung', el);
    dnaR.forEach((l) => l.setAttribute('stroke', CREAM));
  }
  function dnaUpdate(ph) {
    const k = (2 * Math.PI) / 440, A = 104, cx = 150;
    let a = '', b = '';
    for (let y = 0; y <= 1180; y += 10) {
      const s = Math.sin(k * y + ph);
      a += (y ? 'L' : 'M') + (cx + A * s).toFixed(1) + ' ' + y;
      b += (y ? 'L' : 'M') + (cx - A * s).toFixed(1) + ' ' + y;
    }
    dnaA.setAttribute('d', a); dnaB.setAttribute('d', b);
    dnaR.forEach((l, i) => {
      const y = 30 + i * 53, s = Math.sin(k * y + ph);
      l.setAttribute('x1', (cx + A * s * 0.9).toFixed(1)); l.setAttribute('x2', (cx - A * s * 0.9).toFixed(1));
      l.setAttribute('y1', y); l.setAttribute('y2', y);
      l.style.strokeOpacity = (0.25 + 0.6 * Math.abs(s)).toFixed(2);
    });
  }

  root.BKArt = { P, skyline, trainSVG, donerSVG, gearsSVG, star, ballSVG, personSVG };
})(window);
