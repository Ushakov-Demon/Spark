import { readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/** The fountain: how high the water in the bottle stands over the nozzle (m), how high the jet goes (m), what the ruler read. */
export type FountainView = { readonly head: number; readonly jet: number; readonly read?: string };

/** 300 px to the metre; the nozzle's tip stands over the basin. */
const K = 300;
const NOZZLE_X = 475;
const NOZZLE_Y = TABLE - 90;
const BOTTLE_X = 365;
const RULER_X = 525;

function view({ last, command, locale }: SceneContext): FountainView {
  const fc = command?.type === 'lab.fountain' ? (command as unknown as { head: number }) : undefined;
  const r = last && fc ? readingsOf([last])[0]?.record : undefined;
  if (!fc || !r) return { head: 0, jet: 0 };
  const cm = Math.round((r.value ?? 0) * 100);
  return { head: fc.head, jet: r.value ?? 0, ...(fc.head > 0 ? { read: `h = ${cm} ${locale === 'uk' ? 'см' : 'cm'}` } : {}) };
}

/**
 * The bottle (bottom cut off, neck down) on its stand, its water's surface `head` over the nozzle; the tube from its
 * neck down, along the table and up to the nozzle in the basin; the jet with a few drops at its top; a ruler from the
 * nozzle up (a centimetre — 3 px), and a dashed line from the bottle's water across to it — to compare.
 */
function svg(v: FountainView): string {
  const level = NOZZLE_Y - v.head * K;
  const neck = level + 46;
  const w = 46;
  const bottle =
    `<path d="M${BOTTLE_X - w / 2},${level - 18} V${neck - 16} Q${BOTTLE_X - w / 2},${neck - 6} ${BOTTLE_X - 7},${neck} V${neck + 8} H${BOTTLE_X + 7} V${neck} Q${BOTTLE_X + w / 2},${neck - 6} ${BOTTLE_X + w / 2},${neck - 16} V${level - 18}" style="fill:rgba(220,235,250,0.15);stroke:#8fb8dd;stroke-width:2"/>` +
    `<path d="M${BOTTLE_X - w / 2 + 1},${level} V${neck - 16} Q${BOTTLE_X - w / 2 + 1},${neck - 6} ${BOTTLE_X - 6},${neck} V${neck + 8} H${BOTTLE_X + 6} V${neck} Q${BOTTLE_X + w / 2 - 1},${neck - 6} ${BOTTLE_X + w / 2 - 1},${neck - 16} V${level} Z" style="fill:rgba(120,170,230,0.55)"/>`;
  const stand = `<rect x="${BOTTLE_X - 80}" y="${TABLE - 6}" width="70" height="6" rx="2" style="fill:#5d6670"/><rect x="${BOTTLE_X - 50}" y="40" width="5" height="${TABLE - 46}" style="fill:#8d949c"/><rect x="${BOTTLE_X - 50}" y="${level + 4}" width="${50 - w / 2 + 2}" height="5" style="fill:#5d6670"/>`;
  const tube = `M${BOTTLE_X},${neck + 8} V${TABLE - 6} H${NOZZLE_X} V${NOZZLE_Y + 6}`;
  // The water in the tube: all of it while the bottle is over the nozzle; under it — up to the bottle's level only.
  const filled = v.head > 0 ? 1 : 0;
  const tubeSvg = `<path d="${tube}" style="fill:none;stroke:#c9d6e2;stroke-width:7;stroke-linejoin:round"/><path d="${tube}" style="fill:none;stroke:rgba(120,170,230,${filled ? 0.9 : 0.75});stroke-width:4;stroke-linejoin:round"/>` + (filled ? '' : `<rect x="${NOZZLE_X - 3}" y="${NOZZLE_Y + 2}" width="6" height="${Math.max(0, level - NOZZLE_Y - 2)}" style="fill:#c9d6e2"/>`);
  const basin = `<path d="M${NOZZLE_X - 50},${TABLE - 34} L${NOZZLE_X - 44},${TABLE} H${NOZZLE_X + 44} L${NOZZLE_X + 50},${TABLE - 34}" style="fill:rgba(220,235,250,0.2);stroke:#8fb8dd;stroke-width:2"/><rect x="${NOZZLE_X - 45}" y="${TABLE - 14}" width="90" height="13" style="fill:rgba(120,170,230,0.5)"/>`;
  const nozzle = `<path d="M${NOZZLE_X - 4},${NOZZLE_Y + 14} V${NOZZLE_Y + 4} L${NOZZLE_X - 1.5},${NOZZLE_Y} H${NOZZLE_X + 1.5} L${NOZZLE_X + 4},${NOZZLE_Y + 4} V${NOZZLE_Y + 14}" style="fill:rgba(255,255,255,0.3);stroke:#dfe9f2;stroke-width:1.2"/>`;
  const top = NOZZLE_Y - v.jet * K;
  const jet = v.jet > 0.002 ? `<path d="M${NOZZLE_X},${NOZZLE_Y} V${top}" style="stroke:rgba(140,190,240,0.95);stroke-width:2.5;stroke-linecap:round"/>` + [-7, -3, 4, 8].map((dx, i) => `<circle cx="${NOZZLE_X + dx}" cy="${top + 4 + i * 5}" r="1.8" style="fill:rgba(140,190,240,0.9)"/>`).join('') : '';
  const marks = Array.from({ length: 51 }, (_, i) => `<path d="M${RULER_X},${NOZZLE_Y - i * 3} h${i % 10 === 0 ? 10 : i % 5 === 0 ? 7 : 4}" style="stroke:#3d3d3d;stroke-width:0.8"/>${i % 10 === 0 ? `<text x="${RULER_X + 13}" y="${NOZZLE_Y - i * 3 + 3}" style="font:600 9px system-ui,sans-serif;fill:#3d3d3d">${i}</text>` : ''}`).join('');
  const ruler = `<rect x="${RULER_X - 2}" y="${NOZZLE_Y - 156}" width="30" height="160" style="fill:#f1e3b8;stroke:#b39b5c"/>${marks}`;
  const dash = `<path d="M${BOTTLE_X + w / 2 + 4},${level} H${RULER_X - 4}" style="stroke:#efe9d2;stroke-width:1;stroke-dasharray:4 4;opacity:0.8"/>`;
  const read = v.read ? `<text class="bench-reading" x="${RULER_X + 36}" y="${top + 4}">${v.read}</text>` : '';
  return `${stand}${basin}${tubeSvg}${bottle}${nozzle}${jet}${ruler}${dash}${read}`;
}

/** The bottle goes to its new height and the jet follows it (about a second); the reading comes at the end. */
function motion(next: FountainView, draw: (v: FountainView) => void, prev: FountainView | null): Motion | null {
  const from = prev ?? { head: 0, jet: 0 };
  if (from.head === next.head && from.jet === next.jet) return null;
  const clock = new Channel(0, 1.2, { kind: 'steady', speed: 1 }, 1e-6);
  const ease = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw(next);
      const k = ease(clock.value / 0.9);
      // (The jet lags a little behind the bottle: the water in the tube has to speed up.)
      const j = ease((clock.value - 0.2) / 1);
      draw({ head: from.head + (next.head - from.head) * k, jet: from.jet + (next.jet - from.jet) * j });
    },
  };
}

export const fountainModelScene = defineScene({ kind: 'fountain', view, svg, motion });
