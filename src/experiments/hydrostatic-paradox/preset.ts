import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, PRESSURE, room, stepLine, STEPS_END, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { type Locale, tr } from '../../knowledge/i18n.js';
import { type PascalVessel, vesselName } from './bench.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';

export const preset_hydrostatic_paradox: Preset = varied(
  {
    id: 'hydrostatic-paradox',
    ask: { uk: 'У якій посудині вода тисне на дно найсильніше?', en: 'In which vessel does the water press on the bottom hardest?' },
    grade: 7,
    topic: PRESSURE,
    title: { uk: 'Гідростатичний парадокс: прилад Паскаля', en: 'The hydrostatic paradox: Pascal’s device' },
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'vessels',
    choices: [ch('same', 'Однаково в усіх трьох', 'Alike in all three'), ch('wide', 'Найсильніше — у тій, що розширюється догори', 'Hardest in the one widening upwards'), ch('narrow', 'Найсильніше — у тій, що звужується догори', 'Hardest in the one narrowing upwards')],
    choicesAt: 'end',
    answerOnBoard: ['vF:'],
    formulas: ['mechanics.bottom-force', 'mechanics.hydrostatic-pressure'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'Тиск рідин і газів. Закон Паскаля. Гідростатичний тиск.' }],
    expect: 'reached',
  },
  {
    // How high the water stands: the manometer follows it, the shapes do not matter.
    controls: [{ id: 'height', label: { uk: 'Висота води в посудинах', en: 'The water’s height in the vessels' }, kind: 'number', unit: 'см', min: 6, max: 12, step: 2, value: 10 }],
    build: (v) => {
      const cm = Number(v['height']);
      const height = cm / 100;
      return {
        question: {
          uk: `Прилад Паскаля: на підставку, дно якої — гумова плівка з трубкою до манометра, по черзі закручують три скляні посудини: пряму, ту, що розширюється догори, і ту, що звужується. Дно в усіх однакове — виміряємо його. У кожну наллємо з мензурки води до висоти ${cm} см, запишемо, скільки води пішло, і що показує манометр. У якій посудині вода тисне на дно найсильніше?`,
          en: `Pascal’s device: three glass vessels — a straight one, one widening upwards and one narrowing — are screwed in turn onto a stand whose bottom is a rubber film with a tube to a manometer. All have the same bottom — we measure it. Into each we pour water from a measuring cylinder up to ${cm} cm and write down how much water went in and what the manometer shows. In which vessel does the water press on the bottom hardest?`,
        },
        plan: [
          { kind: 'bench', command: { type: 'lab.vessel', step: 'bottom' } },
          ...(['straight', 'wide', 'narrow'] as const).map((shape) => ({ kind: 'bench', command: { type: 'lab.vessel', step: 'fill', shape, height } }) as const),
        ],
      };
    },
  },
);

export const answer_hydrostatic_paradox = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.vessel' && x.record.value !== null);
  const d = R.find((x) => x.command['step'] === 'bottom')?.record.value ?? 0;
  const S = Math.PI * (d / 2) ** 2;
  const shapes = (['straight', 'wide', 'narrow'] as const).flatMap((shape) => {
    const recs = R.filter((x) => x.command['shape'] === shape);
    const V = recs.find((x) => x.record.quantity === 'volume')?.record;
    const M = recs.find((x) => x.record.quantity === 'length')?.record;
    if (!V || !M) return [];
    const rho = M.inputs?.['rho'] ?? 1000;
    const g = M.inputs?.['g'] ?? 9.81;
    return [{ shape, V: V.value!, dh: M.value!, F: rho * g * M.value! * S, P: rho * g * V.value! }];
  });
  // Alike if the manometer's readings differ by no more than half its division.
  const dhs = shapes.map((x) => x.dh);
  const top = [...shapes].sort((a, b) => b.dh - a.dh)[0];
  const correct = !shapes.length ? undefined : Math.max(...dhs) - Math.min(...dhs) <= 0.0005 ? 'same' : top!.shape === 'straight' ? undefined : top!.shape;
  const N = (x: number, l: Locale) => `${sig(x, 2, l)} ${l === 'uk' ? 'Н' : 'N'}`;
  const ml = (x: number, l: Locale) => formatMeasured('volume', x, 5e-6, l);
  const name = (s: string, l: Locale) => tr(vesselName(s as PascalVessel), l);
  const list = (l: Locale) => shapes.map((x) => (l === 'uk' ? `${name(x.shape, l)}: води ${ml(x.V, l)} (вага ≈ ${N(x.P, l)}), манометр ${formatMeasured('length', x.dh, 0.001, l)}` : `${name(x.shape, l)}: ${ml(x.V, l)} of water (weight ≈ ${N(x.P, l)}), the manometer ${formatMeasured('length', x.dh, 0.001, l)}`)).map(stepLine).join(';') + STEPS_END.replace(/^./, (x) => x.toUpperCase());
  const F = shapes[0]?.F ?? 0;
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Тиск рідини на якійсь глибині створює вага стовпчика рідини над цим місцем, p = ρ·g·h, — і він однаковий на тій самій глибині, хоч би якою широкою чи вузькою була посудина вище. На дні глибина однакова — отже, однаковий і тиск, і сила тиску на однакове дно. А куди ж дівається решта ваги води в широкій посудині? Її тримають похилі стінки: вода тисне на них, і вони — на підставку. У вузькій навпаки: похилі стінки самі тиснуть на воду вниз, тож на дно припадає більше, ніж важить вода.'
        : 'The pressure at some depth in a liquid comes from the weight of the column above that place, p = ρ·g·h, — and it is the same at the same depth however wide or narrow the vessel is higher up. At the bottom the depth is alike — so the pressure is alike too, and the force on an equal bottom. Where, then, does the rest of the water’s weight go in the wide vessel? The sloping walls hold it: the water presses on them, and they on the stand. In the narrow one it is the other way: the sloping walls themselves press the water down, so the bottom gets more than the water weighs.',
    ),
    say: both((l) => (correct === 'same' ? (l === 'uk' ? `Манометр щоразу показував те саме — на дно тисне ≈ ${N(F, l)}, хоч води й різна кількість!` : `The manometer showed the same each time — ≈ ${N(F, l)} on the bottom, though the water differed!`) : l === 'uk' ? 'Подивімося, що показав манометр.' : 'Let us look at the manometer.')),
    text: both((l) =>
      l === 'uk'
        ? `Дно ${formatMeasured('length', d, 0.001, l)} у діаметрі, площа S ≈ ${sig(S * 1e4, 3, l)} см². ${list(l)}. Тиск на дні p = ρ·g·Δh${correct === 'same' ? ' однаковий' : ''}, а сила тиску на дно F = p·S ≈ ${N(F, l)}${correct === 'same' ? ' в усіх трьох' : ''}. Води ж пішло в кілька разів різна кількість: у посудині, що розширюється, вода важить більше, ніж тисне на дно, а в тій, що звужується, — менше. Тиск на дно залежить від висоти води й площі дна, а не від форми посудини й не від того, скільки води налито, — це й є гідростатичний парадокс.`
        : `The bottom is ${formatMeasured('length', d, 0.001, l)} across, its area S ≈ ${sig(S * 1e4, 3, l)} cm². ${list(l)}. The pressure at the bottom p = ρ·g·Δh${correct === 'same' ? ' is alike' : ''}, and the force on the bottom F = p·S ≈ ${N(F, l)}${correct === 'same' ? ' in all three' : ''}. Yet the water poured differed several times: in the widening vessel the water weighs more than it presses on the bottom, in the narrowing one less. The pressure on the bottom depends on the water’s height and the bottom’s area, not on the vessel’s shape or on how much water was poured — that is the hydrostatic paradox.`,
    ),
  };
};
