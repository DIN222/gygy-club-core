// atelier-layout.js
// v1.2.0 — 2026-11-01
// Ателье: «сцена и шаги». Перестраивает страницу из её же элементов (id и обработчики сохраняются).
// Если страница уже перестроена — ничего не делает. Если что-то не так, страница остаётся прежней,
// а причина пишется в консоль; при открытии atelier.html?debug=1 она показана красной полосой сверху.

import { t, onLanguageChange, registerDictionary } from './core/localization.js';

registerDictionary({
    en: {
        at_step_garment: '1 · GARMENT', at_step_design: '2 · DESIGN', at_step_place: '3 · PLACEMENT',
        at_step_help: 'HELP AND REVIEWS', at_summary: 'ORDER SUMMARY', at_next: 'NEXT →'
    },
    fr: {
        at_step_garment: '1 · VÊTEMENT', at_step_design: '2 · MOTIF', at_step_place: '3 · EMPLACEMENT',
        at_step_help: 'AIDE ET AVIS', at_summary: 'RÉCAPITULATIF', at_next: 'SUITE →'
    }
});

function build() {
    const $ = (id) => document.getElementById(id);
    const old = document.querySelector('.config-body');
    if (!old || document.querySelector('.at-grid')) return;

    // без этих элементов перестраивать нельзя: страница остаётся прежней
    const need = ['preview-frame', 'select-type', 'select-size', 'select-technique', 'select-position',
                  'input-quantity', 'order-info', 'order-price', 'btn-confirm', 'print-prev'];
    const missing = need.filter(id => !$(id));
    if (missing.length) throw new Error('на странице нет элементов: ' + missing.join(', '));

    const up = (id, sel) => { const el = $(id); return el ? el.closest(sel) : null; };
    const mk = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
    const label = (el, key, fb) => { el.dataset.k = key; el.dataset.fb = fb; el.textContent = t(key, fb); return el; };
    const pair = (a, b, cls) => {
        if (!a || !b) return a || b;
        const w = mk('div', 'at-pair' + (cls ? ' ' + cls : ''));
        w.append(a, b);
        return w;
    };

    // ---------- шаги ----------
    const stepEls = [];
    function openStep(n) {
        stepEls.forEach(d => { d.open = (d.dataset.step === String(n)); });
        const el = stepEls.find(d => d.dataset.step === String(n));
        if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
    }
    function makeStep(n, key, fb, nodes, next, extra) {
        const d = mk('details', 'at-step' + (extra ? ' ' + extra : ''));
        d.dataset.step = String(n);
        const s = label(mk('summary'), key, fb);
        const b = mk('div', 'at-step-body');
        nodes.forEach(x => { if (x) b.appendChild(x); });
        if (next) {
            const nb = label(mk('button', 'btn-cfg small at-next'), 'at_next', 'NEXT →');
            nb.type = 'button';
            nb.addEventListener('click', () => openStep(next));
            b.appendChild(nb);
        }
        d.append(s, b);
        d.addEventListener('toggle', () => { if (d.open) stepEls.forEach(o => { if (o !== d) o.open = false; }); });
        stepEls.push(d);
        return d;
    }

    const steps = mk('div', 'at-steps');
    steps.id = 'at-steps';
    steps.append(
        makeStep(1, 'at_step_garment', '1 · GARMENT', [
            up('select-type', '.field-row'),
            up('select-size', '.field-row'),
            pair($('row-neckline'), $('row-fit')),
            pair(up('select-fabric-composition', '.field-row'), up('select-fabric-density', '.field-row'), 'wide-left'),
            $('row-drawstring'), $('row-zipper'),
            $('spec-panel'), document.querySelector('.care-notes')
        ], 2),
        makeStep(2, 'at_step_design', '2 · DESIGN', [
            up('select-technique', '.field-row'),
            up('print-prev', '.print-strip-row'),
            $('phrase-note'),
            pair($('btn-upload-own'), $('btn-open-prompt')),
            $('share-row'), $('category-picker'), $('prompt-builder')
        ], 3),
        makeStep(3, 'at_step_place', '3 · PLACEMENT', [
            up('select-position', '.position-row'), $('size-lock-row')
        ], null),
        makeStep(4, 'at_step_help', 'HELP AND REVIEWS', [
            $('link-help'), $('review-box')
        ], null, 'at-more')
    );

    // ---------- сцена: превью и заказ всегда на виду ----------
    const sum = mk('details', 'at-sum');
    sum.id = 'at-sum';
    sum.appendChild(label(mk('summary'), 'at_summary', 'ORDER SUMMARY'));
    sum.appendChild($('order-info'));

    const qty = mk('div', 'at-qty');
    const qtyLabel = label(mk('label', 'at-qty-label'), 'at_qty_label', 'QUANTITY, PCS');
    qtyLabel.htmlFor = 'input-quantity';
    qty.append(qtyLabel, $('input-quantity'));

    const row = mk('div', 'at-ticket-row');
    row.append(qty, $('order-price'), $('btn-confirm'));

    const ticket = mk('div', 'at-ticket');
    ticket.id = 'at-ticket';
    ticket.appendChild(sum);
    if ($('order-status')) ticket.appendChild($('order-status'));
    ticket.appendChild(row);

    const stage = mk('div', 'at-stage');
    const frameOuter = up('preview-frame', '.preview-frame-outer');
    stage.append(frameOuter || $('preview-frame'), ticket);

    const grid = mk('div', 'at-grid');
    grid.append(stage, steps);
    old.parentNode.insertBefore(grid, old);
    old.remove();
    stepEls[0].open = true;

    // ---------- поведение ----------
    // пришли из Студии или космоса с фразой или картинкой — сразу «Дизайн»
    if (/[?&](phrase|inbox)=/.test(location.search)) openStep(2);
    // выбрали принт или загрузили файл — «Размещение» (для вышивки размещение задано изделием)
    const tech = $('select-technique');
    const strip = $('print-strip');
    if (strip) strip.addEventListener('click', (e) => {
        if (e.target.closest('.print-icon') && tech && tech.value !== 'embroidery') setTimeout(() => openStep(3), 250);
    });
    const file = $('file-input');
    if (file) file.addEventListener('change', () => {
        if (tech && tech.value !== 'embroidery') setTimeout(() => openStep(3), 700);
    });
    // итог заказа раскрыт на большом экране; на маленьком и невысоком свёрнут
    if (window.matchMedia('(min-width: 901px) and (min-height: 760px)').matches) sum.open = true;

    onLanguageChange(() => {
        document.querySelectorAll('[data-k]').forEach(el => { el.textContent = t(el.dataset.k, el.dataset.fb); });
    });
}

try {
    build();
} catch (e) {
    console.error('[atelier-layout] Не удалось перестроить страницу, остаётся прежний вид:', e);
    if (/[?&]debug=1/.test(location.search) && document.body) {
        const bar = document.createElement('div');
        bar.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:99999;background:#a02020;color:#fff;padding:8px 12px;font:12px monospace;';
        bar.textContent = 'atelier-layout: ' + (e && e.message ? e.message : e);
        document.body.appendChild(bar);
    }
}
