// modules/spaceForum.js
// v1.1.0 — 2026-11-01
// Стена сообщений: area 'center' или 'moon'; topic — ветка (код модуля) или null (вся стена области).
// Сообщения ждут проверки (space_posts, status 'pending'); показываются только одобренные.
// onPick(post) — нажатие на сообщение (на Лунной базе превращает его в принт).

import { t, onLanguageChange } from '../core/localization.js';
import { supabase } from '../core/supabase-init.js';
import * as eventBus from '../core/eventBus.js';

const CREW_KEY = 'gygy_crew_name';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let passportName = '';
try {
    const on = eventBus.on || eventBus.subscribe || (eventBus.default && eventBus.default.on);
    if (typeof on === 'function') {
        const h = (d) => { passportName = (d && (d.name || d.nickname)) || passportName; };
        on('PASSPORT_READY', h);
        on('PASSPORT_UPDATED', h);
    }
} catch (e) { /* ок */ }

export function getCrewName() {
    let saved = '';
    try { saved = localStorage.getItem(CREW_KEY) || ''; } catch (e) { /* ок */ }
    return (saved || passportName || 'Guest').slice(0, 30);
}
export function setCrewName(v) {
    try { localStorage.setItem(CREW_KEY, String(v || '').trim().slice(0, 30)); } catch (e) { /* ок */ }
}

export function mountForum(el, { area = 'center', topic = null, title = null, onPick = null } = {}) {
    const moon = area === 'moon';
    let posts = [];

    el.innerHTML = `
        <h3 class="sp-h"></h3>
        <p class="sp-sub"></p>
        <div class="sp-posts"></div>
        <form class="sp-form">
            <input type="text" maxlength="140" aria-label="message">
            <button class="sp-btn primary" type="submit"></button>
        </form>
        <p class="sp-status" role="status"></p>`;
    const h = el.querySelector('.sp-h'), sub = el.querySelector('.sp-sub'), box = el.querySelector('.sp-posts');
    const form = el.querySelector('.sp-form'), input = form.querySelector('input'), btn = form.querySelector('button');
    const status = el.querySelector('.sp-status');

    function paint() {
        const ttl = typeof title === 'function' ? title() : title;
        h.textContent = ttl || t(moon ? 'sp_wall_title_moon' : 'sp_wall_title_center', moon ? 'Moon wall' : 'Crew wall');
        sub.textContent = topic ? '' : (moon ? t('sp_wall_sub_moon', 'Messages from the Moon. Tap one to put it on a print.')
                                             : t('sp_wall_sub_center', 'Leave a note for the next crews.'));
        sub.style.display = topic ? 'none' : '';
        input.placeholder = t('sp_wall_ph', 'Your message (up to 140 characters)');
        btn.textContent = t('sp_wall_send', 'Send');
        box.innerHTML = posts.length
            ? posts.map((p, i) => `<div class="sp-post${onPick ? ' pick' : ''}" data-i="${i}" translate="no"><b>${esc(p.nickname)}</b>${esc(p.text)}</div>`).join('')
            : `<div class="sp-empty">${esc(t('sp_wall_empty', 'No messages yet. Be the first.'))}</div>`;
    }

    async function load() {
        try {
            let q = supabase.from('space_posts').select('id, nickname, text').eq('area', area).eq('status', 'approved');
            if (topic) q = q.eq('topic', topic);
            const { data, error } = await q.order('created_at', { ascending: false }).limit(30);
            posts = error ? [] : (data || []);
        } catch (e) { posts = []; }
        paint();
    }

    box.addEventListener('click', (e) => {
        const d = e.target.closest('.sp-post');
        if (d && onPick) onPick(posts[Number(d.dataset.i)]);
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (text.length < 2) return;
        const last = Number(localStorage.getItem('gygy-space-last') || 0);
        if (Date.now() - last < 20000) { status.textContent = t('sp_wall_wait', 'Please wait a bit before the next message.'); return; }
        const { error } = await supabase.from('space_posts').insert({ area, topic: topic || null, nickname: getCrewName(), text, status: 'pending' });
        if (error) { status.textContent = t('sp_wall_fail', 'Could not send. Please try again later.'); return; }
        try { localStorage.setItem('gygy-space-last', String(Date.now())); } catch (e2) { /* ок */ }
        input.value = '';
        status.textContent = t('sp_wall_ok', 'Sent for review. It will appear on the wall once approved.');
    });

    onLanguageChange(paint);
    paint();
    load();
}
