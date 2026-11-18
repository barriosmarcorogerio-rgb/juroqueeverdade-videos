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
ev = {12: [(crunch(0.3), 0, 0.5)], 14: [(splash(0.8), 0, 0.6)], 16: [(water(2.0), 0, 0.4)], 18: [(splash(0.5), 1.0, 0.5)], 22: [(ting(), 0.4, 0.8)],
      27: [(drill(1.5), 1.6, 0.4)], 28: [(drill(1.4), 0, 0.5)], 29: [(drill(0.8), 0, 0.4)], 30: [(drill(0.8), 0, 0.4)], 31: [(whoosh(1.0), 0, 0.3)],
      38: [(clink(1600), 2.0, 0.5)], 41: [(hiss(0.6), 0, 0.4)], 42: [(ring(), 0, 0.4)], 48: [(drill(1.6), 0, 0.3)], 53: [(cuckoo(), 1.5, 0.4)],
      57: [(creak(0.6), 0, 0.5)], 60: [(thunk(90, 0.4), 2.5, 0.6)], 77: [(crunch(0.4), 1.6, 0.6)], 78: [(whoosh(1.0), 0.5, 0.4)], 80: [(ting(), 3.2, 0.4)],
      100: [(whoosh(2.5), 0, 0.4)], 109: [(ring(), 0, 0.4)], 111: [(rumble(2.0), 1.0, 0.7)], 113: [(rumble(2.5), 0, 0.4)], 122: [(hiss(0.8), 0.5, 0.6)],
      130: [(clink(1200), 0.2, 0.6)], 131: [(clink(900), 0.3, 0.6)], 132: [(splash(1.0), 0.3, 0.6)], 148: [(ting(), 0, 0.4)], 152: [(cuckoo(), 0, 0.3)],
      157: [(whoosh(2.0), 1.0, 0.5)], 160: [(whoosh(2.5), 0, 0.6)], 161: [(whoosh(1.5), 0.5, 0.6)], 168: [(whoosh(0.8), 0, 0.4)], 169: [(whoosh(0.8), 0, 0.4)],
      177: [(whoosh(0.6), 0.4, 0.5)], 178: [(thunk(70, 0.5), 0.05, 1.0), (crash(1.0), 0.05, 0.4)], 179: [(scrape(1.5), 0, 0.5)], 183: [(snore(0.8), 0.5, 0.3)],
      189: [(splash(1.2), 1.8, 0.8)], 191: [(water(4.0), 0, 0.3)], 194: [(water(3.0), 0, 0.3)], 199: [(ting(), 4.0, 0.3)]}
for i, lst in ev.items():
    for sig, dt, g in lst: place(sfx, sig, st(i) + dt, g)
pk = max(np.abs(music).max(), np.abs(sfx).max(), 1e-6)
def wav(name, x):
    with wave.open(name, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
wav('music.wav', music / pk * 0.9); wav('sfx.wav', sfx / pk * 0.9); print('stems', END)
