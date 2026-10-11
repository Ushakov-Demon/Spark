import type { LocalizedText } from '../../knowledge/i18n.js';
import type { SourcedValue } from '../../knowledge/types.js';

/**
 * Heating devices the experimenter can choose.
 *
 *  - contact:   electric hotplate — a hot iron disc touching the pot;
 *  - flame:     gas hob, Bunsen burner, spirit lamp — only part of the flame's heat
 *               reaches the vessel, the rest goes straight into the room;
 *  - immersion: immersion heater (кип'ятильник) — sits in the water itself;
 *  - induction: induction hob — currents induced in the pot's own base heat it; works only
 *               with ferromagnetic pots (cast iron, magnetic steel), not with aluminium.
 *
 * `control`: knob — continuous power (like a real stove); switch — on/off only
 * (an immersion heater has no knob: you pick a model by its power).
 *
 * Every number is a SourcedValue; device data is often vendor data or an
 * estimate, and is reported as such.
 */
export type DeviceKind = 'contact' | 'flame' | 'immersion' | 'induction';
export type DeviceId = 'electric-hotplate' | 'induction-hob' | 'gas-hob' | 'immersion-heater' | 'bunsen-burner' | 'spirit-lamp';

export interface HeatingDevice {
  readonly id: DeviceId;
  readonly name: LocalizedText;
  readonly kind: DeviceKind;
  readonly control: 'knob' | 'switch';
  /** Selectable nominal (maximum) powers, W — e.g. small / medium / large burner. */
  readonly ratings: readonly number[];
  readonly defaultRating: number;
  /** Provenance of the ratings. */
  readonly ratingData: SourcedValue;
  /** Lowest working power as a fraction of the rating (flames cannot burn at 0). 0 = linear from zero. */
  readonly minFraction: number;
  readonly minFractionData?: SourcedValue;
  /** Flames and induction: share of the power that ends up in the vessel. */
  readonly vesselShare?: SourcedValue;
  /** Induction: pot materials the device can heat at all (others get no power). */
  readonly worksOnlyWith?: { readonly materials: readonly string[]; readonly source: string; readonly claim: string };
}

const W = 'W';

export const HEATING_DEVICES: Readonly<Record<DeviceId, HeatingDevice>> = {
  'electric-hotplate': {
    id: 'electric-hotplate',
    name: { uk: 'Електроплита (чавунна конфорка)', en: 'Electric hob (cast-iron plate)' },
    kind: 'contact',
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
  },
  'induction-hob': {
    id: 'induction-hob',
    name: { uk: 'Індукційна плита', en: 'Induction hob' },
    kind: 'induction',
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
    worksOnlyWith: {
      materials: ['steel', 'iron'],
      source: 'wikipedia-induction-cooking',
      claim: 'Cookware must contain a ferromagnetic metal such as cast iron or some stainless steels; induction tops typically will not heat copper or aluminium cookware.',
    },
  },
  'gas-hob': {
    id: 'gas-hob',
    name: { uk: 'Газова плита (кухонна конфорка)', en: 'Gas hob (kitchen burner)' },
    kind: 'flame',
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
  },
  'immersion-heater': {
    id: 'immersion-heater',
    name: { uk: 'Кип’ятильник', en: 'Immersion heater' },
    kind: 'immersion',
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
  },
  'bunsen-burner': {
    id: 'bunsen-burner',
    name: { uk: 'Газовий пальник (лабораторний)', en: 'Bunsen burner' },
    kind: 'flame',
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
  },
  'spirit-lamp': {
    id: 'spirit-lamp',
    name: { uk: 'Спиртівка', en: 'Spirit lamp' },
    kind: 'flame',
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
  },
};

/** Can this device heat a pot of this material at all? */
export const deviceWorksWith = (device: HeatingDevice, potMaterial: string): boolean =>
  !device.worksOnlyWith || device.worksOnlyWith.materials.includes(potMaterial);

/**
 * Knob position (0 … 1) → power, W. Position 0 is always "off". Flames have a
 * minimum stable flame; electric plates go linearly from zero.
 */
export function powerAt(device: HeatingDevice, rating: number, position: number): number {
  const x = Math.min(1, Math.max(0, position));
  if (x === 0) return 0;
  if (device.control === 'switch') return rating;
  return rating * (device.minFraction + (1 - device.minFraction) * x);
}
