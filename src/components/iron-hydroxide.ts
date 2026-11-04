import { msg } from '../knowledge/messages.js';
import type { ComponentData } from './types.js';
import { cite, estimate, sv } from './sourced.js';

/** Iron(II) hydroxide: what an iron anode in salt water turns into — a greenish sludge that browns in air. */
export const IRON_II_HYDROXIDE = {
  id: 'iron-ii-hydroxide',
  kind: 'compound',
  group: 'mineral',
  name: msg('component-iron-ii-hydroxide'),
  formula: 'Fe(OH)₂',
  composition: { Fe: 1, O: 2, H: 2 },
  wikidata: 'Q421959',
  stateAtRoom: 'solid',
  phases: {
    solid: {
      density: sv(3400, 'kg/m³', 'solid', 'single-source', 0.02, [cite('wikipedia-iron-ii-hydroxide', 'Infobox: density 3.4 g/cm³', 'solid', 3400)], 'Only the Wikipedia infobox checked so far.'),
      specificHeat: estimate(900, 'J/(kg·K)', 'solid, room temperature', 700, 1100, 'No table checked yet: metal hydroxides hold ≈ 0.7–1.1 kJ/(kg·K). Matters only when the sludge is heated.'),
    },
  },
  inWater: { solubility: sv(0.000143, 'g/100 g water', '1.43·10⁻³ g/L', 'single-source', 0.05, [cite('wikipedia-iron-ii-hydroxide', 'Solubility 1.43·10⁻³ g/L (Ksp 8.0·10⁻¹⁶)', 'not stated', 0.000143)], 'Practically insoluble: it falls out as a sludge.') },
  description: {
    novice: msg('component-iron-ii-hydroxide-description-novice'),
    school: msg('component-iron-ii-hydroxide-description-school'),
  },
  media: [],
  modelNotes: [msg('component-iron-ii-hydroxide-model-notes')],
} as const satisfies ComponentData;
