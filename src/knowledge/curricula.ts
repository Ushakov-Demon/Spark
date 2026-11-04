import { msg } from './messages.js';
import type { Curriculum } from './types.js';

/**
 * School programmes we map formulas to. Ukraine is first; other countries are
 * added the same way (one entry + CurriculumRef quotes in domain catalogs).
 */
export const CURRICULA = {
  'ua-nus-2023-holovko': {
    id: 'ua-nus-2023-holovko',
    country: 'UA',
    language: 'uk',
    name: msg('curriculum-ua-nus-2023-holovko'),
    source: 'ua-mnp-2023-holovko',
    firstGradeAge: 6,
    short: msg('curriculum-ua-nus-2023-holovko-short'),
    subject: 'physics',
  },
  'ua-nus-2023-kreminskyi': {
    id: 'ua-nus-2023-kreminskyi',
    country: 'UA',
    language: 'uk',
    name: msg('curriculum-ua-nus-2023-kreminskyi'),
    source: 'ua-mnp-2023-kreminskyi',
    firstGradeAge: 6,
    short: msg('curriculum-ua-nus-2023-kreminskyi-short'),
    subject: 'physics',
  },
  'ua-nus-2023-hryhorovych-chemistry': {
    id: 'ua-nus-2023-hryhorovych-chemistry',
    country: 'UA',
    language: 'uk',
    name: msg('curriculum-ua-nus-2023-hryhorovych-chemistry'),
    source: 'ua-mnp-2023-hryhorovych-chemistry',
    firstGradeAge: 6,
    short: msg('curriculum-ua-nus-2023-hryhorovych-chemistry-short'),
    subject: 'chemistry',
  },
  'ua-2017': {
    id: 'ua-2017',
    country: 'UA',
    language: 'uk',
    name: msg('curriculum-ua-2017'),
    source: 'ua-mon-2017-physics-7-9',
    firstGradeAge: 6,
    short: msg('curriculum-ua-2017-short'),
    subject: 'physics',
  },
  'oxfordaqa-igcse-sciences': {
    id: 'oxfordaqa-igcse-sciences',
    country: 'GB',
    language: 'en',
    name: msg('curriculum-oxfordaqa-igcse-sciences'),
    source: 'oxfordaqa-igcse-practical-handbook',
    // International GCSE: ages 14–16 (years 10–11); "grade" in a ref is not used for it.
    firstGradeAge: 5,
    short: msg('curriculum-oxfordaqa-igcse-sciences-short'),
  },
} as const satisfies Record<string, Curriculum>;

export type CurriculumId = keyof typeof CURRICULA;

export const getCurriculum = (id: string): Curriculum | undefined => (CURRICULA as Record<string, Curriculum>)[id];
