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
  'lab.strobe': { uk: 'Спалахи один за одним — кулька лишає зображення…', en: 'Flash after flash — the ball leaves its images…' },
  'lab.wind': { uk: 'Бульбашка летить — секундомір іде…', en: 'The bubble flies — the stopwatch is running…' },
  'lab.winch': { uk: 'Котушка крутиться — рахую оберти…', en: 'The spool is turning — counting the turns…' },
  'lab.carry': { uk: 'Бульбашка спливає — веду пляшку рівномірно…', en: 'The bubble rises — carrying the bottle steadily…' },
  'lab.bounce': { uk: 'Відпускаю м’ячик — стежимо, куди підскочить…', en: 'Letting the ball go — watch how high it bounces…' },
  'lab.lift': { uk: 'Ліфт їде — стежимо за динамометром…', en: 'The lift is moving — watch the dynamometer…' },
  'lab.rows': { uk: 'Викладаю ряд — по одному…', en: 'Laying the row — one by one…' },
  'lab.forces': { uk: 'Пружини ще коливаються — чекаємо, поки заспокояться…', en: 'The springs are still bouncing — wait until they settle…' },
  'lab.magnet': { uk: 'Стрілка компаса ще гойдається — чекаємо…', en: 'The compass needle is still swinging — wait…' },
  /** (The step that takes the nail out of the coil.) */
  'lab.magnet.pull': { uk: 'Повільно витягую цвях із котушки…', en: 'Slowly pulling the nail out of the coil…' },
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
  if (next.run && next.sink?.speed && (next.kind === 'bubble' || next.kind === 'sink' || next.kind === 'carry')) return through(next, next.run, next.sink, draw);
  if (next.kind === 'strobe' && next.strobe?.gaps) return strobeRun(next, draw);
  if (next.kind === 'wind' && next.wind?.read && next.run) return windRun(next, next.run, draw);
  if (next.kind === 'winch' && next.winch?.read) return winch(next, draw);
  if (next.kind === 'bounce' && next.bounce?.read) return bounce(next, draw);
  if (next.kind === 'lift' && next.lift?.read) return lift(prev?.kind === 'lift' ? (prev.lift ?? null) : null, next, draw);
  if (next.kind === 'rows' && next.rows?.read) return row(next, draw);
  if (next.kind === 'forces' && next.forces?.loaded) return forces(prev?.kind === 'forces' ? (prev.forces ?? null) : null, next, draw);
  if (next.kind === 'magnet' && next.magnet && prev?.kind === 'magnet' && prev.magnet) return compass(prev.magnet, next, draw);
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
      if (!done && u < flip) return draw({ ...next, stopwatch: { display: lcd(0), fast }, sink: { ...s, turn: 1 - u / flip }, ...(next.carry ? { carry: { speed: next.carry.speed, shift: 0 } } : {}) });
      const t = u - flip - lead;
      const sink = { ...s, at: done ? (s.at ?? 0) : t < 0 ? -SINK_LEAD + (u - flip) * v : t * v };
      // (The carried bottle: moved from the moment the bubble passes the zero mark; its marks measured at the end.)
      const carry = next.carry && !done ? { speed: next.carry.speed, shift: next.carry.speed * Math.max(0, t) } : next.carry;
      return draw({ ...next, stopwatch: { display: done ? (next.stopwatch?.display ?? lcd(t)) : lcd(Math.max(0, t)), fast }, sink, ...(carry ? { carry } : {}) });
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

/**
 * The electromagnet: the compass needle swings to its new turn and settles (its period and damping are the
 * drawing's). The nail taken out: it slides slowly out of the coil by its head, and the needle goes back as
 * it leaves — the field falls most as the last of it leaves the winding.
 */
function compass(was: NonNullable<BenchView['magnet']>, next: BenchView, draw: (v: BenchView) => void): Motion | null {
  const m = next.magnet!;
  const pulling = was.core && !m.core;
  if (!pulling && Math.abs(was.angle - m.angle) < 0.5) return null;
  const smooth = (k: number) => k * k * (3 - 2 * k);
  const out = new Channel(0, pulling ? 1 : 0, { kind: 'steady', speed: 0.4 }, 0.002);
  const needle = new Channel(was.angle, pulling ? was.angle : m.angle, { kind: 'damped', period: 1.2, damping: 0.22 }, 0.2);
  return {
    channels: [out, needle],
    frame: (done) => {
      if (pulling) needle.target = was.angle + (m.angle - was.angle) * smooth(out.value);
      const { read: _r, ...rest } = m;
      draw(done ? next : { ...next, magnet: { ...rest, ...(pulling ? { core: true, pull: smooth(out.value) } : {}), angle: needle.value } });
    },
  };
}

/**
 * Adding forces: the springs take the load and bounce to their readings (the drawing's period); moved along the
 * ruler, the weights slide to their new place and the readings follow. Pulled down, the lower dynamometer is
 * drawn out slowly by hand, and the upper one takes on that pull as well.
 */
function forces(was: BenchView['forces'] | null, next: BenchView, draw: (v: BenchView) => void): Motion {
  const f = next.forces!;
  const same = !!was?.loaded && was.hold === f.hold;
  const spring = { kind: 'damped', period: 0.6, damping: 0.18 } as const;
  const pulling = f.hold === 'down';
  const load = f.a - f.b;
  const a = new Channel(same ? was!.a : 0, pulling ? load : f.a, spring, 0.01);
  const b = new Channel(same ? was!.b : 0, f.b, pulling ? { kind: 'steady', speed: 0.5 } : spring, 0.01);
  const at = new Channel(same ? was!.at : f.at, f.at, { kind: 'steady', speed: 0.04 }, 0.0005);
  return {
    channels: [a, b, at],
    frame: (done) => {
      // The upper one holds the load and whatever the lower one pulls by now.
      if (pulling) a.target = load + Math.max(0, b.value);
      const { readA: _a, readB: _b, ...rest } = f;
      draw(done ? next : { ...next, forces: { ...rest, a: Math.max(0, a.value), b: Math.max(0, b.value), at: at.value } });
    },
  };
}

/** The method of rows: the bodies are laid one by one (each drops in), or the thread is wound turn by turn — in about three seconds. */
function row(next: BenchView, draw: (v: BenchView) => void): Motion {
  const r = next.rows!;
  const n = r.sizes.length;
  const laid = new Channel(0, n, { kind: 'steady', speed: Math.max(3, n / 3) }, 0.001);
  return {
    channels: [laid],
    frame: (done) => {
      const { read: _r, ...rest } = r;
      draw(done ? next : { ...next, rows: { ...rest, placed: laid.value } });
    },
  };
}

/** Where each phase of the ride starts, 0 — the ground floor, 1 — the top (it ends where the next one starts). */
const LIFT_FROM: Readonly<Record<string, number>> = { rest: 0, 'up-start': 0, up: 0.25, 'up-stop': 0.75, 'down-start': 1, down: 0.75, 'down-stop': 0.25, fall: 0 };
/**
 * The lift's ride: speeding up (the way grows as t²), steady, slowing down (as the square of the time left); the
 * dynamometer's spring swings to the phase's reading. Let go, the dynamometer falls (t²) and its spring goes slack.
 */
function lift(was: BenchView['lift'] | null, next: BenchView, draw: (v: BenchView) => void): Motion {
  const l = next.lift!;
  const from = LIFT_FROM[l.phase] ?? l.y;
  const shape = (k: number) => (l.phase.endsWith('-start') ? k * k : l.phase.endsWith('-stop') ? 1 - (1 - k) ** 2 : k);
  const k = new Channel(0, 1, { kind: 'steady', speed: l.phase === 'fall' ? 1.6 : 0.45 }, 0.001);
  const spring = new Channel(was?.force ?? l.force, l.force, { kind: 'damped', period: 0.5, damping: 0.2 }, 0.01);
  return {
    channels: [k, spring],
    frame: (done) => {
      const { read: _r, diff: _d, ...rest } = l;
      if (done) return draw(next);
      if (l.phase === 'fall') return draw({ ...next, lift: { ...rest, y: 0, force: Math.max(0, spring.value), fall: k.value * k.value } });
      draw({ ...next, lift: { ...rest, y: from + (l.y - from) * shape(k.value), force: Math.max(0, spring.value) } });
    },
  };
}

/** g for the bounce's timing, m/s². */
const BOUNCE_G = 9.81;
/** The ball is squashed within this much of the plate, m (drawn larger than life). */
const SQUASH_NEAR = 0.03;
/**
 * A ball's bounce, played at under half the real speed: it falls from the metre (the way grows as t²), and after
 * each impact rises to the next top and falls again, squashed near the plate; at the last top it stops — as a
 * photo would catch it. Plasticine lands and flattens. The energy bars follow: the potential share is the height,
 * the rest of the mechanical energy is kinetic, and each impact moves a share into heat and sound.
 */
function bounce(next: BenchView, draw: (v: BenchView) => void): Motion {
  const b = next.bounce!;
  const tops = [1, ...b.marks];
  const flat = tops.at(-1)! === 0;
  // The segments: falling from a top, rising to the next one; the time of each, √(2h/g).
  const legs: { from: number; to: number; time: number; mech: number; marks: number }[] = [];
  tops.forEach((h, j) => {
    if (j > 0 && h > 0) legs.push({ from: 0, to: h, time: Math.sqrt((2 * h) / BOUNCE_G), mech: h, marks: j - 1 });
    if (j < tops.length - 1) legs.push({ from: h, to: 0, time: Math.sqrt((2 * h) / BOUNCE_G), mech: j === 0 ? 1 : h, marks: j });
  });
  const FLATTEN = 0.15;
  const total = legs.reduce((a, x) => a + x.time, 0) + (flat ? FLATTEN : 0);
  const clock = new Channel(0, total, { kind: 'steady', speed: 0.4 }, 1e-4);
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw(next);
      let t = clock.value;
      const { read: _r, ...rest } = b;
      for (const leg of legs) {
        if (t <= leg.time) {
          const k = t / leg.time;
          // Falling: the way grows as t²; rising: the way left shrinks as the time left squared.
          const y = leg.to === 0 ? leg.from * (1 - k * k) : leg.to * (1 - (1 - k) ** 2);
          const squash = flat ? 0 : Math.max(0, 1 - y / SQUASH_NEAR) * 0.6;
          return draw({ ...next, bounce: { ...rest, y, squash, mech: leg.mech, marks: b.marks.slice(0, leg.marks) } });
        }
        t -= leg.time;
      }
      // Plasticine on the plate: it flattens, and all its energy is heat now.
      draw({ ...next, bounce: { ...rest, y: 0, squash: Math.min(1, t / FLATTEN), mech: 0, marks: [] } });
    },
  };
}

/**
 * A windlass: the load goes down (or up) steadily and the spool turns with it — as many turns as the thread's length
 * over the circumference — in about three seconds.
 */
function winch(next: BenchView, draw: (v: BenchView) => void): Motion {
  const w = next.winch!;
  // Let down — from the spool; turned up — from where the handle's turns started it (low on the ruler).
  const from = w.turned < 0 ? w.drop + Math.PI * w.d * -w.turned : 0;
  const k = new Channel(0, 1, { kind: 'steady', speed: 0.35 }, 0.001);
  return {
    channels: [k],
    frame: (done) => {
      if (done) return draw(next);
      const { read: _r, ...rest } = w;
      draw({ ...next, winch: { ...rest, drop: from + (w.drop - from) * k.value, turned: w.turned * k.value } });
    },
  };
}

/** The wind's speed: the bubble, blown a little before the first stake, flies with the wind; the stopwatch runs from the first stake to the second (in real time). */
function windRun(next: BenchView, run: NonNullable<BenchView['run']>, draw: (v: BenchView) => void): Motion {
  const w = next.wind!;
  const lead = 0.6 / w.speed;
  const comma = (next.stopwatch?.display ?? ',').includes(',');
  const clock = new Channel(0, lead + run.seconds, { kind: 'steady', speed: 1 }, 1e-6);
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw(next);
      const t = clock.value - lead;
      const { read: _r, ...rest } = w;
      draw({ ...next, stopwatch: { display: Math.max(0, t).toFixed(2).replace('.', comma ? ',' : '.') }, wind: { ...rest, at: t * w.speed } });
    },
  };
}

/** A stroboscopic photo: the flashes leave the ball's images one by one (four a second, played at half that), then the ruler is put to it. */
function strobeRun(next: BenchView, draw: (v: BenchView) => void): Motion {
  const st = next.strobe!;
  const n = st.at.length;
  const k = new Channel(0, n + 0.6, { kind: 'steady', speed: 2 }, 0.001);
  return {
    channels: [k],
    frame: (done) => {
      if (done || k.value >= n + 0.5) return draw(next);
      const { gaps: _g, ...rest } = st;
      draw({ ...next, strobe: { ...rest, shown: k.value } });
    },
  };
}
