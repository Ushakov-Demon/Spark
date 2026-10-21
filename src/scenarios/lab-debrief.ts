import type { Command } from '../core/commands.js';
import type { ExperimentResult } from '../core/experiment.js';
import { createSimulation, type Simulation } from '../core/simulation.js';
import { seconds } from '../core/units.js';
import { liquidHeat } from '../substances/types.js';
import { createCommandRegistry } from '../core/commands.js';
import { runExperiment } from '../core/experiment.js';
import { energySplit } from '../domains/thermal/energy.js';
import { THERMAL_COMMANDS, type ThermalCommand } from '../domains/thermal/commands.js';
import { h, list, p as para, type Block } from '../explain/blocks.js';
import { formatDuration, formatQuantity, sig, type ExplainContext } from '../explain/format.js';
import { HEATERS } from '../equipment/heaters.js';
import { VESSELS } from '../equipment/vessels.js';
import { canHeat, powerAt } from '../equipment/compatibility.js';
import { tr, type Locale, type LocalizedText } from '../knowledge/i18n.js';
import { SUBSTANCES } from '../substances/catalog.js';
import { labGoalReached, labSetup, SAMPLE_ID, type LabParams } from './thermal-lab.js';
import { OPERATIONS } from './operations/index.js';

/** What the experimenter expected: a time to reach the goal. */
export interface LabExpectation {
  readonly kind: 'prediction' | 'goal';
  readonly seconds: number;
  /** Acceptable deviation, s (default: 10 % or 30 s, whichever is larger). */
  readonly tolerance?: number;
}

/** Time to reach the goal with these parameters, s (Infinity if not within `maxHours`). */
export function timeToGoal(p: LabParams, simulation: Simulation, maxHours = 12): number {
  const sim = createSimulation({ solvers: simulation.solvers, fixedDt: seconds(2) });
  const setup = labSetup(p);
  const r = runExperiment<ThermalCommand>({
    initial: setup.state,
    simulation: sim,
    commands: createCommandRegistry<ThermalCommand>(THERMAL_COMMANDS),
    duration: seconds(maxHours * 3600),
    sampleEvery: seconds(600),
    until: (s) => labGoalReached(p, s),
  });
  return labGoalReached(p, r.final) ? r.final.time : Infinity;
}

/**
 * "On paper": the energy the substance itself needs (warming + melting, no losses,
 * no vessel) divided by the heater's power. Only for heating actions.
 */
export function paperTime(p: LabParams): number | undefined {
  const op = OPERATIONS[p.action];
  if (op.uses === 'cooler' || !p.heater) return undefined;
  const sub = SUBSTANCES[p.substance];
  const heater = HEATERS[p.heater.id];
  const power = canHeat(heater, VESSELS[p.vessel], p.material, p.size).ok ? powerAt(heater, p.heater.rating, p.heater.knob) : 0;
  if (!(power > 0)) return undefined;
  const m = (p.liters / 1000) * sub.liquid.density.value;
  const c = liquidHeat(sub).value;
  let q = 0;
  let t = p.startTemp;
  const tm = sub.freezing?.point.value;
  if (tm !== undefined && t < tm) {
    q += m * sub.freezing!.solidSpecificHeat.value * (tm - t) + m * sub.freezing!.latentHeat.value;
    t = tm;
  }
  // Each operation says where "done" is: the target, the boiling point, + boiling the water away…
  const goal = op.paper?.(p, sub, m);
  q += m * c * Math.max(0, (goal?.end ?? t) - t) + (goal?.extra ?? 0);
  return q / power;
}

/** Where the heater's energy went, with evaporation separated from heat lost to the air. */
export function lossBreakdown<C extends Command>(result: ExperimentResult<C>): { produced: number; parts: { key: string; energy: number }[] } {
  const split = energySplit(result.initial, result.final);
  // Vapour that evaporated into the surroundings (air, freezer…), per reservoir. Vapour condensing
  // under a lid is not counted here — its heat stays in the lid.
  const intoSurroundings = new Map<string, number>();
  for (const t of result.transfers.values()) {
    if (!t.connection.endsWith(':vapour') || t.a !== SAMPLE_ID) continue;
    if (result.final.entities[t.b as never]?.kind !== 'thermal.reservoir') continue;
    intoSurroundings.set(t.b, (intoSurroundings.get(t.b) ?? 0) + t.amount);
  }
  // Flame heat that went past the vessel straight into the surroundings (supply links of a burner).
  const pastVessel = new Map<string, number>();
  for (const t of result.transfers.values()) {
    if (!t.connection.includes('=>') || result.final.entities[t.b as never]?.kind !== 'thermal.reservoir') continue;
    pastVessel.set(t.b, (pastVessel.get(t.b) ?? 0) + t.amount);
  }
  const flame = [...pastVessel.values()].reduce((a, b) => a + b, 0);
  const parts: { key: string; energy: number }[] = flame > 0 ? [{ key: 'flame', energy: flame }] : [];
  let vapour = [...intoSurroundings.values()].reduce((a, b) => a + b, 0);
  for (const s of split.shares) {
    if (s.role === 'vapour') vapour += s.energy;
    else if (s.entity === SAMPLE_ID) parts.push({ key: 'sample', energy: s.energy });
    else if (s.role === 'source') parts.push({ key: 'heater', energy: s.energy });
    // Bodies put into the liquid (a metal block) are not the vessel: one share for them all.
    else if (s.role === 'body' && s.entity.startsWith(`${SAMPLE_ID}+`)) {
      const x = parts.find((q) => q.key === 'pieces');
      if (x) x.energy += s.energy;
      else parts.push({ key: 'pieces', energy: s.energy });
    } else if (s.role === 'body') parts.push({ key: s.entity.endsWith('.lid') ? 'lid' : 'vessel', energy: s.energy });
    else if (s.role === 'room') parts.push({ key: 'air', energy: s.energy - (intoSurroundings.get(s.entity) ?? 0) - (pastVessel.get(s.entity) ?? 0) });
  }
  // Boiled dry: the substance's own heat left with the steam too — count it there, not as a negative share.
  const sample = parts.findIndex((x) => x.key === 'sample');
  if (sample >= 0 && parts[sample]!.energy < 0 && vapour > 0) {
    vapour += parts[sample]!.energy;
    parts.splice(sample, 1);
  }
  parts.push({ key: 'vapour', energy: vapour });
  return { produced: split.produced, parts: parts.filter((x) => Math.abs(x.energy) > 1) };
}

interface Option {
  readonly label: LocalizedText;
  readonly from: string;
  readonly to: string;
  readonly time: number;
}

/** Ways to hit a time goal, each found by re-running the experiment. */
export function goalOptions(p: LabParams, simulation: Simulation, targetSeconds: number, locale: Locale): Option[] {
  const out: Option[] = [];
  const within = (t: number) => t <= targetSeconds;
  // Discrete choices: heater models, lid.
  if (p.heater) {
    const heater = HEATERS[p.heater.id];
    for (const r of heater.spec.ratings) {
      if (r === p.heater.rating) continue;
      const t = timeToGoal({ ...p, heater: { ...p.heater, rating: r, knob: 1 } }, simulation);
      const W = (x: number) => formatQuantity(x, 'W', { locale, level: 'school' });
      if (within(t)) out.push({ label: { uk: 'Інша модель нагрівача, на повну', en: 'Another heater model, at full' }, from: W(p.heater.rating), to: W(r), time: t });
    }
    if (p.heater.knob < 1 && heater.spec.control === 'knob') {
      const t = timeToGoal({ ...p, heater: { ...p.heater, knob: 1 } }, simulation);
      if (within(t)) out.push({ label: { uk: 'Повернути ручку на максимум', en: 'Turn the knob to maximum' }, from: `${Math.round(p.heater.knob * 100)} %`, to: '100 %', time: t });
    }
  }
  if (VESSELS[p.vessel].spec.lid === 'optional' && !p.lid) {
    const t = timeToGoal({ ...p, lid: true }, simulation);
    if (within(t)) out.push({ label: { uk: 'Накрити кришкою', en: 'Put a lid on' }, from: '—', to: '✓', time: t });
  }
  // Continuous: less substance (bisection on amount).
  const tooSlow = (liters: number) => timeToGoal({ ...p, liters }, simulation) > targetSeconds;
  if (tooSlow(p.liters) && !tooSlow(p.liters * 0.05)) {
    let lo = p.liters * 0.05;
    let hi = p.liters;
    for (let i = 0; i < 12; i++) {
      const mid = (lo + hi) / 2;
      if (tooSlow(mid)) hi = mid;
      else lo = mid;
    }
    const t = timeToGoal({ ...p, liters: lo }, simulation);
    const L = (x: number) => (x < 1 ? `${Math.round(x * 1000)} ${locale === 'uk' ? 'мл' : 'mL'}` : `${sig(x, 3, locale)} ${locale === 'uk' ? 'л' : 'L'}`);
    out.push({ label: { uk: 'Взяти менше речовини', en: 'Use less substance' }, from: L(p.liters), to: L(lo), time: t });
  }
  return out;
}

export interface DebriefInput<C extends Command> {
  readonly params: LabParams;
  readonly result: ExperimentResult<C>;
  readonly reachedAt: number | undefined;
  readonly expectation?: LabExpectation;
  readonly options?: readonly Option[];
  readonly ctx: ExplainContext;
}

const PART_NAMES: Readonly<Record<string, LocalizedText>> = {
  sample: { uk: 'на саму речовину (нагрівання, плавлення)', en: 'into the substance itself (warming, melting)' },
  vessel: { uk: 'на нагрівання посуду', en: 'into warming the vessel' },
  lid: { uk: 'на нагрівання кришки', en: 'into warming the lid' },
  pieces: { uk: 'на нагрівання того, що поклали в рідину', en: 'into warming what was put into the liquid' },
  heater: { uk: 'залишилось у розжареному нагрівачі', en: 'stayed in the hot heater' },
  air: { uk: 'пішло в повітря (тепловіддача)', en: 'lost to the air (heat transfer)' },
  flame: { uk: 'полум’я пройшло повз посуд', en: 'flame heat that went past the vessel' },
  vapour: { uk: 'забрала пара (випаровування й кипіння)', en: 'carried away by vapour (evaporation and boiling)' },
};

/** The "your expectation vs reality" block, shown after the headline. */
export function labDebrief<C extends Command>({ params: p, result, reachedAt, expectation: x, options, ctx }: DebriefInput<C>): Block[] {
  const { locale } = ctx;
  const uk = locale === 'uk';
  const D = (s: number) => formatDuration(s, locale);
  const J = (j: number) => formatQuantity(j, 'J', { locale, level: 'school' });
  const out: Block[] = [h(3, uk ? 'Розбір' : 'Debrief')];

  if (x) {
    const tol = x.tolerance ?? Math.max(30, 0.1 * x.seconds);
    const head = x.kind === 'goal' ? (uk ? 'Ціль' : 'Goal') : uk ? 'Прогноз' : 'Prediction';
    if (reachedAt === undefined) out.push(para(`${head}: ${D(x.seconds)} → ${uk ? 'мети не досягнуто' : 'the goal was not reached'}.`));
    else {
      const dev = reachedAt - x.seconds;
      const verdict =
        Math.abs(dev) <= tol
          ? uk ? `влучно (різниця ${D(Math.abs(dev))})` : `on target (off by ${D(Math.abs(dev))})`
          : dev > 0
            ? uk ? `насправді довше на ${D(dev)}` : `it actually took ${D(dev)} longer`
            : uk ? `насправді швидше на ${D(-dev)}` : `it was actually ${D(-dev)} faster`;
      out.push(para(`${head}: ${D(x.seconds)} → ${uk ? 'результат' : 'result'}: ${D(reachedAt)}, ${verdict}.`));
    }
  }

  const paper = paperTime(p);
  if (paper !== undefined) {
    out.push(
      para(
        uk
          ? `Розрахунок «на папері» (вся енергія нагрівача йде лише в речовину): ${D(paper)}.`
          : `"On paper" (all the heater's energy goes into the substance only): ${D(paper)}.`,
      ),
    );
    const b = lossBreakdown(result);
    if (b.produced > 0) {
      out.push(para(uk ? `Насправді з ${J(b.produced)}, які виділив нагрівач:` : `In reality, of the ${J(b.produced)} the heater released:`));
      out.push(list(b.parts.sort((a, c) => c.energy - a.energy).map((part) => `${Math.round((100 * part.energy) / b.produced)} % — ${tr(PART_NAMES[part.key] ?? { uk: part.key, en: part.key }, locale)} (${J(part.energy)})`)));
      if (x?.kind === 'prediction' && reachedAt !== undefined && Math.abs(x.seconds - paper) < Math.max(30, 0.1 * paper)) {
        out.push(
          para(
            uk
              ? 'Прогноз збігається з розрахунком «на папері»: формулу застосовано правильно. Різницю дали «невидимі учасники» — посуд, повітря, пара.'
              : 'The prediction matches the paper calculation: the formula was applied correctly. The difference comes from the «invisible participants» — vessel, air, vapour.',
          ),
        );
      }
    }
  }

  if (x?.kind === 'goal' && (reachedAt === undefined || reachedAt > x.seconds + (x.tolerance ?? Math.max(30, 0.1 * x.seconds)))) {
    if (options?.length) {
      out.push(para(uk ? 'Що змінити, щоб устигнути (кожен варіант окремо, перевірено повторним дослідом):' : 'What to change to make it in time (each option on its own, checked by re-running):'));
      out.push(list(options.map((o) => `${tr(o.label, locale)}: ${o.from} → ${o.to} — ${D(o.time)}`)));
    } else {
      out.push(para(uk ? 'Жодна окрема зміна (потужність, кришка, менше речовини) не дає вкластися в цей час.' : 'No single change (power, lid, less substance) makes it in this time.'));
    }
  }
  return out;
}
