"""Recorte para o Instagram de um vídeo longo: UM capítulo inteiro (história que se entende sozinha) em vertical
(vídeo no meio, fundo desfocado, gancho em cima) + cartela "QUER VER O RESTO? ... link na bio" com a narração fim_insta.wav.
Uso: python3 recorte.py <projeto_longo> <video_ALTA.mp4> "<GANCHO EM CIMA>" <saida.mp4> <capítulo>
"""
import json, subprocess, sys, os
from PIL import Image, ImageDraw, ImageFont
proj, src, title, out = sys.argv[1:5]
cap = int(sys.argv[5])
HERE = os.path.dirname(os.path.abspath(__file__))
FONT = '/usr/share/fonts/opentype/inter/Inter-Black.otf'
T = json.load(open(os.path.join(proj, 'work/timeline.json')))
sent = [x for x in T if x['i'] >= 0]
cs = [x for x in sent if x['cap'] == cap]; start = max(0.0, cs[0]['s'] - 0.25); end = cs[-1]['e'] + 0.3   # capítulo inteiro, de frase a frase
start, end = round(start, 3), round(end, 3); dur = end - start
fim = os.path.join(HERE, 'fim_insta.wav')
fd = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', fim], capture_output=True, text=True).stdout)
card = fd + 1.2

def wrap(d, text, font, w):
    words = text.split()
    for n in range(1, 6):  # fewest lines, words spread evenly so no orphan line
        per = -(-len(words) // n); lines = [' '.join(words[i:i + per]) for i in range(0, len(words), per)]
        if all(d.textlength(l, font=font) <= w for l in lines): return lines
    return lines

# overlay 1: título + selo (o tempo todo)
ov = Image.new('RGBA', (1080, 1920), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
f = ImageFont.truetype(FONT, 92); lines = wrap(d, title.upper(), f, 980)
y = 560 - len(lines) * 104
for ln in lines:
    d.text((540, y), ln, font=f, anchor='mt', fill=(255, 255, 255), stroke_width=14, stroke_fill=(20, 16, 22)); y += 104
f2 = ImageFont.truetype(FONT, 44)
d.rounded_rectangle([340, 1330, 740, 1400], 34, fill=(255, 214, 63)); d.text((540, 1365), 'TRECHO', font=f2, anchor='mm', fill=(20, 16, 22))
d.text((540, 1470), 'vídeo completo no YouTube', font=f2, anchor='mm', fill=(255, 255, 255), stroke_width=8, stroke_fill=(20, 16, 22))
ov.save('/tmp/recorte_ov1.png')
# overlay 2: cartela final
ov = Image.new('RGBA', (1080, 1920), (10, 8, 14, 170)); d = ImageDraw.Draw(ov)
f = ImageFont.truetype(FONT, 120)
d.text((540, 760), 'QUER VER', font=f, anchor='mm', fill=(255, 214, 63), stroke_width=16, stroke_fill=(20, 16, 22))
d.text((540, 900), 'O RESTO?', font=f, anchor='mm', fill=(255, 214, 63), stroke_width=16, stroke_fill=(20, 16, 22))
f3 = ImageFont.truetype(FONT, 60)
d.text((540, 1080), 'Vídeo completo no YouTube', font=f3, anchor='mm', fill=(255, 255, 255), stroke_width=10, stroke_fill=(20, 16, 22))
d.text((540, 1170), 'link na bio', font=f3, anchor='mm', fill=(255, 255, 255), stroke_width=10, stroke_fill=(20, 16, 22))
d.rounded_rectangle([300, 1560, 780, 1660], 50, fill=(255, 0, 0)); d.polygon([(370, 1580), (370, 1640), (425, 1610)], fill=(255, 255, 255)); d.text((450, 1610), 'YouTube', font=f2, anchor='lm', fill=(255, 255, 255))
ov.save('/tmp/recorte_ov2.png')

fc = (f"[0:v]trim={start:.3f}:{end:.3f},setpts=PTS-STARTPTS,fps=30,tpad=stop_mode=clone:stop_duration={card:.2f},split[a][b];"
      f"[a]scale=3414:1920,crop=1080:1920,boxblur=28:2,eq=brightness=-0.12[bg];[b]scale=1080:608[fg];"
      f"[bg][fg]overlay=0:656[v1];[v1][1:v]overlay=0:0[v2];[v2][2:v]overlay=0:0:enable='gte(t,{dur:.3f})'[v];"
      f"[0:a]atrim={start:.3f}:{end:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.25,afade=t=out:st={dur - 0.6:.3f}:d=0.6[a0];"
      f"[3:a]adelay=500|500,apad=pad_dur=0.5[a1];[a0][a1]concat=n=2:v=0:a=1,loudnorm=I=-14:TP=-1.5[a]")
cmd = ['ffmpeg', '-v', 'error', '-y', '-i', src, '-loop', '1', '-i', '/tmp/recorte_ov1.png', '-loop', '1', '-i', '/tmp/recorte_ov2.png', '-i', fim,
       '-filter_complex', fc, '-map', '[v]', '-map', '[a]', '-t', f'{dur + card:.2f}', '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-pix_fmt', 'yuv420p',
       '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-movflags', '+faststart', out]
subprocess.run(cmd, check=True)
print('recorte', out, 'cap', cap, round(start, 1), '→', round(end, 1), '(', round(dur, 1), 's) + cartela', round(card, 1), 's')
