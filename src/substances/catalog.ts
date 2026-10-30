import { COMPONENTS, molarMass, NACL_SOLUTE, type Component, type ComponentGroup, type ComponentId } from '../components/index.js';
import { sv } from '../components/sourced.js';
import { ZERO_CELSIUS_IN_KELVIN } from '../core/units.js';
import { equilibriumAt, mixtureBoilingPoint } from '../domains/thermal/mixture.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import type { SourcedValue } from '../knowledge/types.js';
import { RECIPES, type Recipe, type RecipeId } from '../recipes/index.js';
import type { SubstanceCategory, SubstanceItem } from './types.js';

/**
 * The lab shelf: what can be poured into a vessel or added during an
 * experiment. A view of the components and recipes — no numbers of its own.
 */

/** The product on the shelf may have its own name: the component is "water", the bottle says "distilled water". */
interface ShelfName {
  readonly name: LocalizedText;
  readonly genitive?: LocalizedText;
  readonly gender: Component['gender'];
  readonly bodyShape?: 'block' | 'ball';
}

const CATEGORY: Partial<Record<ComponentGroup, SubstanceCategory>> = {
  water: 'liquid.water',
  alcohol: 'liquid.alcohol',
  acid: 'liquid.acid',
  oil: 'liquid.oil',
  salt: 'solid.salt',
  // Chalk, iron(II) hydroxide: on the shelf with the salts ("Солі й мінерали").
  mineral: 'solid.salt',
  sugar: 'solid.material',
  // Metal blocks: put into a liquid (heated in boiling water), or melted themselves in a crucible.
  metal: 'solid.metal',
  alloy: 'solid.metal',
  // Other solid bodies: a wooden block floats, a glass ball sinks.
  material: 'solid.material',
};

/** Molar mass as a sourced value: computed from the formula with standard atomic weights. */
const molarMassValue = (c: Component): SourcedValue | undefined => {
  const m = molarMass(c);
  return m === undefined
    ? undefined
    : sv(m, 'kg/mol', c.formula ?? c.id, 'single-source', 0.001, [{ source: 'wikipedia-standard-atomic-weight', locator: `computed from the formula ${c.formula ?? ''}`, conditions: 'standard atomic weights', value: m }]);
};

function fromComponent(c: Component, id: string = c.id, shelfName?: ShelfName): SubstanceItem {
  const category = CATEGORY[c.group];
  if (!category) throw new Error(`${c.id}: no shelf category for group "${c.group}"`);
  // A liquid is described by its liquid state; a solid we add (salt) by its solid state.
  const main = c.stateAtRoom === 'liquid' ? c.phases.liquid : c.phases.solid;
  if (!main?.specificHeat || !main.density) throw new Error(`${c.id}: needs density and specific heat to go on the shelf`);
  const solid = c.phases.solid;
  const mm = molarMassValue(c);
  return {
    id,
    component: c.id,
    category,
    name: shelfName?.name ?? c.name,
    ...((shelfName?.genitive ?? c.genitive) ? { genitive: (shelfName?.genitive ?? c.genitive)! } : {}),
    gender: shelfName?.gender ?? c.gender,
    ...(shelfName?.bodyShape ? { bodyShape: shelfName.bodyShape } : {}),
    ...(solid?.name ? { solidName: solid.name } : {}),
    description: c.description,
    ...(c.safety ? { safety: c.safety } : {}),
    media: c.media,
    ...(c.stateAtRoom === 'solid' && c.inWater?.model ? { mixture: { saltFraction: 1 } } : {}),
    liquid: { specificHeat: main.specificHeat, density: main.density, ...(main.conductivity ? { conductivity: main.conductivity } : {}) },
    ...(c.stateAtRoom === 'liquid' && c.melting?.latentHeat && solid?.specificHeat
      ? { freezing: { point: c.melting.point, latentHeat: c.melting.latentHeat, solidSpecificHeat: solid.specificHeat, ...(solid.density ? { solidDensity: solid.density } : {}) } }
      : {}),
    ...(c.stateAtRoom === 'solid' && c.melting?.latentHeat && c.phases.liquid?.specificHeat
      ? {
          melt: { point: c.melting.point, latentHeat: c.melting.latentHeat, liquidSpecificHeat: c.phases.liquid.specificHeat, ...(c.phases.liquid.density ? { liquidDensity: c.phases.liquid.density } : {}) },
          // The same transition seen from the solid: everything that asks "where does it melt / freeze" finds it here.
          freezing: { point: c.melting.point, latentHeat: c.melting.latentHeat, solidSpecificHeat: main.specificHeat, solidDensity: main.density },
        }
      : {}),
    ...(c.stateAtRoom === 'liquid' && c.boiling?.latentHeat ? { boiling: { point: c.boiling.point, latentHeat: c.boiling.latentHeat } } : {}),
    ...(c.vapour && mm
      ? { vapor: { molarMass: mm, pressure: c.vapour.pressure, pressureData: c.vapour.data, ...(c.vapour.latentLow ? { latentLow: c.vapour.latentLow } : {}) } }
      : {}),
    ...(c.decomposes ? { decomposes: c.decomposes.point } : {}),
    ...(c.hazards?.flammable ? { flammable: true } : {}),
    ...(c.modelNotes ? { modelNotes: c.modelNotes } : {}),
  };
}

/**
 * A water + salt recipe as a shelf item. The card numbers come from the mixture
 * model; the experiment itself works with the composition.
 */
function fromRecipe(r: Recipe): SubstanceItem {
  const water = COMPONENTS.water;
  const salt = COMPONENTS['sodium-chloride'];
  const w = r.parts.find((p) => p.component === salt.id)?.fraction ?? 0;
  if (r.parts.some((p) => p.component !== water.id && p.component !== salt.id)) throw new Error(`${r.id}: only water + salt recipes are supported so far`);
  const pct = `${Math.round(w * 1000) / 10} % NaCl`;
  const fromModel = (value: number, unit: string, conditions: string, note: string): SourcedValue =>
    sv(value, unit, conditions, 'estimate', 0.05, [{ source: 'spark', locator: 'mixture model', conditions: 'computed from water + NaCl data', range: [value - Math.abs(value) * 0.05, value + Math.abs(value) * 0.05] }], note);
  const [solubility, freezing, density] = NACL_SOLUTE.data;
  void solubility;
  const wl = water.phases.liquid!;
  const ws = water.phases.solid!;
  const tb = mixtureBoilingPoint(equilibriumAt(1 - w, w, ZERO_CELSIUS_IN_KELVIN + 100)) - ZERO_CELSIUS_IN_KELVIN;
  return {
    id: r.id,
    recipe: r.id,
    category: 'liquid.solution',
    name: r.name,
    gender: r.gender,
    description: r.description,
    media: [],
    mixture: { saltFraction: w },
    liquid: {
      // Weighted by mass: water + solid salt (the heat of dissolution and non-ideal mixing ignored).
      specificHeat: fromModel(Math.round((1 - w) * wl.specificHeat!.value + w * salt.phases.solid!.specificHeat!.value), 'J/(kg·K)', pct, 'Mass-weighted average of water and salt; real brine is a few per cent lower.'),
      density: sv(Math.round(NACL_SOLUTE.solutionDensity(w)), 'kg/m³', pct, 'single-source', 0.01, density!.citations, 'Interpolated in the table.'),
    },
    freezing: {
      point: sv(Math.round(NACL_SOLUTE.freezingPointOf(w) * 100) / 100, '°C', `${pct}: ice starts to form`, 'single-source', 0.05, freezing!.citations, 'Ice starts to form here; the rest freezes gradually down to −21.1 °C.'),
      latentHeat: water.melting!.latentHeat!,
      solidSpecificHeat: ws.specificHeat!,
    },
    vapor: { molarMass: molarMassValue(water)!, pressure: water.vapour!.pressure, pressureData: water.vapour!.data, ...(water.vapour!.latentLow ? { latentLow: water.vapour!.latentLow } : {}) },
    boiling: {
      point: fromModel(Math.round(tb * 10) / 10, '°C', `${pct}, 1 atm, at the start`, "Raoult's law with full dissociation; rises as water boils away."),
      latentHeat: water.boiling!.latentHeat!,
    },
    ...(r.notes ? { modelNotes: r.notes } : {}),
  };
}

/** What is on the shelf, in UI order: a component id, a recipe id, or a shelf name for a component. */
const SHELF = [
  { id: 'water', component: 'water', as: { name: { uk: 'Дистильована вода', en: 'Distilled water' }, genitive: { uk: 'дистильованої води', en: 'distilled water' }, gender: 'f' } },
  { id: 'sea-water', recipe: 'sea-water' },
  { id: 'salt-water-10', recipe: 'salt-water-10' },
  { id: 'salt-water-20', recipe: 'salt-water-20' },
  { id: 'ethanol', component: 'ethanol' },
  { id: 'glycerol', component: 'glycerol' },
  { id: 'acetic-acid', component: 'acetic-acid' },
  { id: 'sunflower-oil', component: 'sunflower-oil' },
  { id: 'table-salt', component: 'sodium-chloride', as: { name: { uk: 'Кухонна сіль', en: 'Table salt' }, genitive: { uk: 'кухонної солі', en: 'table salt' }, gender: 'f' } },
  { id: 'aluminium', component: 'aluminium' },
  { id: 'copper', component: 'copper' },
  { id: 'iron', component: 'iron' },
  { id: 'steel', component: 'steel' },
  { id: 'brass', component: 'brass' },
  { id: 'tin', component: 'tin' },
  { id: 'stearic-acid', component: 'stearic-acid' },
  { id: 'sugar', component: 'sucrose' },
  { id: 'baking-soda', component: 'sodium-bicarbonate' },
  { id: 'ammonium-chloride', component: 'ammonium-chloride' },
  { id: 'caustic-soda', component: 'sodium-hydroxide' },
  { id: 'sodium-acetate', component: 'sodium-acetate' },
  { id: 'copper-sulfate', component: 'copper-sulfate' },
  { id: 'chalk', component: 'calcium-carbonate' },
  { id: 'iron-ii-hydroxide', component: 'iron-ii-hydroxide' },
  { id: 'graphite', component: 'graphite' },
  { id: 'porcelain', component: 'porcelain' },
  { id: 'brick', component: 'brick' },
  { id: 'wood', component: 'wood', as: { name: { uk: 'Дерев’яний брусок (сосна)', en: 'Wooden block (pine)' }, gender: 'm' } },
  { id: 'glass', component: 'glass', as: { name: { uk: 'Скляна кулька', en: 'Glass marble' }, gender: 'f', bodyShape: 'ball' } },
  { id: 'rubber', component: 'rubber', as: { name: { uk: 'Гумовий корок', en: 'Rubber stopper' }, gender: 'm' } },
] as const satisfies readonly ({ id: string; component: ComponentId; as?: ShelfName } | { id: string; recipe: RecipeId })[];

export type SubstanceId = (typeof SHELF)[number]['id'];

export const SUBSTANCES: Readonly<Record<SubstanceId, SubstanceItem>> = Object.fromEntries(
  SHELF.map((s) => [s.id, 'recipe' in s ? fromRecipe(RECIPES[s.recipe]) : fromComponent(COMPONENTS[s.component], s.id, 'as' in s ? s.as : undefined)]),
) as Record<SubstanceId, SubstanceItem>;

export const SUBSTANCE_CATEGORIES: readonly { readonly id: SubstanceItem['category']; readonly name: { uk: string; en: string } }[] = [
  { id: 'liquid.water', name: { uk: 'Вода', en: 'Water' } },
  { id: 'liquid.solution', name: { uk: 'Розчини', en: 'Solutions' } },
  { id: 'liquid.alcohol', name: { uk: 'Спирти', en: 'Alcohols' } },
  { id: 'liquid.acid', name: { uk: 'Кислоти', en: 'Acids' } },
  { id: 'liquid.oil', name: { uk: 'Олії', en: 'Oils' } },
  { id: 'solid.salt', name: { uk: 'Солі', en: 'Salts' } },
  { id: 'solid.metal', name: { uk: 'Метали й сплави', en: 'Metals and alloys' } },
  { id: 'solid.material', name: { uk: 'Інші тверді тіла', en: 'Other solids' } },
];

/**
 * Families of the shelf, as the experimenter looks for things: liquids, solutions,
 * salts and minerals, metals, other solids. Each groups some categories.
 */
export const SUBSTANCE_FAMILIES: readonly { readonly id: string; readonly name: { uk: string; en: string }; readonly categories: readonly SubstanceItem['category'][] }[] = [
  { id: 'liquids', name: { uk: 'Рідини', en: 'Liquids' }, categories: ['liquid.water', 'liquid.alcohol', 'liquid.acid', 'liquid.oil'] },
  { id: 'solutions', name: { uk: 'Розчини', en: 'Solutions' }, categories: ['liquid.solution'] },
  { id: 'salts', name: { uk: 'Солі й мінерали', en: 'Salts and minerals' }, categories: ['solid.salt'] },
  { id: 'metals', name: { uk: 'Метали й сплави', en: 'Metals and alloys' }, categories: ['solid.metal'] },
  { id: 'solids', name: { uk: 'Інші тверді тіла', en: 'Other solids' }, categories: ['solid.material'] },
];
