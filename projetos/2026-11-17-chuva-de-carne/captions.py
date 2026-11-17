"""Legenda palavra por palavra (estilo das referências) sobre frames/ -> frames_cap/."""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont
W = json.load(open('work/words.json')); FONT = '/usr/share/fonts/opentype/inter/Inter-Black.otf'
import glob
if not os.path.exists(FONT): FONT = [f for f in glob.glob('/usr/share/fonts/**/*Black*.ttf', recursive=True) + glob.glob('/usr/share/fonts/**/*.ttf', recursive=True) if 'Inter' in f and 'Black' in f][0]
font = ImageFont.truetype(FONT, 92)
os.makedirs('frames_cap', exist_ok=True)
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
        d = ImageDraw.Draw(im); x, y = im.width / 2, im.height * 0.62
        d.text((x + 4, y + 6), w, font=font, anchor='mm', fill=(0, 0, 0), stroke_width=12, stroke_fill=(0, 0, 0))
        d.text((x, y), w, font=font, anchor='mm', fill=(255, 255, 255), stroke_width=10, stroke_fill=(20, 16, 22))
    im.save('frames_cap/' + os.path.basename(f), quality=95)
print('captions', len(fs), FONT)
