import type { Solver } from '../../core/solver.js';
import { withEntities } from '../../core/state.js';
import type { AnyEntity } from '../../core/entity.js';
import { isBurner, isThermalBody } from '../thermal/entities.js';
import { cellReading } from './conductivity.js';
import { cellCurrentOhm, faradayMoles } from './formulas.js';
import { isSupply, type Supply } from './entities.js';

/** Current through the cell: I = (U − U_decomposition) / (R_liquid + R_inside), capped by the source. */
export function cellCurrent(voltage: number, decomposition: number, resistance: number, internal: number, limit: number): number {
  if (!(voltage - decomposition > 0) || !Number.isFinite(resistance)) return 0;
  return Math.min(limit, cellCurrentOhm(voltage, decomposition, resistance, internal));
}

/**
 * Electrolytic cells: every step reads the liquid (conductivity from composition
 * and temperature), finds the current, hands the Joule heat I²R to the thermal
 * domain (a driven source) and counts charge and the energy of electrolysis.
 * Runs before the thermal solver (operator splitting).
 */
export function createElectricalSolver(): Solver {
  return {
    name: 'electrical',
    assumptions: [],
    step(state, dt, ctx) {
      const trace = ctx?.trace;
      const updated: AnyEntity[] = [];
      for (const e of Object.values(state.entities)) {
        if (!isSupply(e)) continue;
        const body = state.entities[e.params.cell.body as never];
        const heat = state.entities[e.params.heatSource as never];
        if (!body || !isThermalBody(body) || !heat || !isBurner(heat)) continue;
        const reading = cellReading(body);
        const R = reading.conductivity > 0 ? e.params.cell.constant / reading.conductivity : Infinity;
        const Ud = reading.electrolysis?.voltage.value ?? Infinity;
        const depleted = e.params.capacity !== undefined && e.state.charge >= e.params.capacity;
        const I = e.params.on && !depleted ? cellCurrent(e.params.voltage, Ud, R, e.params.internalResistance, e.params.currentLimit) : 0;
        const joule = I > 0 ? I * I * R : 0;
        if (trace) {
          // What was computed, with the exact numbers — explanations are built from these records.
          const ids = [e.id, body.id];
          if (Number.isFinite(R)) trace.record({ kind: 'formula', formula: 'electrical.cell-resistance', entities: ids, args: [e.params.cell.constant, reading.conductivity], output: R });
          const ohm = Number.isFinite(R) && Number.isFinite(Ud) ? cellCurrentOhm(e.params.voltage, Ud, R, e.params.internalResistance) : undefined;
          // Recorded only when the source did not cap the current (then I is not Ohm's I).
          if (ohm !== undefined && I === ohm) trace.record({ kind: 'formula', formula: 'electrical.cell-current', entities: ids, args: [e.params.voltage, Ud, R, e.params.internalResistance], output: I });
          if (I > 0) {
            trace.record({ kind: 'formula', formula: 'electrical.joule-power', entities: ids, args: [I, R], output: joule });
            const z = reading.electrolysis!.cathode.electrons;
            trace.record({ kind: 'formula', formula: 'electrical.faraday-moles', entities: ids, args: [I * dt, z], output: faradayMoles(I * dt, z) });
          }
        }
        const chemical = I > 0 ? I * Ud : 0;
        const internal = I * I * e.params.internalResistance;
        const next: Supply = {
          ...e,
          state: {
            current: I,
            resistance: Number.isFinite(R) ? R : null,
            decomposition: Number.isFinite(Ud) ? Ud : 0,
            charge: e.state.charge + I * dt,
            delivered: e.state.delivered + (joule + chemical + internal) * dt,
            chemical: e.state.chemical + chemical * dt,
            internal: e.state.internal + internal * dt,
            time: e.state.time + (e.params.on ? dt : 0),
          },
        };
        updated.push(next, { ...heat, state: { ...heat.state, power: joule } });
      }
      return updated.length ? withEntities(state, updated) : state;
    },
  };
}
