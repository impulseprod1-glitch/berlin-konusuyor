"""Her cümle için birkaç aday üretir, Whisper ile geri dinler ve en anlaşılır olanı seçer.

  REF=ref.wav python tts/best_voice.py          tüm cümleler → voice/NN.wav
  REF=ref.wav python tts/best_voice.py 6 14     yalnızca seçilen cümleler

REF: Türkçe konuşan temiz bir ses örneği (5–15 sn). Model sesi ve aksanı buradan alır.
Sonuç: voice/NN.wav ve voice/scores.json (cümle başına uyum puanı, 1,00 = birebir).
"""
import json, os, re, sys, time, difflib, tempfile
from pathlib import Path
import torch, torchaudio
from num2words import num2words
from faster_whisper import WhisperModel
from chatterbox.mtl_tts import ChatterboxMultilingualTTS

here = Path(__file__).resolve().parent.parent
lines = json.loads((here / "src/narration.json").read_text())["lines"]
only = {int(a) for a in sys.argv[1:]}
out = here / "voice"
out.mkdir(exist_ok=True)


def words_tr(s: str) -> str:
    """Rakamları Türkçe sözcüklere çevirir: 2.6 → iki virgül altı, 80.000 → seksen bin."""
    s = re.sub(r"(\d+)[.,](\d)(?!\d)", lambda m: f"{num2words(int(m[1]), lang='tr')} virgül {num2words(int(m[2]), lang='tr')}", s)
    s = re.sub(r"\d{1,3}(?:\.\d{3})+", lambda m: m[0].replace(".", ""), s)
    return re.sub(r"\d+", lambda m: num2words(int(m[0]), lang="tr"), s)


def norm(s: str) -> str:
    s = words_tr(re.sub(r"\[[^\]]*\]", "", s)).replace("İ", "i").replace("I", "ı").lower()
    return re.sub(r"[^a-zçğıöşü]", "", s)


def style(tag: str):
    """Yönergeden vurgu adayları. Yüksek vurgu + yüksek cfg = daha coşkulu ve daha hızlı okuma."""
    t = tag.lower()
    if "shout" in t or any(k in t for k in ("excited", "energetic", "punchy", "proud", "determined", "rising", "fast", "building")):
        return [0.8, 0.7, 0.9, 0.6]
    if any(k in t for k in ("low", "serious", "storytelling", "bitter")):
        return [0.55, 0.65, 0.5, 0.7]
    return [0.65, 0.75, 0.6, 0.8]


def spoken(wav) -> float:
    """Baştaki ve sondaki sessizlik hariç konuşma süresi (sn)."""
    a = wav.abs().squeeze()
    idx = (a > 0.02 * a.max()).nonzero()
    return float(idx[-1] - idx[0]) / tts.sr if len(idx) else 0.0


torch.set_num_threads(os.cpu_count() or 4)
tts = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
asr = WhisperModel("small", device="cpu", compute_type="int8")
ref = os.environ.get("REF")
target = float(os.environ.get("TARGET", 0.9))
scores_f = out / "scores.json"
scores = json.loads(scores_f.read_text()) if scores_f.exists() else {}

for i, ln in enumerate(lines):
    if only and i not in only:
        continue
    tags = " ".join(re.findall(r"\[([^\]]*)\]", ln["text"]))
    # "say": yabancı adlar için Türkçe okunuşla yazılmış metin (yalnızca yerel modele gider)
    text = re.sub(r"\[[^\]]*\]\s*", "", ln.get("say") or ln["text"]).replace("...", ",").strip(" ,")
    want = norm(text)
    slot = (lines[i + 1]["t"] if i + 1 < len(lines) else 60.0) - ln["t"] - 0.08
    best = (-1.0, None, "", 0.0)
    t0 = time.time()
    for k, ex in enumerate(style(tags) + style(tags)[:2]):  # en çok 6 aday
        torch.manual_seed(1000 * i + k)
        wav = tts.generate(text, language_id="tr", audio_prompt_path=ref, exaggeration=ex, cfg_weight=0.65, temperature=0.7)
        with tempfile.NamedTemporaryFile(suffix=".wav") as f:
            torchaudio.save(f.name, wav, tts.sr)
            heard = " ".join(s.text for s in asr.transcribe(f.name, language="tr", beam_size=5)[0]).strip()
        r = difflib.SequenceMatcher(None, want, norm(heard)).ratio()
        dur = spoken(wav)
        # puan: anlaşılırlık önce gelir, sonra sahneye sığma (1,2 kata kadar hızlandırma kabul)
        q = r - 0.5 * max(0.0, dur / slot - 1.2)
        if q > best[0]:
            best = (q, wav, heard, dur, r)
        if r >= target and dur <= slot * 1.2 and k >= 1:
            break
    torchaudio.save(str(out / f"{i:02d}.wav"), best[1], tts.sr)
    scores[f"{i:02d}"] = {"uyum": round(best[4], 2), "sure": round(best[3], 2), "yer": round(slot, 2)}
    scores_f.write_text(json.dumps(scores, indent=1))
    print(f"{i:02d}  uyum {best[4]:4.2f}  {best[3]:4.1f}/{slot:3.1f} sn  ({k + 1} aday, {time.time() - t0:4.0f} sn)  {text}  →  {best[2]}", flush=True)
