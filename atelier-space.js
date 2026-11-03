// atelier-space.js
// v1.0.0 — 2026-11-02
// Ателье «Конь в скафандре» (на Луне): космический режим страницы atelier.html?theme=space.
// Работает только при theme=space: название, звёздный фон, только DTF, подсказки для ИИ на космическую
// тему, кнопка «нашивка моей миссии», окно заявок от инопланетян (робот принимает автоматически).
// Вход только после доставки модуля «Ателье» на Луну (сотрудникам можно всегда).

import { t, getCurrentLang, onLanguageChange, registerDictionary } from './core/localization.js';
import { supabase } from './core/supabase-init.js';
import { mountStarfield } from './modules/starfield.js';
import { renderEmblem } from './modules/spaceArt.js';

const SPACE = new URLSearchParams(location.search).get('theme') === 'space';

registerDictionary({
    en: {
        at_space_describe: 'DESCRIBE YOUR SPACE PRINT',
        at_space_idea_ph: 'Describe your space idea...',
        at_space_patch: 'MY MISSION PATCH',
        at_space_wait: 'The Atelier module has not arrived on the Moon yet.',
        at_space_goto: 'To the Space Construction Center →',
        alien_title: 'ALIEN REQUEST DESK',
        alien_intro: 'The robot tailor accepts requests from extraterrestrials automatically, around the clock. No questions asked.',
        alien_species_ph: 'Species / planet',
        alien_request_ph: 'Your request (up to 140 characters)',
        alien_contact_ph: 'Signal frequency (optional)',
        alien_send: 'SEND REQUEST',
        alien_nodata: 'Please do not enter real names, phones or e-mails.',
        alien_wait: 'Please wait a moment before the next request.',
        alien_fail: 'The robot is recharging. Please try again later.',
        alien_ok: 'Request accepted automatically. Ticket {ticket}. Estimated delivery: {days} Earth days (tolerance: ±{ly} light-years).',
        alien_r1: 'Greetings, Earthling or not.',
        alien_r2: 'Your request has been logged by a very polite robot.',
        alien_r3: 'We tailor for all body shapes, tentacles included.',
        alien_r4: 'Beep. Boop. Accepted.',
        alien_r5: 'Resistance is futile, but the fit is excellent.'
    },
    fr: {
        at_space_describe: 'DÉCRIS TON MOTIF SPATIAL',
        at_space_idea_ph: 'Décris ton idée spatiale…',
        at_space_patch: 'MON ÉCUSSON DE MISSION',
        at_space_wait: 'Le module Atelier n’est pas encore arrivé sur la Lune.',
        at_space_goto: 'Vers le Centre de construction spatiale →',
        alien_title: 'GUICHET DES DEMANDES EXTRATERRESTRES',
        alien_intro: 'Le robot tailleur accepte automatiquement les demandes des extraterrestres, jour et nuit. Sans poser de questions.',
        alien_species_ph: 'Espèce / planète',
        alien_request_ph: 'Ta demande (140 caractères max.)',
        alien_contact_ph: 'Fréquence du signal (facultatif)',
        alien_send: 'ENVOYER LA DEMANDE',
        alien_nodata: 'Merci de ne saisir ni vrais noms, ni téléphones, ni e-mails.',
        alien_wait: 'Patiente un instant avant la demande suivante.',
        alien_fail: 'Le robot se recharge. Réessaie plus tard.',
        alien_ok: 'Demande acceptée automatiquement. Ticket {ticket}. Livraison estimée : {days} jours terrestres (tolérance : ±{ly} années-lumière).',
        alien_r1: 'Salutations, Terrien ou non.',
        alien_r2: 'Ta demande a été enregistrée par un robot très poli.',
        alien_r3: 'Nous habillons toutes les silhouettes, tentacules comprises.',
        alien_r4: 'Bip. Bop. Accepté.',
        alien_r5: 'La résistance est inutile, mais la coupe est excellente.'
    }
});

if (SPACE) boot().catch(e => console.warn('[atelier-space] Не удалось включить космический режим', e));

async function allowed() {
    try {
        const { data, error } = await supabase.from('moon_modules').select('delivered, needed').eq('code', 'ate').maybeSingle();
        if (error || !data) return true;                     // нет таблицы или записи — не закрываем
        if (data.delivered >= data.needed) return true;
        const { data: s } = await supabase.auth.getSession();
        return !!(s && s.session);                           // сотрудникам можно всегда
    } catch (e) { return true; }
}

function showClosed() {
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#000;color:#FFD700;font-family:"Share Tech Mono",monospace;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center;padding:20px;';
    const logo = document.createElement('div');
    logo.textContent = 'GY-GY';
    logo.style.cssText = 'font-size:28px;letter-spacing:6px;font-weight:bold;';
    const msg = document.createElement('div');
    msg.textContent = t('at_space_wait', 'The Atelier module has not arrived on the Moon yet.');
    msg.style.cssText = 'font-size:16px;';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = t('at_space_goto', 'To the Space Construction Center →');
    btn.style.cssText = 'background:#000;color:#FFD700;border:1px solid #FFD700;padding:10px 18px;font-family:inherit;font-size:12px;text-transform:uppercase;cursor:pointer;';
    btn.addEventListener('click', () => { window.location.href = 'space-construction.html'; });
    ov.append(logo, msg, btn);
    document.body.appendChild(ov);
}

async function boot() {
    const $ = (id) => document.getElementById(id);

    if (!(await allowed())) { showClosed(); return; }

    // ---------- вид: название, звёздный фон ----------
    document.title = 'GY-GY Club — Atelier “Horse in a Spacesuit”';
    const title = document.querySelector('.atelier-title-badge .title-text');
    if (title) title.textContent = '"HORSE IN A SPACESUIT"';
    const oldBg = $('atelier-bg');
    if (oldBg) oldBg.style.display = 'none';
    const st = document.createElement('style');
    st.textContent = '#sp-bg-atelier canvas{position:absolute;inset:0;width:100%;height:100%;display:block;}' +
        '.alien-input{width:100%;padding:8px;border:1px solid var(--gold-dim);background:var(--ivory);color:#1a1408;font-family:inherit;font-size:11px;}' +
        '.alien-reply{font-size:11px;color:#6fd48a;line-height:1.5;overflow-wrap:anywhere;min-height:14px;}' +
        '.alien-note{font-size:9px;opacity:.7;line-height:1.4;}';
    document.head.appendChild(st);
    const host = document.createElement('div');
    host.id = 'sp-bg-atelier';
    host.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;background:#05060f;overflow:hidden;';
    document.body.insertBefore(host, document.body.firstChild);
    mountStarfield(host);

    // ---------- только DTF ----------
    const opt = document.querySelector('#select-technique option[value="embroidery"]');
    if (opt) opt.remove();
    const techRow = $('select-technique') ? $('select-technique').closest('.field-row') : null;
    if (techRow) techRow.style.display = 'none';

    // ---------- подсказки для ИИ на космическую тему ----------
    const openBtn = $('btn-open-prompt');
    const idea = $('pb-idea');
    if (openBtn) openBtn.removeAttribute('data-translate');
    if (idea) idea.removeAttribute('data-translate-placeholder');
    const paintTexts = () => {
        if (openBtn) openBtn.textContent = t('at_space_describe', 'DESCRIBE YOUR SPACE PRINT');
        if (idea) idea.placeholder = t('at_space_idea_ph', 'Describe your space idea...');
    };
    paintTexts();

    // ---------- нашивка моей миссии ----------
    let rec = null;
    try { rec = JSON.parse(localStorage.getItem('gygy_space_mission') || 'null'); } catch (e) { /* ок */ }
    let patchBtn = null;
    if (rec && rec.mission && openBtn) {
        patchBtn = document.createElement('button');
        patchBtn.type = 'button';
        patchBtn.className = 'btn-cfg';
        patchBtn.dataset.k = 'at_space_patch';
        patchBtn.dataset.fb = 'MY MISSION PATCH';
        patchBtn.textContent = t('at_space_patch', 'MY MISSION PATCH');
        (openBtn.closest('.at-pair') || openBtn).insertAdjacentElement('afterend', patchBtn);
        patchBtn.addEventListener('click', async () => {
            patchBtn.disabled = true;
            try {
                const c = await renderEmblem({
                    scene: 'rocket',
                    cfg: { capsule: rec.capsule, hull: rec.hull, engines: rec.engines },
                    top: rec.mission, bottom: (rec.crew || 'Guest') + ' · GY-GY SPACE PROGRAM', note: rec.motto || '', size: 1000
                });
                sessionStorage.setItem('gygy_inbox_print', JSON.stringify({ dataUrl: c.toDataURL('image/png'), from: 'moon', at: Date.now() }));
                window.location.href = 'atelier.html?theme=space&inbox=1&from=moon';
            } catch (e) {
                console.warn('[atelier-space] Нашивка не получилась', e);
                patchBtn.disabled = false;
            }
        });
    }

    // ---------- окно заявок от инопланетян ----------
    const desk = document.createElement('details');
    desk.className = 'at-step at-more';
    desk.dataset.step = 'alien';
    desk.innerHTML =
        '<summary data-k="alien_title" data-fb="ALIEN REQUEST DESK"></summary>' +
        '<div class="at-step-body">' +
        '<div class="alien-note" data-k="alien_intro" data-fb="The robot tailor accepts requests from extraterrestrials automatically, around the clock. No questions asked."></div>' +
        '<input class="alien-input" id="al-species" type="text" maxlength="40" data-kp="alien_species_ph" data-fbp="Species / planet">' +
        '<input class="alien-input" id="al-request" type="text" maxlength="140" data-kp="alien_request_ph" data-fbp="Your request (up to 140 characters)">' +
        '<input class="alien-input" id="al-contact" type="text" maxlength="60" data-kp="alien_contact_ph" data-fbp="Signal frequency (optional)">' +
        '<div class="alien-note" data-k="alien_nodata" data-fb="Please do not enter real names, phones or e-mails."></div>' +
        '<button class="btn-cfg wide" id="al-send" type="button" data-k="alien_send" data-fb="SEND REQUEST"></button>' +
        '<div class="alien-reply" id="al-reply" role="status" translate="no"></div>' +
        '</div>';
    const steps = $('at-steps');
    if (steps) steps.appendChild(desk);
    else (document.querySelector('.page-wrap') || document.body).appendChild(desk);

    const paintDesk = () => {
        desk.querySelectorAll('[data-k]').forEach(el => { el.textContent = t(el.dataset.k, el.dataset.fb); });
        desk.querySelectorAll('[data-kp]').forEach(el => { el.placeholder = t(el.dataset.kp, el.dataset.fbp); });
    };
    paintDesk();

    $('al-send').addEventListener('click', async () => {
        const request = $('al-request').value.trim();
        const species = $('al-species').value.trim();
        const contact = $('al-contact').value.trim();
        const reply = $('al-reply');
        if (request.length < 3) { $('al-request').focus(); return; }
        const last = Number(localStorage.getItem('gygy-alien-last') || 0);
        if (Date.now() - last < 20000) { reply.textContent = t('alien_wait', 'Please wait a moment before the next request.'); return; }
        const ticket = 'ALN-' + Date.now().toString(36).toUpperCase().slice(-5) + Math.random().toString(36).toUpperCase().slice(2, 5);
        const { error } = await supabase.from('alien_requests')
            .insert({ ticket, species, request, contact, lang: getCurrentLang(), status: 'auto-accepted' });
        if (error) { reply.textContent = t('alien_fail', 'The robot is recharging. Please try again later.'); return; }
        try { localStorage.setItem('gygy-alien-last', String(Date.now())); } catch (e) { /* ок */ }
        $('al-request').value = '';
        const days = 3 + Math.floor(Math.random() * 40), ly = 1 + Math.floor(Math.random() * 9);
        const line = t('alien_r' + (1 + Math.floor(Math.random() * 5)), '');
        reply.textContent = (line + ' ' + t('alien_ok', 'Request accepted automatically. Ticket {ticket}. Estimated delivery: {days} Earth days (tolerance: ±{ly} light-years).', { ticket, days, ly })).trim();
    });

    onLanguageChange(() => {
        paintTexts();
        paintDesk();
        if (patchBtn) patchBtn.textContent = t('at_space_patch', 'MY MISSION PATCH');
    });
}
