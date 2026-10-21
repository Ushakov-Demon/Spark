import type { Solver } from '../../core/solver.js';
import { withEntities } from '../../core/state.js';
import type { AnyEntity } from '../../core/entity.js';
import { isBurner, isThermalBody } from '../thermal/entities.js';
import { cellReading } from './conductivity.js';
import { cellCurrentOhm, faradayMoles } from './formulas.js';
import { isSupply, type Supply } from './entities.js';
import { bipolarCurrent, cellReaction, reactionMoles, type CellReaction } from './electrochem.js';
import { bodyMass, type ThermalBody } from '../thermal/entities.js';
import { SUBSTANCES, type SubstanceId } from '../../substances/catalog.js';
import type { SystemState } from '../../core/state.js';

/** Metal bodies lying in the cell's liquid that can react as bipolar electrodes: their size and reaction. */
function bipolarPieces(state: SystemState, body: ThermalBody, liquid: NonNullable<ReturnType<typeof cellReading>['electrolysis']>): { id: string; size: number; reaction: CellReaction }[] {
  const out: { id: string; size: number; reaction: CellReaction }[] = [];
  for (const e of Object.values(state.entities)) {
    if (!isThermalBody(e) || !e.id.startsWith(`${body.id}+`)) continue;
    const sub = 'substance' in e.params && e.params.substance ? SUBSTANCES[e.params.substance as SubstanceId] : undefined;
    if (!sub?.component) continue;
    const r = cellReaction(liquid, sub.component);
    if (r.anode.dissolves !== true) continue;
    out.push({ id: e.id, size: Math.cbrt(bodyMass(e) / sub.liquid.density.value), reaction: r });
  }
  return out;
}
const addMade = (made: Record<string, number>, key: string, moles: number) => {
  if (moles > 0) made[key] = (made[key] ?? 0) + moles;
};

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
        // What the current does here: the liquid's electrolysis, with this anode (a steel one dissolves).
        const reaction = reading.electrolysis ? cellReaction(reading.electrolysis, e.params.electrodes?.material) : undefined;
        const Ud = reaction?.voltage ?? Infinity;
        const depleted = e.params.capacity !== undefined && e.state.charge >= e.params.capacity;
        const I = e.params.on && !depleted ? cellCurrent(e.params.voltage, Ud, R, e.params.internalResistance, e.params.currentLimit) : 0;
        let joule = I > 0 ? I * I * R : 0;
        // Faraday at each electrode, step by step (the reaction may change: salt dissolves, ice melts).
        const made: Record<string, number> = { ...(e.state.made ?? {}) };
        let bipolarChemical = 0;
        if (I > 0 && reaction) {
          const n = reactionMoles(reaction, I * dt);
          addMade(made, reaction.cathode.component, n.cathode);
          addMade(made, reaction.anode.dissolves ? `-${reaction.anode.component}` : reaction.anode.component, n.anode);
          if (reaction.precipitate) addMade(made, reaction.precipitate, n.precipitate);
          // Metal lying in the liquid: part of the current goes through it where the field drops enough voltage along it.
          const el = e.params.electrodes;
          if (el && reading.electrolysis) {
            for (const piece of bipolarPieces(state, body, reading.electrolysis)) {
              const drop = I * R * Math.min(1, piece.size / el.gap);
              const Ip = bipolarCurrent(I, drop, piece.reaction.voltage, (piece.size * piece.size) / (el.width * el.height));
              if (!(Ip > 0)) continue;
              const m = reactionMoles(piece.reaction, Ip * dt);
              addMade(made, `${piece.id}|${piece.reaction.cathode.component}`, m.cathode);
              addMade(made, `${piece.id}|-${piece.reaction.anode.component}`, m.anode);
              if (piece.reaction.precipitate) addMade(made, `${piece.id}|${piece.reaction.precipitate}`, m.precipitate);
              // Its reactions take part of the voltage the liquid would otherwise turn into heat.
              bipolarChemical += Ip * piece.reaction.voltage;
            }
          }
          joule = Math.max(0, joule - bipolarChemical);
        }
        if (trace) {
          // What was computed, with the exact numbers — explanations are built from these records.
          const ids = [e.id, body.id];
          if (Number.isFinite(R)) trace.record({ kind: 'formula', formula: 'electrical.cell-resistance', entities: ids, args: [e.params.cell.constant, reading.conductivity], output: R });
          const ohm = Number.isFinite(R) && Number.isFinite(Ud) ? cellCurrentOhm(e.params.voltage, Ud, R, e.params.internalResistance) : undefined;
          // Recorded only when the source did not cap the current (then I is not Ohm's I).
          if (ohm !== undefined && I === ohm) trace.record({ kind: 'formula', formula: 'electrical.cell-current', entities: ids, args: [e.params.voltage, Ud, R, e.params.internalResistance], output: I });
          if (I > 0) {
            trace.record({ kind: 'formula', formula: 'electrical.joule-power', entities: ids, args: [I, R], output: joule });
            const z = reaction!.cathode.electrons;
            trace.record({ kind: 'formula', formula: 'electrical.faraday-moles', entities: ids, args: [I * dt, z], output: faradayMoles(I * dt, z) });
          }
        }
        const chemical = I > 0 ? I * Ud + bipolarChemical : 0;
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
            ...(Object.keys(made).length ? { made } : {}),
          },
        };
        updated.push(next, { ...heat, state: { ...heat.state, power: joule } });
      }
      return updated.length ? withEntities(state, updated) : state;
    },
  };
}
