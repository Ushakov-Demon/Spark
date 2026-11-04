import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { cite, sv } from '../../components/sourced.js';
import { G } from '../../domains/mechanics/constants.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import { msg } from '../../knowledge/messages.js';
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
        return err(msg('dyno-diy-command-apply'));
    }
  },
};

export const DYNO_COMMANDS = [dynoCommand] as const;

const STEP: Record<DynoStep, { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  marks: {
    say: msg('dyno-diy-marks-say'),
    button: msg('dyno-diy-marks-button'),
    plan: msg('dyno-diy-marks-plan'),
  },
  scale: {
    say: msg('dyno-diy-scale-say'),
    button: msg('dyno-diy-scale-button'),
    plan: msg('dyno-diy-scale-plan'),
  },
  apple: {
    say: msg('dyno-diy-apple-say'),
    button: msg('dyno-diy-apple-button'),
    plan: msg('dyno-diy-apple-plan'),
  },
  egg: {
    say: msg('dyno-diy-egg-say'),
    button: msg('dyno-diy-egg-button'),
    plan: msg('dyno-diy-egg-plan'),
  },
};

export const DYNO_TEXT: Record<DynoCommand['type'], (c: DynoCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.dyno': (x) => STEP[(x as DynoCommand).step],
};
