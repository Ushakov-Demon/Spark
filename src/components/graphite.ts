import { msg } from '../knowledge/messages.js';
import type { ComponentData } from './types.js';
import { cite, sv } from './sourced.js';

/** Graphite: the electrodes of school electrolysis — they conduct but do not react. */
export const GRAPHITE = {
  id: 'graphite',
  kind: 'element',
  group: 'material',
  name: msg('component-graphite'),
  formula: 'C',
  composition: { C: 1 },
  wikidata: 'Q5309',
  stateAtRoom: 'solid',
  phases: {
    solid: {
      density: sv(2160, 'kg/m³', 'not stated', 'single-source', 0.04, [{ source: 'wikipedia-graphite', locator: 'Infobox: density 2.09–2.23 g/cm³', conditions: 'not stated', range: [2090, 2230] }], 'The middle of the range: graphites differ.'),
      specificHeat: sv(710, 'J/(kg·K)', 'solid, 25 °C', 'single-source', 0.01, [cite('wikipedia-specific-heat', 'Graphite (carbon): 0.710 J/(g·K)', '25 °C', 710)], 'Only one table checked so far.'),
    },
  },
  electrical: {
    conducts: 'metal',
    electrode: {
      inert: true,
      source: sv(1, '', 'anode in salt-water electrolysis', 'single-source', 0.01, [{ source: 'wikipedia-chloralkali', locator: 'the anode must be non-reactive: platinum, graphite (plumbago in Faraday’s time), platinized titanium', conditions: 'chloralkali process', value: 1 }], 'Graphite slowly crumbles at an anode (gas inside its pores) — not modelled.'),
    },
  },
  description: {
    novice: msg('component-graphite-description-novice'),
    school: msg('component-graphite-description-school'),
  },
  media: [],
} as const satisfies ComponentData;
