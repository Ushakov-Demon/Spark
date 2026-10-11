import { getSource } from './sources.js';
import type { Citation, SourcedValue } from './types.js';

export interface VerificationProblem {
  readonly message: string;
  readonly citation?: Citation;
}

/** Does one citation agree with `value` within relative `tolerance`? */
export function citationAgrees(value: number, c: Citation, tolerance: number): boolean {
  if ('value' in c) return Math.abs(value - c.value) <= tolerance * Math.abs(value);
  const [min, max] = c.range;
  return value >= min * (1 - tolerance) && value <= max * (1 + tolerance);
}

/**
 * Checks a sourced value against its own declared verification level.
 * Returns an empty list when everything is consistent.
 */
export function verifySourcedValue(v: SourcedValue): VerificationProblem[] {
  const problems: VerificationProblem[] = [];

  if (!Number.isFinite(v.value)) problems.push({ message: `value is not finite: ${v.value}` });
  if (!(v.tolerance > 0 && v.tolerance < 1)) problems.push({ message: `tolerance must be in (0, 1): ${v.tolerance}` });

  for (const c of v.citations) {
    if (!getSource(c.source)) problems.push({ message: `unknown source "${c.source}"`, citation: c });
  }

  const agreeing = v.citations.filter((c) => citationAgrees(v.value, c, v.tolerance));
  const agreeingSources = new Set(agreeing.map((c) => c.source));

  switch (v.verification) {
    case 'cross-checked':
      if (agreeingSources.size < 2) {
        problems.push({ message: `cross-checked needs ≥ 2 agreeing sources, has ${agreeingSources.size}` });
      }
      for (const c of v.citations) {
        if (!citationAgrees(v.value, c, v.tolerance)) {
          problems.push({ message: `citation disagrees with ${v.value} ${v.unit} beyond ±${v.tolerance * 100}%`, citation: c });
        }
      }
      break;
    case 'single-source':
      if (agreeingSources.size < 1) problems.push({ message: 'single-source needs ≥ 1 agreeing citation' });
      if (!v.note) problems.push({ message: 'single-source value must explain why in `note`' });
      break;
    case 'estimate':
      if (!v.note) problems.push({ message: 'estimate must explain its basis in `note`' });
      break;
  }
  return problems;
}
