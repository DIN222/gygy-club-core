// modules/reviewBox.js
// v2.0.0 — 2026-10-14
// mountReviewBox(контейнер, { location, getContext })
// Форма отзыва + последние публичные отзывы этого места.
// Скрытые сотрудником (hidden=true) посетителям не показываются.

import { supabase } from '../core/supabase-init.js';
import { t, getCurrentLang, onLanguageChange } from '../core/localization.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function injectStyles() {
    if (document.getElementById('rv-styles')) return;
    const s = document.createElement('style');
    s.id = 'rv-styles';
    s.textContent = `
        .rv { border: 1px solid #8a6f24; background: rgba(0,0,0,0.6); font-family: 'Share Tech Mono', monospace; }
        .rv > summary { cursor: pointer; padding: 9px 10px; font-size: 11px; font-weight: 700; color: #FFD700; text-transform: uppercase; letter-spacing: 1px; list-style: none; }
        .rv > summary::-webkit-details-marker { display: none; }
        .rv[open] > summary { border-bottom: 1px solid #8a6f24; }
        .rv-body { padding: 10px; display: flex; flex-direction: column; gap: 6px; }
        .rv-body select, .rv-body textarea, .rv-body input { width: 100%; padding: 6px; font-size: 11px; font-family: inherit; border: 1px solid #FFD700; background: #F0EAD6; color: #1a1408; }
        .rv-body textarea { resize: vertical; }
        .rv-send { background: #FFD700; color: #000; border: 1px solid #FFD700; padding: 8px; font-weight: 900; text-transform: uppercase; cursor: pointer; font-family: inherit; font-size: 11px; }
        .rv-send:disabled { opacity: 0.5; cursor: not-allowed; }
        .rv-status { font-size: 10px; min-height: 13px; color: #F0EAD6; }
        .rv-status.rv-ok { color: #6fd48a; }
        .rv-status.rv-err { color: #e74c3c; }
        .rv-list { margin-top: 6px; border-top: 1px dashed #8a6f24; padding-top: 8px; max-height: 260px; overflow-y: auto; }
        .rv-item { padding: 6px 0; border-bottom: 1px solid #1a1a1a; font-size: 11px; color: #F0EAD6; line-height: 1.45; }
        .rv-item .rv-meta { font-size: 9px; color: #9a9a8a; margin-bottom: 2px; }
        .rv-item .rv-stars { color: #FFD700; }
        .rv-item .rv-text { white-space: pre-wrap; word-break: break-word; }
        .rv-empty { font-size: 10px; color: #777; }
    `;
    document.head.appendChild(s);
}

export function mountReviewBox(container, { location = 'other', getContext = null } = {}) {
    if (!container) return;
    injectStyles();
    container.innerHTML = `
        <details class="rv">
            <summary data-rv="title">Reviews</summary>
            <div class="rv-body">
                <select class="rv-rating">
                    <option value="" data-rv="rating">Rating (optional)</option>
                    <option value="5">★★★★★ 5</option>
                    <option value="4">★★★★ 4</option>
                    <option value="3">★★★ 3</option>
                    <option value="2">★★ 2</option>
                    <option value="1">★ 1</option>
                </select>
                <textarea class="rv-text" rows="3" maxlength="1000" placeholder="Your review" data-rv-ph="text"></textarea>
                <input class="rv-name" type="text" maxlength="60" placeholder="Name (optional)" data-rv-ph="name">
                <button class="rv-send" type="button" data-rv="send">Send</button>
                <div class="rv-status"></div>
                <div class="rv-list"></div>
            </div>
        </details>`;

    const q = (sel) => container.querySelector(sel);

    const LABELS = { title: ['rv_title', 'Reviews'], rating: ['rv_rating', 'Rating (optional)'], send: ['rv_send', 'Send'] };
    const PLACEHOLDERS = { text: ['rv_text_ph', 'Your review'], name: ['rv_name_ph', 'Name (optional)'] };
    function applyLabels() {
        container.querySelectorAll('[data-rv]').forEach(el => {
            const l = LABELS[el.dataset.rv];
            if (l) el.textContent = t(l[0], l[1]);
        });
        container.querySelectorAll('[data-rv-ph]').forEach(el => {
            const p = PLACEHOLDERS[el.dataset.rvPh];
            if (p) el.placeholder = t(p[0], p[1]);
        });
    }
    applyLabels();

    let loaded = false;

    async function loadList() {
        const box = q('.rv-list');
        const { data, error } = await supabase.from('reviews')
            .select('rating, body, author_name, created_at')
            .eq('location', location)
            .order('created_at', { ascending: false })
            .limit(10);
        if (error) { box.innerHTML = ''; return; }
        if (!data || !data.length) {
            box.innerHTML = `<div class="rv-empty">${esc(t('rv_empty', 'No reviews yet — be the first.'))}</div>`;
            return;
        }
        box.innerHTML = data.map(r => `
            <div class="rv-item">
                <div class="rv-meta">
                    ${r.rating ? `<span class="rv-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span> ` : ''}
                    ${esc(r.author_name || t('rv_guest', 'Guest'))} · ${esc(new Date(r.created_at).toLocaleDateString(getCurrentLang()))}
                </div>
                <div class="rv-text">${esc(r.body)}</div>
            </div>`).join('');
    }

    q('details.rv').addEventListener('toggle', (e) => {
        if (e.target.open && !loaded) { loaded = true; loadList(); }
    });

    onLanguageChange(() => {
        applyLabels();
        if (loaded) loadList();
    });

    q('.rv-send').addEventListener('click', async () => {
        const status = q('.rv-status');
        status.className = 'rv-status';
        const body = q('.rv-text').value.trim();
        if (body.length < 3) {
            status.textContent = t('rv_short', 'Please write a few words.');
            status.classList.add('rv-err');
            return;
        }
        const btn = q('.rv-send');
        btn.disabled = true;
        let context = null;
        try { context = getContext ? getContext() : null; } catch (e) { /* контекст необязателен */ }
        const ratingValue = q('.rv-rating').value;
        const { error } = await supabase.from('reviews').insert({
            location,
            rating: ratingValue ? Number(ratingValue) : null,
            body,
            author_name: q('.rv-name').value.trim() || null,
            context
        });
        btn.disabled = false;
        if (error) {
            console.error('[ReviewBox] Не удалось отправить отзыв', error);
            status.textContent = t('rv_fail', 'Could not send your review. Please try again later.');
            status.classList.add('rv-err');
            return;
        }
        q('.rv-text').value = '';
        status.textContent = t('rv_thanks', 'Thank you for your review!');
        status.classList.add('rv-ok');
        loaded = true;
        loadList();
    });
}
