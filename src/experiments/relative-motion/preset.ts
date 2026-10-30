import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, MOTION, room, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';

export const preset_relative_motion: Preset = {
  ask: { uk: 'Чи однакові траєкторія й шлях бульбашки відносно пляшки та відносно стола?', en: 'Are the bubble’s path and trajectory the same relative to the bottle and to the table?' },
  id: 'relative-motion',
  grade: 7,
  topic: MOTION,
  title: { uk: 'Відносність руху: бульбашка в пляшці, що їде', en: 'The relativity of motion: a bubble in a moving bottle' },
  question: {
    uk: 'Знову перевернута пляшка густої рідини для миття посуду й бульбашка ≈ 4 мм, що спливає від нульової позначки до позначки 9 см. За пляшкою на столі закріплено аркуш паперу: на ньому маркером позначаємо, де бульбашка була на старті й на фініші, і вимірюємо відрізок між позначками. Спершу пляшка стоїть, а потім, поки бульбашка спливає, ведемо пляшку вздовж лінійки — повільно й швидше. Щоразу засікаємо час і вимірюємо, на скільки зсунулася пляшка. Чи однакові траєкторія й шлях бульбашки відносно пляшки та відносно стола?',
    en: 'The upside-down bottle of thick washing-up liquid again, and a ≈ 4 mm bubble rising from the zero mark to the 9 cm one. A sheet of paper is fixed to the table behind the bottle: we mark on it with a marker where the bubble was at the start and at the finish, and measure the line between. First the bottle stands, then, while the bubble rises, we carry the bottle along a ruler — slowly and faster. Each time we time it and measure how far the bottle moved. Are the bubble’s path and trajectory the same relative to the bottle and to the table?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'carry',
  plan: [0, 0.005, 0.01].map((speed) => ({ kind: 'bench', command: { type: 'lab.carry', speed } }) as const),
  choices: [ch('depends', 'Ні: відносно пляшки — та сама вертикаль 9 см, а відносно стола — похила пряма й довший шлях', 'No: relative to the bottle the same 9 cm upright, relative to the table a slanted line and a longer path'), ch('same', 'Так: бульбашка ж спливає так само', 'Yes: the bubble rises just the same'), ch('slower', 'Ні: бульбашка спливає повільніше, коли пляшку ведуть', 'No: the bubble rises slower while the bottle is carried')],
  formulas: ['mechanics.speed'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 1. Механічний рух', match: 'same', quote: 'моделювання: відносності руху' },
    { program: 'ua-nus-2023-kreminskyi', grade: 7, topic: 'Тема 2. Механічний рух', match: 'related', quote: 'Механічний рух. Відносність руху та спокою. Система відліку.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 7, «Чому механічний рух є відносним?»: «Форма траєкторії руху, шлях і переміщення тіла залежать від того, відносно якої системи відліку розглядають рух»' } },
  ],
  expect: 'reached',
};

export const answer_relative_motion = (run: PresetRun): PresetAnswer => {
  // Each step: the time, the bottle's shift and the bubble's path on the paper (the records by `which`).
  const steps = new Map<number, { u: number; t?: number; x?: number; s?: number }>();
  for (const r of (run.readings ?? []).filter((x) => x.command.type === 'lab.carry' && x.record.value !== null)) {
    const u = Number(r.command['speed']);
    const e = steps.get(u) ?? { u };
    const w = r.record.inputs?.['which'];
    if (w === 0) e.t = r.record.value!;
    else if (w === 1) e.x = r.record.value!;
    else e.s = r.record.value!;
    steps.set(u, e);
  }
  const R = [...steps.values()].sort((a, b) => a.u - b.u);
  const cm = (x: number, l: Locale) => `${sig(x * 100, 3, l)} ${l === 'uk' ? 'см' : 'cm'}`;
  const sec = (x: number, l: Locale) => formatMeasured('time', x, 0.01, l);
  const longer = R.length > 1 && R.every((x, i) => i === 0 || (x.s ?? 0) > (R[i - 1]!.s ?? 0));
  const sameTime = R.every((x) => Math.abs((x.t ?? 0) - (R[0]!.t ?? 0)) < 0.05);
  return {
    ...(longer && sameTime ? { correct: 'depends' } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Рух завжди описують відносно чогось — тіла відліку. Відносно пляшки бульбашка щоразу піднімається вертикально на ті самі 9 см і за той самий час: рідина в пляшці нічого не знає про те, що пляшку ведуть. Але відносно стола бульбашка водночас і піднімається, і їде разом із пляшкою вбік. Два рівномірні рухи складаються в один — уздовж похилої прямої, — і що швидше ведемо пляшку, то довший цей шлях і більша швидкість бульбашки відносно стола. Тож траєкторія, шлях і швидкість залежать від того, відносно чого розглядають рух; а час підйому — ні. Так само яблуко, що впало в автобусі, для пасажира падає прямовисно, а для людини на зупинці — летить по кривій.'
        : 'Motion is always described relative to something — a body of reference. Relative to the bottle the bubble rises straight up the same 9 cm in the same time each time: the liquid in the bottle knows nothing of the bottle being carried. But relative to the table the bubble at once rises and travels sideways with the bottle. The two uniform motions add up into one — along a slanted straight line — and the faster the bottle is carried, the longer that path and the faster the bubble goes relative to the table. So the trajectory, the path and the speed depend on what the motion is described relative to; the time of the rise does not. In the same way an apple dropped in a bus falls straight down for a passenger, but flies along a curve for someone at the stop.',
    ),
    say: both((l) => {
      const a = R[0];
      const z = R.at(-1);
      return a && z && a !== z ? (l === 'uk' ? `Відносно пляшки — щоразу 9 см угору, а відносно стола — від ${cm(a.s ?? 0, l)} до ${cm(z.s ?? 0, l)}, за той самий час.` : `Relative to the bottle — 9 cm up each time; relative to the table — from ${cm(a.s ?? 0, l)} to ${cm(z.s ?? 0, l)}, in the same time.`) : '';
    }),
    text: both((l) => {
      const uk = l === 'uk';
      const parts = R.map((x) => {
        const how = x.u === 0 ? (uk ? 'пляшка стоїть' : 'the bottle stands') : uk ? `пляшку ведуть ${sig(x.u * 100, 2, l)} см/с` : `the bottle carried at ${sig(x.u * 100, 2, l)} cm/s`;
        const moved = x.u === 0 ? (uk ? 'пляшка не зсунулася' : 'the bottle did not move') : uk ? `пляшка зсунулася на ${cm(x.x ?? 0, l)}` : `the bottle moved ${cm(x.x ?? 0, l)}`;
        return uk ? `${how}: ${sec(x.t ?? 0, l)}, ${moved}, шлях бульбашки відносно стола ${cm(x.s ?? 0, l)}` : `${how}: ${sec(x.t ?? 0, l)}, ${moved}, the bubble’s path relative to the table ${cm(x.s ?? 0, l)}`;
      });
      const s = `${parts.map(stepLine).join(';') + STEPS_END}.`;
      return s.charAt(0).toUpperCase() + s.slice(1) + (uk ? ' Відносно пляшки шлях щоразу 9 см.' : ' Relative to the bottle the path is 9 cm each time.');
    }),
  };
};
