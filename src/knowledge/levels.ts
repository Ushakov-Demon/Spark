import type { LocalizedText } from './types.js';

/**
 * Experimenter level. Drives wording, which details are shown, units and precision.
 *  - novice:   ~5–7 grade, no formulas, everyday analogies;
 *  - school:   ~8–9 grade, formulas with words, °C, real numbers;
 *  - advanced: ~10–11 grade, laws, discoverers, applicability limits, model assumptions;
 *  - expert:   teacher / olympiad, numerics, data provenance, SI units.
 */
export const LEVELS = ['novice', 'school', 'advanced', 'expert'] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_INFO: Readonly<Record<Level, { readonly name: string; readonly audience: string }>> = {
  novice: { name: 'Новичок', audience: '5–7 класс: без формул, на бытовых примерах' },
  school: { name: 'Школьник', audience: '8–9 класс: формулы словами, реальные числа' },
  advanced: { name: 'Старшеклассник', audience: '10–11 класс: законы, авторы, границы применимости' },
  expert: { name: 'Эксперт', audience: 'учитель, олимпиадник: численный метод, данные и источники' },
};

/** Text written per level; `school` is mandatory as the anchor every other level falls back to. */
export type LeveledText = Partial<Record<Level, LocalizedText>> & { readonly school: LocalizedText };

/**
 * Text for `level`, or the nearest written one. On a tie the simpler level wins
 * (better slightly too simple than too academic).
 */
export function textFor(t: LeveledText, level: Level): LocalizedText {
  const i = LEVELS.indexOf(level);
  for (let d = 0; d < LEVELS.length; d++) {
    const lower = LEVELS[i - d];
    if (lower && t[lower]) return t[lower];
    const higher = LEVELS[i + d];
    if (higher && t[higher]) return t[higher];
  }
  return t.school;
}

export const atLeast = (level: Level, min: Level): boolean => LEVELS.indexOf(level) >= LEVELS.indexOf(min);
