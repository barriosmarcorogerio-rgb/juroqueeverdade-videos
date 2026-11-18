"""Plano de planos do vídeo longo -> web/shots.json + work/hud.json (12 qps)."""
import json, math
FPS = 12
T = [x for x in json.load(open('work/timeline.json'))]
SENT = [x for x in T if x['i'] >= 0]
END = T[-1]['e']
TOTAL = int(math.ceil(END * FPS))
H = [3, 0, 2]
J = 'joao'; P = 'pedro'; R = 'rocha'; TK = 'takeshi'; MN = 'mineiro'
add = lambda a, b: [round(a[i] + b[i], 3) for i in range(3)]
# ---------------- cast helpers ----------------
def act(who, pos, s=None, **kw):
    d = {'who': who, 'pos': pos, 's': s or (0.85 if who in (J, P) else 1.0)}; d.update(kw); return d
def pose(expr='neutral', L='hang', R_='hang', **kw):
    d = {'expr': expr, 'L': L, 'R': R_}; d.update(kw); return d
# ---------------- shot templates (return dict w/o a,b) ----------------
JY = [3.9, 0, 2.3]; PY = [2.0, 0, 5.6]
def yard(v='wide', jp=None, pp=None, light='day', hole=1, extra=None, kick=None):
    cast = []
    if jp is not False: cast.append(act(J, JY, pose=jp or pose('grin', 'reach', 'hang', holdL='shovel'), hat=(jp or {}).get('_hat', False)))
    if pp is not False: cast.append(act(P, PY, pose=pp or pose('stern', 'hip', 'hip', facing=1, look=0.5)))
    for c in cast: c['pose'].pop('_hat', None)
    cams = {
        'wide': ([8.5, 2.6, 9.5], [3, 0.9, 2], 42, [7.9, 2.5, 8.7], [3, 0.9, 2], 41),
        'j': ([4.75, 1.3, 4.4], [3.9, 1.15, 2.3], 36, [4.6, 1.3, 3.95], [3.9, 1.2, 2.3], 34),
        'p': ([2.6, 1.3, 7.7], [2.0, 1.15, 5.6], 36, [2.5, 1.3, 7.3], [2.0, 1.2, 5.6], 34),
        'hole': ([3.4, 3.0, 3.4], [3, 0, 2], 46, [3.3, 2.6, 3.0], [3, 0, 2], 44),
        'low': ([6.2, 0.35, 5.6], [3.4, 1.4, 1.6], 50, [5.8, 0.4, 5.0], [3.4, 1.5, 1.6], 48),
        'house': ([12, 3.5, 14], [0, 2, -5], 46, [10.5, 3.2, 12.5], [0, 2, -5], 45),
        'drone': ([16, 18, 20], [3, 0, 2], 40, [12, 13, 15], [3, 0, 2], 38),
    }[v]
    sh = {'set': 'quintal', 'light': light, 'cam': cam2(*cams), 'cast': cast, 'world': {'hole': hole}, 'dof': 8 if v in ('j', 'p') else 0}
    if v in ('j', 'p'): sh['focusAt'] = add(JY if v == 'j' else PY, [0, 1.2, 0])
    if extra: sh['cast'] += extra
    if kick: sh['kick'] = kick
    return sh
def cam2(p0, l0, f0, p1, l1, f1, roll=0):
    return [{'t': 0, 'pos': p0, 'look': l0, 'fov': f0}, {'t': 1, 'pos': p1, 'look': l1, 'fov': f1, 'roll': roll}]
def shaft(y=-12, v='side', layer='terra', jp=None, glow=0.6, light='shaft', ice=False, extra=None, rope=True, lamp=30, hat=True, kick=None, rocha=None):
    jpos = [H[0] + 0.32, y, H[2] + 0.12]
    cast = [act(J, jpos, pose=jp or pose('neutral', 'up', 'hang', holdR='drill'), face='cam', blob=False, shadow=False, hat=hat)]
    if rocha: cast.append(act(R, [H[0] - 0.35, y + rocha, H[2] - 0.1], pose=pose('stern', 'up', 'point', facing=1, look=0.6), face='cam', blob=False, shadow=False))
    cams = {
        'side': ([H[0] - 0.55, y + 1.3, H[2] - 0.6], [jpos[0], y + 1.15, jpos[2]], 58, [H[0] - 0.5, y + 1.3, H[2] - 0.5], [jpos[0], y + 1.2, jpos[2]], 54),
        'up': ([H[0] - 0.1, y - 1.2, H[2] + 0.1], [H[0] + 0.05, y + 30, H[2]], 70, [H[0] - 0.1, y - 1.0, H[2] + 0.1], [H[0] + 0.05, y + 30, H[2]], 64),
        'down': ([H[0] - 0.2, y + 3.4, H[2] - 0.2], [jpos[0], y + 0.4, jpos[2]], 62, [H[0] - 0.2, y + 3.0, H[2] - 0.2], [jpos[0], y + 0.4, jpos[2]], 58),
        'fall': ([H[0] - 0.3, y + 4, H[2]], [H[0], y - 20, H[2]], 70, [H[0] - 0.3, y - 2, H[2]], [H[0], y - 26, H[2]], 70),
    }[v]
    sh = {'set': 'shaft', 'light': light, 'cam': cam2(*cams), 'cast': cast, 'world': {'layer': layer, 'glow': glow, 'ice': ice, 'rope': rope, 'lamp': lamp}}
    if extra: sh['cast'] += extra
    if kick: sh['kick'] = kick
    return sh
def earth(trav=-1, travTo=None, v='far'):
    E = [0, 0, -6000]
    cams = {'far': ([-78, 26, 78], [0, 0, 0], 42, [-70, 24, 70], [0, 0, 0], 42), 'cut': ([-44, 14, 46], [0, 4, 0], 42, [-40, 12, 42], [0, 3, 0], 40),
            'top': ([-22, 52, 26], [0, 30, 0], 44, [-18, 46, 22], [0, 28, 0], 42), 'mid': ([-26, 2, 28], [0, 0, 0], 44, [-23, 2, 25], [0, 0, 0], 42),
            'bottom': ([-22, -50, 26], [0, -30, 0], 44, [-18, -46, 22], [0, -28, 0], 42), 'surface': ([-30, 60, 40], [0, 20, 0], 40, [-28, 55, 36], [0, 18, 0], 40)}[v]
    c = cams; w = {'trav': trav}
    if travTo is not None: w['travTo'] = travTo
    return {'set': 'earth', 'light': 'space', 'cam': cam2(add(E, c[0]), add(E, c[1]), c[2], add(E, c[3]), add(E, c[4]), c[5]), 'cast': [], 'world': w, 'shadowAt': E}
def mine(v='wide', jp=None):
    B = [3000, 0, 400]
    cast = [act(MN, add(B, [-0.9, 0, -2.2]), pose=pose('nervous', 'reach', 'reach', facing=1)), act(MN, add(B, [0.9, 0, -3.6]), pose=pose('pained', 'temple', 'hang', facing=-1), hat=True),
            act(J, add(B, [0.4, 0, 1.0]), pose=jp or pose('nervous', 'temple', 'hang', holdR='sandwich'), hat=True)]
    cast[0]['hat'] = True
    cams = {'wide': ([1.4, 1.7, 5.0], [0, 1.2, -2], 50, [1.2, 1.7, 4.4], [0, 1.2, -2], 48), 'ice': ([-0.2, 1.0, -0.6], [-0.6, 0.6, -3], 46, [-0.2, 1.0, -0.9], [-0.6, 0.6, -3], 44),
            'j': ([0.7, 1.35, 2.9], [0.4, 1.15, 1.0], 40, [0.65, 1.35, 2.6], [0.4, 1.2, 1.0], 38)}[v]
    return {'set': 'mine', 'light': 'mine', 'cam': cam2(add(B, cams[0]), add(B, cams[1]), cams[2], add(B, cams[3]), add(B, cams[4]), cams[5]), 'cast': cast, 'world': {}, 'dof': 6, 'focusAt': add(B, cams[1])}
def kola(v='cap', withJ=False, jp=None, cat=False):
    B = [3000, 0, 0]
    cast = []
    if withJ: cast.append(act(J, add(B, [0.9, 0, 0.8]), pose=jp or pose('grin', 'wave', 'hang', wv=0), hat=True))
    if cat: cast.append({'fx': 'fxBear', 'pos': add(B, [-0.5, 0, 0.4]), 's': 0.0001})
    cams = {'cap': ([1.5, 0.9, 1.8], [0, 0.15, 0], 40, [1.3, 0.8, 1.5], [0, 0.15, 0], 36), 'wide': ([10, 4, 15], [0, 1, -6], 46, [8.5, 3.5, 13], [0, 1, -6], 45),
            'tower': ([-6, 1.2, 8], [8, 8, -14], 50, [-5, 1.2, 7], [8, 9, -14], 48), 'plate': ([0.6, 1.1, 1.0], [0, 0.85, -0.9], 40, [0.5, 1.0, 0.7], [0, 0.85, -0.9], 38)}[v]
    return {'set': 'kola', 'light': 'polar', 'cam': cam2(add(B, cams[0]), add(B, cams[1]), cams[2], add(B, cams[3]), add(B, cams[4]), cams[5]), 'cast': cast, 'world': {}}
def polo(v='wide', bear=True):
    B = [3040, 0, 40]
    cast = [act(J, add(B, [1.0, 0, 1.2]), pose=pose('shock', 'cheek', 'cheek', facing=1, look=0.6), hat=True), act(P, add(B, [-0.8, 0, 1.6]), pose=pose('nervous', 'point', 'hang', facing=1, look=0.6))]
    if bear: cast.append({'fx': 'fxBear', 'pos': add(B, [3.2, 0, -1.6]), 's': 1.7})
    cams = {'wide': ([0.4, 1.7, 7.5], [0.8, 1.2, 0], 46, [0.4, 1.7, 6.8], [0.8, 1.2, 0], 44)}[v]
    return {'set': 'kola', 'light': 'polar', 'cam': cam2(add(B, cams[0]), add(B, cams[1]), cams[2], add(B, cams[3]), add(B, cams[4]), cams[5]), 'cast': cast, 'world': {}}
def core(v='wide', jp=None, potY=0, potYTo=None, jpos=None, rocha=True, jy=0.15, hidden=False):
    B = [-3000, 0, 0]
    cast = []
    if not hidden: cast.append(act(J, jpos or add(B, [-0.6, jy, 0.3]), pose=jp or pose('shock', 'up', 'up'), hat=True, float=0.04, blob=False))
    if rocha: cast.append(act(R, add(B, [-2.0, 0.2, -0.4]), pose=pose('stern', 'hip', 'point', facing=1, look=0.6), float=0.04, blob=False))
    cams = {'wide': ([4, 2.2, 7], [-0.5, 0.8, 0], 48, [3.5, 2.0, 6.2], [-0.5, 0.8, 0], 46), 'j': ([0.2, 1.1, 2.6], [-0.6, 1.0, 0.3], 40, [0.1, 1.1, 2.3], [-0.6, 1.0, 0.3], 38),
            'sea': ([10, 6, 16], [-6, 0, -20], 54, [9, 5, 14], [-6, 0, -20], 52), 'pot': ([3.4, 1.2, 3.6], [1.5, 0.6, 0], 42, [3.1, 1.1, 3.2], [1.5, 0.5, 0], 40)}[v]
    w = {'potX': 1.5, 'potY': potY}
    if potYTo is not None: w['potYTo'] = potYTo
    return {'set': 'core', 'light': 'core', 'cam': cam2(add(B, cams[0]), add(B, cams[1]), cams[2], add(B, cams[3]), add(B, cams[4]), cams[5]), 'cast': cast, 'world': w}
def center(v='wide', jp=None, rocha=True, rp=None):
    B = [0, 0, 6000]
    cast = [act(J, add(B, [0.3, 0.9, 0]), pose=jp or pose('grin', 'up', 'up'), face='cam', float=0.12, blob=False, shadow=False, spin=False)]
    if rocha: cast.append(act(R, add(B, [-1.4, 1.2, -0.3]), pose=rp or pose('stern', 'point', 'hip', facing=1, look=0.6), face='cam', float=0.1, blob=False, shadow=False))
    cams = {'wide': ([2.6, 1.8, 6], [0, 1.5, 0], 48, [2.3, 1.7, 5.4], [0, 1.5, 0], 46), 'j': ([0.9, 1.9, 2.6], [0.3, 1.9, 0], 40, [0.8, 1.9, 2.3], [0.3, 1.95, 0], 38),
            'r': ([-0.6, 2.1, 2.6], [-1.4, 2.2, -0.3], 40, [-0.7, 2.1, 2.3], [-1.4, 2.25, -0.3], 38), 'props': ([1.2, 2.2, 2.2], [0.2, 1.9, 0.2], 44, [1.1, 2.1, 2.0], [0.2, 1.9, 0.2], 42)}[v]
    return {'set': 'center', 'light': 'center', 'cam': cam2(add(B, cams[0]), add(B, cams[1]), cams[2], add(B, cams[3]), add(B, cams[4]), cams[5]), 'cast': cast, 'world': {}}
def ocean(v='wide', jy=0.0, jyTo=None, jp=None, tk=None, ripple=True):
    B = [-3000, 0, 3000]
    jpos = add(B, [0, jy, 0])
    cast = [act(J, jpos, pose=jp or pose('grin', 'wave', 'hang', wv=0), hat=True, blob=False)]
    if jyTo is not None: cast[0]['to'] = add(B, [0, jyTo, 0])
    if tk is not False: cast.append(act(TK, add(B, [3.5, 0.64, -2]), pose=tk or pose('shock', 'hang', 'hang', facing=-1, look=-0.6), blob=False))
    cams = {'wide': ([5, 1.6, 7], [1.5, 0.8, -1], 46, [4.6, 1.6, 6.3], [1.5, 0.8, -1], 44), 'j': ([0.6, 1.0, 2.4], [0, 0.9, 0], 40, [0.55, 1.0, 2.1], [0, 0.95, 0], 38),
            'tk': ([2.4, 1.9, 1.2], [3.5, 1.8, -2], 40, [2.5, 1.9, 0.9], [3.5, 1.85, -2], 38), 'drone': ([20, 14, 26], [1, 0, -1], 42, [16, 11, 21], [1, 0, -1], 40)}[v]
    return {'set': 'ocean', 'light': 'ocean', 'cam': cam2(add(B, cams[0]), add(B, cams[1]), cams[2], add(B, cams[3]), add(B, cams[4]), cams[5]), 'cast': cast, 'world': {'ripple': ripple}}
# ---------------- per-sentence plan (index -> list of shots; >1 splits the sentence) ----------------
p = pose
S = {}
# Cap 1 — o quintal
S[0] = [yard('drone', jp=p('grin', 'reach', 'hang', holdL='shovel'), pp=False, hole=0), yard('j', jp=p('grin', 'up', 'hang', holdL='shovel'), pp=False, hole=0)]
S[1] = [yard('p', pp=p('stern', 'hip', 'point', facing=1, look=0.5), hole=0), yard('wide', jp=p('grin', 'reach', 'hang', holdL='shovel'), hole=0)]
S[2] = [yard('j', jp=p('smile', 'thumb', 'hang', holdL='shovel'), pp=False), earth(0, None, 'far')]
S[3] = [earth(0, 1, 'cut')]
S[4] = [earth(0.5, None, 'far')]
S[5] = [earth(0, 0.25, 'top')]
S[6] = [yard('hole', jp=p('grin', 'reach', 'hang', holdL='shovel'), pp=False)]
S[7] = [yard('low', jp=p('grin', 'reach', 'reach', holdL='shovel'), pp=False)]
S[8] = [yard('house', jp=p('grin', 'reach', 'hang', holdL='shovel'))]
S[9] = [yard('j', jp=p('nervous', 'hang', 'hang', holdL='shovel'), pp=False)]
S[10] = [yard('wide', jp=p('nervous', 'reach', 'hang', holdL='shovel'), pp=p('nervous', 'cheek', 'cheek', facing=1, look=0.5))]
# Cap 2 — primeiros metros
S[11] = [shaft(-1.3, 'down', 'terra', jp=p('grin', 'reach', 'hang', holdL='shovel'), hat=False, rope=False)]
S[12] = [shaft(-1.6, 'side', 'terra', jp=p('shock', 'lift', 'hang', holdL='shovel'), hat=False, rope=False), shaft(-1.6, 'down', 'terra', jp=p('stern', 'cheek', 'hang', holdL='shovel'), hat=False, rope=False)]
S[13] = [shaft(-2.2, 'down', 'terra', jp=p('grin', 'reach', 'hang', holdL='shovel'), hat=False, rope=False)]
S[14] = [shaft(-2.3, 'side', 'terra', jp=p('shock', 'cheek', 'cheek'), hat=False, rope=False)]
S[15] = [shaft(-2.3, 'down', 'terra', jp=p('nervous', 'hang', 'hang'), hat=False, rope=False, lamp=20)]
S[16] = [shaft(-2.3, 'side', 'terra', jp=p('pained', 'up', 'up'), hat=False, rope=False)]
S[17] = [yard('p', pp=p('grin', 'cheek', 'hang', facing=1, look=0.5)), shaft(-2.3, 'up', 'terra', jp=p('pained', 'up', 'hang', holdR='bucket'), hat=False, rope=False)]
S[18] = [shaft(-2.3, 'side', 'terra', jp=p('stern', 'lift', 'hang', holdL='bucket'), hat=False, rope=False)]
S[19] = [shaft(-5, 'down', 'rocha', jp=p('grin', 'reach', 'hang', holdL='shovel'), hat=False, rope=False)]
S[20] = [shaft(-5, 'side', 'rocha', jp=p('neutral', 'reach', 'hang', holdL='shovel'), hat=False, rope=False)]
S[21] = [shaft(-5, 'down', 'rocha', jp=p('stern', 'reach', 'hang', holdL='shovel'), hat=False, rope=False)]
S[22] = [shaft(-5, 'side', 'rocha', jp=p('shock', 'reach', 'hang', holdL='shovel', toolRot=-0.4), hat=False, rope=False, kick=0)]
S[23] = [shaft(-5, 'side', 'rocha', jp=p('stern', 'reach', 'hang', holdL='shovel', look=0.6, facing=1), hat=False, rope=False)]
S[24] = [shaft(-5, 'side', 'rocha', jp=p('nervous', 'reach', 'hang', holdL='shovel', look=0.6, facing=1, blink=0), hat=False, rope=False)]
S[25] = [yard('hole', jp=False, pp=False)]
S[26] = [yard('low', jp=p('grin', 'hip', 'hip'), pp=False)]
S[27] = [yard('j', jp=p('grin', 'hang', 'hang', holdR='drill', holdL='sandwich', _hat=True), pp=False)]
S[28] = [shaft(-10, 'side', 'rocha', jp=p('grin', 'reach', 'hang', holdL='drill', shake=1))]
S[29] = [shaft(-20, 'down', 'rocha', jp=p('grin', 'reach', 'hang', holdL='drill'))]
S[30] = [shaft(-50, 'side', 'rocha', jp=p('grin', 'reach', 'hang', holdL='drill'))]
S[31] = [shaft(-60, 'up', 'rocha', jp=p('neutral', 'up', 'hang'))]
S[32] = [shaft(-60, 'side', 'quente', glow=0.3, light='shaft', jp=p('nervous', 'temple', 'hang')), shaft(-60, 'side', 'quente', glow=0.6, light='hot', jp=p('pained', 'temple', 'cheek'))]
# Cap 3 — gradiente / mina
S[33] = [shaft(-62, 'side', 'quente', 0 and None, glow=0.6, light='hot', jp=p('pained', 'temple', 'hang')) if False else shaft(-62, 'side', 'quente', glow=0.6, light='hot', jp=p('pained', 'temple', 'hang'))]
S[34] = [earth(0.0, 0.02, 'surface')]
S[35] = [mine('wide')]
S[36] = [mine('j', jp=p('nervous', 'temple', 'hang', holdR='sandwich'))]
S[37] = [mine('wide')]
S[38] = [mine('ice'), mine('wide')]
S[39] = [mine('j', jp=p('shock', 'cheek', 'cheek'))]
S[40] = [shaft(-64, 'side', 'quente', glow=0.8, light='hot', jp=p('pained', 'temple', 'hang', holdR='drill'))]
S[41] = [shaft(-64, 'side', 'quente', glow=0.8, light='hot', jp=p('shock', 'hang', 'lift', holdR='sandwich', toast=1))]
S[42] = [shaft(-64, 'side', 'quente', glow=0.8, light='hot', jp=p('pained', 'hang', 'cheek', holdR='phone')), yard('p', pp=p('grin', 'cheek', 'hip', holdL='phone', facing=1, look=0.5))]
S[43] = [yard('p', pp=p('smile', 'cheek', 'hip', holdL='phone', facing=1, look=0.5))]
S[44] = [earth(0.0, 0.003, 'top')]
# Cap 4 — Kola
S[45] = [earth(0.05, None, 'far')]
S[46] = [kola('wide')]
S[47] = [kola('tower'), kola('wide')]
S[48] = [kola('tower')]
S[49] = [kola('plate')]
S[50] = [kola('plate')]
S[51] = [kola('cap')]
S[52] = [kola('cap')]
S[53] = [kola('cap')]
S[54] = [shaft(-70, 'down', 'quente', glow=0.9, light='hot', jp=p('pained', 'temple', 'hang'), hat=True)]
S[55] = [shaft(-70, 'side', 'quente', glow=0.9, light='hot', jp=p('shock', 'cheek', 'cheek'))]
S[56] = [shaft(-70, 'side', 'crosta', glow=0.8, light='hot', jp=p('nervous', 'reach', 'hang', holdL='drill'))]
S[57] = [shaft(-70, 'side', 'crosta', glow=0.8, light='hot', jp=p('shock', 'reach', 'hang', holdL='drill', toolRot=0.9))]
S[58] = [shaft(-70, 'down', 'crosta', glow=0.8, light='hot', jp=p('nervous', 'up', 'hang'))]
S[59] = [kola('wide')]
S[60] = [kola('wide'), kola('cap')]
S[61] = [kola('plate')]
S[62] = [kola('cap')]
S[63] = [earth(0.001, None, 'far')]
# Cap 5 — crosta, Moho, Dona Rocha
S[64] = [shaft(-70, 'side', 'crosta', glow=0.7, light='hot', jp=p('stern', 'hip', 'hip'))]
S[65] = [kola('cap', withJ=True, jp=p('grin', 'wave', 'hang', wv=0)), shaft(-70, 'down', 'crosta', glow=0.7, light='hot')]
S[66] = [earth(0.002, 0.004, 'top')]
S[67] = [earth(0.003, None, 'surface')]
S[68] = [earth(0.003, None, 'cut')]
S[69] = [earth(0.003, None, 'top')]
S[70] = [earth(0.003, None, 'surface')]
S[71] = [shaft(-72, 'side', 'crosta', glow=0.9, light='hot', jp=p('grin', 'reach', 'hang', holdL='drill'))]
S[72] = [shaft(-72, 'down', 'crosta', glow=0.9, light='hot', jp=p('shock', 'hang', 'hang'))]
S[73] = [shaft(-75, 'fall', 'manto', glow=1.0, light='hot')]
S[74] = [earth(0.004, None, 'top'), shaft(-72, 'side', 'crosta', glow=0.9, light='hot', jp=p('nervous', 'temple', 'hang'))]
S[75] = [shaft(-72, 'side', 'crosta', glow=0.9, light='hot', jp=p('pained', 'temple', 'temple'))]
S[76] = [shaft(-72, 'side', 'manto', glow=1.0, light='hot', jp=p('pained', 'cheek', 'hang'))]
S[77] = [shaft(-72, 'down', 'manto', glow=1.0, light='hot', jp=p('shock', 'cheek', 'cheek'))]
S[78] = [shaft(-72, 'up', 'manto', glow=1.0, light='hot', jp=p('shock', 'up', 'hang'), rocha=1.6), shaft(-72, 'side', 'manto', glow=1.0, light='hot', jp=p('shock', 'cheek', 'hang'), rocha=0.3)]
# Cap 6 — manto
S[79] = [shaft(-72, 'side', 'manto', glow=1.0, light='hot', jp=p('grin', 'hang', 'hang'), rocha=0.3)]
S[80] = [shaft(-72, 'side', 'manto', glow=1.0, light='hot', jp=p('grin', 'up', 'up'), rocha=0.3), shaft(-72, 'side', 'manto', glow=1.0, light='hot', jp=p('shock', 'hang', 'hang'), rocha=0.3)]
S[81] = [shaft(-72, 'side', 'manto', glow=1.0, light='hot', jp=p('nervous', 'hang', 'hang'), rocha=0.3)]
S[82] = [earth(0.01, 0.02, 'cut')]
S[83] = [earth(0.02, None, 'mid')]
S[84] = [shaft(-74, 'side', 'manto', glow=1.1, light='hot', jp=p('pained', 'temple', 'hang'))]
S[85] = [earth(0.02, None, 'cut')]
S[86] = [earth(0.02, None, 'mid')]
S[87] = [earth(0.02, None, 'mid')]
S[88] = [shaft(-74, 'side', 'manto', glow=1.1, light='hot', jp=p('stern', 'hip', 'hang'), rocha=0.3)]
S[89] = [shaft(-74, 'side', 'manto', glow=1.1, light='hot', jp=p('shock', 'cheek', 'hang'), rocha=0.3)]
S[90] = [earth(-1, None, 'far')]
S[91] = [earth(-1, None, 'surface')]
S[92] = [earth(-1, None, 'surface'), earth(-1, None, 'far')]
S[93] = [earth(0.05, None, 'cut')]
S[94] = [earth(0.05, 0.22, 'cut')]
S[95] = [earth(0.22, None, 'far')]
S[96] = [shaft(-76, 'side', 'manto', glow=1.1, light='hot', jp=p('nervous', 'hang', 'hang', look=0, facing=0))]
S[97] = [shaft(-76, 'side', 'manto', glow=1.1, light='hot', jp=p('nervous', 'hang', 'lift', holdR='drill'))]
S[98] = [shaft(-76, 'side', 'manto', glow=1.1, light='hot', jp=p('nervous', 'hang', 'hang', look=-0.6, facing=-1), rocha=0.3)]
S[99] = [shaft(-76, 'side', 'manto', glow=1.1, light='hot', jp=p('pained', 'belly', 'hang'), rocha=0.3)]
# Cap 7 — fundo do manto
S[100] = [shaft(-60, 'fall', 'manto', glow=1.2, light='hot')]
S[101] = [earth(0.08, None, 'cut')]
S[102] = [earth(0.16, None, 'cut')]
S[103] = [shaft(-76, 'side', 'fundo', glow=1.4, light='hot', jp=p('pained', 'temple', 'hang'))]
S[104] = [shaft(-76, 'side', 'fundo', glow=1.4, light='hot', jp=p('shock', 'cheek', 'cheek'))]
S[105] = [shaft(-76, 'side', 'fundo', glow=1.4, light='hot', jp=p('nervous', 'hang', 'lift', holdR='sandwich', toast=1), hat=False)]
S[106] = [shaft(-76, 'side', 'fundo', glow=1.4, light='hot', jp=p('grin', 'hip', 'hip'), hat=True)]
S[107] = [earth(0.02, None, 'top'), shaft(-76, 'down', 'fundo', glow=1.4, light='hot', jp=p('neutral', 'hang', 'hang'))]
S[108] = [shaft(-76, 'side', 'fundo', glow=1.4, light='hot', jp=p('shock', 'cheek', 'hang')), shaft(-76, 'up', 'fundo', glow=1.4, light='hot', jp=p('pained', 'temple', 'hang'))]
S[109] = [yard('p', pp=p('grin', 'cheek', 'hip', holdL='phone', facing=1, look=0.5), light='gold'), shaft(-76, 'side', 'fundo', glow=1.4, light='hot', jp=p('nervous', 'hang', 'cheek', holdR='phone'))]
S[110] = [earth(0.45, None, 'cut')]
S[111] = [shaft(-76, 'side', 'fundo', glow=1.5, light='hot', jp=p('shock', 'up', 'up'), kick=0)]
S[112] = [core('sea', hidden=True, rocha=False)]
S[113] = [core('wide', jp=p('shock', 'cheek', 'cheek'), rocha=False)]
# Cap 8 — núcleo externo
S[114] = [earth(0.46, None, 'mid')]
S[115] = [earth(0.46, None, 'cut')]
S[116] = [core('sea', hidden=True, rocha=False)]
S[117] = [earth(-1, None, 'far')]
S[118] = [earth(-1, None, 'surface')]
S[119] = [earth(-1, None, 'far')]
S[120] = [earth(-1, None, 'far')]
S[121] = [earth(-1, None, 'far')]
S[122] = [core('j', jp=p('grin', 'hang', 'hang'))]
S[123] = [core('j', jp=p('shock', 'hang', 'hang'))]
S[124] = [core('j', jp=p('pained', 'up', 'up'))]
S[125] = [core('wide', jp=p('grin', 'hang', 'point'))]
S[126] = [core('wide', jp=p('nervous', 'hang', 'hang')), core('j', jp=p('grin', 'up', 'up'))]
S[127] = [core('j', jp=p('smile', 'hip', 'hip'))]
S[128] = [core('j', jp=p('stern', 'temple', 'hang'), rocha=False)]
S[129] = [core('wide', jp=p('grin', 'up', 'hang'))]
# Cap 9 — panela e núcleo interno
S[130] = [core('pot', jp=p('grin', 'hip', 'hang'), jpos=[-2998.8, 0.15, 1.6], rocha=False)]
S[131] = [core('pot', jp=p('grin', 'thumb', 'hang'), jpos=[-2998.8, 0.15, 1.6], rocha=False)]
S[132] = [core('pot', hidden=True, rocha=False, potY=0, potYTo=-1.6)]
S[133] = [earth(0.8, None, 'cut')]
S[134] = [earth(0.8, None, 'mid')]
S[135] = [earth(0.8, None, 'mid'), center('wide', jp=p('shock', 'up', 'up'), rocha=False)]
S[136] = [earth(0.95, None, 'mid')]
S[137] = [earth(0.97, None, 'cut')]
S[138] = [center('wide', jp=p('pained', 'cheek', 'cheek'), rocha=False)]
S[139] = [center('j', jp=p('shock', 'cheek', 'cheek'), rocha=False)]
S[140] = [yard('drone', jp=False, pp=False, light='gold')]
S[141] = [yard('low', jp=False, pp=False, light='gold')]
S[142] = [yard('hole', jp=False, pp=False, light='gold')]
S[143] = [center('j', jp=p('pained', 'up', 'hang'), rocha=False)]
S[144] = [center('j', jp=p('pained', 'cheek', 'cheek'), rocha=False)]
S[145] = [earth(1.0, None, 'mid')]
S[146] = [earth(1.0, None, 'cut')]
S[147] = [center('wide', jp=p('nervous', 'hang', 'hang'), rocha=False)]
# Cap 10 — flutua / queda livre
S[148] = [center('wide', jp=p('shock', 'up', 'up'))]
S[149] = [earth(1.0, None, 'mid'), center('wide', jp=p('grin', 'up', 'up'))]
S[150] = [center('j', jp=p('grin', 'up', 'up'), rocha=False)]
S[151] = [center('j', jp=p('laugh', 'up', 'up'), rocha=False)]
S[152] = [center('j', jp=p('laugh', 'thumb', 'up'), rocha=False)]
S[153] = [center('props', jp=p('grin', 'up', 'up'), rocha=False)]
S[154] = [center('props', jp=p('grin', 'up', 'up'), rocha=False)]
S[155] = [center('r', rp=p('stern', 'point', 'hip', facing=1, look=0.6))]
S[156] = [center('wide', jp=p('nervous', 'hang', 'hang'))]
S[157] = [earth(0.0, None, 'far'), earth(0.0, 0.1, 'cut')]
S[158] = [shaft(-40, 'fall', 'manto', glow=0.6, light='hot')]
S[159] = [earth(0.0, None, 'far')]
S[160] = [earth(0.0, 0.3, 'cut')]
S[161] = [earth(0.3, 0.5, 'mid')]
S[162] = [shaft(-50, 'fall', 'fundo', glow=1.2, light='hot')]
S[163] = [earth(0.5, 0.85, 'mid'), earth(0.85, 1.0, 'bottom')]
S[164] = [earth(0.0, 1.0, 'far')]
S[165] = [earth(1.0, None, 'bottom')]
S[166] = [yard('p', pp=p('shock', 'cheek', 'hang', facing=1, look=0.5), light='gold')]
S[167] = [earth(1.0, 0.5, 'far')]
S[168] = [earth(0.5, 0.0, 'cut')]
S[169] = [earth(0.0, 0.5, 'cut')]
S[170] = [earth(0.5, 1.0, 'far')]
# Cap 11 — ar e rotação
S[171] = [yard('wide', jp=p('nervous', 'hang', 'hang', _hat=True), pp=p('stern', 'hip', 'hip', facing=1, look=0.5), light='gold')]
S[172] = [shaft(-40, 'fall', 'rocha', glow=0.3, light='shaft')]
S[173] = [shaft(-40, 'side', 'manto', glow=1.0, light='hot', jp=p('nervous', 'up', 'up')), center('wide', jp=p('nervous', 'up', 'up'), rocha=False)]
S[174] = [center('j', jp=p('dazed', 'up', 'up'), rocha=False)]
S[175] = [earth(-1, None, 'far')]
S[176] = [earth(-1, None, 'surface'), earth(-1, None, 'far')]
S[177] = [shaft(-30, 'side', 'rocha', jp=p('shock', 'up', 'up'))]
S[178] = [shaft(-30, 'side', 'rocha', jp=p('dazed', 'cheek', 'up'), kick=0)]
S[179] = [shaft(-50, 'down', 'manto', glow=0.8, light='hot', jp=p('pained', 'up', 'hang'))]
S[180] = [earth(-1, None, 'far')]
S[181] = [earth(-1, None, 'top')]
S[182] = [polo('wide', bear=False), polo('wide', bear=True)]
S[183] = [polo('wide', bear=True)]
S[184] = [shaft(-30, 'side', 'rocha', jp=p('pained', 'up', 'hang'))]
# Cap 12 — o outro lado
S[185] = [center('wide', jp=p('stern', 'hip', 'hip'), rocha=False)]
S[186] = [earth(0.5, 0.7, 'mid'), earth(0.7, 0.9, 'cut'), shaft(-40, 'up', 'rocha', jp=p('grin', 'up', 'hang'))]
S[187] = [shaft(-30, 'up', 'rocha', jp=p('laugh', 'up', 'up'))]
S[188] = [shaft(-20, 'side', 'terra', jp=p('laugh', 'up', 'up'))]
S[189] = [ocean('wide', jy=-1.6, jyTo=0.0, tk=False), ocean('j', jy=0.0, jp=p('shock', 'cheek', 'cheek'), tk=False)]
S[190] = [earth(1.0, None, 'bottom')]
S[191] = [ocean('drone', tk=False)]
S[192] = [earth(-1, None, 'far')]
S[193] = [earth(-1, None, 'surface')]
S[194] = [ocean('wide', jp=p('nervous', 'hang', 'hang'), tk=p('neutral', 'hang', 'hang', facing=-1))]
S[195] = [ocean('tk', tk=p('shock', 'cheek', 'hang', facing=-1, look=-0.6)), ocean('wide', jp=p('grin', 'wave', 'hang'), tk=p('shock', 'cheek', 'hang', facing=-1, look=-0.6))]
S[196] = [ocean('j', jp=p('grin', 'wave', 'hang'))]
S[197] = [ocean('tk', tk=p('stern', 'point', 'hang', facing=-1, look=-0.6))]
S[198] = [ocean('j', jp=p('smile', 'thumb', 'hang')), ocean('tk', tk=p('grin', 'hip', 'hip', facing=-1, look=-0.6)), yard('p', pp=p('neutral', 'hip', 'hip', facing=0), light='night')]
S[199] = [yard('hole', jp=False, pp=False, light='night'), yard('wide', jp=False, pp=p('grin', 'cheek', 'hang', facing=1, look=0.4), light='night')]
# ---------------- assemble ----------------
shots = []; hud = []
CAPTITLE = {1: 'O QUINTAL', 2: 'OS PRIMEIROS METROS', 3: 'O FORNO', 4: 'O BURACO MAIS FUNDO DO MUNDO', 5: 'A CASCA DA TERRA', 6: 'O MANTO', 7: 'TRÊS MIL GRAUS', 8: 'O OCEANO DE METAL',
            9: 'O CENTRO DA TERRA', 10: 'FLUTUANDO', 11: 'O PROBLEMA', 12: 'O OUTRO LADO'}
DEPTH = {}  # sentence -> (depth label, temp label)
for k, d in [(11, ('1 m', '25 °C')), (13, ('2 m', '24 °C')), (19, ('5 m', '23 °C')), (28, ('10 m', '22 °C')), (29, ('20 m', '22 °C')), (30, ('50 m', '23 °C')), (32, ('500 m', '35 °C')),
             (35, ('4 km', '60 °C')), (40, ('4 km', '60 °C')), (45, ('4 km', '60 °C')), (54, ('12 km', '180 °C')), (64, ('12 km', '180 °C')), (71, ('35 km', '500 °C')), (79, ('35 km', '500 °C')),
             (94, ('2.900 km', '3.700 °C')), (100, ('1.000 km', '2.000 °C')), (102, ('2.000 km', '3.000 °C')), (110, ('2.900 km', '3.700 °C')), (114, ('2.900 km', '4.000 °C')),
             (133, ('5.100 km', '5.000 °C')), (145, ('6.371 km', '5.200 °C')), (171, None), (189, ('12.742 km', '20 °C')), (192, None)]:
    DEPTH[k] = d
cur = None
for idx, x in enumerate(SENT):
    a = int(round(x['s'] * FPS)); b = int(round(x['e'] * FPS)) - 1
    nxt_end = None
    lst = S.get(idx) or [yard('wide')]
    n = len(lst); span = b - a + 1
    for k, sh in enumerate(lst):
        sa = a + span * k // n; sb = a + span * (k + 1) // n - 1
        sh = json.loads(json.dumps(sh)); sh['id'] = f's{idx}_{k}'; sh['a'] = sa; sh['b'] = sb
        L = max(1, sb - sa)
        sh['cam'] = [dict(c, f=sa + int(c.pop('t') * L)) for c in sh['cam']]
        if 'kick' in sh: sh['kicks'] = [{'f': sa + 2, 'a': 0.06}]; sh.pop('kick')
        shots.append(sh)
    if idx in DEPTH: cur = DEPTH[idx]
    hud.append({'a': a, 'b': b, 'hud': cur, 'cap': x['cap']})
# chapter-gap frames: extend previous shot to cover the gap
for i in range(len(shots) - 1): shots[i]['b'] = shots[i + 1]['a'] - 1
shots[-1]['b'] = TOTAL - 1
if shots[0]['a'] > 0: shots[0]['a'] = 0; shots[0]['cam'][0]['f'] = 0
caps = []
for x in T:
    if x['i'] == 0: caps.append({'cap': x['cap'], 'title': CAPTITLE[x['cap']], 'a': int(round(x['s'] * FPS))})
json.dump({'total': TOTAL, 'shots': shots}, open('web/shots.json', 'w'), ensure_ascii=False)
json.dump({'fps': FPS, 'total': TOTAL, 'hud': hud, 'caps': caps}, open('work/hud.json', 'w'), ensure_ascii=False)
print('shots', len(shots), 'frames', TOTAL)
