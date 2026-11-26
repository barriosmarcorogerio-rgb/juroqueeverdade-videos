"""Short de prévia de um vídeo longo: primeiros ~55 s em vertical (vídeo no meio, fundo desfocado, título em cima)
+ cartela final "QUER CONTINUAR?" com a narração fim.wav.
Uso: python3 teaser.py <projeto_longo> <video_ALTA.mp4> "<TÍTULO EM CIMA>" <saida.mp4> [max_s=56]
"""
import json, subprocess, sys, os
from PIL import Image, ImageDraw, ImageFont
proj, src, title, out = sys.argv[1:5]
max_s = float(sys.argv[5]) if len(sys.argv) > 5 else 56.0
HERE = os.path.dirname(os.path.abspath(__file__))
FONT = '/usr/share/fonts/opentype/inter/Inter-Black.otf'
T = json.load(open(os.path.join(proj, 'work/timeline.json')))
sent = [x for x in T if x['i'] >= 0]
end = max([x['e'] for x in sent if x['e'] <= max_s] or [max_s])          # corta no fim de uma frase
fim = os.path.join(HERE, 'fim.wav')
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
d.rounded_rectangle([340, 1660, 740, 1730], 34, fill=(255, 214, 63)); d.text((540, 1695), 'PARTE 1', font=f2, anchor='mm', fill=(20, 16, 22))
d.text((540, 1790), 'vídeo completo no canal', font=f2, anchor='mm', fill=(255, 255, 255), stroke_width=8, stroke_fill=(20, 16, 22))
# legenda de FRASE INTEIRA (pedido do dono) abaixo do vídeo, a partir de work/timeline.json
def ts(t): t = max(0, t); return f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"
ASS = '/tmp/teaser_leg.ass'
with open(ASS, 'w') as fa:
    fa.write('[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\nWrapStyle: 0\n\n[V4+ Styles]\n'
             'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n'
             'Style: L,Inter Black,68,&H00FFFFFF,&H00FFFFFF,&H00160F14,&H80000000,0,0,0,0,100,100,0,0,1,7,3,8,70,70,1300,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n')
    for k, x in enumerate(sent):
        if x['s'] >= end: break
        e2 = min(end, sent[k + 1]['s'] if k + 1 < len(sent) else x['e'])
        fa.write(f"Dialogue: 0,{ts(x['s'] - 0.05)},{ts(e2 - 0.02)},L,,0,0,0,,{x['text']}\n")
ov.save('/tmp/teaser_ov1.png')
# overlay 2: cartela final
ov = Image.new('RGBA', (1080, 1920), (10, 8, 14, 170)); d = ImageDraw.Draw(ov)
f = ImageFont.truetype(FONT, 120)
d.text((540, 760), 'QUER', font=f, anchor='mm', fill=(255, 214, 63), stroke_width=16, stroke_fill=(20, 16, 22))
d.text((540, 900), 'CONTINUAR?', font=f, anchor='mm', fill=(255, 214, 63), stroke_width=16, stroke_fill=(20, 16, 22))
f3 = ImageFont.truetype(FONT, 60)
d.text((540, 1080), 'Vídeo completo no canal', font=f3, anchor='mm', fill=(255, 255, 255), stroke_width=10, stroke_fill=(20, 16, 22))
d.text((540, 1170), 'link na descrição', font=f3, anchor='mm', fill=(255, 255, 255), stroke_width=10, stroke_fill=(20, 16, 22))
d.polygon([(540, 1660), (470, 1550), (610, 1550)], fill=(255, 214, 63), outline=(20, 16, 22))
ov.save('/tmp/teaser_ov2.png')

fc = (f"[0:v]trim=0:{end:.3f},setpts=PTS-STARTPTS,fps=30,tpad=stop_mode=clone:stop_duration={card:.2f},split[a][b];"
      f"[a]scale=3414:1920,crop=1080:1920,boxblur=28:2,eq=brightness=-0.12[bg];[b]scale=1080:608[fg];"
      f"[bg][fg]overlay=0:656[v1];[v1][1:v]overlay=0:0,ass=/tmp/teaser_leg.ass:fontsdir=/usr/share/fonts/opentype/inter[v2];[v2][2:v]overlay=0:0:enable='gte(t,{end:.3f})'[v];"
      f"[0:a]atrim=0:{end:.3f},asetpts=PTS-STARTPTS,afade=t=out:st={end - 0.6:.3f}:d=0.6[a0];"
      f"[3:a]adelay=500|500,apad=pad_dur=0.5[a1];[a0][a1]concat=n=2:v=0:a=1,loudnorm=I=-14:TP=-1.5[a]")
cmd = ['ffmpeg', '-v', 'error', '-y', '-i', src, '-loop', '1', '-i', '/tmp/teaser_ov1.png', '-loop', '1', '-i', '/tmp/teaser_ov2.png', '-i', fim,
       '-filter_complex', fc, '-map', '[v]', '-map', '[a]', '-t', f'{end + card:.2f}', '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-pix_fmt', 'yuv420p',
       '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-movflags', '+faststart', out]
subprocess.run(cmd, check=True)
print('teaser', out, 'trecho', round(end, 1), 's + cartela', round(card, 1), 's')
