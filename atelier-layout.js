// atelier-layout.js — v1.0.0 — Ателье: «сцена и шаги». Перестраивает страницу из её же элементов
// (id и обработчики сохраняются). Если страница уже перестроена — ничего не делает.
import { t, onLanguageChange, registerDictionary } from './core/localization.js';

registerDictionary({
    en: { at_step_garment: '1 · GARMENT', at_step_design: '2 · DESIGN', at_step_place: '3 · PLACEMENT', at_step_help: 'HELP AND REVIEWS', at_summary: 'ORDER SUMMARY', at_next: 'NEXT →' },
    fr: { at_step_garment: '1 · VÊTEMENT', at_step_design: '2 · MOTIF', at_step_place: '3 · EMPLACEMENT', at_step_help: 'AIDE ET AVIS', at_summary: 'RÉCAPITULATIF', at_next: 'SUITE →' }
});

(function build() {
    const $ = (id) => document.getElementById(id);
    const old = document.querySelector('.config-body');
    if (!old || document.querySelector('.at-grid')) return;

    const up = (id, sel) => { const el = $(id); return el ? el.closest(sel) : null; };
    const mk = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
    const label = (el, key, fb) => { el.dataset.k = key; el.dataset.fb = fb; el.textContent = t(key, fb); return el; };

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
            up('select-type', '.field-row'), up('select-size', '.field-row'), $('row-neckline'), $('row-fit'),
            up('select-fabric-composition', '.field-row'), up('select-fabric-density', '.field-row'),
            $('row-drawstring'), $('row-zipper'), $('spec-panel'), document.querySelector('.care-notes')
        ], 2),
        makeStep(2, 'at_step_design', '2 · DESIGN', [
            up('select-technique', '.field-row'), up('print-prev', '.print-strip-row'), $('phrase-note'),
            $('btn-upload-own'), $('share-row'), $('category-picker'), $('btn-open-prompt'), $('prompt-builder')
        ], 3),
        makeStep(3, 'at_step_place', '3 · PLACEMENT', [up('select-position', '.position-row'), $('size-lock-row')], null),
        makeStep(4, 'at_step_help', 'HELP AND REVIEWS', [$('link-help'), $('review-box')], null, 'at-more')
    );

    const sum = mk('details', 'at-sum');
    sum.id = 'at-sum';
    sum.appendChild(label(mk('summary'), 'at_summary', 'ORDER SUMMARY'));
    if ($('order-info')) sum.appendChild($('order-info'));

    const qty = mk('div', 'at-qty');
    const qtyLabel = label(mk('label', 'at-qty-label'), 'at_qty_label', 'QUANTITY, PCS');
    qtyLabel.htmlFor = 'input-quantity';
    qty.appendChild(qtyLabel);
    if ($('input-quantity')) qty.appendChild($('input-quantity'));

    const row = mk('div', 'at-ticket-row');
    row.appendChild(qty);
    if ($('order-price')) row.appendChild($('order-price'));
    if ($('btn-confirm')) row.appendChild($('btn-confirm'));

    const ticket = mk('div', 'at-ticket');
    ticket.id = 'at-ticket';
    ticket.appendChild(sum);
    if ($('order-status')) ticket.appendChild($('order-status'));
    ticket.appendChild(row);

    const stage = mk('div', 'at-stage');
    const frameOuter = up('preview-frame', '.preview-frame-outer');
    if (frameOuter) stage.appendChild(frameOuter);
    stage.appendChild(ticket);

    const grid = mk('div', 'at-grid');
    grid.append(stage, steps);
    old.parentNode.insertBefore(grid, old);
    old.remove();
    stepEls[0].open = true;

    if (/[?&](phrase|inbox)=/.test(location.search)) openStep(2);
    const tech = $('select-technique');
    const strip = $('print-strip');
    if (strip) strip.addEventListener('click', (e) => {
        if (e.target.closest('.print-icon') && tech && tech.value !== 'embroidery') setTimeout(() => openStep(3), 250);
    });
    const file = $('file-input');
    if (file) file.addEventListener('change', () => {
        if (tech && tech.value !== 'embroidery') setTimeout(() => openStep(3), 700);
    });
    if (window.matchMedia('(min-width: 901px) and (min-height: 760px)').matches) sum.open = true;

    onLanguageChange(() => {
        document.querySelectorAll('[data-k]').forEach(el => { el.textContent = t(el.dataset.k, el.dataset.fb); });
    });
})();
