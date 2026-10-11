import type { AnyConnection, AnyEntity } from '../../core/entity.js';
import { watts } from '../../core/units.js';
import { cellConstant, supplyVoltage } from '../../equipment/supplies.js';
import type { ElectrodesSpec } from '../../equipment/types.js';
import type { SupplyItem } from '../../equipment/types.js';
import { burner } from '../thermal/entities.js';
import { supplyLink } from '../thermal/links.js';
import { supply } from './entities.js';

/**
 * Wire a power supply to two electrodes in a liquid: the supply itself, plus a
 * driven thermal source that carries the Joule heat into the liquid.
 */
export function placeSupply(o: { readonly item: SupplyItem; readonly id: string; readonly knob: number; readonly bodyId: string; readonly electrodes: ElectrodesSpec }): { entities: AnyEntity[]; connections: AnyConnection[] } {
  const spec = o.item.spec;
  const heatId = `${o.id}.heat`;
  return {
    entities: [
      supply({
        id: o.id,
        label: o.item.name,
        voltage: supplyVoltage(o.item, o.knob),
        currentLimit: spec.currentLimit.value,
        internalResistance: spec.internalResistance?.value ?? 0,
        ...(spec.capacity ? { capacity: spec.capacity.value * 3600 } : {}),
        device: o.item.id,
        cell: { body: o.bodyId, constant: cellConstant(o.electrodes) },
        heatSource: heatId,
      }),
      burner({ id: heatId, label: { uk: 'Теплота струму', en: 'Heat of the current' }, power: watts(0), device: o.item.id, driven: true }),
    ],
    connections: [supplyLink({ id: `${heatId}=>${o.bodyId}`, a: heatId, b: o.bodyId, share: 1, dataRef: o.item.id })],
  };
}
