// modules/reviewBox.js
// v1.0.0 — 2026-10-14
// mountReviewBox(контейнер, { location, getContext })
// location: 'atelier' | 'store' | 'souvenirs' | 'bar' | 'other'
// getContext() — необязательная функция: что клиент смотрел (попадёт в отзыв).
// Оставить отзыв может любой посетитель; читают их только сотрудники (Бухгалтерия → Отзывы).

import { supabase } from '../core/supabase-init.js';

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
    `;
    document.head.appendChild(s);
}

export function mountReviewBox(container, { location = 'other', getContext = null } = {}) {
    if (!container) return;
    injectStyles();
    container.innerHTML = `
        <details class="rv">
            <summary>Leave a review</summary>
            <div class="rv-body">
                <select class="rv-rating">
                    <option value="">Rating (optional)</option>
                    <option value="5">★★★★★ 5</option>
                    <option value="4">★★★★ 4</option>
                    <option value="3">★★★ 3</option>
                    <option value="2">★★ 2</option>
                    <option value="1">★ 1</option>
                </select>
                <textarea class="rv-text" rows="3" maxlength="1000" placeholder="Your review"></textarea>
                <input class="rv-name" type="text" maxlength="60" placeholder="Name (optional)">
                <button class="rv-send" type="button">Send</button>
                <div class="rv-status"></div>
            </div>
        </details>`;

    const q = (sel) => container.querySelector(sel);
    q('.rv-send').addEventListener('click', async () => {
        const status = q('.rv-status');
        status.className = 'rv-status';
        const body = q('.rv-text').value.trim();
        if (body.length < 3) {
            status.textContent = 'Please write a few words.';
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
            status.textContent = 'Could not send your review. Please try again later.';
            status.classList.add('rv-err');
            return;
        }
        q('.rv-text').value = '';
        status.textContent = 'Thank you for your review!';
        status.classList.add('rv-ok');
    });
}
