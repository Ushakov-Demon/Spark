import type { LocalizedText } from './i18n.js';

/**
 * Experimenter level. Drives wording, which details are shown, units and precision.
 * Every level is a complete explanation for a smart reader who simply doesn't
 * know the topic yet — lower levels drop formulas, never respect (docs/CONTENT_STYLE.md).
 *
 * Levels are described by age, not by grade: grade numbering differs between
 * countries. The mapping to a specific country's grades lives in curricula
 * (see CurriculumRef / CURRICULA).
 *
 *  - novice:   ~10–13 years — ideas and causes, terms named, no formulas;
 *  - school:   ~13–15 years — formulas with meaning of every letter, real numbers;
 *  - advanced: ~15–18 years — laws, discoverers, limits of applicability, model assumptions;
 *  - expert:   teachers, olympiad students — numerics, data provenance, SI units, sources.
 */
export const LEVELS = ['novice', 'school', 'advanced', 'expert'] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_INFO: Readonly<Record<Level, { readonly name: LocalizedText; readonly audience: LocalizedText }>> = {
  novice: {
    name: { uk: 'Перші кроки', en: 'First steps' },
    audience: { uk: '≈10–13 років: суть явищ і причини, без формул', en: '≈10–13 years: what happens and why, no formulas' },
  },
  school: {
    name: { uk: 'Базовий', en: 'Core' },
    audience: { uk: '≈13–15 років: формули, зміст кожної величини, справжні числа', en: '≈13–15 years: formulas, meaning of every quantity, real numbers' },
  },
  advanced: {
    name: { uk: 'Поглиблений', en: 'In depth' },
    audience: { uk: '≈15–18 років: закони, їхні автори, межі застосування', en: '≈15–18 years: laws, who found them, where they stop working' },
  },
  expert: {
    name: { uk: 'Експерт', en: 'Expert' },
    audience: { uk: 'вчителі, олімпіадники: чисельний метод, походження даних, джерела', en: 'teachers, olympiad students: numerics, data provenance, sources' },
  },
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
