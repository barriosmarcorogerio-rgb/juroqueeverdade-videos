"""Legenda de FRASE INTEIRA (pedido do dono, 11/2026) sobre frames/ -> frames_cap/: a frase toda aparece (até 3 linhas)
  e a palavra que está sendo falada fica AMARELA.
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
# --- frases: quebra no fim de frase (. ! ? …) e, se passar de 9 palavras, também na vírgula/pausa
PH = []; cur = []
for i, w in enumerate(W):
    cur.append(i); txt = w['w']; gap = (W[i + 1]['s'] - w['e']) if i + 1 < len(W) else 9
    rest = 0  # palavras até o fim da frase (não deixar 1–2 palavras órfãs)
    for j in range(i + 1, len(W)):
        rest += 1
        if W[j]['w'].endswith(('.', '!', '?', '…')): break
    soft = len(cur) >= 9 and rest >= 3 and (txt.endswith((',', ':', ';')) or gap > 0.35)
    if txt.endswith(('.', '!', '?', '…')) or soft or (len(cur) >= 16 and rest >= 3) or gap > 0.8:
        PH.append(cur); cur = []
if cur: PH.append(cur)
def phrase_at(t):
    for k, ph in enumerate(PH):
        a = W[ph[0]]['s'] - 0.05; b = W[PH[k + 1][0]]['s'] - 0.05 if k + 1 < len(PH) else W[ph[-1]]['e'] + 0.5
        b = min(b, W[ph[-1]]['e'] + 0.6)
        if a <= t < b: return ph
    return None
SZ = 74; fcap = ImageFont.truetype(FONT, SZ)
_LAY = {}
def layout(d, ph, maxw):
    key = ph[0]
    if key in _LAY: return _LAY[key]
    lines = [[]]
    for i in ph:
        test = ' '.join(W[j]['w'] for j in lines[-1] + [i])
        if lines[-1] and d.textlength(test, font=fcap) > maxw: lines.append([i])
        else: lines[-1].append(i)
    _LAY[key] = lines; return lines
def caption(im, t):
    ph = phrase_at(t)
    if not ph: return
    d = ImageDraw.Draw(im); lines = layout(d, ph, im.width * 0.86)
    now = None
    for i in ph:
        if W[i]['s'] - 0.03 <= t: now = i
    lh = int(SZ * 1.2); y0 = im.height * 0.74 - (len(lines) - 1) * lh / 2
    for li, ln in enumerate(lines):
        full = ' '.join(W[j]['w'] for j in ln); x = im.width / 2 - (d.textlength(full, font=fcap) + 6 * (len(ln) - 1)) / 2; y = y0 + li * lh
        for j in ln:
            word = W[j]['w']; col = (255, 214, 63) if j == now else (255, 255, 255)
            d.text((x + 4, y + 6), word, font=fcap, anchor='lm', fill=(0, 0, 0), stroke_width=11, stroke_fill=(0, 0, 0))
            d.text((x, y), word, font=fcap, anchor='lm', fill=col, stroke_width=9, stroke_fill=(20, 16, 22))
            x += d.textlength(word + ' ', font=fcap) + 6
for f in fs:
    n = int(os.path.basename(f)[1:5]); t = n / 30; im = Image.open(f).convert('RGB')
    caption(im, t)
    gancho(im, t)
    im.save('frames_cap/' + os.path.basename(f), quality=95)
print('captions', len(fs), len(PH), 'frases', FONT)
