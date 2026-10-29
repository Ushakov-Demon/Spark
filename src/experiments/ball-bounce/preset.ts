import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, WORK, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { BOUNCE_FROM, type BounceBall, bounceBallName } from './bench.js';
import { G } from '../../domains/mechanics/constants.js';
import { type Locale, tr } from '../../knowledge/i18n.js';
import { sig } from '../../explain/format.js';

export const preset_ball_bounce: Preset = {
  ask: { uk: 'Чому м’ячик щоразу підскакує нижче?', en: 'Why does the ball bounce lower each time?' },
  id: 'ball-bounce',
  grade: 7,
  topic: WORK,
  title: { uk: 'Перетворення механічної енергії: відскок м’яча', en: 'Mechanical energy changing form: a ball’s bounce' },
  question: {
    uk: 'Поруч зі стальною плитою стоїть метрова лінійка. Відпускаємо м’ячик для настільного тенісу з висоти 1 м і помічаємо, на яку висоту він підскочить, — після першого удару, другого, третього. Потім так само тенісний м’яч і пластилінову кульку. Нагорі в м’ячика потенціальна енергія Eп = m·g·h, а вона пропорційна висоті. Чому м’ячик щоразу підскакує нижче?',
    en: 'A metre stick stands by a steel plate. We let a table tennis ball go from 1 m and mark how high it bounces — after the first impact, the second, the third. Then the same with a tennis ball and a plasticine ball. At the top the ball has potential energy Eₚ = m·g·h, proportional to the height. Why does the ball bounce lower each time?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'bounce',
  plan: ([['pingpong', 1], ['pingpong', 2], ['pingpong', 3], ['tennis', 1], ['clay', 1]] as const).map(([ball, bounce]) => ({ kind: 'bench', command: { type: 'lab.bounce', ball, bounce } }) as const),
  choices: [ch('heat', 'Під час удару частина енергії стає внутрішньою: м’ячик і плита трохи нагріваються, ще частина йде на звук', 'At each impact part of the energy becomes internal: the ball and the plate warm a little, and part goes as sound'), ch('gone', 'Під час удару частина енергії просто зникає', 'At each impact part of the energy simply vanishes'), ch('gravity', 'Земля щоразу притягує м’ячик сильніше', 'The Earth pulls the ball harder each time')],
  formulas: ['mechanics.potential-energy'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 4. Механічна робота, потужність, енергія', match: 'same', quote: 'виявлення зміни і перетворення механічної енергії' },
    { program: 'ua-nus-2023-kreminskyi', grade: 8, topic: 'Тема 1. Момент сили. Механічна робота та енергія', match: 'related', quote: 'Механічна енергія та її види. Закон збереження та перетворення енергії.' },
  ],
  expect: 'reached',
};

export const answer_ball_bounce = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.bounce' && x.record.value !== null).map((x) => ({ ball: String(x.command['ball']) as BounceBall, n: Number(x.command['bounce']), h: x.record.value!, m: x.record.inputs?.['mass'] ?? 0 }));
  const cm = (h: number) => Math.round(h * 100);
  const pp = R.filter((x) => x.ball === 'pingpong').sort((a, b) => a.n - b.n);
  const lower = pp.length > 1 && pp.every((x, i) => x.h < (i === 0 ? BOUNCE_FROM : pp[i - 1]!.h));
  // The energy at a top, millijoules: Eп = m·g·h.
  const mJ = (m: number, h: number, l: Locale) => `${sig(m * G * h * 1000, 2, l)} ${l === 'uk' ? 'мДж' : 'mJ'}`;
  return {
    ...(lower ? { correct: 'heat' } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Нагорі м’ячик має потенціальну енергію Eп = m·g·h. Падаючи, він розганяється: потенціальна енергія переходить у кінетичну. Ударившись об плиту, м’ячик на мить сплющується, а тоді розпрямляється й відштовхується — і, піднімаючись, знову міняє кінетичну енергію на потенціальну. Але сплющення повертає не все: частина енергії йде на нагрівання м’ячика й плити (стає внутрішньою енергією), частина — на звук удару. Тому механічної енергії щоразу менше, і м’ячик піднімається нижче: висота показує, яку частку енергії він зберіг. Енергія не зникає — вона лише переходить в інші види: це закон збереження енергії. Пружний м’ячик для настільного тенісу зберігає близько 80 % за удар, тенісний м’яч — трохи більше половини, а пластилін, сплющившись, лишається на плиті: уся його механічна енергія стала внутрішньою. Земля ж притягує м’ячик однаково на будь-якій із цих висот.'
        : 'At the top the ball has potential energy Eₚ = m·g·h. Falling, it speeds up: potential energy turns into kinetic. Hitting the plate, the ball is squashed for a moment, then straightens and pushes off — and, rising, trades kinetic energy back for potential. But the squashing does not give everything back: part of the energy warms the ball and the plate (becomes internal energy), part goes as the sound of the impact. So there is less mechanical energy each time, and the ball rises lower: the height shows the share of energy it kept. Energy does not vanish — it only turns into other forms: this is the conservation of energy. A springy table tennis ball keeps about 80 % per impact, a tennis ball a little over half, and plasticine, squashed, stays on the plate: all its mechanical energy became internal. The Earth pulls the ball just the same at any of these heights.',
    ),
    say: both((l) => {
      const a = pp[0];
      return a ? (l === 'uk' ? `З метра м’ячик для настільного тенісу підскочив на ${cm(a.h)} см — зберіг ${cm(a.h)} % енергії; щоразу — приблизно стільки ж від попередньої.` : `From a metre the table tennis ball bounced to ${cm(a.h)} cm — it kept ${cm(a.h)} % of its energy; each time about the same share of the one before.`) : '';
    }),
    text: both((l) => {
      const uk = l === 'uk';
      const parts = [
        ...(pp.length ? [uk ? `М’ячик для настільного тенісу з 1 м: ${pp.map((x) => `${cm(x.h)} см`).join(', ')} — енергія ${mJ(pp[0]!.m, BOUNCE_FROM, l)} нагорі, ${pp.map((x) => mJ(x.m, x.h, l)).join(', ')} після ударів` : `The table tennis ball from 1 m: ${pp.map((x) => `${cm(x.h)} cm`).join(', ')} — an energy of ${mJ(pp[0]!.m, BOUNCE_FROM, l)} at the top, ${pp.map((x) => mJ(x.m, x.h, l)).join(', ')} after the impacts`] : []),
        ...R.filter((x) => x.ball !== 'pingpong').map((x) => `${tr(bounceBallName(x.ball), l)} — ${cm(x.h)} ${uk ? 'см' : 'cm'}${x.h > 0 ? (uk ? `, зберіг ${cm(x.h)} % енергії` : `, it kept ${cm(x.h)} % of its energy`) : uk ? ': уся енергія стала внутрішньою' : ': all the energy became internal'}`),
      ];
      const s = `${parts.join('; ')}.`;
      return s.charAt(0).toUpperCase() + s.slice(1) + (uk ? ' Частки — з випробувань м’ячів за правилами ITTF і ITF; опір повітря не враховано.' : ' The shares are from the balls’ tests under the ITTF and ITF rules; the air’s drag is left out.');
    }),
  };
};
