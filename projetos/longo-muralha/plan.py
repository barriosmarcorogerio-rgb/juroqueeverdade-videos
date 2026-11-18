"""Plano de planos — "A Muralha de Pedra Alta" (ep. 1) -> web/shots.json + work/hud.json (12 qps)."""
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
# ---- muralha helpers ----
BX, BZ = -8, WZ - 1.3                       # bell frame on the walkway
OUT = WZ + 2.5                              # outer face of the wall (z = -37.5)
def bell(light, extra=(), ring=True, fov=40, near=False):
    c = cam([BX + 2.6, WY + 2.2, BZ - 3.8], [BX, WY + 2.5, BZ], fov, [BX + 2.3, WY + 2.2, BZ - 3.3], [BX, WY + 2.6, BZ], fov - 3) if not near else cam([BX + 1.2, WY + 2.0, BZ - 2.0], [BX, WY + 2.4, BZ], 34, [BX + 1.0, WY + 2.0, BZ - 1.8], [BX, WY + 2.5, BZ], 32)
    return shot(light, c, list(extra), world={'bell': ring})
def wall_out(light, cast=(), crack=0, fov=50, lookY=7, kick=False):
    return shot(light, cam([4, 3.2, -21], [0, lookY, OUT], fov, [3.6, 3.2, -22], [0, lookY + 0.3, OUT], fov - 2), cast, world={'crack': crack}, kick=kick)
def crack_out(light, cast=(), crack=1):
    return shot(light, cam([-2.2, 3.0, -27], [-6.2, 4.5, OUT], 46, [-2.6, 3.0, -28], [-6.2, 4.5, OUT], 44), cast, world={'crack': crack})
def street(light, cast=(), crack=0, fov=48):
    return shot(light, cam([4.5, 1.8, -58], [-3, 3.0, WZ - 2.5], fov, [4.2, 1.8, -56.5], [-3, 3.2, WZ - 2.5], fov - 2), cast, world={'crack': crack})
def field_out(light, cast=(), fov=48, prints=False):
    return shot(light, cam([5, 2.2, 15], [1, 0.8, 36], fov, [4.6, 2.2, 17], [1, 0.8, 38], fov - 2), cast, world={'prints': prints})
def trail(light, cast=(), fov=46):
    return shot(light, cam([5, 1.7, 70], [1, 2.2, 90], fov, [4.6, 1.7, 72], [1, 2.2, 92], fov - 2), cast, world={'prints': True})
CL = 110                                    # clearing centre z
def clearing(light, cast=(), fov=50, wide=False):
    c = cam([10, 4, CL - 16], [0, 2, CL], fov, [9, 4, CL - 14], [0, 2, CL], fov - 2) if wide else cam([5, 1.7, CL - 9], [0, 1.6, CL - 2], fov, [4.6, 1.7, CL - 8.4], [0, 1.6, CL - 2], fov - 2)
    return shot(light, c, cast)
SLEEP = lambda: [giant('grin', [-6, 0.5, CL + 2], roll=-1.5, sleep=True), giant('tiny', [2, 0.5, CL + 5], roll=1.5, sleep=True), giant('long', [9, 0.5, CL - 1], roll=-1.5, sleep=True)]
def tablet(light, t=0, fov=44, near=False):
    c = cam([0.2, 1.6, 74], [0.4, 1.4, 81], fov) if not near else cam([0.6, 1.1, 78.2], [0.6, 1.0, 81], 36, [0.6, 1.1, 78.5], [0.6, 1.0, 81], 34)
    return shot(light, c, [fx('fxTablet', [0.6, 0, 81], 2.0, t=t), *([who('lucio', [-1.9, 0, 80.2], P('nervous', 'point', 'hang', facing=1, look=0.6))] if not near else [])], world={'prints': True})
def council(light, extra=(), fov=40):
    return shot(light, cam([-0.5, 1.6, -57], [-3, 1.3, -61], fov, [-0.8, 1.6, -57.5], [-3, 1.35, -61], fov - 2), [who('juiz', [-3, 0, -61], P('grin', 'hold', 'hip'), s=1.05), fx('fxCoins', [-1.8, 0, -60.8], 0.9), *extra])
def ledger(light):
    return shot(light, cam([-2.6, 1.25, -58.6], [-2.6, 1.15, -61], 34, [-2.6, 1.2, -59.1], [-2.6, 1.12, -61], 30), [fx('fxLedger', [-2.6, 0, -61], 1.0)])
EXP = lambda z=0, walk=True: [who('ferraz', [-1.2, 0, z], P('stern', 'hip', 'hang'), walk=walk), who('bia', [0.2, 0, z - 0.6], P('stern', 'hang', 'hang', holdR='grapple'), walk=walk), who('tonico', [1.4, 0, z - 1.0], P('nervous', 'hang', 'hang', holdR='sandwich'), walk=walk), who('lucio', [2.6, 0, z + 0.2], P('neutral', 'hang', 'hang'), walk=walk)]
COL = lambda pos, **o: giant('long', pos, s=16.8, **o)  # the 30 m one
p = P; N, D, DW, GD = 'night', 'day', 'dawn', 'gold'
S = {}
# cap 1
S[0] = [city(N)]
S[1] = [wall_out(N, lookY=6)]
S[2] = [look_out(N, 0, walk=False, fov=56) if False else shot(N, cam([1.0, WY + 1.9, WALK - 1.2], [2, WY + 2, 60], 54))]
S[3] = [look_out(N, 0, walk=False)]
S[4] = [bell(N, ring=False)]
S[5] = [wall_one(N, 'tonico', p('smile', 'hang', 'cheek', holdR='sandwich'))]
S[6] = [wall_one(N, 'tonico', p('nervous', 'hang', 'reach', holdR='sandwich'))]
S[7] = [wall_one(N, 'bia', p('stern', 'hang', 'lift', holdR='grapple'), x0=0.65)]
S[8] = [wall_one(N, 'bia', p('neutral', 'hang', 'hang', look=0.6), x0=0.65)]
S[9] = [shot(N, cam([1.0, WY + 1.9, WALK - 1.2], [2, WY + 2, 60], 50))]
S[10] = [wall_duo(N, p('grin', 'hip', 'cheek', holdR='sandwich'), p('stern', 'hip', 'hang', facing=-1, look=-0.5))]
S[11] = [wall_duo(N, p('smile', 'hip', 'hang', holdR='sandwich'), p('neutral', 'hang', 'hang', facing=-1)), city(N)]
S[12] = [bell(N)]; S[13] = [bell(N, near=True)]; S[14] = [wall_duo(N, p('shock', 'cheek', 'hang', holdR='sandwich'), p('shock', 'hang', 'hang'))]
# cap 2
S[15] = [wall_one(N, 'tonico', p('shock', 'cheek', 'hang'))]
S[16] = [look_out(N, 0, walk=False, fov=46)]
S[17] = [wall_one(N, 'bia', p('nervous', 'hang', 'hang', look=0.4), x0=0.65)]
S[18] = [field(N, 0, walk=False)]
S[19] = [gclose(N, 'tiny', 50)]; S[20] = [gclose(N, 'long', 60)]; S[21] = [gclose(N, 'grin', 40)]
S[22] = [field(N, 0)]; S[23] = [gclose(N, 'grin', 40, mouth=0.3)]; S[24] = [look_out(N, 1)]
S[25] = [wall_one(N, 'ferraz', p('shock', 'hold', 'lift', holdR='grapple'), x0=2.0)]
S[26] = [wall_one(N, 'ferraz', p('stern', 'hip', 'point'), x0=2.0)]
S[27] = [wall_one(N, 'ferraz', p('stern', 'point', 'hip'), x0=2.0)]
S[28] = [wall_duo(N, p('nervous', 'hang', 'hang', holdR='grapple'), p('stern', 'lift', 'hang', holdR='grapple', facing=-1)), field(N, 1)]
S[28][1]['kick'] = 1
S[29] = [shot(N, cam([14, 3, 30], [0, 4, 20], 48), cast=[giant('grin', [0, -3.5, 20], down=True)], kick=True)]
S[30] = [shot(N, cam([14, 3, 30], [0, 6, 20], 48), cast=[giant('grin', [0, -3.5, 20], to=[0, 0, 20], steam=True)]), gclose(N, 'grin', 40, steam=True)]
S[31] = [wall_out(N, [giant('grin', [6, 0, OUT + 3]), giant('tiny', [-6, 0, OUT + 4], arms='reach'), giant('long', [15, 0, OUT + 5])])]
# cap 3
S[32] = [field(N, 2, walk=False)]
S[33] = [shot(N, cam([-18, 1.8, -12], [-4, 14, OUT + 8], 64, [-17.5, 1.8, -13], [-4, 15, OUT + 8], 62), cast=[COL([-4, 0, OUT + 8])])]
S[34] = [shot(N, cam([1.0, WY + 1.6, WALK - 1.4], [-2, WY + 9, OUT + 8], 64), cast=[COL([-4, 0, OUT + 8]), who('tonico', [0.2, WY, WALK + 0.8], P('shock', 'up', 'up', look=-0.3))])]
S[35] = [shot(N, cam([-16, 2, -10], [0, 12, OUT + 6], 64, [-15.5, 2, -11], [0, 12, OUT + 6], 62), cast=[COL([3, 0, OUT + 6])], kick=True)]
S[36] = [shot(N, cam([2, 1.8, -54], [0, 4.5, WZ - 3], 46), cast=[who('pobre', [3, 0, -48], P('shock', 'cheek', 'cheek'))], kick=True)]
S[37] = [shot(N, cam([-18, 1.8, -12], [-4, 14, OUT + 8], 62, [-18, 1.8, -12], [-4, 14, OUT + 8], 58), cast=[COL([-4, 0, OUT + 8], to=[-30, 0, OUT + 30])])]
G3W = lambda **o: [giant('grin', [-6, 0, OUT + 3], arms='reach', **o), giant('tiny', [6, 0, OUT + 3.5], arms='reach'), giant('long', [15, 0, OUT + 5], arms='up')]
S[38] = [wall_out(N, G3W(), kick=True)]
S[39] = [wall_duo(N, p('shock', 'cheek', 'hang'), p('shock', 'hang', 'hang'), extra=()), ]
S[39][0]['kick'] = 1
S[40] = [wall_out(N, G3W(), kick=True)]
S[41] = [crack_out(N, [giant('grin', [-12, 0, OUT + 3.5], arms='reach')], crack=1)]
S[42] = [shot(N, cam([4, WY + 1.8, WALK - 4], [8, WY + 4, OUT + 4], 52), cast=[giant('long', [12, 0, OUT + 4], arms='reach'), who('soldado', [7, WY, WALK], p('shock', 'up', 'hang')), who('soldado', [9, WY, WALK + 0.3], p('shock', 'cheek', 'hang'))])]
for i, x in zip((43, 44, 45), (7, 9, 11)):
    S[i] = [shot(N, cam([x - 2, WY + 1.7, WALK - 3], [x, WY + 2.5, WALK], 44), cast=[who('soldado', [x, WY, WALK], p('shock', 'up', 'up'), to=[x + 0.5, WY + 4, WALK + 2])])]
S[46] = [shot(N, cam([13, 9, OUT + 14], [12, 9, OUT + 4], 44), cast=[giant('long', [12, 0, OUT + 4], arms='reach'), fx('fxSack', [10.5, 6.5, OUT + 5], 1.4)])]
S[47] = [shot(N, cam([11, 8, OUT + 10], [10.5, 7.5, OUT + 5], 40), cast=[fx('fxSack', [10.5, 6.5, OUT + 5], 1.4), giant('long', [12, 0, OUT + 4])])]
S[48] = [wall_one(N, 'bia', p('stern', 'lift', 'point', holdR='grapple', hookFire=1), x0=0.65)]
S[49] = [shot(N, cam([4, WY + 1.8, WALK - 4], [8, WY + 4, OUT + 4], 50), cast=[giant('long', [12, 0, OUT + 4]), who('bia', [3, WY, WALK], p('stern', 'up', 'hang', holdR='grapple', hookFire=1))])]
S[50] = [wall_duo(N, p('shock', 'hang', 'hang'), p('stern', 'up', 'hang', holdR='grapple', facing=-1))]
S[51] = [shot(N, cam([0, WY + 2, WALK - 6], [3, WY + 4, OUT], 54), cast=[who('tonico', [0, WY, WALK], p('shock', 'up', 'up'), to=[5, WY + 6, OUT + 3], spin=True)])]
S[52] = [shot(N, cam([4, WY + 3, OUT - 6], [6, WY + 3, OUT + 3], 50), cast=[giant('tiny', [6, 0, OUT + 3.5]), who('tonico', [6, WY + 5, OUT + 3.9], p('shock', 'up', 'up'), to=[6, WY + 0.6, OUT + 3.9], spin=True)])]
# cap 4
TOP = lambda e='shock': [giant('tiny', [6, 0, OUT + 3.5], look=0.0), who('tonico', [6, 12.2, OUT + 3.9], p(e, 'cheek', 'cheek'), s=1.0)]
S[53] = [shot(N, cam([8.5, 11, OUT + 10], [6, 11.5, OUT + 3.5], 40), cast=TOP())]
S[54] = [shot(N, cam([6.8, 13.8, OUT + 6.5], [6, 12.6, OUT + 3.9], 36), cast=TOP('nervous'))]
S[55] = [shot(N, cam([8.5, 11, OUT + 10], [6, 11.5, OUT + 3.5], 34), cast=TOP('squeeze'))]
S[56] = [shot(N, cam([10, 11, OUT + 12], [4, 12, OUT + 2], 48), cast=[giant('tiny', [6, 0, OUT + 3.5]), who('bia', [12, 13, OUT + 4], p('stern', 'up', 'reach', holdR='grapple'), to=[0, WY, WALK + 1])])]
S[57] = [look_out(DW, 1, walk=False)]
S[58] = [field(DW, 1, walk=False)]
S[59] = [field(DW, 1, walk=False, flip=True)]
S[60] = [shot(DW, cam([1.0, WY + 1.9, WALK - 1.2], [2, WY + 5, 40], 52), cast=[giant('grin', [-4, 0, 60], walk=True, to=[-4, 0, 90]), giant('tiny', [8, 0, 66], walk=True, to=[8, 0, 96]), giant('long', [18, 0, 72], walk=True, to=[18, 0, 100]), fx('fxSack', [18, 7, 71], 1.4, to=[18, 7, 99])])]
S[61] = [crack_out(DW, crack=2)]
S[62] = [wall_one(DW, 'soldado', p('nervous', 'hang', 'hang'), x0=7)]
S[63] = [bell(DW, ring=False, near=True)]
S[64] = [wall_duo(DW, p('neutral', 'hang', 'hang'), p('stern', 'hip', 'hang', facing=-1), x0=0, extra=[who('ferraz', [2.2, WY, WALK + 0.3], p('stern', 'point', 'hip', facing=-1))])]
S[65] = [wall_one(DW, 'ferraz', p('stern', 'point', 'hip'), x0=2.0)]
S[66] = [wall_one(DW, 'ferraz', p('stern', 'hip', 'point'), x0=2.0)]
S[67] = [wall_duo(DW, p('shock', 'hang', 'hang'), p('grin', 'hang', 'hang', facing=-1))]
S[68] = [wall_one(DW, 'bia', p('stern', 'up', 'hang', holdR='grapple'), x0=0.65)]
S[69] = [wall_one(DW, 'tonico', p('nervous', 'up', 'up', blink=1))]
# cap 5 (day, outside)
S[70] = [wall_out(D, lookY=4.5, fov=40)]
S[71] = [field_out(D, [*EXP(-30)])]
S[72] = [shot(D, cam([1, 1.5, -24], [1, 1.2, -30.5], 44), cast=EXP(-30.5, walk=False) + [who('soldado', [-2.4, 0, -31.2], p('neutral', 'hang', 'hang')), who('soldado', [4.0, 0, -31.2], p('neutral', 'hang', 'hang'))])]
S[73] = [shot(D, cam([2, 0.8, 0], [0, 6, 30], 60), cast=[])]
S[74] = [shot(D, cam([2.5, 1.0, 26], [1.4, 1.0, 22], 44), cast=[who('tonico', [1.4, 0, 22], p('nervous', 'hang', 'hang', holdR='sandwich'))])]
S[75] = [trail(D, fov=60)]
S[76] = [field_out(D, prints=True)]
S[77] = [shot(D, cam([6.5, 2.6, 21], [3, 0.4, 27], 50), cast=[who('tonico', [5, 0, 27], p('shock', 'cheek', 'hang'))], world={'prints': True})]
S[78] = [trail(D)]
S[79] = [trail(D, EXP(78))]
S[80] = [shot(D, cam([2.4, 1.6, 76.5], [1.4, 1.4, 79], 36), cast=[who('tonico', [1.4, 0, 79], p('nervous', 'hang', 'cheek', holdR='sandwich', chew=1))], world={'prints': True})]
S[81] = [tablet(D)]; S[82] = [tablet(D)]; S[83] = [tablet(D, near=True)]
S[84] = [tablet(D, near=True)]; S[85] = [tablet(D, near=True)]; S[86] = [tablet(D, near=True)]; S[87] = [tablet(D, near=True)]
S[88] = [shot(D, cam([-7.4, WY + 2.2, BZ - 3.5], [BX, WY + 2.5, BZ], 40), world={'bell': False}), tablet(D, near=True)]
# cap 6
for i in range(89, 95): S[i] = [tablet(D, near=(i % 2 == 0))]
S[93] = [shot(D, cam([2, 1.6, 76], [0, 1.4, 81], 44), cast=[who('ferraz', [-0.8, 0, 79.6], p('shock', 'cheek', 'hang')), who('lucio', [0.8, 0, 79.8], p('nervous', 'point', 'hang'))], world={'prints': True})]
S[94] = [shot(D, cam([2, 1.6, 76], [0, 1.4, 81], 40), cast=[who('bia', [0, 0, 79.5], p('stern', 'hip', 'hang', holdR='grapple'))], world={'prints': True})]
S[95] = [clearing(D, SLEEP() + [fx('fxSack', [3, 0, CL - 3], 1.2)] + EXP(CL - 12, walk=False), wide=True)]
S[96] = [clearing(D, SLEEP(), fov=56)]
S[97] = [shot(D, cam([-3, 2, CL - 4], [-6, 1.5, CL + 2], 44), cast=SLEEP())]
S[98] = [clearing(D, SLEEP() + [fx('fxSack', [3, 0, CL - 3], 1.2)])]
S[99] = [shot(D, cam([3.4, 1.1, CL - 6], [3, 1.0, CL - 3], 40), cast=[fx('fxSack', [3, 0, CL - 3], 1.2)])]
S[100] = S[99]; S[101] = S[99]
S[102] = [shot(D, cam([0.4, 1.6, CL - 10.5], [0, 1.4, CL - 8], 34), cast=[who('bia', [0, 0, CL - 8], p('nervous', 'hang', 'hang', look=0.8))])]
S[103] = [clearing(D, SLEEP(), wide=True)]
S[104] = [shot(D, cam([0.4, 1.6, CL - 10.5], [0, 1.4, CL - 8], 30), cast=[who('bia', [0, 0, CL - 8], p('nervous', 'hang', 'hang', look=-0.3, blink=1))])]
# cap 7 — council (night inside the city)
S[105] = [shot(N, cam([30, 14, -60], [10, 6, -88], 44)), council(N)]
S[106] = [council(N)]; S[107] = [ledger(N)]; S[108] = [ledger(N)]
S[109] = [city(N)]; S[110] = [field(N, 1)]; S[111] = [street(N, [who('velha', [-1, 0, -50], p('nervous', 'hang', 'hang')), who('padeiro', [1.5, 0, -51], p('nervous', 'hang', 'hang'))])]
S[112] = [city(N)]; S[113] = [shot(N, cam([-1.4, 1.1, -59.3], [-1.8, 0.6, -60.8], 36), cast=[fx('fxCoins', [-1.8, 0, -60.8], 0.9)])]
S[114] = [council(N, fov=34)]; S[115] = [crack_out(N, crack=2)]
# cap 8 — clearing, sunset
S[116] = [clearing(GD, SLEEP() + [fx('fxSack', [3, 0, CL - 3], 1.2, t=1), who('bia', [1.8, 0, CL - 4], p('stern', 'reach', 'hang')), who('tonico', [0.4, 0, CL - 4.6], p('nervous', 'hang', 'hang'))])]
S[117] = [shot(GD, cam([0.8, 1.6, CL - 7], [0.4, 1.4, CL - 4.6], 32), cast=[who('tonico', [0.4, 0, CL - 4.6], p('nervous', 'cheek', 'cheek'))])]
S[118] = [clearing(GD, [fx('fxSack', [3, 0, CL - 3], 1.2, t=1), who('soldado', [4.5, 0, CL - 3.5], p('nervous', 'hang', 'hang'), walk=True, to=[6, 0, CL - 7]), who('soldado', [2.0, 0, CL - 4.5], p('nervous', 'hang', 'hang'), walk=True, to=[0, 0, CL - 8])])]
S[119] = [shot(GD, cam([2, 1.5, CL - 12], [0, 6, CL + 60], 56))]
S[120] = [clearing(GD, EXP(CL - 6, walk=False))]
S[121] = [bell(GD, [who('juiz', [BX + 0.6, WY, BZ - 0.4], p('grin', 'up', 'hip'))])]; S[122] = [bell(GD, near=True)]; S[123] = [bell(GD)]
S[124] = [clearing(GD, [giant('grin', [-6, 0.5, CL + 2], roll=-1.5), giant('tiny', [2, 0.5, CL + 5], roll=1.5), giant('long', [9, 0.5, CL - 1], roll=-1.5)], wide=True)]
S[125] = [clearing(GD, [giant('grin', [-6, 0, CL + 2], roll=-1.5, rollTo=0), giant('tiny', [2, 0, CL + 5], roll=1.5, rollTo=0), giant('long', [9, 0, CL - 1], roll=-1.5, rollTo=0)], wide=True)]
S[126] = [shot(GD, cam([0, 1.6, CL - 15], [0, 1.5, CL - 12], 40), cast=[who('ferraz', [0, 0, CL - 12], p('shock', 'point', 'up'))])]
S[127] = [trail(GD, [*EXP(95, walk=True)])]
S[128] = [shot(GD, cam([10, 3, 100], [0, 6, 88], 54), cast=[who('bia', [6, 7, 96], p('stern', 'up', 'reach', holdR='grapple'), to=[-4, 6, 82])])]
S[129] = [shot(GD, cam([4, 1.5, 70], [1, 1.2, 80], 44), cast=[who('tonico', [1, 0, 88], p('shock', 'hang', 'hang'), walk=True, to=[1.5, 0, 74])])]
S[130] = [shot(GD, cam([3, 2, 64], [0, 8, 100], 58), cast=[giant('grin', [-3, 0, 108], walk=True, to=[-3, 0, 90]), giant('tiny', [6, 0, 112], walk=True, to=[6, 0, 94]), giant('long', [12, 0, 116], walk=True, to=[12, 0, 98])], kick=True)]
# cap 9 — night again, the breach
S[131] = [field_out(N, EXP(-20) + [giant('grin', [-3, 0, 20], walk=True, to=[-3, 0, 8])])]
S[132] = [wall_out(N, lookY=4.5, fov=40, kick=True)]
S[133] = [crack_out(N, crack=2)]
ARMIN = lambda t=0: fx('fxArm', [-7.7, 1.4, WZ - 2.9], 6.6, t=t)
S[134] = [crack_out(N, [giant('grin', [-6.2, 0, OUT + 3], arms='reach')], crack=2), street(N, [ARMIN()], crack=2)]
S[135] = [street(N, [ARMIN(0.4), fx('fxStall', [-2.5, 0, -47], 1.1, t=1)], crack=2)]
S[136] = [street(N, [ARMIN(0.6), who('velha', [0, 0, -50], p('shock', 'up', 'up'), walk=True, to=[3, 0, -56]), who('padeiro', [2, 0, -49], p('shock', 'cheek', 'cheek'), walk=True, to=[5, 0, -55]), who('pobre', [-1, 0, -48], p('shock', 'up', 'hang'), walk=True, to=[1, 0, -55])], crack=2)]
S[137] = [shot(N, cam([-2.2, 1.6, -50], [-5.5, 1.8, -45], 44), cast=[ARMIN(0.2), who('velha', [-3.6, 0, -46.5], p('stern', 'up', 'hang', holdR='shovel'))], world={'crack': 2}, kick=True)]
S[138] = [shot(N, cam([-2.2, 1.6, -50], [-5.5, 1.8, -45], 40), cast=[ARMIN(0.8), who('velha', [-3.6, 0, -46.5], p('shock', 'cheek', 'hang', holdR='shovel'))], world={'crack': 2})]
S[139] = [street(N, [who('tonico', [1, 0, -50], p('shock', 'point', 'hang'))], crack=2)]
S[140] = [shot(N, cam([1.6, 1.7, -53], [1, 1.5, -50], 36), cast=[who('tonico', [1, 0, -50], p('shock', 'up', 'point'))])]
S[141] = [shot(N, cam([1.6, 1.7, -53], [1, 1.5, -50], 36), cast=[who('tonico', [1, 0, -50], p('nervous', 'point', 'hang', look=0.7))]), shot(N, cam([-5, 2, -56], [BX, WY + 2.5, BZ], 40), world={'bell': False})]
S[142] = [bell(N, [who('juiz', [BX + 0.6, WY, BZ - 0.4], p('grin', 'up', 'hip'))], ring=False)]
# cap 10 — the tower
S[143] = [shot(N, cam([BX + 3, WY - 4, BZ - 8], [BX, WY, BZ], 50), cast=[who('tonico', [BX + 1.5, WY - 6, BZ - 1.5], p('nervous', 'up', 'up'), to=[BX + 1.5, WY, BZ - 1.5])])]
def tower(light, cast, ring=False, fov=46):
    return shot(light, cam([BX + 1.8, WY + 1.7, BZ - 4.4], [BX + 0.9, WY + 1.6, BZ - 0.5], fov, [BX + 1.7, WY + 1.7, BZ - 4.0], [BX + 0.9, WY + 1.65, BZ - 0.5], fov - 2), cast, world={'bell': ring})
TOW = lambda te='stern', je='grin', jl='up', tl='point': [who('juiz', [BX + 0.6, WY, BZ - 0.4], p(je, jl, 'hip')), who('tonico', [BX + 2.0, WY, BZ - 0.8], p(te, tl, 'hang', facing=-1))]
S[144] = [tower(N, TOW())]
S[145] = [tower(N, TOW('nervous', 'stern', 'up', 'hang'))]
S[146] = [tower(N, TOW('stern', 'stern'))]
S[147] = [tower(N, TOW('stern', 'nervous'))]
S[148] = [tower(N, TOW('stern', 'grin', 'point'))]
S[149] = [tower(N, TOW('shock', 'grin', 'reach', 'up'))]
S[150] = [shot(N, cam([BX + 4, WY + 2.4, BZ - 5], [BX, WY + 2.2, BZ], 44), cast=[*TOW('shock', 'shock'), who('bia', [BX + 6, WY + 3, BZ - 2], p('stern', 'up', 'reach', holdR='grapple', hookFire=1))])]
S[151] = [wall_one(N, 'bia', p('stern', 'lift', 'up', holdR='grapple', hookFire=1), x0=-4)]
S[152] = [tower(N, TOW('shock', 'shock'), ring=True)]
S[153] = [bell(N, near=True)]
# cap 11
S[154] = [tower(N, TOW('nervous', 'stern', 'up', 'up'), ring=True)]
S[155] = [tower(N, TOW('grin', 'shock') + [who('ferraz', [BX - 0.6, WY, BZ - 0.8], p('stern', 'reach', 'reach', facing=1))], ring=True)]
S[156] = [bell(N, near=True)]
S[157] = [tower(N, [who('tonico', [BX + 0.5, WY + 0.4, BZ - 0.2], p('squeeze', 'up', 'up'))], ring=True)]
S[158] = [bell(N, near=True)]; S[159] = [bell(N)]
S[160] = [wall_out(N, G3W())]
S[161] = [wall_out(N, [giant('grin', [-6, 0, OUT + 3], look=-0.6), giant('tiny', [6, 0, OUT + 3.5], look=-0.6), giant('long', [15, 0, OUT + 5], look=-0.6)])]
S[162] = [bell(N, near=True)]
S[163] = [gclose(N, 'grin', 30, mouth=0.8)]
S[164] = [gclose(N, 'grin', 30, mouth=1.0, fov=30)]
S[165] = [bell(N)]; S[166] = [bell(N, near=True)]
S[167] = [wall_out(N, [giant('grin', [-6, 0, OUT + 3], roll=0, rollTo=-1.4, rollEase='in', sleep=True), giant('tiny', [6, 0, OUT + 3.5], roll=0, rollTo=1.45, rollEase='in', sleep=True), giant('long', [15, 0, OUT + 5], roll=0, rollTo=-1.45, rollEase='in', sleep=True)], crack=2)]
S[168] = [wall_out(N, [giant('grin', [-10, 0.6, OUT + 2.6], roll=-1.5, sleep=True), giant('tiny', [8, 0.5, OUT + 4], roll=1.5, sleep=True)], crack=2, lookY=4, kick=True)]
S[169] = [city(N)]; S[170] = [street(N, crack=0)]
# cap 12
S[171] = [shot(DW, cam([70, 48, 60], [0, 8, -50], 44))]
S[172] = [street(DW, [who('juiz', [0, 0, -50], p('nervous', 'hold', 'hang'), walk=True, to=[2, 0, -58]), who('soldado', [1.2, 0, -49.6], p('stern', 'hang', 'hang'), walk=True, to=[3.2, 0, -57.6]), fx('fxCoins', [-0.2, 0.4, -49.8], 0.5, to=[1.8, 0.4, -57.8])])]
S[173] = [street(DW, [who('lucio', [0, 0, -50], p('stern', 'hold', 'hang')), fx('fxLedger', [0.9, 0.9, -49.8], 0.5), who('velha', [-2, 0, -52], p('shock', 'cheek', 'hang')), who('padeiro', [2.6, 0, -52.5], p('shock', 'hang', 'hang'))])]
S[174] = [street(DW, [who('velha', [-2, 0, -52], p('stern', 'hip', 'hang')), who('padeiro', [2.6, 0, -52.5], p('stern', 'hip', 'hip')), who('pobre', [0.6, 0, -53], p('stern', 'point', 'hang'))])]
S[175] = [city(DW)]
S[176] = [street(D, [who('soldado', [0, 0, -46], p('smile', 'up', 'hang'), walk=True, to=[1, 0, -52]), who('soldado', [1.5, 0, -45], p('grin', 'hang', 'up'), walk=True, to=[2.5, 0, -51])])]
S[177] = [wall_duo(D, p('grin', 'hip', 'hang'), p('smile', 'hang', 'hang', facing=-1), extra=[who('ferraz', [2.2, WY, WALK + 0.3], p('smile', 'give', 'hip', facing=-1))])]
S[178] = [wall_one(D, 'tonico', p('smile', 'cheek', 'hang'))]
S[179] = [shot(D, cam([1.0, WY + 1.9, WALK - 1.2], [2, WY + 1, OUT + 8], 54), cast=[giant('grin', [-6, 0.5, OUT + 6], roll=-1.5, sleep=True), giant('tiny', [6, 0.5, OUT + 9], roll=1.5, sleep=True)]), wall_one(D, 'bia', p('neutral', 'hang', 'hang', look=0.6), x0=0.65)]
S[180] = [wall_duo(GD, p('nervous', 'hang', 'hang'), p('stern', 'hang', 'hang', facing=-1)), lab(GD, P('nervous', 'hold', 'hang', facing=1, look=0.5))]
S[180][1]['cast'][1] = fx('fxTablet', [-2.1, WY + 0.2, WALK + 0.1], 0.8, t=1)
S[181] = [shot(GD, cam([-2.1, WY + 0.75, WALK - 1.4], [-2.1, WY + 0.75, WALK + 0.1], 34), cast=[fx('fxTablet', [-2.1, WY + 0.2, WALK + 0.1], 0.8, t=1)])]
S[182] = [shot(GD, cam([-1.75, WY + 0.6, WALK - 0.9], [-1.75, WY + 0.6, WALK + 0.1], 26), cast=[fx('fxTablet', [-2.1, WY + 0.2, WALK + 0.1], 0.8, t=1)])]
S[183] = S[182]
S[184] = [shot(GD, cam([1.0, WY + 1.9, WALK - 1.2], [0, 14, 170], 36), cast=[COL([0, -8, 170])])]
S[185] = [shot(GD, cam([6, 14, 60], [0, 16, 170], 26), cast=[COL([0, -8, 170], look=-0.4)])]
S[186] = [wall_one(GD, 'bia', p('stern', 'hang', 'lift', holdR='grapple', look=0.5), x0=0.65)]
S[187] = [shot(GD, cam([0.85, WY + 1.55, WALK - 1.1], [0.65, WY + 1.5, WALK], 26), cast=[who('bia', [0.65, WY, WALK], p('nervous', 'hang', 'lift', holdR='grapple', look=0.5))]), shot(GD, cam([1.0, WY + 1.9, WALK - 1.2], [0, 14, 170], 24), cast=[COL([0, -8, 170], look=-0.4)])]
# ---- hud callouts (number cards) ----
HUD = {0: [['MURALHA', '12 m']], 22: [['GIGANTE', '15 m']], 33: [['GIGANTE', '30 m']], 92: [['SINO x 3', 'ACORDA'], ['SINO x 7', 'DORME']], 113: [['MEDO', '100 anos']]}
CAPTITLE = {1: 'O SINO', 2: 'ELES VOLTARAM', 3: 'O QUARTO GIGANTE', 4: 'O SACO', 5: 'LÁ FORA', 6: 'A PEDRA', 7: 'O CONSELHEIRO', 8: 'CORRE!', 9: 'A RACHADURA', 10: 'A TORRE', 11: 'SETE BADALADAS', 12: 'CONTINUA'}
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
