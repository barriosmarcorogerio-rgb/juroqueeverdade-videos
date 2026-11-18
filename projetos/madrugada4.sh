#!/usr/bin/env bash
# Buraco v2: re-render completo com personagens animados (gestos automáticos + abertura com ação). Espera a muralha terminar. Log: projetos/madrugada4.log
set -x
R=/home/user/juroqueeverdade-videos; P=$R/projetos; G=$P/longo-buraco-japao
push() { ( cd $R && git add -A && git commit -qm "$1

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01KB6dFgyV8wxf1h8YEXRKbv" ; for i in 1 2 3 4; do git pull -q --rebase && git push -q && break; sleep $((i*15)); done; ) }
until grep -q FIM-MADRUGADA-3 $P/madrugada3.log; do sleep 120; done
cd $G; [ -f mix_raw.wav ] || exit 1
TOT=$(python3 -c "import json;print(json.load(open('web/shots.json'))['total'])"); Q=$((TOT/4))
mkdir -p frames
for k in 0 1 2 3; do a=$((k*Q)); b=$(( k==3 ? TOT-1 : (k+1)*Q-1 )); pgrep -f "render.mjs frames $a-$b" >/dev/null || (RESUME=1 nohup node render.mjs frames "$a-$b" > rv_$k.log 2>&1 &); done
sleep 60
until [ $(ls frames | wc -l) -ge $TOT ] && ! pgrep -f "render.mjs frames" >/dev/null; do sleep 60; if ! pgrep -f "render.mjs frames" >/dev/null && [ $(ls frames | wc -l) -lt $TOT ]; then (RESUME=1 node render.mjs frames "0-$((TOT-1))" > rv_x.log 2>&1 &); sleep 60; fi; done
python3 overlay.py
ffmpeg -v error -y -i mix_raw.wav -af "loudnorm=I=-14:TP=-1.5:LRA=7" -ar 48000 -ac 2 mix.wav
ffmpeg -v error -y -framerate 12 -i frames_cap/f%04d.jpg -i mix.wav -map 0:v -map 1:a -vf "fps=24" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart $P/entrega/longo-buraco-japao-ALTA.mp4
ffmpeg -v error -y -i $P/entrega/longo-buraco-japao-ALTA.mp4 -c:v libx264 -preset medium -b:v 950k -maxrate 1300k -bufsize 2600k -c:a aac -b:a 96k -movflags +faststart $R/videos/longo-buraco-japao.mp4
cd $R && python3 projetos/_teaser/teaser.py projetos/longo-buraco-japao projetos/entrega/longo-buraco-japao-ALTA.mp4 "E se você cavasse um buraco até o Japão?" videos/prev-longo-buraco-japao.mp4
ffmpeg -v error -y -i videos/prev-longo-buraco-japao.mp4 -c:v libx264 -b:v 520k -maxrate 600k -bufsize 1200k -vf scale=720:1280 -c:a aac -b:a 96k -movflags +faststart videos/prev-longo-buraco-japao-yt.mp4
bash projetos/_teaser/gerar_recortes.sh longo-buraco-japao
cd $G && rm -rf frames frames_cap mix.wav
push "Buraco v2: re-render completo com personagens animados; prévia e recortes refeitos"
echo FIM-MADRUGADA-4
