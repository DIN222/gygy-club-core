/**
 * modules/passport.js
 * v1.3.0 — 2026-08-26
 * Изменения: паспорт теперь подписан на 'language:changed' — при смене языка
 * флаг в уже сохранённом паспорте обновляется сразу, без похода в
 * identity.html. Раньше флаг паспорта был "снимком" на момент последнего
 * saveProfile() и рассинхронизировался с реальным выбранным языком.
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

export function hasPassport() {
    return !!get('passport');
}

export function getPassport() {
    return get('passport', null);
}

function generateId() {
    const seq = get('residentSeq', 0) + 1;
    set('residentSeq', seq);
    const random4 = Math.floor(1000 + Math.random() * 9000);
    return `GY-${seq}${random4}`;
}

function randomClubNickname() {
    return CLUB_NICKNAMES[Math.floor(Math.random() * CLUB_NICKNAMES.length)];
}

function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

export function generateAvatar(id) {
    const h = hashString(id);
    const shapeCount = 3 + (h % 4);
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

export function saveProfile(data = {}) {
    const existing = getPassport();
    const passport = {
        id: existing?.id || generateId(),
        nickname: data.nickname ?? existing?.nickname ?? '',
        nicknameType: data.nicknameType ?? existing?.nicknameType ?? 'own',
        clubNickname: data.clubNickname || existing?.clubNickname || randomClubNickname(),
        avatar: data.avatar ?? existing?.avatar ?? '',
        avatarSource: data.avatarSource || existing?.avatarSource || 'photo',
        flagCountry: get('flagCountry', 'gb'),
        createdAt: existing?.createdAt || Date.now()
    };
    set('passport', passport);
    emit('PROFILE_SAVED', passport);
    if (boundContainer) renderBadge();
    return passport;
}

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
                <button class="gy-passport-edit" data-translate="btn_edit_passport">EDIT</button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
        modal.querySelector('.gy-passport-close').addEventListener('click', closeModal);
        modal.querySelector('.gy-passport-edit').addEventListener('click', () => {
            window.location.href = 'identity.html';
        });
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

export function init(container) {
    boundContainer = container;
    renderBadge();

    const handleSave = () => renderBadge();
    on('PROFILE_SAVED', handleSave);
    unsubscribers.push({ event: 'PROFILE_SAVED', handler: handleSave });

    const handleLangChange = ({ country }) => {
        const passport = getPassport();
        if (passport && passport.flagCountry !== country) {
            passport.flagCountry = country;
            set('passport', passport);
            renderBadge();
        }
    };
    on('language:changed', handleLangChange);
    unsubscribers.push({ event: 'language:changed', handler: handleLangChange });

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
