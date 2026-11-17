"""
Original background music + sound design for the three videos, synthesised from scratch.

Everything is built from tonal sources (sine/additive oscillators, FM bells, pitched
percussion). There is deliberately no noise generator anywhere in the signal path,
so there is no hiss, crackle or noisy "whoosh" — transitions are pitched sweeps.

    python3 music.py v1-sinematik   → out/v1-sinematik.wav  (reads out/<name>.cues.json)
"""
import json
import sys

import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
DUR = 90.0
N = int(SR * DUR)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tvec(dur):
    return np.arange(int(dur * SR)) / SR


def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR * 0.45), 'low', fs=SR, output='sos'), x, axis=-1)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'high', fs=SR, output='sos'), x, axis=-1)


def adsr(n, a, d, s, r):
    """Linear-attack, exponential-decay envelope of n samples."""
    t = np.arange(n) / SR
    dur = n / SR
    e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    rel_start = max(dur - r, a)
    e = e * np.clip((dur - t) / max(r, 1e-4), 0, 1) ** 1.5 if r > 0 else e
    return e


class Mix:
    def __init__(self):
        self.dry = np.zeros((2, N))
        self.wet = np.zeros((2, N))   # sent to reverb

    def add(self, sig, t, gain=1.0, pan=0.0, send=0.25):
        if sig.ndim == 1:
            l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
            sig = np.stack([sig * l * 1.414, sig * r * 1.414])
        i = int(round(t * SR))
        if i >= N:
            return
        j0 = max(0, -i)
        seg = sig[:, j0: j0 + N - max(i, 0)]
        i = max(i, 0)
        self.dry[:, i:i + seg.shape[1]] += seg * gain
        if send:
            self.wet[:, i:i + seg.shape[1]] += seg * gain * send


# ---------------------------------------------------------------- instruments

def saw(f, dur, maxf=4000, phase_seed=0):
    """Band-limited additive sawtooth (no aliasing, no noise)."""
    t = tvec(dur)
    rs = np.random.RandomState(phase_seed)
    out = np.zeros_like(t)
    k_max = max(1, int(min(maxf, SR / 2 * 0.9) / f))
    for k in range(1, min(k_max, 40) + 1):
        out += np.sin(2 * np.pi * k * f * t + rs.rand() * 6.283) / k
    return out


def pad(notes, dur, cutoff=1400, a=1.5, r=2.0, seed=1):
    """Warm detuned-saw pad, stereo."""
    n = int(dur * SR)
    L = np.zeros(n); R = np.zeros(n)
    for i, m in enumerate(notes):
        f = mtof(m)
        for j, cents in enumerate((-7, 0, 7)):
            v = saw(f * 2 ** (cents / 1200), dur, maxf=cutoff * 2, phase_seed=seed + i * 7 + j)[:n]
            pan = (j - 1) * 0.6
            L += v * (1 - pan) * 0.5; R += v * (1 + pan) * 0.5
    sig = lp(np.stack([L, R]), cutoff) / (len(notes) * 3)
    return sig * adsr(n, a, 9, 1, r)


def piano(m, dur=4.0, bright=1.0):
    t = tvec(dur)
    f = mtof(m)
    out = np.zeros_like(t)
    for k in range(1, 9):
        fk = k * f * np.sqrt(1 + 0.0004 * k * k)
        if fk > 12000:
            break
        out += np.sin(2 * np.pi * fk * t) * (1 / k ** 1.4) * np.exp(-t * (1.2 + 0.9 * k / bright))
    att = np.clip(t / 0.004, 0, 1)
    return out * att * 0.5


def bell(m, dur=4.0, idx=2.5, ratio=3.5, decay=1.6):
    t = tvec(dur)
    f = mtof(m)
    mod = idx * np.exp(-t * 3) * np.sin(2 * np.pi * f * ratio * t)
    return np.sin(2 * np.pi * f * t + mod) * np.exp(-t * decay) * np.clip(t / 0.003, 0, 1) * 0.4


def pluck(m, dur=0.5, decay=7.0, harmonics=10, bright=1.0):
    t = tvec(dur)
    f = mtof(m)
    out = np.zeros_like(t)
    for k in range(1, harmonics + 1):
        if k * f > 10000:
            break
        out += np.sin(2 * np.pi * k * f * t) / k * np.exp(-t * (decay + 3 * k / bright))
    return out * np.clip(t / 0.002, 0, 1) * 0.5


def bass(m, dur, drive=1.5, decay=3.0):
    t = tvec(dur)
    f = mtof(m)
    x = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)
    x = np.tanh(x * drive) / np.tanh(drive)
    n = len(t)
    return x * adsr(n, 0.005, 1 / decay, 0.6, 0.05) * 0.6


def kick(gain=1.0, dur=0.45):
    t = tvec(dur)
    f = 44 + 110 * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t * 7) + 0.25 * np.sin(2 * np.pi * 1000 * t) * np.exp(-t * 400)
    return np.tanh(x * 1.6) * gain * 0.9


def snare_tonal(dur=0.35):
    """Snare-ish hit made only of pitched partials (no noise)."""
    t = tvec(dur)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 22) + 0.6 * np.sin(2 * np.pi * 330 * t) * np.exp(-t * 30)
    ring = sum(np.sin(2 * np.pi * f * t + i) for i, f in enumerate((1130, 1710, 2290, 3170))) * np.exp(-t * 55) * 0.18
    return (body + ring) * 0.55


def hat_tonal(dur=0.08, open_=False):
    t = tvec(dur)
    x = sum(np.sin(2 * np.pi * f * t + i) for i, f in enumerate((5310, 6970, 8130))) / 3
    return lp(x * np.exp(-t * (25 if open_ else 70)), 9000) * 0.12


def tick(m=96, dur=0.12):
    t = tvec(dur)
    return (np.sin(2 * np.pi * mtof(m) * t) + 0.4 * np.sin(2 * np.pi * mtof(m + 7) * t)) * np.exp(-t * 45) * 0.25


def boom(dur=3.0, gain=1.0):
    t = tvec(dur)
    f = 32 + 48 * np.exp(-t * 6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 1.6) * np.clip(t / 0.01, 0, 1) * gain


def sweep(f0, f1, dur, shape='up'):
    """Pitched riser/fall: a few harmonics following an exponential glide, swelling in."""
    t = tvec(dur)
    f = f0 * (f1 / f0) ** (t / dur)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph) + 0.3 * np.sin(ph * 1.5)
    if shape == 'up':
        e = (t / dur) ** 2.2
    else:  # quick in, smooth out
        e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    return x * e * 0.25


def swell(notes, dur=1.6):
    """Reverse-style crescendo of a soft chord ending exactly at the cue."""
    sig = pad(notes, dur, cutoff=2200, a=0.01, r=0.02, seed=5)
    t = tvec(dur)[: sig.shape[1]]
    return sig * (t / dur) ** 3


def reverb(wet, seconds=3.0, tone=3500, seed=1):
    # Smooth exponentially-decaying stereo IR (low-passed). With no input it outputs silence,
    # so it adds space without adding any hiss of its own.
    rs = np.random.RandomState(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = rs.randn(2, n) * np.exp(-t * 6.9 / seconds)
    ir = lp(ir, tone, order=4)
    ir[:, : int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
    out = np.stack([fftconvolve(wet[c], ir[c])[:N] for c in range(2)])
    return out


def master(mix, rev_s=3.0, rev_tone=3500, rev_gain=0.9, fade_out=1.6, target_rms_db=-17):
    x = mix.dry + reverb(mix.wet, rev_s, rev_tone) * rev_gain
    x = hp(x, 28)
    x = x - 0.45 * lp(x, 110)  # low shelf: keeps phone speakers from being swamped by sub
    x = lp(x, 15000)
    rms = np.sqrt((x ** 2).mean())
    x *= 10 ** (target_rms_db / 20) / max(rms, 1e-9)
    x = np.tanh(x * 1.1) / 1.1  # soft limiter
    x *= 0.89 / max(np.abs(x).max(), 1e-9)
    t = np.arange(N) / SR
    x *= np.clip(t / 0.03, 0, 1) * np.clip((DUR - t) / fade_out, 0, 1)
    return x


# ---------------------------------------------------------------- arrangements

def v1(cues):
    """Calm, cinematic: D minor pads, sparse piano, a heartbeat under the ocean scene."""
    m = Mix()
    D, Bb, F, C, Gm, A = [50, 57, 62, 65], [46, 58, 62, 65], [53, 57, 60, 65], [48, 55, 60, 64], [43, 58, 62, 67], [45, 57, 61, 64]
    prog_ = [D, Bb, F, C, D, Bb, Gm, A, D, Bb, Gm, A, Bb, C, D]
    for i, ch in enumerate(prog_):
        t0 = i * 6.0
        dur = 9.0 if i < 14 else 8.0
        cutoff = 900 + 500 * np.sin(i * 0.7) ** 2
        m.add(pad(ch, dur, cutoff=cutoff, a=2.0, r=3.0, seed=i), t0, gain=0.75, send=0.6)
        # low root
        if i >= 2:
            t = tvec(6.5)
            r = np.sin(2 * np.pi * mtof(ch[0] - 12) * t) * adsr(len(t), 1.0, 9, 1, 2.0) * 0.15
            m.add(r, t0, send=0.1)
        # piano: sparse in the intro, a gentle eighth-note figure after
        pattern = [3, 1, 2, 1, 3, 2, 0, 2] if i >= 1 else [3, 2]
        step = 0.75 if i >= 1 else 3.0
        for k in range(int(6.0 / step)):
            if i >= 1 and k % 8 in (5, 7) and i % 2 == 0:
                continue
            note = ch[pattern[k % len(pattern)]] + 12
            if i in (10, 11) and k % 2:  # thinner under the ocean scene
                continue
            vel = 0.55 + 0.25 * (k % 4 == 0)
            m.add(piano(note, 4.0, bright=0.8), t0 + k * step + 0.02 * np.sin(k), gain=vel * 0.85, pan=0.3 * np.sin(k * 1.3), send=0.55)
    # drone
    t = tvec(DUR)
    drone = (np.sin(2 * np.pi * mtof(38) * t) + 0.3 * np.sin(2 * np.pi * mtof(45) * t)) * 0.06
    drone *= np.clip(t / 6, 0, 1)
    m.add(drone, 0, send=0.2)
    # heartbeat under the ships
    for k in range(12):
        tt = 59.5 + k * 1.25
        m.add(boom(0.6, 0.3), tt, send=0.1)
        m.add(boom(0.6, 0.2), tt + 0.28, send=0.1)
    # final chord rings out
    m.add(bell(74, 5, idx=1.5), 84.2, gain=0.35, pan=-0.3, send=0.7)
    m.add(bell(81, 5, idx=1.5), 84.6, gain=0.28, pan=0.3, send=0.7)
    for c in cues:
        g = c.get('gain', 1.0)
        if c['type'] == 'impact':
            m.add(boom(3.0, 0.55 * g), c['t'], send=0.4)
            m.add(piano(38, 5, 0.6) + piano(45, 5, 0.6), c['t'], gain=0.7 * g, send=0.6)
        elif c['type'] == 'swell':
            m.add(swell([62, 69, 74], 1.6), c['t'] - 1.6, gain=0.9 * g, send=0.6)
        elif c['type'] == 'boom':
            m.add(boom(4.0, 1.2 * g), c['t'], send=0.5)
            m.add(sweep(900, 140, 1.4, 'down'), c['t'] - 0.9, gain=0.5, send=0.7)
        elif c['type'] == 'chime':
            for j, n in enumerate((74, 77, 81, 86)):
                m.add(bell(n, 5, idx=1.2), c['t'] + j * 0.14, gain=0.3 * g, pan=(j - 1.5) * 0.3, send=0.8)
    return master(m, rev_s=4.5, rev_tone=3000, rev_gain=1.0, fade_out=2.5, target_rms_db=-19)


def v2(cues):
    """Energetic, kinetic: 128 BPM, A minor, sidechained bass and pad, drop at bar 33."""
    m = Mix()
    bt = 60 / 128
    bar = 4 * bt
    roots = [45, 41, 48, 43]                      # Am F C G
    chords = [[57, 60, 64], [53, 57, 60], [55, 60, 64], [55, 59, 62]]
    breakdown = range(26, 33)                     # bars 26..32 (NSA)
    groove = lambda b: (b < 26) or (33 <= b < 47)

    kicks = []
    for b in range(48):
        ch, rt = chords[b % 4], roots[b % 4]
        t0 = b * bar
        if b == 47:
            kicks.append(t0)
            m.add(pad([45, 57, 60, 64, 69], 4.5, cutoff=2500, a=0.01, r=3.5), t0, gain=0.55, send=0.6)
            m.add(boom(3.0, 0.8), t0, send=0.3)
            continue
        # pad
        pc = 2400 if b >= 33 else (1100 if b in breakdown else 1700)
        m.add(pad(ch + [ch[0] + 12], bar + 0.4, cutoff=pc, a=0.05 if b not in breakdown else 0.8, r=0.4, seed=b), t0,
              gain=0.5 if b not in breakdown else 0.65, send=0.4)
        if groove(b):
            for q in range(4):
                kicks.append(t0 + q * bt)
            if b >= 4:
                for q in (1, 3):
                    m.add(snare_tonal(), t0 + q * bt, gain=0.75, send=0.35)
                for e in range(8):
                    if e % 2 == 1 or b >= 33:
                        m.add(hat_tonal(open_=(e % 4 == 2 and b >= 33)), t0 + e * bt / 2, gain=0.8, pan=0.3, send=0.1)
                # off-beat bass
                for e in range(8):
                    if e % 2 == 1:
                        m.add(bass(rt - 12 + (12 if e == 7 else 0), bt / 2 * 0.9, drive=2.2, decay=6), t0 + e * bt / 2, gain=0.4, send=0.0)
        else:
            # breakdown: a soft heartbeat pulse
            m.add(boom(0.8, 0.35), t0, send=0.2)
            m.add(boom(0.8, 0.25), t0 + 2 * bt, send=0.2)
        # 16th arp
        arp = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 24, ch[2] + 12, ch[1] + 12, ch[0] + 24, ch[2] + 12]
        for s in range(16):
            vel = 0.5 + 0.3 * (s % 4 == 0)
            g = 0.42 if b not in breakdown else 0.28
            bright = 0.5 if b in breakdown else 1.0
            m.add(pluck(arp[s % 8], 0.35, decay=9, bright=bright), t0 + s * bt / 4, gain=g * vel, pan=0.4 * np.sin(s), send=0.3)
        # lead melody in the drop
        if 33 <= b < 41:
            mel = [[76, 0], [79, 1.5], [81, 3]] if b % 2 == 0 else [[84, 0], [83, 1], [79, 2], [76, 3]]
            for n, q in mel:
                m.add(pluck(n, 0.9, decay=3.5, harmonics=6), t0 + q * bt, gain=0.5, pan=-0.2, send=0.45)
                m.add(bell(n + 12, 1.2, idx=1.0, decay=3.5), t0 + q * bt, gain=0.1, pan=0.2, send=0.5)
    # sidechain ducking on everything except kicks: compute envelope
    t = np.arange(N) / SR
    duck = np.ones(N)
    for k in kicks:
        i = int(k * SR); j = min(N, i + int(0.35 * SR))
        duck[i:j] = np.minimum(duck[i:j], 1 - 0.55 * np.exp(-(t[i:j] - k) * 12))
    m.dry *= duck; m.wet *= duck
    for k in kicks:  # kicks after ducking
        m.add(kick(1.0), k, gain=0.45, send=0.03)
    for c in cues:
        g = c.get('gain', 1.0)
        if c['type'] == 'hit':
            if g >= 1.2:
                m.add(boom(1.2, 0.3 * g), c['t'], send=0.3)
                m.add(pad([69, 72, 76, 81], 0.5, cutoff=4000, a=0.003, r=0.3, seed=9), c['t'], gain=0.35, send=0.5)
            else:
                m.add(tick(91, 0.1), c['t'], gain=0.35 * g, pan=0.2, send=0.25)
        elif c['type'] == 'whoosh':
            m.add(sweep(300, 1600, 0.6, 'mid'), c['t'] - 0.3, gain=0.6, send=0.5)
        elif c['type'] == 'riser':
            m.add(sweep(110, 880, c['len'], 'up'), c['t'], gain=0.8, send=0.5)
            for s in range(32):  # accelerating snare roll (tonal)
                tt = c['t'] + c['len'] * (1 - (1 - s / 32) ** 1.2)
                m.add(snare_tonal(0.15), tt, gain=0.12 + 0.35 * s / 32, send=0.2)
        elif c['type'] == 'boom':
            m.add(boom(3.0, 1.2), c['t'], send=0.4)
    return master(m, rev_s=2.2, rev_tone=4500, rev_gain=0.6, fade_out=1.2, target_rms_db=-15)


def v3(cues):
    """Analysis bed: 100 BPM, E minor, steady pulse bass, clock tick, bell motif."""
    m = Mix()
    bt = 0.6
    bar = 4 * bt
    roots = [40, 36, 43, 38]                      # Em C G D
    chords = [[52, 55, 59], [48, 52, 55], [50, 55, 59], [50, 54, 57]]
    nbars = int(np.ceil(86.4 / bar))              # music body until the end card
    for b in range(nbars):
        ch, rt = chords[b % 4], roots[b % 4]
        t0 = b * bar
        m.add(pad(ch + [ch[2] + 12], bar + 0.6, cutoff=1300, a=0.3, r=0.6, seed=b), t0, gain=0.4, send=0.4)
        # pulse bass on 8ths
        if b >= 1:
            for e in range(8):
                m.add(pluck(rt, 0.28, decay=10, harmonics=5), t0 + e * bt / 2, gain=0.55 if e % 2 == 0 else 0.4, send=0.05)
                m.add(np.sin(2 * np.pi * mtof(rt - 12) * tvec(0.25)) * np.exp(-tvec(0.25) * 10) * 0.15, t0 + e * bt / 2, send=0)
        # clock tick on quarters, softer offbeats
        for q in range(4):
            m.add(tick(100 if q == 0 else 96, 0.06), t0 + q * bt, gain=0.22, pan=0.35, send=0.1)
        # soft kick on 1 & 3 after the intro
        if b >= 3:
            m.add(kick(0.4), t0, send=0.05)
            m.add(kick(0.32), t0 + 2 * bt, send=0.05)
            m.add(snare_tonal(0.2), t0 + 3 * bt + bt / 2, gain=0.12, send=0.3)
        # bell motif every bar
        motif = [[ch[2] + 24, 0], [ch[1] + 24, 1.5], [ch[0] + 24, 2.5]] if b % 2 == 0 else [[ch[2] + 24, 0], [ch[2] + 26, 2]]
        if b >= 2:
            for n, q in motif:
                m.add(bell(n, 2.0, idx=1.6, decay=2.2), t0 + q * bt, gain=0.24, pan=-0.3, send=0.5)
    # end: ring out on Em(add9)
    te = 86.4
    m.add(pad([40, 52, 55, 59, 66], 4.0, cutoff=1800, a=0.05, r=3.0), te, gain=0.45, send=0.7)
    for c in cues:
        g = c.get('gain', 1.0)
        if c['type'] == 'tick':
            m.add(pluck(88, 0.25, decay=14, harmonics=3), c['t'], gain=0.25, pan=-0.2, send=0.3)
        elif c['type'] == 'whoosh':
            m.add(sweep(250, 1200, 0.5, 'mid'), c['t'] - 0.25, gain=0.35 * g, send=0.5)
        elif c['type'] == 'chime':
            for j, n in enumerate((76, 79, 83, 88)):
                m.add(bell(n, 4, idx=1.2), c['t'] + j * 0.12, gain=0.25 * g, pan=(j - 1.5) * 0.3, send=0.7)
    return master(m, rev_s=2.6, rev_tone=3800, rev_gain=0.7, fade_out=1.5, target_rms_db=-17)


if __name__ == '__main__':
    name = sys.argv[1]
    cues = json.load(open(f'out/{name}.cues.json'))['cues']
    x = {'v1': v1, 'v2': v2, 'v3': v3}[name[:2]](cues)
    from scipy.io import wavfile
    wavfile.write(f'out/{name}.wav', SR, (x.T * 32767).astype(np.int16))
    print('wrote', f'out/{name}.wav', 'peak', float(np.abs(x).max()))
