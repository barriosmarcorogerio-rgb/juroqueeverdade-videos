#!/usr/bin/env bash
# Regrava as cartelas das prévias com a voz Fenrir (espera a cota do Gemini renovar). Marca _teaser/.fenrir_ok ao terminar.
cd "$(dirname "$0")"
until [ -f .fenrir_ok ]; do ok=1
  for n in fim fim_insta; do python3 ../longo-gigantes/gemini_tts.py $n.txt $n.new.wav > $n.tts.log 2>&1 && mv $n.new.wav $n.wav || ok=0; done
  rm -f _raw.wav; [ $ok = 1 ] && touch .fenrir_ok && break; sleep 1200; done
