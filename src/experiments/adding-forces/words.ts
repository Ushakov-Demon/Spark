import type { MeasurementRecord } from '../../core/trace.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { FORCES_TEXT, forcesPlace, type ForcesCommand } from './bench.js';


export const text = (c: ForcesCommand): StepText => FORCES_TEXT['lab.forces'](c);

export const busy = (): LocalizedText => msg('adding-forces-busy');

export const shown = (_c: ForcesCommand, recs: readonly MeasurementRecord[], locale: Locale): string => recs.map((x) => formatMeasured('force', x.value, x.inputs?.['division'] ?? 0.1, locale)).join(' · ');

/** What the dynamometers show — one, both, or up and down. */
export function say(c: ForcesCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const fs = recs.map((x) => formatMeasured('force', x.value, x.inputs?.['division'] ?? 0.1, locale));
  if (c.hold === 'one') return t(locale, 'adding-forces-say', { fs: fs[0] });
  if (c.hold === 'two') return t(locale, 'adding-forces-say-2', { fs: fs[0], fs2: fs[1] });
  return t(locale, 'adding-forces-say-3', { fs: fs[0], fs2: fs[1] });
}

/** The board's lines for a done step. */
export function board(c: ForcesCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const out: BoardLine[] = [];
  const recs = trace.filter((x): x is MeasurementRecord => x.kind === 'measurement' && x.quantity === 'force' && x.value !== null);
  const [a, b] = recs;
  const F = (x: MeasurementRecord | undefined) => formatMeasured('force', x?.value ?? 0, x?.inputs?.['division'] ?? 0.1, locale);
  const sum = (x: number) => formatMeasured('force', x, Math.min(a?.inputs?.['division'] ?? 0.1, b?.inputs?.['division'] ?? 0.1), locale);
  if (!a) return out;
  if (c.hold === 'one') {
    out.push({ id: `fw:${i}`, title: t(locale, 'adding-forces-board-title'), formula: `F = ${F(a)}` });
    return out;
  }
  if (!b) return out;
  if (c.hold === 'two') {
    out.push({ id: `ft:${i}`, title: t(locale, 'adding-forces-board-title-2', { where: forcesPlace(Number(c.at), locale) }), formula: `F₁ = ${F(a)}; F₂ = ${F(b)}` });
    out.push({ id: `rs:${i}`, title: t(locale, 'adding-forces-board-title-3'), formula: 'R = F₁ + F₂', numbers: `${F(a)} + ${F(b)} = ${sum(a.value! + b.value!)}` });
    return out;
  }
  out.push({ id: `fd:${i}`, title: t(locale, 'adding-forces-board-title-4'), formula: `F₁ = ${F(a)} ↑; F₂ = ${F(b)} ↓` });
  out.push({ id: `rs:${i}`, title: t(locale, 'adding-forces-board-title-5'), formula: 'R = F₁ − F₂', numbers: `${F(a)} − ${F(b)} = ${sum(a.value! - b.value!)}` });
  return out;
}
