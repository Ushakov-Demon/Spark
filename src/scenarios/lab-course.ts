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
  return l === 'uk' ? 'просто в кімнаті' : 'just in the room';
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
  const uk = ctx.locale === 'uk';
  const D = (s: number) => formatDuration(s, ctx.locale);
  switch (st.kind) {
    case 'reached':
      return uk ? `✓ мети досягнуто за ${D(st.at)}` : `✓ goal reached in ${D(st.at)}`;
    case 'will-reach':
      return uk ? `зупинено через ${D(length)}, до мети ще не дійшло` : `stopped after ${D(length)}, before the goal`;
    case 'decomposes':
      return uk ? `через ${D(st.at)} почало диміти й розкладатися` : `after ${D(st.at)} it started to smoke and break down`;
    case 'stalls':
      return uk ? `далі ${C(st.limit, ctx.locale)} не пішло — мети так не досягти` : `got no further than ${C(st.limit, ctx.locale)} — the goal is out of reach this way`;
    case 'impossible':
    case 'no-heat':
      return `✗ ${tr(st.reason, ctx.locale)}`;
    case 'off':
      return uk ? 'прилад вимкнено' : 'the device is off';
  }
}

/**
 * The course of the experiment: every step in order, what was done before,
 * during and after it (salt added, the vessel weighed, a knob turned) and how
 * it ended — temperature, ice, water gone into the air.
 */
export function labCourse(steps: readonly CourseStep[], ctx: ExplainContext): Block[] {
  const uk = ctx.locale === 'uk';
  const out: Block[] = [h(2, uk ? 'Хід досліду' : 'The course of the experiment')];
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
    for (const e of before) items.push(`${uk ? 'на початку' : 'at the start'} — ${describe(e, r.final)}`);
    if (length > 0) {
      const T0 = sampleOf(r.initial).state.temperature;
      const T1 = sampleOf(end).state.temperature;
      const ice0 = solidShare(r.initial);
      const ice1 = solidShare(end);
      const gone = toAir(end) - toAir(r.initial);
      const parts = [`${C(T0, ctx.locale)} → ${C(T1, ctx.locale)}`];
      if (Math.abs(ice1 - ice0) > 0.005 || ice1 > 0.005) parts.push(uk ? `лід: ${Math.round(ice0 * 100)} % → ${Math.round(ice1 * 100)} %` : `ice: ${Math.round(ice0 * 100)} % → ${Math.round(ice1 * 100)} %`);
      if (gone > 1e-6) parts.push(uk ? `пішло в повітря ${formatQuantity(gone, 'kg', ctx)}` : `${formatQuantity(gone, 'kg', ctx)} went into the air`);
      parts.push(uk ? `маса вмісту ${formatQuantity(bodyMass(sampleOf(end)), 'kg', ctx)}` : `contents ${formatQuantity(bodyMass(sampleOf(end)), 'kg', ctx)}`);
      items.push(`${uk ? 'дослід' : 'the run'}: ${parts.join('; ')}`);
      for (const e of during) items.push(`${uk ? 'через' : 'after'} ${formatDuration(e.time - start, ctx.locale)} — ${describe(e, r.final)}`);
      items.push(outcome(st.status, length, ctx));
      for (const e of after) items.push(`${uk ? 'після кроку' : 'after the step'} — ${describe(e, r.final)}`);
    } else if (!before.length) items.push(uk ? 'ще не починали' : 'not started yet');
    const label = tr(OPERATIONS[st.params.action].label, ctx.locale).replace('…', '');
    out.push(h(3, `${uk ? 'Крок' : 'Step'} ${i + 1}. ${label} — ${stepPlace(st.params, ctx.locale)}`));
    out.push(list(items));
  });
  return out;
}
