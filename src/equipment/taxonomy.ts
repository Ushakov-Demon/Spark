import type { Category, CategoryId } from './types.js';

/**
 * Taxonomy of equipment. Household vs laboratory is a level of the tree, so a
 * UI can group options ("Побутові / Лабораторні") and a curriculum can ask for
 * lab equipment only. New branches (measuring instruments, chemistry glassware…)
 * are added here first.
 */
const c = (id: CategoryId, parent: CategoryId | null, uk: string, en: string): Category => ({ id, parent, name: { uk, en } });

export const CATEGORIES: readonly Category[] = [
  c('device', null, 'Прилади', 'Devices'),
  c('device.heater', 'device', 'Нагрівачі', 'Heaters'),
  c('device.heater.household', 'device.heater', 'Побутові нагрівачі', 'Household heaters'),
  c('device.heater.laboratory', 'device.heater', 'Лабораторні нагрівачі', 'Laboratory heaters'),
  c('device.cooler', 'device', 'Охолоджувачі', 'Coolers'),
  c('device.cooler.household', 'device.cooler', 'Побутові охолоджувачі', 'Household coolers'),
  c('device.cooler.laboratory', 'device.cooler', 'Лабораторні охолоджувачі', 'Laboratory cooling baths'),
  c('device.measuring', 'device', 'Вимірювальні прилади', 'Measuring instruments'),
  c('vessel', null, 'Посуд', 'Vessels'),
  c('vessel.household', 'vessel', 'Побутовий посуд', 'Household vessels'),
  c('vessel.laboratory', 'vessel', 'Лабораторний посуд', 'Laboratory glassware'),
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
