// core/soundScenario.js
// v1.3.0 — 2026-11-04
// Сценарий звука по страницам. Меняйте только эту таблицу.
//   ambient: 'manual'   — фон включается действием посетителя (вход — клик по двери);
//            'continue' — фон продолжается (если его уже включили);
//            'off'      — на странице клубного фона нет.
//   volume         — громкость фона 0..1;
//   jumpTo         — перемотать трек на секунду при первом входе за прогулку (необязательно);
//   ambientFadeSec — за сколько секунд клубный фон плавно затихает при входе на страницу
//                    (по умолчанию 1.5; 3, если у страницы свой трек);
//   track          — собственный трек страницы: { file, volume, fadeInSec, fadeOutSec }.
//   fx             — эффект поверх фона (только для 'continue'): { file, delaySec, volume, duck, fadeSec, restoreSec, once }.
//                    Через delaySec после входа фон плавно приглушается до duck (доля от громкости фона, 0.3 = 30%)
//                    за fadeSec, играет файл, по его окончании фон возвращается на прежний уровень за restoreSec.
//                    once: true — один раз за прогулку (сбрасывается, когда вернулись к дверям).

export const TRACKS = { bar: 'bar_ambient.mp3' };
export const SFX = { door: 'door_open.mp3' };

export const SOUND_SCENARIO = {
    'index.html':              { ambient: 'manual' },
    'entrance.html':           { ambient: 'manual' },
    'identity.html':           { ambient: 'continue', volume: 0.5 },
    'hall.html':               { ambient: 'continue', volume: 0.5 },
    'bar.html':                { ambient: 'continue', volume: 0.55,
                                 fx: { file: 'charlie_bar_fx.mp3', delaySec: 1.5, volume: 1, duck: 0.3, fadeSec: 0.8, restoreSec: 1.5, once: true } },
    'tables.html':             { ambient: 'continue', volume: 0.4 },
    'destress-studio.html':    { ambient: 'continue', volume: 0.3 },
    'book.html':               { ambient: 'continue', volume: 0.3 },
    'atelier.html':            { ambient: 'off' },
    'store.html':              { ambient: 'off' },
    'souvenirs.html':          { ambient: 'off' },
    'hall-of-fame.html':       { ambient: 'off' },
    'verses.html':             { ambient: 'off', ambientFadeSec: 3,
                                 track: { file: 'sbridge_ambient.mp3', volume: 0.4, fadeInSec: 2, fadeOutSec: 4 } },
    'space-construction.html': { ambient: 'off', ambientFadeSec: 3 },
    'lunar-base.html':         { ambient: 'off', ambientFadeSec: 3 }
};

// Страница, которой нет в таблице: клубного фона нет
export const DEFAULT_SCENE = { ambient: 'off' };
