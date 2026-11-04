import { msg } from '../knowledge/messages.js';
import type { CoolerItem } from './types.js';

/**
 * Coolers. A cooler is modelled as cold surroundings held at its setpoint (its
 * own thermostat and compressor are not simulated): the vessel inside exchanges
 * heat with cold air or a cold bath instead of the room.
 */
const LIST = {
  freezer: {
    id: 'freezer',
    look: 'freezer',
    kind: 'cooler',
    category: 'device.cooler.household',
    name: msg('cooler-freezer'),
    phrase: msg('cooler-freezer-phrase'),
    description: {
      novice: msg('cooler-freezer-description-novice'),
      school: msg('cooler-freezer-description-school'),
    },
    media: [],
    spec: {
      method: 'air',
      setpoint: {
        min: -24,
        max: -16,
        default: -18,
        data: {
          value: -18, unit: '°C', conditions: 'household freezer', verification: 'single-source', tolerance: 0.3,
          citations: [{ source: 'wikipedia-refrigerator', locator: 'FDA guideline; most freezers −23 … −18 °C', conditions: 'household', range: [-23, -18] }],
          note: 'FDA recommends −18 °C; household freezers run between −23 and −18 °C.',
        },
      },
      convection: 'wind',
    },
  },
  fridge: {
    id: 'fridge',
    look: 'fridge',
    kind: 'cooler',
    category: 'device.cooler.household',
    name: msg('cooler-fridge'),
    phrase: msg('cooler-fridge-phrase'),
    description: {
      novice: msg('cooler-fridge-description-novice'),
      school: msg('cooler-fridge-description-school'),
    },
    media: [],
    spec: {
      method: 'air',
      setpoint: {
        min: 1,
        max: 8,
        default: 4,
        data: {
          value: 4, unit: '°C', conditions: 'household refrigerator', verification: 'single-source', tolerance: 0.3,
          citations: [{ source: 'wikipedia-refrigerator', locator: 'FDA: at or below 4 °C; optimal 3–5 °C', conditions: 'household', range: [3, 5] }],
        },
      },
      convection: 'stillAir',
    },
  },
  'ice-bath': {
    id: 'ice-bath',
    look: 'ice-bath',
    kind: 'cooler',
    category: 'device.cooler.laboratory',
    name: msg('cooler-ice-bath'),
    phrase: msg('cooler-ice-bath-phrase'),
    description: {
      novice: msg('cooler-ice-bath-description-novice'),
      school: msg('cooler-ice-bath-description-school'),
    },
    media: [],
    spec: {
      method: 'bath',
      setpoint: {
        min: 0,
        max: 0,
        default: 0,
        data: {
          value: 0, unit: '°C', conditions: 'melting ice at 1 atm', verification: 'cross-checked', tolerance: 0.01,
          citations: [
            { source: 'openstax-cp2e-latent', locator: 'Table 14.2, Water: melting point', conditions: '1 atm', value: 0 },
            { source: 'wikidata', locator: 'Q283 melting point', conditions: '101.325 kPa', value: 0 },
          ],
        },
      },
      convection: 'stillWater',
    },
  },
  'ice-salt-bath': {
    id: 'ice-salt-bath',
    look: 'ice-salt-bath',
    kind: 'cooler',
    category: 'device.cooler.laboratory',
    name: msg('cooler-ice-salt-bath'),
    phrase: msg('cooler-ice-salt-bath-phrase'),
    description: {
      novice: msg('cooler-ice-salt-bath-description-novice'),
      school: msg('cooler-ice-salt-bath-description-school'),
    },
    media: [],
    spec: {
      method: 'bath',
      setpoint: {
        min: -21.1,
        max: -21.1,
        default: -21.1,
        data: {
          value: -21.1, unit: '°C', conditions: 'NaCl eutectic, 23.3 %', verification: 'single-source', tolerance: 0.05,
          citations: [{ source: 'wikipedia-brine', locator: 'Refrigerating fluid: eutectic', conditions: '23.3 % NaCl', value: -21.1 }],
          note: 'The lowest temperature an ice–salt mixture can reach; real baths are often a few degrees warmer.',
        },
      },
      convection: 'stillWater',
    },
  },
  'muffle-furnace': {
    id: 'muffle-furnace',
    look: 'furnace',
    kind: 'cooler',
    category: 'device.furnace.laboratory',
    name: msg('cooler-muffle-furnace'),
    phrase: msg('cooler-muffle-furnace-phrase'),
    description: {
      novice: msg('cooler-muffle-furnace-description-novice'),
      school: msg('cooler-muffle-furnace-description-school'),
    },
    media: [],
    spec: {
      method: 'air',
      hot: true,
      setpoint: {
        min: 100,
        max: 1100,
        default: 900,
        data: {
          value: 1100, unit: '°C', conditions: 'Nabertherm L 3/11, maximum', verification: 'single-source', tolerance: 0.01,
          citations: [{ source: 'labfriend-nabertherm-l3', locator: 'Tmax 1100 °C, 3 L, 1.2 kW', conditions: '230 V', value: 1100 }],
          note: 'The furnace is taken as already hot: its own warming up (about an hour) is not modelled.',
        },
      },
      convection: 'stillAir',
    },
  },
} as const satisfies Record<string, CoolerItem>;

export type CoolerId = keyof typeof LIST;
export const COOLERS: Readonly<Record<CoolerId, CoolerItem>> = LIST;
