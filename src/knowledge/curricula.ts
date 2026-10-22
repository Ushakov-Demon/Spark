import type { Curriculum } from './types.js';

/**
 * School programmes we map formulas to. Ukraine is first; other countries are
 * added the same way (one entry + CurriculumRef quotes in domain catalogs).
 */
export const CURRICULA = {
  'ua-nus-2023-holovko': {
    id: 'ua-nus-2023-holovko',
    country: 'UA',
    name: { uk: 'НУШ: модельна програма «Фізика. 7–9 класи» (Головко та ін., 2023)', en: 'Ukraine, New Ukrainian School: model programme Physics 7–9 (Holovko et al., 2023)' },
    source: 'ua-mnp-2023-holovko',
    firstGradeAge: 6,
    short: { uk: 'НУШ · Фізика (Головко)', en: 'NUS (Ukraine) · Physics (Holovko)' },
  },
  'ua-nus-2023-kreminskyi': {
    id: 'ua-nus-2023-kreminskyi',
    country: 'UA',
    name: { uk: 'НУШ: модельна програма «Фізика. 7–9 класи» (Кремінський та ін., 2023)', en: 'Ukraine, New Ukrainian School: model programme Physics 7–9 (Kreminskyi et al., 2023)' },
    source: 'ua-mnp-2023-kreminskyi',
    firstGradeAge: 6,
    short: { uk: 'НУШ · Фізика (Кремінський)', en: 'NUS (Ukraine) · Physics (Kreminskyi)' },
  },
  'ua-nus-2023-hryhorovych-chemistry': {
    id: 'ua-nus-2023-hryhorovych-chemistry',
    country: 'UA',
    name: { uk: 'НУШ: модельна програма «Хімія. 7–9 класи» (Григорович, 2023)', en: 'Ukraine, New Ukrainian School: model programme Chemistry 7–9 (Hryhorovych, 2023)' },
    source: 'ua-mnp-2023-hryhorovych-chemistry',
    firstGradeAge: 6,
    short: { uk: 'НУШ · Хімія', en: 'NUS (Ukraine) · Chemistry' },
  },
  'ua-2017': {
    id: 'ua-2017',
    country: 'UA',
    name: { uk: 'Програма «Фізика. 7–9 класи» МОН (2017)', en: 'Ukraine: Physics 7–9 programme, Ministry of Education (2017)' },
    source: 'ua-mon-2017-physics-7-9',
    firstGradeAge: 6,
    short: { uk: 'МОН 2017 · Фізика', en: 'Ukraine 2017 · Physics' },
  },
  'oxfordaqa-igcse-sciences': {
    id: 'oxfordaqa-igcse-sciences',
    country: 'GB',
    name: { uk: 'Oxford AQA International GCSE: Physics (9203), Chemistry (9202) — обов’язкові практичні роботи', en: 'Oxford AQA International GCSE: Physics (9203), Chemistry (9202) — required practicals' },
    source: 'oxfordaqa-igcse-practical-handbook',
    // International GCSE: ages 14–16 (years 10–11); "grade" in a ref is not used for it.
    firstGradeAge: 5,
    short: { uk: 'Oxford AQA IGCSE', en: 'Oxford AQA IGCSE' },
  },
} as const satisfies Record<string, Curriculum>;

export type CurriculumId = keyof typeof CURRICULA;

export const getCurriculum = (id: string): Curriculum | undefined => (CURRICULA as Record<string, Curriculum>)[id];
