import { describe, expect, it } from 'vitest';
import { THERMAL_KNOWLEDGE } from '../../src/domains/thermal/index.js';
import { buildReport, renderText } from '../../src/explain/index.js';
import { LEVELS, type Level } from '../../src/knowledge/levels.js';
import type { Locale } from '../../src/knowledge/i18n.js';
import { kettleRun } from '../helpers.js';

const { result, simulation } = kettleRun();
const report = (level: Level, r = result, locale: Locale = 'uk') =>
  renderText(buildReport({ title: 'T', level, locale, country: 'UA', result: r, simulation, domain: THERMAL_KNOWLEDGE, focusTime: 100 }));

describe('experiment report', () => {
  it.each(LEVELS)('%s: builds a non-empty report', (level) => {
    expect(report(level).length).toBeGreaterThan(500);
  });

  it('novice: no formulas, no citations, no numerics', () => {
    const t = report('novice');
    expect(t).not.toContain('Q = c · m · ΔT');
    expect(t).not.toContain('джерело:');
    expect(t).not.toContain('Ейлер');
    expect(t).toContain('Закон збереження енергії');
  });

  it('school: formulas with real numbers, but no citations', () => {
    const t = report('school');
    expect(t).toContain('Q = c · m · ΔT');
    expect(t).toMatch(/P = G · \(t₁ − t₂\) → P = [\d\s,]+ Вт/);
    expect(t).not.toContain('джерело:');
  });

  it('advanced: discoverers with life dates and applicability limits', () => {
    const t = report('advanced');
    expect(t).toContain('Ісаак Ньютон (1643–1727)');
    expect(t).toContain('Коли перестає працювати');
    expect(t).toContain('Звідки взято числа');
  });

  it('expert: sources, numerics, energy residual, review status', () => {
    const t = report('expert');
    expect(t).toContain('джерело:');
    expect(t).toContain('explicit-euler');
    expect(t).toContain('Нев’язка балансу');
    expect(t).toContain('reviewed: false');
  });

  it('lists only laws the engine actually used', () => {
    const t = report('school');
    expect(t).not.toContain('T(t) = T_env'); // analytic curve is not used by the solver
    const noPour = report('school', kettleRun([], 60).result);
    expect(noPour).not.toContain('Рівняння теплового балансу');
    expect(t).toContain('Рівняння теплового балансу');
  });

  it('relates formulas to the Ukrainian curriculum', () => {
    expect(report('school')).toContain('У шкільній програмі: 8 клас');
    expect(report('advanced')).toContain('«Тепловий баланс.»');
  });

  it('English report uses English text and units', () => {
    const t = report('school', result, 'en');
    expect(t).toContain('Conservation of energy');
    expect(t).toMatch(/P = [\d,.]+ W/);
    expect(t).toContain('In the school curriculum: grade 8');
    expect(t).not.toMatch(/[а-яіїєґ]/i);
  });

  it('heat balance is credited as "associated", not "discovered"', () => {
    const t = report('advanced');
    expect(t).toMatch(/Рівняння теплового балансу[\s\S]*?Пов’язано з іменами: Джозеф Блек/);
  });
});
