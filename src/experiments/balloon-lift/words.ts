import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import type { BoardAt, StepText } from '../types.js';
import { LIFT_TEXT, massText, sizeText, type LiftCommand } from './bench.js';

export const setup: LocalizedText = msg('balloon-lift-setup');

export const text = (c: LiftCommand): StepText => LIFT_TEXT['lab.balloon'](c);

/** Weighing and measuring just change the picture; a balloon tied on rises (or lies). */
export const busy = (c: LiftCommand): LocalizedText | null => (c.step === 'lift' ? msg('balloon-lift-busy') : null);

/** A lifting force as the instrument shows it: on the balance — grams less (or more); on a gauge — newtons. */
export const liftText = (r: MeasurementRecord, l: Locale): string => {
  const F = r.value ?? 0;
  const g = r.inputs?.['g'] ?? 9.81;
  if (r.inputs?.['balance'] === 1) {
    const dm = (F / g) * 1000;
    return t(l, 'balloon-lift-text-3', { dm: sig(Math.abs(dm), 3, l), value: dm >= 0 ? t(l, 'balloon-lift-text') : t(l, 'balloon-lift-text-2') });
  }
  return t(l, 'balloon-lift-text-4', { F: sig(F, 3, l) });
};
const N = (F: number, l: Locale) => `${sig(F, 3, l)} ${t(l, 'unit-sym-N')}`;

export function shown(c: LiftCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (!r || r.value === null) return '';
  if (c.step === 'shell') return massText(r.value, locale);
  if (c.step === 'size') return `D = ${sizeText(r.value, locale)}`;
  return `${liftText(r, locale)}${r.value > 0 ? t(locale, 'balloon-lift-shown') : t(locale, 'balloon-lift-shown-2')}`;
}

/** What the balloon did. */
export function say(c: LiftCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (!r || r.value === null) return '';
  if (c.step === 'shell') return t(locale, 'balloon-lift-say', { value: massText(r.value, locale) });
  if (c.step === 'size') return t(locale, 'balloon-lift-say-2', { value: sizeText(r.value, locale) });
  const up = r.value > 0;
  return t(locale, 'balloon-lift-say-5', { r: liftText(r, locale).replace(/^./, (s) => s.toUpperCase()), value: up ? t(locale, 'balloon-lift-say-3') : t(locale, 'balloon-lift-say-4') });
}

/** The board: the shell, the volume; for each balloon its gas's density, the air's buoyancy, the lifting force. */
export function board(c: LiftCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const r = trace[0];
  if (!r || r.value === null) return [];
  if (c.step === 'shell') return [{ id: `bm:${i}`, title: t(locale, 'balloon-lift-board-title'), formula: `m_об = ${massText(r.value, locale)}` }];
  if (c.step === 'size') return [{ id: `bv:${i}`, title: t(locale, 'balloon-lift-board-title-2'), formula: 'V = π·D³/6', numbers: `≈ ${sig(r.inputs?.['volume'] ?? 0, 3, locale)} ${t(locale, 'unit-sym-m3')}` }];
  const inp = r.inputs ?? {};
  const kgm3 = t(locale, 'unit-sym-kg-per-m3');
  const name = c.step === 'lift' ? ({ helium: t(locale, 'balloon-lift-name-helium-2'), hydrogen: t(locale, 'balloon-lift-name-hydrogen-2'), 'hot-air': t(locale, 'balloon-lift-name-hot-air-2'), air: t(locale, 'balloon-lift-name-air-2') })[c.gas] : '';
  const size = c.step === 'lift' ? sizeText(c.diameter, locale) : '';
  return [
    { id: `bd:${i}`, title: t(locale, 'balloon-lift-board-title-3', { name, size }), formula: 'ρ_пов, ρ_г', numbers: `${sig(inp['airDensity'] ?? 0, 3, locale)} ; ${sig(inp['gasDensity'] ?? 0, 3, locale)} ${kgm3}` },
    { id: `bf:${i}`, title: t(locale, 'balloon-lift-board-title-4', { name, size }), formula: 'F = (ρ_пов − ρ_г)·g·V − m_об·g', numbers: `≈ ${N(r.value, locale)}` },
  ];
}
