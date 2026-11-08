import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import { COMPONENTS } from '../../components/index.js';
import { density } from '../../domains/mechanics/formulas.js';
import { POURED_PACKING, SHAKEN_PACKING } from '../../domains/mechanics/constants.js';
import { solubilityAt } from '../../domains/thermal/mixture.js';
import { SCALES } from '../../equipment/scales.js';
import { VESSELS } from '../../equipment/vessels.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import { msg } from '../../knowledge/messages.js';
import { measured } from '../../scenarios/bench-kit.js';
import { BULK_SUBSTANCES, type BulkSubstance } from './shared.js';

/**
 * The density of a granular substance (grade 7, Holovko, topic 2, «Робота в групі для розв’язання проблем: як визначити
 * густину сипких речовин?»): the grains are poured into a measuring cylinder to its mark and weighed — mass over the
 * volume is the bulk density, less than the substance’s own: there is air between the grains. Then a liquid that does
 * not dissolve them is poured in up to the grains’ top: as much of it goes in as there is room between them, and the
 * grains’ own volume is what is left. «А якщо?» — the same grains shaken down: they settle, the bulk density grows.
 *
 * The substances are the catalogue’s (their densities); how much of a vessel poured grains fill is the mechanics
 * domain’s; whether a liquid dissolves them — the thermal domain’s solubility. The pupil chooses the substance.
 */

export type BulkCommand =
  | { readonly type: 'lab.bulk'; readonly step: 'pour'; readonly substance: BulkSubstance }
  | { readonly type: 'lab.bulk'; readonly step: 'fill'; readonly substance: BulkSubstance }
  | { readonly type: 'lab.bulk'; readonly step: 'shake'; readonly substance: BulkSubstance };

/** The grains are poured into a 100 mL measuring cylinder to its top mark. */
export const POURED = () => VESSELS.cylinder.spec.sizes[0]! / 1000;
const MARK = () => VESSELS.cylinder.spec.graduation!.value;
const BAL = () => SCALES['lab-balance'].spec;

/** The substance's own density (its crystals, its filings), kg/m³: the catalogue's. */
export const grainDensity = (s: BulkSubstance): number => COMPONENTS[s].phases.solid!.density!.value;

/**
 * The liquid to fill the gaps with: water — unless the water in the gaps would dissolve more than a thousandth of the
 * grains (their solubility at 20 °C); then sunflower oil, which dissolves none of them.
 */
export function gapLiquid(s: BulkSubstance): 'water' | 'oil' {
  const V = POURED();
  const water = (1 - POURED_PACKING.value) * V * COMPONENTS.water.phases.liquid!.density!.value;
  const grains = POURED_PACKING.value * V * grainDensity(s);
  const sol = solubilityAt(s, 20);
  const dissolves = Number.isFinite(sol) ? (sol / 100) * water : Infinity;
  return dissolves > 0.001 * grains ? 'oil' : 'water';
}
export const liquidDensity = (l: 'water' | 'oil'): number => (l === 'water' ? COMPONENTS.water.phases.liquid!.density!.value : COMPONENTS['sunflower-oil'].phases.liquid!.density!.value);

const read = (x: number, d: number) => Math.round(x / d) * d;

export const bulkCommand: CommandHandler<BulkCommand> = {
  type: 'lab.bulk',
  apply(state, c) {
    if (!BULK_SUBSTANCES.includes(c.substance)) return err(msg('bulk-density-command-substance'));
    const done = (...r: ReturnType<typeof measured>[]) => ok({ state, kind: 'measurement' as const, externalEnergy: 0, trace: r });
    const V = POURED();
    const rho = grainDensity(c.substance);
    // The grains poured to the mark: their mass on the balance (tared with the cylinder).
    const m = POURED_PACKING.value * V * rho;
    const d = m <= BAL().capacity.value ? BAL().resolution.value : SCALES['kitchen-scale'].spec.resolution.value;
    const mass = read(m, d);
    if (c.step === 'pour') return done(measured(m <= BAL().capacity.value ? 'lab-balance' : 'kitchen-scale', 'mass', mass, m, { volume: V, bulk: density(mass, V), division: d }));
    if (c.step === 'shake') {
      // Shaken, the same grains settle lower: the level read on the cylinder.
      const V2 = (V * POURED_PACKING.value) / SHAKEN_PACKING.value;
      const level = read(V2, MARK());
      return done(measured('cylinder', 'volume', level, V2, { mass, poured: V, bulk: density(mass, level), division: MARK() }));
    }
    // The liquid poured from a second cylinder up to the grains' top: as much went in as there was room between them.
    const liquid = gapLiquid(c.substance);
    const gaps = (1 - POURED_PACKING.value) * V;
    const Vl = read(gaps, MARK());
    const own = V - Vl;
    return done(measured('cylinder', 'volume', Vl, gaps, { mass, poured: V, grains: own, density: density(mass, own), table: rho, oil: liquid === 'oil' ? 1 : 0, division: MARK() }));
  },
};

export const BULK_TEXT: Record<BulkCommand['type'], (c: BulkCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.bulk': (x) => {
    const c = x as BulkCommand;
    if (c.step === 'pour') return { say: msg('bulk-density-pour-say', { substance: c.substance }), button: msg('bulk-density-pour-button'), plan: msg('bulk-density-pour-plan') };
    if (c.step === 'shake') return { say: msg('bulk-density-shake-say'), button: msg('bulk-density-shake-button'), plan: msg('bulk-density-shake-plan') };
    const liquid = gapLiquid(c.substance);
    return { say: msg('bulk-density-fill-say', { liquid }), button: msg('bulk-density-fill-button', { liquid }), plan: msg('bulk-density-fill-plan', { liquid }) };
  },
};
