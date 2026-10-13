// modules/incomeJournal.js
// v1.0.0 — 2026-10-13
// Журнал прихода. renderJournal(контейнер, { line: null | 'atelier' | 'store' | 'souvenirs' }).
// line = null — общий журнал по всем направлениям.

import { supabase } from '../core/supabase-init.js';

const LINE_LABELS = { atelier: 'Ателье', store: 'Лавка древностей', souvenirs: 'Сувениры' };
const GARMENTS = { tshirt: 'Футболка', hoodie: 'Худи', longsleeve: 'Лонгслив' };
const COLORS = { black: 'чёрный', white: 'белый' };

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = (n) => `€${Number(n || 0).toFixed(2)}`;

function injectStyles() {
    if (document.getElementById('jr-styles')) return;
    const s = document.createElement('style');
    s.id = 'jr-styles';
    s.textContent = `
        .jr-scroll { overflow-x: auto; }
        .jr-table { width: 100%; border-collapse: collapse; font-size: 11px; font-family: 'Share Tech Mono', monospace; }
        .jr-table th { text-align: left; color: #8a6f24; padding: 6px 5px; border-bottom: 1px solid #8a6f24; font-size: 10px; text-transform: uppercase; white-space: nowrap; }
        .jr-table td { padding: 6px 5px; border-bottom: 1px solid #1a1a1a; color: #F0EAD6; white-space: nowrap; }
        .jr-table td.jr-amt, .jr-table th.jr-amt { text-align: right; }
        .jr-table td.jr-amt { color: #FFD700; font-weight: 700; }
        .jr-table tr.jr-total td { color: #FFD700; font-weight: 900; border-top: 1px solid #8a6f24; }
        .jr-note { font-size: 11px; color: #777; text-align: center; padding: 16px; font-family: 'Share Tech Mono', monospace; }
        .jr-note.jr-error { color: #e74c3c; }
    `;
    document.head.appendChild(s);
}

export async function renderJournal(container, { line = null, limit = 200 } = {}) {
    injectStyles();
    container.innerHTML = '<div class="jr-note">Загрузка…</div>';

    let q = supabase.from('income_entries').select('*').order('order_date', { ascending: false }).limit(limit);
    if (line) q = q.eq('business_line', line);
    const { data, error } = await q;
    if (error) {
        console.error('[IncomeJournal]', error);
        container.innerHTML = `<div class="jr-note jr-error">Не удалось загрузить журнал: ${esc(error.message)}</div>`;
        return;
    }
    const rows = data || [];
    if (!rows.length) {
        container.innerHTML = '<div class="jr-note">Записей пока нет.</div>';
        return;
    }

    const showLine = !line;
    let total = 0;
    const body = rows.map(r => {
        const o = r.atelier_order || {};
        total += Number(r.total_amount) || 0;
        let details, pay = '—';
        if (r.business_line === 'atelier') {
            details = [GARMENTS[o.garment] || o.garment, o.size, COLORS[o.color] || o.color].filter(Boolean).join(' · ')
                + ` × ${Number(o.quantity) || 1}`;
            pay = r.payment_date ? 'оплачено' : (o.paymentMethod === 'cod' ? 'наложенный' : 'ждёт');
        } else {
            details = o.description || '';
        }
        return `<tr>
            <td>${esc(new Date(r.order_date).toLocaleDateString())}</td>
            ${showLine ? `<td>${esc(LINE_LABELS[r.business_line] || r.business_line)}</td>` : ''}
            <td>${esc(r.order_number)}</td>
            <td>${esc(details)}</td>
            <td>${pay}</td>
            <td class="jr-amt">${eur(r.total_amount)}</td>
        </tr>`;
    }).join('');

    container.innerHTML = `<div class="jr-scroll"><table class="jr-table">
        <thead><tr><th>Дата</th>${showLine ? '<th>Направление</th>' : ''}<th>№ заказа</th><th>Детали</th><th>Оплата</th><th class="jr-amt">Сумма</th></tr></thead>
        <tbody>${body}
        <tr class="jr-total"><td colspan="${showLine ? 5 : 4}">ИТОГО (${rows.length})</td><td class="jr-amt">${eur(total)}</td></tr></tbody>
    </table></div>`;
}
