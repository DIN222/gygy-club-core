// core/pricing.js
// v2.0.0 — 2026-10-10
// Единая формула цены. Постоянные параметры хранятся в Supabase (pricing_params);
// если таблица пуста или недоступна — используются DEFAULTS (равны прежним
// ценам из кода, поэтому после внедрения цены на сайте не меняются, пока вы
// сами не измените параметры).
//
// Формула:
//   себестоимость единицы = изделие + ткань + (нанесение + техника, если есть принт)
//                           + (шнурки/молния для худи) + упаковка + накладные
//   цена единицы          = себестоимость × (1 + наценка/100)
//
// Что нового в v2.0.0: computeBreakdown возвращает полную расшифровку затрат
// (изделие, ткань, нанесение, дополнения, упаковка, накладные, наценка в % и
// в деньгах). Atelier сохраняет эту расшифровку в каждом заказе, а Бухгалтерия
// (income-product.html) показывает её по строкам заказов.

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
// Возвращает: { garment, fabric, decoration, extras, packaging, overhead,
//               cost, marginPercent, margin, retail } — всё на ОДНУ единицу.
export function computeBreakdown(params, o) {
    const g = (k) => Number(params[k] ?? DEFAULTS[k] ?? 0);
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
        garment: round(garment),
        fabric: round(fabric),
        decoration: round(decoration),
        extras: round(extras),
        packaging: round(packaging),
        overhead: round(overhead),
        cost: round(cost),
        marginPercent,
        margin: round(retail - cost),
        retail: round(retail)
    };
}

export function computeUnitPrice(params, o) {
    return computeBreakdown(params, o).retail;
}
