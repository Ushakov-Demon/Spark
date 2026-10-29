import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { AIR_TEXT, type AirCommand, airPlaceName, type AirWhere } from './bench.js';

export const setup: LocalizedText = { uk: 'Смартфон із барометром (застосунок показує тиск до сотих гектопаскаля), ліфт багатоповерхівки, політ на дирижаблі', en: 'A smartphone with a barometer (an app shows the pressure to hundredths of a hectopascal), a block of flats with a lift, a flight in an airship' };

export const text = (c: AirCommand): StepText => AIR_TEXT['lab.air'](c);

export const busy = (c: AirCommand): LocalizedText =>
  c.where === 'airship' || c.where === 'high' ? { uk: 'Дирижабль набирає висоту…', en: 'The airship is climbing…' } : { uk: 'Тиск на екрані ще змінюється — чекаємо…', en: 'The pressure on the screen is still changing — wait…' };

export const shown = (_c: AirCommand, recs: readonly MeasurementRecord[], locale: Locale): string => formatMeasured('pressure', recs[0]?.value ?? null, 1, locale);

/** The barometer's reading at the place. */
export function say(c: AirCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const name = tr(airPlaceName(c.where), locale);
  const p = formatMeasured('pressure', recs[0]?.value ?? null, 1, locale);
  return locale === 'uk' ? `${name.charAt(0).toUpperCase()}${name.slice(1)}: барометр показує ${p}.` : `${name.charAt(0).toUpperCase()}${name.slice(1)}: the barometer shows ${p}.`;
}

/** The board's lines for a done step. */
export function board(c: AirCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const where = c.where;
  // (The barometer's readings before this one, by where they were taken.)
  const baro: Partial<Record<string, { p: number; h: number }>> = {};
  for (const x of before) {
    const p = x.ok && x.command.type === 'lab.air' ? x.trace.find((y): y is MeasurementRecord => y.kind === 'measurement' && y.value !== null) : undefined;
    if (p) baro[(x.command as unknown as AirCommand).where] = { p: p.value!, h: p.inputs?.['height'] ?? 0 };
  }
  const h = r.inputs?.['height'] ?? 0;
  const g = r.inputs?.['g'] ?? 9.81;
  const hPa = (x: number) => `${n(x / 100, 6)} ${uk ? 'гПа' : 'hPa'}`;
    out.push({ id: `ap:${i}`, title: uk ? `${tr(airPlaceName(where as AirWhere), locale)}, ${Math.round(h)} м над морем` : `${tr(airPlaceName(where as AirWhere), locale)}, ${Math.round(h)} m above the sea`, formula: `p = ${hPa(r.value!)}` });
  const ground = baro['ground'];
  if (where === 'ground') out.push({ id: `am:${i}`, title: uk ? 'маса повітря над 1 м² — його вагу й показує барометр' : 'the mass of air above 1 m² — its weight is what the barometer shows', formula: 'm = p·S / g', numbers: `${n(r.value!, 5)} ${uk ? 'Па' : 'Pa'} · 1 ${uk ? 'м²' : 'm²'} / ${n(g, 3)} ≈ ${n(r.value! / g, 3)} ${uk ? 'кг' : 'kg'}` });
  if (where === 'ninth' && ground) {
    const dp = ground.p - r.value!;
    const dh = h - ground.h;
    out.push({ id: `ad:${i}`, title: uk ? `на ${n(dh, 3)} м вище — тиск менший на ${n(dp / 100, 3)} гПа: густина повітря` : `${n(dh, 3)} m higher — the pressure ${n(dp / 100, 3)} hPa less: the air's density`, formula: 'ρ = Δp / (g·Δh)', numbers: `${n(dp, 3)} ${uk ? 'Па' : 'Pa'} / (${n(g, 3)} · ${n(dh, 3)} ${uk ? 'м' : 'm'}) ≈ ${n(dp / (g * dh), 3)} ${uk ? 'кг/м³' : 'kg/m³'}` });
  }
  if (where === 'high' && ground) out.push({ id: `ah:${i}`, title: uk ? 'яка частка повітря над містом лишилася під дирижаблем' : 'how much of the air above the town is below the airship', formula: '(p₁ − p) / p₁', numbers: `(${hPa(ground.p)} − ${hPa(r.value!)}) / ${hPa(ground.p)} ≈ ${n(((ground.p - r.value!) / ground.p) * 100, 2)} %` });
  return out;
}
