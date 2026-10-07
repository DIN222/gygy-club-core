// core/auth.js
// v1.0.0 — 2026-10-02
// Тонкая обёртка над Supabase Auth. requireAuth() — вызывать первой
// строкой в <script type="module"> любой защищённой страницы; если
// сессии нет, сразу уводит на login.html, не дожидаясь первого запроса
// к данным (чтобы не мелькал пустой экран бухгалтерии).

import { supabase } from './supabase-init.js';

export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

export async function signOut() {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
}

export async function getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
}

export async function requireAuth(redirectTo = 'login.html') {
    const session = await getSession();
    if (!session) {
        window.location.href = redirectTo;
        return null;
    }
    return session;
}
