export const INK = "#241726";
export const SKIN = "#ffe2c2";
const WHITE = "#ffffff";
const MOUTH = "#5a1e28";
const TONGUE = "#e86e78";
const SH_SKIN = [
    0.96,
    0.86,
    0.84
];
const SH_CLOTH = [
    0.64,
    0.66,
    0.74
];
const SH_FELT = [
    0.62,
    0.62,
    0.7
];
const rad = (d)=>d * Math.PI / 180;
const clamp = (x, a, b)=>Math.max(a, Math.min(b, x));
export const mul = (c, m)=>{
    const n = parseInt(c.slice(1), 16);
    const ch = (v, k)=>Math.min(255, Math.round(v * k)).toString(16).padStart(2, "0");
    return `#${ch(n >> 16 & 255, m[0])}${ch(n >> 8 & 255, m[1])}${ch(n & 255, m[2])}`;
};
export const shade = (c, k)=>mul(c, [
        k,
        k,
        k
    ]);
export const mix = (a, b, t)=>{
    const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
    const ch = (s)=>Math.round((A >> s & 255) * (1 - t) + (B >> s & 255) * t).toString(16).padStart(2, "0");
    return `#${ch(16)}${ch(8)}${ch(0)}`;
};
const rnd = (seed, k)=>{
    const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453;
    return x - Math.floor(x);
};
const rotPts = (pts, a, cx, cy)=>pts.map(([x, y])=>[
            cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a),
            cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)
        ]);
const rotAbout = (q, a, c)=>rotPts([
        q
    ], a, c[0], c[1])[0];
const lerp2 = (a, b, t)=>[
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t
    ];
const curve = (a, k, b, n = 10)=>{
    const c = [
        2 * k[0] - (a[0] + b[0]) / 2,
        2 * k[1] - (a[1] + b[1]) / 2
    ], out = [];
    for(let i = 0; i <= n; i++){
        const t = i / n, s = 1 - t;
        out.push([
            s * s * a[0] + 2 * s * t * c[0] + t * t * b[0],
            s * s * a[1] + 2 * s * t * c[1] + t * t * b[1]
        ]);
    }
    return out;
};
export const RIFLEMAN = {
    jacket: "#357650",
    pants: "#3d4440",
    boots: INK,
    hat: "shako",
    belt: "#f1efe6",
    buttons: "#d9dde0",
    rifle: true
};
export const OFFICER = {
    ...RIFLEMAN,
    hat: "shako_tall",
    buttons: "#e8c45a",
    sash: "#c0353a",
    sword: true,
    moustache: "#4a3020",
    rifle: false,
    belt: null,
    build: "stout"
};
export const KID = {
    jacket: "#f08a2c",
    pants: "#3b5b9a",
    boots: "#f4f1ea",
    hat: "cap",
    cap: "#e2453c",
    build: "kid"
};
export const PARENT = {
    jacket: "#7b5ac9",
    pants: "#3b3f52",
    boots: "#5a3b2a",
    hat: "hair",
    hair: "#5a3b2a"
};
export const SKINS = [
    SKIN,
    "#f5c9a0",
    "#ecd0b6",
    "#c99067"
];
export const soldier = (v = 0, extra = {})=>{
    const o = {
        ...RIFLEMAN,
        skin: SKINS[v % 4]
    };
    if (v % 4 === 1) o.moustache = "#4a3426";
    if (v % 4 === 3) o.moustache = "#2a201a";
    return {
        ...o,
        ...extra
    };
};
export const townsfolk = (v = 0)=>{
    const coats = [
        "#3f6fb5",
        "#8c3b4a",
        "#5d7a3a",
        "#b5653f",
        "#2f5f6a",
        "#7b5ac9"
    ];
    const o = {
        jacket: coats[v % 6],
        pants: "#3b3f52",
        boots: "#4a3426",
        skin: SKINS[v % 4]
    };
    return v % 2 ? {
        ...o,
        hat: "bonnet",
        dress: [
            "#d9a441",
            "#c25a7a",
            "#5a8fc2"
        ][v % 3]
    } : {
        ...o,
        hat: "tophat"
    };
};
export class Pen {
    g;
    ol = 12;
    rot = null;
    constructor(g){
        this.g = g;
    }
    P(x, y) {
        if (!this.rot) return [
            x,
            y
        ];
        const r = this.rot, a = r[0], cx = r[1], cy = r[2], dx = r.length > 3 ? r[3] : 0, dy = r.length > 4 ? r[4] : 0, c = Math.cos(a), s = Math.sin(a);
        return [
            cx + (x - cx) * c - (y - cy) * s + dx,
            cy + (x - cx) * s + (y - cy) * c + dy
        ];
    }
    path(pts, close) {
        const g = this.g;
        g.beginPath();
        pts.forEach((p, i)=>{
            const [x, y] = this.P(p[0], p[1]);
            if (i) g.lineTo(x, y);
            else g.moveTo(x, y);
        });
        if (close) g.closePath();
    }
    poly(pts, fill, ol) {
        const g = this.g, w = ol ?? this.ol;
        this.path(pts, true);
        if (fill) {
            g.fillStyle = fill;
            g.fill();
        }
        if (w) {
            g.lineWidth = w;
            g.strokeStyle = INK;
            g.lineJoin = "round";
            g.stroke();
        }
    }
    ell(cx, cy, rx, ry, fill, ol, a0 = 0, a1 = 360, rot = 0) {
        this.poly(ellPts(cx, cy, rx, ry, a0, a1, rot), fill, ol);
    }
    line(pts, fill, w, ink = true) {
        const g = this.g;
        g.lineCap = "round";
        g.lineJoin = "round";
        if (ink) {
            this.path(pts, false);
            g.strokeStyle = INK;
            g.lineWidth = w + 2 * this.ol * 0.9;
            g.stroke();
        }
        this.path(pts, false);
        g.strokeStyle = fill;
        g.lineWidth = w;
        g.stroke();
    }
    stroke(pts, w, fill = INK) {
        const g = this.g;
        g.lineCap = "round";
        g.lineJoin = "round";
        this.path(pts, false);
        g.strokeStyle = fill;
        g.lineWidth = w;
        g.stroke();
    }
    arc(cx, cy, rx, ry, a0, a1, w, fill = INK) {
        const pts = [];
        for(let i = 0; i <= 24; i++)pts.push([
            cx + rx * Math.cos(rad(a0 + (a1 - a0) * i / 24)),
            cy + ry * Math.sin(rad(a0 + (a1 - a0) * i / 24))
        ]);
        this.stroke(pts, w, fill);
    }
    dot(cx, cy, r, fill = INK) {
        const [x, y] = this.P(cx, cy);
        this.g.beginPath();
        this.g.arc(x, y, r, 0, Math.PI * 2);
        this.g.fillStyle = fill;
        this.g.fill();
    }
    clip(pts, fn) {
        const g = this.g;
        g.save();
        this.path(pts, true);
        g.clip();
        fn();
        g.restore();
    }
    shadedFill(pts, base, shadow, light, R, shift = 0.45, r0 = 1.05, r1 = 1.25) {
        const g = this.g, n = pts.length;
        let cx = 0, cy = 0;
        for (const [x, y] of pts){
            cx += x / n;
            cy += y / n;
        }
        const [gx, gy] = this.P(cx + Math.cos(light) * shift * R, cy + Math.sin(light) * shift * R);
        const gr = g.createRadialGradient(gx, gy, 0, gx, gy, r1 * R);
        gr.addColorStop(0, base);
        gr.addColorStop(r0 / r1, base);
        gr.addColorStop(1, shadow);
        this.path(pts, true);
        g.fillStyle = gr;
        g.fill();
    }
    gradFill(pts, base, shadow, light, flat = 0.22) {
        const g = this.g, dx = Math.cos(light), dy = Math.sin(light), n = pts.length;
        let cx = 0, cy = 0, lo = Infinity, hi = -Infinity;
        for (const [x, y] of pts){
            cx += x / n;
            cy += y / n;
            const d = x * dx + y * dy;
            lo = Math.min(lo, d);
            hi = Math.max(hi, d);
        }
        const dc = cx * dx + cy * dy;
        const [ax, ay] = this.P(cx + dx * (hi - dc), cy + dy * (hi - dc)), [bx, by] = this.P(cx + dx * (lo - dc), cy + dy * (lo - dc));
        const gr = g.createLinearGradient(ax, ay, bx, by);
        gr.addColorStop(0, base);
        gr.addColorStop(flat, base);
        gr.addColorStop(1, shadow);
        this.path(pts, true);
        g.fillStyle = gr;
        g.fill();
    }
    inkRing(pts, w0, thick, k = 0.45, col = INK) {
        const n = pts.length;
        let cx = 0, cy = 0;
        for (const [x, y] of pts){
            cx += x / n;
            cy += y / n;
        }
        const out = [], inn = [];
        pts.forEach((q, i)=>{
            const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
            let nx = b[1] - a[1], ny = a[0] - b[0];
            const l = Math.hypot(nx, ny) || 1;
            nx /= l;
            ny /= l;
            const h = 0.5 * w0 * (1 + k * Math.cos(Math.atan2(q[1] - cy, q[0] - cx) - thick));
            out.push([
                q[0] + nx * h,
                q[1] + ny * h
            ]);
            inn.push([
                q[0] - nx * h,
                q[1] - ny * h
            ]);
        });
        const g = this.g;
        const trace = (r)=>{
            r.forEach(([x0, y0], i)=>{
                const [x, y] = this.P(x0, y0);
                if (i) g.lineTo(x, y);
                else g.moveTo(x, y);
            });
            g.closePath();
        };
        g.beginPath();
        trace(out);
        trace(inn.reverse());
        g.fillStyle = col;
        g.fill("evenodd");
    }
    band(pts, fill, w, rim, cap = "butt") {
        const g = this.g;
        g.lineCap = cap;
        g.lineJoin = "round";
        this.path(pts, false);
        g.strokeStyle = INK;
        g.lineWidth = w + 2 * rim;
        g.stroke();
        this.path(pts, false);
        g.strokeStyle = fill;
        g.lineWidth = w;
        g.stroke();
        g.lineCap = "round";
    }
}
const ellPts = (cx, cy, rx, ry, a0 = 0, a1 = 360, rot = 0, n = 48)=>{
    const r = rad(rot), pts = [];
    for(let i = 0; i <= n; i++){
        const a = rad(a0 + (a1 - a0) * i / n), x = rx * Math.cos(a), y = ry * Math.sin(a);
        pts.push([
            cx + x * Math.cos(r) - y * Math.sin(r),
            cy + x * Math.sin(r) + y * Math.cos(r)
        ]);
    }
    return pts;
};
const rrect = (x0, y0, x1, y1, r, n = 8)=>{
    const pts = [];
    for (const [cx, cy, a] of [
        [
            x1 - r,
            y0 + r,
            -90
        ],
        [
            x1 - r,
            y1 - r,
            0
        ],
        [
            x0 + r,
            y1 - r,
            90
        ],
        [
            x0 + r,
            y0 + r,
            180
        ]
    ])for(let i = 0; i <= n; i++)pts.push([
        cx + r * Math.cos(rad(a + 90 * i / n)),
        cy + r * Math.sin(rad(a + 90 * i / n))
    ]);
    return pts;
};
const taper = (p, a, b, wa, wb, col = INK)=>{
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    p.poly([
        [
            a[0] + nx * wa / 2,
            a[1] + ny * wa / 2
        ],
        [
            b[0] + nx * wb / 2,
            b[1] + ny * wb / 2
        ],
        [
            b[0] - nx * wb / 2,
            b[1] - ny * wb / 2
        ],
        [
            a[0] - nx * wa / 2,
            a[1] - ny * wa / 2
        ]
    ], col, 0);
    p.dot(a[0], a[1], wa / 2, col);
    p.dot(b[0], b[1], wb / 2, col);
};
export const blobPts = (cx, cy, B, n = 72)=>{
    const ph = [
        rnd(B.seed, 11),
        rnd(B.seed, 12),
        rnd(B.seed, 13)
    ].map((v)=>v * Math.PI * 2);
    const pts = [];
    for(let i = 0; i < n; i++){
        const t = i / n * Math.PI * 2, c = Math.cos(t), s = Math.sin(t), e = 2 / (s < 0 ? B.nTop : B.nBot);
        let X = Math.sign(c) * Math.abs(c) ** e;
        const Y = Math.sign(s) * Math.abs(s) ** e;
        X *= (1 + B.egg * Y) * (1 + B.asym * Math.sign(X));
        const r = 1 + B.noise * (Math.cos(2 * t + ph[0]) + 0.7 * Math.cos(3 * t + ph[1]) + 0.5 * Math.cos(4 * t + ph[2]));
        const x = B.a * X * r, y = B.b * Y * r;
        pts.push([
            cx + x * Math.cos(B.rot) - y * Math.sin(B.rot),
            cy + x * Math.sin(B.rot) + y * Math.cos(B.rot)
        ]);
    }
    return pts;
};
export const headBlob = (seed, a = 118, facing = 0)=>({
        a,
        b: a * (0.94 + 0.08 * (rnd(seed, 1) - 0.5)),
        nTop: 1.75 + 0.3 * (rnd(seed, 2) - 0.5),
        nBot: 2.3 + 0.3 * (rnd(seed, 3) - 0.5),
        egg: -0.12 + 0.06 * (rnd(seed, 4) - 0.5),
        asym: (0.06 + 0.04 * rnd(seed, 5)) * (facing || (rnd(seed, 6) < 0.5 ? -1 : 1)),
        rot: rad(8 * (rnd(seed, 7) - 0.5)),
        noise: 0.008,
        seed
    });
export const thickAngle = (light)=>Math.atan2(-Math.sin(light) + 0.8, -Math.cos(light));
const DEF_LIGHT = rad(-120);
const FACE = {
    neutral: {
        eye: [
            "lid",
            "lid"
        ],
        brow: [
            0,
            -1
        ],
        mouth: "dash"
    },
    stern: {
        eye: [
            "lid",
            "lid"
        ],
        brow: [
            3,
            -2
        ],
        mouth: "frown"
    },
    grin: {
        eye: [
            "happy",
            "happy"
        ],
        brow: [
            -3,
            -3
        ],
        mouth: "grin"
    },
    laugh: {
        eye: [
            "squeeze",
            "squeeze"
        ],
        brow: [
            -4,
            -4
        ],
        mouth: "laugh"
    },
    whistle: {
        eye: [
            "dash",
            "dash"
        ],
        brow: [
            -2,
            -4
        ],
        mouth: "o"
    },
    nervous: {
        eye: [
            "small",
            "small"
        ],
        brow: [
            -3,
            2
        ],
        mouth: "wave"
    },
    shock: {
        eye: [
            "shock",
            "shock"
        ],
        brow: [
            -7,
            -6
        ],
        mouth: "O"
    },
    relief: {
        eye: [
            "happy",
            "happy"
        ],
        brow: [
            -2,
            1
        ],
        mouth: "smileWide"
    },
    relief_open: {
        eye: [
            "happy",
            "happy"
        ],
        brow: [
            -2,
            1
        ],
        mouth: "grin"
    },
    dazed: {
        eye: [
            "spiral",
            "spiral"
        ],
        brow: [
            -3,
            2
        ],
        mouth: "wave"
    },
    pained: {
        eye: [
            "squeeze",
            "lid"
        ],
        brow: [
            -3,
            2
        ],
        mouth: "teeth"
    },
    smile: {
        eye: [
            "dot",
            "dot"
        ],
        brow: [
            0,
            -1
        ],
        mouth: "smirk"
    },
    smile_closed: {
        eye: [
            "happy",
            "happy"
        ],
        brow: [
            0,
            -1
        ],
        mouth: "smile"
    },
    lick: {
        eye: [
            "dot",
            "dot"
        ],
        brow: [
            0,
            -1
        ],
        mouth: "lick"
    }
};
const halfLid = (k)=>k === "dot" || k === "small" ? "lid" : k === "lid" ? "slit" : k === "shock" ? "shockHalf" : k;
const eyeKind = (k, lid)=>lid >= 1 && k !== "happy" && k !== "squeeze" && k !== "spiral" ? "dash" : lid > 0 ? halfLid(k) : k;
const lidOf = (b)=>b === true ? 1 : Number(b) || 0;
const eye = (p, kind, x, ey, u, side, look, skin)=>{
    const lx = x + look * 3 * u, lw = 3.8 * u;
    switch(kind){
        case "dot":
        case "small":
        case "lid":
        case "slit": {
            // cartoon eye: white almond, brown iris, pupil, highlight, heavy upper lid
            const k = kind === "small" ? 0.82 : 1, rx = 7.6 * u * k, ry = (kind === "slit" ? 4.0 : 9.4) * u * k;
            const ix = x + look * 2.6 * u, iy = ey + 0.8 * u, ir = 5.6 * u * k;
            const sc = []; for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; sc.push([x + Math.cos(a) * rx, ey + Math.sin(a) * ry]); }
            p.poly(sc, WHITE, 0);
            p.clip(sc, () => { p.dot(ix, iy, ir, "#5b3a26"); p.dot(ix, iy, ir * 0.72, "#3a2418"); p.dot(ix, iy, ir * 0.42, INK); p.dot(ix + ir * 0.38, iy - ir * 0.42, ir * 0.3, "#ffffff"); p.dot(ix - ir * 0.35, iy + ir * 0.4, ir * 0.13, "#ffffff");
                if (kind === "lid" || kind === "slit") { const lidY = kind === "lid" ? ey - ry * 0.05 : ey - ry * 0.2; p.poly([[x - rx - 2, ey - ry - 2], [x + rx + 2, ey - ry - 2], [x + rx + 2, lidY], [x - rx - 2, lidY]], skin, 0); }
                else p.arc(x, ey + ry * 0.2, rx * 1.1, ry * 1.1, 200, 340, 1.4 * u, "rgba(80,60,60,0.25)"); });
            p.poly(sc, null, 1.3 * u);
            if (kind === "lid" || kind === "slit") { const lidY = kind === "lid" ? ey - ry * 0.05 : ey - ry * 0.2; p.stroke([[x - rx * 1.05, lidY + 0.3 * u], [x, lidY - 0.6 * u], [x + rx * 1.05, lidY + 0.3 * u]], 2.6 * u); }
            else p.arc(x, ey, rx * 1.02, ry * 1.02, 205, 335, 2.6 * u);
            break;
        }
        case "_lid_old":
            p.ell(lx, ey - u, 7 * u, 6 * u, INK, 0, 0, 180);
            p.stroke([
                [
                    x - 9 * u,
                    ey - u
                ],
                [
                    x + 9 * u,
                    ey - u
                ]
            ], lw);
            break;
        case "_slit_old":
            p.ell(lx, ey, 7 * u, 2.6 * u, INK, 0, 0, 180);
            p.stroke([
                [
                    x - 9 * u,
                    ey
                ],
                [
                    x + 9 * u,
                    ey
                ]
            ], lw);
            break;
        case "happy":
            p.arc(x, ey + 3 * u, 8 * u, 6 * u, 200, 340, lw);
            break;
        case "dash":
            p.stroke([
                [
                    x - 8.5 * u,
                    ey
                ],
                [
                    x + 8.5 * u,
                    ey
                ]
            ], lw);
            break;
        case "squeeze":
            p.stroke([
                [
                    x + 6 * u * side,
                    ey - 5 * u
                ],
                [
                    x - 6 * u * side,
                    ey
                ],
                [
                    x + 6 * u * side,
                    ey + 5 * u
                ]
            ], lw);
            break;
        case "shock":
        case "shockHalf":
            p.ell(x, ey, 11 * u, 11 * u, WHITE, 2.6 * u);
            p.dot(lx - side * 1.5 * u, ey + 1.5 * u, 3.4 * u);
            p.dot(lx - side * 1.5 * u + 1.2 * u, ey - 0.4 * u, 1.1 * u, "#ffffff");
            if (kind === "shockHalf") {
                p.ell(x, ey, 11 * u, 11 * u, skin, 0, 180, 360);
                p.stroke([
                    [
                        x - 11 * u,
                        ey
                    ],
                    [
                        x + 11 * u,
                        ey
                    ]
                ], 2.6 * u);
            }
            break;
        default:
            {
                const s = [];
                for(let t = 1; t < 15; t++)s.push([
                    x + Math.cos(t * 0.9) * t * 0.55 * u,
                    ey + Math.sin(t * 0.9) * t * 0.55 * u
                ]);
                p.stroke(s, 2.4 * u);
            }
    }
};
let LIPCOL = null;
const LC = () => LIPCOL || INK;
/** open mouth: upturned corners, curved top teeth, tongue, thin outline */
const dmouth = (p, mx, y, rx, ry, u, tongue = false)=>{
    const top = [], bot = [];
    for (let i = 0; i <= 20; i++) { const t = i / 20, x = mx - rx + t * 2 * rx, k = (t - 0.5) * 2; top.push([x, y - 1.6 * u * k * k + 0.8 * u]); bot.push([x, y + ry * Math.sqrt(Math.max(0, 1 - k * k)) * (0.9 + 0.1 * (1 - k * k)) - 1.6 * u * k * k]); }
    const mp = [...top, ...bot.reverse()];
    p.poly(mp, MOUTH, 0);
    p.clip(mp, () => {
        p.poly([...top.map(([x, yy]) => [x, yy - 2 * u]), ...top.slice().reverse().map(([x, yy]) => [x, yy + 0.32 * ry])], WHITE, 0);
        p.stroke(top.map(([x, yy]) => [x, yy + 0.32 * ry]), 0.8 * u, "#d8d0c8");
        if (tongue || ry > 7 * u) p.ell(mx + 0.15 * rx, y + ry * 0.95, rx * 0.55, ry * 0.45, TONGUE, 0);
    });
    p.poly(mp, null, 2.4 * u);
    if (LIPCOL) { const g = p.g; g.save(); g.strokeStyle = LIPCOL; g.globalAlpha = 0.85; p.stroke(bot, 1.6 * u, LIPCOL); g.restore(); }
    for (const sd of [-1, 1]) p.stroke([[mx + sd * (rx + 0.4 * u), y - 1.2 * u], [mx + sd * (rx + 2.4 * u), y - 3 * u]], 1.8 * u);
};
/** closed smile: crescent thicker in the middle, tapered ends, corner dimples */
const smileC = (p, mx, my, rx, ry, u, tilt = 0) => {
    const a = [], b = [];
    for (let i = 0; i <= 20; i++) { const t = i / 20, k = (t - 0.5) * 2, x = mx + k * rx, yc = my + ry * (1 - k * k) - ry * 0.55 + tilt * k * u * 3; const th = (1 - k * k) * 1.6 * u + 0.9 * u; a.push([x, yc - th]); b.push([x, yc + th]); }
    p.poly([...a, ...b.reverse()], LC(), 0);
    for (const sd of [-1, 1]) p.stroke([[mx + sd * rx * 0.98, my - ry * 0.55 + sd * tilt * u * 3 - 0.4 * u], [mx + sd * (rx + 1.8 * u), my - ry * 0.55 - 2.2 * u + sd * tilt * u * 3]], 1.5 * u, LC());
};
const mouth = (p, kind, mx, my, u, k = 1)=>{
    const mw = 4 * u;
    switch(kind){
        case "dash":
            p.stroke([
                [
                    mx - 5.5 * u * k,
                    my
                ],
                [
                    mx + 5.5 * u * k,
                    my - 0.8 * u
                ]
            ], mw);
            break;
        case "frown":
            { const a = [], b = []; for (let i = 0; i <= 16; i++) { const t = i / 16, kk = (t - 0.5) * 2, x = mx + kk * 6.5 * u * k, yc = my + 2.5 * u - 3.2 * u * (1 - kk * kk); const th = (1 - kk * kk) * 1.4 * u + 0.8 * u; a.push([x, yc - th]); b.push([x, yc + th]); } p.poly([...a, ...b.reverse()], LC(), 0); }
            break;
        case "smirk":
            smileC(p, mx + 1.5 * u, my - 1 * u, 7 * u * k, 3.2 * u, u, 0.8);
            break;
        case "smile":
            smileC(p, mx, my - 1 * u, 8.5 * u * k, 4.5 * u, u);
            break;
        case "smileWide":
            dmouth(p, mx, my - 2 * u, 10.5 * u * k, 6.5 * u, u);
            break;
        case "grin":
            dmouth(p, mx, my - u, 12 * u * k, 8 * u, u);
            break;
        case "laugh":
            dmouth(p, mx, my, 16 * u * k, 11 * u, u, true);
            break;
        case "o":
            p.ell(mx + 4 * u, my, 3.5 * u, 4 * u, MOUTH, 2.8 * u);
            break;
        case "O":
            p.ell(mx, my + 2 * u, 9 * u * k, 11 * u, MOUTH, 3.2 * u);
            break;
        case "wave":
            {
                const s = [];
                for(let i = 0; i <= 12; i++)s.push([
                    mx - 9 * u * k + i * 1.5 * u * k,
                    my + 1.5 * u * Math.sin(i * 1.3)
                ]);
                p.stroke(s, 3 * u);
                break;
            }
        case "teeth": {
            const rx = 11 * u * k, ry = 5 * u, top = [], bot = [];
            for (let i2 = 0; i2 <= 20; i2++) { const t = i2 / 20, kk = (t - 0.5) * 2, x = mx + kk * rx, cv = 1.4 * u * kk * kk; top.push([x, my - ry * Math.sqrt(1 - Math.pow(Math.abs(kk), 6)) - cv]); bot.push([x, my + ry * Math.sqrt(1 - Math.pow(Math.abs(kk), 6)) - cv]); }
            const tp = [...top, ...bot.reverse()];
            p.poly(tp, WHITE, 0);
            p.clip(tp, () => { p.stroke(Array.from({ length: 21 }, (_, i2) => { const kk = (i2 / 20 - 0.5) * 2; return [mx + kk * rx, my - 1.4 * u * kk * kk]; }), 1.2 * u, "#b8aea6"); for (const jj of [-2, -1, 0, 1, 2]) p.stroke([[mx + jj * 4.2 * u * k, my - ry], [mx + jj * 4.2 * u * k, my + ry]], 0.9 * u, "#c9c0b8"); });
            p.poly(tp, null, 2.4 * u);
            break;
        }
        case "lick":
            p.arc(mx, my - 3 * u, 8 * u * k, 4.5 * u, 20, 160, mw);
            p.ell(mx + 6 * u * k, my + 3 * u, 3.6 * u, 4.6 * u, TONGUE, 2.4 * u);
            break;
    }
};
const faceFront = (p, cx, cy, W, expr, facing, look, lid, brim, skin, moustache, stout = false)=>{
    const u = W / 100, F = FACE[expr], fx = cx + 7 * u * facing;
    const ex = (F.eye[0] === "shock" ? 12 : 13) * u, ey = cy;
    for (const side of [
        -1,
        1
    ]){
        const x = fx + side * ex;
        const kind = eyeKind(F.eye[(facing ? side === facing : side > 0) ? 1 : 0], lid);
        eye(p, kind, x, ey, u, side, look, skin);
        const [dI, dO] = F.brow, by = ey - (brim ? 17 : 20) * u;
        if (kind === "shock" || kind === "shockHalf") p.arc(x, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
        else taper(p, [
            x - side * 8.5 * u,
            by + dI * u
        ], [
            x + side * 8.5 * u,
            by + dO * u
        ], 5 * u, 2.5 * u);
    }
    const mx = cx + 8 * u * facing, my = cy + 20 * u;
    mouth(p, F.mouth, mx, my, u);
    if (moustache) for (const s of [
        -1,
        1
    ])taper(p, [
        mx + s * 1.5 * u,
        cy + 12.5 * u
    ], [
        mx + s * (stout ? 19 : 15) * u,
        cy + (stout ? 10.5 : 15) * u
    ], stout ? 5.5 * u : 4.5 * u, 1.6 * u, moustache);
    if (expr === "nervous") p.ell(cx + 40 * u * (facing || 1), cy - 22 * u, 3 * u, 5 * u, "#9fd4ff", 2 * u);
};
const faceSide = (p, hx, hy, W, expr, lid, brim, skin, moustache, stout = false)=>{
    const u = W / 100, F = FACE[expr], ex = hx + 27 * u, ey = hy;
    const kind = eyeKind(F.eye[1], lid);
    eye(p, kind, ex, ey, u, 1, 0.6, skin);
    const by = ey - (brim ? 17 : 20) * u, [dI, dO] = F.brow;
    if (kind === "shock" || kind === "shockHalf") p.arc(ex, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
    else taper(p, [
        ex + 8 * u,
        by + dI * u
    ], [
        ex - 7 * u,
        by - u + dO * u
    ], 5 * u, 2.5 * u);
    p.stroke([
        [
            hx + 44 * u,
            hy + 4 * u
        ],
        [
            hx + 47.5 * u,
            hy + 9 * u
        ],
        [
            hx + 43 * u,
            hy + 10 * u
        ]
    ], 3 * u);
    mouth(p, F.mouth, hx + 33 * u, hy + 21 * u, u, 0.62);
    if (moustache) taper(p, [
        hx + 41 * u,
        hy + 13.5 * u
    ], [
        hx + 25 * u,
        hy + (stout ? 11.5 : 16) * u
    ], stout ? 5.5 * u : 4.5 * u, 1.6 * u, moustache);
    if (expr === "nervous") p.ell(hx - 30 * u, hy - 24 * u, 3 * u, 5 * u, "#9fd4ff", 2 * u);
};
const BONNET = "#e9cf8f", BONNET_BRIM = "#d6b46a";
const hatBehind = (p, o, H, cx, hc, light, thick, ow, side)=>{
    if (o.hat !== "bonnet") return;
    const bb = blobPts(cx - (side ? 12 : 0) * (H.a / 50), hc - 0.07 * 2 * H.b, {
        ...H,
        a: H.a * 1.17,
        b: H.b * 1.13,
        asym: 0,
        egg: 0.04,
        seed: H.seed + 3
    });
    p.shadedFill(bb, BONNET, mul(BONNET, SH_CLOTH), light, H.a * 1.17);
    p.inkRing(bb, ow * 0.85, thick);
};
const hatOn = (p, o, hp, H, cx, hc, light, seed, facing, side)=>{
    const W = 2 * H.a, HH = 2 * H.b, u = W / 100, crown = hc - H.b, ow = 0.85 * 5 * u;
    const a = H.rot + rad(4 * (rnd(seed, 20) - 0.5));
    const R = (pts)=>rotPts(pts, a, cx, hc);
    const sag = (yb, wb)=>{
        const base = [];
        for(let i = 0; i <= 12; i++){
            const t = i / 12;
            base.push([
                cx + wb * (2 * t - 1),
                yb + 3 * u * (1 - (2 * t - 1) ** 2)
            ]);
        }
        return base;
    };
    if (o.hat === "shako" || o.hat === "shako_tall") {
        const tall = o.hat === "shako_tall", yb = crown + 0.25 * HH, ht = (tall ? 0.66 : 0.56) * HH, wb = 46 * u, wt = 52 * u;
        const body = R([
            ...sag(yb, wb).reverse(),
            [
                cx - wt,
                yb - ht
            ],
            [
                cx + wt,
                yb - ht
            ]
        ]);
        p.shadedFill(body, "#3a3d47", "#24262d", light, wt, 0.4);
        if (tall) p.clip(body, ()=>p.band(R([
                [
                    cx - wt - 5 * u,
                    yb - ht + 0.07 * HH
                ],
                [
                    cx + wt + 5 * u,
                    yb - ht + 0.07 * HH
                ]
            ]), "#e8c45a", 0.06 * HH, 1.5 * u));
        p.poly(body, null, ow);
        const deg = a * 180 / Math.PI;
        if (side) {
            p.poly(R([
                [
                    cx + 36 * u,
                    yb - 1 * u
                ],
                [
                    cx + 60 * u,
                    yb + 8 * u
                ],
                [
                    cx + 34 * u,
                    yb + 6 * u
                ]
            ]), "#16171b", 2.5 * u);
            const [tx, ty] = R([
                [
                    cx + 24 * u,
                    yb - ht - 6 * u
                ]
            ])[0];
            p.ell(tx, ty, 7 * u, 7 * u, "#2b7a4b", 2.5 * u);
        } else {
            const [px, py] = R([
                [
                    cx + 3 * u * facing,
                    yb + 3 * u
                ]
            ])[0];
            p.ell(px, py, 34 * u, 0.045 * HH, "#16171b", 2.5 * u, 0, 180, deg);
            const [bx, by] = R([
                [
                    cx,
                    yb - 0.45 * ht
                ]
            ])[0];
            p.ell(bx, by, 7 * u, 6 * u, tall ? "#e8c45a" : "#c9ccd2", 2 * u, 0, 360, deg);
            p.arc(bx, by, 3.5 * u, 2.8 * u, 200, 500, 1.6 * u);
            const [tx, ty] = R([
                [
                    cx,
                    yb - ht - 6 * u
                ]
            ])[0];
            p.ell(tx, ty, 7 * u, 7 * u, "#2b7a4b", 2.5 * u);
        }
    } else if (o.hat === "cap" || o.hat === "hair") {
        const cut = crown + (o.hat === "cap" ? 0.3 : 0.42) * HH;
        const keep = (x, y)=>y < cut || side && o.hat === "hair" && x < cx - 6 * u && y < hc + 0.42 * H.b;
        const n = hp.length, startIdx = Math.max(0, hp.findIndex(([x, y], i)=>keep(x, y) && !keep(hp[(i + n - 1) % n][0], hp[(i + n - 1) % n][1])));
        const arc = [
            ...hp.slice(startIdx),
            ...hp.slice(0, startIdx)
        ].filter(([x, y])=>keep(x, y)).map(([x, y])=>[
                cx + (x - cx) * 1.03,
                hc + (y - hc) * 1.03
            ]);
        if (arc.length < 3) return;
        if (o.hat === "hair") {
            const [x0, y0] = arc[arc.length - 1], [x1, y1] = arc[0];
            for(let i = 1; i < 6; i++)arc.push([
                x0 + (x1 - x0) * i / 6,
                y0 + (y1 - y0) * i / 6 + (i % 2 ? 4 * u : 0)
            ]);
        }
        const col = o.hat === "cap" ? o.cap : o.hair;
        p.shadedFill(arc, col, mul(col, SH_FELT), light, H.a, 0.35);
        p.poly(arc, null, ow);
        if (o.hat === "hair") {
            const s = side ? -1 : facing || 1;
            p.stroke([
                [
                    cx + s * 10 * u,
                    cut - 30 * u
                ],
                [
                    cx + s * 2 * u,
                    cut - 12 * u
                ]
            ], 1.2 * u);
        }
        if (o.hat === "cap") {
            const deg = a * 180 / Math.PI;
            if (side) p.poly(R([
                [
                    cx + 40 * u,
                    cut - 2 * u
                ],
                [
                    cx + 74 * u,
                    cut + 4 * u
                ],
                [
                    cx + 40 * u,
                    cut + 6 * u
                ]
            ]), shade(col, 0.8), ow);
            else {
                const s = facing || (rnd(seed, 21) < 0.5 ? -1 : 1), [px, py] = R([
                    [
                        cx + s * 4 * u,
                        cut + 1.5 * u
                    ]
                ])[0];
                p.ell(px, py, 32 * u, 0.06 * HH, shade(col, 0.8), ow, 0, 180, deg);
            }
        }
    } else if (o.hat === "tophat") {
        const yb = crown + 0.22 * HH, ht = 0.8 * HH, wb = 0.31 * W, wt = 0.33 * W, col = "#2e2a36";
        const body = R([
            ...sag(yb, wb).reverse(),
            [
                cx - wt,
                yb - ht
            ],
            [
                cx + wt,
                yb - ht
            ]
        ]);
        p.shadedFill(body, col, mul(col, SH_FELT), light, wt, 0.4);
        p.clip(body, ()=>p.band(R([
                [
                    cx - wt - 4 * u,
                    yb - 0.13 * HH
                ],
                [
                    cx + wt + 4 * u,
                    yb - 0.13 * HH
                ]
            ]), shade(o.jacket, 0.9), 0.14 * HH, 0.8 * u));
        p.poly(body, null, ow);
        const [bx, by] = R([
            [
                cx,
                yb + 1 * u
            ]
        ])[0];
        p.ell(bx, by, 0.45 * W, 0.05 * HH, "#1d1b22", ow, 0, 360, a * 180 / Math.PI);
    } else if (o.hat === "bonnet") {
        const [bx, by] = R([
            [
                cx + (side ? 6 * u : 0),
                crown + 0.16 * HH
            ]
        ])[0];
        p.arc(bx, by, 0.5 * W, 0.2 * HH, 200, 340, 7 * u, BONNET_BRIM);
        p.arc(bx, by, 0.5 * W + 3.5 * u, 0.2 * HH + 3.5 * u, 200, 340, 1.2 * u);
        const cy = hc + H.b * 0.98;
        p.stroke([
            [
                cx - 14 * u,
                cy - 4 * u
            ],
            [
                cx,
                cy + 2 * u
            ],
            [
                cx + 14 * u,
                cy - 4 * u
            ]
        ], 2 * u, BONNET_BRIM);
    }
};
const BUILD = {
    adult: {
        a: 118,
        torso: 1.1,
        legs: 1.4,
        tw: 0.8
    },
    stout: {
        a: 118,
        torso: 1.15,
        legs: 1.32,
        tw: 0.92
    },
    kid: {
        a: 112,
        torso: 0.85,
        legs: 1.0,
        tw: 0.72
    }
};
const footStroke = (p, a, b, w, col)=>{
    if (col !== INK) p.stroke([
        a,
        b
    ], w + 3, INK);
    p.stroke([
        a,
        b
    ], w, col);
};
export const bodyFront = (p, o, opts)=>{
    const { phase = 0, expr = "neutral", mode = "march", look = 0, blink = false, lift = 60, prop = null, tilt = 0, headTilt = 0, wave, light = DEF_LIGHT, facing = 0, seed = 1 } = opts;
    const Bd = BUILD[o.build ?? "adult"], skin = o.skin ?? SKIN, two = Math.PI * 2, lid = lidOf(blink);
    const H = headBlob(seed, Bd.a, facing), W = 2 * H.a, HH = 2 * H.b, u = W / 100;
    const tall = (1 + Bd.torso + Bd.legs) * HH, sole = 975;
    const bob = mode === "march" ? 0.025 * tall * Math.cos(2 * two * phase) : mode === "stroll" ? 0.015 * tall * Math.cos(2 * two * phase) : 0;
    const torsoBot = mode === "sit" ? sole - 0.2 * HH : sole - Bd.legs * HH + bob;
    const chin = torsoBot - Bd.torso * HH, hc = chin - H.b, crown = hc - H.b, hipY = torsoBot - 0.12 * HH;
    const thick = thickAngle(light), ow = 5 * u;
    const legCol = mix(o.pants, INK, 0.55), armCol = mix(o.jacket, INK, 0.5), footCol = o.boots;
    const legW = 5.8 * u, footW = 7.5 * u;
    p.rot = null;
    if (mode === "sit") {
        for (const side of [
            -1,
            1
        ]){
            const h = [
                300 + side * 15 * u,
                hipY
            ], k = [
                300 + side * 36 * u,
                hipY + 0.2 * HH
            ], f = [
                300 + side * 44 * u,
                sole - 8 * u
            ];
            p.stroke(curve(h, k, f), legW, legCol);
            footStroke(p, [
                f[0] - side * 2 * u,
                f[1]
            ], [
                f[0] + side * 12 * u,
                f[1] - 5 * u
            ], footW, footCol);
        }
    } else if (mode === "fall") {
        const legs = [
            [
                [
                    300 - 15 * u,
                    hipY
                ],
                [
                    300 - 46 * u,
                    hipY + 0.5 * HH
                ],
                [
                    300 - 70 * u,
                    hipY + 0.72 * HH
                ]
            ],
            [
                [
                    300 + 15 * u,
                    hipY
                ],
                [
                    300 + 50 * u,
                    hipY + 0.45 * HH
                ],
                [
                    300 + 76 * u,
                    hipY + 0.22 * HH
                ]
            ]
        ];
        legs.forEach(([h, k, f], i)=>{
            p.stroke(curve(h, k, f), legW, legCol);
            footStroke(p, f, [
                f[0] + (i ? 14 : -14) * u,
                f[1] + (i ? -6 : 4) * u
            ], footW, footCol);
        });
    } else if (o.dress) {
        for (const side of [
            -1,
            1
        ]){
            const fx = 300 + side * 12 * u, fy = sole - 4 * u;
            p.stroke([
                [
                    fx,
                    sole - 0.4 * HH
                ],
                [
                    fx + side * u,
                    fy
                ]
            ], legW, legCol);
            footStroke(p, [
                fx - side * 3 * u,
                fy
            ], [
                fx + side * 12 * u,
                fy + u
            ], footW, footCol);
        }
    } else {
        const L = mode === "march" ? lift * 1.25 : mode === "stroll" ? lift * 0.55 : 0;
        for (const [side, ph] of [
            [
                -1,
                0
            ],
            [
                1,
                0.5
            ]
        ]){
            const up = Math.max(0, Math.sin(two * (phase + ph))) * L;
            const hx = 300 + side * 15 * u, fx = 300 + side * 22 * u, fy = sole - 4 * u - up;
            const k = [
                (hx + fx) / 2 + side * (1.5 * u + up * 0.16),
                (hipY + fy) / 2 - up * 0.08
            ];
            p.stroke(curve([
                hx,
                hipY
            ], k, [
                fx,
                fy
            ]), legW, legCol);
            footStroke(p, [
                fx - side * 3 * u,
                fy
            ], [
                fx + side * 13 * u,
                fy + 0.5 * u
            ], footW, footCol);
        }
    }
    const sway = mode === "march" ? 1.6 * Math.sin(two * phase) : mode === "stroll" ? 1.0 * Math.sin(two * phase) : 0;
    const A = tilt + sway;
    p.rot = A ? [
        rad(A),
        300,
        hipY
    ] : null;
    const dress = !!o.dress && mode !== "sit" && mode !== "fall";
    const T = {
        a: Bd.tw / 2 * W / 1.06,
        b: 0.5 * (torsoBot - (chin - 0.25 * HH)),
        nTop: 2.2,
        nBot: 2.6,
        egg: o.build === "stout" ? 0.17 : 0.12,
        asym: 0.04 * facing,
        rot: 0,
        noise: 0.006,
        seed: seed + 7
    };
    const tcx = 300 + 3 * u * facing, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
    const sh = (side)=>[
            tcx + side * 0.85 * T.a,
            chin + 0.12 * HH
        ];
    const hang = (side, fwd)=>{
        const S = sh(side), ex = tcx + side * (1.12 * T.a + 4 * u);
        const hx = ex + side * 3 * u - side * 6 * u * Math.max(0, fwd) + side * 4 * u * Math.max(0, -fwd);
        return [
            S,
            [
                ex,
                S[1] + 0.48 * HH
            ],
            [
                hx,
                chin + 1.04 * HH - Math.abs(fwd) * 9 * u
            ]
        ];
    };
    const sw = mode === "march" || mode === "stroll" ? Math.sin(two * phase) : 0;
    const R0 = [
        300 + 47 * u,
        torsoBot + 0.12 * HH
    ], R1 = [
        300 + 64 * u,
        crown - 0.32 * HH
    ];
    const rifle = !!o.rifle && (mode === "march" || mode === "stand" || mode === "stroll");
    const arms = [];
    if (mode === "sit") for (const side of [
        -1,
        1
    ])arms.push({
        pts: [
            sh(side),
            [
                tcx + side * (1.1 * T.a + 6 * u),
                sh(side)[1] + 0.4 * HH
            ],
            [
                tcx + side * (1.2 * T.a + 10 * u),
                torsoBot + 0.04 * HH
            ]
        ],
        front: false
    });
    else if (mode === "fall") for (const side of [
        -1,
        1
    ])arms.push({
        pts: [
            sh(side),
            [
                tcx + side * (1.15 * T.a + 12 * u),
                sh(side)[1] - 0.25 * HH
            ],
            [
                tcx + side * (1.3 * T.a + 24 * u),
                sh(side)[1] - 0.68 * HH
            ]
        ],
        front: false
    });
    else {
        arms.push({
            pts: prop === "shako" ? hang(-1, 0) : hang(-1, -sw),
            front: false
        });
        if (rifle) {
            const G = lerp2(R0, R1, 0.1);
            arms.push({
                pts: [
                    sh(1),
                    [
                        tcx + 1.12 * T.a + 5 * u,
                        sh(1)[1] + 0.45 * HH
                    ],
                    G
                ],
                front: false
            });
        } else if (wave !== undefined) {
            const S = sh(1);
            arms.push({
                pts: [
                    S,
                    [
                        tcx + 1.1 * T.a + 10 * u + 3 * u * wave,
                        S[1] - 0.22 * HH
                    ],
                    [
                        tcx + 1.18 * T.a + 16 * u + 12 * u * wave,
                        S[1] - 0.6 * HH
                    ]
                ],
                front: false
            });
        } else if (prop === "icecream") {
            const S = sh(1);
            arms.push({
                pts: [
                    S,
                    [
                        tcx + 1.05 * T.a + 4 * u,
                        S[1] + 0.45 * HH
                    ],
                    [
                        tcx + 0.5 * T.a,
                        S[1] + 0.4 * HH
                    ]
                ],
                front: true
            });
        } else if (Array.isArray(prop)) {
            const S = sh(1), k = clamp(prop[1], 0, 1);
            const E = lerp2([
                tcx + 1.1 * T.a + 10 * u,
                S[1] - 0.15 * HH
            ], [
                tcx + 1.2 * T.a + 10 * u,
                S[1] + 0.3 * HH
            ], k);
            const Hd = lerp2([
                tcx + 1.15 * T.a + 14 * u,
                S[1] - 0.55 * HH
            ], [
                tcx + 1.45 * T.a + 22 * u,
                S[1] + 0.35 * HH
            ], k);
            arms.push({
                pts: [
                    S,
                    E,
                    Hd
                ],
                front: true
            });
        } else arms.push({
            pts: hang(1, sw),
            front: false
        });
    }
    const drawArm = (a)=>{
        p.stroke(curve(a.pts[0], a.pts[1], a.pts[2]), 5.2 * u, armCol);
        p.dot(a.pts[2][0], a.pts[2][1], 5.5 * u);
    };
    if (rifle) {
        p.band([
            R0,
            R1
        ], "#7a4b2a", 5 * u, 1.5 * u, "round");
        p.band([
            lerp2(R0, R1, 0.6),
            R1
        ], "#8d949c", 2.4 * u, 1.2 * u, "round");
    }
    if (o.sword && mode !== "sit") {
        const s0 = [
            tcx - 0.75 * T.a,
            torsoBot - 0.2 * HH
        ];
        p.band([
            s0,
            [
                s0[0] - Math.sin(rad(25)) * 0.8 * HH,
                s0[1] + Math.cos(rad(25)) * 0.8 * HH
            ]
        ], "#c9ccd2", 3 * u, 1.2 * u, "round");
    }
    for (const a of arms)if (!a.front) drawArm(a);
    if (dress) {
        const D = {
            a: 0.5 * W * 0.98,
            b: 0.5 * (sole - 0.35 * HH - (chin - 0.2 * HH)),
            nTop: 2.0,
            nBot: 3.0,
            egg: 0.35,
            asym: 0.03 * facing,
            rot: 0,
            noise: 0.006,
            seed: seed + 9
        };
        const dp = blobPts(300, sole - 0.35 * HH - D.b, D);
        p.gradFill(dp, o.dress, mul(o.dress, SH_CLOTH), light);
        p.inkRing(dp, ow, thick);
        const Sw = {
            a: 0.37 * W,
            b: 0.3 * HH,
            nTop: 2.2,
            nBot: 2.4,
            egg: 0.1,
            asym: 0,
            rot: 0,
            noise: 0.006,
            seed: seed + 8
        };
        const sp = blobPts(300, chin + 0.12 * HH, Sw);
        p.gradFill(sp, o.jacket, mul(o.jacket, SH_CLOTH), light);
        p.inkRing(sp, ow * 0.9, thick);
    } else {
        p.gradFill(tp, o.jacket, mul(o.jacket, SH_CLOTH), light);
        p.clip(tp, ()=>{
            if (o.belt) {
                for (const s of [
                    -1,
                    1
                ])p.band([
                    [
                        tcx - s * 0.75 * T.a,
                        chin - 0.05 * HH
                    ],
                    [
                        tcx + s * 0.8 * T.a,
                        torsoBot - 0.1 * HH
                    ]
                ], o.belt, 5.5 * u, 1.8 * u);
                const xc = tcx + 0.025 * T.a, yc = chin - 0.05 * HH + (torsoBot - 0.1 * HH - (chin - 0.05 * HH)) * (0.75 / 1.55);
                p.poly([
                    [
                        xc - 3.5 * u,
                        yc - 3.5 * u
                    ],
                    [
                        xc + 3.5 * u,
                        yc - 3.5 * u
                    ],
                    [
                        xc + 3.5 * u,
                        yc + 3.5 * u
                    ],
                    [
                        xc - 3.5 * u,
                        yc + 3.5 * u
                    ]
                ], "#d9dde0", 1.5 * u);
            }
            if (o.sash) p.band([
                [
                    tcx - 1.3 * T.a,
                    torsoBot - 0.32 * HH
                ],
                [
                    tcx + 1.3 * T.a,
                    torsoBot - 0.32 * HH
                ]
            ], o.sash, 0.13 * HH, 1.8 * u);
            for(let i = 0; i < 4; i++){
                const y = chin + 0.12 * HH + i * 0.2 * HH;
                if (o.sash && Math.abs(y - (torsoBot - 0.32 * HH)) < 0.08 * HH) continue;
                p.dot(tcx + 2 * u * facing, y, 2.2 * u + 0.8 * u, INK);
                p.dot(tcx + 2 * u * facing, y, 2.2 * u, o.buttons ?? shade(o.jacket, 0.7));
            }
        });
        if (o.sash) {
            const s = facing || 1;
            p.poly([
                [
                    tcx + s * 0.55 * T.a,
                    torsoBot - 0.3 * HH
                ],
                [
                    tcx + s * 0.75 * T.a,
                    torsoBot + 0.05 * HH
                ],
                [
                    tcx + s * 0.45 * T.a,
                    torsoBot + 0.02 * HH
                ]
            ], o.sash, 1.6 * u);
        }
        p.inkRing(tp, ow, thick);
    }
    for (const a of arms)if (a.front) {
        drawArm(a);
        const [hx, hy] = a.pts[2];
        if (prop === "icecream") {
            p.poly([
                [
                    hx - 8 * u,
                    hy - 12 * u
                ],
                [
                    hx + 8 * u,
                    hy - 12 * u
                ],
                [
                    hx,
                    hy + 7 * u
                ]
            ], "#e0a35a", 1.8 * u);
            p.ell(hx, hy - 19 * u, 11 * u, 10 * u, "#f7c6d9", 2.2 * u);
            p.dot(hx, hy, 5.5 * u);
        } else if (Array.isArray(prop)) {
            const ang = rad(-70 + 105 * clamp(prop[1], 0, 1));
            const Rh = (pts)=>rotPts(pts, ang, hx, hy);
            p.band(Rh([
                [
                    hx,
                    hy + 12 * u
                ],
                [
                    hx,
                    hy - 44 * u
                ]
            ]), "#8a5a34", 5 * u, 1.5 * u, "round");
            p.poly(Rh([
                [
                    hx - 12 * u,
                    hy - 58 * u
                ],
                [
                    hx + 20 * u,
                    hy - 58 * u
                ],
                [
                    hx + 20 * u,
                    hy - 42 * u
                ],
                [
                    hx - 12 * u,
                    hy - 42 * u
                ]
            ]), "#7d848c", 2.2 * u);
            p.dot(hx, hy, 5.5 * u);
        }
    }
    if (prop === "shako") {
        const [hx, hy] = arms[0].pts[2];
        p.poly([
            [
                hx - 14 * u,
                hy + 3 * u
            ],
            [
                hx + 14 * u,
                hy + 3 * u
            ],
            [
                hx + 16 * u,
                hy + 30 * u
            ],
            [
                hx - 16 * u,
                hy + 30 * u
            ]
        ], "#3a3d47", 2.2 * u);
        p.ell(hx, hy + 31 * u, 3.5 * u, 3.5 * u, "#2b7a4b", 1.5 * u);
        p.dot(hx, hy, 5.5 * u);
    }
    const Ah = A + headTilt, [cpx, cpy] = rotAbout([
        300,
        chin
    ], rad(A), [
        300,
        hipY
    ]);
    p.rot = Ah ? [
        rad(Ah),
        300,
        chin,
        cpx - 300,
        cpy - chin
    ] : null;
    hatBehind(p, o, H, 300, hc, light, thick, ow, false);
    const hp = blobPts(300, hc, H);
    p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
    p.inkRing(hp, ow, thick);
    hatOn(p, o, hp, H, 300, hc, light, seed, facing, false);
    const brim = !!o.hat && o.hat !== "hair" && o.hat !== "bonnet" && o.hat !== "cap";
    faceFront(p, 300, hc, W, expr, facing, look, lid, brim, skin, o.moustache, o.build === "stout");
    p.rot = null;
};
const ik = (hip, ank, l1, l2)=>{
    const dx = ank[0] - hip[0], dy = ank[1] - hip[1], d = clamp(Math.hypot(dx, dy), 1, l1 + l2 - 0.01);
    const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), k = Math.atan2(dy, dx) - A;
    return [
        hip[0] + l1 * Math.cos(k),
        hip[1] + l1 * Math.sin(k)
    ];
};
const SWING_HIP = 733;
export const bodySide = (p, o, opts)=>{
    const { phase = 0, expr = "neutral", mode = "march", blink = false, stomp = 1, pose = 0, stride = 1, light = DEF_LIGHT, seed = 1 } = opts;
    const Bd = BUILD[o.build ?? "adult"], skin = o.skin ?? SKIN, two = Math.PI * 2, lid = lidOf(blink);
    const H = {
        ...headBlob(seed, Bd.a, 1),
        asym: 0.12,
        rot: rad(3 + 3 * (rnd(seed, 7) - 0.5))
    };
    const W = 2 * H.a, HH = 2 * H.b, u = W / 100, sole = 975, ankY = sole - 4 * u;
    const thick = thickAngle(light), ow = 5 * u;
    const legLen = (Bd.legs + 0.12) * HH - 4 * u, l1 = legLen / 2, l2 = legLen / 2;
    const nearCol = mix(o.pants, INK, 0.55), farCol = mix(o.pants, INK, 0.75), footCol = o.boots;
    const legs = [];
    let hipY = ankY - legLen * 0.995, lean = 0, nearFwd = 0;
    if (mode === "march") {
        const S = 370 * stride, liftH = Math.max(22, 40 + 70 * (stomp - 1));
        const st = (ph)=>{
            const c = ((phase + ph) % 1 + 1) % 1;
            if (c < 0.5) {
                const s = c / 0.5;
                return {
                    x: S / 2 - S * s,
                    h: 0,
                    stance: true,
                    s
                };
            }
            const s = (c - 0.5) / 0.5;
            return {
                x: -S / 2 + S * s - S / Math.PI * Math.sin(2 * Math.PI * s),
                h: liftH * Math.sin(Math.PI * s),
                stance: false,
                s
            };
        };
        const nL = st(0), fL = st(0.5), stance = nL.stance ? nL : fL;
        const Leff = legLen * (1 - 0.035 * Math.sin(Math.PI * stance.s));
        hipY = ankY - Math.sqrt(Math.max(1, Leff * Leff - stance.x * stance.x));
        for (const [L, near] of [
            [
                fL,
                false
            ],
            [
                nL,
                true
            ]
        ])legs.push({
            ank: [
                300 + L.x,
                ankY - L.h
            ],
            pitch: L.stance ? 0 : rad(35 * Math.sin(Math.PI * L.s) * (1 - 1.6 * L.s)),
            near
        });
        lean = 4 + 3 * Math.cos(2 * two * phase);
        nearFwd = nL.x / (S / 2);
    } else if (mode === "push") {
        hipY = ankY - 0.87 * legLen;
        legs.push({
            ank: [
                300 - 0.5 * legLen,
                ankY
            ],
            pitch: rad(-8),
            near: false
        }, {
            ank: [
                300 + 0.32 * legLen,
                ankY
            ],
            pitch: 0,
            near: true
        });
        lean = 14 * pose;
    } else if (mode === "swing") {
        hipY = SWING_HIP;
        const a = rad(60 * pose);
        for (const [dx, near] of [
            [
                -6,
                false
            ],
            [
                0,
                true
            ]
        ]){
            const knee = [
                300 + l1 * 0.98 + dx * u,
                hipY + 6 * u
            ];
            legs.push({
                ank: [
                    knee[0] + l2 * Math.sin(a),
                    knee[1] + l2 * Math.cos(a)
                ],
                pitch: -a * 0.5,
                near
            });
        }
    } else {
        legs.push({
            ank: [
                300 - 4 * u,
                ankY
            ],
            pitch: 0,
            near: false
        }, {
            ank: [
                300 + 4 * u,
                ankY
            ],
            pitch: 0,
            near: true
        });
    }
    const torsoBot = hipY + 0.12 * HH, chin = torsoBot - Bd.torso * HH, hc = chin - H.b, crown = hc - H.b, hip = [
        300,
        hipY
    ];
    p.rot = null;
    for (const L of legs){
        const knee = mode === "swing" ? [
            300 + l1 * 0.98 + (L.near ? 0 : -6 * u),
            hipY + 6 * u
        ] : ik(hip, L.ank, l1, l2);
        const hp0 = [
            300 + (L.near ? 0 : -5 * u),
            hipY
        ];
        p.stroke([
            hp0,
            knee,
            L.ank
        ], 5.8 * u, L.near ? nearCol : farCol);
        const c = Math.cos(L.pitch), s = Math.sin(L.pitch);
        footStroke(p, [
            L.ank[0] - 3 * u * c,
            L.ank[1] - 3 * u * s
        ], [
            L.ank[0] + 13 * u * c,
            L.ank[1] + 13 * u * s + 0.5 * u
        ], 7.5 * u, L.near ? footCol : footCol === INK ? INK : shade(footCol, 0.82));
    }
    p.rot = lean ? [
        rad(lean),
        300,
        hipY
    ] : null;
    const T = {
        a: (o.build === "stout" ? 0.36 : 0.31) * W,
        b: 0.5 * (torsoBot - (chin - 0.25 * HH)),
        nTop: 2.2,
        nBot: 2.5,
        egg: 0.1,
        asym: 0.06,
        rot: 0,
        noise: 0.006,
        seed: seed + 7
    };
    const tcx = 300 + 2 * u, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
    const armCol = mix(o.jacket, INK, 0.5), farArm = mix(o.jacket, INK, 0.68);
    const S = [
        tcx + 0.05 * T.a,
        chin + 0.14 * HH
    ], aLen = 0.95 * HH;
    const swingArm = (ang)=>{
        const e = [
            S[0] + Math.sin(ang) * aLen * 0.5,
            S[1] + Math.cos(ang) * aLen * 0.5
        ], a2 = ang + rad(16) * Math.sign(ang || 1);
        return [
            S,
            e,
            [
                e[0] + Math.sin(a2) * aLen * 0.5,
                e[1] + Math.cos(a2) * aLen * 0.5
            ]
        ];
    };
    const rifle = !!o.rifle && (mode === "march" || mode === "stand");
    const B0 = [
        tcx + 0.72 * T.a,
        chin + 0.58 * HH
    ], B1 = [
        tcx - 0.95 * T.a - 22 * u,
        crown - 0.4 * HH
    ];
    let near, far;
    if (mode === "swing") {
        near = [
            S,
            [
                S[0] + 12 * u,
                S[1] - 0.16 * HH
            ],
            [
                300 + 6 * u,
                chin - 0.3 * HH
            ]
        ];
        far = [
            S,
            [
                S[0] + 8 * u,
                S[1] - 0.18 * HH
            ],
            [
                300 + 2 * u,
                chin - 0.36 * HH
            ]
        ];
    } else if (mode === "push") {
        const reach = 0.55 * HH + 0.45 * HH * pose;
        let hN = [
            S[0] + reach,
            S[1] + 0.06 * HH
        ];
        if (opts.hand) {
            const th = -rad(lean), dx = opts.hand[0] - 300, dy = opts.hand[1] - hipY;
            const tg = [
                300 + dx * Math.cos(th) - dy * Math.sin(th),
                hipY + dx * Math.sin(th) + dy * Math.cos(th)
            ];
            hN = [
                hN[0] + (tg[0] - hN[0]) * pose,
                hN[1] + (tg[1] - hN[1]) * pose
            ];
        }
        near = [
            S,
            [
                (S[0] + hN[0]) / 2,
                (S[1] + hN[1]) / 2 + 0.06 * HH
            ],
            hN
        ];
        far = [
            S,
            [
                (S[0] + hN[0]) / 2 - 4 * u,
                (S[1] + hN[1]) / 2 - 0.02 * HH
            ],
            [
                hN[0] - 6 * u,
                hN[1] - 0.08 * HH
            ]
        ];
    } else if (rifle) {
        near = [
            S,
            [
                S[0] - 4 * u,
                S[1] + 0.42 * HH
            ],
            B0
        ];
        far = mode === "march" ? swingArm(rad(30) * nearFwd) : swingArm(0);
    } else {
        near = swingArm(rad(-30) * nearFwd);
        far = mode === "march" ? swingArm(rad(30) * nearFwd) : null;
    }
    if (far) {
        p.stroke(curve(far[0], far[1], far[2]), 5.2 * u, farArm);
        p.dot(far[2][0], far[2][1], 5.5 * u);
    }
    p.gradFill(tp, o.jacket, mul(o.jacket, SH_CLOTH), light);
    p.clip(tp, ()=>{
        if (o.belt) p.band([
            [
                tcx - 0.65 * T.a,
                chin - 0.05 * HH
            ],
            [
                tcx + 0.75 * T.a,
                torsoBot - 0.1 * HH
            ]
        ], o.belt, 5.5 * u, 1.8 * u);
        if (o.sash) p.band([
            [
                tcx - 1.3 * T.a,
                torsoBot - 0.32 * HH
            ],
            [
                tcx + 1.3 * T.a,
                torsoBot - 0.32 * HH
            ]
        ], o.sash, 0.13 * HH, 1.8 * u);
        if (!o.dress) for(let i = 0; i < 3; i++){
            const y = chin + 0.16 * HH + i * 0.24 * HH;
            p.dot(tcx + 0.8 * T.a, y, 3 * u, INK);
            p.dot(tcx + 0.8 * T.a, y, 2.2 * u, o.buttons ?? shade(o.jacket, 0.7));
        }
    });
    p.inkRing(tp, ow, thick);
    if (rifle) {
        p.band([
            B0,
            B1
        ], "#7a4b2a", 5 * u, 1.5 * u, "round");
        p.band([
            lerp2(B0, B1, 0.6),
            B1
        ], "#8d949c", 2.4 * u, 1.2 * u, "round");
    }
    p.stroke(curve(near[0], near[1], near[2]), 5.2 * u, armCol);
    p.dot(near[2][0], near[2][1], 5.5 * u);
    const hx = 300 + 4 * u;
    hatBehind(p, o, H, hx, hc, light, thick, ow, true);
    const hp = blobPts(hx, hc, H);
    p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
    p.inkRing(hp, ow, thick);
    hatOn(p, o, hp, H, hx, hc, light, seed, 1, true);
    const brim = !!o.hat && o.hat !== "hair" && o.hat !== "bonnet" && o.hat !== "cap";
    faceSide(p, hx, hc, W, expr, lid, brim, skin, o.moustache, o.build === "stout");
    p.rot = null;
};
export const swingKid = (p, o, kick, expr, light = DEF_LIGHT, blink = 0)=>{
    const rope = 1830, k = 1.1, HH = 2 * headBlob(5, BUILD[o.build ?? "adult"].a, 1).b;
    const seat = rope + 18, x0 = 150, x1 = 550;
    p.line([
        [
            350,
            20
        ],
        [
            x0 + 16,
            seat + 4
        ]
    ], "#a07a4c", 10);
    p.poly(rrect(x0, seat, x1, seat + 36, 10), "#b5653f", 9);
    const g = p.g;
    g.save();
    g.translate(350 - 300 * k, rope + 18 - (SWING_HIP + 0.12 * HH) * k);
    g.scale(k, k);
    bodySide(new Pen(g), o, {
        expr,
        mode: "swing",
        pose: kick,
        light,
        seed: 5,
        blink
    });
    g.restore();
    p.line([
        [
            350,
            20
        ],
        [
            x1 - 16,
            seat + 4
        ]
    ], "#a07a4c", 10);
};
export const fxNote = (p, kind, col = "#1f2a44")=>{
    p.ell(70, 200, 46, 34, col, 8, 0, 360, -20);
    p.stroke([
        [
            110,
            190
        ],
        [
            110,
            40
        ]
    ], 14);
    if (kind === 0) p.poly([
        [
            110,
            40
        ],
        [
            170,
            70
        ],
        [
            170,
            110
        ],
        [
            110,
            82
        ]
    ], col, 8);
    else {
        p.ell(150, 170, 40, 30, col, 8, 0, 360, -20);
        p.stroke([
            [
                186,
                160
            ],
            [
                186,
                20
            ]
        ], 14);
        p.poly([
            [
                110,
                40
            ],
            [
                186,
                20
            ],
            [
                186,
                50
            ],
            [
                110,
                70
            ]
        ], col, 8);
    }
};
export const fxBurst = (p, t, col = "#fff3b0", rays = 10, r0 = 40, r1 = 230)=>{
    const c = 250, e = 1 - (1 - t) ** 3;
    for(let i = 0; i < rays; i++){
        const a = rad(i * 360 / rays + 7 * (i % 2)), ra = r0 + (r1 - r0) * e * (0.75 + 0.25 * (i % 2));
        p.poly([
            [
                c + r0 * 0.5 * Math.cos(a + 0.18),
                c + r0 * 0.5 * Math.sin(a + 0.18)
            ],
            [
                c + ra * Math.cos(a),
                c + ra * Math.sin(a)
            ],
            [
                c + r0 * 0.5 * Math.cos(a - 0.18),
                c + r0 * 0.5 * Math.sin(a - 0.18)
            ]
        ], col, Math.max(3, 8 * (1 - t)));
    }
    if (t < 0.5) p.ell(c, c, r0 * (1.4 - t), r0 * (1.4 - t), WHITE, 8);
};
export const fxSplash = (p, t)=>{
    const c = 400, size = 800, rise = Math.sin(Math.min(1, t * 1.3) * Math.PI);
    const blue = "#bfe8ff", deep = "#6cc0f0";
    if (rise > 0.02) {
        const pts = [];
        for(let i = 0; i < 19; i++){
            const h = (i % 2 ? 260 : 130) * rise * (0.7 + 0.3 * Math.sin(i * 1.7));
            pts.push([
                c - 330 + 660 * i / 18,
                size - 120 - h
            ]);
        }
        p.poly([
            ...pts,
            [
                c + 330,
                size - 90
            ],
            [
                c - 330,
                size - 90
            ]
        ], blue, 10);
        p.ell(c, size - 100, 360, 46, deep, 10);
    }
    for(let i = 0; i < 8; i++){
        const a = rad(200 + i * 18), d = 120 + 380 * t, y = size - 160 + d * Math.sin(a) + 520 * t * t, r = 26 * (1 - t) + 6;
        if (t > 0.08 && y < size - 40) p.ell(c + d * Math.cos(a), y, r, r * 1.25, blue, 7);
    }
};
export const fxPuff = (p, t)=>{
    for(let i = 0; i < 5; i++){
        const a = rad(160 + i * 55), d = 40 + 70 * t, r = (34 + 20 * (i % 2)) * (1 - 0.6 * t);
        p.ell(150 + d * Math.cos(a), 180 + d * 0.45 * Math.sin(a), r, r * 0.8, `rgba(238,225,205,${(1 - t).toFixed(3)})`, 0);
    }
};
export const fxStars = (p, t)=>{
    for(let i = 0; i < 4; i++){
        const a = t * Math.PI * 2 + i * Math.PI / 2, x = 210 + 150 * Math.cos(a), y = 110 + 40 * Math.sin(a), pts = [];
        for(let k = 0; k < 10; k++){
            const r = k % 2 ? 14 : 34, b = rad(k * 36 - 90);
            pts.push([
                x + r * Math.cos(b),
                y + r * Math.sin(b)
            ]);
        }
        p.poly(pts, "#ffd84a", 6);
    }
};
export const fxCreak = (p, t)=>{
    const j = 6 * Math.sin(t * 40);
    for (const a of [
        -30,
        0,
        30
    ]){
        const b = rad(a - 90);
        p.stroke([
            [
                150 + 70 * Math.cos(b) + j,
                230 + 70 * Math.sin(b)
            ],
            [
                150 + 100 * Math.cos(b) + 10 + j,
                230 + 100 * Math.sin(b)
            ],
            [
                150 + 130 * Math.cos(b) + j,
                230 + 130 * Math.sin(b)
            ]
        ], 10);
    }
};
export const fxRing = (p, t)=>{
    const g = p.g;
    for(let k = 0; k < 3; k++){
        const u = t - k * 0.22;
        if (u <= 0 || u >= 1) continue;
        g.beginPath();
        g.ellipse(300, 300, 60 + 230 * u, 60 + 230 * u, 0, 0, Math.PI * 2);
        g.strokeStyle = k === 0 ? "#f6fcff" : "#cfe8fa";
        g.lineWidth = 9 * (1 - u) + 3;
        g.stroke();
    }
};
export const fxSign = (p)=>{
    const g = p.g, RED = "#d42f2f";
    p.poly(rrect(14, 14, 686, 506, 40), "#f6ecd2", 0);
    p.poly(rrect(14, 14, 686, 506, 40), null, 14);
    p.poly(rrect(70, 352, 630, 384, 8), "#8a5a3a", 9);
    g.beginPath();
    g.moveTo(112, 470);
    g.quadraticCurveTo(350, 300, 588, 470);
    g.strokeStyle = INK;
    g.lineWidth = 16;
    g.lineCap = "round";
    g.stroke();
    for (const x of [
        88,
        612
    ])p.poly(rrect(x - 16, 384, x + 16, 470, 4), "#8a5a3a", 9);
    for (const x of [
        150,
        278,
        406,
        534
    ]){
        p.poly(rrect(x - 30, 150, x + 30, 214, 14), "#357650", 9);
        p.stroke([
            [
                x - 8,
                210
            ],
            [
                x + 34,
                262
            ],
            [
                x + 46,
                338
            ]
        ], 15, INK);
        p.stroke([
            [
                x + 6,
                210
            ],
            [
                x - 12,
                274
            ],
            [
                x - 36,
                336
            ]
        ], 15, INK);
        p.poly(rrect(x + 30, 330, x + 74, 350, 9), INK, 0);
        p.poly(rrect(x - 52, 328, x - 8, 348, 9), INK, 0);
    }
    for (const [a, b] of [
        [
            [
                96,
                70
            ],
            [
                604,
                452
            ]
        ],
        [
            [
                604,
                70
            ],
            [
                96,
                452
            ]
        ]
    ]){
        p.stroke([
            a,
            b
        ], 58, "#ffffff");
        p.stroke([
            a,
            b
        ], 42, RED);
    }
};
export const fxCloud = (p, seed)=>{
    const blobs = [
        [
            150,
            190,
            80
        ],
        [
            250,
            150,
            105
        ],
        [
            360,
            160,
            95
        ],
        [
            450,
            195,
            70
        ],
        [
            300,
            210,
            90
        ]
    ];
    for (const [x, y, r] of blobs)p.ell(x + seed * 37 % 20 - 10, y, r, r * 0.8, "#ffffff", 0);
    p.ell(300, 235, 230, 40, "#ffffff", 0);
};
export const fxShadow = (p, col)=>{
    const g = p.g;
    g.fillStyle = WHITE;
    g.fillRect(0, 0, 128, 256);
    g.save();
    g.filter = "blur(9px)";
    const lg = g.createLinearGradient(0, 205, 0, 22);
    lg.addColorStop(0, mix(col, WHITE, 0.08));
    lg.addColorStop(0.55, mix(col, WHITE, 0.3));
    lg.addColorStop(1, mix(col, WHITE, 0.85));
    g.fillStyle = lg;
    g.beginPath();
    g.moveTo(40, 205);
    g.bezierCurveTo(36, 120, 46, 50, 64, 30);
    g.bezierCurveTo(82, 50, 92, 120, 88, 205);
    g.closePath();
    g.fill();
    g.fillStyle = col;
    g.beginPath();
    g.ellipse(64, 205, 30, 17, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
};
export const fxContact = (p, col)=>{
    const g = p.g;
    g.fillStyle = WHITE;
    g.fillRect(0, 0, 128, 128);
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    for (const [r, k] of [
        [
            0,
            0
        ],
        [
            0.32,
            0.02
        ],
        [
            0.5,
            0.22
        ],
        [
            0.66,
            0.58
        ],
        [
            0.82,
            0.88
        ],
        [
            1,
            1
        ]
    ])gr.addColorStop(r, mix(col, WHITE, k));
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
};
export const fxPlank = (p)=>{
    p.poly(rrect(14, 30, 306, 78, 10), "#a8744a", 9);
    p.line([
        [
            40,
            46
        ],
        [
            150,
            44
        ],
        [
            270,
            50
        ]
    ], "#7d5234", 4);
    p.line([
        [
            60,
            62
        ],
        [
            200,
            64
        ],
        [
            284,
            60
        ]
    ], "#7d5234", 4);
    p.dot(36, 54, 5, INK);
    p.dot(284, 54, 5, INK);
};
export const fxDrum = (p)=>{
    p.poly(rrect(40, 70, 220, 190, 16), "#f1ece0", 9);
    p.poly(rrect(32, 58, 228, 86, 12), "#c9373a", 8);
    p.poly(rrect(32, 176, 228, 204, 12), "#c9373a", 8);
    p.line([
        [
            52,
            88
        ],
        [
            82,
            172
        ],
        [
            112,
            88
        ],
        [
            142,
            172
        ],
        [
            172,
            88
        ],
        [
            202,
            172
        ]
    ], INK, 6);
    p.ell(130, 58, 98, 18, "#f7f3ea", 8);
};
export const fxBlob = (p, col)=>{
    const g = p.g;
    g.fillStyle = WHITE;
    g.fillRect(0, 0, 128, 128);
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    for (const [r, k] of [
        [
            0,
            0
        ],
        [
            0.5,
            0.04
        ],
        [
            0.64,
            0.18
        ],
        [
            0.76,
            0.42
        ],
        [
            0.87,
            0.72
        ],
        [
            0.95,
            0.92
        ],
        [
            1,
            1
        ]
    ])gr.addColorStop(r, mix(col, WHITE, k));
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
};
FACE.snore = { eye: ["dash", "dash"], brow: [0, -1], mouth: "o" };
FACE.stubborn = { eye: ["lid", "lid"], brow: [4, -3], mouth: "frown" };
FACE.squint = { eye: ["slit", "slit"], brow: [3, -2], mouth: "dash" };
FACE.angry = { eye: ["dot", "dot"], brow: [7, -5], mouth: "teeth" };
FACE.greedy = { eye: ["slit", "slit"], brow: [-2, 2], mouth: "smirk" };
FACE.bliss = { eye: ["happy", "happy"], brow: [-3, 2], mouth: "o" };

// ---------------- Roman-era cast (our own designs), built on the Pen / blob / face helpers above ----------------
const STEEL = "#aeb6bf", BRASS = "#d9a845", LEATHER = "#7a4a2a";
export const OUTFITS = {
  fazendeira: { tunic: "#5f86b8", apron: "#efe7d6", skin: "#f2c9a3", hair: "#7a4a2a", hairStyle: "long", pants: "#4a3a32" },
  narrador: { tunic: "#e8483b", skin: "#f5c9a0", moustache: "#2b1d17", cap: "#2f6f8f" },
  legion: { tunic: "#b8322f", cape: "#8f2228", skin: SKIN, helmet: true, armor: true, spear: true, shield: true },
  old: { tunic: "#9c4a3c", cape: "#6e3330", skin: "#f3d6bb", helmet: "old", armor: true, spear: true, shield: false, beard: "#f4f1ea", brows: "#f4f1ea" },
  toga: { tunic: "#f1ead8", skin: "#f5c9a0", toga: "#6b3c8f", hair: "#3b2a20", stout: true, hairStyle: "short" },
  civA: { tunic: "#4f7fb8", skin: "#f5c9a0", hair: "#5a3b2a", hairStyle: "side" },
  civB: { tunic: "#d9a441", skin: SKIN, hair: "#2b211c", dress: "#c25a7a", hairStyle: "long", female: true },
  civC: { tunic: "#5d8a3a", skin: "#c99067", hair: "#1e1714", stout: true },
  workA: { tunic: "#8a5d3b", skin: "#f5c9a0", cap: "#c2733a", apron: "#d8c9a6" },
  workB: { tunic: "#3f6a6f", skin: "#ecd0b6", cap: "#5b4a8a", moustache: "#4a3020" },
  pobre: { tunic: "#8a6a48", skin: "#eab58e", hair: "#4a3424", moustache: "#4a3424", patches: true, hairStyle: "spiky" },
  padeiro: { tunic: "#e2cfae", skin: "#f2bf96", cap: "#fbf8f2", apron: "#ffffff", stout: true, moustache: "#3a2414" },
  juiz: { tunic: "#30304a", toga: "#a5263a", skin: "#f3d6bb", beard: "#eeeae2", cap: "#23233a", stout: true },
  velha: { tunic: "#7d5a8c", skin: "#f1cfb1", hair: "#d9d4cc", dress: "#6f8f5a", hairStyle: "bun", female: true },
  civD: { tunic: "#c9663a", skin: "#a8714d", hair: "#1e1714", hairStyle: "curly" },
  dpedro: { tunic: "#22263a", skin: "#f3d6bb", hair: "#efece6", beard: "#f4f1ea", stout: true, hairStyle: "bald", pants: "#22263a", shoe: "#111111" },
  marinheiro: { tunic: "#2f5f9a", skin: "#e2a982", hair: "#2b1d17", hairStyle: "spiky" },
  fiscal: { tunic: "#4a4a52", skin: "#f1cfb1", hair: "#3a2a1e", apron: "#e8e4dc", hairStyle: "short" },
  coronel: { tunic: "#f2efe6", skin: "#efc29c", hair: "#9a8a78", beard: "#cfc8bc", stout: true, hairStyle: "bald" },
  vaqueiro: { tunic: "#8a5a2e", skin: "#c99067", hair: "#1e1714", hairStyle: "side" },
  cientC: { tunic: "#f4f2ec", skin: "#f3d6bb", hair: "#5a3b2a", hairStyle: "side" },
  marido: { tunic: "#8a5a3a", skin: "#efc29c", hair: "#3a2a1e", apron: "#3f5f86", hairStyle: "short" },
  vizA: { tunic: "#5d8a3a", skin: "#e9b98f", hair: "#3a2a1e", stout: true, hairStyle: "curly" },
  vizB: { tunic: "#c9663a", skin: "#f3d0b0", hair: "#9a8a78", beard: "#b9a48a", hairStyle: "bald" },
  cientista: { tunic: "#f4f2ec", skin: "#f3d6bb", hair: "#cfcac2", beard: "#e8e4dc", hairStyle: "bald" },
  cientista2: { tunic: "#eef0f2", skin: "#d9a57c", hair: "#1e1714", hairStyle: "side" },
};
/** hand props drawn on the card at the hand point (hx,hy). u = head units. */
const PROP = {
  grapple: (p, hx, hy, u, o) => { const g = p.g; g.save(); g.translate(hx, hy); g.rotate(o.toolRot ?? -0.2);
    p.poly(rrect(-6 * u, -4 * u, 34 * u, 8 * u, 2 * u), '#8d939c', 1.8 * u); p.poly(rrect(-4 * u, 4 * u, 4 * u, 22 * u, 2 * u), '#4a3424', 1.6 * u); p.band([[34 * u, 2 * u], [44 * u, 2 * u]], '#5a6068', 4 * u, 1 * u);
    p.poly([[44 * u, 2 * u], [52 * u, -6 * u], [50 * u, 2 * u], [52 * u, 10 * u]], '#c9ccd2', 1.4 * u); g.restore(); },
  phone: (p, hx, hy, u, o) => { const g = p.g; g.save(); g.translate(hx, hy - 6 * u); p.poly(rrect(-9 * u, -16 * u, 9 * u, 16 * u, 3 * u), "#2a2a2e", 2 * u); p.poly(rrect(-6 * u, -12 * u, 6 * u, 10 * u, 2 * u), "#9fd4ff", 0); g.restore(); },
  bucket: (p, hx, hy, u, o) => { const g = p.g; g.save(); g.translate(hx, hy + 10 * u); p.stroke([[-18 * u, 0], [0, -22 * u], [18 * u, 0]], 2 * u); p.poly([[-20 * u, 0], [20 * u, 0], [15 * u, 34 * u], [-15 * u, 34 * u]], "#9aa0a8", 2.4 * u); p.ell(0, 2 * u, 18 * u, 5 * u, "#6a8fb0", 1.4 * u); g.restore(); },
  sandwich: (p, hx, hy, u, o) => { const g = p.g; g.save(); g.translate(hx, hy - 4 * u); g.rotate(-0.2);
    const toast = o.toast; p.ell(0, -8 * u, 24 * u, 9 * u, toast ? "#9a5a22" : "#e0b070", 2 * u); p.stroke([[-22 * u, -1 * u], [22 * u, -1 * u]], 4 * u, "#7ab04a"); p.stroke([[-20 * u, 3 * u], [20 * u, 3 * u]], 3 * u, "#d24a3a"); p.ell(0, 9 * u, 24 * u, 8 * u, toast ? "#9a5a22" : "#e0b070", 2 * u);
    if (toast) for (const d of [-8, 4]) p.stroke([[d * u, -30 * u], [d * u + 6 * u, -46 * u], [d * u, -60 * u]], 2 * u, "#9a9a9a"); g.restore(); },
  drill: (p, hx, hy, u, o) => { const g = p.g; g.save(); g.translate(hx, hy); g.rotate(o.toolRot ?? 0);
    p.poly([[-26 * u, -10 * u], [26 * u, -10 * u], [22 * u, 40 * u], [-22 * u, 40 * u]], "#e8c23a", 2.4 * u); p.band([[-30 * u, -12 * u], [30 * u, -12 * u]], "#3a3a3a", 6 * u, 1.6 * u, "round");
    p.band([[0, 40 * u], [0, 95 * u]], "#bfc4ca", 6 * u, 1.6 * u); p.poly([[-5 * u, 95 * u], [5 * u, 95 * u], [0, 108 * u]], "#bfc4ca", 1.6 * u);
    if (o.shake) for (const s of [-1, 1]) p.stroke([[s * 34 * u, 70 * u], [s * 46 * u, 80 * u]], 2.4 * u); g.restore(); },
  shovel: (p, hx, hy, u, o) => { const g = p.g; g.save(); g.translate(hx, hy); g.rotate(o.toolRot ?? 0.3);
    p.band([[0, -40 * u], [0, 70 * u]], "#9a6a3a", 5 * u, 1.6 * u, "round"); p.poly([[-14 * u, 66 * u], [14 * u, 66 * u], [12 * u, 96 * u], [0, 104 * u], [-12 * u, 96 * u]], "#9aa0a8", 2.4 * u); g.restore(); },
  meat: (p, hx, hy, u, o) => { const g = p.g; g.save(); g.translate(hx, hy - 6 * u); g.rotate(o.meatRot ?? -0.5);
    if (o.bite) { p.ell(10 * u, 0, 26 * u, 20 * u, "#c0392f", 3 * u); p.ell(28 * u, -6 * u, 11 * u, 11 * u, "#f3e3c2", 0); p.ell(32 * u, 6 * u, 9 * u, 9 * u, "#f3e3c2", 0); }
    else p.ell(12 * u, 0, 28 * u, 21 * u, "#c0392f", 3 * u);
    p.stroke([[-2 * u, -8 * u], [20 * u, -14 * u]], 3 * u, "#ef8a7e");
    p.band([[-14 * u, 0], [-34 * u, 0]], "#f6f0e2", 7 * u, 2 * u, "round");
    p.ell(-38 * u, -6 * u, 6 * u, 6 * u, "#f6f0e2", 2 * u); p.ell(-38 * u, 6 * u, 6 * u, 6 * u, "#f6f0e2", 2 * u); g.restore(); },
  jar: (p, hx, hy, u, o) => { const g = p.g; g.save(); g.translate(hx, hy - 22 * u);
    const jp = rrect(-17 * u, -24 * u, 17 * u, 24 * u, 7 * u); p.poly(jp, "rgba(205,235,245,0.75)", 3 * u);
    p.ell(0, 8 * u, 11 * u, 9 * u, "#c0392f", 2 * u); p.stroke([[-6 * u, 4 * u], [5 * u, 2 * u]], 2 * u, "#ef8a7e");
    p.poly(rrect(-19 * u, -31 * u, 19 * u, -22 * u, 2 * u), "#b08a4a", 2.4 * u);
    p.stroke([[-11 * u, -16 * u], [-11 * u, 14 * u]], 3 * u, "#ffffffcc"); g.restore(); },
  bread: (p, hx, hy, u, o) => { const g = p.g; g.save(); g.translate(hx, hy - 4 * u); g.rotate(-0.35);
    p.ell(0, 0, 30 * u, 13 * u, "#c98a3e", 3.2 * u); if (o.bite) p.ell(-27 * u, -4 * u, 9 * u, 9 * u, "#f3e3c2", 0);
    for (const d of [-14, 0, 14]) p.stroke([[d * u - 5 * u, -8 * u], [d * u + 5 * u, 6 * u]], 2.4 * u, "#8a5222"); g.restore(); },
  purse: (p, hx, hy, u, o) => { const g = p.g, dx = (o.holdDx || 0) * u, dy = (o.holdDy || 0) * u; g.save(); g.translate(hx + dx, hy + 14 * u + dy); g.rotate((o.holdRot || 0));
    const sack = [[-15 * u, -10 * u], [15 * u, -10 * u], [21 * u, 8 * u], [15 * u, 22 * u], [-15 * u, 22 * u], [-21 * u, 8 * u]];
    p.poly(sack, "#8a5a2e", 3 * u); p.stroke([[-9 * u, -10 * u], [-13 * u, -20 * u]], 3 * u); p.stroke([[9 * u, -10 * u], [13 * u, -20 * u]], 3 * u);
    p.band([[-15 * u, -9 * u], [15 * u, -9 * u]], "#d9a845", 4 * u, 1.4 * u, "round");
    p.ell(-4 * u, -14 * u, 6 * u, 3.5 * u, "#f2c84b", 1.6 * u); p.ell(5 * u, -15 * u, 6 * u, 3.5 * u, "#f2c84b", 1.6 * u); g.restore(); },
};

/** galea: iron bowl, brass brow band, cheek guards, transverse red crest */
const galea = (p, H, cx, hc, light, thick, ow, old, u) => {
  const crest = old ? "#8d4b3f" : "#d2372f", bowl = old ? "#8f8a7e" : STEEL;
  // crest (behind the bowl top)
  const cy0 = hc - H.b * 0.98;
  const cr = ellPts(cx, cy0, 0.66 * 2 * H.a, 0.42 * 2 * H.b, 180, 360, 0, 40);
  cr.push([cx + 0.66 * 2 * H.a * 0.98, cy0 + 4 * u], [cx - 0.66 * 2 * H.a * 0.98, cy0 + 4 * u]);
  const crP = [...ellPts(cx, cy0 + 2 * u, 0.62 * 2 * H.a, 0.36 * 2 * H.b, 180, 360, 0, 40)];
  p.shadedFill(crP, crest, mul(crest, [0.7, 0.62, 0.7]), light, 0.62 * 2 * H.a, 0.3);
  p.clip(crP, () => { for (let i = -9; i <= 9; i++) p.stroke([[cx + i * 7.4 * u, cy0], [cx + i * 9.4 * u, cy0 - 0.62 * H.b * Math.cos(i / 11)]], 1.4 * u, mul(crest, [0.62, 0.55, 0.62])); });
  if (old) p.clip(crP, () => { for (let i = 0; i < 6; i++) p.ell(cx + (i - 3) * 22 * u, cy0 - 18 * u - (i % 2) * 10 * u, 9 * u, 5 * u, "#6f6a5e", 0); });
  p.inkRing(crP, ow * 0.85, thick);
  p.poly(rrect(cx - 10 * u, cy0 - 6 * u, cx + 10 * u, cy0 + 6 * u, 3 * u), BRASS, 2 * u);
  // bowl: upper head cap
  const bandY = hc - H.b * 0.42;
  const bp = ellPts(cx, bandY, H.a * 1.05, H.b * 0.66, 180, 360, 0, 48);
  p.shadedFill(bp, bowl, mul(bowl, [0.62, 0.64, 0.72]), light, H.a, 0.4);
  p.clip(bp, () => {
    p.stroke(ellPts(cx - 20 * u, bandY - 0.3 * H.b, 0.25 * H.a, 0.18 * H.b, 200, 300, 0, 16), 4 * u, "#ffffff55");
    if (old) for (let i = 0; i < 9; i++) p.ell(cx + Math.sin(i * 2.3) * 0.8 * H.a, bandY - (0.08 + 0.5 * ((i * 0.37) % 1)) * H.b, (3 + (i % 3) * 2) * u, (2 + (i % 2)) * u, "#8a4b22", 0);
  });
  p.inkRing(bp, ow * 0.9, thick);
  p.band([[cx - H.a * 1.04, bandY], [cx + H.a * 1.04, bandY]], old ? "#a88a4a" : BRASS, 7 * u, 1.8 * u, "round");
  for (const s of [-1, 1]) p.dot(cx + s * 0.55 * H.a, bandY, 2.2 * u, "#fff3c4");
};
const cheeks = (p, H, cx, hc, light, ow, old, u) => {
  const bowl = old ? "#8f8a7e" : STEEL;
  for (const s of [-1, 1]) {
    const x0 = cx + s * 0.78 * H.a, x1 = cx + s * 1.07 * H.a, y0 = hc - H.b * 0.42, y1 = hc + H.b * 0.48;
    const pts = [[x0, y0], [x1, y0], [x1 - s * 0.04 * H.a, y1 - 0.1 * H.b], [x0 + s * 0.06 * H.a, y1], [x0 - s * 0.05 * H.a, (y0 + y1) / 2]];
    p.shadedFill(pts, bowl, mul(bowl, [0.62, 0.64, 0.72]), light, 0.2 * H.a, 0.3);
    p.poly(pts, null, ow * 0.8);
    p.dot((x0 + x1) / 2, (y0 + y1) / 2 - 0.05 * H.b, 2.2 * u, BRASS);
  }
};
const cobweb = (p, cx, cy, r, u) => {
  const g = p.g; g.save(); g.globalAlpha = 0.8;
  for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.05 + 0.9 * i / 6); p.stroke([[cx, cy], [cx + Math.cos(a) * r, cy + Math.sin(a) * r]], 1.1 * u, "#f2f2f2"); }
  for (let k = 1; k <= 4; k++) { const rr = r * k / 4.3, pts = []; for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.05 + 0.9 * i / 6); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } p.stroke(pts, 1 * u, "#f2f2f2"); }
  g.restore();
};

/** cartoon hair (front view): soft cap with tufted fringe, NO dark band across the forehead. styles: short, spiky, bun, curly, long, side, bald */
const drawHair = (p, style, col, H, cx, hc, light, facing, u, behind) => {
  const dark = mul(col, [0.72, 0.7, 0.75]), ow = 4.2 * u, A = H.a * 1.06, B = H.b * 1.06;
  if (behind) { if (style === 'long') { const bp = [[cx - A * 0.98, hc - 0.2 * B], [cx - A * 1.08, hc + 0.8 * B], [cx - A * 1.28, hc + 1.75 * B], [cx - A * 0.7, hc + 1.95 * B], [cx + A * 0.7, hc + 1.95 * B], [cx + A * 1.28, hc + 1.75 * B], [cx + A * 1.08, hc + 0.8 * B], [cx + A * 0.98, hc - 0.2 * B]]; p.shadedFill(bp, col, dark, light, A, 0.3); p.poly(bp, null, ow); for (const sd of [-1, 1]) p.stroke([[cx + sd * A * 0.8, hc + 0.4 * B], [cx + sd * A * 0.85, hc + 1.6 * B]], 2 * u, dark); }
    if (style === 'ponytail') { const sd = -(facing || 1), px = cx + sd * A * 0.95; const pt = [[px, hc - 0.6 * B], [px + sd * 0.45 * A, hc - 0.2 * B], [px + sd * 0.5 * A, hc + 0.9 * B], [px + sd * 0.15 * A, hc + 1.5 * B], [px - sd * 0.05 * A, hc + 0.6 * B]]; p.shadedFill(pt, col, dark, light, A, 0.3); p.poly(pt, null, ow); p.ell(px + sd * 0.05 * A, hc - 0.5 * B, 0.13 * A, 0.1 * B, '#d0304a', 2.4 * u); }
    if (style === 'bun') { p.ell(cx, hc - B * 1.02, 0.36 * A, 0.3 * B, col, ow); p.ell(cx - 0.08 * A, hc - B * 1.08, 0.12 * A, 0.07 * B, mul(col, [1.15, 1.15, 1.15]), 0); }
    return; }
  if (style === 'bald') { for (const sd of [-1, 1]) p.ell(cx + sd * 0.92 * H.a, hc - 0.05 * B, 0.2 * A, 0.32 * B, col, 3 * u); return; }
  const sk = facing * 0.12 * A, cut = hc - (style === 'long' ? 0.42 : style === 'side' ? 0.28 : 0.36) * B;
  const pts = [];
  const a0 = Math.PI + 0.32, a1 = 2 * Math.PI - 0.32;
  for (let i = 0; i <= 28; i++) { const a = a0 + i / 28 * (a1 - a0); pts.push([cx + Math.cos(a) * A, hc + Math.sin(a) * B * 1.02]); }
  // side drops (sideburns) for long/side/short
  const drop = style === 'long' ? 0.3 : style === 'curly' ? 0.25 : 0.12;
  if (drop > 0.2) pts.push([cx + A * 0.99, hc + drop * B]); pts.push([cx + A * 0.86, cut + 0.06 * B]);
  // fringe: rounded tufts from right to left
  const n = style === 'spiky' ? 5 : 4;
  for (let k = n; k >= 0; k--) { const t = k / n, x = cx + sk + (t - 0.5) * 1.64 * A, slant = style === 'side' ? (t - 0.5) * 0.3 * B * (facing || 1) : 0;
    pts.push([x, cut + slant + (k % 2 ? 0.16 : 0.04) * B]); }
  pts.push([cx - A * 0.86, cut + 0.06 * B]); if (drop > 0.2) pts.push([cx - A * 0.99, hc + drop * B]);
  if (style === 'spiky') { const top = []; for (let k = 0; k < 5; k++) { const a = Math.PI * (1.15 + k * 0.175); top.push([cx + Math.cos(a) * A * 0.9, hc + Math.sin(a) * B * 0.9], [cx + Math.cos(a + 0.09) * A * 1.25, hc + Math.sin(a + 0.09) * B * 1.25]); } p.poly([...top, [cx + A * 0.5, hc - 0.5 * B], [cx - A * 0.5, hc - 0.5 * B]], col, ow); }
  if (style === 'curly') for (let k = 0; k < 9; k++) { const a = Math.PI * (1.0 + k / 8); p.ell(cx + Math.cos(a) * A * 0.98, hc + Math.sin(a) * B * 0.98, 0.2 * A, 0.18 * B, col, ow * 0.8); }
  p.shadedFill(pts, col, mul(col, [0.8, 0.78, 0.84]), light, H.a, 0.35);
  p.stroke(pts.slice(0, 29), ow, INK);
  p.stroke(pts.slice(28), 1.6 * u, dark);   // fringe edge: thin, soft — no band
  if (style === 'long') { p.stroke([[cx + sk * 0.3, hc - 1.02 * B], [cx + sk * 0.3 + 2 * u, cut + 0.05 * B]], 2 * u, dark); for (const sd of [-1, 1]) for (let k = 1; k <= 3; k++) p.stroke([[cx + sd * A * (0.15 + k * 0.2), hc - 0.9 * B + k * 0.1 * B], [cx + sd * A * (0.25 + k * 0.2), cut]], 1.4 * u, dark); }
  p.stroke([[cx - 0.35 * A + sk, hc - 0.82 * B], [cx - 0.05 * A + sk, hc - 0.92 * B]], 3 * u, mul(col, [1.35, 1.35, 1.35]));  // highlight
};
/** mitten hand (skin) with thumb, drawn over held props */
const hand = (p, hx, hy, u, skin, dirx = 1) => { p.ell(hx, hy, 7.2 * u, 7.2 * u, skin, 2.2 * u); p.ell(hx + dirx * 5.5 * u, hy - 4.5 * u, 3.2 * u, 3.6 * u, skin, 1.8 * u); };
/** front-facing Roman-era character. opts: expr, blink, look, facing, seed, L/R arm poses, tilt, headTilt, bob, nohelmet, light */
export const romanFront = (p, key, opts = {}) => {
  const O = typeof key === "string" ? OUTFITS[key] : key;
  const { expr = "neutral", blink = 0, look = 0, facing = 0, seed = 3, L = "hang", R = O.spear ? "spear" : "hang", tilt = 0, headTilt = 0,
    bob = 0, nohelmet = false, light = rad(-120), web = false, step = 0 } = opts;
  const lid = lidOf(blink), skin = O.skin ?? SKIN;
  const H = headBlob(seed, 118, facing), W = 2 * H.a, HH = 2 * H.b, u = W / 100;
  const torsoL = O.stout ? 1.12 : 1.08, legsL = 1.38, sole = 975;
  const torsoBot = sole - legsL * HH - bob * HH, chin = torsoBot - torsoL * HH, hc = chin - H.b, hipY = torsoBot - 0.12 * HH;
  const thick = thickAngle(light), ow = 5 * u, cx = 300;
  const legCol = mix(O.tunic, INK, 0.62), armCol = mix(O.tunic, INK, 0.5);
  const helmet = !!O.helmet && !nohelmet, old = O.helmet === "old";
  p.rot = null;
  // ---- cape behind everything ----
  if (O.cape) {
    const cp = [[cx - 0.48 * W, chin + 0.08 * HH], [cx + 0.48 * W, chin + 0.08 * HH], [cx + 0.62 * W, sole - 0.55 * HH], [cx + 0.2 * W, sole - 0.45 * HH], [cx - 0.2 * W, sole - 0.5 * HH], [cx - 0.62 * W, sole - 0.55 * HH]];
    p.gradFill(cp, O.cape, mul(O.cape, [0.6, 0.6, 0.7]), light); p.inkRing(cp, ow * 0.8, thick);
  }
  // ---- legs ----
  const dress = !!O.dress;
  for (const side of [-1, 1]) {
    const up = Math.max(0, Math.sin(Math.PI * 2 * (step + (side > 0 ? 0.5 : 0)))) * 30 * (step ? 1 : 0);
    const hx = cx + side * 16 * u, fx = cx + side * 22 * u, fy = sole - 4 * u - up;
    p.band(curve([hx, hipY], [(hx + fx) / 2 + side * 2 * u, (hipY + fy) / 2], [fx, fy]), O.pants || legCol, 6.4 * u, 1.5 * u, "round");
    if (O.straps) { p.band([[fx + side * 1 * u, fy - 0.34 * HH], [fx, fy - 4 * u]], '#3a2416', 8.4 * u, 1.4 * u, 'butt'); p.stroke([[fx - 4 * u, fy - 0.3 * HH], [fx + 4 * u, fy - 0.3 * HH]], 1.4 * u, '#6a4a2e'); }
    { const kx = (hx + fx) / 2 + side * 2 * u, ky = (hipY + fy) / 2; p.arc(kx, ky, 3.2 * u, 2.2 * u, side > 0 ? 200 : 200, 340, 1.2 * u, mul(O.pants || legCol, [0.75, 0.72, 0.72])); }
    const shoe = O.shoe || (O.helmet ? LEATHER : "#3a2a22");
    p.ell(fx + side * 5 * u, fy - 1 * u, 11 * u, 6 * u, shoe, 1.8 * u, 180, 360); p.stroke([[fx + side * 5 * u - 11 * u, fy - 1 * u], [fx + side * 5 * u + 11 * u, fy - 1 * u]], 3.4 * u, INK); p.stroke([[fx + side * 5 * u - 9.5 * u, fy - 1 * u], [fx + side * 5 * u + 9.5 * u, fy - 1 * u]], 1.4 * u, '#d8cbb8');
    if (O.helmet) for (let k = 1; k <= 3; k++) p.stroke([[fx - 4 * u, fy - k * 0.07 * HH], [fx + 4 * u, fy - k * 0.07 * HH - 2 * u]], 2 * u, LEATHER);
  }
  if (O.hair && !helmet && ['long', 'ponytail'].includes(O.hairStyle)) { p.rot = null; drawHair(p, O.hairStyle, O.hair, H, cx, hc, light, facing, u, true); }
  // ---- upper body ----
  p.rot = tilt ? [rad(tilt), cx, hipY] : null;
  const T = { a: (0.4 * W) / 1.06 * (O.stout ? 1.12 : 1), b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.6, egg: O.stout ? 0.17 : 0.12, asym: 0.04 * facing, rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = cx + 3 * u * facing, tcy = torsoBot - T.b;
  let tp = blobPts(tcx, tcy, T);
  const fem = O.female && !O.straps;
  if (fem) { const top = chin + 0.1 * HH, bot = torsoBot + 0.04 * HH, H2 = bot - top, half = (k) => { // k 0 (top) .. 1 (bottom)
      const sh = 0.78, wa = O.straps ? 0.64 : 0.58, hi = O.straps ? 0.86 : 1.04; return T.a * (k < 0.12 ? sh * (0.55 + 0.45 * Math.sin(k / 0.12 * Math.PI / 2)) : k < 0.5 ? sh + (wa - sh) * Math.sin((k - 0.12) / 0.38 * Math.PI / 2) : k < 0.85 ? wa + (hi - wa) * Math.sin((k - 0.5) / 0.35 * Math.PI / 2) : hi * Math.cos((k - 0.85) / 0.15 * Math.PI / 2 * 0.9)); };
    const L = [], Rr = []; for (let i = 0; i <= 30; i++) { const k = i / 30, y = top + k * H2, w = Math.max(half(k), 0.05 * T.a); Rr.push([tcx + w, y]); L.push([tcx - w, y]); }
    tp = [...Rr, ...L.reverse()]; }
  const S = (side) => fem ? [tcx + side * 0.56 * T.a, chin + 0.24 * HH] : [tcx + side * 0.8 * T.a, chin + 0.14 * HH];
  const arm = (side, pose) => {
    const s = S(side), X = (k) => tcx + side * (T.a * 1.1 + k * u);
    switch (pose) {
      case "spear": return { pts: [s, [X(6), s[1] + 0.42 * HH], [X(10), s[1] + 0.2 * HH]], front: false };
      case "point": return { pts: [s, [X(28), s[1] - 0.02 * HH], [X(62), s[1] - 0.1 * HH]], front: false, finger: true };
      case "up": return { pts: [s, [X(14), s[1] - 0.3 * HH], [X(22), s[1] - 0.75 * HH]], front: false };
      case "wave": return { pts: [s, [X(16), s[1] - 0.2 * HH], [X(30 + 10 * Math.sin(opts.wv || 0)), s[1] - 0.62 * HH]], front: false };
      case "hip": return { pts: [s, [X(22), s[1] + 0.3 * HH], [tcx + side * T.a * 0.95, torsoBot - 0.3 * HH]], front: false };
      case "belly": return { pts: [s, [X(8), s[1] + 0.45 * HH], [tcx + side * 0.25 * T.a, torsoBot - 0.35 * HH]], front: true };
      case "temple": return { pts: [s, [X(26), s[1] + 0.05 * HH], [cx + side * (H.a + 16 * u), hc - 0.1 * HH]], front: false, swirl: true };
      case "lift": return { pts: [s, [X(20), s[1] - 0.25 * HH], [X(4), s[1] - 0.82 * HH]], front: false };
      case "grip": { const hi = opts.gripHi === (side < 0 ? "L" : "R") ? 0.16 * HH : 0; return { pts: [s, [cx + side * (H.a * 1.12), hc - 0.05 * HH - hi * 0.4], [cx + side * 7 * u, hc - H.b - 0.18 * HH - hi]], front: true }; }   // agarrado na corda acima da cabeça (mão alta alterna)
      case "shield": return { pts: [s, [X(4), s[1] + 0.4 * HH], [tcx + side * 0.6 * T.a, torsoBot - 0.1 * HH]], front: true };
      case "cross": return { pts: [s, [X(2), s[1] + 0.38 * HH], [tcx - side * 0.45 * T.a, s[1] + 0.32 * HH]], front: true };
      case "reach": { const lf = (opts.lift || 0) * 0.62 * HH; return { pts: [s, [X(42), s[1] - 0.12 * HH - lf * 0.6], [X(82), s[1] - 0.5 * HH - lf]], front: false }; }
      case "cheek": return { pts: [s, [X(16), s[1] + 0.05 * HH], [cx + side * (H.a + 2 * u), hc + 0.25 * H.b]], front: false };
      case "thumb": return { pts: [s, [X(20), s[1] + 0.12 * HH], [X(44), s[1] - 0.12 * HH]], front: false, thumb: true };
      case "hold": return { pts: [s, [X(8), s[1] + 0.42 * HH], [tcx + side * 0.28 * T.a, s[1] + 0.5 * HH]], front: true };
      case "give": return { pts: [s, [X(30), s[1] + 0.3 * HH], [X(64), s[1] + 0.22 * HH]], front: false };
      default: return { pts: [s, [X(4), s[1] + 0.48 * HH], [X(3), chin + 1.04 * HH]], front: false };
    }
  };
  const arms = [arm(-1, L), arm(1, R)];
  const drawArm = (a) => {
    const cp = curve(a.pts[0], a.pts[1], a.pts[2]), sleeve = mix(O.tunic, "#000000", 0.08);
    p.band(cp, sleeve, 7 * u, 1.7 * u, "round");
    { const [sx, sy] = a.pts[0], [nx, ny] = cp[2], dx = nx - sx, dy = ny - sy, l = Math.hypot(dx, dy) || 1; // seamless shoulder: cover the seam with sleeve colour, inside the body
      p.ell(sx - dx / l * 2 * u, sy - dy / l * 2 * u, 6.2 * u, 6.2 * u, sleeve, 0); p.ell(sx + dx / l * 2 * u, sy + dy / l * 2 * u, 4.6 * u, 4.6 * u, sleeve, 0); }
    const [hx, hy] = a.pts[2], dirx = Math.sign(hx - cx) || 1;
    const holds = (opts.holdL && a === arms[0]) || (opts.holdR && a === arms[1]);
    if (holds) hand(p, hx, hy, u, skin, -dirx);   // palm + thumb behind the object
    if (opts.holdL && a === arms[0]) PROP[opts.holdL](p, hx, hy, u, opts);
    if (opts.holdR && a === arms[1]) PROP[opts.holdR](p, hx, hy, u, opts);
    if (holds) { const fp = []; for (let i = 0; i <= 12; i++) { const t = -0.5 + i / 12; fp.push([hx + dirx * 1.5 * u + Math.cos(t * 2.4) * 6.2 * u * -dirx * 0.2 + t * 2 * u, hy - 1 * u + t * 11 * u]); }
      p.band(fp, skin, 5.4 * u, 1.8 * u, 'round'); for (const t of [-0.17, 0.17]) p.stroke([[hx - 2.5 * u, hy - 1 * u + t * 11 * u], [hx + 2.5 * u, hy - 1 * u + t * 11 * u]], 1.1 * u, mul(skin, [0.7, 0.6, 0.55])); }
    if (opts.holdBoth && a === arms[1]) { const [lx, ly] = arms[0].pts[2]; PROP[opts.holdBoth](p, (lx + hx) / 2, (ly + hy) / 2, u, opts); hand(p, lx, ly, u, skin, -1); }
    if (a.finger) { const dx = a.pts[2][0] - a.pts[1][0], dy = a.pts[2][1] - a.pts[1][1], l = Math.hypot(dx, dy); p.band([[hx, hy], [hx + dx / l * 14 * u, hy + dy / l * 14 * u]], skin, 3.4 * u, 1.6 * u, "round"); }
    if (!holds) hand(p, hx, hy, u, skin, a.thumb ? 0 : dirx);
    if (a.thumb) p.band([[hx, hy - 3 * u], [hx + dirx * 3 * u, hy - 14 * u]], skin, 4 * u, 1.6 * u, "round");
  };
  // spear behind
  if (O.spear && R === "spear") {
    const [hx, hy] = arms[1].pts[2], s0 = [hx + 2 * u, sole - 2 * u], s1 = [hx - 3 * u, 70];
    p.band([s0, s1], old ? "#6d5236" : "#8a5a34", 4.2 * u, 1.4 * u, "round");
    const tip = [[s1[0] - 7 * u, s1[1] + 6 * u], [s1[0], s1[1] - 34 * u], [s1[0] + 7 * u, s1[1] + 6 * u], [s1[0], s1[1] + 14 * u]];
    p.poly(tip, old ? "#8b7c6a" : "#c9cfd6", 2 * u);
    if (web) cobweb(p, s1[0] - 2 * u, s1[1] + 60 * u, 70 * u, u);
  }
  // torso
  if (dress) {
    const D = { a: 0.5 * W * 0.98, b: 0.5 * ((sole - 0.35 * HH) - (chin - 0.2 * HH)), nTop: 2.0, nBot: 3.0, egg: 0.35, asym: 0, rot: 0, noise: 0.006, seed: seed + 9 };
    const dp = blobPts(cx, sole - 0.35 * HH - D.b, D);
    p.gradFill(dp, O.dress, mul(O.dress, SH_CLOTH), light); p.inkRing(dp, ow, thick);
  }
  // skirt / pteruges below the torso
  if (!dress && O.armor) {
    const sk = [[tcx - 0.92 * T.a, torsoBot - 0.2 * HH], [tcx + 0.92 * T.a, torsoBot - 0.2 * HH], [tcx + 1.0 * T.a, torsoBot + 0.3 * HH], [tcx - 1.0 * T.a, torsoBot + 0.3 * HH]];
    p.gradFill(sk, O.tunic, mul(O.tunic, SH_CLOTH), light); p.poly(sk, null, ow * 0.8);
    if (O.armor) for (let i = -3; i <= 3; i++) { const x = tcx + i * 0.27 * T.a, st = [[x - 9 * u, torsoBot - 0.05 * HH], [x + 9 * u, torsoBot - 0.05 * HH], [x + 9 * u, torsoBot + 0.22 * HH], [x - 9 * u, torsoBot + 0.22 * HH]]; p.poly(st, old ? "#5e4632" : LEATHER, 1.6 * u); }
  }
  if (fem) { const nk = [[tcx - 0.17 * T.a, chin - 0.12 * HH], [tcx + 0.17 * T.a, chin - 0.12 * HH], [tcx + 0.2 * T.a, chin + 0.16 * HH], [tcx - 0.2 * T.a, chin + 0.16 * HH]]; p.poly(nk, mul(skin, [0.92, 0.88, 0.86]), 1.8 * u); }
  if (O.gear) for (const sd of [-1, 1]) { const gx = tcx + sd * 0.92 * T.a, gy = torsoBot - 0.06 * HH, MT = '#5c626b';
    const cs = [[gx - sd * 6 * u, gy - 7 * u], [gx + sd * 26 * u, gy - 9 * u], [gx + sd * 30 * u, gy - 3 * u], [gx + sd * 26 * u, gy + 5 * u], [gx - sd * 6 * u, gy + 6 * u]];
    p.gradFill(cs, '#7d838c', MT, light); p.poly(cs, null, 1.8 * u); for (const k of [6, 16]) p.dot(gx + sd * k * u, gy - 1 * u, 1.3 * u, '#c9ccd2');
    p.band([[gx + sd * 29 * u, gy - 3 * u], [gx + sd * 36 * u, gy - 6 * u]], '#3a3e44', 3 * u, 1 * u, 'round');
    if (opts.hookFire && sd === (opts.hookFire > 0 ? 1 : -1)) { const ex = gx + sd * 150 * u, ey = gy - 230 * u; p.stroke([[gx + sd * 36 * u, gy - 6 * u], [ex, ey]], 1.6 * u, '#e8e2d4'); p.poly([[ex, ey], [ex - sd * 4 * u, ey - 14 * u], [ex + sd * 8 * u, ey - 8 * u]], '#9aa0a8', 1.2 * u); } }
  p.gradFill(tp, O.tunic, mul(O.tunic, SH_CLOTH), light);
  p.clip(tp, () => {
    if (O.armor) {
      const top = chin - 0.1 * HH, bot = torsoBot - 0.25 * HH, n = 5;
      for (let i = 0; i < n; i++) {
        const y0 = top + (bot - top) * i / n, y1 = top + (bot - top) * (i + 1) / n;
        const c = old ? (i % 2 ? "#8d8679" : "#9a9384") : (i % 2 ? "#a7b0ba" : "#bcc4cc");
        p.poly([[tcx - 1.5 * T.a, y0], [tcx + 1.5 * T.a, y0 + 3 * u], [tcx + 1.5 * T.a, y1 + 3 * u], [tcx - 1.5 * T.a, y1]], c, 1.8 * u);
      }
      p.band([[tcx - 1.4 * T.a, torsoBot - 0.2 * HH], [tcx + 1.4 * T.a, torsoBot - 0.2 * HH]], LEATHER, 0.08 * HH, 1.5 * u);
      for (let i = -2; i <= 2; i++) p.dot(tcx + i * 0.3 * T.a, torsoBot - 0.2 * HH, 2.4 * u, BRASS);
      if (old) for (let i = 0; i < 5; i++) p.ell(tcx + Math.sin(i * 1.7) * 0.7 * T.a, top + (bot - top) * ((i * 0.31) % 1), 6 * u, 3 * u, "#8a4b22", 0);
    } else {
      p.band([[tcx - 1.4 * T.a, torsoBot - 0.24 * HH], [tcx + 1.4 * T.a, torsoBot - 0.24 * HH]], O.apron ? "#5a3b2a" : "#e2c27a", 0.05 * HH, 1.2 * u);
      if (O.toga) p.band([[tcx - 1.0 * T.a, chin - 0.1 * HH], [tcx + 1.1 * T.a, torsoBot - 0.1 * HH]], O.toga, 0.16 * HH, 1.6 * u);
      if (O.apron) p.poly([[tcx - 0.55 * T.a, torsoBot - 0.2 * HH], [tcx + 0.55 * T.a, torsoBot - 0.2 * HH], [tcx + 0.6 * T.a, torsoBot + 0.2 * HH], [tcx - 0.6 * T.a, torsoBot + 0.2 * HH]], O.apron, 1.6 * u);
      if (fem) p.ell(tcx, chin + 0.11 * HH, 0.24 * T.a, 0.07 * HH, mul(skin, [0.92, 0.88, 0.86]), 1.6 * u, 0, 180);
      else p.stroke([[tcx - 0.2 * T.a, chin + 0.02 * HH], [tcx, chin + 0.16 * HH], [tcx + 0.2 * T.a, chin + 0.02 * HH]], 2 * u);
      if (O.patches) { p.poly(rrect(tcx - 0.62 * T.a, chin + 0.3 * HH, tcx - 0.22 * T.a, chin + 0.62 * HH, 2 * u), "#a8865c", 1.6 * u);
        p.poly(rrect(tcx + 0.25 * T.a, chin + 0.62 * HH, tcx + 0.62 * T.a, chin + 0.88 * HH, 2 * u), "#6d5236", 1.6 * u);
        for (let i = 0; i < 4; i++) p.stroke([[tcx - 0.6 * T.a + i * 0.12 * T.a, chin + 0.28 * HH], [tcx - 0.6 * T.a + i * 0.12 * T.a, chin + 0.33 * HH]], 1.2 * u); }
    }
  });
  p.clip(tp, () => { const fc = mul(O.tunic, [0.8, 0.78, 0.82]); if (!O.naked) { p.arc(tcx - 0.5 * T.a, torsoBot - 0.45 * HH, 0.3 * T.a, 0.08 * HH, 200, 300, 1.6 * u, fc); p.arc(tcx + 0.45 * T.a, torsoBot - 0.6 * HH, 0.25 * T.a, 0.07 * HH, 230, 330, 1.6 * u, fc);
    if (!O.female && !O.straps) p.poly([[tcx - 0.12 * T.a, chin + 0.02 * HH], [tcx - 0.42 * T.a, chin + 0.02 * HH], [tcx - 0.16 * T.a, chin + 0.3 * HH]], mul(O.tunic, [1.12, 1.12, 1.12]), 1.4 * u),
    p.poly([[tcx + 0.12 * T.a, chin + 0.02 * HH], [tcx + 0.42 * T.a, chin + 0.02 * HH], [tcx + 0.16 * T.a, chin + 0.3 * HH]], mul(O.tunic, [1.12, 1.12, 1.12]), 1.4 * u); } });
  if (O.straps) p.clip(tp, () => { const jy = chin + 0.5 * HH; p.poly([[tcx - 1.6 * T.a, jy], [tcx + 1.6 * T.a, jy - 0.03 * HH], [tcx + 1.6 * T.a, torsoBot + 0.2 * HH], [tcx - 1.6 * T.a, torsoBot + 0.2 * HH]], '#ece4d0', 0); p.stroke([[tcx - 1.6 * T.a, jy], [tcx + 1.6 * T.a, jy - 0.03 * HH]], 2.2 * u, mul(O.tunic, [0.7, 0.7, 0.7])); });
  if (O.straps) p.clip(tp, () => { const BL = '#3a2416', BK = '#c9a24a';
    const fTop = chin + 0.1 * HH, fBot = torsoBot + 0.04 * HH, beltY = torsoBot - 0.2 * HH, chestY = chin + 0.41 * HH;
    const xs = [0.42, 0.48, 0.5];
    for (const sd of [-1, 1]) p.band([[tcx + sd * xs[0] * T.a, chin + 0.02 * HH], [tcx + sd * xs[1] * T.a, chestY], [tcx + sd * xs[2] * T.a, beltY]], BL, 0.03 * HH, 0.9 * u);
    p.band([[tcx - 0.95 * T.a, chestY + 0.01 * HH], [tcx + 0.95 * T.a, chestY]], BL, 0.026 * HH, 0.8 * u);
    p.band([[tcx - 1.05 * T.a, beltY], [tcx + 1.05 * T.a, beltY]], BL, 0.045 * HH, 1 * u);
    for (const sd of [-1, 1]) p.poly(rrect(tcx + sd * xs[1] * T.a - 3.5 * u, chestY - 0.04 * HH, tcx + sd * xs[1] * T.a + 3.5 * u, chestY + 0.04 * HH, 1.2 * u), BK, 1 * u);
    p.poly(rrect(tcx - 6 * u, beltY - 0.04 * HH, tcx + 6 * u, beltY + 0.04 * HH, 1.5 * u), BK, 1.2 * u); });
  p.inkRing(tp, ow, thick);
  for (const a of arms) if (!a.front) drawArm(a);
  if (O.armor) for (const s of [-1, 1]) { // shoulder plates
    const sp = ellPts(tcx + s * 0.72 * T.a, chin + 0.1 * HH, 0.42 * T.a, 0.13 * HH, 180, 360, s * 8, 20);
    p.poly(sp, old ? "#9a9384" : "#c5ccd3", 1.8 * u);
  }
  if (O.moss) {/* reserved */}
  for (const a of arms) if (a.front) drawArm(a);
  // shield in front, held by the left hand
  if (O.shield && L === "shield") {
    const sx = tcx - 0.55 * T.a, sy = torsoBot + 0.05 * HH, sw = 0.36 * W, sh = 0.78 * HH;
    const sp = rrect(sx - sw, sy - sh, sx + sw, sy + sh, 8 * u);
    p.gradFill(sp, "#c0302c", "#7d1d22", light);
    p.clip(sp, () => {
      p.band([[sx - sw, sy], [sx + sw, sy]], BRASS, 6 * u, 1.2 * u);
      p.band([[sx, sy - sh], [sx, sy + sh]], BRASS, 6 * u, 1.2 * u);
      for (const s of [-1, 1]) { p.stroke([[sx + s * 12 * u, sy - 14 * u], [sx + s * 34 * u, sy - 46 * u], [sx + s * 22 * u, sy - 44 * u], [sx + s * 46 * u, sy - 74 * u]], 3.5 * u, BRASS); p.stroke([[sx + s * 12 * u, sy + 14 * u], [sx + s * 34 * u, sy + 46 * u], [sx + s * 22 * u, sy + 44 * u], [sx + s * 46 * u, sy + 74 * u]], 3.5 * u, BRASS); }
      p.stroke(ellPts(sx - sw * 0.5, sy - sh * 0.7, sw * 0.3, sh * 0.1, 200, 320, 0, 10), 3 * u, "#ffffff44");
    });
    p.ell(sx, sy, 13 * u, 13 * u, "#e6c068", 2.2 * u);
    p.inkRing(sp, ow, thick);
  }
  // ---- head ----
  const [cpx, cpy] = rotAbout([cx, chin], rad(tilt), [cx, hipY]);
  const Ah = tilt + headTilt;
  p.rot = Ah ? [rad(Ah), cx, chin, cpx - cx, cpy - chin] : null;
  if (helmet) galea(p, H, cx, hc, light, thick, ow, old, u);
  const hp = blobPts(cx, hc, H);
  if (O.hair && !helmet && !['long', 'ponytail'].includes(O.hairStyle)) drawHair(p, O.hairStyle || 'short', O.hair, H, cx, hc, light, facing, u, true);
  if (!helmet) for (const sd of [-1, 1]) { const ex = cx + sd * H.a * 0.97, ey = hc + 4 * u; p.ell(ex, ey, 9 * u, 12 * u, skin, ow * 0.7); p.arc(ex + sd * 1 * u, ey, 4 * u, 6 * u, sd > 0 ? -70 : 110, sd > 0 ? 70 : 250, 1.4 * u, mul(skin, [0.75, 0.62, 0.58])); }
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
  p.clip(hp, () => { const g = p.g; g.save(); g.globalAlpha = 0.16; p.ell(cx - Math.cos(light) * H.a * 0.55, hc - Math.sin(light) * H.b * 0.55, H.a * 0.95, H.b * 1.05, mul(skin, [0.55, 0.42, 0.42]), 0); g.restore();
    g.save(); g.globalAlpha = 0.12; p.ell(cx + Math.cos(light) * H.a * 0.3, hc + Math.sin(light) * H.b * 0.35, H.a * 0.45, H.b * 0.35, '#ffffff', 0); g.restore(); });
  p.inkRing(hp, ow, thick);
  if (helmet) {
    const bandY = hc - H.b * 0.42, bp = ellPts(cx, bandY, H.a * 1.05, H.b * 0.66, 180, 360, 0, 48);
    p.shadedFill(bp, old ? "#8f8a7e" : STEEL, mul(old ? "#8f8a7e" : STEEL, [0.62, 0.64, 0.72]), light, H.a, 0.4);
    p.clip(bp, () => { p.stroke(ellPts(cx - 20 * u, bandY - 0.3 * H.b, 0.25 * H.a, 0.18 * H.b, 200, 300, 0, 16), 5 * u, "#ffffff66");
      if (old) for (let i = 0; i < 9; i++) p.ell(cx + Math.sin(i * 2.3) * 0.8 * H.a, bandY - (0.08 + 0.5 * ((i * 0.37) % 1)) * H.b, (4 + (i % 3) * 2) * u, (2.5 + (i % 2)) * u, "#8a4b22", 0); });
    p.poly(bp, null, ow * 0.9);
    p.band([[cx - H.a * 1.05, bandY], [cx + H.a * 1.05, bandY]], old ? "#a88a4a" : BRASS, 7 * u, 1.8 * u, "round");
    p.poly(rrect(cx - 4 * u, bandY - 0.55 * H.b, cx + 4 * u, bandY - 3 * u, 2 * u), old ? "#a88a4a" : BRASS, 1.5 * u);
    cheeks(p, H, cx, hc, light, ow, old, u);
  } else if (O.cap) hatOn(p, { hat: "cap", cap: O.cap, jacket: O.tunic }, hp, H, cx, hc, light, seed, facing, false);
  else if (O.hair) drawHair(p, O.hairStyle || 'short', O.hair, H, cx, hc, light, facing, u, false);
  if (opts.hardhat) { const hy = hc - H.b * 0.32, hw = H.a * 1.12; const dome = []; for (let i = 0; i <= 24; i++) { const t = Math.PI + i / 24 * Math.PI; dome.push([cx + Math.cos(t) * hw, hy + Math.sin(t) * H.b * 0.95]); }
    p.shadedFill(dome, '#ffcc22', '#d99a10', light, hw, 0.35); p.poly(dome, null, ow); p.stroke([[cx, hy - H.b * 0.93], [cx, hy]], 3 * u, '#d99a10');
    p.poly([[cx - hw * 1.18, hy], [cx + hw * 1.18, hy], [cx + hw * 1.1, hy + 7 * u], [cx - hw * 1.1, hy + 7 * u]], '#e8b81a', ow * 0.8);
    p.poly(rrect(cx - 12 * u, hy - 30 * u, cx + 12 * u, hy - 10 * u, 4 * u), '#7a7a80', 2 * u); p.ell(cx, hy - 20 * u, 7 * u, 7 * u, '#fff6c0', 1.6 * u); }
  else if (O.helmet && nohelmet) { // bald old head with white side tufts
    for (const s of [-1, 1]) p.ell(cx + s * 0.9 * H.a, hc - 0.1 * H.b, 0.22 * H.a, 0.3 * H.b, "#f4f1ea", 3 * u);
  }
  if (O.beard) {
    const bd = blobPts(cx + 6 * u * facing, hc + 0.85 * H.b, { a: 0.62 * H.a, b: 0.75 * H.b, nTop: 2.4, nBot: 1.6, egg: -0.35, asym: 0, rot: 0, noise: 0.02, seed: seed + 4 });
    p.shadedFill(bd, O.beard, mul(O.beard, [0.86, 0.86, 0.92]), light, 0.6 * H.a, 0.3);
    p.clip(bd, () => { for (let i = -3; i <= 3; i++) p.stroke([[cx + i * 9 * u, hc + 0.45 * H.b], [cx + i * 7 * u, hc + 1.35 * H.b]], 1.2 * u, "#c9c4bb"); });
    p.inkRing(bd, ow * 0.8, thick);
  }
  for (const sd of [-1, 1]) { const g = p.g; g.save(); g.globalAlpha = 0.28; p.ell(cx + 7 * u * facing + sd * 27 * u, hc + 12 * u, 8 * u, 5 * u, "#ff7a6a", 0); g.restore(); }
  LIPCOL = O.female ? '#b8324e' : null;
  faceFront(p, cx, hc, W, expr, facing, look, lid, helmet, skin, O.beard ? O.beard : O.moustache, !!O.stout);
  LIPCOL = null;
  if (!O.beard) { const nx = cx + 9 * u * facing; p.arc(nx, hc + 9 * u, 4 * u, 3 * u, 20, 160, 2 * u, mul(skin, [0.65, 0.5, 0.45])); }
  if (O.female) { const fx = cx + 7 * u * facing; for (const sd of [-1, 1]) { const ex = fx + sd * 13 * u, ey = hc - 6 * u; for (let k = 0; k < 3; k++) p.stroke([[ex + sd * (4 + k * 3) * u, ey - (3 - k) * u], [ex + sd * (8 + k * 4) * u, ey - (8 - k * 1.5) * u]], 2 * u); }
  }
  if (O.brows) for (const s of [-1, 1]) p.ell(cx + 7 * u * facing + s * 14 * u, hc - 20 * u, 11 * u, 5 * u, O.brows, 2 * u);
  if (O.beard) { // re-draw the mouth over the beard for open mouths
    if (expr === "shock" || expr === "snore") p.ell(cx + 8 * u * facing, hc + 22 * u, 6 * u, 7 * u, "#5a1e28", 2 * u);
  }
  p.rot = null;
  if (arms.some((a) => a.swirl)) { // cuckoo swirl next to the temple
    const a = arms.find((x) => x.swirl), [hx, hy] = a.pts[2], ph = opts.swirl || 0, pts = [];
    for (let i = 0; i < 40; i++) { const t = i / 40 * Math.PI * 4 + ph, r = (4 + i * 0.7) * u; pts.push([hx + Math.cos(t) * r, hy - 40 * u + Math.sin(t) * r]); }
    p.stroke(pts, 3 * u, "#ffffff"); p.stroke(pts, 1.4 * u, INK);
  }
};

/** loose helmet prop card (lifted off the old soldier) */
export const helmetCard = (p) => {
  const H = headBlob(3, 118, 0), u = 2 * H.a / 100, hc = 560, light = rad(-120), thick = thickAngle(light), ow = 5 * u;
  galea(p, H, 300, hc, light, thick, ow, true, u);
  const bandY = hc - H.b * 0.42, bp = ellPts(300, bandY, H.a * 1.05, H.b * 0.66, 180, 360, 0, 48);
  // dark inside visible from below
  p.ell(300, bandY, H.a * 1.05, 0.12 * H.b, "#2a221e", 0);
  p.shadedFill(bp, "#8f8a7e", mul("#8f8a7e", [0.62, 0.64, 0.72]), light, H.a, 0.4);
  p.clip(bp, () => { for (let i = 0; i < 9; i++) p.ell(300 + Math.sin(i * 2.3) * 0.8 * H.a, bandY - (0.08 + 0.5 * ((i * 0.37) % 1)) * H.b, (4 + (i % 3) * 2) * u, (2.5 + (i % 2)) * u, "#8a4b22", 0); });
  p.poly(bp, null, ow * 0.9);
  p.band([[300 - H.a * 1.05, bandY], [300 + H.a * 1.05, bandY]], "#a88a4a", 7 * u, 1.8 * u, "round");
  cheeks(p, H, 300, hc, light, ow, true, u);
};

/** ZZZ for the sleeping guard */
export const fxZ = (p, t) => {
  const g = p.g; g.save(); g.font = "900 120px Arial Black, Arial"; g.lineJoin = "round";
  for (let i = 0; i < 3; i++) {
    const k = (t + i / 3) % 1, x = 220 + i * 70 + Math.sin(k * 6) * 20, y = 700 - k * 500, s = 0.5 + k * 0.7;
    g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = Math.min(1, (1 - k) * 2.5);
    g.lineWidth = 16; g.strokeStyle = INK; g.strokeText("Z", 0, 0); g.fillStyle = "#ffffff"; g.fillText("Z", 0, 0); g.restore();
  }
  g.restore();
};
/** falling leaf */
export const fxLeaf = (p, col) => { p.poly([[300, 380], [420, 470], [300, 620], [180, 470]], col, 14); p.stroke([[300, 400], [300, 600]], 8); };
/** dust cloud puff (k 0..1 growth) */
export const fxDust = (p, k, col = "#e8dcc4") => {
  const g = p.g; g.save(); g.globalAlpha = Math.max(0, 1 - k * k);
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, r = 90 + 150 * k; p.ell(300 + Math.cos(a) * r, 520 + Math.sin(a) * r * 0.6, 120 + 60 * k, 100 + 50 * k, col, 12); }
  p.ell(300, 520, 170 + 110 * k, 140 + 80 * k, col, 0);
  g.restore();
};
export const fxDrip = (p) => p.ell(300, 500, 40, 64, "#9fd4ff", 10);
export const fxWood = (p, seed) => { p.poly([[200, 420], [400, 400], [420, 560], [230, 600]], "#5b3d22", 14); p.stroke([[240, 450], [380, 440]], 6, "#3a2614"); p.ell(330, 520, 26, 18, "#4d7a32", 0); };

export const headCenter = (seed = 3) => { const H = headBlob(seed, 118, 0), HH = 2 * H.b; return 975 - 1.38 * HH - 1.08 * HH - H.b; };

/** single feather drifting */
export const fxFeather = (p) => { p.poly([[300, 380], [330, 470], [305, 640], [275, 470]], "#2f282b", 8); p.stroke([[302, 400], [303, 630]], 4, "#6a6064"); };
/** small cartoon splash of soap water */
export const fxSoap = (p, t) => { const g = p.g; g.save(); g.globalAlpha = Math.max(0, 1 - t);
  for (let i = 0; i < 9; i++) { const a = -Math.PI * (0.1 + 0.8 * i / 8), r = 80 + 260 * t; p.ell(300 + Math.cos(a) * r, 700 + Math.sin(a) * r * 1.2 + 300 * t * t, 26 - 10 * t, 34 - 10 * t, "#efe4c0", 8); }
  g.restore(); };

/** spit blob flying (t 0..1) */
export const fxSpit = (p, t) => { const g = p.g; g.save(); g.globalAlpha = 1 - t * 0.3; p.ell(300, 500, 60 + 40 * t, 45 + 30 * t, "#e9f4e6", 8); for (let i = 0; i < 6; i++) p.ell(300 + Math.cos(i) * (90 + 120 * t), 500 + Math.sin(i * 1.7) * (60 + 80 * t), 18, 14, "#e9f4e6", 5); g.restore(); };
/** a straw hat (sitting on a head) */
export const fxHat = (p) => { p.ell(300, 520, 150, 34, "#5a3a22", 10); p.ell(300, 480, 82, 60, "#5a3a22", 10, 180, 360); p.stroke([[222, 504], [378, 504]], 12, "#c9a24a"); };
/** idea burst with a tiny camel inside a thought cloud */
export const fxThought = (p, t) => { const g = p.g; g.save(); g.globalAlpha = Math.min(1, t * 3);
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; p.ell(300 + Math.cos(a) * 170, 430 + Math.sin(a) * 120, 90, 70, "#ffffff", 9); }
  p.ell(300, 430, 200, 140, "#ffffff", 0); p.ell(150, 640, 30, 24, "#ffffff", 7); p.ell(110, 700, 18, 14, "#ffffff", 6);
  g.translate(300, 430); g.scale(0.36, 0.36); g.translate(-330, -560); fxCamel(p, { walk: 0 }); g.restore(); };

// ===== bichos redesenhados (ver _charlab/web/animals.js) =====
// Bichos redesenhados (mesmo acabamento dos personagens): formas fundidas num contorno único, sombreado, olhos com brilho.
// Espaço do cartão: x -200..800 (centro 300), y 0..1000, pés em ~975. Todos olham para a DIREITA (use flip no cartão para virar).
const A_LIGHT = -2.094, A_TH = Math.atan2(-Math.sin(A_LIGHT) + 0.8, -Math.cos(A_LIGHT));
const aEll = (cx, cy, a, b, rot = 0, n = 44) => { const c = Math.cos(rot), s = Math.sin(rot), o = []; for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2, x = Math.cos(t) * a, y = Math.sin(t) * b; o.push([cx + x * c - y * s, cy + x * s + y * c]); } return o; };
const aExt = (pts) => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return Math.max(x1 - x0, y1 - y0) / 2; };
/** tapered limb/neck polygon along a polyline, width w0 -> w1 */
const aTaper = (pts, w0, w1, n = 16) => {
  const P = []; for (let i = 0; i <= n; i++) { const t = i / n, k = t * (pts.length - 1), j = Math.min(pts.length - 2, Math.floor(k)), u = k - j; P.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * u, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * u]); }
  const L = [], R = []; P.forEach((q, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)]; let nx = b[1] - a[1], ny = a[0] - b[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l; const w = (w0 + (w1 - w0) * i / n) / 2; L.push([q[0] + nx * w, q[1] + ny * w]); R.push([q[0] - nx * w, q[1] - ny * w]); });
  return [...L, ...R.reverse()];
};
/** draw a group of overlapping shapes as ONE silhouette: all ink first, then all fills */
const aGroup = (p, shapes, w = 9) => { for (const s of shapes) if (!s.noInk) p.inkRing(s.pts, s.w ?? w, A_TH); for (const s of shapes) { const R = s.R || aExt(s.pts); if (s.flat) p.poly(s.pts, s.col, 0); else p.shadedFill(s.pts, s.col, s.shadow || mul(s.col, [0.76, 0.72, 0.8]), A_LIGHT, R, 0.35); } };
const aEye = (p, x, y, r, o = {}) => { p.ell(x, y, r, r * 1.05, '#ffffff', 4.5); const lx = (o.look || 0) * r * 0.3; p.ell(x + lx + r * 0.15, y + r * 0.12, r * 0.52, r * 0.58, o.iris || '#2a1a14', 0); p.dot(x + lx + r * 0.32, y - r * 0.12, r * 0.18, '#ffffff');
  if (o.lid) { p.clip(aEll(x, y, r * 1.02, r * 1.07), () => p.poly([[x - r * 1.2, y - r * 1.2], [x + r * 1.2, y - r * 1.2], [x + r * 1.2, y - r * 1.2 + o.lid * 2.1 * r], [x - r * 1.2, y - r * 1.2 + o.lid * 2.1 * r]], o.skin, 0)); p.stroke([[x - r * 0.98, y - r * 1.05 + o.lid * 2.1 * r], [x + r * 0.98, y - r * 1.05 + o.lid * 2.1 * r]], 4); p.ell(x, y, r, r * 1.05, null, 4.5); }
  if (o.lashes) for (let k = 0; k < 3; k++) { const a = -Math.PI * (0.25 + k * 0.17); p.stroke([[x + Math.cos(a) * r, y + Math.sin(a) * r], [x + Math.cos(a) * r * 1.35, y + Math.sin(a) * r * 1.4]], 3.5); } };
const aHoof = (p, x, y, w, col = '#3a2a22') => { p.poly([[x - w, y - w * 0.9], [x + w, y - w * 0.9], [x + w * 1.1, y], [x - w * 1.1, y]], col, 5); };

/** CAMELO (dromedário). o: {walk, lie, spit, chew, hat, mule, bandage, look, blink, mouth, wide} */
export const fxCamel = (p, o = {}) => {
  const mule = !!o.mule, C = mule ? '#9a948c' : '#d8ad6c', C2 = mule ? '#7a746e' : '#bb8a4c', BELLY = mule ? '#c2bcb4' : '#efd3a0', lie = o.lie || 0, w = o.walk || 0;
  const by = 590 + lie * 210, bx = 230;
  // far legs (darker), drawn first
  const NEAR = [], FEET = []; const leg = (x, ph, far) => { const col = far ? C2 : C; if (lie > 0.5) { const pts = aTaper([[x, by + 40], [x + 60, by + 95], [x - 20, by + 115]], 34, 26); if (far) { aGroup(p, [{ pts, col }], 7); p.ell(x - 22, by + 115, 18, 12, '#6a5040', 5); } else { NEAR.push({ pts, col }); FEET.push(() => p.ell(x - 22, by + 115, 18, 12, '#6a5040', 5)); } return; }
    const sw = Math.sin((w + ph) * Math.PI * 2) * 28 * (1 - lie), kx = x + sw * 0.5, ky = by + 190, fx = x + sw, fy = 972;
    const pts = aTaper([[x, by + 30], [x + 4, by + 110], [kx, ky], [fx, fy - 20]], 46, 22); if (far) { aGroup(p, [{ pts, col }, { pts: aEll(kx, ky, 17, 16), col }], 7); aHoof(p, fx, fy, 20, '#6a5040'); } else { NEAR.push({ pts, col }, { pts: aEll(kx, ky, 17, 16), col }); FEET.push(() => aHoof(p, fx, fy, 20, '#6a5040')); } };
  leg(bx - 120, 0.5, true); leg(bx + 105, 0, true);
  // tail
  p.band([[bx - 185, by - 30], [bx - 210, by + 40], [bx - 200, by + 110]], C2, 12, 4, 'round'); p.ell(bx - 200, by + 118, 10, 18, mul(C2, [0.7, 0.7, 0.7]), 4);
  // body + hump + neck + head as one silhouette
  const neck = mule ? aTaper([[bx + 150, by - 40], [bx + 210, by - 110], [bx + 245, by - 150]], 110, 70) : aTaper([[bx + 150, by - 20], [bx + 230, by - 80], [bx + 250, by - 190], [bx + 280, by - 255]], 100, 62);
  const hx = mule ? bx + 285 : bx + 320, hy = mule ? by - 185 : by - 290 + lie * 30;
  const shapes = [{ pts: aEll(bx, by, 195, 100), col: C }, { pts: neck, col: C }, { pts: aEll(hx, hy, 74, 44, -0.12), col: C }, { pts: aEll(hx + 62, hy + 16, 38, 32), col: mix(C, '#ffffff', 0.25) }];
  if (!mule) shapes.push({ pts: aEll(bx - 15, by - 85, 112, 100), col: C, shadow: C2 });
  leg(bx - 95, 0, false); leg(bx + 125, 0.5, false);
  aGroup(p, [...NEAR, ...shapes], 10); FEET.forEach((fn) => fn());
  p.clip(aEll(bx, by, 195, 100), () => p.ell(bx + 10, by + 70, 150, 50, BELLY, 0));
  if (!mule) for (let k = 0; k < 7; k++) p.stroke([[bx - 70 + k * 22, by - 172 + Math.abs(k - 3) * 6], [bx - 64 + k * 22, by - 192 + Math.abs(k - 3) * 6]], 4, C2);
  if (mule) { p.band([[bx + 140, by - 70], [bx + 220, by - 150], [hx - 30, hy - 30]], '#4a4440', 18, 3, 'round'); for (const sd of [-1, 1]) aGroup(p, [{ pts: aTaper([[hx - 30 + sd * 10, hy - 30], [hx - 50 + sd * 18, hy - 120]], 30, 10), col: C }], 6); }
  else for (const sd of [-1, 1]) aGroup(p, [{ pts: aEll(hx - 42 + sd * 10, hy - 40, 12, 20, -0.2), col: C }], 5);
  if (o.bandage && lie < 0.5) { p.poly([[bx - 120, by + 150], [bx - 70, by + 150], [bx - 72, by + 200], [bx - 118, by + 200]], '#f6f3ec', 5); p.stroke([[bx - 112, by + 168], [bx - 80, by + 180]], 5, '#d24a3a'); }
  if (o.bandage && lie >= 0.5) { p.ell(bx - 115, by + 112, 34, 16, '#f6f3ec', 5); p.stroke([[bx - 130, by + 112], [bx - 100, by + 112]], 5, '#d24a3a'); }
  // face
  aEye(p, hx + 2, hy - 8, 17, { look: o.look || 0.5, lid: o.blink ? 1 : (o.wide ? 0 : 0.45), skin: C, lashes: !mule });
  p.stroke([[hx + 88, hy + 4], [hx + 96, hy + 12]], 5);
  const my = hy + 34, mo = o.spit ? 1 : (o.mouth || 0), ch = o.chew ? 5 * Math.sin(o.chew) : 0;
  if (mo > 0) { p.ell(hx + 72, my + 8, 26, 9 + 13 * mo, '#7a2e34', 5); p.ell(hx + 74, my - 2, 30, 8, mix(C, '#ffffff', 0.25), 4, 180, 360); }
  else { p.stroke([[hx + 44, my + 2], [hx + 70, my + 10 + ch], [hx + 98, my + 2]], 5); p.ell(hx + 68, my + 16 + ch, 22, 8, mix(C, '#ffffff', 0.2), 4, 0, 180); }
  if (o.hat) { const g = p.g; g.save(); g.translate(hx + 95, my + 6); g.rotate(-0.3); p.ell(0, 0, 72, 18, '#5a3a22', 7); p.ell(0, -22, 40, 30, '#5a3a22', 7, 180, 360); p.stroke([[-38, -6], [38, -6]], 7, '#c9a24a'); g.restore(); }
};
/** GIRAFA (lado direito) */
export const fxGiraffe = (p, o = {}) => {
  const Y = '#efbe55', S = '#a8682a', w = o.walk || 0, bx = 250, by = 650;
  const NEAR = []; const leg = (x, ph, far) => { const sw = Math.sin((w + ph) * Math.PI * 2) * 20; const pts = aTaper([[x, by + 20], [x + sw * 0.4, by + 170], [x + sw, 955]], 34, 18); const sh = [{ pts, col: far ? mul(Y, [0.85, 0.82, 0.8]) : Y }, { pts: aEll(x + sw * 0.4, by + 170, 13, 12), col: far ? mul(Y, [0.85, 0.82, 0.8]) : Y }]; if (far) aGroup(p, sh, 6); else NEAR.push(...sh); aHoof(p, x + sw, 972, 14); };
  leg(bx - 85, 0.5, true); leg(bx + 80, 0, true);
  const neck = aTaper([[bx + 95, by - 20], [bx + 140, by - 200], [bx + 170, by - 400], [bx + 185, by - 470]], 92, 46);
  const hx = bx + 205, hy = by - 495;
  const body = aEll(bx, by, 145, 82, -0.08);
  leg(bx - 60, 0, false); leg(bx + 105, 0.5, false);
  aGroup(p, [...NEAR, { pts: body, col: Y }, { pts: neck, col: Y }, { pts: aEll(hx, hy, 52, 32, 0.15), col: Y }, { pts: aEll(hx + 42, hy + 14, 26, 22), col: '#f6dc98' }], 9);
  const spots = (clipPts, x0, y0, x1, y1, seed) => p.clip(clipPts, () => { let s = seed; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280; for (let y = y0; y < y1; y += 46) for (let x = x0 + ((y / 46) % 2) * 22; x < x1; x += 50) { const pts = aEll(x + r() * 10, y + r() * 10, 17 + r() * 6, 14 + r() * 5, r() * 3, 7); p.poly(pts, S, 0); } });
  spots(body, bx - 150, by - 90, bx + 150, by + 90, 7); spots(neck, bx + 50, by - 480, bx + 230, by, 11);
  p.band([[bx + 75, by - 60], [bx + 110, by - 240], [bx + 140, by - 420], [hx - 30, hy - 10]], '#8a5422', 12, 3, 'round');
  for (const sd of [0, 1]) { p.band([[hx - 18 + sd * 20, hy - 26], [hx - 22 + sd * 22, hy - 62]], Y, 8, 3, 'round'); p.ell(hx - 22 + sd * 22, hy - 66, 9, 9, S, 4); }
  aGroup(p, [{ pts: aEll(hx - 36, hy - 20, 18, 9, -0.6), col: Y }], 5);
  aEye(p, hx + 2, hy - 6, 11, { look: 0.5, lashes: true, lid: 0.25, skin: Y }); p.stroke([[hx + 56, hy + 6], [hx + 60, hy + 12]], 4); p.arc(hx + 46, hy + 24, 12, 5, 20, 160, 4);
  p.band([[bx - 140, by - 20], [bx - 160, by + 60], [bx - 150, by + 140]], Y, 8, 3, 'round'); p.ell(bx - 150, by + 150, 9, 16, '#5a3418', 4);
};
/** ELEFANTE (lado direito). t anima a orelha */
export const fxElephant = (p, t = 0) => {
  const G = '#9aa3ae', G2 = '#7d8693', bx = 250, by = 640;
  const NEAR = [], FEET = []; const leg = (x, far) => { const pts = aTaper([[x, by + 40], [x, 965]], 78, 70); if (far) aGroup(p, [{ pts, col: G2 }], 8); else NEAR.push({ pts, col: G }); const toes = () => { for (let k = 0; k < 3; k++) p.ell(x - 22 + k * 22, 958, 9, 7, '#e8e2d4', 3); }; if (far) toes(); else FEET.push(toes); };
  leg(bx - 110, true); leg(bx + 90, true);
  const hx = bx + 175, hy = by - 95;
  const trunk = aTaper([[hx + 55, hy + 30], [hx + 95, hy + 120], [hx + 100, hy + 230], [hx + 80, hy + 300]], 64, 30);
  leg(bx - 70, false); leg(bx + 130, false);
  aGroup(p, [...NEAR, { pts: aEll(bx, by, 190, 135, -0.05), col: G }, { pts: aEll(hx, hy, 105, 98), col: G }, { pts: trunk, col: G }], 10); FEET.forEach((fn) => fn());
  for (let k = 0; k < 6; k++) p.arc(hx + 92 - k * 1.5, hy + 110 + k * 28, 22, 6, 10, 170, 3, G2);
  p.poly(aTaper([[hx + 40, hy + 70], [hx + 90, hy + 95], [hx + 125, hy + 75]], 22, 6), '#f6f0e2', 5);
  const flap = Math.sin(t * 6) * 12;
  const ear = aEll(hx - 62, hy + 28, 66 + flap, 92, -0.1); aGroup(p, [{ pts: ear, col: G }], 9); p.clip(ear, () => p.ell(hx - 56, hy + 32, 46 + flap, 70, '#d9a6a8', 0));
  aEye(p, hx + 40, hy - 20, 13, { look: 0.4, lid: 0.3, skin: G, lashes: true });
  p.band([[bx - 185, by - 20], [bx - 215, by + 60]], G, 10, 3, 'round'); p.ell(bx - 216, by + 68, 8, 14, '#4a4a4a', 3);
};
/** RATO (lado direito) */
export const fxRat = (p, t = 0) => {
  const G = '#9a9aa4', bx = 290, by = 905;
  p.band([[bx - 70, by + 10], [bx - 140, by + 30], [bx - 190, by - 10], [bx - 210, by - 60]], '#e6a8b4', 9, 3, 'round');
  aGroup(p, [{ pts: aEll(bx, by, 78, 50, -0.05), col: G }, { pts: aTaper([[bx + 50, by - 10], [bx + 140, by + 12]], 66, 14), col: G }], 7);
  p.clip(aEll(bx, by, 78, 50, -0.05), () => p.ell(bx + 10, by + 34, 60, 20, '#d8d6dc', 0));
  aGroup(p, [{ pts: aEll(bx + 52, by - 46, 22, 26, -0.3), col: G }], 6); p.ell(bx + 52, by - 46, 13, 16, '#e6a8b4', 0, 0, 360, -17);
  p.ell(bx + 144, by + 10, 9, 8, '#d0607a', 3); aEye(p, bx + 86, by - 8, 9, { look: 0.6 });
  for (const d of [-8, 0, 8]) p.stroke([[bx + 128, by + 14], [bx + 175, by + 6 + d * 2]], 2);
  for (const x of [bx - 40, bx + 30]) p.ell(x, by + 48, 16, 8, '#e6a8b4', 3);
};
/** VACA (lado direito) */
export const fxCow = (p) => {
  const W = '#f6f3ec', B = '#2a2622', bx = 260, by = 720;
  const NEAR = [], FEET = []; const leg = (x, far) => { const pts = aTaper([[x, by + 40], [x, 950]], 40, 30); if (far) aGroup(p, [{ pts, col: '#dcd8d0' }], 7); else NEAR.push({ pts, col: W }); if (far) aHoof(p, x, 972, 20); else FEET.push(() => aHoof(p, x, 972, 20)); };
  leg(bx - 105, true); leg(bx + 95, true);
  const hx = bx + 205, hy = by - 70;
  const body = aEll(bx, by, 175, 95, -0.03);
  leg(bx - 75, false); leg(bx + 125, false);
  aGroup(p, [...NEAR, { pts: body, col: W }, { pts: aTaper([[bx + 140, by - 30], [hx - 20, hy + 10]], 110, 80), col: W }, { pts: aEll(hx, hy, 62, 54), col: W }, { pts: aEll(hx + 40, hy + 34, 40, 30), col: '#f0b6b2' }], 9); FEET.forEach((fn) => fn());
  p.clip(body, () => { for (const [x, y, a, b] of [[bx - 80, by - 40, 60, 46], [bx + 50, by + 20, 44, 34], [bx - 10, by - 70, 30, 24], [bx + 120, by - 60, 30, 26]]) p.poly(aEll(x, y, a, b, 0.4, 12), B, 0); });
  p.poly(aEll(hx - 14, hy - 18, 26, 20, 0.3, 10), B, 0);
  for (const sd of [-1, 1]) { aGroup(p, [{ pts: aTaper([[hx - 20 + sd * 22, hy - 44], [hx - 22 + sd * 38, hy - 82]], 14, 6), col: '#e8dcb8' }], 4); aGroup(p, [{ pts: aEll(hx - 30 + sd * 46, hy - 30, 22, 12, sd * 0.4), col: W }], 5); }
  aEye(p, hx + 8, hy - 8, 11, { look: 0.5, lashes: true, lid: 0.2, skin: W }); for (const d of [-10, 10]) p.ell(hx + 52 + d * 0.4, hy + 36 + d, 5, 4, '#9a5a5a', 0);
  p.ell(bx + 20, by + 92, 40, 20, '#f0b6b2', 5);
  p.band([[bx - 172, by - 30], [bx - 196, by + 60], [bx - 188, by + 150]], W, 9, 3, 'round'); p.ell(bx - 188, by + 160, 11, 18, B, 4);
};
/** DINOSSAURO saurópode (lado direito) */
export const fxSauro = (p) => {
  const G = '#6fa35e', G2 = '#4f8040', bx = 250, by = 700;
  const NEAR = [], FEET = []; const leg = (x, far) => { const pts = aTaper([[x, by + 40], [x, 960]], 74, 64); if (far) aGroup(p, [{ pts, col: G2 }], 8); else NEAR.push({ pts, col: G }); const toes = () => { for (let k = 0; k < 3; k++) p.ell(x - 22 + k * 22, 958, 8, 6, '#e8e2d4', 3); }; if (far) toes(); else FEET.push(toes); };
  leg(bx - 120, true); leg(bx + 100, true);
  const neck = aTaper([[bx + 140, by - 40], [bx + 230, by - 230], [bx + 280, by - 470], [bx + 300, by - 560]], 120, 46);
  const tail = aTaper([[bx - 160, by - 10], [bx - 260, by + 40], [bx - 340, by + 130], [bx - 380, by + 220]], 100, 10);
  const hx = bx + 320, hy = by - 580;
  leg(bx - 80, false); leg(bx + 140, false);
  aGroup(p, [...NEAR, { pts: aEll(bx, by, 200, 120), col: G }, { pts: neck, col: G }, { pts: tail, col: G }, { pts: aEll(hx, hy, 50, 30, 0.1), col: G }], 10); FEET.forEach((fn) => fn());
  p.clip(aEll(bx, by, 200, 120), () => p.ell(bx, by + 80, 170, 50, '#a8cf8a', 0));
  for (let k = 0; k < 9; k++) p.ell(bx - 140 + k * 36, by - 110 + Math.abs(k - 4) * 6, 12, 8, G2, 0);
  aEye(p, hx + 6, hy - 6, 10, { look: 0.6 }); p.arc(hx + 32, hy + 12, 14, 5, 20, 160, 4);
};
/** URSO-POLAR (lado direito) */
export const fxBear = (p) => {
  const W = '#f4f6fa', S = '#c9d4e2', bx = 280, by = 700;
  const NEAR = [], FEET = []; const leg = (x, far) => { const pts = aTaper([[x, by + 40], [x, 950]], 72, 64); if (far) aGroup(p, [{ pts, col: '#dde4ee', shadow: S }], 8); else NEAR.push({ pts, col: W, shadow: S }); const toes = () => { for (let k = 0; k < 3; k++) p.ell(x - 18 + k * 18 + 10, 960, 7, 6, '#2a2a30', 0); }; if (far) toes(); else FEET.push(toes); };
  leg(bx - 110, true); leg(bx + 95, true);
  const hx = bx + 220, hy = by - 60;
  leg(bx - 70, false); leg(bx + 135, false);
  aGroup(p, [...NEAR, { pts: aEll(bx, by, 200, 125), col: W, shadow: S }, { pts: aEll(bx - 150, by - 40, 60, 60), col: W, shadow: S }, { pts: aEll(hx, hy, 80, 70), col: W, shadow: S }, { pts: aEll(hx + 70, hy + 22, 42, 30), col: W, shadow: S }], 10); FEET.forEach((fn) => fn());
  for (const sd of [-1, 1]) { aGroup(p, [{ pts: aEll(hx - 30 + sd * 34, hy - 64, 20, 18), col: W, shadow: S }], 6); p.ell(hx - 30 + sd * 34, hy - 64, 9, 8, '#c8b8c0', 0); }
  p.ell(hx + 108, hy + 16, 14, 11, '#1a1a1e', 4); p.stroke([[hx + 100, hy + 34], [hx + 86, hy + 44]], 4); aEye(p, hx + 26, hy - 14, 11, { look: 0.6 });
};
/** URUBU (de frente, asas abertas). flap -1..1, scare 0/1, open 0..1 */
export const fxVulture = (p, flap = 0, scare = 0, open = 0, look = 0) => {
  const BLK = '#2c2428', BLK2 = '#40363a', cx = 300, cy = 520, a = flap * 0.75;
  for (const s of [-1, 1]) {
    const base = [[cx + s * 40, cy - 30], [cx + s * 160, cy - 80 - 90 * a], [cx + s * 270, cy - 60 - 170 * a]], tipY = cy - 60 - 170 * a;
    const wing = [[cx + s * 40, cy - 30], [cx + s * 160, cy - 85 - 90 * a], [cx + s * 285, tipY - 10]];
    for (let k = 0; k < 6; k++) { const fx = cx + s * (300 - k * 22), fy = tipY + 20 + k * 28 - 60 * a * (k / 6); wing.push([fx + s * 30, fy + 40], [fx, fy + 30]); }
    wing.push([cx + s * 120, cy + 70 - 40 * a], [cx + s * 40, cy + 40]);
    aGroup(p, [{ pts: wing, col: BLK, shadow: '#1a1416' }], 8);
    for (let k = 0; k < 5; k++) p.stroke([[cx + s * (150 + k * 24), cy - 40 - (70 + k * 18) * a], [cx + s * (170 + k * 24), cy + 20 - (40 + k * 18) * a]], 4, '#5a5054');
  }
  aGroup(p, [{ pts: aEll(cx, cy + 30, 78, 112), col: BLK2 }, { pts: [[cx - 40, cy + 120], [cx + 40, cy + 120], [cx + 22, cy + 192], [cx - 22, cy + 192]], col: BLK }], 9);
  for (const s of [-1, 1]) { p.band([[cx + s * 25, cy + 130], [cx + s * 32, cy + 178]], '#d9c9b0', 9, 3, 'round'); p.stroke([[cx + s * 32, cy + 180], [cx + s * 44, cy + 190]], 4); }
  for (let k = 0; k < 9; k++) { const t = k / 8; p.ell(cx - 66 + t * 132, cy - 72 + Math.sin(t * Math.PI) * -10, 20, 16, '#f2ebe2', 4); }
  const hx = cx + look * 14, hy = cy - 145 - (scare ? 25 : 0);
  aGroup(p, [{ pts: aTaper([[cx, cy - 75], [hx, hy + 20]], 30, 22), col: '#c96a5e' }, { pts: aEll(hx, hy, 52, 46), col: '#d8705f' }], 8);
  for (let k = 0; k < 4; k++) p.arc(hx, hy - 30 + k * 8, 26 - k * 3, 6, 200, 340, 2.5, '#b0503f');
  const ey = hy - 10, er = scare ? 18 : 13;
  for (const s of [-1, 1]) { aEye(p, hx + s * 22, ey, er, { look: s * 0.2 + look, iris: '#1a1214', lid: scare ? 0 : 0.35, skin: '#d8705f' }); if (!scare) p.stroke([[hx + s * 8, ey - 20], [hx + s * 34, ey - 14]], 5, '#5a2a26'); }
  p.poly([[hx - 15, hy + 6], [hx + 15, hy + 6], [hx + 12, hy + 30 + open * 8], [hx + 2, hy + 48 + open * 10], [hx - 4, hy + 38], [hx - 12, hy + 30 + open * 8]], '#efe0b0', 5);
  p.stroke([[hx - 6, hy + 18], [hx + 6, hy + 18]], 3, '#b8a070');
  if (open) p.ell(hx, hy + 32, 9, 10 * open, '#7a1e28', 4);
  if (scare) for (let k = 0; k < 5; k++) { const ang = -Math.PI / 2 + (k - 2) * 0.35; p.stroke([[hx + Math.cos(ang) * 75, hy + Math.sin(ang) * 70], [hx + Math.cos(ang) * 105, hy + Math.sin(ang) * 100]], 7); }
};
