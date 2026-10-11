import type { AnyConnection, Connection } from '../../core/entity.js';
import { connectionId, entityId } from '../../core/ids.js';
import type {
  HeatTransferCoeff,
  Meters,
  SquareMeters,
  ThermalConductance,
  ThermalConductivity,
} from '../../core/units.js';
import { conductionConductance, convectionConductance } from './formulas.js';

export interface ThermalLinkParams {
  /** G, W/K. Precomputed from geometry/material so the solver stays trivial. */
  readonly conductance: ThermalConductance;
}
export type ThermalLink = Connection<'thermal', 'thermal.link', ThermalLinkParams>;

export const isThermalLink = (c: AnyConnection): c is ThermalLink =>
  c.domain === 'thermal' && c.kind === 'thermal.link';

interface LinkEnds {
  readonly id: string;
  /** Entity ids; thermal entities expose a single "surface" port. */
  readonly a: string;
  readonly b: string;
}

export function thermalLink(o: LinkEnds & ThermalLinkParams): ThermalLink {
  if (!(o.conductance >= 0) || !Number.isFinite(o.conductance)) {
    throw new RangeError(`conductance must be ≥ 0, got ${o.conductance}`);
  }
  return {
    id: connectionId(o.id),
    domain: 'thermal',
    kind: 'thermal.link',
    a: { entity: entityId(o.a), port: 'surface' },
    b: { entity: entityId(o.b), port: 'surface' },
    params: { conductance: o.conductance },
  };
}

/** Solid contact through a rod/wall: G = k·A/L. */
export const conductionLink = (
  o: LinkEnds & { readonly conductivity: ThermalConductivity; readonly area: SquareMeters; readonly length: Meters },
): ThermalLink => thermalLink({ ...o, conductance: conductionConductance(o.conductivity, o.area, o.length) });

/** Surface ↔ fluid (air, water): G = h·A. */
export const convectionLink = (
  o: LinkEnds & { readonly coefficient: HeatTransferCoeff; readonly area: SquareMeters },
): ThermalLink => thermalLink({ ...o, conductance: convectionConductance(o.coefficient, o.area) });
