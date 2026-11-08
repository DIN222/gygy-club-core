// core/soundScenario.js
// v1.4.0 — 2026-11-08
// Централизованная конфигурация звуковых сцен GY-GY Club.
// Автоматическая сценка бармена удалена из BAR.
// Эффект виски вызывается отдельно, по действию посетителя в De-Stress Studio.

export const TRACKS = {
    bar: 'bar_ambient.mp3'
};

export const SFX = {
    door: 'door_open.mp3'
};

// Эффекты, запускаемые отдельными действиями посетителя.
export const EFFECTS = {
    whisky: {
        file: 'charlie_bar_fx.mp3',
        volume: 1,
        duck: 0.3,
        fadeSec: 0.6,
        restoreSec: 1.5
    }
};

export const SOUND_SCENARIO = {
    'index.html':              { ambient: 'manual' },
    'entrance.html':           { ambient: 'manual' },
    'identity.html':            { ambient: 'continue', volume: 0.5 },
    'hall.html':                { ambient: 'continue', volume: 0.5 },
    'bar.html':                 { ambient: 'continue', volume: 0.55 },
    'tables.html':              { ambient: 'continue', volume: 0.4 },
    'destress-studio.html':     { ambient: 'continue', volume: 0.3 },
    'book.html':                { ambient: 'continue', volume: 0.3 },
    'atelier.html':             { ambient: 'off' },
    'store.html':               { ambient: 'off' },
    'souvenirs.html':            { ambient: 'off' },
    'hall-of-fame.html':        { ambient: 'off' },
    'verses.html':              {
        ambient: 'off',
        ambientFadeSec: 3,
        track: {
            file: 'sbridge_ambient.mp3',
            volume: 0.4,
            fadeInSec: 2,
            fadeOutSec: 4
        }
    },
    'space-construction.html':  {
        ambient: 'off',
        ambientFadeSec: 3
    },
    'lunar-base.html':          {
        ambient: 'off',
        ambientFadeSec: 3
    }
};

export const DEFAULT_SCENE = {
    ambient: 'off'
};
