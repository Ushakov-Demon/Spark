import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LOCALES } from '../../src/knowledge/i18n.js';
import { attribute, form, hasMessage, messageIds, msg, t } from '../../src/knowledge/messages.js';
import { localeFiles } from '../../scripts/locales.js';
import { COMPONENTS } from '../../src/components/index.js';
import { CATEGORIES } from '../../src/equipment/taxonomy.js';
import { RECIPES } from '../../src/recipes/index.js';
import { GLOSSARY } from '../../src/knowledge/glossary.js';
import { PRESETS } from '../../src/scenarios/presets.js';

const code = ['src', 'web', 'scripts'].flatMap((d) => readdirSync(d, { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.ts')).map((f) => [`${d}/${f}`, readFileSync(`${d}/${f}`, 'utf8')] as const));

/**
 * Texts written in the code instead of locales/: a language fork (`l === 'uk' ? … : …`) and a `{ uk, en }` literal.
 * None are left but the languages' number formats (NUMBER_LOCALE, which the messages themselves are built with).
 */
const FORKS_LEFT = 0;
const PAIRS_LEFT = 1;

describe('messages (locales/*.ftl)', () => {
  it('every language has a file of messages for each file of Ukrainian ones', () => {
    const files = localeFiles().map(([l, p]) => [l, p.split(`/locales/${l}/`)[1]] as const);
    const uk = files.filter(([l]) => l === 'uk').map(([, f]) => f).sort();
    for (const l of LOCALES) expect(files.filter(([x]) => x === l).map(([, f]) => f).sort(), l).toEqual(uk);
  });

  it('Ukrainian and English have the same messages', () => {
    expect(messageIds('en').sort()).toEqual(messageIds('uk').sort());
  });

  it('every message the code names exists', () => {
    const missing = code.flatMap(([f, s]) => [...s.matchAll(/\b(?:msg\(|t\((?:l|locale|lang), )'([a-z][\w-]*)'/g)].map((m) => m[1]!).filter((id) => !hasMessage('uk', id)).map((id) => `${f}: ${id}`));
    expect(missing).toEqual([]);
  });

  it('every substance, recipe and equipment category has its name in Ukrainian and English (their ids are built from the data)', () => {
    const ids = [...Object.keys(COMPONENTS).map((id) => `component-${id}`), ...Object.keys(RECIPES).map((id) => `recipe-${id}`), ...CATEGORIES.map((c) => `category-${c.id.replace(/\./g, '-')}`)];
    for (const l of ['uk', 'en'] as const) expect(ids.filter((id) => !hasMessage(l, id)), l).toEqual([]);
    // The Ukrainian names carry their gender (verbs agree with it).
    expect(Object.keys(COMPONENTS).filter((id) => !attribute('uk', `component-${id}`, 'gender'))).toEqual([]);
  });

  it('every glossary term and every unit a preset’s number is put in has its words in each language', () => {
    for (const l of LOCALES) {
      expect(GLOSSARY.flatMap((x) => [`term-${x.id}`, `term-${x.id}-text`, ...(x.more ? [`term-${x.id}-more`] : [])]).filter((id) => !hasMessage(l, id)), l).toEqual([]);
      expect(GLOSSARY.filter((x) => !attribute(l, `term-${x.id}`, 'stems')).map((x) => x.id), l).toEqual([]);
      const units = PRESETS.flatMap((p) => p.vary?.controls ?? []).flatMap((c) => (c.kind === 'number' ? [c.unit, ...(c.units ?? []).map((u) => u.id)] : [])).filter(Boolean);
      expect(units.filter((u) => !hasMessage(l, `unit-sym-${u}`)), l).toEqual([]);
    }
  });

  it('a word’s forms: the language’s own, or the word itself', () => {
    expect(form(msg('component-oxygen'), 'genitive').uk).toBe('кисню');
    expect(form(msg('component-water'), 'genitive').en).toBe('Water');
    expect(attribute('en', 'component-oxygen', 'gender')).toBeUndefined();
  });

  it('a message is worded with its arguments, in each language', () => {
    const m = msg('map-scale-board', { scale: '1 : 100' });
    expect(m.uk).toBe('карта 1 : 100');
    expect(m.en).toBe('the map at 1 : 100');
    expect(t('uk', 'map-scale-say', { towns: 'А — Б', truth: '5 км', nearer: 'first' })).toBe('Справжня відстань А — Б — 5 км: перша карта ближча до неї.');
    expect(() => t('uk', 'map-scale-board')).toThrow(/scale/);
  });

  it('texts in the code only grow fewer', () => {
    const count = (re: RegExp) => code.filter(([f]) => !f.startsWith('scripts/')).reduce((n, [, s]) => n + (s.match(re) ?? []).length, 0);
    const forks = count(/=== 'uk'|\buk \?/g);
    const pairs = count(/\buk: ['`"]/g) + count(/\bconst \w+ = \(uk: string, en: string/g);
    expect(forks, 'a new `uk ?` fork: word it in locales/ instead').toBeLessThanOrEqual(FORKS_LEFT);
    expect(pairs, 'a new { uk, en } literal: word it in locales/ instead').toBeLessThanOrEqual(PAIRS_LEFT);
  });
});
