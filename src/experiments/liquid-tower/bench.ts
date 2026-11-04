import type { CommandHandler } from '../../core/commands.js';
import { ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { cite, sv } from '../../components/sourced.js';
import { COMPONENTS } from '../../components/index.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg } from '../../knowledge/messages.js';
import type { SourcedValue } from '../../knowledge/types.js';

/**
 * Bodies and liquids of different densities in one cylinder (grade 7): 50 mL each of glycerol, water, sunflower oil
 * and ethanol are poured into a 250 mL cylinder, the heaviest first, slowly down the wall — they lie in layers, the
 * denser lower. Then four small bodies go in: a steel nut, a piece of acrylic glass, of HDPE, a cube of pine. Each
 * sinks through the liquids lighter than itself and floats on the first one denser — at a boundary, partly in each:
 * the share in the lower liquid is (ρ_body − ρ_upper) / (ρ_lower − ρ_upper); on the top one — ρ_body / ρ_top.
 * (Glycerol and water do mix: poured with care they keep a boundary for a while; the oil keeps the ethanol off the
 * water. The liquids' volumes are taken to add up.)
 */

export type TowerLiquid = 'glycerol' | 'water' | 'sunflower-oil' | 'ethanol';
export type TowerBody = 'nut' | 'acrylic' | 'hdpe' | 'pine';

/** Poured in this order, 50 mL each: the heaviest first. */
export const TOWER_LIQUIDS: readonly TowerLiquid[] = ['glycerol', 'water', 'sunflower-oil', 'ethanol'];
export const TOWER_LAYER = 50e-6;
/** The cylinder's marks: every 2 mL. */
export const TOWER_DIVISION = 2e-6;

export const towerLiquidDensity = (l: TowerLiquid): number => COMPONENTS[l].phases.liquid!.density!.value;

const ACRYLIC: SourcedValue = sv(1180, 'kg/m³', 'acrylic glass (PMMA)', 'single-source', 0.02, [cite('wikipedia-pmma', 'Infobox: density 1.18 g/cm³; text: 1.17–1.20', '—', 1180)], 'Within 1.17–1.20 g/cm³ it stays between water and glycerol.');
const HDPE: SourcedValue = sv(961, 'kg/m³', 'high-density polyethylene', 'single-source', 0.02, [cite('wikipedia-hdpe', 'ca. 0.961 g/cm³; ranges from 930 to 970 kg/m³', '—', 961)], 'Within 930–970 kg/m³ it stays between oil and water.');

export const TOWER_BODIES: Readonly<Record<TowerBody, { readonly density: () => number; readonly name: LocalizedText; readonly made: LocalizedText; }>> = {
  nut: { density: () => COMPONENTS.steel.phases.solid!.density!.value, name: msg('liquid-tower-nut-name'), made: msg('liquid-tower-nut-made') },
  acrylic: { density: () => ACRYLIC.value, name: msg('liquid-tower-acrylic-name'), made: msg('liquid-tower-acrylic-made') },
  hdpe: { density: () => HDPE.value, name: msg('liquid-tower-hdpe-name'), made: msg('liquid-tower-hdpe-made') },
  pine: { density: () => COMPONENTS.wood.phases.solid!.density!.value, name: msg('liquid-tower-pine-name'), made: msg('liquid-tower-pine-made') },
};

/** Where the body comes to rest: on the bottom; at the boundary over layer `lower` (its index), `share` of it in that layer; or floating on the top one. */
export function towerRest(body: TowerBody): { readonly where: 'bottom' | 'boundary' | 'top'; readonly lower: number; readonly share: number; readonly mark: number } {
  const rho = TOWER_BODIES[body].density();
  const d = TOWER_LIQUIDS.map(towerLiquidDensity);
  if (rho > d[0]!) return { where: 'bottom', lower: -1, share: 0, mark: 0 };
  const top = d.length - 1;
  if (rho < d[top]!) return { where: 'top', lower: top, share: rho / d[top]!, mark: TOWER_LAYER * d.length };
  // The first layer from below lighter than the body: it rests on the one beneath.
  const upper = d.findIndex((x) => x < rho);
  const lower = upper - 1;
  return { where: 'boundary', lower, share: (rho - d[upper]!) / (d[lower]! - d[upper]!), mark: TOWER_LAYER * upper };
}

/** Pour the layers (and read the level after each); or let a body go in. */
export interface TowerCommand {
  readonly type: 'lab.tower';
  readonly step: 'pour' | 'drop';
  readonly body?: TowerBody;
}

export const towerCommand: CommandHandler<TowerCommand> = {
  type: 'lab.tower',
  apply(state, c) {
    if (c.step === 'pour') {
      const trace: MeasurementRecord[] = TOWER_LIQUIDS.map((l, k) => {
        const v = TOWER_LAYER * (k + 1);
        return { kind: 'measurement', instrument: 'cylinder', quantity: 'volume', value: Math.round(v / TOWER_DIVISION) * TOWER_DIVISION, exact: v, entities: [], inputs: { which: k, density: towerLiquidDensity(l), division: TOWER_DIVISION } };
      });
      return ok({ state, kind: 'measurement', externalEnergy: 0, trace });
    }
    const body = c.body ?? 'nut';
    const r = towerRest(body);
    const record: MeasurementRecord = { kind: 'measurement', instrument: 'cylinder', quantity: 'volume', value: r.mark, exact: r.mark, entities: [], inputs: { lower: r.lower, share: r.share, density: TOWER_BODIES[body].density(), top: r.where === 'top' ? 1 : 0, division: TOWER_DIVISION } };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
  },
};

export const TOWER_COMMANDS = [towerCommand] as const;

const LIQUID: Record<TowerLiquid, { name: LocalizedText; in: LocalizedText }> = {
  glycerol: { name: msg('liquid-tower-glycerol-name'), in: msg('liquid-tower-glycerol-in') },
  water: { name: msg('liquid-tower-water-name'), in: msg('liquid-tower-water-in') },
  'sunflower-oil': { name: msg('liquid-tower-sunflower-oil-name'), in: msg('liquid-tower-sunflower-oil-in') },
  ethanol: { name: msg('liquid-tower-ethanol-name'), in: msg('liquid-tower-ethanol-in') },
};
export const towerLiquidName = (l: TowerLiquid) => LIQUID[l].name;
export const towerLiquidIn = (l: TowerLiquid) => LIQUID[l].in;

export const TOWER_TEXT: Record<TowerCommand['type'], (c: TowerCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.tower': (x) => {
    const c = x as TowerCommand;
    if (c.step === 'pour')
      return {
        say: msg('liquid-tower-labtower-say'),
        button: msg('liquid-tower-labtower-button'),
        plan: msg('liquid-tower-labtower-plan'),
      };
    const b = TOWER_BODIES[c.body ?? 'nut'].name;
    return {
      say: msg('liquid-tower-drop-say', { body: (l: Locale) => b[l], what: c.body ?? 'nut' }),
      button: msg('liquid-tower-labtower-button-2', { b: (l: Locale) => b[l].charAt(0).toUpperCase(), b2: (l: Locale) => b[l].slice(1) }),
      plan: msg('liquid-tower-labtower-plan-2', { b: (l: Locale) => b[l] }),
    };
  },
};
