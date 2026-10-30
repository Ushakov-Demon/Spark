import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, room, stepLine, STEPS_END, varied, WORK } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';
import { slopeLoad } from '../lever-moments/bench.js';

export const preset_slope_efficiency: Preset = varied(
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
    programs: [
      { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 4. Механічна робота, потужність, енергія', match: 'same', quote: 'визначення: … коефіцієнту корисної дії; ККД простого механізму' },
      { program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 2', topic: 'Тема 1. Момент сили. Механічна робота та енергія', match: 'same', quote: '№ 2. Визначення ККД простого механізму.' },
    ],
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
);

export const answer_slope_efficiency = (run: PresetRun): PresetAnswer => {
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
      const list = rows.map((x, k) => `h = ${Math.round(x.h * 100)} ${l === 'uk' ? 'см' : 'cm'}: F = ${N1(x.F, l)}, η ≈ ${pct(eta[k]!, l)}`).map(stepLine).join(';') + STEPS_END;
      return l === 'uk'
        ? `Брусок із тягарцями важить P = ${P !== null ? N1(P, l) : '—'}. ${list}. Що вище піднята дошка, то вищий ККД: брусок менше тисне на дошку (сила тертя пропорційна P·cos α), і на тертя йде менша частка роботи. Похила площина дає виграш у силі — тягнути легше, ніж піднімати (F < P), — але програє у відстані: «золоте правило механіки». ККД завжди менший за 100 %, бо тертя є завжди.`
        : `The block with its weights weighs P = ${P !== null ? N1(P, l) : '—'}. ${list}. The higher the board, the higher the efficiency: the block presses on it less (friction is proportional to P·cos α), and a smaller share of the work goes into friction. A slope gains in force — pulling is easier than lifting (F < P) — but loses in distance: the “golden rule of mechanics”. The efficiency is always below 100 %, as there is always friction.`;
    }),
  };
};
