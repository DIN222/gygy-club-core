// core/soundScenario.js
// v1.1.0 — 2026-10-28
// Сценарий звука по страницам. Меняйте только эту таблицу.
//   ambient: 'manual'   — фон включается действием посетителя (вход — клик по двери);
//            'continue' — фон продолжается (если его уже включили);
//            'off'      — на странице клубного фона нет.
//   volume         — громкость фона 0..1;
//   jumpTo         — перемотать трек на секунду при первом входе за прогулку (необязательно);
//   ambientFadeSec — за сколько секунд клубный фон плавно затихает при входе на страницу
//                    (по умолчанию 1.5; 3, если у страницы свой трек);
//   track          — собственный трек страницы: { file, volume, fadeInSec, fadeOutSec }.
//                    Нарастает при входе; при уходе со страницы затихает за fadeOutSec;
//                    внутри страницы затушить: fadeOutTrack(секунды) из modules/soundscape.js.

export const TRACKS = { bar: 'bar_ambient.mp3' };
export const SFX = { door: 'door_open.mp3' };

export const SOUND_SCENARIO = {
    'index.html':            { ambient: 'manual' },
    'entrance.html':         { ambient: 'manual' },
    'identity.html':         { ambient: 'continue', volume: 0.5 },
    'hall.html':             { ambient: 'continue', volume: 0.5 },
    'bar.html':              { ambient: 'continue', volume: 0.55 },
    'tables.html':           { ambient: 'continue', volume: 0.4 },
    'destress-studio.html':  { ambient: 'continue', volume: 0.3 },
    'book.html':             { ambient: 'continue', volume: 0.3 },
    'atelier.html':          { ambient: 'off' },
    'store.html':            { ambient: 'off' },
    'souvenirs.html':        { ambient: 'off' },
    'hall-of-fame.html':     { ambient: 'off' },
    'verses.html':           { ambient: 'off' },   
    'space-construction.html': { ambient: 'off', ambientFadeSec: 3 },
    'lunar-base.html':         { ambient: 'off', ambientFadeSec: 3 },
    'space-admin.html':        { ambient: 'off', ambientFadeSec: 3 },
                               track: { file: 'sbridge_ambient.mp3', volume: 0.4, fadeInSec: 2, fadeOutSec: 4 }, 
};

// Страница, которой нет в таблице: клубного фона нет
export const DEFAULT_SCENE = { ambient: 'off' };
