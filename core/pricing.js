// core/pricing.js
// v1.0.0 — 2026-10-03
// Единая формула цены. Постоянные параметры хранятся в Supabase (pricing_params);
// если таблица пуста или недоступна — используются DEFAULTS (равны прежним
// ценам из кода, поэтому после внедрения цены на сайте не меняются, пока вы
// сами не измените параметры).
// Формула: себестоимость единицы = изделие + ткань + (нанесение + техника, если есть принт)
//          + (шнурки/молния для худи) + упаковка + накладные;  цена = себестоимость × (1 + наценка/100)

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

// o: { type, composition, scale, technique, hasPrint, drawstring, zipper }
export function computeBreakdown(params, o) {
    const g = (k) => Number(params[k] ?? DEFAULTS[k] ?? 0);
    let cost = g('garment.' + o.type) + g('fabric.' + o.composition);
    if (o.hasPrint) cost += g('scale.' + o.scale) + g('tech.' + o.technique);
    if (o.type === 'hoodie') {
        if (o.drawstring) cost += g('extra.drawstring');
        if (o.zipper) cost += g('extra.zipper');
    }
    cost += g('packaging') + g('overhead');
    const retail = cost * (1 + g('margin.percent') / 100);
    return { cost: Math.round(cost * 100) / 100, retail: Math.round(retail * 100) / 100 };
}

export function computeUnitPrice(params, o) {
    return computeBreakdown(params, o).retail;
}
