import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { DRAG_COEFFICIENTS, DRAG_MASS, DRAG_START, DRAG_TRACK, dragBody, type DragShape, dragShapeName, framesText, mediumDensity } from './bench.js';
import { G } from '../../domains/mechanics/constants.js';
import { type Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';

export const preset_drag_form: Preset = {
  ask: { uk: 'Яке тіло з тієї самої грудки пластиліну тонутиме найповільніше?', en: 'Which body from the same lump of plasticine sinks slowest?' },
  id: 'drag-form',
  grade: 7,
  topic: INTERACTION,
  title: { uk: 'Форма тіла, середовище й сила опору', en: 'The form of a body, the medium and the drag' },
  question: {
    uk: 'З тієї самої грудки пластиліну (5 г) ліпимо по черзі кульку, кубик і пласку квадратну пластинку й відпускаємо біля поверхні води в акваріумі. На склі дві позначки на відстані 20 см, перша — на 5 см нижче поверхні. Знімаємо телефоном (30 кадрів за секунду) й за кадрами рахуємо, скільки часу тіло йде між позначками. Наостанок ту саму кульку відпускаємо в повітрі. Яке тіло тонутиме у воді найповільніше?',
    en: 'From the same lump of plasticine (5 g) we mould in turn a ball, a cube and a flat square plate and let each go at the water’s surface in an aquarium. On the glass are two marks 20 cm apart, the first 5 cm below the surface. We film it with a phone (30 frames a second) and count by the frames how long the body takes between the marks. At last the same ball is let go in the air. Which body sinks slowest in the water?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'drag',
  plan: [
    ...(['ball', 'cube', 'plate'] as const).map((shape) => ({ kind: 'bench', command: { type: 'lab.drag', shape, medium: 'water' } }) as const),
    { kind: 'bench', command: { type: 'lab.drag', shape: 'ball', medium: 'air' } },
  ],
  choices: [ch('plate', 'Пластинка', 'The plate'), ch('ball', 'Кулька', 'The ball'), ch('same', 'Усі однаково: маса ж та сама', 'All alike: the mass is the same')],
  formulas: ['mechanics.speed'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'між формою тіла, густиною середовища і силою опору середовища' },
  ],
  expect: 'reached',
};

export const answer_drag_form = (run: PresetRun): PresetAnswer => {
  const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.drag' && x.record.value !== null);
  const of = (shape: DragShape, medium: 'water' | 'air') => recs.find((x) => x.command['shape'] === shape && x.command['medium'] === medium)?.record ?? null;
  const water = (['ball', 'cube', 'plate'] as const).map((shape) => ({ shape, r: of(shape, 'water') })).filter((x) => x.r !== null);
  const air = of('ball', 'air');
  const slowest = water.length === 3 ? water.reduce((a, b) => (b.r!.value! > a.r!.value! ? b : a)).shape : undefined;
  const fr = (r: { value: number | null; inputs?: Record<string, number> }, l: Locale) => `${framesText(r.inputs?.['frames'] ?? 0, l === 'uk')} (${formatMeasured('time', r.value!, 0.01, l)}, v ≈ ${sig(DRAG_TRACK / r.value!, 2, l)} ${l === 'uk' ? 'м/с' : 'm/s'})`;
  const { volume } = dragBody('ball');
  const rhoW = mediumDensity('water');
  const Fd = DRAG_MASS * G - rhoW * G * volume;
  const free = Math.sqrt((2 * (DRAG_START + DRAG_TRACK)) / G) - Math.sqrt((2 * DRAG_START) / G);
  const ratio = rhoW / mediumDensity('air');
  const cd = (s: DragShape, l: Locale) => sig(DRAG_COEFFICIENTS[s].value, 3, l);
  return {
    ...(slowest === 'plate' ? { correct: 'plate' } : slowest === 'ball' ? { correct: 'ball' } : {}),
    why: both((l) =>
      l === 'uk'
        ? `Рухаючись, тіло мусить розштовхувати воду перед собою, а позаду нього закручуються вихори. Що швидше тіло, то більша сила опору — за таких швидкостей вона зростає пропорційно квадрату швидкості. Тіло розганяється, доки опір не зрівняється з вагою мінус архімедова сила, а далі йде рівномірно. Маса й об’єм у трьох тіл однакові, тож і рівномірно вони йдуть за однакової сили опору — різниться лише швидкість, за якої вона настає. Кулька обтічна: вода плавно огинає її, вихорів позаду мало, і перетин у неї невеликий. Кубик пласкою гранню вперед зриває потік на ребрах, і вихорів більше: він підставляє воді навіть меншу площу, ніж кулька, а проте повільніший — тут вирішує саме форма. Пластинка плазом підставляє воді найбільшу площу — тому вона найповільніша. Інша річ — середовище: що воно густіше, то більшу масу тіло мусить щомиті відштовхнути, тож за тієї самої швидкості вода опирається в ≈ ${sig(ratio, 2, l)} разів сильніше, ніж повітря, — у стільки ж разів вона густіша.\n\nМодель спрощена: насправді пластинка гойдається й зісковзує вбік, а кубик може перекинутися, тож у справжньому досліді час буде трохи іншим. Коефіцієнти опору виміряні для гладких тіл; пластилінові, зліплені руками, відрізнятимуться.`
        : `Moving, a body has to push the water in front of it aside, and behind it eddies swirl. The faster the body, the greater the drag — at these speeds it grows as the square of the speed. The body speeds up until the drag equals its weight less the buoyant force, and then goes steadily. The three bodies have the same mass and volume, so they go steadily under the same drag — only the speed at which it is reached differs. The ball is streamlined: the water flows smoothly round it, few eddies behind it, and its cross-section is small. The cube, a flat face first, breaks the flow at its edges, and there are more eddies: it shows the water even less area than the ball, and yet it is slower — here the form alone decides. The plate, lying flat, shows the water the largest area — so it is the slowest. The medium is another matter: the denser it is, the more mass the body has to push aside each second, so at the same speed water resists ≈ ${sig(ratio, 2, l)} times more than air — as many times as it is denser.\n\nThe model is simplified: in truth the plate rocks and slides aside, and the cube may tip over, so in a real experiment the times come out a little different. The drag coefficients were measured for smooth bodies; hand-moulded plasticine ones will differ.`,
    ),
    say: both((l) => (l === 'uk' ? 'Та сама маса — а швидкість різна: усе вирішують форма й середовище!' : 'The same mass — different speeds: the form and the medium decide!')),
    text: both((l) => {
      const uk = l === 'uk';
      const parts = water.map((x) => `${dragShapeName(x.shape)[l]} — ${fr(x.r!, l)}`).join('; ');
      const a = air ? (uk ? ` У повітрі та сама кулька пролетіла 20 см за ${fr(air, l)} — майже як у вільному падінні (${formatMeasured('time', free, 0.001, l)}): опір повітря тут мізерний.` : ` In the air the same ball covered 20 cm in ${fr(air, l)} — nearly as in free fall (${formatMeasured('time', free, 0.001, l)}): the air hardly resists here.`) : '';
      return uk
        ? `У воді між позначками: ${parts}. Вага всіх тіл однакова, архімедова сила теж, тож, рухаючись рівномірно, кожне зазнає однакової сили опору: F = m·g − ρ·g·V ≈ ${sig(Fd, 2, l)} Н. Але пластинка набирає її вже за малої швидкості, а кулька — лише за найбільшої.${a} Сила опору F = C·ρ·v²·S / 2 залежить від форми тіла (коефіцієнт опору C: кулька ${cd('ball', l)}, кубик ${cd('cube', l)}, пластинка ${cd('plate', l)}), площі S, яку тіло підставляє зустрічному потоку, і густини середовища ρ.`
        : `In water between the marks: ${parts}. All bodies weigh the same, the buoyant force too, so moving steadily each meets the same drag: F = m·g − ρ·g·V ≈ ${sig(Fd, 2, l)} N. But the plate reaches it at a low speed already, the ball only at the highest.${a} The drag F = C·ρ·v²·S / 2 depends on the body’s form (the drag coefficient C: ball ${cd('ball', l)}, cube ${cd('cube', l)}, plate ${cd('plate', l)}), the area S it shows to the oncoming flow, and the medium’s density ρ.`;
    }),
  };
};
