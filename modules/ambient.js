
// modules/ambient.js
// v2.0.0 — совместимость: вся логика звука переехала в modules/soundscape.js,
// а что и где играет, решает таблица core/soundScenario.js.
export { startAmbient, stopAmbient } from './soundscape.js';

export function resumeAmbient() { /* сценарий сам решает, играть ли фон на этой странице */ }

const SRC = 'bar_ambient.mp3';
const KEY = 'gygy_ambient';

let audio = null;
let wantOn = false;
let saveTimer = null;
let hooked = false;

function readState() {
    try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
}
function persist() {
    try {
        sessionStorage.setItem(KEY, JSON.stringify({ on: wantOn, t: audio ? audio.currentTime : 0, at: Date.now() }));
    } catch (e) { /* не страшно */ }
}
function ensureAudio(volume) {
    if (!audio) {
        audio = new Audio(SRC);
        audio.loop = true;
        audio.preload = 'auto';
    }
    audio.volume = volume;
    if (!hooked) {
        hooked = true;
        window.addEventListener('pagehide', persist);
    }
}
function seekToSaved() {
    const st = readState();
    if (!st || !(st.t >= 0)) return;
    const apply = () => {
        let pos = st.t + (Date.now() - st.at) / 1000;
        const d = audio.duration;
        if (d && isFinite(d)) pos = pos % d;
        try { audio.currentTime = pos; } catch (e) { /* не страшно */ }
    };
    if (audio.readyState >= 1) apply();
    else audio.addEventListener('loadedmetadata', apply, { once: true });
}
function tryPlay() {
    const p = audio.play();
    if (p && p.catch) {
        p.catch(() => {
            // автозапуск заблокирован браузером — продолжим по первому касанию страницы
            let fired = false;
            const kick = () => {
                if (fired) return;
                fired = true;
                ['click', 'touchstart', 'keydown'].forEach(ev => window.removeEventListener(ev, kick));
                audio.play().catch(() => {});
            };
            ['click', 'touchstart', 'keydown'].forEach(ev => window.addEventListener(ev, kick));
        });
    }
}
function startTimer() {
    clearInterval(saveTimer);
    saveTimer = setInterval(persist, 1000);
}
export function startAmbient({ volume = 0.5 } = {}) {
    wantOn = true;
    ensureAudio(volume);
    if (audio.paused) {
        seekToSaved();
        tryPlay();
    }
    startTimer();
    persist();
}

export function resumeAmbient({ volume = 0.5 } = {}) {
    const st = readState();
    if (!st || !st.on) return;        // фон не включали: человек не проходил через вход
    wantOn = true;
    ensureAudio(volume);
    seekToSaved();
    tryPlay();
    startTimer();
}

export function stopAmbient() {
    wantOn = false;
    if (audio) audio.pause();
    clearInterval(saveTimer);
    persist();
}
