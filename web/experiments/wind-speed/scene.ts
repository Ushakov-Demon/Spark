import { WIND_DAYS, WIND_TRACK } from '../../../src/experiments/wind-speed/bench.js';
import { t as tl } from '../../../src/knowledge/messages.js';
import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { DARK, STEEL, stopwatchSvg } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { blowing } from '../../sounds/index.js';
import { defineScene, type SceneContext } from '../types.js';

/** The wind's speed: the day (1–3, its Beaufort force), the wind (m/s), where the bubble is (m past the first mark; none — not blown yet), the speed found. */
type Wind = { readonly day: number; readonly speed: number; readonly at?: number; readonly read?: string };
/** The wind, and what plays it. */
export type WindView = { readonly wind: Wind; readonly stopwatch?: { readonly display: string; readonly fast?: number }; readonly run?: { readonly seconds: number } };

function view({ last, command, plan, locale }: SceneContext): WindView {
  const r = last ? readingsOf([last])[0]?.record : undefined;
  const wc = command?.type === 'lab.wind' ? (command as unknown as { day: 1 | 2 | 3 }) : undefined;
  const next = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.wind');
  const day = wc?.day ?? (next?.kind === 'bench' ? (next.command as unknown as { day: 1 | 2 | 3 }).day : 1);
  const done = wc && r && r.value;
  const v = done ? WIND_TRACK / r.value! : 0;
  return { wind: { day, speed: WIND_DAYS[day].value, ...(done ? { at: WIND_TRACK, read: `${String(Math.round(v * 10) / 10).replace('.', tl(locale, 'wind-speed-view-read'))} ${tl(locale, 'unit-sym-m-per-s')}` } : {}) }, ...(done ? { stopwatch: { display: formatMeasured('time', r.value, 0.01, locale).replace(/ (с|s)$/, '') }, run: { seconds: r.value! } } : {}) };
}

/** The yard: the first and the second mark (6 m apart), units of the drawing. */
const WIND_MARKS = [340, 560] as const;
/** The Beaufort force from which the wind is felt on the face, and the vane turns (wind-speed-2-signs). */
const FELT_FROM = 2;
/** The streaks: x, height under the vane's top, and how long each takes, in parts of the others'. */
const STREAKS = [
  [330, 40, 1],
  [420, 76, 1.2],
  [370, 104, 0.9],
  [470, 22, 1.1],
  [320, 128, 1.3],
] as const;
/**
 * A movement that goes on over the drawing: its period, s, and where in it the clock stands now. The bench is drawn
 * anew on every frame of a motion, and a new element would start over: so each takes up where the last one was.
 */
const cycle = (seconds: number): string => `animation-duration:${seconds.toFixed(2)}s;animation-delay:-${((performance.now() / 1000) % seconds).toFixed(3)}s`;

/**
 * The wind's speed: a yard drawn on the table — two stakes 6 m apart with the tape measure between them (the
 * stopwatch between them), a wind vane on a pole, and the soap bubble carried from the first stake to the second. The
 * vane's arrow points where the wind comes from, its windmill turns the faster the stronger the wind; at force 1 it
 * stands (the scale's sign: the vane does not turn), and the wind itself is seen only from force 2, when it is felt.
 */
function windSvg(w: Wind): string {
  const ground = TABLE - 6;
  const [a, b] = WIND_MARKS;
  const per = (b - a) / 6;
  const stake = (x: number, label: string) => `<path d="M${x},${ground} V${ground - 46}" style="stroke:#8a5a2b;stroke-width:4"/><text class="bench-label" x="${x}" y="${ground - 52}" text-anchor="middle">${label}</text>`;
  const tape = `<path d="M${a},${ground - 3} H${b}" style="stroke:#f2c94c;stroke-width:4"/>${Array.from({ length: 7 }, (_, i) => `<path d="M${a + i * per},${ground - 7} v8" style="stroke:${DARK};stroke-width:1"/>`).join('')}`;
  const pole = 592;
  const top = ground - 180;
  const felt = w.day >= FELT_FROM;
  // The vane: its arrow into the wind, the tail behind; the windmill at the arrow's tip.
  const hub = pole - 42;
  const blade = (deg: number) => `<path d="M0,0 C4,-6 12,-14 3,-18 C-2,-16 -2,-6 0,0 Z" transform="rotate(${deg})" style="fill:#e05a47;stroke:#8e2b20;stroke-width:0.8"/>`;
  const turn = 3 / w.speed;
  const mill = `<g transform="translate(${hub},${top})"><g${felt ? ` class="wind-mill" style="${cycle(turn)}"` : ''}>${[0, 90, 180, 270].map(blade).join('')}<circle r="2.5" style="fill:${DARK}"/></g></g>`;
  const vane = `<path d="M${pole},${ground} V${top}" style="stroke:${STEEL};stroke-width:3"/><path d="M${hub},${top} H${pole + 34}" style="stroke:${DARK};stroke-width:3"/><path d="M${pole + 22},${top} l18,-13 v26 z" style="fill:#e05a47;stroke:#8e2b20"/><circle cx="${pole}" cy="${top}" r="3.5" style="fill:${DARK}"/>${mill}`;
  // The wind itself: streaks going by, more and faster the stronger it is.
  const streaks = felt
    ? STREAKS.slice(0, w.day === FELT_FROM ? 3 : STREAKS.length)
        .map(([x, y, k]) => `<path class="wind-streak" d="M${x},${top + y} q18,-7 36,0 t36,0 q9,3 12,-3" style="fill:none;stroke:rgba(255,255,255,0.6);stroke-width:2;stroke-linecap:round;${cycle((k * 12) / w.speed)}"/>`)
        .join('')
    : '';
  const by = ground - 96;
  const bubble = w.at === undefined ? '' : `<circle cx="${a + w.at * per}" cy="${by + 6 * Math.sin(w.at * 1.7)}" r="11" style="fill:rgba(190,230,255,0.35);stroke:#bfe3ff;stroke-width:1.5"/><path d="M${a + w.at * per - 5},${by + 6 * Math.sin(w.at * 1.7) - 5} a6,6 0 0 1 6,-3" style="fill:none;stroke:#fff;stroke-width:1.5"/>`;
  const read = w.read ? `<text class="bench-reading" x="${b}" y="${by - 22}" text-anchor="middle">v ≈ ${w.read}</text>` : '';
  const arrow = `<path class="bench-arrow" d="M${a + 40},${top + 10} h${30 + 12 * w.speed} m-6,-4 l6,4 l-6,4"/>`;
  return `${streaks}${tape}${stake(a, '0')}${stake(b, '6 м')}${vane}${arrow}${bubble}${read}`;
}

/** The wind's speed: the bubble, blown a little before the first stake, flies with the wind; the stopwatch runs from the first stake to the second (in real time). */
function windRun(next: WindView, run: NonNullable<WindView['run']>, draw: (v: WindView) => void): Motion {
  const w = next.wind;
  const lead = 0.6 / w.speed;
  const comma = (next.stopwatch?.display ?? ',').includes(',');
  const clock = new Channel(0, lead + run.seconds, { kind: 'steady', speed: 1 }, 1e-6);
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw(next);
      blowing(w.speed / WIND_DAYS[3].value);
      const t = clock.value - lead;
      const { read: _r, ...rest } = w;
      draw({ ...next, stopwatch: { display: Math.max(0, t).toFixed(2).replace('.', comma ? ',' : '.') }, wind: { ...rest, at: t * w.speed } });
    },
  };
}

export const windSpeedScene = defineScene({
  kind: 'wind',
  view,
  svg: (v: WindView) => `${windSvg(v.wind)}${v.stopwatch ? stopwatchSvg(v.stopwatch, 450) : ''}`,
  motion: (next, draw) => (next.wind.read && next.run ? windRun(next, next.run, draw) : null),
});
