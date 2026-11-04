import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import { paletteArea, rectangleArea } from '../../domains/mechanics/formulas.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import { msg } from '../../knowledge/messages.js';
import { measured, ruler, RULER_DIVISION } from '../../scenarios/bench-kit.js';

/**
 * A leaf's area (grade 7, introduction: «вимірювання фізичних величин (… площ …)»): a card is measured with a ruler
 * (S = a·b), a leaf of any length and form — with a palette, a transparent sheet ruled in squares of any size: the
 * whole squares and half the cut ones (the domain's palette area). The leaf's outline is the drawing's own, so its
 * exact area is known to check the palettes against. Here — only the card, the leaf and the palettes.
 */

/** The leaf's forms (botany's names for a blade's outline): how wide for its length, and where it is widest. */
export const LEAF_FORMS = {
  /** Ovate: widest below the middle. */
  ovate: { width: 0.62, a: 0.76, b: 0.9 },
  /** Lanceolate: long and narrow, widest at the middle. */
  lanceolate: { width: 0.22, a: 1, b: 1 },
  /** Orbicular: almost round. */
  orbicular: { width: 0.9, a: 1, b: 0.55 },
} as const;
export type LeafForm = keyof typeof LEAF_FORMS;

/** The blade's half-width at u (0 — the base, 1 — the tip), as a share of the leaf's width: one bulge, nothing outside. */
export const leafProfile = (form: LeafForm, u: number): number => {
  if (u <= 0 || u >= 1) return 0;
  const f = LEAF_FORMS[form];
  return 0.5 * Math.sin(Math.PI * u ** f.a) ** f.b;
};
/** Where the blade is widest (0…1 from the base). */
const widestAt = (form: LeafForm): number => 0.5 ** (1 / LEAF_FORMS[form].a);

/** The leaf's exact area, m² (its outline integrated: Simpson's rule, fine enough to be exact for the palettes). */
export function leafArea(form: LeafForm, length: number): number {
  const n = 2000;
  let s = 0;
  for (let i = 0; i <= n; i++) s += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * leafProfile(form, i / n);
  return 2 * (s / (3 * n)) * LEAF_FORMS[form].width * length * length;
}

/** Where the palette's lines lie against the leaf (as a share of a square): it is laid as it falls, not to fit. */
export const PALETTE_OFFSET = { x: 0.37, y: 0.21 } as const;

/** One row of the palette over the leaf: the columns k of its whole squares (from…to) and of the ones the edge cuts. */
export interface PaletteRow {
  readonly row: number;
  readonly whole: readonly [number, number] | null;
  readonly touched: readonly [number, number] | null;
}

/**
 * The palette laid on the leaf (base at y = 0, tip at y = length, the midrib on x = 0), row by row: a square is whole
 * when all of it is in the blade, cut when the edge goes through it. The blade has one bulge, so in a row it spans
 * |x| ≤ its narrowest half-width there (whole) and reaches its widest (cut) — counted per row, not per square.
 */
export function paletteRows(form: LeafForm, length: number, side: number): PaletteRow[] {
  const half = (y: number) => LEAF_FORMS[form].width * length * leafProfile(form, y / length);
  const peak = widestAt(form) * length;
  const ox = PALETTE_OFFSET.x * side;
  const oy = PALETTE_OFFSET.y * side;
  const rows: PaletteRow[] = [];
  for (let j = Math.floor(-oy / side); oy + j * side < length; j++) {
    const y0 = oy + j * side;
    const y1 = y0 + side;
    const ends = [half(Math.max(0, y0)), half(Math.min(length, y1))];
    const narrow = y0 < 0 || y1 > length ? 0 : Math.min(...ends);
    const wide = y0 <= peak && peak <= y1 ? half(peak) : Math.max(...ends);
    if (wide <= 0) continue;
    // Whole: x0 ≥ −narrow and x0 + side ≤ narrow; touched: x0 < wide and x0 + side > −wide (x0 = ox + k·side).
    const w0 = Math.ceil((-narrow - ox) / side);
    const w1 = Math.floor((narrow - ox) / side) - 1;
    const t0 = Math.floor((-wide - ox) / side - 1) + 1;
    const t1 = Math.ceil((wide - ox) / side) - 1;
    rows.push({ row: j, whole: narrow > 0 && w1 >= w0 ? [w0, w1] : null, touched: t1 >= t0 ? [t0, t1] : null });
  }
  return rows;
}

/** The squares counted: whole N and cut n. */
export function paletteCount(rows: readonly PaletteRow[]): { whole: number; cut: number } {
  let whole = 0;
  let touched = 0;
  for (const r of rows) {
    if (r.whole) whole += r.whole[1] - r.whole[0] + 1;
    if (r.touched) touched += r.touched[1] - r.touched[0] + 1;
  }
  return { whole, cut: touched - whole };
}

/** A palette's square sides from a fine one to a coarse one, m: no square smaller than a millimetre's fifth nor a leaf's worth of them past a few thousand rows. */
export const SIDE_MIN = 0.0002;
export const MAX_ROWS = 5000;

export type AreaCommand =
  | { readonly type: 'lab.area'; readonly step: 'card'; readonly a: number; readonly b: number }
  | { readonly type: 'lab.area'; readonly step: 'palette'; readonly form: LeafForm; readonly length: number; readonly side: number };

export const areaCommand: CommandHandler<AreaCommand> = {
  type: 'lab.area',
  apply(state, c) {
    if (c.step === 'card') {
      if (!(c.a > 0) || !(c.b > 0)) return err(msg('leaf-area-bad-card'));
      const a = ruler(c.a);
      const b = ruler(c.b);
      const inputs = { area: rectangleArea(a, b), division: RULER_DIVISION };
      return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured('ruler', 'length', a, c.a, { ...inputs, side: 0 }), measured('ruler', 'length', b, c.b, { ...inputs, side: 1 })] });
    }
    if (!(c.length > 0)) return err(msg('leaf-area-bad-length'));
    if (!(c.side >= SIDE_MIN)) return err(msg('leaf-area-bad-side'));
    // (Squares so fine that the leaf takes thousands of rows: nobody counts them — a finer palette is no palette.)
    if (c.length / c.side > MAX_ROWS) return err(msg('leaf-area-too-fine'));
    const { whole, cut } = paletteCount(paletteRows(c.form, c.length, c.side));
    const square = c.side * c.side;
    const S = paletteArea(whole, cut, square);
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured('palette', 'area', S, leafArea(c.form, c.length), { whole, cut, square, side: c.side, division: square / 2 })] });
  },
};

/** The leaf's form in words: «яйцеподібний». */
export const formName = (f: LeafForm): LocalizedText => msg(`leaf-area-form-${f}`);
