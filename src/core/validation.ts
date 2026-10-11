import { isDevice, type AnyConnection, type PortRef } from './entity.js';
import { err, ok, type Result } from './result.js';
import type { SystemState } from './state.js';

export interface ValidationIssue {
  readonly code: 'unknown-entity' | 'unknown-port' | 'domain-mismatch' | 'self-loop';
  readonly message: string;
  readonly connection: AnyConnection['id'];
}

/**
 * Structural checks on the scene graph. Domain solvers add their own
 * physical checks (non-negative mass etc.) on top of this.
 */
export function validateState(s: SystemState): Result<SystemState, readonly ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  const checkEnd = (c: AnyConnection, ref: PortRef): void => {
    const entity = s.entities[ref.entity];
    if (!entity) {
      issues.push({ code: 'unknown-entity', connection: c.id, message: `No entity "${ref.entity}"` });
      return;
    }
    const port = isDevice(entity) ? entity.ports.find((p) => p.name === ref.port) : undefined;
    if (!port) {
      issues.push({ code: 'unknown-port', connection: c.id, message: `Entity "${ref.entity}" has no port "${ref.port}"` });
      return;
    }
    if (port.domain !== c.domain) {
      issues.push({
        code: 'domain-mismatch',
        connection: c.id,
        message: `Port "${ref.entity}.${ref.port}" is ${port.domain}, connection is ${c.domain}`,
      });
    }
  };

  for (const c of s.connections) {
    if (c.a.entity === c.b.entity && c.a.port === c.b.port) {
      issues.push({ code: 'self-loop', connection: c.id, message: 'Connection links a port to itself' });
      continue;
    }
    checkEnd(c, c.a);
    checkEnd(c, c.b);
  }

  return issues.length ? err(issues) : ok(s);
}
