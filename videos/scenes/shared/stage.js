/*
 * Ortak sahne altyapısı.
 *
 * Her sahne kare kare render edilir: render.mjs sayfayı açar, `window.seek(t)`
 * ile zamanı ayarlar ve ekran görüntüsü alır. Bu yüzden hiçbir şey gerçek
 * zamana bağlı olmamalı: tüm hareket ya GSAP zaman çizelgesinden ya da
 * `draw(t)` fonksiyonlarından gelir, rastgelelik de tohumlu üreteçten.
 *
 * `cue(t, type, data)` ses ipuçlarını toplar; audio/*.py bunları okuyup
 * müziği ve efektleri aynı zamanlara oturtur.
 */
(function () {
  const W = 1080;
  const H = 1920;

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Zamanın deterministik gürültüsü: aynı (t, kanal) her zaman aynı değeri verir. */
  function hashNoise(i, ch = 0) {
    let h = (Math.imul(i | 0, 374761393) + Math.imul(ch | 0, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  /** Yumuşak 1B değer gürültüsü, [-1, 1]. */
  function smoothNoise(x, ch = 0) {
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * (3 - 2 * f);
    const a = hashNoise(i, ch) * 2 - 1;
    const b = hashNoise(i + 1, ch) * 2 - 1;
    return a + (b - a) * u;
  }

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const smooth = (a, b, v) => {
    const k = clamp((v - a) / (b - a));
    return k * k * (3 - 2 * k);
  };

  function createScene({ duration, fonts = [] }) {
    const cues = [];
    const drawers = [];
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });

    const scene = {
      W,
      H,
      tl,
      duration,
      cues,
      cue(t, type, data = {}) {
        cues.push({ t: +t.toFixed(4), type, ...data });
      },
      onDraw(fn) {
        drawers.push(fn);
      },
      /** Belirli bir türdeki ipuçlarının t anına etkisi (darbe zarfı). */
      impulse(t, types, decay = 10, window = 1) {
        let v = 0;
        for (const c of cues) {
          if (!types.includes(c.type)) continue;
          const d = t - c.t;
          if (d >= 0 && d < window) v += (c.amp ?? 1) * Math.exp(-d * decay);
        }
        return v;
      },
      seek(t) {
        tl.seek(t, false);
        for (const fn of drawers) fn(t);
      },
    };

    scene.ready = (async () => {
      await Promise.all(fonts.map((f) => document.fonts.load(f, 'ğüşıöçİĞÜŞÖÇ Aa')));
      await document.fonts.ready;
    })();

    scene.finish = () => {
      cues.sort((a, b) => a.t - b.t);
      window.SCENE = { duration, cues };
      window.seek = (t) => scene.seek(t);
      scene.seek(0);
    };

    return scene;
  }

  /** Önceden üretilmiş gürültü karoları ile film greni. */
  function makeGrain(canvas, { opacity = 0.08, size = 256, tiles = 6, seed = 7, mono = true } = {}) {
    const ctx = canvas.getContext('2d');
    const rand = mulberry32(seed);
    const patterns = [];
    for (let k = 0; k < tiles; k++) {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d');
      const img = g.createImageData(size, size);
      for (let i = 0; i < size * size; i++) {
        const v = rand() * 255;
        img.data[i * 4] = v;
        img.data[i * 4 + 1] = mono ? v : rand() * 255;
        img.data[i * 4 + 2] = mono ? v : rand() * 255;
        img.data[i * 4 + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      patterns.push(ctx.createPattern(c, 'repeat'));
    }
    canvas.style.opacity = opacity;
    return (t, fps = 30) => {
      const f = Math.round(t * fps);
      ctx.save();
      ctx.fillStyle = patterns[f % tiles];
      ctx.translate(-hashNoise(f, 91) * size, -hashNoise(f, 92) * size);
      ctx.fillRect(0, 0, canvas.width + size, canvas.height + size);
      ctx.restore();
    };
  }

  window.Stage = { W, H, createScene, mulberry32, hashNoise, smoothNoise, clamp, lerp, smooth, makeGrain };
})();
