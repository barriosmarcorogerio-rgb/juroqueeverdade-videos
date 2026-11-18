#!/usr/bin/env bash
# Produção encadeada da madrugada (roda sozinho em segundo plano). Log: projetos/madrugada.log
set -x
R=/home/user/juroqueeverdade-videos; P=$R/projetos
push() { cd $R && git add -A && git commit -qm "$1

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01KB6dFgyV8wxf1h8YEXRKbv" ; for i in 1 2 3 4; do git pull -q --rebase && git push -q && break; sleep $((i*15)); done; }
# ---------- 1) Short dos camelos ----------
if [ ! -f $R/videos/2026-11-18-camelos-ceara.mp4 ]; then
cd $P/2026-11-18-camelos-ceara; mkdir -p frames
cd $P/2026-11-18-camelos-ceara
pgrep -f "render.mjs frames 0-941" >/dev/null || (cd $P/2026-11-18-camelos-ceara && RESUME=1 nohup node render.mjs frames 0-941 > r1.log 2>&1 &)
pgrep -f "render.mjs frames 942-1883" >/dev/null || (cd $P/2026-11-18-camelos-ceara && RESUME=1 nohup node render.mjs frames 942-1883 > r2.log 2>&1 &)
sleep 20
until [ $(ls frames | wc -l) -ge 1884 ] && ! pgrep -f "render.mjs frames" >/dev/null; do sleep 30; done
python3 captions.py && FRAMES=frames_cap bash finish.sh "Camelos-de-Dom-Pedro"
D=2026-11-18-camelos-ceara
ffmpeg -v error -y -i out/Camelos-de-Dom-Pedro.mp4 -c:v libx264 -preset slow -b:v 520k -maxrate 600k -bufsize 1200k -vf scale=720:1280 -c:a aac -b:a 96k -movflags +faststart $R/videos/$D-yt.mp4
ffmpeg -v error -y -i out/Camelos-de-Dom-Pedro.mp4 -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -c:a copy -movflags +faststart $R/videos/$D.mp4
python3 thumb.py frames/f0960.jpg "CAMELO NO CEARÁ?!" $R/videos/$D-thumb.jpg
cd $R && python3 - <<'PY'
import json
F=json.load(open('fila.json'))
if not any(x['slug']=='2026-11-18-camelos-ceara' for x in F):
    F.append({"data":"2026-11-18","slug":"2026-11-18-camelos-ceara","titulo":"Dom Pedro II trouxe CAMELOS pro sertão?! #shorts",
     "descricao":"1859: o Brasil comprou 14 camelos na Argélia para vencer a seca do Ceará. Eles desembarcaram em Fortaleza, viraram atração... e o plano terminou de um jeito que ninguém esperava. 🐪\n\nHistória real (fatos conferidos).\n#historia #historiadobrasil #curiosidades #ceara #shorts",
     "legenda_instagram":"Em 1859 o Brasil trouxe 14 CAMELOS da Argélia pro sertão do Ceará 🐪🌵 O que deu errado? Assiste até o fim! Segue pra mais histórias reais absurdas. #historia #historiadobrasil #curiosidades #ceara #reels",
     "video":"videos/2026-11-18-camelos-ceara.mp4","video_yt":"videos/2026-11-18-camelos-ceara-yt.mp4","thumb":"videos/2026-11-18-camelos-ceara-thumb.jpg","cover_ms":32000,"publicado":False})
    json.dump(F,open('fila.json','w'),ensure_ascii=False,indent=1)
h=open('historias.md').read()
if '2026-11-18 — "Os camelos' not in h:
    h=h.replace("## Backlog","- 2026-11-18 — \"Os camelos de Dom Pedro II\" (63 s, Ceará 1859).\n\n## Backlog",1).replace("2. 🇧🇷 Dom Pedro II importou 14 camelos","2. ~~🇧🇷 Dom Pedro II importou 14 camelos~~ ✅ USADA 2026-11-18 —")
    open('historias.md','w').write(h)
PY
ls -la $R/videos/$D*
cd $P/2026-11-18-camelos-ceara && rm -rf frames frames_cap stills out
push "Short: Os camelos de Dom Pedro II (Ceará, 1859) — vídeo, versão YouTube, capa e fila"
fi
# ---------- 2) Longo: buraco até o Japão ----------
cd $P/longo-buraco-japao && rm -rf stills
mkdir -p frames; (RESUME=1 node render.mjs frames "0-4105" > r1.log 2>&1 &); (RESUME=1 node render.mjs frames "4106-8211" > r2.log 2>&1 &)
sleep 60
until [ $(ls frames | wc -l) -ge 8212 ] && ! pgrep -f "render.mjs frames" >/dev/null; do sleep 60; if ! pgrep -f "render.mjs frames" >/dev/null && [ $(ls frames | wc -l) -lt 8212 ]; then (RESUME=1 node render.mjs frames "0-8211" > r3.log 2>&1 &); sleep 60; fi; done
python3 overlay.py
ffmpeg -v error -y -i mix_raw.wav -af "loudnorm=I=-14:TP=-1.5:LRA=7" -ar 48000 -ac 2 mix.wav
mkdir -p $P/entrega && ffmpeg -v error -y -framerate 12 -i frames_cap/f%04d.jpg -i mix.wav -map 0:v -map 1:a -vf "fps=24" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart $P/entrega/longo-buraco-japao-ALTA.mp4
ffmpeg -v error -y -framerate 12 -i frames_cap/f%04d.jpg -i mix.wav -map 0:v -map 1:a -vf "fps=24" -c:v libx264 -preset slow -b:v 950k -maxrate 1300k -bufsize 2600k -pix_fmt yuv420p -c:a aac -b:a 96k -shortest -movflags +faststart $R/videos/longo-buraco-japao.mp4
python3 ../thumb_h.py frames/f0802.jpg "CAVAR ATÉ O JAPÃO?!" $R/videos/longo-buraco-japao-thumb.jpg
ls -la $R/videos/longo-buraco-japao*
rm -rf frames frames_cap
push "Longo: E se você cavasse um buraco até o Japão? — MP4 1080p (~11,5 min) e capa"
echo FIM-MADRUGADA-1
