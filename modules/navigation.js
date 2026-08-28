/**
 * modules/navigation.js
 * v1.0.0 — 2026-08-26
 *
 * Управляет переходами между блоками/страницами: fade-эффект (1.2 сек),
 * синхронный звук, история сессии. Следует CONTRACT.md:
 *  - не владеет всей страницей, работает внутри переданного container;
 *  - общение с другими модулями — только через EventBus;
 *  - персистентная история сессии — через core/storage.js.
 *
 * Использование со стороны страницы:
 *   import { init, goTo } from './modules/navigation.js';
 *   init(document.body);
 *   goTo('block-welcome'); // плавно скрыть текущий блок, показать целевой
 *
 * Переход между ОТДЕЛЬНЫМИ HTML-файлами (например index.html -> hall.html)
 * обрабатывается через goToPage(), которая проигрывает fade-out, затем
 * делает window.location.href — сам fade-in на новой странице выполняет
 * её собственный init() при загрузке.
 */

import { on, off, emit } from '../core/eventBus.js';
import { get, set } from '../core/storage.js';

const FADE_DURATION_MS = 1200; // 1.2 сек — фиксировано манифестом, единое для всех переходов

let boundContainer = null;
let sounds = {}; // кэш аудио-объектов по имени, чтобы не пересоздавать на каждый клик
let unsubscribers = []; // хранит пары {event, handler} для корректного destroy()

/**
 * Зарегистрировать звук для использования в переходах.
 * Вызывается со страницы один раз при инициализации, например:
 *   registerSound('door', 'door_open.mp3');
 *   registerSound('bar', 'bar_ambient.mp3');
 * @param {string} name
 * @param {string} src
 */
export function registerSound(name, src) {
    if (!sounds[name]) {
        sounds[name] = new Audio(src);
    }
}

function playSound(name, { delayMs = 0 } = {}) {
    const audio = sounds[name];
    if (!audio) return;
    setTimeout(() => {
        audio.currentTime = 0;
        audio.play().catch(() => {
            // автоплей может быть заблокирован браузером до первого клика
            // пользователя — это ожидаемо, не считаем ошибкой
        });
    }, delayMs);
}

/**
 * Плавно скрыть один блок и показать другой внутри ТЕКУЩЕЙ страницы.
 * Оба блока должны существовать в DOM (просто скрыты через CSS class
 * .nav-hidden — стиль подключается отдельно в общем style.css).
 * @param {string} targetBlockId - id блока, который нужно показать
 * @param {object} [options]
 * @param {string} [options.sound] - имя звука (см. registerSound), проигрывается через 0.5с
 */
export function goTo(targetBlockId, options = {}) {
    if (!boundContainer) return;
    const current = boundContainer.querySelector('.nav-block:not(.nav-hidden)');
    const target = boundContainer.querySelector(`#${targetBlockId}`);
    if (!target) {
        console.warn(`[Navigation] Блок #${targetBlockId} не найден`);
        return;
    }

    emit('NAVIGATE_START', { from: current?.id, to: targetBlockId });

    if (options.sound) {
        playSound(options.sound, { delayMs: 500 }); // манифест: звук через 0.5с после начала перехода
    }

    if (current) {
        current.classList.add('nav-fade-out');
        setTimeout(() => {
            current.classList.add('nav-hidden');
            current.classList.remove('nav-fade-out');
        }, FADE_DURATION_MS);
    }

    target.classList.remove('nav-hidden');
    target.classList.add('nav-fade-in');
    setTimeout(() => {
        target.classList.remove('nav-fade-in');
    }, FADE_DURATION_MS);

    pushHistory(targetBlockId);
    emit('NAVIGATE_TO', { blockId: targetBlockId });
}

/**
 * Переход на ДРУГУЮ HTML-страницу (например index.html -> hall.html).
 * Проигрывает fade-out и звук, затем меняет window.location.
 * @param {string} url
 * @param {object} [options]
 * @param {string} [options.sound]
 */
export function goToPage(url, options = {}) {
    emit('NAVIGATE_PAGE_START', { to: url });
    if (options.sound) playSound(options.sound);

    if (boundContainer) {
        boundContainer.classList.add('nav-fade-out');
    }
    setTimeout(() => {
        window.location.href = url;
    }, FADE_DURATION_MS);
}

/**
 * История сессии — последние посещённые блоки/страницы.
 * Хранится через core/storage.js, не напрямую в localStorage (см. CONTRACT.md п.3).
 */
function pushHistory(blockId) {
    const history = get('navHistory', []);
    history.push({ blockId, at: Date.now() });
    set('navHistory', history.slice(-20)); // храним последние 20 переходов, не растим бесконечно
}

export function getHistory() {
    return get('navHistory', []);
}

/**
 * Контракт узла (см. CONTRACT.md).
 */
export function init(container) {
    boundContainer = container;

    const handleUnlock = () => emit('NAVIGATION_READY');
    on('HALL_DIRECTIONS_UNLOCKED', handleUnlock);
    unsubscribers.push({ event: 'HALL_DIRECTIONS_UNLOCKED', handler: handleUnlock });
}

export function update() {
    // навигация не хранит собственного визуального состояния для обновления —
    // все изменения происходят через goTo()/goToPage()
}

export function destroy() {
    unsubscribers.forEach(({ event, handler }) => off(event, handler));
    unsubscribers = [];
    boundContainer = null;
    sounds = {};
}

export const Navigation = {
    registerSound, goTo, goToPage, getHistory, init, update, destroy
};
export default Navigation;
