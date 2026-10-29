import type { CommandHandler } from '../core/commands.js';
import { ok } from '../core/result.js';
import type { MeasurementRecord } from '../core/trace.js';
import { cite, sv } from '../components/sourced.js';
import { COMPONENTS } from '../components/index.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import type { SourcedValue } from '../knowledge/types.js';

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

export const TOWER_BODIES: Readonly<Record<TowerBody, { readonly density: () => number; readonly name: LocalizedText; readonly made: LocalizedText; /** The name is feminine (uk). */ readonly fem?: boolean }>> = {
  nut: { density: () => COMPONENTS.steel.phases.solid!.density!.value, name: { uk: 'сталева гайка', en: 'a steel nut' }, made: { uk: 'сталь', en: 'steel' }, fem: true },
  acrylic: { density: () => ACRYLIC.value, name: { uk: 'шматочок оргскла', en: 'a piece of acrylic glass' }, made: { uk: 'оргскло', en: 'acrylic glass' } },
  hdpe: { density: () => HDPE.value, name: { uk: 'шматочок поліетилену', en: 'a piece of polyethylene' }, made: { uk: 'поліетилен', en: 'polyethylene' } },
  pine: { density: () => COMPONENTS.wood.phases.solid!.density!.value, name: { uk: 'сосновий кубик', en: 'a pine cube' }, made: { uk: 'сосна', en: 'pine' } },
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
  glycerol: { name: { uk: 'гліцерин', en: 'glycerol' }, in: { uk: 'у гліцерині', en: 'in the glycerol' } },
  water: { name: { uk: 'вода', en: 'water' }, in: { uk: 'у воді', en: 'in the water' } },
  'sunflower-oil': { name: { uk: 'олія', en: 'oil' }, in: { uk: 'в олії', en: 'in the oil' } },
  ethanol: { name: { uk: 'спирт', en: 'ethanol' }, in: { uk: 'у спирті', en: 'in the ethanol' } },
};
export const towerLiquidName = (l: TowerLiquid) => LIQUID[l].name;
export const towerLiquidIn = (l: TowerLiquid) => LIQUID[l].in;

export const TOWER_TEXT: Record<TowerCommand['type'], (c: TowerCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.tower': (x) => {
    const c = x as TowerCommand;
    if (c.step === 'pour')
      return {
        say: { uk: 'Наливаємо в мірний циліндр по 50 мл: спершу гліцерин, потім воду, олію і спирт — повільно, по стінці. Воду й спирт підфарбуємо, щоб шари було видно.', en: 'Into the measuring cylinder go 50 mL each: first glycerol, then water, oil and ethanol — slowly, down the wall. The water and the ethanol are tinted so the layers show.' },
        button: { uk: '🫗 Налити шари', en: '🫗 Pour the layers' },
        plan: { uk: 'налити чотири рідини шарами', en: 'pour four liquids in layers' },
      };
    const b = TOWER_BODIES[c.body ?? 'nut'].name;
    return {
      say: { uk: `Обережно опускаємо в циліндр ${b.uk}. Де ${TOWER_BODIES[c.body ?? 'nut'].fem ? 'вона' : 'він'} зупиниться?`, en: `Gently let ${b.en} into the cylinder. Where will it stop?` },
      button: { uk: `⬇ ${b.uk.charAt(0).toUpperCase()}${b.uk.slice(1)}`, en: `⬇ ${b.en.charAt(0).toUpperCase()}${b.en.slice(1)}` },
      plan: { uk: `опустити: ${b.uk}`, en: `let in ${b.en}` },
    };
  },
};
