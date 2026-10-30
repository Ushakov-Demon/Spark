import { readingsOf } from '../../../src/scenarios/measuring.js';
import { PLAY_SECONDS } from '../../graphics/scene/bench-motion.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { stopwatchSvg } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/**
 * The stairs to the next floor (so many steps, so high), the pupil — on the floor scales, by the ruler at the first
 * step, or on the stairs (0 — at the foot, 1 — at the top); the stopwatch; what was read.
 */
export type StairsView = {
  readonly steps: number;
  readonly rise: number;
  readonly where: 'scales' | 'ruler' | 'stairs';
  readonly at: number;
  readonly run: boolean;
  readonly time?: number;
  readonly fast?: number;
  readonly read?: string;
  /** The floor's height, once the steps are measured. */
  readonly floor?: string;
  /** The stopwatch writes a decimal comma (Ukrainian) or a point. */
  readonly comma?: boolean;
};

const LEFT = 230;
const RIGHT = 480;
const FLOOR = TABLE - 4;

function view({ last, command, plan, locale }: SceneContext): StairsView {
  type Cmd = { step: string; steps?: number; rise?: number; pace?: string };
  const sc = command?.type === 'lab.stairs' ? (command as unknown as Cmd) : undefined;
  const stairs = [sc, ...plan.map((s) => (s.kind === 'bench' && s.command.type === 'lab.stairs' ? (s.command as unknown as Cmd) : undefined))].find((c) => c?.steps);
  const steps = stairs?.steps ?? 18;
  const rise = stairs?.rise ?? 0.16;
  const r = last && sc ? readingsOf([last])[0]?.record : undefined;
  const base = { steps, rise, at: 0, run: false, comma: locale === 'uk' };
  const comma = locale === 'uk';
  const floor = `h = ${String(Math.round(steps * rise * 100) / 100).replace('.', comma ? ',' : '.')} ${comma ? 'м' : 'm'}`;
  if (!sc || sc.step === 'weigh') return { ...base, where: 'scales', ...(r ? { read: `${(r.value ?? 0).toFixed(1).replace('.', comma ? ',' : '.')} ${comma ? 'кг' : 'kg'}` } : {}) };
  if (sc.step === 'measure') return { ...base, where: 'ruler', floor, read: `h₁ = ${String(Math.round((r?.value ?? 0) * 1000) / 10).replace('.', comma ? ',' : '.')} ${comma ? 'см' : 'cm'}` };
  const time = r?.value ?? 0;
  return { ...base, where: 'stairs', floor, at: 1, run: sc.pace === 'run', time, fast: Math.max(1, time / PLAY_SECONDS) };
}

/** A pupil: a head, a body, legs apart as they go (`stride` −1…1), leaning forward when running. */
function personSvg(x: number, foot: number, run: boolean, stride: number): string {
  const lean = run ? 6 : 2;
  const hip = foot - 26;
  const neck = foot - 50;
  const leg = (s: number) => `<path d="M${x},${hip} L${x + s * 7},${foot}" style="stroke:#2f4f8f;stroke-width:4;stroke-linecap:round"/>`;
  return `<g>${leg(stride)}${leg(-stride)}<path d="M${x},${hip} L${x + lean},${neck}" style="stroke:#e0623a;stroke-width:7;stroke-linecap:round"/><path d="M${x + lean},${neck + 4} l${-stride * 8},14 M${x + lean},${neck + 4} l${stride * 8},14" style="stroke:#e7b892;stroke-width:3;stroke-linecap:round"/><circle cx="${x + lean + 1}" cy="${neck - 9}" r="8" style="fill:#e7b892;stroke:#a8714d"/></g>`;
}

function svg(v: StairsView): string {
  const height = v.steps * v.rise;
  // The flight fits the picture: at most 2 px a centimetre, the top no higher than 230 px over the floor.
  const k = Math.min(200, 230 / height);
  const h = v.rise * k;
  const run = (RIGHT - LEFT) / v.steps;
  const treads = Array.from({ length: v.steps }, (_, i) => `L${LEFT + i * run},${FLOOR - (i + 1) * h} L${LEFT + (i + 1) * run},${FLOOR - (i + 1) * h}`).join(' ');
  const flight = `<path d="M${LEFT},${FLOOR} ${treads} L${RIGHT},${FLOOR} Z" style="fill:#b9a58a;stroke:#7d6a50;stroke-width:1.2"/><path d="M${RIGHT},${FLOOR - height * k} H${RIGHT + 70}" style="stroke:#7d6a50;stroke-width:3"/>`;
  // The floor's height, marked by the stairs.
  const mark = !v.floor ? '' : `<path d="M${RIGHT + 40},${FLOOR} V${FLOOR - height * k}" style="stroke:#efe9d2;stroke-width:1;stroke-dasharray:4 3"/>${v.floor ? `<text class="bench-reading" x="${RIGHT + 46}" y="${FLOOR - (height * k) / 2}">${v.floor}</text>` : ''}`;
  let who = '';
  if (v.where === 'scales') who = `<rect x="${LEFT - 110}" y="${FLOOR - 8}" width="56" height="8" rx="3" style="fill:#dfe3e8;stroke:#8a96a3"/>${personSvg(LEFT - 82, FLOOR - 8, false, 0.4)}${v.read ? `<rect x="${LEFT - 104}" y="${FLOOR - 7}" width="44" height="6" rx="1" style="fill:#c9d8b6"/><text class="bench-reading" x="${LEFT - 82}" y="${FLOOR - 70}" text-anchor="middle">${v.read}</text>` : ''}`;
  else if (v.where === 'ruler') who = `<rect x="${LEFT - 9}" y="${FLOOR - h - 6}" width="6" height="${h + 6}" style="fill:#f1e3b8;stroke:#b39b5c"/><text class="bench-reading" x="${LEFT - 14}" y="${FLOOR - h - 10}" text-anchor="end">${v.read ?? ''}</text>${personSvg(LEFT - 100, FLOOR, false, 0.4)}`;
  else {
    // On the stairs: along the flight, the feet on the tread under it.
    const x = LEFT + v.at * (RIGHT - LEFT) + (v.at >= 1 ? 30 : 0);
    const i = Math.min(v.steps, Math.floor(v.at * v.steps + 1e-9));
    const foot = v.at <= 0 ? FLOOR : FLOOR - Math.min(v.steps, i + (v.at < 1 ? 1 : 0)) * h;
    const stride = Math.sin(v.at * v.steps * Math.PI) * (v.run ? 1 : 0.6);
    who = personSvg(x, foot, v.run, stride);
  }
  const sw = v.time !== undefined ? stopwatchSvg({ display: v.time.toFixed(2).replace('.', v.comma ? ',' : '.'), ...(v.fast ? { fast: v.fast } : {}) }, 600) : '';
  return `${flight}${mark}${who}${sw}`;
}

/** Up the stairs at the pupil's own time (sped up when long), the stopwatch running with them. */
function motion(next: StairsView, draw: (v: StairsView) => void): Motion | null {
  if (next.where !== 'stairs' || !next.time) return null;
  const fast = next.fast ?? 1;
  const T = next.time;
  const clock = new Channel(0, T, { kind: 'steady', speed: fast }, 1e-6);
  return {
    channels: [clock],
    frame: (done) => (done ? draw(next) : draw({ ...next, at: clock.value / T, time: clock.value })),
  };
}

export const stairsPowerScene = defineScene({ kind: 'stairs', view, svg, motion });
