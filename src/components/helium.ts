import { msg } from '../knowledge/messages.js';
import type { ComponentData } from './types.js';
import { cite, sv } from './sourced.js';

export const HELIUM = {
  id: 'helium',
  kind: 'element',
  group: 'gas',
  name: msg('component-helium'),
  formula: 'He',
  composition: { He: 1 },
  wikidata: 'Q560',
  stateAtRoom: 'gas',
  phases: {
    gas: {
      density: sv(0.1786, 'kg/m³', '0 °C, 1 atm', 'single-source', 0.001, [cite('wikipedia-helium', 'Infobox: density at STP 0.1786 g/L', 'STP', 0.1786)], 'Only the Wikipedia infobox checked so far; at other temperatures — by the ideal gas law.'),
    },
  },
  electrical: { conducts: 'insulator' },
  description: {
    novice: msg('component-helium-description-novice'),
    school: msg('component-helium-description-school'),
  },
  media: [],
} as const satisfies ComponentData;
