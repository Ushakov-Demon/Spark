import type { Command } from '../../core/commands.js';
import type { ExperimentResult } from '../../core/experiment.js';
import type { ExpectationOutcome, KnobSolution } from '../../core/expectation.js';
import { entityId } from '../../core/ids.js';
import type { SystemState } from '../../core/state.js';
import { ZERO_CELSIUS_IN_KELVIN } from '../../core/units.js';
import { h, list, note, p, type Block } from '../../explain/blocks.js';
import { formatQuantity, type ExplainContext } from '../../explain/format.js';
import { entityLabel } from '../../explain/report.js';
import { tr, type Locale } from '../../knowledge/i18n.js';
import { atLeast } from '../../knowledge/levels.js';
import { isHeater, isThermalBody } from './entities.js';

/** How much one participant shifted the final temperature of the observed body. */
export interface Contribution {
  readonly connection: string;
  readonly other: string;
  /** Net energy into the observed body over the run, J. */
  readonly energy: number;
  /** Equivalent shift of the final temperature, K (energy / final heat capacity). */
  readonly deltaT: number;
}

export interface TemperatureAnalysis {
  readonly entity: string;
  readonly final: number;
  /**
   * What a paper calculation gives: only the substances mixed into this body,
   * no container, no air, no heater (heat balance of the poured portions).
   */
  readonly naive: number;
  readonly contributions: readonly Contribution[];
  /** Temperature shift from manual interventions ("god mode"), K. */
  readonly interventions: number;
  /** final − (naive + Σ contributions + interventions); ≈ 0 up to rounding. */
  readonly residual: number;
}

const bodyU = (s: SystemState, id: string): { u: number; c: number } => {
  const e = s.entities[entityId(id)];
  if (!e || !(isThermalBody(e) || isHeater(e))) throw new Error(`"${id}" is not a thermal body`);
  const c = e.params.mass * e.params.specificHeat;
  return { u: c * (e.state.temperature - ZERO_CELSIUS_IN_KELVIN), c };
};

/**
 * Splits the final temperature of a body into "what simple heat balance
 * predicts" plus what every other participant added or took away. Exact,
 * because the solver accounts every joule per connection.
 */
export function analyzeTemperature<C extends Command>(result: ExperimentResult<C>, id: string): TemperatureAnalysis {
  const start = bodyU(result.initial, id);
  const end = bodyU(result.final, id);
  let matter = 0;
  let intervention = 0;
  for (const e of result.log) {
    if (!e.ok) continue;
    const c = e.command as unknown as { type: string; into?: string; entity?: string };
    if (c.type === 'thermal.pour' && c.into === id) matter += e.externalEnergy;
    if (c.type === 'thermal.temperature.set' && c.entity === id) intervention += e.externalEnergy;
  }
  const contributions: Contribution[] = [];
  for (const t of result.transfers.values()) {
    if (t.a !== id && t.b !== id) continue;
    const energy = t.b === id ? t.amount : -t.amount;
    contributions.push({ connection: t.connection, other: t.a === id ? t.b : t.a, energy, deltaT: energy / end.c });
  }
  contributions.sort((x, y) => Math.abs(y.deltaT) - Math.abs(x.deltaT));
  const finalT = end.u / end.c + ZERO_CELSIUS_IN_KELVIN;
  const naive = (start.u + matter) / end.c + ZERO_CELSIUS_IN_KELVIN;
  const interventions = intervention / end.c;
  const residual = finalT - (naive + contributions.reduce((sum, c) => sum + c.deltaT, 0) + interventions);
  return { entity: id, final: finalT, naive, contributions, interventions, residual };
}

interface DebriefMessages {
  title: string;
  result(name: string, t: string): string;
  prediction: string;
  goal: string;
  hit(dev: string, tol: string): string;
  missHigher(dev: string): string;
  missLower(dev: string): string;
  naive(t: string): string;
  why: string;
  noOthers: string;
  took(name: string, dT: string, energy: string | null): string;
  gave(name: string, dT: string, energy: string | null): string;
  interventions(dT: string): string;
  predictionWasNaive(others: string): string;
  predictionNote: string;
  change: string;
  knobFound(label: string, from: string, to: string, achieved: string): string;
  knobUnreachable(label: string, closest: string, achieved: string): string;
  residual(r: string): string;
  tryNext: string;
}

const MSG: Readonly<Record<Locale, DebriefMessages>> = {
  uk: {
    title: 'Розбір результату',
    result: (n, t) => `«${n}» наприкінці досліду: ${t}.`,
    prediction: 'Прогноз',
    goal: 'Ціль',
    hit: (d, tol) => `влучно: різниця ${d} (допуск ±${tol}).`,
    missHigher: (d) => `результат вищий на ${d}.`,
    missLower: (d) => `результат нижчий на ${d}.`,
    naive: (t) => `Простий розрахунок за рівнянням теплового балансу (лише змішані порції речовини, без інших тіл) дає ${t}.`,
    why: 'Чому результат інший — в досліді брали участь й інші тіла:',
    noOthers: 'Інші тіла майже не вплинули: простий розрахунок тут працює.',
    took: (n, d, e) => `«${n}»: −${d} (теплоту забрано${e ? `, ${e}` : ''})`,
    gave: (n, d, e) => `«${n}»: +${d} (теплоту додано${e ? `, ${e}` : ''})`,
    interventions: (d) => `ручне втручання змінило температуру на ${d}`,
    predictionWasNaive: (o) =>
      `Прогноз збігається з простим розрахунком: рівняння теплового балансу застосовано правильно. Бракує лише врахування інших учасників (${o}) — справжній дослід завжди має таких «невидимих учасників».`,
    predictionNote: 'Корисно порівняти прогноз із простим розрахунком і з результатом: де саме з’явилася різниця?',
    change: 'Що змінити, щоб влучити в ціль (кожен варіант окремо):',
    knobFound: (l, from, to, a) => `${l}: ${to} замість ${from} → вийде ${a}`,
    knobUnreachable: (l, c, a) => `${l}: лише цим не влучити — навіть за ${c} вийде ${a}`,
    residual: (r) => `Сума внесків збігається з результатом до ${r} (похибка округлення).`,
    tryNext: 'Можна змінити умови — матеріали, маси, час — і подивитися, як зміняться внески.',
  },
  en: {
    title: 'Debrief',
    result: (n, t) => `"${n}" at the end of the experiment: ${t}.`,
    prediction: 'Prediction',
    goal: 'Goal',
    hit: (d, tol) => `hit: off by ${d} (tolerance ±${tol}).`,
    missHigher: (d) => `the result is ${d} higher.`,
    missLower: (d) => `the result is ${d} lower.`,
    naive: (t) => `A simple heat-balance calculation (only the mixed portions, no other bodies) gives ${t}.`,
    why: 'Why the result differs — other bodies took part in the experiment:',
    noOthers: 'Other bodies barely mattered: the simple calculation works here.',
    took: (n, d, e) => `"${n}": −${d} (heat taken${e ? `, ${e}` : ''})`,
    gave: (n, d, e) => `"${n}": +${d} (heat added${e ? `, ${e}` : ''})`,
    interventions: (d) => `manual intervention changed the temperature by ${d}`,
    predictionWasNaive: (o) =>
      `The prediction matches the simple calculation: the heat balance was applied correctly. What is missing are the other participants (${o}) — a real experiment always has such «invisible participants».`,
    predictionNote: 'Compare the prediction with the simple calculation and with the result: where exactly did the difference appear?',
    change: 'What to change to hit the goal (each option on its own):',
    knobFound: (l, from, to, a) => `${l}: ${to} instead of ${from} → gives ${a}`,
    knobUnreachable: (l, c, a) => `${l}: this alone cannot hit the goal — even at ${c} the result is ${a}`,
    residual: (r) => `The contributions add up to the result within ${r} (rounding error).`,
    tryNext: 'Change the conditions — materials, masses, time — and see how the contributions change.',
  },
};

export interface DebriefInput<C extends Command> {
  readonly result: ExperimentResult<C>;
  readonly analysis: TemperatureAnalysis;
  readonly outcome?: ExpectationOutcome;
  /** Only for goals that were missed. */
  readonly solutions?: readonly KnobSolution[];
  readonly ctx: ExplainContext;
}

export function buildDebrief<C extends Command>({ result, analysis, outcome, solutions, ctx }: DebriefInput<C>): Block[] {
  const { locale, level } = ctx;
  const m = MSG[locale];
  const T = (k: number) => formatQuantity(k, 'K', ctx);
  const dT = (k: number) => formatQuantity(Math.abs(k), 'ΔK', ctx);
  const J = (j: number) => (atLeast(level, 'school') ? formatQuantity(Math.abs(j), 'J', ctx) : null);
  const name = (id: string) => entityLabel(result.final, id, locale);
  const out: Block[] = [h(2, m.title), p(m.result(name(analysis.entity), T(analysis.final)))];

  if (outcome) {
    const { expectation: x, deviation, hit } = outcome;
    const head = `${x.kind === 'goal' ? m.goal : m.prediction}: ${T(x.value)} → `;
    const verdict = hit ? m.hit(dT(deviation), dT(x.tolerance)) : deviation > 0 ? m.missHigher(dT(deviation)) : m.missLower(dT(deviation));
    out.push(p(head + verdict));
  }

  out.push(p(m.naive(T(analysis.naive))));
  const visible = analysis.contributions.filter((c) => Math.abs(c.deltaT) >= 0.05);
  if (!visible.length) out.push(p(m.noOthers));
  else {
    out.push(p(m.why));
    const items = visible.map((c) => (c.deltaT < 0 ? m.took : m.gave)(name(c.other), dT(c.deltaT), J(c.energy)));
    if (Math.abs(analysis.interventions) >= 0.05) items.push(m.interventions(dT(analysis.interventions)));
    out.push(list(items));
  }

  if (outcome?.expectation.kind === 'prediction' && !outcome.hit) {
    const nearNaive = Math.abs(outcome.expectation.value - analysis.naive) <= outcome.expectation.tolerance;
    const others = visible.map((c) => `«${name(c.other)}»`).join(', ');
    out.push(p(nearNaive && others ? m.predictionWasNaive(others) : m.predictionNote));
  }

  if (outcome?.expectation.kind === 'goal' && !outcome.hit && solutions?.length) {
    out.push(p(m.change));
    out.push(
      list(
        solutions.map((s) => {
          // Suggestions are for doing, not for reading: round them like a student would measure.
          const fmt = (v: number) => formatQuantity(v, s.knob.unit, { locale, level: level === 'expert' ? 'expert' : 'novice' });
          return s.status === 'found'
            ? m.knobFound(tr(s.knob.label, locale), fmt(s.knob.current), fmt(s.value), T(s.achieved))
            : m.knobUnreachable(tr(s.knob.label, locale), fmt(s.closest), T(s.achievedAtClosest));
        }),
      ),
    );
  }

  if (atLeast(level, 'expert')) out.push(p(m.residual(formatQuantity(Math.abs(analysis.residual), 'ΔK', ctx))));
  if (!outcome || outcome.hit) out.push(note('info', m.tryNext));
  return out;
}
