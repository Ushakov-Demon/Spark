import type { AnyEntity } from '../../core/entity.js';
import type { EntityId } from '../../core/ids.js';
import type { Solver, StepContext } from '../../core/solver.js';
import { withEntities, type SystemState } from '../../core/state.js';
import { joules, kelvin, seconds, ZERO_CELSIUS_IN_KELVIN, type Seconds } from '../../core/units.js';
import { THERMAL_ASSUMPTIONS } from './assumptions.js';
import { isBurner, isHeater, isReservoir, isThermalEntity, temperatureOf, type Burner, type ThermalEntity } from './entities.js';
import { isSupplyLink, isThermalLink, type SupplyLink, type ThermalLink } from './links.js';

/**
 * Lumped thermal network solver.
 *
 * Each thermal entity i is a node with heat capacity C_i (∞ for reservoirs),
 * temperature T_i and internal source P_i. Each link is a conductance G_ij.
 *
 *     C_i · dT_i/dt = P_i + Σ_j G_ij · (T_j − T_i)
 *
 * Integrated with explicit Euler + automatic sub-stepping. Explicit Euler is
 * stable only for h < C_i / Σ_j G_ij, so we pick the number of sub-steps from
 * the stiffest node. Because each link moves exactly +q to one node and −q to
 * the other, energy is conserved to floating-point precision regardless of dt.
 */
export interface ThermalSolverOptions {
  /** Fraction of the stability limit used as the sub-step (0 < s ≤ 1). */
  readonly stabilitySafety?: number;
  /** Guard against pathological scenes (1 g of copper glued to a heat sink). */
  readonly maxSubsteps?: number;
}

interface Node {
  readonly entity: ThermalEntity;
  readonly capacity: number; // J/K, Infinity for reservoirs
  readonly power: number; // W — own heater power
  supplied: number; // W — what burners hand to this node
  temperature: number; // K, mutated only inside this local working copy
  sumG: number; // W/K
  reservoirHeat: number; // J absorbed during this tick
}

interface Edge {
  readonly a: number;
  readonly b: number;
  readonly g: number;
  readonly link: ThermalLink;
  /** Net energy a → b during this step (only tracked when tracing). */
  moved: number;
}

export class ThermalSolverError extends Error {
  override readonly name = 'ThermalSolverError';
}

export function createThermalSolver(options: ThermalSolverOptions = {}): Solver {
  const safety = options.stabilitySafety ?? 0.5;
  const maxSubsteps = options.maxSubsteps ?? 100_000;
  if (!(safety > 0 && safety <= 1)) throw new RangeError('stabilitySafety must be in (0, 1]');

  return {
    name: 'thermal',
    assumptions: THERMAL_ASSUMPTIONS,
    step(state: SystemState, dt: Seconds, ctx?: StepContext): SystemState {
      const trace = ctx?.trace;
      // 1. Build working copies of nodes (never touch the input state).
      const nodes: Node[] = [];
      const index = new Map<string, number>();
      for (const e of Object.values(state.entities)) {
        if (!isThermalEntity(e)) continue;
        index.set(e.id, nodes.length);
        nodes.push({
          entity: e,
          capacity: isReservoir(e) ? Infinity : e.params.mass * e.params.specificHeat,
          power: isHeater(e) && e.params.on ? e.params.power : 0,
          supplied: 0,
          temperature: temperatureOf(e),
          sumG: 0,
          reservoirHeat: 0,
        });
      }
      if (nodes.length === 0) return state;

      // 1b. Burners hand their power to bodies along supply links (constant over the step).
      const supplies: { link: SupplyLink; burner: Burner; target: number; power: number }[] = [];
      const burners: Burner[] = [];
      for (const e of Object.values(state.entities)) if (isBurner(e)) burners.push(e);
      for (const c of state.connections) {
        if (!isSupplyLink(c)) continue;
        const b = state.entities[c.a.entity];
        const target = index.get(c.b.entity);
        if (!b || !isBurner(b) || target === undefined) continue;
        const power = b.params.on ? b.params.power * c.params.share : 0;
        nodes[target]!.supplied += power;
        supplies.push({ link: c, burner: b, target, power });
      }

      // 2. Edges. Dangling links are reported by validateState(), the solver just skips them.
      const edges: Edge[] = [];
      for (const c of state.connections) {
        if (!isThermalLink(c)) continue;
        const a = index.get(c.a.entity);
        const b = index.get(c.b.entity);
        if (a === undefined || b === undefined || a === b || c.params.conductance === 0) continue;
        edges.push({ a, b, g: c.params.conductance, link: c, moved: 0 });
        nodes[a]!.sumG += c.params.conductance;
        nodes[b]!.sumG += c.params.conductance;
      }

      // 3. Choose sub-step from the stiffest finite node.
      let minTau = Infinity;
      for (const n of nodes) {
        if (Number.isFinite(n.capacity) && n.sumG > 0) minTau = Math.min(minTau, n.capacity / n.sumG);
      }
      const substeps = Math.max(1, Math.ceil(dt / (safety * minTau)));
      if (substeps > maxSubsteps) {
        throw new ThermalSolverError(
          `Scene too stiff: needs ${substeps} sub-steps (limit ${maxSubsteps}). ` +
            `Reduce dt or increase the mass of small objects.`,
        );
      }
      const h = dt / substeps;

      // 4. Integrate. `received`/`given` are only needed for the trace.
      const t0 = trace ? nodes.map((n) => n.temperature) : [];
      const received = new Float64Array(nodes.length);
      const given = new Float64Array(nodes.length);
      const flow = new Float64Array(nodes.length);
      for (let s = 0; s < substeps; s++) {
        flow.fill(0);
        for (const edge of edges) {
          const { a, b, g } = edge;
          const q = g * (nodes[a]!.temperature - nodes[b]!.temperature); // W, a → b
          flow[a]! -= q;
          flow[b]! += q;
          if (trace) {
            edge.moved += q * h;
            const [from, to] = q >= 0 ? [a, b] : [b, a];
            given[from]! += Math.abs(q) * h;
            received[to]! += Math.abs(q) * h;
          }
        }
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i]!;
          const net = flow[i]! + n.power + n.supplied;
          if (trace) received[i]! += (n.power + n.supplied) * h;
          if (Number.isFinite(n.capacity)) n.temperature += (net * h) / n.capacity;
          else n.reservoirHeat += net * h;
        }
      }

      if (trace) {
        traceStep(trace, nodes, edges, t0, received, given, dt, substeps);
        for (const s of supplies) {
          trace.record({ kind: 'transfer', connection: s.link.id, a: s.burner.id, b: nodes[s.target]!.entity.id, quantity: 'energy', amount: s.power * dt });
        }
        for (const b of burners) {
          if (b.params.on && b.params.power > 0) {
            trace.record({ kind: 'formula', formula: 'thermal.energy-from-power', entities: [b.id], args: [b.params.power, seconds(dt)], output: b.params.power * dt });
          }
        }
      }

      // 5. Write back immutably.
      const updated: AnyEntity[] = nodes.map((n): ThermalEntity => {
        const e = n.entity;
        if (isReservoir(e)) {
          return { ...e, state: { heatAbsorbed: joules(e.state.heatAbsorbed + n.reservoirHeat) } };
        }
        const temperature = kelvin(n.temperature);
        if (isHeater(e)) {
          return {
            ...e,
            state: { temperature, energyDelivered: joules(e.state.energyDelivered + n.power * dt) },
          };
        }
        return { ...e, state: { temperature } };
      });
      for (const b of burners) {
        const p = b.params.on ? b.params.power : 0;
        updated.push({ ...b, state: { energyDelivered: joules(b.state.energyDelivered + p * dt) } });
      }
      return withEntities(state, updated);
    },
  };
}

/** Reports what this step computed, in terms of catalog formulas (see catalog.ts). */
function traceStep(
  trace: NonNullable<StepContext['trace']>,
  nodes: readonly Node[],
  edges: readonly Edge[],
  t0: readonly number[],
  received: Float64Array,
  given: Float64Array,
  dt: number,
  substeps: number,
): void {
  const id = (i: number): EntityId => nodes[i]!.entity.id;
  trace.record({ kind: 'numerics', solver: 'thermal', method: 'explicit-euler', dt, substeps });

  for (const { a, b, g, link, moved } of edges) {
    trace.record({ kind: 'transfer', connection: link.id, a: id(a), b: id(b), quantity: 'energy', amount: moved });
    const o = link.params.origin;
    if (o?.type === 'convection') {
      trace.record({ kind: 'formula', formula: 'thermal.convection-conductance', entities: [id(a), id(b)], args: [o.coefficient, o.area], output: g });
    } else if (o?.type === 'wall') {
      const gWall = (o.conductivity * o.area) / o.thickness;
      const gConv = o.coefficient * o.area;
      trace.record({ kind: 'formula', formula: 'thermal.conduction-conductance', entities: [id(a), id(b)], args: [o.conductivity, o.area, o.thickness], output: gWall });
      trace.record({ kind: 'formula', formula: 'thermal.convection-conductance', entities: [id(a), id(b)], args: [o.coefficient, o.area], output: gConv });
      trace.record({ kind: 'formula', formula: 'thermal.series-conductance', entities: [id(a), id(b)], args: [gWall, gConv], output: g });
    } else if (o?.type === 'conduction') {
      trace.record({ kind: 'formula', formula: 'thermal.conduction-conductance', entities: [id(a), id(b)], args: [o.conductivity, o.area, o.length], output: g });
    }
    // Instantaneous flow at the start of the step.
    trace.record({ kind: 'formula', formula: 'thermal.heat-flow', entities: [id(a), id(b)], args: [g, t0[a], t0[b]], output: g * (t0[a]! - t0[b]!) });
  }

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]!;
    if (n.power > 0) {
      trace.record({ kind: 'formula', formula: 'thermal.energy-from-power', entities: [id(i)], args: [n.power, seconds(dt)], output: n.power * dt });
    }
    if (!Number.isFinite(n.capacity)) continue;
    const e = n.entity as Exclude<ThermalEntity, { kind: 'thermal.reservoir' }>;
    trace.record({ kind: 'formula', formula: 'thermal.energy-balance', entities: [id(i)], args: [received[i]!, given[i]!], output: received[i]! - given[i]! });
    const dT = n.temperature - t0[i]!;
    trace.record({
      kind: 'formula',
      formula: 'thermal.heat-for-temperature-change',
      entities: [id(i)],
      args: [e.params.mass, e.params.specificHeat, dT],
      output: e.params.mass * e.params.specificHeat * dT,
    });
  }
}

/**
 * Reference point for internal energy: 0 °C. The choice is arbitrary (only
 * differences are physical) but must be the same everywhere, including the
 * energy that poured matter brings in (see commands.ts).
 */
export const ENERGY_REFERENCE_TEMPERATURE = ZERO_CELSIUS_IN_KELVIN;

/**
 * Total internal energy of all finite thermal bodies relative to 0 °C, J.
 * Used by tests and by the "energy balance" panel.
 */
export function thermalEnergy(state: SystemState): number {
  let u = 0;
  for (const e of Object.values(state.entities)) {
    if (isThermalEntity(e) && !isReservoir(e)) {
      u += e.params.mass * e.params.specificHeat * (e.state.temperature - ENERGY_REFERENCE_TEMPERATURE);
    }
  }
  return u;
}
