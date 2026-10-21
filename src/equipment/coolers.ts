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
    name: { uk: 'Морозильна камера', en: 'Freezer' },
    phrase: { uk: 'у морозильній камері', en: 'in a freezer' },
    description: {
      novice: {
        uk: 'Холодна шафа, у якій повітря тримається приблизно при −18 °C. Вентилятор ганяє холодне повітря, тож продукти остигають швидше.',
        en: 'A cold cabinet where the air is kept at about −18 °C. A fan moves the cold air around, so food cools faster.',
      },
      school: {
        uk: 'Холодильна машина забирає теплоту зсередини камери й віддає її в кімнату. Тіло в камері віддає теплоту холодному повітрю; щоб замерзнути, воно має віддати ще й приховану теплоту.',
        en: 'A refrigeration machine takes heat from inside the cabinet and releases it into the room. A body inside gives heat to the cold air; to freeze, it must also give away its latent heat.',
      },
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
    name: { uk: 'Холодильник', en: 'Refrigerator' },
    phrase: { uk: 'у холодильнику', en: 'in a refrigerator' },
    description: {
      novice: {
        uk: 'У холодильнику тримається приблизно +4 °C — холодно, але вода не замерзає.',
        en: 'A refrigerator keeps about +4 °C — cold, but water does not freeze.',
      },
      school: {
        uk: 'Повітря в камері нерухоме, тому тіла остигають у холодильнику повільніше, ніж у морозилці з вентилятором.',
        en: 'The air inside is still, so bodies cool more slowly in a refrigerator than in a freezer with a fan.',
      },
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
    name: { uk: 'Льодяна баня (лід + вода)', en: 'Ice bath (ice + water)' },
    phrase: { uk: 'у льодяній бані', en: 'in an ice bath' },
    description: {
      novice: {
        uk: 'Миска з подрібненим льодом і водою. Поки лід тане, суміш тримає рівно 0 °C.',
        en: 'A bowl of crushed ice and water. While the ice melts, the mixture stays at exactly 0 °C.',
      },
      school: {
        uk: 'Теплота від посуду йде на плавлення льоду, тому температура бані не змінюється — це та сама прихована теплота. Вода в бані віддає теплоту набагато краще за повітря.',
        en: 'Heat from the vessel goes into melting ice, so the bath temperature does not change — latent heat again. Water in the bath takes heat far better than air.',
      },
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
    name: { uk: 'Охолоджувальна суміш (лід + сіль)', en: 'Ice-salt bath' },
    phrase: { uk: 'в охолоджувальній суміші льоду й солі', en: 'in an ice-salt bath' },
    description: {
      novice: {
        uk: 'Лід, посипаний сіллю, тане й стає набагато холоднішим за 0 °C — аж до приблизно −21 °C.',
        en: 'Ice sprinkled with salt melts and gets much colder than 0 °C — down to about −21 °C.',
      },
      school: {
        uk: 'Солоний розчин замерзає при нижчій температурі, ніж вода, тож лід у ньому тане, забираючи приховану теплоту, і суміш охолоджується до температури замерзання розчину — найнижча можлива −21,1 °C (при 23,3 % солі).',
        en: 'Salt water freezes at a lower temperature than water, so ice in it melts, taking latent heat, and the mixture cools to the freezing point of the brine — at best −21.1 °C (at 23.3 % salt).',
      },
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
    name: { uk: 'Муфельна піч', en: 'Muffle furnace' },
    phrase: { uk: 'у муфельній печі', en: 'in a muffle furnace' },
    description: {
      novice: {
        uk: 'Маленька електропіч із товстими стінками з вогнетривкої цегли. Усередині тримається задана температура — аж до 1100 °C.',
        en: 'A small electric furnace with thick firebrick walls. Inside it keeps the set temperature — up to 1100 °C.',
      },
      school: {
        uk: 'Розжарені стінки печі віддають теплоту тиглю переважно випромінюванням; терморегулятор тримає задану температуру. У такій печі плавлять сіль і алюміній.',
        en: 'The glowing walls of the furnace give heat to the crucible mostly by radiation; a controller holds the set temperature. Salt and aluminium are melted in such a furnace.',
      },
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
