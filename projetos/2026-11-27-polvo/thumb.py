"""Thumbnail vertical 1080x1920 (padrão Shorts, recomendado pelo YouTube) no estilo aprovado pelo dono:
quadro da animação + letreiro grosso amarelo/branco com contorno preto, 2-3 palavras, no terço de cima.
uso: python3 thumb.py frames/fNNNN.jpg "TEXTO CURTO" saida.jpg      (capa do Reel: cover_ms = NNNN/30*1000)
Escolha um quadro com o personagem em close, expressão exagerada e o objeto-chave visível na metade de baixo."""
import sys
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
src, txt, out = sys.argv[1], sys.argv[2].upper(), sys.argv[3]
im = Image.open(src).convert('RGB').resize((1080, 1920))
im = ImageEnhance.Color(im).enhance(1.15); im = ImageEnhance.Contrast(im).enhance(1.06)
# faixa escura suave no topo para o texto saltar
shade = Image.new('L', (1080, 1920), 0); sd = ImageDraw.Draw(shade)
for y in range(0, 900): sd.line([(0, y), (1080, y)], fill=int(150 * (1 - y / 900) ** 1.6))
im = Image.composite(Image.new('RGB', im.size, (10, 8, 14)), im, shade)
d = ImageDraw.Draw(im); F = '/usr/share/fonts/opentype/inter/Inter-Black.otf'
words, lines = txt.split(), []
for w in words:
    if lines and len(lines[-1]) + 1 + len(w) <= 9: lines[-1] += ' ' + w
    else: lines.append(w)
size = 190
while size > 60:
    f = ImageFont.truetype(F, size)
    if max(d.textlength(l, font=f) for l in lines) <= 960 and len(lines) * size * 1.12 <= 620: break
    size -= 6
y0 = 330 - (len(lines) - 1) * size * 1.12 / 2
for i, ln in enumerate(lines):
    x, y = 540, y0 + i * size * 1.12
    d.text((x + 8, y + 10), ln, font=f, anchor='mm', fill=(0, 0, 0), stroke_width=20, stroke_fill=(0, 0, 0))
    d.text((x, y), ln, font=f, anchor='mm', fill=(255, 214, 63) if i % 2 == 0 else (255, 255, 255), stroke_width=15, stroke_fill=(20, 16, 22))
im.save(out, quality=90); print(out)
