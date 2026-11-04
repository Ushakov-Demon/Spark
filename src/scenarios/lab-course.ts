import type { ExperimentLogEntry, ExperimentResult } from '../core/experiment.js';
import type { SystemState } from '../core/state.js';
import { ZERO_CELSIUS_IN_KELVIN } from '../core/units.js';
import { bodyMass } from '../domains/thermal/entities.js';
import { h, list, type Block } from '../explain/blocks.js';
import { formatDuration, formatQuantity, sig, type ExplainContext } from '../explain/format.js';
import { COOLERS } from '../equipment/coolers.js';
import { HEATERS } from '../equipment/heaters.js';
import { SUPPLIES, supplyVoltage } from '../equipment/supplies.js';
import { tr } from '../knowledge/i18n.js';
import { t } from '../knowledge/messages.js';
import { LAB_KNOWLEDGE, type LabCommand } from './lab-knowledge.js';
import { OPERATIONS } from './operations/index.js';
import { sampleOf, type LabParams, type LabStatus } from './thermal-lab.js';

/** A step of the experiment as it happened (the page's protocol, a replayed recording). */
export interface CourseStep {
  readonly params: LabParams;
  readonly result: ExperimentResult<LabCommand>;
  readonly status: LabStatus;
}

/** Where the step happened: "Морозильна камера, −18 °C", "Електроплита", "у кімнаті". */
export function stepPlace(p: LabParams, l: 'uk' | 'en'): string {
  if (p.supply) return `${tr(SUPPLIES[p.supply.id].name, l)}, ${formatQuantity(supplyVoltage(SUPPLIES[p.supply.id], p.supply.knob), 'V', { locale: l, level: 'school' })}`;
  if (p.heater) return tr(HEATERS[p.heater.id].name, l);
  if (p.cooler) return `${tr(COOLERS[p.cooler.id].name, l)}, ${String(p.cooler.setpoint).replace('-', '−')} °C`;
  return t(l, 'lab-course-step-place');
}

/** Temperature to a tenth of a degree, as a thermometer shows it ("−0,0" is just 0). */
const C = (k: number, l: 'uk' | 'en') => {
  const c = Math.round((k - ZERO_CELSIUS_IN_KELVIN) * 10) / 10;
  return `${sig(c === 0 ? 0 : c, 4, l).replace('-', '−')} °C`;
};
/** Share of the sample that is solid now. */
const solidShare = (s: SystemState) => {
  const b = sampleOf(s);
  const mix = b.state.mixture;
  return mix ? (mix.water > 0 ? mix.ice / mix.water : 0) : (b.state.solidFraction ?? 0);
};
/** Water that left into the air so far, kg. */
const toAir = (s: SystemState) => (sampleOf(s).state.evaporated ?? 0) + (sampleOf(s).state.boiledOff ?? 0);

function outcome(st: LabStatus, length: number, ctx: ExplainContext): string {
  const D = (s: number) => formatDuration(s, ctx.locale);
  switch (st.kind) {
    case 'reached':
      return t(ctx.locale, 'lab-course-outcome', { at: D(st.at) });
    case 'will-reach':
      return t(ctx.locale, 'lab-course-outcome-2', { length: D(length) });
    case 'decomposes':
      return t(ctx.locale, 'lab-course-outcome-3', { at: D(st.at) });
    case 'stalls':
      return t(ctx.locale, 'lab-course-outcome-4', { limit: C(st.limit, ctx.locale) });
    case 'impossible':
    case 'no-heat':
      return `✗ ${tr(st.reason, ctx.locale)}`;
    case 'off':
      return t(ctx.locale, 'lab-course-outcome-5');
    case 'vessel-fails':
      return t(ctx.locale, 'lab-course-outcome-6', { what: tr(st.what, ctx.locale), limit: C(st.limit + ZERO_CELSIUS_IN_KELVIN, ctx.locale) });
  }
}

/**
 * The course of the experiment: every step in order, what was done before,
 * during and after it (salt added, the vessel weighed, a knob turned) and how
 * it ended — temperature, ice, water gone into the air.
 */
export function labCourse(steps: readonly CourseStep[], ctx: ExplainContext): Block[] {
  const out: Block[] = [h(2, t(ctx.locale, 'lab-course-out'))];
  const describe = (e: ExperimentLogEntry<LabCommand>, s: SystemState) => {
    const text = LAB_KNOWLEDGE.describeCommand(e, ctx, s);
    return e.ok ? text : `${text} — ${tr(e.error, ctx.locale)}`;
  };
  steps.forEach((st, i) => {
    const r = st.result;
    const start = r.initial.time;
    const length = r.final.time - start;
    // Actions in the pause after a step take no time, so the end of the run is the final state.
    const end = r.final;
    const before = r.log.filter((e) => e.time <= start + 1e-9);
    const during = r.log.filter((e) => e.time > start + 1e-9 && e.time < r.final.time - 1e-9);
    const after = length > 0 ? r.log.filter((e) => e.time >= r.final.time - 1e-9 && e.time > start + 1e-9) : [];
    const items: string[] = [];
    for (const e of before) items.push(`${t(ctx.locale, 'lab-course-text')} — ${describe(e, r.final)}`);
    if (length > 0) {
      const T0 = sampleOf(r.initial).state.temperature;
      const T1 = sampleOf(end).state.temperature;
      const ice0 = solidShare(r.initial);
      const ice1 = solidShare(end);
      const gone = toAir(end) - toAir(r.initial);
      const parts = [`${C(T0, ctx.locale)} → ${C(T1, ctx.locale)}`];
      if (Math.abs(ice1 - ice0) > 0.005 || ice1 > 0.005) parts.push(t(ctx.locale, 'lab-course-text-2', { ice0: String(Math.round(ice0 * 100)), ice1: String(Math.round(ice1 * 100)) }));
      if (gone > 1e-6) parts.push(t(ctx.locale, 'lab-course-text-3', { gone: formatQuantity(gone, 'kg', ctx) }));
      parts.push(t(ctx.locale, 'lab-course-text-4', { end: formatQuantity(bodyMass(sampleOf(end)), 'kg', ctx) }));
      items.push(`${t(ctx.locale, 'lab-course-text-5')}: ${parts.join('; ')}`);
      for (const e of during) items.push(`${t(ctx.locale, 'lab-course-text-6')} ${formatDuration(e.time - start, ctx.locale)} — ${describe(e, r.final)}`);
      items.push(outcome(st.status, length, ctx));
      for (const e of after) items.push(`${t(ctx.locale, 'lab-course-text-7')} — ${describe(e, r.final)}`);
    } else if (!before.length) items.push(t(ctx.locale, 'lab-course-text-8'));
    const label = tr(OPERATIONS[st.params.action].label, ctx.locale).replace('…', '');
    out.push(h(3, `${t(ctx.locale, 'lab-course-text-9')} ${i + 1}. ${label} — ${stepPlace(st.params, ctx.locale)}`));
    out.push(list(items));
  });
  return out;
}
