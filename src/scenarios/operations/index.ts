import { BOIL } from './boil.js';
import { COOL_TO } from './cool-to.js';
import { EVAPORATE } from './evaporate.js';
import { FREEZE } from './freeze.js';
import { HEAT_TO } from './heat-to.js';
import { MELT } from './melt.js';
import { PASS_CURRENT } from './pass-current.js';
import type { Operation } from './types.js';

export * from './types.js';

/** Every operation, in UI order. Adding one = a new file + one line here. */
const LIST = {
  'heat-to': HEAT_TO,
  boil: BOIL,
  evaporate: EVAPORATE,
  'cool-to': COOL_TO,
  freeze: FREEZE,
  melt: MELT,
  'pass-current': PASS_CURRENT,
} as const satisfies Record<string, Operation>;

export type OperationId = keyof typeof LIST;
export const OPERATIONS: Readonly<Record<OperationId, Operation>> = LIST;
export const OPERATION_IDS = Object.keys(LIST) as OperationId[];
