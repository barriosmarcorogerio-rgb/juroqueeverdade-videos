"""Plano de planos — "E se GIGANTES de 15 metros atacassem a sua cidade?" -> web/shots.json + work/hud.json (12 qps)."""
import json, math
FPS = 12
T = json.load(open('work/timeline.json'))
SENT = [x for x in T if x['i'] >= 0]
END = T[-1]['e']; TOTAL = int(math.ceil(END * FPS))
add = lambda a, b: [round(a[i] + b[i], 3) for i in range(3)]
WZ, WY = -40, 12           # wall line and walkway height
WALK = -39.6               # soldiers stand here on the walkway
def cam(p0, l0, f0, p1=None, l1=None, f1=None, roll=0):
    return [{'t': 0, 'pos': p0, 'look': l0, 'fov': f0}, {'t': 1, 'pos': p1 or p0, 'look': l1 or l0, 'fov': f1 or f0, 'roll': roll}]
def P(expr='neutral', L='hang', R='hang', **kw): d = {'expr': expr, 'L': L, 'R': R}; d.update(kw); return d
def who(w, pos, pose, **kw): d = {'who': w, 'pos': pos, 's': kw.pop('s', 1.0), 'pose': pose}; d.update(kw); return d
def giant(kind, pos, s=None, **o):
    S = s or {'grin': 7.6, 'tiny': 7.2, 'long': 8.4}[kind]; sk = {'grin': '#e6b08a', 'tiny': '#d29a74', 'long': '#f0c8a8'}[kind]; hr = {'grin': '#4a3424', 'tiny': '#2b211c', 'long': '#b07a3a'}[kind]
    extra = {k: o.pop(k) for k in list(o) if k in ('to', 'roll', 'rollTo', 'rollEase', 'rollDelay', 'rollDur', 'walk', 'flip')}
    oo = {'kind': kind, 'skin': sk, 'hair': hr}; oo.update(o)
    d = {'fx': 'fxGiant', 'pos': pos, 's': S, 'o': oo, 'shadow': True}; d.update(extra); return d
def fx(name, pos, s, **kw): d = {'fx': name, 'pos': pos, 's': s}; d.update(kw); return d
G1, G2, G3 = [-4, 0, 34], [12, 0, 52], [26, 0, 70]       # giants approaching (later closer)
def gang(stage=0, walk=False, **o):
    dz = [0, -8, -14, -20][stage]
    w = {'walk': True} if walk else {}
    return [giant('grin', add(G1, [0, 0, dz]), **w, **o), giant('tiny', add(G2, [0, 0, dz]), arms='reach', **w), giant('long', add(G3, [0, 0, dz]), **w)]
def shot(light='night', c=None, cast=(), world=None, dof=0, focus=None, kick=False, hud=None):
    d = {'light': light, 'cam': c, 'cast': list(cast), 'world': world or {}, 'set': 'quintal'}
    if dof: d['dof'] = dof; d['focusAt'] = focus
    if kick: d['kick'] = 1
    d['hudv'] = hud
    return d
# ---- reusable framings ----
def wall_duo(light, tp, bp, x0=0.0, fov=42, extra=()):     # Tonico + Bia on the walkway, camera inside looking out
    c = cam([x0 + 0.3, WY + 1.55, WALK - 2.7], [x0, WY + 1.3, WALK], fov, [x0 + 0.25, WY + 1.55, WALK - 2.4], [x0, WY + 1.32, WALK], fov - 2)
    return shot(light, c, [who('tonico', [x0 - 0.65, WY, WALK], tp), who('bia', [x0 + 0.65, WY, WALK], bp), *extra], dof=6, focus=[x0, WY + 1.3, WALK])
def wall_one(light, w, pose, x0=0.0, fov=36, extra=()):
    c = cam([x0 + 0.2, WY + 1.6, WALK - 1.9], [x0, WY + 1.45, WALK], fov, [x0 + 0.15, WY + 1.6, WALK - 1.7], [x0, WY + 1.5, WALK], fov - 2)
    return shot(light, c, [who(w, [x0, WY, WALK], pose), *extra], dof=8, focus=[x0, WY + 1.45, WALK])
def look_out(light, stage=0, walk=True, fov=52, **o):        # over the battlements towards the giants
    c = cam([1.0, WY + 1.9, WALK - 1.2], [2, WY + 6, 40], fov, [0.8, WY + 1.9, WALK - 1.0], [2, WY + 6.5, 40], fov - 3)
    return shot(light, c, [*gang(stage, walk, **o)])
def peek(light, kind='grin', **o):                          # giant face over the merlons, soldiers in front
    c = cam([3, WY + 1.8, WALK - 1.9], [0, WY + 4, 20], 50, [2.7, WY + 1.8, WALK - 1.7], [0, WY + 4.2, 20], 48)
    return shot(light, c, [giant(kind, [-2, 0, WZ + 14], look=0.4, **o), who('tonico', [1.2, WY, WALK + 0.2], P('shock', 'up', 'hang', look=-0.4))])
def city(light):
    return shot(light, cam([70, 48, 60], [0, 8, -50], 44, [60, 42, 52], [0, 8, -50], 43))
def field(light, stage=1, fov=48, walk=True, extra=(), **o):  # low angle in the field, giants walking
    c = cam([10, 1.8, 46], [-2, 10, 10], fov, [9, 1.8, 42], [-2, 10.5, 10], fov - 2)
    return shot(light, c, [*gang(stage, walk, **o), *extra])
def gclose(light, kind='grin', z=30, fov=40, **o):          # close on one giant face
    g = giant(kind, [0, 0, z], **o); hy = {'grin': 13.3, 'tiny': 12.0, 'long': 13.6}[kind]
    c = cam([2.2, hy - 1.5, z + 12], [0, hy, z], fov, [2.0, hy - 1.4, z + 10.5], [0, hy, z], fov - 2)
    return shot(light, c, [g])
def lab(light, lp=None, extra=(), fov=40):                   # Lúcio on the walkway with the cubes card
    x0 = -3.0
    c = cam([x0 + 0.6, WY + 1.5, WALK - 3.0], [x0 + 0.3, WY + 1.25, WALK], fov, [x0 + 0.5, WY + 1.5, WALK - 2.6], [x0 + 0.3, WY + 1.3, WALK], fov - 2)
    return shot(light, c, [who('lucio', [x0 - 0.3, WY, WALK], lp or P('grin', 'hold', 'point', facing=1, look=0.5)), fx('fxCubes', [x0 + 0.9, WY + 0.3, WALK + 0.1], 0.7), *extra], dof=6, focus=[x0 + 0.3, WY + 1.2, WALK])
def chart(light, extra=()):
    c = cam([-5.4, WY + 1.6, WALK - 3.2], [-6, WY + 1.5, WALK - 1.4], 44, [-5.5, WY + 1.6, WALK - 2.8], [-6, WY + 1.5, WALK - 1.4], 42)
    return shot(light, c, [who('tonico', [-6.9, WY, WALK - 1.0], P('nervous', 'hang', 'hang', facing=1, look=0.5)), *extra], world={'chart': True})
def animal(light, name, s, fov=44, extra=(), t=None):
    d = fx(name, [0, 0, 40], s, shadow=True)
    if t is not None: d['t'] = t
    c = cam([3.5, 1.8, 46.5], [0.5, 1.6 * s / 2.2 + 0.4, 40], fov, [3.2, 1.8, 45.8], [0.5, 1.6 * s / 2.2 + 0.4, 40], fov - 2)
    return shot(light, c, [d, *extra])
def ground(light, extra=(), fov=50):
    c = cam([-3, 1.4, 30], [2, 2.4, 20], fov, [-2.6, 1.4, 29], [2, 2.4, 20], fov - 2)
    return shot(light, c, list(extra), world={'trip': True})
# ---- per-sentence plan ----
p = P; N, D, DW, GD = 'night', 'day', 'dawn', 'gold'
S = {}
S[0] = [shot(N, cam([-13, WY + 1.7, WALK - 1.8], [0, WY + 3.5, WZ + 6], 50, [-12.4, WY + 1.6, WALK - 1.6], [0, WY + 5, WZ + 6], 46),   # abertura: o rosto do colossal surge por cima da muralha
              cast=[giant('long', [0, -15, WZ + 7], s=16.8, to=[0, -11.5, WZ + 7]), who('tonico', [-9.5, WY, WALK], P('shock', 'up', 'hang', look=0.6))]),
        city(N), shot(N, cam([4, WY + 3, WALK - 30], [0, WY + 1, WALK], 46, [3, WY + 2.6, WALK - 24], [0, WY + 1, WALK], 44))]
S[1] = [wall_one(N, 'tonico', p('nervous', 'hang', 'reach', holdR='sandwich', blink=1)), wall_one(N, 'tonico', p('smile', 'hang', 'give', holdR='sandwich'))]
S[2] = [wall_one(N, 'tonico', p('shock', 'hang', 'reach', holdR='sandwich', blink=0))]
S[3] = [look_out(N, 0, walk=False)]
S[4] = [look_out(N, 0, walk=False, fov=46)]
S[5] = [field(N, 0, walk=False)]
S[6] = [gclose(N, 'grin', 40)]
S[7] = [field(N, 0)]
S[8] = [gclose(N, 'long', 60), gclose(N, 'tiny', 50, arms='reach')]
S[9] = [wall_one(N, 'bia', p('stern', 'hang', 'hang', hookFire=0), x0=0.65)]
S[10] = [look_out(N, 0)]
S[11] = [wall_duo(N, p('shock', 'cheek', 'hang'), p('stern', 'hip', 'hang', facing=-1, look=-0.5))]
S[12] = [wall_duo(N, p('shock', 'hang', 'hang'), p('stern', 'point', 'hip', facing=-1, look=-0.5))]
S[13] = [wall_duo(N, p('grin', 'hip', 'hang'), p('stern', 'hip', 'point', facing=-1, look=-0.5)), peek(N)]
S[14] = [city(N)]
S[15] = [field(N, 0, walk=False)]
S[16] = [shot(D, cam([40, 18, 30], [0, 8, -40], 44, [34, 16, 24], [0, 8, -40], 43))]
S[17] = [shot(D, cam([60, 6, 10], [0, 8, -40], 46, [52, 6, 6], [0, 8, -40], 45)), shot(D, cam([-60, 30, 40], [0, 6, -40], 42, [-50, 26, 34], [0, 6, -40], 41))]
S[18] = [shot(D, cam([20, 3, -20], [0, 9, -40], 52, [18, 3, -22], [0, 10, -40], 50))]
S[19] = [city(D)]
S[20] = [shot(D, cam([4, 1.6, -25], [0, 8, -40], 56))]
S[21] = [field(D, 0)]
S[22] = [shot(D, cam([30, 6, 50], [0, 7, 30], 44, [26, 6, 46], [0, 7, 30], 42), cast=[giant('grin', [0, 0, 30])])]
S[23] = [shot(D, cam([2.5, 1.6, 34.5], [0.7, 1.2, 30], 44), cast=[who('soldado', [0.8, 0, 30.8], p('neutral', 'hip', 'hang')), giant('grin', [-2.5, 0, 30])])]
S[24] = [shot(D, cam([9, 4, 50], [0, 7, 30], 46), cast=[who('soldado', [2.0, 0, 31], p('shock', 'up', 'hang', look=-0.6)), giant('grin', [-2.5, 0, 30])])]
S[25] = [lab(D, p('grin', 'hold', 'hold', holdBoth='bread'))]
S[26] = [gclose(D, 'grin', 30), gclose(D, 'tiny', 30, arms='reach'), gclose(D, 'long', 30)]
S[27] = [wall_one(D, 'ferraz', p('stern', 'hip', 'lift', holdR='grapple'), x0=2.0), wall_one(D, 'ferraz', p('stern', 'hip', 'point'), x0=2.0)]
S[28] = [wall_one(D, 'tonico', p('shock', 'cheek', 'reach', holdR='sandwich', bite=1))]
S[29] = [wall_one(D, 'bia', p('stern', 'hold', 'hold', holdBoth='grapple'), x0=0.65)]
S[30] = [field(D, 1), look_out(D, 1)]
# cap 3
S[31] = [lab(D, p('grin', 'up', 'hang'))]
S[32] = [lab(D, p('neutral', 'hip', 'point'))]
S[33] = [lab(D, p('stern', 'point', 'hip'))]
S[34] = [lab(D, p('grin', 'hold', 'point')), city(D)]
S[35] = [lab(D)]
S[36] = [shot(D, cam([-2.1, WY + 1.0, WALK - 1.6], [-2.1, WY + 0.95, WALK + 0.1], 36), cast=[fx('fxCubes', [-2.1, WY + 0.3, WALK + 0.1], 0.7)])]
S[37] = [lab(D, p('stern', 'up', 'point'))]
S[38] = [lab(D, p('grin', 'hold', 'hold', holdBoth='bread'))]
S[39] = [wall_one(D, 'tonico', p('grin', 'thumb', 'hang'))]
S[40] = [wall_one(D, 'bia', p('nervous', 'temple', 'hang', swirl=1), x0=0.65)]
S[41] = [wall_one(D, 'ferraz', p('stern', 'hip', 'hip'), x0=2.0)]
S[42] = [lab(D, p('stern', 'point', 'hip')), gclose(D, 'tiny', 30)]
S[43] = [field(D, 1, walk=False)]
# cap 4 — the numbers
S[44] = [lab(D, p('grin', 'hold', 'point'))]
S[45] = [gclose(D, 'grin', 30)]
S[46] = [lab(D, p('stern', 'point', 'hip'))]
S[47] = [shot(D, cam([12, 4, 46], [0, 6, 30], 50), cast=[giant('grin', [-1, 0, 30]), fx('fxCow', [4, 0, 33], 1.0)])]
S[48] = [shot(D, cam([12, 4, 46], [0, 6, 30], 48), cast=[giant('grin', [-1, 0, 30])])]
S[49] = [field(D, 1, walk=False)]
S[50] = [lab(D, p('nervous', 'hold', 'hold'))]
S[51] = [gclose(D, 'grin', 30)]
S[52] = [shot(D, cam([3, 3, 40], [0, 4, 30], 46), cast=[giant('grin', [0, 0, 30])])]
S[53] = [lab(D, p('stern', 'point', 'hip'))]
S[54] = [field(D, 2)]
S[55] = [shot(D, cam([3, 2.5, 36], [0, 3, 26], 46), cast=[giant('grin', [0, 0, 26], walk=True)], kick=True)]
S[56] = [gclose(D, 'grin', 26, look=-0.3)]
S[57] = [shot(D, cam([3, 2.5, 36], [0, 3, 26], 44), cast=[giant('grin', [0, 0, 26], dazed=True)])]
# cap 5 — Wadlow (respectful: height chart only)
S[58] = [wall_duo(D, p('neutral', 'hang', 'hang'), p('nervous', 'point', 'hang', facing=-1, look=-0.5))]
S[59] = [chart(D)]
S[60] = [chart(D)]
S[61] = [chart(D)]
S[62] = [chart(D)]
S[63] = [lab(D, p('neutral', 'hang', 'hang'))]
S[64] = [lab(D, p('neutral', 'hang', 'hang'))]
S[65] = [chart(D)]
S[66] = [chart(D)]
S[67] = [wall_duo(D, p('pained', 'hang', 'hang'), p('pained', 'hang', 'hang'))]
S[68] = [chart(D)]
S[69] = [look_out(D, 2)]
S[70] = [wall_duo(D, p('pained', 'hang', 'hang', headTilt=12), p('pained', 'hang', 'hang', headTilt=12))]
S[71] = [wall_duo(D, p('pained', 'hang', 'hang', headTilt=12), p('pained', 'hang', 'hang', headTilt=12))]
S[72] = [field(D, 2, walk=False)]
# cap 6 — the heart
S[73] = [gclose(D, 'long', 40)]
S[74] = [lab(D)]
S[75] = [lab(D, p('stern', 'belly', 'point'))]
S[76] = [gclose(D, 'long', 40)]
S[77] = [gclose(D, 'long', 40)]
S[78] = [animal(D, 'fxGiraffe', 2.4)]
S[79] = [animal(D, 'fxGiraffe', 2.4)]
S[80] = [shot(D, cam([4, 1.6, 52], [0, 9, 40], 52), cast=[giant('long', [0, 0, 40])])]
S[81] = [gclose(D, 'long', 40)]
S[82] = [lab(D, p('shock', 'cheek', 'cheek'))]
S[83] = [shot(D, cam([6, 3, 52], [0, 6, 40], 46), cast=[giant('long', [0, 0, 40], arms='reach')])]
S[84] = [shot(D, cam([6, 3, 52], [0, 6, 40], 46), cast=[giant('long', [0, 0, 40], dazed=True)])]
S[85] = [shot(D, cam([8, 3, 50], [0, 4, 38], 46), cast=[giant('long', [0, 0, 38], arms='reach'), fx('fxCow', [3, 0, 40], 1.0)])]
S[86] = [shot(D, cam([8, 3, 50], [0, 6, 38], 46), cast=[giant('long', [0, 0, 38]), fx('fxCow', [3, 0, 40], 1.0)])]
S[87] = [shot(D, cam([8, 3, 50], [0, 6, 38], 46), cast=[giant('long', [0, 0, 38], dazed=True), fx('fxCow', [3, 0, 40], 1.0)])]
S[88] = [shot(D, cam([8, 3, 50], [0, 4, 38], 46), cast=[giant('long', [0, -3.5, 38], dazed=True), fx('fxCow', [3, 0, 40], 1.0)])]
# cap 7 — food
S[89] = [wall_one(D, 'ferraz', p('nervous', 'cheek', 'hang'), x0=2.0)]
S[90] = [lab(D)]
S[91] = [lab(D, p('stern', 'point', 'hip'))]
S[92] = [shot(D, cam([5.0, WY + 1.4, WALK - 4.2], [4, WY + 0.6, WALK], 44, [4.9, WY + 1.35, WALK - 3.7], [4, WY + 0.6, WALK], 42), cast=[fx('fxBread', [4, WY, WALK], 1.6)])]
S[93] = [shot(D, cam([4.2, WY + 1.6, WALK - 5.0], [4, WY + 0.6, WALK], 46, [4.15, WY + 1.55, WALK - 4.5], [4, WY + 0.6, WALK], 44), cast=[fx('fxBread', [4, WY, WALK], 1.5), fx('fxBread', [2.3, WY, WALK + 0.3], 1.5), fx('fxBread', [5.7, WY, WALK - 0.1], 1.5)])]
S[94] = [gclose(D, 'tiny', 30)]
S[95] = [gclose(D, 'tiny', 30, mouth=0.6)]
S[96] = [wall_duo(D, p('shock', 'cheek', 'cheek'), p('shock', 'cheek', 'cheek'))]
S[97] = [lab(D)]
S[98] = [lab(D, p('stern', 'point', 'hip'))]
S[99] = [city(D)]
S[100] = [animal(D, 'fxElephant', 2.0, t=0.2)]
S[101] = [animal(D, 'fxElephant', 2.0, t=0.6)]
S[102] = [wall_one(D, 'tonico', p('nervous', 'hang', 'reach', holdR='sandwich'))]
S[103] = [look_out(D, 3, walk=False)]
S[104] = [wall_one(D, 'tonico', p('grin', 'hang', 'hang'))]
S[105] = [shot(D, cam([20, 4, -14], [14, 3, -28], 50), cast=[giant('tiny', [16, 0, -20], arms='reach')]), gclose(D, 'tiny', -20, mouth=0.3)]
# cap 8 — heat (dawn)
S[106] = [gclose(DW, 'grin', 26)]
S[107] = [lab(DW)]
S[108] = [lab(DW, p('stern', 'point', 'hip'))]
S[109] = [lab(DW, p('grin', 'hold', 'point'))]
S[110] = [gclose(DW, 'grin', 26)]
S[111] = [animal(DW, 'fxElephant', 2.0, t=1.0)]
S[112] = [animal(DW, 'fxElephant', 2.0, t=1.6)]
S[113] = [gclose(DW, 'grin', 26)]
S[114] = [gclose(DW, 'grin', 26, mouth=0.4)]
S[115] = [field(DW, 3, walk=False)]
S[116] = [city(DW)]
S[117] = [peek(DW, 'grin', mouth=0.2)]
S[118] = [peek(DW, 'grin', mouth=0.5), shot(DW, cam([3, 6, -30], [0, 9, WZ], 52), cast=[giant('grin', [-2, 0, WZ + 14], look=0.2), fx('fxSweat', [-1.5, 8, WZ + 10], 4)])]
S[119] = [shot(DW, cam([3, 6, -30], [0, 7, WZ], 52), cast=[giant('grin', [-2, 0, WZ + 14], look=0.2), fx('fxSweat', [-1.5, 6, WZ + 10], 5)])]
S[120] = [wall_one(DW, 'bia', p('pained', 'cheek', 'hang'), x0=0.65)]
S[121] = [lab(DW, p('grin', 'hold', 'hang'))]
# cap 9 — the fall
S[122] = [city(D)]
S[123] = [gclose(D, 'grin', 30)]
S[124] = [lab(D, p('stern', 'point', 'hip'))]
S[125] = [shot(D, cam([4.8, WY + 0.7, WALK - 1.9], [4, WY + 0.3, WALK], 40, [4.7, WY + 0.65, WALK - 1.7], [4, WY + 0.3, WALK], 38), cast=[fx('fxRat', [4, WY, WALK], 1.0)])]
S[126] = [shot(D, cam([4.8, WY + 0.7, WALK - 1.9], [4, WY + 0.3, WALK], 40, [4.7, WY + 0.65, WALK - 1.7], [4, WY + 0.3, WALK], 38), cast=[fx('fxRat', [4, WY, WALK], 1.0, roll=1.57)])]
S[127] = [lab(D, p('pained', 'cheek', 'hang'))]
S[128] = [lab(D, p('shock', 'cheek', 'cheek'))]
S[129] = [gclose(D, 'grin', 30)]
S[130] = [lab(D, p('stern', 'point', 'hip'))]
S[131] = [wall_one(D, 'tonico', p('pained', 'belly', 'hang'))]
S[132] = [shot(D, cam([20, 2, 44], [0, 6, 30], 48), cast=[giant('grin', [0, 0, 30], roll=0, rollTo=-1.45, rollEase='in')])]
S[133] = [wall_one(D, 'ferraz', p('shock', 'hang', 'hang'), x0=2.0)]
S[134] = [wall_one(D, 'ferraz', p('grin', 'thumb', 'hang'), x0=2.0)]
S[135] = [wall_one(D, 'ferraz', p('grin', 'hip', 'point'), x0=2.0), lab(D, p('stern', 'hip', 'hang'))]
S[136] = [lab(D, p('grin', 'hold', 'point')), wall_one(D, 'bia', p('grin', 'hang', 'reach', holdR='grapple'), x0=0.65)]
S[137] = [wall_one(D, 'tonico', p('grin', 'hang', 'reach', holdR='grapple'))]
S[138] = [wall_duo(D, p('grin', 'hang', 'reach', holdR='grapple'), p('grin', 'reach', 'hang', holdL='grapple'))]
# cap 10 — the trap
S[139] = [shot(D, cam([17, 6.5, WZ + 11.5], [10.8, 6, WZ + 3], 46, [16.5, 6, WZ + 11], [10.8, 5, WZ + 3], 44), cast=[who('tonico', [9.5, 6.5, WZ + 3.3], p('grin', 'up', 'up'), to=[9.5, 1.5, WZ + 3.3], climb=True), who('bia', [12.2, 8.5, WZ + 3.3], p('stern', 'up', 'up'), to=[12.2, 3.0, WZ + 3.3], climb=True)], world={'ropes': [[9.5, 0.05, WZ + 3.18, 9.5, WY + 1.6, WZ + 3.18], [12.2, 0.05, WZ + 3.18, 12.2, WY + 1.6, WZ + 3.18]]}),
          ground(D, [who('tonico', [-10, 0, 20.5], p('grin', 'reach', 'hang')), who('bia', [10, 0, 20.5], p('grin', 'hang', 'reach'))])]
S[140] = [ground(D, [who('tonico', [-10, 0, 20.5], p('grin', 'thumb', 'hang')), who('bia', [10, 0, 20.5], p('smile', 'hang', 'thumb'))])]
S[141] = [ground(D, [who('tonico', [-10, 0, 20.5], p('laugh', 'belly', 'hang'))])]
S[142] = [ground(D, [giant('grin', [0, 0, 34])])]
S[143] = [shot(D, cam([-6, 1.2, 14], [0, 6, 28], 52), cast=[giant('grin', [0, 0, 34], to=[0, 0, 22.5], walk=True)], world={'trip': True})]
S[144] = [shot(D, cam([-3, 0.8, 16], [0, 0.9, 21], 46), cast=[giant('grin', [0, 0, 22.5])], world={'trip': True}, kick=True)]
S[145] = [shot(D, cam([20, 3, 30], [0, 5, 20], 50), cast=[giant('grin', [0, 0, 22], roll=0, rollTo=-1.5, rollEase='in')], world={'trip': True})]
S[146] = [shot(D, cam([20, 3, 30], [0, 3, 20], 50), cast=[giant('grin', [0, 0, 22], roll=-1.2, rollTo=-1.5, rollEase='in')], world={'trip': True})]
S[147] = [shot(D, cam([12, 4, 36], [0, 1, 20], 50, roll=4), cast=[giant('grin', [0, 0.5, 22], roll=-1.5, down=True)], world={'trip': True}, kick=True)]
S[148] = [city(D)]
S[149] = [shot(D, cam([8, 3, 46], [2, 4, 38], 46), cast=[fx('fxCow', [2, 0, 38], 1.0, to=[4, 6, 34], roll=0.4)])]
S[150] = [shot(D, cam([12, 4, 36], [0, 1, 20], 48), cast=[giant('grin', [0, 0.5, 22], roll=-1.5, down=True)], world={'trip': True})]
S[151] = [field(D, 2, walk=False), shot(D, cam([16, 3, 52], [6, 4, 38], 48), cast=[giant('tiny', [6, 0, 38], roll=0, rollTo=1.5, rollEase='in')])]
S[152] = [shot(D, cam([22, 3, 66], [20, 4, 52], 48), cast=[giant('long', [20, -4.5, 52], arms='reach')])]
S[153] = [wall_duo(D, p('laugh', 'hang', 'up'), p('laugh', 'up', 'hang'))]
S[154] = [wall_one(D, 'ferraz', p('grin', 'thumb', 'hip'), x0=2.0)]
# cap 11 — dinosaurs
S[155] = [wall_duo(D, p('neutral', 'temple', 'hang', swirl=1), p('neutral', 'hang', 'point', facing=1, look=0.5))]
S[156] = [lab(D, p('grin', 'hold', 'point'))]
S[157] = [animal(D, 'fxSauro', 7.5, fov=50)]
S[158] = [animal(D, 'fxSauro', 7.5, fov=50)]
S[159] = [lab(D, p('grin', 'point', 'hip'))]
S[160] = [animal(D, 'fxSauro', 7.5, fov=40)]
S[161] = [lab(D, p('stern', 'hold', 'point'))]
S[162] = [animal(D, 'fxSauro', 7.5, fov=50)]
S[163] = [lab(D, p('grin', 'hold', 'hold'))]
S[164] = [animal(D, 'fxSauro', 7.5, fov=50)]
S[165] = [gclose(D, 'grin', 30)]
S[166] = [wall_one(D, 'tonico', p('nervous', 'temple', 'hang', swirl=1))]
S[167] = [wall_one(D, 'bia', p('nervous', 'temple', 'hang', swirl=1), x0=0.65)]
S[168] = [wall_duo(D, p('pained', 'hang', 'hang'), p('pained', 'hang', 'hang'))]
# cap 12 — epilogue
S[169] = [city(DW)]
S[170] = [shot(DW, cam([18, 5, 46], [0, 1, 26], 48), cast=[giant('grin', [0, 0.5, 22], roll=-1.5, sleep=True), giant('tiny', [8, 0.5, 32], roll=1.5, sleep=True), giant('long', [-10, 0.5, 34], roll=-1.5, sleep=True)])]
S[171] = [wall_one(DW, 'tonico', p('grin', 'hip', 'hip'))]
S[172] = [wall_one(DW, 'bia', p('grin', 'hip', 'hip'), x0=0.65)]
S[173] = [lab(DW, p('grin', 'hold', 'hold', holdBoth='grapple'))]
S[174] = [city(DW)]
S[175] = [wall_one(DW, 'ferraz', p('laugh', 'up', 'hip'), x0=2.0)]
S[176] = [lab(DW, p('laugh', 'up', 'hang'))]
S[177] = [shot(DW, cam([18, 5, 46], [0, 1, 26], 48), cast=[giant('grin', [0, 0.5, 22], roll=-1.5, sleep=True), giant('tiny', [8, 0.5, 32], roll=1.5, sleep=True)])]
S[178] = [shot(DW, cam([10, 3, 44], [-2, 2, 30], 48), cast=[giant('tiny', [6, 0, 36], mouth=0.5)], world={'carts': True})]
S[179] = [city(D)]
S[180] = [gclose(D, 'grin', 30, dazed=True)]
S[181] = [gclose(D, 'long', 40)]
S[182] = [gclose(D, 'tiny', 30, mouth=0.6)]
S[183] = [gclose(DW, 'grin', 26)]
S[184] = [shot(GD, cam([20, 3, -20], [0, 9, -40], 52))]
S[185] = [wall_one(N, 'tonico', p('smile', 'hang', 'reach', holdR='sandwich'))]
S[186] = [look_out(N, 0, walk=False, fov=40)]
S[187] = [shot(N, cam([0.6, WY + 1.45, WALK - 0.6], [0.3, WY + 1.35, WALK + 1.7], 34), cast=[giant('grin', [0.3, WY + 1.3, WALK + 1.7], s=0.075)])]
S[188] = [shot(N, cam([0.45, WY + 1.4, WALK + 1.1], [0.3, WY + 1.37, WALK + 1.7], 30), cast=[giant('grin', [0.3, WY + 1.3, WALK + 1.7], s=0.075)])]
S[189] = [wall_duo(N, p('nervous', 'hang', 'hang', look=0.4), p('stern', 'point', 'hip', facing=-1, look=-0.5))]
# ---- hud callouts (number cards) ----
HUD = {0: [['ALTURA DA MURALHA', '12 m']], 7: [['ALTURA DO GIGANTE', '15 m']], 18: [['CONSTANTINOPLA', 'séc. V · 12 m']], 22: [['15 m =', '5 andares']], 24: [['ESCALA', 'x 8,5']],
       34: [['GALILEU', '1638']], 36: [['ÁREA', 'x 4'], ['PESO', 'x 8']], 47: [['PESO', 'x 635']], 48: [['PESO', '≈ 45 t']], 50: [['OSSO', 'x 74']], 51: [['CARGA NO OSSO', 'x 9']],
       53: [['HALDANE', '1926']], 60: [['ROBERT WADLOW', '2,72 m']], 67: [['1940', '22 anos']], 78: [['GIRAFA', 'pressão x 2']], 81: [['GIGANTE', 'pressão x 10']],
       92: [['COMIDA', '250 mil kcal/dia']], 93: [['PÃOZINHO', '> 1.500/dia']], 101: [['ELEFANTE', '16 h/dia comendo']], 109: [['CORPO', 'x 635'], ['PELE', 'x 74']],
       150: [['IMPACTO', 'caminhão a 100 km/h']], 157: [['SAURÓPODE', '> 15 m · dezenas de t']]}
CAPTITLE = {1: 'A MURALHA', 2: 'DOZE CONTRA QUINZE', 3: 'O PROBLEMA É MATEMÁTICA', 4: 'A CONTA', 5: 'O HOMEM MAIS ALTO', 6: 'O CORAÇÃO', 7: 'A FOME', 8: 'O CALOR', 9: 'A QUEDA', 10: 'A CORDA', 11: 'E OS DINOSSAUROS?', 12: 'A RESPOSTA'}
shots = []; hud = []; cur = None
for idx, x in enumerate(SENT):
    a = int(round(x['s'] * FPS)); b = int(round(x['e'] * FPS)) - 1
    lst = S.get(idx) or [look_out('day', 1)]
    n = len(lst); span = b - a + 1
    for k, sh in enumerate(lst):
        sa = a + span * k // n; sb = a + span * (k + 1) // n - 1
        sh = json.loads(json.dumps(sh)); sh['id'] = f's{idx}_{k}'; sh['a'] = sa; sh['b'] = sb
        L = max(1, sb - sa)
        sh['cam'] = [dict(c, f=sa + int(c.pop('t') * L)) for c in sh['cam']]
        if sh.pop('kick', None): sh['kicks'] = [{'f': sa + 2, 'a': 0.06}]
        sh.pop('hudv', None)
        shots.append(sh)
    cur = HUD.get(idx, cur if idx - max([k for k in HUD if k <= idx] or [0]) < 3 else None)
    hud.append({'a': a, 'b': b, 'hud': HUD.get(idx), 'cap': x['cap']})
for i in range(len(shots) - 1): shots[i]['b'] = shots[i + 1]['a'] - 1
shots[-1]['b'] = TOTAL - 1
if shots[0]['a'] > 0: shots[0]['a'] = 0; shots[0]['cam'][0]['f'] = 0
caps = [{'cap': x['cap'], 'title': CAPTITLE[x['cap']], 'a': int(round(x['s'] * FPS))} for x in T if x['i'] == 0]
json.dump({'total': TOTAL, 'shots': shots}, open('web/shots.json', 'w'), ensure_ascii=False)
json.dump({'fps': FPS, 'total': TOTAL, 'hud': hud, 'caps': caps}, open('work/hud.json', 'w'), ensure_ascii=False)
print('shots', len(shots), 'frames', TOTAL, 'sentences', len(SENT))
