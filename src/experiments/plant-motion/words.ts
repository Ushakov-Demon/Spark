import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { NUMBER_LOCALE, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingsOf } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { HOUR, type PlantCommand } from './bench.js';

export const setup: LocalizedText = msg('plant-motion-setup');

/** A span of time: seconds, minutes, hours or days, whichever reads best («40 хв», «6 год», «2 доби»). */
export function spanText(s: number, l: Locale): string {
  if (s < 60) return `${sig(s, 3, l)}\u00a0${t(l, 'unit-sym-s')}`;
  if (s < HOUR) return `${sig(s / 60, 3, l)}\u00a0${t(l, 'unit-sym-min')}`;
  if (s < 48 * HOUR) return `${sig(s / HOUR, 3, l)}\u00a0${t(l, 'unit-sym-h')}`;
  return t(l, 'plant-motion-days', { n: Number((s / 86_400).toPrecision(3)) });
}
/** A height as the pole shows it: to a centimetre, in metres from one metre on (or whenever asked, to match another). */
export const heightText = (m: number, l: Locale, metres = false): string => (m < 1 && !metres ? `${sig(m * 100, 3, l)}\u00a0${t(l, 'unit-sym-cm')}` : `${new Intl.NumberFormat(NUMBER_LOCALE[l], { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(m)}\u00a0${t(l, 'unit-sym-m')}`);
/** A speed in millimetres a second, three figures. */
export const mmPerS = (v: number, l: Locale): string => `${sig(v * 1000, 3, l)}\u00a0${t(l, 'unit-sym-mm-per-s')}`;

const args = (c: PlantCommand) => (c.step === 'shoot' ? { t: (l: Locale) => spanText(c.t, l), first: c.t === 0 ? 'yes' : 'no' } : { fps: (l: Locale) => sig(c.fps, 3, l) });

export const text = (c: PlantCommand): StepText => ({ say: msg(`plant-motion-${c.step}-say`, args(c)), button: msg(`plant-motion-${c.step}-button`, args(c)), plan: msg(`plant-motion-${c.step}-plan`, args(c)) });

/** Time-lapse: the shoot grows by the pole while the clock runs; slow motion: the lobes come together frame by frame. */
export const busy = (c: PlantCommand): LocalizedText => msg(`plant-motion-${c.step}-busy`);

export function shown(c: PlantCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (!r) return '';
  if (c.step === 'shoot') return t(locale, 'plant-motion-shoot-shown', { t: spanText(c.t, locale), h: heightText(r.value ?? 0, locale), first: c.t === 0 ? 'yes' : 'no' });
  return t(locale, 'plant-motion-trap-shown', { n: r.inputs?.['frames'] ?? 0, T: formatMeasured('time', r.value, r.inputs?.['division'] ?? 0.01, locale) });
}

export function say(c: PlantCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (!r) return '';
  if (c.step === 'shoot') return t(locale, 'plant-motion-shoot-said', { t: spanText(c.t, locale), h: heightText(r.value ?? 0, locale), first: c.t === 0 ? 'yes' : 'no' });
  return t(locale, 'plant-motion-trap-said', { n: r.inputs?.['frames'] ?? 0, fps: sig(c.fps, 3, locale), T: formatMeasured('time', r.value, r.inputs?.['division'] ?? 0.01, locale) });
}

/** The board: the shoot's speed from the first photo, v = Δh / Δt; the trap's edge, v = l / t, the time from the frames. */
export function board(c: PlantCommand, recs: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const r = recs[0];
  if (!r || r.value === null) return [];
  if (c.step === 'trap') {
    const n = r.inputs?.['frames'] ?? 0;
    const path = r.inputs?.['path'] ?? 0;
    return [
      { id: `pm-trap-time:${i}`, title: t(locale, 'plant-motion-board-trap-time'), formula: 't = n / f', numbers: `${n} / ${sig(c.fps, 3, locale)} ≈ ${formatMeasured('time', r.value, r.inputs?.['division'] ?? 0.01, locale)}` },
      { id: `pm-trap:${i}`, title: t(locale, 'plant-motion-board-trap'), formula: 'v = l / t', numbers: `${sig(path * 1000, 2, locale)}\u00a0${t(locale, 'unit-sym-mm')} / ${sig(r.value, 3, locale)}\u00a0${t(locale, 'unit-sym-s')} ≈ ${mmPerS(path / r.value, locale)}` },
    ];
  }
  // The first photo is where the heights are counted from.
  const first = readingsOf(before).find((x) => x.command.type === 'lab.plant' && (x.command as unknown as PlantCommand).step === 'shoot')?.record;
  if (!first || first.value === null || !(c.t > (first.inputs?.['t'] ?? 0))) return [];
  const dt = c.t - (first.inputs?.['t'] ?? 0);
  const dh = r.value - first.value;
  return [
    {
      id: `pm-shoot:${i}`,
      title: t(locale, 'plant-motion-board-shoot', { t: spanText(dt, locale) }),
      formula: 'v = Δh / Δt',
      numbers: `(${heightText(r.value, locale, r.value >= 1)} − ${heightText(first.value, locale, r.value >= 1)}) / ${spanText(dt, locale)} ≈ ${sig((dh * 100) / (dt / HOUR), 3, locale)}\u00a0${t(locale, 'unit-sym-cm')}/${t(locale, 'unit-sym-h')} ≈ ${mmPerS(dh / dt, locale)}`,
    },
  ];
}
