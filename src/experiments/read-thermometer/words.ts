import type { MeasurementRecord } from '../../core/trace.js';
import { ZERO_CELSIUS_IN_KELVIN } from '../../core/units.js';
import { sig } from '../../explain/format.js';
import { NUMBER_LOCALE, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { SCALE_MARKS_BETWEEN, SCALE_NUMBERED, type ThermometerCommand } from './bench.js';

export const setup: LocalizedText = msg('read-thermometer-setup');

/** A time: seconds below a minute, minutes from it («3 с», «1,5 хв»), to so many significant figures. */
export const timeText = (s: number, l: Locale, digits = 3): string => (s < 60 ? `${sig(s, digits, l)} ${t(l, 'unit-sym-s')}` : `${sig(s / 60, digits, l)} ${t(l, 'unit-sym-min')}`);
/** A temperature given in °C, as many decimals as asked. */
export const degC = (x: number, l: Locale, decimals = 0): string => `${new Intl.NumberFormat(NUMBER_LOCALE[l], { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(x)} ${t(l, 'unit-sym-degC')}`;
/** A reading (in kelvin, as the record keeps it) as the thermometer shows it. */
export const reading = (r: MeasurementRecord | undefined, l: Locale): string => (r ? formatMeasured('temperature', r.value, r.inputs?.['division'] ?? 1, l) : '');
const celsiusOf = (r: MeasurementRecord) => (r.value ?? 0) - ZERO_CELSIUS_IN_KELVIN;

export const text = (c: ThermometerCommand): StepText => {
  if (c.step === 'scale') return { say: msg('read-thermometer-scale-say'), button: msg('read-thermometer-scale-button'), plan: msg('read-thermometer-scale-plan') };
  const args = { t: (l: Locale) => timeText(c.t, l), water: (l: Locale) => degC(c.water, l), stir: c.stir ? 'yes' : 'no' };
  return { say: msg('read-thermometer-dip-say', args), button: msg('read-thermometer-dip-button', args), plan: msg('read-thermometer-dip-plan', args) };
};

/** The scale is looked over mark by mark; in the water the column climbs while the stopwatch runs. */
export const busy = (c: ThermometerCommand): LocalizedText => msg(c.step === 'scale' ? 'read-thermometer-scale-busy' : 'read-thermometer-dip-busy');

export function shown(c: ThermometerCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (!r) return '';
  return c.step === 'scale' ? t(locale, 'read-thermometer-scale-shown', { T: reading(r, locale) }) : t(locale, 'read-thermometer-dip-shown', { t: timeText(c.t, locale), T: reading(r, locale) });
}

export function say(c: ThermometerCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (!r) return '';
  if (c.step === 'scale') return t(locale, 'read-thermometer-scale-said', { T: reading(r, locale), c: degC(r.inputs?.['division'] ?? 1, locale), n: SCALE_MARKS_BETWEEN });
  // Got there: the reading is the water's, to a division.
  const there = Math.abs(celsiusOf(r) - c.water) < (r.inputs?.['division'] ?? 1) / 2 + 1e-9;
  return t(locale, 'read-thermometer-dip-said', { t: timeText(c.t, locale), T: reading(r, locale), water: degC(c.water, locale), there: there ? 'yes' : 'no' });
}

/** The board: the division c = (a − b)/n; each reading on the bulb's curve T = T₁ − (T₁ − T₀)·e^(−t/τ) (T₁ the water, T₀ the room). */
export function board(c: ThermometerCommand, recs: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const r = recs[0];
  if (!r) return [];
  const div = r.inputs?.['division'] ?? 1;
  if (c.step === 'scale') return [{ id: 'rt-scale', title: t(locale, 'read-thermometer-board-scale'), formula: 'c = (a − b) / n', numbers: `(${degC(SCALE_NUMBERED, locale)} − ${degC(0, locale)}) / ${SCALE_MARKS_BETWEEN} = ${degC(div, locale)}` }];
  const tau = r.inputs?.['tau'] ?? 1;
  return [
    {
      id: `rt-dip:${i}`,
      title: t(locale, 'read-thermometer-board-dip', { t: timeText(c.t, locale), stir: c.stir ? 'yes' : 'no' }),
      formula: 'T = T₁ − (T₁ − T₀) · e^(−t/τ)',
      numbers: `${sig(c.water, 3, locale)} − ${sig(c.water - c.room, 3, locale)} · e^(−${sig(c.t, 3, locale)}/${sig(tau, 2, locale)}) ≈ ${reading(r, locale)}`,
    },
  ];
}
