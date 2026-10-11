import type { SystemState } from '../../core/state.js';
import { bodyEnergy, isBurner, isHeater, isReservoir, isThermalBody } from './entities.js';

export interface EnergyShare {
  readonly entity: string;
  /**
   * 'body' — stored in this body (warming, melting); 'source' — stayed in the hot heater;
   * 'room' — absorbed by the surroundings (incl. vapour that evaporated into them);
   * 'vapour' — carried away by vapour that boiled off.
   */
  readonly role: 'body' | 'source' | 'room' | 'vapour';
  readonly energy: number; // J, since `initial`
}

export interface EnergySplit {
  /** Energy produced by all heaters and flames, J. */
  readonly produced: number;
  readonly shares: readonly EnergyShare[];
  /** produced − Σ shares (≈ 0 unless commands added or removed energy). */
  readonly residual: number;
}

/**
 * "Where did the energy go?" between two states of the same scene. Uses the
 * energy each body stores (latent heat included) and what vapour carried away.
 */
export function energySplit(initial: SystemState, final: SystemState): EnergySplit {
  let produced = 0;
  const shares: EnergyShare[] = [];
  for (const e of Object.values(final.entities)) {
    const e0 = initial.entities[e.id];
    if (!e0) continue;
    if (isHeater(e) && isHeater(e0)) {
      produced += e.state.energyDelivered - e0.state.energyDelivered;
      shares.push({ entity: e.id, role: 'source', energy: bodyEnergy(e) - bodyEnergy(e0) });
    } else if (isBurner(e) && isBurner(e0)) {
      produced += e.state.energyDelivered - e0.state.energyDelivered;
    } else if (isThermalBody(e) && isThermalBody(e0)) {
      shares.push({ entity: e.id, role: 'body', energy: bodyEnergy(e) - bodyEnergy(e0) });
      const vapour = (e.state.vaporEnergy ?? 0) - (e0.state.vaporEnergy ?? 0);
      if (vapour !== 0) shares.push({ entity: e.id, role: 'vapour', energy: vapour });
    } else if (isReservoir(e) && isReservoir(e0)) {
      shares.push({ entity: e.id, role: 'room', energy: e.state.heatAbsorbed - e0.state.heatAbsorbed });
    }
  }
  const residual = produced - shares.reduce((sum, s) => sum + s.energy, 0);
  return { produced, shares, residual };
}
