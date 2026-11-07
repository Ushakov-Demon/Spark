import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { DARK, uManometerSvg } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/** The U-tube: water poured (or not yet), the oil's and the water's columns above their boundary, m; what the ruler read. */
export type UtubeView = { readonly water: boolean; readonly oil: number; readonly over: number; readonly read?: string; /** While it is poured: how much of the water is in, 0…1 (from the bend's bottom up both arms). */ readonly fill?: number; /** Being poured from a measuring cylinder into this arm: the stream's head, 0 (at the arm's top) … 1 (down on the liquid). */ readonly pour?: { readonly arm: 'left' | 'right'; readonly drop: number } };

function view({ last, command, locale }: SceneContext): UtubeView {
  const uc = command?.type === 'lab.utube' ? (command as unknown as { poured: number }) : undefined;
  const recs = last && uc ? readingsOf([last]).map((x) => x.record) : [];
  const hO = recs.find((x) => x.inputs?.['which'] === 1)?.value ?? 0;
  const hW = recs.find((x) => x.inputs?.['which'] === 0)?.value ?? 0;
  const cmT = (m: number) => formatMeasured('length', m, 0.001, locale);
  const read = !uc ? undefined : uc.poured === 0 ? `Δh = ${cmT(recs[0]?.value ?? 0)}` : `${cmT(hO)} / ${cmT(hW)}`;
  return { water: !!uc, oil: hO, over: hW, ...(read ? { read } : {}) };
}

/**
 * A glass U-tube on a stand (8 px to the centimetre): water in its bend and arms; oil floating in the left arm as a
 * column `oil` high; the water in the right arm stands `over` above the boundary's level. A ruler beside it.
 */
function utubeSvg(u: UtubeView): string {
  const k = 800;
  const lx = 390;
  const rx = 470;
  const w = 16;
  // (The bend, as wide as the arms are apart, stays clear of the stand's foot.)
  const bottom = TABLE - 58;
  // (Room above the arms for the measuring cylinder tipped over them.)
  const top = TABLE - 262;
  // Water alone fills each arm to the same level; oil pushes the boundary down in the left arm.
  const base = bottom - 90;
  const oil = u?.oil ?? 0;
  const over = u?.over ?? 0;
  // The water's volume stays: the boundary on the left goes down as far as the water on the right goes up, and the
  // right level is `over` above the boundary — so each moves by half of it.
  const b = oil > 0 ? base + (over * k) / 2 : base;
  const rightTop = oil > 0 ? b - over * k : base;
  const oilTop = b - oil * k;
  // The tube all one piece of glass, the water one run in it from the boundary on the left to its level on the right.
  const pouring = u?.water && u.fill !== undefined && u.fill < 1;
  const tube = uManometerSvg(lx, rx - lx, top, bottom, u?.water && !pouring ? b : NaN, rightTop, w - 4);
  // Being poured: the water as much of the whole tube's run as is in, both ways from the bend's bottom.
  const r = (rx - lx) / 2;
  const run = 2 * (bottom - top) + Math.PI * r;
  const half = (Math.PI * r) / 2 + (bottom - base);
  const s = half * (u?.fill ?? 1);
  const pouredWater = pouring ? `<path d="M${lx},${top} V${bottom} a${r},${r} 0 0 0 ${rx - lx},0 V${top}" style="fill:none;stroke:#3b82c4;stroke-width:${w - 4};stroke-dasharray:0 ${run / 2 - s} ${2 * s} ${run}"/>` : '';
  const oilCol = oil > 0 ? `<path d="M${lx},${oilTop} V${b}" style="stroke:#e8be3c;stroke-width:${w - 4}"/>` : '';
  const stand = `<rect x="${(lx + rx) / 2 - 50}" y="${TABLE - 8}" width="100" height="8" rx="2" style="fill:${DARK}"/><rect x="${(lx + rx) / 2 - 3}" y="${top - 10}" width="6" height="${TABLE - top + 2}" style="fill:#9aa3ad"/>`;
  const ticks = Array.from({ length: 26 }, (_, i) => `<path d="M${rx + 22},${bottom - i * 8} h${i % 5 === 0 ? 10 : 5}" style="stroke:#5b4a2a;stroke-width:0.8"/>`).join('');
  const ruler = `<rect x="${rx + 18}" y="${bottom - 204}" width="18" height="208" style="fill:#f1e3b0;stroke:#a8945a"/>${ticks}`;
  const marks = oil > 0
    ? `<path class="bench-mark" d="M${lx - 30},${b} H${rx + 18}"/><path class="bench-mark" d="M${lx - 30},${oilTop} H${lx + 10} M${rx - 10},${rightTop} H${rx + 18}"/><text class="bench-reading" x="${rx + 42}" y="${(b + oilTop) / 2 + 4}">${u?.read ?? ''}</text>`
    : u?.water && u.read ? `<path class="bench-mark" d="M${lx - 20},${base} H${rx + 18}"/><text class="bench-reading" x="${rx + 42}" y="${base + 4}">${u.read}</text>` : '';
  // The measuring cylinder tipped over the arm being poured into, its stream falling down the arm onto the liquid in it.
  const pourSvg = (): string => {
    const p = u?.pour;
    if (!p) return '';
    const x = p.arm === 'right' ? rx : lx;
    const oily = p.arm === 'left';
    // Where the liquid in that arm is now: the oil's top or the boundary on the left; on the right, the water's level
    // (while it is filling — still in the bend at first).
    const level = oily ? (oil > 0 ? oilTop : b) : pouring ? (s > (Math.PI * r) / 2 ? bottom - (s - (Math.PI * r) / 2) : bottom) : rightTop;
    // (Straight down the arm, as far as its bend: from there the water runs round it.)
    const lip = top - 8;
    const end = lip + (level - lip) * Math.min(1, p.drop);
    const colour = oily ? '#e8be3c' : '#3b82c4';
    const side = p.arm === 'right' ? 1 : -1;
    const cylinder = `<g transform="rotate(${-76 * side} ${x} ${lip})"><rect x="${x - 6}" y="${lip - 46}" width="12" height="46" rx="2" style="fill:rgba(220,235,250,0.35);stroke:#8fb8dd;stroke-width:1.5"/><rect x="${x - 5}" y="${lip - 17}" width="10" height="16" style="fill:${colour}"/></g>`;
    return `<path d="M${x},${lip} V${end}" style="stroke:${colour};stroke-width:3;stroke-linecap:round"/>${cylinder}`;
  };
  return `${stand}${ruler}${tube}${pouredWater}${oilCol}${pourSvg()}${pouring || u?.pour ? '' : marks}`;
}

/**
 * Pouring, smoothly, from a measuring cylinder tipped over one arm: the water down the right arm — it fills the bend and
 * rises in both arms together (2.4 s); the oil down the left one — its column grows, pressing the boundary down and the
 * water on the right up (2 s). The reading at the end.
 */
function utubeRun(next: UtubeView, draw: (v: UtubeView) => void, prev: UtubeView | null): Motion | null {
  if (!next.read) return null;
  const water = !prev?.water;
  const clock = new Channel(0, 1, { kind: 'steady', speed: water ? 1 / 2.4 : 1 / 2 }, 1e-4);
  const { read: _r, ...still } = next;
  void _r;
  const from = prev ?? { ...next, oil: 0, over: 0 };
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw(next);
      const u = Number.isFinite(clock.value) ? clock.value : 0;
      // The stream first falls the length of the arm (a fifth of the time), then the liquid comes up; the last tenth — the stream stops.
      const drop = Math.min(1, u / 0.2);
      const k = u < 0.2 ? 0 : (u - 0.2) / 0.8;
      const g = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      const pour = u < 0.92 ? { pour: { arm: water ? ('right' as const) : ('left' as const), drop } } : {};
      if (water) return draw({ ...still, fill: g, ...pour });
      draw({ ...still, oil: from.oil + (next.oil - from.oil) * g, over: from.over + (next.over - from.over) * g, ...pour });
    },
  };
}

export const communicatingVesselsScene = defineScene({ kind: 'utube', view, svg: utubeSvg, motion: utubeRun });
