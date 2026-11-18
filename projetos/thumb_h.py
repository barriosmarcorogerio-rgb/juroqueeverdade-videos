"""Capa horizontal 1280x720 para vídeos longos: quadro + letreiro grosso amarelo/branco com contorno.
uso: python3 thumb_h.py quadro.jpg "TEXTO" saida.jpg"""
import sys
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
src, txt, out = sys.argv[1], sys.argv[2].upper(), sys.argv[3]
im = Image.open(src).convert('RGB').resize((1280, 720)); im = ImageEnhance.Color(im).enhance(1.2); im = ImageEnhance.Contrast(im).enhance(1.08)
shade = Image.new('L', im.size, 0); sd = ImageDraw.Draw(shade)
for x in range(0, 700): sd.line([(x, 0), (x, 720)], fill=int(160 * (1 - x / 700) ** 1.5))
im = Image.composite(Image.new('RGB', im.size, (10, 8, 14)), im, shade)
d = ImageDraw.Draw(im); F = '/usr/share/fonts/opentype/inter/Inter-Black.otf'
words, lines = txt.split(), []
for w in words:
    if lines and len(lines[-1]) + 1 + len(w) <= 10: lines[-1] += ' ' + w
    else: lines.append(w)
size = 150
while size > 50:
    f = ImageFont.truetype(F, size)
    if max(d.textlength(l, font=f) for l in lines) <= 640 and len(lines) * size * 1.08 <= 600: break
    size -= 6
y0 = 360 - (len(lines) - 1) * size * 1.08 / 2
for i, ln in enumerate(lines):
    y = y0 + i * size * 1.08
    d.text((46, y + 8), ln, font=f, anchor='lm', fill=(0, 0, 0), stroke_width=16, stroke_fill=(0, 0, 0))
    d.text((40, y), ln, font=f, anchor='lm', fill=(255, 214, 63) if i % 2 == 0 else (255, 255, 255), stroke_width=12, stroke_fill=(20, 16, 22))
im.save(out, quality=90); print(out)
