/**
 * core/localization.js
 * v1.2.0 — 2026-10-24
 * Изменения:
 *  (1) Выбор языка ограничен списком ENABLED_LANGUAGES (сейчас English и Français).
 *      Остальные языки остаются в коде, но не предлагаются; сохранённый ранее
 *      неактивный язык трактуется как английский.
 *  (2) Словари регистрируются через registerDictionary(); общий словарь лежит
 *      в core/i18n/common.js, страницы могут добавлять свои.
 *  (3) applyTranslations понимает не только текст (data-translate), но и
 *      data-translate-html, data-translate-placeholder, data-translate-title,
 *      data-translate-alt; выставляет lang у <html>.
 *  (4) t(key, fallback, vars) — подстановка {имя}; onLanguageChange(cb) для
 *      страниц, которые собирают текст в JS и должны перерисоваться при смене языка.
 *  Правила v1.1.0 сохранены: нет перевода — показывается английский,
 *  затем исходный текст из HTML (не имя ключа).
 *
 * Локализация СТАТИЧНОГО интерфейса проекта (кнопки, заголовки, слоганы).
 * Динамический контент (чаты, жалобы, генеративные AI-комнаты) сюда не входит.
 */

import { emit, on } from './eventBus.js';
import { get, set } from './storage.js';
import { COMMON_DICT } from './i18n/common.js';

export const DEFAULT_LANG = 'en';

const EN_LANGUAGE = { code: 'en', name: 'English', country: 'gb' };

export const ALL_LANGUAGES = [
    { code: 'ru', name: 'Русский', country: 'ru' },
    { code: 'es', name: 'Español', country: 'es' },
    { code: 'de', name: 'Deutsch', country: 'de' },
    { code: 'fr', name: 'Français', country: 'fr' },
    { code: 'it', name: 'Italiano', country: 'it' },
    { code: 'zh-CN', name: '中文', country: 'cn' },
    { code: 'ja', name: '日本語', country: 'jp' },
    { code: 'tr', name: 'Türkçe', country: 'tr' },
    { code: 'pt', name: 'Português', country: 'pt' },
    { code: 'uk', name: 'Українська', country: 'ua' },
    { code: 'pl', name: 'Polski', country: 'pl' }
];

export const FULL_LANGUAGES = [EN_LANGUAGE, ...ALL_LANGUAGES];

// Языки, которые сейчас предлагаются в выборе. Чтобы вернуть остальные,
// достаточно дописать их коды сюда.
export const ENABLED_LANGUAGES = ['en', 'fr'];

const TRANSLATIONS = {};

let valueSets = {};

export function registerDictionary(dict) {
    Object.keys(dict || {}).forEach(lang => {
        TRANSLATIONS[lang] = Object.assign(TRANSLATIONS[lang] || {}, dict[lang]);
    });
    valueSets = {};
}

// Это текст из нашего словаря на текущем языке? Машинный переводчик такие строки не трогает.
export function isDictionaryText(text) {
    const lang = getCurrentLang();
    if (!valueSets[lang]) valueSets[lang] = new Set(Object.values(TRANSLATIONS[lang] || {}));
    return valueSets[lang].has(text);
}
registerDictionary(COMMON_DICT);

function flagUrl(countryCode) {
    return `https://flagcdn.com/w20/${countryCode}.png`;
}

function interpolate(str, vars) {
    if (!vars) return str;
    return String(str).replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
}

/**
 * Текущий выбранный язык (код). Если сохранён язык, которого нет в
 * ENABLED_LANGUAGES, возвращается английский.
 */
export function getCurrentLang() {
    const stored = get('langCode', DEFAULT_LANG);
    return ENABLED_LANGUAGES.includes(stored) ? stored : DEFAULT_LANG;
}

/**
 * Перевод фразы по ключу для текущего языка.
 * Нет перевода — английский; нет и его — fallback (исходный текст из HTML);
 * нет и его — сам ключ. В строке можно использовать {имя}, значения — в vars.
 */
export function t(key, fallback, vars) {
    const lang = getCurrentLang();
    const raw = TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS[DEFAULT_LANG]?.[key] ?? fallback ?? key;
    return interpolate(raw, vars);
}

const ATTRIBUTE_MAP = [
    ['data-translate-placeholder', 'placeholder', 'fallbackPlaceholder'],
    ['data-translate-title', 'title', 'fallbackTitle'],
    ['data-translate-alt', 'alt', 'fallbackAlt']
];

/**
 * Применить перевод ко всем элементам внутри контейнера:
 *   data-translate="key"              — текст элемента
 *   data-translate-html="key"         — разметка внутри (только для своих, доверенных строк)
 *   data-translate-placeholder="key"  — placeholder
 *   data-translate-title="key"        — подсказка при наведении
 *   data-translate-alt="key"          — alt картинки
 * Исходное значение запоминается при первом проходе и служит запасным.
 */
export function applyTranslations(container = document) {
    container.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (el.dataset.fallbackText === undefined) el.dataset.fallbackText = el.textContent;
        el.textContent = t(key, el.dataset.fallbackText);
    });
    container.querySelectorAll('[data-translate-html]').forEach(el => {
        const key = el.getAttribute('data-translate-html');
        if (el.dataset.fallbackHtml === undefined) el.dataset.fallbackHtml = el.innerHTML;
        el.innerHTML = t(key, el.dataset.fallbackHtml);
    });
    ATTRIBUTE_MAP.forEach(([attr, target, cache]) => {
        container.querySelectorAll(`[${attr}]`).forEach(el => {
            const key = el.getAttribute(attr);
            if (el.dataset[cache] === undefined) el.dataset[cache] = el.getAttribute(target) || '';
            el.setAttribute(target, t(key, el.dataset[cache]));
        });
    });
    if (document.documentElement) document.documentElement.lang = getCurrentLang();
}

/**
 * Выбрать язык: сохраняет в Storage, обновляет DOM, эмитит 'language:changed'.
 */
export function selectLanguage(langCode) {
    const lang = FULL_LANGUAGES.find(l => l.code === langCode) || EN_LANGUAGE;

    set('langCode', lang.code);
    set('langName', lang.name);
    set('flagCountry', lang.country);

    applyTranslations();
    emit('language:changed', { langCode: lang.code, name: lang.name, country: lang.country, flagUrl: flagUrl(lang.country) });
}

/**
 * Подписка страницы на смену языка (для текстов, собираемых в JS).
 */
export function onLanguageChange(callback) {
    on('language:changed', callback);
}

/**
 * Выпадающий список языков: разрешённые языки МИНУС текущий.
 */
export function renderLanguageList(container) {
    if (!container) return;
    container.innerHTML = '';
    const currentCode = getCurrentLang();
    FULL_LANGUAGES
        .filter(lang => ENABLED_LANGUAGES.includes(lang.code) && lang.code !== currentCode)
        .forEach(lang => {
            const item = document.createElement('div');
            item.className = 'club-lang-item';
            item.innerHTML = `
                <img class="item-flag" src="${flagUrl(lang.country)}" alt="${lang.code}">
                <span class="item-text">${lang.name}</span>
            `;
            item.addEventListener('click', () => {
                selectLanguage(lang.code);
                renderLanguageList(container);
            });
            container.appendChild(item);
        });
}

/**
 * Контракт узла (см. CONTRACT.md).
 */
const MODULE_NAME = 'localization';

let boundContainer = null;

export function init(container = document) {
    boundContainer = container;
    applyTranslations(boundContainer);
    emit('MODULE_INIT', { module: MODULE_NAME, at: Date.now() });
}

export function update() {
    applyTranslations(boundContainer || document);
}

export function destroy() {
    boundContainer = null;
    emit('MODULE_DESTROY', { module: MODULE_NAME, at: Date.now() });
}

export const Localization = {
    DEFAULT_LANG, ALL_LANGUAGES, ENABLED_LANGUAGES, t, getCurrentLang, applyTranslations,
    selectLanguage, renderLanguageList, registerDictionary, onLanguageChange, init, update, destroy
};
export default Localization;
