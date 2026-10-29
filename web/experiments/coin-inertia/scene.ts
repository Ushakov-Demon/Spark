import { COIN_FRICTION } from '../../../src/experiments/coin-inertia/bench.js';
import { readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/** The coin on the card: 12 units to the centimetre; the glass's axis. */
const COIN_K = 1200;
const COIN_X = 400;
/**
 * Inertia, frame by frame: the card goes at its speed; slipping, the coin is dragged at μ·g until the card's edge
 * leaves it (t = l / v), then falls (g) — to the glass's bottom, or onto the rim and off it beside the glass. Drawn
 * smoothly, the coin rides with the card. A quick pull is played four times slower (a flick still looks like one:
 * 0.1 s on the screen); the fall after it at 0.4 of real time.
 */
/** How much slower the card's quick pulls are played. */
const COIN_SLOW = 4;

/**
 * Inertia: how far the card has gone (m; past 0.2 — taken away), how far the coin moved along it (m), how far it has
 * dropped below the card (m), its tilt (°), and the slow motion's label.
 */
type Coin = { readonly card: number; readonly x: number; readonly drop: number; readonly tilt: number; readonly slow?: string; readonly read?: string };
/** The coin, and what plays it. */
export type CoinView = { readonly coin: Coin; readonly coinRun?: { readonly v: number; readonly a: number; readonly exit: number; readonly slipped: boolean; readonly inGlass: boolean; readonly slow?: string } };

function view({ last, command, locale }: SceneContext): CoinView {
  const r = last ? readingsOf([last])[0]?.record : undefined;
  const done = command?.type === 'lab.coin' && r && r.value !== null;
  if (!done) return { coin: { card: 0, x: 0, drop: 0, tilt: 0 } };
  const slipped = r.inputs?.['slipped'] === 1;
  const inGlass = r.inputs?.['inGlass'] === 1;
  const v = r.inputs?.['speed'] ?? 0;
  const exit = r.inputs?.['time'] ?? 0;
  const read = `${locale === 'uk' ? 'зсув' : 'moved'} ${Math.round(r.value! * 1000)} ${locale === 'uk' ? 'мм' : 'mm'}`;
  const slow = slipped ? `${locale === 'uk' ? 'уповільнено' : 'slowed'} ×${COIN_SLOW}` : undefined;
  // The end: in the glass on its bottom; off the rim on the table beside it; on the card, 15 cm aside.
  const coin = inGlass ? { card: 1, x: r.value!, drop: 0.095, tilt: 0 } : slipped ? { card: 1, x: 0.055, drop: 0.1, tilt: 0 } : { card: 0.15, x: 0.15, drop: 0, tilt: 0 };
  return { coin: { ...coin, read }, coinRun: { v, a: COIN_FRICTION.value * 9.80665, exit, slipped, inGlass, ...(slow ? { slow } : {}) } };
}

/**
 * Inertia: a glass on the table (10 cm tall, 6.5 cm across the mouth), the postcard over it and the coin on the card
 * above the mouth — side on. The card goes off to the right; the coin rides with it, or stays and drops in, or hits
 * the rim and falls beside.
 */
function coinSvg(c: Coin): string {
  const k = COIN_K;
  const mouth = TABLE - 0.1 * k;
  const half = 0.0325 * k;
  const glass = `<path d="M${COIN_X - half - 3},${mouth} L${COIN_X - half + 4},${TABLE - 2} H${COIN_X + half - 4} L${COIN_X + half + 3},${mouth}" style="fill:rgba(200,225,245,0.25);stroke:#bfe3ff;stroke-width:3"/><path d="M${COIN_X - half + 6},${TABLE - 6} H${COIN_X + half - 6}" style="stroke:#bfe3ff;stroke-width:4"/>`;
  const cardY = mouth - 3;
  const cardX = COIN_X - 0.075 * k + c.card * k;
  const card = c.card < 0.2 ? `<rect x="${cardX}" y="${cardY}" width="${0.15 * k}" height="3" style="fill:#f4f1e8;stroke:#c9c2a8"/>` : '';
  // The coin: 2.6 cm across, 2 mm thick (drawn 4), its centre where it is.
  const cx = COIN_X + c.x * k;
  const cy = cardY - 2 + c.drop * k;
  const coin = `<g transform="rotate(${c.tilt} ${cx} ${cy})"><rect x="${cx - 0.013 * k}" y="${cy - 2}" width="${0.026 * k}" height="4" rx="1.5" style="fill:#d9b44a;stroke:#8a6a1f"/></g>`;
  const slow = c.slow ? `<text class="bench-label" x="${COIN_X}" y="${mouth - 70}" text-anchor="middle">${c.slow}</text>` : '';
  const read = c.read ? `<text class="bench-reading" x="${COIN_X}" y="${mouth - 40}" text-anchor="middle">${c.read}</text>` : '';
  return `${glass}${card}${coin}${slow}${read}`;
}

function coinRun(next: CoinView, run: NonNullable<CoinView['coinRun']>, draw: (v: CoinView) => void): Motion {
  const c = next.coin;
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

export const coinInertiaScene = defineScene({
  kind: 'coin',
  view,
  svg: (v: CoinView) => coinSvg(v.coin),
  motion: (next, draw) => (next.coin.read && next.coinRun ? coinRun(next, next.coinRun, draw) : null),
});
