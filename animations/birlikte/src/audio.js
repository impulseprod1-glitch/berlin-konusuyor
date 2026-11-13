/* "Birlikte Büyüttük" – müzik ve ses efektleri.
   Hiçbir ses dosyası yok: 60 saniyelik parça burada, saf JavaScript ile sentezlenir.
   Aynı kod tarayıcıda (oynatıcı) ve Node'da (render.mjs → WAV) çalışır.
   120 BPM · Re hicaz (D Eb F# G A Bb C). Zamanlar src/film.js ile birebir aynıdır. */
(function (root) {
  'use strict';

  function render(sr) {
    sr = sr || 44100;
    const DUR = 60, N = Math.ceil(sr * DUR), TAU = Math.PI * 2;
    const mk = () => ({ L: new Float32Array(N), R: new Float32Array(N) });
    const drums = mk(), music = mk(), sfx = mk(), rev = mk();

    let seed = 20261113;
    const rnd = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; };
    const noise = (n) => { const v = new Float32Array(n); for (let i = 0; i < n; i++) v[i] = rnd() * 2 - 1; return v; };
    const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
    const S = (sec) => Math.max(1, Math.round(sec * sr));

    /* ── karıştırma yardımcıları ── */
    function put(b, v, t, g, pan = 0, send = 0) {
      const i0 = Math.round(t * sr), a = ((pan + 1) * Math.PI) / 4;
      const gl = g * Math.cos(a) * 1.4142, gr = g * Math.sin(a) * 1.4142;
      const n = Math.min(v.length, N - i0);
      for (let i = Math.max(0, -i0); i < n; i++) {
        const x = v[i]; b.L[i0 + i] += x * gl; b.R[i0 + i] += x * gr;
        if (send) { rev.L[i0 + i] += x * gl * send; rev.R[i0 + i] += x * gr * send; }
      }
    }
    function putSt(b, vl, vr, t, g, send = 0) {
      const i0 = Math.round(t * sr), n = Math.min(vl.length, N - i0);
      for (let i = Math.max(0, -i0); i < n; i++) {
        const l = vl[i] * g, r = vr[i] * g; b.L[i0 + i] += l; b.R[i0 + i] += r;
        if (send) { rev.L[i0 + i] += l * send; rev.R[i0 + i] += r * send; }
      }
    }
    function fade(v, nIn, nOut) {
      const n = v.length;
      for (let i = 0; i < nIn && i < n; i++) v[i] *= i / nIn;
      for (let i = 0; i < nOut && i < n; i++) v[n - 1 - i] *= i / nOut;
      return v;
    }
    function bq(type, f, q) {
      const w = (TAU * f) / sr, c = Math.cos(w), al = Math.sin(w) / (2 * q), a0 = 1 + al;
      let b0, b1, b2;
      if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; } else if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; } else { b0 = al; b1 = 0; b2 = -al; }
      return [b0 / a0, b1 / a0, b2 / a0, (-2 * c) / a0, (1 - al) / a0];
    }
    function filt(v, co) {
      const [b0, b1, b2, a1, a2] = co; let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
      for (let i = 0; i < v.length; i++) { const x = v[i], y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; v[i] = y; }
      return v;
    }
    /* kesim frekansı zamanla değişen filtre (süpürmeler için) */
    function sweep(v, fFn, q, mode) {
      let ic1 = 0, ic2 = 0, g = 0, a1 = 0, a2 = 0, a3 = 0; const k = 1 / q, n = v.length;
      for (let i = 0; i < n; i++) {
        if ((i & 15) === 0) { g = Math.tan((Math.PI * Math.min(fFn(i / n), sr * 0.45)) / sr); a1 = 1 / (1 + g * (g + k)); a2 = g * a1; a3 = g * a2; }
        const x = v[i], v3 = x - ic2, v1 = a1 * ic1 + a2 * v3, v2 = ic2 + a2 * ic1 + a3 * v3;
        ic1 = 2 * v1 - ic1; ic2 = 2 * v2 - ic2;
        v[i] = mode === 'bp' ? v1 : mode === 'hp' ? x - k * v1 - v2 : v2;
      }
      return v;
    }
    const xp = (a, b, x) => a * Math.pow(b / a, x);

    /* ── davullar ── */
    const kickBuf = (() => { // pop: kısa, sıkı gövde + net tık
      const n = S(0.36), v = new Float32Array(n); let ph = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr; ph += (TAU * (50 + 120 * Math.exp(-t / 0.02))) / sr;
        v[i] = Math.tanh(Math.sin(ph) * Math.exp(-t / 0.12) * 1.8) + (rnd() - 0.5) * 0.55 * Math.exp(-t / 0.0012);
      }
      return fade(v, S(0.001), S(0.03));
    })();
    const hatBuf = (dec) => {
      const n = S(dec * 5), v = filt(noise(n), bq('hp', 7800, 0.8));
      for (let i = 0; i < n; i++) v[i] *= Math.exp(-i / sr / dec);
      return fade(v, 4, S(0.01));
    };
    const hatC = hatBuf(0.018), hatO = hatBuf(0.085);
    const clapBuf = (() => {
      const n = S(0.4), v = filt(noise(n), bq('bp', 1500, 1.1));
      for (let i = 0; i < n; i++) {
        const t = i / sr; let e = 0.9 * Math.exp(-Math.max(0, t - 0.024) / 0.085);
        if (t < 0.024) e = Math.exp(-(t % 0.008) / 0.004);
        v[i] *= e * 2.4;
      }
      return fade(v, 4, S(0.02));
    })();
    const snareBuf = (() => { // pop trampet: gövde + tel + parlak üst
      const n = S(0.3), nz = filt(noise(n), bq('bp', 2300, 0.7)), hi = filt(noise(n), bq('hp', 6500, 0.7)), v = new Float32Array(n); let ph = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr; ph += (TAU * (168 + 60 * Math.exp(-t / 0.012))) / sr;
        v[i] = Math.sin(ph) * Math.exp(-t / 0.055) * 0.8 + nz[i] * 1.6 * Math.exp(-t / 0.09) + hi[i] * 0.5 * Math.exp(-t / 0.05);
      }
      return fade(v, 3, S(0.03));
    })();
    const shakeBuf = (() => {
      const n = S(0.09), v = filt(noise(n), bq('bp', 6800, 1.1));
      for (let i = 0; i < n; i++) { const t = i / sr; v[i] *= Math.min(1, t / 0.012) * Math.exp(-Math.max(0, t - 0.012) / 0.028) * 2; }
      return fade(v, 4, S(0.01));
    })();
    const dumBuf = (() => {
      const n = S(0.4), v = new Float32Array(n); let ph = 0;
      for (let i = 0; i < n; i++) { const t = i / sr; ph += (TAU * (92 + 95 * Math.exp(-t / 0.02))) / sr; v[i] = Math.sin(ph) * Math.exp(-t / 0.13) + (rnd() - 0.5) * 0.7 * Math.exp(-t / 0.004); }
      return fade(v, 4, S(0.03));
    })();
    const tekBuf = (f, dec) => {
      const n = S(0.18), nz = filt(noise(n), bq('bp', f * 3.2, 2.2)), v = new Float32Array(n);
      for (let i = 0; i < n; i++) { const t = i / sr; v[i] = Math.sin(TAU * f * t) * Math.exp(-t / dec) * 0.8 + Math.sin(TAU * f * 1.59 * t) * Math.exp(-t / (dec * 0.6)) * 0.35 + nz[i] * 3 * Math.exp(-t / 0.012); }
      return fade(v, 3, S(0.02));
    };
    const tekB = tekBuf(760, 0.04), kaB = tekBuf(610, 0.025);

    const kicks = [];
    const kick = (t, g = 1) => { put(drums, kickBuf, t, 0.8 * g); kicks.push([t, g]); };
    const hat = (t, g, open) => put(drums, open ? hatO : hatC, t, g * 1.35, open ? 0.25 : -0.2);
    const clap = (t, g = 1) => put(drums, clapBuf, t, 0.34 * g, 0.05, 0.25);
    const snare = (t, g = 1) => put(drums, snareBuf, t, 0.38 * g, 0, 0.22);
    const dum = (t, g = 1) => put(drums, dumBuf, t, 0.5 * g, -0.15, 0.1);
    const tek = (t, g = 1) => put(drums, tekB, t, 0.36 * g, 0.3, 0.2);
    const ka = (t, g = 1) => put(drums, kaB, t, 0.24 * g, -0.35, 0.15);

    /* ── bas: alt sinüs + zarflı alçak geçirenli testere, isteğe bağlı kaydırma ── */
    function bass(t, midi, dur, g = 1, from) {
      const n = S(dur), v = new Float32Array(n), f1 = mtof(midi), f0 = from ? mtof(from) : f1; let ph = 0;
      for (let i = 0; i < n; i++) {
        const tt = i / sr, f = f1 + (f0 - f1) * Math.exp(-tt / 0.03), fc = 190 + 1250 * Math.exp(-tt / 0.085);
        ph += (TAU * f) / sr;
        let s = 0.75 * Math.sin(ph);
        for (let k = 1; k <= 8; k++) { const h = (k * f) / fc; s += Math.sin(ph * k) / k / Math.sqrt(1 + h * h * h * h); }
        v[i] = Math.tanh(s * 1.1);
      }
      put(music, fade(v, S(0.004), S(0.03)), t, 0.3 * g);
    }

    /* ── elektrikli piyano (FM): akor vuruşları ── */
    function ep(t, midi, dur, g, pan) {
      const n = S(dur + 0.22), v = new Float32Array(n), w = (TAU * mtof(midi)) / sr;
      for (let i = 0; i < n; i++) {
        const tt = i / sr, e = Math.exp(-tt / 0.8) * (tt > dur ? Math.max(0, 1 - (tt - dur) / 0.2) : 1);
        v[i] = (Math.sin(w * i + (0.35 + 1.9 * Math.exp(-tt / 0.16)) * Math.sin(w * i)) + 0.18 * Math.sin(w * i * 4) * Math.exp(-tt / 0.04)) * e * (1 + 0.12 * Math.sin(TAU * 5 * tt));
      }
      put(music, fade(v, S(0.002), S(0.01)), t, 0.12 * g, pan, 0.28);
    }

    /* ── ped (yumuşak akor) ── */
    const TAB = 4096, padTab = new Float32Array(TAB + 1);
    for (let i = 0; i <= TAB; i++) { const p = (TAU * i) / TAB; padTab[i] = Math.sin(p) + 0.42 * Math.sin(2 * p) + 0.2 * Math.sin(3 * p) + 0.1 * Math.sin(4 * p) + 0.05 * Math.sin(5 * p); }
    function pad(t, notes, dur, g, send = 0.35, att = 0.3, rel = 0.5) {
      const n = S(dur + rel), vl = new Float32Array(n), vr = new Float32Array(n);
      for (const m of notes) for (const [det, wl, wr] of [[-7, 1, 0.35], [7, 0.35, 1]]) {
        const inc = (mtof(m) * Math.pow(2, det / 1200) * TAB) / sr; let ph = rnd() * TAB;
        for (let i = 0; i < n; i++) { const ip = ph | 0, s = padTab[ip] + (padTab[ip + 1] - padTab[ip]) * (ph - ip); vl[i] += s * wl; vr[i] += s * wr; ph += inc; if (ph >= TAB) ph -= TAB; }
      }
      for (let i = 0; i < n; i++) {
        const tt = i / sr, e = Math.min(1, tt / att) * (tt > dur ? Math.max(0, 1 - (tt - dur) / rel) : 1) * (0.88 + 0.12 * Math.sin(TAU * 0.5 * tt));
        vl[i] *= e; vr[i] *= e;
      }
      putSt(music, vl, vr, t, g / notes.length, send);
    }

    /* ── bağlama: Karplus-Strong tel modeli ──
       Üst tel takımı gerçek sazdaki gibi: iki ince çelik tel (hafif akort farkıyla) + bir oktav
       pesten bam teli. Gövde rezonansı, mızrap tıkırtısı, aşağı/yukarı mızrap, çarpma ve tril ayrı. */
    function string(f, n, damp) {
      const v = new Float32Array(n), D = sr / f + 0.5, L = Math.floor(D - 0.1), d = D - L, C = (1 - d) / (1 + d);
      const buf = new Float32Array(L); let prev = 0;
      for (let i = 0; i < L; i++) { prev = 0.55 * (rnd() * 2 - 1) + 0.45 * prev; buf[i] = prev; }
      const pp = Math.max(1, Math.round(L * 0.13)), tmp = buf.slice();
      for (let i = 0; i < L; i++) buf[i] = tmp[i] - 0.7 * tmp[(i + L - pp) % L];
      let idx = 0, x1 = 0, y1 = 0;
      for (let i = 0; i < n; i++) {
        const o = buf[idx], nx = buf[idx + 1 === L ? 0 : idx + 1], lp = damp * 0.5 * (o + nx), ap = C * lp + x1 - C * y1;
        x1 = lp; y1 = ap; buf[idx] = ap; idx = idx + 1 === L ? 0 : idx + 1; v[i] = o;
      }
      return v;
    }
    // Hicaz perdeleri tampere değildir: 2. derece (Mi♭) biraz dik, 3. derece (Fa♯) biraz pes basılır
    const KOMA = { 3: 22, 6: -12 };
    const sazF = (m) => mtof(m) * Math.pow(2, (KOMA[((m % 12) + 12) % 12] || 0) / 1200);
    const pluckCache = new Map();
    function pluckBuf(midi, dur, up, ham) {
      const key = midi + '|' + dur + (up ? 'u' : '') + (ham ? 'h' : ''); let v = pluckCache.get(key);
      if (v) return v;
      const n = S(dur), f = sazF(midi), a = string(f * 1.002, n, 0.9975), b = string(f * 0.998, n, 0.9975), c = string(f / 2, n, 0.9985);
      v = new Float32Array(n);
      for (let i = 0; i < n; i++) v[i] = a[i] + b[i] + 0.5 * c[i];
      const lo = filt(v.slice(), bq('bp', 290, 1.6)), mid = filt(v.slice(), bq('bp', 900, 2.2)); // tekne
      for (let i = 0; i < n; i++) v[i] = v[i] * 0.8 + lo[i] * 0.9 + mid[i] * 0.7;
      if (up) filt(v, bq('hp', 420, 0.7)); // yukarı mızrap: ince tellere daha çok değer
      if (ham) fade(v, S(0.006), 1); // çarpma: mızrapsız, parmakla
      else { const k = filt(noise(S(0.006)), bq('hp', 2600, 0.7)); for (let i = 0; i < k.length; i++) v[i] += k[i] * (1 - i / k.length) * 1.2; }
      let pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(v[i]));
      for (let i = 0; i < n; i++) v[i] /= pk * (up ? 1.25 : 1);
      fade(v, 2, S(0.02)); pluckCache.set(key, v); return v;
    }
    const SAZ = 0.43;
    const pluck = (t, midi, dur = 0.45, g = 1, pan = 0, send = 0.2) => put(music, pluckBuf(midi, dur, false, false), t, SAZ * g, pan, send);
    function saz(t, midi, dur, g = 1, o = {}) {
      const pan = -0.12;
      if (o.trem) { // tril: hızlı aşağı-yukarı mızrap
        const k = Math.max(2, Math.round(dur / 0.0625));
        for (let i = 0; i < k; i++) put(music, pluckBuf(midi, 0.16, i % 2 === 1, false), t + i * 0.0625, SAZ * g * (i % 2 ? 0.72 : 0.9) * (o.cresc ? 0.45 + (0.65 * i) / k : 1), pan, 0.2);
        return;
      }
      if (o.drone) { // güçlü vuruşta mızrap alt tellerden geçer: Re-La dem sesi
        put(music, pluckBuf(50, 0.9, false, false), t - 0.014, SAZ * g * 0.4, pan - 0.1, 0.2);
        put(music, pluckBuf(57, 0.9, false, false), t - 0.007, SAZ * g * 0.34, pan, 0.2);
      }
      if (o.grace) { // çarpma: üst perdeden ana sese
        put(music, pluckBuf(o.grace, 0.07, false, false), t, SAZ * g * 0.75, pan, 0.2);
        put(music, pluckBuf(midi, dur, false, true), t + 0.055, SAZ * g * 0.95, pan, 0.22);
        return;
      }
      put(music, pluckBuf(midi, dur, !!o.up, false), t, SAZ * g, pan, 0.22);
    }

    /* ── yaylılar: tek sesli, bağlı (legato) ve kaydırmalı – Türk pop tarzı ── */
    const sawTab = new Float32Array(4097);
    for (let i = 0; i <= 4096; i++) { const p = (TAU * i) / 4096; let s = 0; for (let k = 1; k <= 12; k++) s += Math.sin(p * k) / k / (1 + (k / 7) * (k / 7)); sawTab[i] = s; }
    function strings(t0, notes, g) {
      const end = Math.max(...notes.map((x) => x[0] + x[2])) + 0.4, n = S(end), vl = new Float32Array(n), vr = new Float32Array(n);
      const tg = new Float32Array(n), gate = new Float32Array(n);
      for (const [o, m, d] of notes) { const a = Math.round(o * sr), b = Math.min(n, Math.round((o + d) * sr)), f = mtof(m); for (let i = a; i < b; i++) { tg[i] = f; gate[i] = 1; } }
      let f = mtof(notes[0][1]), last = f, amp = 0; const ph = [0, 1000, 2000, 3000], DET = [0.9948, 0.9983, 1.0023, 1.0058];
      const kf = 1 - Math.exp(-1 / (0.035 * sr)), ka2 = 1 - Math.exp(-1 / (0.07 * sr)), kr = 1 - Math.exp(-1 / (0.18 * sr));
      for (let i = 0; i < n; i++) {
        if (tg[i]) last = tg[i];
        f += (last - f) * kf; amp += (gate[i] - amp) * (gate[i] > amp ? ka2 : kr);
        const vib = 1 + 0.0045 * Math.sin((TAU * 5.6 * i) / sr);
        for (let o = 0; o < 4; o++) {
          const ip = ph[o] | 0, s = (sawTab[ip] + (sawTab[ip + 1] - sawTab[ip]) * (ph[o] - ip)) * amp;
          if (o % 2) { vr[i] += s; vl[i] += s * 0.4; } else { vl[i] += s; vr[i] += s * 0.4; }
          ph[o] += (f * vib * DET[o] * 4096) / sr; if (ph[o] >= 4096) ph[o] -= 4096;
        }
      }
      putSt(music, vl, vr, t0, 0.046 * g, 0.5);
    }

    /* ── çan / zil sesleri ── */
    function bell(b, t, f, dur, g, pan = 0, send = 0.4) {
      const n = S(dur), v = new Float32Array(n), R = [1, 2, 2.76, 4.07, 5.4], A = [1, 0.45, 0.32, 0.18, 0.1], Dk = [1, 0.7, 0.5, 0.35, 0.25];
      for (let k = 0; k < 5; k++) { if (f * R[k] > sr * 0.45) continue; const w = (TAU * f * R[k]) / sr, dec = (dur * Dk[k]) / 4.5; for (let i = 0; i < n; i++) v[i] += A[k] * Math.sin(w * i) * Math.exp(-i / sr / dec); }
      put(b, fade(v, 3, S(0.01)), t, g, pan, send);
    }
    const soft = (t, midi, g, pan) => { // bilim sahnesi arpeji
      const n = S(0.3), v = new Float32Array(n), w = (TAU * mtof(midi)) / sr;
      for (let i = 0; i < n; i++) v[i] = (Math.sin(w * i) + 0.3 * Math.sin(2 * w * i)) * Math.exp(-i / sr / 0.07);
      fade(v, 3, S(0.02));
      put(music, v, t, 0.15 * g, pan, 0.3); put(music, v, t + 0.1875, 0.06 * g, -pan, 0.3); put(music, v, t + 0.375, 0.03 * g, pan, 0.3);
    };

    /* ── ses efektleri ── */
    function whoosh(t, dur, f0, f1, g, p0 = -0.6, p1 = 0.6, peak = 0.6) {
      const n = S(dur), v = sweep(noise(n), (x) => (x < peak ? xp(f0, f1, x / peak) : xp(f1, f0, (x - peak) / (1 - peak))), 1.3, 'bp');
      const vl = new Float32Array(n), vr = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const x = i / n, e = Math.pow(Math.sin(Math.PI * Math.pow(x, 1 / (2 * peak) > 1 ? 1.4 : 1)), 2), a = ((p0 + (p1 - p0) * x + 1) * Math.PI) / 4;
        vl[i] = v[i] * e * Math.cos(a) * 1.4142; vr[i] = v[i] * e * Math.sin(a) * 1.4142;
      }
      putSt(sfx, vl, vr, t, g, 0.25);
    }
    function riser(t, dur, g) {
      const n = S(dur), v = sweep(noise(n), (x) => xp(350, 9000, x), 1.6, 'bp'); let ph = 0;
      for (let i = 0; i < n; i++) {
        const x = i / n; ph += (TAU * xp(196, 784, x)) / sr;
        const trem = 0.5 + 0.5 * Math.sin(TAU * (5 * x + 11 * x * x) * dur);
        v[i] = v[i] * Math.pow(x, 2.2) * 1.5 + (Math.sin(ph) + 0.4 * Math.sin(2 * ph)) * Math.pow(x, 2) * 0.22 * trem;
      }
      put(sfx, fade(v, 8, S(0.012)), t, g, 0, 0.3);
    }
    function impact(t, g = 1) {
      const n = S(1.7), v = new Float32Array(n), nz = filt(noise(n), bq('lp', 1700, 0.7)), hz = filt(noise(n), bq('hp', 3200, 0.7)); let ph = 0;
      for (let i = 0; i < n; i++) {
        const tt = i / sr; ph += (TAU * (33 + 46 * Math.exp(-tt / 0.09))) / sr;
        v[i] = Math.tanh(Math.sin(ph) * Math.exp(-tt / 0.5) * 1.5) + nz[i] * 1.3 * Math.exp(-tt / 0.085) + hz[i] * 0.22 * Math.exp(-tt / 0.3);
      }
      put(sfx, fade(v, 4, S(0.1)), t, 0.62 * g, 0, 0.4);
    }
    function hit(t, g = 1) {
      const n = S(0.5), v = new Float32Array(n), nz = filt(noise(n), bq('bp', 1100, 0.8)); let ph = 0;
      for (let i = 0; i < n; i++) { const tt = i / sr; ph += (TAU * (52 + 70 * Math.exp(-tt / 0.04))) / sr; v[i] = Math.sin(ph) * Math.exp(-tt / 0.14) + nz[i] * 1.8 * Math.exp(-tt / 0.045); }
      put(sfx, fade(v, 4, S(0.04)), t, 0.42 * g, 0, 0.3);
    }
    function tick(t, f, g, pan) {
      const n = S(0.05), v = new Float32Array(n);
      for (let i = 0; i < n; i++) { const tt = i / sr; v[i] = (Math.sin(TAU * f * tt) + 0.3 * Math.sin(TAU * 2 * f * tt)) * Math.exp(-tt / 0.011); }
      put(sfx, fade(v, 2, S(0.005)), t, g, pan, 0.12);
    }
    const ticks = (t0, t1, f0 = 1300, f1 = 2500, g = 0.1) => { const n = Math.floor((t1 - t0) / 0.0625); for (let i = 0; i < n; i++) tick(t0 + i * 0.0625, xp(f0, f1, i / n), g * (0.7 + 0.3 * (i / n)), i % 2 ? 0.35 : -0.35); };
    const ding = (t, g = 1) => { bell(sfx, t, mtof(86), 1.4, 0.13 * g, -0.2, 0.5); bell(sfx, t + 0.01, mtof(93), 1.2, 0.09 * g, 0.2, 0.5); };
    const ching = (t, g = 1) => {
      const n = S(0.06), v = filt(noise(n), bq('hp', 6000, 0.8)); for (let i = 0; i < n; i++) v[i] *= Math.exp(-i / sr / 0.012);
      put(sfx, v, t, 0.16 * g, 0, 0.2);
      bell(sfx, t + 0.02, mtof(98), 0.9, 0.11 * g, -0.25, 0.4); bell(sfx, t + 0.085, mtof(102), 1.1, 0.12 * g, 0.25, 0.4);
    };
    const blip = (t, midi, g = 1, pan = 0) => bell(sfx, t, mtof(midi), 0.5, 0.11 * g, pan, 0.35);
    const swish = (t, g = 1, dir = 1) => whoosh(t, 0.22, 2500, 9000, 0.3 * g, -0.5 * dir, 0.5 * dir, 0.7);
    function shimmer(t, dur, g) {
      const ns = [86, 90, 93, 98, 102, 105];
      for (let i = 0; i < 16; i++) bell(sfx, t + rnd() * dur, mtof(ns[(rnd() * ns.length) | 0]), 1.2, 0.035 * g * (0.5 + rnd()), rnd() * 1.6 - 0.8, 0.7);
    }
    function whistle(t, dur, g) {
      const n = S(dur + 0.3), v = new Float32Array(n), br = filt(noise(n), bq('bp', 2200, 1.5));
      for (const m of [74, 78, 81]) {
        let ph = rnd() * TAU; const f = mtof(m);
        for (let i = 0; i < n; i++) { const tt = i / sr; ph += (TAU * f * (1 + 0.004 * Math.sin(TAU * 5.5 * tt))) / sr; v[i] += Math.sin(ph) + 0.4 * Math.sin(2 * ph) + 0.15 * Math.sin(3 * ph); }
      }
      for (let i = 0; i < n; i++) { const tt = i / sr, e = Math.min(1, tt / 0.07) * (tt > dur ? Math.max(0, 1 - (tt - dur) / 0.28) : 1); v[i] = (v[i] / 3 + br[i] * 0.5) * e; }
      put(sfx, v, t, g, 0.45, 0.6);
    }
    const chugBuf = (() => {
      const n = S(0.11), v = filt(noise(n), bq('bp', 750, 0.7));
      for (let i = 0; i < n; i++) v[i] *= Math.exp(-i / sr / 0.03) * 3;
      return fade(v, S(0.002), S(0.01));
    })();
    function sizzle(t0, t1, g) {
      const n = S(t1 - t0), mkCh = () => {
        const v = filt(noise(n), bq('hp', 4800, 0.7)); let m = 0;
        for (let i = 0; i < n; i++) {
          m += 0.004 * (rnd() - m); const x = i / n, e = Math.min(1, x / 0.08, (1 - x) / 0.08), pop = rnd() < 0.0006 ? 6 : 1;
          v[i] *= e * (0.25 + 6 * m * m) * pop;
        }
        return v;
      };
      putSt(sfx, mkCh(), mkCh(), t0, g, 0.05);
    }

    /* ═════════════ DÜZENLEME ═════════════
       Akor yürüyüşü (ölçü başına): Re · Mi♭maj7 · Do m7 · Re7 – hicazın pop armonisi */
    const BAR = 2, S16 = 0.125;
    const P = [
      { root: 38, ep: [54, 57, 62, 66], pad: [50, 57, 62, 66] },
      { root: 39, ep: [55, 58, 62, 63], pad: [51, 58, 63, 67] },
      { root: 36, ep: [55, 58, 60, 63], pad: [48, 55, 60, 63] },
      { root: 38, ep: [54, 57, 60, 62], pad: [50, 57, 62, 66] },
    ];
    const D = P[0].pad;
    // nakarat ezgisi – [16'lık adım, nota, süre, işaret]  d: dem telleri · u: yukarı mızrap · c: çarpma · t: tril
    const HOOK = [
      [[0, 69, 3, 'd'], [3, 67, 1, 'u'], [4, 66, 2, 'c'], [6, 63, 2], [8, 62, 4, 't'], [12, 66, 2], [14, 67, 2, 'u']],
      [[0, 70, 3, 'd'], [3, 69, 1, 'u'], [4, 67, 2], [6, 70, 2], [8, 67, 3, 'd'], [11, 63, 1, 'u'], [12, 67, 2], [14, 69, 2]],
      [[0, 72, 3, 'd'], [3, 70, 1, 'u'], [4, 67, 2], [6, 63, 2], [8, 67, 2, 'd'], [10, 70, 2], [12, 69, 2], [14, 67, 2]],
      [[0, 66, 2, 'c'], [2, 67, 1, 'u'], [3, 66, 1], [4, 63, 2], [6, 66, 2], [8, 62, 6, 't'], [14, 57, 2]],
    ];
    const FILL = [[62, 63, 66, 67, 69, 67, 66, 63], [69, 70, 69, 67, 66, 63, 62, 0], [66, 67, 69, 70, 69, 67, 66, 63]];
    const SOLO = [
      [62, 62, 63, 62, 66, 66, 67, 66, 69, 69, 70, 69, 67, 66, 63, 62],
      [70, 69, 67, 66, 67, 66, 63, 62, 63, 62, 60, 62, 58, 60, 62, 63],
      [66, 63, 62, 60, 62, 0, 62, 63, 66, 67, 69, 70],
    ];
    const maksum = (t, g) => {
      dum(t, g); tek(t + 2 * S16, g); ka(t + 3 * S16, g * 0.6); ka(t + 5 * S16, g * 0.5); tek(t + 6 * S16, g * 0.9);
      dum(t + 8 * S16, g * 0.9); ka(t + 10 * S16, g * 0.6); ka(t + 11 * S16, g * 0.45); tek(t + 12 * S16, g); ka(t + 14 * S16, g * 0.6); ka(t + 15 * S16, g * 0.5);
    };
    const shaker = (t, g) => put(drums, shakeBuf, t, g * 1.4, 0.4);
    const skip = new Set([17.5, 23.5, 33.5, 39.5, 53.5]); // geçişlerden önce nefes

    // giriş 0–4: ped üstünde serbest saz (açış)
    pad(0, D, 3.8, 0.42, 0.3, 1.2, 0.3); pad(0, [38], 3.8, 0.22, 0.2, 0.8, 0.3);
    saz(0.04, 62, 1.5, 1.1, { drone: true });
    whoosh(0, 1.2, 300, 2400, 0.16, -0.7, 0.7, 0.75);
    hit(0.5, 0.75); saz(0.5, 69, 0.9, 1); hit(1.0, 0.75); saz(1.0, 70, 0.9, 1, { grace: 72 }); hit(1.5, 0.75); saz(1.5, 66, 0.9, 1, { grace: 67 });
    impact(2.0, 0.95); saz(2.0, 62, 1.2, 1.1, { drone: true });
    [69, 67, 66, 63].forEach((m, i) => saz(2.5 + i * S16, m, 0.3, 0.85, { up: i % 2 === 1 }));
    saz(3.0, 62, 1.0, 1.1, { trem: true, cresc: true });
    riser(3.0, 1.0, 0.5); whoosh(3.7, 0.5, 500, 5000, 0.4, 0, 0, 0.55);

    const SECT = [[2, 5, 'open'], [5, 9, 'chorus'], [9, 12, 'verse'], [12, 17, 'chorus'], [17, 20, 'doner'], [23, 27, 'chorus']];
    for (const [a, z, type] of SECT) {
      const line = [], lift = a === 23;
      for (let b = a; b < z; b++) {
        const t = b * BAR, i = (b - a) % 4, ch = P[i], st = (k) => t + k * S16;
        // davul
        const K = type === 'chorus' ? [0, 4, 8, 12] : type === 'verse' ? [0, 6, 10] : type === 'doner' ? [0, 7, 8] : b === 2 ? [0] : [0, 10];
        for (const k of K) if (!skip.has(st(k))) kick(st(k), type === 'open' ? 0.8 : 1);
        if (type === 'open') { if (b > 2) { tek(st(4), 0.5); tek(st(12), 0.5); } } else for (const k of [4, 12]) { snare(st(k), 1); clap(st(k), type === 'chorus' ? 0.9 : 0.55); }
        for (let k = 0; k < 16; k++) {
          if (type === 'chorus') { hat(st(k), k % 2 ? 0.032 : 0.058, false); if (k % 4 === 2) hat(st(k), 0.08, true); } else if (k % 2 === 0) hat(st(k), k % 4 === 0 ? 0.065 : 0.045, false);
          if (b > 2) shaker(st(k), (k % 4 === 2 ? 0.05 : 0.028) * (type === 'chorus' ? 1 : 0.7));
        }
        if (type === 'verse') hat(st(14), 0.075, true);
        if (type === 'doner') maksum(t, 0.95);
        if (type === 'chorus') { tek(st(6), 0.4); ka(st(7), 0.3); tek(st(14), 0.4); ka(st(15), 0.3); if (lift) { ka(st(3), 0.3); ka(st(11), 0.3); } }
        // bas
        if (type === 'chorus') [0, 0, 12, 0, 0, 0, 12, 7].forEach((o, j) => bass(st(j * 2), ch.root + o, S16 * 1.7, j % 2 ? 0.85 : 1));
        else if (type === 'verse' || (type === 'open' && b > 2)) [[0, 0, 3], [3, 0, 1], [6, 12, 1.5, 0], [8, 0, 2], [11, 7, 1], [14, 7, 2, 0]].forEach(([k, o, d, sl]) => bass(st(k), ch.root + o, d * S16, 1, sl === 0 ? ch.root : undefined));
        else if (type === 'doner') [[0, 0, 3], [6, 0, 1], [8, 0, 3], [14, 7, 2]].forEach(([k, o, d]) => bass(st(k), ch.root + o, d * S16, 1));
        // armoni
        pad(t, ch.pad, BAR - 0.1, 0.15);
        if (type !== 'doner') [[0, 5], [6, 2], [10, 4], [14, 2]].forEach(([k, d], j) => ch.ep.forEach((m, q) => ep(st(k) + q * 0.005, m, d * S16, j === 0 ? 1 : 0.72, (q - 1.5) * 0.3)));
        // bağlama
        if (type === 'chorus') for (const [k, m, d, fl] of HOOK[i]) {
          saz(st(k), m, fl === 't' ? d * S16 : Math.min(0.9, d * S16 + 0.25), 1, fl === 't' ? { trem: true } : fl === 'c' ? { grace: m + 1 } : { drone: fl === 'd', up: fl === 'u' });
          if (d >= 2) line.push([(b - a) * BAR + k * S16, m + 12, d * S16]);
        }
        if ((type === 'verse' || type === 'open') && b > a) FILL[(b - a) % 3].forEach((m, j) => m && saz(st(8 + j), m, 0.36, 0.9, { up: j % 2 === 1, drone: j === 0 }));
        if (type === 'doner') {
          SOLO[b - a].forEach((m, j) => m && saz(st(j), m, 0.3, 1.3, { up: j % 2 === 1, drone: j % 8 === 0 }));
          if (b === z - 1) saz(st(12), 74, 0.5, 1.1, { trem: true, cresc: true });
        }
      }
      if (line.length) { // yaylılar ezgiyi bir oktav üstten, bağlı çalar
        line.forEach((x, j) => { if (line[j + 1]) x[2] = line[j + 1][0] - x[0]; });
        strings(a * BAR, line, lift ? 1.2 : 1);
      }
    }
    // 44–46: nakarata tırmanış
    for (let k = 0; k < 4; k++) { kick(44 + k * 0.5, 0.8); hat(44.25 + k * 0.5, 0.08, true); }
    for (let k = 0; k < 8; k++) bass(44 + k * 0.25, 38, S16 * 1.7, 0.9);

    // 2 · 1961 (4–10): tren, düdük
    impact(4.0, 0.7); whistle(4.3, 0.6, 0.085);
    for (let i = 0; i < 42; i++) {
      const t = 4.25 + i * S16, x = i / 42, env = Math.min(1, x / 0.15, (1 - x) / 0.2);
      put(sfx, chugBuf, t, 0.2 * env * [1, 0.45, 0.7, 0.45][i % 4], 0.7 - 1.4 * x, 0.1);
    }
    blip(5.0, 81, 0.7, 0.5); blip(6.3, 86, 0.9, -0.5);
    swish(6.0, 0.6); swish(7.0, 0.6, -1); hit(8.0, 0.6);
    for (let i = 0; i < 8; i++) snare(9.0 + i * S16, 0.25 + i * 0.09);
    riser(9.0, 1.0, 0.55); whoosh(9.55, 0.5, 400, 4500, 0.4, 0, 0, 0.8);

    // 3 · Almanya (10–18)
    impact(10.0, 0.9); hit(11.0, 0.9); hit(12.0, 0.9);
    whoosh(12.7, 0.5, 600, 6000, 0.3, 0.6, -0.6); hit(13.0, 0.5);
    ticks(13.1, 14.95); impact(15.0, 1); ding(15.0);
    blip(15.25, 81, 0.8, 0.4); swish(15.5, 0.6); blip(16.5, 86, 0.9, -0.3);
    whoosh(17.5, 0.6, 300, 7000, 0.45, 0, 0, 0.85);

    // 4 · Berlin (18–24)
    impact(18.0, 0.9);
    ticks(19.0, 20.45); hit(20.5, 0.6); ding(20.5);
    [[21.0, 81, -0.5], [21.5, 86, 0], [22.0, 90, 0.5]].forEach(([t, m, p]) => { tek(t, 0.9); blip(t, m, 1, p); });
    swish(22.5, 0.6); whoosh(23.55, 0.6, 500, 6000, 0.45, -0.8, 0.8);
    for (let i = 0; i < 4; i++) snare(23.5 + i * S16, 0.4 + i * 0.12);

    // 5 · Ekonomi (24–34)
    impact(24.0, 0.85); swish(24.6, 0.7);
    [26, 28].forEach((t, i) => {
      whoosh(t - 0.4, 0.5, 600, 6000, 0.36, i ? -0.7 : 0.7, i ? 0.7 : -0.7); hit(t, 0.7);
      ticks(t + 0.05, t + 1.12); ching(t + 1.15); hit(t + 1.15, 0.45);
    });
    whoosh(29.6, 0.5, 600, 6000, 0.36, 0, 0, 0.7); hit(30.0, 0.7);
    ticks(30.3, 31.45, 900, 3200, 0.1);
    { // grafik çizgisi yükselirken tırmanan ton
      const n = S(1.15), v = new Float32Array(n); let ph = 0;
      for (let i = 0; i < n; i++) { const x = i / n; ph += (TAU * xp(294, 1175, x * x)) / sr; v[i] = (Math.sin(ph) + 0.35 * Math.sin(2 * ph)) * (0.2 + 0.8 * x); }
      put(sfx, fade(v, S(0.02), S(0.01)), 30.3, 0.085, 0.2, 0.3);
    }
    impact(31.5, 1); ching(31.5, 1.4); ching(31.72, 0.8); hit(32.0, 0.55); swish(32.5, 0.5);
    whoosh(33.5, 0.6, 400, 5000, 0.45, 0.8, -0.3, 0.85);
    for (let i = 0; i < 4; i++) { tek(33.5 + i * S16, 0.5 + i * 0.15); }

    // 6 · Döner (34–40)
    impact(34.0, 0.85); sizzle(34.1, 39.6, 0.05);
    [34.5, 35.5, 36.5, 37.5, 38.5].forEach((t, i) => swish(t, 0.42, i % 2 ? 1 : -1));
    hit(35.0, 0.7); hit(36.0, 0.7);
    ticks(37.0, 38.15, 1300, 2500, 0.075); ding(38.2, 0.8);
    for (let i = 0; i < 8; i++) (i % 2 ? ka : tek)(39.5 + i * 0.0625, 0.5 + i * 0.07);
    whoosh(39.5, 0.5, 5000, 500, 0.4, 0, 0, 0.3);

    // 7 · Bilim (40–46): davulsuz, havadar
    impact(40.0, 0.6); shimmer(40.0, 1.8, 1);
    pad(40, [62, 66, 69, 74], 1.9, 0.4, 0.22, 0.25, 0.5); pad(42, [63, 67, 70, 75], 1.9, 0.4, 0.22, 0.25, 0.5); pad(44, [62, 66, 69, 74, 78], 1.9, 0.44, 0.22, 0.25, 0.3);
    pad(40, [38], 1.9, 0.2, 0.1); pad(42, [39], 1.9, 0.2, 0.1);
    const arp = [74, 78, 81, 86, 81, 78, 74, 78, 81, 86, 81, 78, 74, 78, 81, 86];
    for (let b = 20; b < 23; b++) arp.forEach((m, i) => soft(b * BAR + i * S16, m + (b === 21 ? 1 : 0), b === 22 ? 0.8 + i * 0.03 : 0.9, i % 2 ? 0.5 : -0.5));
    [41.0, 41.5, 42.5, 42.9].forEach((t, i) => swish(t, 0.4, i % 2 ? 1 : -1));
    hit(44.0, 0.6); hit(44.5, 0.6);
    [44.0, 44.5, 45.0].forEach((t, i) => bell(sfx, t, mtof(81), 1.6, 0.07, [-0.4, 0, 0.4][i], 0.8));
    for (let i = 0; i < 8; i++) snare(44 + i * 0.25, 0.25 + i * 0.03);
    for (let i = 0; i < 4; i++) snare(45 + i * S16, 0.45 + i * 0.05);
    for (let i = 0; i < 8; i++) snare(45.5 + i * 0.0625, 0.6 + i * 0.07);
    riser(45.0, 1.0, 0.6); whoosh(45.6, 0.5, 500, 6000, 0.4, 0.7, -0.7);

    // 8 · Kültür (46–54): dört kart, dört vuruş
    impact(46.0, 0.9); hit(46.5, 0.5);
    [48, 50, 52].forEach((t, i) => { whoosh(t - 0.4, 0.5, 600, 7000, 0.4, i % 2 ? -0.7 : 0.7, i % 2 ? 0.7 : -0.7); hit(t, 0.85); hit(t + 0.5, 0.45); swish(t + 0.9, 0.4); });
    swish(46.9, 0.4);
    for (let i = 0; i < 4; i++) snare(53.5 + i * S16, 0.5 + i * 0.12);
    whoosh(53.55, 0.48, 6000, 300, 0.5, 0, 0, 0.25);

    // 9 · Final (54–60)
    impact(54.0, 1.05); kick(54.0, 1); pad(54, D, 2.8, 0.34, 0.3, 0.05, 0.4); pad(54, [38], 2.8, 0.3, 0.1, 0.05, 0.3);
    hit(54.5, 0.65); kick(55.0, 0.7);
    whoosh(54.98, 0.34, 1500, 9000, 0.55, -0.9, 0.9, 0.7);
    impact(55.5, 1); kick(55.5, 1); ding(55.5, 0.9); [62, 66, 69].forEach((m, i) => pluck(55.5 + i * 0.02, m, 1.2, 1, i - 1, 0.4));
    kick(56.0, 0.8); kick(56.5, 0.8);
    for (let i = 0; i < 8; i++) snare(56.0 + i * S16, 0.3 + i * 0.08);
    for (let i = 0; i < 16; i++) pluck(56.0 + i * 0.0625, 74, 0.2, 0.3 + (i / 16) * 0.9, i % 2 ? 0.3 : -0.3, 0.25);
    riser(56.0, 1.0, 0.7); whoosh(56.6, 0.5, 500, 6000, 0.4, 0, 0, 0.8);
    impact(57.0, 1.1); shimmer(57.0, 1.6, 1);
    [57.0, 57.5, 58.0, 58.5, 59.0].forEach((t, i) => kick(t, [1, 0.75, 0.6, 0.45, 0.3][i]));
    hit(57.5, 0.7); clap(57.5, 0.9); clap(58.5, 0.5);
    pad(57, [50, 57, 62, 66, 74], 2.4, 0.55, 0.3, 0.04, 0.6); bass(57.0, 38, 2.6, 0.8);
    [50, 62, 69, 74, 78].forEach((m, i) => pluck(57.0 + i * 0.022, m, 2.4, 1.1, i / 2 - 1, 0.45));
    [[58.0, 69, 0.5], [58.25, 66, 0.5], [58.5, 63, 0.6], [58.75, 62, 1.2]].forEach(([t, m, d], i) => pluck(t, m, d, 1, i % 2 ? 0.2 : -0.2, 0.45));
    [86, 93, 98].forEach((m, i) => bell(sfx, 58.2 + i * 0.07, mtof(m), 1.7, 0.085, i - 1, 0.6));

    /* ═════════════ MİKS ═════════════ */
    // yan zincir: her bas davulda müzik hattı kısılır
    const duck = new Float32Array(N).fill(1);
    for (const [t, g] of kicks) {
      const i0 = Math.round(t * sr), n = Math.min(S(0.45), N - i0);
      for (let i = 0; i < n; i++) { const d = 1 - 0.38 * g * Math.exp(-i / sr / 0.09) * Math.min(1, i / (0.004 * sr)); if (d < duck[i0 + i]) duck[i0 + i] = d; }
    }
    // yankı (Schroeder: paralel taraklar + seri tüm-geçirenler)
    function reverb(x, spread) {
      const out = new Float32Array(N), k = sr / 44100;
      filt(x, bq('hp', 260, 0.7));
      for (const len of [1116, 1188, 1277, 1356, 1422, 1491]) {
        const L = Math.round((len + spread) * k), buf = new Float32Array(L); let idx = 0, lp = 0;
        for (let i = 0; i < N; i++) { const y = buf[idx]; lp = y * 0.72 + lp * 0.28; buf[idx] = x[i] + lp * 0.86; out[i] += y; idx = idx + 1 === L ? 0 : idx + 1; }
      }
      for (const len of [556, 441, 341]) {
        const L = Math.round((len + spread) * k), buf = new Float32Array(L); let idx = 0;
        for (let i = 0; i < N; i++) { const b = buf[idx], y = b - out[i]; buf[idx] = out[i] + b * 0.5; out[i] = y; idx = idx + 1 === L ? 0 : idx + 1; }
      }
      return out;
    }
    const wl = reverb(rev.L, 0), wr = reverb(rev.R, 23);
    const L = new Float32Array(N), R = new Float32Array(N);
    let dcl = 0, dcr = 0, pl = 0, pr = 0;
    const fo = S(0.45);
    for (let i = 0; i < N; i++) {
      const d = duck[i];
      let l = drums.L[i] + music.L[i] * d + sfx.L[i] + wl[i] * 0.16;
      let r = drums.R[i] + music.R[i] * d + sfx.R[i] + wr[i] * 0.16;
      // DC süzgeci + yumuşak sınırlayıcı
      dcl = l - pl + 0.9985 * dcl; pl = l; dcr = r - pr + 0.9985 * dcr; pr = r;
      const f = i > N - fo ? (N - i) / fo : 1;
      L[i] = Math.tanh(dcl * 0.58) * 0.93 * f; R[i] = Math.tanh(dcr * 0.58) * 0.93 * f;
    }
    return { sr, L, R, stems: root.BK_STEMS ? { drums, music, sfx, wet: { L: wl, R: wr }, duck } : undefined };
  }

  function wav(a) { // 16 bit stereo WAV
    const n = a.L.length, buf = new ArrayBuffer(44 + n * 4), v = new DataView(buf);
    const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    str(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); str(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
    v.setUint32(24, a.sr, true); v.setUint32(28, a.sr * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, n * 4, true);
    for (let i = 0; i < n; i++) {
      v.setInt16(44 + i * 4, Math.max(-1, Math.min(1, a.L[i])) * 32767, true);
      v.setInt16(46 + i * 4, Math.max(-1, Math.min(1, a.R[i])) * 32767, true);
    }
    return new Uint8Array(buf);
  }

  root.BKAudio = { render, wav };
})(typeof globalThis !== 'undefined' ? globalThis : this);
