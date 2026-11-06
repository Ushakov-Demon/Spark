import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { PLAY_SECONDS } from '../../graphics/scene/bench-motion.js';
import { Channel, type Motion } from '../../motion.js';
import { clack, rolling } from '../../sounds/index.js';
import { defineScene, type SceneContext } from '../types.js';
import { ballSvg, counterSvg, DARK, standSvg, STEEL, stopwatchSvg, THREAD } from '../../graphics/scene/kit.js';
import { BODY_MASS, CIRCLE_RADIUS, PENDULUM_BALLS, ROLL_PATH, THREAD_LENGTH } from '../../../src/experiments/motion-lab-works/bench.js';
import { t } from '../../../src/knowledge/messages.js';

/** Units of the drawing per metre for the motion benches: the 1 m pendulum fits between the board's top and the table. */
const M = 230;

/** The stopwatch's display: seconds to hundredths (the unit is not on it). */
const sw = (t: number, comma: boolean) => t.toFixed(2).replace('.', comma ? ',' : '.');

/** The apparatus of the lab work: the groove (1), the body on a thread (2), the thread pendulum (3). */
type Apparatus = 'incline' | 'circle' | 'pendulum';

/**
 * The motion bench: which apparatus; the groove — where the cylinder stands and where the ball is (shares of the
 * path from the chalk mark), its upper end's height; the body on a thread — the thread, m, where it is on its round,
 * rad; the pendulum — its length, m, its swing, rad, the ball's mass, kg; the stopwatch (and how much faster than
 * real time the drawing goes); the tape along what was measured; the timed run to play.
 */
export type MotionView = {
  readonly apparatus: Apparatus;
  readonly incline?: { readonly stop: number; readonly ball: number; /** The upper end's height, m (0.1 if not said). */ readonly raise?: number };
  readonly circle?: { readonly thread: number; readonly angle: number; readonly radius?: number; readonly mass?: number; readonly fit?: number; readonly scaled?: string };
  /** `fit` — the drawing's share of the real length, when the thread is too long for the picture; `scaled` — its mark. */
  readonly pendulum?: { readonly length: number; readonly angle: number; readonly mass: number; readonly fit?: number; readonly scaled?: string };
  readonly stopwatch?: { readonly display: string; readonly fast?: number };
  /** The turns or swings counted so far (none on the groove). */
  readonly counted?: number;
  readonly tape?: string;
  readonly run?: { readonly seconds: number; readonly period?: number; readonly count?: number; readonly amplitude?: number };
};

function view({ log, last, command, plan, locale }: SceneContext): MotionView {
  const r = last ? readingsOf([last])[0]?.record : undefined;
  const c = command;
  const show = (q: 'force' | 'length', v: number | null | undefined) => formatMeasured(q, v ?? 0, q === 'force' ? 0.1 : 0.001, locale);
  const sec = (x: number | null | undefined) => formatMeasured('time', x ?? 0, 0.01, locale).replace(/\s(с|s)$/, '');
  const tapeShown = c?.type === 'lab.tape' && r ? { tape: show('length', r.value) } : {};
  // (The run's steps, done and still ahead: the run itself says which apparatus it is.)
  const steps = [...log.map((e) => e.command), ...plan.flatMap((s) => (s.kind === 'bench' ? [s.command] : []))];
  // The longest thread of the run fits the picture; the others keep their proportion to it.
  const longest = Math.max(...[...steps, ...(command ? [command] : [])].map((x) => Number((x as { length?: number; thread?: number }).length ?? (x as { thread?: number }).thread ?? 0)));
  const fitted = longest > 1 ? { fit: 1 / longest, scaled: t(locale, 'motion-lab-works-scene-scale') } : {};
  const runOf = steps.find((x) => x.type === 'lab.roll' || x.type === 'lab.whirl' || x.type === 'lab.swing')?.type;
  const apparatus: Apparatus = runOf === 'lab.whirl' ? 'circle' : runOf === 'lab.swing' ? 'pendulum' : 'incline';
  if (apparatus === 'incline') {
  const roll = c?.type === 'lab.roll' && r;
  const stop = roll ? Number(c!['path']) / ROLL_PATH : 1;
  // As high as the experiment raises the groove (before the first roll too).
  const planned = steps.find((x) => x.type === 'lab.roll');
  const raise = (roll ? (c as { raise?: number }).raise : undefined) ?? (planned as { raise?: number } | undefined)?.raise;
  return { apparatus, incline: { stop, ball: roll ? 1 : 0, ...(raise ? { raise } : {}) }, stopwatch: { display: sec(roll ? r!.value : 0) }, ...tapeShown, ...(roll ? { run: { seconds: r!.exact ?? r!.value ?? 0 } } : {}) };
  }
  if (apparatus === 'circle') {
  const whirl = c?.type === 'lab.whirl' && r;
  const whirled = steps.find((x) => x.type === 'lab.whirl') as { thread?: number; mass?: number; radius?: number } | undefined;
  const thread = whirl ? Number(c!['thread']) : (whirled?.thread ?? THREAD_LENGTH.value);
  const body = whirled?.mass ?? BODY_MASS;
  const radius = whirled?.radius ?? CIRCLE_RADIUS.value;
  return { apparatus, circle: { thread, angle: 0, radius, mass: body, ...fitted }, stopwatch: { display: sec(whirl ? r!.value : 0) }, counted: whirl ? Number(c!['turns']) : 0, ...(whirl ? { run: { seconds: r!.exact ?? r!.value ?? 0, period: r!.inputs?.['period'] ?? 1, count: Number(c!['turns']) } } : {}) };
  }
  const swing = c?.type === 'lab.swing' && r;
  const prev = [...log].reverse().find((e) => e.command.type === 'lab.swing')?.command as { length?: number; mass?: number } | undefined;
  const length = swing ? Number(c!['length']) : (prev?.length ?? (steps.find((x) => x.type === 'lab.swing') as { length?: number } | undefined)?.length ?? 1);
  const mass = swing ? Number(c!['mass']) : (prev?.mass ?? PENDULUM_BALLS.light);
  return { apparatus, pendulum: { length, angle: 0, mass, ...fitted }, stopwatch: { display: sec(swing ? r!.value : 0) }, counted: swing ? Number(c!['count']) : 0, ...(swing ? { run: { seconds: r!.exact ?? r!.value ?? 0, period: r!.inputs?.['period'] ?? 2, count: Number(c!['count']), amplitude: Math.asin(Number(c!['amplitude']) / length) } } : {}) };
}

/** A ball's size by its mass, `at` for the usual one: a sphere's size goes as the cube root of its mass. */
const ballSize = (mass: number, at: number): number => Math.max(4, Math.min(24, at * Math.cbrt(mass / PENDULUM_BALLS.light)));

function motionSvg(v: MotionView): string {
  if (v.apparatus === 'incline') {
    // The groove: its upper end in the stand's clamp, the lower end on the table; the chalk mark, the cylinder, the ball.
    const x0 = 230;
    const x1 = 560;
    const y1 = TABLE - 6;
    // 64 px for the 10 cm the upper end is raised by default: steeper drawn steeper.
    const y0 = y1 - 64 * ((v.incline?.raise ?? 0.1) / 0.1);
    const at = (k: number) => [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k] as const;
    // The path from the mark (1/6 of the groove from its top: 1 m of 1.2 m) to the cylinder.
    const mark = 0.2 / 1.2;
    const along = (share: number) => at(mark + (1 - mark) * share);
    const inc = v.incline ?? { stop: 1, ball: 0 };
    const [mx, my] = along(0);
    const [cx, cy] = along(inc.stop);
    const [bx, by] = along(inc.ball * inc.stop);
    const ang = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
    const r = 7;
    const nx = Math.sin((ang * Math.PI) / 180);
    const ny = -Math.cos((ang * Math.PI) / 180);
    const tape = v.tape ? `<path class="bench-mark" d="M${mx + nx * 22},${my + ny * 22} L${cx + nx * 22},${cy + ny * 22}"/><text class="bench-reading" x="${(mx + cx) / 2 + nx * 30}" y="${(my + cy) / 2 + ny * 30}" text-anchor="middle">l = ${v.tape}</text>` : '';
    return `${standSvg(x0 - 10, x0 + 4, y0)}<path d="M${x0},${y0} L${x1},${y1}" style="stroke:#b88a52;stroke-width:9;stroke-linecap:round"/><path d="M${x0},${y0 - 2} L${x1},${y1 - 2}" style="stroke:#e3bf86;stroke-width:3;stroke-linecap:round"/><path d="M${mx - nx * 2},${my - ny * 2} l${nx * 12},${ny * 12}" style="stroke:#fff;stroke-width:2.5"/><g transform="translate(${cx},${cy}) rotate(${ang})"><rect x="0" y="-22" width="14" height="18" rx="3" style="fill:${STEEL};stroke:${DARK}"/></g>${ballSvg(bx + nx * r, by + ny * r, r)}${tape}`;
  }
  if (v.apparatus === 'circle') {
    // Side view: the hand above the circle drawn on a sheet; the body goes round a horizontal circle below the hand.
    const c = v.circle ?? { thread: 0.5, angle: 0 };
    const R = c.radius ?? CIRCLE_RADIUS.value;
    const h = Math.sqrt(c.thread ** 2 - R ** 2);
    // (A wide circle keeps clear of the stopwatch and the counter.)
    const rx = R * M * (c.fit ?? 1);
    const cx = 340 + Math.max(0, rx - 35);
    const sheetY = TABLE - 4;
    const planeY = sheetY - 26;
    const handY = planeY - h * M * (c.fit ?? 1);
    const ry = rx * 0.28;
    const bx = cx + rx * Math.cos(c.angle);
    const by = planeY + ry * Math.sin(c.angle);
    const behind = Math.sin(c.angle) < 0;
    const body = `<path d="M${cx},${handY} L${bx},${by}" style="stroke:${THREAD};stroke-width:1.5"/>${ballSvg(bx, by, ballSize(c.mass ?? BODY_MASS, 7), '#c0453a')}`;
    // (The sheet is as deep as the circle drawn on it.)
    const depth = Math.max(16, ry * 1.2 + 6);
    const sheet = `<path d="M${cx - rx - 60},${sheetY + 4} l30,${-depth} h${2 * rx + 60} l-30,${depth} z" style="fill:#f6f4ee;stroke:#c9c4b5"/><ellipse cx="${cx}" cy="${sheetY + 4 - depth / 2}" rx="${rx}" ry="${ry * 0.6}" style="fill:none;stroke:#3a5fa8;stroke-width:1.2"/>`;
    const orbit = `<ellipse cx="${cx}" cy="${planeY}" rx="${rx}" ry="${ry}" style="fill:none;stroke:rgba(255,255,255,0.25);stroke-dasharray:3 4"/>`;
    const hand = `<circle cx="${cx}" cy="${handY - 8}" r="10" style="fill:#f1c9a5;stroke:#b98a64"/><path d="M${cx},${handY - 2} v4" style="stroke:${THREAD};stroke-width:2"/>`;
    const scaled = c.scaled ? `<text class="bench-reading" x="${cx + 18}" y="${handY}">${c.scaled}</text>` : '';
    return `${sheet}${orbit}${behind ? body + hand : hand + body}${scaled}`;
  }
  // The pendulum: a stand with a ring at its top, the thread, the ball swung so far.
  const p = v.pendulum ?? { length: 1, angle: 0, mass: 0.03 };
  const pivotX = 330;
  const pivotY = TABLE - 10 - 1.05 * M;
  const L = p.length * M * (p.fit ?? 1);
  const bx = pivotX + L * Math.sin(p.angle);
  const by = pivotY + L * Math.cos(p.angle);
  const r = ballSize(p.mass, 6);
  const scaled = p.scaled ? `<text class="bench-reading" x="${pivotX + 18}" y="${pivotY + 40}">${p.scaled}</text>` : '';
  return `${standSvg(pivotX - 80, pivotX, pivotY)}<circle cx="${pivotX}" cy="${pivotY + 4}" r="5" style="fill:none;stroke:${STEEL};stroke-width:2"/><path d="M${pivotX},${pivotY + 8} L${bx},${by}" style="stroke:${THREAD};stroke-width:1.2"/>${ballSvg(bx, by + r, r)}${scaled}`;
}

/**
 * A timed run with the stopwatch going: the ball speeding up down the groove (its share of the path grows as t²),
 * the body going round, the pendulum swinging (its angle A·cos of the phase). Long runs are sped up.
 */
function timed(next: MotionView, run: NonNullable<MotionView['run']>, draw: (v: MotionView) => void): Motion {
  const fast = Math.max(1, run.seconds / PLAY_SECONDS);
  const comma = (next.stopwatch?.display ?? ',').includes(',');
  const clock = new Channel(0, run.seconds, { kind: 'steady', speed: fast }, 1e-6);
  return {
    channels: [clock],
    frame: (done) => {
      const t = clock.value;
      const stopwatch = { display: done ? (next.stopwatch?.display ?? sw(t, comma)) : sw(t, comma), fast };
      if (next.apparatus === 'incline') {
        if (done) clack();
        else rolling(t / run.seconds);
        return draw({ ...next, stopwatch, incline: { stop: next.incline?.stop ?? 1, ball: (t / run.seconds) ** 2 } });
      }
      const phase = run.period ? (2 * Math.PI * t) / run.period : 0;
      // (Counted to the end of the run: all of them when the stopwatch stops.)
      const counted = done ? (next.counted ?? 0) : Math.floor(((run.count ?? 0) * t) / run.seconds);
      if (next.apparatus === 'circle') return draw({ ...next, stopwatch, counted, circle: { ...next.circle, thread: next.circle?.thread ?? 0.5, angle: phase } });
      return draw({ ...next, stopwatch, counted, pendulum: { ...next.pendulum, length: next.pendulum?.length ?? 1, mass: next.pendulum?.mass ?? 0.03, angle: done ? 0 : (run.amplitude ?? 0) * Math.cos(phase) } });
    },
  };
}

export const motionLabWorksScene = defineScene({
  kind: 'motion',
  view,
  // The stopwatch stands by the stand, on the side away from what hangs or rolls (on the table, beside the sheet for the circle).
  svg: (v: MotionView) => {
    const x = v.apparatus === 'pendulum' ? 178 : v.apparatus === 'incline' ? 152 : 215;
    return `${motionSvg(v)}${v.stopwatch ? stopwatchSvg(v.stopwatch, x) : ''}${v.counted !== undefined ? counterSvg(v.counted, x + 30) : ''}`;
  },
  motion: (next, draw) => (next.run ? timed(next, next.run, draw) : null),
});
