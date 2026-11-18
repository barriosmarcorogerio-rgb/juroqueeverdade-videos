#!/usr/bin/env bash
# Gera os recortes de Instagram de um longo pronto e põe na fila (canal "insta", requer_longo).  Uso: bash gerar_recortes.sh <projeto_longo>
set -e; R=/home/user/juroqueeverdade-videos; H=$R/projetos/_teaser; P=$1
python3 - "$P" <<'PY'
import json, subprocess, sys
R='/home/user/juroqueeverdade-videos'; H=R+'/projetos/_teaser'; P=sys.argv[1]
C=json.load(open(H+'/recortes.json'))[P]; src=f"{R}/projetos/entrega/{P}-ALTA.mp4"
import glob; src = src if glob.glob(src) else sorted(glob.glob(f"{R}/projetos/entrega/*{C['slug'].split('-')[0]}*ALTA.mp4"))[0]
F=json.load(open(R+'/fila.json'))
for n, r in enumerate(C['recortes'], 1):
    slug=f"insta-{C['slug']}-{n}"; out=f"videos/{slug}.mp4"
    subprocess.run(['nice','python3',H+'/recorte.py',f"{R}/projetos/{P}",src,r['gancho'],f"{R}/{out}",str(r['cap'])],check=True)
    if not any(x['slug']==slug for x in F):
        F.append({"slug":slug,"canal":"insta","titulo":r['gancho'],"legenda_instagram":r['legenda']+"\n\n▶ Vídeo completo no YouTube: \""+C['longo']+"\" (link na bio)\n#juroqueeverdade #curiosidades #desenhoanimado #reels",
                  "video":out,"cover_ms":4000,"requer_longo":C['longo'],"publicado":False})
json.dump(F,open(R+'/fila.json','w'),ensure_ascii=False,indent=1)
PY
