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
  title: { uk: 'Гідравлічна машина зі шприців', en: 'A hydraulic machine of syringes' },
  question: {
    uk: 'Два шприци — вузький і широкий — з’єднані трубкою, усе заповнене водою. Виміряємо діаметри поршнів. Ставитимемо на широкий поршень 2, 4 і 6 тягарців по 100 г і тиснутимемо динамометром на вузький, поки вантаж не почне підніматися. А наостанок опустимо вузький поршень на 6 см і подивимося, на скільки підніметься широкий. У скільки разів така машина виграє в силі?',
    en: 'Two syringes — a narrow and a wide one — are joined by a tube, all full of water. We measure the pistons’ diameters. We put 2, 4 and 6 weights of 100 g on the wide piston and push the narrow one with the dynamometer until the load starts to rise. At last we push the narrow piston 6 cm down and see how far the wide one rises. How many times does such a machine gain in force?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'press',
  plan: [
    { kind: 'bench', command: { type: 'lab.press', step: 'diameters' } },
    ...[2, 4, 6].map((weights) => ({ kind: 'bench', command: { type: 'lab.press', step: 'lift', weights } }) as const),
    { kind: 'bench', command: { type: 'lab.press', step: 'travel', weights: 6 } },
  ],
  choices: [ch('areas', 'У стільки, у скільки площа широкого поршня більша за площу вузького', 'As many times as the wide piston’s area is larger than the narrow one’s'), ch('diameters', 'У стільки, у скільки більший діаметр', 'As many times as the diameter is larger'), ch('none', 'Ні в скільки — сила та сама', 'Not at all — the force is the same')],
  choicesAt: 'end',
  answerOnBoard: ['gain:'],
  formulas: ['mechanics.hydraulic', 'mechanics.pressure'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'Закон Паскаля. … Гідравлічна машина. … Дослідження: … передавання тиску рідинами й газами' }],
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
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Вода майже не стискається й передає тиск, який створює вузький поршень, в усі боки однаково — і під широкий поршень теж (закон Паскаля). Тиск — це сила на кожен квадратний сантиметр. Під широким поршнем таких сантиметрів у стільки разів більше, у скільки разів більша його площа, — у стільки ж разів більша й сила. А площа зростає як квадрат діаметра. Але за виграш у силі платять шляхом: вода з вузького шприца, розтікаючись широким, піднімає поршень на стільки ж менше.'
        : 'Water hardly compresses and passes the pressure the narrow piston makes on in all directions alike — under the wide piston too (Pascal’s law). Pressure is force on each square centimetre. Under the wide piston there are as many times more of those centimetres as its area is larger — and so as many times more force. And the area grows as the square of the diameter. But the gain in force is paid for in distance: the water from the narrow syringe, spread over the wide one, lifts its piston that many times less.',
    ),
    say: both((l) => (correct === 'areas' ? (l === 'uk' ? `Виграш у силі ≈ ${sig(gain, 2, l)} раза — як відношення площ!` : `A gain in force of ≈ ${sig(gain, 2, l)} times — the ratio of the areas!`) : l === 'uk' ? 'Подивімося, що показав динамометр.' : 'Let us look at the dynamometer.')),
    text: both((l) =>
      l === 'uk'
        ? `Діаметри поршнів ${cm(d1, l)} і ${cm(d2, l)}: широкий більший у ${sig(diam, 2, l)} раза, а його площа — у (d₂/d₁)² ≈ ${sig(areas, 2, l)} раза. ${list(l)}: широкий поршень щоразу піднімав вантаж у ≈ ${sig(gain, 2, l)} раза важчий за силу, якою тиснули на вузький, — як відношення площ, а не діаметрів. Зате коли вузький поршень опустили на ${cm(push, l)}, широкий піднявся лише на ${cm(rise, l)}: робота F₁·l₁ ≈ ${sig((lastLift?.F1 ?? 0) * push, 2, l)} Дж і F₂·l₂ ≈ ${sig((lastLift?.F2 ?? 0) * rise, 2, l)} Дж — майже однакові, у роботі виграшу немає. (Тертя поршнів не враховано: зі справжніми шприцами тиснути доводиться трохи сильніше.)`
        : `The pistons are ${cm(d1, l)} and ${cm(d2, l)} across: the wide one is ${sig(diam, 2, l)} times wider, and its area (d₂/d₁)² ≈ ${sig(areas, 2, l)} times larger. ${list(l)}: each time the wide piston lifted a load ≈ ${sig(gain, 2, l)} times the force on the narrow one — the ratio of the areas, not of the diameters. But when the narrow piston went ${cm(push, l)} down, the wide one rose only ${cm(rise, l)}: the work F₁·l₁ ≈ ${sig((lastLift?.F1 ?? 0) * push, 2, l)} J and F₂·l₂ ≈ ${sig((lastLift?.F2 ?? 0) * rise, 2, l)} J — almost the same, no gain in work. (The pistons’ friction is left out: with real syringes one has to push a little harder.)`,
    ),
  };
};
