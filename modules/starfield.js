// modules/starfield.js
// v1.0.0 — 2026-11-01
// Звёздный фон на всю страницу (как на пусковой площадке) и Луна. Рисуется кодом, картинки не нужны.
// mountStarfield(контейнер, { moon: true }) — контейнер должен занимать весь экран (.sp-bg).

function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

export function mountStarfield(host, opts = {}) {
    if (!host) return;
    const withMoon = opts.moon !== false;
    const canvas = document.createElement('canvas');
    host.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, stars = [], raf = 0, running = true, last = 0;

    function paintMoon() {
        const R = Math.max(34, Math.min(92, Math.min(W, H) * 0.095));
        const cx = W - R - Math.max(18, W * 0.06);
        const cy = R + 78;                                   // ниже верхней панели
        const r = rng(5);
        ctx.save();
        ctx.shadowColor = 'rgba(240,235,210,.35)';
        ctx.shadowBlur = R * 0.9;
        const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
        g.addColorStop(0, '#f6f2e4');
        g.addColorStop(1, '#b4ae9b');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
        ctx.fillStyle = 'rgba(120,114,96,.38)';              // кратеры
        for (let i = 0; i < 9; i++) {
            const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R * 0.78, cr = R * (0.06 + r() * 0.13);
            ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, cr * 1.2, cr, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = 'rgba(5,6,15,.6)';                   // тень: ярко освещён правый край
        ctx.beginPath(); ctx.arc(cx - R * 0.42, cy - R * 0.06, R * 1.04, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    function draw(t) {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#05060f');
        g.addColorStop(1, '#1a1228');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        for (const s of stars) {
            ctx.globalAlpha = still ? 0.6 : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 0.001 * s.s + s.p));
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        if (withMoon) paintMoon();
    }

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = host.clientWidth || window.innerWidth;
        H = host.clientHeight || window.innerHeight;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const r = rng(11);
        const n = Math.min(340, Math.round((W * H) / 5000));
        stars = Array.from({ length: n }, () => ({ x: r() * W, y: r() * H, r: 0.4 + r() * 1.6, p: r() * 6.283, s: 0.5 + r() * 1.5 }));
        draw(0);
    }

    function loop(t) {
        if (!running) return;
        if (t - last >= 33) { last = t; draw(t); }           // около 30 кадров в секунду
        raf = requestAnimationFrame(loop);
    }

    let rt = 0;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) { running = false; cancelAnimationFrame(raf); }
        else if (!still) { running = true; raf = requestAnimationFrame(loop); }
    });

    resize();
    if (!still) raf = requestAnimationFrame(loop);
}
