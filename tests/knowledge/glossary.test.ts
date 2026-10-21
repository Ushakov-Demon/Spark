import { describe, expect, it } from 'vitest';
import { GLOSSARY, termMatcher } from '../../src/knowledge/glossary.js';
import { LAB_GLOSSARY, LAB_KNOWLEDGE } from '../../src/scenarios/lab-knowledge.js';

/** The terms a text mentions, in order. */
function found(text: string, l: 'uk' | 'en'): string[] {
  const m = termMatcher(LAB_GLOSSARY, l);
  m.re.lastIndex = 0;
  return [...text.matchAll(m.re)].map((x) => m.termOf(x[0])!);
}

describe('glossary: laws become terms by themselves', () => {
  it('every law of the lab is a term, unless a written term already explains it', () => {
    const laws = LAB_KNOWLEDGE.laws.filter((l) => l.kind === 'law');
    const asTerms = LAB_GLOSSARY.filter((t) => t.law);
    expect(asTerms.length).toBeGreaterThanOrEqual(laws.length - 2);
    // Latent heat is a written term already; the law does not get a second entry.
    expect(asTerms.map((t) => t.law)).not.toContain('latent-heat');
    expect(new Set(LAB_GLOSSARY.map((t) => t.id)).size).toBe(LAB_GLOSSARY.length);
  });

  it('Faraday’s law: statement, discoverer, date', () => {
    const t = LAB_GLOSSARY.find((x) => x.law === 'faraday-electrolysis')!;
    expect(t.name.uk).toBe('Закон Фарадея для електролізу');
    expect(t.text.uk).toContain('m = k·q');
    expect(t.text.uk).toContain('Відкрив Майкл Фарадей (1833–1834).');
    expect(t.text.en).toContain('Discovered by Michael Faraday (1833–1834).');
    expect(LAB_GLOSSARY.find((x) => x.law === 'archimedes')!.text.en).toContain('Discovered by Archimedes (c. 246 BC).');
  });

  it('a law is found in any form of its name', () => {
    expect(found('За законом Фарадея маса міді пропорційна заряду.', 'uk')).toEqual(['law-faraday-electrolysis']);
    expect(found('Закон Ома: I = U/R. Перевіримо закону Ома.', 'uk')).toEqual(['law-ohm', 'law-ohm']);
    expect(found('Faraday’s laws of electrolysis and Ohm’s law', 'en')).toEqual(['law-faraday-electrolysis', 'electrolysis', 'law-ohm']);
    expect(found("Faraday's law", 'en')).toEqual(['law-faraday-electrolysis']);
  });

  it('the longer match wins: «закон Ома» is the law, «опір» the term', () => {
    expect(found('опір і закон Ома', 'uk')).toEqual(['resistance', 'law-ohm']);
  });

  it('written terms are found as before', () => {
    expect(found('На катоді осідає мідь, розчин синій, а розчиняти сіль легко.', 'uk')).toEqual(['cathode', 'solution']);
    expect(GLOSSARY.every((t) => !t.law)).toBe(true);
  });
});
