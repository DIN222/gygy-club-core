// core/adminLang.js
// v1.0.0 — 2026-10-25
// Язык служебных страниц (Бухгалтерия, Офис): по умолчанию русский,
// внизу справа переключатель RU / FR / EN. Подключается одной строкой в core/auth.js.

import { setScope, init, getCurrentLang, selectLanguage, onLanguageChange } from './localization.js';

setScope('admin');

const OPTIONS = [['ru', 'RU'], ['fr', 'FR'], ['en', 'EN']];
const NOTICE_KEY = 'gygy_admin_translate_ok';
const NOTICE_TEXT =
    'Перевод страницы выполняет внешний сервис (DeepL): текст страницы, включая названия, ' +
    'имена и данные заказов, отправляется на перевод и сохраняется в кэше переводов.\n\n' +
    'Включайте перевод только на демонстрационных данных.\n\nПродолжить?';

function paint() {
    const box = document.getElementById('gy-admin-lang');
    if (!box) return;
    const cur = getCurrentLang();
    box.querySelectorAll('button').forEach(b => {
        const on = b.dataset.lang === cur;
        b.style.background = on ? '#FFD700' : '#000';
        b.style.color = on ? '#000' : '#FFD700';
    });
}

function choose(code) {
    if (code !== 'ru') {
        let ok = false;
        try { ok = sessionStorage.getItem(NOTICE_KEY) === '1'; } catch (e) { /* ок */ }
        if (!ok) {
            if (!confirm(NOTICE_TEXT)) return;
            try { sessionStorage.setItem(NOTICE_KEY, '1'); } catch (e) { /* ок */ }
        }
    }
    selectLanguage(code);
    paint();
}

function mountSwitcher() {
    if (document.getElementById('gy-admin-lang') || !document.body) return;
    const box = document.createElement('div');
    box.id = 'gy-admin-lang';
    box.className = 'notranslate';
    box.setAttribute('translate', 'no');
    box.style.cssText = 'position:fixed;bottom:12px;right:12px;z-index:3000;display:flex;gap:4px;font-family:"Share Tech Mono",monospace;';
    OPTIONS.forEach(([code, label]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.lang = code;
        b.textContent = label;
        b.style.cssText = 'border:1px solid #8a6f24;padding:5px 8px;font-size:11px;cursor:pointer;font-family:inherit;';
        b.addEventListener('click', () => choose(code));
        box.appendChild(b);
    });
    document.body.appendChild(box);
    paint();
}

function go() {
    init(document.body);
    mountSwitcher();
    onLanguageChange(paint);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go, { once: true });
else go();
