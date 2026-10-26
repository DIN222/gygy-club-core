// modules/soundscape.js
// v1.0.0 — 2026-10-25
// Звуковой блок: фон идёт сквозь страницы по сценарию (core/soundScenario.js),
// кнопка 🔊/🔇, разовые звуки playSfx(). Состояние — в sessionStorage, «без звука» — в localStorage.
//   apply()         — вызывается сам при загрузке клиентской страницы (из core/localization.js)
//   startAmbient()  — включить фон (клик по двери на первой странице)
//   stopAmbient()   — выключить фон
//   playSfx('door') — разовый звук из SFX

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

const pageName = () => (location.pathname.split('/').pop() || 'index.html');
const scene = () => SOUND_SCENARIO[pageName()] || DEFAULT_SCENE;

function isMuted() { try { return localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { return false; } }
function setMuted(v) { try { localStorage.setItem(MUTE_KEY, v ? '1' : '0'); } catch (e) { /* ок */ } }

function readState() {
    try { return JSON.parse(sessionStorage.getItem(STATE_KEY) || 'null'); } catch (e) { return null; }
}
function persist(force = false) {
    if (!audio) return;
    if (audio.paused && !force) return;   // не затираем позицию, если звук не играл
    try {
        sessionStorage.setItem(STATE_KEY, JSON.stringify({ on: wantOn, t: audio.currentTime, at: Date.now() }));
    } catch (e) { /* ок */ }
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

function tryPlay() {
    if (isMuted()) return;
    fadeIn();
    const p = audio.play();
    if (p && p.catch) {
        p.catch(() => {
            // автозапуск заблокирован — продолжим по первому касанию страницы
            let fired = false;
            const kick = () => {
                if (fired) return;
                fired = true;
                ['click', 'touchstart', 'keydown'].forEach(ev => window.removeEventListener(ev, kick));
                if (!isMuted()) { fadeIn(); audio.play().catch(() => {}); }
            };
            ['click', 'touchstart', 'keydown'].forEach(ev => window.addEventListener(ev, kick));
        });
    }
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
    ensureAudio();
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
    if (!forced) seekToSaved();
    tryPlay();
    clearInterval(saveTimer);
    saveTimer = setInterval(() => persist(), 1000);
    showMuteButton();
}

export function startAmbient({ volume = 0.5 } = {}) {
    try { sessionStorage.removeItem(JUMP_KEY); } catch (e) { /* ок */ }
    if (audio && !audio.paused) { showMuteButton(); return; }
    begin(volume, null);
    persist(true);
}

export function stopAmbient() {
    wantOn = false;
    if (audio) audio.pause();
    clearInterval(saveTimer);
    persist(true);
}
// Вернулись к дверям: звук выключается полностью, состояние прогулки сбрасывается
export function resetAmbient() {
    wantOn = false;
    if (audio) { audio.pause(); audio.currentTime = 0; }
    clearInterval(saveTimer);
    clearInterval(fadeTimer);
    try { sessionStorage.removeItem(STATE_KEY); sessionStorage.removeItem(JUMP_KEY); } catch (e) { /* ок */ }
    const btn = document.getElementById('gy-mute-btn');
    if (btn) btn.remove();
}

export function playSfx(name) {
    if (isMuted()) return;
    const file = SFX[name];
    if (!file) return;
    const a = new Audio(file);
    a.volume = 0.8;
    a.play().catch(() => {});
}

export function apply() {
    const s = scene();
    const st = readState();

    // Добавили недостающий if (например, проверка, что ambient равен 'on', либо проверьте своё исходное условие)
    if (s.ambient === 'on') {
        // ... ваш код для 'on' (если он там был)
    } else if (s.ambient === 'off' && st && st.on) {
        // «пауза»: время вне барной зоны не считается
        try { 
            sessionStorage.setItem(STATE_KEY, JSON.stringify({ on: true, t: st.t, at: Date.now() })); 
        } catch (e) { /* ок */ }
    } else if (s.ambient === 'manual' && st && st.on) {
        resetAmbient();   // пришли к дверям: звук выключен, новая прогулка начнётся с нуля
    }
}
