import type { Citation, SourcedValue, Verification } from '../knowledge/types.js';
import { MATERIALS } from '../domains/thermal/materials.js';
import { mixtureBoilingPoint } from '../domains/thermal/mixture.js';
import { ZERO_CELSIUS_IN_KELVIN } from '../core/units.js';
import type { SubstanceItem } from './types.js';
import { NACL, NACL_DENSITY, NACL_FREEZING, SEAWATER_SALINITY, freezingPointOf, solutionDensity } from './nacl.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import type { LeveledText } from '../knowledge/levels.js';

const sv = (value: number, unit: string, conditions: string, verification: Verification, tolerance: number, citations: readonly Citation[], note?: string): SourcedValue => ({
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

const WATER_VAPOR = {
  molarMass: sv(0.01802, 'kg/mol', 'H₂O', 'single-source', 0.001, [{ source: 'wikidata', locator: 'Q283 mass (P2067)', conditions: '—', value: 0.01802 }]),
  pressure: { kind: 'buck' },
  pressureData: sv(101.3, 'kPa', 'Buck equation; value at 100 °C', 'single-source', 0.001, [{ source: 'wikipedia-vapour-pressure-water', locator: 'Buck equation; table 101.32 kPa at 100 °C', conditions: '0–100 °C', value: 101.32 }], 'Buck equation agrees with the table within 0.04 % over 0–100 °C.'),
  latentLow: { temperature: 37, value: sv(2_430_000, 'J/kg', 'water at 37 °C', 'single-source', 0.01, [{ source: 'openstax-cp2e-latent', locator: 'Table 14.2 footnote: Lv at 37.0 °C', conditions: '37 °C', value: 2_430_000 }]) },
} as const satisfies SubstanceItem['vapor'];

/**
 * Water + table salt at mass fraction w: a recipe, not a substance of its own. The
 * numbers below are for the shelf card; the experiment computes everything from the
 * composition (mixture model).
 */
function brine(id: string, w: number, t: { name: LocalizedText; gender: SubstanceItem['gender']; description: LeveledText; notes?: LocalizedText[] }): SubstanceItem {
  const pct = `${Math.round(w * 1000) / 10} % NaCl`;
  const fromModel = (value: number, unit: string, conditions: string, note: string): SourcedValue =>
    sv(value, unit, conditions, 'estimate', 0.05, [{ source: 'spark', locator: 'mixture model', conditions: 'computed from water + NaCl data', range: [value - Math.abs(value) * 0.05, value + Math.abs(value) * 0.05] }], note);
  return {
    id,
    category: 'liquid.solution',
    name: t.name,
    gender: t.gender,
    description: t.description,
    media: [],
    mixture: { saltFraction: w },
    liquid: {
      // Weighted by mass: water + solid salt (the heat of dissolution and non-ideal mixing ignored).
      specificHeat: fromModel(Math.round((1 - w) * MATERIALS.water.specificHeat.value + w * NACL.specificHeat.value), 'J/(kg·K)', pct, 'Mass-weighted average of water and salt; real brine is a few per cent lower.'),
      density: sv(Math.round(solutionDensity(w)), 'kg/m³', pct, 'single-source', 0.01, NACL_DENSITY.data.citations, 'Interpolated in the table.'),
    },
    freezing: {
      point: sv(Math.round(freezingPointOf(w) * 100) / 100, '°C', `${pct}: ice starts to form`, 'single-source', 0.05, NACL_FREEZING.data.citations, 'Ice starts to form here; the rest freezes gradually down to −21.1 °C.'),
      latentHeat: WATER_LF,
      solidSpecificHeat: MATERIALS.ice.specificHeat,
    },
    vapor: WATER_VAPOR,
    boiling: {
      point: fromModel(Math.round((mixtureBoilingPoint({ water: 1 - w, salt: w, ice: 0, crystals: 0 }) - ZERO_CELSIUS_IN_KELVIN) * 10) / 10, '°C', `${pct}, 1 atm, at the start`, "Raoult's law with full dissociation; rises as water boils away."),
      latentHeat: WATER_LV,
    },
    ...(t.notes ? { modelNotes: t.notes } : {}),
  };
}

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
    vapor: {
      molarMass: sv(0.01802, 'kg/mol', 'H₂O', 'single-source', 0.001, [{ source: 'wikidata', locator: 'Q283 mass (P2067)', conditions: '—', value: 0.01802 }]),
      pressure: { kind: 'buck' },
      pressureData: sv(101.3, 'kPa', 'Buck equation; value at 100 °C', 'single-source', 0.001, [{ source: 'wikipedia-vapour-pressure-water', locator: 'Buck equation; table 101.32 kPa at 100 °C', conditions: '0–100 °C', value: 101.32 }], 'Buck equation agrees with the table within 0.04 % over 0–100 °C.'),
      latentLow: { temperature: 37, value: sv(2_430_000, 'J/kg', 'water at 37 °C', 'single-source', 0.01, [{ source: 'openstax-cp2e-latent', locator: 'Table 14.2 footnote: Lv at 37.0 °C', conditions: '37 °C', value: 2_430_000 }]) },
    },
    boiling: {
      point: sv(100, '°C', '1 atm', 'cross-checked', 0.001, [
        { source: 'openstax-cp2e-latent', locator: 'Table 14.2, Water', conditions: '1 atm', value: 100 },
        { source: 'wikidata', locator: 'Q283 boiling point (ITS-90)', conditions: '101.325 kPa', value: 99.97 },
      ]),
      latentHeat: WATER_LV,
    },
  },
  'sea-water': brine('sea-water', SEAWATER_SALINITY.value, {
    name: { uk: 'Морська вода', en: 'Sea water' },
    gender: 'f',
    description: {
      novice: {
        uk: 'Вода з розчиненою сіллю — приблизно 35 г солі на кожен кілограм. Її можна «зробити» самому: дистильована вода + кухонна сіль. А якщо випарити воду — сіль залишиться.',
        en: 'Water with salt dissolved in it — about 35 g per kilogram. You can "make" it yourself: distilled water + table salt. Boil the water away and the salt stays behind.',
      },
      school: {
        uk: 'Солоність океану в середньому 3,5 %. Сіль знижує тиск пари води, тому морська вода кипить трохи вище за 100 °C і замерзає близько −2 °C, причому поступово: спершу вимерзає прісний лід, а розсіл, що лишається, стає солонішим.',
        en: 'Ocean salinity averages 3.5 %. Salt lowers the vapour pressure of water, so sea water boils a little above 100 °C and freezes at about −2 °C — gradually: fresh ice freezes out first and the remaining brine gets saltier.',
      },
    },
    notes: [
      {
        uk: 'Справжня морська сіль — це не лише NaCl (≈ 86 % іонів Na⁺ і Cl⁻, решта — магній, сульфати тощо). У моделі вся сіль вважається кухонною.',
        en: 'Real sea salt is not only NaCl (≈ 86 % Na⁺ and Cl⁻ ions, the rest magnesium, sulfates, etc.). The model treats all of it as table salt.',
      },
    ],
  }),
  'salt-water-10': brine('salt-water-10', 0.1, {
    name: { uk: 'Соляний розчин 10 %', en: 'Salt water 10 %' },
    gender: 'm',
    description: {
      novice: {
        uk: 'Вода, у якій розчинено кухонну сіль (10 г солі на 100 г розчину). Солона вода замерзає при нижчій температурі, ніж прісна, — тому дороги взимку посипають сіллю.',
        en: 'Water with table salt dissolved in it (10 g of salt per 100 g of solution). Salt water freezes at a lower temperature than fresh water — that is why roads are salted in winter.',
      },
      school: {
        uk: 'Розчин NaCl 10 % починає замерзати приблизно при −6,6 °C. Що більше солі, то нижча температура замерзання — аж до −21,1 °C при 23,3 % солі: нижче цієї температури розсіл замерзає повністю.',
        en: 'A 10 % NaCl solution starts to freeze at about −6.6 °C. The more salt, the lower the freezing point — down to −21.1 °C at 23.3 % salt: below that the brine freezes completely.',
      },
    },
  }),
  'salt-water-20': brine('salt-water-20', 0.2, {
    name: { uk: 'Соляний розчин 20 %', en: 'Salt water 20 %' },
    gender: 'm',
    description: {
      novice: {
        uk: 'Дуже солона вода (20 г солі на 100 г розчину). Починає замерзати лише приблизно при −16 °C, а повністю замерзає тільки нижче −21 °C — звичайна морозилка (−18 °C) заморозить лише частину.',
        en: 'Very salty water (20 g of salt per 100 g of solution). It starts to freeze only at about −16 °C and freezes completely only below −21 °C — an ordinary −18 °C freezer freezes just part of it.',
      },
      school: {
        uk: 'Розчин NaCl 20 % починає замерзати приблизно при −16,4 °C. Що більше льоду вимерзло, то солоніший розсіл і то холодніше треба, аж до −21,1 °C.',
        en: 'A 20 % NaCl solution starts to freeze at about −16.4 °C. The more ice has frozen out, the saltier the brine and the colder it takes, down to −21.1 °C.',
      },
    },
  }),
  'table-salt': {
    id: 'table-salt',
    category: 'solid.salt',
    name: { uk: 'Кухонна сіль', en: 'Table salt' },
    gender: 'f',
    description: {
      novice: {
        uk: 'Хлорид натрію (NaCl) — звичайна сіль. Добре розчиняється у воді: у 100 г води — до ≈ 36 г. Якщо солі більше, решта лежить на дні кристалами.',
        en: 'Sodium chloride (NaCl) — ordinary salt. It dissolves well in water: up to ≈ 36 g in 100 g of water. Any more stays on the bottom as crystals.',
      },
      school: {
        uk: 'Розчинність NaCl майже не залежить від температури: ≈ 35,7 г на 100 г води при 0 °C і ≈ 39 г при 100 °C. Тому сіль зручно добувати випарюванням, а не охолодженням.',
        en: 'The solubility of NaCl barely depends on temperature: ≈ 35.7 g per 100 g of water at 0 °C and ≈ 39 g at 100 °C. So salt is obtained by evaporation rather than by cooling.',
      },
    },
    media: [],
    mixture: { saltFraction: 1 },
    liquid: { specificHeat: NACL.specificHeat, density: NACL.density },
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
    vapor: {
      molarMass: sv(0.046042, 'kg/mol', 'C₂H₅OH', 'single-source', 0.001, [{ source: 'wikidata', locator: 'Q153 mass (P2067)', conditions: '—', value: 0.046042 }]),
      pressure: { kind: 'antoine', A: 8.04494, B: 1554.3, C: 222.65 },
      pressureData: sv(760, 'mmHg', 'Antoine equation; value at 78.4 °C', 'single-source', 0.01, [{ source: 'wikipedia-ethanol-data', locator: 'Antoine constants; 760 mmHg at 78.4 °C', conditions: '°C, mmHg', value: 760 }], 'The equation gives 762 mmHg at 78.4 °C.'),
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
  { id: 'solid.salt', name: { uk: 'Солі', en: 'Salts' } },
];
