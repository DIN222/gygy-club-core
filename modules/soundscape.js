// modules/soundscape.js
// v2.1.0 — 2026-10-28
// Звуковой блок клуба: клубный фон + собственные треки страниц, плавные переходы.
//  • «В оболочке» (страница открыта внутри index.html): звук играет в оболочке и не прерывается;
//    сценарий применяет оболочка (applyForPage).
//  • «Сама по себе» (ссылка из Telegram и т.п.): то же в пределах одной страницы.
// Таблица сценария — core/soundScenario.js.

import { SOUND_SCENARIO, DEFAULT_SCENE, TRACKS, SFX } from '../core/soundScenario.js';

const STATE_KEY = 'gygy_ambient';
const JUMP_KEY = 'gygy_ambient_jump';
const MUTE_KEY = 'gygy_mute';

let audio = null;            // клубный фон
let wantOn = false;          // фон включён для прогулки
let ambientHere = false;     // на текущей странице фон должен звучать
let hooked = false;
let saveTimer = null;
let targetVolume = 0.5;
let track = { audio: null, cfg: null };   // собственный трек страницы
let currentPage = '';

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
    if (audio.paused && !force) return;
    writeState(wantOn, audio.currentTime);
}

// Плавное изменение громкости (done вызывается по окончании)
function fadeAudio(a, to, sec, done) {
    if (!a) return;
    clearInterval(a._ft);
    const from = a.volume;
    if (!sec || sec <= 0) { a.volume = Math.max(0, Math.min(1, to)); if (done) done(); return; }
    const steps = Math.max(1, Math.round(sec * 20));
    let i = 0;
    a._ft = setInterval(() => {
        i++;
        a.volume = Math.max(0, Math.min(1, from + (to - from) * (i / steps)));
        if (i >= steps) { clearInterval(a._ft); if (done) done(); }
    }, 50);
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

function startSaveTimer() {
    clearInterval(saveTimer);
    saveTimer = setInterval(() => persist(), 1000);
}

// Запустить то, что должно звучать, но браузер ещё не разрешил (вызывает оболочка по касанию)
export function kick() {
    if (isMuted()) return;
    if (audio && wantOn && ambientHere && audio.paused) {
        audio.volume = 0;
        fadeAudio(audio, targetVolume, 1.2);
        audio.play().catch(() => {});
    }
    if (track.audio && track.audio.paused) {
        track.audio.volume = 0;
        fadeAudio(track.audio, track.cfg.volume ?? 0.4, 1.2);
        track.audio.play().catch(() => {});
    }
}

function tryPlay() {
    if (isMuted() || !ambientHere) return;
    audio.volume = 0;
    fadeAudio(audio, targetVolume, 1.2);
    const p = audio.play();
    if (p && p.catch) {
        p.catch(() => {
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
        if (m) {
            if (audio) audio.pause();
            if (track.audio) track.audio.pause();
        } else {
            kick();
        }
        paint();
    });
    document.body.appendChild(b);
}

// ---------- клубный фон ----------
function begin(volume, jumpTo) {
    wantOn = true;
    ambientHere = true;
    targetVolume = volume ?? 0.5;
    const fresh = !audio;
    ensureAudio();

    // уже играет (оболочка): плавно подводим громкость
    if (!fresh && !audio.paused) {
        fadeAudio(audio, isMuted() ? 0 : targetVolume, 1.5);
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

function ambientFadeOut(sec) {
    ambientHere = false;
    if (!audio || audio.paused) return;
    fadeAudio(audio, 0, sec, () => { audio.pause(); persist(true); });
}

function realStart({ volume = 0.5 } = {}) {
    try { sessionStorage.removeItem(JUMP_KEY); } catch (e) { /* ок */ }
    if (audio && !audio.paused) { targetVolume = volume; ambientHere = true; showMuteButton(); return; }
    begin(volume, null);
    persist(true);
}

function realStop() {
    wantOn = false;
    ambientHere = false;
    if (audio) audio.pause();
    clearInterval(saveTimer);
    persist(true);
}

// Вернулись к дверям: звук выключается полностью, прогулка начнётся заново
function realReset() {
    wantOn = false;
    ambientHere = false;
    clearInterval(saveTimer);
    if (audio) {
        clearInterval(audio._ft);
        audio.pause();
        try { audio.currentTime = 0; } catch (e) { /* ок */ }
    }
    dropTrack(0.5);
    try { sessionStorage.removeItem(STATE_KEY); sessionStorage.removeItem(JUMP_KEY); } catch (e) { /* ок */ }
    removeMuteButton();
}

// ---------- собственный трек страницы ----------
function startTrack(cfg) {
    const vol = cfg.volume ?? 0.4;
    if (track.audio && track.cfg.file === cfg.file) {      // уже идёт: поправить громкость
        track.cfg = cfg;
        if (!isMuted()) {
            if (track.audio.paused) track.audio.play().catch(() => {});
            fadeAudio(track.audio, vol, cfg.fadeInSec ?? 2);
        }
        return;
    }
    dropTrack(0);
    const a = new Audio(cfg.file);
    a.loop = cfg.loop !== false;
    a.preload = 'auto';
    a.volume = 0;
    track = { audio: a, cfg };
    showMuteButton();
    if (isMuted()) return;
    fadeAudio(a, vol, cfg.fadeInSec ?? 2);
    const p = a.play();
    if (p && p.catch) p.catch(() => {});                   // по первому касанию запустит kick()
}

function dropTrack(sec) {
    const a = track.audio;
    if (!a) return;
    track = { audio: null, cfg: null };
    fadeAudio(a, 0, sec, () => { a.pause(); });
}

function realFadeTrack(sec) {
    if (!track.audio) return;
    dropTrack(sec ?? (track.cfg.fadeOutSec ?? 4));
}

function realResumeTrack() {
    const s = sceneFor(currentPage);
    if (s.track) startTrack(s.track);
}

function realSfx(name) {
    if (isMuted()) return;
    const file = SFX[name];
    if (!file) return;
    const a = new Audio(file);
    a.volume = 0.8;
    a.play().catch(() => {});
}

// ---------- сценарий ----------
// Применить сценарий для страницы с этим именем (в оболочке — при каждой загрузке вложенного окна).
// Страница с собственным треком: клубный фон плавно затихает, трек плавно нарастает;
// уходим со страницы: трек затихает за fadeOutSec.
function applyForPage(name) {
    currentPage = name;
    const s = sceneFor(name);
    const st = readState();
    const active = wantOn || !!(st && st.on);

    if (s.track) startTrack(s.track);
    else if (track.audio) dropTrack(track.cfg.fadeOutSec ?? 3);

    if (s.ambient === 'continue') {
        if (active) begin(s.volume, s.jumpTo ?? null);
    } else if (s.ambient === 'off') {
        const sec = s.ambientFadeSec ?? (s.track ? 3 : 1.5);
        if (audio && !audio.paused) ambientFadeOut(sec);
        else {
            ambientHere = false;
            if (st && st.on) writeState(true, st.t);      // пауза: время вне зоны не считается
        }
    } else if (s.ambient === 'manual') {
        if (active) realReset();                           // пришли к дверям
    }
}

// ---------- то, что вызывают страницы ----------
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
// Плавно затушить собственный трек страницы (например, при выходе из коридора в комнату)
export function fadeOutTrack(seconds) {
    const h = hostApi();
    if (h) { h.fadeTrack(seconds); return; }
    realFadeTrack(seconds);
}
// Вернуть собственный трек страницы (вернулись в коридор)
export function resumeTrack() {
    const h = hostApi();
    if (h) { h.resumeTrack(); return; }
    realResumeTrack();
}

// Страница сама по себе: сценарий применяет она; в оболочке это делает оболочка
export function apply() {
    if (hostApi()) return;
    applyForPage(pageNameOf(location.pathname));
}

// Оболочка (index.html) регистрирует себя как носитель звука
export function registerHost() {
    window.GY_SOUND = {
        start: realStart, stop: realStop, reset: realReset, sfx: realSfx,
        applyForPage, kick, fadeTrack: realFadeTrack, resumeTrack: realResumeTrack
    };
}
