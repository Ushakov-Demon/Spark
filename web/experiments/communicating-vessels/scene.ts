import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { DARK } from '../../graphics/scene/kit.js';
import { defineScene, type SceneContext } from '../types.js';

/** The U-tube: water poured (or not yet), the oil's and the water's columns above their boundary, m; what the ruler read. */
export type UtubeView = { readonly water: boolean; readonly oil: number; readonly over: number; readonly read?: string };

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
  const bottom = TABLE - 40;
  const top = TABLE - 300;
  // Water alone fills each arm to the same level; oil pushes the boundary down in the left arm.
  const base = bottom - 90;
  const oil = u?.oil ?? 0;
  const over = u?.over ?? 0;
  // The water's volume stays: the boundary on the left goes down as far as the water on the right goes up, and the
  // right level is `over` above the boundary — so each moves by half of it.
  const b = oil > 0 ? base + (over * k) / 2 : base;
  const rightTop = oil > 0 ? b - over * k : base;
  const oilTop = b - oil * k;
  const glass = (x: number) => `<rect x="${x - w / 2}" y="${top}" width="${w}" height="${bottom - top}" style="fill:rgba(220,235,250,0.3);stroke:#8fb8dd;stroke-width:1.5"/>`;
  const bend = `<path d="M${lx - w / 2},${bottom} q0,30 ${(rx - lx) / 2 + w / 2},30 q${(rx - lx) / 2 + w / 2},0 ${(rx - lx) / 2 + w / 2},-30" style="fill:none;stroke:#8fb8dd;stroke-width:1.5"/>`;
  const water = u?.water
    ? `<rect x="${lx - w / 2 + 2}" y="${b}" width="${w - 4}" height="${bottom - b}" style="fill:#3b82c4"/><rect x="${rx - w / 2 + 2}" y="${rightTop}" width="${w - 4}" height="${bottom - rightTop}" style="fill:#3b82c4"/><path d="M${lx},${bottom} q0,22 ${(rx - lx) / 2},22 q${(rx - lx) / 2},0 ${(rx - lx) / 2},-22" style="fill:none;stroke:#3b82c4;stroke-width:${w - 4}"/>`
    : '';
  const oilCol = oil > 0 ? `<rect x="${lx - w / 2 + 2}" y="${oilTop}" width="${w - 4}" height="${b - oilTop}" style="fill:#e8be3c"/>` : '';
  const stand = `<rect x="${(lx + rx) / 2 - 50}" y="${TABLE - 8}" width="100" height="8" rx="2" style="fill:${DARK}"/><rect x="${(lx + rx) / 2 - 3}" y="${top - 10}" width="6" height="${TABLE - top + 2}" style="fill:#9aa3ad"/>`;
  const ticks = Array.from({ length: 31 }, (_, i) => `<path d="M${rx + 22},${bottom - i * 8} h${i % 5 === 0 ? 10 : 5}" style="stroke:#5b4a2a;stroke-width:0.8"/>`).join('');
  const ruler = `<rect x="${rx + 18}" y="${bottom - 248}" width="18" height="252" style="fill:#f1e3b0;stroke:#a8945a"/>${ticks}`;
  const marks = oil > 0
    ? `<path class="bench-mark" d="M${lx - 30},${b} H${rx + 18}"/><path class="bench-mark" d="M${lx - 30},${oilTop} H${lx + 10} M${rx - 10},${rightTop} H${rx + 18}"/><text class="bench-reading" x="${rx + 42}" y="${(b + oilTop) / 2 + 4}">${u?.read ?? ''}</text>`
    : u?.water && u.read ? `<path class="bench-mark" d="M${lx - 20},${base} H${rx + 18}"/><text class="bench-reading" x="${rx + 42}" y="${base + 4}">${u.read}</text>` : '';
  return `${stand}${ruler}${water}${oilCol}${glass(lx)}${glass(rx)}${bend}${marks}`;
}

export const communicatingVesselsScene = defineScene({ kind: 'utube', view, svg: utubeSvg, motion: () => null });
