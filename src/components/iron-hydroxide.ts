import type { Component } from './types.js';
import { cite, estimate, sv } from './sourced.js';

/** Iron(II) hydroxide: what an iron anode in salt water turns into — a greenish sludge that browns in air. */
export const IRON_II_HYDROXIDE = {
  id: 'iron-ii-hydroxide',
  kind: 'compound',
  group: 'mineral',
  name: { uk: 'Гідроксид заліза(II)', en: 'Iron(II) hydroxide' },
  genitive: { uk: 'гідроксиду заліза(II)', en: 'iron(II) hydroxide' },
  gender: 'm',
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
    novice: { uk: 'Білий, але майже завжди зеленуватий осад. На повітрі поступово буріє — перетворюється на іржу.', en: 'A white but almost always greenish sludge. In air it slowly turns brown — into rust.' },
    school: { uk: 'Утворюється, коли йони Fe²⁺ зустрічаються з гідроксид-йонами: Fe²⁺ + 2OH⁻ → Fe(OH)₂↓. Кисень повітря окиснює його до сполук заліза(III) — бурої іржі.', en: 'It forms when Fe²⁺ ions meet hydroxide ions: Fe²⁺ + 2OH⁻ → Fe(OH)₂↓. Oxygen from the air oxidises it to iron(III) compounds — brown rust.' },
  },
  media: [],
  modelNotes: [{ uk: 'Як осад буріє на повітрі (стає іржею), модель поки не рахує: колір показано зеленуватим.', en: 'How the sludge browns in air (turns to rust) is not computed yet: it is shown greenish.' }],
} as const satisfies Component;
