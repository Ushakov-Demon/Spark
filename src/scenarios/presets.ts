import type { Locale, LocalizedText } from '../knowledge/i18n.js';
import type { LabParams, LabStatus } from './thermal-lab.js';
import type { ProtocolStep } from './protocol.js';
import { SUBSTANCES, type SubstanceId } from '../substances/catalog.js';
import { COMPONENTS } from '../components/index.js';
import { sandFull, sandToFloatInside, tubeGlass, tubeVolume } from './test-tube.js';
import { PENDULUM_BALLS, ROLL_PATH, THREAD_LENGTH } from './motion-bench.js';
import { slopeLoad } from './lever-bench.js';
import { LAB_RESISTOR, SET_RESISTORS } from './circuit-bench.js';
import { earthField, modelYear } from '../domains/electrical/wmm.js';

/**
 * Ready-made experiments, grouped by school grade and topic. Each sets up the
 * lab, asks a question, may carry a plan of further steps the Professor walks
 * through, and names the formulas it is about — their curriculum quotes show
 * where in the programme it belongs. Free play stays free: a preset is a start.
 */
export interface Preset {
  readonly id: string;
  /** School grade; null — for everyone, beyond a particular grade. */
  readonly grade: number | null;
  readonly topic: LocalizedText;
  readonly title: LocalizedText;
  /** The question to think about before pressing "Start". */
  readonly question: LocalizedText;
  /**
   * The question put in one line, over the choices («Чи замерзне спирт у морозилці?»). Not given — the last
   * question of `question` (presetAsk), when it stands on its own.
   */
  readonly ask?: LocalizedText;
  readonly params: LabParams;
  /** Put into the vessel before the start (hot water poured into cold, a block from boiling water). */
  readonly setup?: readonly Exclude<ProtocolStep, { kind: 'operation' }>[];
  /** Further steps after the first one (the first is `params` itself). */
  readonly plan?: readonly ProtocolStep[];
  /** Formula ids from the catalogs — for "where it is in the programme". */
  readonly formulas: readonly string[];
  /** Show only the programme quotes that contain this ("плавлен" — melting, not boiling). */
  readonly quoteHas?: string;
  /**
   * Programmes it belongs to beyond what its formulas say (a required practical of another
   * country's course): the programme, the grade if it has one, and the exact wording.
   */
  readonly programs?: readonly PresetProgram[];
  /**
   * A measuring procedure, led step by step from the very start (no "Start"): each plan step is a
   * button; the readings go onto the board one by one.
   */
  readonly guided?: boolean;
  /** When the choices are offered: before the start (a prediction, default) or at the end (the conclusion). */
  readonly choicesAt?: 'start' | 'end';
  /**
   * Board lines (id starts) whose numbers are the answer to the question asked at the end: until the
   * conclusion is picked, the board shows their formula only, then chalks the numbers in.
   */
  readonly answerOnBoard?: readonly string[];
  /** 'measurements': the board writes only what was measured — the heating in it is just the way to a temperature. */
  readonly board?: 'measurements';
  /** The mechanics bench is on the table instead of the vessel: a spring on a stand, a block on a board. */
  readonly bench?: 'spring' | 'friction' | 'pressure' | 'balance' | 'incline' | 'circle' | 'pendulum' | 'lever' | 'slope' | 'circuit' | 'series' | 'parallel' | 'box' | 'depth' | 'utube' | 'press' | 'atm' | 'vessels' | 'magnet' | 'induct' | 'bubble' | 'sink';
  /** The choices come as a table of this property (the experimenter looks the result up in it). */
  readonly choiceTable?: 'density';
  /**
   * Possible answers to the question, to pick before the start (a prediction).
   * Which one is right is not written here: the answer works it out from the run.
   */
  readonly choices?: readonly Choice[];
  /** Ask for a prediction (minutes) before the start. */
  readonly predict?: boolean;
  /** How the run ends in the model (checked by tests). */
  readonly expect: LabStatus['kind'];
  /** What may be changed before the start, and how the experiment is built from it. */
  readonly vary?: PresetVary;
}

/**
 * What the experimenter may change in a ready-made experiment before it starts, within its own frame: an
 * amount, a temperature, a material from a short list. The preset is built from the chosen values (its
 * setup, plan, question and choices follow them); the answer is worked out from the run as always.
 */
export type PresetControl = { readonly id: string; readonly label: LocalizedText } & (
  | { readonly kind: 'number'; readonly unit: string; readonly min: number; readonly max: number; readonly step: number; readonly value: number }
  | { readonly kind: 'choice'; readonly options: readonly Choice[]; readonly value: string }
  // A place on the Earth, as «name|latitude|longitude»: the default for Ukrainian, another for English (an example each).
  | { readonly kind: 'place'; readonly value: string; readonly en: string }
);
export interface Place {
  readonly name: string;
  readonly lat: number;
  readonly lon: number;
}
/** «Київ|50.45|30.52» → the place (null — not a place). */
export function parsePlace(s: unknown): Place | null {
  if (typeof s !== 'string') return null;
  const [name, a, b] = s.split('|');
  const lat = Number(a);
  const lon = Number(b);
  return name && Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { name, lat, lon } : null;
}
export const placeValue = (p: Place): string => `${p.name.replace(/\|/g, ' ')}|${p.lat.toFixed(4)}|${p.lon.toFixed(4)}`;
export type PresetValues = Readonly<Record<string, number | string>>;
export type PresetVariant = Partial<Pick<Preset, 'params' | 'setup' | 'plan' | 'question' | 'choices'>>;
export interface PresetVary {
  readonly controls: readonly PresetControl[];
  readonly build: (v: PresetValues) => PresetVariant;
}

/** The values a preset starts with. */
export const defaultValues = (p: Preset, locale: Locale = 'uk'): PresetValues => Object.fromEntries((p.vary?.controls ?? []).map((c) => [c.id, c.kind === 'place' && locale === 'en' ? c.en : c.value]));
/** The preset with these values: its setup, plan, question and choices built from them. */
export function withValues(p: Preset, v: PresetValues): Preset {
  if (!p.vary) return p;
  const all = { ...defaultValues(p), ...v };
  // Out-of-range or unknown values fall back to the defaults: the experiment stays within its frame.
  const clean = Object.fromEntries(
    p.vary.controls.map((c) => {
      const x = all[c.id];
      if (c.kind === 'number') return [c.id, typeof x === 'number' && x >= c.min && x <= c.max ? x : c.value];
      if (c.kind === 'place') return [c.id, parsePlace(x) ? String(x) : c.value];
      return [c.id, typeof x === 'string' && c.options.some((o) => o.id === x) ? x : c.value];
    }),
  );
  return { ...p, ...p.vary.build(clean) };
}
/** Define a preset whose setup depends on values: it is built with the defaults, and keeps how to rebuild it. */
const varied = (base: Omit<Preset, 'params' | 'question'> & Partial<Preset>, vary: PresetVary): Preset => {
  const p = { ...base, vary } as Preset;
  return { ...p, ...vary.build(defaultValues(p)) };
};

export interface PresetProgram {
  /** Id in CURRICULA. */
  readonly program: string;
  readonly grade?: number;
  /** The item in the programme ("Required practical 3", "ЛР № 9"), for the chip. */
  readonly item?: string;
  /** The programme's topic it belongs to ("Тема 3. Взаємодія тіл. Сили в природі"). */
  readonly topic?: string;
  /** Where the textbook has it: a source id and the place ("§ 34, лабораторна робота № 9, с. 243"). */
  readonly textbook?: { readonly source: string; readonly at: string };
  /** same — this very experiment is in the programme; related — the same idea on another substance. */
  readonly match: 'same' | 'related';
  /** Exact wording from the programme, in its original language. */
  readonly quote: string;
}

export interface Choice {
  readonly id: string;
  readonly label: LocalizedText;
}
const ch = (id: string, uk: string, en: string): Choice => ({ id, label: { uk, en } });
/** Every solid body on the shelf (what a density table lists), by density. */
export const DENSITY_TABLE: readonly Choice[] = Object.values(SUBSTANCES)
  .filter((s) => s.category === 'solid.metal' || s.category === 'solid.material')
  .sort((a, b) => a.liquid.density.value - b.liquid.density.value)
  .map((s) => ({ id: s.id, label: s.name }));

/** The question over the choices: the preset's own `ask`, or the last sentence of its text that asks something. */
export function presetAsk(p: Preset): LocalizedText {
  const last = (t: string) => (t.match(/[^.!?…]*\?/g) ?? []).pop()?.trim() ?? '';
  return p.ask ?? { uk: last(p.question.uk), en: last(p.question.en) };
}

/**
 * Does the experiment need a thermometer? Not when all it works out is mechanics (a density, a buoyant force,
 * a lever): there the temperature only stands in the way. Solutions keep it — solubility goes with temperature.
 */
export const needsThermometer = (p: Preset): boolean => !p.formulas.length || !p.formulas.every((f) => f.startsWith('mechanics.'));

/** At most this many choices are offered at once: enough to look for the answer, not a list to wade through. */
export const MAX_CHOICES = 10;

/**
 * The rows of a table offered to look the result up in: the MAX_CHOICES nearest to the measured value (as one
 * looks in a reference table — near the number one got), in the table's order. Not measured yet — the first ones.
 */
export function nearestRows(rows: readonly Choice[], measured: number | null, valueOf: (id: string) => number): Choice[] {
  if (measured === null) return rows.slice(0, MAX_CHOICES);
  const near = [...rows].sort((a, b) => Math.abs(valueOf(a.id) - measured) - Math.abs(valueOf(b.id) - measured)).slice(0, MAX_CHOICES);
  return rows.filter((r) => near.includes(r));
}

const THERMAL: LocalizedText = { uk: 'Теплові явища', en: 'Thermal phenomena' };
const ELECTRIC: LocalizedText = { uk: 'Електричні явища', en: 'Electric phenomena' };
const FUN: LocalizedText = { uk: 'Цікаві досліди', en: 'Curious experiments' };
const SOLUTIONS: LocalizedText = { uk: 'Розчини', en: 'Solutions' };
// The physics topics as the programmes name them (grade 7: Holovko's four; 9: Kreminskyi's), in their order.
const MOTION: LocalizedText = { uk: 'Механічний рух', en: 'Mechanical motion' };
const INTERACTION: LocalizedText = { uk: 'Взаємодія тіл. Сила', en: 'Interaction of bodies. Force' };
const PRESSURE: LocalizedText = { uk: 'Тиск твердих тіл, рідин і газів', en: 'Pressure of solids, liquids and gases' };
const WORK: LocalizedText = { uk: 'Механічна робота. Механічна енергія', en: 'Mechanical work. Mechanical energy' };
const MEDIA: LocalizedText = { uk: 'Електричний струм у різних середовищах', en: 'Electric current in different media' };
const MAGNETIC: LocalizedText = { uk: 'Магнітні та електромагнітні явища', en: 'Magnetic and electromagnetic phenomena' };

const room = { roomTemp: 20, lid: false } as const;
/** Metals for the specific-heat lab work: what a school set of calorimeter cylinders has. */
const METALS_FOR_HEAT: readonly Choice[] = (['aluminium', 'copper', 'iron', 'brass', 'steel'] as const).map((id) => ({ id, label: SUBSTANCES[id].name }));
/** Liquids whose density the lab work finds (all fit the balance in a 100 mL cylinder). */
const LIQUIDS_FOR_DENSITY: readonly Choice[] = (['sunflower-oil', 'glycerol', 'ethanol', 'water'] as const).map((id) => ({ id, label: SUBSTANCES[id].name }));
const hotplate = { id: 'electric-hotplate', rating: 2000, knob: 1 } as const;
const bench = (knob: number) => ({ id: 'bench-supply', knob }) as const;
const beaker = { vessel: 'beaker', size: 0.25, material: 'glass', liters: 0.2 } as const;

/**
 * The circuit lab works' conditions: a resistor from the set and the source's steps. The resistor goes by its
 * number where its resistance is what the work finds. Every set of steps stays within the instruments with
 * every resistor: at most 6 V / 3.1 Ω ≈ 1.9 A (the ammeter takes 2 A), 6 V on the voltmeter (it takes 6 V);
 * each doubles a voltage of the set, for the power's «twice the voltage».
 */
const CIRCUIT_RESISTOR = (unknown: boolean): PresetControl => ({
  id: 'resistor',
  label: unknown ? { uk: 'Резистор (опір невідомий — його й знайдемо)', en: 'Resistor (its resistance unknown — that is what we find)' } : { uk: 'Резистор із набору', en: 'Resistor from the set' },
  kind: 'choice',
  options: SET_RESISTORS.map((r, k) => (unknown ? ch(String(r.value), `№ ${k + 1}`, `No. ${k + 1}`) : ch(String(r.value), `${r.value} Ом`, `${r.value} Ω`))),
  value: String(LAB_RESISTOR.value),
});
const VOLT_SETS = [[1.5, 3, 4.5], [1, 2, 3, 4], [2, 4, 6]] as const;
const CIRCUIT_VOLTS: PresetControl = {
  id: 'volts',
  label: { uk: 'Напруга джерела', en: 'Source voltage' },
  kind: 'choice',
  options: VOLT_SETS.map((set) => ch(set.join('-'), `${set.map((x) => String(x).replace('.', ',')).join(' · ')} В`, `${set.join(' · ')} V`)),
  value: '1.5-3-4.5',
};
const voltsOf = (v: PresetValues): number[] => String(v['volts']).split('-').map(Number);
/** «1,5, 3 і 4,5 В» / «1.5, 3 and 4.5 V». */
const voltsText = (volts: readonly number[], l: 'uk' | 'en') => {
  const n = volts.map((x) => (l === 'uk' ? String(x).replace('.', ',') : String(x)));
  return `${n.slice(0, -1).join(', ')} ${l === 'uk' ? 'і' : 'and'} ${n[n.length - 1]} ${l === 'uk' ? 'В' : 'V'}`;
};
const pot = { vessel: 'pot', size: 2, material: 'steel', liters: 1 } as const;

/** The electromagnet's examples: where the Earth's field is taken unless another city is given. */
const MAGNET_KYIV = 'Київ|50.4500|30.5200';
const MAGNET_NEW_YORK = 'New York|40.7128|-74.0060';

const LIST: readonly Preset[] = [
  // ---------------------------------------------------------------- 7 grade, mechanics
  varied(
    {
      id: 'ice-level',
      grade: 7,
      topic: PRESSURE,
      title: { uk: 'Чи зміниться рівень води, коли лід розтане?', en: 'Will the water level change when the ice melts?' },
      question: {
        uk: 'Опустимо в мензурку з водою кубик льоду — він плаватиме. Запишемо рівень, дочекаємося, поки лід розтане, і подивимося на поділки знову. Як зміниться рівень води, коли лід розтане?',
        en: 'We drop an ice cube into a measuring cylinder of water — it will float. We note the level, wait for the ice to melt and read the marks again. How will the water level change when the ice melts?',
      },
      params: { ...room, vessel: 'cylinder', size: 0.1, material: 'glass', liters: 0.07, action: 'settle', substance: 'water', startTemp: 20 },
      guided: true,
      choices: [ch('up', 'Підніметься', 'It will rise'), ch('down', 'Опуститься', 'It will drop'), ch('same', 'Не зміниться', 'It will stay the same')],
      formulas: ['mechanics.submerged-share'],
      quoteHas: 'плавання',
      programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 10', topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'related', quote: '№ 10. Перевірка умов плавання тіла.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 35, лабораторна робота № 10, с. 251' } }],
      expect: 'reached',
    },
    {
      // A cube that the 100 ml cylinder with 70 ml of water takes, and whose few millilitres its marks still show.
      controls: [{ id: 'cube', label: { uk: 'Кубик льоду', en: 'Ice cube' }, kind: 'choice', options: [ch('5', 'Маленький (5 г)', 'Small (5 g)'), ch('10', 'Середній (10 г)', 'Medium (10 g)'), ch('20', 'Великий (20 г)', 'Large (20 g)')], value: '10' }],
      build: (v) => ({
        plan: [
          { kind: 'level' },
          { kind: 'add', substance: 'water', mass: Number(v['cube']) / 1000, temperature: -5, frozen: true, label: { uk: 'Кубик льоду', en: 'Ice cube' } },
          { kind: 'level' },
          // Slow enough to watch the cube shrink (the speed can still be raised).
          { kind: 'operation', action: 'settle', speed: 10, label: { uk: 'Чекати, поки лід розтане', en: 'Wait for the ice to melt' } },
          { kind: 'level' },
        ],
      }),
    },
  ),
  {
    id: 'lever-moments',
    ask: { uk: 'За якої умови важіль перебуває в рівновазі?', en: 'When is a lever in balance?' },
    grade: 8,
    topic: WORK,
    title: { uk: 'Умова рівноваги важеля', en: 'The condition of a lever’s balance' },
    question: {
      uk: 'Важіль-лінійка висить на осі в штативі й сам урівноважений; отвори для гачків — через 5 см. Чіплятимемо тягарці по 100 г ліворуч і праворуч на різних відстанях від осі, а потім урівноважимо їх динамометром. Щоразу знайдемо момент сили з кожного боку: M = F·l. За якої умови важіль перебуває в рівновазі?',
      en: 'A lever ruler hangs on an axis in a stand and balances by itself; the holes for the hooks are every 5 cm. We hang 100 g weights left and right at different distances from the axis, then balance them with a dynamometer. Each time we find the moment on each side: M = F·l. When is a lever in balance?',
    },
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'lever',
    plan: [
      { kind: 'bench', command: { type: 'lab.lever', left: { weights: 2, at: 0.1 }, right: { weights: 1, at: 0.2 } } },
      { kind: 'bench', command: { type: 'lab.lever', left: { weights: 2, at: 0.15 }, right: { weights: 3, at: 0.1 } } },
      { kind: 'bench', command: { type: 'lab.lever', left: { weights: 3, at: 0.1 }, right: { dynamometer: true, at: 0.2 } } },
      { kind: 'bench', command: { type: 'lab.lever', left: { weights: 2, at: 0.2 }, right: { dynamometer: true, at: 0.1 } } },
    ],
    choices: [ch('moments', 'Коли моменти сил з обох боків рівні: F₁·l₁ = F₂·l₂', 'When the moments on both sides are equal: F₁·l₁ = F₂·l₂'), ch('forces', 'Коли сили з обох боків однакові', 'When the forces on both sides are the same'), ch('arms', 'Коли плечі з обох боків однакові', 'When the arms on both sides are the same')],
    choicesAt: 'end',
    answerOnBoard: ['M1:', 'M2:'],
    formulas: ['mechanics.moment', 'mechanics.weight'],
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 1', topic: 'Тема 1. Момент сили. Механічна робота та енергія', match: 'same', quote: '№ 1. Вивчення умови рівноваги важеля.' }],
    expect: 'reached',
  },
  varied(
    {
      id: 'slope-efficiency',
      ask: { uk: 'Як зміниться ККД похилої площини, якщо підняти її вище?', en: 'How does a slope’s efficiency change if it is raised higher?' },
      grade: 8,
      topic: WORK,
      title: { uk: 'ККД похилої площини', en: 'The efficiency of an inclined plane' },
      params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
      guided: true,
      bench: 'slope',
      choices: [ch('grows', 'Зросте', 'It grows'), ch('falls', 'Зменшиться', 'It falls'), ch('same', 'Не зміниться', 'It stays the same')],
      choicesAt: 'end',
      answerOnBoard: ['eta:'],
      formulas: ['mechanics.efficiency', 'mechanics.weight'],
      programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 2', topic: 'Тема 1. Момент сили. Механічна робота та енергія', match: 'same', quote: '№ 2. Визначення ККД простого механізму.' }],
      expect: 'reached',
    },
    {
      controls: [{ id: 'weights', label: { uk: 'Тягарців на бруску (по 100 г)', en: 'Weights on the block (100 g each)' }, kind: 'number', unit: '', min: 1, max: 3, step: 1, value: 2 }],
      build: (v) => {
        const n = Number(v['weights']);
        const with_ = { uk: n === 1 ? 'з одним тягарцем' : n === 2 ? 'із двома тягарцями' : 'із трьома тягарцями', en: n === 1 ? 'with one weight' : n === 2 ? 'with two weights' : 'with three weights' };
        return {
          question: {
            uk: `Зважимо динамометром дерев’яний брусок ${with_.uk} по 100 г. Потім покладемо його на дерев’яну дошку завдовжки 60 см, піднімемо її кінець на 10, 20 і 30 см і щоразу рівномірно тягтимемо брусок вгору вздовж дошки. ККД похилої площини η = P·h / (F·l). Як він зміниться, якщо підняти дошку вище?`,
            en: `We weigh a wooden block ${with_.en} of 100 g on the dynamometer. Then we put it on a 60 cm wooden board, raise its end 10, 20 and 30 cm and each time pull the block steadily up along the board. The efficiency of the slope η = P·h / (F·l). How does it change if the board is raised higher?`,
          },
          plan: [
            { kind: 'hang', substance: 'wood', mass: slopeLoad(n), into: 'air', label: { uk: `Брусок ${with_.uk}`, en: `Block ${with_.en}` } },
            ...[0.1, 0.2, 0.3].map((height) => ({ kind: 'bench', command: { type: 'lab.slope', height, weights: n } }) as const),
          ],
        };
      },
    },
  ),
  varied(
    {
      id: 'conductor-resistance',
      ask: { uk: 'Чи зміниться опір провідника, якщо збільшити напругу на ньому?', en: 'Will the conductor’s resistance change if the voltage across it is raised?' },
      grade: 8,
      topic: ELECTRIC,
      title: { uk: 'Вимірюємо опір провідника', en: 'Measuring the resistance of a conductor' },
      question: {
        uk: 'Зберемо коло: джерело струму, ключ, резистор і амперметр — послідовно, а вольтметр — паралельно до резистора. Ставитимемо на джерелі 1,5, 3 і 4,5 В і щоразу записуватимемо покази амперметра й вольтметра, а тоді знайдемо опір R = U / I. Чи зміниться опір провідника, якщо збільшити напругу на ньому?',
        en: 'We build a circuit: a source, a key, a resistor and an ammeter in series, and a voltmeter across the resistor. We set the source to 1.5, 3 and 4.5 V, write down the ammeter and the voltmeter each time, and find the resistance R = U / I. Will the conductor’s resistance change if the voltage across it is raised?',
      },
      params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
      guided: true,
      bench: 'circuit',
      plan: [1.5, 3, 4.5].map((source) => ({ kind: 'bench', command: { type: 'lab.circuit', source, resistor: LAB_RESISTOR.value } }) as const),
      choices: [ch('same', 'Ні — опір лишиться тим самим, зросте струм', 'No — the resistance stays, the current grows'), ch('grows', 'Так, зросте разом із напругою', 'Yes, it grows with the voltage'), ch('falls', 'Так, зменшиться', 'Yes, it falls')],
      choicesAt: 'end',
      answerOnBoard: ['R:'],
      formulas: ['electrical.ohm-resistance'],
      programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 6', topic: 'Тема 3. Електричні явища. Електричний струм', match: 'same', quote: '№ 6. Вимірювання опору провідника за допомогою амперметра й вольтметра.' }],
      expect: 'reached',
    },
    {
      controls: [CIRCUIT_RESISTOR(true), CIRCUIT_VOLTS],
      build: (v) => {
        const volts = voltsOf(v);
        return {
          question: {
            uk: `Зберемо коло: джерело струму, ключ, резистор і амперметр — послідовно, а вольтметр — паралельно до резистора. Ставитимемо на джерелі ${voltsText(volts, 'uk')} і щоразу записуватимемо покази амперметра й вольтметра, а тоді знайдемо опір R = U / I. Чи зміниться опір провідника, якщо збільшити напругу на ньому?`,
            en: `We build a circuit: a source, a key, a resistor and an ammeter in series, and a voltmeter across the resistor. We set the source to ${voltsText(volts, 'en')}, write down the ammeter and the voltmeter each time, and find the resistance R = U / I. Will the conductor’s resistance change if the voltage across it is raised?`,
          },
          plan: volts.map((source) => ({ kind: 'bench', command: { type: 'lab.circuit', source, resistor: Number(v['resistor']) } }) as const),
        };
      },
    },
  ),
  varied(
    {
      id: 'consumer-power',
      ask: { uk: 'У скільки разів зросте потужність, якщо напругу на резисторі збільшити вдвічі?', en: 'How many times does the power grow if the voltage across the resistor is doubled?' },
      grade: 8,
      topic: ELECTRIC,
      title: { uk: 'Вимірюємо потужність споживача', en: 'Measuring the power of a consumer' },
      question: {
        uk: 'У колі — джерело струму, ключ, резистор (споживач), амперметр і вольтметр. Ставитимемо на джерелі 1,5, 3 і 4,5 В, щоразу записуватимемо покази приладів і знаходитимемо потужність P = U · I. У скільки разів зросте потужність, якщо напругу на резисторі збільшити вдвічі?',
        en: 'The circuit has a source, a key, a resistor (the consumer), an ammeter and a voltmeter. We set the source to 1.5, 3 and 4.5 V, write down the instruments each time and find the power P = U · I. How many times does the power grow if the voltage across the resistor is doubled?',
      },
      params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
      guided: true,
      bench: 'circuit',
      plan: [1.5, 3, 4.5].map((source) => ({ kind: 'bench', command: { type: 'lab.circuit', source, resistor: LAB_RESISTOR.value, power: true } }) as const),
      choices: [ch('four', 'Учетверо', 'Four times'), ch('two', 'Удвічі', 'Twice'), ch('same', 'Не зміниться', 'It stays the same')],
      choicesAt: 'end',
      answerOnBoard: ['P:'],
      formulas: ['electrical.power', 'electrical.ohm-resistance'],
      programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 9', topic: 'Тема 3. Електричні явища. Електричний струм', match: 'same', quote: '№ 9. Вимірювання потужності споживача електроенергії.' }],
      expect: 'reached',
    },
    {
      controls: [CIRCUIT_RESISTOR(false), CIRCUIT_VOLTS],
      build: (v) => {
        const volts = voltsOf(v);
        return {
          question: {
            uk: `У колі — джерело струму, ключ, резистор (споживач), амперметр і вольтметр. Ставитимемо на джерелі ${voltsText(volts, 'uk')}, щоразу записуватимемо покази приладів і знаходитимемо потужність P = U · I. У скільки разів зросте потужність, якщо напругу на резисторі збільшити вдвічі?`,
            en: `The circuit has a source, a key, a resistor (the consumer), an ammeter and a voltmeter. We set the source to ${voltsText(volts, 'en')}, write down the instruments each time and find the power P = U · I. How many times does the power grow if the voltage across the resistor is doubled?`,
          },
          plan: volts.map((source) => ({ kind: 'bench', command: { type: 'lab.circuit', source, resistor: Number(v['resistor']), power: true } }) as const),
        };
      },
    },
  ),
  varied(
    {
      id: 'series-circuit',
      ask: { uk: 'Як пов’язані напруги на резисторах із загальною напругою?', en: 'How do the voltages across the resistors relate to the total?' },
      grade: 8,
      topic: ELECTRIC,
      title: { uk: 'Послідовне з’єднання провідників', en: 'Conductors in series' },
      params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
      guided: true,
      bench: 'series',
      choices: [ch('sum', 'Загальна напруга — сума напруг на резисторах', 'The total is the sum of the voltages across the resistors'), ch('equal', 'На кожному резисторі — уся напруга джерела', 'Each resistor gets the source’s whole voltage'), ch('half', 'Напруга ділиться навпіл, хоч які резистори', 'It splits in half, whatever the resistors')],
      choicesAt: 'end',
      answerOnBoard: ['sum:'],
      formulas: ['electrical.series-voltage', 'electrical.ohm-resistance'],
      programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 7', topic: 'Тема 3. Електричні явища. Електричний струм', match: 'same', quote: '№ 7. Дослідження електричного кола з послідовним з’єднанням провідників.' }],
      expect: 'reached',
    },
    {
      // In series 6.1 Ω in all: 6 V drive ≈ 1 A (the ammeter takes 2 A), the voltmeter across both reads up to 6 V.
      controls: [{ id: 'source', label: { uk: 'Напруга джерела', en: 'Source voltage' }, kind: 'choice', options: [ch('2', '2 В', '2 V'), ch('4', '4 В', '4 V'), ch('6', '6 В', '6 V')], value: '4' }],
      build: (v) => {
        const source = Number(v['source']);
        return {
          question: {
            uk: `З’єднаємо два резистори (2 і 4 Ом) послідовно — один за одним — з амперметром і джерелом на ${source} В. Виміряємо силу струму й напругу на першому резисторі, на другому і на обох разом. Як пов’язані напруги на резисторах із загальною напругою?`,
            en: `We connect two resistors (2 and 4 Ω) in series — one after the other — with an ammeter and a ${source} V source. We measure the current and the voltage across the first resistor, the second and both together. How do the voltages across the resistors relate to the total?`,
          },
          plan: (['r1', 'r2', 'both'] as const).map((at) => ({ kind: 'bench', command: { type: 'lab.pair', source, connection: 'series', at } }) as const),
        };
      },
    },
  ),
  varied(
    {
      id: 'parallel-circuit',
      ask: { uk: 'Як пов’язані струми в гілках із загальним струмом?', en: 'How do the branch currents relate to the total current?' },
      grade: 8,
      topic: ELECTRIC,
      title: { uk: 'Паралельне з’єднання провідників', en: 'Conductors in parallel' },
      params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
      guided: true,
      bench: 'parallel',
      choices: [ch('sum', 'Загальний струм — сума струмів у гілках', 'The total is the sum of the branch currents'), ch('equal', 'У кожній гілці — увесь струм', 'Each branch carries the whole current'), ch('half', 'Струм ділиться навпіл, хоч які резистори', 'It splits in half, whatever the resistors')],
      choicesAt: 'end',
      answerOnBoard: ['sum:'],
      formulas: ['electrical.parallel-current', 'electrical.ohm-resistance'],
      programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 8', topic: 'Тема 3. Електричні явища. Електричний струм', match: 'same', quote: '№ 8. Дослідження електричного кола з паралельним з’єднанням провідників.' }],
      expect: 'reached',
    },
    {
      // In parallel ≈ 1.33 Ω: before the fork 2.5 V drive ≈ 1.7 A, 3 V would be past the ammeter's 2 A.
      controls: [{ id: 'source', label: { uk: 'Напруга джерела', en: 'Source voltage' }, kind: 'choice', options: [ch('1', '1 В', '1 V'), ch('1.5', '1,5 В', '1.5 V'), ch('2', '2 В', '2 V'), ch('2.5', '2,5 В', '2.5 V')], value: '2' }],
      build: (v) => {
        const source = Number(v['source']);
        const uk = String(source).replace('.', ',');
        return {
          question: {
            uk: `З’єднаємо ті самі резистори (2 і 4 Ом) паралельно — кожен своєю гілкою — і під’єднаємо до джерела на ${uk} В. Виміряємо струм у гілці з першим резистором, у гілці з другим і до розгалуження, а щоразу — й напругу. Як пов’язані струми в гілках із загальним струмом?`,
            en: `We connect the same resistors (2 and 4 Ω) in parallel — each on its own branch — to a ${source} V source. We measure the current in the branch of the first resistor, of the second and before the fork, and the voltage each time. How do the branch currents relate to the total current?`,
          },
          plan: (['r1', 'r2', 'both'] as const).map((at) => ({ kind: 'bench', command: { type: 'lab.pair', source, connection: 'parallel', at } }) as const),
        };
      },
    },
  ),
  varied(
    {
      id: 'average-speed',
      ask: { uk: 'Де середня швидкість кульки більша: на всьому шляху чи на першій половині?', en: 'Where is the ball’s average speed greater: on the whole path or on its first half?' },
      grade: 7,
      topic: MOTION,
      title: { uk: 'Середня швидкість кульки на жолобі', en: 'The average speed of a ball in a groove' },
      params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
      guided: true,
      bench: 'incline',
      choices: [ch('whole', 'На всьому шляху', 'On the whole path'), ch('half', 'На першій половині', 'On the first half'), ch('same', 'Однакова', 'The same')],
      choicesAt: 'end',
      answerOnBoard: ['roll:'],
      formulas: ['mechanics.average-speed'],
      programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 1', topic: 'Тема 2. Механічний рух', match: 'same', quote: '№ 1. Визначення середньої швидкості руху тіла.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: 'лабораторна робота № 1, с. 75' } }],
      expect: 'reached',
    },
    {
      // «At a small angle»: the upper end of the 1.2 m groove raised 5, 10 or 15 cm.
      controls: [{ id: 'raise', label: { uk: 'Верхній кінець жолоба', en: 'Upper end of the groove' }, kind: 'choice', options: [ch('5', '5 см', '5 cm'), ch('10', '10 см', '10 cm'), ch('15', '15 см', '15 cm')], value: '10' }],
      build: (v) => {
        const cm = Number(v['raise']);
        const raise = cm / 100;
        return {
          question: {
            uk: `Жолоб закріпили на штативі під невеликим кутом — верхній кінець піднято на ${cm} см, на ньому — позначка крейдою, а внизу — металевий циліндр, що зупиняє кульку. Виміряємо шлях і час, за який кулька скотиться від позначки до циліндра, а потім — лише першу половину шляху. Де середня швидкість кульки більша: на всьому шляху чи на першій половині?`,
            en: `A groove is fixed on a stand at a small angle — its upper end raised ${cm} cm, with a chalk mark on it and a metal cylinder at the bottom to stop the ball. We measure the path and the time the ball takes from the mark to the cylinder, then the first half of the path only. Where is the ball’s average speed greater: on the whole path or on its first half?`,
          },
          plan: [
            { kind: 'bench', command: { type: 'lab.tape', what: 'path', length: ROLL_PATH } },
            { kind: 'bench', command: { type: 'lab.roll', path: ROLL_PATH, raise } },
            { kind: 'bench', command: { type: 'lab.roll', path: ROLL_PATH / 2, raise } },
          ],
        };
      },
    },
  ),
  varied(
    {
      id: 'rotation-period',
      ask: { uk: 'Як зміниться період обертання, якщо вкоротити нитку, а коло лишити те саме?', en: 'How does the period change if the thread is shortened and the circle stays the same?' },
      grade: 7,
      topic: MOTION,
      title: { uk: 'Період обертання тіла на нитці', en: 'The period of a body turning on a thread' },
      params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
      guided: true,
      bench: 'circle',
      choices: [ch('shorter', 'Стане меншим — тіло обертатиметься частіше', 'It gets shorter — the body turns more often'), ch('longer', 'Стане більшим', 'It gets longer'), ch('same', 'Не зміниться — коло ж те саме', 'It stays — the circle is the same')],
      choicesAt: 'end',
      formulas: ['mechanics.period'],
      programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 2', topic: 'Тема 2. Механічний рух', match: 'same', quote: '№ 2. Визначення періоду обертання тіла.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: 'лабораторна робота № 2, с. 87' } }],
      expect: 'reached',
    },
    {
      // More turns timed — the same slip of the stopwatch shared among more of them: a truer period.
      controls: [{ id: 'turns', label: { uk: 'Скільки обертів рахувати', en: 'Turns to count' }, kind: 'choice', options: [ch('10', '10', '10'), ch('20', '20', '20')], value: '10' }],
      build: (v) => {
        const turns = Number(v['turns']);
        return {
          question: {
            uk: `Тримаючи нитку за петлю над центром кола радіусом 15 см, розкрутимо тіло так, щоб воно йшло по колу, і виміряємо час ${turns} обертів. З нього знайдемо період, обертову частоту й швидкість тіла. А потім вкоротимо нитку, а коло лишимо те саме. Як зміниться період обертання?`,
            en: `Holding the thread by its loop over the centre of a 15 cm circle, we swing the body round it and time ${turns} turns. From that we find the period, the frequency and the body’s speed. Then we shorten the thread and keep the circle. How does the period change?`,
          },
          plan: [
            { kind: 'bench', command: { type: 'lab.whirl', thread: THREAD_LENGTH.value, turns } },
            { kind: 'bench', command: { type: 'lab.whirl', thread: 0.3, turns } },
          ],
        };
      },
    },
  ),
  varied(
    {
      id: 'pendulum',
      ask: { uk: 'Від чого залежить період коливань маятника: від амплітуди, маси кульки чи довжини нитки?', en: 'What does a pendulum’s period depend on: the amplitude, the ball’s mass or the length?' },
      grade: 7,
      topic: MOTION,
      title: { uk: 'Коливання нитяного маятника', en: 'The swings of a thread pendulum' },
      params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
      guided: true,
      bench: 'pendulum',
      choices: [ch('length', 'Лише від довжини нитки', 'Only on the length'), ch('amplitude', 'Від амплітуди: що ширше розмах, то довше', 'On the amplitude: the wider, the longer'), ch('mass', 'Від маси: важча кулька гойдається повільніше', 'On the mass: a heavier ball swings slower')],
      choicesAt: 'end',
      answerOnBoard: ['Tp:'],
      formulas: ['mechanics.pendulum', 'mechanics.period'],
      programs: [
        { program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 3', topic: 'Тема 2. Механічний рух', match: 'same', quote: '№ 3. Дослідження коливань нитяного маятника.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: 'лабораторна робота № 3, с. 99' } },
        { program: 'ua-nus-2023-holovko', grade: 9, match: 'same', quote: 'коливань математичного маятника' },
      ],
      expect: 'reached',
    },
    {
      // More swings timed — the same slip of the stopwatch shared among more of them: a truer period.
      controls: [{ id: 'count', label: { uk: 'Скільки коливань рахувати', en: 'Swings to count' }, kind: 'choice', options: [ch('10', '10', '10'), ch('20', '20', '20'), ch('30', '30', '30')], value: '20' }],
      build: (v) => {
        const count = Number(v['count']);
        return {
          question: {
            uk: `Підвісимо до кільця штатива кульку на нитці завдовжки 1 м. Виміряємо час ${count} коливань, відхиливши кульку на 2,5 см, потім — на 5,5 см. Тоді замінимо кульку важчою, а наостанок вкоротимо нитку до 25 см. Від чого залежить період коливань маятника?`,
            en: `We hang a ball on a 1 m thread from the stand’s ring. We time ${count} swings with the ball pulled 2.5 cm aside, then 5.5 cm. Then we put on a heavier ball, and at last shorten the thread to 25 cm. What does the pendulum’s period depend on?`,
          },
          plan: [
            { kind: 'bench', command: { type: 'lab.tape', what: 'length', length: 1 } },
            { kind: 'bench', command: { type: 'lab.swing', length: 1, amplitude: 0.025, mass: PENDULUM_BALLS.light, count } },
            { kind: 'bench', command: { type: 'lab.swing', length: 1, amplitude: 0.055, mass: PENDULUM_BALLS.light, count } },
            { kind: 'bench', command: { type: 'lab.swing', length: 1, amplitude: 0.025, mass: PENDULUM_BALLS.heavy, count } },
            { kind: 'bench', command: { type: 'lab.swing', length: 0.25, amplitude: 0.025, mass: PENDULUM_BALLS.light, count } },
          ],
        };
      },
    },
  ),
  {
    ask: { uk: 'З якого металу зроблено брусок?', en: 'What metal is the block made of?' },
    id: 'mystery-metal',
    grade: 7,
    topic: INTERACTION,
    title: { uk: 'Що це за метал?', en: 'Which metal is it?' },
    question: {
      uk: 'Перед нами брусок із невідомого металу. Визначимо його густину ρ = m/V і знайдемо метал у таблиці густин. Масу дізнаємося терезами, а об’єм — мензуркою: на скільки підніметься вода. Почнемо: зважимо мензурку з водою.',
      en: 'Here is a block of an unknown metal. We find its density ρ = m/V and look the metal up in a table of densities. The scales give the mass; the measuring cylinder the volume — by how far the water rises. Let us start: weigh the cylinder with water.',
    },
    params: { ...room, vessel: 'cylinder', size: 0.1, material: 'glass', liters: 0.05, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    plan: [
      { kind: 'weigh', scale: 'lab-balance' },
      { kind: 'level' },
      // Copper: its nearest neighbour in the table (brass) is 4.5 % off, more than the cylinder's half-division error
      // on 20 mL; iron and steel (7874 / 7850) could not be told apart this way.
      { kind: 'add', substance: 'copper', mass: 0.179, temperature: 20, label: { uk: 'Невідомий метал', en: 'Unknown metal' } },
      { kind: 'weigh', scale: 'lab-balance' },
      { kind: 'level' },
    ],
    choices: DENSITY_TABLE,
    choicesAt: 'end',
    choiceTable: 'density',
    formulas: ['mechanics.density'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'Маса тіла. Густина речовини.' }, { program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 5', topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: '№ 5. Визначення густини речовини (твердих тіл, рідин).', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 17, лабораторна робота № 5, с. 122' } }, { program: 'ua-nus-2023-hryhorovych-chemistry', grade: 7, item: 'Тема 1. Хімія. Перші кроки', match: 'related', quote: 'Актуалізація умінь, набутих в адаптаційному циклі на прикладі визначення густини тіла (цвяха, ключа тощо).' }],
    quoteHas: 'густини',
    expect: 'reached',
  },
  {
    id: 'hydraulic-press',
    ask: { uk: 'У скільки разів гідравлічна машина виграє в силі?', en: 'How many times does a hydraulic machine gain in force?' },
    grade: 7,
    topic: PRESSURE,
    title: { uk: 'Гідравлічна машина зі шприців', en: 'A hydraulic machine of syringes' },
    question: {
      uk: 'Два шприци — вузький і широкий — з’єднані трубкою, усе заповнене водою. Виміряємо діаметри поршнів. Ставитимемо на широкий поршень 2, 4 і 6 тягарців по 100 г і тиснутимемо динамометром на вузький, поки вантаж не почне підніматися. А наостанок опустимо вузький поршень на 6 см і подивимося, на скільки підніметься широкий. У скільки разів така машина виграє в силі?',
      en: 'Two syringes — a narrow and a wide one — are joined by a tube, all full of water. We measure the pistons’ diameters. We put 2, 4 and 6 weights of 100 g on the wide piston and push the narrow one with the dynamometer until the load starts to rise. At last we push the narrow piston 6 cm down and see how far the wide one rises. How many times does such a machine gain in force?',
    },
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'press',
    plan: [
      { kind: 'bench', command: { type: 'lab.press', step: 'diameters' } },
      ...[2, 4, 6].map((weights) => ({ kind: 'bench', command: { type: 'lab.press', step: 'lift', weights } }) as const),
      { kind: 'bench', command: { type: 'lab.press', step: 'travel', weights: 6 } },
    ],
    choices: [ch('areas', 'У стільки, у скільки площа широкого поршня більша за площу вузького', 'As many times as the wide piston’s area is larger than the narrow one’s'), ch('diameters', 'У стільки, у скільки більший діаметр', 'As many times as the diameter is larger'), ch('none', 'Ні в скільки — сила та сама', 'Not at all — the force is the same')],
    choicesAt: 'end',
    answerOnBoard: ['gain:'],
    formulas: ['mechanics.hydraulic', 'mechanics.pressure'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'Закон Паскаля. … Гідравлічна машина. … Дослідження: … передавання тиску рідинами й газами' }],
    expect: 'reached',
  },
  {
    id: 'communicating-vessels',
    ask: { uk: 'Де стоятиме вищий рівень — олії чи води?', en: 'Which level will stand higher — the oil’s or the water’s?' },
    grade: 7,
    topic: PRESSURE,
    title: { uk: 'Сполучені посудини: вода й олія', en: 'Communicating vessels: water and oil' },
    question: {
      uk: 'Наллємо у скляну U-подібну трубку води й порівняємо рівні в обох колінах. Потім доливатимемо в ліве коліно соняшникову олію — 10 мл, а тоді ще 10 мл — і щоразу вимірюватимемо лінійкою висоту стовпа олії й висоту води в правому коліні над рівнем межі між олією й водою. Де стоятиме вищий рівень — олії чи води?',
      en: 'We pour water into a glass U-tube and compare the levels in its two arms. Then we pour sunflower oil into the left arm — 10 mL, then 10 mL more — and each time measure with a ruler the height of the oil column and of the water in the right arm above the level of the boundary between the oil and the water. Which level will stand higher — the oil’s or the water’s?',
    },
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'utube',
    plan: [0, 10, 20].map((poured) => ({ kind: 'bench', command: { type: 'lab.utube', poured, liquid: 'sunflower-oil' } }) as const),
    choices: [ch('oil', 'Вищим буде рівень олії', 'The oil’s level will be higher'), ch('water', 'Вищим буде рівень води', 'The water’s level will be higher'), ch('same', 'Рівні будуть однакові', 'The levels will be the same')],
    choicesAt: 'end',
    answerOnBoard: ['rhoU:'],
    formulas: ['mechanics.communicating-vessels', 'mechanics.hydrostatic-pressure'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'Сполучені посудини. … моделювання: сполучених посудин' }],
    expect: 'reached',
  },
  varied(
    {
      id: 'hydrostatic-paradox',
      ask: { uk: 'У якій посудині вода тисне на дно найсильніше?', en: 'In which vessel does the water press on the bottom hardest?' },
      grade: 7,
      topic: PRESSURE,
      title: { uk: 'Гідростатичний парадокс: прилад Паскаля', en: 'The hydrostatic paradox: Pascal’s device' },
      params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
      guided: true,
      bench: 'vessels',
      choices: [ch('same', 'Однаково в усіх трьох', 'Alike in all three'), ch('wide', 'Найсильніше — у тій, що розширюється догори', 'Hardest in the one widening upwards'), ch('narrow', 'Найсильніше — у тій, що звужується догори', 'Hardest in the one narrowing upwards')],
      choicesAt: 'end',
      answerOnBoard: ['vF:'],
      formulas: ['mechanics.bottom-force', 'mechanics.hydrostatic-pressure'],
      programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'Тиск рідин і газів. Закон Паскаля. Гідростатичний тиск.' }],
      expect: 'reached',
    },
    {
      // How high the water stands: the manometer follows it, the shapes do not matter.
      controls: [{ id: 'height', label: { uk: 'Висота води в посудинах', en: 'The water’s height in the vessels' }, kind: 'number', unit: 'см', min: 6, max: 12, step: 2, value: 10 }],
      build: (v) => {
        const cm = Number(v['height']);
        const height = cm / 100;
        return {
          question: {
            uk: `Прилад Паскаля: на підставку, дно якої — гумова плівка з трубкою до манометра, по черзі закручують три скляні посудини: пряму, ту, що розширюється догори, і ту, що звужується. Дно в усіх однакове — виміряємо його. У кожну наллємо з мензурки води до висоти ${cm} см, запишемо, скільки води пішло, і що показує манометр. У якій посудині вода тисне на дно найсильніше?`,
            en: `Pascal’s device: three glass vessels — a straight one, one widening upwards and one narrowing — are screwed in turn onto a stand whose bottom is a rubber film with a tube to a manometer. All have the same bottom — we measure it. Into each we pour water from a measuring cylinder up to ${cm} cm and write down how much water went in and what the manometer shows. In which vessel does the water press on the bottom hardest?`,
          },
          plan: [
            { kind: 'bench', command: { type: 'lab.vessel', step: 'bottom' } },
            ...(['straight', 'wide', 'narrow'] as const).map((shape) => ({ kind: 'bench', command: { type: 'lab.vessel', step: 'fill', shape, height } }) as const),
          ],
        };
      },
    },
  ),
  varied(
    {
      id: 'atmospheric-pressure',
      ask: { uk: 'Чи покаже шприц такий самий тиск повітря, як барометр?', en: 'Will a syringe show the same air pressure as the barometer?' },
      grade: 7,
      topic: PRESSURE,
      title: { uk: 'Вимірюємо атмосферний тиск шприцом', en: 'Measuring the atmospheric pressure with a syringe' },
      params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
      guided: true,
      bench: 'atm',
      choices: [ch('less', 'Менший, ніж барометр', 'Less than the barometer'), ch('same', 'Такий самий, як барометр', 'The same as the barometer'), ch('more', 'Більший, ніж барометр', 'More than the barometer')],
      choicesAt: 'end',
      answerOnBoard: ['pa:'],
      formulas: ['mechanics.atmosphere-syringe', 'mechanics.pressure'],
      programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'вимірювання й визначення: атмосферного й гідростатичного тиску' }],
      expect: 'reached',
    },
    {
      // The weather: the barometer, and so the force on the plunger, differ from day to day.
      controls: [{ id: 'air', label: { uk: 'Погода (тиск повітря)', en: 'The weather (air pressure)' }, kind: 'choice', options: [ch('99000', 'Циклон: 990 гПа', 'A cyclone: 990 hPa'), ch('101300', 'Звичайний день: 1013 гПа', 'An ordinary day: 1013 hPa'), ch('103500', 'Антициклон: 1035 гПа', 'An anticyclone: 1035 hPa')], value: '101300' }],
      build: (v) => {
        const air = Number(v['air']);
        return {
          question: {
            uk: 'Шприц на 1 мл, динамометр, лінійка й барометр-анероїд. Виміряємо, яку довжину займає шкала шприца від 0 до 1 мл, і подивимося на барометр. Спершу витягнемо поршень динамометром із відкритим носиком, потім — закривши носик ковпачком: до позначок 0,25, 0,5 і 1 мл. Тиск повітря дасть сила, поділена на площу поршня. Чи покаже шприц такий самий тиск, як барометр?',
            en: 'A 1 mL syringe, a dynamometer, a ruler and an aneroid barometer. We measure how long the syringe’s scale from 0 to 1 mL is and look at the barometer. First we pull the plunger out with the dynamometer with the nozzle open, then with the nozzle shut by a cap: to the 0.25, 0.5 and 1 mL marks. The force over the plunger’s area gives the air’s pressure. Will the syringe show the same pressure as the barometer?',
          },
          plan: [
            { kind: 'bench', command: { type: 'lab.atm', step: 'scale', air } },
            { kind: 'bench', command: { type: 'lab.atm', step: 'barometer', air } },
            { kind: 'bench', command: { type: 'lab.atm', step: 'open', air } },
            ...[0.25, 0.5, 1].map((pulled) => ({ kind: 'bench', command: { type: 'lab.atm', step: 'sealed', air, pulled } }) as const),
          ],
        };
      },
    },
  ),
  varied(
    {
      id: 'depth-pressure',
      ask: { uk: 'Як тиск рідини залежить від глибини?', en: 'How does a liquid’s pressure depend on the depth?' },
      grade: 7,
      topic: PRESSURE,
      title: { uk: 'Як тиск рідини залежить від глибини?', en: 'How does the pressure of a liquid depend on the depth?' },
      guided: true,
      bench: 'depth',
      choices: [ch('proportional', 'Зростає пропорційно глибині: удвічі глибше — удвічі більший тиск', 'It grows in proportion: twice as deep — twice the pressure'), ch('same', 'Не залежить від глибини', 'It does not depend on the depth'), ch('slower', 'Зростає, але все повільніше', 'It grows, but ever more slowly')],
      choicesAt: 'end',
      answerOnBoard: ['rhoD:'],
      formulas: ['mechanics.hydrostatic-pressure'],
      programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'Дослідження: … зміни тиску в рідині з глибиною; … вимірювання й визначення: атмосферного й гідростатичного тиску' }],
      expect: 'reached',
    },
    {
      // Liquids of different densities: the manometer's water tells them apart (salt water deeper, oil less).
      controls: [{ id: 'liquid', label: { uk: 'Рідина в стакані', en: 'Liquid in the beaker' }, kind: 'choice', options: [ch('water', 'Вода', 'Water'), ch('salt-water-20', 'Солона вода (20 %)', 'Salt water (20 %)'), ch('sunflower-oil', 'Соняшникова олія', 'Sunflower oil')], value: 'water' }],
      build: (v) => {
        const liquid = String(v['liquid']) as 'water' | 'salt-water-20' | 'sunflower-oil';
        const name = { water: { uk: 'водою', en: 'water' }, 'salt-water-20': { uk: 'солоною водою', en: 'salt water' }, 'sunflower-oil': { uk: 'соняшниковою олією', en: 'sunflower oil' } }[liquid];
        return {
          question: {
            uk: `У стакані з ${name.uk} (рідини — на 12 см) опускатимемо воронку, затягнуту гумовою плівкою; трубка від неї йде до U-подібного манометра з водою. Записуватимемо, на скільки різняться рівні води в манометрі, коли плівка на глибині 3, 6 і 9 см, а наостанок на 9 см повернемо її вбік. Як тиск рідини залежить від глибини?`,
            en: `Into a beaker of ${name.en} (12 cm of it) we lower a funnel covered with a rubber film; a tube leads from it to a U-tube manometer with water. We write down how far apart the water levels in the manometer are with the film 3, 6 and 9 cm deep, and at last turn it sideways at 9 cm. How does the liquid’s pressure depend on the depth?`,
          },
          params: { ...room, vessel: 'beaker', size: 1, material: 'glass', liters: 0.9, action: 'settle', substance: liquid, startTemp: 20 },
          plan: [
            ...[0.03, 0.06, 0.09].map((depth) => ({ kind: 'bench', command: { type: 'lab.depth', depth } }) as const),
            { kind: 'bench', command: { type: 'lab.depth', depth: 0.09, sideways: true } },
          ],
        };
      },
    },
  ),
  {
    id: 'floating-conditions',
    ask: { uk: 'За якої умови тіло тоне, плаває всередині рідини, спливає?', en: 'When does a body sink, float inside a liquid, come up?' },
    grade: 7,
    topic: PRESSURE,
    title: { uk: 'Коли тіло тоне, а коли плаває?', en: 'When does a body sink, and when does it float?' },
    question: {
      uk: 'Пробірка з корком, пісок і мензурка з водою. Наповнимо пробірку піском до країв і опустимо у воду. Потім відсиплемо частину піску й опустимо знову, а тоді відсиплемо ще. Щоразу виміряємо її масу (терезами: на скільки збільшилися покази) і об’єм (мензуркою: на скільки піднялася вода), подивимося, що з нею буде, і порівняємо її середню густину з густиною води. За якої умови тіло тоне, плаває всередині рідини, спливає?',
      en: 'A stoppered test tube, sand and a measuring cylinder of water. We fill the tube with sand to the brim and put it into the water. Then we pour part of the sand out and put it in again, and then pour out more. Each time we measure its mass (the scales: how much the reading grows) and its volume (the cylinder: how far the water rises), watch what happens to it and compare its mean density with that of water. When does a body sink, float inside a liquid, come up?',
    },
    params: { ...room, vessel: 'cylinder', size: 0.1, material: 'glass', liters: 0.05, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    plan: [
      { kind: 'weigh', scale: 'lab-balance' },
      { kind: 'level' },
      { kind: 'add', substance: 'glass', mass: tubeGlass() + sandFull(), volume: tubeVolume(), temperature: 20, label: { uk: 'Пробірка, повна піску', en: 'Test tube full of sand' } },
      { kind: 'weigh', scale: 'lab-balance' },
      { kind: 'level' },
      { kind: 'fresh', label: { uk: 'Дослід 2: відсипати частину піску', en: 'Run 2: pour part of the sand out' } },
      { kind: 'weigh', scale: 'lab-balance' },
      { kind: 'level' },
      // As much sand as makes its mean density that of the water (rounded to a tenth of a gram — a pinch).
      { kind: 'add', substance: 'glass', mass: tubeGlass() + Math.round(sandToFloatInside(COMPONENTS.water.phases.liquid!.density!.value) * 1e4) / 1e4, volume: tubeVolume(), temperature: 20, label: { uk: 'Пробірка з меншою кількістю піску', en: 'Test tube with less sand' } },
      { kind: 'weigh', scale: 'lab-balance' },
      { kind: 'level' },
      { kind: 'fresh', label: { uk: 'Дослід 3: відсипати ще піску', en: 'Run 3: pour out more sand' } },
      { kind: 'weigh', scale: 'lab-balance' },
      { kind: 'add', substance: 'glass', mass: tubeGlass() + 0.001, volume: tubeVolume(), temperature: 20, label: { uk: 'Пробірка з дрібкою піску', en: 'Test tube with a pinch of sand' } },
      // (No cylinder now: the tube is not all under water, the level would tell only the part that is — its volume is that of run 1.)
      { kind: 'weigh', scale: 'lab-balance' },
    ],
    choices: [
      ch('density', 'Тоне, коли його густина більша за густину рідини; плаває всередині — коли рівна; спливає — коли менша', 'It sinks when its density is greater than the liquid’s; floats inside when equal; comes up when less'),
      ch('mass', 'Тоне важке тіло, а легке спливає — яка б не була рідина', 'A heavy body sinks and a light one comes up, whatever the liquid'),
      ch('volume', 'Тоне мале тіло, а велике спливає', 'A small body sinks and a large one comes up'),
    ],
    choicesAt: 'end',
    // The densities are the answer: chalked in once the conclusion is picked.
    answerOnBoard: ['rho:'],
    formulas: ['mechanics.density', 'mechanics.buoyant-force', 'mechanics.submerged-share'],
    quoteHas: 'плавання',
    programs: [
      { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'умов плавання тіл' },
      { program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 10', topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: '№ 10. Перевірка умов плавання тіла.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 35, лабораторна робота № 10, с. 251' } },
    ],
    expect: 'reached',
  },
  {
    id: 'lever-balance',
    grade: 7,
    topic: INTERACTION,
    title: { uk: 'Зважуємо на важільних терезах', en: 'Weighing on a lever balance' },
    question: {
      uk: 'Зважимо на важільних терезах алюмінієвий циліндр, дерев’яний брусок, порожню склянку й склянку з водою. Тіло кладемо на ліву шальку, а на праву пінцетом — важки з набору, від більших до менших, поки терези не зрівноважаться. Скільки води в склянці?',
      en: 'On a lever balance we weigh an aluminium cylinder, a wooden block, an empty glass and the glass with water. The load goes on the left pan, and on the right — weights from the set with tweezers, from larger to smaller, until the balance is level. How much water is in the glass?',
    },
    params: { ...room, vessel: 'beaker', size: 0.1, material: 'glass', liters: 0.05, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'balance',
    plan: [
      { kind: 'bench', command: { type: 'lab.balance', what: 'body', substance: 'aluminium', mass: 0.0543, label: { uk: 'Алюмінієвий циліндр', en: 'Aluminium cylinder' } } },
      { kind: 'bench', command: { type: 'lab.balance', what: 'body', substance: 'wood', mass: 0.12 * 0.06 * 0.04 * SUBSTANCES.wood.liquid.density.value, label: { uk: 'Дерев’яний брусок', en: 'Wooden block' } } },
      { kind: 'bench', command: { type: 'lab.balance', what: 'vessel-empty', label: { uk: 'Порожня склянка', en: 'Empty glass' } } },
      { kind: 'bench', command: { type: 'lab.balance', what: 'vessel', label: { uk: 'Склянка з водою', en: 'Glass with water' } } },
    ],
    choices: [ch('diff', 'Різниця зважувань: склянка з водою мінус порожня склянка', 'The difference of weighings: the glass with water minus the empty glass'), ch('total', 'Стільки, скільки показали терези зі склянкою з водою', 'As much as the balance showed with the glass of water'), ch('glass', 'Стільки, скільки важить порожня склянка', 'As much as the empty glass weighs')],
    choicesAt: 'end',
    formulas: ['mechanics.weight'],
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 4', topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: '№ 4. Вимірювання маси тіл.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 16, лабораторна робота № 4, с. 116' } }, { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'Маса тіла. Густина речовини.' }],
    expect: 'reached',
  },
  varied(
    {
      ask: { uk: 'Рідина легша чи важча за воду, якщо порівняти однакові об’єми?', en: 'Is the liquid lighter or heavier than water, for equal volumes?' },
      id: 'liquid-density',
      grade: 7,
      topic: INTERACTION,
      title: { uk: 'Яка густина рідини?', en: 'What is the density of a liquid?' },
      guided: true,
      bench: 'balance',
      formulas: ['mechanics.density'],
      quoteHas: 'густини',
      programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 5', topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: '№ 5. Визначення густини речовини (твердих тіл, рідин).', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 17, лабораторна робота № 5, с. 122' } }],
      expect: 'reached',
    },
    {
      controls: [
        { id: 'liquid', label: { uk: 'Рідина', en: 'Liquid' }, kind: 'choice', options: LIQUIDS_FOR_DENSITY, value: 'sunflower-oil' },
        { id: 'volume', label: { uk: 'Скільки налити', en: 'How much to pour' }, kind: 'number', unit: 'мл', min: 30, max: 60, step: 5, value: 50 },
      ],
      build: (v) => {
        const liquid = SUBSTANCES[v['liquid'] as SubstanceId];
        const volume = Number(v['volume']);
        const name = (l: 'uk' | 'en') => liquid.name[l].toLowerCase();
        const gen = (l: 'uk' | 'en') => (liquid.genitive?.[l] ?? liquid.name[l]).toLowerCase();
        return {
          question: {
            uk: `Зважимо порожню мензурку на важільних терезах, наллємо в неї ≈ ${volume} мл: ${name('uk')}, зважимо ще раз і подивимося на поділки, скільки рідини налили. Вона легша чи важча за воду, якщо порівняти однакові об’єми?`,
            en: `We weigh an empty measuring cylinder on a lever balance, pour ≈ ${volume} mL of ${gen('en')} into it, weigh it again and read on the marks how much we poured. For equal volumes, is it lighter or heavier than water?`,
          },
          params: { ...room, vessel: 'cylinder', size: 0.1, material: 'glass', liters: volume / 1000, action: 'settle', substance: liquid.id as SubstanceId, startTemp: 20 },
          plan: [
            { kind: 'bench', command: { type: 'lab.balance', what: 'vessel-empty', label: { uk: 'Порожня мензурка', en: 'Empty cylinder' } } },
            { kind: 'bench', command: { type: 'lab.balance', what: 'vessel', label: { uk: `Мензурка: ${name('uk')}`, en: `Cylinder with ${gen('en')}` } } },
            { kind: 'level' },
          ],
          choices: [ch('lighter', 'Легша', 'Lighter'), ch('same', 'Однакова', 'The same'), ch('heavier', 'Важча', 'Heavier')],
        };
      },
    },
  ),
  varied(
    {
      id: 'hooke-spring',
      grade: 7,
      topic: INTERACTION,
      title: { uk: 'Як розтягується пружина?', en: 'How does a spring stretch?' },
      guided: true,
      bench: 'spring',
      choices: [ch('proportional', 'Пропорційно: удвічі більша сила — удвічі більше видовження', 'In proportion: twice the force, twice the extension'), ch('faster', 'Видовження росте швидше за силу', 'The extension grows faster than the force'), ch('slower', 'Видовження росте повільніше за силу', 'The extension grows slower than the force')],
      formulas: ['mechanics.hooke', 'mechanics.weight'],
      programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 6', topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: '№ 6. Дослідження пружних властивостей тіл.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 24, лабораторна робота № 6, с. 172' } }, { program: 'oxfordaqa-igcse-sciences', item: 'Physics RP 1', match: 'same', quote: 'Investigate the relationship between force and extension for a spring.' }],
      expect: 'reached',
    },
    {
      // Only the springs that four 100 g weights stretch within the 40 cm ruler.
      controls: [{ id: 'spring', label: { uk: 'Пружина з набору', en: 'Spring of the set' }, kind: 'choice', options: [ch('25', 'Тугіша', 'Stiffer'), ch('15', 'М’якша', 'Softer')], value: '25' }],
      build: (v) => {
        const stiffness = Number(v['spring']);
        return {
          question: {
            uk: `Підвісимо ${stiffness === 25 ? 'тугішу' : 'м’якшу'} пружину з набору на штатив і будемо чіпляти до неї тягарці по 100 г — один, два, три, чотири, щоразу вимірюючи її довжину лінійкою. Як видовження пружини залежить від сили, що її розтягує?`,
            en: `We hang the ${stiffness === 25 ? 'stiffer' : 'softer'} spring of the set on a stand and add 100 g weights to it — one, two, three, four — measuring its length with a ruler each time. How does the spring’s extension depend on the force stretching it?`,
          },
          params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
          plan: [0, 1, 2, 3, 4].map((weights) => ({ kind: 'bench', command: { type: 'lab.stretch', weights, stiffness } }) as const),
        };
      },
    },
  ),
  {
    ask: { uk: 'Як зміниться коефіцієнт тертя μ = F/N, коли додаватимемо тягарці?', en: 'How will the coefficient μ = F/N change as weights are added?' },
    id: 'friction-coefficient',
    grade: 7,
    topic: INTERACTION,
    title: { uk: 'Визначаємо коефіцієнт тертя ковзання', en: 'Finding the coefficient of sliding friction' },
    question: {
      uk: 'Зважимо дерев’яний брусок динамометром, а потім тягтимемо його по дерев’яній дошці — спершу порожнього, далі з одним, двома, трьома тягарцями по 100 г, щоразу записуючи покази динамометра. Що буде з коефіцієнтом тертя μ = F/N?',
      en: 'We weigh a wooden block on a dynamometer, then pull it along a wooden board — first bare, then with one, two, three 100 g weights, writing down the dynamometer each time. What happens to the coefficient μ = F/N?',
    },
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'friction',
    plan: [
      { kind: 'hang', substance: 'wood', mass: 0.12 * 0.06 * 0.04 * SUBSTANCES.wood.liquid.density.value, into: 'air', label: { uk: 'Дерев’яний брусок', en: 'Wooden block' } },
      ...[0, 1, 2, 3].map((weights) => ({ kind: 'bench', command: { type: 'lab.pull', weights } }) as const),
    ],
    choices: [ch('same', 'Лишиться майже тим самим', 'It stays about the same'), ch('grows', 'Теж зростатиме', 'It grows too'), ch('falls', 'Зменшуватиметься', 'It gets smaller')],
    formulas: ['mechanics.friction', 'mechanics.weight'],
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 7', topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: '№ 7. Визначення коефіцієнта тертя ковзання.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 27, лабораторна робота № 7, с. 191' } }],
    expect: 'reached',
  },
  {
    ask: { uk: 'На якій грані брусок тиснутиме на стіл найсильніше?', en: 'On which face will the block press on the table hardest?' },
    id: 'block-pressure',
    grade: 7,
    topic: PRESSURE,
    title: { uk: 'Який тиск чинить брусок на стіл?', en: 'What pressure does a block put on the table?' },
    question: {
      uk: 'Зважимо дерев’яний брусок динамометром і виміряємо лінійкою його довжину, ширину й висоту. Брусок можна покласти на стіл трьома різними гранями. На якій грані він тиснутиме на стіл найсильніше?',
      en: 'We weigh a wooden block on a dynamometer and measure its length, width and height with a ruler. The block can lie on the table on three different faces. On which face will it press on the table hardest?',
    },
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'pressure',
    plan: [
      { kind: 'hang', substance: 'wood', mass: 0.12 * 0.06 * 0.04 * SUBSTANCES.wood.liquid.density.value, into: 'air', label: { uk: 'Дерев’яний брусок', en: 'Wooden block' } },
      ...([0, 1, 2] as const).map((edge) => ({ kind: 'bench', command: { type: 'lab.edge', edge } }) as const),
    ],
    choices: [ch('largest', 'На найбільшій грані', 'On the largest face'), ch('smallest', 'На найменшій грані', 'On the smallest face'), ch('same', 'Однаково — вага ж та сама', 'The same — the weight is the same')],
    choicesAt: 'end',
    answerOnBoard: ['pressure:'],
    formulas: ['mechanics.pressure', 'mechanics.weight'],
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 8', topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: '№ 8. Вимірювання тиску тіла на опору.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 28, лабораторна робота № 8, с. 203' } }],
    expect: 'reached',
  },
  {
    ask: { uk: 'З якої речовини зроблено брусок?', en: 'What substance is the block made of?' },
    id: 'hydrostatic-weighing',
    grade: 7,
    topic: PRESSURE,
    title: { uk: 'Гідростатичне зважування: з чого брусок?', en: 'Hydrostatic weighing: what is the block made of?' },
    question: {
      uk: 'Перед нами брусок із невідомої речовини, а мензурки, щоб виміряти його об’єм, немає — лише динамометр і стакан води. Зважимо брусок у повітрі, потім у воді. Архімедова сила дорівнює вазі витісненої води, тож з неї дізнаємося об’єм, а тоді й густину. З чого брусок?',
      en: 'Here is a block of an unknown substance, and there is no measuring cylinder for its volume — only a dynamometer and a beaker of water. We weigh the block in the air, then in water. The buoyant force equals the weight of the water it pushes aside, so it gives the volume, and then the density. What is the block made of?',
    },
    params: { ...room, ...beaker, liters: 0.2, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    plan: [
      { kind: 'hang', substance: 'aluminium', mass: 0.4, into: 'air', label: { uk: 'Невідомий брусок', en: 'Unknown block' } },
      { kind: 'hang', substance: 'aluminium', mass: 0.4, into: 'liquid', label: { uk: 'Невідомий брусок', en: 'Unknown block' } },
    ],
    choices: DENSITY_TABLE,
    choicesAt: 'end',
    choiceTable: 'density',
    formulas: ['mechanics.buoyant-force', 'mechanics.weight'],
    quoteHas: 'Архімеда',
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'вимірювання й визначення: атмосферного й гідростатичного тиску; виштовхувальної сили' }, { program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 9', topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: '№ 9. Гідростатичне зважування тіла.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 34, лабораторна робота № 9, с. 243' } }],
    expect: 'reached',
  },
  {
    id: 'archimedes-salt',
    grade: 7,
    topic: PRESSURE,
    title: { uk: 'Де архімедова сила більша?', en: 'Where is the buoyant force larger?' },
    question: {
      uk: 'Підвісимо брусок алюмінію (250 г) на динамометр — спершу в повітрі, потім опустимо у воду, а тоді — у ту саму воду, розчинивши в ній сіль. Де архімедова сила буде більшою?',
      en: 'We hang an aluminium block (250 g) on a dynamometer — first in the air, then lowered into water, then into the same water with salt dissolved in it. Where will the buoyant force be larger?',
    },
    params: { ...room, ...beaker, liters: 0.15, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    plan: [
      { kind: 'hang', substance: 'aluminium', mass: 0.25, into: 'air' },
      { kind: 'hang', substance: 'aluminium', mass: 0.25, into: 'liquid' },
      { kind: 'add', substance: 'table-salt', mass: 0.04, temperature: 20 },
      { kind: 'hang', substance: 'aluminium', mass: 0.25, into: 'liquid' },
    ],
    choices: [ch('fresh', 'У прісній воді', 'In fresh water'), ch('salt', 'У солоній воді', 'In salt water'), ch('same', 'Однаково', 'The same')],
    formulas: ['mechanics.buoyant-force', 'mechanics.weight'],
    quoteHas: 'Архімеда',
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 9', topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'related', quote: '№ 9. Гідростатичне зважування тіла.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 34, лабораторна робота № 9, с. 243' } }],
    expect: 'reached',
  },
  // ---------------------------------------------------------------- 9 grade, solutions
  {
    id: 'mass-fraction',
    grade: 9,
    topic: SOLUTIONS,
    title: { uk: 'Приготуй розчин із масовою часткою солі 10 %', en: 'Make a solution with 10 % salt by mass' },
    question: {
      uk: 'Приготуймо 50 г розчину кухонної солі, у якому сіль становить 10 % маси. У стакані вже 45 г води. Зважимо його, досиплемо 5 г солі, дочекаємося, поки розчиниться, і зважимо знову. Яка масова частка солі вийшла в розчині?',
      en: 'Let us make 50 g of a table-salt solution in which salt is 10 % of the mass. The beaker already holds 45 g of water. We weigh it, add 5 g of salt, let it dissolve and weigh again. What mass fraction of salt does the solution have?',
    },
    params: { ...room, ...beaker, liters: 45 / SUBSTANCES.water.liquid.density.value, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    plan: [
      { kind: 'weigh', scale: 'lab-balance' },
      { kind: 'add', substance: 'table-salt', mass: 0.005, temperature: 20 },
      { kind: 'weigh', scale: 'lab-balance' },
    ],
    // 11 % is the usual slip: 5 g of salt over the 45 g of water instead of over the whole 50 g of solution.
    choices: [ch('5', '5 %', '5 %'), ch('10', '10 %', '10 %'), ch('11', '≈ 11 %', '≈ 11 %'), ch('50', '50 %', '50 %')],
    choicesAt: 'end',
    answerOnBoard: ['fraction:'],
    formulas: ['thermal.mass-fraction'],
    programs: [{ program: 'ua-nus-2023-hryhorovych-chemistry', grade: 9, item: 'Тема 1. Досліджуємо розчинність речовин і розчини', match: 'same', quote: 'Виготовлення розчинів із заданою масовою часткою розчиненої речовини.' }],
    expect: 'reached',
  },
  varied(
    {
      id: 'grow-crystals',
      grade: 9,
      topic: SOLUTIONS,
      title: { uk: 'Виростимо кристали мідного купоросу', en: 'Growing copper sulfate crystals' },
      formulas: ['thermal.crystals-on-cooling'],
      programs: [{ program: 'ua-nus-2023-hryhorovych-chemistry', grade: 9, item: 'Тема 1. Досліджуємо розчинність речовин і розчини', match: 'same', quote: 'Вирощування кристалів.' }],
      expect: 'reached',
    },
    {
      controls: [
        // At least what 100 mL do not dissolve at 20 °C (32 g), at most what they dissolve at 60 °C (61.8 g).
        { id: 'salt', label: { uk: 'Мідний купорос', en: 'Copper sulfate' }, kind: 'number', unit: 'г', min: 35, max: 60, step: 5, value: 50 },
        { id: 'hot', label: { uk: 'Нагріти до', en: 'Heat to' }, kind: 'number', unit: '°C', min: 60, max: 80, step: 5, value: 60 },
      ],
      build: (v) => {
        const [salt, hot] = [Number(v['salt']), Number(v['hot'])];
        return {
          question: {
            uk: `У 100 мл води насиплемо ${salt} г мідного купоросу — при 20 °C стільки не розчиниться. Нагріємо до ${hot} °C, поки весь купорос розчиниться, а потім поставимо стакан у холодильник і охолодимо до 20 °C. Скільки купоросу випаде кристалами?`,
            en: `We put ${salt} g of copper sulfate into 100 mL of water — at 20 °C that much will not dissolve. We heat it to ${hot} °C until all of it dissolves, then put the beaker in a fridge and cool it to 20 °C. How much copper sulfate comes out as crystals?`,
          },
          params: { ...room, ...beaker, liters: 0.1, action: 'heat-to', target: hot, substance: 'water', startTemp: 20, heater: { ...hotplate, knob: 0.5 } },
          setup: [{ kind: 'add', substance: 'copper-sulfate', mass: salt / 1000, temperature: 20 }],
          plan: [{ kind: 'operation', action: 'cool-to', target: 20, cooler: { id: 'fridge', setpoint: 4 } }],
          choices: [ch('none', 'Нічого — він лишиться розчиненим', 'None — it stays dissolved'), ch('part', 'Частина купоросу', 'Part of it'), ch('all', `Увесь — ${salt} г`, `All of it — ${salt} g`)],
        };
      },
    },
  ),
  {
    id: 'heat-of-solution',
    grade: 9,
    topic: SOLUTIONS,
    title: { uk: 'Грілка чи охолоджувач?', en: 'A heater or a cooler?' },
    question: {
      uk: 'У стакан зі 100 мл води кімнатної температури розчинимо 20 г амоній хлориду, а в інший такий самий стакан — 10 г натрій гідроксиду. Стежимо за термометром. Як зміниться температура розчинів?',
      en: 'Into a beaker of 100 mL of water at room temperature we dissolve 20 g of ammonium chloride, and into another such beaker 10 g of sodium hydroxide. We watch the thermometer. How will the temperature of the solutions change?',
    },
    params: { ...room, ...beaker, liters: 0.1, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    plan: [
      { kind: 'add', substance: 'ammonium-chloride', mass: 0.02, temperature: 20 },
      { kind: 'operation', action: 'settle', speed: 10, label: { uk: 'Помішати й дивитися на термометр', en: 'Stir and watch the thermometer' } },
      { kind: 'fresh', label: { uk: 'Взяти другий стакан зі 100 мл води', en: 'Take a second beaker with 100 mL of water' } },
      { kind: 'add', substance: 'caustic-soda', mass: 0.01, temperature: 20 },
      { kind: 'operation', action: 'settle', speed: 10, label: { uk: 'Помішати й дивитися на термометр', en: 'Stir and watch the thermometer' } },
    ],
    choices: [ch('both-cold', 'Обидва охолонуть', 'Both will cool down'), ch('cold-hot', 'Перший охолоне, другий нагріється', 'The first cools, the second warms up'), ch('both-hot', 'Обидва нагріються', 'Both will warm up'), ch('same', 'Не зміниться', 'It will not change')],
    formulas: ['thermal.heat-of-solution'],
    programs: [
      { program: 'ua-nus-2023-hryhorovych-chemistry', grade: 9, item: 'Тема 1. Досліджуємо розчинність речовин і розчини', match: 'same', quote: 'Дослідження виділення або поглинання теплоти розчину під час розчинення.' },
      { program: 'ua-nus-2023-hryhorovych-chemistry', grade: 9, item: 'Тема 1. Досліджуємо розчинність речовин і розчини', match: 'related', quote: 'Моделювання: виготовлення хімічних обігрівачів або охолоджувачів для побутового застосування з використанням процесів розчинення / кристалізації.' },
    ],
    expect: 'reached',
  },
  {
    ask: { uk: 'Що станеться з розчином, коли він охолоне, — і коли в нього кинути кристалик?', en: 'What happens to the solution as it cools — and when a crystal is dropped in?' },
    id: 'supersaturated',
    grade: 9,
    topic: SOLUTIONS,
    title: { uk: 'Що зробить один кристалик?', en: 'What will one crystal do?' },
    question: {
      uk: 'У пробірці — 20 г натрій ацетату й 4 мл води: більшість кристалів не розчиняється. Нагріємо над спиртівкою до 70 °C, поки розчиниться все, і дамо охолонути в кімнаті. Потім кинемо в розчин крихітний кристалик натрій ацетату. Що станеться?',
      en: 'A test tube holds 20 g of sodium acetate and 4 mL of water: most of the crystals do not dissolve. We heat it over a spirit lamp to 70 °C until all of it dissolves and let it cool in the room. Then we drop a tiny crystal of sodium acetate into the solution. What will happen?',
    },
    params: { ...room, vessel: 'test-tube', size: 0.02, material: 'glass', liters: 0.004, action: 'heat-to', target: 70, substance: 'water', startTemp: 20, heater: { id: 'spirit-lamp', rating: 100, knob: 1 } },
    setup: [{ kind: 'add', substance: 'sodium-acetate', mass: 0.02, temperature: 20 }],
    plan: [
      { kind: 'operation', action: 'cool-to', target: 22, label: { uk: 'Охолонути в кімнаті до 22 °C', en: 'Cool in the room to 22 °C' } },
      { kind: 'add', substance: 'sodium-acetate', mass: 0.0002, temperature: 20, label: { uk: 'Кристалик-затравка', en: 'A seed crystal' } },
      { kind: 'operation', action: 'settle', label: { uk: 'Дивитися на термометр', en: 'Watch the thermometer' } },
    ],
    choices: [
      ch('on-cooling', 'Кристали випадуть ще під час охолодження', 'Crystals come out while it cools'),
      ch('warm', 'Лишиться рідким, а від кристалика закристалізується й нагріється', 'It stays liquid, and the crystal makes it crystallise and warm up'),
      ch('cold', 'Лишиться рідким, а від кристалика закристалізується й охолоне', 'It stays liquid, and the crystal makes it crystallise and cool down'),
      ch('nothing', 'Лишиться рідким навіть із кристаликом', 'It stays liquid even with the crystal'),
    ],
    formulas: ['thermal.heat-of-solution', 'thermal.crystals-on-cooling'],
    programs: [{ program: 'ua-nus-2023-hryhorovych-chemistry', grade: 9, item: 'Тема 1. Досліджуємо розчинність речовин і розчини', match: 'same', quote: 'Виготовлення та дослідження пересичених розчинів.' }],
    expect: 'reached',
  },
  // ---------------------------------------------------------------- 8 grade, heat
  {
    ask: { uk: 'Чи вийде в досліді табличне значення λ льоду?', en: 'Will the experiment give the table value of λ for ice?' },
    id: 'ice-latent-heat',
    grade: 8,
    topic: THERMAL,
    title: { uk: 'Скільки теплоти треба, щоб розтопити лід?', en: 'How much heat does it take to melt ice?' },
    question: {
      uk: 'Наллємо в калориметр 150 г теплої води й дочекаємося, поки він прогріється разом із нею. Потім кинемо 20 г льоду (−1 °C) і дочекаємося, поки лід розтане й температура встановиться. З теплового балансу знайдемо питому теплоту плавлення льоду λ. Чи вийде табличне значення?',
      en: 'We pour 150 g of warm water into a calorimeter and wait until it warms up together with the water. Then we drop in 20 g of ice (−1 °C) and wait until the ice melts and the temperature settles. From the heat balance we find the specific latent heat of fusion of ice λ. Will it come out as in the table?',
    },
    params: { roomTemp: 20, lid: true, vessel: 'calorimeter', size: 0.25, material: 'aluminium', liters: 0.15, action: 'settle', substance: 'water', startTemp: 45 },
    plan: [
      { kind: 'add', substance: 'water', mass: 0.02, temperature: -1, frozen: true, label: { uk: 'Лід', en: 'Ice' } },
      { kind: 'operation', action: 'settle', label: { uk: 'Дочекатися, поки лід розтане', en: 'Wait for the ice to melt' } },
    ],
    choices: [ch('table', 'Так, ≈ 334 кДж/кг', 'Yes, ≈ 334 kJ/kg'), ch('less', 'Менше за табличне', 'Less than in the table'), ch('more', 'Більше за табличне', 'More than in the table')],
    formulas: ['thermal.latent-heat', 'thermal.heat-for-temperature-change'],
    quoteHas: 'плавлен',
    programs: [{ program: 'ua-nus-2023-holovko', grade: 8, topic: 'Тема 1. Теплові явища', match: 'related', quote: 'зміни агрегатних станів внаслідок поглинання / виділення тепла' }, { program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 5', topic: 'Тема 2. Внутрішня енергія. Теплові явища', match: 'same', quote: '№ 5. Вимірювання питомої теплоти плавлення льоду.' }],
    expect: 'reached',
  },
  varied(
    {
      ask: { uk: 'Чи збіжеться виміряна питома теплоємність металу з табличною?', en: 'Will the measured specific heat of the metal match the table?' },
      id: 'specific-heat-metal',
      grade: 8,
      topic: THERMAL,
      title: { uk: 'Визначаємо питому теплоємність металу', en: 'Finding the specific heat of a metal' },
      formulas: ['thermal.heat-for-temperature-change', 'thermal.equilibrium-temperature'],
      quoteHas: 'баланс',
      programs: [{ program: 'ua-nus-2023-holovko', grade: 8, topic: 'Тема 1. Теплові явища', match: 'same', quote: 'визначення: питомої теплоємності твердого тіла' }, { program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 4', topic: 'Тема 2. Внутрішня енергія. Теплові явища', match: 'same', quote: '№ 4. Визначення питомої теплоємності речовини.' }],
      expect: 'reached',
    },
    {
      controls: [
        { id: 'metal', label: { uk: 'Метал', en: 'Metal' }, kind: 'choice', options: METALS_FOR_HEAT, value: 'aluminium' },
        { id: 'mass', label: { uk: 'Маса', en: 'Mass' }, kind: 'number', unit: 'г', min: 50, max: 200, step: 10, value: 100 },
        { id: 'water', label: { uk: 'Вода', en: 'Water' }, kind: 'number', unit: 'мл', min: 100, max: 200, step: 10, value: 150 },
      ],
      build: (v) => {
        const metal = SUBSTANCES[v['metal'] as SubstanceId];
        const [mass, water] = [Number(v['mass']), Number(v['water'])];
        const c = Math.round(metal.liquid.specificHeat.value / 10) * 10;
        const gen = (l: 'uk' | 'en') => (metal.genitive?.[l] ?? metal.name[l]).toLowerCase();
        return {
          question: {
            uk: `Циліндр із ${gen('uk')} масою ${mass} г нагріли в окропі до 100 °C і опустили в калориметр із ${water} г води при 20 °C. Виміряємо, до якої температури все прийде, і з рівняння теплового балансу знайдемо питому теплоємність металу. Чи збіжеться вона з табличною?`,
            en: `A cylinder of ${gen('en')} of ${mass} g was heated in boiling water to 100 °C and put into a calorimeter with ${water} g of water at 20 °C. We measure the temperature it all comes to and find the metal’s specific heat from the heat balance. Will it match the table?`,
          },
          params: { roomTemp: 20, lid: true, vessel: 'calorimeter', size: 0.25, material: 'aluminium', liters: water / 1000, action: 'settle', substance: 'water', startTemp: 20 },
          setup: [{ kind: 'add', substance: metal.id as SubstanceId, mass: mass / 1000, temperature: 100 }],
          choices: [ch('table', `Так, ≈ ${c} Дж/(кг·°C)`, `Yes, ≈ ${c} J/(kg·°C)`), ch('less', 'Менша за табличну', 'Less than in the table'), ch('more', 'Більша за табличну', 'More than in the table')],
        };
      },
    },
  ),
  {
    id: 'boil-a-litre',
    grade: 8,
    topic: THERMAL,
    title: { uk: 'За скільки закипить літр води?', en: 'How long does a litre of water take to boil?' },
    question: { uk: 'Скільки хвилин знадобиться електроплиті на 2 кВт, щоб закип’ятити літр води? Порівняй дослід із розрахунком «на папері».', en: 'How many minutes will a 2 kW hob need to bring a litre of water to the boil? Compare the experiment with the paper calculation.' },
    params: { ...room, ...pot, action: 'boil', substance: 'water', startTemp: 20, heater: hotplate },
    formulas: ['thermal.heat-for-temperature-change'],
    choices: [ch('longer', 'Довше, ніж виходить на папері', 'Longer than it comes out on paper'), ch('paper', 'Так само, як на папері', 'Just as on paper'), ch('shorter', 'Швидше, ніж на папері', 'Sooner than on paper')],
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 10', topic: 'Тема 3. Електричні явища. Електричний струм', match: 'related', quote: '№ 10. Визначення ККД електричного нагрівника.' }],
    expect: 'reached',
  },
  {
    id: 'lid-or-not',
    grade: 8,
    topic: THERMAL,
    title: { uk: 'Навіщо каструлі кришка?', en: 'Why does a pot need a lid?' },
    question: { uk: 'Закип’ятимо воду в каструлі з кришкою, а потім — таку саму каструлю з такою самою водою, але без кришки. Як гадаєш, де вода закипить швидше — і чому?', en: 'We boil water in a pot with a lid, then the same pot with the same water but without the lid. Where do you think the water boils sooner — and why?' },
    params: { ...pot, roomTemp: 20, lid: true, action: 'boil', substance: 'water', startTemp: 20, heater: { id: 'gas-hob', rating: 1500, knob: 1 } },
    // Two real runs side by side: the second starts afresh (cold pot, fresh water) — only the lid differs.
    plan: [
      { kind: 'fresh', lid: false, label: { uk: 'Взяти таку саму каструлю з водою — без кришки', en: 'Take the same pot of water — without the lid' } },
      { kind: 'operation', action: 'boil', heater: { id: 'gas-hob', rating: 1500, knob: 1 } },
    ],
    choices: [ch('lid', 'З кришкою закипить швидше', 'It boils sooner with a lid'), ch('no-lid', 'Без кришки швидше', 'Sooner without a lid'), ch('equal', 'Однаково', 'The same')],
    formulas: ['thermal.heat-for-temperature-change', 'thermal.latent-heat'],
    quoteHas: 'пароутвор',
    expect: 'reached',
  },
  varied(
    {
      id: 'melt-ice',
      grade: 8,
      topic: THERMAL,
      title: { uk: 'Як тане лід?', en: 'How does ice melt?' },
      choices: [ch('stays', 'Стоїть на місці, поки весь лід не розтане', 'It stands still until all the ice has melted'), ch('rises', 'Весь час росте', 'It keeps rising'), ch('falls', 'Спершу падає нижче', 'It drops lower first')],
      formulas: ['thermal.latent-heat'],
      quoteHas: 'плавлен',
      programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 5', topic: 'Тема 2. Внутрішня енергія. Теплові явища', match: 'related', quote: '№ 5. Вимірювання питомої теплоти плавлення льоду.' }],
      expect: 'reached',
    },
    {
      controls: [{ id: 'cold', label: { uk: 'Температура льоду', en: 'Temperature of the ice' }, kind: 'number', unit: '°C', min: -20, max: -5, step: 5, value: -10 }],
      build: (v) => {
        const t = Number(v['cold']);
        const n = `−${-t}`;
        return {
          question: { uk: `Поклади лід (${n} °C) у теплу кімнату й стеж за термометром. Що буде з температурою, поки лід тане?`, en: `Put ice (${n} °C) in a warm room and watch the thermometer. What happens to the temperature while the ice melts?` },
          params: { ...room, ...beaker, action: 'melt', substance: 'water', startTemp: t },
        };
      },
    },
  ),
  {
    id: 'melt-tin',
    grade: 8,
    topic: THERMAL,
    title: { uk: 'Плавлення олова', en: 'Melting tin' },
    question: { uk: 'Нагрій олово в тиглі над спиртівкою й стеж за термометром. Що буде з температурою, поки олово плавиться?', en: 'Heat tin in a crucible over a spirit lamp and watch the thermometer. What happens to the temperature while the tin melts?' },
    params: { ...room, vessel: 'crucible', size: 0.03, material: 'porcelain', liters: 0.05 / 7.289, action: 'melt', substance: 'tin', startTemp: 20, heater: { id: 'spirit-lamp', rating: 100, knob: 1 } },
    choices: [ch('stays', 'Стоїть на місці, поки все не розплавиться', 'It stands still until it has all melted'), ch('rises', 'Росте так само, як і до того', 'It keeps rising as before'), ch('falls', 'Трохи падає', 'It drops a little')],
    formulas: ['thermal.latent-heat', 'thermal.heat-for-temperature-change'],
    programs: [{ program: 'ua-nus-2023-hryhorovych-chemistry', grade: 7, item: 'Тема 3. Досліджуємо речовини та суміші', match: 'related', quote: 'Визначення фізичних властивостей речовин (пластичність, крихкість / твердість, електропровідність, колір, температура кипіння / плавлення).' }],
    quoteHas: 'плавлен',
    expect: 'reached',
  },
  {
    id: 'stearic-cooling',
    grade: 8,
    topic: THERMAL,
    title: { uk: 'Як твердне стеаринова кислота?', en: 'How does stearic acid set?' },
    question: { uk: 'Розплав стеаринову кислоту в пробірці над спиртівкою, а потім дай їй вистигнути в кімнаті. Що буде з температурою, поки розплав твердне?', en: 'Melt stearic acid in a test tube over a spirit lamp, then let it cool in the room. What happens to the temperature while the melt sets?' },
    params: { ...room, vessel: 'test-tube', size: 0.02, material: 'glass', liters: 10 / 940.8, action: 'melt', substance: 'stearic-acid', startTemp: 20, heater: { id: 'spirit-lamp', rating: 100, knob: 1 } },
    plan: [{ kind: 'operation', action: 'freeze', label: { uk: 'Вистигати в кімнаті', en: 'Cool in the room' } }],
    choices: [ch('stays', 'Тримається на місці, поки все не затвердне', 'It holds still until it has all set'), ch('falls', 'Рівно падає', 'It falls steadily'), ch('rises', 'Трохи піднімається', 'It rises a little')],
    formulas: ['thermal.latent-heat'],
    quoteHas: 'плавлен',
    programs: [{ program: 'oxfordaqa-igcse-sciences', item: 'Physics RP 3', match: 'same', quote: 'Cooling curves (P). Investigating the cooling curve of stearic acid.' }],
    expect: 'reached',
  },
  varied(
    {
      ask: { uk: 'Якою вийде питома теплоємність води?', en: 'What specific heat of water will it give?' },
      id: 'specific-heat-water',
      grade: 8,
      topic: THERMAL,
      title: { uk: 'Яка питома теплоємність води?', en: 'What is the specific heat of water?' },
      choices: [ch('table', 'Рівно табличне — 4200 Дж/(кг·°C)', 'Exactly the table value — 4200 J/(kg·°C)'), ch('more', 'Більше за табличне', 'More than the table value'), ch('less', 'Помітно менше за табличне', 'Noticeably less than the table value')],
      formulas: ['thermal.heat-for-temperature-change', 'thermal.energy-from-power'],
      programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 4', topic: 'Тема 2. Внутрішня енергія. Теплові явища', match: 'related', quote: '№ 4. Визначення питомої теплоємності речовини.' }],
      expect: 'reached',
    },
    {
      // No more than the beaker (250 ml) takes with the heater in it.
      controls: [{ id: 'water', label: { uk: 'Води', en: 'Water' }, kind: 'number', unit: 'г', min: 100, max: 200, step: 50, value: 200 }],
      build: (v) => {
        const g = Number(v['water']);
        return {
          question: { uk: `Нагрій ${g} г води кип’ятильником 500 Вт від 20 до 50 °C. Знаючи потужність і час, порахуй c = P·t / (m·Δt). Яким вийде число?`, en: `Heat ${g} g of water with a 500 W immersion heater from 20 to 50 °C. From the power and the time, compute c = P·t / (m·Δt). What number do you get?` },
          params: { ...room, ...beaker, liters: g / SUBSTANCES.water.liquid.density.value, action: 'heat-to', target: 50, substance: 'water', startTemp: 20, heater: { id: 'immersion-heater', rating: 500, knob: 1 } },
        };
      },
    },
  ),
  varied(
    {
      id: 'heater-efficiency',
      ask: { uk: 'Яка частка енергії кип’ятильника дістанеться воді?', en: 'What share of the heater’s energy will the water get?' },
      grade: 8,
      topic: THERMAL,
      title: { uk: 'Визначаємо ККД електричного нагрівника', en: 'Finding the efficiency of an electric heater' },
      choices: [ch('all', 'Уся — ККД 100 %', 'All of it — 100 %'), ch('most', 'Більша частина, але не вся', 'Most of it, but not all'), ch('half', 'Менше половини', 'Less than half')],
      choicesAt: 'end',
      formulas: ['thermal.heat-for-temperature-change', 'thermal.energy-from-power'],
      programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 10', topic: 'Тема 3. Електричні явища', match: 'same', quote: '№ 10. Визначення ККД електричного нагрівника.' }, { program: 'ua-nus-2023-holovko', grade: 8, topic: 'Тема 1. Теплові явища', match: 'same', quote: 'визначення: питомої теплоємності твердого тіла; ККД нагрівника' }],
      expect: 'reached',
    },
    {
      // No more than the beaker (250 ml) takes with the heater in it.
      controls: [{ id: 'water', label: { uk: 'Води', en: 'Water' }, kind: 'number', unit: 'г', min: 100, max: 200, step: 50, value: 200 }],
      build: (v) => {
        const g = Number(v['water']);
        return {
          question: {
            uk: `Нагріємо ${g} г води кип’ятильником потужністю 500 Вт (так написано на ньому) від 20 до 60 °C і засічемо час. Корисна теплота — та, що дісталася воді: Q = c·m·Δt; витрачена енергія — E = P·t. ККД η = Q / E. Яка частка енергії кип’ятильника дістанеться воді?`,
            en: `We heat ${g} g of water with a 500 W immersion heater (as written on it) from 20 to 60 °C and time it. The useful heat is what the water got: Q = c·m·Δt; the energy spent is E = P·t. The efficiency η = Q / E. What share of the heater’s energy will the water get?`,
          },
          params: { ...room, ...beaker, liters: g / SUBSTANCES.water.liquid.density.value, action: 'heat-to', target: 60, substance: 'water', startTemp: 20, heater: { id: 'immersion-heater', rating: 500, knob: 1 } },
        };
      },
    },
  ),
  {
    ask: { uk: 'Чи розплавиться сіль у каструлі на газі?', en: 'Will the salt melt in a pot on the gas?' },
    id: 'salt-in-pot',
    grade: 8,
    topic: THERMAL,
    title: { uk: 'Чи розплавиться сіль у каструлі?', en: 'Will salt melt in a pot?' },
    question: { uk: 'Насип кухонну сіль у сталеву каструлю й постав на газ на повну. Сіль плавиться при 801 °C. Що буде?', en: 'Pour table salt into a steel pot and put it on full gas. Salt melts at 801 °C. What will happen?' },
    params: { ...room, vessel: 'pot', size: 1, material: 'steel', liters: 0.1 / 2.17, action: 'melt', substance: 'table-salt', startTemp: 20, heater: { id: 'gas-hob', rating: 1750, knob: 1 } },
    plan: [
      { kind: 'fresh', set: { vessel: 'crucible', size: 0.05, material: 'porcelain' }, label: { uk: 'Пересипати сіль у порцеляновий тигель', en: 'Pour the salt into a porcelain crucible' } },
      { kind: 'operation', action: 'melt', cooler: { id: 'muffle-furnace', setpoint: 900 }, label: { uk: 'Поставити в муфельну піч на 900 °C', en: 'Into a muffle furnace at 900 °C' } },
    ],
    choices: [ch('melts', 'Розплавиться, якщо почекати', 'It melts if you wait'), ch('too-cold', 'Не розплавиться: так не нагріти', 'It will not melt: it cannot get that hot'), ch('pot-burns', 'Каструля прогорить раніше', 'The pot burns through first')],
    formulas: ['thermal.latent-heat', 'thermal.heat-for-temperature-change'],
    programs: [{ program: 'ua-nus-2023-hryhorovych-chemistry', grade: 7, item: 'Тема 3. Досліджуємо речовини та суміші', match: 'related', quote: 'Визначення фізичних властивостей речовин (пластичність, крихкість / твердість, електропровідність, колір, температура кипіння / плавлення).' }],
    quoteHas: 'плавлен',
    expect: 'stalls',
  },
  {
    id: 'freeze-water',
    grade: 8,
    topic: THERMAL,
    title: { uk: 'Скільки замерзає вода в морозилці?', en: 'How long does water take to freeze?' },
    question: { uk: 'Як гадаєш, що триває довше: охолодити воду до 0 °C чи потім перетворити її на лід?', en: 'What do you think takes longer: cooling water to 0 °C or then turning it into ice?' },
    params: { ...room, ...beaker, action: 'freeze', substance: 'water', startTemp: 20, cooler: { id: 'freezer', setpoint: -18 } },
    choices: [ch('cooling', 'Охолодити до 0 °C', 'Cooling to 0 °C'), ch('freezing', 'Перетворити на лід', 'Turning it into ice'), ch('equal', 'Приблизно однаково', 'About the same')],
    formulas: ['thermal.latent-heat', 'thermal.heat-for-temperature-change'],
    quoteHas: 'плавлен',
    programs: [{ program: 'oxfordaqa-igcse-sciences', item: 'Physics RP 3', match: 'related', quote: 'Cooling curves (P). Investigating the cooling curve of stearic acid.' }],
    expect: 'reached',
  },
  {
    ask: { uk: 'Чи замерзне морська вода так само, як прісна?', en: 'Will sea water freeze like fresh water?' },
    id: 'road-salt',
    grade: 8,
    topic: THERMAL,
    title: { uk: 'Чому взимку дороги посипають сіллю?', en: 'Why are roads salted in winter?' },
    question: { uk: 'Постав морську воду в морозилку на −18 °C. Чи замерзне вона так само, як прісна?', en: 'Put sea water into a −18 °C freezer. Will it freeze like fresh water?' },
    params: { ...room, ...beaker, action: 'freeze', substance: 'sea-water', startTemp: 20, cooler: { id: 'freezer', setpoint: -18 } },
    choices: [ch('yes', 'Так, як прісна', 'Yes, like fresh water'), ch('partly', 'Замерзне лише частина', 'Only part of it freezes'), ch('no', 'Зовсім не замерзне', 'It will not freeze at all')],
    formulas: ['thermal.latent-heat'],
    programs: [{ program: 'ua-nus-2023-hryhorovych-chemistry', grade: 9, item: 'Тема 2. Досліджуємо хімічні реакції в розчинах', match: 'same', quote: 'Дослідження зміни температури кипіння (плавлення / замерзання) розчинів порівняно з розчинником залежно від умісту в розчині неелектролітів / електролітів різного типу.' }],
    quoteHas: 'плавлен',
    expect: 'impossible',
  },
  varied(
    {
      id: 'mix-hot-cold',
      grade: 8,
      topic: THERMAL,
      title: { uk: 'Змішуємо гарячу й холодну воду', en: 'Mixing hot and cold water' },
      formulas: ['thermal.equilibrium-temperature'],
      quoteHas: 'змішування',
      programs: [{ program: 'ua-nus-2023-holovko', grade: 8, topic: 'Тема 1. Теплові явища', match: 'same', quote: 'теплового балансу за умов змішування води різної температури' }, { program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 3', topic: 'Тема 2. Внутрішня енергія. Теплові явища', match: 'same', quote: '№ 3. Вивчення теплового балансу за умов змішування води різної температури.' }],
      expect: 'reached',
    },
    {
      controls: [
        { id: 'cold', label: { uk: 'Холодна вода', en: 'Cold water' }, kind: 'number', unit: 'мл', min: 50, max: 120, step: 10, value: 100 },
        { id: 'tCold', label: { uk: 't', en: 't' }, kind: 'number', unit: '°C', min: 10, max: 30, step: 1, value: 20 },
        { id: 'hot', label: { uk: 'Гаряча вода', en: 'Hot water' }, kind: 'number', unit: 'г', min: 50, max: 110, step: 10, value: 100 },
        { id: 'tHot', label: { uk: 't', en: 't' }, kind: 'number', unit: '°C', min: 50, max: 90, step: 1, value: 80 },
      ],
      build: (v) => {
        const [cold, tCold, hot, tHot] = [Number(v['cold']), Number(v['tCold']), Number(v['hot']), Number(v['tHot'])];
        // The heat balance (cold water ≈ 1 g per mL): what the choices name as "exactly".
        const theta = Math.round(((cold * tCold + hot * tHot) / (cold + hot)) * 10) / 10;
        const t = String(theta).replace('.', ',');
        return {
          question: {
            uk: `До ${cold} мл води при ${tCold} °C долили ${hot} г гарячої води при ${tHot} °C. Якою буде температура суміші, коли все прийде до рівноваги?`,
            en: `To ${cold} mL of water at ${tCold} °C we add ${hot} g of hot water at ${tHot} °C. What will the temperature of the mixture be once everything comes to equilibrium?`,
          },
          params: { ...room, ...beaker, liters: cold / 1000, action: 'settle', substance: 'water', startTemp: tCold },
          setup: [{ kind: 'add', substance: 'water', mass: hot / 1000, temperature: tHot }],
          choices: [ch('fifty', `Рівно ${t} °C`, `Exactly ${theta} °C`), ch('less', `Трохи менше за ${t} °C`, `A little below ${theta} °C`), ch('more', `Більше за ${t} °C`, `Above ${theta} °C`)],
        };
      },
    },
  ),
  {
    ask: { uk: 'Мідний брусок тієї самої маси нагрів би воду сильніше чи слабше, ніж алюмінієвий?', en: 'Would a copper block of the same mass warm the water more or less than the aluminium one?' },
    id: 'which-metal',
    grade: 8,
    topic: THERMAL,
    title: { uk: 'Алюміній чи мідь: хто нагріє воду сильніше?', en: 'Aluminium or copper: which warms the water more?' },
    question: {
      uk: 'Опускаємо у воду 100 г алюмінію з окропу. А якби це був мідний брусок тієї самої маси — вода нагрілася б сильніше чи слабше?',
      en: 'We drop 100 g of aluminium from boiling water into water. And if it were a copper block of the same mass — would the water warm more or less?',
    },
    // In a calorimeter with its lid on: the heat stays in, the comparison is about the metals.
    params: { roomTemp: 20, lid: true, vessel: 'calorimeter', size: 0.25, material: 'aluminium', liters: 0.15, action: 'settle', substance: 'water', startTemp: 20 },
    setup: [{ kind: 'add', substance: 'aluminium', mass: 0.1, temperature: 100 }],
    choices: [ch('al', 'Алюміній нагріє сильніше', 'Aluminium warms it more'), ch('cu', 'Мідь нагріє сильніше', 'Copper warms it more'), ch('same', 'Однаково — маса ж та сама', 'The same — the mass is the same')],
    formulas: ['thermal.heat-for-temperature-change', 'thermal.equilibrium-temperature'],
    quoteHas: 'баланс',
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 4', topic: 'Тема 2. Внутрішня енергія. Теплові явища', match: 'related', quote: '№ 4. Визначення питомої теплоємності речовини.' }],
    expect: 'reached',
  },
  {
    ask: { uk: 'Що закипить швидше: спирт чи вода?', en: 'Which boils sooner: alcohol or water?' },
    id: 'alcohol-vs-water',
    grade: 8,
    topic: THERMAL,
    title: { uk: 'Що закипить швидше: спирт чи вода?', en: 'Which boils sooner: alcohol or water?' },
    question: { uk: 'Закип’ятимо спирт, а Професор подумки закип’ятить стільки ж води в тому самому стакані. Що закипить швидше? (Підказка: подивись на теплоємність і температуру кипіння.)', en: 'We boil alcohol, and the Professor boils the same amount of water in the same beaker in his mind. Which boils sooner? (Hint: look at the specific heat and the boiling point.)' },
    params: { ...room, ...beaker, action: 'boil', substance: 'ethanol', startTemp: 20, heater: hotplate },
    choices: [ch('alcohol', 'Спирт', 'Alcohol'), ch('water', 'Вода', 'Water'), ch('equal', 'Однаково', 'The same')],
    formulas: ['thermal.heat-for-temperature-change'],
    programs: [{ program: 'ua-nus-2023-hryhorovych-chemistry', grade: 7, item: 'Тема 3. Досліджуємо речовини та суміші', match: 'related', quote: 'Визначення фізичних властивостей речовин (пластичність, крихкість / твердість, електропровідність, колір, температура кипіння / плавлення).' }],
    predict: true,
    expect: 'reached',
  },
  {
    id: 'sea-salt',
    grade: 8,
    topic: THERMAL,
    title: { uk: 'Морська вода своїми руками: куди дінеться сіль?', en: 'Sea water by hand: where does the salt go?' },
    question: { uk: 'Розчини сіль у воді, а потім випари воду. Скільки солі залишиться на дні?', en: 'Dissolve salt in water, then boil the water away. How much salt stays on the bottom?' },
    params: { ...room, vessel: 'pot', size: 1, material: 'steel', liters: 0.5, action: 'boil', substance: 'water', startTemp: 20, heater: hotplate },
    plan: [
      { kind: 'add', substance: 'table-salt', mass: 0.018, temperature: 20 },
      { kind: 'operation', action: 'evaporate', heater: hotplate },
    ],
    choices: [ch('all', 'Уся сіль', 'All the salt'), ch('some', 'Лише частина', 'Only part of it'), ch('none', 'Нічого — вона випарується з водою', 'None — it evaporates with the water')],
    formulas: ['thermal.latent-heat'],
    programs: [{ program: 'ua-nus-2023-hryhorovych-chemistry', grade: 7, item: 'Тема 3. Досліджуємо речовини та суміші', match: 'same', quote: 'Способи й особливості виділення солі й цукру з їх розчинів.' }],
    quoteHas: 'пароутвор',
    expect: 'reached',
  },
  // ---------------------------------------------------------------- 8 grade, electricity
  {
    ask: { uk: 'Чи проводить струм дистильована вода?', en: 'Does distilled water conduct electricity?' },
    id: 'does-water-conduct',
    grade: 8,
    topic: ELECTRIC,
    title: { uk: 'Чи проводить вода струм?', en: 'Does water conduct electricity?' },
    question: { uk: 'Пропусти струм через дистильовану воду, потім досип трохи солі й спробуй ще раз. Чи проводить струм дистильована вода — і чи проводитиме солона?', en: 'Pass a current through distilled water, then add a little salt and try again. Does distilled water conduct — and will salty water?' },
    params: { ...room, ...beaker, action: 'pass-current', substance: 'water', startTemp: 20, supply: bench(0.4), duration: 5 },
    plan: [
      { kind: 'add', substance: 'table-salt', mass: 0.007, temperature: 20 },
      { kind: 'operation', action: 'pass-current', supply: bench(0.4), duration: 5 },
    ],
    choices: [ch('well', 'Так, добре проводить', 'Yes, it conducts well'), ch('barely', 'Ледь-ледь', 'Barely'), ch('never', 'Зовсім не проводить', 'Not at all')],
    formulas: ['electrical.cell-resistance', 'electrical.cell-current'],
    programs: [{ program: 'ua-nus-2023-hryhorovych-chemistry', grade: 9, item: 'Тема 2. Досліджуємо хімічні реакції в розчинах', match: 'same', quote: 'Дослідження електропровідності розчинів електролітів і неелектролітів.' }],
    expect: 'reached',
  },
  {
    id: 'joule-heating',
    grade: 8,
    topic: ELECTRIC,
    title: { uk: 'Нагріти воду струмом', en: 'Heat water with a current' },
    question: { uk: 'Струм нагріває все, крізь що проходить. На скільки градусів нагріється морська вода за 10 хвилин при 30 В?', en: 'A current heats whatever it passes through. By how many degrees will sea water warm in 10 minutes at 30 V?' },
    params: { ...room, ...beaker, action: 'pass-current', substance: 'sea-water', startTemp: 20, supply: bench(1), duration: 10 },
    choices: [ch('few', 'На кілька градусів', 'By a few degrees'), ch('tens', 'На десятки градусів', 'By tens of degrees'), ch('boils', 'Закипить', 'It will boil')],
    formulas: ['electrical.joule-power', 'electrical.cell-current'],
    expect: 'reached',
  },
  {
    id: 'electrolysis',
    grade: 8,
    topic: ELECTRIC,
    title: { uk: 'Скільки водню дає струм?', en: 'How much hydrogen does a current give?' },
    question: { uk: 'Пропусти струм через солону воду й подивись на бульбашки біля електродів. Скільки мілілітрів водню виділиться за 10 хвилин?', en: 'Pass a current through salt water and watch the bubbles at the electrodes. How many millilitres of hydrogen form in 10 minutes?' },
    params: { ...room, ...beaker, action: 'pass-current', substance: 'salt-water-10', startTemp: 20, supply: bench(0.4), duration: 10 },
    choices: [ch('few', 'Кілька мілілітрів', 'A few millilitres'), ch('tens', 'Десятки мілілітрів', 'Tens of millilitres'), ch('hundreds', 'Сотні мілілітрів', 'Hundreds of millilitres')],
    formulas: ['electrical.faraday-moles'],
    programs: [{ program: 'ua-nus-2023-hryhorovych-chemistry', grade: 9, item: 'Тема 2. Досліджуємо хімічні реакції в розчинах', match: 'same', quote: 'Дослідження електропровідності розчинів електролітів і неелектролітів.' }, { program: 'oxfordaqa-igcse-sciences', item: 'Chemistry RP 1', match: 'related', quote: 'Electrolysis (C). Investigating the products formed at the anode and cathode in the electrolysis of copper sulfate solution.' }],
    expect: 'reached',
  },
  {
    id: 'copper-sulfate-electrolysis',
    grade: 8,
    topic: ELECTRIC,
    title: { uk: 'Що з’явиться на катоді?', en: 'What appears on the cathode?' },
    question: { uk: 'Розчини мідний купорос у воді й пропусти струм через графітові електроди. Що з’явиться на катоді (електроді «−»)?', en: 'Dissolve copper sulfate in water and pass a current through graphite electrodes. What appears on the cathode (the “−” electrode)?' },
    params: { ...room, ...beaker, liters: 0.15, action: 'pass-current', substance: 'water', startTemp: 20, supply: { id: 'bench-supply', knob: 0.2, electrodes: 'graphite' }, duration: 10 },
    setup: [{ kind: 'add', substance: 'copper-sulfate', mass: 0.015, temperature: 20, label: { uk: 'Мідний купорос', en: 'Copper sulfate' } }],
    choices: [ch('copper', 'Шар міді', 'A layer of copper'), ch('hydrogen', 'Бульбашки водню', 'Bubbles of hydrogen'), ch('chlorine', 'Хлор', 'Chlorine')],
    formulas: ['electrical.faraday-moles'],
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 9, item: 'ЛР № 3', topic: 'Тема 1. Електричний струм у різних середовищах', match: 'related', quote: '№ 3. Визначення електрохімічного еквівалента речовини.' }, { program: 'ua-nus-2023-hryhorovych-chemistry', grade: 9, item: 'Тема 2. Досліджуємо хімічні реакції в розчинах', match: 'same', quote: 'Дослідження електропровідності розчинів електролітів і неелектролітів.' }, { program: 'oxfordaqa-igcse-sciences', item: 'Chemistry RP 1', match: 'same', quote: 'Electrolysis (C). Investigating the products formed at the anode and cathode in the electrolysis of copper sulfate solution.' }],
    expect: 'reached',
  },
  varied(
    {
      id: 'bubble-speed',
      ask: { uk: 'Чи залежить швидкість бульбашки від її розміру?', en: 'Does a bubble’s speed depend on its size?' },
      grade: 7,
      topic: MOTION,
      title: { uk: 'Бульбашка в пляшці: рівномірний рух', en: 'A bubble in a bottle: uniform motion' },
      params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
      guided: true,
      bench: 'bubble',
      choices: [ch('bigger', 'Більша бульбашка спливає швидше', 'A bigger bubble rises faster'), ch('same', 'Не залежить', 'It does not'), ch('smaller', 'Менша бульбашка спливає швидше', 'A smaller bubble rises faster')],
      choicesAt: 'end',
      answerOnBoard: ['bv:'],
      formulas: ['mechanics.speed'],
      programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 1. Механічний рух', match: 'same', quote: 'Дослідження • виявлення пропорційної залежності між величинами, що описують прямолінійний рівномірний рух', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 8, дослідження: «Знайдіть швидкість її руху. Чи залежить швидкість руху бульбашки від її розмірів?»' } }],
      expect: 'reached',
    },
    {
      // The liquid: the textbook's washing-up liquid (its viscosity an estimate) or glycerol (a table's).
      controls: [{ id: 'liquid', label: { uk: 'Рідина в пляшці', en: 'The liquid in the bottle' }, kind: 'choice', options: [ch('washing-up', 'Рідина для миття посуду', 'Washing-up liquid'), ch('glycerol', 'Гліцерин', 'Glycerol')], value: 'washing-up' }],
      build: (v) => {
        const liquid = String(v['liquid']) as 'washing-up' | 'glycerol';
        const marks = [0.03, 0.06, 0.09, 0.12];
        const what = liquid === 'glycerol' ? { uk: 'гліцерину', en: 'glycerol' } : { uk: 'густої рідини для миття посуду', en: 'thick washing-up liquid' };
        return {
          question: {
            uk: `Прозора пляшка ${what.uk}, на ній — позначки через 3 см. Перевернемо її й стежитимемо за маленькою бульбашкою повітря (≈ 2 мм): запустимо секундомір, коли вона мине нульову позначку, і засікатимемо час на позначках 3, 6, 9 і 12 см. Тоді — те саме з більшою бульбашкою (≈ 4 мм). Чи залежить швидкість бульбашки від її розміру?`,
            en: `A clear bottle of ${what.en} with marks every 3 cm. We turn it over and watch a small air bubble (≈ 2 mm): start the stopwatch as it passes the zero mark and note the time at 3, 6, 9 and 12 cm. Then the same with a bigger bubble (≈ 4 mm). Does a bubble’s speed depend on its size?`,
          },
          plan: [0.002, 0.004].map((diameter) => ({ kind: 'bench', command: { type: 'lab.sink', body: 'bubble', diameter, liquid, marks } }) as const),
        };
      },
    },
  ),
  varied(
    {
      id: 'ball-in-liquids',
      ask: { uk: 'У якій рідині кулька тоне найповільніше?', en: 'In which liquid does the ball sink slowest?' },
      grade: 7,
      topic: INTERACTION,
      title: { uk: 'Кулька в рідинах різної густини', en: 'A ball in liquids of different densities' },
      params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
      guided: true,
      bench: 'sink',
      choices: [ch('glycerol', 'У гліцерині', 'In glycerol'), ch('sunflower-oil', 'В олії', 'In oil'), ch('water', 'У воді', 'In water')],
      choicesAt: 'end',
      answerOnBoard: ['kv:'],
      formulas: ['mechanics.speed'],
      programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'вимірювання: … швидкості руху кульки у рідинах різної густини' }],
      expect: 'reached',
    },
    {
      // The ball's size: a smaller one goes slower in each liquid (in glycerol — as the square of its size).
      controls: [{ id: 'diameter', label: { uk: 'Кулька', en: 'The ball' }, kind: 'choice', options: [ch('1', '1 мм', '1 mm'), ch('1.5', '1,5 мм', '1.5 mm')], value: '1.5' }],
      build: (v) => {
        const diameter = Number(v['diameter']) / 1000;
        const marks = [0.05, 0.1, 0.15];
        const d = String(v['diameter']);
        return {
          question: {
            uk: `Три мірні циліндри: з гліцерином (густина 1261 кг/м³), соняшниковою олією (919 кг/м³) і водою (997 кг/м³), на кожному — позначки через 5 см. Опускатимемо в кожен сталеву кульку діаметром ${d.replace('.', ',')} мм: запустимо секундомір, коли вона мине нульову позначку, і засікатимемо час на позначках 5, 10 і 15 см. Знайдемо швидкість кульки в кожній рідині. У якій рідині кулька тоне найповільніше?`,
            en: `Three measuring cylinders: of glycerol (density 1261 kg/m³), sunflower oil (919 kg/m³) and water (997 kg/m³), each with marks every 5 cm. We drop a steel ball ${d} mm across into each: start the stopwatch as it passes the zero mark and note the time at 5, 10 and 15 cm. We find the ball’s speed in each liquid. In which liquid does it sink slowest?`,
          },
          plan: (['glycerol', 'sunflower-oil', 'water'] as const).map((liquid) => ({ kind: 'bench', command: { type: 'lab.sink', body: 'ball', diameter, liquid, marks } }) as const),
        };
      },
    },
  ),
  varied(
    {
      id: 'electromagnet',
      ask: { uk: 'Що робить електромагніт сильнішим?', en: 'What makes an electromagnet stronger?' },
      grade: 9,
      topic: MAGNETIC,
      title: { uk: 'Робимо електромагніт', en: 'Making an electromagnet' },
      params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
      guided: true,
      bench: 'magnet',
      choices: [ch('both', 'І більший струм, і залізне осердя', 'Both a larger current and an iron core'), ch('current', 'Лише більший струм', 'Only a larger current'), ch('core', 'Лише залізне осердя', 'Only an iron core')],
      choicesAt: 'end',
      answerOnBoard: ['mB:'],
      formulas: ['electrical.compass-field'],
      programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 9, item: 'ЛР № 4', topic: 'Тема 2. Магнітні та електромагнітні явища', match: 'same', quote: '№ 4. Виготовлення електромагніта та вивчення його магнітного поля.' }],
      expect: 'reached',
    },
    {
      // How many turns are wound on the nail: the field grows with them as with the current. Where the lab is: the
      // Earth's field that holds the needle north differs from place to place (Kyiv and New York — examples).
      controls: [
        { id: 'turns', label: { uk: 'Витків на цвяху', en: 'Turns on the nail' }, kind: 'number', unit: '', min: 50, max: 150, step: 50, value: 100 },
        { id: 'place', label: { uk: 'Місто', en: 'City' }, kind: 'place', value: MAGNET_KYIV, en: MAGNET_NEW_YORK },
      ],
      build: (v) => {
        const turns = Number(v['turns']);
        const place = parsePlace(v['place']) ?? parsePlace(MAGNET_KYIV)!;
        const example = v['place'] === MAGNET_KYIV || v['place'] === MAGNET_NEW_YORK;
        const earth = earthField(place.lat, place.lon, modelYear(new Date())).h;
        const uT = (l: 'uk' | 'en') => (earth * 1e6).toFixed(1).replace('.', l === 'uk' ? ',' : '.');
        const at = { place: place.name, earth, ...(example ? { example: true } : {}) };
        return {
          question: {
            uk: `Намотаємо на сталевий цвях ${turns} витків ізольованого дроту й увімкнемо котушку в коло з джерелом, ключем, реостатом і амперметром. Котушку покладемо віссю зі сходу на захід, а на її осі, за 15 см від середини, поставимо компас: без струму його стрілка дивиться на північ — її тримає поле Землі (${place.name}${example ? ', для прикладу' : ''}: його горизонтальна складова ≈ ${uT('uk')} мкТл). Пускатимемо струм 0,5, 1 і 1,5 А й записуватимемо, на скільки градусів відхилилася стрілка. Тоді змінимо напрям струму, а наостанок витягнемо цвях. Що робить електромагніт сильнішим?`,
            en: `We wind ${turns} turns of insulated wire on a steel nail and connect the coil into a circuit with a source, a key, a rheostat and an ammeter. The coil lies with its axis east–west, and on its axis, 15 cm from its middle, stands a compass: with no current its needle looks north — the Earth’s field holds it there (${place.name}${example ? ', for example' : ''}: its horizontal part ≈ ${uT('en')} µT). We let 0.5, 1 and 1.5 A through and write down how many degrees the needle turned. Then we reverse the current, and at last pull the nail out. What makes an electromagnet stronger?`,
          },
          plan: [
            { kind: 'bench', command: { type: 'lab.magnet', current: 0, turns, core: true, ...at } },
            ...[0.5, 1, 1.5].map((current) => ({ kind: 'bench', command: { type: 'lab.magnet', current, turns, core: true, ...at } }) as const),
            { kind: 'bench', command: { type: 'lab.magnet', current: 1.5, turns, core: true, reversed: true, ...at } },
            { kind: 'bench', command: { type: 'lab.magnet', current: 1.5, turns, core: false, ...at } },
          ],
        };
      },
    },
  ),
  varied(
    {
      id: 'electromagnetic-induction',
      ask: { uk: 'Коли в котушці виникає струм?', en: 'When does a current flow in the coil?' },
      grade: 9,
      topic: MAGNETIC,
      title: { uk: 'Магніт і котушка: електромагнітна індукція', en: 'A magnet and a coil: electromagnetic induction' },
      params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
      guided: true,
      bench: 'induct',
      choices: [ch('motion', 'Коли магніт і котушка рухаються одне відносно одного', 'When the magnet and the coil move against each other'), ch('inside', 'Коли магніт лежить у котушці', 'When the magnet lies in the coil'), ch('never', 'Струму від магніту не буде', 'A magnet makes no current')],
      choicesAt: 'end',
      answerOnBoard: ['iE:'],
      formulas: ['electrical.induced-emf'],
      programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 9, item: 'ЛР № 5', topic: 'Тема 2. Магнітні та електромагнітні явища', match: 'same', quote: '№ 5. Дослідження явища електромагнітної індукції.' }],
      expect: 'reached',
    },
    {
      // The coil's turns: more turns — more EMF, but more wire and so more resistance too.
      controls: [{ id: 'turns', label: { uk: 'Витків у котушці', en: 'Turns in the coil' }, kind: 'choice', options: [ch('100', '100', '100'), ch('200', '200', '200'), ch('400', '400', '400')], value: '200' }],
      build: (v) => {
        const turns = Number(v['turns']);
        const fast = 0.3;
        const slow = 1.5;
        return {
          question: {
            uk: `Котушку на ${turns} витків з’єднаємо з міліамперметром, у якого нуль посередині: стрілка відхиляється в той бік, куди йде струм. Покладемо в котушку штабовий магніт; потім швидко витягнемо його й швидко вставимо північним полюсом, потім — повільно, а тоді швидко вставимо південним. Наостанок не рухатимемо магніт, а швидко надінемо на нього котушку. Щоразу запишемо, куди й на скільки відхилилася стрілка. Коли в котушці виникає струм?`,
            en: `We join a coil of ${turns} turns to a milliammeter with its zero in the middle: the needle swings the way the current goes. We put a bar magnet in the coil; then pull it out fast and push it in fast, north pole first, then slowly, and then push it in fast south pole first. At last we keep the magnet still and slip the coil onto it fast. Each time we note which way and how far the needle swung. When does a current flow in the coil?`,
          },
          plan: [
            { kind: 'bench', command: { type: 'lab.induct', move: 'still', pole: 'N', time: fast, turns } },
            { kind: 'bench', command: { type: 'lab.induct', move: 'out', pole: 'N', time: fast, turns } },
            { kind: 'bench', command: { type: 'lab.induct', move: 'in', pole: 'N', time: fast, turns } },
            { kind: 'bench', command: { type: 'lab.induct', move: 'in', pole: 'N', time: slow, turns } },
            { kind: 'bench', command: { type: 'lab.induct', move: 'in', pole: 'S', time: fast, turns } },
            { kind: 'bench', command: { type: 'lab.induct', move: 'coil', pole: 'N', time: fast, turns } },
          ],
        };
      },
    },
  ),
  {
    id: 'diode-black-box',
    ask: { uk: 'Що сховано в «чорній скриньці»?', en: 'What is hidden in the “black box”?' },
    grade: 9,
    topic: MEDIA,
    title: { uk: 'Що в «чорній скриньці»?', en: 'What is in the “black box”?' },
    question: {
      uk: 'Перед нами закрита скринька з двома клемами, A і B. Увімкнемо її в коло з джерелом, ключем, захисним резистором на 100 Ом і мультиметром-міліамперметром. Ставитимемо на джерелі 1, 2 і 3 В і записуватимемо силу струму, а тоді перевернемо скриньку — поміняємо клеми місцями — і повторимо. З напруги й струму знайдемо опір кола R = U / I. Що всередині скриньки?',
      en: 'Here is a closed box with two terminals, A and B. We connect it into a circuit with a source, a key, a 100 Ω protective resistor and a multimeter as a milliammeter. We set the source to 1, 2 and 3 V and write down the current, then turn the box round — swap its terminals — and do the same again. From the voltage and the current we find the circuit’s resistance R = U / I. What is inside the box?',
    },
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'box',
    plan: [false, true].flatMap((reversed) => [1, 2, 3].map((source) => ({ kind: 'bench', command: { type: 'lab.box', source, reversed } }) as const)),
    choices: [ch('resistor', 'Резистор', 'A resistor'), ch('diode', 'Напівпровідниковий діод', 'A semiconductor diode'), ch('open', 'Нічого — коло розірване', 'Nothing — the circuit is broken')],
    choicesAt: 'end',
    answerOnBoard: ['boxR:'],
    formulas: ['electrical.ohm-resistance'],
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 9, item: 'ЛР № 2', topic: 'Тема 1. Електричний струм у різних середовищах', match: 'same', quote: '№ 2. Дослідження електричного опору кола з напівпровідниковим діодом (дослідження «чорної скриньки»).' }],
    expect: 'reached',
  },
  {
    id: 'resistance-temperature',
    ask: { uk: 'Як зміниться опір мідного дроту, коли він нагріється?', en: 'How will the resistance of a copper wire change when it warms up?' },
    grade: 9,
    topic: MEDIA,
    title: { uk: 'Як опір провідника залежить від температури?', en: 'How does a conductor’s resistance depend on temperature?' },
    question: {
      uk: 'У склянці з водою — котушка з тонкого мідного дроту, її кінці під’єднано до мультиметра в режимі вимірювання опору; поруч — термометр. Нагріватимемо воду кип’ятильником і за 20, 40, 60 і 80 °C записуватимемо температуру й опір котушки. Як змінюватиметься опір провідника, коли він нагріватиметься?',
      en: 'In a beaker of water there is a coil of thin copper wire, its ends connected to a multimeter set to measure resistance; a thermometer beside it. We heat the water with an immersion heater and at 20, 40, 60 and 80 °C write down the temperature and the coil’s resistance. How will the conductor’s resistance change as it warms up?',
    },
    // The first reading at room temperature; the heater goes in with the first heating.
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    plan: [
      { kind: 'bench', command: { type: 'lab.ohm' } },
      ...[40, 60, 80].flatMap((target) => [
        { kind: 'operation', action: 'heat-to', target, heater: { id: 'immersion-heater', rating: 500, knob: 1 } } as const,
        { kind: 'bench', command: { type: 'lab.ohm' } } as const,
      ]),
    ],
    choices: [ch('grows', 'Зростатиме', 'It will grow'), ch('falls', 'Зменшуватиметься', 'It will fall'), ch('same', 'Не зміниться', 'It will not change')],
    choicesAt: 'end',
    answerOnBoard: ['alphaT:'],
    board: 'measurements',
    formulas: ['electrical.resistance-temperature'],
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 9, item: 'ЛР № 1', topic: 'Тема 1. Електричний струм у різних середовищах', match: 'same', quote: '№ 1. Дослідження залежності електричного опору провідника від температури.' }],
    expect: 'reached',
  },
  varied(
    {
      id: 'electrochemical-equivalent',
      ask: { uk: 'Яким вийде електрохімічний еквівалент міді?', en: 'What will the electrochemical equivalent of copper come out as?' },
      grade: 9,
      topic: MEDIA,
      title: { uk: 'Визначаємо електрохімічний еквівалент міді', en: 'Finding the electrochemical equivalent of copper' },
      guided: true,
      choices: [ch('table', '≈ 0,33 мг/Кл — як у таблиці для міді', '≈ 0.33 mg/C — as in the table for copper'), ch('more', 'Помітно більшим за табличне', 'Noticeably more than in the table'), ch('less', 'Помітно меншим за табличне', 'Noticeably less than in the table')],
      choicesAt: 'end',
      answerOnBoard: ['kEq:'],
      formulas: ['electrical.faraday-moles'],
      programs: [
        { program: 'ua-nus-2023-kreminskyi', grade: 9, item: 'ЛР № 3', topic: 'Тема 1. Електричний струм у різних середовищах', match: 'same', quote: '№ 3. Визначення електрохімічного еквівалента речовини.' },
        { program: 'ua-nus-2023-holovko', grade: 8, topic: 'Тема 2. Електричні явища', match: 'related', quote: 'електричного струму в розчинах електролітів та газах' },
      ],
      expect: 'reached',
    },
    {
      controls: [{ id: 'minutes', label: { uk: 'Скільки пропускати струм', en: 'How long the current runs' }, kind: 'choice', options: [ch('10', '10 хв', '10 min'), ch('20', '20 хв', '20 min'), ch('30', '30 хв', '30 min')], value: '20' }],
      build: (v) => {
        const min = Number(v['minutes']);
        const supply = { id: 'bench-supply', knob: 0.4, electrodes: 'copper' } as const;
        return {
          question: {
            uk: `У розчин мідного купоросу опустимо дві мідні пластини й під’єднаємо до джерела струму. Зважимо катод (пластину «−»), пропустимо струм ${min} хвилин, тоді вийнемо катод, висушимо й зважимо знову. Електрохімічний еквівалент k = Δm / (I·t) — скільки речовини виділяє кожен кулон заряду. Яким вийде електрохімічний еквівалент міді?`,
            en: `We dip two copper plates into a copper sulfate solution and connect them to a source of current. We weigh the cathode (the “−” plate), pass the current for ${min} minutes, then take the cathode out, dry it and weigh it again. The electrochemical equivalent k = Δm / (I·t) — how much substance each coulomb gives. What will it come out as for copper?`,
          },
          params: { ...room, ...beaker, liters: 0.15, action: 'pass-current', substance: 'water', startTemp: 20, supply, duration: min },
          plan: [
            { kind: 'add', substance: 'copper-sulfate', mass: 0.015, temperature: 20, label: { uk: 'Мідний купорос', en: 'Copper sulfate' } },
            { kind: 'bench', command: { type: 'lab.cathode' } },
            { kind: 'operation', action: 'pass-current', supply, duration: min },
            { kind: 'bench', command: { type: 'lab.cathode' } },
          ],
        };
      },
    },
  ),
  // ---------------------------------------------------------------- for everyone
  {
    ask: { uk: 'Що станеться з олією раніше: закипить чи почне диміти?', en: 'What comes first with oil: boiling or smoke?' },
    id: 'oil-does-not-boil',
    grade: null,
    topic: FUN,
    title: { uk: 'Чи кипить олія?', en: 'Does oil boil?' },
    question: { uk: 'Вода кипить при 100 °C. А олія? Нагрій її й подивись, що станеться раніше.', en: 'Water boils at 100 °C. And oil? Heat it and see what happens first.' },
    params: { ...room, vessel: 'pot', size: 1, material: 'steel', liters: 0.3, action: 'boil', substance: 'sunflower-oil', startTemp: 20, heater: hotplate },
    choices: [ch('boils', 'Закипить, як вода', 'It boils, like water'), ch('smokes', 'Почне диміти раніше, ніж закипить', 'It starts to smoke before it boils')],
    formulas: ['thermal.heat-for-temperature-change'],
    expect: 'decomposes',
  },
  {
    ask: { uk: 'Чи замерзне спирт у морозилці?', en: 'Will alcohol freeze in the freezer?' },
    id: 'alcohol-in-freezer',
    grade: null,
    topic: FUN,
    title: { uk: 'Чи замерзне спирт у морозилці?', en: 'Will alcohol freeze in a freezer?' },
    question: { uk: 'Вода в морозилці стає льодом. А спирт? Перевір і поміркуй, чому так.', en: 'Water turns to ice in a freezer. And alcohol? Check it and think why.' },
    params: { ...room, ...beaker, action: 'freeze', substance: 'ethanol', startTemp: 20, cooler: { id: 'freezer', setpoint: -18 } },
    choices: [ch('yes', 'Так, замерзне', 'Yes, it freezes'), ch('no', 'Ні, лишиться рідким', 'No, it stays liquid')],
    formulas: ['thermal.latent-heat'],
    quoteHas: 'плавлен',
    expect: 'impossible',
  },
  {
    ask: { uk: 'Чи зміниться маса води, коли вона стане льодом?', en: 'Will the mass of the water change when it turns to ice?' },
    id: 'weigh-the-water',
    grade: null,
    topic: FUN,
    title: { uk: 'Чи важчає лід? Зважуємо воду', en: 'Is ice heavier? Weighing the water' },
    question: {
      uk: 'Спершу зваж каструлю з літром води (кнопка «⚖ Зважити»), потім заморозь її, знову зваж, закип’яти — і зваж утретє. Чи зміниться маса, коли вода стане льодом? А коли закипить?',
      en: 'First weigh the pot with a litre of water (the "⚖ Weigh" button), then freeze it, weigh it again, bring it to the boil — and weigh it a third time. Will the mass change when the water turns to ice? And when it boils?',
    },
    params: { ...room, ...pot, action: 'freeze', substance: 'water', startTemp: 20, cooler: { id: 'freezer', setpoint: -18 } },
    plan: [
      { kind: 'weigh', scale: 'kitchen-scale' },
      { kind: 'operation', action: 'boil', heater: hotplate },
      { kind: 'weigh', scale: 'kitchen-scale' },
    ],
    choices: [ch('heavier', 'Лід буде важчим', 'Ice will be heavier'), ch('lighter', 'Лід буде легшим', 'Ice will be lighter'), ch('same', 'Маса не зміниться', 'The mass stays the same')],
    formulas: ['thermal.latent-heat'],
    quoteHas: 'плавлен',
    expect: 'reached',
  },
  {
    id: 'grand-chain',
    grade: null,
    topic: FUN,
    title: { uk: 'Ланцюжок: вода → сіль → струм → вогонь → струм', en: 'A chain: water → salt → current → flame → current' },
    question: { uk: 'Нагрій воду на пальнику, розчини сіль, пропусти струм, ще нагрій — і знову струм. Чи стане струм більшим, коли розчин гарячий?', en: 'Heat water on a burner, dissolve salt, pass a current, heat more — and current again. Will the current be larger when the solution is hot?' },
    params: { ...room, ...beaker, action: 'heat-to', target: 30, substance: 'water', startTemp: 20, heater: { id: 'bunsen-burner', rating: 1200, knob: 1 } },
    plan: [
      { kind: 'add', substance: 'table-salt', mass: 0.007, temperature: 20 },
      { kind: 'operation', action: 'pass-current', supply: bench(0.4), duration: 5 },
      { kind: 'operation', action: 'heat-to', target: 70, heater: { id: 'bunsen-burner', rating: 1200, knob: 1 } },
      { kind: 'operation', action: 'pass-current', supply: bench(0.4), duration: 5 },
    ],
    choices: [ch('more', 'Так, більшим', 'Yes, larger'), ch('less', 'Ні, меншим', 'No, smaller'), ch('same', 'Таким самим', 'The same')],
    formulas: ['electrical.cell-current', 'thermal.heat-for-temperature-change'],
    expect: 'reached',
  },
];

/**
 * The ready-made experiments in the order the programmes take them up: by grade, the topics in turn, and within a
 * topic in the order of its content (Holovko's) with Kreminskyi's lab works by their numbers — the two programmes go
 * the same way. An experiment of several grades stands where its first one puts it (the lever: Holovko's grade 7,
 * topic 4, is Kreminskyi's grade 8, lab work 1 — so it comes last in grade 7 and first in grade 8). Chemistry's own
 * stand before the physics ones they share a list with. Those for everyone — at the end. Every experiment is here
 * (a test checks): a new one is put in its place.
 */
export const PRESET_ORDER: readonly string[] = [
  // Grade 7. Mechanical motion.
  'bubble-speed', 'average-speed', 'rotation-period', 'pendulum',
  // Interaction of bodies. Force: mass, density, elasticity, friction.
  'lever-balance', 'mystery-metal', 'liquid-density', 'hooke-spring', 'friction-coefficient', 'ball-in-liquids',
  // Pressure: of solids; Pascal's law and the pressure at a depth; communicating vessels; the hydraulic machine;
  // the atmosphere's; the buoyant force; floating.
  'block-pressure', 'depth-pressure', 'hydrostatic-paradox', 'communicating-vessels', 'hydraulic-press', 'atmospheric-pressure', 'hydrostatic-weighing', 'archimedes-salt', 'floating-conditions', 'ice-level',
  // Mechanical work and energy (Kreminskyi: grade 8, lab works 1–2).
  'lever-moments', 'slope-efficiency',
  // Chemistry, grade 9, topic 1: solutions.
  'mass-fraction', 'grow-crystals', 'heat-of-solution', 'supersaturated',
  // Grade 8. Thermal phenomena: heat balance (lab work 3), specific heat (4), melting (5), then solidifying,
  // boiling and evaporation.
  'mix-hot-cold', 'specific-heat-water', 'which-metal', 'specific-heat-metal', 'melt-ice', 'ice-latent-heat', 'freeze-water', 'stearic-cooling', 'melt-tin', 'salt-in-pot', 'road-salt', 'alcohol-vs-water', 'lid-or-not', 'sea-salt',
  // Electric phenomena: resistance (6), series (7), parallel (8), power (9), heating by a current and a heater's
  // efficiency (10), the current in solutions.
  'conductor-resistance', 'series-circuit', 'parallel-circuit', 'consumer-power', 'joule-heating', 'boil-a-litre', 'heater-efficiency', 'does-water-conduct', 'electrolysis', 'copper-sulfate-electrolysis',
  // Grade 9. The current in different media (lab works 1–3); magnetic and electromagnetic phenomena (4–5).
  'resistance-temperature', 'diode-black-box', 'electrochemical-equivalent', 'electromagnet', 'electromagnetic-induction',
  // For everyone.
  'oil-does-not-boil', 'alcohol-in-freezer', 'weigh-the-water', 'grand-chain',
];
const rank = (p: Preset) => {
  const k = PRESET_ORDER.indexOf(p.id);
  return k < 0 ? PRESET_ORDER.length + LIST.indexOf(p) : k;
};
export const PRESETS: readonly Preset[] = [...LIST].sort((a, b) => rank(a) - rank(b));

/** Grades that have presets, in order; null (for everyone) last. */
export const PRESET_GRADES: readonly (number | null)[] = [...new Set(PRESETS.map((p) => p.grade))].sort((a, b) => (a ?? 99) - (b ?? 99));

/**
 * Every ready-made experiment is led step by step, like a guided procedure: what goes into the
 * vessel first, then the operation itself, then the rest of the plan — each a button on the page.
 */
export function guidedPlan(p: Preset): ProtocolStep[] {
  if (p.guided) return [...(p.plan ?? [])];
  const q = p.params;
  const first: ProtocolStep = {
    kind: 'operation',
    action: q.action,
    ...(q.target === undefined ? {} : { target: q.target }),
    ...(q.heater ? { heater: q.heater } : {}),
    ...(q.cooler ? { cooler: q.cooler } : {}),
    ...(q.supply ? { supply: q.supply } : {}),
    ...(q.duration === undefined ? {} : { duration: q.duration }),
  };
  return [...(p.setup ?? []), first, ...(p.plan ?? [])];
}
