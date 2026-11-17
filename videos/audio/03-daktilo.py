"""03 — Daktilo: tuş vuruşları, satır başı zili, kırmızı kalem ve sıcak bir lo-fi piyano yatağı."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
import numpy as np
from synth import *

cues_path, out = main_args()
dur, cues = load_cues(cues_path)
M = Mix(dur)
rng = np.random.default_rng(8)


def key(kind, v):
    d = 0.12
    t = t_axis(d)
    click = filt(noise(d), 'highpass', 3500) * np.exp(-t * 900) * 0.9
    body = filt(noise(d), 'bp', (700 + 600 * v, 2600 + 1500 * v)) * np.exp(-t * 70) * 0.8
    thunk = sine(150 + 70 * v, d) * np.exp(-t * 55) * 0.6
    ping = sine(3800 + 1400 * v, d) * np.exp(-t * 120) * 0.08
    # tip çubuğu kâğıda çarpar: ikinci küçük tık
    out = click + body + thunk + ping
    i = int((0.008 + 0.004 * v) * SR)
    out[i:] += click[: len(out) - i] * 0.5
    if kind == 'space':
        out = filt(out, 'lowpass', 1800) * 1.3
    if kind == 'punct':
        out *= 0.85
    return out


def carriage():
    d = 0.6
    out = np.zeros(int(d * SR))
    # mandal tıkırtıları
    for k in range(9):
        c = filt(noise(0.02), 'bp', (1500, 6000)) * env_exp(0.02, 250) * 0.35
        i = int((0.03 + k * 0.035) * SR)
        out[i:i + len(c)] += c
    slide = filt(noise(0.35), 'bp', (300, 1800)) * np.sin(np.linspace(0, np.pi, int(0.35 * SR))) * 0.12
    out[: len(slide)] += slide
    end = filt(noise(0.08), 'bp', (200, 1500)) * env_exp(0.08, 50) * 0.7 + sine(110, 0.08) * env_exp(0.08, 40) * 0.6
    i = int(0.4 * SR)
    out[i:i + len(end)] += end
    return out


def pen(d):
    n = filt(noise(d), 'bp', (1800, 7000))
    t = t_axis(d)
    strokes = 0.6 + 0.4 * np.abs(np.sin(2 * np.pi * t * (5 + 2 * rng.random())))
    e = np.clip(t / 0.04, 0, 1) * np.clip((d - t) / 0.08, 0, 1)
    return n * strokes * e * 0.22


# ---- efektler ----
for c in cues:
    t, ty = c['t'], c['type']
    if ty == 'key':
        k = c.get('k', 'letter')
        M.add(key(k, c.get('v', 0.5)), t, 0.55 if k != 'space' else 0.5, pan=rng.uniform(-0.15, 0.15), bus='keys')
    elif ty == 'bell':
        M.add(bell(2093, 1.8) * 0.9 + bell(2637, 1.8) * 0.25, t, 0.45, pan=0.35, bus='keys')
    elif ty == 'return':
        M.add(carriage(), t, 0.75, pan=-0.2, bus='keys')
    elif ty == 'pen':
        M.add(pen(c['dur']), t, 1.0, pan=0.1, bus='keys')
    elif ty == 'zoom':
        M.add(reverb(whoosh(c['dur'], up=False, f_lo=150, f_hi=2500), 2, 0.4), t, 0.25, bus='fx')
    elif ty == 'end':
        M.add(reverb(piano(note(65), 5, 0.6) + piano(note(72), 5, 0.5) * 0.7 + piano(note(76), 5, 0.4) * 0.5, 4, 0.5), t, 0.4, bus='fx')

keys_room = reverb(M.buses['keys'][:, 0] * 0.5 + M.buses['keys'][:, 1] * 0.5, 0.6, 1.0, bright=5000)
M.add(keys_room[: M.n], 0, 0.12, bus='room')

# ---- lo-fi yatak: Fmaj7 Em7 Dm7 Cmaj7, 75 BPM ----
BAR = 4 * 60 / 75
chords = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]
bed = np.zeros(M.n)
t = 0.8
k = 0
while t < dur:
    ch = chords[k % 4]
    for j, n in enumerate(ch):
        p = piano(note(n), BAR + 1, 0.35)
        a = int((t + j * 0.025) * SR)
        bed[a:a + len(p)] += p[: max(0, M.n - a)]
    bp = piano(note(ch[0] - 12), BAR, 0.5) * 1.2
    a = int(t * SR)
    bed[a:a + len(bp)] += bp[: max(0, M.n - a)]
    t += BAR
    k += 1
bed = filt(bed, 'lowpass', 2200)
wob = 1 + 0.004 * np.sin(2 * np.pi * 0.5 * np.arange(M.n) / SR)
crackle = np.zeros(M.n)
for _ in range(int(dur * 18)):
    i = rng.integers(0, M.n - 200)
    crackle[i:i + 60] += filt(rng.standard_normal(60), 'highpass', 2000) * rng.uniform(0.02, 0.12)
hiss = filt(noise(M.n / SR), 'bp', (800, 6000)) * 0.008
M.add(reverb(bed * wob, 2.5, 0.35), 0, 0.42, bus='bed')
M.add(crackle, 0, 0.6, bus='bed')
M.add(hiss, 0, 0.6, bus='bed')

M.render(out)
print('ses:', out)
