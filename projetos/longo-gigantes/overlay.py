"""Legenda + HUD (profundidade/temperatura + minimapa) + título de capítulo sobre frames/ -> frames_cap/ (horizontal, 12 qps)."""
import json, glob, os, sys
from PIL import Image, ImageDraw, ImageFont
FPS = 12
FONT = '/usr/share/fonts/opentype/inter/Inter-Black.otf'
W = []
for k in range(1, 13): W += json.load(open(f'work/cap{k:02d}.abs.json'))
for w in W: w['w'] = w['w'].strip('"“”').rstrip('.,:;') if w['w'] not in ('PLAFT.',) else 'PLAFT!'
HUD = json.load(open('work/hud.json'))
f_cap = ImageFont.truetype(FONT, 64); f_hud = ImageFont.truetype(FONT, 34); f_small = ImageFont.truetype(FONT, 22); f_title = ImageFont.truetype(FONT, 96); f_num = ImageFont.truetype(FONT, 40)
def words_at(t):  # show 2-word chunks for readability
    for i, w in enumerate(W):
        nxt = W[i + 1]['s'] if i + 1 < len(W) else w['e'] + 0.4
        if w['s'] - 0.03 <= t < min(nxt, w['e'] + 0.45):
            j = i - (i % 2); grp = [x['w'] for x in W[j:j + 2] if x['cap'] == w['cap']]; return ' '.join(grp)
    return None
def hud_at(f):
    for h in HUD['hud']:
        if h['a'] <= f <= h['b']: return h
    return None
DEPTH_KM = lambda s: (float(s.split()[0].replace('.', '').replace(',', '.')) / (1000 if s.endswith(' m') else 1)) if s else 0
os.makedirs('frames_cap', exist_ok=True)
fs = sorted(glob.glob('frames/f*.jpg')); a0 = int(sys.argv[1]) if len(sys.argv) > 1 else 0
last_h = None
for fp in fs:
    n = int(os.path.basename(fp)[1:-4])
    if n < a0: continue
    t = n / FPS; im = Image.open(fp).convert('RGB'); d = ImageDraw.Draw(im, 'RGBA')
    h = hud_at(n) or last_h; last_h = h
    if h and h['hud']:
        dep, tmp = h['hud']; km = DEPTH_KM(dep)
        d.rounded_rectangle([40, 36, 470, 160], 22, fill=(10, 8, 14, 150))
        d.text((66, 52), 'PROFUNDIDADE', font=f_small, fill=(255, 214, 63)); d.text((66, 78), dep, font=f_num, fill=(255, 255, 255))
        d.text((300, 52), 'CALOR', font=f_small, fill=(255, 140, 90)); d.text((300, 78), tmp, font=f_num, fill=(255, 255, 255))
        # minimap: Earth slice with the traveller
        cx, cy, R = 1800, 150, 90
        for r, col in [(1.0, (90, 140, 200)), (0.97, (200, 100, 42)), (0.546, (242, 178, 58)), (0.19, (255, 242, 176))]:
            d.ellipse([cx - R * r, cy - R * r, cx + R * r, cy + R * r], fill=col + (235,), outline=(20, 16, 22), width=3)
        d.line([cx, cy - R, cx, cy + R], fill=(20, 16, 22), width=3)
        y = cy - R + 2 * R * min(1, km / 12742); d.ellipse([cx - 11, y - 11, cx + 11, y + 11], fill=(255, 214, 63), outline=(20, 16, 22), width=4)
        d.text((cx, cy - R - 22), 'BRASIL', font=f_small, fill=(255, 255, 255), anchor='mm', stroke_width=4, stroke_fill=(20, 16, 22))
        d.text((cx, cy + R + 22), 'JAPÃO?', font=f_small, fill=(255, 255, 255), anchor='mm', stroke_width=4, stroke_fill=(20, 16, 22))
    for c in HUD['caps']:
        if c['a'] - 2 <= n < c['a'] + int(2.6 * FPS):
            k = (n - c['a'] + 2) / (2.6 * FPS + 2); al = int(255 * min(1, k * 6, (1 - k) * 6))
            d.text((960, 300), f"CAPÍTULO {c['cap']}", font=f_hud, fill=(255, 214, 63, al), anchor='mm', stroke_width=8, stroke_fill=(20, 16, 22, al))
            d.text((960, 380), c['title'], font=f_title, fill=(255, 255, 255, al), anchor='mm', stroke_width=12, stroke_fill=(20, 16, 22, al))
    w = words_at(t)
    if w:
        d.text((964, 930), w, font=f_cap, anchor='mm', fill=(0, 0, 0), stroke_width=12, stroke_fill=(0, 0, 0))
        d.text((960, 924), w, font=f_cap, anchor='mm', fill=(255, 255, 255), stroke_width=10, stroke_fill=(20, 16, 22))
    im.save('frames_cap/' + os.path.basename(fp), quality=93)
print('overlay', len(fs))
