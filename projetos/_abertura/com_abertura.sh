#!/usr/bin/env bash
# Cola a abertura TITANS ATTACKING no começo de um longo.  Uso: bash com_abertura.sh <ALTA.mp4> <saida.mp4>
set -e; A=/home/user/juroqueeverdade-videos/projetos/_abertura; cd $A
[ -f abertura.mp4 ] || { python3 titulo.py; ffmpeg -v error -y -framerate 12 -i frames_t/f%04d.jpg -i abertura.wav -vf fps=24 -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -ac 2 -shortest abertura.mp4; }
ffmpeg -v error -y -i abertura.mp4 -i "$1" -filter_complex "[0:v]scale=1920:1080,setsar=1,fps=24[v0];[1:v]scale=1920:1080,setsar=1,fps=24[v1];[0:a]aresample=48000,aformat=channel_layouts=stereo[a0];[1:a]aresample=48000,aformat=channel_layouts=stereo[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]" -map "[v]" -map "[a]" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "$2"
echo "$2"
