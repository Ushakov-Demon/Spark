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
  },
  'ua-2017': {
    id: 'ua-2017',
    country: 'UA',
    name: { uk: 'Програма «Фізика. 7–9 класи» МОН (2017)', en: 'Ukraine: Physics 7–9 programme, Ministry of Education (2017)' },
    source: 'ua-mon-2017-physics-7-9',
    firstGradeAge: 6,
  },
} as const satisfies Record<string, Curriculum>;

export type CurriculumId = keyof typeof CURRICULA;

export const getCurriculum = (id: string): Curriculum | undefined => (CURRICULA as Record<string, Curriculum>)[id];
