// core/clubBase.js
// v1.2.0 — 2026-09-18 (PNG вместо JPEG)
// Общая база принтов клуба на Supabase (Postgres-таблица club_prints +
// Storage bucket club-prints). Данные реально общие для всех посетителей
// сайта — не по браузерам, как было в localStorage.
//
// ИЗМЕНЕНИЯ В v1.2.0: принты теперь сохраняются как .png с
// contentType 'image/png', а не .jpg/'image/jpeg' — JPEG не хранит
// прозрачность, а принты по определению нуждаются в прозрачном фоне
// (см. атрибуцию бага в atelier.html: чёрный фон вместо прозрачного
// при конвертации в JPEG). Клиентская сторона (atelier.html) уже
// отправляет PNG-blob — эта версия просто перестаёт врать о формате.
//
// ЛИМИТ 20 НА КАТЕГОРИЮ (FIFO):
// Проверяется и применяется НА КЛИЕНТЕ перед добавлением нового принта.
// ⚠️ Проверка с клиента (без серверной функции) — при двух одновременных
// отправках в одну категорию возможна кратковременная гонка (лимит на
// миг может превыситься до следующей чистки). Для клубного масштаба
// не критично; при росте нагрузки стоит перенести в Supabase Edge Function.
//
// СОБЫТИЯ (через core/eventBus.js): CLUBBASE_INIT, CLUBBASE_UPDATED,
// CLUBBASE_DESTROY — по конвенции CONTRACT.md.

import { supabase } from './supabase-init.js';

const TABLE = 'club_prints';
const BUCKET = 'club-prints';
const MAX_PER_CATEGORY = 20;
const CATEGORIES = ['rebellion', 'motivation', 'intellect', 'aesthetic', 'humor'];

let realtimeChannel = null;
let cache = { rebellion: [], motivation: [], intellect: [], aesthetic: [], humor: [] };
let eventBus = null;

async function refreshCache() {
    const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('added_at', { ascending: false });
    if (error) {
        console.error('[clubBase] Ошибка чтения таблицы — проверьте RLS-политики.', error);
        return;
    }
    const next = { rebellion: [], motivation: [], intellect: [], aesthetic: [], humor: [] };
    (data || []).forEach(row => {
        if (next[row.category]) next[row.category].push(row);
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
    return CATEGORIES.flatMap(cat => cache[cat].map(item => ({ ...item, category: cat })))
        .sort((a, b) => new Date(b.added_at) - new Date(a.added_at));
}

async function enforceLimit(category) {
    const { data, error } = await supabase
        .from(TABLE)
        .select('id, storage_path')
        .eq('category', category)
        .order('added_at', { ascending: true });
    if (error) {
        console.warn('[clubBase] Не удалось проверить лимит категории.', error);
        return;
    }
    if (data && data.length >= MAX_PER_CATEGORY) {
        const oldest = data[0];
        await supabase.storage.from(BUCKET).remove([oldest.storage_path]);
        await supabase.from(TABLE).delete().eq('id', oldest.id);
    }
}

// blob — PNG-blob (см. resizeImageToBlobAndUrl в atelier.html) — сохраняет
// прозрачность принта, в отличие от прежнего JPEG.
export async function addPrint(blob, category, meta = {}) {
    if (!CATEGORIES.includes(category)) throw new Error(`[clubBase] Неизвестная категория: ${category}`);
    await enforceLimit(category);

    const storagePath = `${category}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.png`;
    const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, blob, { contentType: 'image/png' });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

    const { error: insertError } = await supabase.from(TABLE).insert({
        category,
        image_url: publicUrl,
        storage_path: storagePath,
        from_user_id: meta.userId || 'unknown',
        from_user_name: meta.userName || 'Unknown'
    });
    if (insertError) throw insertError;
}
