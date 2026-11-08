import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { BULK_TEXT, type BulkCommand } from './bench.js';
import { BULK_NAME, type BulkSubstance } from './shared.js';

export const text = (c: BulkCommand): StepText => BULK_TEXT['lab.bulk'](c);

/** Pouring the grains, pouring the liquid in, shaking: each moves. */
export const busy = (c: BulkCommand): LocalizedText => (c.step === 'pour' ? msg('bulk-density-busy-pour') : c.step === 'fill' ? msg('bulk-density-busy-fill') : msg('bulk-density-busy-shake'));

export const gcm3 = (rho: number, l: Locale): string => `${sig(rho / 1000, 3, l)} ${t(l, 'unit-sym-g-per-cm3')}`;
const mL = (V: number, l: Locale) => formatMeasured('volume', V, 1e-6, l);
const g = (m: number, l: Locale) => formatMeasured('mass', m, 1e-5, l);
/** The substance's everyday name in the page's language, as within a sentence. */
export const nameOf = (s: string, l: Locale): string => t(l, BULK_NAME[s as BulkSubstance] ?? BULK_NAME['sodium-chloride']).replace(/^./, (x) => x.toLowerCase());

export function shown(c: BulkCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (!r || r.value === null) return '';
  const inp = r.inputs ?? {};
  if (c.step === 'pour') return `m = ${g(r.value, locale)}; ρ_н ≈ ${gcm3(inp['bulk'] ?? 0, locale)}`;
  if (c.step === 'shake') return `V = ${mL(r.value, locale)}; ρ_н ≈ ${gcm3(inp['bulk'] ?? 0, locale)}`;
  return `V_р = ${mL(r.value, locale)}; ρ ≈ ${gcm3(inp['density'] ?? 0, locale)}`;
}

/** What the Professor says when it is done. */
export function say(c: BulkCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (!r || r.value === null) return '';
  const inp = r.inputs ?? {};
  if (c.step === 'pour') return t(locale, 'bulk-density-say-pour', { m: g(r.value, locale), V: mL(inp['volume'] ?? 0, locale), rho: gcm3(inp['bulk'] ?? 0, locale) });
  if (c.step === 'shake') return t(locale, 'bulk-density-say-shake', { V: mL(r.value, locale), rho: gcm3(inp['bulk'] ?? 0, locale) });
  return t(locale, 'bulk-density-say-fill', { liquid: inp['oil'] ? 'oil' : 'water', Vl: mL(r.value, locale), Vg: mL(inp['grains'] ?? 0, locale), rho: gcm3(inp['density'] ?? 0, locale), table: gcm3(inp['table'] ?? 0, locale) });
}

/** The board: the bulk density m / V; the grains' own volume V − V_р and their density m / (V − V_р); shaken — denser. */
export function board(c: BulkCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const r = trace[0];
  if (!r || r.value === null) return [];
  const inp = r.inputs ?? {};
  const what = nameOf(c.substance, locale);
  if (c.step === 'pour') return [{ id: `bb:${i}`, title: t(locale, 'bulk-density-board-bulk', { what }), formula: 'ρ_н = m / V', numbers: `${g(r.value, locale)} / ${mL(inp['volume'] ?? 0, locale)} ≈ ${gcm3(inp['bulk'] ?? 0, locale)}` }];
  if (c.step === 'shake') return [{ id: `bs:${i}`, title: t(locale, 'bulk-density-board-shaken', { what }), formula: 'ρ_н = m / V', numbers: `${g(inp['mass'] ?? 0, locale)} / ${mL(r.value, locale)} ≈ ${gcm3(inp['bulk'] ?? 0, locale)}` }];
  return [
    { id: `bg:${i}`, title: t(locale, 'bulk-density-board-grains', { what }), formula: 'V_кр = V − V_р', numbers: `${mL(inp['poured'] ?? 0, locale)} − ${mL(r.value, locale)} = ${mL(inp['grains'] ?? 0, locale)}` },
    { id: `bd:${i}`, title: t(locale, 'bulk-density-board-density', { what }), formula: 'ρ = m / V_кр', numbers: `${g(inp['mass'] ?? 0, locale)} / ${mL(inp['grains'] ?? 0, locale)} ≈ ${gcm3(inp['density'] ?? 0, locale)}` },
  ];
}
