import type { Citation, SourcedValue, Verification } from '../knowledge/types.js';
import { MATERIALS } from '../domains/thermal/materials.js';
import type { SubstanceItem } from './types.js';

const sv = (value: number, unit: string, conditions: string, verification: Verification, tolerance: number, citations: Citation[], note?: string): SourcedValue => ({
  value,
  unit,
  conditions,
  verification,
  tolerance,
  citations,
  ...(note === undefined ? {} : { note }),
});
const estimate = (value: number, unit: string, conditions: string, lo: number, hi: number, note: string): SourcedValue =>
  sv(value, unit, conditions, 'estimate', 0.5, [{ source: 'spark', locator: 'estimate', conditions: 'no source found', range: [lo, hi] }], note);

const WATER_LF = sv(334_000, 'J/kg', 'at 0 °C, 1 atm', 'cross-checked', 0.01, [
  { source: 'openstax-cp2e-latent', locator: 'Table 14.2, Water', conditions: '0 °C, 1 atm', value: 334_000 },
  { source: 'wikipedia-enthalpy-of-fusion', locator: 'Water', conditions: 'not stated', value: 333_550 },
]);
const WATER_LV = sv(2_256_000, 'J/kg', 'at 100 °C, 1 atm', 'cross-checked', 0.01, [
  { source: 'openstax-cp2e-latent', locator: 'Table 14.2, Water', conditions: '100 °C, 1 atm', value: 2_256_000 },
  { source: 'wikidata', locator: 'Q283 molar enthalpy of vaporization 40.656 kJ/mol at 373.15 K ÷ 18.015 g/mol', conditions: '373.15 K', value: 2_256_800 },
]);

/** Liquids for the heating/cooling lab. Order = order in the UI. */
const LIST = {
  water: {
    id: 'water',
    category: 'liquid.water',
    name: { uk: 'Дистильована вода', en: 'Distilled water' },
    gender: 'f',
    solidName: { uk: 'Лід', en: 'Ice' },
    description: {
      novice: {
        uk: 'Чиста вода без домішок. При нормальному тиску замерзає при 0 °C і кипить при 100 °C.',
        en: 'Pure water without impurities. At normal pressure it freezes at 0 °C and boils at 100 °C.',
      },
      school: {
        uk: 'Має дуже велику питому теплоємність (≈ 4200 Дж/(кг·°C)), тому нагрівається й остигає повільно. Щоб розтопити 1 кг льоду, потрібно 334 кДж, а щоб випарувати 1 кг води — 2256 кДж.',
        en: 'It has a very high specific heat (≈ 4200 J/(kg·°C)), so it warms up and cools down slowly. Melting 1 kg of ice takes 334 kJ, boiling away 1 kg of water 2256 kJ.',
      },
    },
    media: [],
    liquid: { specificHeat: MATERIALS.water.specificHeat, density: MATERIALS.water.density, conductivity: MATERIALS.water.conductivity },
    freezing: {
      point: sv(0, '°C', '1 atm', 'cross-checked', 0.01, [
        { source: 'openstax-cp2e-latent', locator: 'Table 14.2, Water', conditions: '1 atm', value: 0 },
        { source: 'wikidata', locator: 'Q283 melting point', conditions: '101.325 kPa', value: 0 },
      ]),
      latentHeat: WATER_LF,
      solidSpecificHeat: MATERIALS.ice.specificHeat,
      solidDensity: sv(916.7, 'kg/m³', 'ice at 0 °C', 'single-source', 0.01, [{ source: 'wikidata', locator: 'Q23392 density', conditions: '0 °C', value: 916.7 }], 'Ice is lighter than water — that is why it floats.'),
    },
    boiling: {
      point: sv(100, '°C', '1 atm', 'cross-checked', 0.001, [
        { source: 'openstax-cp2e-latent', locator: 'Table 14.2, Water', conditions: '1 atm', value: 100 },
        { source: 'wikidata', locator: 'Q283 boiling point (ITS-90)', conditions: '101.325 kPa', value: 99.97 },
      ]),
      latentHeat: WATER_LV,
    },
  },
  'salt-water-10': {
    id: 'salt-water-10',
    category: 'liquid.solution',
    name: { uk: 'Соляний розчин 10 %', en: 'Salt water 10 %' },
    gender: 'm',
    description: {
      novice: {
        uk: 'Вода, у якій розчинено кухонну сіль (10 г солі на 100 г розчину). Солона вода замерзає при нижчій температурі, ніж прісна, — тому дороги взимку посипають сіллю.',
        en: 'Water with table salt dissolved in it (10 g of salt per 100 g of solution). Salt water freezes at a lower temperature than fresh water — that is why roads are salted in winter.',
      },
      school: {
        uk: 'Розчин NaCl 10 % замерзає приблизно при −6,6 °C. Що більше солі, то нижча температура замерзання — аж до −21,1 °C при 23,3 % солі.',
        en: 'A 10 % NaCl solution freezes at about −6.6 °C. The more salt, the lower the freezing point — down to −21.1 °C at 23.3 % salt.',
      },
    },
    media: [],
    liquid: {
      specificHeat: estimate(3700, 'J/(kg·K)', '10 % NaCl, room temperature', 3500, 3900, 'No source with numbers found; lower than pure water because salt has a low specific heat.'),
      density: sv(1074, 'kg/m³', '10 % NaCl, 60 °F (15.6 °C)', 'single-source', 0.01, [{ source: 'texasbrine-nacl', locator: '10.0 % row, specific gravity 1.074', conditions: '60 °F', value: 1074 }]),
    },
    freezing: {
      point: sv(-6.6, '°C', '10 % NaCl', 'single-source', 0.05, [{ source: 'texasbrine-nacl', locator: '10.0 % row: 20.2 °F', conditions: 'freezing point', value: -6.56 }], 'Consistent with the eutectic −21.1 °C at 23.3 % (Wikipedia, Brine).'),
      latentHeat: estimate(300_600, 'J/kg', 'ice freezing out of a 10 % solution', 280_000, 320_000, 'Estimate: latent heat of the water part (0.9 × 334 kJ/kg).'),
      solidSpecificHeat: estimate(2090, 'J/(kg·K)', 'frozen brine ≈ ice', 1800, 2300, 'Estimate: frozen brine is mostly ice.'),
    },
    boiling: {
      point: estimate(101.8, '°C', '10 % NaCl, 1 atm', 101, 102.5, 'Estimate by boiling-point elevation (Raoult); no direct measurement found.'),
      latentHeat: WATER_LV,
    },
    modelNotes: [
      {
        uk: 'Насправді солоний розчин замерзає поступово: спершу вимерзає лід, а залишок стає солонішим і замерзає дедалі холодніше. У моделі він замерзає при одній температурі.',
        en: 'In reality brine freezes gradually: ice freezes out first and the rest gets saltier and freezes ever colder. In the model it freezes at one temperature.',
      },
    ],
  },
  'salt-water-20': {
    id: 'salt-water-20',
    category: 'liquid.solution',
    name: { uk: 'Соляний розчин 20 %', en: 'Salt water 20 %' },
    gender: 'm',
    description: {
      novice: {
        uk: 'Дуже солона вода (20 г солі на 100 г розчину). Замерзає лише приблизно при −16 °C — звичайна морозилка (−18 °C) ледве з цим справляється.',
        en: 'Very salty water (20 g of salt per 100 g of solution). It freezes only at about −16 °C — an ordinary −18 °C freezer barely manages it.',
      },
      school: {
        uk: 'Розчин NaCl 20 % замерзає приблизно при −16,4 °C — лише трохи вище за температуру звичайної морозилки.',
        en: 'A 20 % NaCl solution freezes at about −16.4 °C — just a little above the temperature of an ordinary freezer.',
      },
    },
    media: [],
    liquid: {
      specificHeat: estimate(3400, 'J/(kg·K)', '20 % NaCl, room temperature', 3200, 3600, 'No source with numbers found.'),
      density: sv(1151, 'kg/m³', '20 % NaCl, 60 °F', 'single-source', 0.01, [{ source: 'texasbrine-nacl', locator: '20.0 % row, specific gravity 1.151', conditions: '60 °F', value: 1151 }]),
    },
    freezing: {
      point: sv(-16.4, '°C', '20 % NaCl', 'single-source', 0.05, [{ source: 'texasbrine-nacl', locator: '20.0 % row: 2.4 °F', conditions: 'freezing point', value: -16.44 }]),
      latentHeat: estimate(267_200, 'J/kg', 'ice freezing out of a 20 % solution', 240_000, 290_000, 'Estimate: 0.8 × 334 kJ/kg.'),
      solidSpecificHeat: estimate(2090, 'J/(kg·K)', 'frozen brine ≈ ice', 1800, 2300, 'Estimate.'),
    },
    boiling: {
      point: estimate(104, '°C', '20 % NaCl, 1 atm', 103, 105, 'Estimate by boiling-point elevation; no direct measurement found.'),
      latentHeat: WATER_LV,
    },
    modelNotes: [
      {
        uk: 'Насправді солоний розчин замерзає поступово; у моделі — при одній температурі.',
        en: 'In reality brine freezes gradually; in the model at one temperature.',
      },
    ],
  },
  ethanol: {
    id: 'ethanol',
    category: 'liquid.alcohol',
    name: { uk: 'Спирт (етанол)', en: 'Alcohol (ethanol)' },
    gender: 'm',
    flammable: true,
    description: {
      novice: {
        uk: 'Безбарвна рідина, яка кипить уже при 78 °C, а замерзає лише при −114 °C — жодна домашня морозилка її не заморозить.',
        en: 'A colourless liquid that boils already at 78 °C and freezes only at −114 °C — no home freezer can freeze it.',
      },
      school: {
        uk: 'Питома теплоємність спирту приблизно на 40 % менша, ніж у води, а теплота пароутворення — у 2,6 раза менша. Тому спирт нагрівається і википає значно швидше.',
        en: 'Ethanol has about 40 % lower specific heat than water and a 2.6 times lower heat of vaporisation. So it heats up and boils away much faster.',
      },
    },
    safety: {
      school: {
        uk: 'Спирт легко займається, а його пара — вибухонебезпечна. Справжній спирт не гріють на відкритому вогні.',
        en: 'Alcohol catches fire easily and its vapour can explode. Real alcohol is never heated over an open flame.',
      },
    },
    media: [],
    liquid: {
      specificHeat: sv(2570, 'J/(kg·K)', 'liquid, 25 °C', 'cross-checked', 0.06, [
        { source: 'wikidata', locator: 'Q153 specific heat capacity', conditions: 'liquid, 298 K', value: 2570 },
        { source: 'openstax-cp2e', locator: 'Table 14.1, Ethanol', conditions: '25 °C', value: 2450 },
      ]),
      density: sv(790, 'kg/m³', 'liquid, 20 °C', 'single-source', 0.01, [{ source: 'wikidata', locator: 'Q153 density', conditions: '20 °C', value: 790 }]),
    },
    freezing: {
      point: sv(-114, '°C', '1 atm', 'cross-checked', 0.01, [
        { source: 'openstax-cp2e-latent', locator: 'Table 14.2, Ethyl alcohol', conditions: '1 atm', value: -114 },
        { source: 'wikidata', locator: 'Q153 melting point', conditions: 'not stated', value: -114.1 },
      ]),
      latentHeat: sv(104_000, 'J/kg', 'at −114 °C', 'single-source', 0.01, [{ source: 'openstax-cp2e-latent', locator: 'Table 14.2, Ethyl alcohol', conditions: '1 atm', value: 104_000 }]),
      solidSpecificHeat: estimate(2000, 'J/(kg·K)', 'solid ethanol', 1500, 2500, 'Estimate; never reached in this lab (−114 °C).'),
    },
    boiling: {
      point: sv(78.3, '°C', '1 atm', 'cross-checked', 0.01, [
        { source: 'openstax-cp2e-latent', locator: 'Table 14.2, Ethyl alcohol', conditions: '1 atm', value: 78.3 },
        { source: 'wikidata', locator: 'Q153 boiling point', conditions: '101.325 kPa', value: 78.29 },
      ]),
      latentHeat: sv(854_000, 'J/kg', 'at 78.3 °C', 'single-source', 0.01, [{ source: 'openstax-cp2e-latent', locator: 'Table 14.2, Ethyl alcohol', conditions: '1 atm', value: 854_000 }]),
    },
  },
  'sunflower-oil': {
    id: 'sunflower-oil',
    category: 'liquid.oil',
    name: { uk: 'Олія соняшникова', en: 'Sunflower oil' },
    gender: 'f',
    description: {
      novice: {
        uk: 'Олія не кипить, як вода: якщо її довго гріти, при ≈ 232 °C (рафінована) вона починає димітися й розкладатися.',
        en: 'Oil does not boil like water: heated long enough, at ≈ 232 °C (refined) it starts to smoke and break down.',
      },
      school: {
        uk: 'За оцінкою, теплоємність олії приблизно вдвічі менша, ніж у води, тож вона нагрівається приблизно вдвічі швидше. Олія легша за воду (≈ 919 кг/м³) і проводить теплоту приблизно в 3,5 раза гірше.',
        en: 'By estimate, oil has about half the specific heat of water, so it heats about twice as fast. It is lighter than water (≈ 919 kg/m³) and conducts heat about 3.5 times worse.',
      },
    },
    safety: {
      school: {
        uk: 'Розпечена олія спричиняє сильні опіки, а вода, що потрапила в гарячу олію, розбризкує її. Палаючу олію не гасять водою.',
        en: 'Hot oil causes severe burns, and water that gets into hot oil makes it spatter. Burning oil is never put out with water.',
      },
    },
    media: [],
    liquid: {
      specificHeat: estimate(2000, 'J/(kg·K)', 'room temperature', 1800, 2300, 'Measured values exist (Rojas et al. 2013) but we could not access the numbers; typical for vegetable oils.'),
      density: sv(918.8, 'kg/m³', '25 °C', 'single-source', 0.01, [{ source: 'wikipedia-sunflower-oil', locator: 'Physical properties: density', conditions: '25 °C', value: 918.8 }]),
      conductivity: sv(0.168, 'W/(m·K)', '25 °C', 'single-source', 0.01, [{ source: 'turgut-2009-oils', locator: 'sunflower oil, hot-wire', conditions: '25 °C', value: 0.168 }]),
    },
    decomposes: sv(232, '°C', 'refined oil (unrefined: 107 °C)', 'single-source', 0.01, [{ source: 'wikipedia-sunflower-oil', locator: 'Smoke point, refined', conditions: 'refined', value: 232 }]),
    modelNotes: [
      {
        uk: 'Даних про застигання олії ми не знайшли, тому в моделі вона не застигає.',
        en: 'We found no data on how sunflower oil solidifies, so in the model it does not.',
      },
    ],
  },
} as const satisfies Record<string, SubstanceItem>;

export type SubstanceId = keyof typeof LIST;
export const SUBSTANCES: Readonly<Record<SubstanceId, SubstanceItem>> = LIST;

export const SUBSTANCE_CATEGORIES: readonly { readonly id: SubstanceItem['category']; readonly name: { uk: string; en: string } }[] = [
  { id: 'liquid.water', name: { uk: 'Вода', en: 'Water' } },
  { id: 'liquid.solution', name: { uk: 'Розчини', en: 'Solutions' } },
  { id: 'liquid.alcohol', name: { uk: 'Спирти', en: 'Alcohols' } },
  { id: 'liquid.oil', name: { uk: 'Олії', en: 'Oils' } },
];
