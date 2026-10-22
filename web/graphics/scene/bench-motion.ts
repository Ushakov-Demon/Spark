import { BENCH_SPRING_K, BENCH_WEIGHT, WEIGHT_SET } from '../../../src/scenarios/bench.js';
import type { LocalizedText } from '../../../src/knowledge/i18n.js';
import { Channel, type Motion, type ProcedureStep } from '../../motion.js';
import type { BenchView } from './bench.js';

/**
 * How each instrument of the bench comes to its reading, described once — the motion itself is the general
 * one of motion.ts. A new reading is played from the previous picture to the new one; what moves and by
 * which law follows from the instrument (a spring's period from its stiffness and load: T = 2π√(m/k)).
 */

/** The full length of the board the block is pulled along, units of the drawing. */
export const SLIDE = 150;

/** What the Professor says while an instrument is still moving, by the command that set it going. */
export const BUSY: Readonly<Record<string, LocalizedText>> = {
  'lab.balance': { uk: 'Підбираю важки — від більших до менших…', en: 'Picking the weights — from larger to smaller…' },
  'lab.stretch': { uk: 'Пружина ще коливається — чекаємо, поки заспокоїться…', en: 'The spring is still bouncing — wait until it settles…' },
  'lab.pull': { uk: 'Тягну брусок рівномірно…', en: 'Pulling the block steadily…' },
};

/** The motion from the previous picture to the new one; null — nothing moves (it is drawn at once). */
export function benchMotion(prev: BenchView | null, next: BenchView, draw: (v: BenchView) => void): Motion | null {
  if (next.kind === 'balance' && next.balance?.mass !== undefined) return balance(next, next.balance.mass, draw);
  if (next.kind === 'spring' && next.springLength !== undefined && prev?.kind === 'spring' && next.weights > 0) return spring(prev, next, draw);
  if (next.kind === 'friction' && next.pull) return pull(next, draw);
  return null;
}

/**
 * The lever balance: each weight of the set goes on from the largest; one that tips the beam the other way is
 * taken off again (as one weighs by hand). The beam swings towards where the difference sends it, up to its
 * stops. Its period and damping are those of the drawing, not measured.
 */
function balance(next: BenchView, mass: number, draw: (v: BenchView) => void): Motion {
  const b = next.balance!;
  const on: number[] = [];
  const lean = () => 7 * Math.tanh((mass - on.reduce((a, x) => a + x, 0)) / 0.004);
  const beam = new Channel(0, lean(), { kind: 'damped', period: 1.1, damping: 0.45, min: -10, max: 10 }, 0.05);
  const steps: ProcedureStep[] = [{ delay: 700, apply: () => undefined }];
  let sum = 0;
  for (const w of WEIGHT_SET) {
    const heavy = sum + w > mass + 0.000005;
    // Grams take a moment to watch; the light milligram plates go on quicker; a weight that tips it over stays a moment longer.
    steps.push({ delay: w >= 0.001 ? 420 : 170, apply: () => (on.push(w), (beam.target = lean())) });
    if (heavy) steps.push({ delay: 620, apply: () => (on.splice(on.lastIndexOf(w), 1), (beam.target = lean())) });
    else sum += w;
  }
  return {
    channels: [beam],
    steps,
    frame: (done) => draw({ ...next, balance: { ...b, weights: done ? b.weights : [...on], tilt: done ? 0 : beam.value, display: done ? b.display : '' } }),
  };
}

/** A spring with a load: it drops to its new length and bounces about it — period 2π√(m/k), a little damping. */
function spring(prev: BenchView, next: BenchView, draw: (v: BenchView) => void): Motion {
  const m = next.weights * BENCH_WEIGHT.value;
  const period = 2 * Math.PI * Math.sqrt(m / (next.stiffness ?? BENCH_SPRING_K.value));
  const length = new Channel(prev.springLength ?? next.springLength!, next.springLength!, { kind: 'damped', period, damping: 0.12 }, 0.0004);
  return {
    channels: [length],
    frame: (done) => {
      const { reading: _r, ...rest } = next;
      draw(done ? next : { ...rest, springLength: length.value });
    },
  };
}

/** The block pulled along the board at a steady speed; the dynamometer is read on the way. */
function pull(next: BenchView, draw: (v: BenchView) => void): Motion {
  const slide = new Channel(0, SLIDE, { kind: 'steady', speed: 45 }, 0.5);
  return {
    channels: [slide],
    // The reading is taken while it slides steadily, after the start.
    frame: (done) => draw({ ...next, slide: slide.value, pull: done || slide.value > 25 ? next.pull! : '…' }),
  };
}
