import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { formName, type AreaCommand } from './bench.js';

export const setup: LocalizedText = msg('leaf-area-setup');

/** A square's side: in millimetres below a centimetre, in centimetres from it («5 мм», «1 см»). */
export const sideText = (side: number, l: Locale): string => (side < 0.01 ? `${sig(side * 1000, 3, l)} ${t(l, 'unit-sym-mm')}` : `${sig(side * 100, 3, l)} ${t(l, 'unit-sym-cm')}`);
/** An area in square centimetres, as many figures as given. */
export const cm2 = (S: number, l: Locale, digits = 3): string => `${sig(S * 1e4, digits, l)} ${t(l, 'unit-sym-cm2')}`;
const cm = (x: number, l: Locale) => formatMeasured('length', x, 0.001, l);

export const text = (c: AreaCommand): StepText => {
  if (c.step === 'card') {
    const args = { a: (l: Locale) => cm(c.a, l), b: (l: Locale) => cm(c.b, l) };
    return { say: msg('leaf-area-card-say', args), button: msg('leaf-area-card-button'), plan: msg('leaf-area-card-plan') };
  }
  const args = { side: (l: Locale) => sideText(c.side, l), form: (l: Locale) => formName(c.form)[l] };
  return { say: msg('leaf-area-palette-say', args), button: msg('leaf-area-palette-button', args), plan: msg('leaf-area-palette-plan', args) };
};

/** The ruler is laid along the card's sides; the palette comes down on the leaf and its squares are counted. */
export const busy = (c: AreaCommand): LocalizedText => msg(c.step === 'card' ? 'leaf-area-card-busy' : 'leaf-area-palette-busy');

/** The card's two sides and its area, or the palette's count and its area. */
function numbers(c: AreaCommand, recs: readonly MeasurementRecord[], l: Locale) {
  const r = recs[0];
  if (!r || r.value === null) return null;
  if (c.step === 'card') {
    const b = recs[1];
    if (!b || b.value === null) return null;
    return { step: 'card' as const, a: cm(r.value, l), b: cm(b.value, l), S: cm2(r.value * b.value, l) };
  }
  const i = r.inputs ?? {};
  return { step: 'palette' as const, whole: i['whole'] ?? 0, cut: i['cut'] ?? 0, square: cm2(i['square'] ?? 0, l), S: formatMeasured('area', r.value, i['division'] ?? 1e-4, l), side: sideText(c.side, l) };
}

export function shown(c: AreaCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const n = numbers(c, recs, locale);
  if (!n) return '';
  return n.step === 'card' ? t(locale, 'leaf-area-card-shown', n) : t(locale, 'leaf-area-palette-shown', n);
}

export function say(c: AreaCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const n = numbers(c, recs, locale);
  if (!n) return '';
  return n.step === 'card' ? t(locale, 'leaf-area-card-said', n) : t(locale, 'leaf-area-palette-said', n);
}

/** The board: the card's S = a·b; each palette's S ≈ (N + n/2)·s₀. */
export function board(c: AreaCommand, recs: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const n = numbers(c, recs, locale);
  if (!n) return [];
  if (n.step === 'card') return [{ id: 'la-card', title: t(locale, 'leaf-area-board-card'), formula: 'S = a · b', numbers: `${n.a} · ${n.b} = ${n.S}` }];
  return [{ id: `la-palette:${i}`, title: t(locale, 'leaf-area-board-palette', { side: n.side }), formula: 'S ≈ (N + n/2) · s₀', numbers: `(${n.whole} + ${n.cut}/2) · ${n.square} ≈ ${n.S}` }];
}
