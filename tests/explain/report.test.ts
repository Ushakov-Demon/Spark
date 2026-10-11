import { describe, expect, it } from 'vitest';
import { THERMAL_KNOWLEDGE } from '../../src/domains/thermal/index.js';
import { buildReport, renderText } from '../../src/explain/index.js';
import { LEVELS, type Level } from '../../src/knowledge/levels.js';
import { kettleRun } from '../helpers.js';

const { result, simulation } = kettleRun();
const report = (level: Level, r = result) =>
  renderText(buildReport({ title: 'T', level, result: r, simulation, domain: THERMAL_KNOWLEDGE, focusTime: 100 }));

describe('experiment report', () => {
  it.each(LEVELS)('%s: builds a non-empty report', (level) => {
    expect(report(level).length).toBeGreaterThan(500);
  });

  it('novice: no formulas, no citations, no numerics', () => {
    const t = report('novice');
    expect(t).not.toContain('Q = c · m · ΔT');
    expect(t).not.toContain('источник:');
    expect(t).not.toContain('Эйлер');
    expect(t).toContain('Закон сохранения энергии');
  });

  it('school: formulas with real numbers, but no citations', () => {
    const t = report('school');
    expect(t).toContain('Q = c · m · ΔT');
    expect(t).toMatch(/P = G · \(t₁ − t₂\) → P = [\d\s,]+ Вт/);
    expect(t).not.toContain('источник:');
  });

  it('advanced: discoverers with life dates and applicability limits', () => {
    const t = report('advanced');
    expect(t).toContain('Исаак Ньютон (1643–1727)');
    expect(t).toContain('Когда перестаёт работать');
    expect(t).toContain('Откуда взяты числа');
  });

  it('expert: sources, numerics, energy residual, review status', () => {
    const t = report('expert');
    expect(t).toContain('источник:');
    expect(t).toContain('explicit-euler');
    expect(t).toContain('Невязка баланса');
    expect(t).toContain('reviewed: false');
  });

  it('lists only laws the engine actually used', () => {
    const t = report('school');
    expect(t).not.toContain('T(t) = Tокр'); // analytic curve is not used by the solver
    const noPour = report('school', kettleRun([], 60).result);
    expect(noPour).not.toContain('Уравнение теплового баланса');
    expect(t).toContain('Уравнение теплового баланса');
  });

  it('heat balance is credited as "associated", not "discovered"', () => {
    const t = report('advanced');
    expect(t).toMatch(/Уравнение теплового баланса[\s\S]*?Связано с именами: Джозеф Блэк/);
  });
});
