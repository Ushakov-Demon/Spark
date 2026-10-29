import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTRO, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { type Locale, tr } from '../../knowledge/i18n.js';
import { type RowBody, rowName } from './bench.js';
import { sig } from '../../explain/format.js';

export const preset_small_bodies: Preset = {
  ask: { uk: 'Як виміряти зернятко пшона точніше, ніж до міліметра?', en: 'How to measure a millet grain better than to a millimetre?' },
  id: 'small-bodies',
  grade: 7,
  topic: INTRO,
  title: { uk: 'Вимірюємо малі тіла методом рядів', en: 'Measuring small bodies by the method of rows' },
  question: {
    uk: 'У лінійки поділки по 1 мм, а пшоняне зернятко — завбільшки лише з дві поділки, горошина — із шість-сім. Виміряємо одну горошину, потім ряд горошин, ряд пшона, а ще намотаємо нитку на стрижень. Як виміряти зернятко точніше, ніж до міліметра?',
    en: 'The ruler’s divisions are 1 mm, and a millet grain is only about two divisions across, a pea six or seven. We measure one pea, then a row of peas, a row of millet, and wind a thread on a rod. How to measure a grain better than to a millimetre?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'rows',
  plan: [
    { kind: 'bench', command: { type: 'lab.rows', body: 'pea', count: 1 } },
    { kind: 'bench', command: { type: 'lab.rows', body: 'pea', count: 15 } },
    { kind: 'bench', command: { type: 'lab.rows', body: 'millet', count: 40 } },
    { kind: 'bench', command: { type: 'lab.rows', body: 'thread', count: 30 } },
  ],
  choices: [ch('row', 'Викласти багато зерняток у ряд і поділити довжину ряду на їх кількість', 'Lay many grains in a row and divide the row’s length by their number'), ch('one', 'Уважно виміряти одне зернятко', 'Measure one grain very carefully'), ch('cant', 'Ніяк: точніше за поділку лінійка не виміряє', 'No way: a ruler measures no better than its division')],
  formulas: ['mechanics.row-size'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Вступ', match: 'same', quote: 'вимірювання фізичних величин (маси, розмірів малих тіл, площ, відстаней, об’ємів, температури, освітленості)' },
    { program: 'ua-nus-2023-kreminskyi', grade: 7, topic: 'Тема 1. Методи пізнання природи. Фізика як природнича наука', match: 'related', quote: 'Фізичні величини та їх вимірювання.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: 'розділ 1, експериментальна робота «Вимірювання розмірів малих тіл методом рядів», с. 36' } },
  ],
  expect: 'reached',
};

export const answer_small_bodies = (run: PresetRun): PresetAnswer => {
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
};
