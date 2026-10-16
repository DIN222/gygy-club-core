// modules/expenseJournal.js
// v1.0.0 — 2026-10-16
// Журнал расхода. renderExpenseJournal(контейнер, { line: null | 'atelier' | 'store' | 'souvenirs' }).
// line = null — общий журнал по всем направлениям. Стили подключает сам.

import { supabase } from '../core/supabase-init.js';

const LINE_LABELS = { atelier: 'Ателье', store: 'Лавка древностей', souvenirs: 'Сувениры' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = (n) => `€${Number(n || 0).toFixed(2)}`;

function injectStyles() {
    if (document.getElementById('ej-styles')) return;
    const s = document.createElement('style');
    s.id = 'ej-styles';
    s.textContent = `
        .ej-scroll { overflow-x: auto; }
        .ej-table { width: 100%; border-collapse: collapse; font-size: 11px; font-family: 'Share Tech Mono', monospace; }
        .ej-table th { text-align: left; color: #8a6f24; padding: 6px 5px; border-bottom: 1px solid #8a6f24; font-size: 10px; text-transform: uppercase; white-space: nowrap; }
        .ej-table td { padding: 6px 5px; border-bottom: 1px solid #1a1a1a; color: #F0EAD6; white-space: nowrap; }
        .ej-table th.ej-amt, .ej-table td.ej-amt { text-align: right; }
        .ej-table td.ej-amt { color: #FFD700; font-weight: 700; }
        .ej-table tr.ej-total td { color: #FFD700; font-weight: 900; border-top: 1px solid #8a6f24; }
        .ej-note { font-size: 11px; color: #777; text-align: center; padding: 16px; font-family: 'Share Tech Mono', monospace; }
        .ej-note.ej-error { color: #e74c3c; }
    `;
    document.head.appendChild(s);
}

export async function renderExpenseJournal(container, { line = null, limit = 300 } = {}) {
    injectStyles();
    container.innerHTML = '<div class="ej-note">Загрузка…</div>';

    let q = supabase.from('expense_entries').select('*, suppliers(name)')
        .order('expense_date', { ascending: false }).limit(limit);
    if (line) q = q.eq('business_line', line);
    const { data, error } = await q;
    if (error) {
        console.error('[ExpenseJournal]', error);
        container.innerHTML = `<div class="ej-note ej-error">Не удалось загрузить журнал: ${esc(error.message)}</div>`;
        return;
    }
    const rows = data || [];
    if (!rows.length) {
        container.innerHTML = '<div class="ej-note">Записей пока нет.</div>';
        return;
    }

    const showLine = !line;
    let total = 0;
    const body = rows.map(r => {
        const amount = Number(r.total_price || 0) + Number(r.delivery_cost || 0);
        total += amount;
        return `<tr>
            <td>${esc(new Date(r.expense_date).toLocaleDateString())}</td>
            ${showLine ? `<td>${esc(LINE_LABELS[r.business_line] || r.business_line)}</td>` : ''}
            <td>${esc(r.item_name)} (${esc(r.quantity)})</td>
            <td>${esc(r.suppliers && r.suppliers.name ? r.suppliers.name : '—')}</td>
            <td class="ej-amt">${eur(amount)}</td>
        </tr>`;
    }).join('');

    container.innerHTML = `<div class="ej-scroll"><table class="ej-table">
        <thead><tr><th>Дата</th>${showLine ? '<th>Направление</th>' : ''}<th>Что</th><th>Поставщик</th><th class="ej-amt">Сумма</th></tr></thead>
        <tbody>${body}
        <tr class="ej-total"><td colspan="${showLine ? 4 : 3}">ИТОГО (${rows.length})</td><td class="ej-amt">${eur(total)}</td></tr></tbody>
    </table></div>`;
}
