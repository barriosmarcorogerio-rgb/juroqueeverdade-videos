"""Compõe os quadros da abertura: barras de cinema, flash vermelho na mordida, título TITANS ATTACKING com 'pop' e tremida."""
import os, glob, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
FONT = '/usr/share/fonts/opentype/inter/Inter-Black.otf'; os.makedirs('frames_t', exist_ok=True)
T0 = 72   # quadro em que o título entra (12 qps)
def title(im, k):
    W, H = im.size; s = 0.75 + 0.25 * min(1, k / 3) + (0.06 if k in (3, 4) else 0); sh = int(10 * math.exp(-k / 4) * (1 if k % 2 else -1))
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    f1 = ImageFont.truetype(FONT, int(200 * s)); f2 = ImageFont.truetype(FONT, int(44 * s)); cy = H * 0.36
    d.text((W / 2 + sh, cy - 230 * s), 'JURO QUE É VERDADE APRESENTA', font=f2, anchor='mm', fill=(255, 214, 63, 255), stroke_width=6, stroke_fill=(15, 10, 12, 255))
    for i, (txt, y) in enumerate([('TITANS', cy - 95 * s), ('ATTACKING', cy + 110 * s)]):
        d.text((W / 2 + sh + 8, y + 12), txt, font=f1, anchor='mm', fill=(0, 0, 0, 200), stroke_width=22, stroke_fill=(0, 0, 0, 200))
        d.text((W / 2 + sh, y), txt, font=f1, anchor='mm', fill=(226, 38, 42, 255), stroke_width=18, stroke_fill=(20, 8, 10, 255))
        d.text((W / 2 + sh, y), txt, font=f1, anchor='mm', fill=None, stroke_width=4, stroke_fill=(255, 190, 170, 255))
    glow = lay.filter(ImageFilter.GaussianBlur(18)); im = Image.alpha_composite(im, glow); return Image.alpha_composite(im, lay)
for f in sorted(glob.glob('frames/f*.jpg')):
    n = int(os.path.basename(f)[1:5]); im = Image.open(f).convert('RGBA'); W, H = im.size
    if n in (62, 63, 64, 66): im = Image.alpha_composite(im, Image.new('RGBA', (W, H), (190, 0, 0, 110 if n != 64 else 60)))
    if n >= T0: im = title(im, n - T0)
    d = ImageDraw.Draw(im); d.rectangle([0, 0, W, 96], fill=(0, 0, 0, 255)); d.rectangle([0, H - 96, W, H], fill=(0, 0, 0, 255))
    im.convert('RGB').save('frames_t/' + os.path.basename(f), quality=95)
print('quadros prontos')
