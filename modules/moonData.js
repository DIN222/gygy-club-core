// modules/moonData.js
// v1.0.0 — 2026-11-01
// Модули Лунной базы: список (moon_modules), доставка груза (deliver_modules), последние доставки.
// Нет таблицы или база недоступна — работает встроенный список (стройка тогда не растёт).

import { supabase } from '../core/supabase-init.js';
import { getCurrentLang } from '../core/localization.js';

const mk = (code, title, fr, ru, icon, needed, sort, link = null) =>
    ({ code, title, titles: { fr, ru }, icon, needed, delivered: 0, sort, link, visible: true });

export const FALLBACK_MODULES = [
    mk('hab', 'Habitat', 'Module d’habitation', 'Жилой модуль', '🏠', 5, 1),
    mk('pow', 'Power plant', 'Centrale électrique', 'Энергостанция', '⚡', 4, 2),
    mk('o2', 'Water and oxygen', 'Eau et oxygène', 'Вода и кислород', '💧', 4, 3),
    mk('gre', 'Greenhouse', 'Serre', 'Оранжерея', '🌱', 3, 4),
    mk('lab', 'Laboratory', 'Laboratoire', 'Лаборатория', '🔬', 3, 5),
    mk('com', 'Communications', 'Communications', 'Связь и антенна', '📡', 2, 6),
    mk('pad', 'Landing pad and warehouse', 'Aire d’atterrissage et entrepôt', 'Посадочная площадка и склад', '🛬', 4, 7),
    mk('bar', 'Bar “One Sixth”', 'Bar « Un sixième »', 'Бар «Одна шестая»', '🥃', 2, 8),
    mk('ate', 'Atelier “Horse in a Spacesuit”', 'Atelier « Cheval en scaphandre »', 'Ателье «Конь в скафандре»', '🐴', 2, 9, 'atelier.html')
];

export async function loadModules() {
    try {
        const { data, error } = await supabase.from('moon_modules').select('*').eq('visible', true).order('sort');
        if (error) throw error;
        if (data && data.length) return { modules: data, live: true };
    } catch (e) {
        console.warn('[moon] Таблица moon_modules недоступна — встроенный список.', e);
    }
    return { modules: FALLBACK_MODULES.map(m => ({ ...m })), live: false };
}

export function moduleTitle(m) {
    const l = getCurrentLang();
    return (m.titles && m.titles[l]) || m.title;
}

// Возвращает коды модулей, которые база приняла
export async function deliver(crew, mission, codes) {
    const { data, error } = await supabase.rpc('deliver_modules', { p_crew: crew, p_mission: mission, p_codes: codes });
    if (error) throw error;
    return data || [];
}

export async function loadDeliveries(limit = 8) {
    try {
        const { data, error } = await supabase.from('moon_deliveries')
            .select('crew, mission, modules, created_at').order('created_at', { ascending: false }).limit(limit);
        if (error) throw error;
        return data || [];
    } catch (e) {
        return [];
    }
}
