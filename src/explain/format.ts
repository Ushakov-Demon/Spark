import { ZERO_CELSIUS_IN_KELVIN } from '../core/units.js';
import type { Level } from '../knowledge/levels.js';

const SIGNIFICANT: Readonly<Record<Level, number>> = { novice: 2, school: 4, advanced: 4, expert: 6 };
const TEMP_DECIMALS: Readonly<Record<Level, number>> = { novice: 0, school: 1, advanced: 1, expert: 3 };

const nf = (opts: Intl.NumberFormatOptions) => new Intl.NumberFormat('ru-RU', opts);

export const sig = (v: number, digits: number): string =>
  v === 0 ? '0' : nf({ maximumSignificantDigits: digits }).format(v);
export const fixed = (v: number, decimals: number): string =>
  nf({ minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(v);

const UNIT_RU: Readonly<Record<string, string>> = {
  J: 'Дж',
  W: 'Вт',
  kg: 'кг',
  s: 'с',
  m: 'м',
  'm²': 'м²',
  'W/K': 'Вт/К',
  'J/K': 'Дж/К',
  'W/(m·K)': 'Вт/(м·К)',
  'W/(m²·K)': 'Вт/(м²·К)',
};

/**
 * Formats a value in engine SI units for a reader of the given level.
 * 'K' = absolute temperature (°C for students), 'ΔK' = temperature difference.
 */
export function formatQuantity(value: number, unit: string, level: Level): string {
  const n = SIGNIFICANT[level];
  switch (unit) {
    case 'K': {
      const c = `${fixed(value - ZERO_CELSIUS_IN_KELVIN, TEMP_DECIMALS[level])} °C`;
      return level === 'expert' ? `${c} (${fixed(value, 3)} K)` : c;
    }
    case 'ΔK':
      return `${sig(value, n)} ${level === 'expert' ? 'K' : '°C'}`;
    case 'J':
      if (Math.abs(value) >= 10_000 && level !== 'expert') return `${sig(value / 1000, n)} кДж`;
      return `${sig(value, n)} Дж`;
    case 'J/(kg·K)':
      return `${sig(value, n)} ${level === 'expert' ? 'Дж/(кг·К)' : 'Дж/(кг·°C)'}`;
    case '':
      return sig(value, n);
    default:
      return `${sig(value, n)} ${UNIT_RU[unit] ?? unit}`;
  }
}

export const formatTime = (t: number): string => {
  const whole = Math.abs(t - Math.round(t)) < 1e-6;
  return `${fixed(whole ? Math.round(t) : t, whole ? 0 : 1)} с`;
};

/** Unit label alone (for "where c — specific heat, Дж/(кг·°C)"). */
export function unitLabel(unit: string, level: Level): string {
  switch (unit) {
    case 'K':
      return level === 'expert' ? 'K' : '°C';
    case 'ΔK':
      return level === 'expert' ? 'K' : '°C';
    case 'J/(kg·K)':
      return level === 'expert' ? 'Дж/(кг·К)' : 'Дж/(кг·°C)';
    default:
      return UNIT_RU[unit] ?? unit;
  }
}
