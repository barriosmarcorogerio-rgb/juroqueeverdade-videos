"""Abertura 'TITANS ATTACKING' (9 s, 12 qps): titã correndo -> agarra um soldado -> come (sugerido) -> título sobre o colossal na muralha."""
import json
WZ, WY, WALK = -40, 12, -39.6; OUT = WZ + 2.5
def cam(p0, l0, f0, p1=None, l1=None, f1=None): return [{'t': 0, 'pos': p0, 'look': l0, 'fov': f0}, {'t': 1, 'pos': p1 or p0, 'look': l1 or l0, 'fov': f1 or f0, 'roll': 0}]
def P(e='neutral', L='hang', R='hang', **k): d = {'expr': e, 'L': L, 'R': R}; d.update(k); return d
def who(w, pos, pose, **kw): d = {'who': w, 'pos': pos, 's': 1.0, 'pose': pose}; d.update(kw); return d
def giant(kind, pos, s=None, **o):
    S = s or {'grin': 7.6, 'tiny': 7.2, 'long': 8.4}[kind]; sk = {'grin': '#e6b08a', 'tiny': '#d29a74', 'long': '#f0c8a8'}[kind]; hr = {'grin': '#4a3424', 'tiny': '#2b211c', 'long': '#b07a3a'}[kind]
    ex = {k: o.pop(k) for k in list(o) if k in ('to', 'roll', 'rollTo', 'rollEase', 'walk', 'flip')}
    oo = {'kind': kind, 'skin': sk, 'hair': hr}; oo.update(o); d = {'fx': 'fxGiant', 'pos': pos, 's': S, 'o': oo, 'shadow': True}; d.update(ex); return d
SH = [  # (frames, light, cam, cast, kicks)
 (30, 'night', cam([1.5, 1.0, OUT + 34], [1, 7.5, OUT + 70], 52, [1.4, 1.0, OUT + 33], [1, 9, OUT + 60], 56), [giant('grin', [2, 0, OUT + 95], walk=True, to=[1.5, 0, OUT + 44], arms='reach')], [6, 12, 18, 24, 29]),
 (12, 'night', cam([9, 1.2, OUT + 24], [2, 6, OUT + 34], 58), [giant('grin', [2, 0, OUT + 40], walk=True, to=[2, 0, OUT + 34], arms='reach')], [3, 9]),
 (20, 'night', cam([-6, 10.6, OUT + 13], [-6, 10.8, OUT + 3], 46, [-6, 10.9, OUT + 11.5], [-6, 11, OUT + 3], 40), [giant('grin', [-6, 0, OUT + 3], arms='up', mouth=1), who('soldado', [-4.6, 6.5, OUT + 3.4], P('shock', 'up', 'up'), to=[-6, 10.9, OUT + 2.85])], [1]),
 (10, 'night', cam([-6, 11.2, OUT + 9], [-6, 11.4, OUT + 3], 34), [giant('grin', [-6, 0, OUT + 3], arms='up', mouth=0.15), who('soldado', [-6.5, 11.2, OUT + 3.05], P('shock', 'up', 'up'), roll=1.45)], [0, 4]),
 (36, 'night', cam([13, WY + 1.7, WALK - 1.8], [0, WY + 3.5, WZ + 6], 52, [12.4, WY + 1.6, WALK - 1.6], [0, WY + 5, WZ + 6], 46), [giant('long', [0, -15, WZ + 7], s=16.8, to=[0, -11.5, WZ + 7]), who('tonico', [9.5, WY, WALK], P('shock', 'up', 'hang', look=-0.6))], [2, 20]),
]
shots = []; f = 0
for i, (n, light, c, cast, kk) in enumerate(SH):
    a, b = f, f + n - 1; L = max(1, b - a)
    shots.append({'light': light, 'cam': [dict(x, f=a + int(x.pop('t') * L)) for x in json.loads(json.dumps(c))], 'cast': cast, 'world': {}, 'set': 'quintal', 'id': f'ab{i}', 'a': a, 'b': b,
                  'kicks': [{'f': a + k, 'a': 0.05} for k in kk]}); f += n
json.dump({'total': f, 'shots': shots}, open('web/shots.json', 'w'), ensure_ascii=False); print('abertura', f, 'quadros', f / 12, 's')
