"""
Orchestral score + sound design for "Bildirim Yağmuru" (v8), rendered with real
instrument samples (FluidR3 GM soundfont via fluidsynth).

    apt-get install fluidsynth fluid-soundfont-gm && pip install mido
    python3 score.py v8-bildirimler      → out/v8-bildirimler.wav

Design notes
- D minor, 104 BPM, a documentary / investigative underscore.
- The bed is built in layers that arrive day by day so the tension rises with
  the story: pizzicato + warm pad → strings + bass → piano ostinato → cello pulse,
  timpani, horns → a stripped-back "pattern" section → an unresolved celesta
  question → a lighter poll section → a held D minor (add9) ending.
- No cymbals, hats or noise sources anywhere: no hiss.
- Every sound effect is a pitched instrument in the same key, so the effects sit
  inside the music instead of on top of it.
"""
import json
import subprocess
import sys

import mido
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
SF2 = '/usr/share/sounds/sf2/FluidR3_GM.sf2'
TPS = 1920  # ticks per second (120 BPM, 960 ticks per beat)
BPM = 104
BEAT = 60 / BPM
BAR = 4 * BEAT

# GM programs (0-based)
PROG = {'piano': 0, 'strings': 48, 'pad': 89, 'pizz': 45, 'celesta': 8, 'bass': 43, 'timp': 47, 'harp': 46,
        'horn': 60, 'cello': 42, 'vibes': 11, 'marimba': 12, 'glock': 9, 'trem': 44, 'mbox': 10, 'xylo': 13}


class Score:
    """Collects notes per instrument (one MIDI channel each) and renders them."""

    def __init__(self, volumes):
        self.notes = []          # (t, dur, inst, pitch, vel)
        self.volumes = volumes   # inst -> CC7 volume

    def n(self, t, dur, inst, pitch, vel):
        if dur > 0 and 0 <= pitch < 128:
            self.notes.append((t, dur, inst, int(pitch), int(max(1, min(127, vel)))))

    def chord(self, t, dur, inst, pitches, vel):
        for p in pitches:
            self.n(t, dur, inst, p, vel)

    def render(self, path, length):
        insts = sorted({x[2] for x in self.notes})
        chans = {}
        for i, inst in enumerate(insts):
            chans[inst] = i if i < 9 else i + 1  # skip the drum channel
        mid = mido.MidiFile(ticks_per_beat=960)
        tr = mido.MidiTrack(); mid.tracks.append(tr)
        ev = [(0, mido.MetaMessage('set_tempo', tempo=500000))]
        for inst, ch in chans.items():
            ev.append((0, mido.Message('program_change', channel=ch, program=PROG[inst])))
            ev.append((0, mido.Message('control_change', channel=ch, control=7, value=self.volumes.get(inst, 100))))
            ev.append((0, mido.Message('control_change', channel=ch, control=91, value=70)))  # reverb send
        for t, d, inst, p, v in self.notes:
            ch = chans[inst]
            ev.append((int(t * TPS), mido.Message('note_on', channel=ch, note=p, velocity=v)))
            ev.append((int((t + d) * TPS), mido.Message('note_off', channel=ch, note=p, velocity=0)))
        ev.sort(key=lambda e: (e[0], 0 if e[1].type == 'note_off' else 1))
        last = 0
        for tick, msg in ev:
            tr.append(msg.copy(time=tick - last)); last = tick
        tr.append(mido.MetaMessage('end_of_track', time=int((length + 6) * TPS) - last))
        mid.save(path + '.mid')
        subprocess.run(['fluidsynth', '-ni', '-q', '-g', '0.5', '-r', str(SR), '-o', 'synth.reverb.room-size=0.75',
                        '-o', 'synth.reverb.width=1.0', '-o', 'synth.reverb.level=0.55', '-o', 'synth.chorus.active=0',
                        '-F', path + '.wav', SF2, path + '.mid'], check=True)
        sr, x = wavfile.read(path + '.wav')
        x = x.astype(np.float64)
        x /= 32768 if x.dtype != np.float32 else 1
        return x.T  # (2, n)


# D minor material
DM, BB, F, C, GM, A = [50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55], [43, 46, 50], [45, 49, 52]
PROG_CALM = [DM, BB, F, C]
PROG_DARK = [DM, GM, BB, A]
PROG_POLL = [F, C, DM, BB]


def grid_bars(t0, t1):
    """Bar start times on the global 104 BPM grid that fall inside [t0, t1)."""
    k = int(np.ceil(t0 / BAR - 1e-6))
    out = []
    while k * BAR < t1 - 0.05:
        out.append(k * BAR); k += 1
    return out


def bed(sc, t0, t1, prog, layers, vel=1.0):
    for i, bt in enumerate(grid_bars(t0, t1)):
        ch = prog[(int(round(bt / BAR))) % len(prog)]
        end = min(bt + BAR, t1)
        dur = end - bt
        r = ch[0]
        if 'pad' in layers:
            sc.chord(bt, dur + 0.05, 'pad', [r - 12, ch[1], ch[2]], 52 * vel)
        if 'strings' in layers:
            sc.chord(bt, dur + 0.05, 'strings', [r - 12, r, ch[1] + 12, ch[2]], 58 * vel)
        if 'bass' in layers:
            sc.n(bt, min(dur, BAR / 2), 'bass', r - 24, 70 * vel); sc.n(bt + BAR / 2, min(max(dur - BAR / 2, 0), BAR / 2), 'bass', r - 24, 62 * vel)
        if 'horn' in layers:
            sc.chord(bt, dur, 'horn', [r - 12, ch[2] - 12], 52 * vel)
        for e in range(8):
            te = bt + e * BEAT / 2
            if te >= t1:
                break
            if 'pizz' in layers:
                pat = [r, ch[2], r + 12, ch[2], ch[1] + 12, ch[2], r + 12, ch[2]]
                sc.n(te, BEAT / 2 * 0.8, 'pizz', pat[e], (64 if e % 4 == 0 else 50) * vel)
            if 'piano8' in layers:
                pat = [r + 12, ch[1] + 12, ch[2] + 12, r + 24, ch[2] + 12, ch[1] + 12, r + 12, ch[1] + 12]
                sc.n(te, BEAT / 2 * 0.95, 'piano', pat[e], (50 if e % 2 == 0 else 40) * vel)
            if 'cello' in layers:
                sc.n(te, BEAT / 2 * 0.7, 'cello', r - 12, (66 if e % 2 == 0 else 52) * vel)
        if 'kick' in layers:
            sc.n(bt, 0.2, 'timp', r - 12 if r - 12 >= 38 else r, 34 * vel)  # felt-like low timpani tap instead of a drum kit
            sc.n(bt + 2 * BEAT, 0.2, 'timp', r - 12 if r - 12 >= 38 else r, 28 * vel)
        if 'timp' in layers:
            sc.n(bt, 0.6, 'timp', 38, 72 * vel)
        if 'motif' in layers and int(round(bt / BAR)) % 2 == 0:
            for k, (p, q) in enumerate([(ch[2] + 12, 0), (ch[1] + 12, 1.5), (r + 12, 2.5)]):
                sc.n(bt + q * BEAT, BEAT * 1.4, 'piano', p, 46 * vel)


def music(sc, T):
    # HOOK: urgent tremolo + staccato piano; timpani on the three slams
    sc.chord(0.3, 3.6, 'trem', [38, 45, 50], 62)
    for k in range(int(3.5 / (BEAT / 2))):
        sc.n(0.45 + k * BEAT / 2, 0.12, 'piano', 38 if k % 2 == 0 else 50, 58 + (k % 4 == 0) * 10)
    for t, p in [(2.35, 38), (2.7, 33), (3.05, 38)]:
        sc.n(t, 0.9, 'timp', p, 100)
        sc.chord(t, 0.25, 'strings', [38, 50, 53, 57, 62], 92)
    # DAY 1 – 4 (layers arrive one by one)
    sc.chord(6.6, 2.5, 'harp', [], 0)
    bed(sc, 6.6, 17.0, PROG_CALM, {'pad', 'pizz', 'motif'})
    bed(sc, 17.0, 30.2, PROG_CALM, {'pad', 'pizz', 'strings', 'bass', 'kick'})
    bed(sc, 30.2, 42.0, PROG_CALM, {'pad', 'pizz', 'strings', 'bass', 'kick', 'piano8'})
    bed(sc, 42.0, 52.0, PROG_DARK, {'pad', 'strings', 'bass', 'cello', 'piano8', 'timp'})
    # GULF: full strings, horns, cello pulse
    bed(sc, 52.0, 60.5, [BB, F, GM, A], {'strings', 'horn', 'cello', 'bass', 'timp'}, 1.1)
    for k, (p, d) in enumerate([(62, 1.5), (65, 0.5), (64, 2.0), (62, 1.5), (61, 2.5)]):
        sc.n(52.6 + sum(x[1] for x in [(62, 1.5), (65, 0.5), (64, 2.0), (62, 1.5), (61, 2.5)][:k]) * BEAT, d * BEAT, 'horn', p, 70)
    for k in range(12):  # timpani roll into the pile
        sc.n(59.4 + k * 0.09, 0.1, 'timp', 38, 40 + k * 4)
    # PILE: stripped back to piano and strings
    for i, ch in enumerate(PROG_DARK):
        t = 60.5 + i * 1.6
        sc.chord(t, 1.8, 'piano', [ch[0] - 12, ch[0], ch[1], ch[2]], 52)
        sc.chord(t, 1.8, 'strings', [ch[0] - 12, ch[2]], 44)
    sc.chord(65.5, 2.0, 'strings', [38, 50, 57], 70)
    # ASK: almost silence – a low D and an unresolved celesta question (ends on E over D)
    sc.n(67.6, 3.2, 'strings', 38, 48)
    for k, p in enumerate([81, 77, 76]):
        sc.n(68.0 + k * 0.55, 1.6, 'celesta', p, 60)
    # POLL: lighter, curious
    bed(sc, 70.6, 86.0, PROG_POLL, {'pad', 'pizz', 'piano8'}, 0.85)
    # END: D minor add9, strings + piano + harp
    sc.chord(86.0, 4.5, 'strings', [38, 50, 57, 62, 64], 66)
    sc.chord(86.0, 4.5, 'piano', [38, 50, 57, 64], 58)
    for k, p in enumerate([50, 57, 62, 64, 69, 74, 76]):
        sc.n(86.0 + k * 0.09, 3.5, 'harp', p, 58)


NOTE_FIG = {  # app -> (instrument, notes) for notification sounds, all in D minor
    'news': ('glock', [86, 93]), 'mail': ('celesta', [81, 86]), 'chat': ('marimba', [74, 81]),
    'air': ('vibes', [74, 81, 86]), 'hr': ('marimba', [77, 84]), 'bank': ('vibes', [65, 72]),
    'pay': ('celesta', [77, 84]), 'bk': ('mbox', [74, 77, 81, 86]), 'alert': ('xylo', [81, 81, 81]),
}
DSCALE = [50, 52, 53, 55, 57, 58, 60, 62, 64, 65, 67, 69, 70, 72, 74]


def sfx(sc, cues):
    hap = []
    for c in cues:
        t, ty = c['t'], c['type']
        if ty in ('ding', 'alert'):
            inst, ns = NOTE_FIG.get(c.get('app') if ty == 'ding' else 'alert', NOTE_FIG['news'])
            step = 0.07 if ty == 'alert' else 0.09
            g = c.get('gain', 1.0)
            for k, p in enumerate(ns):
                sc.n(t + k * step, 0.6, inst, p, 92 * g)
            if ty == 'alert':
                hap.append(t)
        elif ty == 'swipe':
            for k, p in enumerate(DSCALE[::2]):
                sc.n(t + k * 0.04, 0.8, 'harp', p + 12, 50)
        elif ty == 'wake':
            for k, p in enumerate([62, 69, 74]):
                sc.n(t + 0.15 + k * 0.07, 1.2, 'harp', p, 44)
        elif ty == 'pile':
            sc.chord(t + 0.4, 2.0, 'piano', [26, 33, 38], 70); sc.n(t + 0.4, 1.2, 'timp', 38, 80)
        elif ty == 'pop':
            sc.n(t, 0.4, 'pizz', [74, 77, 81, 86][int(round((t - 62.7) / 0.55)) % 4], 84)
        elif ty == 'hit' and t > 10:
            sc.n(t, 1.2, 'timp', 38, 96); hap.append(t)
        elif ty == 'select':
            sc.n(t, 0.8, 'marimba', 74, 70); hap.append(t)
        elif ty == 'end':
            for k, p in enumerate([74, 77, 81, 86]):
                sc.n(t + 0.5 + k * 0.12, 2.0, 'celesta', p, 62)
    return hap


def buzz(n, t, length):
    x = np.zeros(n)
    for k in range(2):
        i = int((t + k * 0.13) * SR); m = int(0.09 * SR)
        if i + m < n:
            tt = np.arange(m) / SR
            x[i:i + m] += np.sin(2 * np.pi * 155 * tt) * np.sin(np.pi * tt / 0.09) * 0.18
    return x


def place(dst, src, t):
    i = int(t * SR); m = min(src.shape[1], dst.shape[1] - i)
    if m > 0:
        dst[:, i:i + m] += src[:, :m]


def main(name):
    meta = json.load(open(f'out/{name}.cues.json'))
    T, cues = meta['duration'], meta['cues']
    n = int(T * SR)

    mus = Score({'piano': 100, 'strings': 96, 'pad': 70, 'pizz': 92, 'celesta': 90, 'bass': 92, 'timp': 100,
                 'harp': 90, 'horn': 84, 'cello': 88, 'trem': 92})
    music(mus, T)
    m = mus.render(f'out/{name}.music', T)

    fx = Score({'glock': 88, 'celesta': 96, 'marimba': 100, 'vibes': 96, 'mbox': 100, 'xylo': 84, 'harp': 96,
                'piano': 100, 'timp': 104, 'pizz': 100})
    hap = sfx(fx, cues)
    f = fx.render(f'out/{name}.sfx', T)

    # rewind: a descending piano phrase played backwards into day 1
    rw = Score({'piano': 110, 'celesta': 90})
    for k, p in enumerate([86, 81, 77, 74, 69, 65, 62, 57, 53, 50]):
        rw.n(0.2 + k * 0.17, 2.4, 'piano', p, 72)
    rw.chord(0.2, 2.6, 'celesta', [74, 81], 50)
    r = rw.render(f'out/{name}.rewind', 3.5)[:, int(0.15 * SR): int(3.2 * SR)][:, ::-1]
    r *= np.linspace(0.2, 1, r.shape[1]) ** 1.5

    out = np.zeros((2, n))
    place(out, m * 0.95, 0)
    place(out, f * 0.75, 0)
    place(out, r * 1.1, 6.6 - r.shape[1] / SR)
    hp = np.zeros(n)
    for t in hap:
        hp += buzz(n, t, T)
    out += np.stack([hp, hp])
    # gentle mastering: tame sub, soft-knee limit, fades
    out = sosfilt(butter(2, 35, 'high', fs=SR, output='sos'), out, axis=-1)
    out *= 0.5 / max(np.sqrt((out ** 2).mean()) * 4, 1e-9)
    out = np.tanh(out * 1.3) / 1.3
    t = np.arange(n) / SR
    out *= np.clip(t / 0.05, 0, 1) * np.clip((T - t) / 1.2, 0, 1)
    out *= 0.89 / np.abs(out).max()
    tmp = f'out/{name}.pre.wav'
    wavfile.write(tmp, SR, (out.T * 32767).astype(np.int16))
    # loudness to -15 LUFS / -1.5 dBTP (two-pass, linear)
    st = subprocess.run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', 'loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
                        capture_output=True, text=True).stderr
    js = json.loads(st[st.rindex('{'):st.rindex('}') + 1])
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-af',
                    f"loudnorm=I=-15:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
                    f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true",
                    '-ar', str(SR), f'out/{name}.wav'], check=True)
    print('wrote', f'out/{name}.wav')


if __name__ == '__main__':
    main(sys.argv[1])
