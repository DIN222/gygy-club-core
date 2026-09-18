
// core/supabase-init.js
// v1.0.0 — 2026-09-14
// Единая точка инициализации Supabase. Любой модуль, которому нужен
// доступ к базе или Storage, импортирует client отсюда — не создаёт
// свой createClient().

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://momzokofmunrbwgtwepi.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_mxf4_dDGIPpbM-flTutxWw_O3uETW_R';
// ⚠️ Это публичный (publishable/anon) ключ — его можно открыто хранить
// в клиентском коде. Реальная защита данных обеспечивается правилами
// Row Level Security на стороне базы, а не секретностью этого ключа.
// НИКОГДА не подставлять сюда sb_secret_... — тот ключ обходит все правила.

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
