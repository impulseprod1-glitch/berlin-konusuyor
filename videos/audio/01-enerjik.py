"""01 — Enerjik & Klas: 120 BPM, La minör (Am-F-C-G), vuruşa oturan efektler."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
import numpy as np
from synth import *

cues_path, out = main_args()
dur, cues = load_cues(cues_path)
M = Mix(dur)
BEAT = 0.5
sec = {c['name']: c['t'] for c in cues if c['type'] == 'section'}
start, brk, build, drop, final = sec['groove'], sec['break'], sec['build'], sec['drop'], sec['final']

# Akorlar (bar = 2 sn): Am F C G
prog = [[57, 60, 64], [53, 57, 60], [48, 55, 60], [55, 59, 62]]
roots = [45, 41, 48, 43]

def bars(a, b):
    t = a
    while t < b - 1e-6:
        yield t, int(round((t - start) / 2)) % 4
        t += 2

kicks = []
# ---- davullar ----
t = start
while t < final - 1e-6:
    in_break = brk <= t < build
    in_drop = t >= drop
    b = int(round((t - start) / BEAT))
    if not in_break or b % 4 == 0:
        M.add(kick(punch=1.2 if in_drop else 1.0), t, 0.95 if not in_break else 0.8, bus='drums')
        kicks.append(t)
    if not in_break:
        M.add(hat(), t + BEAT / 2, 0.55, pan=0.25, bus='drums')
        if b % 2 == 1:
            M.add(clap(), t, 0.55, pan=-0.05, bus='drums')
        if in_drop:
            M.add(hat(), t + BEAT / 4, 0.25, pan=-0.3, bus='drums')
            M.add(hat(), t + 3 * BEAT / 4, 0.25, pan=-0.3, bus='drums')
            if b % 4 == 3:
                M.add(hat(open_=True), t + BEAT / 2, 0.35, pan=0.3, bus='drums')
    t += BEAT

# build: hızlanan trampet rulosu
for k in range(32):
    tt = build + 2 + (k / 32) ** 0.8 * 2
    if tt < drop:
        M.add(snare(), tt, 0.15 + 0.35 * k / 32, pan=0.1, bus='drums')

# ---- bas (8'lik, yan zincirli) ----
bass = np.zeros(M.n)
for bt, i in bars(start, final):
    if brk <= bt < build:
        continue
    f = note(roots[i] - 12)
    for k in range(8):
        tt = bt + k * BEAT / 2
        s = (saw(f, 0.24, harmonics=12) * 0.7 + sine(f, 0.24)) * env_adsr(0.24, 0.004, 0.08, 0.6, 0.06)
        s = filt(s, 'lowpass', 900 if bt >= drop else 600)
        a = int(tt * SR)
        bass[a:a + len(s)] += s * (0.55 if k % 2 == 0 else 0.4)
sc = sidechain(kicks, M.n, depth=0.75)
M.add(bass * sc, 0, 0.75, bus='bass')

# ---- pad ----
padbus = np.zeros(M.n)
for bt, i in bars(0, final):
    cut = 900 if bt < start else (1500 if bt < drop else 2600)
    if brk <= bt < build:
        cut = 2200
    p = pad([note(n) for n in prog[i]] + [note(prog[i][0] + 12)], 2.4, cutoff=cut, attack=0.15 if bt >= start else 1.2, release=0.5)
    a = int(bt * SR)
    padbus[a:a + len(p)] += p
fin = pad([note(n) for n in [45, 57, 60, 64, 69]], dur - final, cutoff=2400, attack=0.05, release=3)
padbus[int(final * SR):int(final * SR) + len(fin)] += fin * 1.2
padbus *= sc * 0.8 + 0.2
M.add(reverb(padbus, 2.2, 0.35), 0, 0.75, bus='pad')

# ---- arpej (drop'ta) ----
arp = np.zeros(M.n)
for bt, i in bars(drop, final):
    notes = prog[i] + [prog[i][1] + 12]
    for k in range(16):
        f = note(notes[k % 4] + 12)
        s = (saw(f, 0.2, harmonics=8)) * env_exp(0.2, 18)
        a = int((bt + k * BEAT / 4) * SR)
        arp[a:a + len(s)] += s
M.add(reverb(filt(arp, 'lowpass', 4000), 1.2, 0.3), 0, 0.26, pan=0.2, bus='arp')

# ---- efektler ----
for c in cues:
    ty, t, amp = c['type'], c['t'], c.get('amp', 1)
    if ty == 'hit':
        if c.get('big'):
            M.add(reverb(boom(1.6, 46, 0.8), 1.8, 0.35), t, 0.45 * amp, bus='fx')
        M.add(kick(0.3, 180, 60, 1.5), t, 0.35 * amp, bus='fx')
        M.add(filt(noise(0.12), 'bp', (2000, 9000)) * env_exp(0.12, 35), t, 0.18 * amp, bus='fx')
    elif ty == 'tick':
        n, st = c.get('n', 1), c.get('stagger', 0.03)
        for k in range(min(n, 14)):
            M.add(filt(noise(0.03), 'bp', (3000, 9000)) * env_exp(0.03, 120), t + k * st, 0.08, pan=(k % 5 - 2) * 0.2, bus='fx')
    elif ty == 'whoosh':
        M.add(whoosh(0.45, up=True), t - 0.12, 0.5 * amp, bus='fx')
    elif ty == 'slash':
        s = sweep_filter(noise(0.35), 9000, 2500, width=0.4) * env_exp(0.35, 9)
        ring = sine(3200, 0.9) * env_exp(0.9, 6) * 0.15 + sine(4870, 0.9) * env_exp(0.9, 8) * 0.08
        M.add(reverb(s + np.pad(ring, (0, 0))[:len(s)] if len(ring) < len(s) else s, 1.2, 0.3), t, 0.7, bus='fx')
        M.add(ring, t, 0.6, pan=0.3, bus='fx')
    elif ty == 'riser':
        d = c.get('dur', 2)
        M.add(riser(d), t, 0.5, bus='fx')
    elif ty in ('drop', 'final'):
        M.add(reverb(boom(4, 40, 1.2), 3.5, 0.4), t, 0.9, bus='fx')
        M.add(reverb(filt(noise(2.5, True), 'highpass', 4000) * env_exp(2.5, 2.2)[:, None] * 0.25, 2, 0.4), t, 0.5, bus='fx')
        if ty == 'final':
            M.add(reverb(bell(note(81), 5) + bell(note(76), 5) * 0.6, 4, 0.5), t, 0.45, bus='fx')
    elif ty == 'shine':
        M.add(reverb(shimmer(1.6, 2200), 2.5, 0.5), t, 0.8, bus='fx')

M.render(out)
print('ses:', out)
