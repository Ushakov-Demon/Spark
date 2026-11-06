import { DRAG_FPS, DRAG_START, DRAG_TRACK, dragBody, dragFall, type DragShape, framesText } from '../../../src/experiments/drag-form/bench.js';
import { t as tl } from '../../../src/knowledge/messages.js';
import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { DARK, PLASTICINE, STEEL } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { plunge, thud } from '../../sounds/index.js';
import { defineScene, type SceneContext } from '../types.js';

/** The aquarium: its water's surface, 8 units to the centimetre down from it; the marks at 5 and 25 cm. */
const DRAG_TOP = 62;
const DRAG_K = 800;
const DRAG_X = 508;

/** How much the ball flattens landing: hard through the air, hardly at all at the slow pace it has in water. */
const LANDED: Readonly<Record<'water' | 'air', number>> = { water: 0.25, air: 1 };
/** Flattened fully, it is so much lower and wider (about the same plasticine); how long that takes, s of the slowed clock. */
const FLAT = 0.42;
const WIDE = 0.28;
const SQUASH_TIME = 0.09;

/** The drag: the body played slowed DRAG_SLOW times, falling as the model has it; the frames counted between the marks. */
const DRAG_SLOW = 2;
/**
 * The drag: the plasticine body (its form) let go in the aquarium's water or in the air; `at` — how far it has
 * fallen from where it was let go (m); `count` — the frames counted between the marks so far; `read` — the result.
 */
export type DragView = { readonly shape: 'ball' | 'cube' | 'plate'; readonly medium: 'water' | 'air'; readonly at: number; readonly size: number; readonly count?: string; readonly read?: string; readonly slow?: string; readonly moving?: boolean; readonly air: string; /** The ball flattened where it landed, 0…1 (plasticine stays as it was hit). */ readonly squash?: number };

function view({ last, command, plan, locale }: SceneContext): DragView {
  const r = last ? readingsOf([last])[0]?.record : undefined;
  type Drag = { shape: DragShape; medium: 'water' | 'air' };
  const dc = command?.type === 'lab.drag' ? (command as unknown as Drag) : undefined;
  const next = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.drag');
  const cmd = dc ?? (next?.kind === 'bench' ? (next.command as unknown as Drag) : { shape: 'ball' as const, medium: 'water' as const });
  const frames = dc && r ? (r.inputs?.['frames'] ?? 0) : null;
  const air = tl(locale, 'drag-form-view-air');
  return { shape: cmd.shape, medium: cmd.medium, size: dragBody(cmd.shape).across, at: frames !== null ? 1 : 0, air, ...(frames !== null && cmd.shape === 'ball' ? { squash: LANDED[cmd.medium] } : {}), ...(frames !== null ? { count: String(frames), read: `${framesText(frames, locale)} ≈ ${formatMeasured('time', r!.value, 0.01, locale)}`, slow: `${tl(locale, 'drag-form-view-slow')} ×${DRAG_SLOW}` } : {}) };
}

/**
 * The drag: an aquarium on the table (water, or empty — the air), two marks on its glass 20 cm apart, the
 * plasticine body falling; a phone filming from the side, its count of frames between the marks.
 */
function dragSvg(d: DragView): string {
  const w = 100;
  const bottom = TABLE - 6;
  const x0 = DRAG_X - w / 2;
  const glass = `<rect x="${x0}" y="${DRAG_TOP - 22}" width="${w}" height="${bottom - DRAG_TOP + 22}" rx="3" style="fill:none;stroke:#9fb4c4;stroke-width:2.5"/><rect x="${x0 - 4}" y="${bottom}" width="${w + 8}" height="6" rx="2" style="fill:${DARK}"/>`;
  const water = d.medium === 'water' ? `<rect x="${x0 + 1.5}" y="${DRAG_TOP}" width="${w - 3}" height="${bottom - DRAG_TOP}" style="fill:rgba(90,160,220,0.32)"/><path d="M${x0 + 1.5},${DRAG_TOP} h${w - 3}" style="stroke:#5a9fd8;stroke-width:1.5"/>` : `<text class="bench-label" x="${DRAG_X}" y="${DRAG_TOP + 2}" text-anchor="middle">${d.air}</text>`;
  const m1 = DRAG_TOP + 0.05 * DRAG_K;
  const m2 = DRAG_TOP + 0.25 * DRAG_K;
  const marks = `<path d="M${x0 - 10},${m1} h${w + 20} M${x0 - 10},${m2} h${w + 20}" style="stroke:#c0392b;stroke-width:1.5;stroke-dasharray:5 3"/><text class="bench-label" x="${x0 - 14}" y="${m1 + 4}" text-anchor="end">0</text><text class="bench-label" x="${x0 - 14}" y="${m2 + 4}" text-anchor="end">20 см</text>`;
  const px = d.size * 100 * 8;
  const y = Math.min(DRAG_TOP + d.at * DRAG_K, bottom - (d.shape === 'plate' ? 2 : px / 2));
  const flat = d.squash ?? 0;
  const ry = (px / 2) * (1 - FLAT * flat);
  const body = d.shape === 'ball' ? `<ellipse cx="${DRAG_X}" cy="${flat ? bottom - ry : y}" rx="${(px / 2) * (1 + WIDE * flat)}" ry="${ry}" style="fill:${PLASTICINE};stroke:#8a3a12"/>` : d.shape === 'cube' ? `<rect x="${DRAG_X - px / 2}" y="${y - px / 2}" width="${px}" height="${px}" rx="1.5" style="fill:${PLASTICINE};stroke:#8a3a12"/>` : `<rect x="${DRAG_X - px / 2}" y="${y - 2}" width="${px}" height="4" rx="1" style="fill:${PLASTICINE};stroke:#8a3a12"/>`;
  // The phone on a stand beside the aquarium, its lens to the marks; the count of frames on its screen.
  const px0 = x0 + w + 14;
  const phone = `<rect x="${px0}" y="${m1 + 30}" width="34" height="62" rx="5" style="fill:#2b2f36"/><rect x="${px0 + 3}" y="${m1 + 36}" width="28" height="48" rx="2" style="fill:#cfe3f3"/><circle cx="${px0 + 17}" cy="${m1 + 33}" r="1.6" style="fill:#9aa"/><path d="M${px0 + 17},${m1 + 92} V${bottom + 6}" style="stroke:${STEEL};stroke-width:3"/>`;
  const count = d.count ? `<text x="${px0 + 17}" y="${m1 + 65}" text-anchor="middle" style="font:700 14px sans-serif;fill:#1d2a36">${d.count}</text>` : '';
  const read = d.read && !d.moving ? `<text class="bench-reading" x="${DRAG_X + 10}" y="${DRAG_TOP - 30}" text-anchor="middle">${d.read}</text>` : '';
  const slow = d.slow && d.moving ? `<text class="bench-label" x="${DRAG_X}" y="${DRAG_TOP - 30}" text-anchor="middle">${d.slow}</text>` : '';
  return `${water}${marks}${body}${glass}${phone}${count}${read}${slow}`;
}

function dragRun(next: DragView, draw: (v: DragView) => void): Motion | null {
  const d = next;
  if (!d.read) return null;
  const f = dragFall(d.shape, d.medium);
  // To the aquarium's floor (where the body stops), and a moment more for the ball to flatten.
  const px = d.size * 100 * 8;
  const floor = (TABLE - 6 - (d.shape === 'plate' ? 2 : px / 2) - DRAG_TOP) / DRAG_K;
  const end = f.timeTo(floor);
  const flatten = d.squash ?? 0;
  const t0 = f.timeTo(DRAG_START);
  const t1 = f.timeTo(DRAG_START + DRAG_TRACK);
  const clock = new Channel(0, end + (flatten ? SQUASH_TIME : 0), { kind: 'steady', speed: 1 / DRAG_SLOW }, 1e-5);
  const { read: _r, count: _c, squash: _s, ...rest } = d;
  // Let go in the water it goes under at once; through the air it is heard when it lands.
  let entered = false;
  let landed = false;
  return {
    channels: [clock],
    frame: (done) => {
      if (!entered && d.medium === 'water') plunge(d.shape === 'plate' ? 1.3 : 1);
      entered = true;
      const t = clock.value;
      if (!landed && (done || t >= end)) {
        landed = true;
        if (d.medium === 'air') thud();
      }
      if (done) return draw(next);
      const frames = t < t0 ? 0 : Math.floor((Math.min(t, t1) - t0) * DRAG_FPS);
      draw({ ...rest, at: f.at(Math.min(t, end)), moving: true, ...(t >= t0 ? { count: String(frames) } : {}), ...(t > end && flatten ? { squash: (flatten * (t - end)) / SQUASH_TIME } : {}) });
    },
  };
}

export const dragFormScene = defineScene({ kind: 'drag', view, svg: dragSvg, motion: dragRun });
