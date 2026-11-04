import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { NUMBER_LOCALE, tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingsOf } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { PLANETS, PLANETS_TEXT, planetIds, SUN_RADIUS, type PlanetsCommand } from './bench.js';

export const setup: LocalizedText = msg('solar-system-model-setup');

export const text = (c: PlanetsCommand): StepText => PLANETS_TEXT['lab.planets'](c);

export const busy = (c: PlanetsCommand): LocalizedText =>
  c.step === 'kepler' ? msg('solar-system-model-busy') : c.step === 'voyager' ? msg('solar-system-model-busy-2') : msg('solar-system-model-busy-3');


export function shown(c: PlanetsCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const ids = planetIds();
  const one = (x: number, d = 1) => new Intl.NumberFormat(NUMBER_LOCALE[locale], { maximumFractionDigits: d }).format(x);
  const name = (r: MeasurementRecord) => tr(PLANETS[ids[r.inputs?.['planet'] ?? 0]!].name, locale);
  if (c.step === 'ball') return t(locale, 'solar-system-model-shown', { recs: one((recs[0]?.value ?? 0) * 100), value: one(1 / (recs[0]?.inputs?.['scale'] ?? 1) / 1e9) });
  const two = (x: number) => new Intl.NumberFormat(NUMBER_LOCALE[locale], { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(x);
  if (c.step === 'kepler') return `T²/a³: ${recs.map((r) => `${name(r)} ${two(r.value ?? 0)}`).join(', ')}`;
  if (c.step === 'voyager') return t(locale, 'solar-system-model-shown-2', { recs: one(recs[0]?.value ?? 0, 0) });
  return recs.map((r) => `${name(r)} — ${one(r.value ?? 0)} ${t(locale, 'unit-sym-m')}, ${one((r.inputs?.['size'] ?? 0) * 1000)} ${t(locale, 'unit-sym-mm')}`).join('; ');
}

/** The board's lines for a done step. */
export function board(c: PlanetsCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  void before;
  const recs = trace;
  const ids = planetIds();
  const nm = (k: number) => tr(PLANETS[ids[k]!]!.name, locale);
  const m = t(locale, 'unit-sym-m');
  const mm = (x: number) => `${n(x * 1000, 2)} ${t(locale, 'unit-sym-mm')}`;
  const step = c.step;
  if (step === 'ball') {
    const scale = recs[0]?.inputs?.['scale'] ?? 1;
    out.push({ id: `pb:${i}`, title: t(locale, 'solar-system-model-board-title', { recs: n(recs[0]!.value! * 100, 3) }), formula: 'k = d / D☉', numbers: `${n(recs[0]!.value!, 2)} ${m} / ${n(2 * SUN_RADIUS.value, 7)} ${t(locale, 'unit-sym-km')} ≈ 1 : ${n(1 / scale / 1e9, 2)} ${t(locale, 'solar-system-model-board-numbers')}` });
  } else if (step === 'inner' || step === 'outer') {
    // (One planet a step on the board — the Earth, Neptune; all of them are in the protocol.)
    const key = recs.find((x) => ids[x.inputs?.['planet'] ?? -1] === (step === 'inner' ? 'earth' : 'neptune'));
    if (key) out.push({ id: `${step === 'inner' ? 'pe' : 'po'}:${i}`, title: t(locale, 'solar-system-model-board-title-2', { planet: nm(key.inputs?.['planet'] ?? 0) }), formula: 'L = k·a, d = k·D', numbers: `${n(key.value!, 3)} ${m}; ${mm(key.inputs?.['size'] ?? 0)}` });
  } else if (step === 'kepler') {
    const v = recs.map((x) => x.value!);
    const f2 = (x: number) => new Intl.NumberFormat(NUMBER_LOCALE[locale], { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(x);
    out.push({ id: `pk:${i}`, title: t(locale, 'solar-system-model-board-title-3'), formula: 'T² / a³ ≈ 1', numbers: `${f2(Math.min(...v))} … ${f2(Math.max(...v))}` });
  } else if (step === 'voyager') {
    out.push({ id: `pv:${i}`, title: t(locale, 'solar-system-model-board-title-4'), formula: 'L = k · 40,5 · a⊕'.replace(',', t(locale, 'solar-system-model-board-formula')), numbers: `≈ ${n(recs[0]!.value!, 3)} ${m}; ${t(locale, 'solar-system-model-board-numbers-2')} ${mm(recs[0]!.inputs?.['earth'] ?? 0)}` });
  }
  return out;
}
