import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingsOf } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import type { LuxmeterCommand } from './bench.js';
import { fluxText, degText } from './shared.js';
export { fluxText, wattText, degText } from './shared.js';


/** A distance: centimetres below a metre, metres from it («30 см», «1,5 м»). */
export const lengthText = (m: number, l: Locale): string => (m < 1 ? `${sig(m * 100, 3, l)}\u00a0${t(l, 'unit-sym-cm')}` : `${sig(m, 3, l)}\u00a0${t(l, 'unit-sym-m')}`);
/** A reading as the meter shows it. */
export const reading = (r: MeasurementRecord | undefined, l: Locale): string => (r ? formatMeasured('illuminance', r.value, r.inputs?.['division'] ?? 1, l) : '');

const args = (c: LuxmeterCommand) => ({ r: (l: Locale) => lengthText(c.r, l), tilt: (l: Locale) => degText(c.tilt ?? 0, l), tilted: c.tilt ? 'yes' : 'no' });

export const text = (c: LuxmeterCommand): StepText => ({ say: msg('light-meter-at-say', args(c)), button: msg('light-meter-at-button', args(c)), plan: msg('light-meter-at-plan', args(c)) });

/** The lamp goes up the stand (or the meter tilts), and the figures run on the display. */
export const busy = (c: LuxmeterCommand): LocalizedText => msg(c.tilt ? 'light-meter-tilt-busy' : 'light-meter-at-busy');

export function shown(c: LuxmeterCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  return r ? t(locale, 'light-meter-at-shown', { ...args(c), r: lengthText(c.r, locale), tilt: degText(c.tilt ?? 0, locale), E: reading(r, locale) }) : '';
}

export function say(c: LuxmeterCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  return r ? t(locale, 'light-meter-at-said', { r: lengthText(c.r, locale), tilt: degText(c.tilt ?? 0, locale), tilted: c.tilt ? 'yes' : 'no', E: reading(r, locale) }) : '';
}

/**
 * The board: each reading as the lamp's flux spread over a sphere of radius r, E = Φ / (4π r²) (tilted, times cos α);
 * from the second height on, how many times less than at the first — beside the distances' ratio squared.
 */
export function board(c: LuxmeterCommand, recs: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const r = recs[0];
  if (!r) return [];
  const tilt = c.tilt ?? 0;
  const flux = r.inputs?.['flux'] ?? 0;
  const lines: BoardLine[] = [
    {
      id: `lm-at:${i}`,
      title: t(locale, 'light-meter-board-at', { r: lengthText(c.r, locale), tilt: degText(tilt, locale), tilted: tilt ? 'yes' : 'no' }),
      formula: tilt ? 'E = Φ · cos α / (4π r²)' : 'E = Φ / (4π r²)',
      numbers: tilt ? `${sig(flux, 3, locale)} · cos ${degText(tilt, locale)} / (4π · ${sig(c.r, 3, locale)}²) ≈ ${reading(r, locale)}` : `${sig(flux, 3, locale)} / (4π · ${sig(c.r, 3, locale)}²) ≈ ${reading(r, locale)}`,
    },
  ];
  const earlier = readingsOf(before).filter((x) => x.command.type === 'lab.luxmeter');
  // The first look: the lamp's light from its power, Φ = η · P.
  if (earlier.length === 0) lines.unshift({ id: `lm-flux:${i}`, title: t(locale, 'light-meter-board-flux'), formula: 'Φ = η · P', numbers: `${sig(flux / c.power, 3, locale)} · ${sig(c.power, 3, locale)} ≈ ${fluxText(flux, locale)}` });
  // Compared with the first look, face to the lamp; only for another distance, face to it too.
  const first = readingsOf(before).find((x) => x.command.type === 'lab.luxmeter' && !(x.command as unknown as LuxmeterCommand).tilt)?.record;
  const r1 = Number(first?.inputs?.['r']);
  // (Only for the same lamp's light: its power not turned between.)
  if (!tilt && first?.value && r.value && Math.abs(c.r - r1) > 1e-9 && Math.abs((first.inputs?.['flux'] ?? 0) - flux) < 1e-9) {
    lines.push({
      id: `lm-ratio:${i}`,
      title: t(locale, 'light-meter-board-ratio', { r: lengthText(c.r, locale), r1: lengthText(r1, locale) }),
      formula: 'E₁ / E ≈ (r / r₁)²',
      numbers: `${sig(first.value, 3, locale)} / ${sig(r.value, 3, locale)} ≈ ${sig(first.value / r.value, 2, locale)} ≈ (${sig(c.r, 3, locale)} / ${sig(r1, 3, locale)})²`,
    });
  }
  return lines;
}
