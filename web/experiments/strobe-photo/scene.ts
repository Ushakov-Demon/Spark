import { STROBE_SCALE, type StrobePhoto, strobePositions } from '../../../src/experiments/strobe-photo/bench.js';
import { readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/**
 * A stroboscopic photo: which one, the ball's places on it (mm on the photo, from the first image), how many images
 * the flashes have left so far (a fraction — the flash fading), and the gaps once measured (their labels).
 */
export type StrobeView = { readonly photo: string; readonly at: readonly number[]; readonly shown: number; readonly gaps?: readonly string[] };

function view({ last, command, plan, locale }: SceneContext): StrobeView {
  const sc = command?.type === 'lab.strobe' ? (command as unknown as { photo: StrobePhoto }) : undefined;
  const next = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.strobe');
  const photo = sc?.photo ?? (next?.kind === 'bench' ? (next.command as unknown as { photo: StrobePhoto }).photo : 'table');
  const at = strobePositions(photo).map((x) => (x * 1000) / STROBE_SCALE);
  const recs = last && sc ? readingsOf([last]).map((x) => x.record) : [];
  return { photo, at, shown: sc ? at.length : 0, ...(recs.length ? { gaps: recs.map((x) => `${Math.round((x.value ?? 0) * 1000)} ${locale === 'uk' ? 'мм' : 'mm'}`) } : {}) };
}

/**
 * A stroboscopic photo propped on the table: dark, with the table's edge or the sloping groove, the ball's images
 * one per flash, a millimetre ruler along them and, measured, the gaps over brackets. A photo is drawn to fill the
 * print (the table's 216 mm smaller, the groove's 59 mm larger), its ruler drawn to the same scale.
 */
function strobeSvg(st: StrobeView): string {
  if (!st) return '';
  const left = 300;
  const right = 610;
  const top = 110;
  const bottom = TABLE - 14;
  const span = Math.max(1, st.at.at(-1) ?? 1);
  const k = (right - left - 50) / span;
  const groove = st.photo === 'groove';
  // The track: the table's edge, or the groove sloping down to the right as in lab work 1 (raised 10 cm over 1.2 m:
  // the ruler along the images is all but along it).
  const x0 = left + 24;
  const y0 = bottom - 80;
  const slope = groove ? 0.1 / 1.2 : 0;
  const P = (mm: number) => ({ x: x0 + mm * k, y: y0 + mm * k * slope });
  const end = P(Math.min(span + 12, (right - 8 - x0) / k));
  const print = `<rect x="${left}" y="${top}" width="${right - left}" height="${bottom - top}" rx="3" style="fill:#14181d;stroke:#e9e4d4;stroke-width:5"/><text class="bench-label" x="${right - 10}" y="${bottom - 8}" text-anchor="end" style="fill:#e9e4d4">1 : 5</text>`;
  const track = `<path d="M${x0 - 12},${y0 + 7 - 12 * slope} L${end.x},${end.y + 7}" style="stroke:#6b6f75;stroke-width:3"/>`;
  const r = groove ? 9 : 6;
  const imgs = st.at.map((mm, i) => {
    const o = Math.max(0, Math.min(1, st.shown - i));
    if (o <= 0) return '';
    const p = P(mm);
    return `<circle cx="${p.x}" cy="${p.y}" r="${r}" style="fill:rgba(240,240,232,${0.25 + 0.6 * o});stroke:rgba(255,255,255,${o})"/>`;
  }).join('');
  // A flash: the print lights up for a moment as each image is taken.
  const flash = st.shown < st.at.length && st.shown % 1 > 0 && st.shown % 1 < 0.3 ? `<rect x="${left}" y="${top}" width="${right - left}" height="${bottom - top}" style="fill:rgba(255,255,255,${0.35 * (1 - (st.shown % 1) / 0.3)})"/>` : '';
  // The ruler along the images, and the gaps measured.
  const ry = P(span).y + 26;
  const ticks = Array.from({ length: Math.floor(span) + 1 }, (_, mm) => (k * mm >= 3 || mm % 5 === 0 ? `<path d="M${x0 + mm * k},${ry} v${mm % 10 === 0 ? 7 : mm % 5 === 0 ? 5 : 3}" style="stroke:#3a3f46"/>` : '')).join('');
  const ruler = st.gaps ? `<rect x="${x0 - 6}" y="${ry - 2}" width="${span * k + 12}" height="16" rx="2" style="fill:#f1e7c8;stroke:#a88a4a"/>${ticks}` : '';
  const gaps = st.gaps
    ? st.at.slice(1).map((mm, i) => {
        const a = P(st.at[i]!);
        const b = P(mm);
        const yb = Math.min(a.y, b.y) - r - 10;
        return `<path d="M${a.x},${yb + 4} V${yb} H${b.x} V${yb + 4}" style="fill:none;stroke:#ffd166;stroke-width:1.3"/><text class="bench-reading" x="${(a.x + b.x) / 2}" y="${yb - 4}" text-anchor="middle" style="font-size:10px">${st.gaps![i]}</text>`;
      }).join('')
    : '';
  return `${print}${track}${imgs}${flash}${ruler}${gaps}`;
}

/** A stroboscopic photo: the flashes leave the ball's images one by one (four a second, played at half that), then the ruler is put to it. */
function strobeRun(next: StrobeView, draw: (v: StrobeView) => void): Motion | null {
  const st = next;
  if (!st.gaps) return null;
  const n = st.at.length;
  const k = new Channel(0, n + 0.6, { kind: 'steady', speed: 2 }, 0.001);
  return {
    channels: [k],
    frame: (done) => {
      if (done || k.value >= n + 0.5) return draw(next);
      const { gaps: _g, ...rest } = st;
      draw({ ...rest, shown: k.value });
    },
  };
}

export const strobePhotoScene = defineScene({ kind: 'strobe', view, svg: strobeSvg, motion: strobeRun });
