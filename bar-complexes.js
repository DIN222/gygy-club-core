// bar-complexes.js
// v1.0.0 — 2026-11-04
// Бар: кнопка «К столикам» (TABLES ZONE) принадлежит ПК-5 и скрыта, пока комплекс закрыт.
import { canEnter } from './core/complexes.js';

const btn = document.querySelector('[data-translate="bar_tables"]');
if (btn) {
    btn.style.display = 'none';
    canEnter('pk5').then(ok => { if (ok) btn.style.display = ''; });
} else {
    console.warn('[bar-complexes] Кнопка столиков не найдена: у неё должен быть атрибут data-translate="bar_tables".');
}
