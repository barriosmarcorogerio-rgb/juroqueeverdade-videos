#!/usr/bin/env bash
# Re-renderiza o Short dos camelos (o finish falhou por falta de out/). Pausa o render do longo enquanto isso.
R=/home/user/juroqueeverdade-videos; C=$R/projetos/2026-11-18-camelos-ceara; D=2026-11-18-camelos-ceara
[ -f $R/videos/$D.mp4 ] && exit 0
pkill -STOP -f "render.mjs frames (0-4105|4106-8211)"
cd $C; mkdir -p frames out
for r in 0-470 471-941 942-1412 1413-1883; do
  pgrep -f "render.mjs frames $r\$" >/dev/null || (RESUME=1 nohup node render.mjs frames $r > r_$r.log 2>&1 &)
done
sleep 20
until [ $(ls frames | wc -l) -ge 1884 ] && ! pgrep -f "render.mjs frames (0-470|471-941|942-1412|1413-1883)" >/dev/null; do sleep 20; done
pkill -CONT -f "render.mjs frames (0-4105|4106-8211)"
python3 captions.py && FRAMES=frames_cap bash finish.sh "Camelos-de-Dom-Pedro" || exit 1
ffmpeg -v error -y -i out/Camelos-de-Dom-Pedro.mp4 -c:v libx264 -preset slow -b:v 520k -maxrate 600k -bufsize 1200k -vf scale=720:1280 -c:a aac -b:a 96k -movflags +faststart $R/videos/$D-yt.mp4
ffmpeg -v error -y -i out/Camelos-de-Dom-Pedro.mp4 -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -c:a copy -movflags +faststart $R/videos/$D.mp4
ls -la $R/videos/$D*
[ -s $R/videos/$D.mp4 ] && [ -s $R/videos/$D-yt.mp4 ] && rm -rf frames frames_cap stills out r_*.log && echo CAMELOS-OK
