"""Stillere özel müzik yatakları (örneklenmiş enstrümanlar).

Her besteci fonksiyonu süreyi ve isteğe bağlı vurgu anlarını (saniye) alır,
stereo float dizisi döndürür. Ritim düzenli kalır; vurgu anlarına
yaylı/timpani/zil gibi "olaylar" yerleştirilir.
"""
import numpy as np

from music import Song, master_bed

# ---------------------------------------------------------------- yardımcılar

def bars_for(song, dur, start_beat=0):
    return int(np.ceil((song.sec2beat(dur) - start_beat) / 4))


def voicing(root, kind):
    """Kapalı, şık akor yerleşimi (yedili/dokuzlu)."""
    shapes = {
        'maj9': [0, 4, 7, 11, 14], 'maj7': [0, 4, 7, 11], 'm9': [0, 3, 7, 10, 14], 'm7': [0, 3, 7, 10],
        'm11': [0, 3, 7, 10, 17], 'sus2': [0, 2, 7], 'add9': [0, 4, 7, 14], 'm': [0, 3, 7], 'M': [0, 4, 7],
        '7sus4': [0, 5, 7, 10], 'mmaj7': [0, 3, 7, 11],
    }
    return [root + i for i in shapes[kind]]


# ---------------------------------------------------------------- 05 Bauhaus

def bauhaus(dur, accents=(), final=None, seed=5):
    """Do majör, 112 BPM: pizzicato ostinato, marimba arpejleri, piyano, kontrbas, hafif perküsyon."""
    s = Song(112, seed)
    s.program(0, 'pizz', 92, 50, 30)
    s.program(1, 'marimba', 88, 84, 45)
    s.program(2, 'piano', 84, 64, 50)
    s.program(3, 'ac_bass', 100, 64, 20)
    s.program(4, 'slow_strings', 70, 64, 70)
    s.program(5, 'glock', 60, 90, 60)
    s.program(9, 'piano', 82, 64, 25)
    prog = [(48, 'maj9'), (45, 'm9'), (41, 'maj9'), (43, '7sus4')]
    fb = s.sec2beat(final) if final else 1e9
    nb = bars_for(s, dur)
    for bar in range(nb):
        b0 = bar * 4
        if b0 >= fb:
            break
        root, kind = prog[bar % 4]
        v = voicing(root + 12, kind)
        intro = bar < 2
        # pizzicato sekizlikler
        for k in range(8):
            p = v[[0, 2, 1, 3, 0, 2, 3, 1][k] % len(v)] + 12
            s.note(0, p, b0 + k * .5, .4, 70 if k % 2 else 86)
        # marimba arpeji (giriş sonrası)
        if not intro:
            for k, idx in enumerate([0, 1, 2, 3, 4, 3, 2, 1]):
                s.note(1, v[idx % len(v)] + 24, b0 + k * .5 + .25, .3, 60 + (k % 2) * 10)
        # piyano: senkoplu akor
        s.chord(2, v[1:], b0 + 1.5, 1.0, 58)
        s.chord(2, v[1:], b0 + 3.0, .9, 52)
        # kontrbas
        s.note(3, root - 12, b0, 1.4, 92)
        s.note(3, root - 5, b0 + 2, .9, 80)
        s.note(3, root - 12 + (2 if bar % 2 else 0), b0 + 3, .9, 78)
        # perküsyon
        if not intro:
            s.drum('kick', b0, 78); s.drum('kick', b0 + 2.5, 64)
            s.drum('rim', b0 + 1, 70); s.drum('rim', b0 + 3, 74)
            for k in range(8):
                s.drum('shaker', b0 + k * .5, 50 + (k % 2) * 18)
    for a in accents:
        b = s.sec2beat(a)
        s.note(5, 84 if s.rng.random() < .5 else 88, b, 1.5, 70)
    if final is not None:
        # final: yaylı akor + glockenspiel yükselişi
        s.chord(4, [48, 55, 60, 64, 67, 72], fb, s.sec2beat(dur - final), 78)
        s.swell(4, fb, fb + 2, 40, 120)
        s.chord(2, [36, 48, 55, 64, 67, 72, 76], fb, 6, 80, roll=.05)
        for k, p in enumerate([72, 76, 79, 84, 88]):
            s.note(5, p, fb + .5 + k * .25, 2, 74)
        s.note(3, 36, fb, 6, 90)
        s.drum('crash', fb, 80)
    return s


# ---------------------------------------------------------------- 04 Glitch

def glitch(dur, accents=(), attack=None, final=None, seed=4):
    """Fa# minör, 96 BPM: karanlık sinematik elektronik — pad, sentez bas, piyano motifi, yarım tempolu davul."""
    s = Song(96, seed)
    s.program(0, 'pad_halo', 82, 64, 80)
    s.program(1, 'synth_bass', 96, 64, 10)
    s.program(2, 'piano', 80, 60, 70)
    s.program(3, 'tremolo', 70, 64, 60)
    s.program(4, 'slow_strings', 76, 64, 80)
    s.program(5, 'celesta', 64, 84, 70)
    s.program(9, 'piano', 86, 64, 30)
    prog = [(42, 'm9'), (38, 'maj7'), (45, 'add9'), (40, '7sus4')]
    ab = s.sec2beat(attack[0]) if attack else 1e9
    ae = s.sec2beat(attack[1]) if attack else 1e9
    fb = s.sec2beat(final) if final else 1e9
    motif = [0, 3, 7, 10, 7, 3]
    for bar in range(bars_for(s, dur)):
        b0 = bar * 4
        if b0 >= fb:
            break
        root, kind = prog[bar % 4]
        v = voicing(root + 12, kind)
        s.chord(0, v, b0, 4.1, 64)
        # nabız gibi sekizlik bas
        for k in range(8):
            s.note(1, root - 12 + (12 if k in (3, 7) else 0), b0 + k * .5, .35, 84 if k % 2 == 0 else 66)
        # piyano motifi (yankılı, seyrek)
        if bar >= 2 and bar % 2 == 0:
            for k, iv in enumerate(motif):
                s.note(2, root + 24 + iv, b0 + k * .66, 1.2, 64 - k * 3)
        in_atk = ab <= b0 < ae
        if bar >= 1:
            s.drum('kick', b0, 96); s.drum('kick', b0 + 1.75, 70)
            s.drum('snare' if not in_atk else 'clap', b0 + 2, 82)
            if in_atk:
                s.drum('kick', b0 + 2.5, 88); s.drum('snare', b0 + 3.5, 70)
            for k in range(8 if not in_atk else 16):
                st = .5 if not in_atk else .25
                s.drum('chh', b0 + k * st, 46 + (k % 2) * 14)
        if in_atk:
            s.chord(3, [root + 12, root + 13, root + 19], b0, 4, 76)
    for a in accents:
        b = s.sec2beat(a)
        s.note(5, 78 + int(s.rng.integers(0, 3)) * 5, b, 1.0, 60)
    if final is not None:
        s.chord(4, [30, 42, 49, 54, 57, 61, 66], fb, s.sec2beat(dur - final), 84)
        s.swell(4, fb, fb + 3, 30, 120)
        s.chord(2, [42, 54, 61, 66, 69, 73], fb + .5, 8, 70, roll=.08)
        s.note(1, 30, fb, 4, 100)
        s.drum('crash', fb, 90)
    return s


# ---------------------------------------------------------------- 06 Brutalist

def brutalist(dur, accents=(), final=None, seed=6):
    """Fa minör, 90 BPM boom-bap: Rhodes yedili akorlar, parmak bas, swing'li davul, yaylı vuruşlar."""
    s = Song(90, seed)
    s.program(0, 'epiano', 90, 56, 45)
    s.program(1, 'finger_bass', 104, 64, 10)
    s.program(2, 'strings', 80, 72, 40)
    s.program(3, 'vibes', 64, 84, 60)
    s.program(9, 'piano', 98, 64, 20)
    prog = [(41, 'm9'), (44, 'maj7'), (39, 'm7'), (46, '7sus4')]
    fb = s.sec2beat(final) if final else 1e9
    sw = .08  # swing
    for bar in range(bars_for(s, dur)):
        b0 = bar * 4
        if b0 >= fb:
            break
        root, kind = prog[bar % 4]
        v = voicing(root + 12, kind)
        s.chord(0, v, b0, 1.6, 72, roll=.02)
        s.chord(0, v[1:], b0 + 2.5 + sw, 1.2, 60, roll=.02)
        s.note(1, root - 12, b0, .9, 98)
        s.note(1, root - 12, b0 + 1.5 + sw, .4, 80)
        s.note(1, root - 5, b0 + 2.5 + sw, .5, 84)
        s.note(1, root - 12 + 10, b0 + 3.5 + sw, .4, 74)
        s.drum('kick', b0, 108); s.drum('kick', b0 + 1.5 + sw, 86); s.drum('kick', b0 + 2.75, 78)
        s.drum('snare', b0 + 1, 100); s.drum('snare', b0 + 3, 104)
        for k in range(8):
            s.drum('chh', b0 + k * .5 + (sw if k % 2 else 0), 58 + (0 if k % 2 else 18))
        if bar % 4 == 3:
            s.drum('ohh', b0 + 3.5 + sw, 60)
    for a in accents:
        b = s.sec2beat(a)
        r = prog[int(b // 4) % 4][0]
        s.chord(2, [r + 12, r + 19, r + 24], b, .35, 96)
    if final is not None:
        s.chord(2, [29, 41, 48, 53, 56, 60], fb, 6, 100)
        s.swell(2, fb + .5, fb + 6, 127, 20)
        s.chord(0, [41, 53, 56, 60, 63, 67], fb, 6, 80, roll=.05)
        s.note(1, 29, fb, 3, 110)
        s.drum('crash', fb, 100); s.drum('kick', fb, 120)
        for k, p in enumerate([72, 75, 79, 84]):
            s.note(3, p, fb + 1 + k * .5, 2, 70)
    return s


def render_bed(song, path, dur):
    x = song.render(path)
    n = int(dur * 48000)
    if len(x) < n:
        x = np.pad(x, ((0, n - len(x)), (0, 0)))
    x = master_bed(x[:n])
    return x
