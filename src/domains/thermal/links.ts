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

/** How G was obtained — lets the trace show the law behind each link. */
export type ThermalLinkOrigin =
  | { readonly type: 'conduction'; readonly conductivity: ThermalConductivity; readonly area: SquareMeters; readonly length: Meters; readonly dataRef?: string }
  | { readonly type: 'convection'; readonly coefficient: HeatTransferCoeff; readonly area: SquareMeters; readonly dataRef?: string };

export interface ThermalLinkParams {
  /** G, W/K. Precomputed from geometry/material so the solver stays trivial. */
  readonly conductance: ThermalConductance;
  readonly origin?: ThermalLinkOrigin;
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

export function thermalLink(o: LinkEnds & { readonly conductance: ThermalConductance; readonly origin?: ThermalLinkOrigin }): ThermalLink {
  if (!(o.conductance >= 0) || !Number.isFinite(o.conductance)) {
    throw new RangeError(`conductance must be ≥ 0, got ${o.conductance}`);
  }
  return {
    id: connectionId(o.id),
    domain: 'thermal',
    kind: 'thermal.link',
    a: { entity: entityId(o.a), port: 'surface' },
    b: { entity: entityId(o.b), port: 'surface' },
    params: { conductance: o.conductance, ...(o.origin === undefined ? {} : { origin: o.origin }) },
  };
}

const ref = (r: string | undefined): { dataRef?: string } => (r === undefined ? {} : { dataRef: r });

/** Solid contact through a rod/wall: G = k·A/L. `dataRef` = MATERIALS key of k. */
export const conductionLink = (
  o: LinkEnds & { readonly conductivity: ThermalConductivity; readonly area: SquareMeters; readonly length: Meters; readonly dataRef?: string },
): ThermalLink =>
  thermalLink({
    id: o.id,
    a: o.a,
    b: o.b,
    conductance: conductionConductance(o.conductivity, o.area, o.length),
    origin: { type: 'conduction', conductivity: o.conductivity, area: o.area, length: o.length, ...ref(o.dataRef) },
  });

/** Surface ↔ fluid (air, water): G = h·A. `dataRef` = CONVECTION key of h. */
export const convectionLink = (
  o: LinkEnds & { readonly coefficient: HeatTransferCoeff; readonly area: SquareMeters; readonly dataRef?: string },
): ThermalLink =>
  thermalLink({
    id: o.id,
    a: o.a,
    b: o.b,
    conductance: convectionConductance(o.coefficient, o.area),
    origin: { type: 'convection', coefficient: o.coefficient, area: o.area, ...ref(o.dataRef) },
  });
