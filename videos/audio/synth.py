"""Küçük bir ses sentez kütüphanesi (numpy + scipy).

Videoların müziği ve efektleri tamamen burada üretilir: örnek dosyası yok,
lisans sorunu yok. Her sahnenin betiği render.mjs'in yazdığı cues.json'u
okur ve sesleri aynı zamanlara yerleştirir.
"""
import json
import sys

import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
RNG = np.random.default_rng(1234)


def load_cues(path):
    with open(path) as f:
        d = json.load(f)
    return d['duration'], d['cues']


class Mix:
    def __init__(self, dur):
        self.n = int(dur * SR) + SR
        self.dur = dur
        self.buses = {}

    def bus(self, name):
        if name not in self.buses:
            self.buses[name] = np.zeros((self.n, 2))
        return self.buses[name]

    def add(self, sig, t, gain=1.0, pan=0.0, bus='main'):
        b = self.bus(bus)
        if sig.ndim == 1:
            l = np.cos((pan + 1) * np.pi / 4)
            r = np.sin((pan + 1) * np.pi / 4)
            sig = np.stack([sig * l * 1.414, sig * r * 1.414], axis=1)
        i = int(round(t * SR))
        if i < 0:
            sig = sig[-i:]
            i = 0
        j = min(self.n, i + len(sig))
        if j > i:
            b[i:j] += sig[: j - i] * gain

    def render(self, out, master_gain=1.0, ceiling=0.89):
        x = sum(self.buses.values())
        x = x[: int(self.dur * SR)]
        x = x * master_gain
        # yumuşak sınırlayıcı
        peak = np.max(np.abs(x)) + 1e-9
        x = np.tanh(x * 1.1) / np.tanh(1.1)
        peak = np.max(np.abs(x)) + 1e-9
        x = x / peak * ceiling
        # baş/son tıklamaları önle
        f = int(0.01 * SR)
        x[:f] *= np.linspace(0, 1, f)[:, None]
        x[-f * 20:] *= np.linspace(1, 0, f * 20)[:, None]
        wavfile.write(out, SR, (x * 32767).astype(np.int16))


# ---------- temel yapı taşları ----------

def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def env_exp(dur, decay, attack=0.002):
    t = t_axis(dur)
    e = np.exp(-t * decay)
    a = int(attack * SR)
    if a > 0:
        e[:a] *= np.linspace(0, 1, a)
    return e


def env_adsr(dur, a=0.01, d=0.1, s=0.7, r=0.3):
    n = int(dur * SR)
    e = np.full(n, s)
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na)
    e[na:na + nd] = np.linspace(1, s, len(e[na:na + nd]))
    if nr > 0:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def noise(dur, stereo=False):
    n = int(dur * SR)
    return RNG.standard_normal((n, 2) if stereo else n)


def filt(x, kind, f, order=2):
    if kind == 'bp':
        sos = signal.butter(order, [max(20, f[0]), min(SR / 2 - 100, f[1])], 'bandpass', fs=SR, output='sos')
    else:
        sos = signal.butter(order, min(SR / 2 - 100, max(20, f)), kind, fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=0)


def sweep_filter(x, f0, f1, q_bands=10, width=0.6, lo=60, hi=16000):
    """Zamanla kayan bant geçiren: gürültüyü 'whoosh'a çevirir."""
    n = len(x)
    centers = np.geomspace(lo, hi, q_bands)
    track = np.geomspace(f0, f1, n)
    out = np.zeros_like(x)
    for c in centers:
        band = filt(x, 'bp', (c / 1.5, c * 1.5), 2)
        w = np.exp(-(np.log(track / c) ** 2) / (2 * width ** 2))
        out += band * (w if x.ndim == 1 else w[:, None])
    return out


def reverb(x, seconds=2.5, mix=0.3, predelay=0.02, bright=6000, seed=5):
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal((n, 2)) * np.exp(-t * 6.9 / seconds)[:, None]
    ir = filt(ir, 'lowpass', bright, 1)
    ir[: int(predelay * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2, axis=0))
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    wet = np.stack([signal.fftconvolve(x[:, k], ir[:, k])[: len(x) + n] for k in range(2)], axis=1)
    dry = np.zeros_like(wet)
    dry[: len(x)] = x
    return dry * (1 - mix) + wet * mix


def saw(freq, dur, harmonics=None, phase=0.0):
    """Band sınırlı testere (toplamsal)."""
    t = t_axis(dur)
    nyq = SR / 2
    hmax = harmonics or int(nyq / max(freq, 1))
    hmax = min(hmax, 60)
    out = np.zeros_like(t)
    for h in range(1, hmax + 1):
        if freq * h > nyq * 0.9:
            break
        out += np.sin(2 * np.pi * freq * h * t + phase * h) / h
    return out * 0.6


def sine(freq, dur, phase=0.0):
    t = t_axis(dur)
    if np.ndim(freq):
        ph = 2 * np.pi * np.cumsum(freq) / SR
        return np.sin(ph + phase)
    return np.sin(2 * np.pi * freq * t + phase)


def note(n):
    """MIDI numarası -> Hz"""
    return 440.0 * 2 ** ((n - 69) / 12)


# ---------- davullar ve efektler ----------

def kick(dur=0.5, f0=140, f1=42, punch=1.0):
    t = t_axis(dur)
    f = f1 + (f0 - f1) * np.exp(-t * 28)
    body = sine(f, dur) * np.exp(-t * 7)
    click = filt(noise(0.006), 'highpass', 2000) * np.linspace(1, 0, int(0.006 * SR)) * 0.4 * punch
    body[: len(click)] += click
    return np.tanh(body * 1.6)


def clap(dur=0.35):
    n = noise(dur)
    n = filt(n, 'bp', (900, 5000))
    t = t_axis(dur)
    e = np.exp(-t * 18)
    for k, off in enumerate([0, 0.011, 0.022]):
        i = int(off * SR)
        e[i:] += np.exp(-(t[: len(e) - i]) * 120) * 0.8
    return n * e * 0.5


def hat(dur=0.08, open_=False):
    n = filt(noise(dur if not open_ else 0.4), 'highpass', 7000)
    return n * env_exp(len(n) / SR, 12 if open_ else 55) * 0.35


def snare(dur=0.3):
    t = t_axis(dur)
    body = sine(185 + 60 * np.exp(-t * 40), dur) * np.exp(-t * 20)
    n = filt(noise(dur), 'bp', (1200, 9000)) * np.exp(-t * 14)
    return (body * 0.6 + n * 0.5)


def boom(dur=3.0, f=48, bright=1.0):
    t = t_axis(dur)
    sub = sine(f * (1 + 0.6 * np.exp(-t * 6)), dur) * np.exp(-t * 1.6)
    body = filt(noise(dur), 'lowpass', 300 + 1800 * bright) * np.exp(-t * 6) * 0.5
    crack = filt(noise(0.05), 'highpass', 1500) * np.exp(-t_axis(0.05) * 60) * 0.5 * bright
    out = sub + body
    out[: len(crack)] += crack
    return np.tanh(out * 1.3)


def whoosh(dur=0.6, up=True, f_lo=200, f_hi=9000):
    n = noise(dur, stereo=True)
    s = sweep_filter(n, f_lo if up else f_hi, f_hi if up else f_lo, width=0.5)
    t = t_axis(dur)
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    return s * e[:, None] * 0.9


def riser(dur=2.0, f0=200, f1=8000, tone=True):
    n = noise(dur, stereo=True)
    s = sweep_filter(n, f0, f1, width=0.45)
    t = t_axis(dur)
    e = (t / dur) ** 2.2
    out = s * e[:, None] * 0.8
    if tone:
        fr = np.geomspace(110, 880, len(t))
        ph = 2 * np.pi * np.cumsum(fr) / SR
        tn = (np.sin(ph) + 0.5 * np.sin(2 * ph * 1.003) + 0.25 * np.sin(3 * ph)) * e * 0.12
        out += np.stack([tn, tn], axis=1)
    return out


def shimmer(dur=1.6, base=1760, seed=3):
    rng = np.random.default_rng(seed)
    out = np.zeros((int(dur * SR), 2))
    for k in range(18):
        t0 = rng.uniform(0, dur * 0.6)
        f = base * rng.choice([1, 1.25, 1.5, 2, 2.5, 3])
        d = dur - t0
        tone = sine(f, d) * env_exp(d, 5 + rng.uniform(0, 4), 0.004) * 0.06
        i = int(t0 * SR)
        p = rng.uniform(-1, 1)
        out[i:i + len(tone), 0] += tone * (1 - p) / 2
        out[i:i + len(tone), 1] += tone * (1 + p) / 2
    return out


def pad(freqs, dur, cutoff=1800, detune=0.006, attack=0.6, release=1.0, voices=3):
    out = np.zeros(int(dur * SR))
    for f in freqs:
        for v in range(voices):
            d = 1 + detune * (v - (voices - 1) / 2)
            out += saw(f * d, dur, phase=RNG.uniform(0, 6.28))
    out = filt(out, 'lowpass', cutoff, 2)
    out *= env_adsr(dur, attack, 0.2, 0.9, release)
    return out / (len(freqs) * voices) * 1.5


def bell(f, dur=3.0, bright=1.0):
    parts = [(1, 1.0, 1.0), (2.0, 0.5, 1.6), (3.01, 0.25, 2.4), (4.2, 0.12, 3.5), (5.43, 0.08, 4.5)]
    out = np.zeros(int(dur * SR))
    for r, a, dk in parts:
        out += sine(f * r, dur) * a * bright ** (r - 1) * env_exp(dur, 1.2 * dk, 0.003)
    return out * 0.3


def piano(f, dur=3.0, vel=1.0):
    """Basit toplamsal piyano benzeri ton."""
    out = np.zeros(int(dur * SR))
    for h in range(1, 9):
        fh = f * h * (1 + 0.0004 * h * h)
        out += sine(fh, dur) * (vel ** (h * 0.3)) / h ** 1.3 * env_exp(dur, 1.0 + h * 0.9, 0.003)
    ham = filt(noise(0.02), 'bp', (f * 2, min(f * 12, 12000))) * env_exp(0.02, 200) * 0.05
    out[: len(ham)] += ham
    return out * 0.35 * vel


def sidechain(cues_t, n, depth=0.6, release=0.22):
    """Vuruş anlarında kısılan kazanç eğrisi (pompalama hissi)."""
    g = np.ones(n)
    t = np.arange(n) / SR
    for c in cues_t:
        i = int(c * SR)
        j = min(n, i + int(release * 4 * SR))
        if i >= n:
            continue
        d = t[i:j] - c
        g[i:j] = np.minimum(g[i:j], 1 - depth * np.exp(-d / release * 3))
    return g


def main_args():
    if len(sys.argv) < 3:
        print('Kullanım: script.py cues.json out.wav')
        sys.exit(1)
    return sys.argv[1], sys.argv[2]


def layer(*sigs):
    """Farklı uzunluktaki sinyalleri sıfırla doldurarak toplar."""
    n = max(len(s) for s in sigs)
    out = np.zeros((n,) + sigs[0].shape[1:])
    for s in sigs:
        out[: len(s)] += s
    return out
