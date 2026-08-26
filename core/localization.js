/**
 * core/localization.js
 * v1.0.0 — 2026-08-26
 *
 * Локализация СТАТИЧНОГО интерфейса проекта (кнопки, заголовки, слоганы).
 * Динамический контент (чаты, жалобы, генеративные AI-комнаты) НЕ входит
 * в зону ответственности этого модуля — для него отдельный модуль
 * на базе внешнего переводчика (см. modules/liveTranslate.js, будет позже).
 *
 * Отличия от v1 (GyLocalization из старого репозитория):
 *  - убран Google Translate виджет (.goog-te-combo) — смешение статики
 *    и динамики в одном механизме признано архитектурной ошибкой;
 *  - перевод через собственный словарь TRANSLATIONS + data-translate;
 *  - чтение/запись языка только через core/storage.js, без localStorage напрямую;
 *  - обновление DOM происходит реактивно через EventBus, а не императивным
 *    поиском getElementById внутри каждого метода.
 */

import { emit } from './eventBus.js';
import { get, set } from './storage.js';

// Английский — язык по умолчанию, в отдельной рамке, не входит в выпадающий список.
export const DEFAULT_LANG = 'en';

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

/**
 * Словарь переводов статичных фраз.
 * Ключ словаря = значение атрибута data-translate в HTML.
 * Пример разметки: <button data-translate="btn.enter_hall">Enter Hall</button>
 *
 * Пока заполнено минимально — реальные фразы добавляются по мере
 * переноса страниц из старого репозитория.
 */
const TRANSLATIONS = {
    en: {
        'btn.enter_hall': 'Enter the Hall',
        'btn.go_register': 'Go to Registration'
    },
    ru: {
        'btn.enter_hall': 'Проходите в Холл',
        'btn.go_register': 'Проходите на регистрацию'
    }
    // остальные 9 языков добавляются сюда по мере перевода
};

function flagUrl(countryCode) {
    return `https://flagcdn.com/w20/${countryCode}.png`;
}

/**
 * Получить перевод фразы по ключу для текущего языка.
 * Если перевода нет — падает обратно на английский, затем на сам ключ
 * (чтобы явно было видно в интерфейсе, что перевод не найден, а не пусто).
 * @param {string} key
 */
export function t(key) {
    const lang = getCurrentLang();
    return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS[DEFAULT_LANG]?.[key] ?? key;
}

/**
 * Текущий выбранный язык (код), по умолчанию — английский.
 */
export function getCurrentLang() {
    return get('langCode', DEFAULT_LANG);
}

/**
 * Применить перевод ко всем элементам с data-translate внутри контейнера.
 * Вызывается модулями в init() и повторно после смены языка.
 * @param {HTMLElement} [container=document]
 */
export function applyTranslations(container = document) {
    container.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        el.textContent = t(key);
    });
}

/**
 * Выбрать язык. Сохраняет в Storage, эмитит событие для всех подписчиков
 * (счётчики по флагам, паспорт и т.д.), затем сама же обновляет DOM.
 * @param {string} langCode
 */
export function selectLanguage(langCode) {
    const lang = ALL_LANGUAGES.find(l => l.code === langCode);
    const name = lang ? lang.name : 'English';
    const country = lang ? lang.country : 'gb';

    set('langCode', langCode);
    set('langName', name);
    set('flagCountry', country);

    applyTranslations();
    emit('language:changed', { langCode, name, country, flagUrl: flagUrl(country) });
}

/**
 * Отрисовать выпадающий список языков внутри переданного контейнера.
 * Модуль не владеет всей страницей — только этим списком.
 * @param {HTMLElement} container
 */
export function renderLanguageList(container) {
    if (!container) return;
    container.innerHTML = '';
    ALL_LANGUAGES.forEach(lang => {
        const item = document.createElement('div');
        item.className = 'club-lang-item';
        item.innerHTML = `
            <img class="item-flag" src="${flagUrl(lang.country)}" alt="${lang.code}">
            <span class="item-text">${lang.name}</span>
        `;
        item.addEventListener('click', () => selectLanguage(lang.code));
        container.appendChild(item);
    });
}

/**
 * Контракт узла (см. CONTRACT.md).
 */
let boundContainer = null;

export function init(container = document) {
    boundContainer = container;
    applyTranslations(boundContainer);
}

export function update() {
    applyTranslations(boundContainer || document);
}

export function destroy() {
    boundContainer = null;
    // renderLanguageList вешает слушатели через addEventListener на элементы,
    // которые удаляются вместе с контейнером — отдельной отписки не требуется.
}

export const Localization = {
    DEFAULT_LANG, ALL_LANGUAGES, t, getCurrentLang, applyTranslations,
    selectLanguage, renderLanguageList, init, update, destroy
};
export default Localization;
