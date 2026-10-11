import type { Device } from '../../core/entity.js';
import { entityId } from '../../core/ids.js';
import { ORIGIN } from '../../core/math/vec2.js';
import type { AnyEntity } from '../../core/entity.js';
import type { LocalizedText } from '../../knowledge/i18n.js';

/**
 * A source of direct current with two electrodes dipped into a liquid (an
 * electrolytic cell). The liquid is a thermal body; its conductivity and the
 * electrode geometry give the resistance, the heat of the current goes into the
 * liquid through a driven thermal source.
 */
export interface SupplyParams {
  /** Set output voltage (EMF for a battery), V. */
  readonly voltage: number;
  /** The most current it gives, A. */
  readonly currentLimit: number;
  /** Resistance inside the source, Ω. */
  readonly internalResistance: number;
  /** Charge it holds, C (a battery); absent — unlimited. */
  readonly capacity?: number;
  readonly on: boolean;
  /** Catalog id (see equipment/supplies.ts). */
  readonly device?: string;
  /** The liquid between the electrodes and the cell constant L / A, 1/m. */
  readonly cell: { readonly body: string; readonly constant: number };
  /** The thermal source that carries the Joule heat into the liquid. */
  readonly heatSource: string;
}

export interface SupplyState {
  /** Current right now, A. */
  readonly current: number;
  /** Resistance of the liquid between the electrodes, Ω; null — it does not conduct. */
  readonly resistance: number | null;
  /** Minimum voltage the electrolysis needs, V (counter-voltage of the cell). */
  readonly decomposition: number;
  /** Charge passed so far, C (gases follow from it by Faraday's law). */
  readonly charge: number;
  /** Energy the source gave, J = Joule heat in the liquid + chemistry + heat inside the source. */
  readonly delivered: number;
  /** Energy stored in the products of electrolysis (the gases), J. */
  readonly chemical: number;
  /** Heat released inside the source (battery), J. */
  readonly internal: number;
  /** How long the current has been switched on in this step, s (a protocol step restarts it). */
  readonly time: number;
}

export type Supply = Device<'electrical.supply', SupplyParams, SupplyState, 'plus' | 'minus'>;

export const isSupply = (e: AnyEntity): e is Supply => e.kind === 'electrical.supply';

export function supply(o: { readonly id: string; readonly label?: LocalizedText } & Omit<SupplyParams, 'on'> & { readonly on?: boolean }): Supply {
  if (!(o.voltage >= 0)) throw new RangeError(`voltage must be ≥ 0, got ${o.voltage}`);
  if (!(o.currentLimit > 0)) throw new RangeError(`current limit must be > 0, got ${o.currentLimit}`);
  if (!(o.cell.constant > 0)) throw new RangeError(`cell constant must be > 0, got ${o.cell.constant}`);
  const { id, label, on, ...params } = o;
  return {
    id: entityId(id),
    kind: 'electrical.supply',
    ...(label === undefined ? {} : { label }),
    transform: { position: ORIGIN, rotation: 0 },
    ports: [
      { name: 'plus', domain: 'electrical' },
      { name: 'minus', domain: 'electrical' },
    ],
    params: { ...params, on: on ?? true },
    state: { current: 0, resistance: null, decomposition: 0, charge: 0, delivered: 0, chemical: 0, internal: 0, time: 0 },
  };
}
