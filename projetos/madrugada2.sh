#!/usr/bin/env bash
# Gigantes: narração pendente (cota) -> timings -> plano -> espera o buraco -> render -> finalização. Log: projetos/madrugada2.log
set -x
R=/home/user/juroqueeverdade-videos; P=$R/projetos; G=$P/longo-gigantes
push() { cd $R && git add -A && git commit -qm "$1

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01KB6dFgyV8wxf1h8YEXRKbv" ; for i in 1 2 3 4; do git pull -q --rebase && git push -q && break; sleep $((i*15)); done; }
cd $G
while true; do
  miss=""; for k in 01 02 03 04 05 06 07 08 09 10 11 12; do [ -f cap$k.wav ] || miss="$miss $k"; done
  [ -z "$miss" ] && break
  for k in $miss; do python3 gemini_tts.py cap$k.txt cap$k.wav > cap$k.tts.log 2>&1 || rm -f cap$k.wav; done
  miss=""; for k in 01 02 03 04 05 06 07 08 09 10 11 12; do [ -f cap$k.wav ] || miss="$miss $k"; done
  [ -z "$miss" ] && break
  sleep 1200
done
mkdir -p work; for k in 01 02 03 04 05 06 07 08 09 10 11 12; do [ -f work/cap$k.words.json ] || HF_HUB_DISABLE_XET=1 python3 -I words.py cap$k.wav cap$k.txt work/cap$k.words.json > work/cap$k.wlog 2>&1; done
python3 timeline.py && python3 plan.py && python3 voice_all.py
nice -n 10 python3 audio_g.py && python3 mix.py voice.wav music.wav sfx.wav
push "Gigantes: narração completa, timings e plano de câmera"
until grep -q FIM-MADRUGADA-1 $P/madrugada.log; do sleep 120; done
TOT=$(python3 -c "import json;print(json.load(open('web/shots.json'))['total'])"); H=$((TOT/2))
mkdir -p frames; (RESUME=1 node render.mjs frames "0-$((H-1))" > r1.log 2>&1 &); (RESUME=1 node render.mjs frames "$H-$((TOT-1))" > r2.log 2>&1 &)
sleep 60
until [ $(ls frames | wc -l) -ge $TOT ] && ! pgrep -f "render.mjs frames" >/dev/null; do sleep 60; if ! pgrep -f "render.mjs frames" >/dev/null && [ $(ls frames | wc -l) -lt $TOT ]; then (RESUME=1 node render.mjs frames "0-$((TOT-1))" > r3.log 2>&1 &); sleep 60; fi; done
python3 overlay.py
ffmpeg -v error -y -i mix_raw.wav -af "loudnorm=I=-14:TP=-1.5:LRA=7" -ar 48000 -ac 2 mix.wav
mkdir -p $P/entrega && ffmpeg -v error -y -framerate 12 -i frames_cap/f%04d.jpg -i mix.wav -map 0:v -map 1:a -vf "fps=24" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart $P/entrega/longo-gigantes-ALTA.mp4
ffmpeg -v error -y -framerate 12 -i frames_cap/f%04d.jpg -i mix.wav -map 0:v -map 1:a -vf "fps=24" -c:v libx264 -preset slow -b:v 950k -maxrate 1300k -bufsize 2600k -pix_fmt yuv420p -c:a aac -b:a 96k -shortest -movflags +faststart $R/videos/longo-gigantes.mp4
F=$(python3 -c "import json;s=json.load(open('web/shots.json'))['shots'];x=[t for t in s if t['id'].startswith('s117')][0];print(f\"{(x['a']+x['b'])//2:04d}\")")
python3 ../thumb_h.py frames/f$F.jpg "GIGANTES DE 15 METROS?!" $R/videos/longo-gigantes-thumb.jpg
ls -la $R/videos/longo-gigantes* $P/entrega/
rm -rf frames frames_cap
push "Longo: E se GIGANTES de 15 metros atacassem a sua cidade? — MP4 e capa"
echo FIM-MADRUGADA-2
