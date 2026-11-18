"""Trilha + efeitos — A Muralha (ep. 1) -> music.wav, sfx.wav (níveis finais feitos em mix_long)."""
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
BPM = 84; beat = 60 / BPM
caps = [x for x in T if x['i'] == 0]
for ci, c in enumerate(caps):
    a = c['s'] + 1.5; b = (caps[ci + 1]['s'] - 1.0) if ci + 1 < len(caps) else END - 1
    prog = [(45, [57, 60, 64]), (53, [57, 60, 65]), (52, [56, 59, 64]), (45, [57, 60, 64])]
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
def bell(d=3.0, f0=196.0):
    n = int(d * SR); t = np.arange(n) / SR
    parts = [(0.5, 0.6), (1.0, 1.0), (1.2, 0.5), (1.5, 0.35), (2.0, 0.4), (2.5, 0.2), (3.0, 0.15)]
    x = sum(a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t * (1.2 + r * 0.8)) for r, a in parts)
    return (x * np.minimum(1, t / 0.004) * 0.35).astype(np.float32)
B = lambda dt=0.0, g=0.8: (bell(), dt, g)
HIT = lambda dt=0.0: [(thunk(50, 0.6), dt, 0.9), (rumble(1.2), dt, 0.5)]
ev = {11: [B(1.4, 0.6)], 12: [B()], 13: [B()], 14: [B()], 16: [(leaves(1.5), 0, 0.5)], 18: [(sting(), 0, 0.4)],
      28: [(thunk(80, 0.4), 1.5, 1.0), (crash(0.6), 1.6, 0.4)], 29: [(thunk(45, 0.8), 0.2, 0.8)], 30: [(creak(0.8), 0.5, 0.3)], 31: HIT(0.8),
      32: [(sting(), 0.5, 0.5)], 35: [(creak(1.2), 0.5, 0.6)], 36: [(crunch(0.6), 0, 0.8)], 37: [(whoosh(1.2), 0.3, 0.4)],
      38: HIT(0.6), 39: [(rumble(1.5), 0, 0.6)], 40: HIT(0.3), 41: [(crunch(0.8), 0.2, 0.7)], 43: [(whoosh(0.4), 0, 0.4)], 44: [(whoosh(0.4), 0, 0.4)], 45: [(whoosh(0.4), 0, 0.4)],
      48: [(whoosh(0.5), 1.0, 0.6), (snap(), 1.5, 0.6)], 49: [(clink(900), 0, 0.6)], 50: [(creak(0.5), 0, 0.4)], 51: [(whoosh(1.2), 0.5, 0.6)], 52: [(whoosh(1.0), 0, 0.5), (thunk(120, 0.3), 1.6, 0.7)],
      55: [(ting(), 0.3, 0.3)], 56: [(whoosh(1.0), 0.3, 0.6)], 61: [(creak(0.6), 0, 0.3)], 70: [(creak(1.4), 0, 0.5)], 80: [(crunch(0.3), 0.3, 0.3), (crunch(0.3), 0.9, 0.3)],
      82: [(leaves(1.0), 0, 0.3)], 96: [(snore(0.8), 0, 0.5)], 97: [(snore(0.8), 0, 0.6), (leaves(1.0), 0.3, 0.3)], 105: [(clink(1500), 1.0, 0.3), (clink(1700), 1.6, 0.3)],
      114: [(laugh(1.2), 1.5, 0.3)], 121: [B(0, 0.5)], 122: [B(0, 0.5)], 123: [B(0, 0.5)], 124: [(sting(), 0, 0.5)], 126: [(whoosh(0.6), 0, 0.5)],
      128: [(whoosh(0.6), 0, 0.5), (whoosh(0.6), 0.8, 0.5)], 130: [(crash(1.2), 0.5, 0.5), (thunk(45, 0.8), 0.5, 0.8), (leaves(1.5), 0.6, 0.5)],
      132: [(thunk(60, 0.6), 0.2, 0.9)], 134: [(crunch(0.8), 0.2, 0.7), (rumble(1.0), 0.2, 0.5)], 135: [(crash(1.0), 0.6, 0.6)], 137: [(thunk(150, 0.2), 1.2, 0.7)],
      143: [(whoosh(0.5), 0, 0.3)], 149: [(whoosh(0.6), 1.5, 0.5)], 150: [(whoosh(0.8), 0.5, 0.6), (clink(800), 1.2, 0.6)],
      153: [B()], 156: [B()], 158: [B()], 159: [B()], 162: [B()], 164: [(snore(1.2), 0, 0.5)], 165: [B()], 166: [B(0, 1.0)],
      167: [(thunk(40, 1.0), 0.8, 1.0), (rumble(2.5), 0.8, 0.9)], 168: [(thunk(45, 0.8), 1.0, 1.0), (crash(1.0), 1.1, 0.4)], 170: [(snore(1.0), 0, 0.6), (snore(1.0), 1.4, 0.6)],
      177: [(clink(1200), 0.4, 0.5)], 178: [(laugh(1.2), 0.2, 0.3)], 184: [(rumble(2.0), 0, 0.6), (sting(), 0.8, 0.5)], 187: [(sting(), 1.2, 0.5), B(1.8, 0.4)]}
for i, lst in ev.items():
    for sig, dt, g in lst: place(sfx, sig, st(i) + dt, g)
pk = max(np.abs(music).max(), np.abs(sfx).max(), 1e-6)
def wav(name, x):
    with wave.open(name, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
wav('music.wav', music / pk * 0.9); wav('sfx.wav', sfx / pk * 0.9); print('stems', END)
