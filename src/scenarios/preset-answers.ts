import { G } from '../domains/mechanics/constants.js';
import type { MeasurementRecord } from '../core/trace.js';
import { COMPONENTS, molarMass as molarMassOf, NACL_SOLUTE } from '../components/index.js';
import type { Command } from '../core/commands.js';
import type { ExperimentResult } from '../core/experiment.js';
import type { Simulation } from '../core/simulation.js';
import type { SystemState } from '../core/state.js';
import { ZERO_CELSIUS_IN_KELVIN } from '../core/units.js';
import { cellReading } from '../domains/electrical/conductivity.js';
import { isSupply } from '../domains/electrical/entities.js';
import { FARADAY, GAS_CONSTANT } from '../domains/electrical/gases.js';
import { formatDuration, formatQuantity, sig } from '../explain/format.js';
import { tr, type Locale, type LocalizedText } from '../knowledge/i18n.js';
import { paperTime, timeToGoal } from './lab-debrief.js';
import { LAB_VESSEL_ID, sampleOf, type LabParams, type LabStatus } from './thermal-lab.js';
import { formatReading, weigh } from './weighing.js';
import { SUBSTANCES } from '../substances/catalog.js';
import { formatMeasured } from './measuring.js';
import { AMMETER, VOLTMETER } from './circuit-bench.js';
import { vesselName, type PascalVessel } from './vessels-bench.js';
import { sinkLiquidName, type SinkLiquid } from './sink-bench.js';
import { rowName, type RowBody } from './rows-bench.js';
import { liftPhaseText, type LiftPhase } from './lift-bench.js';
import { BOUNCE_FROM, bounceBallName, type BounceBall } from './bounce-bench.js';
import { winchSpoolName, type WinchSpool } from './winch-bench.js';
import { BEAUFORT, beaufortOf, WIND_TRACK } from './wind-bench.js';
import { STROBE_INTERVAL, STROBE_SCALE } from './strobe-bench.js';
import { SNAIL_TIME, snailSurfaceName, type SnailSurface } from './snail-bench.js';
import { DRAG_COEFFICIENTS, DRAG_MASS, DRAG_START, DRAG_TRACK, dragBody, dragShapeName, mediumDensity, framesText, type DragShape } from './drag-bench.js';
import { TOWER_BODIES, TOWER_LIQUIDS, towerLiquidDensity, towerLiquidIn, towerLiquidName, type TowerBody } from './tower-bench.js';
import { clockText, equalShadowsNoon, gnomonClock, gnomonPlace, GNOMON_HEIGHT, latitudeFrom, sunOf } from './gnomon-bench.js';
import { offsetText } from './place-time.js';
import { AIRSHIP, airPlace, type AirWhere } from './air-bench.js';
import { modelScale, planetIds } from './planets-bench.js';
import { SHEET } from './scales-bench.js';
import { CALENDARS, daysText, dateText, equinoxDate, EQUINOX } from './calendar-bench.js';
import { touchPlan, touchSeen, type TouchCase } from './touch-bench.js';
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
  /** Why it comes out so: the reasoning behind the result, at a pupil's level (not only the formula). */
  readonly why?: LocalizedText;
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
    // What the cube pushed aside (by the marks), the mass of that water — the ice's own — and the room the ice takes.
    const shown = w && a ? a.value! - w.value! : 0;
    const iceMass = shown * WATER;
    const iceVolume = iceMass / ICE;
    // As exact as the marks it comes from (a cylinder read to its division): «≈ 10 г», not «9,97 г».
    const gr = (kg: number, l: Locale) => `≈ ${sig(kg * 1000, 2, l)} ${l === 'uk' ? 'г' : 'g'}`;
    return {
      why: both((l) => (l === 'uk' ? "Лід плаває, отже архімедова сила дорівнює його вазі: він витісняє воду рівно своєї маси. Розтанувши, лід стає водою тієї самої маси — маса під час танення не змінюється, — а вода тієї самої маси займає рівно той об’єм, який витісняв лід. Тому рівень лишається, де був. А лід, що лежить на суші (льодовики), води не витісняє — розтанувши, він додає воду в океан, і рівень росте." : "Ice floats, so the buoyant force equals its weight: it pushes aside water of exactly its own mass. Melted, the ice becomes water of the same mass — melting does not change the mass — and water of that mass takes exactly the room the ice pushed aside. So the level stays. Ice lying on land (glaciers) pushes aside no water — melted, it adds water to the ocean, and the level rises.")),
      say: both((l) => (l === 'uk' ? 'Рівень не зрушив ні на поділку!' : 'The level did not move by a mark!')),
      text: both((l) =>
        l === 'uk'
          ? `${w ? `Без льоду вода стояла на позначці ${mL(w.value!, l)}. ` : ''}З кубиком — ${a ? mL(a.value!, l) : '—'}. ${
              shown
                ? `Плаваючий лід витіснив ${mL(shown, l)} води — це ${gr(iceMass, l)}: маса витісненої води дорівнює масі льоду (вага витісненої води врівноважує вагу кубика — закон Архімеда). Сам кубик займає більше — ≈ ${mL(iceVolume, l)}, бо густина льоду менша за густину води; під водою була ≈ ${under} % його об’єму.`
                : `Плаваючий лід витісняє воду, маса якої дорівнює масі льоду (закон Архімеда); під водою ≈ ${under} % об’єму кубика, бо густина льоду менша за густину води.`
            } Коли лід розтанув — ${b ? mL(b.value!, l) : '—'}. Маса під час танення не змінюється: ${shown ? `${gr(iceMass, l)} льоду стали ${gr(iceMass, l)} води, а ${gr(iceMass, l)} води займають якраз ${mL(shown, l)}` : 'вода з льоду має ту саму масу, що й витіснена вода, а отже — і той самий об’єм'} — рівно стільки, скільки витісняв кубик. Тому рівень не змінюється; так само не підіймає рівень океану морський лід, що тане, — на відміну від льодовиків на суші.`
          : `${w ? `Without ice the water stood at ${mL(w.value!, l)}. ` : ''}With the cube — ${a ? mL(a.value!, l) : '—'}. ${
              shown
                ? `The floating ice pushed aside ${mL(shown, l)} of water — that is ${gr(iceMass, l)}: the displaced water has the mass of the ice (its weight balances the cube's — Archimedes). The cube itself takes more room — ≈ ${mL(iceVolume, l)}, as ice is less dense than water; ≈ ${under} % of its volume was under water.`
                : `Floating ice pushes aside water of its own mass (Archimedes); ≈ ${under} % of the cube's volume is under water, as ice is less dense than water.`
            } Once the ice melted — ${b ? mL(b.value!, l) : '—'}. Melting does not change the mass: ${shown ? `${gr(iceMass, l)} of ice became ${gr(iceMass, l)} of water, and ${gr(iceMass, l)} of water take exactly ${mL(shown, l)}` : 'the meltwater has the mass of the displaced water, and so its volume'} — just as much as the cube pushed aside. So the level stays; melting sea ice does not raise the ocean either — unlike glaciers on land.`,
      ),
      ...(a && b ? { correct: d > div / 2 ? 'up' : d < -div / 2 ? 'down' : 'same' } : {}),
    };
  },
  'slope-efficiency': (run) => {
    const R = run.readings ?? [];
    const P = R.find((x) => x.command.type === 'lab.hang')?.record.value ?? null;
    const rows = R.filter((x) => x.command.type === 'lab.slope' && x.record.value !== null).map((x) => ({ h: x.record.inputs?.['h'] ?? 0, l: x.record.inputs?.['l'] ?? 1, F: x.record.value! }));
    const eta = rows.map((x) => (P !== null ? (P * x.h) / (x.F * x.l) : 0));
    const trend = eta.length >= 2 ? eta[eta.length - 1]! - eta[0]! : 0;
    const correct = P !== null && rows.length >= 2 ? (trend > 0.03 ? 'grows' : trend < -0.03 ? 'falls' : 'same') : undefined;
    const N1 = (x: number, l: Locale) => formatMeasured('force', x, 0.1, l);
    const pct = (x: number, l: Locale) => `${sig(x * 100, 2, l)} %`;
    return {
      ...(correct ? { correct } : {}),
      why: both((l) => (l === 'uk' ? "Щоб підняти брусок на висоту h, треба виконати роботу P·h — хоч прямо вгору, хоч по похилій. Тягнучи вздовж дошки довжиною l, довшої за h, ту саму роботу виконують меншою силою: без тертя F = P·h / l — у стільки разів менша за вагу, у скільки разів дошка довша за висоту. Але брусок тисне на дошку й треться об неї: до сили додається тертя μ·P·cos α, і ця частина роботи йде в тепло, а не на підйом. Що крутіша дошка, то менше брусок тисне на неї (cos α менший) — менше тертя, — і водночас більша частка сили йде саме на підйом (sin α більший). Тому ККД росте з висотою, а 100 % не буде ніколи: тертя є завжди." : "Lifting the block by h takes the work P·h — straight up or along a slope. Pulling along a board of length l longer than h, the same work is done with a smaller force: without friction F = P·h / l — as many times less than the weight as the board is longer than the height. But the block presses on the board and rubs on it: friction μ·P·cos α adds to the force, and that part of the work goes into heat, not into lifting. The steeper the board, the less the block presses on it (a smaller cos α) — less friction — and the bigger the share of the force that lifts (a larger sin α). So the efficiency grows with the height, and it never reaches 100 %: there is always friction.")),
      say: both((l) => (l === 'uk' ? 'Що крутіша площина, то менше втрат на тертя!' : 'The steeper the slope, the less is lost to friction!')),
      text: both((l) => {
        const list = rows.map((x, k) => `h = ${Math.round(x.h * 100)} ${l === 'uk' ? 'см' : 'cm'}: F = ${N1(x.F, l)}, η ≈ ${pct(eta[k]!, l)}`).join('; ');
        return l === 'uk'
          ? `Брусок із тягарцями важить P = ${P !== null ? N1(P, l) : '—'}. ${list}. Що вище піднята дошка, то вищий ККД: брусок менше тисне на дошку (сила тертя пропорційна P·cos α), і на тертя йде менша частка роботи. Похила площина дає виграш у силі — тягнути легше, ніж піднімати (F < P), — але програє у відстані: «золоте правило механіки». ККД завжди менший за 100 %, бо тертя є завжди.`
          : `The block with its weights weighs P = ${P !== null ? N1(P, l) : '—'}. ${list}. The higher the board, the higher the efficiency: the block presses on it less (friction is proportional to P·cos α), and a smaller share of the work goes into friction. A slope gains in force — pulling is easier than lifting (F < P) — but loses in distance: the “golden rule of mechanics”. The efficiency is always below 100 %, as there is always friction.`;
      }),
    };
  },
  'consumer-power': (run) => {
    const rows = (run.readings ?? [])
      .filter((x) => x.command.type === 'lab.circuit')
      .reduce<{ I: number; U: number }[]>((acc, x, k, all) => (x.record.quantity === 'current' ? [...acc, { I: x.record.value ?? 0, U: all[k + 1]?.record.value ?? 0 }] : acc), [])
      .filter((x) => x.I > 0);
    const P = rows.map((x) => x.U * x.I);
    const ratio = P.length >= 2 ? P[1]! / P[0]! : 0;
    const A = (x: number, l: Locale) => formatMeasured('current', x, 0.01, l);
    const V = (x: number, l: Locale) => formatMeasured('voltage', x, 0.1, l);
    const W = (x: number, l: Locale) => `${sig(x, 2, l)} ${l === 'uk' ? 'Вт' : 'W'}`;
    return {
      ...(P.length >= 2 ? { correct: ratio > 3 ? 'four' : ratio > 1.4 ? 'two' : 'same' } : {}),
      why: both((l) => (l === 'uk' ? 'Потужність — це добуток двох величин: напруги й сили струму. А сила струму в резисторі сама пропорційна напрузі (закон Ома: I = U/R). Тож, подвоївши напругу, ми подвоюємо обидва множники: удвічі більша напруга «штовхає» удвічі більший струм — і потужність зростає в 2 · 2 = 4 рази: P = U²/R. Тому лампочка, розрахована на 220 В, у мережі зі 110 В світить ледь-ледь — її потужність учетверо менша, — а прилад, увімкнений на подвійну напругу, швидко перегріється.' : 'Power is the product of two quantities: the voltage and the current. And the current in a resistor is itself proportional to the voltage (Ohm’s law: I = U/R). So, doubling the voltage, we double both factors: twice the voltage drives twice the current — and the power grows 2 · 2 = 4 times: P = U²/R. That is why a bulb made for 220 V glows barely at 110 V — a quarter of its power — and a device put on twice its voltage soon overheats.')),
      say: both((l) => (l === 'uk' ? `Удвічі більша напруга — у ${sig(ratio, 2, l)} раза більша потужність!` : `Twice the voltage — ${sig(ratio, 2, l)} times the power!`)),
      text: both((l) => {
        const list = rows.map((x, k) => `U = ${V(x.U, l)}, I = ${A(x.I, l)} → P ≈ ${W(P[k]!, l)}`).join('; ');
        return l === 'uk'
          ? `${list}. Напруга зросла вдвічі — потужність зросла в ${sig(ratio, 2, l)} раза, тобто майже вчетверо (розбіжність — від цін поділок приладів); утричі — у ${sig(P.length >= 3 ? P[2]! / P[0]! : 0, 2, l)} раза, майже вдев’ятеро. Потужність резистора пропорційна квадрату напруги: P = U · I = U² / R.`
          : `${list}. The voltage doubled — the power grew ${sig(ratio, 2, l)} times, almost four times (the difference comes from the instruments’ divisions); tripled — ${sig(P.length >= 3 ? P[2]! / P[0]! : 0, 2, l)} times, almost nine. A resistor’s power is proportional to the square of the voltage: P = U · I = U² / R.`;
      }),
    };
  },
  'series-circuit': (run) => pairAnswer(run, 'series'),
  'parallel-circuit': (run) => pairAnswer(run, 'parallel'),
  'conductor-resistance': (run) => {
    const rows = (run.readings ?? [])
      .filter((x) => x.command.type === 'lab.circuit')
      .reduce<{ I?: number; U?: number }[]>((acc, x, k, all) => (x.record.quantity === 'current' ? [...acc, { I: x.record.value ?? 0, U: all[k + 1]?.record.value ?? 0 }] : acc), [])
      .filter((x) => (x.I ?? 0) > 0) as { I: number; U: number }[];
    const R = rows.map((x) => x.U / x.I);
    const mean = R.reduce((a, b) => a + b, 0) / Math.max(1, R.length);
    // The same, if the first and the last R differ by no more than the instruments allow: half a division of each,
    // relative to its reading (at a small current the ammeter's 0.05 A is a large share).
    const err = (x: { I: number; U: number }) => AMMETER.division.value / 2 / x.I + VOLTMETER.division.value / 2 / x.U;
    const first = rows[0];
    const last = rows[rows.length - 1];
    const apart = first && last ? Math.abs(R[R.length - 1]! - R[0]!) - (R[0]! * err(first) + R[R.length - 1]! * err(last)) : 0;
    const A = (x: number, l: Locale) => formatMeasured('current', x, 0.01, l);
    const V = (x: number, l: Locale) => formatMeasured('voltage', x, 0.1, l);
    return {
      ...(rows.length >= 2 ? { correct: apart <= 0 ? 'same' : R[R.length - 1]! > R[0]! ? 'grows' : 'falls' } : {}),
      why: both((l) => (l === 'uk' ? 'Напруга — це те, що змушує заряджені частинки (у металі — електрони) рухатися впорядковано; опір — те, наскільки провідник цьому заважає: електрони раз у раз натрапляють на коливні йони кристалічної ґратки й гальмуються. Удвічі більша напруга вдвічі сильніше підганяє електрони — і вони рухаються вдвічі швидше, тож струм удвічі більший; а «перешкоди» в провіднику ті самі. Тому відношення U / I не змінюється — це і є опір, властивість самого провідника: він залежить від матеріалу, довжини й товщини дроту, а не від приладів і не від напруги. Так буває, поки провідник не нагрівається: у нагрітому металі йони коливаються сильніше, і опір зростає (це видно в нитки лампи).' : 'The voltage is what makes charged particles (electrons, in a metal) move in an orderly way; the resistance is how much the conductor hinders that: the electrons keep running into the vibrating ions of the crystal lattice and are slowed. Twice the voltage drives the electrons twice as hard — they drift twice as fast, so the current is twice as large; the “obstacles” in the conductor are the same. So the ratio U / I stays — that is the resistance, a property of the conductor itself: it depends on the material, the length and the thickness of the wire, not on the instruments or the voltage. This holds while the conductor does not warm up: in a hot metal the ions vibrate harder, and the resistance grows (as in a lamp’s filament).')),
      say: both((l) => (l === 'uk' ? `R ≈ ${sig(mean, 2, l)} Ом — за будь-якої напруги!` : `R ≈ ${sig(mean, 2, l)} Ω — at any voltage!`)),
      text: both((l) => {
        const list = rows.map((x, k) => `I = ${A(x.I, l)}, U = ${V(x.U, l)} → R ≈ ${sig(R[k]!, 2, l)} ${l === 'uk' ? 'Ом' : 'Ω'}`).join('; ');
        return l === 'uk'
          ? `${list}. Напруга зростала — зростав і струм, і в стільки ж разів: опір R = U / I лишався майже тим самим, ≈ ${sig(mean, 2, l)} Ом. Розкид — від цін поділок: амперметр показує струм з точністю до 0,05 А, вольтметр — напругу до 0,2 В, тож що більші покази, то точніше R. Струм у провіднику прямо пропорційний напрузі на ньому — це закон Ома для ділянки кола: I = U / R.`
          : `${list}. As the voltage rose, so did the current, and by as many times: the resistance R = U / I stayed about the same, ≈ ${sig(mean, 2, l)} Ω. The spread comes from the divisions: the ammeter reads the current to 0.05 A, the voltmeter the voltage to 0.2 V, so the larger the readings, the more precise R. The current in a conductor is proportional to the voltage across it — Ohm’s law for part of a circuit: I = U / R.`;
      }),
    };
  },
  'lever-moments': (run) => {
    const rows = (run.readings ?? []).filter((x) => x.command.type === 'lab.lever' && x.record.value !== null).map((x) => ({ F1: x.record.inputs?.['F1'] ?? 0, l1: x.record.inputs?.['l1'] ?? 0, F2: x.record.value!, l2: x.record.inputs?.['l2'] ?? 0, dyn: x.record.instrument === 'dynamometer', balanced: x.record.inputs?.['balanced'] === 1 }));
    const M = (F: number, l: number) => F * l;
    // Within what the dynamometer tells (half its 0.1 N division at that arm): the moments are equal.
    const equal = rows.every((x) => Math.abs(M(x.F1, x.l1) - M(x.F2, x.l2)) <= 0.05 * x.l2 + 1e-9);
    const forcesDiffer = rows.some((x) => Math.abs(x.F1 - x.F2) > 0.1);
    const armsDiffer = rows.some((x) => Math.abs(x.l1 - x.l2) > 1e-6);
    const correct = rows.length ? (equal ? 'moments' : !forcesDiffer ? 'forces' : !armsDiffer ? 'arms' : undefined) : undefined;
    const N = (x: number, l: Locale) => formatMeasured('force', x, 0.01, l);
    const cm = (x: number) => Math.round(x * 100);
    return {
      ...(correct ? { correct } : {}),
      why: both((l) => (l === 'uk' ? "Уяви, що важіль трохи повернувся навколо осі. Кожна точка важеля проходить дугу, і що далі точка від осі, то довша її дуга: на плечі 20 см — удвічі довша, ніж на плечі 10 см (шлях s = l · кут). Сам важіль енергії не додає й не забирає (тертя в осі мале), тож робота, яку виконує сила з одного боку, дорівнює роботі з другого: F₁·s₁ = F₂·s₂. Підстав s = l · кут — кут однаковий для всього важеля й скорочується: F₁·l₁ = F₂·l₂. Ось чому важить не сила сама по собі й не плече саме по собі, а їхній добуток — момент сили. Це й «золоте правило механіки»: удвічі менша сила — зате вдвічі довший шлях; виграєш у силі — програєш у відстані. Тому дверну ручку ставлять далеко від завіс, гайку відкручують довгим ключем, а ломом підважують камінь, який руками не зрушиш." : "Imagine the lever turned a little about its axis. Every point of it moves along an arc, and the farther a point from the axis, the longer its arc: at 20 cm twice as long as at 10 cm (the path s = l · angle). The lever itself adds no energy and takes none (there is little friction at the axis), so the work done by the force on one side equals the work on the other: F₁·s₁ = F₂·s₂. Put s = l · angle — the angle is the same for the whole lever and cancels: F₁·l₁ = F₂·l₂. That is why what matters is neither the force alone nor the arm alone but their product — the moment. This is the “golden rule of mechanics”: half the force — but twice the path; what you gain in force you lose in distance. That is why a door handle sits far from the hinges, a nut is undone with a long spanner, and a crowbar lifts a stone hands cannot move.")),
      say: both((l) => (l === 'uk' ? 'Рівні моменти — і важіль у рівновазі!' : 'Equal moments — and the lever balances!')),
      text: both((l) => {
        const list = rows.map((x) => (l === 'uk' ? `${N(x.F1, l)} · ${cm(x.l1)} см ${x.dyn ? `і динамометр ${formatMeasured('force', x.F2, 0.1, l)}` : `і ${N(x.F2, l)}`} · ${cm(x.l2)} см: M₁ ≈ ${sig(M(x.F1, x.l1), 3, l)} Н·м, M₂ ≈ ${sig(M(x.F2, x.l2), 3, l)} Н·м` : `${N(x.F1, l)} · ${cm(x.l1)} cm ${x.dyn ? `and the dynamometer ${formatMeasured('force', x.F2, 0.1, l)}` : `and ${N(x.F2, l)}`} · ${cm(x.l2)} cm: M₁ ≈ ${sig(M(x.F1, x.l1), 3, l)} N·m, M₂ ≈ ${sig(M(x.F2, x.l2), 3, l)} N·m`)).join('; ');
        return l === 'uk'
          ? `${list}. Сили з боків були різні, плечі — теж, а важіль щоразу стояв рівно: рівними були моменти сил. Умова рівноваги важеля: F₁·l₁ = F₂·l₂ — у скільки разів менша сила, у стільки разів довше її плече. Це закон важеля, відомий з часів Архімеда. Розбіжності в соті частки — бо динамометр показує лише десяті частки ньютона.`
          : `${list}. The forces on the two sides differed, so did the arms, and every time the lever stood level: the moments were equal. The condition of a lever’s balance: F₁·l₁ = F₂·l₂ — as many times smaller a force, as many times longer its arm. This is the law of the lever, known since Archimedes. Differences in the hundredths come from the dynamometer reading only tenths of a newton.`;
      }),
    };
  },
  'average-speed': (run) => {
    const R = run.readings ?? [];
    const l = R.find((x) => x.command.type === 'lab.tape')?.record.value ?? null;
    const rolls = R.filter((x) => x.command.type === 'lab.roll' && x.record.value !== null);
    const whole = rolls.find((x) => Number(x.command['path']) >= (l ?? 1) - 1e-9)?.record.value ?? null;
    const half = rolls.find((x) => Number(x.command['path']) < (l ?? 1) - 1e-9)?.record.value ?? null;
    const ok = l !== null && whole !== null && half !== null;
    const v1 = ok ? l! / whole! : 0;
    const v2 = ok ? l! / 2 / half! : 0;
    const correct = ok ? (v1 > v2 * 1.03 ? 'whole' : v2 > v1 * 1.03 ? 'half' : 'same') : undefined;
    const s = (x: number, l: Locale) => formatMeasured('time', x, 0.01, l);
    const v = (x: number, l: Locale) => `${sig(x, 2, l)} ${l === 'uk' ? 'м/с' : 'm/s'}`;
    return {
      ...(correct ? { correct } : {}),
      why: both((l) => (l === 'uk' ? "Кулька весь час розганяється: її тягне вниз уздовж жолоба частина сили тяжіння. На початку вона котиться повільно, наприкінці — швидко. Перша половина шляху — повільна частина, тому її середня швидкість менша; на всьому шляху до неї додається швидка друга половина. Під час розгону з місця шлях росте як квадрат часу (l = a·t²/2), тож половину шляху кулька проходить не за половину часу, а за ≈ 71 % (1/√2) — і середня швидкість на всьому шляху в √2 ≈ 1,4 раза більша. Тому, називаючи середню швидкість, завжди кажуть, на якій ділянці." : "The ball keeps speeding up: part of gravity pulls it down along the groove. It rolls slowly at first and fast at the end. The first half of the path is the slow part, so its average speed is lower; over the whole path the fast second half adds in. Speeding up from rest, the path grows as the square of the time (l = a·t²/2), so the ball covers half the path not in half the time but in ≈ 71 % of it (1/√2) — and the average speed over the whole path is √2 ≈ 1.4 times greater. That is why an average speed always comes with the stretch it is for.")),
      say: both((l) => (l === 'uk' ? 'Кулька розганяється — тому й середня швидкість різна!' : 'The ball speeds up — so the average speed differs!')),
      text: both((lc) =>
        lc === 'uk'
          ? `Увесь шлях l = ${ok ? formatMeasured('length', l!, 0.001, lc) : '—'} кулька пройшла за ${ok ? s(whole!, lc) : '—'}: v = l/t ≈ ${v(v1, lc)}. Першу половину — за ${ok ? s(half!, lc) : '—'}: v ≈ ${v(v2, lc)}. Кулька весь час розганяється, тож другу половину шляху вона проходить швидше за першу, і середня швидкість на всьому шляху більша — тут ${times(v1 / Math.max(v2, 1e-9), lc)}. Тому середня швидкість завжди стосується певної ділянки шляху. Секундомір тут показує точно; вручну людина вмикає й зупиняє його із запізненням ≈ 0,1–0,2 с — тому дослід у підручнику повторюють тричі й беруть середній час.`
          : `The ball covered the whole path l = ${ok ? formatMeasured('length', l!, 0.001, lc) : '—'} in ${ok ? s(whole!, lc) : '—'}: v = l/t ≈ ${v(v1, lc)}. The first half — in ${ok ? s(half!, lc) : '—'}: v ≈ ${v(v2, lc)}. The ball keeps speeding up, so it covers the second half faster than the first, and the average speed on the whole path is greater — here ${sig(v1 / Math.max(v2, 1e-9), 2, lc)} times. So an average speed always belongs to a stretch of the path. The stopwatch here reads exactly; by hand one starts and stops it ≈ 0.1–0.2 s late — that is why the textbook repeats the run three times and takes the mean time.`,
      ),
    };
  },
  'rotation-period': (run) => {
    const rows = (run.readings ?? []).filter((x) => x.command.type === 'lab.whirl' && x.record.value !== null).map((x) => ({ L: Number(x.command['thread']), N: Number(x.command['turns']), t: x.record.value!, R: x.record.inputs?.['radius'] ?? 0.15 }));
    const [a, b] = rows;
    const Ta = a ? a.t / a.N : 0;
    const Tb = b ? b.t / b.N : 0;
    const correct = a && b ? (Tb < Ta * 0.97 ? 'shorter' : Tb > Ta * 1.03 ? 'longer' : 'same') : undefined;
    const cm = (m: number, l: Locale) => formatMeasured('length', m, 0.01, l);
    const s = (x: number, l: Locale) => formatMeasured('time', x, 0.01, l);
    return {
      ...(correct ? { correct } : {}),
      why: both((l) => (l === 'uk' ? "Тіло йде по колу, бо нитка, нахилена до вертикалі, тягне його не лише вгору, а й до центру кола. Коло те саме, але коротка нитка нахилена сильніше, тож до центру тягне більша частка сили — і тіло мусить обходити коло швидше, щоб ця сила якраз утримувала його на колі. Виходить T = 2π·√(h/g), де h — висота руки над площиною кола: коротша нитка — нижче рука над колом — менший період. Це той самий закон, що й у нитяного маятника, — бо це теж маятник, тільки він не гойдається, а обертається." : "The body goes round because the slanting thread pulls it not only up but also towards the centre. The circle is the same, but a short thread slants more, so a bigger share of the pull points to the centre — and the body has to go round faster for that pull to keep it just on the circle. It comes out T = 2π·√(h/g), h being the hand’s height above the circle: a shorter thread — the hand lower over the circle — a shorter period. It is the same law as for a thread pendulum — because it is a pendulum too, only it turns instead of swinging.")),
      say: both((l) => (l === 'uk' ? 'Коротша нитка — частіше оберти!' : 'A shorter thread — quicker turns!')),
      text: both((l) =>
        l === 'uk'
          ? `${a ? `Із ниткою ${cm(a.L, l)} ${a.N} обертів тривали ${s(a.t, l)}: T = t/N ≈ ${formatMeasured('time', Ta, 0.01, l)}, n = N/t ≈ ${sig(1 / Ta, 2, l)} об/с, швидкість тіла v = 2πR/T ≈ ${sig((2 * Math.PI * a.R) / Ta, 2, l)} м/с. ` : ''}${b ? `Із ниткою ${cm(b.L, l)} — ${s(b.t, l)}: T ≈ ${formatMeasured('time', Tb, 0.01, l)}. ` : ''}Коло те саме, але коротша нитка стоїть похиліше, і тіло, щоб іти по колу, має обертатися частіше: період залежить від довжини нитки (для тіла на нитці T = 2π·√(h/g), де h — висота руки над площиною кола). Тому період міряють за багатьма обертами: один оберт триває близько секунди, а рука вмикає секундомір із запізненням ≈ 0,1–0,2 с.`
          : `${a ? `With a ${cm(a.L, l)} thread ${a.N} turns took ${s(a.t, l)}: T = t/N ≈ ${formatMeasured('time', Ta, 0.01, l)}, n = N/t ≈ ${sig(1 / Ta, 2, l)} rev/s, the body’s speed v = 2πR/T ≈ ${sig((2 * Math.PI * a.R) / Ta, 2, l)} m/s. ` : ''}${b ? `With a ${cm(b.L, l)} thread — ${s(b.t, l)}: T ≈ ${formatMeasured('time', Tb, 0.01, l)}. ` : ''}The circle is the same, but a shorter thread slants more, and to go round the circle the body has to turn more often: the period depends on the thread (for a body on a thread T = 2π·√(h/g), h being the hand’s height above the circle). That is why the period is timed over many turns: one turn takes about a second, and a hand starts the stopwatch ≈ 0.1–0.2 s late.`,
      ),
    };
  },
  pendulum: (run) => {
    const rows = (run.readings ?? []).filter((x) => x.command.type === 'lab.swing' && x.record.value !== null).map((x) => ({ L: Number(x.command['length']), A: Number(x.command['amplitude']), m: Number(x.command['mass']), T: x.record.value! / Number(x.command['count']) }));
    const [base, wide, heavy, short] = rows;
    const close = (x?: { T: number }, y?: { T: number }) => !!x && !!y && Math.abs(x.T - y.T) / y.T < 0.02;
    const ok = !!base && !!wide && !!heavy && !!short;
    const correct = ok ? (close(wide, base) && close(heavy, base) && !close(short, base) ? 'length' : !close(wide, base) ? 'amplitude' : 'mass') : undefined;
    const sT = (x: number, l: Locale) => formatMeasured('time', x, 0.01, l);
    return {
      ...(correct ? { correct } : {}),
      why: both((l) => (l === 'uk' ? "Чому маса не важить? Важчу кульку Земля тягне сильніше, але й розігнати її важче — у стільки ж разів: і сила тяжіння, і інертність пропорційні масі, тож рухається важка кулька так само, як легка (як і падають вони однаково, якщо не заважає повітря). Чому майже не важить амплітуда? За ширшого розмаху кульці далі йти, але й сила, що повертає її до середини, більша — вона пропорційна відхиленню, тож кулька й рухається швидше; при малих кутах ці два ефекти точно компенсують один одного. А довжина важить: на довшій нитці та сама сила тяжіння повертає кульку повільніше — повертальна сила пропорційна відхиленню, поділеному на довжину. Звідси T = 2π·√(l/g): учетверо довша нитка — удвічі довший період." : "Why does the mass not matter? The Earth pulls a heavier ball harder, but it is also harder to speed up — by just as much: both gravity and inertia are proportional to the mass, so a heavy ball moves like a light one (just as they fall alike when the air does not get in the way). Why does the amplitude hardly matter? With a wider swing the ball has farther to go, but the force bringing it back to the middle is larger too — proportional to how far it is out — so it also moves faster; at small angles the two cancel exactly. But the length matters: on a longer thread the same gravity brings the ball back more slowly — the restoring force is proportional to the displacement over the length. Hence T = 2π·√(l/g): a thread four times longer — twice the period.")),
      say: both((l) => (l === 'uk' ? 'Лише довжина нитки задає ритм маятника!' : 'Only the length sets a pendulum’s rhythm!')),
      text: both((l) =>
        l === 'uk'
          ? ok
            ? `Маятник 1 м: відхилення 2,5 см — T ≈ ${sT(base!.T, l)}, 5,5 см — T ≈ ${sT(wide!.T, l)}, важча кулька — T ≈ ${sT(heavy!.T, l)}: період той самий. Маятник 25 см — T ≈ ${sT(short!.T, l)}: учетверо коротша нитка — удвічі менший період. Період малих коливань не залежить ні від амплітуди, ні від маси, а лише від довжини: T = 2π·√(l/g) ≈ ${sT(2 * Math.PI * Math.sqrt(1 / G), l)} для 1 м. (За ширшого розмаху період зростає на тисячні частки — секундомір у руці цього не помітить.) Тож маятник завдовжки 4 м гойдався б із періодом ≈ 4 с — удвічі довше, ніж метровий, хай якою була б його кулька.`
            : 'Дослід ще не завершено.'
          : ok
            ? `A 1 m pendulum: 2.5 cm aside — T ≈ ${sT(base!.T, l)}, 5.5 cm — T ≈ ${sT(wide!.T, l)}, a heavier ball — T ≈ ${sT(heavy!.T, l)}: the same period. A 25 cm pendulum — T ≈ ${sT(short!.T, l)}: a thread four times shorter — half the period. The period of small swings depends on neither the amplitude nor the mass, only on the length: T = 2π·√(l/g) ≈ ${sT(2 * Math.PI * Math.sqrt(1 / G), l)} for 1 m. (A wider swing lengthens it by thousandths — a stopwatch in a hand will not notice.) So a 4 m pendulum would swing with a period of ≈ 4 s — twice as long as a metre one, whatever its ball.`
            : 'The experiment is not finished yet.',
      ),
    };
  },
  'hydraulic-press': (run) => {
    const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.press' && x.record.value !== null);
    const d1 = R.find((x) => x.record.inputs?.['which'] === 1)?.record.value ?? 0;
    const d2 = R.find((x) => x.record.inputs?.['which'] === 2)?.record.value ?? 0;
    const lifts = R.filter((x) => x.command['step'] === 'lift').map((x) => ({ n: Number(x.command['weights']), F1: x.record.value!, F2: x.record.inputs?.['load'] ?? 0 }));
    const travel = R.find((x) => x.command['step'] === 'travel')?.record;
    const areas = d1 > 0 ? (d2 / d1) ** 2 : 0;
    const diam = d1 > 0 ? d2 / d1 : 0;
    const gains = lifts.filter((x) => x.F1 > 0).map((x) => x.F2 / x.F1);
    const gain = gains.length ? gains.reduce((a, b) => a + b, 0) / gains.length : 0;
    // Closer to the ratio of the areas or of the diameters (or none at all)?
    const correct = !gains.length ? undefined : Math.abs(gain - areas) < Math.abs(gain - diam) && Math.abs(gain - areas) < Math.abs(gain - 1) ? 'areas' : Math.abs(gain - diam) < Math.abs(gain - 1) ? 'diameters' : 'none';
    const N = (x: number, l: Locale) => formatMeasured('force', x, 0.1, l);
    const cm = (m: number, l: Locale) => `${sig(m * 100, 3, l)} ${l === 'uk' ? 'см' : 'cm'}`;
    const lastLift = lifts[lifts.length - 1];
    const push = travel?.inputs?.['push'] ?? 0.06;
    const rise = travel?.value ?? 0;
    const list = (l: Locale) => lifts.map((x) => `F₂ = ${N(x.F2, l)} — F₁ = ${N(x.F1, l)}`).join('; ');
    return {
      ...(correct ? { correct } : {}),
      why: both((l) =>
        l === 'uk'
          ? 'Вода майже не стискається й передає тиск, який створює вузький поршень, в усі боки однаково — і під широкий поршень теж (закон Паскаля). Тиск — це сила на кожен квадратний сантиметр. Під широким поршнем таких сантиметрів у стільки разів більше, у скільки разів більша його площа, — у стільки ж разів більша й сила. А площа зростає як квадрат діаметра. Але за виграш у силі платять шляхом: вода з вузького шприца, розтікаючись широким, піднімає поршень на стільки ж менше.'
          : 'Water hardly compresses and passes the pressure the narrow piston makes on in all directions alike — under the wide piston too (Pascal’s law). Pressure is force on each square centimetre. Under the wide piston there are as many times more of those centimetres as its area is larger — and so as many times more force. And the area grows as the square of the diameter. But the gain in force is paid for in distance: the water from the narrow syringe, spread over the wide one, lifts its piston that many times less.',
      ),
      say: both((l) => (correct === 'areas' ? (l === 'uk' ? `Виграш у силі ≈ ${sig(gain, 2, l)} раза — як відношення площ!` : `A gain in force of ≈ ${sig(gain, 2, l)} times — the ratio of the areas!`) : l === 'uk' ? 'Подивімося, що показав динамометр.' : 'Let us look at the dynamometer.')),
      text: both((l) =>
        l === 'uk'
          ? `Діаметри поршнів ${cm(d1, l)} і ${cm(d2, l)}: широкий більший у ${sig(diam, 2, l)} раза, а його площа — у (d₂/d₁)² ≈ ${sig(areas, 2, l)} раза. ${list(l)}: широкий поршень щоразу піднімав вантаж у ≈ ${sig(gain, 2, l)} раза важчий за силу, якою тиснули на вузький, — як відношення площ, а не діаметрів. Зате коли вузький поршень опустили на ${cm(push, l)}, широкий піднявся лише на ${cm(rise, l)}: робота F₁·l₁ ≈ ${sig((lastLift?.F1 ?? 0) * push, 2, l)} Дж і F₂·l₂ ≈ ${sig((lastLift?.F2 ?? 0) * rise, 2, l)} Дж — майже однакові, у роботі виграшу немає. (Тертя поршнів не враховано: зі справжніми шприцами тиснути доводиться трохи сильніше.)`
          : `The pistons are ${cm(d1, l)} and ${cm(d2, l)} across: the wide one is ${sig(diam, 2, l)} times wider, and its area (d₂/d₁)² ≈ ${sig(areas, 2, l)} times larger. ${list(l)}: each time the wide piston lifted a load ≈ ${sig(gain, 2, l)} times the force on the narrow one — the ratio of the areas, not of the diameters. But when the narrow piston went ${cm(push, l)} down, the wide one rose only ${cm(rise, l)}: the work F₁·l₁ ≈ ${sig((lastLift?.F1 ?? 0) * push, 2, l)} J and F₂·l₂ ≈ ${sig((lastLift?.F2 ?? 0) * rise, 2, l)} J — almost the same, no gain in work. (The pistons’ friction is left out: with real syringes one has to push a little harder.)`,
      ),
    };
  },
  'bubble-speed': (run) => {
    const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.sink' && x.record.value !== null);
    const sizes = [...new Set(R.map((x) => Number(x.command['diameter'])))].sort((a, b) => a - b);
    const per = sizes.map((d) => {
      const laps = R.filter((x) => Number(x.command['diameter']) === d && x.record.quantity === 'time').map((x) => ({ s: x.record.inputs?.['mark'] ?? 0, t: x.record.value! }));
      const vs = laps.filter((x) => x.t > 0).map((x) => x.s / x.t);
      const v = vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : 0;
      return { d, laps, v, spread: vs.length ? (Math.max(...vs) - Math.min(...vs)) / v : 0 };
    });
    const [small, big] = [per[0], per[per.length - 1]];
    const correct = !small || !big || small === big ? undefined : big.v > small.v * 1.05 ? 'bigger' : small.v > big.v * 1.05 ? 'smaller' : 'same';
    const cmS = (v: number, l: Locale) => `${sig(v * 100, 2, l)} ${l === 'uk' ? 'см/с' : 'cm/s'}`;
    const s = (x: number, l: Locale) => `${sig(x, 3, l)} ${l === 'uk' ? 'с' : 's'}`;
    const lapList = (p: (typeof per)[number], l: Locale) => p.laps.map((x) => `${Math.round(x.s * 100)} ${l === 'uk' ? 'см' : 'cm'} — ${s(x.t, l)}`).join(', ');
    const liquid = String(R[0]?.command['liquid'] ?? 'washing-up');
    const ratio = small && big && small.v > 0 ? big.v / small.v : 0;
    return {
      ...(correct ? { correct } : {}),
      why: both((l) =>
        l === 'uk'
          ? 'На бульбашку діють виштовхувальна сила (вгору) й опір густої рідини (униз). Поки бульбашка розганяється, опір зростає — і за мить зрівнюється з виштовхувальною силою. Далі сили зрівноважені, і бульбашка спливає з незмінною швидкістю — рівномірно: за однакові проміжки часу — однаковий шлях. Більша бульбашка витісняє набагато більше рідини (виштовхувальна сила зростає як куб розміру), а опір — лише пропорційно розміру й швидкості. Тому їй потрібна більша швидкість, щоб опір зрівнявся з виштовхувальною силою: удвічі більша бульбашка спливає приблизно вчетверо швидше.'
          : 'A bubble feels the buoyant force (up) and the thick liquid’s drag (down). While it speeds up, the drag grows — and in a moment matches the buoyant force. From then on the forces balance and the bubble rises at a steady speed — uniformly: equal paths in equal times. A bigger bubble pushes aside much more liquid (the buoyant force grows as the cube of its size), the drag only in proportion to its size and speed. So it needs more speed for the drag to match the buoyancy: a bubble twice as big rises about four times as fast.',
      ),
      say: both((l) => (correct === 'bigger' ? (l === 'uk' ? `Більша бульбашка спливала ≈ в ${sig(ratio, 2, l)} раза швидше!` : `The bigger bubble rose ≈ ${sig(ratio, 2, l)} times as fast!`) : l === 'uk' ? 'Подивімося на секундомір.' : 'Let us look at the stopwatch.')),
      text: both((l) =>
        l === 'uk'
          ? `${per.map((p) => `Бульбашка ≈ ${sig(p.d * 1000, 2, l)} мм: ${lapList(p, l)}`).join('. ')}. Удвічі довший шлях — удвічі більший час: шлях пропорційний часу, а відношення l/t на кожній позначці те саме (розкид ${sig(Math.max(...per.map((p) => p.spread)) * 100, 2, l)} % — секундомір показує лише соті частки секунди). Отже, рух рівномірний: v ≈ ${small ? cmS(small.v, l) : ''} і ${big ? cmS(big.v, l) : ''}. Більша бульбашка спливала швидше — ≈ в ${sig(ratio, 2, l)} раза.${liquid === 'washing-up' ? ' (Скільки саме — залежить від рідини: різні марки бувають у кілька разів густіші чи рідші; а от рівномірність і «більша — швидша» не залежать.)' : ''}`
          : `${per.map((p) => `A ≈ ${sig(p.d * 1000, 2, l)} mm bubble: ${lapList(p, l)}`).join('. ')}. Twice the path — twice the time: the path is proportional to the time, and l/t is the same at every mark (a spread of ${sig(Math.max(...per.map((p) => p.spread)) * 100, 2, l)} % — the stopwatch shows only hundredths of a second). So the motion is uniform: v ≈ ${small ? cmS(small.v, l) : ''} and ${big ? cmS(big.v, l) : ''}. The bigger bubble rose faster — ≈ ${sig(ratio, 2, l)} times.${liquid === 'washing-up' ? ' (How fast exactly depends on the liquid: makes are several times thicker or thinner; the uniformity and “bigger — faster” do not.)' : ''}`,
      ),
    };
  },
  'weight-in-lift': (run) => {
    const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.lift' && x.record.value !== null).map((x) => ({ phase: String(x.command['phase']) as LiftPhase, P: x.record.value!, a: x.record.inputs?.['a'] ?? 0 }));
    const at = (p: LiftPhase) => R.find((x) => x.phase === p)?.P;
    const rest = at('rest');
    const steady = R.filter((x) => x.a === 0).every((x) => x.P === rest);
    const more = R.filter((x) => x.a > 0).every((x) => rest !== undefined && x.P > rest);
    const less = R.filter((x) => x.a < 0 && x.phase !== 'fall').every((x) => rest !== undefined && x.P < rest);
    return {
      ...(steady && more && less ? { correct: 'accel' } : {}),
      why: both((l) =>
        l === 'uk'
          ? 'Вага — сила, з якою тіло тягне підвіс. Поки ліфт стоїть чи їде рівномірно, пружина лише тримає тягарці: P = m·g, хоч угору, хоч униз. Щоб тягарці розганялися вгору разом із кабіною, пружина мусить тягнути їх сильніше, ніж їх тягне Земля, — вона розтягується більше: вага зростає. Це буває, коли ліфт рушає вгору і коли гальмує, їдучи вниз, — в обох випадках прискорення напрямлене вгору. Коли прискорення напрямлене вниз (ліфт рушає вниз або гальмує нагорі), пружина тягне слабше — вага менша. Важливо не те, куди їде ліфт, а куди він прискорюється. А якщо тягарці падають разом із динамометром, пружині нема чого тримати: вага нуль — це невагомість. Маса ж тягарців увесь час та сама, і сила тяжіння теж. Як порахувати вагу з прискоренням, P = m·(g + a), — у 9 класі.'
          : 'Weight is the force with which a body pulls on its hanger. While the lift stands or moves steadily, the spring only holds the weights: P = m·g, up or down alike. For the weights to speed up upwards with the cabin, the spring must pull them harder than the Earth does — it stretches more: the weight grows. That happens when the lift starts up and when it slows down on the way down — both times the acceleration points up. When the acceleration points down (starting down, slowing at the top), the spring pulls weaker — the weight is less. What matters is not which way the lift goes, but which way it accelerates. And if the weights fall together with the dynamometer, the spring has nothing to hold: the weight is zero — weightlessness. The weights’ mass stays the same all the time, and so does the force of gravity. How to count the weight with the acceleration, P = m·(g + a), comes in grade 9.',
      ),
      say: both((l) => {
        const up = at('up-start');
        const down = at('down-start');
        return rest !== undefined && up !== undefined && down !== undefined ? (l === 'uk' ? `Стоїть чи їде рівно — ${N(rest, l)}; розганяється вгору — ${N(up, l)}, униз — ${N(down, l)}; у падінні — нуль.` : `Standing or going steadily — ${N(rest, l)}; speeding up upwards — ${N(up, l)}, downwards — ${N(down, l)}; falling — zero.`) : '';
      }),
      text: both((l) => {
        const parts = R.map((x) => `${x.phase === 'fall' ? (l === 'uk' ? 'динамометр падає разом із тягарцями' : 'the dynamometer falls with the weights') : tr(liftPhaseText(x.phase).plan, l)} — ${N(x.P, l)}`);
        const s = `${parts.join('; ')}.`;
        return (s.charAt(0).toUpperCase() + s.slice(1)) + (l === 'uk' ? ` Прискорення ліфта взято ${sig(R.find((x) => x.a > 0)?.a ?? 1.2, 2, l)} м/с² — межа, якої тримаються для зручності пасажирів.` : ` The lift’s acceleration is taken as ${sig(R.find((x) => x.a > 0)?.a ?? 1.2, 2, l)} m/s² — the limit kept for the passengers’ comfort.`);
      }),
    };
  },
  'scales-diy': (run) => {
    const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.scales' && x.record.value !== null);
    const at = (step: string) => recs.find((x) => x.command['step'] === step)?.record;
    const check = at('check');
    const egg = at('egg');
    const g = (x: number, l: Locale) => `${sig(x * 1000, 3, l)} ${l === 'uk' ? 'г' : 'g'}`;
    return {
      ...(egg ? { correct: 'known' } : {}),
      why: both((l) =>
        l === 'uk'
          ? 'Плечі в лінійки однакові, а Земля притягує однакові маси однаково — тож лінійка стоїть рівно, коли маси в стаканчиках рівні. Гирею може бути будь-що, чия маса відома: аркуш паперу, вода зі шприца. Як із набором гир, кладемо спершу великі, а тоді дрібні.\n\nА гирі колись перевіряли так само — водою. 1795 року грам визначили як масу кубічного сантиметра води. 1889 року головною гирею світу став «Великий К» (Le Grand K) — циліндр зі сплаву платини й іридію заввишки 39 мм, який зберігають під Парижем. Його копії звіряли з ним на терезах — і за століття вони розійшлися приблизно на 50 мікрограмів. Тому з 20 травня 2019 року кілограм визначають через сталу Планка, а зважують на терезах Кіббла: там гирю заміняє електричний струм.'
          : 'The ruler’s arms are equal, and the Earth pulls equal masses equally — so the ruler stays level when the masses in the cups are equal. Anything of known mass can be a weight: a sheet of paper, water from a syringe. As with a set of weights, the big ones go first, then the small.\n\nAnd weights were once checked the same way — with water. In 1795 the gram was defined as the mass of a cubic centimetre of water. In 1889 the world’s chief weight became Le Grand K — a cylinder of platinum and iridium 39 mm tall, kept near Paris. Its copies were compared with it on scales — and over a century they drifted apart by about 50 micrograms. So since 20 May 2019 the kilogram has been defined by the Planck constant and weighed on Kibble balances: there an electric current takes the place of the weight.',
      ),
      say: both((l) => (egg ? (l === 'uk' ? `Яйце — ${g(egg.value!, l)}, і жодної гирі!` : `The egg — ${g(egg.value!, l)}, and not a single weight!`) : '')),
      text: both((l) => {
        const uk = l === 'uk';
        const parts: string[] = [uk ? 'Порожні стаканчики зрівняли пластиліном.' : 'The empty cups were evened with plasticine.'];
        if (check) parts.push(uk ? `Аркуш A4 врівноважили ${check.inputs?.['water']} мл води — ${g(check.value!, l)}: аркуш і справді важить ${g(SHEET.value, l)}, терези узгоджуються самі з собою.` : `The A4 sheet was balanced by ${check.inputs?.['water']} mL of water — ${g(check.value!, l)}: the sheet does weigh ${g(SHEET.value, l)}, the scales agree with themselves.`);
        if (egg) parts.push(uk ? `Яйце: ${egg.inputs?.['sheets']} аркушів по 5 г і ${egg.inputs?.['water']} мл води — ${g(egg.value!, l)}. Терези відчувають десь пів грама, тож точніше за грам ними не зважиш.` : `The egg: ${egg.inputs?.['sheets']} sheets of 5 g and ${egg.inputs?.['water']} mL of water — ${g(egg.value!, l)}. The scales feel about half a gram, so they weigh no better than to a gram.`);
        return parts.join(' ');
      }),
    };
  },
  calendars: (run) => {
    const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.calendar' && x.record.value !== null);
    const of = (step: string) => recs.filter((x) => x.command['step'] === step).map((x) => x.record);
    const egypt = of('egypt')[0];
    const julian = of('julian')[0];
    const [skip, gregorian] = of('gregorian');
    const bard = of('bard')[0];
    const gap = bard?.value ?? null;
    const correct = gap === null ? undefined : gap > 5 ? 'days' : gap > 0 ? 'hours' : 'same';
    return {
      ...(correct ? { correct } : {}),
      why: both((l) =>
        l === 'uk'
          ? 'Сонце не підлаштовується під календар: його рік — 365,24219 доби, а календар лічить цілі доби. Календар із 365 діб щороку не дораховує чверть доби — і пори року поволі пливуть його місяцями. Юліанський додає добу раз на чотири роки й трохи перебирає: на 11 хвилин щороку, на добу за 128 років. Григоріанський прибирає три високосні роки з чотирьох сотень — і помиляється на добу лише за понад три тисячі років.\n\nТому однакова дата в різних календарях — різні дні. 1616 року Іспанія вже жила за григоріанським календарем, а Англія — за юліанським, тож Шекспір помер на 11 днів пізніше за Сервантеса. Саме 23 квітня ЮНЕСКО 1995 року зробило Всесвітнім днем книги. А календарі змінюють і досі: Православна церква України 1 вересня 2023 року перейшла з юліанського на новоюліанський календар — у ньому рік 365,242 доби.'
          : 'The Sun does not fit itself to a calendar: its year is 365.24219 days, and a calendar counts whole days. A 365-day calendar falls a quarter of a day short each year — and the seasons slowly float through its months. The Julian one adds a day every four years and overshoots a little: by 11 minutes a year, a day in 128 years. The Gregorian one drops three leap years in four hundred — and is a day off only in over three thousand years.\n\nSo the same date in different calendars is a different day. In 1616 Spain already lived by the Gregorian calendar and England by the Julian, so Shakespeare died 11 days after Cervantes. It is 23 April that UNESCO made World Book Day in 1995. And calendars still change: the Orthodox Church of Ukraine moved from the Julian to the Revised Julian calendar on 1 September 2023 — with a year of 365.242 days.',
      ),
      say: both((l) => (gap === null ? '' : l === 'uk' ? `Однакова дата — ще не той самий день: між Сервантесом і Шекспіром — ${daysText(gap, true)}.` : `The same date is not the same day: ${daysText(gap, false)} between Cervantes and Shakespeare.`)),
      text: both((l) => {
        const uk = l === 'uk';
        const parts: string[] = [];
        if (egypt) parts.push(uk ? `${tr(CALENDARS.egypt.name, l)}: за ${egypt.inputs?.['years']} років весняне рівнодення переїхало на ${daysText(egypt.value!, true)} пізніше — з 21 березня на ${equinoxDate(EQUINOX + egypt.value!, true)}.` : `${tr(CALENDARS.egypt.name, l)}: in ${egypt.inputs?.['years']} years the spring equinox moved ${daysText(egypt.value!, false)} later — from 21 March to ${equinoxDate(EQUINOX + egypt.value!, false)}.`);
        if (julian) parts.push(uk ? `Юліанський: із 325 по 1582 рік — на ${daysText(-julian.value!, true)} раніше, на ${equinoxDate(EQUINOX + julian.value!, true)}.` : `The Julian: from 325 to 1582 — ${daysText(-julian.value!, false)} earlier, to ${equinoxDate(EQUINOX + julian.value!, false)}.`);
        if (skip && gregorian) parts.push(uk ? `Реформа 1582 року викреслила ${daysText(skip.value!, true, 'день')}; за ті самі ${gregorian.inputs?.['years']} років григоріанський календар зсуває рівнодення лише на ${daysText(-gregorian.value!, true)}, а на цілу добу — приблизно за ${Math.round((gregorian.inputs?.['oneDay'] ?? 0) / 100) * 100} років.` : `The 1582 reform struck out ${daysText(skip.value!, false)}; over the same ${gregorian.inputs?.['years']} years the Gregorian calendar moves the equinox only ${daysText(-gregorian.value!, false)}, and a whole day — in about ${Math.round((gregorian.inputs?.['oneDay'] ?? 0) / 100) * 100} years.`);
        if (bard && gap !== null) parts.push(uk ? `Сервантес помер 22 квітня за григоріанським календарем; Шекспір — 23 квітня за юліанським, а це ${dateText(bard.inputs?.['month'] ?? 5, bard.inputs?.['day'] ?? 3, true)} за григоріанським. Між ними — ${daysText(gap, true)}.` : `Cervantes died on 22 April by the Gregorian calendar; Shakespeare on 23 April by the Julian, which is ${dateText(bard.inputs?.['month'] ?? 5, bard.inputs?.['day'] ?? 3, false)} by the Gregorian. ${daysText(gap, false).replace(/^./, (x) => x.toUpperCase())} between them.`);
        return parts.join(' ');
      }),
    };
  },
  'solar-system-model': (run) => {
    const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.planets' && x.record.value !== null);
    const ids = planetIds();
    const of = (step: string) => recs.filter((x) => x.command['step'] === step).map((x) => x.record);
    const earth = of('inner').find((r) => ids[r.inputs?.['planet'] ?? -1] === 'earth');
    const L = earth?.value ?? null;
    const d = earth?.inputs?.['size'] ?? 0;
    const correct = L === null ? undefined : L > 10 ? 'grain' : d > 0.01 ? 'ball' : 'near';
    const kep = of('kepler').map((r) => r.value!);
    const neptune = of('outer').find((r) => ids[r.inputs?.['planet'] ?? -1] === 'neptune');
    const voyager = of('voyager')[0];
    return {
      ...(correct ? { correct } : {}),
      why: both((l) =>
        l === 'uk'
          ? 'На малюнках у підручниках планети намальовано поруч і великими — інакше їх і не видно було б. Насправді Сонячна система майже порожня: Сонце в сто разів більше за Землю, а Земля від нього — за сотню його поперечників. Тому в чесній моделі Земля — крупинка за двадцять метрів від м’яча, а Нептун — аж за пів кілометра.\n\nА рухаються планети за точним правилом. Що далі планета від Сонця, то довшу орбіту вона проходить — і то повільніше, бо Сонце притягує її слабше. Разом це дає третій закон Кеплера: T²/a³ однакове для всіх планет. Кеплер знайшов його 1619 року, перебираючи спостереження, а пояснив закон всесвітнього тяжіння.'
          : 'In textbook pictures the planets are drawn side by side and big — or they would not show at all. In truth the Solar System is nearly empty: the Sun is a hundred times bigger than the Earth, and the Earth is a hundred of its diameters away. So in an honest model the Earth is a grain twenty metres from the ball, and Neptune half a kilometre off.\n\nAnd the planets move by an exact rule. The further a planet is from the Sun, the longer its orbit — and the slower it goes, as the Sun pulls it more weakly. Together that gives Kepler’s third law: T²/a³ is the same for all the planets. Kepler found it in 1619, sifting through observations; the law of gravitation explained it.',
      ),
      say: both((l) => (l === 'uk' ? 'Ось ми. Ця крихітна блакитна цятка — Земля.' : 'That’s here. That tiny pale blue dot is the Earth.')),
      text: both((l) => {
        if (L === null) return '';
        const uk = l === 'uk';
        const parts = [uk ? `Масштаб — 1 : ${sig(1 / modelScale() / 1e9, 2, l)} млрд. Земля — крупинка ${sig(d * 1000, 2, l)} мм за ${sig(L, 3, l)} м від м’яча — трохи менша за пшоняне зернятко (2,1–2,3 мм).` : `The scale is 1 : ${sig(1 / modelScale() / 1e9, 2, l)} bn. The Earth is a ${sig(d * 1000, 2, l)} mm grain ${sig(L, 3, l)} m from the ball — a little smaller than a millet grain (2.1–2.3 mm).`];
        if (neptune) parts.push(uk ? `Нептун — за ${sig(neptune.value!, 3, l)} м.` : `Neptune — ${sig(neptune.value!, 3, l)} m away.`);
        const f2 = (x: number) => new Intl.NumberFormat(uk ? 'uk-UA' : 'en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(x);
        if (kep.length) parts.push(uk ? `T²/a³ для всіх восьми планет — від ${f2(Math.min(...kep))} до ${f2(Math.max(...kep))}: майже однакове, як і каже третій закон Кеплера, хоча відстані планет різняться в 78 разів.` : `T²/a³ for all eight planets — from ${f2(Math.min(...kep))} to ${f2(Math.max(...kep))}: nearly the same, as Kepler’s third law says, though the planets’ distances differ 78 times.`);
        if (voyager) parts.push(uk ? `«Вояджер-1» 14 лютого 1990 року був у моделі за ${sig(voyager.value!, 3, l)} м. Звідти Земля — та сама крупинка в 1,8 мм; на знімку, який він зробив, вона займає 0,12 пікселя. Карл Саган, з чиєї ідеї зроблено знімок, сказав про цю цятку: «Це тут. Це дім. Це ми».` : `Voyager 1 on 14 February 1990 was ${sig(voyager.value!, 3, l)} m off in the model. From there the Earth is the same 1.8 mm grain; on the picture it took, it fills 0.12 of a pixel. Carl Sagan, whose idea the picture was, said of the dot: “That’s here. That’s home. That’s us.”`);
        return parts.join(' ');
      }),
    };
  },
  'air-column': (run) => {
    const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.air' && x.record.value !== null);
    const at = (w: AirWhere) => recs.find((x) => x.command['where'] === w)?.record ?? null;
    const town = airPlace(String(recs[0]?.command['place'] ?? ''));
    const p1 = at('ground');
    const p2 = at('ninth');
    const p3 = at('airship');
    const p4 = at('high');
    const g = p1?.inputs?.['g'] ?? 9.80665;
    const m = p1 ? p1.value! / g : null;
    const correct = m === null ? undefined : m > 5000 ? 'tonnes' : m > 300 ? 'car' : 'nothing';
    const hPa = (x: number, l: Locale) => `${sig(x / 100, 6, l)} ${l === 'uk' ? 'гПа' : 'hPa'}`;
    const rho = p1 && p2 ? (p1.value! - p2.value!) / (g * ((p2.inputs?.['height'] ?? 0) - (p1.inputs?.['height'] ?? 0))) : null;
    return {
      ...(correct ? { correct } : {}),
      why: both((l) =>
        l === 'uk'
          ? `Повітря — це речовина, і Земля притягує її, як і все інше. Якби не тяжіння, гази розлетілися б у космос; а так повітря лежить на Землі шаром, і кожен шар тисне на ті, що під ним, своєю вагою. Тому тиск повітря біля землі — це вага всього стовпа повітря над кожним квадратним метром: p = m·g / S. Що вище піднятися, то менше повітря лишається над головою — і то менший тиск; у місті високо в горах його менше вже на землі. Повітря внизу стиснуте вагою верхніх шарів, тому воно й густіше. Ми не відчуваємо цих тонн, бо повітря тисне на нас з усіх боків однаково, і так само тиснуть зсередини гази й рідини нашого тіла. А раз повітря має вагу, на тіла в ньому діє архімедова сила — вона й тримає дирижабль: гелій у його оболонці легший за повітря, яке він витісняє. (Звідси й жарт, від якого пішла назва гурту Led Zeppelin: «злетить, як свинцевий дирижабль» — свинець набагато густіший за повітря.)\n\nТиск тут розраховано для стандартної атмосфери — дня з «середньою» погодою; у справжній день барометр покаже на кілька гектопаскалів більше або менше, але різниця між висотами майже не зміниться. Висоту поверху (2,8 м) взято як оцінку: від неї залежить і обчислена густина.`
          : `Air is matter, and the Earth pulls it as it pulls everything. Without gravity the gases would fly off into space; as it is, the air lies on the Earth in a layer, and each layer presses with its weight on the ones beneath. So the air's pressure near the ground is the weight of the whole column of air above each square metre: p = m·g / S. The higher you go, the less air is left above — and the lower the pressure; a town high in the mountains has less of it on the ground already. The air below is squeezed by the weight of the layers above, so it is denser. We do not feel these tonnes because the air presses on us equally from every side, and the gases and liquids of our body press back from within. And since air has weight, bodies in it feel a buoyant force — that is what holds an airship up: the helium in its envelope is lighter than the air it pushes aside. (Hence the joke that named the band Led Zeppelin: “it would go over like a lead balloon” — lead is far denser than air.)\n\nThe pressure here is the standard atmosphere's — a day of "average" weather; on a real day the barometer shows a few hectopascals more or less, but the difference between heights hardly changes. The storey's height (2.8 m) is an estimate: the density worked out depends on it.`,
      ),
      say: both((l) => (m === null ? '' : l === 'uk' ? `Над кожним квадратним метром — ≈ ${sig(m / 1000, 2, l)} т повітря!` : `Above each square metre — ≈ ${sig(m / 1000, 2, l)} t of air!`)),
      text: both((l) => {
        if (!p1) return '';
        const uk = l === 'uk';
        const parts: string[] = [uk ? `${town.name}, ${Math.round(town.elevation ?? 0)} м над морем. На 1-му поверсі барометр показав ${hPa(p1.value!, l)} = ${sig(p1.value!, 5, l)} Па. Це вага повітря над кожним квадратним метром: m = p·S / g ≈ ${sig(m!, 3, l)} кг.` : `${town.name}, ${Math.round(town.elevation ?? 0)} m above the sea. On the ground floor the barometer showed ${hPa(p1.value!, l)} = ${sig(p1.value!, 5, l)} Pa. That is the weight of the air above each square metre: m = p·S / g ≈ ${sig(m!, 3, l)} kg.`];
        if (p2 && rho !== null) {
          const dp = p1.value! - p2.value!;
          const dh = (p2.inputs?.['height'] ?? 0) - (p1.inputs?.['height'] ?? 0);
          parts.push(uk ? `На 9-му поверсі, на ${sig(dh, 3, l)} м вище, — ${hPa(p2.value!, l)}: менше на ${sig(dp / 100, 3, l)} гПа. Стільки важить шар повітря завтовшки ${sig(dh, 3, l)} м, тож його густина ρ = Δp / (g·Δh) ≈ ${sig(rho, 3, l)} кг/м³ — кубометр повітря важить близько кілограма.` : `On the ninth floor, ${sig(dh, 3, l)} m higher, — ${hPa(p2.value!, l)}: ${sig(dp / 100, 3, l)} hPa less. That is the weight of a ${sig(dh, 3, l)} m layer of air, so its density ρ = Δp / (g·Δh) ≈ ${sig(rho, 3, l)} kg/m³ — a cubic metre of air weighs about a kilogram.`);
        }
        if (p3) parts.push(uk ? `З дирижабля на 300 м — ${hPa(p3.value!, l)}.` : `From the airship at 300 m — ${hPa(p3.value!, l)}.`);
        if (p4) parts.push(uk ? `На 2 км — ${hPa(p4.value!, l)}: ${sig(((p1.value! - p4.value!) / p1.value!) * 100, 2, l)} % повітря над містом лишилося внизу.` : `At 2 km — ${hPa(p4.value!, l)}: ${sig(((p1.value! - p4.value!) / p1.value!) * 100, 2, l)} % of the air above the town is left below.`);
        if (rho !== null) parts.push(uk ? `Дирижабль на зразок Zeppelin NT витісняє ${sig(AIRSHIP.volume.value, 4, l)} м³ повітря — за нашою густиною це ≈ ${sig((AIRSHIP.volume.value * rho) / 1000, 2, l)} т; така й архімедова сила, що його тримає.` : `An airship like the Zeppelin NT pushes aside ${sig(AIRSHIP.volume.value, 4, l)} m³ of air — by our density ≈ ${sig((AIRSHIP.volume.value * rho) / 1000, 2, l)} t; such is the buoyant force that holds it.`);
        return parts.join(' ');
      }),
    };
  },
  'solar-noon': (run) => {
    const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.gnomon' && x.record.value !== null);
    const place = gnomonPlace(String(recs[0]?.command['place'] ?? ''));
    const shadows = recs.map((x) => ({ time: x.record.inputs?.['time'] ?? 0, length: x.record.value! }));
    const found = shadows.length ? equalShadowsNoon(shadows) : null;
    const noon = found?.noon ?? null;
    const correct = noon === null ? undefined : Math.abs(noon - 720) < 1 ? 'noon' : noon > 720 ? 'later' : 'earlier';
    const { zone, summer } = gnomonClock(place);
    const standard = summer ? zone - 1 : zone;
    const meridian = 15 * standard;
    const byLon = 4 * (meridian - place.lon);
    const eq = sunOf(720, zone).eqtime;
    const south = recs[0]?.record.inputs?.['south'] === 1;
    const L = shadows.length ? Math.min(...shadows.map((x) => x.length)) : 0;
    const h = L ? Math.atan(GNOMON_HEIGHT / L) / (Math.PI / 180) : 0;
    const d = sunOf(noon ?? 720, zone).decl;
    const phi = latitudeFrom(h, d, south);
    const min = (x: number, l: Locale) => `${sig(Math.abs(x), 2, l)} ${l === 'uk' ? 'хв' : 'min'}`;
    const deg = (x: number, l: Locale, k = 3) => `${sig(x, k, l).replace('-', '−')}°`;
    const lonText = (x: number, l: Locale) => `${sig(Math.abs(x), 3, l)}° ${x >= 0 ? (l === 'uk' ? 'сх. д.' : 'E') : l === 'uk' ? 'зх. д.' : 'W'}`;
    return {
      ...(correct ? { correct } : {}),
      why: both((l) =>
        l === 'uk'
          ? `Сонце за добу обходить небо, бо Земля обертається: 360° за 24 години, тобто 1° за 4 хвилини. Справжній полудень настає, коли Сонце найвище над саме твоїм місцем, — тому в кожному меридіані він свій. Щоб не мати в кожному місті свого часу, годинники цілої зони йдуть за одним меридіаном: на кожну годину від Гринвіча — 15°. Місто, що лежить на схід від свого меридіана, бачить полудень раніше, на захід — пізніше, на 4 хвилини на кожен градус. Ще кілька хвилин додає рівняння часу: Земля обходить Сонце нерівномірно (орбіта — еліпс) і з нахиленою віссю, тож справжня сонячна доба протягом року то трохи довша, то коротша за 24 години; на початку весни сонячний полудень запізнюється на 7–8 хвилин. А де годинники переводять на літній час, полудень за годинником настає ще на годину пізніше.\n\nЗ тієї самої тіні знаходять і широту. У полудень Сонце найвище: h = arctg(H/L). У день рівнодення воно над екватором, і його висота опівдні дорівнює 90° мінус широта; в інші дні — поправка на схилення δ. На північ від тропіків полуденна тінь падає на північ, у південній півкулі — на південь. Так мореплавці визначали широту за полуденним Сонцем.`
          : `The Sun goes round the sky in a day because the Earth turns: 360° in 24 hours, 1° in 4 minutes. The true noon comes when the Sun is highest over your very place — so each meridian has its own. Not to have a time of its own in every town, a whole zone's clocks keep one meridian: 15° for each hour from Greenwich. A town east of its meridian sees noon earlier, west of it later, by 4 minutes a degree. A few more minutes come from the equation of time: the Earth goes round the Sun unevenly (the orbit is an ellipse) and with its axis tilted, so the true solar day is a little longer or shorter than 24 hours through the year; in early spring the solar noon is 7–8 minutes late. And where the clocks go to summer time, noon by the clock comes an hour later still.\n\nThe same shadow gives the latitude. At noon the Sun is highest: h = arctan(H/L). On an equinox it stands over the equator, and its noon height is 90° less the latitude; on other days, a correction for the declination δ. North of the tropics the noon shadow points north, in the southern hemisphere south. That is how sailors found their latitude by the noon Sun.`,
      ),
      say: both((l) => (noon === null ? '' : l === 'uk' ? `Справжній полудень (${place.name}) — о ${clockText(noon)} за годинником!` : `The true noon (${place.name}) — at ${clockText(noon)} by the clock!`)),
      text: both((l) => {
        if (noon === null || !found) return '';
        const uk = l === 'uk';
        const p0 = found.pairs[0]!;
        const lonPart = Math.abs(byLon) < 0.5 ? (uk ? 'майже на ньому самому' : 'almost on it') : uk ? `${byLon < 0 ? 'на схід' : 'на захід'} від нього на ${deg(Math.abs(meridian - place.lon), l, 2)} — полудень ${byLon < 0 ? 'раніше' : 'пізніше'} на ${min(byLon, l)}` : `${byLon < 0 ? 'east' : 'west'} of it by ${deg(Math.abs(meridian - place.lon), l, 2)} — noon ${byLon < 0 ? 'earlier' : 'later'} by ${min(byLon, l)}`;
        const total = byLon + (summer ? 60 : 0) - eq;
        return uk
          ? `Найкоротша тінь — ${sig(L, 3, l)} м, на ${south ? 'південь' : 'північ'}. Рівні тіні: ${clockText(p0.t1)} і ≈ ${clockText(p0.t2)} (${sig(p0.length, 3, l)} м), посередині — ${clockText((p0.t1 + p0.t2) / 2)}; у середньому з ${found.pairs.length} пар полудень настав о ${clockText(noon)}. Годинники тут показують ${offsetText(zone)}${summer ? ' — літній час, на годину вперед' : ''}; поясний меридіан — ${lonText(meridian, l)}, а місто (${lonText(place.lon, l)}) — ${lonPart}. Рівняння часу 20 березня додає ще ${min(eq, l)} (за формулою NOAA). Разом: 12:00 ${total >= 0 ? '+' : '−'} ${min(total, l)} ≈ ${clockText(720 + total)}. Висота Сонця опівдні h = arctg(1 / ${sig(L, 3, l)}) ≈ ${deg(h, l)}, широта ≈ ${deg(phi, l)} (δ ≈ ${deg(d, l, 1)}); насправді — ${deg(place.lat, l, 4)}.`
          : `The shortest shadow — ${sig(L, 3, l)} m, pointing ${south ? 'south' : 'north'}. Equal shadows: ${clockText(p0.t1)} and ≈ ${clockText(p0.t2)} (${sig(p0.length, 3, l)} m), midway — ${clockText((p0.t1 + p0.t2) / 2)}; the mean of ${found.pairs.length} pairs puts noon at ${clockText(noon)}. The clocks here keep ${offsetText(zone)}${summer ? ' — summer time, an hour on' : ''}; the zone's meridian is ${lonText(meridian, l)}, and the town (${lonText(place.lon, l)}) lies ${lonPart}. The equation of time on 20 March adds ${min(eq, l)} more (NOAA's formula). Together: 12:00 ${total >= 0 ? '+' : '−'} ${min(total, l)} ≈ ${clockText(720 + total)}. The Sun's noon height h = arctan(1 / ${sig(L, 3, l)}) ≈ ${deg(h, l)}, the latitude ≈ ${deg(phi, l)} (δ ≈ ${deg(d, l, 1)}); in fact ${deg(place.lat, l, 4)}.`;
      }),
    };
  },
  'liquid-tower': (run) => {
    const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.tower' && x.command['step'] === 'drop' && x.record.value !== null);
    const at = (b: TowerBody) => recs.find((x) => x.command['body'] === b)?.record ?? null;
    const acr = at('acrylic');
    const lower = acr?.inputs?.['lower'];
    const correct = acr ? (lower === -1 ? 'bottom' : lower === 0 ? 'glycerol' : lower === 1 ? 'oil' : undefined) : undefined;
    const d = TOWER_LIQUIDS.map(towerLiquidDensity);
    const R = (x: number) => String(Math.round(x));
    const pc = (x: number, l: Locale) => `${sig(x * 100, 2, l)} %`;
    const place = (b: TowerBody, l: Locale) => {
      const r = at(b);
      if (!r) return '';
      const uk = l === 'uk';
      const lw = r.inputs?.['lower'] ?? -1;
      const share = r.inputs?.['share'] ?? 0;
      const nm = (k: number) => tr(towerLiquidName(TOWER_LIQUIDS[k]!), l);
      const inn = (k: number) => tr(towerLiquidIn(TOWER_LIQUIDS[k]!), l);
      const name = tr(TOWER_BODIES[b].name, l);
      const N = name.charAt(0).toUpperCase() + name.slice(1);
      const rho = R(r.inputs?.['density'] ?? 0);
      if (lw < 0) return uk ? `${N} (${rho} кг/м³) густіша за всі рідини — лягла на дно.` : `${N} (${rho} kg/m³) is denser than every liquid — it went to the bottom.`;
      if (r.inputs?.['top'] === 1) return uk ? `${N} (${rho} кг/м³) легший за всі рідини — плаває у спирті, занурений на ${pc(share, l)}.` : `${N} (${rho} kg/m³) is lighter than every liquid — it floats in the ethanol, ${pc(share, l)} under.`;
      return uk ? `${N} (${rho} кг/м³) пройшов крізь легші рідини й зупинився на межі «${nm(lw)} — ${nm(lw + 1)}»: ${pc(share, l)} його об’єму ${inn(lw)}, решта — ${inn(lw + 1)}.` : `${N} (${rho} kg/m³) went through the lighter liquids and stopped at the ${nm(lw)} — ${nm(lw + 1)} boundary: ${pc(share, l)} of it ${inn(lw)}, the rest ${inn(lw + 1)}.`;
    };
    return {
      ...(correct ? { correct } : {}),
      why: both((l) =>
        l === 'uk'
          ? `Рідини лягли шарами в порядку густини: важча рідина опускається під легшу, як і тверде тіло. Кожне тіло тоне, доки довкола нього рідина легша за нього, — сила тяжіння більша за архімедову. Щойно воно доходить до рідини, густішої за себе, архімедова сила стає більшою за вагу, і тіло спливає на ній. Тож тіло зупиняється на межі двох рідин: частково в нижній, частково у верхній — так, щоб архімедові сили від обох рідин разом урівноважили вагу. Що ближча густина тіла до густини нижньої рідини, то глибше воно в неї занурене. Тому «тоне у воді» ще не означає «ляже на дно»: оргскло тоне у воді, але гліцерин його тримає.\n\nГліцерин і вода насправді змішуються: якщо наливати обережно, межа між ними тримається якийсь час, а потім розмивається. Спирт теж змішався б із водою, але між ними — олія. Об’єми рідин тут вважаємо такими, що просто додаються.`
          : `The liquids lay in layers by density: a denser liquid goes under a lighter one, as a solid body does. Each body sinks while the liquid round it is lighter than itself — gravity outweighs the buoyant force. As soon as it reaches a liquid denser than itself, the buoyant force exceeds the weight, and the body floats on it. So the body stops at the boundary of two liquids: partly in the lower, partly in the upper — so that the buoyant forces of both together balance the weight. The closer the body's density to the lower liquid's, the deeper it sits in it. That is why "sinks in water" does not yet mean "goes to the bottom": acrylic glass sinks in water, but the glycerol holds it up.\n\nGlycerol and water do mix: poured with care, the boundary between them holds for a while and then blurs. Ethanol would mix with water too, but the oil is between them. The liquids' volumes are taken to simply add up.`,
      ),
      say: both((l) => (l === 'uk' ? 'Кожне тіло зупинилося там, де рідина під ним густіша за нього!' : 'Every body stopped where the liquid beneath it is denser than itself!')),
      text: both((l) => {
        const uk = l === 'uk';
        const layers = uk ? `Шари знизу вгору: гліцерин (${R(d[0]!)} кг/м³), вода (${R(d[1]!)}), олія (${R(d[2]!)}), спирт (${R(d[3]!)}).` : `Layers from the bottom: glycerol (${R(d[0]!)} kg/m³), water (${R(d[1]!)}), oil (${R(d[2]!)}), ethanol (${R(d[3]!)}).`;
        return [layers, ...(['nut', 'acrylic', 'hdpe', 'pine'] as const).map((b) => place(b, l))].filter(Boolean).join(' ');
      }),
    };
  },
  'drag-form': (run) => {
    const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.drag' && x.record.value !== null);
    const of = (shape: DragShape, medium: 'water' | 'air') => recs.find((x) => x.command['shape'] === shape && x.command['medium'] === medium)?.record ?? null;
    const water = (['ball', 'cube', 'plate'] as const).map((shape) => ({ shape, r: of(shape, 'water') })).filter((x) => x.r !== null);
    const air = of('ball', 'air');
    const slowest = water.length === 3 ? water.reduce((a, b) => (b.r!.value! > a.r!.value! ? b : a)).shape : undefined;
    const fr = (r: { value: number | null; inputs?: Record<string, number> }, l: Locale) => `${framesText(r.inputs?.['frames'] ?? 0, l === 'uk')} (${formatMeasured('time', r.value!, 0.01, l)}, v ≈ ${sig(DRAG_TRACK / r.value!, 2, l)} ${l === 'uk' ? 'м/с' : 'm/s'})`;
    const { volume } = dragBody('ball');
    const rhoW = mediumDensity('water');
    const Fd = DRAG_MASS * G - rhoW * G * volume;
    const free = Math.sqrt((2 * (DRAG_START + DRAG_TRACK)) / G) - Math.sqrt((2 * DRAG_START) / G);
    const ratio = rhoW / mediumDensity('air');
    const cd = (s: DragShape, l: Locale) => sig(DRAG_COEFFICIENTS[s].value, 3, l);
    return {
      ...(slowest === 'plate' ? { correct: 'plate' } : slowest === 'ball' ? { correct: 'ball' } : {}),
      why: both((l) =>
        l === 'uk'
          ? `Рухаючись, тіло мусить розштовхувати воду перед собою, а позаду нього закручуються вихори. Що швидше тіло, то більша сила опору — за таких швидкостей вона зростає пропорційно квадрату швидкості. Тіло розганяється, доки опір не зрівняється з вагою мінус архімедова сила, а далі йде рівномірно. Маса й об’єм у трьох тіл однакові, тож і рівномірно вони йдуть за однакової сили опору — різниться лише швидкість, за якої вона настає. Кулька обтічна: вода плавно огинає її, вихорів позаду мало, і перетин у неї невеликий. Кубик пласкою гранню вперед зриває потік на ребрах, і вихорів більше: він підставляє воді навіть меншу площу, ніж кулька, а проте повільніший — тут вирішує саме форма. Пластинка плазом підставляє воді найбільшу площу — тому вона найповільніша. Інша річ — середовище: що воно густіше, то більшу масу тіло мусить щомиті відштовхнути, тож за тієї самої швидкості вода опирається в ≈ ${sig(ratio, 2, l)} разів сильніше, ніж повітря, — у стільки ж разів вона густіша.\n\nМодель спрощена: насправді пластинка гойдається й зісковзує вбік, а кубик може перекинутися, тож у справжньому досліді час буде трохи іншим. Коефіцієнти опору виміряні для гладких тіл; пластилінові, зліплені руками, відрізнятимуться.`
          : `Moving, a body has to push the water in front of it aside, and behind it eddies swirl. The faster the body, the greater the drag — at these speeds it grows as the square of the speed. The body speeds up until the drag equals its weight less the buoyant force, and then goes steadily. The three bodies have the same mass and volume, so they go steadily under the same drag — only the speed at which it is reached differs. The ball is streamlined: the water flows smoothly round it, few eddies behind it, and its cross-section is small. The cube, a flat face first, breaks the flow at its edges, and there are more eddies: it shows the water even less area than the ball, and yet it is slower — here the form alone decides. The plate, lying flat, shows the water the largest area — so it is the slowest. The medium is another matter: the denser it is, the more mass the body has to push aside each second, so at the same speed water resists ≈ ${sig(ratio, 2, l)} times more than air — as many times as it is denser.\n\nThe model is simplified: in truth the plate rocks and slides aside, and the cube may tip over, so in a real experiment the times come out a little different. The drag coefficients were measured for smooth bodies; hand-moulded plasticine ones will differ.`,
      ),
      say: both((l) => (l === 'uk' ? 'Та сама маса — а швидкість різна: усе вирішують форма й середовище!' : 'The same mass — different speeds: the form and the medium decide!')),
      text: both((l) => {
        const uk = l === 'uk';
        const parts = water.map((x) => `${dragShapeName(x.shape)[l]} — ${fr(x.r!, l)}`).join('; ');
        const a = air ? (uk ? ` У повітрі та сама кулька пролетіла 20 см за ${fr(air, l)} — майже як у вільному падінні (${formatMeasured('time', free, 0.001, l)}): опір повітря тут мізерний.` : ` In the air the same ball covered 20 cm in ${fr(air, l)} — nearly as in free fall (${formatMeasured('time', free, 0.001, l)}): the air hardly resists here.`) : '';
        return uk
          ? `У воді між позначками: ${parts}. Вага всіх тіл однакова, архімедова сила теж, тож, рухаючись рівномірно, кожне зазнає однакової сили опору: F = m·g − ρ·g·V ≈ ${sig(Fd, 2, l)} Н. Але пластинка набирає її вже за малої швидкості, а кулька — лише за найбільшої.${a} Сила опору F = C·ρ·v²·S / 2 залежить від форми тіла (коефіцієнт опору C: кулька ${cd('ball', l)}, кубик ${cd('cube', l)}, пластинка ${cd('plate', l)}), площі S, яку тіло підставляє зустрічному потоку, і густини середовища ρ.`
          : `In water between the marks: ${parts}. All bodies weigh the same, the buoyant force too, so moving steadily each meets the same drag: F = m·g − ρ·g·V ≈ ${sig(Fd, 2, l)} N. But the plate reaches it at a low speed already, the ball only at the highest.${a} The drag F = C·ρ·v²·S / 2 depends on the body’s form (the drag coefficient C: ball ${cd('ball', l)}, cube ${cd('cube', l)}, plate ${cd('plate', l)}), the area S it shows to the oncoming flow, and the medium’s density ρ.`;
      }),
    };
  },
  'carts-mass': (run) => {
    const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.carts' && x.record.value !== null);
    const pushes = [0, 1, 2].map((w) => recs.filter((x) => x.command['mode'] === 'push' && Number(x.command['weights']) === w).map((x) => x.record.value!)).filter((x) => x.length === 2) as [number, number][];
    const P = (cart: number) => recs.find((x) => x.command['mode'] === 'weigh' && Number(x.command['cart']) === cart)?.record.value ?? null;
    const P1 = P(1);
    const P2 = P(2);
    const cm = (x: number, l: Locale) => `${sig(x * 100, 3, l)} ${l === 'uk' ? 'см' : 'cm'}`;
    const ratio = (x: number, l: Locale) => sig(x, 2, l);
    // «у 3 рази», but «у 2,9 раза».
    const times = (x: number, l: Locale) => (l === 'uk' ? `у ${ratio(x, l)} ${/[,.]/.test(ratio(x, l)) ? 'раза' : 'рази'}` : `${ratio(x, l)} times`);
    const slower = pushes.length === 3 && pushes.every(([a, b], w) => Math.abs(a / b - (1 + w)) < 0.1);
    return {
      ...(slower ? { correct: 'speeds' } : {}),
      why: both((l) =>
        l === 'uk'
          ? 'Пружина діє на обидва візки однаково, але важчий візок інертніший — він повільніше набирає швидкість, тож розганяється менше. Тому в скільки разів його швидкість менша, у стільки разів його маса більша: m₂ / m₁ = v₁ / v₂. Візки рушили одночасно й їхали однаковий час, тож відношення шляхів — це відношення швидкостей. Так масу можна виміряти без терезів — за інертністю. А динамометр показує, що й сила тяжіння в стільки ж разів більша: P = m·g. Тож маса — міра і інертності тіла, і його притягання до Землі. Тертя коліс за ці 0,5 с не враховано.'
          : 'The spring acts on both carts alike, but the heavier cart is more inert — it gathers speed more slowly, so it ends up slower. So as many times smaller its speed, so many times greater its mass: m₂ / m₁ = v₁ / v₂. The carts set off together and went for the same time, so the ratio of the paths is the ratio of the speeds. This way mass can be measured without scales — by inertia. And the dynamometer shows that the force of gravity is as many times greater too: P = m·g. So mass measures both a body’s inertia and its pull to the Earth. The wheels’ friction over these 0.5 s is left out.',
      ),
      say: both((l) => {
        const last = pushes[2];
        return last && P1 !== null && P2 !== null ? (l === 'uk' ? `Візок утричі важчий проїхав ${times(last[0] / last[1], l)} менше — і сила тяжіння на нього ${times(P2 / P1, l)} більша.` : `The cart three times heavier went ${times(last[0] / last[1], l)} less — and gravity on it is ${times(P2 / P1, l)} greater.`) : '';
      }),
      text: both((l) => {
        const uk = l === 'uk';
        const parts = pushes.map(([a, b], w) => (uk ? `${w === 0 ? 'однакові візки' : `візок 2 + ${w === 1 ? 'один тягарець' : 'два тягарці'}`}: ${cm(a, l)} і ${cm(b, l)}, l₁ / l₂ ≈ ${ratio(a / b, l)}` : `${w === 0 ? 'alike carts' : `cart 2 + ${w === 1 ? 'one weight' : 'two weights'}`}: ${cm(a, l)} and ${cm(b, l)}, l₁ / l₂ ≈ ${ratio(a / b, l)}`));
        const weigh = P1 !== null && P2 !== null ? (uk ? `; на динамометрі: візок 1 — ${N(P1, l)}, візок 2 з двома тягарцями — ${N(P2, l)}, ${times(P2 / P1, l)} більше` : `; on the dynamometer: cart 1 — ${N(P1, l)}, cart 2 with two weights — ${N(P2, l)}, ${times(P2 / P1, l)} more`) : '';
        const s = `${parts.join('; ')}${weigh}.`;
        return s.charAt(0).toUpperCase() + s.slice(1) + (uk ? ' (2,9 Н, а не 3,0 — бо динамометр показує до десятих: 2,94 Н.)' : ' (2.9 N, not 3.0 — the dynamometer reads to tenths: 2.94 N.)');
      }),
    };
  },
  'contact-forces': (run) => {
    const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.touch').map((x) => ({ c: String(x.command['case']) as TouchCase, acts: x.record.inputs?.['acts'] === 1, touch: x.record.inputs?.['touch'] === 1 }));
    const farOk = R.filter((x) => x.c !== 'lifted').every((x) => x.acts && !x.touch);
    const frictionNeedsTouch = R.some((x) => x.c === 'lifted' && !x.acts);
    return {
      ...(farOk && frictionNeedsTouch ? { correct: 'field' } : {}),
      why: both((l) =>
        l === 'uk'
          ? 'Деякі сили діють на відстані: магніт притягує залізо через повітря й крізь картон, наелектризоване тіло — легкі папірці, а Земля притягує все довкола — тому тягарець і падає, хоч його ніщо не штовхає. Такі тіла діють одне на одне через поле — магнітне, електричне, гравітаційне. А сила тертя й сила пружності — контактні: вони з’являються лише тоді, коли тіла торкаються. Брусок, піднятий над столом, тертя об стіл не відчуває; пружина тягне лише те, що до неї причеплено. Повітря тут нічого не передає: магніт притягує скріпку й у вакуумі.'
          : 'Some forces act at a distance: a magnet pulls iron across air and through a card, a charged body — light bits of paper, and the Earth pulls everything around — so the weight falls, though nothing pushes it. Such bodies act on each other through a field — magnetic, electric, gravitational. But friction and the elastic force are contact forces: they appear only when bodies touch. The block lifted above the table feels no friction on it; a spring pulls only what is hooked on it. The air passes nothing here: a magnet pulls a clip in a vacuum too.',
      ),
      say: both((l) => (l === 'uk' ? 'Без дотику діяли магніт, гребінець і Земля; тертя без дотику зникло.' : 'Without touching acted the magnet, the comb and the Earth; friction vanished without touching.')),
      text: both((l) => {
        const s = `${R.map((x) => `${tr(touchPlan(x.c), l)} — ${tr(touchSeen(x.c), l)}`).join('; ')}.`;
        return s.charAt(0).toUpperCase() + s.slice(1);
      }),
    };
  },
  'coin-inertia': (run) => {
    const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.coin' && x.record.value !== null).map((x) => ({ pull: String(x.command['pull']), s: x.record.value!, v: x.record.inputs?.['speed'] ?? 0, t: x.record.inputs?.['time'] ?? 0, slipped: x.record.inputs?.['slipped'] === 1, inGlass: x.record.inputs?.['inGlass'] === 1 }));
    const fastIn = R.filter((x) => x.v >= 1).every((x) => x.inGlass);
    const slowOut = R.some((x) => !x.inGlass);
    const mm = (x: number) => Math.round(x * 1000);
    const where = (x: (typeof R)[number], l: Locale) => (l === 'uk' ? (x.inGlass ? 'монета впала в склянку' : x.slipped ? 'монета вдарилася об край склянки й упала поруч' : 'монета поїхала разом із карткою') : x.inGlass ? 'the coin dropped into the glass' : x.slipped ? 'the coin hit the rim and fell beside' : 'the coin went with the card');
    return {
      ...(fastIn && slowOut ? { correct: 'inertia' } : {}),
      why: both((l) =>
        l === 'uk'
          ? 'Інерція — це явище зберігання швидкості руху тіла за відсутності або скомпенсованості дії на нього інших тіл. Монета лежала нерухомо, і щоб вона поїхала, її має розігнати картка — силою тертя. Але тертя слабке й не може розігнати монету швидко. Коли картку тягнуть повільно, тертя встигає: монета їде разом із карткою. Коли картку висмикують, вона виходить з-під монети за соті частки секунди — тертя за цей час ледь зрушує монету, і та, залишившись майже на місці, падає в склянку. Що швидше рух картки, то менше зсувається монета. Так само, коли автобус різко рушає, пасажири відхиляються назад.'
          : 'Inertia is the keeping of a body’s speed when no other bodies act on it, or their actions balance. The coin lay still, and for it to move the card has to speed it up — by friction. But friction is weak and cannot speed the coin up fast. When the card is drawn slowly, friction keeps up: the coin goes with the card. When the card is snatched, it leaves from under the coin in hundredths of a second — in that time friction hardly moves the coin, and it, staying almost where it was, drops into the glass. The faster the card goes, the less the coin moves. In the same way, when a bus starts sharply, the passengers lean back.',
      ),
      say: both((l) => {
        const snap = R.find((x) => x.pull === 'snap');
        return snap ? (l === 'uk' ? `Клацання: картка вийшла за ${sig(snap.t, 2, l)} с, монета зсунулася лише на ${mm(snap.s)} мм — і впала в склянку.` : `The flick: the card went in ${sig(snap.t, 2, l)} s, the coin moved just ${mm(snap.s)} mm — and dropped into the glass.`) : '';
      }),
      text: both((l) => {
        const uk = l === 'uk';
        const how: Record<string, string> = uk ? { slow: 'повільно', push: 'штовхнули (0,5 м/с)', flick: 'різко (1 м/с)', snap: 'клацнули (3 м/с)' } : { slow: 'slowly', push: 'pushed (0.5 m/s)', flick: 'sharply (1 m/s)', snap: 'flicked (3 m/s)' };
        const s = `${R.map((x) => `${how[x.pull] ?? x.pull}: ${uk ? 'зсув' : 'moved'} ${mm(x.s)} ${uk ? 'мм' : 'mm'} — ${where(x, l)}`).join('; ')}.`;
        return s.charAt(0).toUpperCase() + s.slice(1) + (uk ? ' Щоб упасти в склянку, монета мала зсунутися менш ніж на 19 мм.' : ' To drop into the glass, the coin had to move less than 19 mm.');
      }),
    };
  },
  'snail-speed': (run) => {
    const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.snail' && x.record.value !== null).map((x) => ({ surface: String(x.command['surface']) as SnailSurface, l: x.record.value!, t: x.record.inputs?.['time'] ?? SNAIL_TIME }));
    const slowest = [...R].sort((a, b) => a.l - b.l)[0];
    const mm = (x: number) => Math.round(x * 1000);
    const v = (x: { l: number; t: number }, l: Locale) => `${sig((x.l * 1000) / x.t, 2, l)} ${l === 'uk' ? 'мм/с' : 'mm/s'}`;
    return {
      ...(slowest ? { correct: slowest.surface === 'sandpaper' ? 'sandpaper' : slowest.surface } : {}),
      why: both((l) =>
        l === 'uk'
          ? 'Равлик повзе на одній «нозі»: м’язи в ній по черзі скорочуються, і вздовж підошви біжать хвилі. Під підошвою — тонкий шар слизу, і ці хвилі, відштовхуючись через нього від поверхні, штовхають равлика вперед. Слиз незвичайний: у спокої тримає, як клей, а під натиском тече, як рідина. На шорсткому наждаку равлик повзе майже вдвічі повільніше: дослідники припускають, що шорсткість заважає слизу триматися й равлику доводиться виділяти його більше. Угору по стінці він ще й тримає власну вагу, тож трохи повільніший; на мокрому вода, ймовірно, розріджує слиз. Це середні значення для 87 равликів із дослідження: окремі равлики повзуть швидше чи повільніше. 1,5 мм/с — це близько 5 метрів за годину.'
          : 'A snail crawls on a single «foot»: its muscles contract in turn, and waves run along the sole. Under the sole is a thin layer of mucus, and the waves, pushing off the surface through it, move the snail forward. The mucus is unusual: at rest it holds like glue, under stress it flows like a liquid. On rough sandpaper the snail crawls almost half as fast: the researchers suggest the roughness keeps the mucus from holding, and the snail has to make more of it. Up a wall it also holds its own weight, so it is a little slower; on a wet sheet water likely thins the mucus. These are the means of 87 snails in the study: single snails crawl faster or slower. 1.5 mm/s is about 5 metres an hour.',
      ),
      say: both((l) => (slowest ? (l === 'uk' ? `Найповільніше — ${tr(snailSurfaceName(slowest.surface), l)}: ${mm(slowest.l)} мм за 30 с, ${v(slowest, l)}.` : `Slowest — ${tr(snailSurfaceName(slowest.surface), l)}: ${mm(slowest.l)} mm in 30 s, ${v(slowest, l)}.`) : '')),
      text: both((l) => {
        const s = `${R.map((x) => `${tr(snailSurfaceName(x.surface), l)} — ${mm(x.l)} ${l === 'uk' ? 'мм за 30 с' : 'mm in 30 s'}, ${v(x, l)}`).join('; ')}.`;
        return s.charAt(0).toUpperCase() + s.slice(1) + (l === 'uk' ? ' Середні з дослідження Pembury Smith і Ruxton (2021).' : ' The means from Pembury Smith and Ruxton’s study (2021).');
      }),
    };
  },
  'strobe-photo': (run) => {
    const gaps = (photo: string) => (run.readings ?? []).filter((x) => x.command.type === 'lab.strobe' && x.command['photo'] === photo && x.record.value !== null).map((x) => x.record.value!);
    const table = gaps('table');
    const groove = gaps('groove');
    const mm = (x: number) => Math.round(x * 1000);
    const real = (x: number, l: Locale) => `${sig(x * STROBE_SCALE * 100, 3, l)} ${l === 'uk' ? 'см' : 'cm'}`;
    const ms = (x: number, l: Locale) => `${sig((x * STROBE_SCALE) / STROBE_INTERVAL, 2, l)} ${l === 'uk' ? 'м/с' : 'm/s'}`;
    const equal = table.length > 1 && table.every((x) => Math.abs(x - table[0]!) < 0.0015);
    const growing = groove.length > 1 && groove.every((x, i) => i === 0 || x > groove[i - 1]!);
    return {
      ...(equal && growing ? { correct: 'gaps' } : {}),
      why: both((l) =>
        l === 'uk'
          ? 'Стробоскоп спалахує через рівні проміжки часу — тут кожні 0,25 с, — і фото зберігає, де була кулька в кожну з цих миттєвостей. Тож проміжок між сусідніми зображеннями — це шлях за 0,25 с. Фото зменшене в 5 разів: виміряне лінійкою множимо на 5 — і маємо відстань у натурі; поділивши її на 0,25 с, — швидкість. На столі проміжки рівні: кулька рухалася рівномірно. На жолобі вони ростуть — приблизно як 1 : 3 : 5 : 7, — кулька розганялася, і її середня швидкість на кожному проміжку більша за попередню. Так само вимірюють відстані на картах і планах: масштаб 1 : 100 000 означає, що 1 см на карті — це 1 км на місцевості.'
          : 'The stroboscope flashes at equal intervals — here every 0.25 s — and the photo keeps where the ball was at each of those instants. So the gap between neighbouring images is the path in 0.25 s. The photo is 5 times smaller: what the ruler gives times 5 is the real distance; divided by 0.25 s — the speed. On the table the gaps are equal: the ball moved uniformly. In the groove they grow — about as 1 : 3 : 5 : 7 — the ball was speeding up, its average speed on each gap greater than on the one before. Distances on maps and plans are measured the same way: a scale of 1 : 100 000 means 1 cm on the map is 1 km on the ground.',
      ),
      say: both((l) => (table.length ? (l === 'uk' ? `На столі проміжки рівні — по ${mm(table[0]!)} мм на фото, ${real(table[0]!, l)} у натурі за 0,25 с: ${ms(table[0]!, l)}.` : `On the table the gaps are equal — ${mm(table[0]!)} mm on the photo each, ${real(table[0]!, l)} in life in 0.25 s: ${ms(table[0]!, l)}.`) : '')),
      text: both((l) => {
        const uk = l === 'uk';
        const list = (g: number[]) => g.map((x) => `${mm(x)}`).join(', ') + (uk ? ' мм' : ' mm');
        return uk
          ? `На столі: ${list(table)} на фото — у натурі по ${real(table[0] ?? 0, l)} за 0,25 с, v ≈ ${ms(table[0] ?? 0, l)}, рух рівномірний. На жолобі: ${list(groove)} — у натурі ${groove.map((x) => real(x, l)).join(', ')}, середня швидкість на проміжках ${groove.map((x) => ms(x, l)).join(', ')}: кулька розганялася.`
          : `On the table: ${list(table)} on the photo — ${real(table[0] ?? 0, l)} in life each in 0.25 s, v ≈ ${ms(table[0] ?? 0, l)}, uniform motion. In the groove: ${list(groove)} — in life ${groove.map((x) => real(x, l)).join(', ')}, the average speed on the gaps ${groove.map((x) => ms(x, l)).join(', ')}: the ball was speeding up.`;
      }),
    };
  },
  'wind-speed': (run) => {
    const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.wind' && x.record.value !== null).map((x) => ({ day: Number(x.command['day']) as 1 | 2 | 3, t: x.record.value!, l: x.record.inputs?.['track'] ?? WIND_TRACK }));
    const v = (x: { t: number; l: number }) => x.l / x.t;
    const ms = (x: number, l: Locale) => `${sig(x, 2, l)} ${l === 'uk' ? 'м/с' : 'm/s'}`;
    const leaves = R.find((x) => x.day === 2);
    return {
      ...(leaves && v(leaves) >= 2 && v(leaves) <= 3 ? { correct: 'walk' } : {}),
      why: both((l) =>
        l === 'uk'
          ? 'Повітря невидиме, тож стежимо за чимось, що рухається разом із ним. Мильна бульбашка — тонка плівка з повітрям усередині, вона майже нічого не важить, і вітер одразу несе її зі своєю швидкістю. Тоді v = l / t: 6 м поділити на час між позначками. Швидкість вітру вимірюють і метеорологи — анемометрами, а моряки здавна оцінювали її за прикметами: шкала Бофорта (1805 р.) зіставляє кожну силу вітру з тим, що він робить. Коли шелестить листя й вітер відчуваєш обличчям, це 2 бали — від 1,6 до 3,4 м/с. Засікати час рукою — похибка близько 0,2 с, тож для сильнішого вітру краще брати довшу відстань і пускати кілька бульбашок: вітер ще й поривчастий.'
          : 'Air cannot be seen, so we watch something that moves with it. A soap bubble is a thin film with air inside; it weighs next to nothing, and the wind at once carries it at its own speed. Then v = l / t: 6 m divided by the time between the marks. Meteorologists measure the wind’s speed too — with anemometers — and sailors long judged it by its signs: the Beaufort scale (1805) matches each force of wind with what it does. When leaves rustle and the wind is felt on the face, that is force 2 — 1.6 to 3.4 m/s. Timing by hand has an error of about 0.2 s, so for a stronger wind a longer distance is better, and several bubbles: the wind comes in gusts, too.',
      ),
      say: both((l) => (leaves ? (l === 'uk' ? `Шелестить листя — повітря рухається зі швидкістю ${ms(v(leaves), l)}: 2 бали, «легкий» вітер.` : `Leaves rustle — the air moves at ${ms(v(leaves), l)}: force 2, a light breeze.`) : '')),
      text: both((l) => {
        const uk = l === 'uk';
        const parts = R.map((x) => {
          const b = BEAUFORT[x.day];
          const f = beaufortOf(v(x));
          return uk ? `${b.signs.uk}: 6 м за ${formatMeasured('time', x.t, 0.01, l)}, v ≈ ${ms(v(x), l)} — ${f} ${f === 1 ? 'бал' : 'бали'}, «${tr(BEAUFORT[f as 1 | 2 | 3]?.name ?? b.name, l)}»` : `${b.signs.en}: 6 m in ${formatMeasured('time', x.t, 0.01, l)}, v ≈ ${ms(v(x), l)} — force ${f}, a ${tr(BEAUFORT[f as 1 | 2 | 3]?.name ?? b.name, l)}`;
        });
        const s = `${parts.join('; ')}.`;
        return s.charAt(0).toUpperCase() + s.slice(1) + (uk ? ' Сила вітру за швидкістю збіглася з прикметами (шкала Бофорта).' : ' The wind’s force by its speed matched its signs (the Beaufort scale).');
      }),
    };
  },
  windlass: (run) => {
    const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.winch' && x.record.value !== null).map((x) => ({ spool: String(x.command['spool']), mode: String(x.command['mode']), amount: Number(x.command['amount']), v: x.record.value!, d: x.record.inputs?.['diameter'] ?? 0 }));
    const turns = R.filter((x) => x.mode === 'lower');
    // Each count against l / (π·d) and l / d: which one the turns follow (to a quarter turn).
    const byCircle = turns.length > 0 && turns.every((x) => Math.abs(x.v - x.amount / (Math.PI * x.d)) <= 0.25);
    const num = (x: number, l: Locale) => sig(x, 3, l);
    const cm = (x: number, l: Locale) => `${sig(x * 100, 3, l)} ${l === 'uk' ? 'см' : 'cm'}`;
    const name = (sp: string, l: Locale) => tr(winchSpoolName(sp as WinchSpool), l);
    return {
      ...(byCircle ? { correct: 'circle' } : {}),
      why: both((l) =>
        l === 'uk'
          ? 'Нитка лежить на котушці кільцями. За один оберт котушки з неї змотується один виток — це довжина кола котушки, C = π·d. Тож вантаж, опускаючись на l, обертає котушку n = l / (π·d) разів: прямолінійний рух вантажу стає обертанням котушки. І навпаки: повертаючи ручку n разів, намотуємо n·π·d нитки — обертання стає прямолінійним рухом вантажу. Тонкий олівець має коротше коло, тож на ті самі 30 см обертається більше разів, а за ті самі 5 обертів піднімає вантаж менше. Так працюють ворот колодязя, котушка спінінга, рулетка; а рейка з шестірнею чи колесо, що котиться, роблять те саме без нитки. Товщину нитки тут не враховано — з нею кожен виток трохи довший.'
          : 'The thread lies on the spool in rings. One turn of the spool unwinds one ring — the spool’s circumference, C = π·d. So the load, going down by l, turns the spool n = l / (π·d) times: the load’s straight motion becomes the spool’s turning. And back: turning the handle n times winds n·π·d of thread — turning becomes the load’s straight motion. The thin pencil has a shorter circumference, so it turns more times for the same 30 cm, and lifts the load less in the same 5 turns. This is how a well’s windlass, a fishing reel, a tape measure work; a rack and pinion or a rolling wheel do the same without a thread. The thread’s thickness is left out here — with it each ring is a little longer.',
      ),
      say: both((l) => {
        const a = turns[0];
        return a ? (l === 'uk' ? `${name(a.spool, l).replace(/^./, (ch) => ch.toUpperCase())}: ${num(a.v, l)} оберту на 30 см — стільки разів π·d вміщується в довжину нитки.` : `${name(a.spool, l).replace(/^./, (ch) => ch.toUpperCase())}: ${num(a.v, l)} turns for 30 cm — as many times as π·d fits into the thread.`) : '';
      }),
      text: both((l) => {
        const uk = l === 'uk';
        const parts = R.map((x) =>
          x.mode === 'lower'
            ? uk ? `${name(x.spool, l)}, вантаж опустився на ${cm(x.amount, l)} — ${num(x.v, l)} об. (l / (π·d) = ${sig(x.amount / (Math.PI * x.d), 3, l)})` : `${name(x.spool, l)}, the load down ${cm(x.amount, l)} — ${num(x.v, l)} turns (l / (π·d) = ${sig(x.amount / (Math.PI * x.d), 3, l)})`
            : uk ? `${name(x.spool, l)}, ${x.amount} обертів ручки — вантаж піднявся на ${cm(x.v, l)} (π·d·n = ${cm(Math.PI * x.d * x.amount, l)})` : `${name(x.spool, l)}, ${x.amount} turns of the handle — the load rose ${cm(x.v, l)} (π·d·n = ${cm(Math.PI * x.d * x.amount, l)})`,
        );
        const s = `${parts.join('; ')}.`;
        return s.charAt(0).toUpperCase() + s.slice(1) + (uk ? ' Оберти лічено за міткою — до чверті оберту.' : ' The turns are counted by a mark — to a quarter turn.');
      }),
    };
  },
  'relative-motion': (run) => {
    // Each step: the time, the bottle's shift and the bubble's path on the paper (the records by `which`).
    const steps = new Map<number, { u: number; t?: number; x?: number; s?: number }>();
    for (const r of (run.readings ?? []).filter((x) => x.command.type === 'lab.carry' && x.record.value !== null)) {
      const u = Number(r.command['speed']);
      const e = steps.get(u) ?? { u };
      const w = r.record.inputs?.['which'];
      if (w === 0) e.t = r.record.value!;
      else if (w === 1) e.x = r.record.value!;
      else e.s = r.record.value!;
      steps.set(u, e);
    }
    const R = [...steps.values()].sort((a, b) => a.u - b.u);
    const cm = (x: number, l: Locale) => `${sig(x * 100, 3, l)} ${l === 'uk' ? 'см' : 'cm'}`;
    const sec = (x: number, l: Locale) => formatMeasured('time', x, 0.01, l);
    const longer = R.length > 1 && R.every((x, i) => i === 0 || (x.s ?? 0) > (R[i - 1]!.s ?? 0));
    const sameTime = R.every((x) => Math.abs((x.t ?? 0) - (R[0]!.t ?? 0)) < 0.05);
    return {
      ...(longer && sameTime ? { correct: 'depends' } : {}),
      why: both((l) =>
        l === 'uk'
          ? 'Рух завжди описують відносно чогось — тіла відліку. Відносно пляшки бульбашка щоразу піднімається вертикально на ті самі 9 см і за той самий час: рідина в пляшці нічого не знає про те, що пляшку ведуть. Але відносно стола бульбашка водночас і піднімається, і їде разом із пляшкою вбік. Два рівномірні рухи складаються в один — уздовж похилої прямої, — і що швидше ведемо пляшку, то довший цей шлях і більша швидкість бульбашки відносно стола. Тож траєкторія, шлях і швидкість залежать від того, відносно чого розглядають рух; а час підйому — ні. Так само яблуко, що впало в автобусі, для пасажира падає прямовисно, а для людини на зупинці — летить по кривій.'
          : 'Motion is always described relative to something — a body of reference. Relative to the bottle the bubble rises straight up the same 9 cm in the same time each time: the liquid in the bottle knows nothing of the bottle being carried. But relative to the table the bubble at once rises and travels sideways with the bottle. The two uniform motions add up into one — along a slanted straight line — and the faster the bottle is carried, the longer that path and the faster the bubble goes relative to the table. So the trajectory, the path and the speed depend on what the motion is described relative to; the time of the rise does not. In the same way an apple dropped in a bus falls straight down for a passenger, but flies along a curve for someone at the stop.',
      ),
      say: both((l) => {
        const a = R[0];
        const z = R.at(-1);
        return a && z && a !== z ? (l === 'uk' ? `Відносно пляшки — щоразу 9 см угору, а відносно стола — від ${cm(a.s ?? 0, l)} до ${cm(z.s ?? 0, l)}, за той самий час.` : `Relative to the bottle — 9 cm up each time; relative to the table — from ${cm(a.s ?? 0, l)} to ${cm(z.s ?? 0, l)}, in the same time.`) : '';
      }),
      text: both((l) => {
        const uk = l === 'uk';
        const parts = R.map((x) => {
          const how = x.u === 0 ? (uk ? 'пляшка стоїть' : 'the bottle stands') : uk ? `пляшку ведуть ${sig(x.u * 100, 2, l)} см/с` : `the bottle carried at ${sig(x.u * 100, 2, l)} cm/s`;
          const moved = x.u === 0 ? (uk ? 'пляшка не зсунулася' : 'the bottle did not move') : uk ? `пляшка зсунулася на ${cm(x.x ?? 0, l)}` : `the bottle moved ${cm(x.x ?? 0, l)}`;
          return uk ? `${how}: ${sec(x.t ?? 0, l)}, ${moved}, шлях бульбашки відносно стола ${cm(x.s ?? 0, l)}` : `${how}: ${sec(x.t ?? 0, l)}, ${moved}, the bubble’s path relative to the table ${cm(x.s ?? 0, l)}`;
        });
        const s = `${parts.join('; ')}.`;
        return s.charAt(0).toUpperCase() + s.slice(1) + (uk ? ' Відносно пляшки шлях щоразу 9 см.' : ' Relative to the bottle the path is 9 cm each time.');
      }),
    };
  },
  'ball-bounce': (run) => {
    const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.bounce' && x.record.value !== null).map((x) => ({ ball: String(x.command['ball']) as BounceBall, n: Number(x.command['bounce']), h: x.record.value!, m: x.record.inputs?.['mass'] ?? 0 }));
    const cm = (h: number) => Math.round(h * 100);
    const pp = R.filter((x) => x.ball === 'pingpong').sort((a, b) => a.n - b.n);
    const lower = pp.length > 1 && pp.every((x, i) => x.h < (i === 0 ? BOUNCE_FROM : pp[i - 1]!.h));
    // The energy at a top, millijoules: Eп = m·g·h.
    const mJ = (m: number, h: number, l: Locale) => `${sig(m * G * h * 1000, 2, l)} ${l === 'uk' ? 'мДж' : 'mJ'}`;
    return {
      ...(lower ? { correct: 'heat' } : {}),
      why: both((l) =>
        l === 'uk'
          ? 'Нагорі м’ячик має потенціальну енергію Eп = m·g·h. Падаючи, він розганяється: потенціальна енергія переходить у кінетичну. Ударившись об плиту, м’ячик на мить сплющується, а тоді розпрямляється й відштовхується — і, піднімаючись, знову міняє кінетичну енергію на потенціальну. Але сплющення повертає не все: частина енергії йде на нагрівання м’ячика й плити (стає внутрішньою енергією), частина — на звук удару. Тому механічної енергії щоразу менше, і м’ячик піднімається нижче: висота показує, яку частку енергії він зберіг. Енергія не зникає — вона лише переходить в інші види: це закон збереження енергії. Пружний м’ячик для настільного тенісу зберігає близько 80 % за удар, тенісний м’яч — трохи більше половини, а пластилін, сплющившись, лишається на плиті: уся його механічна енергія стала внутрішньою. Земля ж притягує м’ячик однаково на будь-якій із цих висот.'
          : 'At the top the ball has potential energy Eп = m·g·h. Falling, it speeds up: potential energy turns into kinetic. Hitting the plate, the ball is squashed for a moment, then straightens and pushes off — and, rising, trades kinetic energy back for potential. But the squashing does not give everything back: part of the energy warms the ball and the plate (becomes internal energy), part goes as the sound of the impact. So there is less mechanical energy each time, and the ball rises lower: the height shows the share of energy it kept. Energy does not vanish — it only turns into other forms: this is the conservation of energy. A springy table tennis ball keeps about 80 % per impact, a tennis ball a little over half, and plasticine, squashed, stays on the plate: all its mechanical energy became internal. The Earth pulls the ball just the same at any of these heights.',
      ),
      say: both((l) => {
        const a = pp[0];
        return a ? (l === 'uk' ? `З метра м’ячик для настільного тенісу підскочив на ${cm(a.h)} см — зберіг ${cm(a.h)} % енергії; щоразу — приблизно стільки ж від попередньої.` : `From a metre the table tennis ball bounced to ${cm(a.h)} cm — it kept ${cm(a.h)} % of its energy; each time about the same share of the one before.`) : '';
      }),
      text: both((l) => {
        const uk = l === 'uk';
        const parts = [
          ...(pp.length ? [uk ? `М’ячик для настільного тенісу з 1 м: ${pp.map((x) => `${cm(x.h)} см`).join(', ')} — енергія ${mJ(pp[0]!.m, BOUNCE_FROM, l)} нагорі, ${pp.map((x) => mJ(x.m, x.h, l)).join(', ')} після ударів` : `The table tennis ball from 1 m: ${pp.map((x) => `${cm(x.h)} cm`).join(', ')} — an energy of ${mJ(pp[0]!.m, BOUNCE_FROM, l)} at the top, ${pp.map((x) => mJ(x.m, x.h, l)).join(', ')} after the impacts`] : []),
          ...R.filter((x) => x.ball !== 'pingpong').map((x) => `${tr(bounceBallName(x.ball), l)} — ${cm(x.h)} ${uk ? 'см' : 'cm'}${x.h > 0 ? (uk ? `, зберіг ${cm(x.h)} % енергії` : `, it kept ${cm(x.h)} % of its energy`) : uk ? ': уся енергія стала внутрішньою' : ': all the energy became internal'}`),
        ];
        const s = `${parts.join('; ')}.`;
        return s.charAt(0).toUpperCase() + s.slice(1) + (uk ? ' Частки — з випробувань м’ячів за правилами ITTF і ITF; опір повітря не враховано.' : ' The shares are from the balls’ tests under the ITTF and ITF rules; the air’s drag is left out.');
      }),
    };
  },
  'small-bodies': (run) => {
    const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.rows' && x.record.value !== null).map((x) => ({ body: String(x.command['body']), n: Number(x.command['count']), L: x.record.value! }));
    const mm = (x: number, l: Locale, d = 3) => `${sig(x * 1000, d, l)} ${l === 'uk' ? 'мм' : 'mm'}`;
    // The size of one: to hundredths of a millimetre (0,40 — not 0,4).
    const d2 = (x: number, l: Locale) => `${(x * 1000).toFixed(2).replace('.', l === 'uk' ? ',' : '.')} ${l === 'uk' ? 'мм' : 'mm'}`;
    const one = R.find((x) => x.n === 1);
    const rows = R.filter((x) => x.n > 1);
    const name = (b: string, n: number, l: Locale) => tr(rowName(b as RowBody, n), l);
    return {
      correct: 'row',
      why: both((l) =>
        l === 'uk'
          ? 'Лінійка дає довжину лише до поділки: її похибка — пів поділки, 0,5 мм, хоч що вимірюй. Для горошини завбільшки 6–7 мм це вже кілька відсотків, а зернятко пшона чи нитку однією лінійкою не виміряти взагалі. Але коли вимірюємо ряд із N однакових тіл, ці пів міліметра припадають на весь ряд — на одне тіло лише 0,5/N мм. Тож що довший ряд, то точніше d = L/N. Так само усереднюються й відмінності між горошинами: виходить середній розмір. Так вимірюють товщину аркуша (пачку), дроту (намотку), навіть розміри молекул — у збільшенні.'
          : 'A ruler gives a length only to a division: its error is half a division, 0.5 mm, whatever you measure. For a 6–7 mm pea that is several per cent already, and a millet grain or a thread cannot be measured by one ruler at all. But when we measure a row of N alike bodies, that half millimetre is for the whole row — just 0.5/N mm per body. So the longer the row, the better d = L/N. The differences between the peas average out the same way: we get the mean size. This is how the thickness of a sheet (a stack), of a wire (a winding) are measured — even molecules, magnified.',
      ),
      say: both((l) => {
        const millet = rows.find((x) => x.body === 'millet');
        return millet ? (l === 'uk' ? `Зернятко пшона — ${d2(millet.L / millet.n, l)}: ряд із ${millet.n} зерняток дав соті частки міліметра.` : `A millet grain is ${d2(millet.L / millet.n, l)}: a row of ${millet.n} grains gave hundredths of a millimetre.`) : '';
      }),
      text: both((l) => {
        const uk = l === 'uk';
        const parts = [
          ...(one ? [uk ? `Одна горошина — ${mm(one.L, l, 2)} ± 0,5 мм: похибка близько ${Math.round((0.0005 / one.L) * 100)} %` : `One pea — ${mm(one.L, l, 2)} ± 0.5 mm: an error of about ${Math.round((0.0005 / one.L) * 100)} %`] : []),
          ...rows.map((x) => (uk ? `${name(x.body, x.n, l)} — ${mm(x.L, l, 3)}, d = ${mm(x.L, l, 3)} / ${x.n} ≈ ${d2(x.L / x.n, l)} (± ${sig(0.5 / x.n, 1, l)} мм)` : `${name(x.body, x.n, l)} — ${mm(x.L, l, 3)}, d = ${mm(x.L, l, 3)} / ${x.n} ≈ ${d2(x.L / x.n, l)} (± ${sig(0.5 / x.n, 1, l)} mm)`)),
        ];
        return `${parts.join('; ')}.${uk ? ' Ряд ділить похибку лінійки на кількість тіл: нитку, тоншу за поділку, вдалося виміряти до сотих міліметра.' : ' A row divides the ruler’s error by the number of bodies: the thread, thinner than a division, came out to hundredths of a millimetre.'}`.replace(/^./, (ch) => ch.toUpperCase());
      }),
    };
  },
  'adding-forces': (run) => {
    const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.forces' && x.record.value !== null);
    const of = (hold: string, at?: number) => R.filter((x) => x.command['hold'] === hold && (at === undefined || Math.abs(Number(x.command['at']) - at) < 1e-6)).map((x) => x.record.value!);
    const [one] = of('one');
    const twos = [...new Set(R.filter((x) => x.command['hold'] === 'two').map((x) => Number(x.command['at'])))].map((at) => ({ at, f: of('two', at) }));
    const down = of('down');
    const round = (x: number) => Math.round(x * 10) / 10;
    const sums = [...twos.map((x) => round((x.f[0] ?? 0) + (x.f[1] ?? 0))), ...(down.length === 2 ? [round(down[0]! - down[1]!)] : [])];
    const same = one !== undefined && sums.length > 0 && sums.every((x) => Math.abs(x - one) < 0.15);
    return {
      ...(same ? { correct: 'same' } : {}),
      why: both((l) =>
        l === 'uk'
          ? 'Вантаж висить нерухомо — отже, сили, що на нього діють, зрівноважені: униз його тягне вага тягарців разом із лінійкою, угору — динамометри. Тож рівнодійна сил динамометрів щоразу дорівнює вазі вантажу — тій самій силі, яку показував один динамометр. Тримати можна одним динамометром чи двома, ділити вагу між кінцями лінійки порівну чи ні (кінець, ближчий до тягарців, тримає більше — чому, з’ясуємо в темі про важіль), — разом угору щоразу та сама сила. А коли другий динамометр тягне тягарці вниз, верхньому доводиться тримати і вантаж, і цю силу — він показує більше. Рівнодійна двох протилежних сил — їхня різниця — знову дорівнює вазі вантажу.'
          : 'The load hangs still — so the forces on it balance: its weight with the ruler pulls it down, the dynamometers pull it up. So the resultant of the dynamometers’ forces equals the load’s weight each time — the very force one dynamometer showed. Hold it by one dynamometer or by two, share the weight between the ruler’s ends equally or not (the end nearer the weights holds more — why, we shall see with the lever), — together upwards it is the same force every time. And when the second dynamometer pulls the weights down, the upper one has to hold both the load and that pull — it shows more. The resultant of the two opposite forces — their difference — again equals the load’s weight.',
      ),
      say: both((l) => (one !== undefined ? (l === 'uk' ? `Щоразу R = ${N(sums[0] ?? one, l)} — стільки ж, скільки показував один динамометр.` : `Each time R = ${N(sums[0] ?? one, l)} — as much as one dynamometer showed.`) : '')),
      text: both((l) => {
        const uk = l === 'uk';
        const parts = [
          ...(one !== undefined ? [uk ? `Один динамометр тримав вантаж із силою ${N(one, l)}` : `One dynamometer held the load with ${N(one, l)}`] : []),
          ...twos.map((x) =>
            uk
              ? `два, тягарці на ${Math.round(x.at * 100)} см: ${N(x.f[0] ?? 0, l)} + ${N(x.f[1] ?? 0, l)} = ${N(round((x.f[0] ?? 0) + (x.f[1] ?? 0)), l)}`
              : `two, the weights at ${Math.round(x.at * 100)} cm: ${N(x.f[0] ?? 0, l)} + ${N(x.f[1] ?? 0, l)} = ${N(round((x.f[0] ?? 0) + (x.f[1] ?? 0)), l)}`,
          ),
          ...(down.length === 2 ? [uk ? `вгору ${N(down[0]!, l)}, униз ${N(down[1]!, l)}: ${N(down[0]!, l)} − ${N(down[1]!, l)} = ${N(round(down[0]! - down[1]!), l)}` : `up ${N(down[0]!, l)}, down ${N(down[1]!, l)}: ${N(down[0]!, l)} − ${N(down[1]!, l)} = ${N(round(down[0]! - down[1]!), l)}`] : []),
        ];
        const tail = same
          ? uk
            ? ' Покази динамометрів змінювалися, а рівнодійна — ні: щоразу вона дорівнює вазі вантажу.'
            : ' The dynamometers’ readings changed, the resultant did not: each time it equals the load’s weight.'
          : uk
            ? ' Різниця в одну поділку (0,1 Н) — від округлення показів до поділки.'
            : ' A difference of one division (0.1 N) comes from rounding the readings to the division.';
        return `${parts.join('; ')}.${tail}`;
      }),
    };
  },
  'ball-in-liquids': (run) => {
    const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.sink' && x.record.value !== null);
    const liquids = ['glycerol', 'sunflower-oil', 'water'] as const;
    const per = liquids.flatMap((liquid) => {
      const laps = R.filter((x) => x.command['liquid'] === liquid).map((x) => ({ s: x.record.inputs?.['mark'] ?? 0, t: x.record.value!, rho: x.record.inputs?.['density'] ?? 0, mu: x.record.inputs?.['viscosity'] ?? 0 }));
      const last = laps[laps.length - 1];
      return last && last.t > 0 ? [{ liquid, v: last.s / last.t, t: last.t, s: last.s, rho: last.rho, mu: last.mu }] : [];
    });
    const slowest = [...per].sort((a, b) => a.v - b.v)[0];
    const correct = slowest?.liquid;
    const name = (x: string, l: Locale) => tr({ uk: sinkLiquidName(x as SinkLiquid).in.uk, en: sinkLiquidName(x as SinkLiquid).in.en }, l);
    const v = (x: number, l: Locale) => (x < 0.1 ? `${sig(x * 100, 2, l)} ${l === 'uk' ? 'см/с' : 'cm/s'}` : `${sig(x, 2, l)} ${l === 'uk' ? 'м/с' : 'm/s'}`);
    const water = per.find((x) => x.liquid === 'water');
    return {
      ...(correct ? { correct } : {}),
      why: both((l) =>
        l === 'uk'
          ? 'Кулька тоне рівномірно, коли її вагу врівноважують виштовхувальна сила й опір рідини. Густина рідини змінює лише виштовхувальну силу — а вона для сталевої кульки, що в 6–8 разів густіша за ці рідини, мала. Головне — в’язкість, «тягучість» рідини: що вона більша, то сильніше рідина гальмує кульку. Гліцерин у тисячу з гаком разів в’язкіший за воду, олія — у п’ятдесят. Тому в олії, найлегшій із трьох, кулька тоне повільніше, ніж у воді, а в гліцерині, найгустішому, — ледь-ледь.'
          : 'The ball sinks steadily when its weight is balanced by the buoyant force and the liquid’s drag. The liquid’s density changes only the buoyant force — and for a steel ball 6–8 times as dense as these liquids it is small. What matters is the viscosity, the liquid’s “thickness”: the higher it is, the harder the liquid brakes the ball. Glycerol is over a thousand times as viscous as water, oil some fifty. So in oil, the lightest of the three, the ball sinks slower than in water, and in glycerol, the densest, hardly at all.',
      ),
      say: both((l) => (slowest ? (l === 'uk' ? `Найповільніше — ${name(slowest.liquid, l)}: ${v(slowest.v, l)}.` : `Slowest ${name(slowest.liquid, l)}: ${v(slowest.v, l)}.`) : '')),
      text: both((l) =>
        l === 'uk'
          ? `${per.map((x, k) => `${k ? name(x.liquid, l) : name(x.liquid, l).replace(/^./, (c) => c.toUpperCase())} (густина ${Math.round(x.rho)} кг/м³) кулька пройшла ${Math.round(x.s * 100)} см за ${sig(x.t, 3, l)} с — v ≈ ${v(x.v, l)}`).join('; ')}. Швидкість не йде за густиною: олія найлегша, а кулька в ній повільніша, ніж у воді, — бо олія набагато в’язкіша.${water && water.t < 1 ? ` У воді кулька проходить ${Math.round(water.s * 100)} см менш ніж за секунду — рукою засікти такий час точно важко: запізнення пальця (0,1–0,2 с) тут суттєве.` : ''}`
          : `${per.map((x, k) => `${k ? name(x.liquid, l) : name(x.liquid, l).replace(/^./, (c) => c.toUpperCase())} (density ${Math.round(x.rho)} kg/m³) the ball went ${Math.round(x.s * 100)} cm in ${sig(x.t, 3, l)} s — v ≈ ${v(x.v, l)}`).join('; ')}. The speed does not follow the density: oil is the lightest, yet the ball is slower in it than in water — because oil is much more viscous.${water && water.t < 1 ? ` In water the ball goes ${Math.round(water.s * 100)} cm in under a second — hard to time by hand: the finger’s delay (0.1–0.2 s) matters here.` : ''}`,
      ),
    };
  },
  'electromagnetic-induction': (run) => {
    const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.induct' && x.record.value !== null);
    const find = (move: string, pole = 'N', fast?: boolean) => R.find((x) => x.command['move'] === move && x.command['pole'] === pole && (fast === undefined || (Number(x.command['time']) <= 0.5) === fast))?.record;
    const still = find('still');
    const inFast = find('in', 'N', true);
    const out = find('out');
    const inSlow = find('in', 'N', false);
    const south = find('in', 'S', true);
    const coil = find('coil');
    const div = R[0]?.record.inputs?.['division'] ?? 0.002;
    const moved = [inFast, out, inSlow, south, coil].filter((x) => x && Math.abs(x.value!) >= div);
    const correct = !R.length ? undefined : still && Math.abs(still.value!) >= div ? 'inside' : moved.length ? 'motion' : 'never';
    const mA = (x: number | null | undefined, l: Locale) => `${x! > 0 ? '+' : ''}${sig((x ?? 0) * 1000, 2, l).replace('-', '−')} ${l === 'uk' ? 'мА' : 'mA'}`;
    const turns = Number(R[0]?.command['turns'] ?? 200);
    const Rc = inFast?.inputs?.['resistance'] ?? 7;
    const emf = (x: number | null | undefined) => Math.abs(x ?? 0) * Rc;
    return {
      ...(correct ? { correct } : {}),
      why: both((l) =>
        l === 'uk'
          ? 'Струм у котушці з’являється, лише коли змінюється магнітний потік крізь її витки — тобто коли магніт і котушка рухаються одне відносно одного. Нерухомий магніт, хай навіть усередині, струму не дає. Що швидше змінюється потік, то більша ЕРС індукції — і струм. А напрям струму такий, що його власне магнітне поле заважає зміні потоку (правило Ленца): магніт входить — котушка його відштовхує, виходить — притягує. Тому вводити й виводити, північним чи південним полюсом — струм іде в різні боки. І байдуже, що рухається — магніт чи котушка: важить лише їхній рух одне відносно одного.'
          : 'A current appears in the coil only while the magnetic flux through its turns changes — that is, while the magnet and the coil move against each other. A still magnet, even inside, makes no current. The faster the flux changes, the larger the induced EMF — and the current. And the current flows so that its own field hinders the change of the flux (Lenz’s law): the magnet coming in is pushed back by the coil, going out — pulled. So in or out, north or south pole first — the current goes opposite ways. And it does not matter which moves, the magnet or the coil: only their motion against each other counts.',
      ),
      say: both((l) => (correct === 'motion' ? (l === 'uk' ? 'Струм іде, лише поки магніт рухається відносно котушки!' : 'The current flows only while the magnet moves against the coil!') : l === 'uk' ? 'Подивімося, що показав міліамперметр.' : 'Let us look at the milliammeter.')),
      text: both((l) =>
        l === 'uk'
          ? `Котушка на ${turns} витків, опір кола (котушка й міліамперметр) ≈ ${sig(Rc, 2, l)} Ом. Магніт нерухомо в котушці — ${mA(still?.value, l)}. Витягли швидко — ${mA(out?.value, l)}; вставили північним полюсом швидко — ${mA(inFast?.value, l)}, повільно — ${mA(inSlow?.value, l)}; південним швидко — ${mA(south?.value, l)}; котушку надягли на нерухомий магніт — ${mA(coil?.value, l)}. ЕРС ε = I·R: швидко ≈ ${sig(emf(inFast?.value), 2, l)} В, повільно ≈ ${sig(emf(inSlow?.value), 2, l)} В — що швидше рух, то більша. Знак струму міняється, коли магніт виводять замість вводити і коли повертають іншим полюсом.`
          : `A coil of ${turns} turns; the circuit’s resistance (the coil and the meter) ≈ ${sig(Rc, 2, l)} Ω. The magnet still in the coil — ${mA(still?.value, l)}. Pulled out fast — ${mA(out?.value, l)}; pushed in north pole first fast — ${mA(inFast?.value, l)}, slowly — ${mA(inSlow?.value, l)}; south pole first fast — ${mA(south?.value, l)}; the coil slipped onto the still magnet — ${mA(coil?.value, l)}. The EMF ε = I·R: fast ≈ ${sig(emf(inFast?.value), 2, l)} V, slowly ≈ ${sig(emf(inSlow?.value), 2, l)} V — the faster, the larger. The current changes sign when the magnet is pulled out instead of pushed in and when it is turned the other pole first.`,
      ),
    };
  },
  electromagnet: (run) => {
    const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.magnet' && x.record.quantity === 'angle' && x.record.value !== null);
    const at = (current: number, core: boolean, reversed = false) => R.find((x) => Number(x.command['current']) === current && !!x.command['core'] === core && !!x.command['reversed'] === reversed)?.record;
    const earth = R[0]?.record.inputs?.['earth'] ?? 19.4e-6;
    const B = (deg: number) => earth * Math.tan((deg * Math.PI) / 180);
    const steps = [0.5, 1, 1.5].map((I) => ({ I, deg: at(I, true)?.value ?? 0 }));
    const back = at(1.5, true, true)?.value ?? 0;
    const bare = at(1.5, false)?.value ?? 0;
    const full = steps[2]!.deg;
    // A change counts if it is more than a compass division.
    const div = R[0]?.record.inputs?.['division'] ?? 2;
    const byCurrent = full - steps[0]!.deg > div;
    const byCore = full - bare > div;
    const correct = !R.length ? undefined : byCurrent && byCore ? 'both' : byCurrent ? 'current' : byCore ? 'core' : undefined;
    const deg = (x: number) => `${x}°`;
    const uT = (x: number, l: Locale) => `${sig(x * 1e6, 2, l)} ${l === 'uk' ? 'мкТл' : 'µT'}`;
    const A = (x: number, l: Locale) => `${sig(x, 2, l)} ${l === 'uk' ? 'А' : 'A'}`;
    const list = (l: Locale) => steps.map((x) => `${A(x.I, l)} — ${deg(x.deg)} (B ≈ ${uT(B(x.deg), l)})`).join('; ');
    const turns = Number(R[0]?.command['turns'] ?? 100);
    const place = String(R[0]?.command['place'] ?? 'Київ');
    const where = (l: Locale) => `${place}${R[0]?.command['example'] ? (l === 'uk' ? ', для прикладу' : ', for example') : ''}`;
    return {
      ...(correct ? { correct } : {}),
      why: both((l) =>
        l === 'uk'
          ? 'Струм у дроті створює магнітне поле, і поле кожного витка додається до поля інших — тому воно пропорційне силі струму й числу витків. Але сама котушка — слабкий магніт. Залізо ж складається з крихітних «магнітиків», які в полі котушки повертаються вздовж нього й додають своє поле — у десятки разів сильніше. Звідси й сила електромагніта. Змінимо напрям струму — поле котушки, а з ним і цвяха, повернеться навпаки: північний і південний полюси поміняються місцями.'
          : 'The current in the wire makes a magnetic field, and each turn’s field adds to the others’ — so it is proportional to the current and to the number of turns. But the coil alone is a weak magnet. Iron, though, is made of tiny “magnets” that turn along the coil’s field and add their own — tens of times stronger. That is where the electromagnet’s strength comes from. Reverse the current — the coil’s field, and the nail’s with it, turns the other way: the north and south poles swap.',
      ),
      say: both((l) => (correct === 'both' ? (l === 'uk' ? `Струм утричі більший — поле втричі сильніше, а без цвяха стрілка ледь ворухнулася!` : `Three times the current — three times the field, and without the nail the needle hardly moved!`) : l === 'uk' ? 'Подивімося, що показав компас.' : 'Let us look at the compass.')),
      text: both((l) =>
        l === 'uk'
          ? `${turns} витків на цвяху. Без струму стрілка дивилася на північ. Зі струмом: ${list(l)} — поле B = B_З·tg θ (B_З ≈ ${uT(earth, l)}: ${where(l)}) зростало пропорційно силі струму, хоч кут — ні. Струм в інший бік — стрілка відхилилася на ${deg(Math.abs(back))}${back < 0 ? ', але в інший бік' : ''}: полюси електромагніта помінялися місцями. Без цвяха за того самого струму ${A(1.5, l)} стрілка ${Math.abs(bare) < div ? `майже не ворухнулася (${deg(Math.abs(bare))})` : `відхилилася лише на ${deg(Math.abs(bare))}`}: залізне осердя підсилює поле в десятки разів.`
          : `${turns} turns on the nail. With no current the needle looked north. With a current: ${list(l)} — the field B = B_E·tg θ (B_E ≈ ${uT(earth, l)}: ${where(l)}) grew in proportion to the current, though the angle did not. The current reversed — the needle turned ${deg(Math.abs(back))}${back < 0 ? ', but the other way' : ''}: the electromagnet’s poles swapped. Without the nail at the same ${A(1.5, l)} the needle ${Math.abs(bare) < div ? `hardly moved (${deg(Math.abs(bare))})` : `turned only ${deg(Math.abs(bare))}`}: the iron core strengthens the field tens of times.`,
      ),
    };
  },
  'hydrostatic-paradox': (run) => {
    const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.vessel' && x.record.value !== null);
    const d = R.find((x) => x.command['step'] === 'bottom')?.record.value ?? 0;
    const S = Math.PI * (d / 2) ** 2;
    const shapes = (['straight', 'wide', 'narrow'] as const).flatMap((shape) => {
      const recs = R.filter((x) => x.command['shape'] === shape);
      const V = recs.find((x) => x.record.quantity === 'volume')?.record;
      const M = recs.find((x) => x.record.quantity === 'length')?.record;
      if (!V || !M) return [];
      const rho = M.inputs?.['rho'] ?? 1000;
      const g = M.inputs?.['g'] ?? 9.81;
      return [{ shape, V: V.value!, dh: M.value!, F: rho * g * M.value! * S, P: rho * g * V.value! }];
    });
    // Alike if the manometer's readings differ by no more than half its division.
    const dhs = shapes.map((x) => x.dh);
    const top = [...shapes].sort((a, b) => b.dh - a.dh)[0];
    const correct = !shapes.length ? undefined : Math.max(...dhs) - Math.min(...dhs) <= 0.0005 ? 'same' : top!.shape === 'straight' ? undefined : top!.shape;
    const N = (x: number, l: Locale) => `${sig(x, 2, l)} ${l === 'uk' ? 'Н' : 'N'}`;
    const ml = (x: number, l: Locale) => formatMeasured('volume', x, 5e-6, l);
    const name = (s: string, l: Locale) => tr(vesselName(s as PascalVessel), l);
    const list = (l: Locale) => shapes.map((x) => (l === 'uk' ? `${name(x.shape, l)}: води ${ml(x.V, l)} (вага ≈ ${N(x.P, l)}), манометр ${formatMeasured('length', x.dh, 0.001, l)}` : `${name(x.shape, l)}: ${ml(x.V, l)} of water (weight ≈ ${N(x.P, l)}), the manometer ${formatMeasured('length', x.dh, 0.001, l)}`)).join('; ').replace(/^./, (x) => x.toUpperCase());
    const F = shapes[0]?.F ?? 0;
    return {
      ...(correct ? { correct } : {}),
      why: both((l) =>
        l === 'uk'
          ? 'Тиск рідини на якійсь глибині створює вага стовпчика рідини над цим місцем, p = ρ·g·h, — і він однаковий на тій самій глибині, хоч би якою широкою чи вузькою була посудина вище. На дні глибина однакова — отже, однаковий і тиск, і сила тиску на однакове дно. А куди ж дівається решта ваги води в широкій посудині? Її тримають похилі стінки: вода тисне на них, і вони — на підставку. У вузькій навпаки: похилі стінки самі тиснуть на воду вниз, тож на дно припадає більше, ніж важить вода.'
          : 'The pressure at some depth in a liquid comes from the weight of the column above that place, p = ρ·g·h, — and it is the same at the same depth however wide or narrow the vessel is higher up. At the bottom the depth is alike — so the pressure is alike too, and the force on an equal bottom. Where, then, does the rest of the water’s weight go in the wide vessel? The sloping walls hold it: the water presses on them, and they on the stand. In the narrow one it is the other way: the sloping walls themselves press the water down, so the bottom gets more than the water weighs.',
      ),
      say: both((l) => (correct === 'same' ? (l === 'uk' ? `Манометр щоразу показував те саме — на дно тисне ≈ ${N(F, l)}, хоч води й різна кількість!` : `The manometer showed the same each time — ≈ ${N(F, l)} on the bottom, though the water differed!`) : l === 'uk' ? 'Подивімося, що показав манометр.' : 'Let us look at the manometer.')),
      text: both((l) =>
        l === 'uk'
          ? `Дно ${formatMeasured('length', d, 0.001, l)} у діаметрі, площа S ≈ ${sig(S * 1e4, 3, l)} см². ${list(l)}. Тиск на дні p = ρ·g·Δh${correct === 'same' ? ' однаковий' : ''}, а сила тиску на дно F = p·S ≈ ${N(F, l)}${correct === 'same' ? ' в усіх трьох' : ''}. Води ж пішло в кілька разів різна кількість: у посудині, що розширюється, вода важить більше, ніж тисне на дно, а в тій, що звужується, — менше. Тиск на дно залежить від висоти води й площі дна, а не від форми посудини й не від того, скільки води налито, — це й є гідростатичний парадокс.`
          : `The bottom is ${formatMeasured('length', d, 0.001, l)} across, its area S ≈ ${sig(S * 1e4, 3, l)} cm². ${list(l)}. The pressure at the bottom p = ρ·g·Δh${correct === 'same' ? ' is alike' : ''}, and the force on the bottom F = p·S ≈ ${N(F, l)}${correct === 'same' ? ' in all three' : ''}. Yet the water poured differed several times: in the widening vessel the water weighs more than it presses on the bottom, in the narrowing one less. The pressure on the bottom depends on the water’s height and the bottom’s area, not on the vessel’s shape or on how much water was poured — that is the hydrostatic paradox.`,
      ),
    };
  },
  'atmospheric-pressure': (run) => {
    const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.atm' && x.record.value !== null);
    const len = R.find((x) => x.command['step'] === 'scale')?.record.value ?? 0;
    const p0 = R.find((x) => x.command['step'] === 'barometer')?.record.value ?? 0;
    const open = R.find((x) => x.command['step'] === 'open')?.record.value ?? 0;
    const pulls = R.filter((x) => x.command['step'] === 'sealed').map((x) => ({ v: Number(x.command['pulled']), F: x.record.value!, p: len > 0 ? (x.record.value! * len) / 1e-6 : 0 }));
    const last = pulls[pulls.length - 1];
    // Beyond the dynamometer's half division (as a share of the force), the syringe's pressure differs from the barometer's.
    const off = last && last.F > 0 ? 0.05 / last.F : 1;
    const correct = !last || !p0 ? undefined : Math.abs(last.p - p0) <= off * p0 ? 'same' : last.p < p0 ? 'less' : 'more';
    const hPa = (p: number, l: Locale) => formatMeasured('pressure', p, 100, l);
    const N = (x: number, l: Locale) => formatMeasured('force', x, 0.1, l);
    const mlT = (v: number, l: Locale) => `${sig(v, 2, l)} ${l === 'uk' ? 'мл' : 'mL'}`;
    const list = (l: Locale) => pulls.map((x) => `${mlT(x.v, l)} — ${N(x.F, l)} → ${hPa(x.p, l)}`).join('; ');
    const short = last && p0 ? Math.round((1 - last.p / p0) * 100) : 0;
    return {
      ...(correct ? { correct } : {}),
      why: both((l) =>
        l === 'uk'
          ? 'Поки носик відкритий, повітря заходить у шприц слідом за поршнем і тисне на нього зсередини так само, як ззовні, — тягнути легко. Коли носик закритий, зсередини тиснути майже нічому, і повітря ззовні впирається в поршень з силою F = p·S. Але трохи повітря завжди лишається в носику. Коли поршень іде вгору, це повітря розходиться по всьому шприцу й тисне зсередини тим слабше, чим більше йому місця. Тому сила зростає, що далі витягнуто поршень, і наближається до p·S, але не досягає її: тиск зі шприца виходить трохи меншим, ніж показує барометр.'
          : 'While the nozzle is open, air comes into the syringe after the plunger and presses on it from inside as much as from outside — it pulls easily. With the nozzle shut, there is almost nothing inside to press, and the air outside pushes on the plunger with F = p·S. But a little air always stays in the nozzle. As the plunger goes up, that air spreads over the whole syringe and presses from inside the weaker the more room it has. So the force grows the farther the plunger is pulled and comes near p·S, but does not reach it: the syringe’s pressure comes out a little less than the barometer shows.',
      ),
      say: both((l) => (last ? (l === 'uk' ? `Шприц показав ${hPa(last.p, l)}, барометр — ${hPa(p0, l)}.` : `The syringe showed ${hPa(last.p, l)}, the barometer ${hPa(p0, l)}.`) : l === 'uk' ? 'Подивімося, що показав динамометр.' : 'Let us look at the dynamometer.')),
      text: both((l) =>
        l === 'uk'
          ? `Шкала 1 мл займає ${sig(len * 100, 2, l)} см, тож площа поршня S = V / l ≈ ${sig(1e-6 / Math.max(len, 1e-9) * 1e4, 3, l)} см². З відкритим носиком динамометр показав ${N(open, l)}. Із закритим: ${list(l)} (p = F / S). Барометр показував ${hPa(p0, l)}: шприц дав ${correct === 'same' ? 'той самий тиск у межах точності динамометра' : correct === 'less' ? `на ${short} % менше — тим ближче до барометра, що далі витягнуто поршень` : 'більше'}. (Тертя поршня не враховано: у справжньому шприці воно додає до сили.)`
          : `The 1 mL scale is ${sig(len * 100, 2, l)} cm long, so the plunger’s area S = V / l ≈ ${sig(1e-6 / Math.max(len, 1e-9) * 1e4, 3, l)} cm². With the nozzle open the dynamometer showed ${N(open, l)}. Shut: ${list(l)} (p = F / S). The barometer showed ${hPa(p0, l)}: the syringe gave ${correct === 'same' ? 'the same pressure within the dynamometer’s accuracy' : correct === 'less' ? `${short} % less — the nearer the barometer the farther the plunger is pulled` : 'more'}. (The plunger’s friction is left out: in a real syringe it adds to the force.)`,
      ),
    };
  },
  'communicating-vessels': (run) => {
    const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.utube' && x.record.value !== null);
    const alone = R.find((x) => x.record.inputs?.['which'] === 2)?.record;
    const pours = [...new Set(R.filter((x) => Number(x.command['poured']) > 0).map((x) => Number(x.command['poured'])))].map((ml) => ({
      ml,
      oil: R.find((x) => Number(x.command['poured']) === ml && x.record.inputs?.['which'] === 1)?.record.value ?? 0,
      water: R.find((x) => Number(x.command['poured']) === ml && x.record.inputs?.['which'] === 0)?.record.value ?? 0,
      rhoW: R[0]?.record.inputs?.['rhoWater'] ?? 997,
      rhoO: R[0]?.record.inputs?.['rhoOil'] ?? 919,
    }));
    const last = pours[pours.length - 1];
    const correct = !last ? undefined : last.oil > last.water + 0.001 ? 'oil' : last.water > last.oil + 0.001 ? 'water' : 'same';
    const rho = last && last.oil > 0 ? (last.rhoW * last.water) / last.oil : 0;
    const cm = (m: number, l: Locale) => `${sig(m * 100, 3, l)} ${l === 'uk' ? 'см' : 'cm'}`;
    const list = (l: Locale) => pours.map((x) => (l === 'uk' ? `олії ${x.ml} мл: h_олії = ${cm(x.oil, l)}, h_води = ${cm(x.water, l)}` : `${x.ml} mL of oil: h_oil = ${cm(x.oil, l)}, h_water = ${cm(x.water, l)}`)).join('; ');
    return {
      ...(correct ? { correct } : {}),
      why: both((l) =>
        l === 'uk'
          ? 'Рідина в сполучених посудинах стоїть спокійно, коли на одному рівні в обох колінах тиск однаковий — інакше вона перетікала б туди, де тиск менший. З самою водою це означає однакові рівні. На рівні межі олії й води зліва тисне стовп олії, справа — стовп води: ρ_олії·g·h_олії = ρ_води·g·h_води. Олія легша за воду, тож її стовп мусить бути вищим, щоб тиснути так само.'
          : 'A liquid in communicating vessels stays still when the pressure is the same at one level in both arms — otherwise it would flow to where it is lower. With water alone that means the same levels. At the level of the boundary the oil column presses on the left, the water column on the right: ρ_oil·g·h_oil = ρ_water·g·h_water. Oil is lighter than water, so its column has to be taller to press as hard.',
      ),
      say: both((l) => (correct === 'oil' ? (l === 'uk' ? 'Стовп олії вищий — бо олія легша за воду!' : 'The oil column is taller — oil is lighter than water!') : l === 'uk' ? 'Подивімося на лінійку.' : 'Let us look at the ruler.')),
      text: both((l) =>
        l === 'uk'
          ? `Сама вода стояла в обох колінах на одному рівні${alone ? ` (різниця ${cm(alone.value ?? 0, l)})` : ''}. Потім: ${list(l)}. Стовп олії щоразу вищий за стовп води, а їхнє відношення стале: тиски на рівні межі рівні, ρ_олії·h_олії = ρ_води·h_води. Звідси густина олії ρ = ρ_води·h_води / h_олії ≈ ${sig(rho, 3, l)} кг/м³ (у таблиці — ${sig(last?.rhoO ?? 0, 3, l)} кг/м³).`
          : `Water alone stood at one level in both arms${alone ? ` (a difference of ${cm(alone.value ?? 0, l)})` : ''}. Then: ${list(l)}. The oil column is taller than the water column each time, and their ratio stays the same: the pressures are equal at the boundary, ρ_oil·h_oil = ρ_water·h_water. Hence the oil’s density ρ = ρ_water·h_water / h_oil ≈ ${sig(rho, 3, l)} kg/m³ (the table gives ${sig(last?.rhoO ?? 0, 3, l)} kg/m³).`,
      ),
    };
  },
  'depth-pressure': (run) => {
    const rows = (run.readings ?? []).filter((x) => x.command.type === 'lab.depth' && x.record.value !== null).map((x) => ({ h: Number(x.command['depth']), side: !!x.command['sideways'], dh: x.record.value!, rhoM: x.record.inputs?.['rhoManometer'] ?? 1000, rhoL: x.record.inputs?.['rhoLiquid'] ?? 1000, g: x.record.inputs?.['g'] ?? 9.81 }));
    const down = rows.filter((x) => !x.side);
    const side = rows.find((x) => x.side);
    const p = (x: (typeof rows)[number]) => x.rhoM * x.g * x.dh;
    // Proportional: p / h the same at every depth, within the manometer's millimetre (half of it, relative to Δh).
    const k = down.map((x) => p(x) / x.h);
    const mean = k.reduce((a, b) => a + b, 0) / Math.max(1, k.length);
    const err = down.length ? Math.max(...down.map((x) => 0.0005 / x.dh)) : 0;
    const spread = k.length ? Math.max(...k.map((x) => Math.abs(x / mean - 1))) : 0;
    const first = down[0];
    const last = down[down.length - 1];
    const correct = down.length < 2 ? undefined : spread <= err + 0.01 ? 'proportional' : last && first && p(last) > p(first) ? 'slower' : 'same';
    const rho = first ? mean / first.g : 0;
    const table = first?.rhoL ?? 0;
    const cm = (m: number, l: Locale) => `${sig(m * 100, 3, l)} ${l === 'uk' ? 'см' : 'cm'}`;
    const Pa = (x: number, l: Locale) => `${sig(x, 3, l)} ${l === 'uk' ? 'Па' : 'Pa'}`;
    const list = (l: Locale) => down.map((x) => `${cm(x.h, l)} — Δh = ${cm(x.dh, l)}, p ≈ ${Pa(p(x), l)}`).join('; ');
    return {
      ...(correct ? { correct } : {}),
      why: both((l) =>
        l === 'uk'
          ? 'Рідина важка: кожен її шар тисне на шари під собою вагою всього, що над ним. На глибині h на кожен квадратний метр давить стовп рідини висотою h і масою ρ·h, тобто вагою ρ·g·h — тому тиск росте рівно пропорційно глибині. А частинки рідини легко зсуваються одна відносно одної й передають цей тиск в усі боки однаково (закон Паскаля): плівка, повернута вбік, відчуває той самий тиск.'
          : 'A liquid is heavy: each layer presses on the layers below with the weight of all that is above it. At a depth h each square metre carries a column of liquid h high with a mass ρ·h, that is, a weight ρ·g·h — so the pressure grows exactly in proportion to the depth. And the bits of a liquid slide past each other easily and pass that pressure on in all directions alike (Pascal’s law): the film turned sideways feels the same pressure.',
      ),
      say: both((l) => (correct === 'proportional' ? (l === 'uk' ? 'Удвічі глибше — удвічі більший тиск!' : 'Twice as deep — twice the pressure!') : l === 'uk' ? 'Подивімося на манометр.' : 'Let us look at the manometer.')),
      text: both((l) =>
        l === 'uk'
          ? `${list(l)}. Тиск, який показує манометр (p = ρ_води·g·Δh), зростав пропорційно глибині: p / h скрізь ≈ ${sig(mean, 3, l)} Па/м. Звідси й густина рідини ρ = p / (g·h) ≈ ${sig(rho, 3, l)} кг/м³ (у таблиці — ${sig(table, 3, l)} кг/м³).${side ? ` Плівка, повернута вбік на ${cm(side.h, l)}, дала ті самі Δh = ${cm(side.dh, l)}: на одній глибині тиск однаковий в усі боки.` : ''}`
          : `${list(l)}. The pressure the manometer shows (p = ρ_water·g·Δh) grew in proportion to the depth: p / h ≈ ${sig(mean, 3, l)} Pa/m everywhere. From it the liquid’s density ρ = p / (g·h) ≈ ${sig(rho, 3, l)} kg/m³ (the table gives ${sig(table, 3, l)} kg/m³).${side ? ` The film turned sideways at ${cm(side.h, l)} gave the same Δh = ${cm(side.dh, l)}: at one depth the pressure is the same in all directions.` : ''}`,
      ),
    };
  },
  'diode-black-box': (run) => {
    const rows = (run.readings ?? []).filter((x) => x.command.type === 'lab.box' && x.record.value !== null).map((x) => ({ U: Number(x.command['source']), back: !!x.command['reversed'], I: x.record.value!, div: x.record.inputs?.['division'] ?? 0.0001 }));
    const there = rows.filter((x) => !x.back);
    const back = rows.filter((x) => x.back);
    // Lets the current through only one way: some current one way, none (below a division) the other — a diode.
    const flows = (list: typeof rows) => list.length > 0 && list.some((x) => x.I >= x.div);
    const oneWay = flows(there) !== flows(back);
    const twoWays = flows(there) && flows(back);
    const correct = !rows.length ? undefined : oneWay ? 'diode' : twoWays ? 'resistor' : 'open';
    const mA = (x: number, l: Locale) => `${(x * 1000).toFixed(1).replace('.', l === 'uk' ? ',' : '.')} ${l === 'uk' ? 'мА' : 'mA'}`;
    const Om = (x: number, l: Locale) => `${sig(x, 2, l)} ${l === 'uk' ? 'Ом' : 'Ω'}`;
    // How much more current at the highest voltage than at the lowest, the way it flows (a resistor: as much as the voltage).
    const fwd = (flows(there) ? there : back).filter((x) => x.I >= x.div);
    const lo = fwd[0];
    const hi = fwd[fwd.length - 1];
    const ratio = lo && hi && lo !== hi ? hi.I / lo.I : 0;
    const times = lo && hi && lo !== hi ? hi.U / lo.U : 0;
    const list = (xs: typeof rows, l: Locale) => xs.map((x) => `${x.U} ${l === 'uk' ? 'В' : 'V'} — ${mA(x.I, l)}${x.I >= x.div ? ` (R ≈ ${Om(x.U / x.I, l)})` : ''}`).join(', ');
    return {
      ...(correct ? { correct } : {}),
      why: both((l) =>
        l === 'uk'
          ? 'Діод — кристал напівпровідника, дві частини якого проводять по-різному: в одній струм несуть електрони, в іншій — «дірки» (місця, де електрона бракує). На межі між ними утворюється тонкий шар без вільних зарядів. Під’єднаний одним боком, діод цей шар звужує — заряди проходять, опір малий; іншим боком — розширює, і струму майже немає. Резистор так не вміє: йому байдуже, куди тече струм.'
          : 'A diode is a crystal of a semiconductor whose two parts conduct differently: in one the current is carried by electrons, in the other by “holes” (places where an electron is missing). At the boundary a thin layer forms with no free charges. Connected one way, the diode narrows that layer — charges get through, the resistance is small; the other way it widens it, and there is next to no current. A resistor cannot do that: it does not care which way the current goes.',
      ),
      say: both((l) => (correct === 'diode' ? (l === 'uk' ? 'В один бік струм іде, в інший — ні: там діод!' : 'One way the current flows, the other way not: it is a diode!') : l === 'uk' ? 'Подивімося, що показали прилади.' : 'Let us look at what the instruments showed.')),
      text: both((l) =>
        l === 'uk'
          ? `Скринька як стоїть: ${list(there, l)}. Перевернута: ${list(back, l)}. В один бік опір кола невеликий і ще й зменшується з напругою (з ${hi?.U ?? 0} В струм більший не в ${sig(times, 2, l)} раза, а в ${sig(ratio, 2, l)}, ніж з ${lo?.U ?? 0} В); в інший — міліамперметр показує нуль: опір величезний. Однаково в обидва боки пропускав би струм резистор, ніде не пропускало б розірване коло. Так поводиться лише напівпровідниковий діод.`
          : `The box as it stands: ${list(there, l)}. Turned round: ${list(back, l)}. One way the circuit’s resistance is small and even falls with the voltage (at ${hi?.U ?? 0} V the current is not ${sig(times, 2, l)} but ${sig(ratio, 2, l)} times that at ${lo?.U ?? 0} V); the other way the milliammeter shows zero: a huge resistance. A resistor would let the current through both ways alike, a broken circuit neither way. Only a semiconductor diode behaves so.`,
      ),
    };
  },
  'resistance-temperature': (run) => {
    const rows = (run.readings ?? []).filter((x) => x.command.type === 'lab.ohm' && x.record.value !== null).map((x) => ({ R: x.record.value!, t: x.record.inputs?.['temperature'] ?? 20, div: x.record.inputs?.['division'] ?? 0.01 }));
    const first = rows[0];
    const last = rows[rows.length - 1];
    const ok = !!first && !!last && last !== first && last.t > first.t + 1;
    // α from the first and the last reading: by what share the resistance grew per degree.
    const alpha = ok ? (last!.R - first!.R) / (first!.R * (last!.t - first!.t)) : 0;
    const table = COMPONENTS.copper.electrical?.temperatureCoefficient?.value ?? 0.00393;
    const grew = ok && last!.R - first!.R > 2 * first!.div;
    const fell = ok && first!.R - last!.R > 2 * first!.div;
    const Om = (x: number, l: Locale) => formatMeasured('resistance', x, first?.div ?? 0.01, l);
    const deg = (x: number, l: Locale) => `${sig(x, 3, l)} °C`;
    const a = (x: number, l: Locale) => sig(x, 2, l);
    return {
      ...(ok ? { correct: grew ? 'grows' : fell ? 'falls' : 'same' } : {}),
      why: both((l) =>
        l === 'uk'
          ? 'Струм у металі — це впорядкований рух вільних електронів крізь кристалічну ґратку з йонів. Електрони раз у раз натикаються на йони й віддають їм енергію — це і є опір. Нагріваючись, йони коливаються дедалі сильніше й частіше заступають електронам дорогу, тож опір зростає. Біля кімнатної температури — майже рівномірно: на кожен градус на ту саму частку α, для міді ≈ 0,4 % на градус.'
          : 'A current in a metal is the ordered motion of free electrons through a crystal lattice of ions. The electrons keep bumping into the ions and giving them energy — that is the resistance. As the metal warms, the ions vibrate harder and get in the electrons’ way more often, so the resistance grows. Near room temperature almost evenly: by the same share α per degree, for copper ≈ 0.4 % per degree.',
      ),
      say: both((l) => (l === 'uk' ? `Нагріли на ${deg(ok ? last!.t - first!.t : 0, l)} — опір зріс: α ≈ ${a(alpha, l)} на градус!` : `Warmed by ${deg(ok ? last!.t - first!.t : 0, l)} — the resistance grew: α ≈ ${a(alpha, l)} per degree!`)),
      text: both((l) => {
        const list = rows.map((x) => `${deg(x.t, l)}: R = ${Om(x.R, l)}`).join('; ');
        return l === 'uk'
          ? `${list}. Що гарячіша вода (а з нею й мідний дріт), то більший опір котушки. Температурний коефіцієнт опору α = (R − R₀) / (R₀·Δt) = (${Om(last?.R ?? 0, l)} − ${Om(first?.R ?? 0, l)}) / (${Om(first?.R ?? 0, l)} · ${deg(ok ? last!.t - first!.t : 0, l)}) ≈ ${a(alpha, l)} 1/°C, а в таблиці для міді — ${a(table, l)} 1/°C: на кожен градус опір зростає приблизно на ${sig(alpha * 100, 2, l)} %. Так само, тільки набагато сильніше, росте опір розжареної нитки лампи.`
          : `${list}. The hotter the water (and the copper wire in it), the larger the coil’s resistance. The temperature coefficient of resistance α = (R − R₀) / (R₀·Δt) = (${Om(last?.R ?? 0, l)} − ${Om(first?.R ?? 0, l)}) / (${Om(first?.R ?? 0, l)} · ${deg(ok ? last!.t - first!.t : 0, l)}) ≈ ${a(alpha, l)} 1/°C, and the table gives ${a(table, l)} 1/°C for copper: the resistance grows by about ${sig(alpha * 100, 2, l)} % per degree. A glowing lamp filament does the same, only much more.`;
      }),
    };
  },
  'electrochemical-equivalent': (run) => {
    const c = (run.readings ?? []).filter((x) => x.command.type === 'lab.cathode' && x.record.value !== null).map((x) => x.record);
    const [before, after] = [c[0], c[c.length - 1]];
    const ok = !!before && !!after && after !== before;
    const dm = ok ? after!.value! - before!.value! : 0;
    const q = after?.inputs?.['charge'] ?? 0;
    const t = after?.inputs?.['time'] ?? 0;
    const k = q > 0 ? dm / q : 0;
    // The table's: one copper atom per two electrons, k = M / (z·F).
    const table = (molarMassOf(COMPONENTS.copper) ?? 0.06355) / (2 * FARADAY);
    const mgC = (x: number, l: Locale) => `${sig(x * 1e6, 3, l)} ${l === 'uk' ? 'мг/Кл' : 'mg/C'}`;
    const g = (x: number, l: Locale) => formatMeasured('mass', x, 0.00001, l);
    return {
      ...(ok && q > 0 ? { correct: Math.abs(k - table) / table < 0.05 ? 'table' : k > table ? 'more' : 'less' } : {}),
      why: both((l) => (l === 'uk' ? "Струм у розчині — це рух йонів. Кожен йон міді Cu²⁺, що доходить до катода, забирає з нього два електрони й стає атомом міді, що лишається на пластині. Отже, скільки заряду пройшло через розчин, стільки атомів і осіло: маса пропорційна заряду, m = k·q = k·I·t. Коефіцієнт k залежить лише від речовини — від маси її моля M і заряду йона z: k = M/(z·F), де F — заряд моля електронів. А анод із міді розчиняється: кожен його атом віддає два електрони й іде в розчин йоном — тому розчин не біднішає на мідь." : "A current in a solution is ions moving. Each copper ion Cu²⁺ that reaches the cathode takes two electrons from it and becomes a copper atom that stays on the plate. So as much charge as has passed, so many atoms have settled: the mass is proportional to the charge, m = k·q = k·I·t. The coefficient k depends only on the substance — on its molar mass M and the ion’s charge z: k = M/(z·F), F being the charge of a mole of electrons. And the copper anode dissolves: each of its atoms gives up two electrons and goes into the solution as an ion — so the solution does not run short of copper.")),
      say: both((l) => (l === 'uk' ? `k ≈ ${mgC(k, l)} — кожен кулон кладе на катод стільки міді!` : `k ≈ ${mgC(k, l)} — each coulomb puts this much copper on the cathode!`)),
      text: both((l) =>
        l === 'uk'
          ? `Катод важив m₁ = ${ok ? g(before!.value!, l) : '—'}, після досліду — m₂ = ${ok ? g(after!.value!, l) : '—'}: на ньому осіло Δm = ${g(dm, l)} міді. Струм I ≈ ${sig(t > 0 ? q / t : 0, 2, l)} А ішов ${D(t, l)}, тож пройшов заряд I·t ≈ ${sig(q, 3, l)} Кл. k = Δm / (I·t) ≈ ${mgC(k, l)}; у таблиці для міді — ${mgC(table, l)}. Це закон Фарадея: кожен йон міді Cu²⁺ забирає на катоді два електрони, тож k = M / (2·F), де F ≈ 96 485 Кл/моль. Мідний анод тим часом розчиняється — стільки ж міді переходить у розчин, скільки осідає на катоді. Терези показують соті частки грама, тому що більший заряд, то точніший k.`
          : `The cathode weighed m₁ = ${ok ? g(before!.value!, l) : '—'}, after the experiment m₂ = ${ok ? g(after!.value!, l) : '—'}: Δm = ${g(dm, l)} of copper settled on it. A current of I ≈ ${sig(t > 0 ? q / t : 0, 2, l)} A flowed for ${D(t, l)}, so a charge I·t ≈ ${sig(q, 3, l)} C passed. k = Δm / (I·t) ≈ ${mgC(k, l)}; the table gives ${mgC(table, l)} for copper. This is Faraday’s law: each Cu²⁺ ion takes two electrons at the cathode, so k = M / (2·F), F ≈ 96 485 C/mol. The copper anode meanwhile dissolves — as much copper goes into the solution as settles on the cathode. The balance reads hundredths of a gram, so the more charge, the more precise k.`,
      ),
    };
  },
  'floating-conditions': (run) => {
    // Three runs: m₁ (cylinder with water), the tube in, m₂ — so its mass; its volume from the level in run 1 (it lay on the bottom, all under water).
    const m = of(run, 'mass').map((x) => x.record.value ?? 0);
    const v = of(run, 'volume').map((x) => x.record);
    const masses = [0, 1, 2].map((k) => (m[2 * k + 1] ?? 0) - (m[2 * k] ?? 0));
    const div = v[1]?.inputs?.['division'] ?? 1e-6;
    const vol = v.length >= 2 ? v[1]!.value! - v[0]!.value! : 0;
    const rho = masses.map((x) => (vol > 0 ? x / vol : 0));
    // Within what the cylinder tells (half a division of its volume) — the density of water; above it, it sinks; below, it comes up.
    const err = WATER * (div / 2 / Math.max(vol, div));
    const kind = (r: number) => (r > WATER + err ? 'sinks' : r < WATER - err ? 'up' : 'inside');
    const kinds = rho.map(kind);
    const fits = kinds[0] === 'sinks' && kinds[1] === 'inside' && kinds[2] === 'up';
    const gcm = (r: number, l: Locale) => `${sig(r / 1000, 3, l)} ${l === 'uk' ? 'г/см³' : 'g/cm³'}`;
    const word = { sinks: { uk: 'потонула', en: 'sank' }, inside: { uk: 'плавала всередині води', en: 'floated inside the water' }, up: { uk: 'спливла', en: 'came up' } } as const;
    const cmp = { sinks: '>', inside: '≈', up: '<' } as const;
    return {
      why: both((l) => (l === 'uk' ? "На тіло під водою діють дві сили: сила тяжіння m·g = ρ_тіла·V·g тягне вниз, архімедова сила ρ_води·V·g штовхає вгору. Обидві пропорційні тому самому об’єму V, тож порівнюються лише густини. Більша густина тіла — переважає тяжіння, і тіло тоне. Рівні густини — сили рівні, і тіло лишається там, де його відпустили. Менша — переважає архімедова сила, і тіло спливає, поки над водою не вийде стільки, що занурена частина витіснятиме воду якраз його маси. Тому важкий корабель зі сталі плаває: він порожній усередині, і його середня густина менша за густину води." : "Two forces act on a body under water: gravity m·g = ρ_body·V·g pulls down, the buoyant force ρ_water·V·g pushes up. Both are proportional to the same volume V, so only the densities are compared. A denser body — gravity wins, and it sinks. Equal densities — the forces balance, and it stays where it was let go. Less dense — the buoyant force wins, and the body comes up until so much is out of the water that the part under it pushes aside just its own mass of water. That is why a heavy steel ship floats: it is hollow, and its mean density is less than water’s.")),
      say: both((l) => (l === 'uk' ? 'Тоне чи плаває — вирішує густина!' : 'Sinking or floating — the density decides!')),
      text: both((l) => {
        const runs = [0, 1, 2].map((k) => `${l === 'uk' ? `${k + 1}) m = ${g(masses[k]!, l)}, ρ = m / V ≈ ${gcm(rho[k]!, l)} ${cmp[kinds[k]!]} ρ води — пробірка ${word[kinds[k]!].uk}` : `${k + 1}) m = ${g(masses[k]!, l)}, ρ = m / V ≈ ${gcm(rho[k]!, l)} ${cmp[kinds[k]!]} ρ of water — the tube ${word[kinds[k]!].en}`}`).join('; ');
        return l === 'uk'
          ? `Об’єм пробірки — з першого досліду, коли вона лежала на дні: V = ${mL(vol, l)}. Відсипаючи пісок, ми змінювали масу, а об’єм лишався тим самим: ${runs}. Тіло тоне, коли його густина більша за густину рідини, плаває всередині — коли рівна, спливає — коли менша: тоді архімедова сила, що діє на все тіло під водою, більша за силу тяжіння. Спливла пробірка занурена лише частково: рівно настільки, щоб витіснити воду своєї маси. Тому в третьому досліді мензурка не дала б об’єму всієї пробірки.`
          : `The tube’s volume is from run 1, when it lay on the bottom: V = ${mL(vol, l)}. Pouring sand out changed the mass, the volume stayed: ${runs}. A body sinks when its density is greater than the liquid’s, floats inside when equal, comes up when less: then the buoyant force on the whole body under water is greater than gravity. The tube that came up is only partly under water — just enough to push aside its own mass of water. So in run 3 the cylinder would not give the volume of the whole tube.`;
      }),
      ...(m.length >= 6 && vol > 0 ? { correct: fits ? 'density' : kinds[0] === 'sinks' ? 'mass' : 'volume' } : {}),
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
      why: both((l) => (l === 'uk' ? "Густина — властивість речовини, а не шматка: будь-який шматок міді, великий чи малий, має 8,9 г/см³, бо вона залежить від того, які важкі атоми речовини і як щільно вони складені. Тому за густиною речовину можна впізнати. Об’єм тіла неправильної форми мензурка дає тому, що занурене тіло витісняє рівно свій об’єм води — на стільки й піднімається рівень." : "Density belongs to a substance, not to a piece: any piece of copper, large or small, has 8.9 g/cm³, since it depends on how heavy the substance’s atoms are and how closely they are packed. So a substance can be recognised by its density. The cylinder gives the volume of an odd-shaped body because a body under water pushes aside exactly its own volume of water — that is how far the level rises.")),
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
      why: both((l) => (l === 'uk' ? "Щоб почали рости кристали, частинкам треба десь почати складатися в правильну ґратку. У чистому розчині, що охолонув спокійно, такого «зачину» немає, і зайва речовина лишається розчиненою — розчин пересичений. Крихітний кристалик дає готову ґратку, і частинки починають прилаштовуватися до неї одна за одною — кристалізація біжить по всьому розчину. При цьому виділяється та теплота, яку розчин забрав, коли речовина розчинялася, — тому розчин нагрівається. Так працюють грілки з натрій ацетатом." : "For crystals to grow, the particles need somewhere to start lining up into a regular lattice. In a clean solution cooled quietly there is no such start, and the extra substance stays dissolved — the solution is supersaturated. A tiny crystal gives a ready lattice, and the particles begin to fit onto it one by one — crystallising runs through the whole solution. It gives off the heat the solution took when the substance dissolved — so the solution warms up. That is how sodium acetate hand warmers work.")),
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
      why: both((l) => (l === 'uk' ? "Розчинення — це два процеси. Щоб розібрати кристал на йони, треба витратити енергію. Коли йони оточують молекули води (гідратація), енергія, навпаки, виділяється. Що переважить — від речовини залежить: в амоній хлориду більше йде на руйнування кристала, тому розчин охолоджується; у натрій гідроксиду гідратація дає більше, тому розчин нагрівається." : "Dissolving is two processes. Taking a crystal apart into ions takes energy. When water molecules gather round the ions (hydration), energy is given off. Which wins depends on the substance: for ammonium chloride more goes into breaking the crystal, so the solution cools; for sodium hydroxide hydration gives more, so the solution warms.")),
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
    // How hot it was heated (the first step's target).
    const hotT = first.params.target ?? 60;
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
      why: both((l) => (l === 'uk' ? "Розчинність мідного купоросу росте з температурою: у гарячій воді його розчиняється більше. Коли розчин охолоджується, вода вже не може втримати стільки — і зайве виходить кристалами. Скільки саме — різниця розчинностей при двох температурах, помножена на масу води. Що повільніше охолоджувати, то більші й правильніші виростають кристали." : "Copper sulfate dissolves better in hot water: its solubility grows with temperature. As the solution cools, the water can no longer hold that much — and the excess comes out as crystals. How much — the difference of the solubilities at the two temperatures times the mass of water. The slower the cooling, the bigger and more regular the crystals grow.")),
      say: both((l) => (l === 'uk' ? `Випало ≈ ${sig(cold.crystals * 1000, 3, l)} г кристалів!` : `≈ ${sig(cold.crystals * 1000, 3, l)} g of crystals came out!`)),
      text: both((l) =>
        l === 'uk'
          ? `При 20 °C 100 г води розчиняє лише ≈ ${sig(s(20), 3, l)} г мідного купоросу, тому спочатку на дні лишилося ${g3(start.crystals, l)}. При ${sig(hotT, 3, l)} °C розчинність ≈ ${sig(s(hotT), 3, l)} г — і ${hot.crystals < 1e-4 ? 'весь купорос розчинився' : `на дні лишилося ${g3(hot.crystals, l)}`}. Коли розчин охолоняв, приблизно від ${sig(t0, 2, l)} °C він став насиченим, і зайвий купорос почав виходити кристалами. При 20 °C у розчині знову ≈ ${g3(cold.mass - cold.crystals, l)}, а ${g3(cold.crystals, l)} — сині кристали на дні.${lost > 5e-4 ? ` Кристалів трохи більше, ніж лежало спочатку: під час нагрівання ≈ ${sig(lost * 1000, 2, l)} г води випарувалося, а в меншій кількості води розчиняється менше купоросу.` : ''} Що повільніше охолоджувати, то більші кристали встигають вирости. Насправді й мідний купорос трохи пересичується: кристалам, щоб почати рости, потрібен зародок. Але його решітка проста, розчин рідкий, а пилинки й подряпини на склі правлять за зародки, тож купорос пересичується лише на кілька градусів — а натрій ацетат у грілці лишається рідким тижнями (дослід «Грілка, що спрацьовує від кристалика»). Модель рахує, скільки кристалів випаде, але не їхній розмір і форму, і в ній купорос кристалізується рівно тоді, коли розчин стає насиченим.`
          : `At 20 °C 100 g of water dissolves only ≈ ${sig(s(20), 3, l)} g of copper sulfate, so at first ${g3(start.crystals, l)} stayed on the bottom. At ${sig(hotT, 3, l)} °C the solubility is ≈ ${sig(s(hotT), 3, l)} g — and ${hot.crystals < 1e-4 ? 'all of it dissolved' : `${g3(hot.crystals, l)} stayed on the bottom`}. As the solution cooled, from about ${sig(t0, 2, l)} °C it became saturated, and the excess began to come out as crystals. At 20 °C the solution again holds ≈ ${g3(cold.mass - cold.crystals, l)}, and ${g3(cold.crystals, l)} are blue crystals on the bottom.${lost > 5e-4 ? ` A little more than lay there at first: ≈ ${sig(lost * 1000, 2, l)} g of water evaporated during the heating, and less water dissolves less copper sulfate.` : ''} The slower the cooling, the larger the crystals grow. In fact copper sulfate supersaturates a little too: crystals need a nucleus to start growing. But its lattice is simple, the solution is runny, and dust and scratches on the glass serve as nuclei, so copper sulfate supersaturates by only a few degrees — while sodium acetate in a hand warmer stays liquid for weeks (the experiment “A warmer set off by a crystal”). The model counts how much crystallises, but not the crystals' size or shape, and in it copper sulfate crystallises exactly when the solution becomes saturated.`,
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
      why: both((l) => (l === 'uk' ? "Масова частка — яку частину маси розчину становить розчинена речовина: w = m(солі) / m(розчину). Маса розчину — це вода разом із сіллю, тому 5 г солі в 45 г води — це 5 / 50 = 10 %, а не 5 / 45. Під час розчинення маса не зникає: терези показують суму мас води й солі, хоч сіль уже не видно." : "The mass fraction is the share of the solution’s mass the dissolved substance makes: w = m(salt) / m(solution). The solution is the water and the salt together, so 5 g of salt in 45 g of water is 5 / 50 = 10 %, not 5 / 45. Dissolving does not lose any mass: the scales show the sum of the water’s and the salt’s, though the salt can no longer be seen.")),
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
      why: both((l) => (l === 'uk' ? "Архімедова сила дорівнює вазі рідини в об’ємі тіла: F = ρ_рідини·g·V. Брусок той самий, тож V однаковий, а солона вода густіша за прісну — той самий об’єм її важить більше. Тому й виштовхує вона сильніше. Ось чому в морі плавати легше, ніж у річці, а в дуже солоному Мертвому морі людина лежить на воді." : "The buoyant force equals the weight of the liquid in the body’s volume: F = ρ_liquid·g·V. The block is the same, so V is the same, and salt water is denser than fresh — the same volume of it weighs more. So it pushes up harder. That is why swimming is easier in the sea than in a river, and in the very salty Dead Sea a person lies on the water.")),
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
      why: both((l) => (l === 'uk' ? "Енергія не зникає: скільки теплоти віддала гаряча вода, стільки отримала холодна — c·m₁·(t₁ − θ) = c·m₂·(θ − t₂). Маси однакові й речовина та сама, тож гаряча охолоне на стільки ж градусів, на скільки нагріється холодна: рівновага — посередині. Трохи нижче вийде, бо частина теплоти йде на посуд і в повітря." : "Energy is not lost: as much heat as the hot water gave, the cold water got — c·m₁·(t₁ − θ) = c·m₂·(θ − t₂). The masses are equal and the substance the same, so the hot water cools by as many degrees as the cold warms: the balance is half-way. It comes out a little lower, as part of the heat goes into the vessel and the air.")),
      say: both((l) => (l === 'uk' ? `Рівновага — ${C(real, l)}!` : `Equilibrium at ${C(real, l)}!`)),
      text: both((l) =>
        l === 'uk'
          ? `Щойно воду змішали, суміш мала ${C(ideal, l)} — саме стільки дає рівняння теплового балансу: θ = (m₁t₁ + m₂t₂) / (m₁ + m₂), бо скільки теплоти віддала гаряча вода, стільки отримала холодна. Але за ${D(t, l)} холодний скляний стакан і повітря забрали частину теплоти, і рівновага настала при ${C(real, l)}. Тому справжня суміш завжди трохи холодніша за розрахунок; щоб зменшити втрати, у лабораторії змішують у калориметрі.`
          : `Right after mixing the water was at ${C(ideal, l)} — exactly what the heat balance gives: θ = (m₁t₁ + m₂t₂) / (m₁ + m₂), since the heat the hot water gave is the heat the cold water took. But within ${D(t, l)} the cold glass beaker and the air took some of the heat, and equilibrium came at ${C(real, l)}. That is why a real mixture is always a little colder than the calculation; to cut the losses, labs mix in a calorimeter.`,
      ),
      correct: real < ideal - 0.5 ? 'less' : real > ideal + 0.5 ? 'more' : 'fifty',
    };
  },
  'lever-balance': (run) => {
    const r = (run.readings ?? []).filter((x) => x.command.type === 'lab.balance');
    const at = (what: string) => r.find((x) => x.command['what'] === what)?.record.value ?? null;
    const empty = at('vessel-empty');
    const full = at('vessel');
    const water = empty !== null && full !== null ? full - empty : null;
    const g = (kg: number, l: Locale) => formatMeasured('mass', kg, 0.00001, l);
    const name = (x: (typeof r)[number], l: Locale) => ((x.command['label'] as { uk: string; en: string } | undefined)?.[l] ?? '').toLowerCase();
    return {
      ...(water !== null ? { correct: 'diff' } : {}),
      why: both((l) => (l === 'uk' ? "Важільні терези — рівноплечий важіль: шальки висять на однакових відстанях від осі. Тому коромисло стоїть рівно, коли однакові сили з обох боків, тобто однакові маси — Земля тягне кожен грам однаково. Терези порівнюють маси, а не ваги: на Місяці вони показали б те саме, бо там і тіло, і важки стали б легшими однаково." : "A lever balance is a lever with equal arms: the pans hang at equal distances from the axis. So the beam is level when the forces on both sides are equal, that is, the masses are — the Earth pulls each gram alike. The balance compares masses, not weights: on the Moon it would show the same, as the body and the weights would both get lighter alike.")),
      say: both((l) => (water !== null ? (l === 'uk' ? `У склянці ${g(water, l)} води!` : `The glass holds ${g(water, l)} of water!`) : '—')),
      text: both((l) =>
        l === 'uk'
          ? `${r.map((x) => `${name(x, l)}: ${x.record.value !== null ? g(x.record.value, l) : '—'}`).join('; ')}. Масу води знаходимо як різницю двох зважувань: m = m₂ − m₁ = ${water !== null ? g(water, l) : '—'}. Найменший важок у наборі — 10 мг, тож саме з такою точністю зважено кожне тіло. Але точність маси води гірша: у різниці двох зважувань похибки додаються. Тіла кладуть на ліву шальку, важки — на праву, пінцетом, від більших до менших; брудне й вологе на шальки не кладуть, а рідину зважують лише в посудині.`
          : `${r.map((x) => `${name(x, l)}: ${x.record.value !== null ? g(x.record.value, l) : '—'}`).join('; ')}. The water’s mass is the difference of two weighings: m = m₂ − m₁ = ${water !== null ? g(water, l) : '—'}. The smallest weight of the set is 10 mg, so that is how precisely each body was weighed. The water’s mass is less precise: in a difference of two weighings the errors add up. Loads go on the left pan, weights on the right, with tweezers, from larger to smaller; nothing dirty or wet goes on the pans, and a liquid is weighed only in a vessel.`,
      ),
    };
  },
  'liquid-density': (run) => {
    const r = run.readings ?? [];
    const empty = r.find((x) => x.command.type === 'lab.balance' && x.command['what'] === 'vessel-empty')?.record.value ?? null;
    const full = r.find((x) => x.command.type === 'lab.balance' && x.command['what'] === 'vessel')?.record.value ?? null;
    const V = r.find((x) => x.record.quantity === 'volume')?.record.value ?? null;
    const m = empty !== null && full !== null ? full - empty : null;
    const rho = m !== null && V ? m / V : null;
    const correct = rho === null ? undefined : rho < WATER * 0.97 ? 'lighter' : rho > WATER * 1.03 ? 'heavier' : 'same';
    // The liquid of this run, and its density in the tables.
    const liquid = SUBSTANCES[run.steps[0]!.params.substance];
    const table = liquid.liquid.density.value;
    const name = (l: Locale) => liquid.name[l];
    const g = (kg: number, l: Locale) => formatMeasured('mass', kg, 0.00001, l);
    const cmp = (l: Locale) => (correct === 'lighter' ? (l === 'uk' ? 'легша за воду' : 'lighter than water') : correct === 'heavier' ? (l === 'uk' ? 'важча за воду' : 'heavier than water') : l === 'uk' ? 'майже як вода' : 'about as dense as water');
    return {
      ...(correct ? { correct } : {}),
      why: both((l) => (l === 'uk' ? "Густина — маса в одиниці об’єму: ρ = m/V. Масу рідини дають два зважування — маса мензурки при цьому скорочується (m = m₂ − m₁), об’єм — поділки. Різні рідини вміщують у тому самому об’ємі різну масу: частинки олії чи спирту легші й упаковані вільніше, ніж у воді, гліцерину — щільніше. Рідина, легша за воду, на ній плаває: олія збирається зверху." : "Density is the mass per unit volume: ρ = m/V. Two weighings give the liquid’s mass — the cylinder’s own mass cancels (m = m₂ − m₁) — and the marks give the volume. Different liquids pack a different mass into the same volume: the particles of oil or alcohol are lighter and packed more loosely than water’s, glycerol’s more tightly. A liquid lighter than water floats on it: oil gathers on top.")),
      say: both((l) => (rho !== null ? `ρ ≈ ${sig(rho, 3, l)} ${l === 'uk' ? 'кг/м³' : 'kg/m³'} — ${cmp(l)}!` : '—')),
      text: both((l) =>
        rho === null
          ? '—'
          : l === 'uk'
            ? `Маса рідини — різниця зважувань: m = ${g(full!, l)} − ${g(empty!, l)} = ${g(m!, l)}. Об’єм — за поділками мензурки: V = ${sig(V! * 1e6, 3, l)} см³. Густина ρ = m/V ≈ ${sig(rho / 1000, 3, l)} г/см³ = ${sig(rho, 3, l)} кг/м³ (${name(l).toLowerCase()} — ${cmp(l)}, у води ${sig(WATER, 3, l)} кг/м³). У таблиці — ${sig(table, 3, l)} кг/м³. Найменш точне тут — об’єм: мензурка показує його лише з точністю до поділки. Рідина, легша за воду і нерозчинна в ній, плаває на воді шаром; важча — опускається на дно.`
            : `The liquid’s mass is the difference of the weighings: m = ${g(full!, l)} − ${g(empty!, l)} = ${g(m!, l)}. Its volume comes from the cylinder’s marks: V = ${sig(V! * 1e6, 3, l)} cm³. The density ρ = m/V ≈ ${sig(rho / 1000, 3, l)} g/cm³ = ${sig(rho, 3, l)} kg/m³ (${name(l).toLowerCase()} is ${cmp(l)}; water has ${sig(WATER, 3, l)} kg/m³). The table gives ${sig(table, 3, l)} kg/m³. The least precise thing here is the volume: the cylinder shows it only to a division. A liquid lighter than water that does not mix with it floats on it as a layer; a heavier one sinks.`,
      ),
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
      why: both((l) => (l === 'uk' ? "Пружина розтягується, бо трохи віддаляються одна від одної частинки її металу, а сили між ними тягнуть їх назад. При малих зміщеннях ці сили ростуть пропорційно зміщенню — так у кожному витку, тож і вся пружина подовжується пропорційно силі: удвічі більший вантаж — удвічі більше видовження. Відношення F/x — жорсткість — залежить від пружини: товщини дроту, діаметра й числа витків. Так буває, поки деформація пружна: розтягнута надто сильно пружина вже не повернеться до своєї довжини — там закон Гука не діє." : "A spring stretches because the particles of its metal move a little apart, and the forces between them pull them back. For small shifts these forces grow in proportion to the shift — in every coil, so the whole spring lengthens in proportion to the force: twice the load, twice the extension. The ratio F/x — the stiffness — depends on the spring: the wire’s thickness, the diameter and the number of coils. This holds while the deformation is elastic: a spring stretched too far does not return to its length — Hooke’s law does not hold there.")),
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
      why: both((l) => (l === 'uk' ? "Навіть гладкі на вигляд поверхні торкаються лише горбиками. Що сильніше брусок притиснутий до дошки, то більше горбиків змикається й зачіпається — справжня площа дотику, а з нею й сила тертя, росте пропорційно силі тиску. Тому відношення F/N лишається сталим для пари матеріалів — це коефіцієнт тертя: він залежить від того, з чого поверхні й як оброблені, але не від ваги бруска." : "Even surfaces that look smooth touch only at their bumps. The harder the block is pressed to the board, the more bumps meet and catch — the real area of contact, and with it the friction, grows in proportion to the pressing force. So the ratio F/N stays the same for a pair of materials — the coefficient of friction: it depends on what the surfaces are and how they are finished, not on the block’s weight.")),
      say: both((l) => (l === 'uk' ? `μ ≈ ${sig(mean, 2, l)} — для дерева по дереву!` : `μ ≈ ${sig(mean, 2, l)} — for wood on wood!`)),
      text: both((l) =>
        l === 'uk'
          ? `Брусок важить ${P !== null ? N1(P, l) : '≈ 1,4 Н'}; на горизонтальній дошці сила нормальної реакції N дорівнює вазі бруска з тягарцями. ${rows.map((x) => `N = ${sig(x.N, 2, l)} Н → F = ${N1(x.F, l)}, μ ≈ ${sig(x.F / x.N, 2, l)}`).join('; ')}. Сила тертя росте разом із навантаженням, а їхнє відношення — коефіцієнт тертя — лишається майже тим самим: μ ≈ ${sig(mean, 2, l)}. У таблиці підручника для дерева по дереву — 0,25. Розкид — бо динамометр показує лише десяті частки ньютона, а тягнути рівномірно непросто. Коефіцієнт тертя залежить від матеріалів і того, як оброблені поверхні, але не від ваги бруска.`
          : `The block weighs ${P !== null ? N1(P, l) : '≈ 1.4 N'}; on a level board the normal force N equals the weight of the block with its weights. ${rows.map((x) => `N = ${sig(x.N, 2, l)} N → F = ${N1(x.F, l)}, μ ≈ ${sig(x.F / x.N, 2, l)}`).join('; ')}. The friction grows with the load, while their ratio — the coefficient of friction — stays about the same: μ ≈ ${sig(mean, 2, l)}. The textbook’s table gives 0.25 for wood on wood. The spread is there because the dynamometer reads only tenths of a newton, and pulling steadily is not easy. The coefficient depends on the materials and how the surfaces are finished, not on the block’s weight.`,
      ),
    };
  },
  'friction-factors': (run) => {
    const pulls = (run.readings ?? []).filter((x) => x.command.type === 'lab.pull' && x.record.value !== null);
    const at = (f: (c: Record<string, unknown>) => boolean) => pulls.find((x) => f(x.command as Record<string, unknown>))?.record ?? null;
    const wide = at((c) => c['weights'] === 1 && c['face'] !== 'narrow' && c['surface'] !== 'paper');
    const narrow = at((c) => c['face'] === 'narrow');
    const paper = at((c) => c['surface'] === 'paper');
    const heavy = at((c) => Number(c['weights']) === 3);
    const correct = wide && narrow ? (Math.abs(narrow.value! - wide.value!) < 0.05 ? 'same' : narrow.value! < wide.value! ? 'less' : 'more') : undefined;
    const N1 = (x: { value: number | null } | null, l: Locale) => (x ? formatMeasured('force', x.value!, 0.1, l) : '—');
    const Nof = (x: { inputs?: Record<string, number> } | null) => x?.inputs?.['N'] ?? 0;
    return {
      ...(correct ? { correct } : {}),
      why: both((l) =>
        l === 'uk'
          ? 'Здається, що на вужчій грані тягти легше: менша площа — менше тертя. Так думає більшість. Але площа грані — ще не площа дотику. Навіть гладкі на вигляд поверхні торкаються лише верхівками горбиків, і справжня площа дотику — дуже мала частка площі грані. На широкій грані вага бруска розподіляється на багато горбиків, і кожен притиснутий слабко. На вужчій горбиків менше, зате кожен притиснутий сильніше й зминається глибше. Справжня площа дотику виходить приблизно однаковою: її задає не розмір грані, а те, з якою силою брусок притиснутий до дошки. Вага не змінилася — тож і тертя те саме. Інша річ — матеріали: папір інакше зчіплюється з деревом, ніж дерево з деревом. А тягарці притискають брусок сильніше — горбики зминаються більше, і тертя росте пропорційно силі тиску.\n\nВажливо: усе це — про тверді тіла (дерево, метал, пластик, скло). Для липких і м’яких матеріалів правило не діє: скотч тримається, навіть коли його ніщо не притискає, і що ширша смужка, то міцніше він тримає — тут площа дотику важлива. Тому в гоночних драгстерів широкі липкі шини. Та й для твердих тіл закон наближений: сила тертя росте з навантаженням не строго пропорційно.'
          : 'It seems easier to pull the block on its narrower face: less area, less friction. Most people think so. But the area of a face is not yet the area of contact. Even surfaces that look smooth touch only at the tips of their bumps, and the real area of contact is a very small fraction of the face. On the wide face the block’s weight is shared among many bumps, each pressed lightly. On the narrower face there are fewer bumps, but each is pressed harder and squashed deeper. The real area of contact comes out about the same: it is set not by the size of the face but by how hard the block is pressed to the board. The weight has not changed — so neither has the friction. The materials are another matter: paper catches on wood differently from wood on wood. And the weights press the block harder — the bumps are squashed more, and the friction grows in proportion to the pressing force.\n\nMind: all this is about solid bodies (wood, metal, plastic, glass). For sticky and soft materials the rule fails: adhesive tape holds even when nothing presses it, and the wider the strip, the better it holds — here the area of contact matters. That is why drag racers have wide, sticky tyres. And even for solid bodies the law is approximate: friction grows with the load not strictly in proportion.',
      ),
      say: both((l) => (l === 'uk' ? 'Для твердих тіл площа ролі не грає — важливі матеріали й сила тиску!' : 'For solid bodies the area does not matter — the materials and the pressing force do!')),
      text: both((l) =>
        l === 'uk'
          ? `Брусок із тягарцем на широкій грані — ${N1(wide, l)}, на вужчій — ${N1(narrow, l)}: площа дотику менша в півтора раза, а сила тертя та сама. По аркушу паперу — ${N1(paper, l)}: інша пара матеріалів, μ = F / N ≈ ${paper ? sig(paper.value! / Nof(paper), 2, l) : '—'} (у таблиці підручника папір по дереву — 0,40, дерево по дереву — 0,25). З трьома тягарцями — ${N1(heavy, l)}: сила тиску зросла з ${sig(Nof(wide), 2, l)} до ${sig(Nof(heavy), 2, l)} Н, у ${sig(Nof(heavy) / Math.max(1e-9, Nof(wide)), 2, l)} раза, і тертя — приблизно у стільки ж. Це закон Амонтона — Кулона: сила тертя ковзання не залежить від площі дотику й пропорційна силі нормальної реакції опори, F = μN, а μ залежить від матеріалів і того, як оброблені поверхні. Уперше це помітив Леонардо да Вінчі (1493), але його записи не опублікували; у 1699 році закон заново відкрив Ґ. Амонтон, а Ш. Кулон перевірив. Закон стосується твердих тіл: для липких і м’яких матеріалів (скотч, гоночні шини) площа дотику на тертя впливає.`
          : `The block with its weight on the wide face — ${N1(wide, l)}, on the narrower one — ${N1(narrow, l)}: one and a half times less area touching, the same friction. Over a sheet of paper — ${N1(paper, l)}: another pair of materials, μ = F / N ≈ ${paper ? sig(paper.value! / Nof(paper), 2, l) : '—'} (the textbook’s table: paper on wood 0.40, wood on wood 0.25). With three weights — ${N1(heavy, l)}: the pressing force grew from ${sig(Nof(wide), 2, l)} to ${sig(Nof(heavy), 2, l)} N, ${sig(Nof(heavy) / Math.max(1e-9, Nof(wide)), 2, l)} times, and the friction about as much. This is the Amontons–Coulomb law: sliding friction does not depend on the area of contact and is proportional to the normal force, F = μN, where μ depends on the materials and how the surfaces are finished. Leonardo da Vinci noticed it first (1493), but his notes were not published; in 1699 G. Amontons discovered the law anew, and C. Coulomb checked it. The law is about solid bodies: for sticky and soft materials (adhesive tape, racing tyres) the area of contact does affect friction.`,
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
      why: both((l) => (l === 'uk' ? "Брусок тисне на стіл тією самою силою, хоч як його поклади, — своєю вагою. Але на меншій грані ця сила припадає на меншу площу, і кожному квадратному сантиметру стола дістається більша її частка: p = F/S. Тому гострий ніж ріже (мала площа — великий тиск), а широкі лижі не провалюються в сніг (велика площа — малий тиск)." : "The block presses on the table with the same force however it lies — its weight. But on a smaller face that force falls on a smaller area, and each square centimetre of the table gets a bigger share of it: p = F/S. That is why a sharp knife cuts (a small area — a large pressure) and wide skis do not sink into snow (a large area — a small pressure).")),
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
      why: both((l) => (l === 'uk' ? "Архімедова сила дорівнює вазі води в об’ємі тіла: F_A = ρ_води·g·V. Отже, з різниці показів динамометра в повітрі й у воді можна знайти об’єм: V = F_A / (ρ_води·g) — без мензурки. Тоді густина тіла ρ = P / (g·V) = ρ_води · P / F_A: у скільки разів вага тіла більша за архімедову силу, у стільки разів тіло густіше за воду." : "The buoyant force equals the weight of water in the body’s volume: F_A = ρ_water·g·V. So the difference of the dynamometer in air and in water gives the volume: V = F_A / (ρ_water·g) — no cylinder needed. Then the body’s density ρ = P / (g·V) = ρ_water · P / F_A: as many times as the weight exceeds the buoyant force, the body is denser than water.")),
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
      why: both((l) => (l === 'uk' ? "Тепла вода віддає теплоту, і вся вона йде на лід: спершу — щоб розтопити його (λ·m), потім — щоб нагріти талу воду до спільної температури. Віддане дорівнює отриманому (тепловий баланс), і з цієї рівності знаходять λ. Саме тому калориметр спершу прогрівають разом із водою: інакше частина теплоти пішла б на нього, і λ вийшла б меншою." : "The warm water gives off heat, and all of it goes into the ice: first to melt it (λ·m), then to warm the meltwater to the common temperature. What is given equals what is taken (the heat balance), and λ is found from that equality. That is why the calorimeter is warmed with the water first: otherwise part of the heat would go into it, and λ would come out smaller.")),
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
      why: both((l) => (l === 'uk' ? "Гарячий метал віддає воді теплоту, поки їхні температури не зрівняються: c_мет·m_мет·(100 − θ) = c_в·m_в·(θ − 20). У металу питома теплоємність мала, тож, охолоджуючись на багато градусів, він віддає небагато теплоти — і вода нагрівається лише трохи. З цієї рівності й знаходять c металу." : "The hot metal gives heat to the water until their temperatures are equal: c_metal·m_metal·(100 − θ) = c_w·m_w·(θ − 20). A metal’s specific heat is small, so cooling by many degrees it gives little heat — and the water warms only a little. The metal’s c is found from that equality.")),
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
      why: both((l) => (l === 'uk' ? "Питома теплоємність — скільки теплоти віддає кілограм, охолоджуючись на 1 °C. У міді вона майже вдвічі з половиною менша, ніж в алюмінію. Брусок тієї самої маси, охолоджуючись від 100 °C, віддасть воді менше теплоти — і вода нагріється слабше. Маса та сама, а «запас тепла» різний: його визначає речовина." : "The specific heat is how much heat a kilogram gives cooling by 1 °C. Copper’s is about two and a half times less than aluminium’s. A block of the same mass cooling from 100 °C gives the water less heat — and the water warms less. The same mass, a different “store of heat”: the substance sets it.")),
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
      why: both((l) => (l === 'uk' ? "Маса — це кількість речовини, а замерзаючи, вода нікуди не дівається: ті самі молекули лише складаються в кристал. Тому лід важить стільки ж, скільки вода (хоч і займає більше місця — він легше за воду й плаває). А кипіння — інша річ: молекули відлітають парою з посудини, і маса того, що лишилося, зменшується." : "Mass is the amount of matter, and freezing water goes nowhere: the same molecules just line up into a crystal. So ice weighs as much as the water (though it takes more room — it is lighter than water and floats). Boiling is another thing: molecules fly off as vapour, and the mass of what is left falls.")),
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
      ...(paper !== undefined ? { correct: t > paper * 1.05 ? 'longer' : t < paper * 0.95 ? 'shorter' : 'paper' } : {}),
      why: both((l) => (l === 'uk' ? "Щоб нагріти воду, треба теплоти Q = c·m·Δt; плита дає її зі швидкістю P (Q = P·t). На папері t = Q / P. Насправді довше: плита спершу гріє сама себе й каструлю, а частина теплоти весь час іде в повітря — і що гарячіша вода, то більше. Тому розрахунок «на папері» завжди оптимістичний." : "Warming the water takes the heat Q = c·m·Δt; the stove gives it at the rate P (Q = P·t). On paper t = Q / P. In fact it takes longer: the stove first heats itself and the pot, and part of the heat keeps going into the air — the hotter the water, the more. So a calculation “on paper” is always optimistic.")),
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
      why: both((l) => (l === 'uk' ? "Найбільше теплоти гаряча вода втрачає з поверхні: пара, що відлітає, забирає з собою приховану теплоту пароутворення — понад 2000 кДж на кілограм. Кришка тримає пару в каструлі: вона осідає краплями й повертає теплоту назад, а тепле повітря не витікає. Більше теплоти лишається воді — і вона закипає швидше." : "Hot water loses most heat from its surface: the vapour flying off carries the latent heat of vaporisation with it — over 2000 kJ a kilogram. A lid keeps the vapour in the pot: it settles in drops and gives the heat back, and the warm air does not escape. More heat stays in the water — and it boils sooner.")),
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
      ...(p > 60 ? { correct: 'stays' } : {}),
      why: both((l) => (l === 'uk' ? "Поки лід тане, уся теплота з кімнати йде не на нагрівання, а на руйнування кристала: щоб відірвати молекули води від ґратки льоду, потрібна енергія — 334 кДж на кожен кілограм (питома теплота плавлення). Температура стоїть на 0 °C, поки не розтане останній шматочок; лише тоді теплота починає нагрівати воду." : "While the ice melts, all the heat from the room goes not into warming but into breaking the crystal: pulling water molecules off the ice lattice takes energy — 334 kJ for every kilogram (the latent heat of fusion). The temperature stands at 0 °C until the last piece melts; only then does the heat start warming the water.")),
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
      why: both((l) => (l === 'uk' ? "Плавлення — руйнування кристалічної ґратки, і на це потрібна енергія. Поки олово плавиться, теплота від спиртівки йде саме на це, а не на нагрівання: температура стоїть на 232 °C — температурі плавлення олова. Коли розплавиться все, теплота знову нагріває вже рідке олово." : "Melting is breaking the crystal lattice, and that takes energy. While the tin melts, the heat from the spirit lamp goes into exactly that, not into warming: the temperature stands at 232 °C — tin’s melting point. When it has all melted, the heat warms the now liquid tin again.")),
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
      why: both((l) => (l === 'uk' ? "Твердіючи, речовина віддає ту саму теплоту, що забрала, коли плавилася: молекули складаються в кристал і вивільняють енергію. Поки розплав твердне, ця теплота якраз покриває те, що він віддає повітрю, — і температура стоїть на 69 °C. Коли затвердне все, віддавати вже нічого — і тверда речовина вистигає далі." : "Setting, a substance gives off the same heat it took when it melted: the molecules line up into a crystal and release energy. While the melt sets, that heat just covers what it gives to the air — and the temperature stands at 69 °C. When all of it has set, there is nothing more to give — and the solid cools on.")),
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
    const P = s.params.heater?.rating ?? 500;
    const m = bodyMassOf(s.result.initial);
    const dT = temp(s.result.final) - temp(s.result.initial);
    const c = (P * t) / (m * dT);
    const table = CW;
    const extra = Math.round((c / table - 1) * 100);
    return {
      correct: Math.abs(c - table) / table < 0.01 ? 'table' : c > table ? 'more' : 'less',
      why: both((l) => (l === 'uk' ? "Ми порахували так, ніби вся енергія кип’ятильника P·t дісталася воді. А насправді частина пішла на нагрівання склянки й самого кип’ятильника, частина — у повітря. Тож воді дісталося менше, ніж ми вважали, і, поділивши всю енергію на m·Δt, ми отримали більше за табличне. Щоб вийшло точніше, потрібен калориметр, який тримає теплоту." : "We counted as if all of the heater’s energy P·t went into the water. In fact part went into warming the glass and the heater itself, part into the air. So the water got less than we thought, and dividing all the energy by m·Δt gave more than the table. To come closer one needs a calorimeter that keeps the heat.")),
      say: both((l) => (l === 'uk' ? `Вийшло ≈ ${sig(c, 3, l)} Дж/(кг·°C)!` : `It came out ≈ ${sig(c, 3, l)} J/(kg·°C)!`)),
      text: both((l) =>
        l === 'uk'
          ? `Кип’ятильник за ${D(t, l)} віддав E = P·t = ${sig(P * t / 1000, 3, l)} кДж, вода (${sig(m * 1000, 3, l)} г) нагрілася на ${sig(dT, 3, l)} °C. Тож c = P·t / (m·Δt) ≈ ${sig(c, 3, l)} Дж/(кг·°C) — на ${extra} % більше за табличні ${sig(table, 4, l)}. Чому більше: частина теплоти пішла не у воду, а на нагрівання склянки, кип’ятильника й повітря, а ми порахували так, ніби вся дісталася воді. Що менші втрати, то ближче до таблиці.`
          : `In ${D(t, l)} the heater gave E = P·t = ${sig(P * t / 1000, 3, l)} kJ, and the water (${sig(m * 1000, 3, l)} g) warmed by ${sig(dT, 3, l)} °C. So c = P·t / (m·Δt) ≈ ${sig(c, 3, l)} J/(kg·°C) — ${extra} % more than the table's ${sig(table, 4, l)}. Why more: part of the heat went not into the water but into the glass, the heater and the air, yet we counted it as if all of it went into the water. The smaller the losses, the closer to the table.`,
      ),
    };
  },
  'heater-efficiency': ({ steps }) => {
    const s = steps[0]!;
    const t = reachedAt(s);
    const P = s.params.heater?.rating ?? 500;
    const m = bodyMassOf(s.result.initial);
    const dT = temp(s.result.final) - temp(s.result.initial);
    const Q = CW * m * dT;
    const eta = Q / (P * t);
    const pct = (x: number, l: Locale) => `${sig(x * 100, 2, l)} %`;
    return {
      correct: eta > 0.97 ? 'all' : eta >= 0.5 ? 'most' : 'half',
      why: both((l) => (l === 'uk' ? "Кип’ятильник віддає теплоту тому, чого торкається, — воді. Але вода, теплішаючи, гріє склянку, а склянка й поверхня води віддають теплоту повітрю; та й сам кип’ятильник мусить спершу нагрітися. Що гарячіша вода порівняно з кімнатою, то швидше вона втрачає теплоту, — тому ККД менший, якщо гріти до вищої температури чи довше. Вищий ККД дає посуд, що погано проводить теплоту, з кришкою, і нагрівник, повністю занурений у воду." : "The heater gives its heat to what it touches — the water. But the water, warming up, warms the glass, and the glass and the water’s surface give heat to the air; and the heater itself has to warm up first. The hotter the water against the room, the faster it loses heat — so the efficiency is lower when heating to a higher temperature or for longer. A vessel that conducts heat poorly, a lid and a heater fully under water give a higher efficiency.")),
      say: both((l) => (l === 'uk' ? `ККД ≈ ${pct(eta, l)}!` : `Efficiency ≈ ${pct(eta, l)}!`)),
      text: both((l) =>
        l === 'uk'
          ? `За ${D(t, l)} кип’ятильник витратив E = P·t = ${sig((P * t) / 1000, 3, l)} кДж. Вода (${sig(m * 1000, 3, l)} г) нагрілася на ${sig(dT, 3, l)} °C і отримала Q = c·m·Δt = ${sig(Q / 1000, 3, l)} кДж. ККД η = Q / E ≈ ${pct(eta, l)}. Решта енергії пішла на нагрівання склянки й самого кип’ятильника та в повітря кімнати — подивись «Куди пішла енергія». Що краще нагрівник занурений і що менше посуд віддає теплоти, то вищий ККД.`
          : `In ${D(t, l)} the heater spent E = P·t = ${sig((P * t) / 1000, 3, l)} kJ. The water (${sig(m * 1000, 3, l)} g) warmed by ${sig(dT, 3, l)} °C and got Q = c·m·Δt = ${sig(Q / 1000, 3, l)} kJ. The efficiency η = Q / E ≈ ${pct(eta, l)}. The rest went into warming the glass and the heater itself and into the room’s air — see «Where the energy went». The better the heater is immersed and the less heat the vessel gives away, the higher the efficiency.`,
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
      why: both((l) => (l === 'uk' ? "Тіло нагрівається, поки теплота, що надходить, більша за ту, що воно віддає. Гаряча каструля віддає все більше теплоти повітрю й випромінює, а полум’я під нею гріє не безмежно — і десь на кількох сотнях градусів ці два потоки зрівнюються. Це набагато нижче за 801 °C, тож сіль не розплавиться. У муфельній печі все навколо гаряче (900 °C), тепло нікуди не тікає — і сіль плавиться." : "A body heats up while the heat coming in exceeds what it gives off. A hot pot gives more and more heat to the air and radiates, and the flame under it does not heat without limit — somewhere at a few hundred degrees the two flows even out. That is far below 801 °C, so the salt does not melt. In a muffle furnace everything around is hot (900 °C), the heat has nowhere to go — and the salt melts.")),
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
      why: both((l) => (l === 'uk' ? "Щоб охолодити кілограм води з 20 до 0 °C, у неї треба забрати c·Δt ≈ 4,2 · 20 ≈ 84 кДж. А щоб потім перетворити його на лід — 334 кДж (питома теплота плавлення), учетверо більше. Морозилка забирає теплоту приблизно рівномірно, тож замерзання триває в рази довше за охолодження." : "Cooling a kilogram of water from 20 to 0 °C takes c·Δt ≈ 4.2 · 20 ≈ 84 kJ out of it. Turning it into ice then takes 334 kJ (the latent heat of fusion), four times more. The freezer takes heat out at about the same rate, so the freezing lasts several times longer than the cooling.")),
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
      why: both((l) => (l === 'uk' ? "Щоб вода замерзла, її молекули мають скластися в кристал льоду. Розчинені йони солі їм заважають: молекули води тримаються біля йонів, і щоб усе ж утворився лід, треба охолодити сильніше. Тому морська вода замерзає не при 0 °C, а близько −2 °C, а розсіл на дорогах лишається рідким і в мороз — лід під ним тане." : "For water to freeze, its molecules have to line up into an ice crystal. The dissolved salt ions get in the way: water molecules stay round the ions, and for ice to form after all it has to be colder. So sea water freezes not at 0 °C but at about −2 °C, and brine on the roads stays liquid in frost — the ice under it melts.")),
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
      why: both((l) => (l === 'uk' ? "Дві причини, і обидві — на користь спирту. Його питома теплоємність майже вдвічі менша, ніж у води (≈ 2,4 проти 4,2 кДж/(кг·°C)): кожен градус коштує менше теплоти. І кипить він при 78 °C, а не при 100 — нагрівати треба на менше градусів. Тож від того самого нагрівника спирт закипає значно швидше." : "Two reasons, both for the alcohol. Its specific heat is almost half water’s (≈ 2.4 against 4.2 kJ/(kg·°C)): each degree costs less heat. And it boils at 78 °C, not 100 — fewer degrees to go. So on the same heater alcohol boils much sooner.")),
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
      why: both((l) => (l === 'uk' ? "Випаровуються лише молекули води: вони відриваються від поверхні й летять у повітря. Йони солі такого не вміють — вони лишаються в розчині, і той стає все солонішим, поки сіль не почне випадати кристалами. Коли вода випарується вся, на дні лишиться вся сіль. Так добувають сіль із морської води в сонячних басейнах." : "Only water molecules evaporate: they leave the surface and fly into the air. Salt ions cannot do that — they stay in the solution, which gets saltier and saltier until the salt starts coming out as crystals. When all the water has gone, all the salt is left on the bottom. That is how salt is got from sea water in sunny ponds.")),
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
      why: both((l) => (l === 'uk' ? "Струм у рідині — це рух заряджених частинок, йонів. У дистильованій воді їх майже немає, тож струм ледь іде. Сіль, розчиняючись, розпадається на йони Na⁺ і Cl⁻ — з’являються носії заряду, і вода починає проводити. Тому водопровідна й морська вода проводять струм (вони не чисті) — і тому електроприлади біля води небезпечні." : "A current in a liquid is charged particles moving — ions. Distilled water has almost none, so a current hardly flows. Salt, dissolving, falls apart into the ions Na⁺ and Cl⁻ — charge carriers appear, and the water starts to conduct. That is why tap water and sea water conduct (they are not pure) — and why electrical things near water are dangerous.")),
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
      correct: temp(s.result.final) >= 373.15 - 0.5 ? 'boils' : dT < 15 ? 'few' : 'tens',
      why: both((l) => (l === 'uk' ? "Йони, що рухаються під дією напруги, раз у раз штовхаються з молекулами води й передають їм енергію — рідина нагрівається. Скільки теплоти — каже закон Джоуля — Ленца: Q = I²·R·t, тобто вся енергія джерела, що пішла на струм у рідині, перетворюється на теплоту. Що більша напруга, то більший струм — і швидше нагрів." : "Ions driven by the voltage keep bumping into water molecules and passing them energy — the liquid warms. How much heat — Joule–Lenz’s law tells: Q = I²·R·t, that is, all of the source’s energy spent on the current in the liquid becomes heat. The higher the voltage, the larger the current — and the faster the warming.")),
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
      why: both((l) => (l === 'uk' ? "На катоді електрони забирає те, що відновлюється найлегше. Йони міді Cu²⁺ приймають електрони охочіше, ніж вода (їхній потенціал +0,34 В проти від’ємного для водню з води), — тому на катоді осідає мідь, а не водень. На графітовому аноді віддає електрони вода — виділяється кисень. Розчин поступово світлішає: мідь із нього переходить на катод." : "At the cathode the electrons go to whatever is reduced most easily. Copper ions Cu²⁺ take electrons more readily than water does (their potential is +0.34 V against a negative one for hydrogen from water) — so copper settles on the cathode, not hydrogen. At the graphite anode water gives up electrons — oxygen comes off. The solution slowly pales: its copper moves onto the cathode.")),
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
      correct: h2 < 1e-5 ? 'few' : h2 < 1e-4 ? 'tens' : 'hundreds',
      why: both((l) => (l === 'uk' ? "Кожна молекула водню H₂ утворюється, коли два йони водню забирають на катоді по електрону — тобто на кожну молекулу потрібно два електрони. Заряд, що пройшов, q = I·t; поділивши його на заряд моля електронів (F ≈ 96 485 Кл), дістанемо, скільки молів електронів пройшло, а молів водню вдвічі менше. Об’єм газу при кімнатних умовах дає газовий закон." : "Each hydrogen molecule H₂ forms when two hydrogen ions each take an electron at the cathode — so every molecule needs two electrons. The charge passed is q = I·t; divided by the charge of a mole of electrons (F ≈ 96 485 C) it gives the moles of electrons, and the moles of hydrogen are half that. The gas law gives the volume at room conditions.")),
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
      why: both((l) => (l === 'uk' ? "Олія — суміш великих молекул, і щоб вони почали відлітати парою, потрібна дуже висока температура. Раніше, ніж до неї дійде, молекули починають розпадатися від нагрівання — з’являється дим (температура димлення ≈ 230 °C у соняшникової олії). Тому олія не кипить, як вода, а димить — і може спалахнути. Гасити її водою не можна: вода миттєво закипає й розкидає палаючу олію." : "Oil is a mixture of large molecules, and for them to fly off as vapour it would take a very high temperature. Before it gets there, the molecules start breaking down from the heat — smoke appears (sunflower oil’s smoke point ≈ 230 °C). So oil does not boil like water — it smokes, and can catch fire. It must never be put out with water: the water boils at once and throws the burning oil about.")),
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
      why: both((l) => (l === 'uk' ? "Щоб речовина замерзла, її молекули мають скластися в кристал, і для кожної речовини є своя температура, нижче якої це стається. Молекули спирту тримаються одна за одну слабше, ніж молекули води, і кристал спирту утворюється лише при −114 °C. Морозилка дає −18 °C — до цього дуже далеко. Тому спирт заливають у термометри для морозу й у незамерзайки." : "For a substance to freeze, its molecules have to line up into a crystal, and each substance has its own temperature below which that happens. Alcohol’s molecules hold on to each other more weakly than water’s, and alcohol crystallises only at −114 °C. A freezer gives −18 °C — very far off. That is why alcohol fills thermometers for frost and windscreen fluids.")),
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
      why: both((l) => (l === 'uk' ? "Струм у розчині несуть йони, і їм доводиться протискатися між молекулами води. У гарячій воді молекули рухаються швидше, вода стає «рідшою» (менш в’язкою), і йонам легше рухатися — розчин проводить краще. Тому за тієї самої напруги в гарячому розчині струм більший. У металів навпаки: нагрівшись, вони проводять гірше." : "In a solution the current is carried by ions, and they have to push their way between water molecules. In hot water the molecules move faster, the water gets “thinner” (less viscous), and the ions move more easily — the solution conducts better. So at the same voltage the current in a hot solution is larger. Metals are the other way: warmed, they conduct worse.")),
      say: both((l) => (l === 'uk' ? 'Гарячий розчин проводить краще!' : 'A hot solution conducts better!')),
      text: both((l) =>
        l === 'uk'
          ? `У розчині при ≈ ${C(temp(a.result.initial), l)} струм був ${A(i1, l)}, а в гарячому, при ≈ ${C(temp(b.result.initial), l)}, — ${A(i2, l)}: на ${Math.round((i2 / Math.max(i1, 1e-12) - 1) * 100)} % більше при тій самій напрузі. Що гарячіша рідина, то легше в ній рухаються йони — і тим краще вона проводить струм.`
          : `In the solution at ≈ ${C(temp(a.result.initial), l)} the current was ${A(i1, l)}, in the hot one at ≈ ${C(temp(b.result.initial), l)} — ${A(i2, l)}: ${Math.round((i2 / Math.max(i1, 1e-12) - 1) * 100)} % more at the same voltage. The hotter the liquid, the easier its ions move — and the better it conducts.`,
      ),
    };
  },
};

/** The two connections answered alike: the readings at each place, the sum that holds, why. */
function pairAnswer(run: PresetRun, connection: 'series' | 'parallel'): PresetAnswer {
  const at = (where: string) => {
    const rs = (run.readings ?? []).filter((x) => x.command.type === 'lab.pair' && x.command['at'] === where).map((x) => x.record);
    const I = rs.find((x) => x.quantity === 'current')?.value;
    const U = rs.find((x) => x.quantity === 'voltage')?.value;
    return I != null && U != null ? { I, U } : null;
  };
  const [r1, r2, all] = [at('r1'), at('r2'), at('both')];
  const series = connection === 'series';
  const A = (x: number, l: Locale) => formatMeasured('current', x, 0.01, l);
  const V = (x: number, l: Locale) => formatMeasured('voltage', x, 0.1, l);
  // Within the instruments' divisions (two readings rounded each): the sum holds.
  const ok = !!(r1 && r2 && all);
  const sum = ok ? (series ? r1!.U + r2!.U : r1!.I + r2!.I) : 0;
  const total = ok ? (series ? all!.U : all!.I) : 0;
  const tol = series ? 0.3 : 0.12;
  const each = ok ? (series ? Math.abs(r1!.U - total) < tol && Math.abs(r2!.U - total) < tol : Math.abs(r1!.I - total) < tol && Math.abs(r2!.I - total) < tol) : false;
  const halves = ok ? (series ? Math.abs(r1!.U - r2!.U) < tol : Math.abs(r1!.I - r2!.I) < tol) : false;
  const correct = ok ? (Math.abs(sum - total) <= tol ? 'sum' : each ? 'equal' : halves ? 'half' : undefined) : undefined;
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      series
        ? l === 'uk'
          ? 'У послідовному колі в струму одна дорога: скільки зарядів пройшло через перший резистор, стільки ж пройде й через другий — інакше вони десь накопичувалися б. Тому струм всюди однаковий. А напруга — це робота, яку джерело виконує, переносячи заряд по колу; цю роботу заряд «витрачає» по дорозі: частину на першому резисторі, решту — на другому. Отже, U = U₁ + U₂. За законом Ома U₁ = I·R₁, U₂ = I·R₂: на вдвічі більшому опорі — удвічі більша напруга. Так ялинкова гірлянда з лампочок, увімкнених одна за одною, ділить між ними напругу мережі — і якщо одна перегорить, згасає вся.'
          : 'In a series circuit the current has one road: as many charges pass through the first resistor as through the second — otherwise they would pile up somewhere. So the current is the same everywhere. The voltage is the work the source does carrying charge round the circuit; the charge “spends” that work on the way: part across the first resistor, the rest across the second. So U = U₁ + U₂. By Ohm’s law U₁ = I·R₁, U₂ = I·R₂: twice the resistance, twice the voltage. That is how a string of tree lights wired one after another shares the mains voltage — and if one burns out, all go dark.'
        : l === 'uk'
          ? 'У паралельному колі обидва резистори під’єднані до тих самих двох точок, тож напруга на них однакова — це напруга між цими точками. Струм, дійшовши до розгалуження, ділиться: заряди не зникають і не з’являються, тож скільки ввійшло у вузол, стільки й вийшло: I = I₁ + I₂. У гілці з меншим опором струм більший (I = U/R): удвічі менший опір — удвічі більший струм. Кожна нова гілка додає ще одну дорогу для струму, тож загальний опір менший за найменший опір гілки. Так увімкнено прилади в квартирі: кожен має напругу мережі й працює незалежно від інших.'
          : 'In a parallel circuit both resistors are joined to the same two points, so the voltage across them is the same — the voltage between those points. The current, reaching the fork, splits: charges neither vanish nor appear, so as much flows into the junction as out: I = I₁ + I₂. The branch of smaller resistance carries more current (I = U/R): half the resistance, twice the current. Each new branch adds another road for the current, so the total resistance is less than the smallest branch’s. That is how appliances at home are wired: each gets the mains voltage and works independently of the others.',
    ),
    say: both((l) => (l === 'uk' ? (series ? 'Напруги склалися — струм той самий!' : 'Струми склалися — напруга та сама!') : series ? 'The voltages add up — the current is the same!' : 'The currents add up — the voltage is the same!')),
    text: both((l) => {
      if (!ok) return l === 'uk' ? 'Дослід ще не завершено.' : 'The experiment is not finished yet.';
      return series
        ? l === 'uk'
          ? `Струм у колі всюди однаковий — ${A(all!.I, l)}. Напруга на резисторі 2 Ом — ${V(r1!.U, l)}, на резисторі 4 Ом — ${V(r2!.U, l)}, на обох разом — ${V(all!.U, l)}. Сума U₁ + U₂ = ${V(r1!.U + r2!.U, l)} — та сама загальна напруга (розбіжність — у межах ціни поділки вольтметра, 0,2 В). На більшому опорі напруга більша: у скільки разів більший опір, у стільки ж разів більша напруга.`
          : `The current is the same everywhere — ${A(all!.I, l)}. The voltage across the 2 Ω resistor is ${V(r1!.U, l)}, across the 4 Ω one ${V(r2!.U, l)}, across both ${V(all!.U, l)}. The sum U₁ + U₂ = ${V(r1!.U + r2!.U, l)} — the same total voltage (any difference is within the voltmeter’s 0.2 V division). The larger resistance gets the larger voltage: as many times more resistance, as many times more voltage.`
        : l === 'uk'
          ? `Напруга на обох гілках однакова — ${V(r1!.U, l)} (коли амперметр стоїть до розгалуження, вольтметр показує трохи менше — ${V(all!.U, l)}: частину напруги «забирає» сам амперметр). Струм у гілці з резистором 2 Ом — ${A(r1!.I, l)}, з резистором 4 Ом — ${A(r2!.I, l)}, до розгалуження — ${A(all!.I, l)}. Сума I₁ + I₂ = ${A(r1!.I + r2!.I, l)} — майже той самий загальний струм: невелика розбіжність — від ціни поділки амперметра (0,05 А) і від того, що він сам має невеликий опір і, ввімкнений у гілку, трохи зменшує в ній струм. У гілці з удвічі меншим опором струм удвічі більший.`
          : `The voltage across both branches is the same — ${V(r1!.U, l)} (with the ammeter before the fork the voltmeter reads a little less — ${V(all!.U, l)}: the ammeter itself “takes” part of the voltage). The current in the branch of the 2 Ω resistor is ${A(r1!.I, l)}, of the 4 Ω one ${A(r2!.I, l)}, before the fork ${A(all!.I, l)}. The sum I₁ + I₂ = ${A(r1!.I + r2!.I, l)} — almost the same total: the small difference comes from the ammeter’s 0.05 A division and from its own small resistance, which, put in a branch, lowers the current in it a little. The branch of half the resistance carries twice the current.`;
    }),
  };
}
