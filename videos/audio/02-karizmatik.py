"""02 — Ağır & Karizmatik: Re minör dron, segment başına derin darbe, piyano motifleri."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
import numpy as np
from synth import *

cues_path, out = main_args()
dur, cues = load_cues(cues_path)
M = Mix(dur)

# segment akorları (MIDI)
CH = [[50, 57, 62, 65], [46, 53, 58, 62], [41, 53, 57, 60], [48, 55, 60, 64], [50, 57, 62, 65], [43, 55, 58, 62],
      [46, 53, 58, 62], [45, 52, 57, 61], [50, 57, 62, 65], [43, 55, 58, 62], [38, 50, 57, 62, 65, 69]]
MEL = [74, 72, 69, 72, 74, 77, 74, 73, 69, 70, 74]

segs = [c for c in cues if c['type'] == 'seg']
starts = [c['t'] for c in segs] + [dur]

# ---- dron: sürekli alt katman ----
d = t_axis(dur)
drone = (sine(note(38), dur) * 0.5 + sine(note(26), dur) * 0.6 + sine(note(45), dur) * 0.15) * (0.8 + 0.2 * np.sin(2 * np.pi * d / 9))
drone += filt(noise(dur), 'lowpass', 220) * 0.06
drone *= np.clip(d / 4, 0, 1)
M.add(reverb(drone, 3, 0.3), 0, 0.35, bus='drone')

# ---- yaylı pad: segment akorları, yavaş geçişler ----
strings = np.zeros(M.n)
for i, s in enumerate(segs):
    t0, t1 = starts[i], starts[i + 1]
    ln = t1 - t0 + 1.5
    p = pad([note(n) for n in CH[i]], ln, cutoff=1400 if i < 10 else 2200, detune=0.004, attack=1.5, release=1.6, voices=4)
    a = int(t0 * SR)
    strings[a:a + len(p)] += p[: M.n - a]
M.add(reverb(strings, 4.5, 0.5, bright=4000), 0, 0.5, bus='strings')

# ---- darbe ve piyano ----
for c in cues:
    t, ty = c['t'], c['type']
    if ty == 'seg':
        i = c['i']
        if c.get('last'):
            continue
        M.add(reverb(boom(3.5, 36, 0.35), 4, 0.45, bright=2500), t, 0.55, bus='fx')
        M.add(reverb(whoosh(1.4, up=False, f_lo=150, f_hi=3000), 2.5, 0.5), t - 0.9, 0.18, bus='fx')
    elif ty == 'line':
        i, li = c['i'], c['li']
        root = CH[i][-1] + 12 if li == 0 else MEL[i] - [0, 3, 5, 7, 2][li % 5]
        M.add(reverb(piano(note(root), 4, 0.6), 4, 0.45), t, 0.32, pan=-0.2 + 0.1 * li, bus='piano')
        if c.get('em'):
            M.add(reverb(piano(note(MEL[i] + 12), 4, 0.5) + bell(note(MEL[i] + 12), 4) * 0.4, 5, 0.6), t + 0.5, 0.22, pan=0.25, bus='piano')
    elif ty == 'final':
        M.add(reverb(boom(6, 33, 0.8), 6, 0.5, bright=3000), t, 1.0, bus='fx')
        for k, n in enumerate([38, 50, 57, 62, 65, 69, 74]):
            M.add(reverb(piano(note(n), 7, 0.75), 6, 0.55), t + 0.55 + k * 0.09, 0.3, pan=-0.4 + k * 0.13, bus='piano')
        M.add(reverb(shimmer(4, 1175, 9), 5, 0.7), t + 0.8, 0.5, bus='fx')

M.render(out)
print('ses:', out)
