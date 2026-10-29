import { WIND_DAYS, WIND_TRACK } from '../../../src/experiments/wind-speed/bench.js';
import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { DARK, STEEL, stopwatchSvg } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
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
  return { wind: { day, speed: WIND_DAYS[day].value, ...(done ? { at: WIND_TRACK, read: `${String(Math.round(v * 10) / 10).replace('.', locale === 'uk' ? ',' : '.')} ${locale === 'uk' ? 'м/с' : 'm/s'}` } : {}) }, ...(done ? { stopwatch: { display: formatMeasured('time', r.value, 0.01, locale).replace(/ (с|s)$/, '') }, run: { seconds: r.value! } } : {}) };
}

/** The yard: the first and the second mark (6 m apart), units of the drawing. */
const WIND_MARKS = [340, 560] as const;

/**
 * The wind's speed: a yard drawn on the table — two stakes 6 m apart with the tape measure between them (the
 * stopwatch between them), a flag on a pole that flies the more the stronger the wind (hanging at force 1, out at force 3), and the soap bubble carried
 * from the first stake to the second.
 */
function windSvg(w: Wind): string {
  const ground = TABLE - 6;
  const [a, b] = WIND_MARKS;
  const per = (b - a) / 6;
  const stake = (x: number, label: string) => `<path d="M${x},${ground} V${ground - 46}" style="stroke:#8a5a2b;stroke-width:4"/><text class="bench-label" x="${x}" y="${ground - 52}" text-anchor="middle">${label}</text>`;
  const tape = `<path d="M${a},${ground - 3} H${b}" style="stroke:#f2c94c;stroke-width:4"/>${Array.from({ length: 7 }, (_, i) => `<path d="M${a + i * per},${ground - 7} v8" style="stroke:${DARK};stroke-width:1"/>`).join('')}`;
  // The flag: its droop from the pole, by the wind (down at force 1, out at force 3).
  const pole = 592;
  const top = ground - 180;
  const droop = Math.max(8, 75 - 15 * w.speed) * (Math.PI / 180);
  const fx = 50 * Math.cos(droop);
  const fy = 50 * Math.sin(droop);
  const flag = `<path d="M${pole},${ground} V${top}" style="stroke:${STEEL};stroke-width:3"/><path d="M${pole},${top} L${pole + fx * 0.8},${top + fy * 0.8} L${pole + fx * 0.8 - 14 * Math.sin(droop)},${top + fy * 0.8 + 26 * Math.cos(droop) - 4} L${pole},${top + 26} Z" style="fill:#e05a47;stroke:#8e2b20"/>`;
  const by = ground - 96;
  const bubble = w.at === undefined ? '' : `<circle cx="${a + w.at * per}" cy="${by + 6 * Math.sin(w.at * 1.7)}" r="11" style="fill:rgba(190,230,255,0.35);stroke:#bfe3ff;stroke-width:1.5"/><path d="M${a + w.at * per - 5},${by + 6 * Math.sin(w.at * 1.7) - 5} a6,6 0 0 1 6,-3" style="fill:none;stroke:#fff;stroke-width:1.5"/>`;
  const read = w.read ? `<text class="bench-reading" x="${b}" y="${by - 22}" text-anchor="middle">v ≈ ${w.read}</text>` : '';
  const arrow = `<path class="bench-arrow" d="M${a + 40},${top + 10} h${30 + 12 * w.speed} m-6,-4 l6,4 l-6,4"/>`;
  return `${tape}${stake(a, '0')}${stake(b, '6 м')}${flag}${arrow}${bubble}${read}`;
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
