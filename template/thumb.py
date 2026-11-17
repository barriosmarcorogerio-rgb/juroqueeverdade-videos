"""Thumbnail 1280x720 + capa do Reel.  uso: python3 thumb.py frames/f0123.jpg "TEXTO CURTO" saida.jpg
Escolha o quadro mais expressivo (rosto reagindo + objeto-chave) e um texto de 2-4 palavras em MAIÚSCULAS.
A capa do Reel usa o mesmo quadro: cover_ms = número_do_quadro / 30 * 1000."""
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
src, txt, out = sys.argv[1], sys.argv[2].upper(), sys.argv[3]
im = Image.open(src).convert('RGB'); W, H = 1280, 720
bg = im.resize((W, int(im.height * W / im.width))).crop((0, 0, W, H)).filter(ImageFilter.GaussianBlur(18))
fg = im.resize((int(im.width * H / im.height), H)); bg.paste(fg, ((W - fg.width) // 2 - 260, 0))
d = ImageDraw.Draw(bg); F = '/usr/share/fonts/opentype/inter/Inter-Black.otf'
words = txt.split(); lines = []
for w in words:  # quebra em linhas de até ~11 caracteres
    if lines and len(lines[-1]) + 1 + len(w) <= 11: lines[-1] += ' ' + w
    else: lines.append(w)
size = 150
while size > 50:
    f = ImageFont.truetype(F, size)
    if max(d.textlength(l, font=f) for l in lines) <= 560 and len(lines) * size * 1.15 <= 620: break
    size -= 6
y0 = H / 2 - (len(lines) - 1) * size * 1.15 / 2
for i, ln in enumerate(lines):
    x, y = 960, y0 + i * size * 1.15
    d.text((x + 6, y + 8), ln, font=f, anchor='mm', fill=(0, 0, 0), stroke_width=16, stroke_fill=(0, 0, 0))
    d.text((x, y), ln, font=f, anchor='mm', fill=(255, 214, 63) if i % 2 == 0 else (255, 255, 255), stroke_width=12, stroke_fill=(20, 16, 22))
bg.save(out, quality=90); print(out)
