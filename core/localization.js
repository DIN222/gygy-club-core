/**
 * core/localization.js
 * v1.3.0 — 2026-10-25
 * Изменения:
 *  (1) Две области языка (scope): 'client' — витрина клуба (English / Français,
 *      ключ langCode) и 'admin' — служебные страницы (Русский / Français / English,
 *      ключ adminLang, по умолчанию русский). Область задаёт setScope();
 *      служебные страницы включают её через core/adminLang.js.
 *  (2) Звуковой сценарий (modules/soundscape.js) стартует вместе с init()
 *      на клиентских страницах.
 *  Сохранено из v1.2.0: словари через registerDictionary(), атрибуты
 *  data-translate-*, подстановка {имя} в t(), onLanguageChange(),
 *  машинный перевод modules/liveTranslate.js.
 *  Нет перевода — показывается английский, затем исходный текст из HTML (не имя ключа).
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

// Области языка. Чтобы вернуть другие языки, допишите их коды в enabled.
const SCOPES = {
    client: { key: 'langCode', def: 'en', enabled: ['en', 'fr'] },
    admin:  { key: 'adminLang', def: 'ru', enabled: ['ru', 'fr', 'en'] }
};
let scope = 'client';

export function setScope(name) { if (SCOPES[name]) scope = name; }
export function getScope() { return scope; }

// Для обратной совместимости: языки клиентской витрины
export const ENABLED_LANGUAGES = SCOPES.client.enabled;

const TRANSLATIONS = {};
let valueSets = {};

export function registerDictionary(dict) {
    Object.keys(dict || {}).forEach(lang => {
        TRANSLATIONS[lang] = Object.assign(TRANSLATIONS[lang] || {}, dict[lang]);
    });
    valueSets = {};
}
registerDictionary(COMMON_DICT);

// Это текст из нашего словаря на текущем языке? Машинный переводчик такие строки не трогает.
export function isDictionaryText(text) {
    const lang = getCurrentLang();
    if (!valueSets[lang]) valueSets[lang] = new Set(Object.values(TRANSLATIONS[lang] || {}));
    return valueSets[lang].has(text);
}

function flagUrl(countryCode) {
    return `https://flagcdn.com/w20/${countryCode}.png`;
}

function interpolate(str, vars) {
    if (!vars) return str;
    return String(str).replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
}

/**
 * Текущий язык (код) для текущей области. Если сохранён язык, которого нет
 * в списке области, возвращается язык области по умолчанию.
 */
export function getCurrentLang() {
    const sc = SCOPES[scope];
    const stored = get(sc.key, sc.def);
    return sc.enabled.includes(stored) ? stored : sc.def;
}

/**
 * Перевод фразы по ключу. Нет перевода — английский; нет и его — fallback
 * (исходный текст из HTML); нет и его — сам ключ. {имя} подставляется из vars.
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
 * Применить перевод внутри контейнера:
 *   data-translate="key"              — текст элемента
 *   data-translate-html="key"         — разметка внутри (только для своих строк)
 *   data-translate-placeholder="key"  — placeholder
 *   data-translate-title="key"        — подсказка при наведении
 *   data-translate-alt="key"          — alt картинки
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
 * Выбрать язык в текущей области. Витрина: сохраняет язык, название и флаг страны
 * (паспорт подхватывает флаг). Служебные страницы: меняется только adminLang,
 * флаг и паспорт не затрагиваются.
 */
export function selectLanguage(langCode) {
    const sc = SCOPES[scope];
    const lang = FULL_LANGUAGES.find(l => l.code === langCode && sc.enabled.includes(l.code))
        || FULL_LANGUAGES.find(l => l.code === sc.def);

    set(sc.key, lang.code);
    let country;
    if (scope === 'client') {
        set('langName', lang.name);
        set('flagCountry', lang.country);
        country = lang.country;
    } else {
        country = get('flagCountry', 'gb');
    }

    applyTranslations();
    emit('language:changed', { langCode: lang.code, name: lang.name, country, flagUrl: flagUrl(country) });
}

/**
 * Подписка страницы на смену языка (для текстов, собираемых в JS).
 */
export function onLanguageChange(callback) {
    on('language:changed', callback);
}

/**
 * Выпадающий список языков: разрешённые в области МИНУС текущий.
 */
export function renderLanguageList(container) {
    if (!container) return;
    container.innerHTML = '';
    const currentCode = getCurrentLang();
    const enabled = SCOPES[scope].enabled;
    FULL_LANGUAGES
        .filter(lang => enabled.includes(lang.code) && lang.code !== currentCode)
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

// Машинный перевод всего, чего нет в словаре (modules/liveTranslate.js + функция translate).
// Выключить целиком: LIVE_TRANSLATE = false.
export const LIVE_TRANSLATE = true;
// Служебный просмотр страниц для «прогрева» перевода (translations-admin.html): без перевода и звука
const SCANNING = /[?&]lt_scan=1/.test(location.search);

let liveStarted = false;
function startLiveTranslate() {
    if (liveStarted || !LIVE_TRANSLATE || SCANNING) return;
    liveStarted = true;
    import('../modules/liveTranslate.js')
        .then(m => m.start())
        .catch(e => console.warn('[localization] liveTranslate не загружен', e));
}

// Звуковой сценарий (modules/soundscape.js, таблица — core/soundScenario.js). Только витрина.
let soundStarted = false;
function startSoundscape() {
    if (soundStarted || SCANNING) return;
    soundStarted = true;
    import('../modules/soundscape.js')
        .then(m => m.apply())
        .catch(e => console.warn('[localization] soundscape не загружен', e));
}

export function init(container = document, options = {}) {
    if (options.scope) setScope(options.scope);
    boundContainer = container;
    applyTranslations(boundContainer);
    startLiveTranslate();
    if (scope === 'client') startSoundscape();
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
    selectLanguage, renderLanguageList, registerDictionary, onLanguageChange, setScope, getScope,
    init, update, destroy
};
export default Localization;
