"""Transcribe the demo audiobook with segment + word timestamps (runs in GitHub Actions)."""
import json, sys
from faster_whisper import WhisperModel

audio, out = sys.argv[1], sys.argv[2]
model = WhisperModel("small.en", device="cpu", compute_type="int8")
segments, info = model.transcribe(audio, word_timestamps=True, beam_size=5, vad_filter=False)
data = []
for s in segments:
    data.append({
        "start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip(),
        "words": [{"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)} for w in (s.words or [])],
    })
    print(f"{s.start:7.1f} {s.text.strip()}", flush=True)
json.dump({"duration": round(info.duration, 2), "segments": data}, open(out, "w"), indent=0)
