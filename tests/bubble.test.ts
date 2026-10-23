import { describe, expect, it } from 'vitest';
import { BUBBLE_PAGE, bubblePages } from '../web/bubble.js';

describe('the Professor’s bubble', () => {
  it('a short line is one page', () => {
    expect(bubblePages('Ну що ж, колего, почнімо!')).toEqual(['Ну що ж, колего, почнімо!']);
  });

  it('a long line goes in pages of whole sentences, none lost', () => {
    const line = 'Вода закипіла за дев’ять хвилин. Плитка дала більше енергії, ніж узяла вода. Решта пішла на нагрівання каструлі та повітря кімнати. Так завжди: ККД менший за сто відсотків! А чому саме? Подивимося на дошку.';
    const pages = bubblePages(line);
    expect(pages.length).toBeGreaterThan(1);
    for (const p of pages) expect(p.length).toBeLessThanOrEqual(BUBBLE_PAGE);
    for (const p of pages) expect(p).toMatch(/[.!?]$/);
    expect(pages.join(' ')).toBe(line);
  });

  it('a sentence longer than a page is parted after its commas; one with none stays whole', () => {
    const line = 'Щоразу виміряємо її масу (терезами: на скільки збільшилися покази) і об’єм (мензуркою: на скільки піднялася вода), подивимося, що з нею буде, і порівняємо її середню густину з густиною води.';
    const pages = bubblePages(line);
    expect(pages.length).toBe(2);
    for (const p of pages) expect(p.length).toBeLessThanOrEqual(BUBBLE_PAGE);
    expect(pages[0]).toMatch(/…$/);
    expect(pages[1]).toMatch(/^…/);
    expect(pages.join(' ').replaceAll('…', '')).toBe(line);
    const long = `${'дуже '.repeat(40)}довге речення.`;
    expect(bubblePages(long)).toEqual([long]);
  });
});
