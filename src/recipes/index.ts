import { sv } from '../components/sourced.js';
import { msg } from '../knowledge/messages.js';
import type { Recipe } from './types.js';

export * from './types.js';

/** Average salinity of seawater, used for the "sea water" recipe (as if all salt were NaCl). */
export const SEAWATER_SALINITY = sv(0.035, '', 'ocean average', 'single-source', 0.05, [{ source: 'wikipedia-seawater', locator: 'Lead: salinity ≈ 3.5 %', conditions: 'average', value: 0.035 }], 'About 86 % of sea salt is Na⁺ and Cl⁻; the model treats all of it as NaCl.');

const brine = (w: number) => [
  { component: 'water', fraction: 1 - w },
  { component: 'sodium-chloride', fraction: w },
] as const;

const LIST = {
  'sea-water': {
    id: 'sea-water',
    name: msg('recipe-sea-water'),
    parts: brine(SEAWATER_SALINITY.value),
    basis: SEAWATER_SALINITY,
    description: {
      novice: msg('recipe-sea-water-description-novice'),
      school: msg('recipe-sea-water-description-school'),
    },
    notes: [
      msg('recipe-sea-water-note'),
    ],
  },
  'salt-water-10': {
    id: 'salt-water-10',
    name: msg('recipe-salt-water-10'),
    parts: brine(0.1),
    description: {
      novice: msg('recipe-salt-water-10-description-novice'),
      school: msg('recipe-salt-water-10-description-school'),
    },
  },
  'salt-water-20': {
    id: 'salt-water-20',
    name: msg('recipe-salt-water-20'),
    parts: brine(0.2),
    description: {
      novice: msg('recipe-salt-water-20-description-novice'),
      school: msg('recipe-salt-water-20-description-school'),
    },
  },
} as const satisfies Record<string, Recipe>;

export type RecipeId = keyof typeof LIST;
export const RECIPES: Readonly<Record<RecipeId, Recipe>> = LIST;
