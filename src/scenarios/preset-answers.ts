import type { MeasurementRecord } from '../core/trace.js';
import { COMPONENTS, molarMass as molarMassOf, NACL_SOLUTE } from '../components/index.js';
import type { Command } from '../core/commands.js';
import type { ExperimentResult } from '../core/experiment.js';
import type { Simulation } from '../core/simulation.js';
import type { SystemState } from '../core/state.js';
import { ZERO_CELSIUS_IN_KELVIN } from '../core/units.js';
import { cellReading } from '../domains/electrical/conductivity.js';
import { isSupply } from '../domains/electrical/entities.js';
import { GAS_CONSTANT } from '../domains/electrical/gases.js';
import { formatDuration, formatQuantity, sig } from '../explain/format.js';
import type { Locale, LocalizedText } from '../knowledge/i18n.js';
import { paperTime, timeToGoal } from './lab-debrief.js';
import { LAB_VESSEL_ID, sampleOf, type LabParams, type LabStatus } from './thermal-lab.js';
import { formatReading, weigh } from './weighing.js';
import { SUBSTANCES } from '../substances/catalog.js';
import { formatMeasured } from './measuring.js';
import { createCommandRegistry } from '../core/commands.js';
import { createExperimentSession } from '../core/experiment.js';
import { kilograms, seconds } from '../core/units.js';
import { bodyEnergy, isThermalBody } from '../domains/thermal/entities.js';
import { solubilityAt } from '../domains/thermal/mixture.js';
import { LAB_COMMANDS, type LabCommand } from './lab-knowledge.js';
import { labGoalReached, labSetup } from './thermal-lab.js';

/**
 * Answers to the questions the ready-made experiments ask — built from what
 * really happened in this run (times, temperatures, how much froze, currents,
 * gases), comparing with a second run "in the mind" where the question is a
 * comparison. Physics facts used in the texts come from the component models.
 */
export interface PresetRun {
  /** Operation steps in order (additions are part of the state between them). */
  readonly steps: readonly { readonly params: LabParams; readonly result: ExperimentResult<Command>; readonly status: LabStatus }[];
  readonly simulation: Simulation;
  /** Everything measured during the experiment, in order (scales, marks, dynamometer). */
  readonly readings?: readonly { readonly command: { readonly type: string } & Record<string, unknown>; readonly record: MeasurementRecord }[];
}
export interface PresetAnswer {
  /** The Professor's short line. */
  readonly say: LocalizedText;
  /** The answer itself, a few sentences. */
  readonly text: LocalizedText;
  /** Which of the preset's choices this run proved right (absent — the run cannot tell). */
  readonly correct?: string;
}

type Step = PresetRun['steps'][number];
const both = (f: (l: Locale) => string): LocalizedText => ({ uk: f('uk'), en: f('en') });
const C = (k: number, l: Locale) => `${sig(k - ZERO_CELSIUS_IN_KELVIN, 3, l).replace('-', '−')} °C`;
const D = (s: number, l: Locale) => formatDuration(s, l);
/** Current in readable units: 27 мкА, 35 мА, 1,67 А. */
const A = (amps: number, l: Locale) =>
  amps < 1e-3 ? `${sig(amps * 1e6, 2, l)} ${l === 'uk' ? 'мкА' : 'µA'}` : amps < 0.1 ? `${sig(amps * 1e3, 2, l)} ${l === 'uk' ? 'мА' : 'mA'}` : formatQuantity(amps, 'A', { locale: l, level: 'school' });
const Q = (v: number, unit: string, l: Locale) => formatQuantity(v, unit, { locale: l, level: 'school' });
const reachedAt = (s: Step) => (s.status.kind === 'reached' || s.status.kind === 'decomposes' ? s.status.at : s.result.final.time - s.result.initial.time);
const temp = (st: SystemState) => sampleOf(st).state.temperature;
const bodyMassOf = (st: SystemState) => { const b = sampleOf(st); return 'mixture' in b.state && b.state.mixture ? b.state.mixture.water + b.state.mixture.salt : b.params.mass; };
const K0 = ZERO_CELSIUS_IN_KELVIN;
const soluteMolarMass = (id: string) => molarMassOf(COMPONENTS[id as keyof typeof COMPONENTS]) ?? 1;
const LF_KJ = COMPONENTS.water.melting!.latentHeat!.value / 1000;
const CW = COMPONENTS.water.phases.liquid!.specificHeat!.value;

/** Seconds (from the step start) when ice first appeared, and the temperature then. */
function firstIce(s: Step): { at: number; T: number } | undefined {
  const x = s.result.samples.find((st) => (sampleOf(st).state.solidFraction ?? 0) > 0);
  return x ? { at: x.time - s.result.initial.time, T: temp(x) } : undefined;
}
/** How long the solid fraction was between 0 and 1 (a melting or freezing plateau), s. */
function plateau(s: Step): number {
  const samples = s.result.samples;
  let t = 0;
  for (let i = 1; i < samples.length; i++) {
    const f = sampleOf(samples[i]!).state.solidFraction ?? 0;
    if (f > 0 && f < 1) t += samples[i]!.time - samples[i - 1]!.time;
  }
  return t;
}
/** Mean current over a step, A, and the charge it carried, C. */
function current(s: Step): { amps: number; charge: number; time: number } {
  const a = Object.values(s.result.initial.entities).find(isSupply);
  const b = Object.values(s.result.final.entities).find(isSupply);
  if (!a || !b) return { amps: 0, charge: 0, time: 0 };
  const charge = b.state.charge - a.state.charge;
  const time = s.result.final.time - s.result.initial.time;
  return { amps: time > 0 ? charge / time : 0, charge, time };
}
/** "у 3 рази", "у 2,4 раза", "у 5 разів" — "3 times". */
const times = (x: number, l: Locale): string => {
  const v = sig(x, 2, l);
  if (l !== 'uk') return `${v} times`;
  if (/[,.]/.test(v)) return `у ${v} раза`;
  const n = Number(v.replace(/\s/g, ''));
  return `у ${v} ${n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'рази' : 'разів'}`;
};
const ratio = (a: number, b: number, l: Locale) => sig(a / Math.max(b, 1e-12), 2, l);

/** The temperature right after something was poured in: what the heat balance gives (from the log), or the step's start. */
function mixedAt(s: Step): number {
  for (const e of s.result.log) if (e.ok) for (const r of e.trace) if (r.kind === 'formula' && r.formula === 'thermal.equilibrium-temperature') return r.output;
  return temp(s.result.initial);
}
/** The block put into the liquid in this step: substance, mass and the temperature it went in at. */
/** Heat the calorimeter (the vessel and its lid) gave off during the step, J (negative — it took heat). */
function cupHeatGiven(s: Step): number {
  const e = (st: SystemState) => Object.values(st.entities).filter((x) => isThermalBody(x) && (x.id === LAB_VESSEL_ID || x.id === `${LAB_VESSEL_ID}.lid`)).reduce((a, x) => a + bodyEnergy(x as never), 0);
  return e(s.result.initial) - e(s.result.final);
}
function blockOf(s: Step): { substance: string; mass: number; temperature: number } | undefined {
  const last = Object.values(s.result.final.entities).find((e) => isThermalBody(e) && e.id.startsWith('sample+'));
  if (!last || !isThermalBody(last) || !last.params.substance) return undefined;
  const first = [s.result.initial, ...s.result.samples].map((x) => x.entities[last.id]).find((e) => e && isThermalBody(e));
  return first && isThermalBody(first) ? { substance: last.params.substance, mass: last.params.mass, temperature: first.state.temperature } : undefined;
}
/** The same setup "in the mind" with another block: the common temperature it would come to, K. */
function settleWith(p: LabParams, block: { substance: string; mass: number; temperature: number }, simulation: Simulation): number {
  const s = createExperimentSession<LabCommand>({ initial: labSetup(p).state, simulation, commands: createCommandRegistry<LabCommand>(LAB_COMMANDS as never), sampleEvery: seconds(60) });
  s.apply({ type: 'thermal.add', into: 'sample', substance: block.substance, mass: kilograms(block.mass), temperature: block.temperature as never });
  s.advance(3600, (x) => labGoalReached(p, x));
  return temp(s.state);
}

type Reading = NonNullable<PresetRun['readings']>[number];
const of = (run: PresetRun, q: MeasurementRecord['quantity']): Reading[] => (run.readings ?? []).filter((r) => r.record.quantity === q && r.record.value !== null);
const mL = (m3: number, l: Locale) => `${sig(m3 * 1e6, 3, l)} ${l === 'uk' ? 'мл' : 'mL'}`;
const g = (kg: number, l: Locale) => `${sig(kg * 1000, 4, l)} ${l === 'uk' ? 'г' : 'g'}`;
/** A force as the dynamometer shows it: to its 0.1 N division. */
const N = (n: number, l: Locale) => formatMeasured('force', n, 0.1, l);
const ICE = COMPONENTS.water.phases.solid!.density!.value;
const WATER = COMPONENTS.water.phases.liquid!.density!.value;
/** Densities of the metals a guess can be about, kg/m³ (from the component models). */
const METALS = { aluminium: COMPONENTS.aluminium, iron: COMPONENTS.iron, copper: COMPONENTS.copper, brass: COMPONENTS.brass } as const;

export const PRESET_ANSWERS: Readonly<Record<string, (run: PresetRun) => PresetAnswer>> = {
  'ice-level': (run) => {
    // V₁ — water alone, V₂ — with the cube floating, V₃ — when it has melted.
    const v = of(run, 'volume').map((x) => x.record);
    const [w, a, b] = v.length >= 3 ? [v[0], v[1], v[v.length - 1]] : [undefined, v[0], v[v.length - 1]];
    const div = a?.inputs?.['division'] ?? 1e-6;
    const d = a && b ? b.value! - a.value! : 0;
    const under = Math.round((ICE / WATER) * 100);
    return {
      say: both((l) => (l === 'uk' ? 'Рівень не зрушив ні на поділку!' : 'The level did not move by a mark!')),
      text: both((l) =>
        l === 'uk'
          ? `${w ? `Без льоду вода стояла на позначці ${mL(w.value!, l)}. ` : ''}З кубиком — ${a ? mL(a.value!, l) : '—'}: плаваючий лід витіснив стільки води, скільки важить сам, — під водою була ≈ ${under} % кубика (закон Архімеда). Коли лід розтанув — ${b ? mL(b.value!, l) : '—'}. Розтанувши, лід став водою тієї самої маси — і зайняв рівно те місце, яке витісняв. Тому рівень не змінюється; так само не підіймає рівень океану морський лід, що тане, — на відміну від льодовиків на суші.`
          : `${w ? `Without ice the water stood at ${mL(w.value!, l)}. ` : ''}With the cube — ${a ? mL(a.value!, l) : '—'}: floating ice pushed aside its own weight of water — ≈ ${under} % of the cube was under it (Archimedes). Once the ice melted — ${b ? mL(b.value!, l) : '—'}. Melted, the ice became water of the same mass — and took exactly the room it had pushed aside. So the level stays; melting sea ice does not raise the ocean either — unlike glaciers on land.`,
      ),
      ...(a && b ? { correct: d > div / 2 ? 'up' : d < -div / 2 ? 'down' : 'same' } : {}),
    };
  },
  'mystery-metal': (run) => {
    const m = of(run, 'mass');
    const v = of(run, 'volume');
    const dm = m.length >= 2 ? m[m.length - 1]!.record.value! - m[0]!.record.value! : 0;
    const dv = v.length >= 2 ? v[v.length - 1]!.record.value! - v[0]!.record.value! : 0;
    const rho = dv > 0 ? dm / dv : 0;
    // The nearest density among the solids on the shelf — what a look into the table gives.
    const solids = Object.values(SUBSTANCES).filter((x) => x.category === 'solid.metal' || x.category === 'solid.material');
    const nearest = solids.reduce((best, x) => (Math.abs(x.liquid.density.value - rho) < Math.abs(best.liquid.density.value - rho) ? x : best), solids[0]!);
    const guess = nearest.id;
    const real = Object.values(run.steps[run.steps.length - 1]!.result.final.entities).find((e) => isThermalBody(e) && e.id.startsWith('sample+'));
    const realId = real && isThermalBody(real) ? String(real.params.substance) : '';
    const name = (id: string, l: Locale) => (id in SUBSTANCES ? SUBSTANCES[id as keyof typeof SUBSTANCES].name[l] : id);
    const rhoOf = (id: string) => (id in SUBSTANCES ? SUBSTANCES[id as keyof typeof SUBSTANCES].liquid.density.value : 0);
    return {
      say: both((l) => (l === 'uk' ? `Це ${name(realId, l).toLowerCase()}!` : `It is ${name(realId, l).toLowerCase()}!`)),
      text: both((l) =>
        l === 'uk'
          ? `Маса бруска: m = m₂ − m₁ = ${g(dm, l)}. Об’єм — на скільки піднялася вода: V = ${mL(dv, l)} = ${sig(dv * 1e6, 3, l)} см³. Отже, ρ = m/V ≈ ${sig(rho / 1000, 3, l)} г/см³ = ${sig(rho, 3, l)} кг/м³. Найближча густина в таблиці — ${name(guess, l).toLowerCase()} (${sig(rhoOf(guess), 4, l)} кг/м³). Брусок справді з металу «${name(realId, l).toLowerCase()}». Мензурка показує об’єм з точністю до 1 мл, тож для схожих металів (мідь і латунь) потрібен більший брусок або точніший прилад.`
          : `The block’s mass: m = m₂ − m₁ = ${g(dm, l)}. Its volume is how far the water rose: V = ${mL(dv, l)} = ${sig(dv * 1e6, 3, l)} cm³. So ρ = m/V ≈ ${sig(rho / 1000, 3, l)} g/cm³ = ${sig(rho, 3, l)} kg/m³. The nearest density in the table is ${name(guess, l).toLowerCase()} (${sig(rhoOf(guess), 4, l)} kg/m³). The block is indeed ${name(realId, l).toLowerCase()}. The cylinder reads the volume to 1 mL, so telling similar metals apart (copper and brass) needs a bigger block or a finer instrument.`,
      ),
      ...(dv > 0 && dm > 0 ? { correct: guess } : {}),
    };
  },
  supersaturated: ({ steps }) => {
    const acetate = (st: SystemState) => {
      const m = sampleOf(st).state.mixture;
      return { water: m?.water ?? 0, ...(m?.solutes.find((x) => x.component === 'sodium-acetate') ?? { mass: 0, crystals: 0 }) };
    };
    const temps = (st: (typeof steps)[number]) => [st.result.initial, ...st.result.samples, st.result.final].map((x) => sampleOf(x).state.temperature);
    const s = (t: number) => solubilityAt('sodium-acetate', t);
    // The step that cooled it (the one before the seed), and the one after the seed (the last).
    const cool = steps.length >= 2 ? steps[steps.length - 2] : undefined;
    const seeded = steps[steps.length - 1]!;
    const cooled = cool ? acetate(cool.result.final) : undefined;
    const tCool = cool ? sampleOf(cool.result.final).state.temperature : K0 + 22;
    const satCool = cooled ? (s(tCool - K0) / 100) * cooled.water : 0;
    const peak = Math.max(...temps(seeded));
    const after = acetate(seeded.result.final);
    const crystalsAtPeak = (() => {
      const states = [seeded.result.initial, ...seeded.result.samples, seeded.result.final];
      const hot = states.reduce((a, x) => (sampleOf(x).state.temperature > sampleOf(a).state.temperature ? x : a), states[0]!);
      return acetate(hot).crystals;
    })();
    const correct = !cooled ? undefined : cooled.crystals > 1e-5 ? 'on-cooling' : after.crystals <= 1e-5 ? 'nothing' : peak > tCool + 1 ? 'warm' : 'cold';
    return {
      ...(correct ? { correct } : {}),
      say: both((l) => (l === 'uk' ? `Кристали — і розчин нагрівся до ${C(peak, l)}!` : `Crystals — and the solution warmed up to ${C(peak, l)}!`)),
      text: both((l) =>
        l === 'uk'
          ? `При 70 °C у 4 мл води розчинилися всі 20 г натрій ацетату. Охолонувши до ${C(tCool, l)}, вода могла б утримати лише ≈ ${sig(satCool * 1000, 2, l)} г, але кристали не випали: розчин став пересиченим — у ньому в ${sig((cooled?.mass ?? 0) / Math.max(satCool, 1e-9), 2, l)} раза більше речовини, ніж дозволяє розчинність. Кристалам потрібна «затравка» — готовий кристалик, на якому вони почнуть рости. Сам зародок кристала мусить випадково зібратися з частинок у правильному порядку, а поки він крихітний, то радше розпадеться, ніж виросте. У натрій ацетату це особливо важко: його кристал — тригідрат, де до кожного йона натрію треба ще правильно прилаштувати три молекули води, а густий, як сироп, розчин заважає частинкам рухатися. Мідний купорос із простішою решіткою в рідкому розчині знаходить зародок майже одразу (дослід «Виростимо кристали»). Пилинка чи подряпина на склі теж може спрацювати як затравка — тому пересичені розчини готують у чистому посуді й охолоджують без струсів. Щойно його кинули, зайвий ацетат закристалізувався (≈ ${sig(crystalsAtPeak * 1000, 2, l)} г) і віддав теплоту розчинення (19,66 кДж/моль): температура стрибнула до ${C(peak, l)}. Так працює багаторазова грілка для рук: металева пластинка всередині створює центр кристалізації, а щоб «зарядити» грілку знову, її кип’ятять. Потім пробірка поволі вистигає до кімнатної температури. У моделі кристалізація миттєва й без затравки розчин не кристалізується сам.`
          : `At 70 °C all 20 g of sodium acetate dissolved in 4 mL of water. Cooled to ${C(tCool, l)}, the water could hold only ≈ ${sig(satCool * 1000, 2, l)} g, yet no crystals came out: the solution became supersaturated — it holds ${sig((cooled?.mass ?? 0) / Math.max(satCool, 1e-9), 2, l)} times as much as the solubility allows. Crystals need a "seed" — a ready crystal to grow on. A nucleus has to gather from particles by chance in the right order, and while it is tiny it is more likely to fall apart than to grow. For sodium acetate this is especially hard: its crystal is a trihydrate, where three water molecules must be fitted in the right places next to each sodium ion, and the syrup-thick solution slows the particles down. Copper sulfate, with a simpler lattice in a runny solution, finds a nucleus almost at once (the experiment “Growing copper sulfate crystals”). A speck of dust or a scratch on the glass can act as a seed too — that is why supersaturated solutions are made in clean glassware and cooled without shaking. As soon as one was dropped in, the excess acetate crystallised (≈ ${sig(crystalsAtPeak * 1000, 2, l)} g) and gave off its heat of solution (19.66 kJ/mol): the temperature jumped to ${C(peak, l)}. That is how a reusable hand warmer works: a metal disc inside makes a nucleation centre, and to "recharge" the warmer it is boiled. Then the test tube slowly cools to room temperature. In the model crystallisation is instant, and without a seed the solution never crystallises by itself.`,
      ),
    };
  },
  'heat-of-solution': ({ steps }) => {
    // Each beaker: what dissolved in it and how far its temperature went from where it started (the coldest or hottest moment).
    const beakers = steps.flatMap((st) => {
      const states = [st.result.initial, ...st.result.samples, st.result.final];
      const mix = sampleOf(st.result.final).state.mixture;
      const solute = mix?.solutes[0];
      if (!solute) return [];
      const ts = states.map((x) => sampleOf(x).state.temperature);
      const start = K0 + st.params.startTemp;
      const extreme = ts.reduce((a, t) => (Math.abs(t - start) > Math.abs(a - start) ? t : a), start);
      return [{ component: solute.component, mass: solute.mass, start, extreme, end: ts[ts.length - 1]! }];
    });
    const sign = (b: { start: number; extreme: number } | undefined) => (!b ? 0 : b.extreme < b.start - 0.5 ? -1 : b.extreme > b.start + 0.5 ? 1 : 0);
    const [a, b] = [beakers[0], beakers[1]];
    const correct = sign(a) < 0 && sign(b) < 0 ? 'both-cold' : sign(a) < 0 && sign(b) > 0 ? 'cold-hot' : sign(a) > 0 && sign(b) > 0 ? 'both-hot' : 'same';
    const name = (id: string, l: Locale) => (COMPONENTS[id as keyof typeof COMPONENTS]?.genitive?.[l] ?? id);
    const hs = (id: string) => COMPONENTS[id as keyof typeof COMPONENTS]?.inWater?.enthalpyOfSolution?.value ?? 0;
    const line = (x: (typeof beakers)[number], l: Locale) => {
      const moles = x.mass / soluteMolarMass(x.component);
      const q = Math.abs(moles * hs(x.component));
      const dt = x.extreme - x.start;
      return l === 'uk'
        ? `${sig(x.mass * 1000, 2, l)} г ${name(x.component, l)} — це ${sig(moles, 2, l)} моль; розчиняючись, вони ${hs(x.component) > 0 ? 'поглинули' : 'виділили'} ≈ ${sig(q, 2, l)} кДж (${hs(x.component) > 0 ? '+' : '−'}${sig(Math.abs(hs(x.component)), 4, l)} кДж/моль), і температура ${dt < 0 ? 'впала' : 'піднялася'} з ${C(x.start, l)} до ${C(x.extreme, l)}.`
        : `${sig(x.mass * 1000, 2, l)} g of ${name(x.component, l)} is ${sig(moles, 2, l)} mol; dissolving, it ${hs(x.component) > 0 ? 'took in' : 'gave off'} ≈ ${sig(q, 2, l)} kJ (${hs(x.component) > 0 ? '+' : '−'}${sig(Math.abs(hs(x.component)), 4, l)} kJ/mol), and the temperature ${dt < 0 ? 'fell' : 'rose'} from ${C(x.start, l)} to ${C(x.extreme, l)}.`;
    };
    return {
      ...(a && b ? { correct } : {}),
      say: both((l) => (l === 'uk' ? 'Один розчин холоне, другий гріється!' : 'One solution cools, the other warms up!')),
      text: both((l) =>
        l === 'uk'
          ? `${beakers.map((x) => line(x, l)).join(' ')} Під час розчинення кристал руйнується — на це енергія витрачається, — а йони оточують молекули води — тут енергія виділяється. Що переважить, те й покаже термометр: амоній хлорид охолоджує розчин (на цьому працюють «холодні» пакети першої допомоги), натрій гідроксид — розігріває. Потім обидва стакани поволі набирають кімнатну температуру. Модель бере теплоту розчинення для дуже розбавленого розчину; у справжньому досліді цифри будуть трохи іншими. Натрій гідроксид — їдкий: у школі з ним працює лише вчитель.`
          : `${beakers.map((x) => line(x, l)).join(' ')} When a substance dissolves, its crystal is broken up — that takes energy — and its ions are surrounded by water molecules — that gives energy off. Whichever wins shows on the thermometer: ammonium chloride cools the solution (first-aid cold packs work this way), sodium hydroxide heats it. Then both beakers slowly come to room temperature. The model uses the enthalpy of solution of a very dilute solution; in a real experiment the numbers differ a little. Sodium hydroxide is caustic: at school only the teacher handles it.`,
      ),
    };
  },
  'grow-crystals': ({ steps }) => {
    const g3 = (kg: number, l: Locale) => `${sig(kg * 1000, 3, l)} ${l === 'uk' ? 'г' : 'g'}`;
    const first = steps[0]!;
    const last = steps[steps.length - 1]!;
    const cuso4 = (st: SystemState) => {
      const b = sampleOf(st);
      const mix = 'mixture' in b.state ? b.state.mixture : undefined;
      return { water: mix ? mix.water : 0, ...(mix?.solutes.find((x) => x.component === 'copper-sulfate') ?? { mass: 0, crystals: 0 }) };
    };
    const s = (t: number) => solubilityAt('copper-sulfate', t);
    // The copper sulfate is poured in within the first step; before heating, at the start temperature, the
    // water holds what the solubility allows and the rest lies on the bottom.
    const water0 = first.params.liters / 1000 * SUBSTANCES[first.params.substance].liquid.density.value;
    const total = cuso4(last.result.final).mass;
    const start = { water: water0, crystals: Math.max(0, total - (s(first.params.startTemp) / 100) * water0) };
    const hot = cuso4(first.result.final);
    const cold = cuso4(last.result.final);
    // Where the solution became saturated on the way down: crystals start to grow there.
    const t0 = [...Array(81).keys()].map((i) => 80 - i).find((t) => (s(t) / 100) * cold.water < cold.mass) ?? 20;
    const lost = start.water - cold.water;
    const correct = cold.crystals < 1e-4 ? 'none' : cold.crystals > cold.mass - 1e-4 ? 'all' : 'part';
    return {
      correct,
      say: both((l) => (l === 'uk' ? `Випало ≈ ${sig(cold.crystals * 1000, 3, l)} г кристалів!` : `≈ ${sig(cold.crystals * 1000, 3, l)} g of crystals came out!`)),
      text: both((l) =>
        l === 'uk'
          ? `При 20 °C 100 г води розчиняє лише ≈ ${sig(s(20), 3, l)} г мідного купоросу, тому спочатку на дні лишилося ${g3(start.crystals, l)}. При 60 °C розчинність ≈ ${sig(s(60), 3, l)} г — і ${hot.crystals < 1e-4 ? 'весь купорос розчинився' : `на дні лишилося ${g3(hot.crystals, l)}`}. Коли розчин охолоняв, приблизно від ${sig(t0, 2, l)} °C він став насиченим, і зайвий купорос почав виходити кристалами. При 20 °C у розчині знову ≈ ${g3(cold.mass - cold.crystals, l)}, а ${g3(cold.crystals, l)} — сині кристали на дні.${lost > 5e-4 ? ` Кристалів трохи більше, ніж лежало спочатку: під час нагрівання ≈ ${sig(lost * 1000, 2, l)} г води випарувалося, а в меншій кількості води розчиняється менше купоросу.` : ''} Що повільніше охолоджувати, то більші кристали встигають вирости. Насправді й мідний купорос трохи пересичується: кристалам, щоб почати рости, потрібен зародок. Але його решітка проста, розчин рідкий, а пилинки й подряпини на склі правлять за зародки, тож купорос пересичується лише на кілька градусів — а натрій ацетат у грілці лишається рідким тижнями (дослід «Грілка, що спрацьовує від кристалика»). Модель рахує, скільки кристалів випаде, але не їхній розмір і форму, і в ній купорос кристалізується рівно тоді, коли розчин стає насиченим.`
          : `At 20 °C 100 g of water dissolves only ≈ ${sig(s(20), 3, l)} g of copper sulfate, so at first ${g3(start.crystals, l)} stayed on the bottom. At 60 °C the solubility is ≈ ${sig(s(60), 3, l)} g — and ${hot.crystals < 1e-4 ? 'all of it dissolved' : `${g3(hot.crystals, l)} stayed on the bottom`}. As the solution cooled, from about ${sig(t0, 2, l)} °C it became saturated, and the excess began to come out as crystals. At 20 °C the solution again holds ≈ ${g3(cold.mass - cold.crystals, l)}, and ${g3(cold.crystals, l)} are blue crystals on the bottom.${lost > 5e-4 ? ` A little more than lay there at first: ≈ ${sig(lost * 1000, 2, l)} g of water evaporated during the heating, and less water dissolves less copper sulfate.` : ''} The slower the cooling, the larger the crystals grow. In fact copper sulfate supersaturates a little too: crystals need a nucleus to start growing. But its lattice is simple, the solution is runny, and dust and scratches on the glass serve as nuclei, so copper sulfate supersaturates by only a few degrees — while sodium acetate in a hand warmer stays liquid for weeks (the experiment “A warmer set off by a crystal”). The model counts how much crystallises, but not the crystals' size or shape, and in it copper sulfate crystallises exactly when the solution becomes saturated.`,
      ),
    };
  },
  'mass-fraction': (run) => {
    const m = of(run, 'mass');
    const salt = m.length >= 2 ? m[m.length - 1]!.record.value! - m[0]!.record.value! : 0;
    // The water poured in; of the salt, as much as 20 °C water dissolves (all of it here: 5 g against ≈ 16 g).
    const p = run.steps[0]!.params;
    const water = (p.liters / 1000) * SUBSTANCES[p.substance].liquid.density.value;
    const dissolved = Math.min(salt, (solubilityAt('sodium-chloride', p.startTemp) / 100) * water);
    const w = water + dissolved > 0 ? (dissolved / (water + dissolved)) * 100 : 0;
    const options = [5, 10, 100 / 9, 50];
    const nearest = options.reduce((best, x) => (Math.abs(x - w) < Math.abs(best - w) ? x : best), options[0]!);
    const pct = (x: number, l: Locale) => `${sig(x, 3, l)} %`;
    return {
      say: both((l) => (l === 'uk' ? `Рівно ${pct(w, l)}!` : `Exactly ${pct(w, l)}!`)),
      text: both((l) =>
        l === 'uk'
          ? `Терези показали, що досипали m(солі) = m₂ − m₁ = ${g(salt, l)}. Уся сіль розчинилася, тож маса розчину — це вода й сіль разом: m(розчину) = ${g(water, l)} + ${g(dissolved, l)} = ${g(water + dissolved, l)}. Масова частка w = m(солі) / m(розчину) = ${g(dissolved, l)} / ${g(water + dissolved, l)} ≈ ${pct(w, l)}. Поширена помилка — ділити на масу води: ${g(dissolved, l)} / ${g(water, l)} ≈ ${pct((dissolved / water) * 100, l)}. Але частка рахується від усього розчину. Щоб отримати розчин масою m із часткою w, беруть w·m речовини й (1 − w)·m води.`
          : `The scales showed the salt added: m(salt) = m₂ − m₁ = ${g(salt, l)}. All the salt dissolved, so the solution is the water and the salt together: m(solution) = ${g(water, l)} + ${g(dissolved, l)} = ${g(water + dissolved, l)}. The mass fraction w = m(salt) / m(solution) = ${g(dissolved, l)} / ${g(water + dissolved, l)} ≈ ${pct(w, l)}. A common slip is dividing by the water: ${g(dissolved, l)} / ${g(water, l)} ≈ ${pct((dissolved / water) * 100, l)}. But the fraction is taken of the whole solution. To make a solution of mass m with a fraction w, take w·m of the substance and (1 − w)·m of water.`,
      ),
      ...(salt > 0 && dissolved > 0 ? { correct: nearest === 100 / 9 ? '11' : String(nearest) } : {}),
    };
  },
  'archimedes-salt': (run) => {
    const f = of(run, 'force');
    const air = f.find((r) => r.command['into'] === 'air')?.record;
    const inLiquid = f.filter((r) => r.command['into'] === 'liquid').map((r) => r.record);
    const [fresh, salty] = [inLiquid[0], inLiquid[inLiquid.length - 1]];
    const F1 = air && fresh ? air.value! - fresh.value! : 0;
    const F2 = air && salty ? air.value! - salty.value! : 0;
    const rho2 = salty?.inputs?.['rhoLiquid'] ?? WATER;
    return {
      say: both((l) => (l === 'uk' ? 'Солона вода виштовхує сильніше!' : 'Salt water pushes harder!')),
      text: both((l) =>
        l === 'uk'
          ? `У повітрі динамометр показав ${air ? N(air.value!, l) : '—'}, у прісній воді — ${fresh ? N(fresh.value!, l) : '—'}: архімедова сила F₁ = P − P′ = ${N(F1, l)}. Коли у воді розчинили сіль, рідина стала густішою (≈ ${sig(rho2, 4, l)} кг/м³ замість ${sig(WATER, 3, l)}), і динамометр показав ${salty ? N(salty.value!, l) : '—'}: F₂ = ${N(F2, l)}. Архімедова сила F = ρ·g·V тим більша, що густіша рідина, — тому в морі плавати легше, ніж у річці.`
          : `In the air the dynamometer read ${air ? N(air.value!, l) : '—'}, in fresh water ${fresh ? N(fresh.value!, l) : '—'}: the buoyant force F₁ = P − P′ = ${N(F1, l)}. With salt dissolved, the liquid got denser (≈ ${sig(rho2, 4, l)} kg/m³ instead of ${sig(WATER, 3, l)}), and the dynamometer read ${salty ? N(salty.value!, l) : '—'}: F₂ = ${N(F2, l)}. The buoyant force F = ρ·g·V is larger in a denser liquid — that is why swimming in the sea is easier than in a river.`,
      ),
      ...(air && fresh && salty ? { correct: F2 > F1 + 0.05 ? 'salt' : F1 > F2 + 0.05 ? 'fresh' : 'same' } : {}),
    };
  },
  'mix-hot-cold': ({ steps }) => {
    const s = steps[0]!;
    const ideal = mixedAt(s);
    const real = temp(s.result.final);
    const t = reachedAt(s);
    return {
      say: both((l) => (l === 'uk' ? `Рівновага — ${C(real, l)}!` : `Equilibrium at ${C(real, l)}!`)),
      text: both((l) =>
        l === 'uk'
          ? `Щойно воду змішали, суміш мала ${C(ideal, l)} — саме стільки дає рівняння теплового балансу: θ = (m₁t₁ + m₂t₂) / (m₁ + m₂), бо скільки теплоти віддала гаряча вода, стільки отримала холодна. Але за ${D(t, l)} холодний скляний стакан і повітря забрали частину теплоти, і рівновага настала при ${C(real, l)}. Тому справжня суміш завжди трохи холодніша за розрахунок; щоб зменшити втрати, у лабораторії змішують у калориметрі.`
          : `Right after mixing the water was at ${C(ideal, l)} — exactly what the heat balance gives: θ = (m₁t₁ + m₂t₂) / (m₁ + m₂), since the heat the hot water gave is the heat the cold water took. But within ${D(t, l)} the cold glass beaker and the air took some of the heat, and equilibrium came at ${C(real, l)}. That is why a real mixture is always a little colder than the calculation; to cut the losses, labs mix in a calorimeter.`,
      ),
      correct: real < ideal - 0.5 ? 'less' : real > ideal + 0.5 ? 'more' : 'fifty',
    };
  },
  'hooke-spring': (run) => {
    const r = (run.readings ?? []).filter((x) => x.command.type === 'lab.stretch' && x.record.value !== null);
    const l0 = r.find((x) => x.command['weights'] === 0)?.record.value ?? null;
    const rows = r.filter((x) => Number(x.command['weights']) > 0).map((x) => ({ n: Number(x.command['weights']), F: x.record.inputs?.['F'] ?? 0, x: x.record.value! - (l0 ?? 0) }));
    const ks = rows.map((x) => x.F / x.x);
    const kMean = ks.reduce((a, b) => a + b, 0) / Math.max(1, ks.length);
    const spread = ks.length ? (Math.max(...ks) - Math.min(...ks)) / kMean : 0;
    const first = rows[0];
    const last = rows[rows.length - 1];
    const ratio = first && last ? last.x / first.x / (last.F / first.F) : 1;
    const correct = l0 === null || rows.length < 2 ? undefined : Math.abs(ratio - 1) < 0.08 ? 'proportional' : ratio > 1 ? 'faster' : 'slower';
    const cm = (x: number, l: Locale) => formatMeasured('length', x, 0.001, l);
    return {
      ...(correct ? { correct } : {}),
      say: both((l) => (l === 'uk' ? `Видовження пропорційне силі: k ≈ ${sig(kMean, 2, l)} Н/м!` : `The extension is proportional to the force: k ≈ ${sig(kMean, 2, l)} N/m!`)),
      text: both((l) =>
        l === 'uk'
          ? `Кожен тягарець 100 г тягне пружину із силою ≈ 0,98 Н. ${rows.map((x) => `${x.n} × 100 г: x = ${cm(x.x, l)}`).join('; ')}. У скільки разів більша сила, у стільки ж разів більше й видовження, а відношення F/x майже однакове: k ≈ ${sig(kMean, 2, l)} Н/м (розкид ${sig(spread * 100, 2, l)} % — бо лінійка показує лише міліметри). Це закон Гука: F = k·x. Він діє, доки деформація пружна — коли тягарці зняти, пружина повертається до довжини ${l0 !== null ? cm(l0, l) : 'l₀'}. У підручнику цю роботу виконують із гумовим шнуром; гума підкоряється закону Гука гірше, ніж сталева пружина, особливо за великих розтягів.`
          : `Each 100 g weight pulls the spring with ≈ 0.98 N. ${rows.map((x) => `${x.n} × 100 g: x = ${cm(x.x, l)}`).join('; ')}. As many times as the force grows, so does the extension, and F/x stays nearly the same: k ≈ ${sig(kMean, 2, l)} N/m (a spread of ${sig(spread * 100, 2, l)} % — the ruler shows only millimetres). That is Hooke’s law: F = k·x. It holds while the deformation is elastic — take the weights off, and the spring comes back to ${l0 !== null ? cm(l0, l) : 'l₀'}. The textbook does this lab work with a rubber cord; rubber follows Hooke’s law less closely than a steel spring, especially when stretched far.`,
      ),
    };
  },
  'friction-coefficient': (run) => {
    const rows = (run.readings ?? []).filter((x) => x.command.type === 'lab.pull' && x.record.value !== null).map((x) => ({ n: Number(x.command['weights']), F: x.record.value!, N: x.record.inputs?.['N'] ?? 1 }));
    const P = (run.readings ?? []).find((x) => x.command.type === 'lab.hang')?.record.value ?? null;
    const mus = rows.map((x) => x.F / x.N);
    const mean = mus.reduce((a, b) => a + b, 0) / Math.max(1, mus.length);
    const trend = rows.length >= 2 ? (mus[mus.length - 1]! - mus[0]!) / mean : 0;
    const correct = rows.length < 2 ? undefined : Math.abs(trend) < 0.25 ? 'same' : trend > 0 ? 'grows' : 'falls';
    const N1 = (x: number, l: Locale) => formatMeasured('force', x, 0.1, l);
    return {
      ...(correct ? { correct } : {}),
      say: both((l) => (l === 'uk' ? `μ ≈ ${sig(mean, 2, l)} — для дерева по дереву!` : `μ ≈ ${sig(mean, 2, l)} — for wood on wood!`)),
      text: both((l) =>
        l === 'uk'
          ? `Брусок важить ${P !== null ? N1(P, l) : '≈ 1,4 Н'}; на горизонтальній дошці сила нормальної реакції N дорівнює вазі бруска з тягарцями. ${rows.map((x) => `N = ${sig(x.N, 2, l)} Н → F = ${N1(x.F, l)}, μ ≈ ${sig(x.F / x.N, 2, l)}`).join('; ')}. Сила тертя росте разом із навантаженням, а їхнє відношення — коефіцієнт тертя — лишається майже тим самим: μ ≈ ${sig(mean, 2, l)}. У таблиці підручника для дерева по дереву — 0,25. Розкид — бо динамометр показує лише десяті частки ньютона, а тягнути рівномірно непросто. Коефіцієнт тертя залежить від матеріалів і того, як оброблені поверхні, але не від ваги бруска.`
          : `The block weighs ${P !== null ? N1(P, l) : '≈ 1.4 N'}; on a level board the normal force N equals the weight of the block with its weights. ${rows.map((x) => `N = ${sig(x.N, 2, l)} N → F = ${N1(x.F, l)}, μ ≈ ${sig(x.F / x.N, 2, l)}`).join('; ')}. The friction grows with the load, while their ratio — the coefficient of friction — stays about the same: μ ≈ ${sig(mean, 2, l)}. The textbook’s table gives 0.25 for wood on wood. The spread is there because the dynamometer reads only tenths of a newton, and pulling steadily is not easy. The coefficient depends on the materials and how the surfaces are finished, not on the block’s weight.`,
      ),
    };
  },
  'block-pressure': (run) => {
    const P = (run.readings ?? []).find((x) => x.command.type === 'lab.hang')?.record.value ?? null;
    const e = [0, 1, 2].map((k) => (run.readings ?? []).find((x) => x.command.type === 'lab.edge' && x.command['edge'] === k)?.record.value ?? null);
    const [a, b, c] = e;
    const ok = P !== null && a !== null && b !== null && c !== null;
    const faces = ok ? [a! * b!, a! * c!, b! * c!] : [];
    const p = faces.map((S) => P! / S);
    const correct = ok ? (p[2]! > p[0]! * 1.05 ? 'smallest' : p[0]! > p[2]! * 1.05 ? 'largest' : 'same') : undefined;
    const cm = (x: number, l: Locale) => formatMeasured('length', x, 0.001, l);
    return {
      ...(correct ? { correct } : {}),
      say: both((l) => (l === 'uk' ? 'Найсильніше — на найменшій грані!' : 'Hardest on the smallest face!')),
      text: both((l) =>
        !ok
          ? '—'
          : l === 'uk'
            ? `Вага бруска P = ${formatMeasured('force', P!, 0.1, l)}, ребра ${cm(a!, l)} × ${cm(b!, l)} × ${cm(c!, l)}. Сила тиску на будь-якій грані та сама — вага, а площа різна: ${sig(faces[0]! * 1e4, 3, l)}, ${sig(faces[1]! * 1e4, 3, l)} і ${sig(faces[2]! * 1e4, 3, l)} см². Тому й тиск p = P/S різний: ≈ ${sig(p[0]!, 3, l)}, ${sig(p[1]!, 3, l)} і ${sig(p[2]!, 3, l)} Па. Що менша площа опори, то більший тиск — на найменшій грані він ${times(p[2]! / p[0]!, l)} більший, ніж на найбільшій. Тому ніж гострять, а лижі й гусениці роблять широкими.`
            : `The block weighs P = ${formatMeasured('force', P!, 0.1, l)}, its edges are ${cm(a!, l)} × ${cm(b!, l)} × ${cm(c!, l)}. The force on any face is the same — the weight, but the areas differ: ${sig(faces[0]! * 1e4, 3, l)}, ${sig(faces[1]! * 1e4, 3, l)} and ${sig(faces[2]! * 1e4, 3, l)} cm². So the pressure p = P/S differs too: ≈ ${sig(p[0]!, 3, l)}, ${sig(p[1]!, 3, l)} and ${sig(p[2]!, 3, l)} Pa. The smaller the area, the larger the pressure — on the smallest face it is ${times(p[2]! / p[0]!, l)} that on the largest. That is why knives are sharpened, and skis and caterpillar tracks are made wide.`,
      ),
    };
  },
  'hydrostatic-weighing': (run) => {
    const f = of(run, 'force');
    const air = f.find((r) => r.command['into'] === 'air')?.record;
    const wet = [...f].reverse().find((r) => r.command['into'] === 'liquid')?.record;
    const P = air?.value ?? 0;
    const P2 = wet?.value ?? 0;
    const Fa = P - P2;
    const rhoL = wet?.inputs?.['rhoLiquid'] ?? WATER;
    const gg = air?.inputs?.['g'] ?? 9.81;
    const rho = Fa > 0 ? (P / Fa) * rhoL : 0;
    const solids = Object.values(SUBSTANCES).filter((x) => x.category === 'solid.metal' || x.category === 'solid.material');
    const nearest = solids.reduce((best, x) => (Math.abs(x.liquid.density.value - rho) < Math.abs(best.liquid.density.value - rho) ? x : best), solids[0]!);
    const name = (l: Locale) => nearest.name[l].toLowerCase();
    const err = Fa > 0 ? (0.05 / Fa + 0.05 / P) * 100 : 0;
    return {
      ...(Fa > 0 ? { correct: nearest.id } : {}),
      say: both((l) => (l === 'uk' ? `Це ${name(l)}!` : `It is ${name(l)}!`)),
      text: both((l) =>
        l === 'uk'
          ? `У повітрі брусок важить P = ${N(P, l)}, у воді — P′ = ${N(P2, l)}. Архімедова сила F_A = P − P′ = ${N(Fa, l)}. Вона дорівнює вазі витісненої води: F_A = ρ_в·g·V, тож об’єм бруска V = F_A / (ρ_в·g) ≈ ${sig((Fa / (rhoL * gg)) * 1e6, 3, l)} см³. Маса m = P/g ≈ ${sig((P / gg) * 1000, 3, l)} г, а густина ρ = m/V = P/F_A · ρ_в ≈ ${sig(rho, 3, l)} кг/м³. Найближча в таблиці — ${name(l)} (${sig(nearest.liquid.density.value, 4, l)} кг/м³). Динамометр показує з точністю до 0,1 Н, тож результат може відрізнятися на кілька відсотків (тут до ≈ ${sig(err, 2, l)} %) — для схожих за густиною речовин потрібен точніший прилад або важчий брусок.`
          : `In the air the block weighs P = ${N(P, l)}, in water P′ = ${N(P2, l)}. The buoyant force F_A = P − P′ = ${N(Fa, l)}. It equals the weight of the water pushed aside: F_A = ρ_w·g·V, so the block’s volume V = F_A / (ρ_w·g) ≈ ${sig((Fa / (rhoL * gg)) * 1e6, 3, l)} cm³. Its mass m = P/g ≈ ${sig((P / gg) * 1000, 3, l)} g, and its density ρ = m/V = P/F_A · ρ_w ≈ ${sig(rho, 3, l)} kg/m³. The nearest in the table is ${name(l)} (${sig(nearest.liquid.density.value, 4, l)} kg/m³). The dynamometer reads to 0.1 N, so the result may be off by a few per cent (here up to ≈ ${sig(err, 2, l)} %) — telling apart substances of similar density needs a finer instrument or a heavier block.`,
      ),
    };
  },
  'ice-latent-heat': ({ steps }) => {
    // The last step: the ice in the water of a calorimeter that has warmed up with it.
    const s = steps[steps.length - 1]!;
    const ice = blockOf(s);
    const mw = (s.params.liters / 1000) * WATER;
    const t1 = temp(s.result.initial) - K0;
    const th = temp(s.result.final) - K0;
    const mi = ice?.mass ?? 0.02;
    const ti = ice ? ice.temperature - K0 : -1;
    const ci = COMPONENTS.water.phases.solid!.specificHeat!.value;
    const cup = cupHeatGiven(s);
    const warmIce = ci * mi * (0 - ti) + CW * mi * th;
    const naive = (CW * mw * (t1 - th) - warmIce) / mi;
    const full = (CW * mw * (t1 - th) + cup - warmIce) / mi;
    const table = LF_KJ * 1000;
    const correct = Math.abs(naive - table) / table < 0.05 ? 'table' : naive < table ? 'less' : 'more';
    const kJ = (j: number, l: Locale) => `${sig(j / 1000, 3, l)} ${l === 'uk' ? 'кДж/кг' : 'kJ/kg'}`;
    return {
      correct,
      say: both((l) => (l === 'uk' ? `λ ≈ ${kJ(naive, l)}!` : `λ ≈ ${kJ(naive, l)}!`)),
      text: both((l) =>
        l === 'uk'
          ? `Вода охолола з ${sig(t1, 3, l)} до ${sig(th, 3, l)} °C і віддала Q₁ = c·m_в·(t₁ − θ) ≈ ${sig((CW * mw * (t1 - th)) / 1000, 3, l)} кДж. Лід спершу нагрівся до 0 °C, розтанув, а вода з нього нагрілася до θ: на нагрівання пішло ≈ ${sig(warmIce / 1000, 2, l)} кДж, решта — на плавлення. Отже, λ = (Q₁ − Q_нагр) / m_л ≈ ${kJ(naive, l)} — ${correct === 'table' ? 'майже як у таблиці' : correct === 'less' ? 'менше' : 'більше'} за табличні ${kJ(table, l)}. Чому? Віддавала теплоту не лише вода: алюмінієвий калориметр, прогрітий разом із нею, теж охолов і віддав ≈ ${sig(cup / 1000, 2, l)} кДж. Якщо врахувати і його, λ ≈ ${kJ(full, l)}. Решта різниці — теплообмін із повітрям у кімнаті. Тому в лабораторній роботі калориметр беруть легкий, а лід — сухий і подрібнений.`
          : `The water cooled from ${sig(t1, 3, l)} to ${sig(th, 3, l)} °C and gave off Q₁ = c·m_w·(t₁ − θ) ≈ ${sig((CW * mw * (t1 - th)) / 1000, 3, l)} kJ. The ice first warmed to 0 °C, melted, and its water warmed to θ: warming took ≈ ${sig(warmIce / 1000, 2, l)} kJ, the rest went into melting. So λ = (Q₁ − Q_warm) / m_ice ≈ ${kJ(naive, l)} — ${correct === 'table' ? 'almost as in the table' : correct === 'less' ? 'less' : 'more'} than the table’s ${kJ(table, l)}. Why? Not only the water gave off heat: the aluminium calorimeter, warmed up with it, cooled too and gave ≈ ${sig(cup / 1000, 2, l)} kJ. Counting it as well, λ ≈ ${kJ(full, l)}. The rest of the difference is heat exchange with the room air. That is why the lab work uses a light calorimeter and dry, crushed ice.`,
      ),
    };
  },
  'specific-heat-metal': ({ steps }) => {
    const s = steps[0]!;
    const block = blockOf(s);
    const mw = (s.params.liters / 1000) * WATER;
    const t1 = s.params.startTemp;
    const th = temp(s.result.final) - K0;
    const mb = block?.mass ?? 0.1;
    const tb = block ? block.temperature - K0 : 100;
    const cup = -cupHeatGiven(s);
    const naive = (CW * mw * (th - t1)) / (mb * (tb - th));
    const full = (CW * mw * (th - t1) + cup) / (mb * (tb - th));
    const table = block ? (COMPONENTS[block.substance as keyof typeof COMPONENTS]?.phases.solid?.specificHeat?.value ?? 0) : 0;
    const correct = Math.abs(naive - table) / table < 0.05 ? 'table' : naive < table ? 'less' : 'more';
    const J = (x: number, l: Locale) => `${sig(x, 3, l)} ${l === 'uk' ? 'Дж/(кг·°C)' : 'J/(kg·°C)'}`;
    return {
      correct,
      say: both((l) => `c ≈ ${J(naive, l)}!`),
      text: both((l) =>
        l === 'uk'
          ? `Вода нагрілася з ${sig(t1, 3, l)} до ${sig(th, 3, l)} °C і отримала Q = c_в·m_в·(θ − t₁) ≈ ${sig((CW * mw * (th - t1)) / 1000, 3, l)} кДж. Стільки ж віддав циліндр, охолонувши з ${sig(tb, 3, l)} до ${sig(th, 3, l)} °C. Отже, c = Q / (m·(t₂ − θ)) ≈ ${J(naive, l)} — ${correct === 'table' ? 'майже як у таблиці' : correct === 'less' ? 'менше' : 'більше'} за табличні ${J(table, l)}. Частину теплоти забрав сам калориметр — він теж нагрівся (≈ ${sig(cup / 1000, 2, l)} кДж). З ним c ≈ ${J(full, l)}; решта — теплообмін із повітрям і те, що циліндр, поки його переносили з окропу, трохи охолов.`
          : `The water warmed from ${sig(t1, 3, l)} to ${sig(th, 3, l)} °C and took Q = c_w·m_w·(θ − t₁) ≈ ${sig((CW * mw * (th - t1)) / 1000, 3, l)} kJ. The cylinder gave as much, cooling from ${sig(tb, 3, l)} to ${sig(th, 3, l)} °C. So c = Q / (m·(t₂ − θ)) ≈ ${J(naive, l)} — ${correct === 'table' ? 'almost as in the table' : correct === 'less' ? 'less' : 'more'} than the table’s ${J(table, l)}. Part of the heat went into the calorimeter itself — it warmed too (≈ ${sig(cup / 1000, 2, l)} kJ). Counting it, c ≈ ${J(full, l)}; the rest is heat exchange with the air and the cylinder cooling a little while it was carried from the boiling water.`,
      ),
    };
  },
  'which-metal': ({ steps, simulation }) => {
    const s = steps[0]!;
    const block = blockOf(s);
    const real = temp(s.result.final);
    const other = block ? settleWith(s.params, { ...block, substance: block.substance === 'copper' ? 'aluminium' : 'copper' }, simulation) : real;
    const [al, cu] = block?.substance === 'copper' ? [other, real] : [real, other];
    const cAl = COMPONENTS.aluminium.phases.solid!.specificHeat!.value;
    const cCu = COMPONENTS.copper.phases.solid!.specificHeat!.value;
    return {
      say: both((l) => (l === 'uk' ? (al > cu ? 'Алюміній «тепліший»!' : 'Мідь «тепліша»!') : al > cu ? 'Aluminium holds more heat!' : 'Copper holds more heat!')),
      text: both((l) =>
        l === 'uk'
          ? `Алюмінієвий брусок нагрів воду до ${C(al, l)}, а мідний тієї самої маси нагрів би лише до ${C(cu, l)}. Справа в питомій теплоємності: в алюмінію c = ${sig(cAl, 3, l)} Дж/(кг·°C), у міді — ${sig(cCu, 3, l)}. Охолоджуючись на 1 °C, кілограм алюмінію віддає в ${ratio(cAl, cCu, l)} раза більше теплоти, ніж кілограм міді: маса та сама, а «запас тепла» різний.`
          : `The aluminium block warmed the water to ${C(al, l)}, while a copper block of the same mass would warm it only to ${C(cu, l)}. It is the specific heat: aluminium has c = ${sig(cAl, 3, l)} J/(kg·°C), copper ${sig(cCu, 3, l)}. Cooling by 1 °C, a kilogram of aluminium gives ${ratio(cAl, cCu, l)} times as much heat as a kilogram of copper: the same mass, a different "store of heat".`,
      ),
      correct: al > cu + 0.3 ? 'al' : cu > al + 0.3 ? 'cu' : 'same',
    };
  },
  'weigh-the-water': ({ steps }) => {
    // What the kitchen scales show at the start, after freezing and after boiling.
    const [freeze, boil] = [steps[0]!, steps[1] ?? steps[0]!];
    const at = (st: SystemState) => weigh(st, 'kitchen-scale');
    const [a, b, c] = [at(freeze.result.initial), at(freeze.result.final), at(boil.result.final)];
    const g = (kg: number | null, l: Locale) => formatReading('kitchen-scale', kg, l);
    const dFreeze = (a.reading ?? 0) - (b.reading ?? 0);
    const dBoil = (b.reading ?? 0) - (c.reading ?? 0);
    // Without the water that evaporated while it cooled, did freezing change the mass?
    const toAir = (st: SystemState) => (sampleOf(st).state.evaporated ?? 0) + (sampleOf(st).state.boiledOff ?? 0);
    const change = b.exact.total - a.exact.total + (toAir(freeze.result.final) - toAir(freeze.result.initial));
    return {
      correct: change > 1e-6 ? 'heavier' : change < -1e-6 ? 'lighter' : 'same',
      say: both((l) => (l === 'uk' ? 'Маса нікуди не зникає — вона йде парою!' : 'Mass does not vanish — it leaves as vapour!')),
      text: both((l) =>
        l === 'uk'
          ? `На початку ваги показали ${g(a.reading, l)}, після замерзання — ${g(b.reading, l)}: вода стала льодом, але не стала ні важчою, ні легшою${dFreeze > 0 ? ` (${g(dFreeze, l)} встигли випаруватися, поки вода холонула)` : ''}. Лід лише займає більше місця, бо він менш густий. Після кипіння — ${g(c.reading, l)}: на ${g(dBoil, l)} менше. Ця вода не зникла — вона пішла в повітря парою.`
          : `At the start the scales showed ${g(a.reading, l)}, after freezing ${g(b.reading, l)}: the water turned to ice but became neither heavier nor lighter${dFreeze > 0 ? ` (${g(dFreeze, l)} evaporated while it was cooling)` : ''}. Ice only takes more room, because it is less dense. After boiling: ${g(c.reading, l)}, ${g(dBoil, l)} less. That water did not vanish — it went into the air as vapour.`,
      ),
    };
  },
  'boil-a-litre': ({ steps }) => {
    const s = steps[0]!;
    const t = reachedAt(s);
    const paper = paperTime(s.params);
    return {
      say: both((l) => (l === 'uk' ? `Закипіло за ${D(t, l)}!` : `Boiled in ${D(t, l)}!`)),
      text: both((l) =>
        l === 'uk'
          ? `Літр води закипів за ${D(t, l)}.${paper ? ` Розрахунок «на папері», коли вся енергія плити йде лише у воду, дає ${D(paper, l)} — насправді вийшло на ${Math.round((t / paper - 1) * 100)} % довше.` : ''} Різниця — це теплота, що пішла на саму каструлю, у повітря кімнати й на пару: справжній дослід завжди довший за ідеальний розрахунок.`
          : `A litre of water boiled in ${D(t, l)}.${paper ? ` The “paper” calculation, where all the hob's energy goes into the water, gives ${D(paper, l)} — the real run took ${Math.round((t / paper - 1) * 100)} % longer.` : ''} The difference is the heat that went into the pot itself, into the room air and into steam: a real experiment always takes longer than the ideal calculation.`,
      ),
    };
  },
  'lid-or-not': ({ steps, simulation }) => {
    // Both runs were made: compare them; otherwise the other one is run in the mind.
    const lidRun = steps.find((x) => x.params.lid);
    const openRun = steps.find((x) => !x.params.lid);
    const s = steps[0]!;
    const withLid = lidRun ? reachedAt(lidRun) : timeToGoal({ ...s.params, lid: true }, simulation);
    const without = openRun ? reachedAt(openRun) : timeToGoal({ ...s.params, lid: false }, simulation);
    return {
      correct: withLid < without * 0.97 ? 'lid' : without < withLid * 0.97 ? 'no-lid' : 'equal',
      say: both((l) => (l === 'uk' ? 'Кришка береже теплоту!' : 'A lid keeps the heat in!')),
      text: both((l) =>
        l === 'uk'
          ? `З кришкою вода закипіла${s.params.lid ? '' : ' б'} за ${D(withLid, l)}, без кришки — за ${D(without, l)}: на ${D(Math.max(0, without - withLid), l)} довше. Кришка не випускає пару: теплота, яку без кришки забирало б випаровування з поверхні, лишається в каструлі.`
          : `With a lid the water boil${s.params.lid ? 'ed' : 's'} in ${D(withLid, l)}, without one in ${D(without, l)}: ${D(Math.max(0, without - withLid), l)} longer. A lid keeps the steam in: the heat that evaporation from the surface would take away stays in the pot.`,
      ),
    };
  },
  'melt-ice': ({ steps }) => {
    const s = steps[0]!;
    const p = plateau(s);
    return {
      ...(p > 60 ? { correct: 'latent' } : {}),
      say: both((l) => (l === 'uk' ? 'Помітив, що температура стояла на нулі?' : 'Did you notice the temperature stuck at zero?')),
      text: both((l) =>
        l === 'uk'
          ? `Поки лід танув, термометр приблизно ${D(p, l)} показував 0 °C — температура не мінялася! Уся теплота з кімнати йшла не на нагрівання, а на руйнування кристаликів льоду: на кожен кілограм — ${sig(LF_KJ, 3, l)} кДж (питома теплота плавлення). Лише коли розтанув останній шматочок, вода почала теплішати.`
          : `While the ice was melting, the thermometer showed 0 °C for about ${D(p, l)} — the temperature did not change! All the heat from the room went not into warming but into breaking the ice crystals: ${sig(LF_KJ, 3, l)} kJ for every kilogram (the latent heat of fusion). Only when the last piece melted did the water start to warm up.`,
      ),
    };
  },
  'melt-tin': ({ steps }) => {
    const s = steps[0]!;
    const p = plateau(s);
    const tm = COMPONENTS.tin.melting!.point.value;
    const lf = COMPONENTS.tin.melting!.latentHeat!.value / 1000;
    return {
      ...(p > 30 ? { correct: 'stays' } : {}),
      say: both((l) => (l === 'uk' ? 'Бачив «полицю» на графіку?' : 'Did you see the flat “shelf” on the graph?')),
      text: both((l) =>
        l === 'uk'
          ? `Поки олово плавилося, термометр приблизно ${D(p, l)} показував ${sig(tm, 4, l)} °C — температура стояла на місці, хоч спиртівка гріла весь час. Уся теплота йшла на руйнування кристалічної ґратки: ${sig(lf, 3, l)} кДж на кожен кілограм (питома теплота плавлення олова). На графіку нагрівання це «полиця»; лише коли розплавився останній шматочок, температура знову пішла вгору.`
          : `While the tin was melting, the thermometer showed ${sig(tm, 4, l)} °C for about ${D(p, l)} — the temperature stood still although the lamp kept heating. All the heat went into breaking the crystal lattice: ${sig(lf, 3, l)} kJ for every kilogram (the latent heat of fusion of tin). On the heating graph it is a flat “shelf”; only after the last bit melted did the temperature rise again.`,
      ),
    };
  },
  'stearic-cooling': ({ steps }) => {
    const s = steps[steps.length - 1]!;
    const p = plateau(s);
    const tm = COMPONENTS['stearic-acid'].melting!.point.value;
    return {
      ...(p > 30 ? { correct: 'stays' } : {}),
      say: both((l) => (l === 'uk' ? 'Бачиш «полицю» на графіку охолодження?' : 'See the flat “shelf” on the cooling curve?')),
      text: both((l) =>
        l === 'uk'
          ? `Поки розплав твердне, термометр приблизно ${D(p, l)} показує ≈ ${sig(tm, 3, l)} °C: стеаринова кислота віддає повітрю приховану теплоту кристалізації, і її температура не падає. Лише коли все затверділо, вона знову холоне. За «полицею» на графіку охолодження визначають температуру плавлення речовини.`
          : `While the melt sets, the thermometer shows ≈ ${sig(tm, 3, l)} °C for about ${D(p, l)}: stearic acid gives its latent heat of crystallisation to the air, so its temperature does not fall. Only when it has all set does it cool again. The “shelf” on a cooling curve tells the melting point of a substance.`,
      ),
    };
  },
  'specific-heat-water': ({ steps }) => {
    const s = steps[0]!;
    const t = reachedAt(s);
    const P = 500;
    const m = bodyMassOf(s.result.initial);
    const dT = temp(s.result.final) - temp(s.result.initial);
    const c = (P * t) / (m * dT);
    const table = CW;
    const extra = Math.round((c / table - 1) * 100);
    return {
      correct: Math.abs(c - table) / table < 0.01 ? 'table' : c > table ? 'more' : 'less',
      say: both((l) => (l === 'uk' ? `Вийшло ≈ ${sig(c, 3, l)} Дж/(кг·°C)!` : `It came out ≈ ${sig(c, 3, l)} J/(kg·°C)!`)),
      text: both((l) =>
        l === 'uk'
          ? `Кип’ятильник за ${D(t, l)} віддав E = P·t = ${sig(P * t / 1000, 3, l)} кДж, вода (${sig(m * 1000, 3, l)} г) нагрілася на ${sig(dT, 3, l)} °C. Тож c = P·t / (m·Δt) ≈ ${sig(c, 3, l)} Дж/(кг·°C) — на ${extra} % більше за табличні ${sig(table, 4, l)}. Чому більше: частина теплоти пішла не у воду, а на нагрівання склянки, кип’ятильника й повітря, а ми порахували так, ніби вся дісталася воді. Що менші втрати, то ближче до таблиці.`
          : `In ${D(t, l)} the heater gave E = P·t = ${sig(P * t / 1000, 3, l)} kJ, and the water (${sig(m * 1000, 3, l)} g) warmed by ${sig(dT, 3, l)} °C. So c = P·t / (m·Δt) ≈ ${sig(c, 3, l)} J/(kg·°C) — ${extra} % more than the table's ${sig(table, 4, l)}. Why more: part of the heat went not into the water but into the glass, the heater and the air, yet we counted it as if all of it went into the water. The smaller the losses, the closer to the table.`,
      ),
    };
  },
  'salt-in-pot': ({ steps }) => {
    const first = steps[0]!;
    const furnace = steps.find((x) => x.params.cooler);
    const tm = COMPONENTS['sodium-chloride'].melting!.point.value;
    const correct = first.status.kind === 'vessel-fails' ? 'pot-burns' : first.status.kind === 'stalls' ? 'too-cold' : first.status.kind === 'reached' ? 'melts' : undefined;
    const top = first.status.kind === 'stalls' ? first.status.limit : temp(first.result.final);
    return {
      ...(correct ? { correct } : {}),
      say: both((l) => (l === 'uk' ? 'На плиті сіль не розплавити!' : 'You cannot melt salt on a stove!')),
      text: both((l) =>
        l === 'uk'
          ? `На газовій плиті сіль нагрілася лише до ≈ ${C(top, l)} — далі втрати (повітря забирає теплоту, а розпечена каструля ще й випромінює її) зрівнялися з теплотою від полум’я. До ${sig(tm, 4, l)} °C так не дійти, а каструля вціліла — сталь плавиться значно вище.${furnace ? ` У муфельній печі при 900 °C та сама сіль у порцеляновому тиглі розплавилася за ${D(reachedAt(furnace), l)}.` : ''}`
          : `On a gas stove the salt only got to ≈ ${C(top, l)} — then the losses (the air takes heat away, and the red-hot pot also radiates it) matched the heat from the flame. That is far from ${sig(tm, 4, l)} °C; the pot survived — steel melts much higher.${furnace ? ` In a muffle furnace at 900 °C the same salt in a porcelain crucible melted in ${D(reachedAt(furnace), l)}.` : ''}`,
      ),
    };
  },
  'freeze-water': ({ steps }) => {
    const s = steps[0]!;
    const total = reachedAt(s);
    const ice = firstIce(s);
    const cool = ice?.at ?? total;
    const freeze = Math.max(0, total - cool);
    const degrees = Math.round((LF_KJ * 1000) / CW);
    return {
      correct: freeze > cool * 1.1 ? 'freezing' : cool > freeze * 1.1 ? 'cooling' : 'equal',
      say: both((l) => (l === 'uk' ? (freeze > cool ? 'Замерзати — довше, ніж холонути!' : 'Ось і лід!') : freeze > cool ? 'Freezing takes longer than cooling!' : 'There is the ice!')),
      text: both((l) =>
        l === 'uk'
          ? `Охолодити воду до 0 °C вдалося за ${D(cool, l)}, а перетворити її на лід — ще за ${D(freeze, l)}. Щоб вода замерзла, з неї треба забрати ${sig(LF_KJ, 3, l)} кДж на кожен кілограм — стільки ж, скільки потрібно, щоб нагріти той самий кілограм води на ≈ ${degrees} °C.`
          : `Cooling the water to 0 °C took ${D(cool, l)}, and turning it into ice another ${D(freeze, l)}. To freeze, water has to give away ${sig(LF_KJ, 3, l)} kJ per kilogram — as much as it takes to warm the same kilogram of water by ≈ ${degrees} °C.`,
      ),
    };
  },
  'road-salt': ({ steps }) => {
    const ice = steps.map(firstIce).find((x) => x !== undefined);
    const last = steps[steps.length - 1]!;
    const solid = sampleOf(last.result.final).state.solidFraction ?? 0;
    const firstSolid = sampleOf(steps[0]!.result.final).state.solidFraction ?? 0;
    const te = NACL_SOLUTE.eutectic.t;
    const sp = steps[0]!.params.cooler?.setpoint ?? 0;
    return {
      correct: firstSolid >= 0.999 ? 'yes' : firstSolid > 0.01 ? 'partly' : 'no',
      say: both((l) => (l === 'uk' ? 'Ось чому солять дороги!' : 'That is why roads are salted!')),
      text: both((l) => {
        const uk = l === 'uk';
        const start = ice ? C(ice.T, l) : uk ? 'нижче нуля' : 'below zero';
        const tE = `${sig(te, 3, l).replace('-', '−')} °C`;
        const head = uk
          ? `Морська вода почала замерзати лише при ${start}, а не при 0 °C, як прісна. При ${sig(sp, 3, l).replace('-', '−')} °C замерзло тільки ${Math.round(firstSolid * 100)} % води: лід утворюється з прісної води, а розсіл, що лишається, стає солонішим і замерзає дедалі холодніше — повністю аж нижче ${tE}.`
          : `Sea water started to freeze only at ${start}, not at 0 °C like fresh water. At ${sig(sp, 3, l)} °C only ${Math.round(firstSolid * 100)} % of the water froze: ice forms from fresh water, and the brine left behind gets saltier and freezes ever colder — completely only below ${tE}.`;
        const tail = uk
          ? ' Тому сіль на дорозі перетворює лід на солону воду, яка не замерзає на помірному морозі.'
          : ' That is why salt on a road turns ice into salty water that does not freeze in a moderate frost.';
        const more =
          steps.length > 1 && solid >= 1
            ? uk
              ? ` А в холоднішій морозилці вона нарешті замерзла повністю.`
              : ` In a colder freezer it finally froze completely.`
            : '';
        return head + tail + more;
      }),
    };
  },
  'alcohol-vs-water': ({ steps, simulation }) => {
    const s = steps[0]!;
    const t = reachedAt(s);
    const tw = timeToGoal({ ...s.params, substance: 'water' }, simulation);
    const less = Math.round((1 - COMPONENTS.ethanol.phases.liquid!.specificHeat!.value / CW) * 100);
    const tb = COMPONENTS.ethanol.boiling!.point.value;
    return {
      correct: t < tw * 0.95 ? 'alcohol' : tw < t * 0.95 ? 'water' : 'equal',
      say: both((l) => (l === 'uk' ? 'Спирт — швидший!' : 'Alcohol wins!')),
      text: both((l) =>
        l === 'uk'
          ? `Спирт закипів за ${D(t, l)} при ${sig(tb, 3, l)} °C. Стільки ж води в тому самому стакані закипало б ${D(tw, l)} — у ${ratio(tw, t, l)} раза довше. Причин дві: спирт кипить нижче (${sig(tb, 3, l)} °C проти 100 °C), а нагріти його на 1 °C потрібно на ${less} % менше енергії, ніж воду.`
          : `Alcohol boiled in ${D(t, l)} at ${sig(tb, 3, l)} °C. The same amount of water in the same beaker would take ${D(tw, l)} — ${ratio(tw, t, l)} times longer. Two reasons: alcohol boils lower (${sig(tb, 3, l)} °C against 100 °C), and warming it by 1 °C takes ${less} % less energy than water.`,
      ),
    };
  },
  'sea-salt': ({ steps }) => {
    const mix = sampleOf(steps[steps.length - 1]!.result.final).state.mixture;
    const salt = mix?.salt ?? 0;
    const crystals = mix?.crystals ?? 0;
    return {
      correct: salt > 0 && crystals / salt > 0.95 ? 'all' : crystals > 0 ? 'some' : 'none',
      say: both((l) => (l === 'uk' ? 'Уся сіль повернулася!' : 'All the salt came back!')),
      text: both((l) =>
        l === 'uk'
          ? `Ми розчинили у воді ${Q(salt, 'kg', l)} солі, а коли вода випарувалась, на дні лишилося ${Q(crystals, 'kg', l)} кристалів — уся сіль. Під час розчинення вона не зникла: розпалася на частинки, надто малі, щоб їх побачити, і просто чекала у воді. Так можна добути сіль і з морської води.`
          : `We dissolved ${Q(salt, 'kg', l)} of salt in water, and when the water boiled away, ${Q(crystals, 'kg', l)} of crystals were left on the bottom — all of it. Dissolving did not destroy it: it broke into particles too small to see and simply waited in the water. Salt can be won from sea water the same way.`,
      ),
    };
  },
  'does-water-conduct': ({ steps }) => {
    const before = current(steps[0]!).amps;
    const after = current(steps[steps.length - 1]!).amps;
    return {
      correct: before >= 0.01 ? 'well' : before > 0 ? 'barely' : 'never',
      say: both((l) => (l === 'uk' ? 'Струм несуть йони солі!' : 'The salt ions carry the current!')),
      text: both((l) =>
        l === 'uk'
          ? `У дистильованій воді струм був лише ${A(before, l)} — вона майже не проводить електрику. Коли досипали солі, струм став ${A(after, l)}${before > 1e-6 ? ` — у ${ratio(after, before, l)} разів більше` : ''}! Сіль у воді розпадається на заряджені частинки — йони Na⁺ і Cl⁻, і саме вони переносять заряд. Вода з крана теж містить розчинені солі й проводить струм — тому з електроприладами біля води треба бути обережним.`
          : `In distilled water the current was only ${A(before, l)} — it barely conducts electricity. After adding salt the current became ${A(after, l)}${before > 1e-6 ? ` — ${ratio(after, before, l)} times more` : ''}! In water salt splits into charged particles — Na⁺ and Cl⁻ ions, and they carry the charge. Tap water also contains dissolved salts and conducts — so be careful with electrical devices near water.`,
      ),
    };
  },
  'joule-heating': ({ steps }) => {
    const s = steps[0]!;
    const { amps, time } = current(s);
    const dT = temp(s.result.final) - temp(s.result.initial);
    const heat = (e: SystemState) => (e.entities['supply.heat' as never] as unknown as { state: { energyDelivered: number } } | undefined)?.state.energyDelivered ?? 0;
    const q = heat(s.result.final) - heat(s.result.initial);
    return {
      say: both((l) => (l === 'uk' ? `Нагріли струмом на ${sig(dT, 2, l)} °C!` : `Heated by ${sig(dT, 2, l)} °C with a current!`)),
      text: both((l) =>
        l === 'uk'
          ? `За ${D(time, l)} струм ${A(amps, l)} нагрів морську воду на ${sig(dT, 2, l)} °C: у рідині виділилося ${Q(q, 'J', l)} теплоти. Це закон Джоуля–Ленца: Q = I²·R·t — удвічі більший струм гріє вчетверо сильніше. Так працюють кип’ятильники й чайники, тільки струм там іде через металеву спіраль, а не через воду.`
          : `In ${D(time, l)} a current of ${A(amps, l)} warmed the sea water by ${sig(dT, 2, l)} °C: ${Q(q, 'J', l)} of heat was released in the liquid. This is the Joule–Lenz law: Q = I²·R·t — twice the current heats four times as much. Immersion heaters and kettles work like this, only the current flows through a metal coil, not through the water.`,
      ),
    };
  },
  'copper-sulfate-electrolysis': ({ steps }) => {
    const s = steps[steps.length - 1]!;
    const sup = (st: SystemState) => Object.values(st.entities).find(isSupply);
    const made = (k: string) => (sup(s.result.final)?.state.made?.[k] ?? 0) - (sup(s.result.initial)?.state.made?.[k] ?? 0);
    const cu = made('copper') * 0.063546 * 1000;
    const o2 = (made('oxygen') * GAS_CONSTANT * temp(s.result.initial)) / 101_325;
    return {
      ...(cu > 0 ? { correct: 'copper' } : made('hydrogen') > 0 ? { correct: 'hydrogen' } : {}),
      say: both((l) => (l === 'uk' ? 'Катод став мідним!' : 'The cathode turned copper-coloured!')),
      text: both((l) =>
        l === 'uk'
          ? `На катоді осіло ${sig(cu, 2, l)} г міді: йони Cu²⁺ забирають електрони й стають металом (Cu²⁺ + 2e⁻ → Cu). Водню там немає — мідь відновлюється легше за воду (0,34 В проти −0,83 В). На аноді виділилося ≈ ${sig(o2 * 1e6, 2, l)} мл кисню, а в розчині лишається сульфатна кислота. Так очищують мідь і вкривають предмети шаром металу — гальванотехніка.`
          : `${sig(cu, 2, l)} g of copper settled on the cathode: Cu²⁺ ions take electrons and become metal (Cu²⁺ + 2e⁻ → Cu). No hydrogen there — copper is reduced more easily than water (0.34 V against −0.83 V). About ${sig(o2 * 1e6, 2, l)} mL of oxygen formed at the anode, and sulfuric acid stays in the solution. This is how copper is refined and objects are plated — electroplating.`,
      ),
    };
  },
  electrolysis: ({ steps }) => {
    const s = steps[0]!;
    const { charge, time } = current(s);
    // Hydrogen the cell made (Faraday, counted step by step by the electrical solver).
    const sup = (st: SystemState) => Object.values(st.entities).find(isSupply);
    const moles = (sup(s.result.final)?.state.made?.['hydrogen'] ?? 0) - (sup(s.result.initial)?.state.made?.['hydrogen'] ?? 0);
    const h2 = (moles * GAS_CONSTANT * temp(s.result.initial)) / 101_325;
    return {
      say: both((l) => (l === 'uk' ? `≈ ${sig(h2 * 1e6, 2, l)} мл водню!` : `≈ ${sig(h2 * 1e6, 2, l)} mL of hydrogen!`)),
      text: both((l) =>
        l === 'uk'
          ? `За ${D(time, l)} через розчин пройшов заряд ${Q(charge, 'C', l)}, і на електродах виділилося ≈ ${Q(h2 * 1e6, 'mL', l)} водню та стільки ж хлору. За законом Фарадея газу виділяється рівно стільки, скільки заряду пройшло: удвічі довше або удвічі більший струм — удвічі більше газу.`
          : `In ${D(time, l)} a charge of ${Q(charge, 'C', l)} passed through the solution, and ≈ ${Q(h2 * 1e6, 'mL', l)} of hydrogen and as much chlorine formed at the electrodes. By Faraday's law the gas is exactly proportional to the charge: twice as long or twice the current — twice the gas.`,
      ),
    };
  },
  'oil-does-not-boil': ({ steps }) => {
    const s = steps[steps.length - 1]!;
    return {
      correct: s.status.kind === 'decomposes' ? 'smokes' : 'boils',
      say: both((l) => (l === 'uk' ? 'Олія не кипить — вона димить!' : 'Oil does not boil — it smokes!')),
      text: both((l) =>
        l === 'uk'
          ? `Олія так і не закипіла: при ${C(temp(s.result.final), l)} вона почала димітися й розкладатися. Вода кипить при 100 °C і вище не нагрівається, а олія розкладається раніше, ніж закипить, — зате нагрівається значно сильніше. Тому на олії смажать: вона гріє їжу набагато гарячіше за окріп.`
          : `The oil never boiled: at ${C(temp(s.result.final), l)} it started to smoke and break down. Water boils at 100 °C and gets no hotter, while oil breaks down before it boils — but gets much hotter. That is why we fry in oil: it heats food far hotter than boiling water.`,
      ),
    };
  },
  'alcohol-in-freezer': ({ steps }) => {
    const s = steps[steps.length - 1]!;
    const tf = COMPONENTS.ethanol.melting!.point.value;
    return {
      correct: (sampleOf(s.result.final).state.solidFraction ?? 0) > 0 ? 'yes' : 'no',
      say: both((l) => (l === 'uk' ? 'Спирт морозу не боїться!' : 'Alcohol does not mind the frost!')),
      text: both((l) =>
        l === 'uk'
          ? `Спирт охолонув до ${C(temp(s.result.final), l)}, але лишився рідким: він замерзає лише при ${sig(tf, 3, l).replace('-', '−')} °C — жодна домашня морозилка так не вміє. Вода тут давно стала б льодом.`
          : `The alcohol cooled to ${C(temp(s.result.final), l)} but stayed liquid: it freezes only at ${sig(tf, 3, l)} °C — no home freezer gets that cold. Water would have turned to ice long ago.`,
      ),
    };
  },
  'grand-chain': ({ steps }) => {
    const currents = steps.filter((s) => s.params.supply);
    const a = currents[0];
    const b = currents[currents.length - 1];
    if (!a || !b || a === b) return { say: both(() => ''), text: both(() => '') };
    const i1 = current(a).amps, i2 = current(b).amps;
    return {
      correct: i2 > i1 * 1.05 ? 'more' : i2 < i1 * 0.95 ? 'less' : 'same',
      say: both((l) => (l === 'uk' ? 'Гарячий розчин проводить краще!' : 'A hot solution conducts better!')),
      text: both((l) =>
        l === 'uk'
          ? `У розчині при ≈ ${C(temp(a.result.initial), l)} струм був ${A(i1, l)}, а в гарячому, при ≈ ${C(temp(b.result.initial), l)}, — ${A(i2, l)}: на ${Math.round((i2 / Math.max(i1, 1e-12) - 1) * 100)} % більше при тій самій напрузі. Що гарячіша рідина, то легше в ній рухаються йони — і тим краще вона проводить струм.`
          : `In the solution at ≈ ${C(temp(a.result.initial), l)} the current was ${A(i1, l)}, in the hot one at ≈ ${C(temp(b.result.initial), l)} — ${A(i2, l)}: ${Math.round((i2 / Math.max(i1, 1e-12) - 1) * 100)} % more at the same voltage. The hotter the liquid, the easier its ions move — and the better it conducts.`,
      ),
    };
  },
};
