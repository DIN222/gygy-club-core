// core/pricing.js
// v4.0.0 — 2026-10-14
// Построчная себестоимость. Параметры хранятся в Supabase (pricing_params),
// у каждого изделия свои: ключ вида "hoodie|scale.a3".
// Формула:
//   себестоимость единицы = ткань (выбранная клиентом) + нитки + фурнитура + обтачка
//       + киперная лента + пошив + (нанесение + техника, если есть принт)
//       + бирки + (шнурки/молния у худи) + упаковка + накладные (аренда, электричество,
//       газ, вода, зарплата, налоги, прочее)
//   наценка = процент от себестоимости; розничная цена = себестоимость + наценка.
// Настройки витрины (название и плотность ткани) — таблица storefront_config.

import { supabase } from './supabase-init.js';

const G_EXTRAS = 'Дополнения (бирки постоянные, съёмные; шнурки, молния)';

export const COMPOSITION_LABELS = {
    cotton100: '100% хлопок',
    stretch: 'Стрейч (95% хлопок / 5% эластан)',
    cotton80poly20: '80% хлопок / 20% полиэстер',
    cotton100fleece: '100% хлопок, начёс'
};

// [ключ, подпись, группа, значение по умолчанию]
export const PARAM_DEFS = [
    ['fab.cotton100', 'Ткань: 100% хлопок', 'Материалы', 0],
    ['fab.stretch', 'Ткань: стрейч', 'Материалы', 0],
    ['fab.cotton80poly20', 'Ткань: 80% хлопок / 20% полиэстер', 'Материалы', 0],
    ['fab.cotton100fleece', 'Ткань: 100% хлопок, начёс', 'Материалы', 0],
    ['material.thread', 'Нитки', 'Материалы', 0],
    ['material.fittings', 'Фурнитура', 'Материалы', 0],
    ['material.facing', 'Материал обтачки', 'Материалы', 0],
    ['material.tape', 'Киперная (силиконовая) лента — усиление швов', 'Материалы', 0],
    ['labor.sewing', 'Пошив', 'Работа', 0],
    ['scale.a3', 'Нанесение A3', 'Нанесение', 12],
    ['scale.a4', 'Нанесение A4', 'Нанесение', 8],
    ['scale.logo-chest', 'Нанесение: лого на груди', 'Нанесение', 4],
    ['scale.logo-sleeve', 'Нанесение: лого на рукаве', 'Нанесение', 3],
    ['scale.custom', 'Нанесение: фактический размер', 'Нанесение', 10],
    ['tech.dtf', 'Техника: DTF-печать', 'Нанесение', 0],
    ['tech.embroidery', 'Техника: вышивка', 'Нанесение', 7],
    ['extra.label_permanent', 'Бирка постоянная', G_EXTRAS, 0],
    ['extra.label_removable', 'Бирка съёмная', G_EXTRAS, 0],
    ['extra.drawstring', 'Шнурки (худи)', G_EXTRAS, 0],
    ['extra.zipper', 'Молния (худи)', G_EXTRAS, 0],
    ['packaging', 'Упаковка', 'Упаковка', 0],
    ['overhead.rent', 'Аренда', 'Накладные', 0],
    ['overhead.electricity', 'Электричество', 'Накладные', 0],
    ['overhead.gas', 'Газ', 'Накладные', 0],
    ['overhead.water', 'Вода', 'Накладные', 0],
    ['overhead.salary', 'Зарплата', 'Накладные', 0],
    ['overhead.taxes', 'Налоги', 'Накладные', 0],
    ['overhead.other', 'Прочие накладные', 'Накладные', 0],
    ['margin.percent', 'Наценка, %', 'Наценка', 0]
];

export const DEFAULTS = Object.fromEntries(PARAM_DEFS.map(d => [d[0], d[3]]));

// Стартовые значения по изделиям (суммы дают прежние цены; замените реальными)
const GARMENT_DEFAULTS = {
    tshirt: { 'fab.cotton100': 8, 'fab.stretch': 12, 'material.thread': 0.5, 'material.fittings': 1, 'labor.sewing': 5.5 },
    hoodie: { 'fab.cotton80poly20': 20, 'fab.cotton100fleece': 23, 'material.thread': 1, 'material.fittings': 2, 'labor.sewing': 12 },
    longsleeve: { 'fab.cotton100fleece': 17, 'material.thread': 0.5, 'material.fittings': 1.5, 'labor.sewing': 6 }
};

// Какие ткани бывают у каких изделий
export const FABRICS_BY_GARMENT = {
    tshirt: ['cotton100', 'stretch'],
    hoodie: ['cotton80poly20', 'cotton100fleece'],
    longsleeve: ['cotton100fleece']
};

// Что клиент видит в Ателье по умолчанию (название ткани, плотность)
export const STOREFRONT_DEFAULTS = {
    tshirt: { density: '160-180', labels: { cotton100: '100% COTTON', stretch: 'STRETCH (95% cotton / 5% elastane)' } },
    hoodie: { density: '280-320', labels: { cotton80poly20: '80% COTTON / 20% POLYESTER', cotton100fleece: '100% COTTON FLEECE' } },
    longsleeve: { density: '220-240', labels: { cotton100fleece: '100% COTTON' } }
};

export async function loadPricing() {
    try {
        const { data, error } = await supabase.from('pricing_params').select('key, value');
        if (error) throw error;
        const map = {};
        (data || []).forEach(r => { map[r.key] = Number(r.value); });
        return map;
    } catch (e) {
        console.warn('[pricing] Параметры цены недоступны — используются значения по умолчанию.', e);
        return {};
    }
}

export async function loadStorefrontConfig(type) {
    const base = STOREFRONT_DEFAULTS[type] || { density: '', labels: {} };
    const result = { density: base.density, labels: { ...base.labels } };
    try {
        const { data, error } = await supabase.from('storefront_config').select('value').eq('key', 'fabric.' + type).maybeSingle();
        if (error) throw error;
        const v = data && data.value;
        if (v) {
            if (v.density) result.density = v.density;
            if (v.labels) Object.assign(result.labels, v.labels);
        }
    } catch (e) {
        console.warn('[pricing] Настройки витрины недоступны — значения по умолчанию.', e);
    }
    return result;
}

function defaultFor(type, key) {
    const g = GARMENT_DEFAULTS[type];
    if (g && g[key] !== undefined) return g[key];
    return DEFAULTS[key] ?? 0;
}

// Значение параметра для изделия: своё сохранённое → стартовое
export function effectiveValue(params, type, key) {
    const own = params[type + '|' + key];
    return Number(own ?? defaultFor(type, key));
}

// Параметры, относящиеся к изделию. storeKey — ключ в базе.
export function garmentParamDefs(type) {
    const fabrics = FABRICS_BY_GARMENT[type] || [];
    return PARAM_DEFS.filter(d => {
        const k = d[0];
        if (k.startsWith('fab.')) return fabrics.includes(k.slice(4));
        if (k === 'extra.drawstring' || k === 'extra.zipper') return type === 'hoodie';
        return true;
    }).map(d => ({ key: d[0], storeKey: type + '|' + d[0], label: d[1], group: d[2], def: d[3] }));
}

// o: { type, composition, scale, technique, hasPrint, drawstring, zipper }
// Возвращает { lines:[{key,label,group,amount}], cost, marginPercent, margin, retail } — на ОДНУ единицу.
export function computeBreakdown(params, o) {
    const g = (k) => effectiveValue(params, o.type, k);
    const round = (n) => Math.round(n * 100) / 100;
    const defMap = Object.fromEntries(PARAM_DEFS.map(d => [d[0], d]));
    const lines = [];
    let cost = 0;
    const take = (key) => {
        const amount = g(key);
        if (amount && defMap[key]) {
            lines.push({ key, label: defMap[key][1], group: defMap[key][2], amount: round(amount) });
            cost += amount;
        }
    };

    take('fab.' + o.composition);
    ['material.thread', 'material.fittings', 'material.facing', 'material.tape', 'labor.sewing'].forEach(take);
    if (o.hasPrint) { take('scale.' + o.scale); take('tech.' + o.technique); }
    take('extra.label_permanent');
    take('extra.label_removable');
    if (o.type === 'hoodie') {
        if (o.drawstring) take('extra.drawstring');
        if (o.zipper) take('extra.zipper');
    }
    take('packaging');
    ['overhead.rent', 'overhead.electricity', 'overhead.gas', 'overhead.water',
     'overhead.salary', 'overhead.taxes', 'overhead.other'].forEach(take);

    const marginPercent = g('margin.percent');
    const retail = round(cost + cost * marginPercent / 100);
    return { lines, cost: round(cost), marginPercent, margin: round(retail - cost), retail };
}

export function computeUnitPrice(params, o) {
    return computeBreakdown(params, o).retail;
}
