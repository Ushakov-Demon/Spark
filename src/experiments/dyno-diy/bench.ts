import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { cite, sv } from '../../components/sourced.js';
import { G } from '../../domains/mechanics/constants.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import type { SourcedValue } from '../../knowledge/types.js';
import { BENCH_SPRING_K, BENCH_WEIGHT } from '../../scenarios/bench-kit.js';
import { EGG } from '../scales-diy/bench.js';

/**
 * A dynamometer of our own (grade 7, «конструювання: … динамометра»): a strip of paper on a board, a spring of the
 * set (25 N/m) hung from a nail, a wire pointer and a paper-clip hook at its end. The pointer unloaded is 0; 100 g
 * weights — one, two, three — each pull with 0.98 N, and a pencil mark goes by the pointer each time. The marks lie
 * evenly (Hooke's law), so the scale is divided evenly: so many millimetres to the newton, a division every 0.1 N.
 * Then the new dynamometer weighs a small apple — about 1 N, the unit named after Newton — and the egg of the
 * home-made scales.
 */

/** A small apple (Wikipedia: «a small apple with mass 100 g exerts about one newton»). */
export const APPLE: SourcedValue = sv(0.1, 'kg', 'a small apple', 'single-source', 0.2, [cite('wikipedia-newton-unit', 'A small apple with mass 100 g exerts about one newton of force at Earth’s surface', '—', 0.1)], 'Apples differ; a small one is taken.');
/** The pencil marks are read with a ruler to a millimetre; the scale is divided every 0.1 N. */
export const DYNO_RULER = 0.001;
export const DYNO_DIVISION = 0.1;
/** How far the pointer goes for a force, m. */
export const pointerAt = (force: number): number => force / BENCH_SPRING_K.value;

export type DynoStep = 'marks' | 'scale' | 'apple' | 'egg';
/** A step: the marks for 1, 2, 3 weights; the scale divided; the apple; the egg. */
export interface DynoCommand {
  readonly type: 'lab.dyno';
  readonly step: DynoStep;
}

/** The marks the weights leave, mm-rounded, m. */
const marks = (): number[] => [1, 2, 3].map((n) => Math.round(pointerAt(n * BENCH_WEIGHT.value * G) / DYNO_RULER) * DYNO_RULER);
/** The newton's length on the scale, from the marks (the mean of x/F), m — to a millimetre. */
export const newtonLength = (): number => {
  const x = marks();
  const per = x.reduce((s, v, i) => s + v / ((i + 1) * BENCH_WEIGHT.value * G), 0) / x.length;
  return Math.round(per / DYNO_RULER) * DYNO_RULER;
};

export const dynoCommand: CommandHandler<DynoCommand> = {
  type: 'lab.dyno',
  apply(state, c) {
    switch (c.step) {
      case 'marks':
        return ok({ state, kind: 'measurement', externalEnergy: 0, trace: marks().map((x, i): MeasurementRecord => ({ kind: 'measurement', instrument: 'ruler', quantity: 'length', value: x, exact: pointerAt((i + 1) * BENCH_WEIGHT.value * G), entities: [], inputs: { weights: i + 1, force: (i + 1) * BENCH_WEIGHT.value * G, division: DYNO_RULER } })) });
      case 'scale': {
        const L = newtonLength();
        return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [{ kind: 'measurement', instrument: 'ruler', quantity: 'length', value: L, exact: 1 / BENCH_SPRING_K.value, entities: [], inputs: { division: DYNO_RULER, tenth: L / 10 } }] });
      }
      case 'apple':
      case 'egg': {
        const m = c.step === 'apple' ? APPLE.value : EGG.value;
        const F = m * G;
        // Read on our own scale: the pointer's place in the scale's newtons.
        const read = pointerAt(F) / newtonLength();
        return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [{ kind: 'measurement', instrument: 'dynamometer-diy', quantity: 'force', value: Math.round(read / DYNO_DIVISION) * DYNO_DIVISION, exact: F, entities: [], inputs: { mass: m, g: G, pointer: pointerAt(F), division: DYNO_DIVISION } }] });
      }
      default:
        return err({ uk: 'Такого кроку в досліді немає.', en: 'No such step in the experiment.' });
    }
  },
};

export const DYNO_COMMANDS = [dynoCommand] as const;

const STEP: Record<DynoStep, { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  marks: {
    say: { uk: 'Динамометр майструємо так: на дощечку наклеюємо смужку паперу, зверху на цвях чіпляємо пружину з набору, а на її кінці — дротяну стрілку й гачок із канцелярської скріпки. Де стрілка без вантажу — ставимо нуль. Тепер чіплятимемо тягарці по 100 г — один, два, три — і щоразу ставитимемо олівцем риску біля стрілки.', en: 'We make the dynamometer like this: a strip of paper glued on a board, a spring of the set hung from a nail at the top, a wire pointer and a paper-clip hook at its end. Where the pointer stands unloaded, we put 0. Now we hang 100 g weights — one, two, three — and each time make a pencil mark by the pointer.' },
    button: { uk: '✏ Риски від тягарців', en: '✏ Marks from the weights' },
    plan: { uk: 'риски від одного, двох і трьох тягарців', en: 'marks from one, two and three weights' },
  },
  scale: {
    say: { uk: 'Тягарець 100 г тягне вниз із силою 0,98 Н. Лінійкою виміряємо, де лягли риски. Якщо відстані між ними однакові, шкалу можна розбити рівно: знайдемо, скільки міліметрів припадає на 1 Н, і нанесемо поділки через 0,1 Н.', en: 'A 100 g weight pulls down with 0.98 N. With a ruler we measure where the marks fell. If they are evenly spaced, the scale can be divided evenly: we find how many millimetres go to 1 N and put divisions every 0.1 N.' },
    button: { uk: '📏 Розбити шкалу', en: '📏 Divide the scale' },
    plan: { uk: 'розбити шкалу на ньютони', en: 'divide the scale into newtons' },
  },
  apple: {
    say: { uk: 'Чіпляємо невелике яблуко — грамів на сто. Кажуть, саме падіння яблука наштовхнуло Ісаака Ньютона на думку про тяжіння. Його приятель Вільям Стьюклі записав цю історію зі слів самого Ньютона й видав 1752 року: яблуко впало, коли Ньютон сидів, замислившись. А от про яблуко, що влучило в голову, там ні слова — це домалювали пізніше. Що покаже наш динамометр?', en: 'We hang a small apple — about a hundred grams. They say it was a falling apple that set Isaac Newton thinking about gravity. His friend William Stukeley wrote the story down from Newton’s own words and it came out in 1752: the apple fell as Newton sat in thought. Of an apple hitting his head there is not a word — that was drawn in later. What will our dynamometer show?' },
    button: { uk: '🍎 Яблуко на динамометр', en: '🍎 The apple on the dynamometer' },
    plan: { uk: 'яблуко на динамометр', en: 'the apple on the dynamometer' },
  },
  egg: {
    say: { uk: 'А тепер — у пакетику — яйце, яке ми зважили на саморобних терезах. Чи погодяться між собою два наші саморобні прилади?', en: 'And now — in a little bag — the egg we weighed on our home-made scales. Will our two home-made instruments agree?' },
    button: { uk: '🥚 Яйце на динамометр', en: '🥚 The egg on the dynamometer' },
    plan: { uk: 'яйце на динамометр', en: 'the egg on the dynamometer' },
  },
};

export const DYNO_TEXT: Record<DynoCommand['type'], (c: DynoCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.dyno': (x) => STEP[(x as DynoCommand).step],
};
