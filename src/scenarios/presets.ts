import type { LocalizedText } from '../knowledge/i18n.js';
import type { LabParams, LabStatus } from './thermal-lab.js';
import type { ProtocolStep } from './protocol.js';
import { SUBSTANCES, type SubstanceId } from '../substances/catalog.js';
import { COMPONENTS } from '../components/index.js';
import { sandFull, sandToFloatInside, tubeGlass, tubeVolume } from './test-tube.js';
import { PENDULUM_BALLS, ROLL_PATH, THREAD_LENGTH } from './motion-bench.js';

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
  /** The mechanics bench is on the table instead of the vessel: a spring on a stand, a block on a board. */
  readonly bench?: 'spring' | 'friction' | 'pressure' | 'balance' | 'incline' | 'circle' | 'pendulum';
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
);
export type PresetValues = Readonly<Record<string, number | string>>;
export type PresetVariant = Partial<Pick<Preset, 'params' | 'setup' | 'plan' | 'question' | 'choices'>>;
export interface PresetVary {
  readonly controls: readonly PresetControl[];
  readonly build: (v: PresetValues) => PresetVariant;
}

/** The values a preset starts with. */
export const defaultValues = (p: Preset): PresetValues => Object.fromEntries((p.vary?.controls ?? []).map((c) => [c.id, c.value]));
/** The preset with these values: its setup, plan, question and choices built from them. */
export function withValues(p: Preset, v: PresetValues): Preset {
  if (!p.vary) return p;
  const all = { ...defaultValues(p), ...v };
  // Out-of-range or unknown values fall back to the defaults: the experiment stays within its frame.
  const clean = Object.fromEntries(
    p.vary.controls.map((c) => {
      const x = all[c.id];
      if (c.kind === 'number') return [c.id, typeof x === 'number' && x >= c.min && x <= c.max ? x : c.value];
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
const MECH: LocalizedText = { uk: 'Механічні явища: густина й плавання', en: 'Mechanics: density and floating' };
const MOTION: LocalizedText = { uk: 'Механічний рух', en: 'Mechanical motion' };

const room = { roomTemp: 20, lid: false } as const;
/** Metals for the specific-heat lab work: what a school set of calorimeter cylinders has. */
const METALS_FOR_HEAT: readonly Choice[] = (['aluminium', 'copper', 'iron', 'brass', 'steel'] as const).map((id) => ({ id, label: SUBSTANCES[id].name }));
/** Liquids whose density the lab work finds (all fit the balance in a 100 mL cylinder). */
const LIQUIDS_FOR_DENSITY: readonly Choice[] = (['sunflower-oil', 'glycerol', 'ethanol', 'water'] as const).map((id) => ({ id, label: SUBSTANCES[id].name }));
const hotplate = { id: 'electric-hotplate', rating: 2000, knob: 1 } as const;
const bench = (knob: number) => ({ id: 'bench-supply', knob }) as const;
const beaker = { vessel: 'beaker', size: 0.25, material: 'glass', liters: 0.2 } as const;
const pot = { vessel: 'pot', size: 2, material: 'steel', liters: 1 } as const;

export const PRESETS: readonly Preset[] = [
  // ---------------------------------------------------------------- 7 grade, mechanics
  {
    id: 'ice-level',
    grade: 7,
    topic: MECH,
    title: { uk: 'Чи зміниться рівень води, коли лід розтане?', en: 'Will the water level change when the ice melts?' },
    question: {
      uk: 'Опустимо в мензурку з водою кубик льоду — він плаватиме. Запишемо рівень, дочекаємося, поки лід розтане, і подивимося на поділки знову. Як зміниться рівень води, коли лід розтане?',
      en: 'We drop an ice cube into a measuring cylinder of water — it will float. We note the level, wait for the ice to melt and read the marks again. How will the water level change when the ice melts?',
    },
    params: { ...room, vessel: 'cylinder', size: 0.1, material: 'glass', liters: 0.07, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    plan: [
      { kind: 'level' },
      { kind: 'add', substance: 'water', mass: 0.01, temperature: -5, frozen: true, label: { uk: 'Кубик льоду', en: 'Ice cube' } },
      { kind: 'level' },
      // Slow enough to watch the cube shrink (the speed can still be raised).
      { kind: 'operation', action: 'settle', speed: 10, label: { uk: 'Чекати, поки лід розтане', en: 'Wait for the ice to melt' } },
      { kind: 'level' },
    ],
    choices: [ch('up', 'Підніметься', 'It will rise'), ch('down', 'Опуститься', 'It will drop'), ch('same', 'Не зміниться', 'It will stay the same')],
    formulas: ['mechanics.submerged-share'],
    quoteHas: 'плавання',
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 10', topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'related', quote: '№ 10. Перевірка умов плавання тіла.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 35, лабораторна робота № 10, с. 251' } }],
    expect: 'reached',
  },
  {
    id: 'average-speed',
    ask: { uk: 'Де середня швидкість кульки більша: на всьому шляху чи на першій половині?', en: 'Where is the ball’s average speed greater: on the whole path or on its first half?' },
    grade: 7,
    topic: MOTION,
    title: { uk: 'Середня швидкість кульки на жолобі', en: 'The average speed of a ball in a groove' },
    question: {
      uk: 'Жолоб закріпили на штативі під невеликим кутом, на ньому — позначка крейдою, а внизу — металевий циліндр, що зупиняє кульку. Виміряємо шлях і час, за який кулька скотиться від позначки до циліндра, а потім — лише першу половину шляху. Де середня швидкість кульки більша: на всьому шляху чи на першій половині?',
      en: 'A groove is fixed on a stand at a small angle, with a chalk mark on it and a metal cylinder at the bottom to stop the ball. We measure the path and the time the ball takes from the mark to the cylinder, then the first half of the path only. Where is the ball’s average speed greater: on the whole path or on its first half?',
    },
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'incline',
    plan: [
      { kind: 'bench', command: { type: 'lab.tape', what: 'path', length: ROLL_PATH } },
      { kind: 'bench', command: { type: 'lab.roll', path: ROLL_PATH } },
      { kind: 'bench', command: { type: 'lab.roll', path: ROLL_PATH / 2 } },
    ],
    choices: [ch('whole', 'На всьому шляху', 'On the whole path'), ch('half', 'На першій половині', 'On the first half'), ch('same', 'Однакова', 'The same')],
    choicesAt: 'end',
    answerOnBoard: ['roll:'],
    formulas: ['mechanics.average-speed'],
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 1', topic: 'Тема 2. Механічний рух', match: 'same', quote: '№ 1. Визначення середньої швидкості руху тіла.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: 'лабораторна робота № 1, с. 75' } }],
    expect: 'reached',
  },
  {
    id: 'rotation-period',
    ask: { uk: 'Як зміниться період обертання, якщо вкоротити нитку, а коло лишити те саме?', en: 'How does the period change if the thread is shortened and the circle stays the same?' },
    grade: 7,
    topic: MOTION,
    title: { uk: 'Період обертання тіла на нитці', en: 'The period of a body turning on a thread' },
    question: {
      uk: 'Тримаючи нитку за петлю над центром кола радіусом 15 см, розкрутимо тіло так, щоб воно йшло по колу, і виміряємо час 10 обертів. З нього знайдемо період, обертову частоту й швидкість тіла. А потім вкоротимо нитку, а коло лишимо те саме. Як зміниться період обертання?',
      en: 'Holding the thread by its loop over the centre of a 15 cm circle, we swing the body round it and time 10 turns. From that we find the period, the frequency and the body’s speed. Then we shorten the thread and keep the circle. How does the period change?',
    },
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'circle',
    plan: [
      { kind: 'bench', command: { type: 'lab.whirl', thread: THREAD_LENGTH.value, turns: 10 } },
      { kind: 'bench', command: { type: 'lab.whirl', thread: 0.3, turns: 10 } },
    ],
    choices: [ch('shorter', 'Стане меншим — тіло обертатиметься частіше', 'It gets shorter — the body turns more often'), ch('longer', 'Стане більшим', 'It gets longer'), ch('same', 'Не зміниться — коло ж те саме', 'It stays — the circle is the same')],
    choicesAt: 'end',
    formulas: ['mechanics.period'],
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 2', topic: 'Тема 2. Механічний рух', match: 'same', quote: '№ 2. Визначення періоду обертання тіла.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: 'лабораторна робота № 2, с. 87' } }],
    expect: 'reached',
  },
  {
    id: 'pendulum',
    ask: { uk: 'Від чого залежить період коливань маятника: від амплітуди, маси кульки чи довжини нитки?', en: 'What does a pendulum’s period depend on: the amplitude, the ball’s mass or the length?' },
    grade: 7,
    topic: MOTION,
    title: { uk: 'Коливання нитяного маятника', en: 'The swings of a thread pendulum' },
    question: {
      uk: 'Підвісимо до кільця штатива кульку на нитці завдовжки 1 м. Виміряємо час 20 коливань, відхиливши кульку на 2,5 см, потім — на 5,5 см. Тоді замінимо кульку важчою, а наостанок вкоротимо нитку до 25 см. Від чого залежить період коливань маятника?',
      en: 'We hang a ball on a 1 m thread from the stand’s ring. We time 20 swings with the ball pulled 2.5 cm aside, then 5.5 cm. Then we put on a heavier ball, and at last shorten the thread to 25 cm. What does the pendulum’s period depend on?',
    },
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'pendulum',
    plan: [
      { kind: 'bench', command: { type: 'lab.tape', what: 'length', length: 1 } },
      { kind: 'bench', command: { type: 'lab.swing', length: 1, amplitude: 0.025, mass: PENDULUM_BALLS.light, count: 20 } },
      { kind: 'bench', command: { type: 'lab.swing', length: 1, amplitude: 0.055, mass: PENDULUM_BALLS.light, count: 20 } },
      { kind: 'bench', command: { type: 'lab.swing', length: 1, amplitude: 0.025, mass: PENDULUM_BALLS.heavy, count: 20 } },
      { kind: 'bench', command: { type: 'lab.swing', length: 0.25, amplitude: 0.025, mass: PENDULUM_BALLS.light, count: 20 } },
    ],
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
    ask: { uk: 'З якого металу зроблено брусок?', en: 'What metal is the block made of?' },
    id: 'mystery-metal',
    grade: 7,
    topic: MECH,
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
    id: 'floating-conditions',
    ask: { uk: 'За якої умови тіло тоне, плаває всередині рідини, спливає?', en: 'When does a body sink, float inside a liquid, come up?' },
    grade: 7,
    topic: MECH,
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
    topic: MECH,
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
    formulas: ['mechanics.weight'],
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 4', topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: '№ 4. Вимірювання маси тіл.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 16, лабораторна робота № 4, с. 116' } }, { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'Маса тіла. Густина речовини.' }],
    expect: 'reached',
  },
  varied(
    {
      ask: { uk: 'Рідина легша чи важча за воду, якщо порівняти однакові об’єми?', en: 'Is the liquid lighter or heavier than water, for equal volumes?' },
      id: 'liquid-density',
      grade: 7,
      topic: MECH,
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
      topic: MECH,
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
    topic: MECH,
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
    topic: MECH,
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
    topic: MECH,
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
    topic: MECH,
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
    formulas: [],
    programs: [{ program: 'ua-nus-2023-hryhorovych-chemistry', grade: 9, item: 'Тема 1. Досліджуємо розчинність речовин і розчини', match: 'same', quote: 'Виготовлення розчинів із заданою масовою часткою розчиненої речовини.' }],
    expect: 'reached',
  },
  varied(
    {
      id: 'grow-crystals',
      grade: 9,
      topic: SOLUTIONS,
      title: { uk: 'Виростимо кристали мідного купоросу', en: 'Growing copper sulfate crystals' },
      formulas: [],
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
    formulas: [],
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
    formulas: [],
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
    predict: true,
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
  {
    id: 'melt-ice',
    grade: 8,
    topic: THERMAL,
    title: { uk: 'Як тане лід?', en: 'How does ice melt?' },
    question: { uk: 'Поклади лід (−10 °C) у теплу кімнату й стеж за термометром. Що буде з температурою, поки лід тане?', en: 'Put ice (−10 °C) in a warm room and watch the thermometer. What happens to the temperature while the ice melts?' },
    params: { ...room, ...beaker, action: 'melt', substance: 'water', startTemp: -10 },
    choices: [ch('stays', 'Стоїть на місці, поки весь лід не розтане', 'It stands still until all the ice has melted'), ch('rises', 'Весь час росте', 'It keeps rising'), ch('falls', 'Спершу падає нижче', 'It drops lower first')],
    formulas: ['thermal.latent-heat'],
    quoteHas: 'плавлен',
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 5', topic: 'Тема 2. Внутрішня енергія. Теплові явища', match: 'related', quote: '№ 5. Вимірювання питомої теплоти плавлення льоду.' }],
    expect: 'reached',
  },
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
  {
    ask: { uk: 'Якою вийде питома теплоємність води?', en: 'What specific heat of water will it give?' },
    id: 'specific-heat-water',
    grade: 8,
    topic: THERMAL,
    title: { uk: 'Яка питома теплоємність води?', en: 'What is the specific heat of water?' },
    question: { uk: 'Нагрій 200 г води кип’ятильником 500 Вт від 20 до 50 °C. Знаючи потужність і час, порахуй c = P·t / (m·Δt). Яким вийде число?', en: 'Heat 200 g of water with a 500 W immersion heater from 20 to 50 °C. From the power and the time, compute c = P·t / (m·Δt). What number do you get?' },
    params: { ...room, ...beaker, action: 'heat-to', target: 50, substance: 'water', startTemp: 20, heater: { id: 'immersion-heater', rating: 500, knob: 1 } },
    choices: [ch('table', 'Рівно табличне — 4200 Дж/(кг·°C)', 'Exactly the table value — 4200 J/(kg·°C)'), ch('more', 'Більше за табличне', 'More than the table value'), ch('less', 'Помітно менше за табличне', 'Noticeably less than the table value')],
    formulas: ['thermal.heat-for-temperature-change', 'thermal.energy-from-power'],
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 4', topic: 'Тема 2. Внутрішня енергія. Теплові явища', match: 'related', quote: '№ 4. Визначення питомої теплоємності речовини.' }],
    expect: 'reached',
  },
  {
    id: 'heater-efficiency',
    ask: { uk: 'Яка частка енергії кип’ятильника дістанеться воді?', en: 'What share of the heater’s energy will the water get?' },
    grade: 8,
    topic: THERMAL,
    title: { uk: 'Визначаємо ККД електричного нагрівника', en: 'Finding the efficiency of an electric heater' },
    question: {
      uk: 'Нагріємо 200 г води кип’ятильником потужністю 500 Вт (так написано на ньому) від 20 до 60 °C і засічемо час. Корисна теплота — та, що дісталася воді: Q = c·m·Δt; витрачена енергія — E = P·t. ККД η = Q / E. Яка частка енергії кип’ятильника дістанеться воді?',
      en: 'We heat 200 g of water with a 500 W immersion heater (as written on it) from 20 to 60 °C and time it. The useful heat is what the water got: Q = c·m·Δt; the energy spent is E = P·t. The efficiency η = Q / E. What share of the heater’s energy will the water get?',
    },
    params: { ...room, ...beaker, action: 'heat-to', target: 60, substance: 'water', startTemp: 20, heater: { id: 'immersion-heater', rating: 500, knob: 1 } },
    choices: [ch('all', 'Уся — ККД 100 %', 'All of it — 100 %'), ch('most', 'Більша частина, але не вся', 'Most of it, but not all'), ch('half', 'Менше половини', 'Less than half')],
    choicesAt: 'end',
    formulas: ['thermal.heat-for-temperature-change', 'thermal.energy-from-power'],
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 10', topic: 'Тема 3. Електричні явища', match: 'same', quote: '№ 10. Визначення ККД електричного нагрівника.' }, { program: 'ua-nus-2023-holovko', grade: 8, topic: 'Тема 1. Теплові явища', match: 'same', quote: 'визначення: питомої теплоємності твердого тіла; ККД нагрівника' }],
    expect: 'reached',
  },
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
  {
    id: 'electrochemical-equivalent',
    ask: { uk: 'Яким вийде електрохімічний еквівалент міді?', en: 'What will the electrochemical equivalent of copper come out as?' },
    grade: 9,
    topic: ELECTRIC,
    title: { uk: 'Визначаємо електрохімічний еквівалент міді', en: 'Finding the electrochemical equivalent of copper' },
    question: {
      uk: 'У розчин мідного купоросу опустимо дві мідні пластини й під’єднаємо до джерела струму. Зважимо катод (пластину «−»), пропустимо струм 20 хвилин, тоді вийнемо катод, висушимо й зважимо знову. Електрохімічний еквівалент k = Δm / (I·t) — скільки речовини виділяє кожен кулон заряду. Яким вийде електрохімічний еквівалент міді?',
      en: 'We dip two copper plates into a copper sulfate solution and connect them to a source of current. We weigh the cathode (the “−” plate), pass the current for 20 minutes, then take the cathode out, dry it and weigh it again. The electrochemical equivalent k = Δm / (I·t) — how much substance each coulomb gives. What will it come out as for copper?',
    },
    params: { ...room, ...beaker, liters: 0.15, action: 'pass-current', substance: 'water', startTemp: 20, supply: { id: 'bench-supply', knob: 0.4, electrodes: 'copper' }, duration: 20 },
    guided: true,
    plan: [
      { kind: 'add', substance: 'copper-sulfate', mass: 0.015, temperature: 20, label: { uk: 'Мідний купорос', en: 'Copper sulfate' } },
      { kind: 'bench', command: { type: 'lab.cathode' } },
      { kind: 'operation', action: 'pass-current', supply: { id: 'bench-supply', knob: 0.4, electrodes: 'copper' }, duration: 20 },
      { kind: 'bench', command: { type: 'lab.cathode' } },
    ],
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
