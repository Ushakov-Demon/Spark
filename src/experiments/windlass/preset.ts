import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, MOTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { type Locale, tr } from '../../knowledge/i18n.js';
import { type WinchSpool, winchSpoolName } from './bench.js';
import { sig } from '../../explain/format.js';

export const preset_windlass: Preset = {
  ask: { uk: 'Скільки обертів робить котушка, поки вантаж опускається на 30 см?', en: 'How many turns does the spool make while the load goes down 30 cm?' },
  id: 'windlass',
  grade: 7,
  topic: MOTION,
  title: { uk: 'Конструюємо ворот: прямолінійний рух і обертання', en: 'Building a windlass: straight motion and turning' },
  question: {
    uk: 'Збираємо на штативі ворот, як у колодязя: на вісь із ручкою надіваємо котушку від ниток (діаметр — 2 см, виміряли лінійкою), намотуємо нитку, на кінці — невеликий вантаж. Опускаємо вантаж на 30 см і рахуємо оберти котушки за міткою на ній, потім те саме з олівцем (8 мм) замість котушки. А тоді навпаки — повертаємо ручку 5 разів і вимірюємо, на скільки піднявся вантаж. Скільки обертів робить котушка, поки вантаж опускається на 30 см?',
    en: 'We build a windlass on a stand, like a well’s: a cotton reel (2 cm across, measured by a ruler) goes on an axis with a handle, a thread is wound on it, a small load at its end. We let the load down by 30 cm and count the reel’s turns by a mark on it, then the same with a pencil (8 mm) instead of the reel. And then the other way — we turn the handle 5 times and measure how far the load rose. How many turns does the spool make while the load goes down 30 cm?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'winch',
  plan: [
    { kind: 'bench', command: { type: 'lab.winch', spool: 'reel', mode: 'lower', amount: 0.3 } },
    { kind: 'bench', command: { type: 'lab.winch', spool: 'pencil', mode: 'lower', amount: 0.3 } },
    { kind: 'bench', command: { type: 'lab.winch', spool: 'reel', mode: 'turn', amount: 5 } },
    { kind: 'bench', command: { type: 'lab.winch', spool: 'pencil', mode: 'turn', amount: 5 } },
  ],
  choices: [ch('circle', 'Стільки, скільки разів довжина кола котушки (π·d) вміщується в 30 см', 'As many as the spool’s circumference (π·d) fits into 30 cm'), ch('diameter', 'Стільки, скільки разів діаметр котушки вміщується в 30 см', 'As many as the spool’s diameter fits into 30 cm'), ch('same', 'Будь-яка котушка зробить однаково обертів', 'Any spool makes the same number of turns')],
  answerOnBoard: ['wc:'],
  formulas: ['mechanics.wound-length'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 1. Механічний рух', match: 'same', quote: 'конструювання механізмів, що перетворюють прямолінійний рух на обертальний і навпаки' }],
  expect: 'reached',
};

export const answer_windlass = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.winch' && x.record.value !== null).map((x) => ({ spool: String(x.command['spool']), mode: String(x.command['mode']), amount: Number(x.command['amount']), v: x.record.value!, d: x.record.inputs?.['diameter'] ?? 0 }));
  const turns = R.filter((x) => x.mode === 'lower');
  // Each count against l / (π·d) and l / d: which one the turns follow (to a quarter turn).
  const byCircle = turns.length > 0 && turns.every((x) => Math.abs(x.v - x.amount / (Math.PI * x.d)) <= 0.25);
  const num = (x: number, l: Locale) => sig(x, 3, l);
  const cm = (x: number, l: Locale) => `${sig(x * 100, 3, l)} ${l === 'uk' ? 'см' : 'cm'}`;
  const name = (sp: string, l: Locale) => tr(winchSpoolName(sp as WinchSpool), l);
  return {
    ...(byCircle ? { correct: 'circle' } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Нитка лежить на котушці кільцями. За один оберт котушки з неї змотується один виток — це довжина кола котушки, C = π·d. Тож вантаж, опускаючись на l, обертає котушку n = l / (π·d) разів: прямолінійний рух вантажу стає обертанням котушки. І навпаки: повертаючи ручку n разів, намотуємо n·π·d нитки — обертання стає прямолінійним рухом вантажу. Тонкий олівець має коротше коло, тож на ті самі 30 см обертається більше разів, а за ті самі 5 обертів піднімає вантаж менше. Так працюють ворот колодязя, котушка спінінга, рулетка; а рейка з шестірнею чи колесо, що котиться, роблять те саме без нитки. Товщину нитки тут не враховано — з нею кожен виток трохи довший.'
        : 'The thread lies on the spool in rings. One turn of the spool unwinds one ring — the spool’s circumference, C = π·d. So the load, going down by l, turns the spool n = l / (π·d) times: the load’s straight motion becomes the spool’s turning. And back: turning the handle n times winds n·π·d of thread — turning becomes the load’s straight motion. The thin pencil has a shorter circumference, so it turns more times for the same 30 cm, and lifts the load less in the same 5 turns. This is how a well’s windlass, a fishing reel, a tape measure work; a rack and pinion or a rolling wheel do the same without a thread. The thread’s thickness is left out here — with it each ring is a little longer.',
    ),
    say: both((l) => {
      const a = turns[0];
      return a ? (l === 'uk' ? `${name(a.spool, l).replace(/^./, (ch) => ch.toUpperCase())}: ${num(a.v, l)} оберту на 30 см — стільки разів π·d вміщується в довжину нитки.` : `${name(a.spool, l).replace(/^./, (ch) => ch.toUpperCase())}: ${num(a.v, l)} turns for 30 cm — as many times as π·d fits into the thread.`) : '';
    }),
    text: both((l) => {
      const uk = l === 'uk';
      const parts = R.map((x) =>
        x.mode === 'lower'
          ? uk ? `${name(x.spool, l)}, вантаж опустився на ${cm(x.amount, l)} — ${num(x.v, l)} об. (l / (π·d) = ${sig(x.amount / (Math.PI * x.d), 3, l)})` : `${name(x.spool, l)}, the load down ${cm(x.amount, l)} — ${num(x.v, l)} turns (l / (π·d) = ${sig(x.amount / (Math.PI * x.d), 3, l)})`
          : uk ? `${name(x.spool, l)}, ${x.amount} обертів ручки — вантаж піднявся на ${cm(x.v, l)} (π·d·n = ${cm(Math.PI * x.d * x.amount, l)})` : `${name(x.spool, l)}, ${x.amount} turns of the handle — the load rose ${cm(x.v, l)} (π·d·n = ${cm(Math.PI * x.d * x.amount, l)})`,
      );
      const s = `${parts.join('; ')}.`;
      return s.charAt(0).toUpperCase() + s.slice(1) + (uk ? ' Оберти лічено за міткою — до чверті оберту.' : ' The turns are counted by a mark — to a quarter turn.');
    }),
  };
};
