import type { MeasurementRecord } from '../../core/trace.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import type { BoardAt, StepText } from '../types.js';
import { GRAVI_TEXT, type GraviCommand } from './bench.js';

/** The roots' words: the steps, the photos' angles, the board. */

export const setup: LocalizedText = { uk: 'Скляна банка, паперовий рушник, вода, пророслі зерна кукурудзи; телефон на штативі, транспортир; клиностат — моторчик, що повільно обертає банку (1 оберт за хвилину)', en: 'A glass jar, a paper towel, water, sprouted maize grains; a phone on a stand, a protractor; a clinostat — a small motor turning the jar slowly (1 turn a minute)' };

export const text = (c: GraviCommand): StepText => GRAVI_TEXT['lab.gravi'](c);

export const busy = (): LocalizedText => ({ uk: 'Хвилини біжать — фотографуємо корінці…', en: 'The minutes run on — photographing the roots…' });

/** The photos in words: «0 хв — 0°, 20 хв — 0°, …»; the jar standing — the roots straight down. */
export function shown(c: GraviCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  if (c.step === 'upright') return uk ? 'корінці ростуть прямо вниз' : 'the roots grow straight down';
  return recs.map((r) => `${r.inputs?.['time'] ?? 0} ${uk ? 'хв' : 'min'} — ${r.value}°`).join(', ');
}

/** The board: the bend after two hours on the side; on the clinostat. */
export function board(c: GraviCommand, recs: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const out: BoardLine[] = [];
  const step = c.step;
  if (step === 'upright' || !recs.length) return out;
  const last = recs[recs.length - 1]!;
  out.push({ id: `${step === 'side' ? 'gr' : 'gc'}:${i}`, title: uk ? (step === 'side' ? 'банка на боці: кінчик кореня' : 'банка на клиностаті') : step === 'side' ? 'the jar on its side: the root tip' : 'the jar on a clinostat', formula: uk ? `${last.inputs?.['time']} хв` : `${last.inputs?.['time']} min`, numbers: `${last.value}°` });
  return out;
}
