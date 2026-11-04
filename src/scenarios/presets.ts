import type { Locale, LocalizedText } from '../knowledge/i18n.js';
import { localized, msg } from '../knowledge/messages.js';
import type { LabParams, LabStatus } from './thermal-lab.js';
import type { ProtocolStep } from './protocol.js';
import type { ExperimentKind } from '../experiments/index.js';
import { CARDS } from '../experiments/cards.js';
import { SUBSTANCES, type SubstanceId } from '../substances/catalog.js';
import { COMPONENTS } from '../components/index.js';
import { sandFull, sandToFloatInside, tubeGlass, tubeVolume } from './test-tube.js';

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
  /**
   * An experiment with a catch: the belief most people hold, which it overturns (one sentence). When the prediction
   * falls for it — or there was none — the Professor giggles at the answer.
   */
  readonly trick?: LocalizedText;
  /**
   * Stories from beyond the lesson (history, culture), each with its source among the knowledge's sources: one of them,
   * at random, closes «Чому так?» each time the experiment is done.
   */
  readonly asides?: readonly LocalizedText[];
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
  /** What stands on the table, when it is not the bench's usual (one bench, another set: a bubble in washing-up liquid). */
  readonly benchSetup?: LocalizedText;
  readonly bench?: ExperimentKind;
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
/** A unit a number may be put in: its symbol (`unit-sym-<id>` in units.ftl) and how many of the control's own units it is. */
export interface ControlUnit {
  readonly id: string;
  readonly factor: number;
}
export type PresetControl = { readonly id: string; readonly label: LocalizedText } & (
  // A number within its frame; `step` 0 — any value at all (the pupil's own measurement), otherwise kept on its step.
  // `unit` — its symbol's id (`unit-sym-<id>` in units.ftl; '' — a bare number). `units` — the units it may be put in
  // (a number and a unit to choose): the value is kept in the one of factor 1.
  | { readonly kind: 'number'; readonly unit: string; readonly min: number; readonly max: number; readonly step: number; readonly value: number; readonly units?: readonly ControlUnit[] }
  | { readonly kind: 'choice'; readonly options: readonly Choice[]; readonly value: string }
  // A place on the Earth, as «name|latitude|longitude»: the default for Ukrainian, another for English (an example each).
  | { readonly kind: 'place'; readonly value: string; readonly en: string }
);
export { parsePlace, placeValue, type Place } from './place.js';
import { parsePlace } from './place.js';
import { defaultValues, ELECTRIC, MEDIA, varied } from './preset-kit.js';
export { defaultValues };
export type PresetValues = Readonly<Record<string, number | string>>;
export type PresetVariant = Partial<Pick<Preset, 'params' | 'setup' | 'plan' | 'question' | 'choices'>>;
export interface PresetVary {
  readonly controls: readonly PresetControl[];
  readonly build: (v: PresetValues) => PresetVariant;
}

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
const ch = (id: string, label: LocalizedText): Choice => ({ id, label });
/** Every solid body on the shelf (what a density table lists), by density. */
export const DENSITY_TABLE: readonly Choice[] = Object.values(SUBSTANCES)
  .filter((s) => s.category === 'solid.metal' || s.category === 'solid.material')
  .sort((a, b) => a.liquid.density.value - b.liquid.density.value)
  .map((s) => ({ id: s.id, label: s.name }));

/** The question over the choices: the preset's own `ask`, or the last sentence of its text that asks something. */
export function presetAsk(p: Preset): LocalizedText {
  const last = (t: string) => (t.match(/[^.!?…]*\?/g) ?? []).pop()?.trim() ?? '';
  return p.ask ?? localized((l: Locale) => last(p.question[l]));
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

const THERMAL: LocalizedText = msg('preset-thermal');
const FUN: LocalizedText = msg('preset-fun');
const SOLUTIONS: LocalizedText = msg('preset-solutions');
// The physics topics as the programmes name them (grade 7: Holovko's four; 9: Kreminskyi's), in their order.
const INTRO: LocalizedText = msg('preset-intro');
const MOTION: LocalizedText = msg('preset-motion');
const INTERACTION: LocalizedText = msg('preset-interaction');
const PRESSURE: LocalizedText = msg('preset-pressure');
const WORK: LocalizedText = msg('preset-work');

const room = { roomTemp: 20, lid: false } as const;
/** Metals for the specific-heat lab work: what a school set of calorimeter cylinders has. */
const METALS_FOR_HEAT: readonly Choice[] = (['aluminium', 'copper', 'iron', 'brass', 'steel'] as const).map((id) => ({ id, label: SUBSTANCES[id].name }));
const hotplate = { id: 'electric-hotplate', rating: 2000, knob: 1 } as const;
const bench = (knob: number) => ({ id: 'bench-supply', knob }) as const;
const beaker = { vessel: 'beaker', size: 0.25, material: 'glass', liters: 0.2 } as const;

const pot = { vessel: 'pot', size: 2, material: 'steel', liters: 1 } as const;


const LIST: readonly Preset[] = [
  // ---------------------------------------------------------------- 7 grade, mechanics
  varied(
    {
      id: 'ice-level',
      grade: 7,
      topic: PRESSURE,
      title: msg('preset-ice-level-list-title'),
      question: msg('preset-ice-level-list-question'),
      params: { ...room, vessel: 'cylinder', size: 0.1, material: 'glass', liters: 0.07, action: 'settle', substance: 'water', startTemp: 20 },
      guided: true,
      choices: [ch('up', msg('preset-ice-level-list-choices')), ch('down', msg('preset-ice-level-list-choices-2')), ch('same', msg('preset-ice-level-list-choices-3'))],
      formulas: ['mechanics.submerged-share'],
      quoteHas: 'плавання',
      programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 10', topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'related', quote: '№ 10. Перевірка умов плавання тіла.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 35, лабораторна робота № 10, с. 251' } }],
      expect: 'reached',
    },
    {
      // A cube that the 100 ml cylinder with 70 ml of water takes, and whose few millilitres its marks still show.
      controls: [{ id: 'cube', label: msg('preset-cube-controls-label'), kind: 'choice', options: [ch('5', msg('preset-cube-controls-options')), ch('10', msg('preset-cube-controls-options-2')), ch('20', msg('preset-cube-controls-options-3'))], value: '10' }],
      build: (v) => ({
        plan: [
          { kind: 'level' },
          { kind: 'add', substance: 'water', mass: Number(v['cube']) / 1000, temperature: -5, frozen: true, label: msg('preset-cube-controls-label') },
          { kind: 'level' },
          // Slow enough to watch the cube shrink (the speed can still be raised).
          { kind: 'operation', action: 'settle', speed: 10, label: msg('preset-plan-label') },
          { kind: 'level' },
        ],
      }),
    },
  ),
  {
    ask: msg('preset-mystery-metal-list-ask'),
    id: 'mystery-metal',
    grade: 7,
    topic: INTERACTION,
    title: msg('preset-mystery-metal-list-title'),
    question: msg('preset-mystery-metal-list-question'),
    params: { ...room, vessel: 'cylinder', size: 0.1, material: 'glass', liters: 0.05, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    plan: [
      { kind: 'weigh', scale: 'lab-balance' },
      { kind: 'level' },
      // Copper: its nearest neighbour in the table (brass) is 4.5 % off, more than the cylinder's half-division error
      // on 20 mL; iron and steel (7874 / 7850) could not be told apart this way.
      { kind: 'add', substance: 'copper', mass: 0.179, temperature: 20, label: msg('preset-mystery-metal-plan-label') },
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
    ask: msg('preset-floating-conditions-list-ask'),
    grade: 7,
    topic: PRESSURE,
    title: msg('preset-floating-conditions-list-title'),
    question: msg('preset-floating-conditions-list-question'),
    params: { ...room, vessel: 'cylinder', size: 0.1, material: 'glass', liters: 0.05, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    plan: [
      { kind: 'weigh', scale: 'lab-balance' },
      { kind: 'level' },
      { kind: 'add', substance: 'glass', mass: tubeGlass() + sandFull(), volume: tubeVolume(), temperature: 20, label: msg('preset-floating-conditions-plan-label') },
      { kind: 'weigh', scale: 'lab-balance' },
      { kind: 'level' },
      { kind: 'fresh', label: msg('preset-floating-conditions-plan-label-2') },
      { kind: 'weigh', scale: 'lab-balance' },
      { kind: 'level' },
      // As much sand as makes its mean density that of the water (rounded to a tenth of a gram — a pinch).
      { kind: 'add', substance: 'glass', mass: tubeGlass() + Math.round(sandToFloatInside(COMPONENTS.water.phases.liquid!.density!.value) * 1e4) / 1e4, volume: tubeVolume(), temperature: 20, label: msg('preset-floating-conditions-plan-label-3') },
      { kind: 'weigh', scale: 'lab-balance' },
      { kind: 'level' },
      { kind: 'fresh', label: msg('preset-floating-conditions-plan-label-4') },
      { kind: 'weigh', scale: 'lab-balance' },
      { kind: 'add', substance: 'glass', mass: tubeGlass() + 0.001, volume: tubeVolume(), temperature: 20, label: msg('preset-floating-conditions-plan-label-5') },
      // (No cylinder now: the tube is not all under water, the level would tell only the part that is — its volume is that of run 1.)
      { kind: 'weigh', scale: 'lab-balance' },
    ],
    choices: [
      ch('density', msg('preset-floating-conditions-list-choices')),
      ch('mass', msg('preset-floating-conditions-list-choices-2')),
      ch('volume', msg('preset-floating-conditions-list-choices-3')),
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
    ask: msg('preset-hydrostatic-weighing-list-ask'),
    id: 'hydrostatic-weighing',
    grade: 7,
    topic: PRESSURE,
    title: msg('preset-hydrostatic-weighing-list-title'),
    question: msg('preset-hydrostatic-weighing-list-question'),
    params: { ...room, ...beaker, liters: 0.2, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    plan: [
      { kind: 'hang', substance: 'aluminium', mass: 0.4, into: 'air', label: msg('preset-hydrostatic-weighing-plan-label') },
      { kind: 'hang', substance: 'aluminium', mass: 0.4, into: 'liquid', label: msg('preset-hydrostatic-weighing-plan-label') },
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
    title: msg('preset-archimedes-salt-list-title'),
    question: msg('preset-archimedes-salt-list-question'),
    params: { ...room, ...beaker, liters: 0.15, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    plan: [
      { kind: 'hang', substance: 'aluminium', mass: 0.25, into: 'air' },
      { kind: 'hang', substance: 'aluminium', mass: 0.25, into: 'liquid' },
      { kind: 'add', substance: 'table-salt', mass: 0.04, temperature: 20 },
      { kind: 'hang', substance: 'aluminium', mass: 0.25, into: 'liquid' },
    ],
    choices: [ch('fresh', msg('preset-archimedes-salt-list-choices')), ch('salt', msg('preset-archimedes-salt-list-choices-2')), ch('same', msg('preset-archimedes-salt-list-choices-3'))],
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
    title: msg('preset-mass-fraction-list-title'),
    question: msg('preset-mass-fraction-list-question'),
    params: { ...room, ...beaker, liters: 45 / SUBSTANCES.water.liquid.density.value, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    plan: [
      { kind: 'weigh', scale: 'lab-balance' },
      { kind: 'add', substance: 'table-salt', mass: 0.005, temperature: 20 },
      { kind: 'weigh', scale: 'lab-balance' },
    ],
    // 11 % is the usual slip: 5 g of salt over the 45 g of water instead of over the whole 50 g of solution.
    choices: [ch('5', msg('preset-mass-fraction-list-choices')), ch('10', msg('preset-mass-fraction-list-choices-2')), ch('11', msg('preset-mass-fraction-list-choices-3')), ch('50', msg('preset-mass-fraction-list-choices-4'))],
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
      title: msg('preset-grow-crystals-list-title'),
      formulas: ['thermal.crystals-on-cooling'],
      programs: [{ program: 'ua-nus-2023-hryhorovych-chemistry', grade: 9, item: 'Тема 1. Досліджуємо розчинність речовин і розчини', match: 'same', quote: 'Вирощування кристалів.' }],
      expect: 'reached',
    },
    {
      controls: [
        // At least what 100 mL do not dissolve at 20 °C (32 g), at most what they dissolve at 60 °C (61.8 g).
        { id: 'salt', label: msg('preset-salt-controls-label'), kind: 'number', unit: 'g', min: 35, max: 60, step: 5, value: 50 },
        { id: 'hot', label: msg('preset-hot-controls-label'), kind: 'number', unit: 'degC', min: 60, max: 80, step: 5, value: 60 },
      ],
      build: (v) => {
        const [salt, hot] = [Number(v['salt']), Number(v['hot'])];
        return {
          question: msg('preset-build-question', { salt: String(salt), hot: String(hot) }),
          params: { ...room, ...beaker, liters: 0.1, action: 'heat-to', target: hot, substance: 'water', startTemp: 20, heater: { ...hotplate, knob: 0.5 } },
          setup: [{ kind: 'add', substance: 'copper-sulfate', mass: salt / 1000, temperature: 20 }],
          plan: [{ kind: 'operation', action: 'cool-to', target: 20, cooler: { id: 'fridge', setpoint: 4 } }],
          choices: [ch('none', msg('preset-build-choices')), ch('part', msg('preset-build-choices-2')), ch('all', msg('preset-build-choices-3', { salt: String(salt) }))],
        };
      },
    },
  ),
  {
    id: 'heat-of-solution',
    grade: 9,
    topic: SOLUTIONS,
    title: msg('preset-heat-of-solution-list-title'),
    question: msg('preset-heat-of-solution-list-question'),
    params: { ...room, ...beaker, liters: 0.1, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    plan: [
      { kind: 'add', substance: 'ammonium-chloride', mass: 0.02, temperature: 20 },
      { kind: 'operation', action: 'settle', speed: 10, label: msg('preset-heat-of-solution-plan-label') },
      { kind: 'fresh', label: msg('preset-heat-of-solution-plan-label-2') },
      { kind: 'add', substance: 'caustic-soda', mass: 0.01, temperature: 20 },
      { kind: 'operation', action: 'settle', speed: 10, label: msg('preset-heat-of-solution-plan-label') },
    ],
    choices: [ch('both-cold', msg('preset-heat-of-solution-list-choices')), ch('cold-hot', msg('preset-heat-of-solution-list-choices-2')), ch('both-hot', msg('preset-heat-of-solution-list-choices-3')), ch('same', msg('preset-heat-of-solution-list-choices-4'))],
    formulas: ['thermal.heat-of-solution'],
    programs: [
      { program: 'ua-nus-2023-hryhorovych-chemistry', grade: 9, item: 'Тема 1. Досліджуємо розчинність речовин і розчини', match: 'same', quote: 'Дослідження виділення або поглинання теплоти розчину під час розчинення.' },
      { program: 'ua-nus-2023-hryhorovych-chemistry', grade: 9, item: 'Тема 1. Досліджуємо розчинність речовин і розчини', match: 'related', quote: 'Моделювання: виготовлення хімічних обігрівачів або охолоджувачів для побутового застосування з використанням процесів розчинення / кристалізації.' },
    ],
    expect: 'reached',
  },
  {
    ask: msg('preset-supersaturated-list-ask'),
    id: 'supersaturated',
    grade: 9,
    topic: SOLUTIONS,
    title: msg('preset-supersaturated-list-title'),
    question: msg('preset-supersaturated-list-question'),
    params: { ...room, vessel: 'test-tube', size: 0.02, material: 'glass', liters: 0.004, action: 'heat-to', target: 70, substance: 'water', startTemp: 20, heater: { id: 'spirit-lamp', rating: 100, knob: 1 } },
    setup: [{ kind: 'add', substance: 'sodium-acetate', mass: 0.02, temperature: 20 }],
    plan: [
      { kind: 'operation', action: 'cool-to', target: 22, label: msg('preset-supersaturated-plan-label') },
      { kind: 'add', substance: 'sodium-acetate', mass: 0.0002, temperature: 20, label: msg('preset-supersaturated-plan-label-2') },
      { kind: 'operation', action: 'settle', label: msg('preset-supersaturated-plan-label-3') },
    ],
    choices: [
      ch('on-cooling', msg('preset-supersaturated-list-choices')),
      ch('warm', msg('preset-supersaturated-list-choices-2')),
      ch('cold', msg('preset-supersaturated-list-choices-3')),
      ch('nothing', msg('preset-supersaturated-list-choices-4')),
    ],
    formulas: ['thermal.heat-of-solution', 'thermal.crystals-on-cooling'],
    programs: [{ program: 'ua-nus-2023-hryhorovych-chemistry', grade: 9, item: 'Тема 1. Досліджуємо розчинність речовин і розчини', match: 'same', quote: 'Виготовлення та дослідження пересичених розчинів.' }],
    expect: 'reached',
  },
  // ---------------------------------------------------------------- 8 grade, heat
  {
    ask: msg('preset-ice-latent-heat-list-ask'),
    id: 'ice-latent-heat',
    grade: 8,
    topic: THERMAL,
    title: msg('preset-ice-latent-heat-list-title'),
    question: msg('preset-ice-latent-heat-list-question'),
    params: { roomTemp: 20, lid: true, vessel: 'calorimeter', size: 0.25, material: 'aluminium', liters: 0.15, action: 'settle', substance: 'water', startTemp: 45 },
    plan: [
      { kind: 'add', substance: 'water', mass: 0.02, temperature: -1, frozen: true, label: msg('preset-ice-latent-heat-plan-label') },
      { kind: 'operation', action: 'settle', label: msg('preset-ice-latent-heat-plan-label-2') },
    ],
    choices: [ch('table', msg('preset-ice-latent-heat-list-choices')), ch('less', msg('preset-ice-latent-heat-list-choices-2')), ch('more', msg('preset-ice-latent-heat-list-choices-3'))],
    formulas: ['thermal.latent-heat', 'thermal.heat-for-temperature-change'],
    quoteHas: 'плавлен',
    programs: [{ program: 'ua-nus-2023-holovko', grade: 8, topic: 'Тема 1. Теплові явища', match: 'related', quote: 'зміни агрегатних станів внаслідок поглинання / виділення тепла' }, { program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 5', topic: 'Тема 2. Внутрішня енергія. Теплові явища', match: 'same', quote: '№ 5. Вимірювання питомої теплоти плавлення льоду.' }],
    expect: 'reached',
  },
  varied(
    {
      ask: msg('preset-specific-heat-metal-list-ask'),
      id: 'specific-heat-metal',
      grade: 8,
      topic: THERMAL,
      title: msg('preset-specific-heat-metal-list-title'),
      formulas: ['thermal.heat-for-temperature-change', 'thermal.equilibrium-temperature'],
      quoteHas: 'баланс',
      programs: [{ program: 'ua-nus-2023-holovko', grade: 8, topic: 'Тема 1. Теплові явища', match: 'same', quote: 'визначення: питомої теплоємності твердого тіла' }, { program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 4', topic: 'Тема 2. Внутрішня енергія. Теплові явища', match: 'same', quote: '№ 4. Визначення питомої теплоємності речовини.' }],
      expect: 'reached',
    },
    {
      controls: [
        { id: 'metal', label: msg('preset-metal-controls-label'), kind: 'choice', options: METALS_FOR_HEAT, value: 'aluminium' },
        { id: 'mass', label: msg('preset-mass-controls-label'), kind: 'number', unit: 'g', min: 50, max: 200, step: 10, value: 100 },
        { id: 'water', label: msg('preset-water-controls-label'), kind: 'number', unit: 'mL', min: 100, max: 200, step: 10, value: 150 },
      ],
      build: (v) => {
        const metal = SUBSTANCES[v['metal'] as SubstanceId];
        const [mass, water] = [Number(v['mass']), Number(v['water'])];
        const c = Math.round(metal.liquid.specificHeat.value / 10) * 10;
        const gen = (l: 'uk' | 'en') => (metal.genitive?.[l] ?? metal.name[l]).toLowerCase();
        return {
          question: msg('preset-build-question-2', { value: (l: Locale) => gen(l), mass: String(mass), water: String(water) }),
          params: { roomTemp: 20, lid: true, vessel: 'calorimeter', size: 0.25, material: 'aluminium', liters: water / 1000, action: 'settle', substance: 'water', startTemp: 20 },
          setup: [{ kind: 'add', substance: metal.id as SubstanceId, mass: mass / 1000, temperature: 100 }],
          choices: [ch('table', msg('preset-build-choices-4', { c: String(c) })), ch('less', msg('preset-build-choices-5')), ch('more', msg('preset-build-choices-6'))],
        };
      },
    },
  ),
  {
    id: 'boil-a-litre',
    grade: 8,
    topic: THERMAL,
    title: msg('preset-boil-a-litre-list-title'),
    question: msg('preset-boil-a-litre-list-question'),
    params: { ...room, ...pot, action: 'boil', substance: 'water', startTemp: 20, heater: hotplate },
    formulas: ['thermal.heat-for-temperature-change'],
    choices: [ch('longer', msg('preset-boil-a-litre-list-choices')), ch('paper', msg('preset-boil-a-litre-list-choices-2')), ch('shorter', msg('preset-boil-a-litre-list-choices-3'))],
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 10', topic: 'Тема 3. Електричні явища. Електричний струм', match: 'related', quote: '№ 10. Визначення ККД електричного нагрівника.' }],
    expect: 'reached',
  },
  {
    id: 'lid-or-not',
    grade: 8,
    topic: THERMAL,
    title: msg('preset-lid-or-not-list-title'),
    question: msg('preset-lid-or-not-list-question'),
    params: { ...pot, roomTemp: 20, lid: true, action: 'boil', substance: 'water', startTemp: 20, heater: { id: 'gas-hob', rating: 1500, knob: 1 } },
    // Two real runs side by side: the second starts afresh (cold pot, fresh water) — only the lid differs.
    plan: [
      { kind: 'fresh', lid: false, label: msg('preset-lid-or-not-plan-label') },
      { kind: 'operation', action: 'boil', heater: { id: 'gas-hob', rating: 1500, knob: 1 } },
    ],
    choices: [ch('lid', msg('preset-lid-or-not-list-choices')), ch('no-lid', msg('preset-lid-or-not-list-choices-2')), ch('equal', msg('preset-archimedes-salt-list-choices-3'))],
    formulas: ['thermal.heat-for-temperature-change', 'thermal.latent-heat'],
    quoteHas: 'пароутвор',
    expect: 'reached',
  },
  varied(
    {
      id: 'melt-ice',
      grade: 8,
      topic: THERMAL,
      title: msg('preset-melt-ice-list-title'),
      choices: [ch('stays', msg('preset-melt-ice-list-choices')), ch('rises', msg('preset-melt-ice-list-choices-2')), ch('falls', msg('preset-melt-ice-list-choices-3'))],
      formulas: ['thermal.latent-heat'],
      quoteHas: 'плавлен',
      programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 5', topic: 'Тема 2. Внутрішня енергія. Теплові явища', match: 'related', quote: '№ 5. Вимірювання питомої теплоти плавлення льоду.' }],
      expect: 'reached',
    },
    {
      controls: [{ id: 'cold', label: msg('preset-cold-controls-label'), kind: 'number', unit: 'degC', min: -20, max: -5, step: 5, value: -10 }],
      build: (v) => {
        const t = Number(v['cold']);
        const n = `−${-t}`;
        return {
          question: msg('preset-build-question-3', { n }),
          params: { ...room, ...beaker, action: 'melt', substance: 'water', startTemp: t },
        };
      },
    },
  ),
  {
    id: 'melt-tin',
    grade: 8,
    topic: THERMAL,
    title: msg('preset-melt-tin-list-title'),
    question: msg('preset-melt-tin-list-question'),
    params: { ...room, vessel: 'crucible', size: 0.03, material: 'porcelain', liters: 0.05 / 7.289, action: 'melt', substance: 'tin', startTemp: 20, heater: { id: 'spirit-lamp', rating: 100, knob: 1 } },
    choices: [ch('stays', msg('preset-melt-tin-list-choices')), ch('rises', msg('preset-melt-tin-list-choices-2')), ch('falls', msg('preset-melt-tin-list-choices-3'))],
    formulas: ['thermal.latent-heat', 'thermal.heat-for-temperature-change'],
    programs: [{ program: 'ua-nus-2023-hryhorovych-chemistry', grade: 7, item: 'Тема 3. Досліджуємо речовини та суміші', match: 'related', quote: 'Визначення фізичних властивостей речовин (пластичність, крихкість / твердість, електропровідність, колір, температура кипіння / плавлення).' }],
    quoteHas: 'плавлен',
    expect: 'reached',
  },
  {
    id: 'stearic-cooling',
    grade: 8,
    topic: THERMAL,
    title: msg('preset-stearic-cooling-list-title'),
    question: msg('preset-stearic-cooling-list-question'),
    params: { ...room, vessel: 'test-tube', size: 0.02, material: 'glass', liters: 10 / 940.8, action: 'melt', substance: 'stearic-acid', startTemp: 20, heater: { id: 'spirit-lamp', rating: 100, knob: 1 } },
    plan: [{ kind: 'operation', action: 'freeze', label: msg('preset-stearic-cooling-plan-label') }],
    choices: [ch('stays', msg('preset-stearic-cooling-list-choices')), ch('falls', msg('preset-stearic-cooling-list-choices-2')), ch('rises', msg('preset-stearic-cooling-list-choices-3'))],
    formulas: ['thermal.latent-heat'],
    quoteHas: 'плавлен',
    programs: [{ program: 'oxfordaqa-igcse-sciences', item: 'Physics RP 3', match: 'same', quote: 'Cooling curves (P). Investigating the cooling curve of stearic acid.' }],
    expect: 'reached',
  },
  varied(
    {
      ask: msg('preset-specific-heat-water-list-ask'),
      id: 'specific-heat-water',
      grade: 8,
      topic: THERMAL,
      title: msg('preset-specific-heat-water-list-title'),
      choices: [ch('table', msg('preset-specific-heat-water-list-choices')), ch('more', msg('preset-specific-heat-water-list-choices-2')), ch('less', msg('preset-specific-heat-water-list-choices-3'))],
      formulas: ['thermal.heat-for-temperature-change', 'thermal.energy-from-power'],
      programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 4', topic: 'Тема 2. Внутрішня енергія. Теплові явища', match: 'related', quote: '№ 4. Визначення питомої теплоємності речовини.' }],
      expect: 'reached',
    },
    {
      // No more than the beaker (250 ml) takes with the heater in it.
      controls: [{ id: 'water', label: msg('preset-water-controls-label-2'), kind: 'number', unit: 'g', min: 100, max: 200, step: 50, value: 200 }],
      build: (v) => {
        const g = Number(v['water']);
        return {
          question: msg('preset-build-question-4', { g: String(g) }),
          params: { ...room, ...beaker, liters: g / SUBSTANCES.water.liquid.density.value, action: 'heat-to', target: 50, substance: 'water', startTemp: 20, heater: { id: 'immersion-heater', rating: 500, knob: 1 } },
        };
      },
    },
  ),
  varied(
    {
      id: 'heater-efficiency',
      ask: msg('preset-heater-efficiency-list-ask'),
      grade: 8,
      topic: THERMAL,
      title: msg('preset-heater-efficiency-list-title'),
      choices: [ch('all', msg('preset-heater-efficiency-list-choices')), ch('most', msg('preset-heater-efficiency-list-choices-2')), ch('half', msg('preset-heater-efficiency-list-choices-3'))],
      choicesAt: 'end',
      formulas: ['thermal.heat-for-temperature-change', 'thermal.energy-from-power'],
      programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 10', topic: 'Тема 3. Електричні явища', match: 'same', quote: '№ 10. Визначення ККД електричного нагрівника.' }, { program: 'ua-nus-2023-holovko', grade: 8, topic: 'Тема 1. Теплові явища', match: 'same', quote: 'визначення: питомої теплоємності твердого тіла; ККД нагрівника' }],
      expect: 'reached',
    },
    {
      // No more than the beaker (250 ml) takes with the heater in it.
      controls: [{ id: 'water', label: msg('preset-water-controls-label-2'), kind: 'number', unit: 'g', min: 100, max: 200, step: 50, value: 200 }],
      build: (v) => {
        const g = Number(v['water']);
        return {
          question: msg('preset-build-question-5', { g: String(g) }),
          params: { ...room, ...beaker, liters: g / SUBSTANCES.water.liquid.density.value, action: 'heat-to', target: 60, substance: 'water', startTemp: 20, heater: { id: 'immersion-heater', rating: 500, knob: 1 } },
        };
      },
    },
  ),
  {
    ask: msg('preset-salt-in-pot-list-ask'),
    id: 'salt-in-pot',
    grade: 8,
    topic: THERMAL,
    title: msg('preset-salt-in-pot-list-title'),
    question: msg('preset-salt-in-pot-list-question'),
    params: { ...room, vessel: 'pot', size: 1, material: 'steel', liters: 0.1 / 2.17, action: 'melt', substance: 'table-salt', startTemp: 20, heater: { id: 'gas-hob', rating: 1750, knob: 1 } },
    plan: [
      { kind: 'fresh', set: { vessel: 'crucible', size: 0.05, material: 'porcelain' }, label: msg('preset-salt-in-pot-plan-label') },
      { kind: 'operation', action: 'melt', cooler: { id: 'muffle-furnace', setpoint: 900 }, label: msg('preset-salt-in-pot-plan-label-2') },
    ],
    choices: [ch('melts', msg('preset-salt-in-pot-list-choices')), ch('too-cold', msg('preset-salt-in-pot-list-choices-2')), ch('pot-burns', msg('preset-salt-in-pot-list-choices-3'))],
    formulas: ['thermal.latent-heat', 'thermal.heat-for-temperature-change'],
    programs: [{ program: 'ua-nus-2023-hryhorovych-chemistry', grade: 7, item: 'Тема 3. Досліджуємо речовини та суміші', match: 'related', quote: 'Визначення фізичних властивостей речовин (пластичність, крихкість / твердість, електропровідність, колір, температура кипіння / плавлення).' }],
    quoteHas: 'плавлен',
    expect: 'stalls',
  },
  {
    id: 'freeze-water',
    grade: 8,
    topic: THERMAL,
    title: msg('preset-freeze-water-list-title'),
    question: msg('preset-freeze-water-list-question'),
    params: { ...room, ...beaker, action: 'freeze', substance: 'water', startTemp: 20, cooler: { id: 'freezer', setpoint: -18 } },
    choices: [ch('cooling', msg('preset-freeze-water-list-choices')), ch('freezing', msg('preset-freeze-water-list-choices-2')), ch('equal', msg('preset-freeze-water-list-choices-3'))],
    formulas: ['thermal.latent-heat', 'thermal.heat-for-temperature-change'],
    quoteHas: 'плавлен',
    programs: [{ program: 'oxfordaqa-igcse-sciences', item: 'Physics RP 3', match: 'related', quote: 'Cooling curves (P). Investigating the cooling curve of stearic acid.' }],
    expect: 'reached',
  },
  {
    ask: msg('preset-road-salt-list-ask'),
    id: 'road-salt',
    grade: 8,
    topic: THERMAL,
    title: msg('preset-road-salt-list-title'),
    question: msg('preset-road-salt-list-question'),
    params: { ...room, ...beaker, action: 'freeze', substance: 'sea-water', startTemp: 20, cooler: { id: 'freezer', setpoint: -18 } },
    choices: [ch('yes', msg('preset-road-salt-list-choices')), ch('partly', msg('preset-road-salt-list-choices-2')), ch('no', msg('preset-road-salt-list-choices-3'))],
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
      title: msg('preset-mix-hot-cold-list-title'),
      formulas: ['thermal.equilibrium-temperature'],
      quoteHas: 'змішування',
      programs: [{ program: 'ua-nus-2023-holovko', grade: 8, topic: 'Тема 1. Теплові явища', match: 'same', quote: 'теплового балансу за умов змішування води різної температури' }, { program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 3', topic: 'Тема 2. Внутрішня енергія. Теплові явища', match: 'same', quote: '№ 3. Вивчення теплового балансу за умов змішування води різної температури.' }],
      expect: 'reached',
    },
    {
      controls: [
        { id: 'cold', label: msg('preset-cold-controls-label-2'), kind: 'number', unit: 'mL', min: 50, max: 120, step: 10, value: 100 },
        { id: 'tCold', label: msg('preset-t-cold-controls-label'), kind: 'number', unit: 'degC', min: 10, max: 30, step: 1, value: 20 },
        { id: 'hot', label: msg('preset-hot-controls-label-2'), kind: 'number', unit: 'g', min: 50, max: 110, step: 10, value: 100 },
        { id: 'tHot', label: msg('preset-t-cold-controls-label'), kind: 'number', unit: 'degC', min: 50, max: 90, step: 1, value: 80 },
      ],
      build: (v) => {
        const [cold, tCold, hot, tHot] = [Number(v['cold']), Number(v['tCold']), Number(v['hot']), Number(v['tHot'])];
        // The heat balance (cold water ≈ 1 g per mL): what the choices name as "exactly".
        const theta = Math.round(((cold * tCold + hot * tHot) / (cold + hot)) * 10) / 10;
        return {
          question: msg('preset-build-question-6', { cold: String(cold), tCold: String(tCold), hot: String(hot), tHot: String(tHot) }),
          params: { ...room, ...beaker, liters: cold / 1000, action: 'settle', substance: 'water', startTemp: tCold },
          setup: [{ kind: 'add', substance: 'water', mass: hot / 1000, temperature: tHot }],
          choices: (['fifty', 'less', 'more'] as const).map((id) => ch(id, msg(`preset-mix-choice-${id}`, { theta }))),
        };
      },
    },
  ),
  {
    ask: msg('preset-which-metal-list-ask'),
    id: 'which-metal',
    grade: 8,
    topic: THERMAL,
    title: msg('preset-which-metal-list-title'),
    question: msg('preset-which-metal-list-question'),
    // In a calorimeter with its lid on: the heat stays in, the comparison is about the metals.
    params: { roomTemp: 20, lid: true, vessel: 'calorimeter', size: 0.25, material: 'aluminium', liters: 0.15, action: 'settle', substance: 'water', startTemp: 20 },
    setup: [{ kind: 'add', substance: 'aluminium', mass: 0.1, temperature: 100 }],
    choices: [ch('al', msg('preset-which-metal-list-choices')), ch('cu', msg('preset-which-metal-list-choices-2')), ch('same', msg('preset-which-metal-list-choices-3'))],
    formulas: ['thermal.heat-for-temperature-change', 'thermal.equilibrium-temperature'],
    quoteHas: 'баланс',
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 4', topic: 'Тема 2. Внутрішня енергія. Теплові явища', match: 'related', quote: '№ 4. Визначення питомої теплоємності речовини.' }],
    expect: 'reached',
  },
  {
    ask: msg('preset-alcohol-vs-water-list-ask'),
    id: 'alcohol-vs-water',
    grade: 8,
    topic: THERMAL,
    title: msg('preset-alcohol-vs-water-list-ask'),
    question: msg('preset-alcohol-vs-water-list-question'),
    params: { ...room, ...beaker, action: 'boil', substance: 'ethanol', startTemp: 20, heater: hotplate },
    choices: [ch('alcohol', msg('preset-alcohol-vs-water-list-choices')), ch('water', msg('preset-water-controls-label')), ch('equal', msg('preset-archimedes-salt-list-choices-3'))],
    formulas: ['thermal.heat-for-temperature-change'],
    programs: [{ program: 'ua-nus-2023-hryhorovych-chemistry', grade: 7, item: 'Тема 3. Досліджуємо речовини та суміші', match: 'related', quote: 'Визначення фізичних властивостей речовин (пластичність, крихкість / твердість, електропровідність, колір, температура кипіння / плавлення).' }],
    predict: true,
    expect: 'reached',
  },
  {
    id: 'sea-salt',
    grade: 8,
    topic: THERMAL,
    title: msg('preset-sea-salt-list-title'),
    question: msg('preset-sea-salt-list-question'),
    params: { ...room, vessel: 'pot', size: 1, material: 'steel', liters: 0.5, action: 'boil', substance: 'water', startTemp: 20, heater: hotplate },
    plan: [
      { kind: 'add', substance: 'table-salt', mass: 0.018, temperature: 20 },
      { kind: 'operation', action: 'evaporate', heater: hotplate },
    ],
    choices: [ch('all', msg('preset-sea-salt-list-choices')), ch('some', msg('preset-sea-salt-list-choices-2')), ch('none', msg('preset-sea-salt-list-choices-3'))],
    formulas: ['thermal.latent-heat'],
    programs: [{ program: 'ua-nus-2023-hryhorovych-chemistry', grade: 7, item: 'Тема 3. Досліджуємо речовини та суміші', match: 'same', quote: 'Способи й особливості виділення солі й цукру з їх розчинів.' }],
    quoteHas: 'пароутвор',
    expect: 'reached',
  },
  // ---------------------------------------------------------------- 8 grade, electricity
  {
    ask: msg('preset-does-water-conduct-list-ask'),
    id: 'does-water-conduct',
    grade: 8,
    topic: ELECTRIC,
    title: msg('preset-does-water-conduct-list-title'),
    question: msg('preset-does-water-conduct-list-question'),
    params: { ...room, ...beaker, action: 'pass-current', substance: 'water', startTemp: 20, supply: bench(0.4), duration: 5 },
    plan: [
      { kind: 'add', substance: 'table-salt', mass: 0.007, temperature: 20 },
      { kind: 'operation', action: 'pass-current', supply: bench(0.4), duration: 5 },
    ],
    choices: [ch('well', msg('preset-does-water-conduct-list-choices')), ch('barely', msg('preset-does-water-conduct-list-choices-2')), ch('never', msg('preset-does-water-conduct-list-choices-3'))],
    formulas: ['electrical.cell-resistance', 'electrical.cell-current'],
    programs: [{ program: 'ua-nus-2023-hryhorovych-chemistry', grade: 9, item: 'Тема 2. Досліджуємо хімічні реакції в розчинах', match: 'same', quote: 'Дослідження електропровідності розчинів електролітів і неелектролітів.' }],
    expect: 'reached',
  },
  {
    id: 'joule-heating',
    grade: 8,
    topic: ELECTRIC,
    title: msg('preset-joule-heating-list-title'),
    question: msg('preset-joule-heating-list-question'),
    params: { ...room, ...beaker, action: 'pass-current', substance: 'sea-water', startTemp: 20, supply: bench(1), duration: 10 },
    choices: [ch('few', msg('preset-joule-heating-list-choices')), ch('tens', msg('preset-joule-heating-list-choices-2')), ch('boils', msg('preset-joule-heating-list-choices-3'))],
    formulas: ['electrical.joule-power', 'electrical.cell-current'],
    expect: 'reached',
  },
  {
    id: 'electrolysis',
    grade: 8,
    topic: ELECTRIC,
    title: msg('preset-electrolysis-list-title'),
    question: msg('preset-electrolysis-list-question'),
    params: { ...room, ...beaker, action: 'pass-current', substance: 'salt-water-10', startTemp: 20, supply: bench(0.4), duration: 10 },
    choices: [ch('few', msg('preset-electrolysis-list-choices')), ch('tens', msg('preset-electrolysis-list-choices-2')), ch('hundreds', msg('preset-electrolysis-list-choices-3'))],
    formulas: ['electrical.faraday-moles'],
    programs: [{ program: 'ua-nus-2023-hryhorovych-chemistry', grade: 9, item: 'Тема 2. Досліджуємо хімічні реакції в розчинах', match: 'same', quote: 'Дослідження електропровідності розчинів електролітів і неелектролітів.' }, { program: 'oxfordaqa-igcse-sciences', item: 'Chemistry RP 1', match: 'related', quote: 'Electrolysis (C). Investigating the products formed at the anode and cathode in the electrolysis of copper sulfate solution.' }],
    expect: 'reached',
  },
  {
    id: 'copper-sulfate-electrolysis',
    grade: 8,
    topic: ELECTRIC,
    title: msg('preset-copper-sulfate-electrolysis-list-title'),
    question: msg('preset-copper-sulfate-electrolysis-list-question'),
    params: { ...room, ...beaker, liters: 0.15, action: 'pass-current', substance: 'water', startTemp: 20, supply: { id: 'bench-supply', knob: 0.2, electrodes: 'graphite' }, duration: 10 },
    setup: [{ kind: 'add', substance: 'copper-sulfate', mass: 0.015, temperature: 20, label: msg('preset-salt-controls-label') }],
    choices: [ch('copper', msg('preset-copper-sulfate-electrolysis-list-choices')), ch('hydrogen', msg('preset-copper-sulfate-electrolysis-list-choices-2')), ch('chlorine', msg('preset-copper-sulfate-electrolysis-list-choices-3'))],
    formulas: ['electrical.faraday-moles'],
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 9, item: 'ЛР № 3', topic: 'Тема 1. Електричний струм у різних середовищах', match: 'related', quote: '№ 3. Визначення електрохімічного еквівалента речовини.' }, { program: 'ua-nus-2023-hryhorovych-chemistry', grade: 9, item: 'Тема 2. Досліджуємо хімічні реакції в розчинах', match: 'same', quote: 'Дослідження електропровідності розчинів електролітів і неелектролітів.' }, { program: 'oxfordaqa-igcse-sciences', item: 'Chemistry RP 1', match: 'same', quote: 'Electrolysis (C). Investigating the products formed at the anode and cathode in the electrolysis of copper sulfate solution.' }],
    expect: 'reached',
  },
  {
    id: 'resistance-temperature',
    ask: msg('preset-resistance-temperature-list-ask'),
    grade: 9,
    topic: MEDIA,
    title: msg('preset-resistance-temperature-list-title'),
    question: msg('preset-resistance-temperature-list-question'),
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
    choices: [ch('grows', msg('preset-resistance-temperature-list-choices')), ch('falls', msg('preset-resistance-temperature-list-choices-2')), ch('same', msg('preset-heat-of-solution-list-choices-4'))],
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
      ask: msg('preset-electrochemical-equivalent-list-ask'),
      grade: 9,
      topic: MEDIA,
      title: msg('preset-electrochemical-equivalent-list-title'),
      guided: true,
      choices: [ch('table', msg('preset-electrochemical-equivalent-list-choices')), ch('more', msg('preset-electrochemical-equivalent-list-choices-2')), ch('less', msg('preset-electrochemical-equivalent-list-choices-3'))],
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
      controls: [{ id: 'minutes', label: msg('preset-minutes-controls-label'), kind: 'choice', options: [ch('10', msg('preset-minutes-controls-options')), ch('20', msg('preset-minutes-controls-options-2')), ch('30', msg('preset-minutes-controls-options-3'))], value: '20' }],
      build: (v) => {
        const min = Number(v['minutes']);
        const supply = { id: 'bench-supply', knob: 0.4, electrodes: 'copper' } as const;
        return {
          question: msg('preset-build-question-7', { min: String(min) }),
          params: { ...room, ...beaker, liters: 0.15, action: 'pass-current', substance: 'water', startTemp: 20, supply, duration: min },
          plan: [
            { kind: 'add', substance: 'copper-sulfate', mass: 0.015, temperature: 20, label: msg('preset-salt-controls-label') },
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
    ask: msg('preset-oil-does-not-boil-list-ask'),
    id: 'oil-does-not-boil',
    grade: null,
    topic: FUN,
    title: msg('preset-oil-does-not-boil-list-title'),
    question: msg('preset-oil-does-not-boil-list-question'),
    params: { ...room, vessel: 'pot', size: 1, material: 'steel', liters: 0.3, action: 'boil', substance: 'sunflower-oil', startTemp: 20, heater: hotplate },
    choices: [ch('boils', msg('preset-oil-does-not-boil-list-choices')), ch('smokes', msg('preset-oil-does-not-boil-list-choices-2'))],
    formulas: ['thermal.heat-for-temperature-change'],
    expect: 'decomposes',
  },
  {
    ask: msg('preset-alcohol-in-freezer-list-ask'),
    id: 'alcohol-in-freezer',
    grade: null,
    topic: FUN,
    title: msg('preset-alcohol-in-freezer-list-title'),
    question: msg('preset-alcohol-in-freezer-list-question'),
    params: { ...room, ...beaker, action: 'freeze', substance: 'ethanol', startTemp: 20, cooler: { id: 'freezer', setpoint: -18 } },
    choices: [ch('yes', msg('preset-alcohol-in-freezer-list-choices')), ch('no', msg('preset-alcohol-in-freezer-list-choices-2'))],
    formulas: ['thermal.latent-heat'],
    quoteHas: 'плавлен',
    expect: 'impossible',
  },
  {
    ask: msg('preset-weigh-the-water-list-ask'),
    id: 'weigh-the-water',
    grade: null,
    topic: FUN,
    title: msg('preset-weigh-the-water-list-title'),
    question: msg('preset-weigh-the-water-list-question'),
    params: { ...room, ...pot, action: 'freeze', substance: 'water', startTemp: 20, cooler: { id: 'freezer', setpoint: -18 } },
    plan: [
      { kind: 'weigh', scale: 'kitchen-scale' },
      { kind: 'operation', action: 'boil', heater: hotplate },
      { kind: 'weigh', scale: 'kitchen-scale' },
    ],
    choices: [ch('heavier', msg('preset-weigh-the-water-list-choices')), ch('lighter', msg('preset-weigh-the-water-list-choices-2')), ch('same', msg('preset-weigh-the-water-list-choices-3'))],
    formulas: ['thermal.latent-heat'],
    quoteHas: 'плавлен',
    expect: 'reached',
  },
  {
    id: 'grand-chain',
    grade: null,
    topic: FUN,
    title: msg('preset-grand-chain-list-title'),
    question: msg('preset-grand-chain-list-question'),
    params: { ...room, ...beaker, action: 'heat-to', target: 30, substance: 'water', startTemp: 20, heater: { id: 'bunsen-burner', rating: 1200, knob: 1 } },
    plan: [
      { kind: 'add', substance: 'table-salt', mass: 0.007, temperature: 20 },
      { kind: 'operation', action: 'pass-current', supply: bench(0.4), duration: 5 },
      { kind: 'operation', action: 'heat-to', target: 70, heater: { id: 'bunsen-burner', rating: 1200, knob: 1 } },
      { kind: 'operation', action: 'pass-current', supply: bench(0.4), duration: 5 },
    ],
    choices: [ch('more', msg('preset-grand-chain-list-choices')), ch('less', msg('preset-grand-chain-list-choices-2')), ch('same', msg('preset-grand-chain-list-choices-3'))],
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
  // Grade 7. The introduction: measuring; mechanical motion.
  'small-bodies', 'leaf-area', 'read-thermometer', 'light-meter', 'bubble-speed', 'relative-motion', 'average-speed', 'wind-speed', 'map-scale', 'strobe-photo', 'snail-speed', 'plant-motion', 'rotation-period', 'pendulum', 'windlass',
  // Interaction of bodies. Force: mass, density, elasticity, friction.
  'coin-inertia', 'contact-forces', 'carts-mass', 'lever-balance', 'mystery-metal', 'liquid-density', 'adding-forces', 'hooke-spring', 'weight-in-lift', 'friction-factors', 'friction-coefficient', 'drag-form', 'ball-in-liquids', 'liquid-tower', 'solar-noon', 'roots-gravity', 'air-column', 'solar-system-model', 'calendars', 'newton-cannon', 'scales-diy', 'dyno-diy', 'rubber-motor',
  // Pressure: of solids; Pascal's law and the pressure at a depth; communicating vessels; the hydraulic machine;
  // the atmosphere's; the buoyant force; floating.
  'block-pressure', 'depth-pressure', 'hydrostatic-paradox', 'communicating-vessels', 'fountain-model', 'hydraulic-press', 'atmospheric-pressure', 'hydrostatic-weighing', 'archimedes-salt', 'floating-conditions', 'cartesian-diver', 'ice-level', 'balloon-lift',
  // Mechanical work and energy: energy changing form; the lever and the slope (Kreminskyi: grade 8, lab works 1–2).
  'stairs-power', 'rolling-energy', 'ball-bounce', 'lever-moments', 'pulley', 'slope-efficiency', 'gear-train',
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
/** The experiments of the bench modules (src/experiments: their cards) join the list. */
const ALL: readonly Preset[] = [...LIST, ...CARDS.flatMap((c) => c.presets)];
const rank = (p: Preset) => {
  const k = PRESET_ORDER.indexOf(p.id);
  return k < 0 ? PRESET_ORDER.length + ALL.indexOf(p) : k;
};
export const PRESETS: readonly Preset[] = [...ALL].sort((a, b) => rank(a) - rank(b));

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
