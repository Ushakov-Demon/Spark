import { HEATERS } from './heaters.js';
import { isUnder } from './taxonomy.js';
import type { CategoryId, EquipmentItem, HeaterItem, VesselItem } from './types.js';
import { VESSELS } from './vessels.js';

export const EQUIPMENT: readonly EquipmentItem[] = [...Object.values(HEATERS), ...Object.values(VESSELS)];

const byId = new Map(EQUIPMENT.map((i) => [i.id, i]));

export const getItem = (id: string): EquipmentItem | undefined => byId.get(id);
export const getHeater = (id: string): HeaterItem | undefined => {
  const i = byId.get(id);
  return i?.kind === 'heater' ? i : undefined;
};
export const getVessel = (id: string): VesselItem | undefined => {
  const i = byId.get(id);
  return i?.kind === 'vessel' ? i : undefined;
};

/** All items in a category or any of its sub-categories. */
export const itemsUnder = (category: CategoryId): EquipmentItem[] => EQUIPMENT.filter((i) => isUnder(i.category, category));
