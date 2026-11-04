import { msg } from '../knowledge/messages.js';
import type { HeaterItem } from './types.js';


/**
 * Heaters. Physics data come with sources (see knowledge/sources.ts); numbers
 * we could not find are marked 'estimate' with a note. Descriptions follow
 * docs/CONTENT_STYLE.md.
 */
const W = 'W';

const HEATER_LIST = {
  'electric-hotplate': {
    id: 'electric-hotplate',
    look: 'hotplate',
    phrase: msg('heater-electric-hotplate-phrase'),
    name: msg('heater-electric-hotplate'),
    kind: 'heater',
    category: 'device.heater.household',
    description: {
      novice: msg('heater-electric-hotplate-description-novice'),
      school: msg('heater-electric-hotplate-description-school'),
    },
    media: [],
    spec: {
      method: 'contact',
      control: 'knob',
      ratings: [1000, 1500, 2000],
      defaultRating: 2000,
      ratingData: {
        value: 2000,
        unit: W,
        conditions: 'solid plates: 145 mm 1000–1500 W, 180 mm 1500–2000 W',
        verification: 'single-source',
        tolerance: 0.01,
        citations: [{ source: 'zanussi-zee6140fxa', locator: 'Technical specs, cooking zones', conditions: '230 V', range: [1000, 2000] }],
        note: 'One manufacturer data sheet; parts retailers list the same standard ratings.',
      },
      minFraction: 0,

      body: {
        mass: {
          value: 1.5, unit: 'kg', conditions: 'cast-iron plate 145–180 mm', verification: 'estimate', tolerance: 0.5,
          citations: [{ source: 'spark', locator: 'estimate', conditions: 'not weighed', range: [1, 2.5] }],
          note: 'Estimate; the thermal mass of the plate is why solid plates are slow to heat up and cool down.',
        },
        material: 'iron',
        area: {
          value: 0.1, unit: 'm²', conditions: 'exposed rim and underside; radiation folded into h', verification: 'estimate', tolerance: 0.5,
          citations: [{ source: 'spark', locator: 'estimate', conditions: 'not measured', range: [0.05, 0.15] }],
          note: 'Effective area for losses of the hot plate to the room; estimate.',
        },
      },
      plateDiameter: {
        value: 0.18, unit: 'm', conditions: '2000 W solid plate', verification: 'single-source', tolerance: 0.01,
        citations: [{ source: 'zanussi-zee6140fxa', locator: 'cooking zones: 2000 W / 180 mm', conditions: '230 V', value: 0.18 }],
        note: '1000 W plates are 145 mm; the 180 mm size is used for all ratings.',
      },
      contactConductance: {
        value: 60, unit: 'W/K', conditions: 'flat pot bottom on a solid plate', verification: 'estimate', tolerance: 0.5,
        citations: [{ source: 'spark', locator: 'estimate', conditions: 'not measured', range: [30, 90] }],
        note: 'Estimate; depends on how flat the pot bottom is.',
      },
    },
  },
  'induction-hob': {
    id: 'induction-hob',
    look: 'induction',
    phrase: msg('heater-induction-hob-phrase'),
    name: msg('heater-induction-hob'),
    kind: 'heater',
    category: 'device.heater.household',
    description: {
      novice: msg('heater-induction-hob-description-novice'),
      school: msg('heater-induction-hob-description-school'),
    },
    media: [],
    spec: {
      method: 'induction',
      control: 'knob',
      ratings: [1400, 2300, 3700],
      defaultRating: 2300,
      ratingData: {
        value: 2300,
        unit: W,
        conditions: 'zones 1400 W and 2300 W; booster up to 3700 W',
        verification: 'cross-checked',
        tolerance: 0.01,
        citations: [
          { source: 'fisherpaykel-ci764dtb4', locator: 'zone ratings', conditions: '230 V', range: [1400, 3700] },
          { source: 'electrolux-hhi650mc', locator: 'zone ratings', conditions: '230 V', range: [1400, 3700] },
        ],
      },
      minFraction: 0,
      vesselShare: {
        value: 0.75,
        unit: '',
        conditions: 'water-heating tests, typical pot',
        verification: 'cross-checked',
        tolerance: 0.14,
        citations: [
          { source: 'wikipedia-induction-cooking', locator: 'Efficiency: U.S. DOE 2014', conditions: 'DOE test procedure', range: [0.707, 0.736] },
          { source: 'wikipedia-induction-cooking', locator: 'Efficiency: ACEEE 2014', conditions: 'heating water', value: 0.76 },
          { source: 'energystar-induction', locator: 'efficiency comparison', conditions: 'not stated', value: 0.85 },
        ],
        note: 'Tests measure heat reaching the water; the model also loses some heat from the pot walls, so it slightly underestimates. Rose & Morawicki (2023) found 54–81 % depending on water volume.',
      },
      vesselCutoff: {
        value: 270, unit: '°C', conditions: 'sensor under the glass, pan heated empty', verification: 'estimate', tolerance: 0.2,
        citations: [{ source: 'spark', locator: 'estimate', conditions: 'no source found', range: [230, 300] }],
        note: 'Induction hobs switch a zone off when the pan overheats (heated empty); manufacturers do not publish the temperature. Estimate.',
      },
      requiresMaterial: {
        materials: ['steel', 'iron'],
        source: 'wikipedia-induction-cooking',
        claim: 'Cookware must contain a ferromagnetic metal such as cast iron or some stainless steels; induction tops typically will not heat copper or aluminium cookware.',
      },

    },
  },
  'gas-hob': {
    id: 'gas-hob',
    look: 'gas',
    phrase: msg('heater-gas-hob-phrase'),
    name: msg('heater-gas-hob'),
    kind: 'heater',
    category: 'device.heater.household',
    description: {
      novice: msg('heater-gas-hob-description-novice'),
      school: msg('heater-gas-hob-description-school'),
    },
    media: [],
    spec: {
      method: 'flame',
      control: 'knob',
      ratings: [1000, 1750, 3000],
      defaultRating: 1750,
      ratingData: {
        value: 1750,
        unit: W,
        conditions: 'auxiliary ≈1.0 kW, semi-rapid 1.75–2.0 kW, rapid 2.4–3.3 kW',
        verification: 'single-source',
        tolerance: 0.01,
        citations: [{ source: 'gas-hob-datasheets', locator: 'burner ratings (several models)', conditions: 'natural gas', range: [1000, 3300] }],
        note: 'Manufacturer ratings of several models; depends on gas type.',
      },
      minFraction: 0.3,
      minFractionData: {
        value: 0.3,
        unit: '',
        conditions: 'smallest stable flame relative to full flame',
        verification: 'estimate',
        tolerance: 0.5,
        citations: [{ source: 'spark', locator: 'estimate', conditions: 'not measured', range: [0.2, 0.4] }],
        note: 'No source found for burner turndown; engineering estimate.',
      },
      vesselShare: {
        value: 0.38,
        unit: '',
        conditions: 'standard pot covering the burner',
        verification: 'cross-checked',
        tolerance: 0.17,
        citations: [
          { source: 'wikipedia-induction-cooking', locator: 'Efficiency: U.S. DOE 2014', conditions: 'DOE test procedure', value: 0.439 },
          { source: 'wikipedia-induction-cooking', locator: 'Efficiency: ACEEE 2014', conditions: 'heating water', range: [0.3, 0.4] },
          { source: 'energystar-induction', locator: 'efficiency comparison', conditions: 'not stated', value: 0.32 },
          { source: 'leafscore-cooktop-efficiency', locator: 'efficiency comparison', conditions: 'not stated', range: [0.38, 0.4] },
        ],
        note: 'Measured 30–44 %; depends strongly on pot size and flame height.',
      },
      flameTemperature: {
        value: 1500, unit: '°C', conditions: 'natural gas flame, hottest zone', verification: 'single-source', tolerance: 0.05,
        citations: [{ source: 'britannica-bunsen', locator: 'hottest part of the Bunsen flame ≈ 1500 °C', conditions: 'natural gas', value: 1500 }, { source: 'wikipedia-adiabatic-flame-temperature', locator: 'natural gas in air 1960 °C (theoretical upper bound)', conditions: 'stoichiometric', range: [0, 1960] }],
        note: 'A hob burns the same gas as a Bunsen burner; measured flames stay well below the theoretical 1960 °C.',
      },

    },
  },
  'immersion-heater': {
    id: 'immersion-heater',
    look: 'immersion',
    phrase: msg('heater-immersion-heater-phrase'),
    name: msg('heater-immersion-heater'),
    kind: 'heater',
    category: 'device.heater.household',
    description: {
      novice: msg('heater-immersion-heater-description-novice'),
      school: msg('heater-immersion-heater-description-school'),
    },
    safety: { school: msg('heater-immersion-heater-safety-school') },
    media: [],
    spec: {
      method: 'immersion',
      control: 'switch',
      ratings: [500, 1000, 1500],
      defaultRating: 1000,
      ratingData: {
        value: 1500,
        unit: W,
        conditions: 'travel immersion heater, element 315 × 50 mm',
        verification: 'single-source',
        tolerance: 0.01,
        citations: [{ source: 'travel-immersion-1500', locator: 'listing', conditions: '230 V', value: 1500 }],
        note: 'Only the 1500 W model is sourced; 500 and 1000 W are common household ratings (not verified).',
      },
      minFraction: 0,

      body: {
        mass: {
          value: 0.2, unit: 'kg', conditions: 'steel sheath of the element', verification: 'estimate', tolerance: 0.5,
          citations: [{ source: 'spark', locator: 'estimate', conditions: 'not weighed', range: [0.1, 0.3] }],
          note: 'Estimate.',
        },
        material: 'steel',
        area: {
          value: 0.0495, unit: 'm²', conditions: 'element 315 mm × Ø 50 mm → π·d·L', verification: 'single-source', tolerance: 0.02,
          citations: [{ source: 'travel-immersion-1500', locator: 'listing: element dimensions', conditions: '315 × 50 mm', value: 0.0495 }],
          note: 'Computed from the dimensions of one listed model.',
        },
      },
      elementDiameter: {
        value: 0.05, unit: 'm', conditions: 'element Ø 50 mm', verification: 'single-source', tolerance: 0.01,
        citations: [{ source: 'travel-immersion-1500', locator: 'listing: element dimensions', conditions: '315 × 50 mm', value: 0.05 }],
        note: 'One listed model; smaller immersion heaters exist.',
      },
    },
  },
  'bunsen-burner': {
    id: 'bunsen-burner',
    look: 'bunsen',
    phrase: msg('heater-bunsen-burner-phrase'),
    name: msg('heater-bunsen-burner'),
    kind: 'heater',
    category: 'device.heater.laboratory',
    description: {
      novice: msg('heater-bunsen-burner-description-novice'),
      school: msg('heater-bunsen-burner-description-school'),
    },
    media: [],
    spec: {
      method: 'flame',
      control: 'knob',
      ratings: [1500],
      defaultRating: 1500,
      ratingData: {
        value: 1500,
        unit: W,
        conditions: 'natural gas, needle valve fully open',
        verification: 'single-source',
        tolerance: 0.05,
        citations: [
          { source: 'bochem-bunsen', locator: 'listing', conditions: 'natural gas, 120 g/h', value: 1530 },
          { source: 'vwr-bunsen', locator: 'listing', conditions: 'BTU/h assumed', range: [230, 350] },
        ],
        note: 'Vendor data for different models (0.23–1.53 kW); the 1.5 kW model is used.',
      },
      minFraction: 0.2,
      minFractionData: {
        value: 0.2,
        unit: '',
        conditions: 'smallest stable flame',
        verification: 'estimate',
        tolerance: 0.5,
        citations: [{ source: 'vwr-bunsen', locator: 'smaller models', conditions: 'BTU/h assumed', range: [0.15, 0.23] }],
        note: 'Estimate: small burners deliver ≈0.23–0.35 kW, i.e. ≈20 % of a 1.5 kW burner.',
      },
      vesselShare: {
        value: 0.3,
        unit: '',
        conditions: 'beaker or pot on a tripod',
        verification: 'estimate',
        tolerance: 0.5,
        citations: [{ source: 'energystar-induction', locator: 'gas cooktop (by analogy)', conditions: 'not stated', value: 0.32 }],
        note: 'No measurement for lab burners found; taken by analogy with gas hobs. Measure it yourself: heat a known mass of water and compare with the burner power.',
      },
      flameTemperature: {
        value: 1500, unit: '°C', conditions: 'natural gas flame, hottest zone', verification: 'single-source', tolerance: 0.05,
        citations: [{ source: 'britannica-bunsen', locator: 'hottest part of the Bunsen flame ≈ 1500 °C', conditions: 'natural gas', value: 1500 }, { source: 'wikipedia-adiabatic-flame-temperature', locator: 'natural gas in air 1960 °C (theoretical upper bound)', conditions: 'stoichiometric', range: [0, 1960] }],
        note: 'A hob burns the same gas as a Bunsen burner; measured flames stay well below the theoretical 1960 °C.',
      },

    },
  },
  'spirit-lamp': {
    id: 'spirit-lamp',
    look: 'spirit',
    phrase: msg('heater-spirit-lamp-phrase'),
    name: msg('heater-spirit-lamp'),
    kind: 'heater',
    category: 'device.heater.laboratory',
    description: {
      novice: msg('heater-spirit-lamp-description-novice'),
      school: msg('heater-spirit-lamp-description-school'),
    },
    media: [],
    spec: {
      method: 'flame',
      control: 'knob',
      ratings: [100],
      defaultRating: 100,
      ratingData: {
        value: 100,
        unit: W,
        conditions: 'school glass spirit lamp',
        verification: 'estimate',
        tolerance: 0.5,
        citations: [{ source: 'spark', locator: 'estimate', conditions: 'not measured', range: [50, 150] }],
        note: 'No source with a measured power was found. Order-of-magnitude estimate — a good thing to measure in class (the RSC «heat energy from alcohols» method).',
      },
      minFraction: 0.5,
      minFractionData: {
        value: 0.5,
        unit: '',
        conditions: 'wick turned down',
        verification: 'estimate',
        tolerance: 0.5,
        citations: [{ source: 'spark', locator: 'estimate', conditions: 'not measured', range: [0.3, 0.7] }],
        note: 'Estimate: a wick can be turned down only a little.',
      },
      vesselShare: {
        value: 0.3,
        unit: '',
        conditions: 'test tube or small beaker above the flame',
        verification: 'estimate',
        tolerance: 0.5,
        citations: [{ source: 'spark', locator: 'estimate', conditions: 'not measured', range: [0.2, 0.4] }],
        note: 'Estimate; heat losses of spirit burners are large and variable.',
      },
      flameTemperature: {
        value: 1200, unit: '°C', conditions: 'ethanol flame on a wick', verification: 'estimate', tolerance: 0.3,
        citations: [{ source: 'wikipedia-alcohol-burner', locator: 'flame cooler than a Bunsen burner', conditions: 'not stated', range: [800, 1500] }, { source: 'wikipedia-adiabatic-flame-temperature', locator: 'ethanol in air 2082 °C (theoretical upper bound)', conditions: 'stoichiometric', range: [0, 2082] }],
        note: 'No measurement found: a wick flame is a diffusion flame, cooler than a Bunsen burner (≈ 1500 °C). Estimate.',
      },

    },
  },
} as const satisfies Record<string, HeaterItem>;

export type HeaterId = keyof typeof HEATER_LIST;
/** Typed as plain HeaterItem so code can iterate without literal-type noise. */
export const HEATERS: Readonly<Record<HeaterId, HeaterItem>> = HEATER_LIST;
