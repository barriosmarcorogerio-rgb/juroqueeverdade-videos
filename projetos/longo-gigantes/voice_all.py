import json, subprocess, numpy as np, wave
SR = 48000
T = json.load(open('work/timeline.json')); END = T[-1]['e']
out = np.zeros(int((END + 1) * SR), np.float32)
starts = {}
for x in T:
    if x['i'] == 0: starts[x['cap']] = None
t = 0.6
for k in range(1, 13):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f'cap{k:02d}.wav', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    v = np.frombuffer(raw, np.float32); i = int(t * SR); out[i:i + len(v)] += v[:len(out) - i]
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f'cap{k:02d}.wav'], capture_output=True, text=True).stdout)
    t += dur + 1.2
with wave.open('voice.wav', 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes())
print('voice.wav', round(len(out) / SR, 1), 'end', END)
