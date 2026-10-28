// modules/soundscape.js
// v2.0.0 — 2026-10-27
// Звуковой блок клуба.
//  • «В оболочке» (страница открыта внутри index.html): звук играет в оболочке и не прерывается
//    при переходах; сценарий применяет оболочка (applyForPage), страницы просят
//    startAmbient / resetAmbient / playSfx.
//  • «Сама по себе» (ссылка из Telegram и т.п.): фон продолжается с сохранённой позиции;
//    браузер может потребовать касания.
// Кнопка 🔊/🔇 появляется, когда фон включён. Таблица сценария — core/soundScenario.js.

import { SOUND_SCENARIO, DEFAULT_SCENE, TRACKS, SFX } from '../core/soundScenario.js';

const STATE_KEY = 'gygy_ambient';
const JUMP_KEY = 'gygy_ambient_jump';
const MUTE_KEY = 'gygy_mute';

let audio = null;
let wantOn = false;
let hooked = false;
let saveTimer = null;
let fadeTimer = null;
let targetVolume = 0.5;

function hostApi() {
    try {
        if (window.top !== window.self && window.top.GY_SOUND) return window.top.GY_SOUND;
    } catch (e) { /* чужой источник */ }
    return null;
}
const pageNameOf = (path) => (String(path || '').split('/').pop() || 'index.html').split('?')[0];
const sceneFor = (name) => SOUND_SCENARIO[name] || DEFAULT_SCENE;

function isMuted() { try { return localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { return false; } }
function setMuted(v) { try { localStorage.setItem(MUTE_KEY, v ? '1' : '0'); } catch (e) { /* ок */ } }

function readState() {
    try { return JSON.parse(sessionStorage.getItem(STATE_KEY) || 'null'); } catch (e) { return null; }
}
function writeState(on, t) {
    try { sessionStorage.setItem(STATE_KEY, JSON.stringify({ on, t, at: Date.now() })); } catch (e) { /* ок */ }
}
function persist(force = false) {
    if (!audio) return;
    if (audio.paused && !force) return;   // не затираем позицию, если звук не играл
    writeState(wantOn, audio.currentTime);
}

function ensureAudio() {
    if (!audio) {
        audio = new Audio(TRACKS.bar);
        audio.loop = true;
        audio.preload = 'auto';
    }
    if (!hooked) {
        hooked = true;
        window.addEventListener('pagehide', () => persist());
    }
}

function seekToSaved() {
    const st = readState();
    if (!st || !(st.t >= 0)) return;
    const apply = () => {
        let pos = st.t + (Date.now() - st.at) / 1000;
        const d = audio.duration;
        if (d && isFinite(d)) pos = pos % d;
        try { audio.currentTime = pos; } catch (e) { /* ок */ }
    };
    if (audio.readyState >= 1) apply();
    else audio.addEventListener('loadedmetadata', apply, { once: true });
}

function fadeIn() {
    clearInterval(fadeTimer);
    audio.volume = 0;
    let v = 0;
    fadeTimer = setInterval(() => {
        v = Math.min(targetVolume, v + targetVolume / 16);
        audio.volume = v;
        if (v >= targetVolume) clearInterval(fadeTimer);
    }, 50);
}

function startSaveTimer() {
    clearInterval(saveTimer);
    saveTimer = setInterval(() => persist(), 1000);
}

// Запустить, если ждём звук, но браузер ещё не разрешил (вызывает оболочка по касанию)
export function kick() {
    if (!audio || !wantOn || isMuted() || !audio.paused) return;
    fadeIn();
    audio.play().catch(() => {});
}

function tryPlay() {
    if (isMuted()) return;
    fadeIn();
    const p = audio.play();
    if (p && p.catch) {
        p.catch(() => {
            // автозапуск заблокирован — продолжим по первому касанию страницы
            let fired = false;
            const again = () => {
                if (fired) return;
                fired = true;
                ['click', 'touchstart', 'keydown'].forEach(ev => window.removeEventListener(ev, again));
                kick();
            };
            ['click', 'touchstart', 'keydown'].forEach(ev => window.addEventListener(ev, again));
        });
    }
}

function removeMuteButton() {
    const b = document.getElementById('gy-mute-btn');
    if (b) b.remove();
}

function showMuteButton() {
    if (document.getElementById('gy-mute-btn') || !document.body) return;
    const b = document.createElement('button');
    b.id = 'gy-mute-btn';
    b.type = 'button';
    b.setAttribute('translate', 'no');
    b.style.cssText = 'position:fixed;bottom:14px;left:14px;z-index:3000;width:34px;height:34px;border-radius:50%;' +
        'border:1px solid #FFD700;background:#000;color:#FFD700;font-size:15px;cursor:pointer;padding:0;line-height:1;';
    const paint = () => { b.textContent = isMuted() ? '🔇' : '🔊'; };
    paint();
    b.addEventListener('click', () => {
        const m = !isMuted();
        setMuted(m);
        if (m) { if (audio) audio.pause(); }
        else if (wantOn && audio) tryPlay();
        paint();
    });
    document.body.appendChild(b);
}

function begin(volume, jumpTo) {
    wantOn = true;
    targetVolume = volume ?? 0.5;
    const fresh = !audio;
    ensureAudio();

    // уже играет (оболочка): только громкость
    if (!fresh && !audio.paused) {
        clearInterval(fadeTimer);
        audio.volume = isMuted() ? 0 : targetVolume;
        showMuteButton();
        startSaveTimer();
        return;
    }

    let forced = false;
    if (jumpTo != null) {
        let done = false;
        try { done = sessionStorage.getItem(JUMP_KEY) === '1'; } catch (e) { /* ок */ }
        if (!done) {
            forced = true;
            try { sessionStorage.setItem(JUMP_KEY, '1'); } catch (e) { /* ок */ }
            const apply = () => { try { audio.currentTime = jumpTo; } catch (e) { /* ок */ } };
            if (audio.readyState >= 1) apply();
            else audio.addEventListener('loadedmetadata', apply, { once: true });
        }
    }
    if (!forced && fresh) seekToSaved();
    tryPlay();
    startSaveTimer();
    showMuteButton();
}

function realStart({ volume = 0.5 } = {}) {
    try { sessionStorage.removeItem(JUMP_KEY); } catch (e) { /* ок */ }
    if (audio && !audio.paused) { targetVolume = volume; showMuteButton(); return; }
    begin(volume, null);
    persist(true);
}

function realStop() {
    wantOn = false;
    if (audio) audio.pause();
    clearInterval(saveTimer);
    persist(true);
}

// Вернулись к дверям: звук выключается полностью, прогулка начнётся заново
function realReset() {
    wantOn = false;
    clearInterval(saveTimer);
    clearInterval(fadeTimer);
    if (audio) {
        audio.pause();
        try { audio.currentTime = 0; } catch (e) { /* ок */ }
    }
    try { sessionStorage.removeItem(STATE_KEY); sessionStorage.removeItem(JUMP_KEY); } catch (e) { /* ок */ }
    removeMuteButton();
}

function realSfx(name) {
    if (isMuted()) return;
    const file = SFX[name];
    if (!file) return;
    const a = new Audio(file);
    a.volume = 0.8;
    a.play().catch(() => {});
}

// Применить сценарий для страницы с этим именем (в оболочке — при каждой загрузке вложенного окна)
function applyForPage(name) {
    const s = sceneFor(name);
    const st = readState();
    const active = wantOn || !!(st && st.on);
    if (s.ambient === 'continue') {
        if (active) begin(s.volume, s.jumpTo ?? null);
    } else if (s.ambient === 'off') {
        if (audio && !audio.paused) { audio.pause(); persist(true); }
        else if (st && st.on) writeState(true, st.t);      // пауза: время вне зоны не считается
    } else if (s.ambient === 'manual') {
        if (active) realReset();                            // пришли к дверям
    }
}

export function startAmbient(opts) {
    const h = hostApi();
    if (h) { h.start(opts); return; }
    realStart(opts);
}
export function stopAmbient() {
    const h = hostApi();
    if (h) { h.stop(); return; }
    realStop();
}
export function resetAmbient() {
    const h = hostApi();
    if (h) { h.reset(); return; }
    realReset();
}
export function playSfx(name) {
    const h = hostApi();
    if (h) { h.sfx(name); return; }
    realSfx(name);
}

// Страница сама по себе: сценарий применяет она; в оболочке это делает оболочка
export function apply() {
    if (hostApi()) return;
    applyForPage(pageNameOf(location.pathname));
}

// Оболочка (index.html) регистрирует себя как носитель звука
export function registerHost() {
    window.GY_SOUND = { start: realStart, stop: realStop, reset: realReset, sfx: realSfx, applyForPage, kick };
}
