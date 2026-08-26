/**
 * core/eventBus.js
 * v1.0.0 — 2026-08-26
 *
 * Центральная шина событий проекта (Pub/Sub).
 * Модули НЕ вызывают друг друга напрямую — только через emit()/on().
 * Это единственный способ связи между модулями, описанный в CONTRACT.md.
 */

const events = {};

/**
 * Подписаться на событие.
 * @param {string} event - имя события, например 'PROFILE_SAVED'
 * @param {Function} callback - обработчик, получает данные события
 */
export function on(event, callback) {
    if (typeof callback !== 'function') {
        console.warn(`[EventBus] on('${event}') вызван без функции-колбэка`);
        return;
    }
    if (!events[event]) events[event] = [];
    events[event].push(callback);
}

/**
 * Отписаться от события.
 * Обязателен к вызову в destroy() каждого модуля — иначе колбэки
 * накапливаются между переходами по страницам/комнатам (утечка памяти).
 * @param {string} event
 * @param {Function} callback - та же ссылка на функцию, что передавалась в on()
 */
export function off(event, callback) {
    if (!events[event]) return;
    events[event] = events[event].filter(cb => cb !== callback);
}

/**
 * Опубликовать событие для всех подписчиков.
 * Ошибка в одном колбэке не должна прерывать остальные — поэтому try/catch
 * вокруг каждого вызова, а не вокруг всего forEach.
 * @param {string} event
 * @param {*} [data]
 */
export function emit(event, data) {
    if (!events[event]) return;
    events[event].forEach(callback => {
        try {
            callback(data);
        } catch (err) {
            console.error(`[EventBus] Ошибка в подписчике на '${event}':`, err);
        }
    });
}

/**
 * Служебный метод — количество подписчиков на событие.
 * Полезен для отладки утечек (растёт ли число подписчиков со временем).
 * @param {string} event
 * @returns {number}
 */
export function listenerCount(event) {
    return events[event] ? events[event].length : 0;
}

export const EventBus = { on, off, emit, listenerCount };
export default EventBus;
