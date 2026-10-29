import { LIFT_WEIGHTS, type LiftPhase } from '../../../src/experiments/weight-in-lift/bench.js';
import { BENCH_WEIGHT } from '../../../src/scenarios/bench-kit.js';
import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { DARK, STEEL, THREAD, weightsSvg } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/** Where each phase of the ride starts, 0 — the ground floor, 1 — the top (it ends where the next one starts). */
const LIFT_FROM: Readonly<Record<string, number>> = { rest: 0, 'up-start': 0, up: 0.25, 'up-stop': 0.75, 'down-start': 1, down: 0.75, 'down-stop': 0.25, fall: 0 };

/** Weight in a lift: the phase, where the cabin is (0 — the ground floor, 1 — the top), the dynamometer's force and reading; `fall` — how far it has fallen to the floor (0…1). */
export type LiftView = { readonly phase: string; readonly y: number; readonly force: number; readonly read?: string; readonly fall?: number; readonly rest?: number; readonly diff?: string };

function view({ last, command, locale }: SceneContext): LiftView {
  const r = last ? readingsOf([last])[0]?.record : undefined;
  const show = (q: 'force' | 'length', v: number | null | undefined) => formatMeasured(q, v ?? 0, q === 'force' ? 0.1 : 0.001, locale);
  const lc = command?.type === 'lab.lift' ? (command as unknown as { phase: LiftPhase }) : undefined;
  const END: Record<LiftPhase, number> = { rest: 0, 'up-start': 0.25, up: 0.75, 'up-stop': 1, 'down-start': 0.75, down: 0.25, 'down-stop': 0, fall: 0 };
  // Before the first step the weights already hang: the spring holds m·g.
  const rest = LIFT_WEIGHTS * BENCH_WEIGHT.value * 9.80665;
  const F = lc && r ? (r.value ?? 0) : rest;
  // How much more or less than at rest, in the instrument's tenths.
  const d = Math.round(F * 10) - Math.round(rest * 10);
  const diff = lc && r && d !== 0 ? `${d > 0 ? '+' : '−'}${show('force', Math.abs(d) / 10)}` : undefined;
  return { phase: lc?.phase ?? 'rest', y: lc ? END[lc.phase] : 0, force: F, rest, ...(lc && r ? { read: show('force', r.value) } : {}), ...(diff ? { diff } : {}), ...(lc?.phase === 'fall' ? { fall: 1 } : {}) };
}

/**
 * Weight in a lift: a shaft with its floors, the cabin on its cable; under its ceiling a dynamometer with four
 * weights, its hook coming out as the spring stretches (10 units to the newton). Arrows by the shaft: the cabin's
 * velocity (v) and acceleration (a). Let go, the dynamometer and its weights fall to the cabin's floor.
 */
function liftSvg(l: LiftView): string {
  const phase = l?.phase ?? 'rest';
  const left = 430;
  const right = 550;
  const x = (left + right) / 2;
  const trip = 150;
  const floor = TABLE - 4 - (l?.y ?? 0) * trip;
  // Tall enough for the dynamometer stretched by the heaviest reading and its four weights.
  const roof = floor - 175;
  const shaft = `<rect x="${left - 8}" y="-40" width="${right - left + 16}" height="${TABLE + 40}" style="fill:rgba(20,26,34,0.35)"/><path d="M${left - 6},-40 V${TABLE} M${right + 6},-40 V${TABLE}" style="stroke:${STEEL};stroke-width:3"/>${[0, 1].map((k) => `<path d="M${left - 30},${TABLE - 4 - k * trip} h22" style="stroke:${THREAD};stroke-width:2"/><text class="bench-label" x="${left - 34}" y="${TABLE - 8 - k * trip}" text-anchor="end">${k ? '5' : '1'}</text>`).join('')}`;
  const cable = `<path d="M${x},-40 V${roof}" style="stroke:${DARK};stroke-width:2.5"/>`;
  const cabin = `<rect x="${left}" y="${roof}" width="${right - left}" height="${floor - roof}" rx="3" style="fill:#d9dee4;stroke:#7d8791;stroke-width:2"/><rect x="${left + 6}" y="${roof + 6}" width="${right - left - 12}" height="${floor - roof - 12}" style="fill:#eef1f4"/>`;
  // The dynamometer: from the ceiling's hook, or let go and falling with its weights.
  const F = l?.force ?? 0;
  const drop = (l?.fall ?? 0) * (floor - 6 - (roof + 8 + 64 + 40));
  const top = roof + 8 + drop;
  const p = top + 8 + F * 10;
  const tip = top + 64 + F * 10;
  const ticks = Array.from({ length: 11 }, (_, i) => `<path d="M${x - 6},${top + 8 + i * 5} h${i % 2 === 0 ? 6 : 3}"/>`).join('');
  const dyn = `${l?.fall ? '' : `<path d="M${x},${roof + 6} V${top}" style="stroke:${DARK};stroke-width:1.5"/>`}<rect class="dyn-case" x="${x - 9}" y="${top}" width="18" height="64" rx="5"/><g class="dyn-ticks">${ticks}</g><path d="M${x},${p} V${tip}" style="stroke:${STEEL};stroke-width:2"/><path d="M${x - 7},${p} h14" style="stroke:#c0392b;stroke-width:2"/>${weightsSvg(x, tip + 2, 4)}`;
  // (Dark: the cabin's wall is light; coloured as the board's bar when it differs from the reading at rest.)
  const tone = l?.diff ? (l.diff.startsWith('+') ? '#2e8b46' : '#c0502e') : '#1d2733';
  const read = l?.read ? `<text class="bench-reading" x="${x + 14}" y="${top + 30}" style="fill:${tone}">${l.read}</text>` : '';
  // The arrows: up is negative y.
  const up = phase === 'up-start' || phase === 'up' || phase === 'up-stop';
  const down = phase === 'down-start' || phase === 'down' || phase === 'down-stop';
  const accUp = phase === 'up-start' || phase === 'down-stop';
  const accDown = phase === 'up-stop' || phase === 'down-start' || phase === 'fall';
  const arrow = (ax: number, dir: -1 | 1, label: string, cls: string) => {
    const y0 = (roof + floor) / 2;
    return `<path class="${cls}" d="M${ax},${y0 - dir * 22} V${y0 + dir * 22} m-5,${-dir * 7} l5,${dir * 7} l5,${-dir * 7}" style="fill:none;stroke-width:2.5"/><text class="bench-label" x="${ax + 9}" y="${y0 + 4}">${label}</text>`;
  };
  const arrows = `${up || down ? arrow(right + 24, up ? -1 : 1, 'v', 'bench-arrow') : ''}${accUp || accDown ? arrow(right + 52, accUp ? -1 : 1, phase === 'fall' ? 'g' : 'a', 'bench-mark') : ''}`;
  return `${shaft}${cable}${cabin}${dyn}${read}${arrows}${liftZoom(l, x - 9, top + 32)}`;
}

/**
 * The dynamometer's scale enlarged, in chalk on the board by the shaft: 0 at the top as on the instrument, a dashed
 * mark at its reading at rest and a bar from it to the pointer — green when it shows more, red when less — so that
 * half a newton, five units on the instrument itself, is plain to see. A dashed line leads to the instrument.
 */
function liftZoom(l: LiftView, toX: number, toY: number): string {
  if (!l?.rest) return '';
  const x = 395;
  const y0 = -32;
  const per = 34;
  const at = (F: number) => y0 + Math.min(5.2, Math.max(0, F)) * per;
  const chalk = 'stroke:#f1efe4';
  const ticks = Array.from({ length: 11 }, (_, i) => `<path d="M${x - (i % 2 === 0 ? 10 : 5)},${y0 + i * per / 2} H${x}" style="${chalk};stroke-width:1.5"/>${i % 2 === 0 ? `<text class="bench-label" x="${x + 6}" y="${y0 + i * per / 2 + 4}" style="fill:#f1efe4">${i / 2}</text>` : ''}`).join('');
  const F = l.force;
  const more = F - l.rest > 0.02;
  const less = F - l.rest < -0.02;
  const colour = more ? '#8fd694' : '#f2a07b';
  const bar = more || less ? `<rect x="${x - 26}" y="${Math.min(at(F), at(l.rest))}" width="14" height="${Math.abs(at(F) - at(l.rest))}" style="fill:${colour}"/>` : '';
  const diff = l.diff ? `<text class="bench-reading" x="${x - 32}" y="${(at(F) + at(l.rest)) / 2 + 5}" text-anchor="end" style="fill:${colour}">${l.diff}</text>` : '';
  const rest = `<path d="M${x - 38},${at(l.rest)} H${x}" style="${chalk};stroke-width:1.5;stroke-dasharray:4 3"/>`;
  const pointer = `<path d="M${x - 14},${at(F)} H${x + 2}" style="stroke:#ff6b5b;stroke-width:3"/>`;
  const lead = `<path d="M${x + 22},${at(F)} L${toX},${toY}" style="${chalk};stroke-width:1;stroke-dasharray:2 4;opacity:0.6"/>`;
  return `<path d="M${x},${y0} V${y0 + 5 * per}" style="${chalk};stroke-width:2"/>${ticks}${bar}${rest}${pointer}${diff}${lead}`;
}

/**
 * The lift's ride: speeding up (the way grows as t²), steady, slowing down (as the square of the time left); the
 * dynamometer's spring swings to the phase's reading. Let go, the dynamometer falls (t²) and its spring goes slack.
 */
function lift(was: LiftView | null, next: LiftView, draw: (v: LiftView) => void): Motion {
  const l = next;
  const from = LIFT_FROM[l.phase] ?? l.y;
  const shape = (k: number) => (l.phase.endsWith('-start') ? k * k : l.phase.endsWith('-stop') ? 1 - (1 - k) ** 2 : k);
  const k = new Channel(0, 1, { kind: 'steady', speed: l.phase === 'fall' ? 1.6 : 0.45 }, 0.001);
  const spring = new Channel(was?.force ?? l.force, l.force, { kind: 'damped', period: 0.5, damping: 0.2 }, 0.01);
  return {
    channels: [k, spring],
    frame: (done) => {
      const { read: _r, diff: _d, ...rest } = l;
      if (done) return draw(next);
      if (l.phase === 'fall') return draw({ ...rest, y: 0, force: Math.max(0, spring.value), fall: k.value * k.value });
      draw({ ...rest, y: from + (l.y - from) * shape(k.value), force: Math.max(0, spring.value) });
    },
  };
}

export const weightInLiftScene = defineScene({ kind: 'lift', view, svg: liftSvg, motion: (next, draw, prev) => (next.read ? lift(prev, next, draw) : null) });
