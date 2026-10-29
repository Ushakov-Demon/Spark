import { CARRY_BUBBLE, CARRY_RISE } from '../../../src/experiments/relative-motion/bench.js';
import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { rulerSvg, stopwatchSvg } from '../../graphics/scene/kit.js';
import { sinkSvg, through, type Sink, type SinkView } from '../bodies-in-liquids/scene.js';
import { defineScene, type SceneContext } from '../types.js';

/** Where the carried bottle starts (its axis), units of the drawing; the drawing's scale is the bottle's: 8 to the centimetre. */
const CARRY_X0 = 360;

/**
 * The relativity of motion: the bubble's bottle (in `sink`) carried along the table at `speed` (m/s), moved `shift`
 * (m) so far; the line on the paper behind, once measured (`path`).
 */
export type CarryView = SinkView & { readonly carry: NonNullable<SinkView['carry']> };

function view({ last, command, locale }: SceneContext): CarryView {
  const cc = command?.type === 'lab.carry' ? (command as unknown as { speed: number }) : undefined;
  const recs = last && cc ? readingsOf([last]).map((x) => x.record) : [];
  const of = (w: number) => recs.find((x) => x.inputs?.['which'] === w);
  const t = of(0);
  const cm = (x: number) => `${String(Math.round(x * 1000) / 10).replace('.', locale === 'uk' ? ',' : '.')} ${locale === 'uk' ? 'см' : 'cm'}`;
  const sink = { body: 'bubble' as const, color: 'rgba(120,200,120,0.55)', marks: [0.03, 0.06, 0.09], diameter: CARRY_BUBBLE, ...(t ? { at: CARRY_RISE, speed: t.inputs?.['bubble'] ?? 0 } : {}) };
  return { sink, ...(t ? { stopwatch: { display: formatMeasured('time', t.value, 0.01, locale).replace(/ (с|s)$/, '') }, run: { seconds: t.value ?? 0 } } : {}), carry: { speed: cc?.speed ?? 0, shift: of(1)?.value ?? 0, ...(t ? { path: cm(of(2)?.value ?? 0), rise: cm(CARRY_RISE) } : {}) } };
}

/**
 * The relativity of motion: a sheet of paper fixed to the table behind the bottle, a ruler on the table in front;
 * the bottle (sinkSvg's, moved along) with its bubble. On the paper: a dot where the bubble passed the zero mark,
 * a chalk-red line from it to where the bubble is now — its path relative to the table — and, in the bottle, the
 * bubble's own way straight up. An arrow shows the bottle's motion.
 */
function carrySvg(s: Sink, c: CarryView['carry']): string {
  const k = 800;
  const bottom = TABLE - 8;
  const zero = bottom - 30;
  const dx = (c?.shift ?? 0) * k;
  const paper = `<rect x="${CARRY_X0 - 50}" y="${bottom - 190}" width="220" height="180" style="fill:#f4f1e8;stroke:#c9c2a8;opacity:0.92"/>`;
  const ruler = rulerSvg(CARRY_X0 - 20, TABLE + 6, 20, false, 8);
  const at = s?.at;
  const on = at !== undefined && at >= 0 && s?.turn === undefined;
  const start = on ? `<circle cx="${CARRY_X0}" cy="${zero}" r="3" style="fill:#c0392b"/>` : '';
  const trail = on ? `<path d="M${CARRY_X0},${zero} L${CARRY_X0 + dx},${zero - at * k}" style="stroke:#c0392b;stroke-width:2;stroke-dasharray:5 3"/>` : '';
  const end = on && c?.path ? `<circle cx="${CARRY_X0 + dx}" cy="${zero - at * k}" r="3" style="fill:#c0392b"/><text class="bench-reading" x="${CARRY_X0 + dx / 2 - 8}" y="${zero - (at * k) / 2 + 16}" text-anchor="end" style="fill:#8e2b20">s = ${c.path}</text>` : '';
  // The bubble's own way, in the bottle: straight up from the zero mark.
  const own = on ? `<path d="M${CARRY_X0 + dx - 14},${zero} V${zero - at * k}" style="stroke:#2d6a9f;stroke-width:1.6"/>${c?.rise ? `<text class="bench-reading" x="${CARRY_X0 + dx - 10}" y="${zero - (at * k) / 2 + 4}" style="fill:#1f4f7a">${c.rise}</text>` : ''}` : '';
  const arrow = c && c.speed > 0 ? `<path class="bench-arrow" d="M${CARRY_X0 + dx - 20},${bottom - 212} h40 m-6,-4 l6,4 l-6,4"/><text class="bench-label" x="${CARRY_X0 + dx}" y="${bottom - 220}" text-anchor="middle">u</text>` : '';
  return `${paper}${ruler}${start}${trail}<g transform="translate(${CARRY_X0 - 400 + dx},0)">${sinkSvg(s)}</g>${own}${end}${arrow}`;
}

export const relativeMotionScene = defineScene({
  kind: 'carry',
  view,
  svg: (v: CarryView) => `${carrySvg(v.sink, v.carry)}${v.stopwatch ? stopwatchSvg(v.stopwatch, 585) : ''}`,
  motion: (next, draw) => (next.run && next.sink.speed ? through(next, next.run, next.sink, draw) : null),
});
