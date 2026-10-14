// modules/thumbBg.js
// v1.0.0 — 2026-10-15
// Подложка под миниатюры принтов: Auto (по цвету выбранного изделия) / Light / Dark / Grid.
// mountThumbBackground(stripEl, { getColor }) — getColor() возвращает 'black' или 'white'.

const KEY = 'gy_thumb_bg';
const MODES = [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark'], ['check', 'Grid']];

function injectStyles() {
    if (document.getElementById('tb-styles')) return;
    const s = document.createElement('style');
    s.id = 'tb-styles';
    s.textContent = `
        .tb-row { display: flex; align-items: center; gap: 5px; margin-top: 4px; font-family: 'Share Tech Mono', monospace; }
        .tb-label { font-size: 9px; color: #F0EAD6; opacity: 0.75; margin-right: 2px; }
        .tb-btn { background: #000; color: #FFD700; border: 1px solid #8a6f24; padding: 3px 7px; font-size: 9px; cursor: pointer; font-family: inherit; text-transform: uppercase; }
        .tb-btn.active { background: #FFD700; color: #000; border-color: #FFD700; }
        .print-strip[data-bg="light"] .print-icon { background: #ececec; }
        .print-strip[data-bg="dark"] .print-icon { background: #151515; }
    `;
    document.head.appendChild(s);
}

export function mountThumbBackground(stripEl, { getColor = () => 'black' } = {}) {
    if (!stripEl || !stripEl.parentElement) return { refresh() {} };
    injectStyles();

    let mode = 'auto';
    try {
        const saved = localStorage.getItem(KEY);
        if (MODES.some(m => m[0] === saved)) mode = saved;
    } catch (e) { /* хранилище недоступно — остаётся Auto */ }

    const row = document.createElement('div');
    row.className = 'tb-row';
    row.innerHTML = '<span class="tb-label">Backdrop</span>' +
        MODES.map(([v, l]) => `<button type="button" class="tb-btn" data-mode="${v}">${l}</button>`).join('');
    stripEl.parentElement.insertAdjacentElement('afterend', row);

    function apply() {
        const eff = mode === 'auto' ? (getColor() === 'white' ? 'light' : 'dark') : mode;
        stripEl.dataset.bg = eff;
        row.querySelectorAll('.tb-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    }

    row.addEventListener('click', (e) => {
        const b = e.target.closest('.tb-btn');
        if (!b) return;
        mode = b.dataset.mode;
        try { localStorage.setItem(KEY, mode); } catch (err) { /* не критично */ }
        apply();
    });

    const colorSel = document.getElementById('select-color');
    if (colorSel) colorSel.addEventListener('change', apply);

    apply();
    return { refresh: apply };
}
