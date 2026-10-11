import type { SystemState } from '../../core/state.js';
import { isBurner, isHeater, isReservoir, isThermalBody } from './entities.js';

export interface EnergyShare {
  readonly entity: string;
  /** 'body' — warmed this body; 'source' — stayed in the (hot) heater; 'room' — lost to the surroundings. */
  readonly role: 'body' | 'source' | 'room';
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
 * "Where did the energy go?" between two states of the same scene: how much
 * each body stored, how much stayed in heaters, how much the room absorbed.
 * Assumes masses did not change (no pouring) — the lab UIs use it for heating.
 */
export function energySplit(initial: SystemState, final: SystemState): EnergySplit {
  let produced = 0;
  const shares: EnergyShare[] = [];
  for (const e of Object.values(final.entities)) {
    const e0 = initial.entities[e.id];
    if (!e0) continue;
    if (isHeater(e) && isHeater(e0)) {
      produced += e.state.energyDelivered - e0.state.energyDelivered;
      shares.push({ entity: e.id, role: 'source', energy: e.params.mass * e.params.specificHeat * (e.state.temperature - e0.state.temperature) });
    } else if (isBurner(e) && isBurner(e0)) {
      produced += e.state.energyDelivered - e0.state.energyDelivered;
    } else if (isThermalBody(e) && isThermalBody(e0)) {
      shares.push({ entity: e.id, role: 'body', energy: e.params.mass * e.params.specificHeat * (e.state.temperature - e0.state.temperature) });
    } else if (isReservoir(e) && isReservoir(e0)) {
      shares.push({ entity: e.id, role: 'room', energy: e.state.heatAbsorbed - e0.state.heatAbsorbed });
    }
  }
  const residual = produced - shares.reduce((sum, s) => sum + s.energy, 0);
  return { produced, shares, residual };
}
