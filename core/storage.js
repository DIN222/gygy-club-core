/**
 * core/storage.js
 * v1.0.0 — 2026-08-26
 *
 * Единый источник правды для персистентных данных проекта.
 * Прямые вызовы localStorage в других модулях и на страницах ЗАПРЕЩЕНЫ —
 * см. CONTRACT.md. Всё чтение/запись — только через этот модуль.
 *
 * Отличия от v1 (core-agent / GyStorage из старого репозитория):
 *  - поддержка объектов через JSON (не только строк);
 *  - remove() для точечного удаления вместо единственного опасного clear();
 *  - emit событий через EventBus при каждом изменении — модули могут
 *    подписаться и реагировать реактивно, а не дергать DOM вручную;
 *  - версия схемы данных резидента для будущих миграций.
 */

import { emit } from './eventBus.js';

const SCHEMA_VERSION = 1;
const NAMESPACE = 'gygy'; // префикс ключей, чтобы не пересекаться с чужими данными в том же домене

function fullKey(key) {
    return `${NAMESPACE}:${key}`;
}

/**
 * Прочитать значение. Автоматически пытается распарсить JSON;
 * если это была просто строка — вернёт строку как есть.
 * @param {string} key
 * @param {*} [fallback] - значение по умолчанию, если ключа нет или localStorage недоступен
 */
export function get(key, fallback = null) {
    try {
        const raw = localStorage.getItem(fullKey(key));
        if (raw === null) return fallback;
        try {
            return JSON.parse(raw);
        } catch {
            // значение было сохранено как обычная строка, не JSON
            return raw;
        }
    } catch (err) {
        console.warn(`[Storage] get('${key}') недоступен:`, err);
        return fallback;
    }
}

/**
 * Записать значение (строка, число, объект, массив — что угодно сериализуемое).
 * Эмитит 'storage:changed' с {key, value} — подписчики могут обновить UI.
 * @param {string} key
 * @param {*} value
 */
export function set(key, value) {
    try {
        localStorage.setItem(fullKey(key), JSON.stringify(value));
        emit('storage:changed', { key, value });
        return true;
    } catch (err) {
        console.warn(`[Storage] set('${key}') не удался:`, err);
        return false;
    }
}

/**
 * Удалить одно конкретное значение.
 * Предпочтительно вместо clear() везде, где не нужен полный сброс.
 * @param {string} key
 */
export function remove(key) {
    try {
        localStorage.removeItem(fullKey(key));
        emit('storage:changed', { key, value: null });
        return true;
    } catch (err) {
        console.warn(`[Storage] remove('${key}') не удался:`, err);
        return false;
    }
}

/**
 * Полностью стереть ВСЕ данные проекта (только ключи с префиксом NAMESPACE,
 * чужие данные в этом же домене не трогает).
 * Использовать осознанно — например, только в 06-debug при полном ресете резидента.
 */
export function clear() {
    try {
        const toRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(`${NAMESPACE}:`)) toRemove.push(k);
        }
        toRemove.forEach(k => localStorage.removeItem(k));
        emit('storage:cleared');
        return true;
    } catch (err) {
        console.warn('[Storage] clear() не удался:', err);
        return false;
    }
}

/**
 * Версия схемы данных резидента — для будущих миграций.
 * Пример использования при инициализации паспорта:
 *   if (Storage.get('schemaVersion') !== Storage.SCHEMA_VERSION) { ...миграция... }
 */
export const SCHEMA_VERSION_KEY = 'schemaVersion';

export const Storage = { get, set, remove, clear, SCHEMA_VERSION, SCHEMA_VERSION_KEY };
export default Storage;
