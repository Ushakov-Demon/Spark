import { ZERO_CELSIUS_IN_KELVIN } from '../core/units.js';
import { NUMBER_LOCALE, type Locale } from '../knowledge/i18n.js';
import type { Level } from '../knowledge/levels.js';

/** Who we are explaining to. */
export interface ExplainContext {
  readonly level: Level;
  readonly locale: Locale;
}

const SIGNIFICANT: Readonly<Record<Level, number>> = { novice: 2, school: 4, advanced: 4, expert: 6 };
const TEMP_DECIMALS: Readonly<Record<Level, number>> = { novice: 0, school: 1, advanced: 1, expert: 3 };
const DELTA_DECIMALS: Readonly<Record<Level, number>> = { novice: 1, school: 1, advanced: 2, expert: 3 };

const nf = (locale: Locale, opts: Intl.NumberFormatOptions) => new Intl.NumberFormat(NUMBER_LOCALE[locale], opts);

export const sig = (v: number, digits: number, locale: Locale): string =>
  v === 0 ? '0' : nf(locale, { maximumSignificantDigits: digits }).format(v);
export const fixed = (v: number, decimals: number, locale: Locale): string =>
  // Avoid "-0,0" after rounding a tiny negative number.
  nf(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Math.abs(v) < 0.5 * 10 ** -decimals ? 0 : v);

/** Unit symbols per language (SI symbols are international, but Ukrainian uses Cyrillic ones). */
const UNITS: Readonly<Record<Locale, Readonly<Record<string, string>>>> = {
  uk: {
    J: 'Дж', kJ: 'кДж', W: 'Вт', kg: 'кг', s: 'с', min: 'хв', m: 'м', 'm²': 'м²', K: 'K', '°C': '°C',
    'W/K': 'Вт/К', 'J/K': 'Дж/К', 'W/(m·K)': 'Вт/(м·К)', 'W/(m²·K)': 'Вт/(м²·К)', 'J/(kg·K)': 'Дж/(кг·К)', 'J/(kg·°C)': 'Дж/(кг·°C)',
  },
  en: {
    J: 'J', kJ: 'kJ', W: 'W', kg: 'kg', s: 's', min: 'min', m: 'm', 'm²': 'm²', K: 'K', '°C': '°C',
    'W/K': 'W/K', 'J/K': 'J/K', 'W/(m·K)': 'W/(m·K)', 'W/(m²·K)': 'W/(m²·K)', 'J/(kg·K)': 'J/(kg·K)', 'J/(kg·°C)': 'J/(kg·°C)',
  },
};

/** Unit label alone (for "where c — specific heat, J/(kg·°C)"). */
export function unitLabel(unit: string, { level, locale }: ExplainContext): string {
  const u = UNITS[locale];
  switch (unit) {
    case 'K':
    case 'ΔK':
      return level === 'expert' ? 'K' : '°C';
    case 'J/(kg·K)':
      return u[level === 'expert' ? 'J/(kg·K)' : 'J/(kg·°C)']!;
    default:
      return u[unit] ?? unit;
  }
}

/**
 * Formats a value in engine SI units for a reader.
 * 'K' = absolute temperature (°C for students), 'ΔK' = temperature difference.
 */
export function formatQuantity(value: number, unit: string, ctx: ExplainContext): string {
  const { level, locale } = ctx;
  const n = SIGNIFICANT[level];
  switch (unit) {
    case 'K': {
      const c = `${fixed(value - ZERO_CELSIUS_IN_KELVIN, TEMP_DECIMALS[level], locale)} °C`;
      return level === 'expert' ? `${c} (${fixed(value, 3, locale)} K)` : c;
    }
    case 'ΔK':
      return `${fixed(value, DELTA_DECIMALS[level], locale)} ${unitLabel(unit, ctx)}`;
    case 'J':
      if (Math.abs(value) >= 1000 && level !== 'expert') return `${sig(value / 1000, n, locale)} ${UNITS[locale]['kJ']}`;
      return `${sig(value, n, locale)} ${UNITS[locale]['J']}`;
    case 's':
      if (value >= 120 && level !== 'expert') {
        return `${fixed(Math.round(value), 0, locale)} ${UNITS[locale]['s']} (≈ ${fixed(value / 60, 1, locale)} ${UNITS[locale]['min']})`;
      }
      return `${sig(value, n, locale)} ${UNITS[locale]['s']}`;
    case '':
      return sig(value, n, locale);
    default:
      return `${sig(value, n, locale)} ${unitLabel(unit, ctx)}`;
  }
}

export const formatTime = (t: number, locale: Locale): string => {
  const whole = Math.abs(t - Math.round(t)) < 1e-6;
  return `${fixed(whole ? Math.round(t) : t, whole ? 0 : 1, locale)} ${UNITS[locale]['s']}`;
};

/** 594 s → "9 хв 54 с" / "9 min 54 s"; 3900 s → "1 год 5 хв". Compact, for headlines and live readouts. */
export function formatDuration(seconds: number, locale: Locale): string {
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const [H, M, S] = locale === 'uk' ? ['год', 'хв', 'с'] : ['h', 'min', 's'];
  if (h) return m ? `${h} ${H} ${m} ${M}` : `${h} ${H}`;
  if (m) return s ? `${m} ${M} ${s} ${S}` : `${m} ${M}`;
  return `${s} ${S}`;
}

/**
 * Ukrainian noun form after a number: 1 запис, 2 записи, 5 записів, 11 записів, 21 запис.
 * (English: 1 row, 2 rows.)
 */
export function pluralUk(n: number, one: string, few: string, many: string): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  if (b >= 2 && b <= 4) return few;
  return many;
}
