/**
 * modules/passport.js
 * v1.1.1 — 2026-08-26
 * Изменения: init()/destroy() теперь эмитят MODULE_INIT/MODULE_DESTROY через EventBus
 * (см. CONTRACT.md п.8 — жизненный цикл модуля должен быть виден извне).
 *
 * Цифровой паспорт резидента: бейдж в шапке + модальное окно с QR-кодом.
 * Переиспользуемый узел — рендерит себя в переданный container на ЛЮБОЙ
 * странице (index.html, hall.html и т.д.), не дублируется копипастой.
 *
 * Зависит от qrcode.min.js (глобальный конструктор window.QRCode),
 * подключается на странице отдельным <script> ДО импорта этого модуля.
 *
 * Данные паспорта — единый объект в Storage под ключом 'passport':
 *   { id, nickname, nicknameType, avatar, flagCountry, createdAt }
 * Замена старой схемы из отдельных ключей (gygy_id, gygy_nickname,
 * gy_user_img и т.д.) на один структурированный объект — см. CONTRACT.md,
 * core/storage.js теперь поддерживает объекты через JSON.
 */

import { on, off, emit } from '../core/eventBus.js';
import { get, set } from '../core/storage.js';

const CLUB_NICKNAMES = [
    'БигКоин', 'Нападающий', 'Шампань', 'Магнат', 'Счастливчик',
    'Инсайдер', 'Фантом', 'Победитель', 'Капитан', 'Маэстро',
    'Прайм', 'Штурман', 'Панчер', 'Триумф', 'Оракул'
];

let boundContainer = null;
let unsubscribers = [];

/**
 * Есть ли уже сохранённый паспорт резидента.
 * @returns {boolean}
 */
export function hasPassport() {
    return !!get('passport');
}

/**
 * Прочитать текущий паспорт (или null, если резидент ещё не регистрировался).
 */
export function getPassport() {
    return get('passport', null);
}

/**
 * Сгенерировать новый ID вида GY-XXXXXX (порядковый номер + 4 случайные цифры,
 * согласно манифесту). Порядковый номер — счётчик резидентов в Storage.
 */
function generateId() {
    const seq = get('residentSeq', 0) + 1;
    set('residentSeq', seq);
    const random4 = Math.floor(1000 + Math.random() * 9000);
    return `GY-${seq}${random4}`;
}

function randomClubNickname() {
    return CLUB_NICKNAMES[Math.floor(Math.random() * CLUB_NICKNAMES.length)];
}

/**
 * Простой детерминированный хэш строки в целое число.
 * Один и тот же ID всегда даёт одно и то же число — и, следовательно,
 * один и тот же аватар (не случайность, а "отпечаток" ID в системе клуба).
 */
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0; // приводим к 32-битному целому
    }
    return Math.abs(hash);
}

/**
 * Сгенерировать SVG-аватар клуба на основе ID резидента.
 * Золотой геометрический узор на чёрном фоне — вариаций достаточно, чтобы
 * визуально различать резидентов, но без внешних сервисов генерации изображений
 * (см. манифест, ТРИЗ п.1 — идеальность, никаких лишних тяжёлых зависимостей).
 * Возвращает data URI, готовый для использования как src изображения.
 * @param {string} id - GY-XXXXXX
 * @returns {string} data:image/svg+xml;base64,...
 */
export function generateAvatar(id) {
    const h = hashString(id);
    const shapeCount = 3 + (h % 4); // 3–6 фигур
    let shapes = '';
    for (let i = 0; i < shapeCount; i++) {
        const seed = h + i * 97;
        const cx = 20 + (seed % 60);
        const cy = 20 + ((seed >> 3) % 60);
        const r = 6 + (seed % 14);
        const opacity = (0.35 + ((seed >> 5) % 65) / 100).toFixed(2);
        const isCircle = seed % 2 === 0;
        shapes += isCircle
            ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#FFD700" opacity="${opacity}"/>`
            : `<rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" fill="#FFD700" opacity="${opacity}" transform="rotate(${seed % 360} ${cx} ${cy})"/>`;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="#000000"/>
        ${shapes}
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Создать/обновить паспорт резидента и сохранить в Storage.
 * Эмитит 'PROFILE_SAVED' — modules/hall.js и другие узлы могут подписаться
 * и, например, разблокировать двери (см. CONTRACT.md, общение через EventBus).
 * @param {object} data
 * @param {string} [data.nickname] - собственный ник резидента
 * @param {string} [data.nicknameType] - 'own' | 'club'
 * @param {string} [data.avatar] - base64 или URL изображения (фото или сгенерированный аватар)
 */
export function saveProfile(data = {}) {
    const existing = getPassport();
    const passport = {
        id: existing?.id || generateId(),
        nickname: data.nickname ?? existing?.nickname ?? '',
        nicknameType: data.nicknameType ?? existing?.nicknameType ?? 'own',
        clubNickname: existing?.clubNickname || randomClubNickname(),
        avatar: data.avatar ?? existing?.avatar ?? '',
        flagCountry: get('flagCountry', 'gb'),
        createdAt: existing?.createdAt || Date.now()
    };
    set('passport', passport);
    emit('PROFILE_SAVED', passport);
    if (boundContainer) renderBadge();
    return passport;
}

/**
 * Отрисовать бейдж пользователя (аватар + флажок) внутри шапки страницы.
 * Скрыт, если паспорта ещё нет — точь-в-точь как в старом коде
 * (global-user-badge, display:none по умолчанию).
 */
function renderBadge() {
    if (!boundContainer) return;
    let badge = boundContainer.querySelector('#gy-user-badge');
    const passport = getPassport();

    if (!badge) {
        badge = document.createElement('div');
        badge.id = 'gy-user-badge';
        badge.className = 'gy-user-badge';
        badge.innerHTML = `
            <img class="badge-img" id="gy-badge-avatar">
            <img class="badge-flag" id="gy-badge-flag">
        `;
        badge.addEventListener('click', openModal);
        boundContainer.appendChild(badge);
    }

    if (passport) {
        badge.style.display = 'block';
        boundContainer.querySelector('#gy-badge-avatar').src = passport.avatar || '';
        boundContainer.querySelector('#gy-badge-flag').src = `https://flagcdn.com/w20/${passport.flagCountry}.png`;
    } else {
        badge.style.display = 'none';
    }
}

/**
 * Открыть модальное окно паспорта с QR-кодом.
 * QRCode — глобальный конструктор из qrcode.min.js, подключаемого на странице.
 */
export function openModal() {
    const passport = getPassport();
    if (!passport) return;

    let modal = document.getElementById('gy-passport-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'gy-passport-modal';
        modal.className = 'gy-passport-overlay';
        modal.innerHTML = `
            <div class="gy-passport-card">
                <div class="gy-passport-close">&times;</div>
                <div class="gy-passport-title">GY-GY PASSPORT</div>
                <div class="gy-passport-id"></div>
                <div class="gy-passport-nick"></div>
                <div class="gy-passport-avatar-box"><img class="gy-passport-avatar"></div>
                <div class="gy-passport-qr-box"></div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
        modal.querySelector('.gy-passport-close').addEventListener('click', closeModal);
    }

    modal.querySelector('.gy-passport-id').textContent = passport.id;
    modal.querySelector('.gy-passport-nick').textContent =
        passport.nicknameType === 'club' ? passport.clubNickname : passport.nickname;
    modal.querySelector('.gy-passport-avatar').src = passport.avatar || '';

    const qrBox = modal.querySelector('.gy-passport-qr-box');
    qrBox.innerHTML = '';
    if (typeof window.QRCode !== 'undefined') {
        new window.QRCode(qrBox, { text: passport.id, width: 100, height: 100 });
    }

    modal.style.display = 'flex';
    requestAnimationFrame(() => { modal.style.opacity = '1'; });
}

export function closeModal() {
    const modal = document.getElementById('gy-passport-modal');
    if (!modal) return;
    modal.style.opacity = '0';
    setTimeout(() => { modal.style.display = 'none'; }, 300);
}

const MODULE_NAME = 'passport';

/**
 * Контракт узла (см. CONTRACT.md).
 * @param {HTMLElement} container - куда рендерить бейдж (обычно header-bar страницы)
 */
export function init(container) {
    boundContainer = container;
    renderBadge();

    const handleSave = () => renderBadge();
    on('PROFILE_SAVED', handleSave);
    unsubscribers.push({ event: 'PROFILE_SAVED', handler: handleSave });

    emit('MODULE_INIT', { module: MODULE_NAME, at: Date.now() });
}

export function update() {
    renderBadge();
}

export function destroy() {
    unsubscribers.forEach(({ event, handler }) => off(event, handler));
    unsubscribers = [];
    boundContainer = null;

    emit('MODULE_DESTROY', { module: MODULE_NAME, at: Date.now() });
}

export const Passport = {
    hasPassport, getPassport, saveProfile, openModal, closeModal, init, update, destroy
};
export default Passport;
