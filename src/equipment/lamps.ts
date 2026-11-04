import { cite, sv } from '../components/sourced.js';
import type { SourcedValue } from '../knowledge/types.js';

/**
 * Household lamps by the light they give for their power: luminous efficacy η, lm/W (the luminous flux Φ = η·P is
 * the optics domain's). A filament lamp's efficacy grows with its power (a hotter filament); between the powers the
 * table gives it is taken on a straight line, beyond them — the nearest value.
 */
export type LampKind = 'incandescent' | 'led';

const EFFICACY = 'wikipedia-luminous-efficacy';
const filament = (power: number, value: number): { readonly power: number; readonly efficacy: SourcedValue } => ({
  power,
  efficacy: sv(value, 'lm/W', `a ${power} W tungsten incandescent lamp, 230 V`, 'single-source', 0.1, [cite(EFFICACY, 'Lighting efficiency, Examples', `${power} W tungsten incandescent (230 V)`, value)], 'The table’s overall luminous efficacy.'),
});
/** A filament lamp: its efficacy at 15, 40 and 100 W. */
export const INCANDESCENT_EFFICACY = [filament(15, 8.0), filament(40, 10.4), filament(100, 13.8)] as const;
/** An LED lamp with a screw base: about the same at any power. */
export const LED_EFFICACY: SourcedValue = sv(102, 'lm/W', 'an LED lamp with a screw base', 'single-source', 0.3, [cite(EFFICACY, 'Lighting efficiency, Examples', 'LED screw base lamp (120 V): 102; 5–16 W LED screw base lamp (230 V): 75–217', 102)], 'One lamp’s figure; 230 V LED lamps of 5–16 W range over 75–217 lm/W.');

/** The efficacy of a lamp of this kind and power, lm/W. */
export function lampEfficacy(kind: LampKind, power: number): number {
  if (kind === 'led') return LED_EFFICACY.value;
  const pts = INCANDESCENT_EFFICACY;
  if (power <= pts[0].power) return pts[0].efficacy.value;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    if (power <= b.power) return a.efficacy.value + ((b.efficacy.value - a.efficacy.value) * (power - a.power)) / (b.power - a.power);
  }
  return pts[pts.length - 1]!.efficacy.value;
}
