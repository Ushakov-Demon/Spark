import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { cite, sv } from '../../components/sourced.js';
import { G } from '../../domains/mechanics/constants.js';
import { hydrostaticPressure } from '../../domains/mechanics/formulas.js';
import { msg } from '../../knowledge/messages.js';
import { SUBSTANCES } from '../../substances/catalog.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { SourcedValue } from '../../knowledge/types.js';

/**
 * The hydrostatic paradox (grade 7, «Тиск рідин»): Pascal's device — three glass vessels of different shapes
 * screwed in turn onto one stand; the stand's bottom is a rubber film joined by a tube to a U-tube manometer with
 * water. All three have the same bottom; water is poured from a measuring cylinder into each to the same height.
 * The water presses on the bottom with p = ρ·g·h whatever the shape (the walls take the rest of the weight, or push
 * down themselves), so the manometer shows the same Δh, while the water poured differs several times.
 * The film is taken as soft: it passes the pressure to the manometer's air unchanged.
 */

/** The vessels' common bottom (the stand's opening). */
export const VESSEL_BOTTOM: SourcedValue = sv(0.04, 'm', 'Pascal’s device, the opening', 'estimate', 0.2, [cite('spark', 'estimate', 'school Pascal’s devices have openings of a few centimetres', 0.04)], 'Estimate: the ruler measures it all the same.');
/** The width at the water's height (10 cm up): straight — as the bottom; widening up; narrowing up. */
export const VESSEL_TOPS = { straight: 0.04, wide: 0.08, narrow: 0.02 } as const;
export type PascalVessel = keyof typeof VESSEL_TOPS;
/** The measuring cylinder the water comes from: 500 mL, 5 mL marks. */
export const VESSELS_CYLINDER_DIVISION = 5e-6;
const MM = 0.001;
const RULER = 0.001;
/** The height the vessels' widths are given at. */
const REF = 0.1;

/** A truncated cone h high, from radius r below to R above: π·h·(r² + r·R + R²) / 3. */
const frustum = (h: number, r: number, R: number) => (Math.PI * h * (r * r + r * R + R * R)) / 3;

/** Measure the bottom; or screw on a vessel, pour water in to the height, read the cylinder and the manometer. */
export type VesselCommand = { readonly type: 'lab.vessel'; readonly step: 'bottom' } | { readonly type: 'lab.vessel'; readonly step: 'fill'; readonly shape: PascalVessel; readonly height: number };

export const vesselCommand: CommandHandler<VesselCommand> = {
  type: 'lab.vessel',
  apply(state, c) {
    const d = VESSEL_BOTTOM.value;
    if (c.step === 'bottom') {
      const r: MeasurementRecord = { kind: 'measurement', instrument: 'ruler', quantity: 'length', value: Math.round(d / RULER) * RULER, exact: d, entities: [], inputs: { division: RULER } };
      return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [r] });
    }
    if (!(c.height > 0 && c.height <= 0.12)) return err(msg('hydrostatic-paradox-vessel-command-apply'));
    const rho = SUBSTANCES.water.liquid.density.value;
    // The width at the water's surface: the walls straight (a cone's), from the bottom to the width 10 cm up.
    const top = d + ((VESSEL_TOPS[c.shape] - d) * c.height) / REF;
    const V = frustum(c.height, d / 2, top / 2);
    const p = hydrostaticPressure(rho, G, c.height);
    const dh = p / (rho * G);
    const which = { straight: 1, wide: 2, narrow: 3 }[c.shape];
    const volume: MeasurementRecord = { kind: 'measurement', instrument: 'cylinder', quantity: 'volume', value: Math.round(V / VESSELS_CYLINDER_DIVISION) * VESSELS_CYLINDER_DIVISION, exact: V, entities: [], inputs: { which, division: VESSELS_CYLINDER_DIVISION, rho, g: G, height: c.height } };
    const gauge: MeasurementRecord = { kind: 'measurement', instrument: 'manometer', quantity: 'length', value: Math.round(dh / MM) * MM, exact: dh, entities: [], inputs: { which, division: MM, pressure: p, rho, g: G, height: c.height } };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [volume, gauge] });
  },
};

export const VESSEL_COMMANDS = [vesselCommand] as const;

const NAME: Record<PascalVessel, LocalizedText> = {
  straight: msg('hydrostatic-paradox-name-straight'),
  wide: msg('hydrostatic-paradox-name-wide'),
  narrow: msg('hydrostatic-paradox-name-narrow'),
};
const SHORT: Record<PascalVessel, LocalizedText> = {
  straight: msg('hydrostatic-paradox-short-straight'),
  wide: msg('hydrostatic-paradox-short-wide'),
  narrow: msg('hydrostatic-paradox-short-narrow'),
};
export const vesselName = (s: PascalVessel): LocalizedText => SHORT[s];

export const VESSEL_TEXT: Record<VesselCommand['type'], (c: VesselCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.vessel': (x) => {
    const c = x as VesselCommand;
    if (c.step === 'bottom')
      return {
        say: msg('hydrostatic-paradox-labvessel-say'),
        button: msg('hydrostatic-paradox-labvessel-button'),
        plan: msg('hydrostatic-paradox-labvessel-plan'),
      };
    const cm = Math.round(c.height * 100);
    return {
      say: msg('hydrostatic-paradox-labvessel-say-2', { NAME: (l: Locale) => NAME[c.shape][l], cm: String(cm) }),
      button: msg('hydrostatic-paradox-labvessel-button-2', { SHORT: (l: Locale) => SHORT[c.shape][l][0]!.toUpperCase(), SHORT2: (l: Locale) => SHORT[c.shape][l].slice(1), cm: String(cm) }),
      plan: msg('hydrostatic-paradox-fill-plan', { cm: String(cm), shape: c.shape, short: (l: Locale) => SHORT[c.shape][l] }),
    };
  },
};
