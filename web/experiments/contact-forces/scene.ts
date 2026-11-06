import { balanceText, magnetLoss, TOUCH_GAP, TOUCH_MASS, touchForce, type TouchCase, type TouchCommand } from '../../../src/experiments/contact-forces/bench.js';
import type { TouchMagnet } from '../../../src/experiments/contact-forces/shared.js';
import { barMagnetFieldDirection } from '../../../src/domains/electrical/magnet.js';
import { G } from '../../../src/domains/mechanics/constants.js';
import { forceDivision, BAR_MAGNET } from '../../../src/scenarios/bench-kit.js';
import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { SCALES } from '../../../src/equipment/scales.js';
import type { Locale } from '../../../src/knowledge/i18n.js';
import { t as tl } from '../../../src/knowledge/messages.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { dynamometerSvg, forceGaugeSvg, labBalanceSvg, standSvg, THREAD } from '../../graphics/scene/kit.js';
import { loadHeight, loadSvg } from '../../graphics/scene/weights.js';
import { Channel, type Motion } from '../../motion.js';
import { clack, scraping, thud } from '../../sounds/index.js';
import { defineScene, type SceneContext } from '../types.js';

/** Contact and non-contact forces: the case shown, how far it has played (0 — before, 1 — done), its conditions. */
export type TouchView = {
  readonly case: TouchCase;
  readonly k: number;
  readonly gap: number;
  readonly magnet: TouchMagnet;
  readonly mass: number;
  readonly locale: Locale;
  /** The force the reading gives, once the step is over. */
  readonly read?: string;
};

function view({ last, command, plan, locale }: SceneContext): TouchView {
  const mine = command?.type === 'lab.touch' ? (command as unknown as TouchCommand) : undefined;
  const next = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.touch');
  const c = mine ?? (next?.kind === 'bench' ? (next.command as unknown as TouchCommand) : undefined);
  const r = last && mine ? readingsOf([last])[0]?.record : undefined;
  const which = c?.case ?? 'magnet';
  return { case: which, k: mine ? 1 : 0, gap: c?.gap ?? TOUCH_GAP, magnet: c?.magnet ?? 'ferrite', mass: c?.mass ?? TOUCH_MASS, locale, ...(r ? { read: touchForce(which, r, locale) } : {}) };
}

/** The drawing's scale in the magnet's cases, px to a centimetre. */
const PX = 10;
const FIELD = '#7fd4ff';
/** The space every case keeps, unseen: the scale of the drawing stays from step to step. */
const ROOM = `<rect x="300" y="10" width="300" height="${TABLE - 10}" style="fill:none"/>`;
/** The scales, and the magnet upright on a wooden spacer on their pan (iron under a magnet would pull it down). */
const BALANCE_X = 450;
const BALANCE_TOP = 286;
const PAN = BALANCE_TOP - 11;
const SPACER = 14;
const MAGNET_LEN = BAR_MAGNET.length.value * 100 * PX;
const MAGNET_TOP = PAN - SPACER - MAGNET_LEN;
const MAGNET_MIDDLE = MAGNET_TOP + MAGNET_LEN / 2;
const MAGNET_HALF = 10;
const BALL_R = 4;
/** The longest gap drawn true to scale, and where the ball starts down from. */
const GAP_DRAWN = 0.1;
const GAP_START = 0.12;

/**
 * The bar magnet's field lines, from the field's own direction: each followed from where it crosses the magnet's
 * middle both ways, to its north end and to its south end (or out of the room), so that it runs from N to S. In px from
 * the magnet's middle, y down. The same for every step: traced once.
 */
type Line = { readonly d: string; readonly arrow: readonly [number, number, number] };
let lines: readonly Line[] | undefined;
function fieldLines(): readonly Line[] {
  if (lines) return lines;
  const L = BAR_MAGNET.length.value * 100;
  const R = BAR_MAGNET.radius.value * 100;
  const out = (x: number, y: number) => Math.abs(x) * PX > 148 || -y * PX > TABLE - MAGNET_MIDDLE || -y * PX < 12 - MAGNET_MIDDLE;
  const ended = (x: number, y: number) => Math.abs(x) < R * 1.1 && Math.abs(y) > L / 2 - 0.1 && Math.abs(y) < L / 2 + 0.3;
  const follow = (x0: number, y0: number, step: number): (readonly [number, number])[] => {
    let [x, y] = [x0, y0];
    const at: (readonly [number, number])[] = [];
    for (let i = 0; i < 1500 && !out(x, y) && !ended(x, y); i++) {
      const [bx, by] = barMagnetFieldDirection(L, R, x, y);
      const [mx, my] = barMagnetFieldDirection(L, R, x + (bx * step) / 2, y + (by * step) / 2);
      x += mx * step;
      y += my * step;
      at.push([x * PX, -y * PX]);
    }
    return at;
  };
  const line = (x0: number, y0: number): Line => {
    const to = follow(x0, y0, 0.1);
    const at = [...follow(x0, y0, -0.1).reverse(), [x0 * PX, -y0 * PX] as const, ...to];
    const i = at.length - to.length - 1;
    const [ax, ay] = at[i]!;
    const [bx, by] = at[i + 1]!;
    return { d: `M${at.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' L')}`, arrow: [ax, ay, (Math.atan2(by - ay, bx - ax) * 180) / Math.PI] };
  };
  lines = [1.7, 2.6, 3.8, 5.4, 7.6, 10.8, 14].flatMap((x) => [line(x, 0), line(-x, 0)]);
  return lines;
}

/** Flow goes on through the page's redraws: each one takes up the motion where the last left it. */
const flowing = (seconds: number): string => `animation-duration:${seconds}s;animation-delay:-${((performance.now() / 1000) % seconds).toFixed(3)}s`;

function fieldSvg(): string {
  const body = fieldLines()
    .map((l) => `<path d="${l.d}" style="fill:none;stroke:${FIELD};stroke-opacity:0.35;stroke-width:1"/><path class="field-flow" d="${l.d}" style="fill:none;stroke:${FIELD};stroke-width:1.6;stroke-linecap:round;stroke-dasharray:2 22;${flowing(2.4)}"/><path d="M-5,-3.5 L3,0 L-5,3.5 z" transform="translate(${l.arrow[0].toFixed(1)},${l.arrow[1].toFixed(1)}) rotate(${l.arrow[2].toFixed(1)})" style="fill:${FIELD}"/>`)
    .join('');
  return `<g transform="translate(${BALANCE_X},${MAGNET_MIDDLE})">${body}</g>`;
}

function magnetSvg(): string {
  const x = BALANCE_X - MAGNET_HALF;
  const w = 2 * MAGNET_HALF;
  const half = MAGNET_LEN / 2;
  const letter = (y: number, s: string) => `<text x="${BALANCE_X}" y="${y}" text-anchor="middle" style="font:700 11px system-ui;fill:#fff">${s}</text>`;
  return `<rect x="${x - 6}" y="${PAN - SPACER}" width="${w + 12}" height="${SPACER}" rx="1.5" style="fill:#c8995a;stroke:#7a4a1f"/><rect x="${x}" y="${MAGNET_TOP}" width="${w}" height="${half}" style="fill:#c0392b"/><rect x="${x}" y="${MAGNET_TOP + half}" width="${w}" height="${half}" style="fill:#2e6db4"/>${letter(MAGNET_TOP + 14, 'N')}${letter(MAGNET_TOP + MAGNET_LEN - 6, 'S')}`;
}

/** The steel ball over the magnet on the scales, the card between them in the card's case. */
function magnetCaseSvg(t: TouchView): string {
  const card = t.case === 'card';
  // (The ball comes down in the first case; the card slides in with the ball already in place.)
  const gapNow = card ? t.gap : Math.max(t.gap, GAP_START) + (t.gap - Math.max(t.gap, GAP_START)) * t.k;
  const drawn = Math.min(gapNow, GAP_DRAWN) * 100 * PX;
  const ballY = MAGNET_TOP - drawn - BALL_R;
  const display = balanceText(magnetLoss(gapNow, t.magnet), t.locale);
  const arm = 34;
  const ball = `<path d="M${BALANCE_X},${arm} V${ballY - BALL_R}" style="stroke:${THREAD};stroke-width:1.2"/><circle cx="${BALANCE_X}" cy="${ballY}" r="${BALL_R}" style="fill:#c9d0d8;stroke:#59616a;stroke-width:1"/>`;
  const cardY = MAGNET_TOP - drawn / 2 - 1.5;
  const cardBox = card ? `<rect x="${BALANCE_X - 45 + (1 - t.k) * 150}" y="${cardY}" width="90" height="3" style="fill:#d8c39a;stroke:#9a7a4a;stroke-width:0.6"/>` : '';
  const arrows = t.read
    ? `<path class="bench-mark" d="M${BALANCE_X + 14},${ballY - 8} v22 m-4,-6 l4,6 l4,-6" style="fill:none"/><path class="bench-mark" d="M${BALANCE_X + 16},${MAGNET_TOP + 30} v-22 m-4,6 l4,-6 l4,6" style="fill:none"/>`
    : '';
  const caption = `<text x="596" y="28" text-anchor="end" style="font:600 11px system-ui;fill:${FIELD}">${tl(t.locale, 'contact-forces-scene-field')}</text>`;
  const scaleNote = t.gap > GAP_DRAWN ? `<text x="596" y="46" text-anchor="end" style="font:600 11px system-ui;fill:${FIELD}">${tl(t.locale, 'contact-forces-scene-scale')}</text>` : '';
  const read = t.read ? `<text class="bench-reading" x="596" y="${t.gap > GAP_DRAWN ? 66 : 48}" text-anchor="end">${t.read}</text>` : '';
  return `${fieldSvg()}${standSvg(330, BALANCE_X + 6, arm)}${labBalanceSvg(BALANCE_X, BALANCE_TOP, display)}${magnetSvg()}${ball}${cardBox}${arrows}${caption}${scaleNote}${read}`;
}

function combSvg(t: TouchView): string {
  const k = t.k;
  const combY = TABLE - 70 - (1 - k) * 60;
  const comb = `<rect x="390" y="${combY - 12}" width="120" height="8" rx="2" style="fill:#2b3a4a"/>${Array.from({ length: 20 }, (_, i) => `<path d="M${393 + i * 6},${combY - 4} v10" style="stroke:#2b3a4a;stroke-width:2"/>`).join('')}`;
  const bits = Array.from({ length: 9 }, (_, i) => {
    const x = 400 + i * 12;
    const up = k > 0.5 && i % 3 !== 2 ? Math.min(1, (k - 0.5) * 2.5) : 0;
    const y = TABLE - 4 - up * (TABLE - 4 - (combY + 8));
    // The electric field reaches the bits from the comb: dashes, for the lines of a field no one sees.
    const line = `<path d="M${x + 3},${combY + 8} V${y - 5}" style="stroke:${FIELD};stroke-opacity:${0.25 + 0.5 * k};stroke-width:1;stroke-dasharray:3 4"/>`;
    return `${line}<rect x="${x - 1}" y="${y - 5}" width="9" height="6" transform="rotate(${(i * 37) % 60 - 30} ${x + 3} ${y - 2})" style="fill:#f4f1e8;stroke:#b9b2a0;stroke-width:0.6"/>`;
  }).join('');
  const read = t.read ? `<text class="bench-reading" x="596" y="${combY - 26}" text-anchor="end">${t.read}</text>` : '';
  return `${comb}${bits}${read}`;
}

const BLOCK_W = 120;
const BLOCK_H = 40;
const BLOCK_X = 340;
const DRAG = 30;

/** The block dragged along the table by the dynamometer; hung just clear of it, moved aside a little: no friction, no scrape. */
function blockCaseSvg(t: TouchView): string {
  const lifted = t.case === 'lifted';
  const x = BLOCK_X + (lifted ? 6 : DRAG) * t.k;
  const top = TABLE - BLOCK_H - (lifted ? 6 : 0);
  const midY = top + BLOCK_H / 2;
  const dynX = x + BLOCK_W + 12;
  const f = SCALES.dynamometer.spec.resolution.value;
  // (Only a moving block's pull is shown; the reading of the step comes when it is over.)
  const display = t.read ? t.read.replace('F = ', '') : formatMeasured('force', 0, f, t.locale);
  const hanger = lifted ? `${standSvg(BLOCK_X - 10, BLOCK_X + BLOCK_W / 2, 60)}<path d="M${BLOCK_X + BLOCK_W / 2},60 L${x + BLOCK_W / 2},${top}" style="stroke:${THREAD};stroke-width:1.4"/>` : '';
  const gap = lifted ? `<path d="M${x},${TABLE - 1} h${BLOCK_W}" style="stroke:#ffd166;stroke-width:1;stroke-dasharray:3 3"/>` : '';
  const block = `<rect x="${x}" y="${top}" width="${BLOCK_W}" height="${BLOCK_H}" rx="2" style="fill:#c8794a;stroke:#7a4a1f"/>`;
  const pull = `<path d="M${x + BLOCK_W},${midY} h12" style="stroke:${THREAD};stroke-width:1.4"/>`;
  const read = t.read ? `<text class="bench-reading" x="596" y="${top - 34}" text-anchor="end">${t.read}</text>` : '';
  return `${hanger}${gap}${block}${pull}${dynamometerSvg(dynX, midY, true, display)}${read}`;
}

/** Where the weight hangs from the instrument, and when in the step it is let go. */
const ARM_Y = 34;
const HOOK = ARM_Y + 96;
const LET_GO = 0.3;

/** The weight on the instrument, let go: it falls (the way grows as t²); the Earth's field stands around, straight down. */
function fallSvg(t: TouchView): string {
  const x = BALANCE_X;
  const F = t.mass * G;
  const d = forceDivision(F);
  const gauge = d !== SCALES.dynamometer.spec.resolution.value;
  const hanging = t.k < LET_GO;
  const u = hanging ? 0 : (t.k - LET_GO) / (1 - LET_GO);
  const start = HOOK + 8;
  const top = start + (TABLE - loadHeight(t.mass) - start) * u * u;
  const shown = formatMeasured('force', hanging && t.k > 0 ? Math.round(F / d) * d : 0, d, t.locale);
  const meter = gauge ? forceGaugeSvg(x, ARM_Y + 6, shown) : `${dynamometerSvg(x, ARM_Y + 6, false, shown)}<path d="M${x},${ARM_Y + 86} V${HOOK}" style="stroke:#3a3f46;stroke-width:2"/>`;
  const column = (cx: number) => `<path class="field-flow" d="M${cx},40 V${TABLE - 6}" style="fill:none;stroke:${FIELD};stroke-opacity:0.5;stroke-width:1.2;stroke-dasharray:6 18;${flowing(1.6)}"/><path d="M${cx - 4},${TABLE - 14} L${cx},${TABLE - 6} L${cx + 4},${TABLE - 14} z" style="fill:${FIELD};fill-opacity:0.6"/>`;
  const field = [360, 540, 580].map(column).join('');
  const thread = hanging ? `<path d="M${x},${HOOK} V${start}" style="stroke:#3a3f46;stroke-width:2"/>` : '';
  const arrow = `<path class="bench-mark" d="M${x + 34},${Math.min(top + 4, TABLE - 36)} v30 m-4,-6 l4,6 l4,-6" style="fill:none"/>`;
  const read = t.read ? `<text class="bench-reading" x="596" y="28" text-anchor="end">${t.read}</text>` : '';
  return `${field}${standSvg(330, x + 6, ARM_Y)}${meter}${thread}${loadSvg(x, top, t.mass, t.locale)}${arrow}${read}`;
}

/**
 * Contact and non-contact forces, a scene to a case: the ball over the magnet on the scales, in its field's lines; the
 * bits of paper and the rubbed comb; the block on the table and over it; the weight on the dynamometer, let go.
 */
function touchSvg(t: TouchView): string {
  if (!t) return '';
  const body = t.case === 'magnet' || t.case === 'card' ? magnetCaseSvg(t) : t.case === 'comb' ? combSvg(t) : t.case === 'fall' ? fallSvg(t) : blockCaseSvg(t);
  return `${ROOM}${body}`;
}

/** Each case plays in about 1.5 s. A dragged block rasps all the way; the fallen weight hits the table; the rest are quiet. */
function touchRun(next: TouchView, draw: (v: TouchView) => void): Motion | null {
  if (!next.read) return null;
  const k = new Channel(0, 1, { kind: 'steady', speed: 0.7 }, 0.001);
  const { read: _r, ...rest } = next;
  void _r;
  return {
    channels: [k],
    frame: (done) => {
      if (done) {
        if (next.case === 'fall') {
          thud();
          clack();
        }
        return draw(next);
      }
      if (next.case === 'table') scraping(0.6);
      draw({ ...rest, k: k.value });
    },
  };
}

export const contactForcesScene = defineScene({ kind: 'touch', view, svg: touchSvg, motion: touchRun });
