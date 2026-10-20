import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('the page markup', () => {
  // Two elements with one id: the code finds the first and silently drives the wrong one.
  it('has no duplicate ids', () => {
    const ids = [...readFileSync('web/index.html', 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dup).toEqual([]);
  });
});
