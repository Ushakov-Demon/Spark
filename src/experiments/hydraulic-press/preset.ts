import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, PRESSURE, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';

export const preset_hydraulic_press: Preset = {
  id: 'hydraulic-press',
  ask: { uk: 'У скільки разів гідравлічна машина виграє в силі?', en: 'How many times does a hydraulic machine gain in force?' },
  grade: 7,
  topic: PRESSURE,
  title: { uk: 'Гідравлічна машина зі шприців — і пневматична', en: 'A hydraulic machine of syringes — and a pneumatic one' },
  question: {
    uk: 'Два шприци — вузький і широкий — з’єднані трубкою, усе заповнене водою. Виміряємо діаметри поршнів. Ставитимемо на широкий поршень 2, 4 і 6 тягарців по 100 г і тиснутимемо динамометром на вузький, поки вантаж не почне підніматися. А тоді опустимо вузький поршень на 6 см і подивимося, на скільки підніметься широкий. Наостанок, якщо захочеш, виллємо воду й спробуємо те саме з повітрям — пневматичну машину. У скільки разів така машина виграє в силі?',
    en: 'Two syringes — a narrow and a wide one — are joined by a tube, all full of water. We measure the pistons’ diameters. We put 2, 4 and 6 weights of 100 g on the wide piston and push the narrow one with the dynamometer until the load starts to rise. Then we push the narrow piston 6 cm down and see how far the wide one rises. At last, if you like, we pour the water out and try the same with air — a pneumatic machine. How many times does such a machine gain in force?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'press',
  plan: [
    { kind: 'bench', command: { type: 'lab.press', step: 'diameters' } },
    ...[2, 4, 6].map((weights) => ({ kind: 'bench', command: { type: 'lab.press', step: 'lift', weights } }) as const),
    { kind: 'bench', command: { type: 'lab.press', step: 'travel', weights: 6 } },
    // The «what if…»: the same machine with air — one may skip it.
    ...[2, 6, 8].map(
      (weights, k) =>
        ({
          kind: 'bench',
          command: { type: 'lab.pneumatic', step: 'push', medium: 'air', weights },
          ...(k === 0 ? { optional: { uk: '💨 А якщо виллити воду й залишити в шприцах повітря — пневматична машина? Чи підніме вона вантаж так само?', en: '💨 And if we pour the water out and leave air in the syringes — a pneumatic machine? Will it lift the load the same way?' } } : {}),
        }) as const,
    ),
  ],
  choices: [ch('areas', 'У стільки, у скільки площа широкого поршня більша за площу вузького', 'As many times as the wide piston’s area is larger than the narrow one’s'), ch('diameters', 'У стільки, у скільки більший діаметр', 'As many times as the diameter is larger'), ch('none', 'Ні в скільки — сила та сама', 'Not at all — the force is the same')],
  choicesAt: 'end',
  answerOnBoard: ['gain:'],
  asides: [
    {
      uk: 'Повітря стискається — і цим користуються. 13 квітня 1869 року американець Джордж Вестингауз запатентував пневматичне гальмо для потягів. Гальма в ньому спрацьовують не тоді, коли тиск у гальмівній магістралі зростає, а коли падає. Тож якщо шланг між вагонами розірветься, потяг загальмує сам — гальмо надійне від самої будови. Такі гальма потягів відтоді прийнялися майже всюди.',
      en: 'Air compresses — and that is put to use. On 13 April 1869 the American George Westinghouse patented an air brake for trains. In it the brakes act not when the pressure in the brake pipe grows but when it falls. So if a hose between the cars bursts, the train brakes by itself — the brake is fail-safe by its very design. Such train brakes have since been taken up nearly everywhere.',
    },
  ],
  formulas: ['mechanics.hydraulic', 'mechanics.pressure', 'mechanics.boyle'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'Закон Паскаля. … Гідравлічна машина. … Дослідження: … передавання тиску рідинами й газами' },
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'конструювання: … пневматичного механізму' },
  ],
  expect: 'reached',
};

export const answer_hydraulic_press = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.press' && x.record.value !== null);
  const d1 = R.find((x) => x.record.inputs?.['which'] === 1)?.record.value ?? 0;
  const d2 = R.find((x) => x.record.inputs?.['which'] === 2)?.record.value ?? 0;
  const lifts = R.filter((x) => x.command['step'] === 'lift').map((x) => ({ n: Number(x.command['weights']), F1: x.record.value!, F2: x.record.inputs?.['load'] ?? 0 }));
  const travel = R.find((x) => x.command['step'] === 'travel')?.record;
  const areas = d1 > 0 ? (d2 / d1) ** 2 : 0;
  const diam = d1 > 0 ? d2 / d1 : 0;
  const gains = lifts.filter((x) => x.F1 > 0).map((x) => x.F2 / x.F1);
  const gain = gains.length ? gains.reduce((a, b) => a + b, 0) / gains.length : 0;
  // Closer to the ratio of the areas or of the diameters (or none at all)?
  const correct = !gains.length ? undefined : Math.abs(gain - areas) < Math.abs(gain - diam) && Math.abs(gain - areas) < Math.abs(gain - 1) ? 'areas' : Math.abs(gain - diam) < Math.abs(gain - 1) ? 'diameters' : 'none';
  const N = (x: number, l: Locale) => formatMeasured('force', x, 0.1, l);
  const cm = (m: number, l: Locale) => `${sig(m * 100, 3, l)} ${l === 'uk' ? 'см' : 'cm'}`;
  const lastLift = lifts[lifts.length - 1];
  const push = travel?.inputs?.['push'] ?? 0.06;
  const rise = travel?.value ?? 0;
  const list = (l: Locale) => lifts.map((x) => `F₂ = ${N(x.F2, l)} — F₁ = ${N(x.F1, l)}`).join('; ');
  // The «what if…» with air, if it was done: each push reads the idle travel (4), then the rise (3).
  const A = (run.readings ?? []).filter((x) => x.command.type === 'lab.pneumatic' && x.record.value !== null);
  const air = A.flatMap((x, k) => (x.record.inputs?.['which'] === 4 ? [{ weights: x.record.inputs?.['weights'] ?? 0, dead: x.record.value!, rise: A[k + 1]?.record.inputs?.['which'] === 3 ? A[k + 1]!.record.value! : 0, extra: x.record.inputs?.['extra'] ?? 0, squeezed: x.record.inputs?.['squeezed'] ?? 0 }] : []));
  const mm = (x: number, l: Locale) => `${Math.round(x * 1000)} ${l === 'uk' ? 'мм' : 'mm'}`;
  const airWhy = (l: Locale) =>
    !air.length
      ? ''
      : l === 'uk'
        ? '\n\nА повітря? Тиск воно передає так само — за законом Паскаля. Але, щоб широкий поршень із вантажем рушив, тиск усередині має зрости на вагу вантажу, поділену на площу поршня, Δp = F₂/S₂. Вода майже не стискається, тож цей тиск з’являється, щойно рушив вузький поршень. Повітря ж стискається легко (за сталої температури p·V = const — закон Бойля — Маріотта): поки тиск не виріс, вузький поршень лише стискає повітря, а вантаж стоїть. Що важчий вантаж, то більше треба стиснути повітря — то довший цей «холостий» хід і то нижчий підйом. Зате повітря пружне, як подушка: пневматика м’яко штовхає й гальмує, а гідравліка — точно й сильно піднімає.'
        : '\n\nAnd air? It passes pressure on just the same — by Pascal’s law. But for the wide piston with its load to move, the pressure inside must grow by the load’s weight over the piston’s area, Δp = F₂/S₂. Water hardly compresses, so this pressure is there as soon as the narrow piston moves. Air compresses easily (at a constant temperature p·V = const — the Boyle–Mariotte law): until the pressure has grown, the narrow piston only squeezes the air, and the load stands. The heavier the load, the more the air must be squeezed — the longer this idle travel and the lower the rise. But air is springy, like a cushion: pneumatics pushes and brakes softly, hydraulics lifts precisely and strongly.';
  const airText = (l: Locale) =>
    !air.length
      ? ''
      : l === 'uk'
        ? ` З повітрям, на ті самі 6 см: ${air.map((x) => `${x.weights} тягарці${x.weights >= 5 ? 'в' : ''} — потрібно ≈ ${sig(x.extra / 1000, 2, l)} кПа, повітря стиснулося на ${sig(x.squeezed * 1e6, 2, l)} мл, вантаж рушив після ${mm(x.dead, l)} і піднявся на ${mm(x.rise, l)}`).join('; ')} (з водою — одразу, на ${mm(rise, l)}).`
        : ` With air, the same 6 cm: ${air.map((x) => `${x.weights} weights — ≈ ${sig(x.extra / 1000, 2, l)} kPa needed, the air shrank by ${sig(x.squeezed * 1e6, 2, l)} mL, the load moved after ${mm(x.dead, l)} and rose ${mm(x.rise, l)}`).join('; ')} (with water — at once, by ${mm(rise, l)}).`;
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      l === 'uk'
        ? ('Вода майже не стискається й передає тиск, який створює вузький поршень, в усі боки однаково — і під широкий поршень теж (закон Паскаля). Тиск — це сила на кожен квадратний сантиметр. Під широким поршнем таких сантиметрів у стільки разів більше, у скільки разів більша його площа, — у стільки ж разів більша й сила. А площа зростає як квадрат діаметра. Але за виграш у силі платять шляхом: вода з вузького шприца, розтікаючись широким, піднімає поршень на стільки ж менше.') + airWhy(l)
        : ('Water hardly compresses and passes the pressure the narrow piston makes on in all directions alike — under the wide piston too (Pascal’s law). Pressure is force on each square centimetre. Under the wide piston there are as many times more of those centimetres as its area is larger — and so as many times more force. And the area grows as the square of the diameter. But the gain in force is paid for in distance: the water from the narrow syringe, spread over the wide one, lifts its piston that many times less.') + airWhy(l),
    ),
    say: both((l) => (correct === 'areas' ? (l === 'uk' ? `Виграш у силі ≈ ${sig(gain, 2, l)} раза — як відношення площ!` : `A gain in force of ≈ ${sig(gain, 2, l)} times — the ratio of the areas!`) : l === 'uk' ? 'Подивімося, що показав динамометр.' : 'Let us look at the dynamometer.')),
    text: both((l) =>
      l === 'uk'
        ? `Діаметри поршнів ${cm(d1, l)} і ${cm(d2, l)}: широкий більший у ${sig(diam, 2, l)} раза, а його площа — у (d₂/d₁)² ≈ ${sig(areas, 2, l)} раза. ${list(l)}: широкий поршень щоразу піднімав вантаж у ≈ ${sig(gain, 2, l)} раза важчий за силу, якою тиснули на вузький, — як відношення площ, а не діаметрів. Зате коли вузький поршень опустили на ${cm(push, l)}, широкий піднявся лише на ${cm(rise, l)}: робота F₁·l₁ ≈ ${sig((lastLift?.F1 ?? 0) * push, 2, l)} Дж і F₂·l₂ ≈ ${sig((lastLift?.F2 ?? 0) * rise, 2, l)} Дж — майже однакові, у роботі виграшу немає. (Тертя поршнів не враховано: зі справжніми шприцами тиснути доводиться трохи сильніше.)` + airText(l)
        : `The pistons are ${cm(d1, l)} and ${cm(d2, l)} across: the wide one is ${sig(diam, 2, l)} times wider, and its area (d₂/d₁)² ≈ ${sig(areas, 2, l)} times larger. ${list(l)}: each time the wide piston lifted a load ≈ ${sig(gain, 2, l)} times the force on the narrow one — the ratio of the areas, not of the diameters. But when the narrow piston went ${cm(push, l)} down, the wide one rose only ${cm(rise, l)}: the work F₁·l₁ ≈ ${sig((lastLift?.F1 ?? 0) * push, 2, l)} J and F₂·l₂ ≈ ${sig((lastLift?.F2 ?? 0) * rise, 2, l)} J — almost the same, no gain in work. (The pistons’ friction is left out: with real syringes one has to push a little harder.)` + airText(l),
    ),
  };
};
