import { msg } from '../knowledge/messages.js';
import type { ElectrodesSpec, SupplyItem } from './types.js';

/**
 * Sources of direct current. Mains voltage (230 V) is deliberately not offered:
 * never put mains wires into water.
 */
const LIST = {
  'battery-9v': {
    id: 'battery-9v',
    look: 'battery',
    kind: 'supply',
    category: 'device.power.household',
    name: msg('supply-battery-9v'),
    phrase: msg('supply-battery-9v-phrase'),
    description: {
      novice: msg('supply-battery-9v-description-novice'),
      school: msg('supply-battery-9v-description-school'),
    },
    media: [],
    spec: {
      voltage: {
        min: 9,
        max: 9,
        default: 9,
        data: { value: 9, unit: 'V', conditions: 'nominal', verification: 'single-source', tolerance: 0.01, citations: [{ source: 'wikipedia-nine-volt-battery', locator: 'nominal voltage of 9 volts (actual 7.2–9.6 V)', conditions: 'nominal', value: 9 }], note: 'Only the Wikipedia article checked so far; a fresh battery is a bit above 9 V, a used one below.' },
      },
      control: 'fixed',
      currentLimit: { value: 1, unit: 'A', conditions: 'short pulses', verification: 'estimate', tolerance: 0.5, citations: [{ source: 'spark', locator: 'estimate', conditions: 'no source found', range: [0.5, 2] }], note: 'No source found; in practice the internal resistance limits the current long before this.' },
      internalResistance: { value: 1.7, unit: 'Ω', conditions: 'fresh alkaline', verification: 'estimate', tolerance: 0.5, citations: [{ source: 'spark', locator: 'estimate', conditions: 'no source found', range: [1, 3] }], note: 'No source with numbers found (Wikipedia gives none); typical for alkaline 9 V batteries.' },
      capacity: { value: 0.55, unit: 'A·h', conditions: 'alkaline 6LR61', verification: 'single-source', tolerance: 0.01, citations: [{ source: 'wikipedia-nine-volt-battery', locator: 'table: alkaline 6LR61, typical capacity 550 mAh', conditions: 'alkaline', value: 0.55 }], note: 'Typical value; real capacity falls at high currents.' },
    },
  },
  'usb-charger': {
    id: 'usb-charger',
    look: 'usb',
    kind: 'supply',
    category: 'device.power.household',
    name: msg('supply-usb-charger'),
    phrase: msg('supply-usb-charger-phrase'),
    description: {
      novice: msg('supply-usb-charger-description-novice'),
      school: msg('supply-usb-charger-description-school'),
    },
    media: [],
    spec: {
      voltage: {
        min: 5,
        max: 5,
        default: 5,
        data: { value: 5, unit: 'V', conditions: 'VBUS', verification: 'single-source', tolerance: 0.01, citations: [{ source: 'wikipedia-usb-hardware', locator: 'Power (VBUS, 5 V)', conditions: '—', value: 5 }], note: 'Only the Wikipedia article checked so far.' },
      },
      control: 'fixed',
      currentLimit: { value: 0.5, unit: 'A', conditions: 'USB 2.0 port', verification: 'single-source', tolerance: 0.01, citations: [{ source: 'wikipedia-usb-hardware', locator: 'USB 1.0/2.0 provided up to 2.5 W (at 5 V)', conditions: 'USB 2.0', value: 0.5 }], note: 'Derived: 2.5 W at 5 V. Chargers built for phones give more.' },
    },
  },
  'bench-supply': {
    id: 'bench-supply',
    look: 'supply',
    kind: 'supply',
    category: 'device.power.laboratory',
    name: msg('supply-bench'),
    phrase: msg('supply-bench-phrase'),
    description: {
      novice: msg('supply-bench-supply-description-novice'),
      school: msg('supply-bench-supply-description-school'),
    },
    media: [],
    spec: {
      voltage: {
        min: 0,
        max: 30,
        default: 12,
        data: { value: 30, unit: 'V', conditions: 'maximum', verification: 'single-source', tolerance: 0.01, citations: [{ source: 'korad-ka3005d', locator: 'adjustable voltage 0–30 V', conditions: '—', value: 30 }], note: 'A typical bench supply (Korad KA3005D class); one distributor listing checked.' },
      },
      control: 'knob',
      currentLimit: { value: 5, unit: 'A', conditions: 'current limit', verification: 'single-source', tolerance: 0.01, citations: [{ source: 'korad-ka3005d', locator: 'current range 0–5 A', conditions: '—', value: 5 }], note: 'One distributor listing checked.' },
    },
  },
} as const satisfies Record<string, SupplyItem>;

export type SupplyId = keyof typeof LIST;
export const SUPPLIES: Readonly<Record<SupplyId, SupplyItem>> = LIST;

/**
 * The electrodes of the lab: two plates, 2 × 5 cm dipped in the liquid, 3 cm apart. Not a product
 * but the experiment's geometry, so no source is needed. Graphite, as in school electrolysis;
 * steel ones can be chosen (a steel anode dissolves) — `ELECTRODE_MATERIALS`.
 */
export const ELECTRODES: ElectrodesSpec = { material: 'graphite', width: 0.02, height: 0.05, gap: 0.03 };
/** What the electrodes can be made of (component ids). */
export const ELECTRODE_MATERIALS = ['graphite', 'steel', 'copper'] as const;
export type ElectrodeMaterial = (typeof ELECTRODE_MATERIALS)[number];
export const electrodesOf = (material: ElectrodeMaterial | undefined): ElectrodesSpec => (material ? { ...ELECTRODES, material } : ELECTRODES);
/** Cell constant K = L / A, 1/m: the resistance of the liquid between the plates is K / κ. */
export const cellConstant = (e: ElectrodesSpec): number => e.gap / (e.width * e.height);

/** Output voltage for a knob position 0 … 1. */
export const supplyVoltage = (s: SupplyItem, knob: number): number =>
  s.spec.control === 'fixed' ? s.spec.voltage.default : s.spec.voltage.min + Math.max(0, Math.min(1, knob)) * (s.spec.voltage.max - s.spec.voltage.min);
