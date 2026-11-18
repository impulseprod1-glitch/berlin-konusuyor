"""04 — Glitch: 100 BPM karanlık synth, çözülme blipleri, dijital bozulmalar, temiz final."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
import numpy as np
from synth import *

cues_path, out = main_args()
dur, cues = load_cues(cues_path)
M = Mix(dur)
rng = np.random.default_rng(42)
BEAT = 0.6
START, ATK0, ATK1, FIN = 1.0, 37.0, 41.0, 43.6


def crush(x, bits=5, down=6):
    y = np.repeat(x[::down], down)[: len(x)]
    q = 2 ** bits
    return np.round(y * q) / q


def glitch_burst(d, amp=1.0):
    n = int(d * SR)
    out = np.zeros(n)
    i = 0
    while i < n:
        seg = int(rng.uniform(0.01, 0.05) * SR)
        kind = rng.integers(0, 3)
        tt = np.arange(seg) / SR
        if kind == 0:
            s = np.sign(np.sin(2 * np.pi * rng.uniform(80, 1200) * tt)) * 0.4
        elif kind == 1:
            s = crush(rng.standard_normal(seg) * 0.5, 3, int(rng.integers(4, 30)))
        else:
            s = np.sin(2 * np.pi * rng.uniform(2000, 7000) * tt) * 0.3
        out[i:i + seg] += s[: n - i]
        i += seg
    return out * amp * np.clip(1 - np.arange(n) / n, 0.2, 1)


# ---- müzik ----
kicks = []
t = START
while t < FIN:
    b = int(round((t - START) / BEAT))
    atk = ATK0 <= t < ATK1
    if b % 4 in (0, 2) or (atk and b % 2 == 1):
        M.add(kick(0.6, 120, 38, 1.2), t, 0.9, bus='drums')
        kicks.append(t)
    if b % 4 == 2 and not atk:
        M.add(clap(), t, 0.5, bus='drums')
        M.add(snare(), t, 0.2, bus='drums')
    for h in range(4 if t > 19 else 2):
        M.add(hat(0.05), t + h * BEAT / (4 if t > 19 else 2), 0.22 if h % 2 else 0.3, pan=0.3, bus='drums')
    t += BEAT

# bas: 16'lık pulsar, Fa# minör
roots = [42, 42, 38, 40]  # F#, F#, D, E
bass = np.zeros(M.n)
t = START
while t < FIN:
    bar = int((t - START) / (BEAT * 4)) % 4
    f = note(roots[bar] - 12)
    for k in range(4):
        s = saw(f, 0.14, harmonics=20) * env_adsr(0.14, 0.003, 0.05, 0.5, 0.04)
        a = int((t + k * BEAT / 4) * SR)
        bass[a:a + len(s)] += s
    t += BEAT
bass = filt(bass, 'lowpass', 700)
bass += filt(bass, 'lowpass', 120) * 0.8
sc = sidechain(kicks, M.n, depth=0.85, release=0.18)
atkmask = np.ones(M.n)
a0, a1 = int(ATK0 * SR), int(ATK1 * SR)
dist = np.tanh(bass * 3) * 0.5
bass[a0:a1] = dist[a0:a1]
M.add(bass * sc, 0, 0.7, bus='bass')

# pad: soğuk, geniş
padb = np.zeros(M.n)
chords = [[54, 57, 61, 66], [54, 57, 61, 64], [50, 54, 57, 62], [52, 56, 59, 64]]
t = 0.0
k = 0
while t < FIN:
    p = pad([note(n) for n in chords[k % 4]], BEAT * 4 + 0.4, cutoff=1600, attack=0.3, release=0.4, voices=3)
    a = int(t * SR)
    padb[a:a + len(p)] += p[: M.n - a]
    t += BEAT * 4
    k += 1
M.add(reverb(padb * (0.4 + 0.6 * sc), 3, 0.45), 0, 0.4, bus='pad')

# final: temiz çözülüş akoru
fin = pad([note(n) for n in [42, 54, 61, 66, 69, 73]], dur - FIN, cutoff=3000, attack=1.2, release=3.5, voices=4)
M.add(reverb(fin, 5, 0.5), FIN + 0.6, 0.55, bus='pad')

# ---- efektler ----
for c in cues:
    t, ty = c['t'], c['type']
    if ty == 'decode':
        n = min(c['n'], 16)
        d = c['dur']
        for i in range(n):
            f = rng.choice([1320, 1760, 2093, 2637, 3136]) * (1 + 0.5 * (i % 3 == 0))
            b = np.sign(sine(f, 0.025)) * env_exp(0.025, 120) * 0.12
            M.add(b, t + d * i / n, 0.5, pan=rng.uniform(-0.6, 0.6), bus='fx')
        M.add(sine(note(90), 0.25) * env_exp(0.25, 14) * 0.2, t + d, 0.5, pan=0, bus='fx')
    elif ty == 'glitch':
        d = c.get('dur', 0.3)
        M.add(glitch_burst(d, c.get('amp', 1)), t, 0.35, pan=rng.uniform(-0.4, 0.4), bus='fx')
    elif ty == 'bgglitch':
        M.add(glitch_burst(c.get('dur', 0.2), 0.8), t, 0.22, pan=rng.uniform(-0.8, 0.8), bus='fx')
        M.add(reverb(bell(note(97), 0.6) * 0.6, 1, 0.4), t + 0.03, 0.18, bus='fx')
    elif ty == 'strike':
        s = sweep_filter(noise(0.3), 1500, 9000, width=0.4) * env_exp(0.3, 10)
        M.add(layer(s, kick(0.3, 200, 80) * 0.5), t, 0.6, pan=-0.3 + 0.3 * c['k'], bus='fx')
    elif ty == 'attack':
        d = c['until'] - t
        alarm = (np.sign(sine(note(78), d)) * 0.5 + np.sign(sine(note(79), d)) * 0.5) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 3.333 * t_axis(d))))
        M.add(filt(alarm, 'lowpass', 2500) * 0.06, t, 1, bus='fx')
        M.add(riser(1.6), c['until'] - 1.7, 0.35, bus='fx')
    elif ty == 'final':
        M.add(reverb(boom(5, 34, 1.0), 4, 0.4), t, 1.0, bus='fx')
        M.add(reverb(whoosh(0.8, up=False), 2, 0.4), t - 0.6, 0.4, bus='fx')
    elif ty == 'shield':
        g = 0.4 if c.get('soft') else 0.7
        sweep = sine(np.geomspace(220, 1760, int(0.6 * SR)), 0.6) * env_exp(0.6, 5) * 0.4
        M.add(reverb(layer(sweep, bell(note(78), 2) * 0.5), 3, 0.5), t, g, bus='fx')

M.render(out)
print('ses:', out)
