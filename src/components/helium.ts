import type { Component } from './types.js';
import { cite, sv } from './sourced.js';

export const HELIUM = {
  id: 'helium',
  kind: 'element',
  group: 'gas',
  name: { uk: 'Гелій', en: 'Helium' },
  genitive: { uk: 'гелію', en: 'helium' },
  gender: 'm',
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
    novice: { uk: 'Легкий газ, який не горить: ним наповнюють повітряні кульки й дирижаблі.', en: 'A light gas that does not burn: balloons and airships are filled with it.' },
    school: { uk: 'Гелій приблизно всемеро легший за повітря й не горить — тому сучасні дирижаблі наповнюють ним, а не воднем.', en: 'Helium is about seven times lighter than air and does not burn — so airships today are filled with it, not with hydrogen.' },
  },
  media: [],
} as const satisfies Component;
