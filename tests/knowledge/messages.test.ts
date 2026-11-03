import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LOCALES } from '../../src/knowledge/i18n.js';
import { hasMessage, messageIds, msg, t } from '../../src/knowledge/messages.js';
import { localeFiles } from '../../scripts/locales.js';

const code = ['src', 'web', 'scripts'].flatMap((d) => readdirSync(d, { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.ts')).map((f) => [`${d}/${f}`, readFileSync(`${d}/${f}`, 'utf8')] as const));

/**
 * Texts still written in the code, waiting to move to locales/: a language fork (`l === 'uk' ? … : …`) and a
 * `{ uk, en }` literal. They may only grow fewer — lower the numbers as files move (docs/TODO.md, § 0).
 */
const FORKS_LEFT = 1478;
const PAIRS_LEFT = 2338;

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
    const pairs = count(/\buk: ['`"]/g);
    expect(forks, 'a new `uk ?` fork: word it in locales/ instead').toBeLessThanOrEqual(FORKS_LEFT);
    expect(pairs, 'a new { uk, en } literal: word it in locales/ instead').toBeLessThanOrEqual(PAIRS_LEFT);
  });
});
