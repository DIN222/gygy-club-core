// core/pricing.js
// v3.0.0 — 2026-10-12
// Единая формула цены. Параметры хранятся в Supabase (pricing_params).
// У каждого изделия может быть свой набор: ключ вида "hoodie|scale.a3".
// Если своего значения нет, берётся общее (ключ без префикса), затем DEFAULTS.
//
//   себестоимость единицы = изделие + ткань + (нанесение + техника, если есть принт)
//                           + (шнурки/молния для худи) + упаковка + накладные
//   цена единицы          = себестоимость × (1 + наценка/100)

import { supabase } from './supabase-init.js';

// [ключ, подпись, группа, значение по умолчанию]
export const PARAM_DEFS = [
    ['garment.tshirt', 'Футболка: ткань, нитки, фурнитура, пошив', 'Изделие', 15],
    ['garment.hoodie', 'Худи: ткань, нитки, фурнитура, пошив', 'Изделие', 35],
    ['garment.longsleeve', 'Лонгслив: ткань, нитки, фурнитура, пошив', 'Изделие', 22],
    ['fabric.cotton100', '100% хлопок (доплата)', 'Ткань', 0],
    ['fabric.stretch', 'Стрейч (доплата)', 'Ткань', 4],
    ['fabric.cotton80poly20', '80% хлопок / 20% полиэстер (доплата)', 'Ткань', 0],
    ['fabric.cotton100fleece', '100% хлопок, начёс (доплата)', 'Ткань', 3],
    ['scale.a3', 'Нанесение A3', 'Нанесение', 12],
    ['scale.a4', 'Нанесение A4', 'Нанесение', 8],
    ['scale.logo-chest', 'Нанесение: лого на груди', 'Нанесение', 4],
    ['scale.logo-sleeve', 'Нанесение: лого на рукаве', 'Нанесение', 3],
    ['scale.custom', 'Нанесение: фактический размер', 'Нанесение', 10],
    ['tech.dtf', 'Техника: DTF-печать', 'Техника', 0],
    ['tech.embroidery', 'Техника: вышивка', 'Техника', 7],
    ['extra.drawstring', 'Худи: шнурки', 'Дополнения', 0],
    ['extra.zipper', 'Худи: молния', 'Дополнения', 0],
    ['packaging', 'Упаковка на единицу', 'Общие', 0],
    ['overhead', 'Накладные на единицу (аренда, коммуналка, зарплата…)', 'Общие', 0],
    ['margin.percent', 'Наценка, %', 'Общие', 0]
];

export const DEFAULTS = Object.fromEntries(PARAM_DEFS.map(d => [d[0], d[3]]));

// Какие ткани бывают у каких изделий
export const FABRICS_BY_GARMENT = {
    tshirt: ['cotton100', 'stretch'],
    hoodie: ['cotton80poly20', 'cotton100fleece'],
    longsleeve: ['cotton100fleece']
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

// Значение параметра для конкретного изделия: своё → общее → по умолчанию
export function effectiveValue(params, type, key) {
    const own = params[type + '|' + key];
    const shared = params[key];
    return Number(own ?? shared ?? DEFAULTS[key] ?? 0);
}

// Параметры, относящиеся к изделию. storeKey — под каким ключом сохранять.
export function garmentParamDefs(type) {
    const fabrics = FABRICS_BY_GARMENT[type] || [];
    return PARAM_DEFS.filter(d => {
        const k = d[0];
        if (k.startsWith('garment.')) return k === 'garment.' + type;
        if (k.startsWith('fabric.')) return fabrics.includes(k.slice(7));
        if (k.startsWith('extra.')) return type === 'hoodie';
        return true;
    }).map(d => ({
        key: d[0],
        storeKey: d[0].startsWith('garment.') ? d[0] : type + '|' + d[0],
        label: d[1],
        group: d[2],
        def: d[3]
    }));
}

// o: { type, composition, scale, technique, hasPrint, drawstring, zipper }
export function computeBreakdown(params, o) {
    const g = (k) => effectiveValue(params, o.type, k);
    const round = (n) => Math.round(n * 100) / 100;

    const garment = g('garment.' + o.type);
    const fabric = g('fabric.' + o.composition);
    const decoration = o.hasPrint ? g('scale.' + o.scale) + g('tech.' + o.technique) : 0;
    let extras = 0;
    if (o.type === 'hoodie') {
        if (o.drawstring) extras += g('extra.drawstring');
        if (o.zipper) extras += g('extra.zipper');
    }
    const packaging = g('packaging');
    const overhead = g('overhead');

    const cost = garment + fabric + decoration + extras + packaging + overhead;
    const marginPercent = g('margin.percent');
    const retail = cost * (1 + marginPercent / 100);

    return {
        garment: round(garment), fabric: round(fabric), decoration: round(decoration), extras: round(extras),
        packaging: round(packaging), overhead: round(overhead),
        cost: round(cost), marginPercent, margin: round(retail - cost), retail: round(retail)
    };
}

export function computeUnitPrice(params, o) {
    return computeBreakdown(params, o).retail;
}
