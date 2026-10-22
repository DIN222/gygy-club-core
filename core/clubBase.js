// core/clubBase.js
// v2.0.0 — 2026-10-14
// Две ленты: dtf (единая лента принтов, без категорий отклика) и embroidery
// (эскизы вышивки). Любая старая категория отклика считается dtf.
// Принты с согласием автора на публичность попадают в «Это круто»;
// лайки ограничены паспортом (таблица print_likes).

import { supabase } from './supabase-init.js';

const TABLE = 'club_prints';
const BUCKET = 'club-prints';
const CATEGORIES = ['dtf', 'embroidery'];
const CAPS = { dtf: 100, embroidery: 30 };
const KEEP_LIKES = 10; // популярные принты при чистке не трогаем
const emptyCache = () => ({ dtf: [], embroidery: [] });

let realtimeChannel = null;
let cache = emptyCache();
let eventBus = null;

async function refreshCache() {
    const { data, error } = await supabase
        .from(TABLE)
                .select('*')
        .eq('published', true)
        .order('added_at', { ascending: false });
    if (error) {
        console.error('[clubBase] Ошибка чтения таблицы — проверьте RLS-политики.', error);
        return;
    }
    const next = emptyCache();
    (data || []).forEach(row => {
        const key = row.category === 'embroidery' ? 'embroidery' : 'dtf';
        next[key].push({ ...row, category: key });
    });
    cache = next;
    if (eventBus && eventBus.emit) eventBus.emit('CLUBBASE_UPDATED', cache);
}

export async function init(eventBusModule) {
    eventBus = eventBusModule || null;
    await refreshCache();
    realtimeChannel = supabase
        .channel('club_prints_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, refreshCache)
        .subscribe();
    if (eventBus && eventBus.emit) eventBus.emit('CLUBBASE_INIT', cache);
}

export function destroy() {
    if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    if (eventBus && eventBus.emit) eventBus.emit('CLUBBASE_DESTROY');
}

export function getAll() { return cache; }
export function getFlat() {
    return CATEGORIES.flatMap(cat => cache[cat])
        .sort((a, b) => new Date(b.added_at) - new Date(a.added_at));
}

async function enforceLimit(category) {
    const cap = CAPS[category] || 50;
    const { data, error } = await supabase
        .from(TABLE)
        .select('id, storage_path, likes, added_at')
        .eq('category', category)
        .order('added_at', { ascending: true });
    if (error) {
        console.warn('[clubBase] Не удалось проверить лимит ленты.', error);
        return;
    }
    if (data && data.length >= cap) {
        const victim = data.find(r => (r.likes || 0) < KEEP_LIKES) || data[0];
        await supabase.storage.from(BUCKET).remove([victim.storage_path]);
        await supabase.from(TABLE).delete().eq('id', victim.id);
    }
}

export async function addPrint(blob, category, meta = {}) {
    if (!CATEGORIES.includes(category)) throw new Error(`[clubBase] Неизвестная лента: ${category}`);
    await enforceLimit(category);

    const storagePath = `${category}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.png`;
    const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, blob, { contentType: 'image/png' });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

    const { error: insertError } = await supabase.from(TABLE).insert({
        category, image_url: publicUrl, storage_path: storagePath,
        from_user_id: meta.userId || 'unknown',
        from_user_name: meta.userName || 'Unknown',
        public_likes_allowed: !!meta.publicLikesAllowed
    });
    if (insertError) throw insertError;
}

export async function getFeatured(threshold = 10) {
    const { data, error } = await supabase
        .from(TABLE)
        .select('*')
               .eq('public_likes_allowed', true)
        .eq('published', true)
        .gte('likes', threshold)
        .order('likes', { ascending: false });
    if (error) throw error;
    return data || [];
}

export async function hasLiked(printId, passportId) {
    const { data, error } = await supabase
        .from('print_likes').select('print_id')
        .eq('print_id', printId).eq('passport_id', passportId).maybeSingle();
    if (error) throw error;
    return !!data;
}

export async function likePrint(printId, passportId) {
    const { error: insertErr } = await supabase
        .from('print_likes')
        .insert({ print_id: printId, passport_id: passportId });
    if (insertErr) {
        if (insertErr.code === '23505') throw new Error('ALREADY_LIKED');
        throw insertErr;
    }
    const { data: current, error: fetchErr } = await supabase
        .from(TABLE).select('likes').eq('id', printId).single();
    if (fetchErr) throw fetchErr;
    const newLikes = (current.likes || 0) + 1;
    const { error: updateErr } = await supabase
        .from(TABLE).update({ likes: newLikes }).eq('id', printId);
    if (updateErr) throw updateErr;
    return newLikes;
}
