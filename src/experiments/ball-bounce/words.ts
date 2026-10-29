import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import type { BoardAt, StepText } from '../types.js';
import { BOUNCE_TEXT, bounceBallName, type BounceCommand } from './bench.js';
import { G } from '../../domains/mechanics/constants.js';

export const setup: LocalizedText = { uk: 'Метрова лінійка на штативі, стальна плита, м’ячик для настільного тенісу, тенісний м’яч, пластилінова кулька', en: 'A metre stick on a stand, a steel plate, a table tennis ball, a tennis ball, a plasticine ball' };

export const text = (c: BounceCommand): StepText => BOUNCE_TEXT['lab.bounce'](c);

export const busy = (): LocalizedText => ({ uk: 'Відпускаю м’ячик — стежимо, куди підскочить…', en: 'Letting the ball go — watch how high it bounces…' });

export const shown = (_c: BounceCommand, recs: readonly MeasurementRecord[], locale: Locale): string => `${Math.round((recs[0]?.value ?? 0) * 100)} ${locale === 'uk' ? 'см' : 'cm'}`;

/** How high it rose this time. */
export function say(c: BounceCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const h = Math.round((recs[0]?.value ?? 0) * 100);
  if (h === 0) return uk ? `${tr(bounceBallName(c.ball), locale).replace(/^./, (x) => x.toUpperCase())} сплющилася й лишилася на плиті — не підскочила зовсім.` : `${tr(bounceBallName(c.ball), locale).replace(/^./, (x) => x.toUpperCase())} flattened and stayed on the plate — no bounce at all.`;
  return uk ? `${c.bounce === 1 ? 'Підскочив' : `${c.bounce}-й відскок`} — на ${h} см.` : `${c.bounce === 1 ? 'It bounced' : `Bounce ${c.bounce}`} — to ${h} cm.`;
}

/** The board's lines for a done step. */
export function board(c: BounceCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const m = r.inputs?.['mass'] ?? 0;
  const k = c.bounce;
  const what = tr(bounceBallName(c.ball), locale);
  const h = `${Math.round(r.value! * 100)} ${uk ? 'см' : 'cm'}`;
  const title = uk ? `${k}-й відскок: h = ${h}` : `bounce ${k}: h = ${h}`;
  // (Its energy before the drop: the first bounce of each ball.)
  if (k === 1) out.push({ id: `b0:${i}`, title: uk ? `${what} нагорі: h₀ = 1 м` : `${what} at the top: h₀ = 1 m`, formula: uk ? 'Eп = m·g·h' : 'Eₚ = m·g·h', numbers: `${n(m, 2)} ${uk ? 'кг' : 'kg'} · ${n(G, 2)} ${uk ? 'Н/кг' : 'N/kg'} · 1 ${uk ? 'м' : 'm'} ≈ ${n(m * G * 1000, 2)} ${uk ? 'мДж' : 'mJ'}` });
  out.push({ id: `bn:${i}`, title, formula: uk ? 'Eп = m·g·h' : 'Eₚ = m·g·h', numbers: `${n(m, 2)} ${uk ? 'кг' : 'kg'} · ${n(G, 2)} ${uk ? 'Н/кг' : 'N/kg'} · ${n(r.value!, 2)} ${uk ? 'м' : 'm'} ≈ ${n(m * G * r.value! * 1000, 2)} ${uk ? 'мДж' : 'mJ'}` });
  return out;
}
