// modules/barSounds.js
// v1.0.0 — 2026-10-24
// Звуки у барной стойки по порядку: кашель → открывание бутылки → виски в стакан.
// Файлы лежат в корне сайта; если у ваших файлов другие имена, поправьте SEQUENCE.
//   before — пауза перед звуком, мс;  volume — громкость 0..1.

const SEQUENCE = [
    { file: 'cough.mp3',       before: 1500, volume: 0.8 },
    { file: 'bottle_open.mp3', before: 700,  volume: 0.8 },
    { file: 'whisky_pour.mp3', before: 500,  volume: 0.8 }
];
const MAX_WAIT_MS = 8000;   // не ждём один звук дольше этого
let running = false;

const wait = (ms) => new Promise(r => setTimeout(r, ms));

function playOne(step) {
    return new Promise((resolve) => {
        const a = new Audio(step.file);
        a.volume = step.volume ?? 0.8;
        let done = false;
        const finish = (result) => { if (!done) { done = true; resolve(result); } };
        a.addEventListener('ended', () => finish('ok'));
        a.addEventListener('error', () => finish('missing'));
        setTimeout(() => finish('ok'), MAX_WAIT_MS);
        const p = a.play();
        if (p && p.catch) p.catch((e) => finish(e && e.name === 'NotAllowedError' ? 'blocked' : 'missing'));
    });
}

async function runSequence() {
    for (const step of SEQUENCE) {
        await wait(step.before);
        const res = await playOne(step);
        if (res === 'blocked') return 'blocked';
    }
    return 'done';
}

export function playBarSequence() {
    if (running) return;
    running = true;
    runSequence().then((res) => {
        running = false;
        if (res !== 'blocked') return;
        // браузер не разрешил автозвук — проиграем после первого касания страницы
        let fired = false;
        const again = () => {
            if (fired) return;
            fired = true;
            ['click', 'touchstart', 'keydown'].forEach(ev => window.removeEventListener(ev, again));
            running = true;
            runSequence().finally(() => { running = false; });
        };
        ['click', 'touchstart', 'keydown'].forEach(ev => window.addEventListener(ev, again));
    });
}
