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
    phrase: { uk: 'на електроплиті', en: 'on an electric hob' },
    name: { uk: 'Електроплита (чавунна конфорка)', en: 'Electric hob (cast-iron plate)' },
    kind: 'heater',
    category: 'device.heater.household',
    description: {
      novice: { uk: 'Усередині чавунного диска — нагрівальна спіраль. Струм нагріває диск, а диск передає теплоту дну посуду дотиком. Сам диск розігрівається і холоне повільно.', en: 'Inside the cast-iron disc there is a heating coil. Electric current heats the disc, and the disc passes heat to the bottom of the pot by touch. The disc itself warms up and cools down slowly.' },
      school: { uk: 'Електричний струм нагріває спіраль у чавунному диску (закон Джоуля–Ленца). Диск передає теплоту посуду теплопровідністю через площу дотику; частина теплоти йде від розжареного диска в повітря.', en: 'Current heats a coil inside a cast-iron disc (Joule heating). The disc passes heat to the vessel by conduction through the contact area; part of the heat leaves the hot disc into the air.' },
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
    phrase: { uk: 'на індукційній плиті', en: 'on an induction hob' },
    name: { uk: 'Індукційна плита', en: 'Induction hob' },
    kind: 'heater',
    category: 'device.heater.household',
    description: {
      novice: { uk: 'Під склом схована котушка. Її змінне магнітне поле створює електричні струми просто в дні каструлі — і дно нагрівається саме. Тому плита гріє лише посуд із магнітного металу.', en: 'A coil is hidden under the glass. Its changing magnetic field creates electric currents right in the bottom of the pot — so the bottom heats itself. That is why the hob only heats pots made of a magnetic metal.' },
      school: { uk: 'Змінний струм у котушці створює змінне магнітне поле; воно наводить вихрові струми в дні посуду з феромагнітного металу (чавун, магнітні марки сталі), і дно нагрівається. Алюміній і мідь такі плити зазвичай не гріють.', en: 'Alternating current in a coil makes a changing magnetic field; it induces eddy currents in the base of a ferromagnetic pot (cast iron, magnetic steels), which heats it. Aluminium and copper are usually not heated.' },
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
    phrase: { uk: 'на газовій кухонній плиті', en: 'on a kitchen gas hob' },
    name: { uk: 'Газова плита (кухонна конфорка)', en: 'Gas hob (kitchen burner)' },
    kind: 'heater',
    category: 'device.heater.household',
    description: {
      novice: { uk: 'Горить природний газ. Гарячі гази полум’я обтікають дно посуду, але багато теплоти проходить повз нього в кімнату.', en: 'Natural gas burns. Hot flame gases flow around the bottom of the pot, but much of the heat goes past it into the room.' },
      school: { uk: 'Під час горіння газу виділяється теплота. Посуд отримує лише її частину: за вимірюваннями — приблизно 30–44 %; решта нагріває повітря навколо.', en: 'Burning gas releases heat. The pot receives only part of it — about 30–44 % by measurements; the rest heats the air around.' },
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
    phrase: { uk: 'кип’ятильником', en: 'with an immersion heater' },
    name: { uk: 'Кип’ятильник', en: 'Immersion heater' },
    kind: 'heater',
    category: 'device.heater.household',
    description: {
      novice: { uk: 'Нагрівальний елемент опускають просто у воду, тому майже вся теплота йде у воду.', en: 'The heating element goes straight into the water, so almost all the heat goes into the water.' },
      school: { uk: 'Струм нагріває металеву трубку з ізольованою спіраллю всередині; трубка віддає теплоту воді, яка оточує її з усіх боків. Втрат на нагрівання посуду й повітря мало.', en: 'Current heats a metal tube with an insulated coil inside; the tube gives heat to the water surrounding it on all sides. Little is lost to the vessel and the air.' },
    },
    safety: { school: { uk: 'Не вмикати кип’ятильник без води: вода має покривати нагрівальну частину.', en: 'Never switch an immersion heater on outside water: the water must cover the heating part.' } },
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
    phrase: { uk: 'над газовим пальником', en: 'over a Bunsen burner' },
    name: { uk: 'Газовий пальник (лабораторний)', en: 'Bunsen burner' },
    kind: 'heater',
    category: 'device.heater.laboratory',
    description: {
      novice: { uk: 'Лабораторний газовий пальник. Кількість газу регулюють вентилем, а кількість повітря — заслінкою; від цього залежить, яке полум’я.', en: 'A laboratory gas burner. A valve sets how much gas flows, a collar sets how much air mixes in — this changes the flame.' },
      school: { uk: 'Газ змішується з повітрям усередині трубки й згоряє над нею. Вентиль регулює витрату газу, отже, і потужність; посуд ставлять на триногу над полум’ям.', en: 'Gas mixes with air inside the tube and burns above it. The valve sets the gas flow and therefore the power; vessels stand on a tripod above the flame.' },
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
    phrase: { uk: 'над спиртівкою', en: 'over a spirit lamp' },
    name: { uk: 'Спиртівка', en: 'Spirit lamp' },
    kind: 'heater',
    category: 'device.heater.laboratory',
    description: {
      novice: { uk: 'Спирт піднімається ґнотом і горить невеликим полум’ям. Спиртівкою гріють пробірки й невеликі об’єми.', en: 'Alcohol rises up a wick and burns with a small flame. Spirit lamps heat test tubes and small amounts of liquid.' },
      school: { uk: 'Потужність спиртівки невелика, і точних даних про неї ми не знайшли — тут вона оцінена. Її можна виміряти самостійно: нагріти відому масу води й порахувати Q = c·m·Δt.', en: 'A spirit lamp has low power, and we found no reliable measurement — it is an estimate here. You can measure it yourself: heat a known mass of water and compute Q = c·m·Δt.' },
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
