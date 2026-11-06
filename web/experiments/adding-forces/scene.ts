import { FORCES_MASS, FORCES_RULER, forcesDivision, forcesShares } from '../../../src/experiments/adding-forces/bench.js';
import { SCALES } from '../../../src/equipment/scales.js';
import type { Locale } from '../../../src/knowledge/i18n.js';
import { t as tl } from '../../../src/knowledge/messages.js';
import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { DARK, forceGaugeSvg, standSvg, STEEL, THREAD, WOOD, WOOD_EDGE } from '../../graphics/scene/kit.js';
import { loadHeight, loadSvg } from '../../graphics/scene/weights.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/**
 * Adding forces: a stand with a long arm; school dynamometers (10 units to the newton) hang from it, their hooks
 * coming out as the spring stretches, so a ruler held by two of them tilts when they pull differently. Under the
 * load, for "down", a third position: a dynamometer turned over, its ring tied to a clamp on the table, its hook
 * pulling the weights down.
 */
const FORCES_K = 600;

export type ForcesView = {
  readonly hold: 'one' | 'two' | 'down';
  readonly at: number;
  readonly a: number;
  readonly b: number;
  readonly loaded: boolean;
  readonly readA?: string;
  readonly readB?: string;
  readonly mass: number;
  /** The weights can be moved along the ruler: their field beside them, the grip on them. */
  readonly adjust: boolean;
  readonly locale: Locale;
};

function view({ last, command, plan, locale }: SceneContext): ForcesView {
  const show = (q: 'force' | 'length', v: number | null | undefined) => formatMeasured(q, v ?? 0, q === 'force' ? 0.1 : 0.001, locale);
  type Hold = { hold: 'one' | 'two' | 'down'; at?: number; mass?: number };
  const fc = command?.type === 'lab.forces' ? (command as unknown as Hold) : undefined;
  const next = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.forces');
  const cmd = fc ?? (next?.kind === 'bench' ? (next.command as unknown as Hold) : undefined);
  const recs = fc && last ? readingsOf([last]).map((x) => x.record) : [];
  const A = recs.find((x) => (x.inputs?.['which'] ?? 0) === 0);
  const B = recs.find((x) => x.inputs?.['which'] === 1);
  const hold = cmd?.hold ?? 'one';
  // (The next step takes their place from the knob.)
  const adjust = !!fc && hold === 'two' && next?.kind === 'bench' && (next.command as { again?: boolean }).again === true;
  return { hold, at: cmd?.at ?? 0.15, a: A?.value ?? 0, b: B?.value ?? 0, loaded: !!fc, mass: cmd?.mass ?? FORCES_MASS, adjust, locale, ...(A ? { readA: show('force', A.value) } : {}), ...(B ? { readB: show('force', B.value) } : {}) };
}

function forcesSvg(f: ForcesView): string {
  const hold = f?.hold ?? 'one';
  const loaded = !!f?.loaded;
  const armY = 40;
  const top = armY + 6;
  // To the right: the board's writing on the left stays readable.
  const xC = 480;
  const half = (0.3 * FORCES_K) / 2;
  const PER_N = 10;
  // A dynamometer hanging from (x, top): its pointer and hook go down by the force; returns the drawing and where the hook ends.
  const hanging = (x: number, F: number, read: string | undefined, left: boolean): [string, number] => {
    // (Beyond the dynamometer's range: a force gauge, its hook where it is.)
    if (F > SCALES.dynamometer.spec.capacity.value) return [`<path d="M${x},${armY + 3} V${top}" style="stroke:${THREAD};stroke-width:1.5"/>${forceGaugeSvg(x, top, read ?? '')}`, top + 80];
    const p = top + 8 + F * PER_N;
    const tip = top + 64 + F * PER_N;
    const ticks = Array.from({ length: 11 }, (_, i) => `<path d="M${x - 6},${top + 8 + i * 5} h${i % 2 === 0 ? 6 : 3}"/>`).join('');
    const label = read ? `<text class="bench-reading" x="${x + 13}" y="${top + (left ? 24 : 40)}">${read}</text>` : '';
    return [`<path d="M${x},${armY + 3} V${top}" style="stroke:${THREAD};stroke-width:1.5"/><rect class="dyn-case" x="${x - 9}" y="${top}" width="18" height="64" rx="5"/><g class="dyn-ticks">${ticks}</g><path d="M${x},${p} V${tip}" style="stroke:${STEEL};stroke-width:2"/><path d="M${x - 7},${p} h14" style="stroke:#c0392b;stroke-width:2"/><path d="M${x},${tip} q0,6 -5,5" style="stroke:${THREAD};stroke-width:1.5;fill:none"/>${label}`, tip + 4];
  };
  const ruler = (x1: number, y1: number, x2: number, y2: number) => `<path d="M${x1},${y1} L${x2},${y2}" style="stroke:${WOOD_EDGE};stroke-width:7;stroke-linecap:round"/><path d="M${x1},${y1} L${x2},${y2}" style="stroke:${WOOD};stroke-width:5;stroke-linecap:round"/>`;
  const mass = f?.mass ?? FORCES_MASS;
  const locale = f?.locale ?? 'uk';
  const load = (x: number, y: number) => `<path d="M${x},${y} v12" style="stroke:${THREAD};stroke-width:1.5"/>${loadSvg(x, y + 12, mass, locale, 22)}`;
  const stand = standSvg(345, 610, armY);
  if (!loaded) {
    // Not hung yet: the dynamometers empty, the ruler and the weights on the table.
    const xs = hold === 'two' ? [xC - half, xC + half] : [xC];
    return `${stand}${xs.map((x, i) => hanging(x, 0, undefined, i === 0 && xs.length > 1)[0]).join('')}${ruler(xC - half - 30, TABLE - 4, xC + half - 30, TABLE - 4)}${loadSvg(xC + half + 10, TABLE - loadHeight(mass), mass, locale, 22)}`;
  }
  if (hold === 'two') {
    const [l, yl] = hanging(xC - half, f!.a, f!.readA, true);
    const [r, yr] = hanging(xC + half, f!.b, f!.readB, false);
    const k = Math.max(0, Math.min(1, f!.at / 0.3));
    const lx = xC - half + k * 2 * half;
    const ly = yl + (yr - yl) * k;
    // The weights' place is a knob: dragged along the ruler, or typed in the field under them (clear of the bubble).
    // Counted from the ruler's middle, whichever way they went: its 0 is marked; a number typed in keeps them on their side.
    const off = f!.at - FORCES_MIDDLE;
    const midY = (yl + yr) / 2;
    const knob = f!.adjust
      ? `<path d="M${xC},${midY - 8} v-6" style="stroke:#ffd166;stroke-width:2"/><text x="${xC}" y="${midY - 17}" text-anchor="middle" style="font:700 11px system-ui;fill:#ffd166">0</text><g data-live="off" style="touch-action:none"><rect x="${lx - 26}" y="${ly + 4}" width="52" height="${loadHeight(mass) + 16}" style="fill:transparent"/><path d="M${lx - 16},${ly + 16} l-7,5 l7,5 M${lx + 16},${ly + 16} l7,5 l-7,5" style="fill:none;stroke:#ffd166;stroke-width:2;stroke-linecap:round"/></g><foreignObject x="${lx - 40}" y="${ly + 18 + loadHeight(mass)}" width="92" height="36"><div class="scene-field"><input type="number" data-live-field="off" data-factor="${off < 0 ? -0.01 : 0.01}" min="0" max="${OFF_MAX * 100}" step="1" value="${Math.round(Math.abs(off) * 100)}" aria-label="${tl(locale, 'adding-forces-live-at')}"/><span>${tl(locale, 'unit-sym-cm')}</span></div></foreignObject>`
      : '';
    return `${stand}${l}${r}${ruler(xC - half, yl, xC + half, yr)}${load(lx, ly)}${knob}`;
  }
  const [a, y] = hanging(xC, f!.a, f!.readA, false);
  const body = `${ruler(xC - half, y, xC + half, y)}${load(xC, y)}`;
  if (hold === 'one') return `${stand}${a}${body}`;
  // The lower one, turned over: its hook in the weights' bottom, pulled out by the force; its ring tied to a clamp.
  const hook = y + 12 + loadHeight(mass) + 2;
  const bt = hook + 6 + f!.b * PER_N;
  const p = bt + 56 - f!.b * PER_N;
  const ticks = Array.from({ length: 11 }, (_, i) => `<path d="M${xC - 6},${bt + 56 - i * 5} h${i % 2 === 0 ? 6 : 3}"/>`).join('');
  const lower = `<path d="M${xC},${hook} V${p}" style="stroke:${STEEL};stroke-width:2"/><rect class="dyn-case" x="${xC - 9}" y="${bt}" width="18" height="64" rx="5"/><g class="dyn-ticks">${ticks}</g><path d="M${xC - 7},${p} h14" style="stroke:#c0392b;stroke-width:2"/><path d="M${xC},${bt + 64} V${TABLE - 10}" style="stroke:${THREAD};stroke-width:1.5"/><rect x="${xC - 14}" y="${TABLE - 10}" width="28" height="10" rx="2" style="fill:${DARK}"/>${f!.readB ? `<text class="bench-reading" x="${xC + 16}" y="${bt + 36}">${f!.readB}</text>` : ''}`;
  return `${stand}${a}${body}${lower}`;
}

/**
 * Adding forces: the springs take the load and bounce to their readings (the drawing's period); moved along the
 * ruler, the weights slide to their new place and the readings follow. Pulled down, the lower dynamometer is
 * drawn out slowly by hand, and the upper one takes on that pull as well.
 */
function forces(was: ForcesView | null, next: ForcesView, draw: (v: ForcesView) => void): Motion {
  const f = next;
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
      draw(done ? next : { ...rest, a: Math.max(0, a.value), b: Math.max(0, b.value), at: at.value });
    },
  };
}

/** The ruler's middle, m from its left end; the weights go by whole centimetres either way from it, short of the ends. */
const FORCES_MIDDLE = FORCES_RULER.length.value / 2;
const OFF_MAX = FORCES_MIDDLE - 0.01;
const clampOff = (x: number) => Math.max(-OFF_MAX, Math.min(OFF_MAX, Math.round(x * 100) / 100));
const live = {
  controls: () => [],
  // Moved along the ruler: both dynamometers answer at once; the next step writes them down.
  apply: (v: ForcesView, x: Readonly<Record<string, number>>): ForcesView => {
    if (x['off'] === undefined || v.hold !== 'two') return v;
    const at = FORCES_MIDDLE + clampOff(x['off']);
    const [left, right] = forcesShares(v.mass, at);
    const reading = (F: number) => {
      const d = forcesDivision(F);
      return [Math.round(F / d) * d, d] as const;
    };
    const [a, da] = reading(left);
    const [b, db] = reading(right);
    return { ...v, at, a, b, readA: formatMeasured('force', a, da, v.locale), readB: formatMeasured('force', b, db, v.locale) };
  },
  drag: (v: ForcesView, _knob: string, from: { readonly x: number }, to: { readonly x: number }): number => clampOff(v.at - FORCES_MIDDLE + (to.x - from.x) / FORCES_K),
  take: (c: { readonly type: string } & Record<string, unknown>, x: Readonly<Record<string, number>>) => (x['off'] !== undefined && c['again'] ? { ...c, at: FORCES_MIDDLE + clampOff(x['off']) } : c),
};

export const addingForcesScene = defineScene({ kind: 'forces', view, svg: forcesSvg, motion: (next, draw, prev) => (next.loaded ? forces(prev, next, draw) : null), live });
