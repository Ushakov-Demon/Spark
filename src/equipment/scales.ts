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
    name: { uk: 'Кухонні ваги (до 5 кг)', en: 'Kitchen scales (up to 5 kg)' },
    description: {
      novice: {
        uk: 'Ставиш на них каструлю — і на екрані маса в грамах. Тримають до 5 кілограмів.',
        en: 'Put a pot on them and the screen shows its mass in grams. They hold up to 5 kilograms.',
      },
      school: {
        uk: 'Електронні ваги з ціною поділки 1 г: менші зміни маси вони не помітять. Кнопка «тара» обнуляє покази, щоб зважувати лише вміст посуду.',
        en: 'Electronic scales with a 1 g division: they do not notice smaller changes of mass. The "tare" button zeroes the reading to weigh only what is in the vessel.',
      },
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
    name: { uk: 'Лабораторні ваги (до 620 г)', en: 'Laboratory balance (up to 620 g)' },
    description: {
      novice: {
        uk: 'Точні ваги для лабораторії: показують масу до сотої частки грама. Але важке на них не постав — тримають лише 620 грамів.',
        en: 'Precise laboratory scales: they show mass to a hundredth of a gram. But nothing heavy — they hold only 620 grams.',
      },
      school: {
        uk: 'Ціна поділки 0,01 г — у сто разів дрібніша, ніж у кухонних ваг: видно, як із води потроху випаровується кілька десятих грама. Що точніші ваги, то менша їхня найбільша межа зважування.',
        en: 'The division is 0.01 g — a hundred times finer than kitchen scales: you can see a few tenths of a gram of water evaporate. The more precise the scales, the smaller their maximum load.',
      },
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
} as const satisfies Record<string, ScaleItem>;

export type ScaleId = keyof typeof LIST;
export const SCALES: Readonly<Record<ScaleId, ScaleItem>> = LIST;
export const SCALE_IDS = Object.keys(LIST) as ScaleId[];

/** What the display shows for a mass, kg: rounded to the division; null — overload. */
export function scaleReading(s: ScaleItem, mass: number): number | null {
  if (mass > s.spec.capacity.value) return null;
  const d = s.spec.resolution.value;
  // Round in whole divisions so 0.01 g steps do not pick up float noise.
  return Math.round(mass / d) * d;
}
