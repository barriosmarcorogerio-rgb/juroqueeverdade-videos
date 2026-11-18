"""Legenda palavra por palavra (estilo das referências) sobre frames/ -> frames_cap/.
+ GANCHO: se existir work/gancho.txt (frase curta e absurda, ex.: "O BRASIL IMPORTOU CAMELOS?!"), ele aparece GRANDE
  no topo nos primeiros 2,8 s (entra com um "pop"). A legenda fica em 74% da altura, abaixo dos rostos."""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont
W = json.load(open('work/words.json')); FONT = '/usr/share/fonts/opentype/inter/Inter-Black.otf'
import glob
if not os.path.exists(FONT): FONT = [f for f in glob.glob('/usr/share/fonts/**/*Black*.ttf', recursive=True) + glob.glob('/usr/share/fonts/**/*.ttf', recursive=True) if 'Inter' in f and 'Black' in f][0]
font = ImageFont.truetype(FONT, 92)
os.makedirs('frames_cap', exist_ok=True)
GANCHO = open('work/gancho.txt').read().strip().upper() if os.path.exists('work/gancho.txt') else ''
def wrap(d, text, w):  # -> (linhas, tamanho da fonte): menos linhas possível, encolhe a fonte se precisar
    ws = text.split()
    for sz in range(104, 60, -6):
        f = ImageFont.truetype(FONT, sz)
        for n in range(1, 4):
            per = -(-len(ws) // n); ls = [' '.join(ws[i:i + per]) for i in range(0, len(ws), per)]
            if all(d.textlength(l, font=f) <= w for l in ls): return ls, sz
    return ls, sz
_GW = {}
def gancho(im, t):
    if not GANCHO or t >= 2.8: return
    k = 1.0
    if t < 0.25: k = 0.6 + 0.4 * (t / 0.25) + 0.08 * (t / 0.25)
    elif t < 0.4: k = 1.08 - 0.08 * ((t - 0.25) / 0.15)
    d = ImageDraw.Draw(im)
    if 'l' not in _GW: _GW['l'], _GW['sz'] = wrap(d, GANCHO, im.width * 0.84)
    ls, sz = _GW['l'], _GW['sz']; f = ImageFont.truetype(FONT, int(sz * k))
    lh = int(sz * 1.14 * k); y = im.height * 0.17 - (len(ls) - 1) * lh / 2
    for l in ls:
        d.text((im.width / 2 + 5, y + 8), l, font=f, anchor='mm', fill=(0, 0, 0), stroke_width=16, stroke_fill=(0, 0, 0))
        d.text((im.width / 2, y), l, font=f, anchor='mm', fill=(255, 214, 63), stroke_width=14, stroke_fill=(20, 16, 22)); y += lh
fs = sorted(glob.glob('frames/f*.jpg'))
def word_at(t):
    cur = None
    for i, w in enumerate(W):
        nxt = W[i + 1]['s'] if i + 1 < len(W) else w['e'] + 0.4
        if w['s'] - 0.03 <= t < min(nxt, w['e'] + 0.45): cur = w['w']
    return cur
for f in fs:
    n = int(os.path.basename(f)[1:5]); t = n / 30; im = Image.open(f).convert('RGB'); w = word_at(t)
    if w:
        d = ImageDraw.Draw(im); x, y = im.width / 2, im.height * 0.74
        d.text((x + 4, y + 6), w, font=font, anchor='mm', fill=(0, 0, 0), stroke_width=12, stroke_fill=(0, 0, 0))
        d.text((x, y), w, font=font, anchor='mm', fill=(255, 255, 255), stroke_width=10, stroke_fill=(20, 16, 22))
    gancho(im, t)
    im.save('frames_cap/' + os.path.basename(f), quality=95)
print('captions', len(fs), FONT)
