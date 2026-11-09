/**
 * modules/destressStudioEvents.js
 * v1.0.0 — 2026-11-09
 * Изменения: первичное подключение De-Stress Studio к EventBus.
 *
 * Передаёт события локации в общую шину GY-GY Club.
 * Пользовательский текст и персональные данные не передаются.
 */

import { emit } from '../core/eventBus.js';

const MODULE_NAME = 'destressStudioEvents';
const LOCATION_ID = 'destress-studio';

const EVENT_FIELDS = {
    SITUATION_SELECTED: ['kind', 'source'],
    PHRASE_CREATED: ['mode', 'source', 'isDoubleMix'],
    MATERIAL_SUBMITTED: ['materialType', 'newsRequested', 'status', 'language'],
    EXPORT_CREATED: ['format', 'theme'],
    ATELIER_REQUESTED: ['ai'],
    SHARE_REQUESTED: ['channel']
};

let active = false;
let boundContainer = null;
let pageHideHandler = null;
let pageShowHandler = null;

function activate() {
    if (active) return;

    active = true;

    emit('MODULE_INIT', {
        module: MODULE_NAME,
        location: LOCATION_ID,
        at: Date.now()
    });

    emit('DESTRESS_STUDIO_OPENED', {
        location: LOCATION_ID,
        at: Date.now()
    });
}

function deactivate() {
    if (!active) return;

    active = false;

    emit('DESTRESS_STUDIO_LEFT', {
        location: LOCATION_ID,
        at: Date.now()
    });

    emit('MODULE_DESTROY', {
        module: MODULE_NAME,
        location: LOCATION_ID,
        at: Date.now()
    });
}

export function init(container) {
    if (active || !container) return;

    boundContainer = container;

    pageHideHandler = () => deactivate();

    pageShowHandler = event => {
        if (event.persisted) activate();
    };

    window.addEventListener('pagehide', pageHideHandler);
    window.addEventListener('pageshow', pageShowHandler);

    activate();
}

export function track(type, details = {}) {
    if (!active || !Object.prototype.hasOwnProperty.call(EVENT_FIELDS, type)) {
        return false;
    }

    const payload = {
        location: LOCATION_ID,
        at: Date.now()
    };

    for (const key of EVENT_FIELDS[type]) {
        const value = details[key];

        if (typeof value === 'string') {
            payload[key] = value.slice(0, 40);
        } else if (typeof value === 'boolean' || typeof value === 'number') {
            payload[key] = value;
        }
    }

    emit(`DESTRESS_STUDIO_${type}`, payload);

    return true;
}

export function update(data = {}) {
    // Визуальное состояние Studio остаётся внутри страницы.
    // Передача событий выполняется через track().
}

export function destroy() {
    if (pageHideHandler) {
        window.removeEventListener('pagehide', pageHideHandler);
    }

    if (pageShowHandler) {
        window.removeEventListener('pageshow', pageShowHandler);
    }

    pageHideHandler = null;
    pageShowHandler = null;

    deactivate();
    boundContainer = null;
}

export const DeStressStudioEvents = {
    init,
    update,
    destroy,
    track
};

export default DeStressStudioEvents;
