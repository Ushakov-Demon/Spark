import { BENCH_SPRING_K, BENCH_WEIGHT, WEIGHT_SET } from '../../../src/scenarios/bench.js';
import type { LocalizedText } from '../../../src/knowledge/i18n.js';
import { Channel, type Motion, type ProcedureStep } from '../../motion.js';
import { SINK_LEAD, type BenchView } from './bench.js';

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
  'lab.slope': { uk: 'Тягну брусок угору рівномірно…', en: 'Pulling the block up steadily…' },
  'lab.roll': { uk: 'Кулька котиться — секундомір іде…', en: 'The ball is rolling — the stopwatch is running…' },
  'lab.whirl': { uk: 'Рахую оберти: раз, два, три…', en: 'Counting the turns: one, two, three…' },
  'lab.swing': { uk: 'Рахую коливання: раз, два, три…', en: 'Counting the swings: one, two, three…' },
  'lab.sink': { uk: 'Стежу — секундомір іде…', en: 'Watching — the stopwatch is running…' },
};

/** A long run (many turns, many swings) is played this much faster than real time: about this many seconds at most. */
const PLAY_SECONDS = 6;
/** The stopwatch's display: seconds to hundredths. */
const sw = (t: number, comma: boolean) => `${t.toFixed(2).replace('.', comma ? ',' : '.')} ${comma ? 'с' : 's'}`;

/** The motion from the previous picture to the new one; null — nothing moves (it is drawn at once). */
export function benchMotion(prev: BenchView | null, next: BenchView, draw: (v: BenchView) => void): Motion | null {
  if (next.kind === 'balance' && next.balance?.mass !== undefined) return balance(next, next.balance.mass, draw);
  if (next.kind === 'spring' && next.springLength !== undefined && prev?.kind === 'spring' && next.weights > 0) return spring(prev, next, draw);
  if (next.kind === 'friction' && next.pull) return pull(next, draw);
  if (next.kind === 'slope' && next.pull && next.slope) return slopeUp(next, draw);
  if (next.run && (next.kind === 'incline' || next.kind === 'circle' || next.kind === 'pendulum')) return timed(next, next.run, draw);
  if (next.run && next.sink?.speed && (next.kind === 'bubble' || next.kind === 'sink')) return through(next, next.run, next.sink, draw);
  return null;
}

/**
 * A timed run with the stopwatch going: the ball speeding up down the groove (its share of the path grows as t²),
 * the body going round, the pendulum swinging (its angle A·cos of the phase). Long runs are sped up.
 */
function timed(next: BenchView, run: NonNullable<BenchView['run']>, draw: (v: BenchView) => void): Motion {
  const fast = Math.max(1, run.seconds / PLAY_SECONDS);
  const comma = (next.stopwatch?.display ?? ',').includes(',');
  const clock = new Channel(0, run.seconds, { kind: 'steady', speed: fast }, 1e-6);
  return {
    channels: [clock],
    frame: (done) => {
      const t = clock.value;
      const stopwatch = { display: done ? (next.stopwatch?.display ?? sw(t, comma)) : sw(t, comma), fast };
      if (next.kind === 'incline') return draw({ ...next, stopwatch, incline: { stop: next.incline?.stop ?? 1, ball: (t / run.seconds) ** 2 } });
      const phase = run.period ? (2 * Math.PI * t) / run.period : 0;
      if (next.kind === 'circle') return draw({ ...next, stopwatch, circle: { thread: next.circle?.thread ?? 0.5, angle: phase } });
      return draw({ ...next, stopwatch, pendulum: { length: next.pendulum?.length ?? 1, mass: next.pendulum?.mass ?? 0.03, angle: done ? 0 : (run.amplitude ?? 0) * Math.cos(phase) } });
    },
  };
}

/**
 * A body through a liquid: the bottle is turned over first (a bubble), then the body goes at its steady speed from
 * where it starts (the neck, the surface) past the zero mark — the stopwatch starts there — to the last mark.
 * A long run is sped up, the turn of the bottle with it, so it takes about a second whatever the speed-up.
 */
function through(next: BenchView, run: NonNullable<BenchView['run']>, s: NonNullable<BenchView['sink']>, draw: (v: BenchView) => void): Motion {
  const fast = Math.max(1, run.seconds / PLAY_SECONDS);
  const comma = (next.stopwatch?.display ?? ',').includes(',');
  // (The display's own width: the seconds without their unit, as the reading itself.)
  const lcd = (t: number) => t.toFixed(2).replace('.', comma ? ',' : '.');
  const v = s.speed!;
  const flip = s.body === 'bubble' ? 1.2 * fast : 0;
  const lead = SINK_LEAD / v;
  const clock = new Channel(0, flip + lead + run.seconds, { kind: 'steady', speed: fast }, 1e-6);
  return {
    channels: [clock],
    frame: (done) => {
      const u = clock.value;
      if (!done && u < flip) return draw({ ...next, stopwatch: { display: lcd(0), fast }, sink: { ...s, turn: 1 - u / flip } });
      const t = u - flip - lead;
      const sink = { ...s, at: done ? (s.at ?? 0) : t < 0 ? -SINK_LEAD + (u - flip) * v : t * v };
      return draw({ ...next, stopwatch: { display: done ? (next.stopwatch?.display ?? lcd(t)) : lcd(Math.max(0, t)), fast }, sink });
    },
  };
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

/** The block pulled up the slope at a steady speed; the dynamometer is read on the way. */
function slopeUp(next: BenchView, draw: (v: BenchView) => void): Motion {
  const up = new Channel(0, 1, { kind: 'steady', speed: 0.35 }, 0.005);
  return {
    channels: [up],
    frame: (done) => draw({ ...next, slope: { ...next.slope!, up: up.value }, pull: done || up.value > 0.2 ? next.pull! : '…' }),
  };
}
