"""Frase -> tempo (s) na linha do tempo do vídeo longo. Saída: work/timeline.json"""
import json, re, difflib, subprocess, unicodedata
GAP = 1.2   # silêncio entre capítulos (cartela do capítulo)
def norm(w): return ''.join(c for c in unicodedata.normalize('NFD', w.lower()) if c.isalnum())
T0 = 0.6; out = []; t = T0
for k in range(1, 13):
    n = f'cap{k:02d}'; txt = open(n + '.txt').read()
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', n + '.wav'], capture_output=True, text=True).stdout)
    W = json.load(open(f'work/{n}.words.json'))
    sents = [s.strip() for s in re.split(r'(?<=[.!?…])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ"“])', txt.replace('\n', ' ')) if s.strip()]
    sw = [[norm(x) for x in s.split() if norm(x)] for s in sents]
    flat = [x for s in sw for x in s]; ww = [norm(w['w']) for w in W]
    sm = difflib.SequenceMatcher(None, flat, ww, autojunk=False); mp = {}
    for a, b, size in sm.get_matching_blocks():
        for i in range(size): mp[a + i] = b + i
    idx = 0; starts = []
    for s in sw:
        js = [mp[i] for i in range(idx, idx + len(s)) if i in mp]
        starts.append(W[js[0]]['s'] if js else None); idx += len(s)
    for i in range(len(starts)):  # fill gaps by interpolation
        if starts[i] is None: starts[i] = starts[i - 1] + 1.5 if i else 0.0
    for i, s in enumerate(sents):
        a = starts[i]; b = starts[i + 1] if i + 1 < len(sents) else dur
        out.append({'cap': k, 'i': i, 'text': s, 's': round(t + a, 3), 'e': round(t + b, 3)})
    words = [{'w': w['w'], 's': round(t + w['s'], 3), 'e': round(t + w['e'], 3), 'cap': k} for w in W]
    json.dump(words, open(f'work/{n}.abs.json', 'w'), ensure_ascii=False)
    out.append({'cap': k, 'i': -1, 'text': '#END', 's': round(t + dur, 3), 'e': round(t + dur + GAP, 3)})
    t += dur + GAP
json.dump(out, open('work/timeline.json', 'w'), ensure_ascii=False, indent=0)
print('total', round(t, 1), 's', len(out), 'frases')
