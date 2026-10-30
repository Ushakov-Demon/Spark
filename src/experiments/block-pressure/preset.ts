import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, PRESSURE, room, times } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';
import { SUBSTANCES } from '../../substances/catalog.js';

export const preset_block_pressure: Preset = {
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
};

export const answer_block_pressure = (run: PresetRun): PresetAnswer => {
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
};
