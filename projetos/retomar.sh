#!/usr/bin/env bash
# Religa a produção depois de um reinício do contêiner (idempotente).
P=/home/user/juroqueeverdade-videos/projetos; cd $P
if ! pgrep -f "madrugada.sh" >/dev/null && ! grep -q FIM-MADRUGADA-1 madrugada.log 2>/dev/null; then nohup bash madrugada.sh >> madrugada.log 2>&1 & fi
if ! pgrep -f "madrugada2.sh" >/dev/null && ! grep -q FIM-MADRUGADA-2 madrugada2.log 2>/dev/null; then nohup bash madrugada2.sh >> madrugada2.log 2>&1 & fi
if ! pgrep -f "madrugada3.sh" >/dev/null && ! grep -q FIM-MADRUGADA-3 madrugada3.log 2>/dev/null; then nohup bash madrugada3.sh >> madrugada3.log 2>&1 & fi
sleep 2; pgrep -fa "madrugada|render.mjs" | cut -c1-80
