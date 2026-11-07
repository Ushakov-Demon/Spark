import { describe, expect, it } from 'vitest';
import { COMPONENTS, type ComponentId } from '../../../src/components/index.js';
import { createCommandRegistry, createExperimentSession, createSimulation, seconds } from '../../../src/core/index.js';
import { submergedShare } from '../../../src/domains/mechanics/formulas.js';
import { createThermalSolver, isThermalBody, mixtureBoilingPoint } from '../../../src/domains/thermal/index.js';
import { LAB_COMMANDS, labSetup, liquidDensity, pieceShare, sampleOf, SAMPLE_ID, type LabCommand, type LabParams } from '../../../src/scenarios/index.js';
import { SUBSTANCES, type SubstanceId } from '../../../src/substances/index.js';

/**
 * Mixing is one rule for every liquid on the shelf, whatever it is: this goes over all of them, so a liquid added later
 * is checked the same way with nothing written for it. Two liquids either become one (each mixes with water — their
 * boiling point by Raoult's law, their density from what is in them) or lie in layers (one does not mix with water).
 * And a body in any of them floats or sinks by the densities alone.
 */
const simulation = createSimulation({ solvers: [createThermalSolver()], fixedDt: seconds(2) });
const commands = createCommandRegistry<LabCommand>(LAB_COMMANDS as never);
const LIQUIDS = Object.values(SUBSTANCES).filter((s) => s.category.startsWith('liquid.'));
const SOLIDS = Object.values(SUBSTANCES).filter((s) => s.category.startsWith('solid.'));
const vessel = (substance: string) => createExperimentSession<LabCommand>({ initial: labSetup({ substance, liters: 0.1, startTemp: 20, roomTemp: 20, lid: false, vessel: 'beaker', size: 0.5, material: 'glass', action: 'settle' } as unknown as LabParams).state, simulation, commands, sampleEvery: seconds(10) });
const add = (substance: string, grams: number) => ({ type: 'thermal.add', into: SAMPLE_ID, substance, mass: grams / 1000, temperature: 293.15 }) as unknown as LabCommand;
const pieces = (s: ReturnType<typeof vessel>) => Object.values(s.state.entities).filter((e) => isThermalBody(e) && e.id.startsWith(`${SAMPLE_ID}+`));
/** Mixes with water in any proportion (a solution recipe is water). */
const watery = (id: string) => {
  const s = SUBSTANCES[id as SubstanceId];
  return s.mixture !== undefined || s.recipe !== undefined || s.id === 'water' || COMPONENTS[s.component as ComponentId]?.inWater?.solubility === 'miscible';
};
const boilsAt = (id: string) => {
  const s = SUBSTANCES[id as SubstanceId];
  return s.mixture || s.recipe ? 100 : COMPONENTS[s.component as ComponentId]?.boiling?.point.value;
};

describe('mixing: every pair of liquids on the shelf, by one rule', () => {
  for (const host of LIQUIDS)
    for (const poured of LIQUIDS) {
      if (host.id === poured.id) continue;
      const mixes = watery(host.id) && watery(poured.id);
      it(`${poured.id} into ${host.id}: ${mixes ? 'one liquid' : 'layers'}`, () => {
        const s = vessel(host.id);
        expect(s.apply(add(poured.id, 50)).ok).toBe(true);
        if (!mixes) {
          // A layer of its own; the liquid around it keeps its density.
          expect(pieces(s).length).toBe(1);
          return;
        }
        expect(pieces(s)).toEqual([]);
        const mix = sampleOf(s.state).state.mixture!;
        expect(mix).toBeDefined();
        // Its density is there and lies between the components' own (no water needed for it: alcohol with glycerol).
        const rho = liquidDensity(s.state)!;
        const own = [host, poured].map((x) => x.liquid.density.value);
        expect(rho).toBeGreaterThan(Math.min(...own) * 0.98);
        expect(rho).toBeLessThan(Math.max(...own) * 1.02);
        // It boils between its components (a few degrees under the lower one — an azeotrope — are allowed).
        const tb = mixtureBoilingPoint(mix) - 273.15;
        const pure = [host.id, poured.id].map(boilsAt).filter((x): x is number => x !== undefined);
        expect(tb).toBeGreaterThan(Math.min(...pure) - 5);
        expect(tb).toBeLessThan(Math.max(...pure) + 5);
      });
    }
});

describe('a body in any liquid floats or sinks by the densities alone', () => {
  for (const liquid of LIQUIDS)
    it(`in ${liquid.id}`, () => {
      for (const body of SOLIDS) {
        const s = vessel(liquid.id);
        if (!s.apply(add(body.id, 5)).ok) continue;
        const piece = pieces(s).find((e) => isThermalBody(e) && e.params.substance === body.id);
        // (A soluble one is no piece: it dissolved, or lies as crystals in the solution.)
        if (!piece || !isThermalBody(piece)) continue;
        const rho = liquidDensity(s.state)!;
        expect(pieceShare(s.state, piece), `${body.id} in ${liquid.id}`).toBeCloseTo(submergedShare(body.liquid.density.value, rho), 6);
      }
    });
});

describe('not only pairs: everything on the shelf into one vessel, one after another', () => {
  it('what mixes is one liquid, what is too much lies as crystals, what does not mix is a layer, bodies float by that liquid', () => {
    const s = vessel('water');
    for (const x of LIQUIDS) if (x.id !== 'water') expect(s.apply(add(x.id, 20)).ok, x.id).toBe(true);
    for (const x of SOLIDS) s.apply(add(x.id, 5));
    const mix = sampleOf(s.state).state.mixture!;
    // Every liquid that mixes with water is in that one liquid (a recipe — its water and salt).
    for (const x of LIQUIDS.filter((l) => watery(l.id) && l.component && l.id !== 'water')) expect(mix.solutes.some((u) => u.component === x.component), x.id).toBe(true);
    // Every one that does not is a piece of its own (a layer), and nothing that mixes is.
    for (const x of LIQUIDS) expect(pieces(s).some((e) => isThermalBody(e) && e.params.substance === x.id), x.id).toBe(!watery(x.id));
    // Dissolved never more than each one's solubility allows — the rest lies as crystals (a held one aside).
    for (const u of mix.solutes) expect(u.crystals, u.component).toBeGreaterThanOrEqual(0);
    const tb = mixtureBoilingPoint(mix) - 273.15;
    expect(tb).toBeGreaterThan(70);
    expect(tb).toBeLessThan(120);
    // The bodies: by the density of that whole mixture.
    const rho = liquidDensity(s.state)!;
    for (const p of pieces(s)) {
      if (!isThermalBody(p)) continue;
      const sub = SUBSTANCES[p.params.substance as SubstanceId];
      if (!sub.category.startsWith('solid.')) continue;
      expect(pieceShare(s.state, p), sub.id).toBeCloseTo(submergedShare(sub.liquid.density.value, rho), 6);
    }
  });
});
