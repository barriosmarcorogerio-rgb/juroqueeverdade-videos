"""Capas chamativas dos titãs (pedido do dono 20/11): rosto do titã enorme + personagem com medo em selo + pergunta grossa + seta.
uso: python3 thumb_titas.py rosto_titan.jpg personagem.jpg "LINHA1" "LINHA2" saida.jpg [h|v]"""
import sys
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageFilter
face, kid, l1, l2, out = sys.argv[1:6]; mode = sys.argv[6] if len(sys.argv) > 6 else 'h'
W, H = (1280, 720) if mode == 'h' else (1080, 1920)
F = '/usr/share/fonts/opentype/inter/Inter-Black.otf'
fa = Image.open(face).convert('RGB'); fa = fa.crop((380, 40, 1540, 860))          # rosto do titã (quadro 1920x1080)
fa = ImageEnhance.Contrast(ImageEnhance.Color(fa).enhance(1.35)).enhance(1.15)
if mode == 'h': fw = 1400; fa = fa.resize((fw, int(fw * fa.height / fa.width))); im = Image.new('RGB', (W, H), (12, 6, 10)); im.paste(fa, (W - fw + 230, H - fa.height + 130))
else: fh = 1920; fa = fa.resize((int(fh * fa.width / fa.height), fh)); im = Image.new('RGB', (W, H), (12, 6, 10)); im.paste(fa, ((W - fa.width) // 2, 0))
# escurece o lado do texto
sh = Image.new('L', (W, H), 0); shd = ImageDraw.Draw(sh)
for i in range(W if mode == 'h' else H):
    a = int(200 * max(0, 1 - i / (560 if mode == 'h' else 620)) ** 1.4)
    shd.line([(i, 0), (i, H)] if mode == 'h' else [(0, i), (W, i)], fill=a)
im = Image.composite(Image.new('RGB', (W, H), (8, 4, 8)), im, sh)
# vinheta vermelha nas bordas
v = Image.new('L', (W, H), 0); vd = ImageDraw.Draw(v); vd.ellipse((-W * 0.15, -H * 0.15, W * 1.15, H * 1.15), fill=255); v = v.filter(ImageFilter.GaussianBlur(90))
im = Image.composite(im, Image.new('RGB', (W, H), (110, 0, 0)), v)
d = ImageDraw.Draw(im)
def txt(s, x, y, size, fill, anchor='la'):
    f = ImageFont.truetype(F, size); d.text((x, y), s, font=f, fill=fill, stroke_width=max(6, size // 9), stroke_fill=(0, 0, 0), anchor=anchor)
    return d.textbbox((x, y), s, font=f, anchor=anchor, stroke_width=max(6, size // 9))
# selo do personagem com medo
k = Image.open(kid).convert('RGB'); kw, kh = k.size; k = k.crop((620, 160, 1380, 920)); R = 300 if mode == 'h' else 520
k = ImageEnhance.Color(k).enhance(1.2).resize((R, int(R * k.height / k.width))).crop((0, 0, R, R))
m = Image.new('L', (R, R), 0); ImageDraw.Draw(m).ellipse((0, 0, R - 1, R - 1), fill=255)
kx, ky = (40, H - R - 30) if mode == 'h' else (60, H - R - 120)
d.ellipse((kx - 12, ky - 12, kx + R + 12, ky + R + 12), fill=(255, 255, 255)); d.ellipse((kx - 4, ky - 4, kx + R + 4, ky + R + 4), fill=(220, 30, 30))
im.paste(k, (kx, ky), m); d = ImageDraw.Draw(im)
if mode == 'h':
    b = txt(l1, 34, 22, 118, (255, 214, 40)); txt(l2, 34, b[3] + 4, 118, (255, 255, 255))
    A = [(360, 560), (500, 470), (488, 510), (600, 470), (612, 520), (500, 555), (512, 600)]   # seta do selo para a boca do titã
    A = [(x, y) for x, y in A]; A = [(360, 560), (520, 500), (505, 470), (610, 520), (520, 590), (515, 560), (370, 600)]
    d.polygon(A, fill=(235, 30, 30)); d.line(A + [A[0]], fill=(0, 0, 0), width=7)
    st = Image.new('RGBA', (230, 90), (0, 0, 0, 0)); sd = ImageDraw.Draw(st); sd.rounded_rectangle((0, 0, 229, 89), 18, fill=(230, 30, 30), outline=(255, 255, 255), width=6); sd.text((115, 45), '15 m', font=ImageFont.truetype(F, 60), fill=(255, 255, 255), anchor='mm')
    st = st.rotate(-8, expand=True, resample=Image.BICUBIC); im.paste(st, (W - st.width - 20, 20), st)
else:
    b = txt(l1, W // 2, 90, 170, (255, 214, 40), 'ma'); txt(l2, W // 2, b[3] + 10, 170, (255, 255, 255), 'ma')
im.save(out, quality=92); print(out)
