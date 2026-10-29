import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { type Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';

const N = (n: number, l: Locale) => formatMeasured('force', n, 0.1, l);

export const preset_adding_forces: Preset = {
  ask: { uk: 'Чому дорівнює рівнодійна сил двох динамометрів?', en: 'What is the resultant of the two dynamometers’ forces?' },
  id: 'adding-forces',
  grade: 7,
  topic: INTERACTION,
  title: { uk: 'Додаємо сили: рівнодійна', en: 'Adding forces: the resultant' },
  question: {
    uk: 'Два тягарці по 100 г висять на дерев’яній лінійці. Тримаємо цей вантаж одним динамометром, потім двома — за кінці лінійки, тягарці посередині й ближче до краю, — а потім один динамометр тягне вгору, а другий униз. Щоразу записуємо покази. Чому дорівнює рівнодійна сил двох динамометрів?',
    en: 'Two 100 g weights hang on a wooden ruler. We hold this load by one dynamometer, then by two at the ruler’s ends — the weights in the middle and nearer an end — and then one dynamometer pulls up and the other down. Each time we write down the readings. What is the resultant of the two dynamometers’ forces?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'forces',
  plan: [
    { kind: 'bench', command: { type: 'lab.forces', hold: 'one' } },
    { kind: 'bench', command: { type: 'lab.forces', hold: 'two', at: 0.15 } },
    { kind: 'bench', command: { type: 'lab.forces', hold: 'two', at: 0.06 } },
    { kind: 'bench', command: { type: 'lab.forces', hold: 'down', down: 1 } },
  ],
  choices: [ch('same', 'Щоразу такій самій силі, як покази одного динамометра', 'Each time the same force as one dynamometer showed'), ch('more', 'Більшій: динамометрів же два', 'More: there are two dynamometers'), ch('less', 'Меншій: кожен тягне слабше', 'Less: each pulls weaker')],
  answerOnBoard: ['rs:'],
  formulas: ['mechanics.resultant', 'mechanics.resultant-opposite', 'mechanics.weight'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'вимірювання: … рівнодійної сил' },
    { program: 'ua-nus-2023-kreminskyi', grade: 7, topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: 'Додавання сил, спрямованих уздовж однієї прямої. Визначення рівнодійної кількох сил.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 22, с. 155–156' } },
  ],
  expect: 'reached',
};

export const answer_adding_forces = (run: PresetRun): PresetAnswer => {
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
};
