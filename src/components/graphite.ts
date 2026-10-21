import type { Component } from './types.js';
import { sv } from './sourced.js';

/** Graphite: the electrodes of school electrolysis — they conduct but do not react. */
export const GRAPHITE = {
  id: 'graphite',
  kind: 'element',
  group: 'material',
  name: { uk: 'Графіт', en: 'Graphite' },
  genitive: { uk: 'графіту', en: 'graphite' },
  gender: 'm',
  formula: 'C',
  composition: { C: 1 },
  wikidata: 'Q5309',
  stateAtRoom: 'solid',
  phases: {
    solid: {
      density: sv(2160, 'kg/m³', 'not stated', 'single-source', 0.04, [{ source: 'wikipedia-graphite', locator: 'Infobox: density 2.09–2.23 g/cm³', conditions: 'not stated', range: [2090, 2230] }], 'The middle of the range: graphites differ.'),
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
    novice: { uk: 'Чорно-сірий, м’який, з нього роблять стрижні олівців. Добре проводить струм і майже ні з чим не реагує — тому з графіту роблять електроди.', en: 'Black-grey and soft; pencil leads are made of it. It conducts current well and hardly reacts with anything — that is why electrodes are made of graphite.' },
    school: { uk: 'Графіт — одна з форм вуглецю. На графітовому аноді під час електролізу окиснюється не електрод, а речовина в розчині: у розчині кухонної солі виділяється хлор.', en: 'Graphite is a form of carbon. At a graphite anode it is not the electrode but the solution that is oxidised: a salt solution gives chlorine.' },
  },
  media: [],
} as const satisfies Component;
