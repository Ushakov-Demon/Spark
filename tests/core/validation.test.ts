import { describe, expect, it } from 'vitest';
import { connectionId, createState, entityId, validateState } from '../../src/core/index.js';
import { celsius, kilograms, specificHeat, thermalConductance } from '../../src/core/units.js';
import { thermalBody } from '../../src/domains/thermal/entities.js';
import { thermalLink } from '../../src/domains/thermal/links.js';

const body = (id: string) =>
  thermalBody({ id, mass: kilograms(1), specificHeat: specificHeat(1000), temperature: celsius(20) });

describe('validateState', () => {
  it('accepts a correct scene', () => {
    const s = createState({
      entities: [body('a'), body('b')],
      connections: [thermalLink({ id: 'l', a: 'a', b: 'b', conductance: thermalConductance(1) })],
    });
    expect(validateState(s).ok).toBe(true);
  });

  it('reports unknown entities, unknown ports and domain mismatch', () => {
    const s = createState({
      entities: [body('a'), body('b')],
      connections: [
        thermalLink({ id: 'dangling', a: 'a', b: 'ghost', conductance: thermalConductance(1) }),
        {
          id: connectionId('wire'),
          domain: 'electrical',
          kind: 'electrical.wire',
          a: { entity: entityId('a'), port: 'surface' },
          b: { entity: entityId('b'), port: 'plus' },
          params: {},
        },
      ],
    });
    const r = validateState(s);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.map((i) => i.code).sort()).toEqual(['domain-mismatch', 'unknown-entity', 'unknown-port']);
  });
});
