import sys, json, wave, numpy as np
from faster_whisper import WhisperModel
w = wave.open(sys.argv[1]); sr = w.getframerate(); a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32)/32768
if w.getnchannels() > 1: a = a.reshape(-1, w.getnchannels()).mean(1)
if sr != 16000:
    import subprocess; a = np.frombuffer(subprocess.run(["ffmpeg","-v","error","-i",sys.argv[1],"-ac","1","-ar","16000","-f","f32le","-"],capture_output=True).stdout, np.float32)
script = open(sys.argv[2]).read().split()
m = WhisperModel("small", device="cpu", compute_type="int8", cpu_threads=4)
segs, _ = m.transcribe(a, language="pt", word_timestamps=True, initial_prompt=" ".join(script))
ws = [ {"w": x.word.strip(), "s": round(x.start,3), "e": round(x.end,3)} for s in segs for x in s.words ]
# use script spelling when counts match
if len(ws) == len(script):
    for x, t in zip(ws, script): x["w"] = t
json.dump(ws, open(sys.argv[3], "w"), ensure_ascii=False, indent=0); print(len(ws), len(script)); print(ws)
