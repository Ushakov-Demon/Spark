import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, room, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { type LiftPhase, liftPhaseText } from './bench.js';
import { sig } from '../../explain/format.js';
import { type Locale, tr } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';

const N = (n: number, l: Locale) => formatMeasured('force', n, 0.1, l);

export const preset_weight_in_lift: Preset = {
  ask: { uk: 'Коли динамометр у ліфті показує більше чи менше?', en: 'When does the dynamometer in a lift show more or less?' },
  id: 'weight-in-lift',
  grade: 7,
  topic: INTERACTION,
  title: { uk: 'Вага тіла в ліфті', en: 'A body’s weight in a lift' },
  question: {
    uk: 'Під стелею кабіни ліфта висить динамометр із чотирма тягарцями по 100 г. Записуватимемо його покази, поки ліфт стоїть, рушає вгору, їде рівномірно, гальмує, а потім так само вниз. Наостанок — дослід із підручника: на мить відпустимо динамометр разом із тягарцями. Коли покази зміняться?',
    en: 'A dynamometer with four 100 g weights hangs under a lift cabin’s ceiling. We write down its readings while the lift stands, starts up, goes steadily, slows down, and then the same downwards. At last, the textbook’s investigation: we let the dynamometer go for a moment with its weights. When will the readings change?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'lift',
  plan: (['rest', 'up-start', 'up', 'up-stop', 'down-start', 'down', 'down-stop', 'fall'] as const).map((phase) => ({ kind: 'bench', command: { type: 'lab.lift', phase } }) as const),
  choices: [ch('accel', 'Лише коли ліфт розганяється чи гальмує', 'Only while the lift speeds up or slows down'), ch('up', 'Більші, поки ліфт їде вгору, менші — поки їде вниз', 'More while the lift goes up, less while it goes down'), ch('same', 'Ніколи: маса тягарців та сама', 'Never: the weights’ mass is the same')],
  formulas: ['mechanics.weight'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'вимірювання: … ваги в ліфтах' },
    { program: 'ua-nus-2023-kreminskyi', grade: 7, topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: 'Сили тяжіння та пружності. Вага та невагомість.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 25, дослідження «невагомість», с. 177' } },
  ],
  expect: 'reached',
};

export const answer_weight_in_lift = (run: PresetRun): PresetAnswer => {
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
      const s = `${parts.map(stepLine).join(';') + STEPS_END}.`;
      return (s.charAt(0).toUpperCase() + s.slice(1)) + (l === 'uk' ? ` Прискорення ліфта взято ${sig(R.find((x) => x.a > 0)?.a ?? 1.2, 2, l)} м/с² — межа, якої тримаються для зручності пасажирів.` : ` The lift’s acceleration is taken as ${sig(R.find((x) => x.a > 0)?.a ?? 1.2, 2, l)} m/s² — the limit kept for the passengers’ comfort.`);
    }),
  };
};
