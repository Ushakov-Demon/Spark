import type { Locale } from '../knowledge/i18n.js';

/** Interface strings of the generic report. Domain-specific strings live in each domain. */
export interface ReportMessages {
  level(name: string, audience: string): string;
  whatHappened: string;
  /** A measuring procedure: what was measured and worked out. */
  measured: string;
  yourActions: string;
  failed(error: string): string;
  lawsUsed: string;
  lawsIntroNovice: string;
  definitionTag: string;
  discoveredBy: string;
  associatedWith: string;
  when: string;
  work: string;
  limits: string;
  source: string;
  appliedTimes(count: number, objects: string): string;
  oneStep(time: string): string;
  oneStepIntro: string;
  oneStepIntroExpert: string;
  timeStep(dt: string): string;
  numerics(method: string, dt: string, substeps: number, h: string): string;
  where: string;
  simplifications: string;
  simplificationsNovice: string;
  dataTitle: string;
  scenarioValue: string;
  verification: Readonly<Record<'cross-checked' | 'single-source' | 'estimate', string>>;
  sources(n: number): string;
  conditions: string;
  tolerance: string;
  noteLabel: string;
  estimatesWarning(list: string): string;
  unreviewed(n: number): string;
  curriculum: string;
  curriculumBeyond: string;
  grade(n: number): string;
  qualitative: string;
}

export const REPORT_MESSAGES: Readonly<Record<Locale, ReportMessages>> = {
  uk: {
    level: (name, audience) => `Рівень пояснення: ${name} (${audience}).`,
    whatHappened: 'Що відбулося',
    measured: 'Що виміряли й обчислили',
    yourActions: 'Ваші дії',
    failed: (e) => `не вдалося: ${e}`,
    lawsUsed: 'Які закони фізики працювали',
    lawsIntroNovice: 'Комп’ютер не «малює» результат, а обчислює його за справжніми законами фізики:',
    definitionTag: ' (означення)',
    discoveredBy: 'Хто відкрив',
    associatedWith: 'Пов’язано з іменами',
    when: 'Коли',
    work: 'Праця',
    limits: 'Коли перестає працювати',
    source: 'джерело',
    appliedTimes: (c, o) => `Застосовано ${c} разів; об’єкти: ${o}.`,
    oneStep: (t) => `Як обчислено один крок: момент ${t}`,
    oneStepIntro: 'Комп’ютер повторює такий розрахунок тисячі разів поспіль. Ось що він обчислив за один короткий крок:',
    oneStepIntroExpert: 'Нижче — фактичні записи трасування одного кроку (перераховано зі знімка стану; фізика детермінована).',
    timeStep: (dt) => `Крок у часі: ${dt}`,
    numerics: (m, dt, n, h) => `Чисельний метод: ${m}, крок dt = ${dt} поділено на ${n} підкрок(и) по ${h}`,
    where: 'де',
    simplifications: 'Що модель спрощує',
    simplificationsNovice: 'Що в житті буде трохи інакше',
    dataTitle: 'Звідки взято числа',
    scenarioValue: 'задано в сценарії, джерела немає (оцінка)',
    verification: { 'cross-checked': 'звірено', 'single-source': 'одне джерело', estimate: 'оцінка' },
    sources: (n) => `джерел: ${n}`,
    conditions: 'умови',
    tolerance: 'допуск',
    noteLabel: 'примітка',
    estimatesWarning: (l) => `Приблизні значення: ${l}. Тому в реальному досліді результат може трохи відрізнятися.`,
    unreviewed: (n) => `Тексти ${n} формул ще не перевірені вчителем фізики (reviewed: false).`,
    curriculum: 'У шкільній програмі',
    curriculumBeyond: 'Поза шкільною програмою',
    grade: (n) => `${n} клас`,
    qualitative: 'якісно, без формули',
  },
  en: {
    level: (name, audience) => `Explanation level: ${name} (${audience}).`,
    whatHappened: 'What happened',
    measured: 'What was measured and worked out',
    yourActions: 'Your actions',
    failed: (e) => `failed: ${e}`,
    lawsUsed: 'Laws of physics at work',
    lawsIntroNovice: 'The computer does not «draw» the result — it calculates it with the real laws of physics:',
    definitionTag: ' (definition)',
    discoveredBy: 'Discovered by',
    associatedWith: 'Associated with',
    when: 'When',
    work: 'Work',
    limits: 'Where it stops working',
    source: 'source',
    appliedTimes: (c, o) => `Applied ${c} times; objects: ${o}.`,
    oneStep: (t) => `How one step was computed: time ${t}`,
    oneStepIntro: 'The computer repeats this calculation thousands of times in a row. Here is what it computed in one short step:',
    oneStepIntroExpert: 'Below are the actual trace records of one step (recomputed from a state snapshot; the physics is deterministic).',
    timeStep: (dt) => `Time step: ${dt}`,
    numerics: (m, dt, n, h) => `Numerical method: ${m}, step dt = ${dt} split into ${n} sub-step(s) of ${h}`,
    where: 'where',
    simplifications: 'What the model simplifies',
    simplificationsNovice: 'What will be a bit different in real life',
    dataTitle: 'Where the numbers come from',
    scenarioValue: 'set in the scenario, no source (estimate)',
    verification: { 'cross-checked': 'cross-checked', 'single-source': 'single source', estimate: 'estimate' },
    sources: (n) => `sources: ${n}`,
    conditions: 'conditions',
    tolerance: 'tolerance',
    noteLabel: 'note',
    estimatesWarning: (l) => `Approximate values: ${l}. A real experiment may therefore give slightly different results.`,
    unreviewed: (n) => `Texts of ${n} formulas have not yet been reviewed by a physics teacher (reviewed: false).`,
    curriculum: 'In the school curriculum',
    curriculumBeyond: 'Beyond the school curriculum',
    grade: (n) => `grade ${n}`,
    qualitative: 'qualitatively, without the formula',
  },
};
