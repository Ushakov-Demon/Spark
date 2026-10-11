import type { AnyEntity } from '../../core/entity.js';
import type { EntityId } from '../../core/ids.js';
import type { Solver, StepContext } from '../../core/solver.js';
import { withEntities, type SystemState } from '../../core/state.js';
import { joules, kelvin, seconds, ZERO_CELSIUS_IN_KELVIN, type Seconds } from '../../core/units.js';
import { THERMAL_ASSUMPTIONS } from './assumptions.js';
import {
  bodyEnergy,
  bodyMass,
  isBurner,
  isHeater,
  isReservoir,
  isThermalBody,
  isThermalEntity,
  isThermostat,
  temperatureOf,
  type Burner,
  type Heater,
  type ThermalBody,
  type ThermalEntity,
  type Thermostat,
} from './entities.js';
import { isSupplyLink, isThermalLink, type SupplyLink, type ThermalLink } from './links.js';
import { decodeEnthalpy, specificHeatAt, type PhaseParams } from './phase.js';
import { latentAt, massTransferCoefficient, saturationDensity, saturationPressure, type EvaporationParams } from './evaporation.js';
import { decodeMixture, equilibriumAt, MIXTURE_CONSTANTS, mixtureBoilingPoint, mixtureEnthalpy, mixtureHeatCapacity, waterMoleFraction, type MixtureAmounts } from './mixture.js';

/**
 * Lumped thermal network solver.
 *
 * Each body i stores energy E_i; its temperature follows from E_i (with phase
 * changes, see phase.ts). Reservoirs have a fixed temperature. Links carry
 *
 *     P_ij = G_ij · (T_i − T_j)
 *
 * Integrated with explicit Euler + automatic sub-stepping (stable for
 * h < C_i / Σ_j G_ij). Each link moves exactly +q to one node and −q to the
 * other, and vapour leaving a boiling body takes its energy along, so energy is
 * conserved to floating-point precision.
 */
export interface ThermalSolverOptions {
  /** Fraction of the stability limit used as the sub-step (0 < s ≤ 1). */
  readonly stabilitySafety?: number;
  /** Guard against pathological scenes (1 g of copper glued to a heat sink). */
  readonly maxSubsteps?: number;
}

interface Node {
  readonly entity: ThermalEntity;
  readonly finite: boolean;
  readonly cLiquid: number;
  readonly phase: PhaseParams | undefined;
  readonly evaporation: EvaporationParams | undefined;
  /** Air reservoirs: relative humidity (water vapour already in the air). */
  readonly humidity: number;
  /** Water + salt bodies: current composition (water leaves as vapour, ice and crystals come and go). */
  mix: MixtureAmounts | undefined;
  /** Current mass (shrinks while boiling). */
  mass: number;
  /** Stored energy, J (finite nodes). */
  energy: number;
  temperature: number;
  solidFraction: number;
  readonly power: number; // W — own heater power (after the thermostat)
  supplied: number; // W — what burners hand to this node
  sumG: number; // W/K
  reservoirHeat: number; // J absorbed during this tick
  /** This tick: mass boiled away, energy it carried, latent heat of melting (+) / freezing (−). */
  boiled: number;
  vapor: number;
  melted: number;
  /** This tick: mass evaporated from the open surface (its energy went to the air). */
  evaporated: number;
}

interface Edge {
  readonly a: number;
  readonly b: number;
  readonly g: number;
  readonly link: ThermalLink;
  /** Net energy a → b during this step (only tracked when tracing). */
  moved: number;
  /** Free liquid surface: evaporation goes along this link too. */
  readonly surface: boolean;
  /** Latent heat carried a → b by vapour this step, J; mass evaporated, kg. */
  vaporEnergy: number;
  vaporMass: number;
}

/** Below this mass a body counts as boiled dry, kg. */
const DRY_MASS = 1e-6;
const isDry = (n: { readonly finite: boolean; readonly mass: number }) => n.finite && n.mass <= DRY_MASS;

export class ThermalSolverError extends Error {
  override readonly name = 'ThermalSolverError';
}

/** Thermostats decide once per step whether their heater may work. */
function updateThermostats(state: SystemState): { readonly updated: Thermostat[]; readonly blocked: ReadonlySet<string> } {
  const updated: Thermostat[] = [];
  const blocked = new Set<string>();
  for (const e of Object.values(state.entities)) {
    if (!isThermostat(e)) continue;
    const sensor = state.entities[e.params.sensor as EntityId];
    if (!sensor || !isThermalEntity(sensor)) continue;
    const t = temperatureOf(sensor);
    let heating = e.state.heating;
    if (heating && t >= e.params.target) heating = false;
    else if (!heating && t <= e.params.target - e.params.hysteresis) heating = true;
    if (!heating) blocked.add(e.params.actuator);
    updated.push(heating === e.state.heating ? e : { ...e, state: { heating, switches: e.state.switches + 1 } });
  }
  return { updated, blocked };
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
      const thermostats = updateThermostats(state);
      const working = (e: Heater | Burner) => e.params.on && !thermostats.blocked.has(e.id);

      // 1. Build working copies of nodes (never touch the input state).
      const nodes: Node[] = [];
      const index = new Map<string, number>();
      for (const e of Object.values(state.entities)) {
        if (!isThermalEntity(e)) continue;
        // A body that has boiled dry no longer takes part in heat exchange.
        if (isThermalBody(e) && bodyMass(e) <= DRY_MASS) continue;
        index.set(e.id, nodes.length);
        const reservoir = isReservoir(e);
        const phase = !reservoir && 'phase' in e.params ? e.params.phase : undefined;
        const evaporation = !reservoir && 'evaporation' in e.params ? e.params.evaporation : undefined;
        nodes.push({
          entity: e,
          finite: !reservoir,
          cLiquid: reservoir ? 0 : e.params.specificHeat,
          phase,
          evaporation,
          humidity: reservoir ? (e.params.humidity ?? 0) : 0,
          mix: !reservoir && 'mixture' in e.state ? e.state.mixture : undefined,
          mass: reservoir ? 0 : bodyMass(e),
          energy: reservoir ? 0 : bodyEnergy(e),
          temperature: temperatureOf(e),
          solidFraction: !reservoir && 'solidFraction' in e.state ? (e.state.solidFraction ?? 0) : 0,
          power: isHeater(e) && working(e) ? e.params.power : 0,
          supplied: 0,
          sumG: 0,
          reservoirHeat: 0,
          boiled: 0,
          vapor: 0,
          melted: 0,
          evaporated: 0,
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
        const power = working(b) ? burnerPower(b) * c.params.share : 0;
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
        const surface = c.params.origin?.type === 'convection' && c.params.origin.surface === true;
        edges.push({ a, b, g: c.params.conductance, link: c, moved: 0, surface, vaporEnergy: 0, vaporMass: 0 });
        nodes[a]!.sumG += c.params.conductance;
        nodes[b]!.sumG += c.params.conductance;
        // Evaporation behaves like an extra (strongly temperature-dependent) conductance: include it in the stability limit.
        const ev = nodes[a]!.evaporation;
        if (surface && ev && c.params.origin?.type === 'convection') {
          const n = nodes[a]!;
          const hm = massTransferCoefficient(c.params.origin.coefficient);
          const T = n.temperature;
          const gEv = hm * c.params.origin.area * latentAt(ev, T) * (saturationDensity(ev, T + 0.5) - saturationDensity(ev, T - 0.5));
          n.sumG += gEv;
          if (nodes[b]!.finite) nodes[b]!.sumG += gEv;
        }
      }

      // 3. Choose sub-step from the stiffest finite node.
      let minTau = Infinity;
      for (const n of nodes) {
        if (n.finite && n.sumG > 0) {
          const capacity = n.mix ? mixtureHeatCapacity(n.mix) : n.mass * specificHeatAt(n.solidFraction, n.cLiquid, n.phase);
          minTau = Math.min(minTau, capacity / n.sumG);
        }
      }
      const substeps = Math.max(1, Math.ceil(dt / (safety * minTau)));
      if (substeps > maxSubsteps) {
        throw new ThermalSolverError(`Scene too stiff: needs ${substeps} sub-steps (limit ${maxSubsteps}). Reduce dt or increase the mass of small objects.`);
      }
      const h = dt / substeps;

      // 4. Integrate. `received`/`given` are only needed for the trace.
      const t0 = trace ? nodes.map((n) => n.temperature) : [];
      const m0 = trace ? nodes.map((n) => n.mass) : [];
      const received = new Float64Array(nodes.length);
      const given = new Float64Array(nodes.length);
      const flow = new Float64Array(nodes.length);
      for (let s = 0; s < substeps; s++) {
        flow.fill(0);
        for (const edge of edges) {
          const { a, b, g } = edge;
          if (isDry(nodes[a]!) || isDry(nodes[b]!)) continue;
          let q = g * (nodes[a]!.temperature - nodes[b]!.temperature); // W, a → b
          // Under a lid: vapour condenses on it and drips back — no mass is lost, its latent heat is.
          if (edge.surface && nodes[b]!.finite) {
            const qv = vaporFlux(nodes[a]!, edge, nodes[b]!).energy;
            q += qv;
            edge.vaporEnergy += qv * h;
          }
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
          if (!n.finite) {
            n.reservoirHeat += net * h;
            continue;
          }
          if (n.mass <= DRY_MASS) continue;
          n.energy += net * h;
          if (n.mix) {
            stepMixture(n, trace ? (carried) => (given[i]! += carried) : undefined);
            continue;
          }
          const d = decodeEnthalpy(n.energy / n.mass, n.cLiquid, n.phase);
          if (n.phase?.latentFusion) n.melted += (n.solidFraction - d.solidFraction) * n.mass * n.phase.latentFusion;
          n.temperature = d.temperature;
          n.solidFraction = d.solidFraction;
          if (d.excess > 0 && n.phase?.latentVaporization && n.phase.boilingPoint !== undefined) {
            // Boiling: the excess turns liquid into vapour, which leaves with its energy.
            const lv = n.phase.latentVaporization;
            const hBoil = n.cLiquid * (n.phase.boilingPoint - ZERO_CELSIUS_IN_KELVIN);
            const dm = Math.min(n.mass, (n.mass * d.excess) / lv);
            // Boiled dry: whatever energy is left leaves with the last vapour.
            const dry = dm >= n.mass - DRY_MASS;
            const carried = dry ? n.energy : dm * (hBoil + lv);
            n.mass = dry ? 0 : n.mass - dm;
            n.energy = dry ? 0 : n.energy - carried;
            n.boiled += dm;
            n.vapor += carried;
            if (trace) given[i]! += carried;
          }
        }
        // Open surface: vapour leaves into the air with its mass and energy.
        for (const edge of edges) {
          if (!edge.surface) continue;
          const n = nodes[edge.a]!;
          const air = nodes[edge.b]!;
          if (air.finite || isDry(n) || !n.evaporation) continue;
          const f = vaporFlux(n, edge, air);
          if (n.mix) {
            // Only water evaporates from brine; the salt stays.
            const liquidWater = n.mix.water - n.mix.ice;
            const dm = Math.min(liquidWater, f.mass * h);
            if (!(dm > 0)) continue;
            const carried = dm * (MIXTURE_CONSTANTS.CW * (n.temperature - ZERO_CELSIUS_IN_KELVIN) + latentAt(n.evaporation, n.temperature));
            n.energy -= carried;
            setMixture(n, n.mix.water - dm, n.mix.salt);
            air.reservoirHeat += carried;
            n.evaporated += dm;
            edge.vaporEnergy += carried;
            edge.vaporMass += dm;
            if (trace) given[edge.a]! += carried;
            continue;
          }
          let dm = Math.min(n.mass, f.mass * h);
          if (!(dm > 0)) continue;
          let carried = dm * (n.cLiquid * (n.temperature - ZERO_CELSIUS_IN_KELVIN) + latentAt(n.evaporation, n.temperature));
          if (n.mass - dm <= DRY_MASS) {
            // Evaporated completely: the rest of its energy leaves with the last vapour.
            dm = n.mass;
            carried = n.energy;
            n.mass = 0;
            n.energy = 0;
          } else {
            n.mass -= dm;
            n.energy -= carried;
            const d = decodeEnthalpy(n.energy / n.mass, n.cLiquid, n.phase);
            n.temperature = d.temperature;
            n.solidFraction = d.solidFraction;
          }
          air.reservoirHeat += carried;
          n.evaporated += dm;
          edge.vaporEnergy += carried;
          edge.vaporMass += dm;
          if (trace) {
            given[edge.a]! += carried;
          }
        }
      }

      if (trace) {
        traceStep(trace, nodes, edges, t0, m0, received, given, dt, substeps);
        for (const e of edges) {
          if (!e.surface || !nodes[e.a]!.evaporation || e.vaporEnergy === 0) continue;
          const a = nodes[e.a]!;
          const ev = a.evaporation!;
          trace.record({ kind: 'transfer', connection: `${e.link.id}:vapour`, a: a.entity.id, b: nodes[e.b]!.entity.id, quantity: 'energy', amount: e.vaporEnergy });
          if (e.link.params.origin?.type === 'convection') {
            const hm = massTransferCoefficient(e.link.params.origin.coefficient);
            const area = e.link.params.origin.area * (1 - a.solidFraction);
            const rs = saturationDensity(ev, t0[e.a]!);
            const rInf = ambientVapour(a, nodes[e.b]!, ev);
            trace.record({ kind: 'formula', formula: 'thermal.evaporation-rate', entities: [a.entity.id, nodes[e.b]!.entity.id], args: [hm, area, rs, rInf], output: hm * area * (rs - rInf) });
          }
          if (e.vaporMass > 0) {
            const L = latentAt(ev, a.temperature);
            trace.record({ kind: 'formula', formula: 'thermal.latent-heat', entities: [a.entity.id], args: [e.vaporMass, L], output: e.vaporMass * L });
          }
        }
        for (const s of supplies) {
          trace.record({ kind: 'transfer', connection: s.link.id, a: s.burner.id, b: nodes[s.target]!.entity.id, quantity: 'energy', amount: s.power * dt });
        }
        for (const b of burners) {
          if (working(b) && b.params.power > 0) {
            trace.record({ kind: 'formula', formula: 'thermal.energy-from-power', entities: [b.id], args: [b.params.power, seconds(dt)], output: b.params.power * dt });
          }
        }
      }

      // 5. Write back immutably.
      const updated: AnyEntity[] = nodes.map((n): ThermalEntity => {
        const e = n.entity;
        if (isReservoir(e)) return { ...e, state: { heatAbsorbed: joules(e.state.heatAbsorbed + n.reservoirHeat) } };
        const temperature = kelvin(n.temperature);
        if (isHeater(e)) return { ...e, state: { temperature, energyDelivered: joules(e.state.energyDelivered + n.power * dt) } };
        const body = e as ThermalBody;
        if (n.mix) {
          const boiledOff = (body.state.boiledOff ?? 0) + n.boiled;
          const evaporated = (body.state.evaporated ?? 0) + n.evaporated;
          const vaporEnergy = (body.state.vaporEnergy ?? 0) + n.vapor;
          return {
            ...body,
            state: {
              temperature,
              mixture: n.mix,
              solidFraction: n.mix.water > 0 ? n.mix.ice / n.mix.water : 0,
              ...(boiledOff > 0 ? { boiledOff, vaporEnergy } : {}),
              ...(evaporated > 0 ? { evaporated } : {}),
            },
          };
        }
        const boiledOff = (body.state.boiledOff ?? 0) + n.boiled;
        const vaporEnergy = (body.state.vaporEnergy ?? 0) + n.vapor;
        const evaporated = (body.state.evaporated ?? 0) + n.evaporated;
        return {
          ...body,
          state: {
            temperature,
            ...(n.phase ? { solidFraction: n.solidFraction } : {}),
            ...(boiledOff > 0 ? { boiledOff, vaporEnergy } : {}),
            ...(evaporated > 0 ? { evaporated } : {}),
          },
        };
      });
      for (const b of burners) {
        const p = working(b) ? burnerPower(b) : 0;
        updated.push({ ...b, state: { ...b.state, energyDelivered: joules(b.state.energyDelivered + p * dt) } });
      }
      updated.push(...thermostats.updated);
      return withEntities(state, updated);
    },
  };
}

/** A burner's power now: its own setting, or what another domain drives it with (Joule heat). */
const burnerPower = (b: Burner): number => (b.params.driven ? (b.state.power ?? 0) : b.params.power);

/** Re-derive temperature and phases of a mixture node after its energy or totals changed. */
function setMixture(n: Node, water: number, salt: number): void {
  const d = decodeMixture(n.energy, Math.max(0, water), salt);
  n.temperature = d.temperature;
  n.mix = d.amounts;
  n.mass = d.amounts.water + d.amounts.salt;
  n.solidFraction = d.amounts.water > 0 ? d.amounts.ice / d.amounts.water : 0;
}

/**
 * One integration step for a water + salt body: phases from energy, then boiling —
 * above the (concentration-dependent) boiling point the excess energy boils water away.
 */
function stepMixture(n: Node, onCarried?: (energy: number) => void): void {
  const before = n.mix!;
  setMixture(n, before.water, before.salt);
  n.melted += (before.ice - n.mix!.ice) * MIXTURE_CONSTANTS.LF;
  const tb = mixtureBoilingPoint(n.mix!);
  if (n.temperature > tb) {
    const atBoil = mixtureEnthalpy(equilibriumAt(n.mix!.water, n.mix!.salt, tb), tb);
    const lv = n.evaporation ? latentAt(n.evaporation, tb) : 2_256_000;
    const liquidWater = n.mix!.water - n.mix!.ice;
    const dm = Math.max(0, Math.min(liquidWater, (n.energy - atBoil) / lv));
    if (dm > 0) {
      const carried = dm * (MIXTURE_CONSTANTS.CW * (tb - ZERO_CELSIUS_IN_KELVIN) + lv);
      n.energy -= carried;
      n.boiled += dm;
      n.vapor += carried;
      onCarried?.(carried);
      setMixture(n, n.mix!.water - dm, n.mix!.salt);
    }
  }
}

/** Water vapour already in the air (humid room); none for other substances' vapour. Kg/m³. */
function ambientVapour(liquid: Node, other: Node, ev: EvaporationParams): number {
  if (other.finite) return saturationDensity(ev, other.temperature); // a lid: vapour condenses where it is saturated
  return ev.vaporPressure.kind === 'buck' ? (other.humidity * saturationPressure(ev.vaporPressure, other.temperature) * ev.molarMass) / (8.31446261815324 * other.temperature) : 0;
}

/** Vapour leaving the liquid surface of edge `e`: mass rate (kg/s) and latent energy rate (W). Never negative (no condensation onto the liquid). */
function vaporFlux(liquid: Node, e: Edge, other: Node): { readonly mass: number; readonly energy: number } {
  const ev = liquid.evaporation;
  const o = e.link.params.origin;
  if (!ev || o?.type !== 'convection' || liquid.solidFraction >= 1) return { mass: 0, energy: 0 };
  const hm = massTransferCoefficient(o.coefficient);
  const area = o.area * (1 - liquid.solidFraction);
  // Dissolved salt lowers the vapour pressure of water (Raoult's law).
  const lowering = liquid.mix ? waterMoleFraction(liquid.mix) : 1;
  const mass = Math.max(0, hm * area * (lowering * saturationDensity(ev, liquid.temperature) - ambientVapour(liquid, other, ev)));
  return { mass, energy: mass * latentAt(ev, liquid.temperature) };
}

/** Reports what this step computed, in terms of catalog formulas (see catalog.ts). */
function traceStep(
  trace: NonNullable<StepContext['trace']>,
  nodes: readonly Node[],
  edges: readonly Edge[],
  t0: readonly number[],
  m0: readonly number[],
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
    if (!n.finite) continue;
    trace.record({ kind: 'formula', formula: 'thermal.energy-balance', entities: [id(i)], args: [received[i]!, given[i]!], output: received[i]! - given[i]! });
    if (n.phase?.latentFusion && Math.abs(n.melted) > 0) {
      // Melting (+) or freezing (−): Q = λ·m for the mass that changed phase.
      const m = Math.abs(n.melted) / n.phase.latentFusion;
      trace.record({ kind: 'formula', formula: 'thermal.latent-heat', entities: [id(i)], args: [m, n.phase.latentFusion], output: m * n.phase.latentFusion });
    }
    if (n.phase?.latentVaporization && n.boiled > 0) {
      trace.record({ kind: 'formula', formula: 'thermal.latent-heat', entities: [id(i)], args: [n.boiled, n.phase.latentVaporization], output: n.boiled * n.phase.latentVaporization });
    }
    if ((!n.phase || (Math.abs(n.melted) === 0 && n.boiled === 0)) && n.evaporated === 0 && !n.mix) {
      const dT = n.temperature - t0[i]!;
      const c = specificHeatAt(n.solidFraction, n.cLiquid, n.phase);
      trace.record({ kind: 'formula', formula: 'thermal.heat-for-temperature-change', entities: [id(i)], args: [m0[i]!, c, dT], output: m0[i]! * c * dT });
    }
  }
}

/**
 * Reference point for internal energy: 0 °C. The choice is arbitrary (only
 * differences are physical) but must be the same everywhere, including the
 * energy that poured matter brings in (see commands.ts).
 */
export const ENERGY_REFERENCE_TEMPERATURE = ZERO_CELSIUS_IN_KELVIN;

/**
 * Total energy of all finite thermal bodies relative to 0 °C, J — what they
 * store plus what their vapour carried away. Used by tests and the energy balance.
 */
export function thermalEnergy(state: SystemState): number {
  let u = 0;
  for (const e of Object.values(state.entities)) {
    if (isThermalBody(e)) u += bodyEnergy(e) + (e.state.vaporEnergy ?? 0);
    else if (isHeater(e)) u += bodyEnergy(e);
  }
  return u;
}
