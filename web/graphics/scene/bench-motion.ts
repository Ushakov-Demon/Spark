import { BENCH_SPRING_K, BENCH_WEIGHT, WEIGHT_SET } from '../../../src/scenarios/bench.js';
import type { LocalizedText } from '../../../src/knowledge/i18n.js';
import { DRAG_FPS, DRAG_START, DRAG_TRACK, dragFall } from '../../../src/scenarios/drag-bench.js';
import { Channel, type Motion, type ProcedureStep } from '../../motion.js';
import { SINK_LEAD, type BenchView } from './bench.js';
import { scalesMasses, scalesSequence, scalesTilt } from '../../../src/scenarios/scales-bench.js';

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
  'lab.planets': { uk: 'Відміряємо рулеткою — крок за кроком…', en: 'Measuring with the tape — step by step…' },
  /** (The planets set going; the way out to Voyager.) */
  'lab.planets.kepler': { uk: 'Планети біжать по орбітах — дивимося…', en: 'The planets run round their orbits — watch…' },
  'lab.planets.voyager': { uk: 'Ідемо туди, де був «Вояджер-1»…', en: 'Walking out to where Voyager 1 was…' },
  'lab.dyno': { uk: 'Пружина ще коливається — чекаємо, поки заспокоїться…', en: 'The spring is still bouncing — wait until it settles…' },
  /** (The scale being drawn.) */
  'lab.dyno.scale': { uk: 'Наношу поділки — через 0,1 Н…', en: 'Drawing the divisions — every 0.1 N…' },
  'lab.scales': { uk: 'Кладу по одному — дивимося на лінійку…', en: 'Adding one at a time — watching the ruler…' },
  'lab.calendar': { uk: 'Роки біжать — стежимо, де рівнодення…', en: 'The years run on — watching where the equinox falls…' },
  /** (The reform: the days struck out; Shakespeare's date carried over.) */
  'lab.calendar.gregorian': { uk: 'Викреслюємо дні з жовтня 1582 року…', en: 'Striking the days out of October 1582…' },
  'lab.calendar.bard': { uk: 'Переводимо лондонську дату в григоріанський календар…', en: 'Carrying the London date over to the Gregorian calendar…' },
  'lab.air': { uk: 'Тиск на екрані ще змінюється — чекаємо…', en: 'The pressure on the screen is still changing — wait…' },
  /** (The airship climbing to 2 km.) */
  'lab.air.high': { uk: 'Дирижабль набирає висоту…', en: 'The airship is climbing…' },
  'lab.gnomon': { uk: 'Сонце йде небом — міряємо тінь…', en: 'The Sun moves across the sky — measuring the shadow…' },
  'lab.tower': { uk: 'Наливаю повільно, по стінці…', en: 'Pouring slowly, down the wall…' },
  /** (A body let into the tower.) */
  'lab.tower.drop': { uk: 'Опускається… дивимося, де зупиниться…', en: 'Going down… where will it stop…' },
  'lab.drag': { uk: 'Тіло тоне — телефон знімає…', en: 'The body sinks — the phone is filming…' },
  'lab.carts': { uk: 'Нитка перегоріла — візки роз’їжджаються…', en: 'The thread burnt — the carts roll apart…' },
  'lab.touch': { uk: 'Дивимося…', en: 'Watching…' },
  'lab.coin': { uk: 'Знімаємо — дивимося покадрово…', en: 'Filming — watching frame by frame…' },
  'lab.snail': { uk: 'Равлик повзе — знімаємо 30 секунд…', en: 'The snail crawls — filming for 30 seconds…' },
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
  if (next.kind === 'carts' && next.carts?.mode === 'push' && next.carts.read) return cartsRun(next, draw);
  if (next.kind === 'drag' && next.drag?.read) return dragRun(next, draw);
  if (next.kind === 'tower' && next.tower?.anim) return towerRun(next, draw);
  if (next.kind === 'gnomon' && next.gnomon?.anim) return gnomonRun(next, draw);
  if (next.kind === 'planets' && next.planets?.anim) return planetsRun(next, draw);
  if (next.kind === 'calendar' && next.calendar?.anim) return calendarRun(next, draw);
  if (next.kind === 'scales' && next.scales?.anim) return scalesRun(next, draw);
  if (next.kind === 'dyno' && next.dyno?.anim) return dynoRun(next, draw);
  if (next.kind === 'air' && next.air?.where === 'ninth' && next.air.read) return liftUp(next, draw);
  if (next.kind === 'air' && (next.air?.where === 'airship' || next.air?.where === 'high') && next.air.read) return airshipUp(next, draw);
  if (next.kind === 'touch' && next.touch?.read) return touchRun(next, draw);
  if (next.kind === 'coin' && next.coin?.read && next.coinRun) return coinRun(next, next.coinRun, draw);
  if (next.kind === 'snail' && next.snail?.read && next.run) return snailRun(next, next.run, draw);
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

/** A snail: its 30 s played some eight times faster, the stopwatch running with it. */
function snailRun(next: BenchView, run: NonNullable<BenchView['run']>, draw: (v: BenchView) => void): Motion {
  const sn = next.snail!;
  const fast = 8;
  const comma = (next.stopwatch?.display ?? ',').includes(',');
  const clock = new Channel(0, run.seconds, { kind: 'steady', speed: fast }, 1e-4);
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw(next);
      const { read: _r, ...rest } = sn;
      draw({ ...next, stopwatch: { display: clock.value.toFixed(2).replace('.', comma ? ',' : '.'), fast }, snail: { ...rest, at: (sn.at * clock.value) / run.seconds } });
    },
  };
}

/**
 * Inertia, frame by frame: the card goes at its speed; slipping, the coin is dragged at μ·g until the card's edge
 * leaves it (t = l / v), then falls (g) — to the glass's bottom, or onto the rim and off it beside the glass. Drawn
 * smoothly, the coin rides with the card. A quick pull is played four times slower (a flick still looks like one:
 * 0.1 s on the screen); the fall after it at 0.4 of real time.
 */
/** How much slower the card's quick pulls are played. */
export const COIN_SLOW = 4;
function coinRun(next: BenchView, run: NonNullable<BenchView['coinRun']>, draw: (v: BenchView) => void): Motion {
  const c = next.coin!;
  const { v, a, exit, slipped, inGlass } = run;
  const g = 9.81;
  const pull = slipped ? exit * COIN_SLOW : 0.15 / v;
  // Falling: into the glass, to its bottom (10 cm less the coin); off the rim — 4 mm, then off it onto the table.
  const depth = inGlass ? 0.095 : 0.004;
  const fall = Math.sqrt((2 * depth) / g);
  const fallShown = slipped ? fall / 0.4 : 0;
  const off = inGlass || !slipped ? 0 : 0.5;
  const clock = new Channel(0, pull + fallShown + off, { kind: 'steady', speed: 1 }, 1e-4);
  const { read: _r, slow: _s, ...rest } = c;
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw(next);
      const T = clock.value;
      if (!slipped) return draw({ ...next, coin: { ...rest, card: v * T, x: v * T, drop: 0, tilt: 0 } });
      const slowed = run.slow && T < pull ? { slow: run.slow } : {};
      // The real time: the card's part slowed COIN_SLOW times; then the fall at 0.4.
      const t = T < pull ? (T / pull) * exit : exit + Math.min(fall, (T - pull) * 0.4);
      if (T < pull) return draw({ ...next, coin: { ...rest, ...slowed, card: v * t, x: (a * t * t) / 2, drop: 0, tilt: 0 } });
      const x1 = (a * exit * exit) / 2 + a * exit * (t - exit);
      const drop = (g * (t - exit) ** 2) / 2;
      if (T < pull + fallShown) return draw({ ...next, coin: { ...rest, card: 1, x: x1, drop, tilt: 0 } });
      // Off the rim: tipping over it and down beside the glass.
      const u = Math.min(1, (T - pull - fallShown) / off);
      draw({ ...next, coin: { ...rest, card: 1, x: x1 + (c.x - x1) * u, drop: depth + (c.drop - depth) * u * u, tilt: 70 * Math.sin(Math.PI * u) } });
    },
  };
}

/** Contact and non-contact forces: each case plays in about 1.5 s (the weight's fall in its own 0.4 s or so, slowed). */
function touchRun(next: BenchView, draw: (v: BenchView) => void): Motion {
  const t = next.touch!;
  const k = new Channel(0, 1, { kind: 'steady', speed: 0.7 }, 0.001);
  return {
    channels: [k],
    frame: (done) => {
      if (done) return draw(next);
      const { read: _r, ...rest } = t;
      draw({ ...next, touch: { ...rest, k: k.value } });
    },
  };
}

/** Carts: the thread burns, then both roll apart steadily for their 0.5 s, played three times slower. */
function cartsRun(next: BenchView, draw: (v: BenchView) => void): Motion {
  const c = next.carts!;
  const burn = 0.5;
  const ride = 1.5;
  const clock = new Channel(0, burn + ride, { kind: 'steady', speed: 1 }, 1e-4);
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw(next);
      const T = clock.value;
      const { read: _r, ...rest } = c;
      if (T < burn) return draw({ ...next, carts: { ...rest, x1: 0, x2: 0, flame: T / burn } });
      const k = (T - burn) / ride;
      draw({ ...next, carts: { ...rest, x1: c.x1 * k, x2: c.x2 * k, moving: true } });
    },
  };
}

/** The drag: the body played slowed DRAG_SLOW times, falling as the model has it; the frames counted between the marks. */
export const DRAG_SLOW = 2;
function dragRun(next: BenchView, draw: (v: BenchView) => void): Motion {
  const d = next.drag!;
  const f = dragFall(d.shape, d.medium);
  const end = f.timeTo(0.3);
  const t0 = f.timeTo(DRAG_START);
  const t1 = f.timeTo(DRAG_START + DRAG_TRACK);
  const clock = new Channel(0, end, { kind: 'steady', speed: 1 / DRAG_SLOW }, 1e-5);
  const { read: _r, count: _c, ...rest } = d;
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw(next);
      const t = clock.value;
      const frames = t < t0 ? 0 : Math.floor((Math.min(t, t1) - t0) * DRAG_FPS);
      draw({ ...next, drag: { ...rest, at: f.at(t), moving: true, ...(t >= t0 ? { count: String(frames) } : {}) } });
    },
  };
}

/** The tower: the four liquids poured one after another; or the last body let in from above, slowing to where it rests. */
function towerRun(next: BenchView, draw: (v: BenchView) => void): Motion {
  const t = next.tower!;
  const pour = t.anim === 'pour';
  const clock = new Channel(0, 1, { kind: 'steady', speed: pour ? 1 / 4 : 1 / 1.6 }, 1e-4);
  const last = t.bodies[t.bodies.length - 1];
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw(next);
      const u = clock.value;
      if (pour) return draw({ ...next, tower: { ...t, poured: 4 * u } });
      // (From above the cylinder's top, fast through the light layers, slowing down: an ease-out.)
      const at = last ? 280 + (last.at - 280) * (1 - (1 - u) ** 3) : 0;
      draw({ ...next, tower: { ...t, bodies: [...t.bodies.slice(0, -1), ...(last ? [{ ...last, at }] : [])] } });
    },
  };
}

/** The gnomon: the series' shadows one after another — the Sun moves, the shadow turns to its length, a chalk tick. */
function gnomonRun(next: BenchView, draw: (v: BenchView) => void): Motion {
  const g = next.gnomon!;
  const n = Math.min(g.anim ?? 0, g.tips.length);
  if (!n) return { channels: [], frame: () => draw(next) };
  const before = g.tips.slice(0, g.tips.length - n);
  const fresh = g.tips.slice(g.tips.length - n);
  const each = 1.1;
  const clock = new Channel(0, n * each, { kind: 'steady', speed: 1 }, 1e-4);
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw(next);
      // (Before the first tick the channel has no value yet.)
      const u = (Number.isFinite(clock.value) ? clock.value : 0) / each;
      const k = Math.max(0, Math.min(n - 1, Math.floor(u)));
      const f = Math.min(1, (u - k) / 0.6);
      const from = k > 0 ? fresh[k - 1]! : (before[before.length - 1] ?? fresh[0]!);
      const to = fresh[k]!;
      const length = from.length + (to.length - from.length) * f;
      draw({ ...next, gnomon: { tips: [...before, ...fresh.slice(0, f >= 1 ? k + 1 : k)], now: { length, time: to.time, ...(f >= 1 ? { read: to.read } : {}) } } });
    },
  };
}

/** The lift going up from the ground floor to the ninth; the barometer read once it stops. */
function liftUp(next: BenchView, draw: (v: BenchView) => void): Motion {
  const a = next.air!;
  const ride = new Channel(1, 9, { kind: 'steady', speed: 3 }, 1e-3);
  const { read: _r, ...rest } = a;
  return {
    channels: [ride],
    frame: (done) => draw(done ? next : { ...next, air: { ...rest, floor: Number.isFinite(ride.value) ? ride.value : 1 } }),
  };
}

/** The airship climbing — from the ground to 300 m, or on to 2 km: the town shrinking below; the barometer read once it is there. */
function airshipUp(next: BenchView, draw: (v: BenchView) => void): Motion {
  const a = next.air!;
  const from = a.where === 'high' ? 1 : 0;
  const climb = new Channel(from, from + 1, { kind: 'steady', speed: 0.45 }, 1e-3);
  const { read: _r, ...rest } = a;
  return {
    channels: [climb],
    frame: (done) => draw(done ? next : { ...next, air: { ...rest, zoom: Number.isFinite(climb.value) ? climb.value : from } }),
  };
}

/**
 * The home-made dynamometer: a load hung on — the pointer drops and bounces about its new place (1.8 s), the
 * weights one after another, a pencil mark each time; the scale drawn division by division (2 s).
 */
function dynoRun(next: BenchView, draw: (v: BenchView) => void): Motion {
  const d = next.dyno!;
  const anim = d.anim!;
  const per = 1.8;
  const length = anim === 'marks' ? 3 * per : anim === 'scale' ? 2 : per;
  const clock = new Channel(0, length, { kind: 'steady', speed: 1 }, 1e-4);
  const { anim: _a, read: _r, ...rest } = d;
  // A drop from x0 to x: a damped bounce, 0.55 s a swing.
  const bounce = (x0: number, x: number, t: number) => x - (x - x0) * Math.exp(-t / 0.4) * Math.cos((2 * Math.PI * t) / 0.55);
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw({ ...next, dyno: { ...rest, ...(d.read ? { read: d.read } : {}) } });
      const t = Number.isFinite(clock.value) ? clock.value : 0;
      if (anim === 'scale') return draw({ ...next, dyno: { ...rest, drawn: Math.min(1, t / 2) } });
      if (anim === 'marks') {
        const k = Math.min(2, Math.floor(t / per));
        const u = t - k * per;
        const from = k === 0 ? 0 : d.marks[k - 1]!;
        // (The mark goes on once the spring has settled.)
        return draw({ ...next, dyno: { ...rest, weights: k + 1, stretch: bounce(from, d.marks[k]!, u), marks: d.marks.slice(0, k + (u > per - 0.4 ? 1 : 0)) } });
      }
      draw({ ...next, dyno: { ...rest, stretch: bounce(0, d.stretch, t) } });
    },
  };
}

/**
 * Home-made scales: the step's loads one after another — the plasticine; the sheet or the egg, then the sheets (0.35 s
 * each), then water a millilitre at a time (0.6 s, the syringe over the cup) — the beam swinging to each new tilt.
 */
function scalesRun(next: BenchView, draw: (v: BenchView) => void): Motion {
  const s = next.scales!;
  const seq = scalesSequence(s.anim!);
  const lengths = seq.map((x, k) => (k === 0 ? 0.8 : x.water !== seq[k - 1]!.water ? 0.6 : x.sheets !== seq[k - 1]!.sheets ? 0.35 : 0.8));
  const total = lengths.reduce((a, b) => a + b, 0) + 0.6;
  const clock = new Channel(0, total, { kind: 'steady', speed: 1 }, 1e-4);
  const { anim: _a, read: _r, ...rest } = s;
  const tilt = (k: number) => { const m = scalesMasses(seq[k]!); return scalesTilt(m.left, m.right); };
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw({ ...next, scales: { ...rest, ...(s.read ? { read: s.read } : {}) } });
      const t = Number.isFinite(clock.value) ? clock.value : 0;
      let k = 0;
      let at = 0;
      while (k < seq.length - 1 && t >= at + lengths[k]!) at += lengths[k++]!;
      // The beam swings to the new tilt in 0.3 s.
      const u = Math.min(1, (t - at) / 0.3);
      const from = k === 0 ? (s.anim === 'zero' ? 0 : tilt(0)) : tilt(k - 1);
      const angle = from + (tilt(k) - from) * (1 - (1 - u) ** 2);
      draw({ ...next, scales: { ...rest, load: seq[k]!, angle, syringe: seq[k]!.water > 0 } });
    },
  };
}

/**
 * Calendars: the years running on and the Sun sliding over the days (4 s); the reform — October's days crossed out
 * one by one, the month closing up, then the Sun back to 21 March and the new calendar's years; 1616 — a pause on the
 * two sheets, then the London date carried along the Gregorian tape.
 */
function calendarRun(next: BenchView, draw: (v: BenchView) => void): Motion {
  const c = next.calendar!;
  const anim = c.anim!;
  const length = anim === 'gregorian' ? 8 : 4;
  const clock = new Channel(0, length, { kind: 'steady', speed: 1 }, 1e-4);
  const { anim: _a, read: _r, ...rest } = c;
  const from = c.yearFmt && c.year !== undefined ? (anim === 'gregorian' ? 1582 : anim === 'julian' ? 325 : 0) : 0;
  const start = c.start ?? 20;
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw({ ...next, calendar: { ...rest, ...(c.read ? { read: c.read } : {}) } });
      const t = Number.isFinite(clock.value) ? clock.value : 0;
      if (anim === 'bard') return draw({ ...next, calendar: { ...rest, shift: Math.max(0, Math.min(1, (t - 1) / 2.5)) } });
      if (anim === 'gregorian' && t < 4) return draw({ ...next, calendar: { ...rest, view: 'october', cut: t < 3 ? t / 3 : 2 } });
      // (The reform: 1 s for the Sun back to its place, then the years.)
      const u = anim === 'gregorian' ? t - 4 : t;
      const back = anim === 'gregorian' ? Math.min(1, u) : 1;
      const run = anim === 'gregorian' ? Math.max(0, Math.min(1, (u - 1) / 3)) : Math.min(1, u / 4);
      const year = from + run * ((c.year ?? 0) - from);
      const sun = (anim === 'gregorian' ? start - 10 + 10 * back : start) + run * ((c.sun ?? start) - start);
      draw({ ...next, calendar: { ...rest, year, sun } });
    },
  };
}

/**
 * The Solar System's model: the planets laid out one by one (the field widening to the giants); the orbits turning
 * for two of the Earth's years; Voyager's view back — the field stretching out to it, the dark, then the dot.
 */
function planetsRun(next: BenchView, draw: (v: BenchView) => void): Motion {
  const p = next.planets!;
  const anim = p.anim!;
  // (The ball: a moment with the ruler — every reading waits for its motion to end.)
  const length = anim === 'kepler' ? 6 : anim === 'voyager' ? 5 : anim === 'ball' ? 0.8 : 0.7 * 4;
  const clock = new Channel(0, length, { kind: 'steady', speed: 1 }, 1e-4);
  const { anim: _a, ...rest } = p;
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw({ ...next, planets: rest });
      const t = Number.isFinite(clock.value) ? clock.value : 0;
      if (anim === 'ball') return draw({ ...next, planets: rest });
      if (anim === 'kepler') return draw({ ...next, planets: { ...rest, years: (2 * t) / length } });
      if (anim === 'voyager') {
        // (1.5 s out along the field to the probe, 2 s of dark coming, then the dot.)
        const out = Math.min(1, t / 1.5);
        return draw({ ...next, planets: { ...rest, view: t < 1.5 ? 'field' : 'back', range: 700 + 200 * out, dark: Math.max(0, Math.min(1, (t - 1.5) / 2)), dot: Math.max(0, Math.min(1, (t - 3.6) / 1)) } });
      }
      // Four planets of the step, 0.7 s each; the giants' field opens out from the inner one's 35 m.
      const before = p.marks.length - 4;
      const shown = before + Math.min(4, Math.floor(t / 0.7) + 1);
      const range = anim === 'outer' ? 35 + (700 - 35) * Math.min(1, t / 0.7) : p.range;
      draw({ ...next, planets: { ...rest, marks: p.marks.slice(0, shown), range } });
    },
  };
}
