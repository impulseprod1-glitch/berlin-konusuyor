"""Örneklenmiş gerçek enstrümanlarla (MuseScore General SoundFont, MIT lisanslı)
müzik üretimi.

Besteler MIDI olarak kurulur (mido), FluidSynth ile WAV'a çevrilir, sonra
numpy tarafında oda yankısı, sıkıştırma ve seslendirmeye yer açan "ducking"
uygulanır. Sentezleyici dalga formları yerine gerçek piyano, yaylı, marimba,
bas ve davul kayıtları kullanıldığı için çok daha doğal duyulur.
"""
import os
import subprocess
import tempfile

import mido
import numpy as np
from scipy.io import wavfile

from synth import SR, filt, reverb

SF = '/usr/share/sounds/sf3/MuseScore_General_Full.sf3'
TPB = 480  # tick / vuruş

# Genel MIDI program numaraları (0 tabanlı)
GM = {
    'piano': 0, 'bright_piano': 1, 'epiano': 4, 'celesta': 8, 'glock': 9, 'vibes': 11, 'marimba': 12,
    'organ': 19, 'nylon': 24, 'ac_bass': 32, 'finger_bass': 33, 'synth_bass': 38, 'violin': 40, 'cello': 42,
    'contrabass': 43, 'tremolo': 44, 'pizz': 45, 'harp': 46, 'timpani': 47, 'strings': 48, 'slow_strings': 49,
    'choir': 52, 'brass': 61, 'french_horn': 60, 'flute': 73, 'pad_warm': 89, 'pad_poly': 90, 'pad_halo': 94,
    'pad_sweep': 95, 'fx_atmos': 99, 'square': 80, 'saw_lead': 81,
}
DR = {'kick': 36, 'snare': 38, 'rim': 37, 'clap': 39, 'chh': 42, 'ohh': 46, 'ride': 51, 'crash': 49, 'tom_lo': 45, 'tom_hi': 50, 'shaker': 70, 'tamb': 54}


class Song:
    def __init__(self, bpm, seed=1):
        self.bpm = bpm
        self.events = []  # (tick, kanal, tip, a, b)
        self.programs = {}
        self.rng = np.random.default_rng(seed)

    def beat(self, b):
        return int(round(b * TPB))

    def sec2beat(self, s):
        return s * self.bpm / 60

    def program(self, ch, name, vol=100, pan=64, reverb=40):
        self.programs[ch] = (GM[name], vol, pan, reverb)

    def note(self, ch, pitch, start, length, vel=80, human=0.015):
        j = self.rng.normal(0, human) if ch != 9 else self.rng.normal(0, human * 0.5)
        v = int(np.clip(vel + self.rng.normal(0, 5), 1, 127))
        t0 = max(0, self.beat(start + j))
        t1 = max(t0 + 1, self.beat(start + length))
        self.events.append((t0, ch, 'on', int(pitch), v))
        self.events.append((t1, ch, 'off', int(pitch), 0))

    def chord(self, ch, pitches, start, length, vel=70, roll=0.0):
        for i, p in enumerate(pitches):
            self.note(ch, p, start + i * roll, length - i * roll, vel - i * 2)

    def cc(self, ch, ctrl, value, start):
        self.events.append((self.beat(start), ch, 'cc', ctrl, int(np.clip(value, 0, 127))))

    def swell(self, ch, start, end, v0, v1, steps=24):
        for k in range(steps + 1):
            b = start + (end - start) * k / steps
            self.cc(ch, 11, v0 + (v1 - v0) * k / steps, b)

    def drum(self, name, start, vel=90):
        self.note(9, DR[name], start, 0.1, vel)

    def render(self, wav_path, gain=0.6):
        mid = mido.MidiFile(ticks_per_beat=TPB)
        tr = mido.MidiTrack()
        mid.tracks.append(tr)
        tr.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(self.bpm), time=0))
        for ch, (prog, vol, pan, rev) in self.programs.items():
            if ch != 9:
                tr.append(mido.Message('program_change', channel=ch, program=prog, time=0))
            tr.append(mido.Message('control_change', channel=ch, control=7, value=vol, time=0))
            tr.append(mido.Message('control_change', channel=ch, control=10, value=pan, time=0))
            tr.append(mido.Message('control_change', channel=ch, control=91, value=rev, time=0))
            tr.append(mido.Message('control_change', channel=ch, control=11, value=127, time=0))
        order = {'off': 0, 'cc': 1, 'on': 2}
        ev = sorted(self.events, key=lambda e: (e[0], order[e[2]]))
        last = 0
        for t, ch, kind, a, b in ev:
            dt = t - last
            last = t
            if kind == 'on':
                tr.append(mido.Message('note_on', channel=ch, note=a, velocity=b, time=dt))
            elif kind == 'off':
                tr.append(mido.Message('note_off', channel=ch, note=a, velocity=0, time=dt))
            else:
                tr.append(mido.Message('control_change', channel=ch, control=a, value=b, time=dt))
        with tempfile.TemporaryDirectory() as d:
            mp = os.path.join(d, 's.mid')
            mid.save(mp)
            subprocess.run(['fluidsynth', '-ni', '-q', '-g', str(gain), '-r', str(SR), '-R', '1', '-C', '1',
                            '-o', 'synth.reverb.room-size=0.6', '-o', 'synth.reverb.width=0.9', '-o', 'synth.reverb.level=0.6',
                            '-F', wav_path, SF, mp], check=True)
        sr, x = wavfile.read(wav_path)
        x = x.astype(np.float64)
        x /= 32768.0 if np.abs(x).max() > 2 else 1.0
        return x


def master_bed(x, room=2.2, mix=0.18):
    """Hafif ek oda, yumuşak alt kesim ve tepe kontrolü."""
    x = filt(x, 'highpass', 35, 2)
    x = reverb(x, room, mix, bright=7000)
    peak = np.max(np.abs(x)) + 1e-9
    return x / peak * 0.8


def duck(bed, voice_env, depth=0.55, attack=0.08, release=0.45):
    """Seslendirme konuşurken müziği kıs (yumuşak zarfla)."""
    n = len(bed)
    env = np.zeros(n)
    env[: min(n, len(voice_env))] = voice_env[:n]
    a = np.exp(-1 / (attack * SR))
    r = np.exp(-1 / (release * SR))
    out = np.zeros(n)
    g = 0.0
    for i in range(0, n, 64):
        v = env[i]
        g = a * g + (1 - a) * v if v > g else r * g + (1 - r) * v
        out[i:i + 64] = g
    gain = 1 - depth * np.clip(out, 0, 1)
    return bed * gain[:, None]
