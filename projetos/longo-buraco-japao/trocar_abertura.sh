#!/usr/bin/env bash
# Troca os primeiros 77 quadros (s0_0, 6,42 s) do longo pronto pela abertura nova, mantendo o áudio original.
set -e; cd "$(dirname "$0")"; E=../entrega/longo-buraco-japao-ALTA.mp4; N=77
until [ $(ls frames | wc -l) -ge $N ] && ! pgrep -f "render.mjs frames (0-38|39-76)" >/dev/null; do sleep 20; done
python3 overlay.py
cp $E /tmp/buraco_old.mp4
T=$(python3 -c "print(f'{77/12:.4f}')")
ffmpeg -v error -y -framerate 12 -i frames_cap/f%04d.jpg -i /tmp/buraco_old.mp4 -filter_complex "[0:v]fps=24,trim=0:$T,setpts=PTS-STARTPTS[a];[1:v]trim=start=$T,setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1:a=0[v]" -map "[v]" -map 1:a -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -c:a copy -movflags +faststart $E
ffmpeg -v error -y -i $E -c:v libx264 -preset medium -b:v 950k -maxrate 1300k -bufsize 2600k -c:a aac -b:a 96k -movflags +faststart ../../videos/longo-buraco-japao.mp4
rm -rf frames frames_cap /tmp/buraco_old.mp4; echo TROCA-OK
