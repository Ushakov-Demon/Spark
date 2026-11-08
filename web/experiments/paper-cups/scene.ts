import type { CupWay } from '../../../src/experiments/paper-cups/bench.js';
import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { t } from '../../../src/knowledge/messages.js';
import { NUMBER_LOCALE } from '../../../src/knowledge/i18n.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { forceGaugeSvg, WOOD, WOOD_EDGE } from '../../graphics/scene/kit.js';
import { professorSvg } from '../../graphics/professor/index.js';
import { Channel, type Motion } from '../../motion.js';
import { once } from '../../sounds/events.js';
import { defineScene, type SceneContext } from '../types.js';

/**
 * The cups: one pressed by the force gauge (standing or on its side, `squash` 0…1 — how far it has given; `gave` —
 * it buckled); the Professor on the floor scales; or a board on the cups (standing or on their sides, so many along)
 * with the Professor on it — in the middle or at the end, stepping on (`on` 0…1), the cups crushed or not; what was
 * read.
 */
export type CupsView = {
  readonly stage: 'press' | 'weigh' | 'stand';
  readonly way: CupWay;
  readonly gave: boolean;
  readonly squash: number;
  readonly cups: number;
  readonly end: boolean;
  readonly holds: boolean;
  readonly on: number;
  readonly display: string;
  readonly read?: string;
  /** The Professor is not drawn to the cups' scale: said so. */
  readonly note?: string;
};

function view({ last, command, plan, locale }: SceneContext): CupsView {
  type Cmd = { step: 'press' | 'weigh' | 'stand'; way?: CupWay; at?: 'middle' | 'end'; cups?: number };
  const c = command?.type === 'lab.cups' ? (command as unknown as Cmd) : undefined;
  const all = plan.map((s) => (s.kind === 'bench' && s.command.type === 'lab.cups' ? (s.command as unknown as Cmd) : undefined));
  const cups = c?.cups ?? all.find((x) => x?.cups)?.cups ?? 8;
  const r = last && c ? readingsOf([last])[0]?.record : undefined;
  const base = { way: c?.way ?? 'upright', gave: false, squash: 0, cups, end: false, holds: true, on: 1, display: '' } as const;
  if (!c || c.step === 'press') {
    const F = r ? formatMeasured('force', r.value, r.inputs?.['division'] ?? 0.1, locale) : '';
    return { ...base, stage: 'press', ...(r ? { gave: true, squash: 1, display: F, read: `F_max = ${F}` } : {}) };
  }
  if (c.step === 'weigh') {
    const m = r ? `${new Intl.NumberFormat(NUMBER_LOCALE[locale], { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(r.value ?? 0)} ${t(locale, 'unit-sym-kg')}` : '';
    return { ...base, stage: 'weigh', display: m, ...(r ? { read: `m = ${m}` } : {}) };
  }
  const holds = r?.value === 1;
  return { ...base, stage: 'stand', end: c.at === 'end', holds, squash: holds ? 0 : 1, note: t(locale, 'paper-cups-scene-scale') };
}

const PAPER = '#f4efe2';
const PAPER_EDGE = '#9c8f74';
const STRIPE = '#d9534f';
/** A paper cup upside down (its rim on the floor) at x, its rim `foot`: `w` across the rim, `h` tall; squashed (0…1) it is lower, its wall folded. */
function cupUpSvg(x: number, foot: number, w: number, h: number, squash: number): string {
  const hh = h * (1 - 0.6 * squash);
  const top = w * 0.68;
  const fold = squash > 0.05 ? ` l${-w * 0.08 * squash},${-hh * 0.25} l${w * 0.1 * squash},${-hh * 0.25}` : '';
  const foldR = squash > 0.05 ? ` l${w * 0.08 * squash},${hh * 0.25} l${-w * 0.1 * squash},${hh * 0.25}` : '';
  return `<path d="M${x - w / 2},${foot}${fold} L${x - top / 2},${foot - hh} H${x + top / 2}${foldR} L${x + w / 2},${foot} Z" style="fill:${PAPER};stroke:${PAPER_EDGE};stroke-width:1"/><path d="M${x - w * 0.44},${foot - hh * 0.35} H${x + w * 0.44}" style="stroke:${STRIPE};stroke-width:${Math.max(1, h * 0.08)}"/>`;
}
/** A cup lying on its side at x, on `foot`: `w` its rim (now its height), `h` its length; flattened (0…1). */
function cupSideSvg(x: number, foot: number, w: number, h: number, squash: number): string {
  const hh = w * (1 - 0.7 * squash);
  return `<path d="M${x - h / 2},${foot} V${foot - hh} L${x + h / 2},${foot - hh * 0.84} V${foot - hh * 0.16} Z" style="fill:${PAPER};stroke:${PAPER_EDGE};stroke-width:1"/><ellipse cx="${x - h / 2}" cy="${foot - hh / 2}" rx="${Math.max(1.5, w * 0.12)}" ry="${hh / 2}" style="fill:#e8e0cc;stroke:${PAPER_EDGE};stroke-width:1"/>`;
}
const cupHeight = (way: CupWay, w: number, h: number, squash: number) => (way === 'upright' ? h * (1 - 0.6 * squash) : w * (1 - 0.7 * squash));

/** The Professor standing with his feet at (x, foot), `tall` px high; his mood. */
function professorAt(x: number, foot: number, tall: number, mood: 'happy' | 'surprised' | 'neutral'): string {
  const s = tall / 260;
  return professorSvg(mood, 200 * s).replace('<svg class="prof-svg"', `<svg class="prof-svg" x="${x - 100 * s}" y="${foot - 300 * s}"`);
}

/** The Professor's height drawn, px: he stands on the cups — not to their scale (a note says so). */
const PROF_TALL = 140;

function svg(v: CupsView): string {
  if (v.stage === 'press') {
    // One cup big, on the table; a plate on it pushed down by the force gauge's rod.
    const x = 430;
    const w = 72;
    const h = 82;
    const cup = v.way === 'upright' ? cupUpSvg(x, TABLE, w, h, v.squash) : cupSideSvg(x, TABLE, w, h, v.squash);
    const top = TABLE - cupHeight(v.way, w, h, v.squash);
    const gaugeY = top - 6 - 30 - 86;
    const plate = `<rect x="${x - 50}" y="${top - 6}" width="100" height="6" rx="1" style="fill:#9aa3ab;stroke:#59636e"/><path d="M${x},${top - 6} V${top - 36}" style="stroke:#59636e;stroke-width:4"/>`;
    const read = v.read ? `<text class="bench-reading" x="596" y="40" text-anchor="end">${v.read}</text>` : '';
    return `${cup}${plate}${forceGaugeSvg(x, gaugeY, v.display)}${read}`;
  }
  if (v.stage === 'weigh') {
    const x = 430;
    const scales = `<rect x="${x - 40}" y="${TABLE - 9}" width="80" height="9" rx="3" style="fill:#dfe3e8;stroke:#8a96a3"/><rect x="${x - 14}" y="${TABLE - 7}" width="28" height="5" rx="1" style="fill:#c9d8b6"/>`;
    const read = v.read ? `<text class="bench-reading" x="596" y="40" text-anchor="end">${v.read}</text>` : '';
    return `${scales}${professorAt(x, TABLE - 9 - (1 - v.on) * 40, PROF_TALL, 'neutral')}${read}`;
  }
  // The board on the cups: two rows (the near one seen), so many along; drawn to fit.
  const cols = Math.ceil(v.cups / 2);
  const shown = Math.min(cols, 24);
  const pitch = Math.min(40, 260 / shown);
  const w = pitch * 0.86;
  const h = w * 1.1;
  const x0 = 430 - ((shown - 1) * pitch) / 2;
  const ch = cupHeight(v.way, w, v.way === 'upright' ? h : w * 1.15, v.squash);
  const cupsSvg = Array.from({ length: shown }, (_, i) => (v.way === 'upright' ? cupUpSvg(x0 + i * pitch, TABLE, w, h, v.squash) : cupSideSvg(x0 + i * pitch, TABLE, w, w * 1.15, v.squash))).join('');
  const boardY = TABLE - ch - 6;
  const left = x0 - pitch / 2 - 6;
  const right = x0 + (shown - 1) * pitch + pitch / 2 + 6;
  const board = `<rect x="${left}" y="${boardY}" width="${right - left}" height="6" rx="1" style="fill:${WOOD};stroke:${WOOD_EDGE}"/>`;
  const px = v.end ? x0 + (shown - 1) * pitch : 430;
  const mood = v.on < 1 ? 'neutral' : v.holds ? 'happy' : 'surprised';
  const prof = professorAt(px, boardY - (1 - v.on) * 50, PROF_TALL, mood);
  const more = shown < cols ? `<text class="bench-label" x="596" y="${TABLE - 4}" text-anchor="end">×${cols}</text>` : '';
  const note = v.note ? `<text class="bench-label" x="596" y="40" text-anchor="end">${v.note}</text>` : '';
  return `${cupsSvg}${board}${prof}${more}${note}`;
}

/**
 * The steps played: the plate pushed down on the cup — it holds, then gives (buckles, or flattens on its side);
 * the Professor stepping onto the scales; stepping onto the board — the cups hold, or are crushed under him.
 */
function motion(next: CupsView, draw: (v: CupsView) => void): Motion | null {
  if (next.stage === 'press' && !next.gave) return null;
  const T = next.stage === 'press' ? 2.4 : 2.2;
  const clock = new Channel(0, 1, { kind: 'steady', speed: 1 / T }, 1e-6);
  const { read: _r, ...rest } = next;
  void _r;
  const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, x)));
  const crunch = once({ kind: 'lands' });
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw(next);
      const u = clock.value;
      if (next.stage === 'press') {
        // It holds, holds… and gives at once.
        const give = u < 0.7 ? 0 : ease((u - 0.7) / 0.3);
        crunch(u >= 0.7);
        return draw({ ...rest, squash: give, display: u < 0.7 ? '' : next.display });
      }
      if (next.stage === 'weigh') return draw({ ...rest, on: ease(u / 0.6), display: '' });
      // Onto the board; then the cups give under him — or not.
      const on = ease(u / 0.55);
      const squash = next.holds ? 0 : u < 0.6 ? 0 : ease((u - 0.6) / 0.25);
      if (!next.holds) crunch(u >= 0.6);
      return draw({ ...rest, on, squash });
    },
  };
}

export const paperCupsScene = defineScene({ kind: 'cups', view, svg, motion, share: 0.4, onStage: (v: CupsView) => v.stage !== 'press' });
