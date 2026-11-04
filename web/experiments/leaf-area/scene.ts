import { LEAF_FORMS, leafProfile, PALETTE_OFFSET, paletteRows, type LeafForm, type PaletteRow } from '../../../src/experiments/leaf-area/bench.js';
import { cm2, sideText } from '../../../src/experiments/leaf-area/words.js';
import type { Locale } from '../../../src/knowledge/i18n.js';
import { t } from '../../../src/knowledge/messages.js';
import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/**
 * A sheet of paper on the table, right of the speech bubble: the card with the ruler laid along it and across, or the
 * leaf with a palette laid on it — its whole squares green, the ones its edge cuts yellow, counted row by row.
 * Drawn to fit the sheet (its real size is written beside it).
 */
export type AreaView =
  | { readonly step: 'card'; readonly a: number; readonly b: number; readonly read?: { readonly a: string; readonly b: string; readonly S: string }; readonly laid?: number }
  | {
      readonly step: 'palette';
      readonly form: LeafForm;
      readonly length: number;
      readonly side?: number;
      readonly sideText?: string;
      readonly lengthText: string;
      readonly read?: { readonly whole: number; readonly cut: number; readonly S: string };
      /** The motion: the palette sliding on (0…1), then the rows counted (0…1 of them). */
      readonly slide?: number;
      readonly counted?: number;
      readonly locale: Locale;
    };

/** The sheet's room: right of the bubble, on the table. */
const X0 = 318;
const X1 = 598;
const Y0 = 24;
const Y1 = TABLE - 8;

type Cmd = { step: 'card'; a: number; b: number } | { step: 'palette'; form: LeafForm; length: number; side: number };

function view({ last, command, plan, locale }: SceneContext): AreaView {
  const mine = command?.type === 'lab.area' ? (command as unknown as Cmd) : undefined;
  const next = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.area');
  const c = mine ?? (next?.kind === 'bench' ? (next.command as unknown as Cmd) : undefined) ?? { step: 'card', a: 0.06, b: 0.04 };
  const recs = mine && last ? readingsOf([last]).map((x) => x.record) : [];
  if (c.step === 'card') {
    const [ra, rb] = recs;
    return {
      step: 'card',
      a: c.a,
      b: c.b,
      ...(ra && rb && ra.value !== null && rb.value !== null ? { read: { a: formatMeasured('length', ra.value, 0.001, locale), b: formatMeasured('length', rb.value, 0.001, locale), S: cm2(ra.value * rb.value, locale) } } : {}),
    };
  }
  const r = recs[0];
  const i = r?.inputs ?? {};
  return {
    step: 'palette',
    form: c.form,
    length: c.length,
    lengthText: formatMeasured('length', c.length, 0.001, locale),
    // (Before its step the leaf lies bare; the palette comes with the step.)
    ...(mine ? { side: c.side, sideText: sideText(c.side, locale) } : {}),
    ...(r && r.value !== null ? { read: { whole: i['whole'] ?? 0, cut: i['cut'] ?? 0, S: formatMeasured('area', r.value, i['division'] ?? 1e-4, locale) } } : {}),
    locale,
  };
}

/** The readings on the sheet: the board's yellow is too pale on paper. */
const ON_PAPER = '#a34a00';
const label = (x: number, y: number, s: string, anchor = 'middle') => `<text x="${x}" y="${y}" text-anchor="${anchor}" style="font:600 11px system-ui,sans-serif;fill:#2b2f36">${s}</text>`;

function cardSvg(v: Extract<AreaView, { step: 'card' }>): string {
  // The card to fit 220 × 150, its proportions kept.
  const k = Math.min(220 / v.a, 150 / v.b);
  const w = v.a * k;
  const h = v.b * k;
  const x = (X0 + X1) / 2 - w / 2 - 14;
  const y = (Y0 + Y1) / 2 - h / 2 + 10;
  const card = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" style="fill:#e8f1fb;stroke:#4a78b5;stroke-width:2"/>`;
  // The ruler: along the length first, then across (laid 0…1: the first half along, the second across).
  const laid = v.read ? 1 : (v.laid ?? 0);
  const tick = (n: number, along: boolean) => Array.from({ length: n + 1 }, (_, i) => (along ? `<path d="M${x + (i * w) / n},${y + h + 4} v${i % 5 === 0 ? 7 : 4}" style="stroke:#3d3d3d;stroke-width:0.8"/>` : `<path d="M${x + w + 4},${y + (i * h) / n} h${i % 5 === 0 ? 7 : 4}" style="stroke:#3d3d3d;stroke-width:0.8"/>`)).join('');
  const along = laid > 0 ? `<g style="opacity:${Math.min(1, laid * 2)}"><rect x="${x - 4}" y="${y + h + 4}" width="${w + 8}" height="14" style="fill:rgba(241,227,184,0.95);stroke:#b39b5c"/>${tick(20, true)}</g>` : '';
  const across = laid > 0.5 ? `<g style="opacity:${Math.min(1, (laid - 0.5) * 2)}"><rect x="${x + w + 4}" y="${y - 4}" width="14" height="${h + 8}" style="fill:rgba(241,227,184,0.95);stroke:#b39b5c"/>${tick(10, false)}</g>` : '';
  const read = v.read ? `${label(x + w / 2, y + h + 34, `a = ${v.read.a}`)}<g transform="translate(${x + w + 30} ${y + h / 2}) rotate(-90)">${label(0, 0, `b = ${v.read.b}`)}</g><text class="bench-reading" x="${(X0 + X1) / 2}" y="${Y0 + 20}" text-anchor="middle" style="fill:${ON_PAPER}">S = ${v.read.S}</text>` : '';
  return `${card}${along}${across}${read}`;
}

function leafSvg(v: Extract<AreaView, { step: 'palette' }>): string {
  const f = LEAF_FORMS[v.form];
  // The leaf to fit the sheet: its length up, its width across (a stalk under it).
  const k = Math.min((Y1 - Y0 - 70) / v.length, (X1 - X0 - 40) / (f.width * v.length));
  const cx = (X0 + X1) / 2;
  const base = Y1 - 30;
  const X = (x: number) => cx + x * k;
  const Y = (y: number) => base - y * k;
  const n = 90;
  const side = (sign: number) => Array.from({ length: n + 1 }, (_, i) => {
    const u = sign > 0 ? i / n : 1 - i / n;
    return `${X(sign * f.width * v.length * leafProfile(v.form, u)).toFixed(1)},${Y(u * v.length).toFixed(1)}`;
  });
  const outline = `M${[...side(1), ...side(-1)].join(' L')} Z`;
  const leaf = `<path d="M${cx},${base} L${cx},${base + 22}" style="stroke:#3f6b2a;stroke-width:3;stroke-linecap:round"/><path d="${outline}" style="fill:#5d9b3a;stroke:#2f5d1c;stroke-width:1.5"/><path d="M${cx},${base} L${cx},${Y(v.length * 0.97)}" style="stroke:#2f5d1c;stroke-width:1.2;opacity:0.7"/>`;
  const size = label(X1 - 4, Y0 + 12, `${v.lengthText}`, 'end');
  if (!v.side) return `${leaf}${size}`;
  const sq = v.side;
  // The palette: a pale sheet with its lines (too fine to draw — just its tint); it slides on from the right.
  const s = v.side * k;
  const shift = (1 - (v.read ? 1 : (v.slide ?? 1))) * (X1 - X0 + 40);
  const ox = PALETTE_OFFSET.x * v.side * k;
  const oy = PALETTE_OFFSET.y * v.side * k;
  const px0 = X0 + 6;
  const px1 = X1 - 6;
  const py0 = Y0 + 20;
  const py1 = Y1 - 4;
  let lines = '';
  if (s >= 3) {
    for (let x = cx + ox - Math.floor((cx + ox - px0) / s) * s; x <= px1; x += s) lines += `M${x.toFixed(1)},${py0} V${py1} `;
    for (let y = base - oy - Math.floor((base - oy - py0) / s) * s; y <= py1; y += s) lines += `M${px0},${y.toFixed(1)} H${px1} `;
  }
  // The counted rows: the cut squares yellow under the whole ones green, the rows from the tip down as they are counted.
  const rows: readonly PaletteRow[] = paletteRows(v.form, v.length, v.side);
  const shown = v.read ? rows.length : Math.floor((v.counted ?? 0) * rows.length);
  let cells = '';
  const order = [...rows].reverse();
  let whole = 0;
  let touched = 0;
  for (const r of order.slice(0, shown)) {
    const y = Y(PALETTE_OFFSET.y * v.side + (r.row + 1) * v.side);
    const cell = (from: number, to: number, colour: string) => `<rect x="${(X(PALETTE_OFFSET.x * sq + from * sq)).toFixed(1)}" y="${y.toFixed(1)}" width="${((to - from + 1) * s).toFixed(1)}" height="${s.toFixed(1)}" style="fill:${colour}"/>`;
    if (r.touched) {
      cells += cell(r.touched[0], r.touched[1], 'rgba(244,196,48,0.75)');
      touched += r.touched[1] - r.touched[0] + 1;
    }
    if (r.whole) {
      cells += cell(r.whole[0], r.whole[1], 'rgba(46,160,90,0.8)');
      whole += r.whole[1] - r.whole[0] + 1;
    }
  }
  const palette = `<g transform="translate(${shift} 0)"><rect x="${px0}" y="${py0}" width="${px1 - px0}" height="${py1 - py0}" style="fill:rgba(220,235,250,0.35);stroke:#6b8fb8;stroke-width:1"/>${cells}<path d="${lines}" style="stroke:#2c5d93;stroke-width:0.6;opacity:0.75;fill:none"/></g>`;
  const counter = v.read || v.counted !== undefined ? label(X0 + 10, Y0 + 12, `N = ${v.read?.whole ?? whole}, n = ${v.read ? v.read.cut : touched - whole}`, 'start') : '';
  const fine = s < 3 ? label(X1 - 4, Y1 - 10, t(v.locale, 'leaf-area-scene-fine', { side: v.sideText ?? '' }), 'end') : label(X1 - 4, Y0 + 26, v.sideText ?? '', 'end');
  const read = v.read ? `<text class="bench-reading" x="${cx}" y="${Y0 + 13}" text-anchor="middle" style="fill:${ON_PAPER}">S ≈ ${v.read.S}</text>` : '';
  return `${leaf}${palette}${size}${fine}${counter}${read}`;
}

function svg(v: AreaView): string {
  const sheet = `<rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}" rx="4" style="fill:#fbf8ef;stroke:#c9bd99;stroke-width:1.5"/>`;
  return `${sheet}${v.step === 'card' ? cardSvg(v) : leafSvg(v)}`;
}

/** The card: the ruler laid along it, then across (about two seconds). The palette: slides on, then its rows are counted (about three). */
function motion(next: AreaView, draw: (v: AreaView) => void): Motion | null {
  if (!next.read) return null;
  const clock = new Channel(0, 1, { kind: 'steady', speed: next.step === 'card' ? 0.5 : 0.34 }, 1e-6);
  const { read: _r, ...rest } = next;
  void _r;
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw(next);
      const x = clock.value;
      draw(rest.step === 'card' ? { ...rest, laid: x } : { ...rest, slide: Math.min(1, x / 0.3), ...(x > 0.3 ? { counted: (x - 0.3) / 0.7 } : {}) });
    },
  };
}

export const leafAreaScene = defineScene({ kind: 'area', view, svg, motion });
