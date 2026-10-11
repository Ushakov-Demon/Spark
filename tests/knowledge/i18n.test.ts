import { describe, expect, it } from 'vitest';
import { THERMAL_ASSUMPTIONS, THERMAL_FORMULAS, THERMAL_LAWS, MATERIALS } from '../../src/domains/thermal/index.js';
import { CURRICULA, getCurriculum } from '../../src/knowledge/curricula.js';
import { LEVEL_INFO } from '../../src/knowledge/levels.js';
import { LOCALES } from '../../src/knowledge/i18n.js';
import { getSource } from '../../src/knowledge/sources.js';

/** Collects every { uk, en } object found anywhere in a data structure. */
function texts(root: unknown): { uk: string; en: string; path: string }[] {
  const out: { uk: string; en: string; path: string }[] = [];
  const walk = (v: unknown, path: string) => {
    if (typeof v === 'function' || v === null || typeof v !== 'object') return;
    const o = v as Record<string, unknown>;
    if (typeof o['uk'] === 'string' || typeof o['en'] === 'string') out.push({ uk: String(o['uk'] ?? ''), en: String(o['en'] ?? ''), path });
    for (const [k, child] of Object.entries(o)) walk(child, `${path}.${k}`);
  };
  walk(root, '');
  return out;
}

const all = texts({ THERMAL_LAWS, THERMAL_FORMULAS, THERMAL_ASSUMPTIONS, MATERIALS, LEVEL_INFO, CURRICULA });

describe('content languages', () => {
  it('Ukrainian and English are the required locales', () => expect(LOCALES).toEqual(['uk', 'en']));

  it('found the texts', () => expect(all.length).toBeGreaterThan(150));

  it.each(['uk', 'en'] as const)('every text has a non-empty %s version', (l) => {
    for (const t of all) expect(t[l].trim().length, t.path).toBeGreaterThan(0);
  });

  it('Ukrainian texts contain no letters absent from the Ukrainian alphabet (ы э ъ ё)', () => {
    for (const t of all) expect(t.uk, t.path).not.toMatch(/[ыэъё]/i);
  });

  it('English texts contain no Cyrillic', () => {
    for (const t of all) expect(t.en, t.path).not.toMatch(/[а-яіїєґ]/i);
  });
});

describe('curricula', () => {
  it('every curriculum has a country code and a known source', () => {
    for (const c of Object.values(CURRICULA)) {
      expect(c.country).toMatch(/^[A-Z]{2}$/);
      expect(getSource(c.source), c.id).toBeDefined();
    }
  });

  it('every curriculum reference points to a known programme and quotes it', () => {
    for (const f of THERMAL_FORMULAS) {
      for (const r of f.curriculum) {
        expect(getCurriculum(r.program), `${f.id} → ${r.program}`).toBeDefined();
        expect(r.quote.length).toBeGreaterThan(5);
        expect(r.grade).toBeGreaterThan(0);
      }
    }
  });
});
