import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { dynamometerSvg, rulerSvg, standSvg, THREAD, weightsSvg } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/** The carts on the table: 5 units to the centimetre; where they stand, touching through the spring. */
const CARTS_K = 500;
const CARTS_X = 440;
/** A light cart: a body on two wheels, its weights on top. */
function cartSvg(x: number, base: number, weights: number, colour: string): string {
  return `<rect x="${x - 25}" y="${base - 26}" width="50" height="18" rx="3" style="fill:${colour};stroke:#3a3f46"/><circle cx="${x - 14}" cy="${base - 5}" r="5" style="fill:#3a3f46"/><circle cx="${x + 14}" cy="${base - 5}" r="5" style="fill:#3a3f46"/>${weights ? weightsSvg(x, base - 26 - 9 * weights, weights, 18, 9) : ''}`;
}

/**
 * Carts: pushed apart — the weights on cart 2, how far each has gone (m), the burning thread (0…1), the paths read;
 * weighed — which cart hangs on the dynamometer, with its weights, and the reading.
 */
export type CartsView = { readonly mode: string; readonly weights: number; readonly x1: number; readonly x2: number; readonly flame?: number; readonly cart?: number; readonly read?: readonly string[]; readonly slow?: string; readonly moving?: boolean };

function view({ last, command, plan, locale }: SceneContext): CartsView {
  type Carts = { mode: 'push' | 'weigh'; weights: number; cart?: 1 | 2 };
  const cc = command?.type === 'lab.carts' ? (command as unknown as Carts) : undefined;
  const next = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.carts');
  const cmd = cc ?? (next?.kind === 'bench' ? (next.command as unknown as Carts) : { mode: 'push' as const, weights: 0 });
  const recs = last && cc ? readingsOf([last]).map((x) => x.record) : [];
  const cm = (x: number | null) => `${String(Math.round((x ?? 0) * 1000) / 10).replace('.', locale === 'uk' ? ',' : '.')} ${locale === 'uk' ? 'см' : 'cm'}`;
  if (cmd.mode === 'weigh') return { mode: 'weigh', weights: cmd.weights, x1: 0, x2: 0, cart: cmd.cart ?? 1, ...(recs[0] ? { read: [formatMeasured('force', recs[0].value, 0.1, locale)] } : {}) };
  const done = recs.length === 2;
  return { mode: 'push', weights: cmd.weights, x1: done ? recs[0]!.value ?? 0 : 0, x2: done ? recs[1]!.value ?? 0 : 0, ...(done ? { read: recs.map((x) => cm(x.value)), slow: `${locale === 'uk' ? 'уповільнено' : 'slowed'} ×3` } : {}) };
}

/**
 * Carts: pushed apart — the two carts on the table with the spring between them, held by a thread that burns, a
 * ruler along the table, the paths read; weighed — a cart hanging on the dynamometer from the stand.
 */
function cartsSvg(c: CartsView): string {
  const base = TABLE;
  if (c.mode === 'weigh') {
    const x = 470;
    const top = 40;
    const two = c.cart === 2;
    const hook = top + 3 + 80;
    const cart = `<path d="M${x},${hook} v18 M${x - 18},${hook + 34} L${x},${hook + 18} L${x + 18},${hook + 34}" style="fill:none;stroke:${THREAD};stroke-width:1.3"/>${cartSvg(x, hook + 60, two ? c.weights : 0, two ? '#5b8dd6' : '#d65b5b')}`;
    return `${standSvg(x - 110, x, top)}${dynamometerSvg(x, top + 3, false, c.read?.[0] ?? '')}${cart}`;
  }
  const x1 = CARTS_X - 30 - c.x1 * CARTS_K;
  const x2 = CARTS_X + 30 + c.x2 * CARTS_K;
  const together = c.x1 === 0 && c.x2 === 0;
  // The spring: squeezed between the carts until they part; then each keeps a little of it.
  const spring = together ? `<path d="M${x1 + 25},${base - 17} ${Array.from({ length: 6 }, (_, i) => `l1.7,${i % 2 ? 6 : -6}`).join(' ')}" style="fill:none;stroke:#8d949c;stroke-width:1.6"/>` : '';
  const thread = together && (c.flame ?? 0) < 1 ? `<path d="M${x1 + 20},${base - 22} H${x2 - 20}" style="stroke:${THREAD};stroke-width:1"/>` : '';
  const flame = c.flame !== undefined && c.flame > 0 && c.flame < 1 ? `<path d="M${CARTS_X},${base - 24} q-5,-8 0,-18 q5,10 0,18 Z" style="fill:#ffb347;opacity:${1 - c.flame}"/>` : '';
  // The ruler lies along the table behind the carts; red marks where they stood.
  const ruler = rulerSvg(CARTS_X - 150, base - 22, 60, false, 5);
  const marks = `<path d="M${CARTS_X - 30},${base - 24} v-8 M${CARTS_X + 30},${base - 24} v-8" style="stroke:#c0392b;stroke-width:2"/>`;
  const read = c.read ? `<text class="bench-reading" x="${x1}" y="${base - 60}" text-anchor="middle">${c.read[0]}</text><text class="bench-reading" x="${x2}" y="${base - 60 - 9 * c.weights}" text-anchor="middle">${c.read[1]}</text>` : '';
  const slow = c.slow && c.moving ? `<text class="bench-label" x="${CARTS_X}" y="${base - 110}" text-anchor="middle">${c.slow}</text>` : '';
  return `${ruler}${marks}${cartSvg(x1, base, 0, '#d65b5b')}${cartSvg(x2, base, c.weights, '#5b8dd6')}${spring}${thread}${flame}${read}${slow}`;
}

/** Carts: the thread burns, then both roll apart steadily for their 0.5 s, played three times slower. */
function cartsRun(next: CartsView, draw: (v: CartsView) => void): Motion | null {
  const c = next;
  if (c.mode !== 'push' || !c.read) return null;
  const burn = 0.5;
  const ride = 1.5;
  const clock = new Channel(0, burn + ride, { kind: 'steady', speed: 1 }, 1e-4);
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw(next);
      const T = clock.value;
      const { read: _r, ...rest } = c;
      if (T < burn) return draw({ ...rest, x1: 0, x2: 0, flame: T / burn });
      const k = (T - burn) / ride;
      draw({ ...rest, x1: c.x1 * k, x2: c.x2 * k, moving: true });
    },
  };
}

export const cartsMassScene = defineScene({ kind: 'carts', view, svg: cartsSvg, motion: cartsRun });
