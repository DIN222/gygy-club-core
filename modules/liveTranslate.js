// modules/liveTranslate.js
// v1.0.0 — 2026-10-24
// Автоматический перевод всего, чего нет в словаре core/localization.js.
// Работает через функцию Supabase "translate" (DeepL) с общим кэшем в базе.
//  - целевой язык en: переводятся только русские фразы;
//  - целевой язык fr (и др.): все фразы, кроме бренда, чисел и строк из нашего словаря;
//  - следит за страницей (MutationObserver): тексты, собранные в JS, тоже переводятся;
//  - при смене языка страница пересчитывается из оригиналов;
//  - если функция недоступна, два сбоя подряд отключают модуль до закрытия вкладки.

import { supabase } from '../core/supabase-init.js';
import { getCurrentLang, onLanguageChange, isDictionaryText } from '../core/localization.js';

const FUNCTION_NAME = 'translate';
const BATCH = 40;
const MAX_LEN = 400;
const LOCAL_KEY = 'gygy_lt_cache_v1';
const LOCAL_LIMIT = 1500;                    // записей в кэше браузера
const LOCAL_TTL_MS = 6 * 60 * 60 * 1000;     // 6 часов: правки перевода в базе подхватятся

const SKIP_SELECTOR = [
    'script', 'style', 'noscript', 'textarea', 'input', 'code', 'pre',
    '[translate="no"]', '.notranslate',
    '[data-translate]', '[data-translate-html]',
    '.rv-list', '.gy-passport-id', '.gy-passport-nick', '#pass-id-val'
].join(',');

const BRAND = new Set(['GY-GY', 'GY-GY CLUB']);
const CYRILLIC = /[\u0400-\u04FF]/;
const HAS_LETTER = /\p{L}/u;
const ATTRS = ['placeholder', 'title', 'alt'];

const textRec = new WeakMap();   // текстовый узел → { orig, shown }
const attrRec = new WeakMap();   // элемент → { атрибут: { orig, shown } }
const mem = new Map();           // `${язык}|${текст}` → перевод

let disabled = false;
let failures = 0;
let started = false;
let saveTimer = null;
let queue = new Set();
let queueTimer = null;

// ---------- кэш в браузере ----------
function loadLocal() {
    try {
        const raw = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null');
        if (!raw || Date.now() - raw.t > LOCAL_TTL_MS) return;
        Object.keys(raw.d || {}).forEach(k => mem.set(k, raw.d[k]));
    } catch (e) { /* нет кэша — не страшно */ }
}
function saveLocal() {
    try {
        const entries = [...mem.entries()].slice(-LOCAL_LIMIT);
        localStorage.setItem(LOCAL_KEY, JSON.stringify({ t: Date.now(), d: Object.fromEntries(entries) }));
    } catch (e) { /* переполнение — пропускаем */ }
}
function cacheGet(lang, text) { return mem.get(lang + '|' + text); }
function cacheSet(lang, text, tr) {
    mem.set(lang + '|' + text, tr);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveLocal, 800);
}

// ---------- что переводить ----------
function needsTranslation(text, lang) {
    const t = text.trim();
    if (t.length < 2 || t.length > MAX_LEN) return false;
    if (!HAS_LETTER.test(t) || BRAND.has(t)) return false;
    if (lang === 'en') return CYRILLIC.test(t);
    if (isDictionaryText(t)) return false;
    return true;
}

// ---------- запрос к функции ----------
async function fetchTranslations(texts, lang) {
    const result = {};
    if (disabled) return result;
    for (let i = 0; i < texts.length; i += BATCH) {
        const chunk = texts.slice(i, i + BATCH);
        try {
            const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, { body: { texts: chunk, target: lang } });
            if (error || !data || !Array.isArray(data.translations)) throw (error || new Error('bad response'));
            chunk.forEach((src, j) => {
                const tr = data.translations[j];
                if (tr) { result[src] = tr; cacheSet(lang, src, tr); }
            });
            failures = 0;
        } catch (e) {
            failures++;
            console.warn('[liveTranslate] Перевод недоступен:', (e && e.message) ? e.message : e);
            if (failures >= 2) {
                disabled = true;
                try { sessionStorage.setItem('gygy_lt_off', '1'); } catch (_) { /* ок */ }
            }
            break;
        }
    }
    return result;
}

// ---------- текстовые узлы ----------
function originalOf(node) {
    const rec = textRec.get(node);
    if (rec && node.nodeValue === rec.shown) return rec.orig;
    return node.nodeValue;
}
function applyText(node, orig, translated) {
    const lead = orig.match(/^\s*/)[0];
    const trail = orig.match(/\s*$/)[0];
    const shown = translated == null ? orig : lead + translated + trail;
    textRec.set(node, { orig, shown });
    if (node.nodeValue !== shown) node.nodeValue = shown;
}
function collectTextNodes(root) {
    const out = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
        const p = n.parentElement;
        if (!p || p.closest(SKIP_SELECTOR)) continue;
        out.push(n);
    }
    return out;
}
async function processTextNodes(nodes) {
    const lang = getCurrentLang();
    const pending = new Map();
    nodes.forEach(node => {
        const orig = originalOf(node);
        const key = orig.trim();
        if (!needsTranslation(orig, lang)) { applyText(node, orig, null); return; }
        const hit = cacheGet(lang, key);
        if (hit) { applyText(node, orig, hit); return; }
        if (!pending.has(key)) pending.set(key, []);
        pending.get(key).push({ node, orig });
    });
    if (!pending.size) return;
    const got = await fetchTranslations([...pending.keys()], lang);
    pending.forEach((list, key) => {
        const tr = got[key];
        if (!tr) return;
        list.forEach(({ node, orig }) => {
            if (!node.isConnected || getCurrentLang() !== lang) return;
            if (originalOf(node) !== orig) return;     // страница успела изменить текст
            applyText(node, orig, tr);
        });
    });
}

// ---------- атрибуты (placeholder, title, alt) ----------
function collectAttrTargets(root) {
    const out = [];
    if (root.nodeType !== 1) return out;
    const els = [root, ...root.querySelectorAll('[placeholder],[title],[alt]')];
    els.forEach(el => {
        if (el.closest('script,style,.notranslate,[translate="no"]')) return;
        ATTRS.forEach(a => {
            if (el.hasAttribute(a) && !el.hasAttribute('data-translate-' + a)) out.push({ el, attr: a });
        });
    });
    return out;
}
function attrOriginal(el, attr) {
    const rec = (attrRec.get(el) || {})[attr];
    const cur = el.getAttribute(attr) || '';
    return (rec && cur === rec.shown) ? rec.orig : cur;
}
function applyAttr(el, attr, orig, translated) {
    const shown = translated == null ? orig : translated;
    const recs = attrRec.get(el) || {};
    recs[attr] = { orig, shown };
    attrRec.set(el, recs);
    if (el.getAttribute(attr) !== shown) el.setAttribute(attr, shown);
}
async function processAttrs(targets) {
    const lang = getCurrentLang();
    const pending = new Map();
    targets.forEach(({ el, attr }) => {
        const orig = attrOriginal(el, attr);
        const key = orig.trim();
        if (!needsTranslation(orig, lang)) { applyAttr(el, attr, orig, null); return; }
        const hit = cacheGet(lang, key);
        if (hit) { applyAttr(el, attr, orig, hit); return; }
        if (!pending.has(key)) pending.set(key, []);
        pending.get(key).push({ el, attr, orig });
    });
    if (!pending.size) return;
    const got = await fetchTranslations([...pending.keys()], lang);
    pending.forEach((list, key) => {
        const tr = got[key];
        if (!tr) return;
        list.forEach(({ el, attr, orig }) => {
            if (!el.isConnected || getCurrentLang() !== lang) return;
            if (attrOriginal(el, attr) !== orig) return;
            applyAttr(el, attr, orig, tr);
        });
    });
}

// ---------- запуск и наблюдение ----------
async function runAll() {
    if (!document.body) return;
    await processTextNodes(collectTextNodes(document.body));
    await processAttrs(collectAttrTargets(document.body));
}

async function flush() {
    const items = [...queue];
    queue.clear();
    const textNodes = [];
    const attrTargets = [];
    items.forEach(n => {
        if (!n.isConnected) return;
        if (n.nodeType === 3) {
            const p = n.parentElement;
            if (p && !p.closest(SKIP_SELECTOR)) textNodes.push(n);
        } else if (n.nodeType === 1) {
            textNodes.push(...collectTextNodes(n));
            attrTargets.push(...collectAttrTargets(n));
        }
    });
    if (textNodes.length) await processTextNodes([...new Set(textNodes)]);
    if (attrTargets.length) await processAttrs(attrTargets);
}
function enqueue(node) {
    queue.add(node);
    clearTimeout(queueTimer);
    queueTimer = setTimeout(flush, 120);
}
function onMutations(muts) {
    muts.forEach(m => {
        if (m.type === 'childList') {
            m.addedNodes.forEach(n => enqueue(n));
        } else if (m.type === 'characterData') {
            const rec = textRec.get(m.target);
            if (!rec || m.target.nodeValue !== rec.shown) enqueue(m.target);   // свои правки пропускаем
        }
    });
}

export function start() {
    if (started) return;
    started = true;
    try { disabled = sessionStorage.getItem('gygy_lt_off') === '1'; } catch (e) { /* ок */ }
    loadLocal();
    const go = () => {
        runAll();
        new MutationObserver(onMutations).observe(document.body, { childList: true, subtree: true, characterData: true });
        onLanguageChange(() => { runAll(); });
    };
    if (document.body) go();
    else document.addEventListener('DOMContentLoaded', go, { once: true });
}
