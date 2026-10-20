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
    name: { uk: 'Батарейка 9 В («крона»)', en: '9 V battery' },
    phrase: { uk: 'з електродами від батарейки 9 В', en: 'with electrodes on a 9 V battery' },
    description: {
      novice: {
        uk: 'Прямокутна батарейка з двома кнопками-контактами зверху. Дає 9 вольт, але недовго: коли заряд закінчується, струму більше немає.',
        en: 'A rectangular battery with two snap terminals on top. It gives 9 volts, but not for long: when the charge runs out, there is no more current.',
      },
      school: {
        uk: 'Усередині — шість елементів по 1,5 В. Лужна батарейка вміщує ≈ 550 мА·год: наприклад, струм 0,55 А протягом години. Під навантаженням напруга трохи просідає через внутрішній опір.',
        en: 'Inside are six 1.5 V cells. An alkaline battery holds ≈ 550 mA·h: for example, 0.55 A for an hour. Under load its voltage sags a little because of the internal resistance.',
      },
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
    name: { uk: 'USB-заряджання (5 В)', en: 'USB charger (5 V)' },
    phrase: { uk: 'з електродами від USB-заряджання', en: 'with electrodes on a USB charger' },
    description: {
      novice: {
        uk: 'Звичайний USB-роз’єм дає 5 вольт. Через нього живлять і заряджають телефони.',
        en: 'An ordinary USB port gives 5 volts. Phones are powered and charged through it.',
      },
      school: {
        uk: 'Стандартний порт USB 2.0 віддає до 2,5 Вт, тобто до 0,5 А при 5 В; якщо струм більший, захист його вимикає.',
        en: 'A standard USB 2.0 port gives up to 2.5 W, that is up to 0.5 A at 5 V; a larger current trips its protection.',
      },
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
    name: { uk: 'Лабораторний блок живлення 0–30 В', en: 'Laboratory power supply 0–30 V' },
    phrase: { uk: 'з електродами від лабораторного блока живлення', en: 'with electrodes on a laboratory power supply' },
    description: {
      novice: {
        uk: 'Прилад із ручкою, якою можна плавно задати напругу від 0 до 30 вольт. Показує, який струм іде.',
        en: 'A device with a knob to set any voltage from 0 to 30 volts. It shows how much current flows.',
      },
      school: {
        uk: 'Блок живлення тримає задану напругу, а якщо струм перевищує 5 А, обмежує його. Безпечна напруга для дослідів — до 30–40 В.',
        en: 'The supply holds the set voltage, and if the current exceeds 5 A it limits it. Voltages up to 30–40 V are safe for experiments.',
      },
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
 * The electrodes of the lab: two steel plates, 2 × 5 cm dipped in the liquid,
 * 3 cm apart. Not a product but the experiment's geometry, so no source is needed.
 */
export const ELECTRODES: ElectrodesSpec = { material: 'steel', width: 0.02, height: 0.05, gap: 0.03 };
/** Cell constant K = L / A, 1/m: the resistance of the liquid between the plates is K / κ. */
export const cellConstant = (e: ElectrodesSpec): number => e.gap / (e.width * e.height);

/** Output voltage for a knob position 0 … 1. */
export const supplyVoltage = (s: SupplyItem, knob: number): number =>
  s.spec.control === 'fixed' ? s.spec.voltage.default : s.spec.voltage.min + Math.max(0, Math.min(1, knob)) * (s.spec.voltage.max - s.spec.voltage.min);
