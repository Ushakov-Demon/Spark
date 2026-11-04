import type { ModelAssumption } from '../../core/solver.js';
import { msg } from '../../knowledge/messages.js';

/** What the thermal model deliberately simplifies. Shown in every explanation. */
export const THERMAL_ASSUMPTIONS: readonly ModelAssumption[] = [
  {
    id: 'thermal.lumped',
    text: {
      novice: msg('thermal-assumptions-thermal-lumped-text-novice'),
      school: msg('thermal-assumptions-thermal-lumped-text-school'),
      advanced: msg('thermal-assumptions-thermal-lumped-text-advanced'),
      expert: msg('thermal-assumptions-thermal-lumped-text-expert'),
    },
  },
  {
    id: 'thermal.phases',
    text: {
      novice: msg('thermal-assumptions-thermal-phases-text-novice'),
      school: msg('thermal-assumptions-thermal-phases-text-school'),
      expert: msg('thermal-assumptions-thermal-phases-text-expert'),
    },
  },
  {
    id: 'thermal.constant-properties',
    text: {
      school: msg('thermal-assumptions-thermal-constant-properties-text-school'),
      expert: msg('thermal-assumptions-thermal-constant-properties-text-expert'),
    },
  },
  {
    id: 'thermal.linear-transfer',
    text: {
      school: msg('thermal-assumptions-thermal-linear-transfer-text-school'),
      expert: msg('thermal-assumptions-thermal-linear-transfer-text-expert'),
    },
  },
  {
    id: 'thermal.numerics',
    text: {
      school: msg('thermal-assumptions-thermal-numerics-text-school'),
      expert: msg('thermal-assumptions-thermal-numerics-text-expert'),
    },
  },
];
