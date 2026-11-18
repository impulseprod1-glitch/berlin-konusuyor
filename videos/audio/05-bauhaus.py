"""05 — Bauhaus/Swiss: Do majör, marimba + tahta blok, mekanik ve oyunbaz bir ritim."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
import numpy as np
from synth import *

cues_path, out = main_args()
dur, cues = load_cues(cues_path)
M = Mix(dur)
rng = np.random.default_rng(5)
BPM = 112
BEAT = 60 / BPM
end_t = next(c['t'] for c in cues if c['type'] == 'end')
final_t = next(c['t'] for c in cues if c['type'] == 'seg' and c.get('final'))


def marimba(f, d=0.9, v=1.0):
    t = t_axis(d)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 6) + 0.35 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t * 22) + 0.12 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t * 60)
    return s * v * 0.5


def wood(f=900):
    t = t_axis(0.08)
    return (np.sin(2 * np.pi * f * t) * np.exp(-t * 70) + filt(noise(0.08), 'bp', (f, f * 3)) * np.exp(-t * 120) * 0.4) * 0.5


PENTA = [60, 62, 64, 67, 69, 72, 74, 76, 79]
prog = [[48, 55, 60, 64], [45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59]]

# ---- ritim ----
kicks = []
t = 0.6
b = 0
while t < final_t:
    if b % 4 in (0, 2) or (b % 8 == 7):
        M.add(kick(0.4, 110, 50, 0.6), t, 0.7, bus='drums')
        kicks.append(t)
    if b % 4 in (1, 3):
        M.add(clap(), t, 0.35, pan=0.1, bus='drums')
    M.add(wood(1800 if b % 2 else 1200), t + BEAT / 2, 0.18, pan=0.4 if b % 2 else -0.4, bus='drums')
    t += BEAT
    b += 1

# bas + marimba arpej
bar = 0
t = 0.6
while t < final_t:
    ch = prog[bar % 4]
    for k in range(8):
        tt = t + k * BEAT / 2
        if tt >= final_t:
            break
        if k in (0, 3, 6):
            s = (saw(note(ch[0] - 12), 0.3, harmonics=10) * 0.6 + sine(note(ch[0] - 12), 0.3)) * env_adsr(0.3, 0.003, 0.1, 0.4, 0.1)
            M.add(filt(s, 'lowpass', 700), tt, 0.5, bus='bass')
        n = ch[1 + (k % 3)] + 12
        M.add(marimba(note(n), 0.6, 0.6 if k % 2 else 0.9), tt, 0.22, pan=-0.3 + 0.6 * ((k * 3) % 8) / 8, bus='arp')
    t += BEAT * 4
    bar += 1

# ---- efektler ----
for c in cues:
    t, ty = c['t'], c['type']
    if ty == 'shape':
        M.add(marimba(note(int(rng.choice(PENTA)) + 12), 1.2, 1.0), t, 0.3, pan=rng.uniform(-0.5, 0.5), bus='fx')
        M.add(filt(noise(0.05), 'bp', (2000, 8000)) * env_exp(0.05, 80), t, 0.1, bus='fx')
    elif ty == 'line':
        M.add(wood(700 + 120 * c.get('li', 0)), t, 0.35, pan=-0.2, bus='fx')
    elif ty == 'hl':
        M.add(whoosh(0.25, up=True, f_lo=1500, f_hi=9000), t, 0.35, bus='fx')
        stab = sum(marimba(note(n + 12), 0.8, 0.8) for n in [60, 64, 67])
        M.add(stab, t + 0.15, 0.25, bus='fx')
    elif ty == 'wipe':
        M.add(whoosh(0.7, up=True, f_lo=300, f_hi=7000), t - 0.1, 0.5, bus='fx')
    elif ty == 'thud':
        M.add(layer(kick(0.35, 160, 55, 1.2), filt(noise(0.1), 'lowpass', 900) * env_exp(0.1, 40) * 0.5), t, 0.55, bus='fx')
    elif ty == 'slice':
        M.add(sweep_filter(noise(0.3), 9000, 2000, width=0.4) * env_exp(0.3, 10), t, 0.6, bus='fx')
    elif ty == 'seg' and c.get('final'):
        M.add(reverb(boom(2.5, 50, 0.5), 2, 0.3), t, 0.6, bus='fx')
        for k, n in enumerate([48, 55, 60, 64, 67, 72, 76]):
            M.add(reverb(marimba(note(n), 2.5, 0.9), 2.5, 0.35), t + 0.25 + k * 0.07, 0.28, pan=-0.5 + k / 6, bus='fx')
        M.add(reverb(pad([note(n) for n in [48, 60, 64, 67, 72]], dur - t, cutoff=2500, attack=0.6, release=2.5), 3, 0.4), t, 0.35, bus='pad')
    elif ty == 'end':
        M.add(reverb(marimba(note(84), 2, 1) + marimba(note(79), 2, 0.7), 2.5, 0.4), t, 0.3, bus='fx')

M.render(out)
print('ses:', out)
