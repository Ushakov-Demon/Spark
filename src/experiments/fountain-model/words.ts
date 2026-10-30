import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import type { BoardAt, StepText } from '../types.js';
import { FOUNTAIN_TEXT, type FountainCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Пластикова пляшка без дна на штативі, силіконова трубка завдовжки 1 м (6 мм усередині), скляне сопло (2 мм), таз, лінійка, вода', en: 'A plastic bottle with its bottom cut off on a stand, a silicone tube 1 m long (6 mm inside), a glass nozzle (2 mm), a basin, a ruler, water' };

export const text = (c: FountainCommand): StepText => FOUNTAIN_TEXT['lab.fountain'](c);

/** The bottle is moved, the water runs (or stops). */
export const busy = (c: FountainCommand): LocalizedText => (c.head > 0 ? { uk: 'Ставлю пляшку — вода біжить трубкою…', en: 'Setting the bottle — the water runs through the tube…' } : { uk: 'Опускаю пляшку…', en: 'Lowering the bottle…' });

const cm = (x: number) => Math.round(x * 100);
const unit = (locale: Locale) => (locale === 'uk' ? 'см' : 'cm');

export function shown(c: FountainCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const r = recs[0];
  if (!r) return '';
  if (c.head <= 0) return uk ? 'струменя немає: вода в трубці стоїть на рівні води в пляшці' : 'no jet: the water in the tube stands at the level of the water in the bottle';
  return uk ? `H = ${cm(c.head)} см — струмінь на ${cm(r.value ?? 0)} см` : `H = ${cm(c.head)} cm — the jet ${cm(r.value ?? 0)} cm high`;
}

/** What the jet did. */
export function say(c: FountainCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const r = recs[0];
  if (!r) return '';
  if (c.head <= 0) return uk ? 'Нічого не б’є: вода в трубці піднялася лише до рівня води в пляшці — і стоїть.' : 'Nothing shoots: the water in the tube rose only to the level of the water in the bottle — and stands.';
  return uk ? `Вода в пляшці на ${cm(c.head)} см вище сопла — а струмінь б’є на ${cm(r.value ?? 0)} см.` : `The water in the bottle is ${cm(c.head)} cm above the nozzle — and the jet goes ${cm(r.value ?? 0)} cm up.`;
}

/** The board's lines for a done step: the head, the jet, how much of the head the jet reached. */
export function board(c: FountainCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const r = trace[0];
  if (!r || r.value === null) return [];
  const u = unit(locale);
  if (c.head <= 0) return [{ id: `fh0:${i}`, title: uk ? 'пляшка нижче сопла' : 'the bottle below the nozzle', formula: `H = −${cm(-c.head)} ${u}`, numbers: uk ? 'струменя немає' : 'no jet' }];
  return [{ id: `fh:${i}`, title: uk ? `вода в пляшці на H = ${cm(c.head)} ${u} вище сопла` : `the water H = ${cm(c.head)} ${u} above the nozzle`, formula: 'h / H', numbers: `${cm(r.value)} ${u} / ${cm(c.head)} ${u} ≈ ${sig(r.value / c.head, 2, locale)}` }];
}
