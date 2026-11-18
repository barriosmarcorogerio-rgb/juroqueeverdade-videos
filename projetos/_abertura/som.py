"""Trilha da abertura (9 s): passos que crescem, zumbido grave, 'whoosh' do agarrão, mordida e o estrondo do título."""
import numpy as np, wave
SR = 48000; N = 9 * SR; t = np.arange(N) / SR; out = np.zeros(N); rng = np.random.default_rng(7)
def env(t0, a, d): e = np.zeros(N); i = int(t0 * SR); n = N - i; tt = np.arange(n) / SR; e[i:] = np.minimum(1, tt / max(a, 1e-4)) * np.exp(-tt / d); return e
def lp(x, k): return np.convolve(x, np.ones(k) / k, mode='same')
def boom(t0, v): global out; out += v * env(t0, 0.005, 0.35) * np.sin(2 * np.pi * (38 + 30 * np.exp(-(t - t0).clip(0) * 9)) * t) + v * 0.5 * env(t0, 0.002, 0.08) * lp(rng.standard_normal(N), 30)
for k, tb in enumerate([0.5, 1.0, 1.5, 2.0, 2.42, 2.75, 3.25]): boom(tb, 0.35 + k * 0.09)
drone = (np.sin(2 * np.pi * 55 * t) + 0.5 * np.sin(2 * np.pi * 58.3 * t) + 0.3 * np.sin(2 * np.pi * 110 * t)) * np.clip(t / 3.5, 0, 1) * (t < 5.9) * 0.18
trem = np.sin(2 * np.pi * 220 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * t)) * np.clip((t - 2) / 3, 0, 1) * (t < 5.9) * 0.06
out += drone + trem
w = lp(rng.standard_normal(N), 8) * env(3.45, 0.25, 0.25) * 0.5; out += w                      # whoosh (agarrão)
cr = rng.standard_normal(N) * env(5.17, 0.002, 0.06) * 0.7 + rng.standard_normal(N) * env(5.5, 0.002, 0.07) * 0.6   # crunch
out += lp(cr, 3); boom(5.17, 0.6)
tt = (t - 6.0).clip(0); on = t >= 6.0
br = sum(np.sign(np.sin(2 * np.pi * f * t)) * a for f, a in [(55, 0.5), (82.4, 0.35), (110, 0.3), (164.8, 0.15)])
out += lp(br, 12) * on * np.minimum(1, tt / 0.03) * np.exp(-tt / 1.6) * 0.45; boom(6.0, 1.0)
out = np.tanh(out * 1.4); out /= np.abs(out).max() * 1.12
st = np.stack([out, out], 1); st[:, 1] = np.roll(out, 240)
with wave.open('abertura.wav', 'wb') as f: f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes((st * 32767).astype('<i2').tobytes())
print('abertura.wav ok')
