import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OPERATION_IDS, OPERATIONS } from '../../src/scenarios/operations/index.js';
import { SUBSTANCES } from '../../src/substances/index.js';

describe('operations', () => {
  it('ids match registry keys', () => {
    for (const id of OPERATION_IDS) expect(OPERATIONS[id].id).toBe(id);
  });

  it('every operation speaks Ukrainian and English', () => {
    for (const id of OPERATION_IDS) {
      const op = OPERATIONS[id];
      expect(op.label.uk && op.label.en, id).toBeTruthy();
      expect(op.verbs.future.uk && op.verbs.future.en && op.verbs.past.en, id).toBeTruthy();
      for (const g of ['f', 'm', 'n'] as const) expect(op.verbs.past.uk[g], `${id}.${g}`).toBeTruthy();
    }
  });

  it('start temperatures and targets are sensible for every substance', () => {
    for (const id of OPERATION_IDS) {
      const op = OPERATIONS[id];
      if (op.target) expect(op.target.default).toBeGreaterThanOrEqual(op.target.min);
      for (const s of Object.values(SUBSTANCES)) expect(Number.isFinite(op.startTemp(s)), `${id}/${s.id}`).toBe(true);
    }
  });
});

/** Architecture guard: the lab and the page ask operations, they never branch on operation names. */
describe('no code outside src/scenarios/operations branches on an operation name', () => {
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => {
      const p = join(dir, f);
      return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : [];
    });
  const ids = OPERATION_IDS.map((id) => id.replace(/[-]/g, '\\-')).join('|');
  const pattern = new RegExp(`(action\\s*[!=]==\\s*'(${ids})'|case\\s+'(${ids})'\\s*:)`);
  it.each([...files('src'), ...files('web')].filter((f) => !f.includes(join('scenarios', 'operations'))))('%s', (file) => {
    expect(readFileSync(file, 'utf8')).not.toMatch(pattern);
  });
});
