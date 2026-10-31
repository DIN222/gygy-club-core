// core/complexes.js
// v1.0.0 — 2026-10-31
// Пусковые комплексы: ПК-1 Ателье и инфраструктура, ПК-2 Лавка древностей, ПК-3 Магазин сувениров.
// Статусы лежат в таблице launch_complexes: closed — закрыт, preview — виден только сотрудникам,
// open — открыт (или наступила дата opens_at). Нет таблицы или база недоступна — всё считается открытым.

import { supabase } from './supabase-init.js';
import { t, registerDictionary } from './localization.js';
import { COMPLEXES_DICT } from './i18n/complexes.js';

registerDictionary(COMPLEXES_DICT);

let cache = null;
let staffCache = null;

export function effectiveStatus(row) {
    if (!row) return 'open';
    if (row.status === 'open') return 'open';
    if (row.opens_at && Date.parse(row.opens_at) <= Date.now()) return 'open';
    return row.status;
}

export async function loadComplexes() {
    if (cache) return cache;
    const map = {};
    try {
        const { data, error } = await supabase.from('launch_complexes').select('*');
        if (error) throw error;
        (data || []).forEach(r => { map[r.code] = r; });
    } catch (e) {
        console.warn('[complexes] Таблица launch_complexes недоступна — все комплексы считаются открытыми.', e);
    }
    cache = map;
    return map;
}

async function isStaff() {
    if (staffCache !== null) return staffCache;
    try {
        const { data } = await supabase.auth.getSession();
        staffCache = !!(data && data.session);
    } catch (e) {
        staffCache = false;
    }
    return staffCache;
}

// Может ли этот посетитель войти в комплекс
export async function canEnter(code) {
    const map = await loadComplexes();
    const st = effectiveStatus(map[code]);
    if (st === 'open') return true;
    if (st === 'preview') return await isStaff();
    return false;
}

function showClosedScreen(row) {
    const body = document.body;
    body.innerHTML = '';
    body.style.cssText = 'margin:0;min-height:100vh;background:#000;color:#FFD700;font-family:"Share Tech Mono",monospace;' +
        'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center;padding:20px;visibility:visible;';

    const logo = document.createElement('div');
    logo.textContent = 'GY-GY';
    logo.setAttribute('translate', 'no');
    logo.style.cssText = 'font-size:28px;letter-spacing:6px;font-weight:bold;';

    const title = document.createElement('div');
    title.textContent = t('cx_soon', 'COMING SOON');
    title.style.cssText = 'font-size:22px;letter-spacing:4px;';

    body.appendChild(logo);
    body.appendChild(title);

    if (row && row.opens_at) {
        const date = new Date(row.opens_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
        const line = document.createElement('div');
        line.textContent = t('cx_opens', 'Opens {date}', { date });
        line.style.cssText = 'font-size:13px;color:#F0EAD6;';
        body.appendChild(line);
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = t('cx_back', 'Back to the Hall');
    btn.style.cssText = 'margin-top:8px;background:#000;color:#FFD700;border:1px solid #FFD700;padding:10px 18px;font-family:inherit;font-size:12px;text-transform:uppercase;cursor:pointer;';
    btn.addEventListener('click', () => { window.location.href = 'hall.html'; });
    body.appendChild(btn);
}

// Страница комплекса: вызывается сразу после import. false — вход закрыт, показан экран «Скоро».
export async function guardPage(code) {
    document.body.style.visibility = 'hidden';
    const ok = await canEnter(code);
    if (ok) { document.body.style.visibility = ''; return true; }
    const map = await loadComplexes();
    showClosedScreen(map[code]);
    return false;
}

// Холл: { 'id кнопки': 'код комплекса' }. Кнопки закрытых комплексов скрыты.
export async function applyHallVisibility(buttons) {
    const items = Object.entries(buttons).map(([id, code]) => [document.getElementById(id), code, id]);
    items.forEach(([el, , id]) => {
        if (!el) console.warn('[complexes] В Холле нет кнопки с id="' + id + '" — поправьте таблицу в hall.html.');
        else el.style.display = 'none';
    });
    for (const [el, code] of items) {
        if (el && await canEnter(code)) el.style.display = '';
    }
}
