#!/usr/bin/env bash
# Religa a produção depois de um reinício do contêiner (idempotente).
P=/home/user/juroqueeverdade-videos/projetos; cd $P
if ! pgrep -f "madrugada.sh" >/dev/null && ! grep -q FIM-MADRUGADA-1 madrugada.log 2>/dev/null; then nohup bash madrugada.sh >> madrugada.log 2>&1 & fi
if ! pgrep -f "madrugada2.sh" >/dev/null && ! grep -q FIM-MADRUGADA-2 madrugada2.log 2>/dev/null; then nohup bash madrugada2.sh >> madrugada2.log 2>&1 & fi
if ! pgrep -f "madrugada3.sh" >/dev/null && ! grep -q FIM-MADRUGADA-3 madrugada3.log 2>/dev/null; then nohup bash madrugada3.sh >> madrugada3.log 2>&1 & fi
sleep 2; pgrep -fa "madrugada|render.mjs" | cut -c1-80
if ! pgrep -f "madrugada4.sh" >/dev/null && ! grep -q FIM-MADRUGADA-4 madrugada4.log 2>/dev/null; then nohup bash madrugada4.sh >> madrugada4.log 2>&1 & fi
if [ ! -f _teaser/.fenrir_ok ] && ! pgrep -f cartelas_fenrir.sh >/dev/null; then nohup bash _teaser/cartelas_fenrir.sh > /dev/null 2>&1 & fi
# Short em produção (fungo zumbi): retoma os quadros se o render caiu
FZ=$P/2026-11-20-fungo-zumbi; if [ -d $FZ ] && [ ! -f $FZ/out/.ok ] && [ $(ls $FZ/frames 2>/dev/null | wc -l) -lt 1901 ] && ! pgrep -f "render.mjs frames 0-950" >/dev/null; then cd $FZ; mkdir -p frames; (RESUME=1 nohup node render.mjs frames 0-950 > r1.log 2>&1 &); (RESUME=1 nohup node render.mjs frames 951-1900 > r2.log 2>&1 &); cd $P; fi
