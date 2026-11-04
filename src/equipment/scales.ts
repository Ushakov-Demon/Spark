import { msg } from '../knowledge/messages.js';
import type { ScaleItem } from './types.js';

/**
 * Electronic scales. The reading is the mass on the platform rounded to the
 * scale division; above the capacity the display shows an overload.
 */
const LIST = {
  'kitchen-scale': {
    id: 'kitchen-scale',
    look: 'kitchen-scale',
    kind: 'scale',
    category: 'device.measuring.household',
    name: msg('scale-kitchen'),
    description: {
      novice: msg('scale-kitchen-scale-description-novice'),
      school: msg('scale-kitchen-scale-description-school'),
    },
    media: [],
    spec: {
      capacity: { value: 5, unit: 'kg', conditions: 'maximum load', verification: 'cross-checked', tolerance: 0.01, citations: [
        { source: 'galaxus-salter-1050', locator: 'maximum load 5 kg', conditions: 'Salter 1050', value: 5 },
        { source: 'salter-digital-kitchen-scales', locator: 'maximum capacity of 5–10 kg', conditions: 'most models', range: [5, 10] },
      ] },
      resolution: { value: 0.001, unit: 'kg', conditions: 'scale division', verification: 'cross-checked', tolerance: 0.01, citations: [
        { source: 'galaxus-salter-1050', locator: 'precision 1 g', conditions: 'Salter 1050', value: 0.001 },
        { source: 'salter-digital-kitchen-scales', locator: '1 g accuracy', conditions: 'most models', value: 0.001 },
      ] },
    },
  },
  'lab-balance': {
    id: 'lab-balance',
    look: 'lab-balance',
    kind: 'scale',
    category: 'device.measuring.laboratory',
    name: msg('scale-lab-balance'),
    description: {
      novice: msg('scale-lab-balance-description-novice'),
      school: msg('scale-lab-balance-description-school'),
    },
    media: [],
    spec: {
      capacity: { value: 0.62, unit: 'kg', conditions: 'maximum capacity', verification: 'cross-checked', tolerance: 0.01, citations: [
        { source: 'fishersci-ohaus-scout-stx', locator: 'STX622: capacity 620 g', conditions: 'OHAUS Scout STX622', value: 0.62 },
        { source: 'labfriend-ohaus-stx622', locator: '620 g × 0.01 g', conditions: 'OHAUS Scout STX622', value: 0.62 },
      ] },
      resolution: { value: 0.00001, unit: 'kg', conditions: 'readability', verification: 'cross-checked', tolerance: 0.01, citations: [
        { source: 'fishersci-ohaus-scout-stx', locator: 'STX622: readability 0.01 g', conditions: 'OHAUS Scout STX622', value: 0.00001 },
        { source: 'labfriend-ohaus-stx622', locator: '620 g × 0.01 g', conditions: 'OHAUS Scout STX622', value: 0.00001 },
      ] },
    },
  },
  dynamometer: {
    id: 'dynamometer',
    look: 'dynamometer',
    kind: 'scale',
    category: 'device.measuring.laboratory',
    name: msg('scale-dynamometer'),
    description: {
      novice: msg('scale-dynamometer-description-novice'),
      school: msg('scale-dynamometer-description-school'),
    },
    media: [],
    spec: {
      quantity: 'force',
      capacity: { value: 5, unit: 'N', conditions: 'measuring range', verification: 'cross-checked', tolerance: 0.01, citations: [
        { source: '3b-dynamometer-5n', locator: 'measuring range 5 N', conditions: 'U8402505', value: 5 },
        { source: 'prozorro-physics-lab-2023', locator: 'динамометр лабораторний 5 Н', conditions: 'school physics room', value: 5 },
      ] },
      resolution: { value: 0.1, unit: 'N', conditions: 'scale division', verification: 'single-source', tolerance: 0.01, citations: [
        { source: '3b-dynamometer-5n', locator: 'scale division 0.1 N', conditions: 'U8402505', value: 0.1 },
      ], note: 'One listing checked; school dynamometers commonly have 0.1 N divisions.' },
    },
  },
} as const satisfies Record<string, ScaleItem>;

export type ScaleId = keyof typeof LIST;
export const SCALES: Readonly<Record<ScaleId, ScaleItem>> = LIST;
export const SCALE_IDS = Object.keys(LIST) as ScaleId[];
/** Scales that weigh (mass): the dynamometer measures force and is used by hanging a body on it. */
export const MASS_SCALE_IDS = SCALE_IDS.filter((id) => (SCALES[id].spec.quantity ?? 'mass') === 'mass');

/** What the display shows for a mass, kg: rounded to the division; null — overload. */
export function scaleReading(s: ScaleItem, mass: number): number | null {
  if (mass > s.spec.capacity.value) return null;
  const d = s.spec.resolution.value;
  // Round in whole divisions so 0.01 g steps do not pick up float noise.
  return Math.round(mass / d) * d;
}
