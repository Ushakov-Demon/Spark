import { ZERO_CELSIUS_IN_KELVIN } from '../core/units.js';
import { NUMBER_LOCALE, type Locale } from '../knowledge/i18n.js';
import type { Level } from '../knowledge/levels.js';
import { byLocale, t as tl } from '../knowledge/messages.js';

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
const UNITS: Readonly<Record<Locale, Readonly<Record<string, string>>>> = byLocale((l: Locale) => ({
    J: tl(l, 'explain-format-units-j'), kJ: tl(l, 'explain-format-units-k-j'), W: tl(l, 'explain-format-units-w'), kg: tl(l, 'explain-format-units-kg'), s: tl(l, 'explain-format-units-s'), min: tl(l, 'explain-format-units-min'), 'J/kg': tl(l, 'explain-format-units-jkg'), 'kg/s': tl(l, 'explain-format-units-kgs'), 'm/s': tl(l, 'explain-format-units-ms'), 'kg/m³': tl(l, 'explain-format-units-kgm'), 'kg/mol': tl(l, 'explain-format-units-kgmol'), 'g/100 g water': tl(l, 'explain-format-units-g100gwater'), 'g/100 mL water': tl(l, 'explain-format-units-g100m-lwater'), 'g CuSO₄/100 mL water': tl(l, 'explain-format-units-gcu-so100m-lwater'), '1/K': tl(l, 'explain-format-units-1k'), 'A·h': tl(l, 'explain-format-units-ah'), m: tl(l, 'explain-format-units-m'), 'm²': tl(l, 'explain-format-units-m-2'), K: 'K', '°C': '°C',
    'W/K': tl(l, 'explain-format-units-wk'), 'J/K': tl(l, 'explain-format-units-jk'), 'W/(m·K)': tl(l, 'explain-format-units-wmk'), 'W/(m²·K)': tl(l, 'explain-format-units-wmk-2'), 'J/(kg·K)': tl(l, 'explain-format-units-jkgk'), 'J/(kg·°C)': tl(l, 'explain-format-units-jkgc'),
    A: tl(l, 'explain-format-units-a'), V: tl(l, 'explain-format-units-v'), 'Ω': tl(l, 'explain-format-units'), C: tl(l, 'explain-format-units-c'), mL: tl(l, 'explain-format-units-m-l'), 'S/m': tl(l, 'explain-format-units-sm'), 'Ω·m': tl(l, 'explain-format-units-m-3'), 'C/mol': tl(l, 'explain-format-units-cmol'), mol: tl(l, 'explain-format-units-mol'), '1/m': tl(l, 'explain-format-units-1m'), N: tl(l, 'explain-format-units-n'), 'm³': tl(l, 'explain-format-units-m-4'), 'm/s²': tl(l, 'explain-format-units-ms-2'), 'N/kg': tl(l, 'explain-format-units-nkg'), '': '',
  }));

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
    case 'kg':
      // Below a kilogram, grams read better ("30 г", not "0,03 кг").
      if (Math.abs(value) < 1 && level !== 'expert') return `${sig(value * 1000, n, locale)} ${tl(locale, 'unit-sym-g')}`;
      return `${sig(value, n, locale)} ${unitLabel(unit, ctx)}`;
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
  const [H, M, S] = [tl(locale, 'explain-format-duration-hms'), tl(locale, 'explain-format-units-min'), tl(locale, 'explain-format-units-s')];
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
