"""06 — Brutalist: 130 BPM kırık ritim, distorsiyonlu 808, damga ve kesme vuruşları."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
import numpy as np
from synth import *

cues_path, out = main_args()
dur, cues = load_cues(cues_path)
M = Mix(dur)
rng = np.random.default_rng(13)
BEAT = 60 / 130
final_t = next(c['t'] for c in cues if c['type'] == 'cut' and c.get('final'))
start = 0.4


def b808(f, d=0.45):
    t = t_axis(d)
    s = sine(f * (1 + 1.5 * np.exp(-t * 30)), d) * np.exp(-t * 4)
    return np.tanh(s * 3) * 0.6


def stamp():
    d = 0.35
    t = t_axis(d)
    body = sine(90 + 120 * np.exp(-t * 50), d) * np.exp(-t * 18)
    slap = filt(noise(d), 'bp', (600, 5000)) * np.exp(-t * 35)
    return np.tanh((body + slap * 0.8) * 2.2) * 0.6


# kırık ritim kalıbı (16'lık): kick, snare, hat
K = [1,0,0,0, 0,0,1,0, 0,0,1,0, 0,0,0,0]
SN = [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1]
roots = [41, 41, 44, 39]  # Fa, Fa, Lab, Mib
kicks = []
t = start
s16 = 0
while t < final_t:
    k = s16 % 16
    bar = (s16 // 16) % 4
    if K[k]:
        M.add(kick(0.4, 150, 48, 1.4), t, 0.85, bus='drums'); kicks.append(t)
        M.add(b808(note(roots[bar] - 12)), t, 0.55, bus='bass')
    if SN[k]:
        M.add(layer(snare(), clap()), t, 0.5 if k != 15 else 0.25, pan=0.05, bus='drums')
    if k % 2 == 0 or rng.random() < 0.3:
        M.add(hat(0.04), t, 0.22 if k % 4 else 0.32, pan=0.35, bus='drums')
    t += BEAT / 4
    s16 += 1

# rif: kare dalga stab'ları
stab = np.zeros(M.n)
t = start
bar = 0
while t < final_t:
    r = roots[bar % 4]
    for off in (0, 0.75, 1.5, 2.5):
        tt = t + off * BEAT
        if tt >= final_t:
            break
        d = 0.16
        s = sum(np.sign(sine(note(n), d)) for n in [r + 12, r + 19, r + 24]) * env_adsr(d, 0.002, 0.05, 0.3, 0.05)
        a = int(tt * SR)
        stab[a:a + len(s)] += s[: M.n - a]
    t += BEAT * 4
    bar += 1
M.add(filt(stab, 'lowpass', 2600) * sidechain(kicks, M.n, 0.7), 0, 0.09, pan=-0.2, bus='stab')

for c in cues:
    t, ty = c['t'], c['type']
    if ty == 'cut':
        M.add(filt(noise(0.6, True), 'highpass', 3000) * env_exp(0.6, 6)[:, None] * 0.35, t, 0.6, bus='fx')
        M.add(kick(0.5, 200, 45, 2.0), t, 0.6, bus='fx')
        if c.get('final'):
            M.add(reverb(boom(4, 38, 1.2), 3, 0.4), t, 1.0, bus='fx')
            M.add(reverb(stamp(), 2.5, 0.4), t + 0.2, 0.8, bus='fx')
    elif ty == 'stamp':
        M.add(stamp(), t, 0.75, pan=rng.uniform(-0.2, 0.2), bus='fx')
    elif ty == 'hit':
        M.add(filt(noise(0.06), 'bp', (1500, 6000)) * env_exp(0.06, 60), t, 0.35, pan=rng.uniform(-0.4, 0.4), bus='fx')
        M.add(kick(0.15, 220, 120, 1.0), t, 0.25, bus='fx')

M.render(out)
print('ses:', out)
