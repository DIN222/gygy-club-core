// core/soundScenario.js
// v1.0.0 — 2026-10-25
// Сценарий звука по страницам (функциональным блокам клуба). Меняйте только эту таблицу.
//   ambient: 'manual'   — фон включается действием посетителя (на входе — клик по двери);
//            'continue' — фон продолжается с того места, где остановился (если его уже включили);
//            'off'      — на странице фона нет; время вне зоны фон «ждёт».
//   volume   — громкость фона 0..1;
//   jumpTo   — перемотать трек на эту секунду при ПЕРВОМ входе на страницу за прогулку
//              (необязательно; например, чтобы у стойки сразу звучал кашель).

export const TRACKS = { bar: 'bar_ambient.mp3' };
export const SFX = { door: 'door_open.mp3' };

export const SOUND_SCENARIO = {
    'index.html':        { ambient: 'manual' },
    'identity.html':     { ambient: 'continue', volume: 0.5 },
    'hall.html':         { ambient: 'continue', volume: 0.5 },
    'bar.html':          { ambient: 'continue', volume: 0.55 },
    'tables.html':       { ambient: 'continue', volume: 0.4 },
    'book.html':         { ambient: 'continue', volume: 0.3 },
    'atelier.html':      { ambient: 'off' },
    'store.html':        { ambient: 'off' },
    'souvenirs.html':    { ambient: 'off' },
    'hall-of-fame.html': { ambient: 'off' },
    'verses.html':       { ambient: 'off' }
};

// Страница, которой нет в таблице: фона нет.
export const DEFAULT_SCENE = { ambient: 'off' };
