"""Boca sincronizada com a narração: voice.wav -> web/mouth.json (abertura 0..3 por quadro, 30 fps).
Uso: python3 mouth.py [voice.wav] [quadros]"""
import json, subprocess, sys
import numpy as np
src = sys.argv[1] if len(sys.argv) > 1 else 'voice.wav'
SR = 16000
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
x = np.frombuffer(raw, np.float32)
n = int(sys.argv[2]) if len(sys.argv) > 2 else int(len(x) / SR * 30 + 0.5)
hop = SR / 30
rms = np.array([np.sqrt(np.mean(x[int(i * hop):int((i + 1) * hop)] ** 2) + 1e-12) for i in range(n)])
ref = np.percentile(rms[rms > 0], 92)
v = np.clip(rms / ref, 0, 1.2)
v = np.convolve(v, [0.25, 0.5, 0.25], 'same')           # suaviza sem atrasar
lv = np.where(v < 0.12, 0, np.where(v < 0.4, 1, np.where(v < 0.75, 2, 3)))
# boca não "pisca": evita abrir/fechar num único quadro
for i in range(1, n - 1):
    if lv[i - 1] == lv[i + 1] and lv[i] != lv[i - 1] and abs(int(lv[i]) - int(lv[i - 1])) == 1: lv[i] = lv[i - 1]
json.dump([int(a) for a in lv], open('web/mouth.json', 'w'))
print('mouth', n, 'quadros, aberta', round(float((lv > 0).mean()) * 100), '%')
