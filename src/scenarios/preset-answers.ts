import type { MeasurementRecord } from '../core/trace.js';
import { COMPONENTS, NACL_SOLUTE } from '../components/index.js';
import type { Command } from '../core/commands.js';
import type { ExperimentResult } from '../core/experiment.js';
import type { Simulation } from '../core/simulation.js';
import type { SystemState } from '../core/state.js';
import { ZERO_CELSIUS_IN_KELVIN } from '../core/units.js';
import { cellReading } from '../domains/electrical/conductivity.js';
import { isSupply } from '../domains/electrical/entities.js';
import { electrolysisGases } from '../domains/electrical/gases.js';
import { formatDuration, formatQuantity, sig } from '../explain/format.js';
import type { Locale, LocalizedText } from '../knowledge/i18n.js';
import { paperTime, timeToGoal } from './lab-debrief.js';
import { sampleOf, type LabParams, type LabStatus } from './thermal-lab.js';
import { formatReading, weigh } from './weighing.js';
import { SUBSTANCES } from '../substances/catalog.js';
import { formatMeasured } from './measuring.js';
import { createCommandRegistry } from '../core/commands.js';
import { createExperimentSession } from '../core/experiment.js';
import { kilograms, seconds } from '../core/units.js';
import { isThermalBody } from '../domains/thermal/entities.js';
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
const ratio = (a: number, b: number, l: Locale) => sig(a / Math.max(b, 1e-12), 2, l);

/** The temperature right after something was poured in: what the heat balance gives (from the log), or the step's start. */
function mixedAt(s: Step): number {
  for (const e of s.result.log) if (e.ok) for (const r of e.trace) if (r.kind === 'formula' && r.formula === 'thermal.equilibrium-temperature') return r.output;
  return temp(s.result.initial);
}
/** The block put into the liquid in this step: substance, mass and the temperature it went in at. */
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
  electrolysis: ({ steps }) => {
    const s = steps[0]!;
    const { charge, time } = current(s);
    const e = cellReading(sampleOf(s.result.final)).electrolysis;
    const gases = e ? electrolysisGases(e, charge, temp(s.result.initial)) : [];
    const h2 = gases[0]?.volume ?? 0;
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
