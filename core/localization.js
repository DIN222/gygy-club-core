/**
 * core/localization.js
 * v1.1.0 — 2026-08-26
 * Изменения: (1) исправлен баг подмены непереведённого текста техническим именем
 * ключа вместо исходного текста — t()/applyTranslations теперь используют текст,
 * написанный в HTML, как фолбэк; (2) английский теперь полноценный член списка
 * языков (FULL_LANGUAGES), возвращается в выпадающий список при выборе другого
 * языка; (3) renderLanguageList исключает из списка текущий выбранный язык,
 * убирает дублирование (язык одновременно в рамке и в списке).
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

// Английский — язык по умолчанию, показывается первым в рамке, но также
// полноценный член общего списка (FULL_LANGUAGES) — чтобы можно было вернуться
// к нему из выпадающего списка после выбора любого другого языка.
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

// Полный пул из 12 языков — используется для поиска языка по коду и для
// построения выпадающего списка (список = FULL_LANGUAGES минус текущий язык).
export const FULL_LANGUAGES = [EN_LANGUAGE, ...ALL_LANGUAGES];

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
        'btn_who_are_you': 'WHO ARE YOU?'
    },
    ru: {
        'btn_who_are_you': 'А ВЫ КТО?'
    }
    // остальные 9 языков добавляются сюда по мере перевода.
    // Для остального текста перевод не обязателен прямо сейчас — если ключа
    // нет в словаре, applyTranslations покажет исходный текст из HTML (см. t()).
};

function flagUrl(countryCode) {
    return `https://flagcdn.com/w20/${countryCode}.png`;
}

/**
 * Получить перевод фразы по ключу для текущего языка.
 * Если перевода нет — возвращает fallback (исходный текст, написанный в HTML),
 * а не сам ключ. Раньше при отсутствии перевода в интерфейсе показывалось
 * техническое имя ключа (напр. "welcome_quote" вместо реального слогана) —
 * это была системная ошибка, из-за которой пропадал почти весь непереведённый
 * текст на сайте.
 * @param {string} key
 * @param {string} [fallback] - исходный текст, если перевода нет
 */
export function t(key, fallback) {
    const lang = getCurrentLang();
    return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS[DEFAULT_LANG]?.[key] ?? fallback ?? key;
}

/**
 * Текущий выбранный язык (код), по умолчанию — английский.
 */
export function getCurrentLang() {
    return get('langCode', DEFAULT_LANG);
}

/**
 * Применить перевод ко всем элементам с data-translate внутри контейнера.
 * Исходный текст элемента запоминается при первом проходе (data-fallback-text)
 * и используется как фолбэк, если для текущего языка перевода ещё нет —
 * так недостающие переводы не стирают контент, а просто оставляют исходный текст.
 * Вызывается модулями в init() и повторно после смены языка.
 * @param {HTMLElement} [container=document]
 */
export function applyTranslations(container = document) {
    container.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (el.dataset.fallbackText === undefined) {
            el.dataset.fallbackText = el.textContent;
        }
        el.textContent = t(key, el.dataset.fallbackText);
    });
}

/**
 * Выбрать язык. Сохраняет в Storage, эмитит событие для всех подписчиков
 * (счётчики по флагам, паспорт и т.д.), затем сама же обновляет DOM.
 * @param {string} langCode
 */
export function selectLanguage(langCode) {
    const lang = FULL_LANGUAGES.find(l => l.code === langCode) || EN_LANGUAGE;

    set('langCode', langCode);
    set('langName', lang.name);
    set('flagCountry', lang.country);

    applyTranslations();
    emit('language:changed', { langCode, name: lang.name, country: lang.country, flagUrl: flagUrl(lang.country) });
}

/**
 * Отрисовать выпадающий список языков внутри переданного контейнера.
 * Список = все 12 языков МИНУС текущий выбранный — раньше список показывал
 * все 11 всегда, из-за чего выбранный язык дублировался (виден и в рамке,
 * и в списке одновременно).
 * Модуль не владеет всей страницей — только этим списком.
 * @param {HTMLElement} container
 */
export function renderLanguageList(container) {
    if (!container) return;
    container.innerHTML = '';
    const currentCode = getCurrentLang();
    FULL_LANGUAGES.filter(lang => lang.code !== currentCode).forEach(lang => {
        const item = document.createElement('div');
        item.className = 'club-lang-item';
        item.innerHTML = `
            <img class="item-flag" src="${flagUrl(lang.country)}" alt="${lang.code}">
            <span class="item-text">${lang.name}</span>
        `;
        item.addEventListener('click', () => {
            selectLanguage(lang.code);
            renderLanguageList(container); // перерисовать список без нового текущего языка
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
    // renderLanguageList вешает слушатели через addEventListener на элементы,
    // которые удаляются вместе с контейнером — отдельной отписки не требуется.
    emit('MODULE_DESTROY', { module: MODULE_NAME, at: Date.now() });
}

export const Localization = {
    DEFAULT_LANG, ALL_LANGUAGES, t, getCurrentLang, applyTranslations,
    selectLanguage, renderLanguageList, init, update, destroy
};
export default Localization;
