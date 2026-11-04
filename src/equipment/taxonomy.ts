import { msg } from '../knowledge/messages.js';
import type { Category, CategoryId } from './types.js';

/**
 * Taxonomy of equipment. Household vs laboratory is a level of the tree, so a
 * UI can group options ("Побутові / Лабораторні") and a curriculum can ask for
 * lab equipment only. New branches (measuring instruments, chemistry glassware…)
 * are added here first.
 */
/** A category: its name is the message `category-<id>` (dots as hyphens). */
const c = (id: CategoryId, parent: CategoryId | null): Category => ({ id, parent, name: msg(`category-${id.replace(/\./g, '-')}`) });

export const CATEGORIES: readonly Category[] = [
  c('device', null),
  c('device.heater', 'device'),
  c('device.heater.household', 'device.heater'),
  c('device.heater.laboratory', 'device.heater'),
  c('device.cooler', 'device'),
  c('device.cooler.household', 'device.cooler'),
  c('device.cooler.laboratory', 'device.cooler'),
  c('device.furnace', 'device'),
  c('device.furnace.laboratory', 'device.furnace'),
  c('device.power', 'device'),
  c('device.power.household', 'device.power'),
  c('device.power.laboratory', 'device.power'),
  c('device.measuring', 'device'),
  c('device.measuring.household', 'device.measuring'),
  c('device.measuring.laboratory', 'device.measuring'),
  c('vessel', null),
  c('vessel.household', 'vessel'),
  c('vessel.laboratory', 'vessel'),
];

const byId = new Map(CATEGORIES.map((x) => [x.id, x]));

export const getCategory = (id: CategoryId): Category | undefined => byId.get(id);

/** Root-first path: ['device', 'device.heater', 'device.heater.household']. */
export function categoryPath(id: CategoryId): Category[] {
  const out: Category[] = [];
  for (let cur = byId.get(id); cur; cur = cur.parent ? byId.get(cur.parent) : undefined) out.unshift(cur);
  return out;
}

export const childrenOf = (id: CategoryId | null): Category[] => CATEGORIES.filter((x) => x.parent === id);

export const isUnder = (id: CategoryId, ancestor: CategoryId): boolean => categoryPath(id).some((x) => x.id === ancestor);

/** 'household' | 'laboratory' — taken from the path. */
export const contextOf = (id: CategoryId): 'household' | 'laboratory' | undefined =>
  categoryPath(id).some((c) => c.id.endsWith('.household'))
    ? 'household'
    : categoryPath(id).some((c) => c.id.endsWith('.laboratory'))
      ? 'laboratory'
      : undefined;
