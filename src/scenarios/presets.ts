import type { LocalizedText } from '../knowledge/i18n.js';
import type { LabParams, LabStatus } from './thermal-lab.js';
import type { ProtocolStep } from './protocol.js';

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
  readonly params: LabParams;
  /** Further steps after the first one (the first is `params` itself). */
  readonly plan?: readonly ProtocolStep[];
  /** Formula ids from the catalogs — for "where it is in the programme". */
  readonly formulas: readonly string[];
  /** Show only the programme quotes that contain this ("плавлен" — melting, not boiling). */
  readonly quoteHas?: string;
  /** Ask for a prediction (minutes) before the start. */
  readonly predict?: boolean;
  /** How the run ends in the model (checked by tests). */
  readonly expect: LabStatus['kind'];
}

const THERMAL: LocalizedText = { uk: 'Теплові явища', en: 'Thermal phenomena' };
const ELECTRIC: LocalizedText = { uk: 'Електричні явища', en: 'Electric phenomena' };
const FUN: LocalizedText = { uk: 'Цікаві досліди', en: 'Curious experiments' };

const room = { roomTemp: 20, lid: false } as const;
const hotplate = { id: 'electric-hotplate', rating: 2000, knob: 1 } as const;
const bench = (knob: number) => ({ id: 'bench-supply', knob }) as const;
const beaker = { vessel: 'beaker', size: 0.25, material: 'glass', liters: 0.2 } as const;
const pot = { vessel: 'pot', size: 2, material: 'steel', liters: 1 } as const;

export const PRESETS: readonly Preset[] = [
  // ---------------------------------------------------------------- 8 grade, heat
  {
    id: 'boil-a-litre',
    grade: 8,
    topic: THERMAL,
    title: { uk: 'За скільки закипить літр води?', en: 'How long does a litre of water take to boil?' },
    question: { uk: 'Спершу зроби прогноз: скільки хвилин знадобиться електроплиті на 2 кВт? Потім порівняй із дослідом і розрахунком «на папері».', en: 'Predict first: how many minutes will a 2 kW hob need? Then compare with the experiment and the paper calculation.' },
    params: { ...room, ...pot, action: 'boil', substance: 'water', startTemp: 20, heater: hotplate },
    formulas: ['thermal.heat-for-temperature-change'],
    predict: true,
    expect: 'reached',
  },
  {
    id: 'lid-or-not',
    grade: 8,
    topic: THERMAL,
    title: { uk: 'Навіщо каструлі кришка?', en: 'Why does a pot need a lid?' },
    question: { uk: 'Закип’яти воду з кришкою, а потім — без неї (зніми галочку в посуді). Що змінилося і чому?', en: 'Boil water with a lid, then without it (untick it under the vessel). What changed and why?' },
    params: { ...pot, roomTemp: 20, lid: true, action: 'boil', substance: 'water', startTemp: 20, heater: { id: 'gas-hob', rating: 1500, knob: 1 } },
    formulas: ['thermal.heat-for-temperature-change', 'thermal.latent-heat'],
    quoteHas: 'пароутвор',
    expect: 'reached',
  },
  {
    id: 'melt-ice',
    grade: 8,
    topic: THERMAL,
    title: { uk: 'Як тане лід?', en: 'How does ice melt?' },
    question: { uk: 'Поклади лід у теплу кімнату й стеж за термометром. Чому, поки лід тане, температура стоїть на 0 °C?', en: 'Put ice in a warm room and watch the thermometer. Why does the temperature stay at 0 °C while the ice melts?' },
    params: { ...room, ...beaker, action: 'melt', substance: 'water', startTemp: -10 },
    formulas: ['thermal.latent-heat'],
    quoteHas: 'плавлен',
    expect: 'reached',
  },
  {
    id: 'freeze-water',
    grade: 8,
    topic: THERMAL,
    title: { uk: 'Скільки замерзає вода в морозилці?', en: 'How long does water take to freeze?' },
    question: { uk: 'Як гадаєш, що триває довше: охолодити воду до 0 °C чи потім перетворити її на лід?', en: 'What do you think takes longer: cooling water to 0 °C or then turning it into ice?' },
    params: { ...room, ...beaker, action: 'freeze', substance: 'water', startTemp: 20, cooler: { id: 'freezer', setpoint: -18 } },
    formulas: ['thermal.latent-heat', 'thermal.heat-for-temperature-change'],
    quoteHas: 'плавлен',
    expect: 'reached',
  },
  {
    id: 'road-salt',
    grade: 8,
    topic: THERMAL,
    title: { uk: 'Чому взимку дороги посипають сіллю?', en: 'Why are roads salted in winter?' },
    question: { uk: 'Постав морську воду в морозилку на −18 °C. Чи замерзне вона так само, як прісна?', en: 'Put sea water into a −18 °C freezer. Will it freeze like fresh water?' },
    params: { ...room, ...beaker, action: 'freeze', substance: 'sea-water', startTemp: 20, cooler: { id: 'freezer', setpoint: -18 } },
    formulas: ['thermal.latent-heat'],
    quoteHas: 'плавлен',
    expect: 'impossible',
  },
  {
    id: 'alcohol-vs-water',
    grade: 8,
    topic: THERMAL,
    title: { uk: 'Що закипить швидше: спирт чи вода?', en: 'Which boils sooner: alcohol or water?' },
    question: { uk: 'Закип’яти спирт, а потім так само воду. Чому спирт закипає набагато швидше? (Підказка: подивись на теплоємність і температуру кипіння.)', en: 'Boil alcohol, then water the same way. Why does alcohol boil much sooner? (Hint: look at the specific heat and the boiling point.)' },
    params: { ...room, ...beaker, action: 'boil', substance: 'ethanol', startTemp: 20, heater: hotplate },
    formulas: ['thermal.heat-for-temperature-change'],
    predict: true,
    expect: 'reached',
  },
  {
    id: 'sea-salt',
    grade: 8,
    topic: THERMAL,
    title: { uk: 'Морська вода своїми руками — і сіль назад', en: 'Sea water by hand — and the salt back' },
    question: { uk: 'Розчини сіль у воді, а потім випари воду. Скільки солі залишиться на дні?', en: 'Dissolve salt in water, then boil the water away. How much salt stays on the bottom?' },
    params: { ...room, vessel: 'pot', size: 1, material: 'steel', liters: 0.5, action: 'boil', substance: 'water', startTemp: 20, heater: hotplate },
    plan: [
      { kind: 'add', substance: 'table-salt', mass: 0.018, temperature: 20 },
      { kind: 'operation', action: 'evaporate', heater: hotplate },
    ],
    formulas: ['thermal.latent-heat'],
    quoteHas: 'пароутвор',
    expect: 'reached',
  },
  // ---------------------------------------------------------------- 8 grade, electricity
  {
    id: 'does-water-conduct',
    grade: 8,
    topic: ELECTRIC,
    title: { uk: 'Чи проводить вода струм?', en: 'Does water conduct electricity?' },
    question: { uk: 'Пропусти струм через дистильовану воду, потім досип трохи солі й спробуй ще раз. Що змінилося?', en: 'Pass a current through distilled water, then add a little salt and try again. What changed?' },
    params: { ...room, ...beaker, action: 'pass-current', substance: 'water', startTemp: 20, supply: bench(0.4), duration: 5 },
    plan: [
      { kind: 'add', substance: 'table-salt', mass: 0.007, temperature: 20 },
      { kind: 'operation', action: 'pass-current', supply: bench(0.4), duration: 5 },
    ],
    formulas: ['electrical.cell-resistance', 'electrical.cell-current'],
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
    expect: 'reached',
  },
  // ---------------------------------------------------------------- for everyone
  {
    id: 'oil-does-not-boil',
    grade: null,
    topic: FUN,
    title: { uk: 'Чи кипить олія?', en: 'Does oil boil?' },
    question: { uk: 'Вода кипить при 100 °C. А олія? Нагрій її й подивись, що станеться раніше.', en: 'Water boils at 100 °C. And oil? Heat it and see what happens first.' },
    params: { ...room, vessel: 'pot', size: 1, material: 'steel', liters: 0.3, action: 'boil', substance: 'sunflower-oil', startTemp: 20, heater: hotplate },
    formulas: ['thermal.heat-for-temperature-change'],
    expect: 'decomposes',
  },
  {
    id: 'alcohol-in-freezer',
    grade: null,
    topic: FUN,
    title: { uk: 'Чи замерзне спирт у морозилці?', en: 'Will alcohol freeze in a freezer?' },
    question: { uk: 'Вода в морозилці стає льодом. А спирт? Перевір і поміркуй, чому так.', en: 'Water turns to ice in a freezer. And alcohol? Check it and think why.' },
    params: { ...room, ...beaker, action: 'freeze', substance: 'ethanol', startTemp: 20, cooler: { id: 'freezer', setpoint: -18 } },
    formulas: ['thermal.latent-heat'],
    quoteHas: 'плавлен',
    expect: 'impossible',
  },
  {
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
    formulas: ['electrical.cell-current', 'thermal.heat-for-temperature-change'],
    expect: 'reached',
  },
];

/** Grades that have presets, in order; null (for everyone) last. */
export const PRESET_GRADES: readonly (number | null)[] = [...new Set(PRESETS.map((p) => p.grade))].sort((a, b) => (a ?? 99) - (b ?? 99));
