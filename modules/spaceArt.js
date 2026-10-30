// modules/spaceArt.js
// v1.0.0 — 2026-10-30
// Ракета, эмблема-нашивка, анимация запуска и звуки. Всё рисуется кодом.

const FONT = '"Playfair Display", Georgia, serif';
export const HULLS = { ivory: ['#F0EAD6', '#c9bb94'], gold: ['#e8c45c', '#a07c22'], black: ['#3a3a3f', '#141418'] };
const NOSE = '#c8501e';

export async function ensureFonts() {
    try { await document.fonts.load(`700 80px ${FONT}`); } catch (e) { /* запасной шрифт */ }
}
function rng(seed) { let s = (seed >>> 0) || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function hash(str) { let h = 2166136261; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
export function canvasBlob(c) { return new Promise(res => c.toBlob(res, 'image/png')); }

// ---------- ракета ----------
// cfg: { capsule, hull, engines }. Чего ещё нет — рисуется пунктиром («не собрано»).
export function drawRocket(ctx, cfg, x, y, h, opts = {}) {
    const w = h * 0.26;
    const ink = opts.ink || 'rgba(255,255,255,.6)';
    const lw = Math.max(1.5, h * 0.012);
    const [c1, c2] = HULLS[cfg.hull] || HULLS.ivory;
    const bottom = y - h * 0.1, top = bottom - h * 0.52;
    const n = cfg.engines || 1;

    const paint = (fill, missing) => {
        if (missing) {
            ctx.setLineDash([h * 0.025, h * 0.02]); ctx.strokeStyle = 'rgba(255,160,50,.75)'; ctx.lineWidth = lw; ctx.stroke(); ctx.setLineDash([]);
        } else {
            ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke();
        }
    };
    ctx.save();

    // пламя
    const flame = opts.flame || 0;
    if (flame > 0 && cfg.engines) {
        for (let i = 0; i < n; i++) {
            const ex = x + (i - (n - 1) / 2) * w * 0.55, ny = bottom + h * 0.05;
            const L = h * (0.1 + 0.3 * flame) * (0.8 + Math.random() * 0.4), fw = w * 0.16;
            const g = ctx.createLinearGradient(0, ny, 0, ny + L);
            g.addColorStop(0, '#fff6c0'); g.addColorStop(0.35, '#ffb02e'); g.addColorStop(1, 'rgba(255,70,0,0)');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.moveTo(ex - fw, ny);
            ctx.quadraticCurveTo(ex - fw * 0.6, ny + L * 0.6, ex, ny + L);
            ctx.quadraticCurveTo(ex + fw * 0.6, ny + L * 0.6, ex + fw, ny);
            ctx.fill();
        }
    }
    // сопла
    for (let i = 0; i < n; i++) {
        const ex = x + (i - (n - 1) / 2) * w * 0.55, nw = w * 0.15;
        ctx.beginPath(); ctx.moveTo(ex - nw * 0.7, bottom); ctx.lineTo(ex + nw * 0.7, bottom);
        ctx.lineTo(ex + nw, bottom + h * 0.05); ctx.lineTo(ex - nw, bottom + h * 0.05); ctx.closePath();
        paint('#5b5b62', !cfg.engines);
    }
    // стабилизаторы
    [-1, 1].forEach(s => {
        ctx.beginPath(); ctx.moveTo(x + s * w / 2, bottom - h * 0.22);
        ctx.lineTo(x + s * (w / 2 + w * 0.55), bottom + h * 0.03); ctx.lineTo(x + s * w / 2, bottom); ctx.closePath();
        paint(c2, !cfg.hull);
    });
    // корпус
    const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.beginPath(); ctx.rect(x - w / 2, top, w, bottom - top); paint(g, !cfg.hull);
    if (cfg.hull) {
        ctx.beginPath(); ctx.rect(x - w / 2, bottom - h * 0.1, w, h * 0.035); ctx.fillStyle = NOSE; ctx.fill();
        ctx.beginPath(); ctx.arc(x, top + h * 0.14, w * 0.17, 0, Math.PI * 2); ctx.fillStyle = '#9fe3ff'; ctx.fill();
        ctx.strokeStyle = ink; ctx.lineWidth = lw; ctx.stroke();
    }
    // капсула
    const cap = cfg.capsule || 'classic';
    ctx.beginPath();
    if (cap === 'dome') { ctx.moveTo(x - w / 2, top); ctx.arc(x, top, w / 2, Math.PI, 0); ctx.closePath(); }
    else if (cap === 'probe') {
        ctx.moveTo(x - w / 2, top); ctx.lineTo(x - w * 0.12, top - h * 0.27);
        ctx.lineTo(x + w * 0.12, top - h * 0.27); ctx.lineTo(x + w / 2, top); ctx.closePath();
    } else {
        ctx.moveTo(x - w / 2, top);
        ctx.quadraticCurveTo(x - w / 2, top - h * 0.2, x, top - h * 0.3);
        ctx.quadraticCurveTo(x + w / 2, top - h * 0.2, x + w / 2, top); ctx.closePath();
    }
    paint(NOSE, !cfg.capsule);
    if (cap === 'probe') {
        ctx.beginPath(); ctx.moveTo(x, top - h * 0.27); ctx.lineTo(x, top - h * 0.36);
        ctx.strokeStyle = ink; ctx.lineWidth = lw; ctx.stroke();
        ctx.beginPath(); ctx.arc(x, top - h * 0.37, w * 0.05, 0, Math.PI * 2); ctx.fillStyle = '#ffb02e'; ctx.fill();
    }
    ctx.restore();
}

// ---------- сцена площадки ----------
const FIELD = (() => { const r = rng(11); return Array.from({ length: 110 }, () => ({ x: r(), y: r(), r: 0.5 + r() * 1.5 })); })();

function paintBackground(ctx, W, H, speed, field) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#05060f'); g.addColorStop(1, '#1a1228');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    field.forEach(s => {
        s.y += speed / H;
        if (s.y > 1) { s.y = 0; s.x = Math.random(); }
        ctx.globalAlpha = 0.35 + s.r / 3;
        ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
}
function paintGround(ctx, W, H, offset) {
    const gy = H * 0.9 + offset;
    ctx.fillStyle = '#0c0c12'; ctx.fillRect(0, gy, W, H);
    ctx.strokeStyle = 'rgba(230,193,92,.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    const tx = W * 0.33;
    ctx.strokeStyle = 'rgba(230,193,92,.35)'; ctx.lineWidth = 1.5;
    ctx.strokeRect(tx, gy - H * 0.5, W * 0.025, H * 0.5);
    for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(tx, gy - H * 0.08 * i); ctx.lineTo(tx + W * 0.025, gy - H * 0.08 * i + H * 0.04); ctx.stroke(); }
}

// Неподвижная сцена сборки
export function drawStage(canvas, cfg) {
    const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
    paintBackground(ctx, W, H, 0, FIELD.map(s => ({ ...s })));
    paintGround(ctx, W, H, 0);
    drawRocket(ctx, cfg, W / 2, H * 0.925, H * 0.5);
}

// ---------- звук (синтез, без файлов) ----------
let actx = null;
const muted = () => { try { return localStorage.getItem('gygy_mute') === '1'; } catch (e) { return false; } };
function audio() {
    if (muted()) return null;
    try {
        if (!actx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) actx = new AC(); }
        if (actx && actx.state === 'suspended') actx.resume();
    } catch (e) { return null; }
    return actx;
}
export function beep(freq = 880, dur = 0.12, vol = 0.12) {
    const a = audio(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'square'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + dur);
}
export function roar(sec = 6) {
    const a = audio(); if (!a) return;
    const len = Math.floor(a.sampleRate * sec), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = a.createBufferSource(); src.buffer = buf;
    const f = a.createBiquadFilter(); f.type = 'lowpass';
    f.frequency.setValueAtTime(300, a.currentTime);
    f.frequency.linearRampToValueAtTime(1400, a.currentTime + sec * 0.6);
    f.frequency.linearRampToValueAtTime(400, a.currentTime + sec);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, a.currentTime);
    g.gain.linearRampToValueAtTime(0.5, a.currentTime + 0.8);
    g.gain.linearRampToValueAtTime(0.0001, a.currentTime + sec);
    src.connect(f); f.connect(g); g.connect(a.destination); src.start();
}

// ---------- запуск ----------
// hooks: onCount(n), onLiftoff(), onDone(). Возвращает функцию отмены.
export function runLaunch(canvas, cfg, hooks = {}) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const field = FIELD.map(s => ({ ...s }));
    const parts = [];
    const rh = H * 0.5, baseY = H * 0.925, hold = H * 0.55;
    const n = cfg.engines || 1, w = rh * 0.26;
    let phase = 'count', t0 = performance.now(), last = t0, lastN = 0, ry = baseY, vy = 0, stopped = false;

    function emit(cx, y, count) {
        for (let i = 0; i < count; i++) {
            const k = Math.floor(Math.random() * n);
            parts.push({ x: cx + (k - (n - 1) / 2) * w * 0.55 + (Math.random() - 0.5) * 8, y,
                vx: (Math.random() - 0.5) * 50, vy: 90 + Math.random() * 140,
                life: 0.7 + Math.random() * 0.8, max: 1.5, r: 3 + Math.random() * 5 });
        }
    }
    function drawParts(dt, camSpeed) {
        for (let i = parts.length - 1; i >= 0; i--) {
            const p = parts[i];
            p.life -= dt;
            if (p.life <= 0) { parts.splice(i, 1); continue; }
            p.x += p.vx * dt; p.y += (p.vy + camSpeed) * dt;
            const a = p.life / p.max;
            ctx.globalAlpha = Math.min(0.7, a);
            ctx.fillStyle = a > 0.45 ? '#ffd27a' : '#bdbdbd';
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1.5 - a * 0.5), 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    function frame(now) {
        if (stopped) return;
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        const t = (now - t0) / 1000;
        if (phase === 'count') {
            const num = 5 - Math.floor(t);
            if (num >= 1 && num !== lastN) { lastN = num; if (hooks.onCount) hooks.onCount(num); beep(660, 0.1); }
            paintBackground(ctx, W, H, 0, field); paintGround(ctx, W, H, 0);
            drawRocket(ctx, cfg, W / 2, ry, rh, { flame: num <= 2 ? 0.25 : 0 });
            if (t >= 5) { phase = 'fly'; t0 = now; if (hooks.onLiftoff) hooks.onLiftoff(); beep(1200, 0.4, 0.15); roar(7); }
        } else if (phase === 'fly') {
            vy += H * 0.22 * dt; ry -= vy * dt;
            let sy = ry, cam = 0;
            if (ry < hold) { cam = hold - ry; sy = hold; }
            if (t > 4.5) { const e = t - 4.5; sy = hold - e * e * H * 0.35; }
            const camSpeed = ry < hold ? vy : 0;
            paintBackground(ctx, W, H, camSpeed * dt * 0.6 + 0.3 + (t > 4.5 ? 5 : 0), field);
            paintGround(ctx, W, H, cam);
            emit(W / 2, sy - rh * 0.05, 4);
            drawParts(dt, camSpeed);
            const shake = Math.max(0, 1 - t / 3) * 4;
            ctx.save(); ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
            drawRocket(ctx, cfg, W / 2, sy, rh, { flame: 1 });
            ctx.restore();
            if (sy < -rh * 1.3) { phase = 'end'; if (hooks.onDone) hooks.onDone(); }
        } else {
            paintBackground(ctx, W, H, 0.4, field);
        }
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return () => { stopped = true; };
}

// ---------- эмблема-нашивка ----------
function wrap(ctx, text, maxW) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let cur = '';
    words.forEach(wd => {
        const test = cur ? cur + ' ' + wd : wd;
        if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = wd; } else cur = test;
    });
    if (cur) lines.push(cur);
    return lines;
}

// Текст по дуге: сверху (bottom=false) или снизу (bottom=true), буквы стоят к центру основанием
function ringText(ctx, text, cx, cy, r, size, bottom) {
    let fs = size;
    for (;;) {
        ctx.font = `700 ${fs}px ${FONT}`;
        const total = [...text].reduce((s, ch) => s + ctx.measureText(ch).width, 0);
        if (total / r <= 2.5 || fs < size * 0.5) break;
        fs *= 0.92;
    }
    const chars = [...text];
    const widths = chars.map(c => ctx.measureText(c).width);
    const span = widths.reduce((a, b) => a + b, 0) / r;
    const centerAngle = bottom ? Math.PI / 2 : -Math.PI / 2;
    let a = bottom ? centerAngle + span / 2 : centerAngle - span / 2;
    chars.forEach((c, i) => {
        const half = widths[i] / r / 2;
        a += bottom ? -half : half;
        ctx.save();
        ctx.translate(cx + r * Math.cos(a), cy + r * Math.sin(a));
        ctx.rotate(bottom ? a - Math.PI / 2 : a + Math.PI / 2);
        ctx.fillText(c, 0, 0);
        ctx.restore();
        a += bottom ? -half : half;
    });
}

// Круглая нашивка: тёмный диск и золотое кольцо — одинаково читается на чёрном и на белом.
// scene: 'rocket' (на старте) или 'moon' (на Луне); note — текст внутри (девиз или сообщение).
export async function renderEmblem({ scene = 'rocket', cfg = {}, top = '', bottom = '', note = '', size = 1200 }) {
    await ensureFonts();
    const S = size, cx = S / 2, cy = S / 2, R = S * 0.34;
    const c = document.createElement('canvas'); c.width = c.height = S;
    const ctx = c.getContext('2d');
    const GOLD = '#e6c15a';
    const rand = rng(hash(top + scene));
    const full = { capsule: cfg.capsule || 'classic', hull: cfg.hull || 'ivory', engines: cfg.engines || 1 };

    ctx.beginPath(); ctx.arc(cx, cy, S * 0.48, 0, Math.PI * 2); ctx.fillStyle = '#12131c'; ctx.fill();
    ctx.lineWidth = S * 0.012; ctx.strokeStyle = GOLD; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R + S * 0.005, 0, Math.PI * 2); ctx.stroke();

    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    const sky = ctx.createLinearGradient(0, cy - R, 0, cy + R);
    sky.addColorStop(0, '#0a0c1c'); sky.addColorStop(1, '#1d1733');
    ctx.fillStyle = sky; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 70; i++) {
        ctx.globalAlpha = 0.35 + rand() * 0.65;
        ctx.beginPath(); ctx.arc(cx - R + rand() * R * 2, cy - R + rand() * R * 2, S * (0.0009 + rand() * 0.002), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    let noteY, noteStep, noteLines = 2;
    if (scene === 'moon') {
        const g = ctx.createLinearGradient(0, cy + R * 0.3, 0, cy + R);
        g.addColorStop(0, '#d8d1be'); g.addColorStop(1, '#a8a190');
        ctx.beginPath(); ctx.arc(cx, cy + S * 0.62, S * 0.5, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
        ctx.fillStyle = 'rgba(90,85,70,.35)';
        for (let i = 0; i < 6; i++) {
            const er = S * (0.012 + rand() * 0.02);
            ctx.beginPath(); ctx.ellipse(cx - R * 0.8 + rand() * R * 1.6, cy + R * 0.45 + rand() * R * 0.45, er * 1.6, er, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.beginPath(); ctx.arc(cx + R * 0.55, cy + R * 0.12, S * 0.05, 0, Math.PI * 2); ctx.fillStyle = '#3b82c4'; ctx.fill();
        ctx.fillStyle = '#4caf6a';
        ctx.beginPath(); ctx.arc(cx + R * 0.5, cy + R * 0.1, S * 0.017, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + R * 0.6, cy + R * 0.16, S * 0.012, 0, Math.PI * 2); ctx.fill();
        drawRocket(ctx, full, cx - R * 0.35, cy + R * 0.62, S * 0.3, { ink: '#F0EAD6' });
        ctx.strokeStyle = '#F0EAD6'; ctx.lineWidth = S * 0.004;
        ctx.beginPath(); ctx.moveTo(cx + R * 0.3, cy + R * 0.6); ctx.lineTo(cx + R * 0.3, cy + R * 0.28); ctx.stroke();
        ctx.fillStyle = NOSE; ctx.fillRect(cx + R * 0.3, cy + R * 0.28, S * 0.07, S * 0.045);
        noteY = cy - R * 0.62; noteStep = S * 0.052; noteLines = 3;
    } else {
        ctx.beginPath(); ctx.arc(cx + R * 0.52, cy - R * 0.5, S * 0.06, 0, Math.PI * 2); ctx.fillStyle = '#d9d4c5'; ctx.fill();
        ctx.fillStyle = 'rgba(120,115,100,.5)';
        ctx.beginPath(); ctx.arc(cx + R * 0.48, cy - R * 0.52, S * 0.012, 0, Math.PI * 2); ctx.fill();
        drawRocket(ctx, full, cx, cy + R * 0.28, S * 0.46, { ink: '#F0EAD6', flame: 0.6 });
        noteY = cy + R * 0.66; noteStep = S * 0.05;
    }
    ctx.restore();

    if (note) {
        ctx.fillStyle = '#F0EAD6'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `700 ${S * (scene === 'moon' ? 0.04 : 0.036)}px ${FONT}`;
        wrap(ctx, note, S * (scene === 'moon' ? 0.44 : 0.38)).slice(0, noteLines)
            .forEach((ln, i) => ctx.fillText(ln, cx, noteY + i * noteStep));
    }

    ctx.fillStyle = GOLD; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ringText(ctx, String(top).toUpperCase().slice(0, 34), cx, cy, S * 0.413, S * 0.056, false);
    ringText(ctx, String(bottom).toUpperCase().slice(0, 46), cx, cy, S * 0.413, S * 0.046, true);
    return c;
}
