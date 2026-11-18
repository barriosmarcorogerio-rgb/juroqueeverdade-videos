"""Trilha + efeitos do vídeo longo -> music.wav, sfx.wav (níveis finais feitos em mix_long)."""
import json, numpy as np, wave
src = open('../2026-11-17-chuva-de-carne/audio.py').read()
head = src[:src.index('# ---------------- music')]
T = json.load(open('work/timeline.json')); END = T[-1]['e'] + 1
head = head.replace('DUR = 1740 / 30', f'DUR = {END}')
exec(head)
exec(src[src.index('# ---------------- sfx'):src.index('F = lambda f: f / 30')])
SENT = [x for x in T if x['i'] >= 0]
st = lambda i: SENT[i]['s']
music = np.zeros(N, np.float32)
# soft bed: plucked C-F-G-C loop at 96 bpm, alternating brighter/darker every chapter; rests at chapter titles
BPM = 96; beat = 60 / BPM
caps = [x for x in T if x['i'] == 0]
for ci, c in enumerate(caps):
    a = c['s'] + 1.5; b = (caps[ci + 1]['s'] - 1.0) if ci + 1 < len(caps) else END - 1
    prog = [(48, [60, 64, 67]), (53, [57, 60, 65]), (55, [59, 62, 67]), (48, [60, 64, 67])] if ci % 2 == 0 else [(45, [57, 60, 64]), (53, [57, 60, 65]), (52, [56, 59, 64]), (45, [57, 60, 64])]
    tt = a; bar = 0
    while tt < b - beat * 4:
        root, ch = prog[bar % 4]
        place(music, brass([midi(m) for m in ch], beat * 4 * 0.98), tt, 0.035)
        for k in range(4):
            place(music, pluck(midi(root - 12 + (7 if k % 2 else 0)), 0.3, 0.4), tt + k * beat, 0.22)
            if k % 2 == 0: place(music, pluck(midi(ch[(bar + k) % 3] + 12), 0.25, 0.6), tt + k * beat + beat / 2, 0.08)
        bar += 1; tt += beat * 4
    # chapter title sting
    place(sfx, sting(), c['s'] - 0.4, 0.35); place(sfx, whoosh(0.8), c['s'] - 0.6, 0.3)
def drill(d):
    n = int(d * SR); t = np.arange(n) / SR
    return (lp_fast(noise(d), 2500) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 28 * t))) * np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.1)).astype(np.float32)
def ring(d=1.2):
    n = int(d * SR); t = np.arange(n) / SR
    return ((np.sin(2 * np.pi * 1300 * t) + np.sin(2 * np.pi * 1700 * t)) * (np.mod(t, 0.4) < 0.2) * 0.25).astype(np.float32)
ev = {2: [(sting(), 0, 0.5)], 6: [(thunk(60, 0.6), 0, 0.8)], 28: [(crunch(0.4), 0.8, 0.6)], 29: [(creak(0.6), 0, 0.4)], 30: [(thunk(50, 0.6), 1.0, 0.9), (rumble(1.2), 1.0, 0.5)],
      54: [(thunk(50, 0.6), 0.3, 0.9), (rumble(1.0), 0.3, 0.5)], 55: [(snap(), 0.1, 1.0)], 72: [(laugh(1.0), 1.5, 0.4)], 85: [(thunk(60, 0.4), 0.5, 0.5)], 87: [(cuckoo(), 0, 0.4)],
      88: [(thunk(45, 0.8), 0.6, 1.0), (rumble(1.5), 0.6, 0.6)], 95: [(crunch(0.5), 0.3, 0.6)], 104: [(whoosh(0.4), 0, 0.3)], 105: [(crunch(0.5), 1.5, 0.7)], 118: [(water(2.5), 0, 0.4)],
      119: [(water(3.0), 0, 0.5)], 126: [(thunk(150, 0.2), 0.3, 0.6)], 127: [(crunch(0.4), 0.2, 0.7)], 128: [(splash(0.8), 0.6, 0.8)], 139: [(whoosh(1.2), 0, 0.5), (whoosh(1.0), 2.0, 0.4)],
      144: [(snap(), 0.3, 0.8)], 145: [(whoosh(1.5), 0, 0.6)], 147: [(thunk(40, 1.0), 0, 1.0), (rumble(2.5), 0, 0.9), (crash(1.5), 0.1, 0.5)], 148: [(leaves(1.5), 0, 0.4)],
      149: [(whoosh(1.0), 0, 0.5), (snore(0.6), 0.5, 0.3)], 151: [(splash(0.6), 1.5, 0.5), (thunk(45, 0.8), 2.0, 0.9)], 153: [(clink(1200), 0.4, 0.5)], 174: [(laugh(1.5), 0, 0.4)],
      178: [(creak(1.0), 0, 0.4)], 187: [(ting(), 0, 0.4)], 189: [(sting(), 1.0, 0.4)]}
for i, lst in ev.items():
    for sig, dt, g in lst: place(sfx, sig, st(i) + dt, g)
pk = max(np.abs(music).max(), np.abs(sfx).max(), 1e-6)
def wav(name, x):
    with wave.open(name, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
wav('music.wav', music / pk * 0.9); wav('sfx.wav', sfx / pk * 0.9); print('stems', END)
