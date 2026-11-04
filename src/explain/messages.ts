import type { Locale } from '../knowledge/i18n.js';
import { byLocale, t as tl } from '../knowledge/messages.js';

/** Interface strings of the generic report. Domain-specific strings live in each domain. */
export interface ReportMessages {
  level(name: string, audience: string): string;
  whatHappened: string;
  /** A measuring procedure: what was measured and worked out. */
  measured: string;
  yourActions: string;
  failed(error: string): string;
  lawsUsed: string;
  lawsIntroNovice: string;
  definitionTag: string;
  discoveredBy: string;
  associatedWith: string;
  when: string;
  work: string;
  limits: string;
  appliedTimes(count: number, objects: string): string;
  oneStep(time: string): string;
  oneStepIntro: string;
  oneStepIntroExpert: string;
  timeStep(dt: string): string;
  numerics(method: string, dt: string, substeps: number, h: string): string;
  where: string;
  simplifications: string;
  simplificationsNovice: string;
  dataTitle: string;
  scenarioValue: string;
  verification: Readonly<Record<'cross-checked' | 'single-source' | 'estimate', string>>;
  sources(n: number): string;
  conditions: string;
  tolerance: string;
  noteLabel: string;
  estimatesWarning(list: string): string;
  unreviewed(n: number): string;
  curriculum: string;
  curriculumBeyond: string;
  grade(n: number): string;
  qualitative: string;
}

export const REPORT_MESSAGES: Readonly<Record<Locale, ReportMessages>> = byLocale((lang: Locale) => ({
    level: (name, audience) => tl(lang, 'explain-messages-report-level', { name, audience }),
    whatHappened: tl(lang, 'explain-messages-report-what-happened'),
    measured: tl(lang, 'explain-messages-report-measured'),
    yourActions: tl(lang, 'explain-messages-report-your-actions'),
    failed: (e) => tl(lang, 'explain-messages-report-failed', { e }),
    lawsUsed: tl(lang, 'explain-messages-report-laws-used'),
    lawsIntroNovice: tl(lang, 'explain-messages-report-laws-intro-novice'),
    definitionTag: tl(lang, 'explain-messages-report-definition-tag'),
    discoveredBy: tl(lang, 'explain-messages-report-discovered-by'),
    associatedWith: tl(lang, 'explain-messages-report-associated-with'),
    when: tl(lang, 'explain-messages-report-when'),
    work: tl(lang, 'explain-messages-report-work'),
    limits: tl(lang, 'explain-messages-report-limits'),
    appliedTimes: (c, o) => tl(lang, 'explain-messages-report-applied-times', { c: String(c), o }),
    oneStep: (t) => tl(lang, 'explain-messages-report-one-step', { t }),
    oneStepIntro: tl(lang, 'explain-messages-report-one-step-intro'),
    oneStepIntroExpert: tl(lang, 'explain-messages-report-one-step-intro-expert'),
    timeStep: (dt) => tl(lang, 'explain-messages-report-time-step', { dt }),
    numerics: (m, dt, n, h) => tl(lang, 'explain-messages-report-numerics', { m, dt, n: String(n), h }),
    where: tl(lang, 'explain-messages-report-where'),
    simplifications: tl(lang, 'explain-messages-report-simplifications'),
    simplificationsNovice: tl(lang, 'explain-messages-report-simplifications-novice'),
    dataTitle: tl(lang, 'explain-messages-report-data-title'),
    scenarioValue: tl(lang, 'explain-messages-report-scenario-value'),
    verification: { 'cross-checked': tl(lang, 'explain-messages-verification-cross-checked'), 'single-source': tl(lang, 'explain-messages-verification-single-source'), estimate: tl(lang, 'explain-messages-verification-estimate') },
    sources: (n) => tl(lang, 'explain-messages-report-sources', { n: String(n) }),
    conditions: tl(lang, 'explain-messages-report-conditions'),
    tolerance: tl(lang, 'explain-messages-report-tolerance'),
    noteLabel: tl(lang, 'explain-messages-report-note-label'),
    estimatesWarning: (l) => tl(lang, 'explain-messages-report-estimates-warning', { l }),
    unreviewed: (n) => tl(lang, 'explain-messages-report-unreviewed', { n: String(n) }),
    curriculum: tl(lang, 'explain-messages-report-curriculum'),
    curriculumBeyond: tl(lang, 'explain-messages-report-curriculum-beyond'),
    grade: (n) => tl(lang, 'explain-messages-report-grade', { n: String(n) }),
    qualitative: tl(lang, 'explain-messages-report-qualitative'),
  }));
