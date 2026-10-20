import type { CommandHandler } from '../core/commands.js';
import type { ExperimentLogEntry } from '../core/experiment.js';
import { entityId, type EntityId } from '../core/ids.js';
import { err, ok } from '../core/result.js';
import type { SystemState } from '../core/state.js';
import type { MeasurementRecord } from '../core/trace.js';
import { bodyMass, isThermalBody } from '../domains/thermal/entities.js';
import { SCALES, scaleReading, type ScaleId } from '../equipment/scales.js';
import { LAB_VESSEL_ID } from './thermal-lab.js';

/**
 * Put the vessel on the scales and read them. The physics does not change; the
 * reading goes to the log, so a protocol (and a recording) keeps what was seen:
 * 1 l of water weighed, frozen, weighed, boiled, weighed again.
 */
export interface WeighCommand {
  readonly type: 'lab.weigh';
  readonly scale: ScaleId;
}

export interface Weighing {
  readonly scale: ScaleId;
  /** What the display showed, kg (vessel with everything in it); null — overload. */
  readonly reading: number | null;
  /** The empty vessel (with its lid) on the same scales, kg — for "minus the tare"; null — overload. */
  readonly tare: number | null;
  /** Exact model masses, kg. */
  readonly exact: { readonly total: number; readonly vessel: number };
}

/** The vessel and its lid: what "tare" takes away. */
const isVesselPart = (id: string) => id === LAB_VESSEL_ID || id === `${LAB_VESSEL_ID}.lid`;

/** Everything on the platform: the vessel, its lid and all the matter in it (ice, salt, an added piece). */
export function weigh(state: SystemState, scale: ScaleId): Weighing {
  let total = 0;
  let vessel = 0;
  for (const e of Object.values(state.entities)) {
    if (!isThermalBody(e)) continue;
    const m = bodyMass(e);
    total += m;
    if (isVesselPart(e.id)) vessel += m;
  }
  const item = SCALES[scale];
  return { scale, reading: scaleReading(item, total), tare: scaleReading(item, vessel), exact: { total, vessel } };
}

export const weighCommand: CommandHandler<WeighCommand> = {
  type: 'lab.weigh',
  apply(state, c) {
    if (!(c.scale in SCALES)) return err({ uk: `Невідомі ваги «${c.scale}»`, en: `Unknown scales "${c.scale}"` });
    if (!state.entities[entityId(LAB_VESSEL_ID)]) return err({ uk: 'Немає посуду, щоб зважити', en: 'There is no vessel to weigh' });
    const w = weigh(state, c.scale);
    const bodies = Object.values(state.entities).filter(isThermalBody).map((e) => e.id as EntityId);
    const record: MeasurementRecord = { kind: 'measurement', instrument: c.scale, quantity: 'mass', value: w.reading, exact: w.exact.total, entities: bodies };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
  },
};

export const WEIGH_COMMANDS = [weighCommand] as const;

/** The weighings in a log, in order: the reading as shown, and when (s of model time). */
export function weighingsOf<C extends { type: string }>(log: readonly ExperimentLogEntry<C>[]): { readonly time: number; readonly scale: ScaleId; readonly reading: number | null; readonly exact: number }[] {
  const out: { time: number; scale: ScaleId; reading: number | null; exact: number }[] = [];
  for (const e of log) {
    if (!e.ok || e.command.type !== 'lab.weigh') continue;
    const m = e.trace.find((r): r is MeasurementRecord => r.kind === 'measurement');
    if (m) out.push({ time: e.time, scale: m.instrument as ScaleId, reading: m.value, exact: m.exact });
  }
  return out;
}

/** A reading as the display shows it: grams with as many decimals as the division has ("1 234 г", "312,45 г"). */
export function formatReading(scale: ScaleId, kg: number | null, locale: 'uk' | 'en'): string {
  if (kg === null) return locale === 'uk' ? 'перевантаження' : 'overload';
  const digits = Math.max(0, Math.round(-Math.log10(SCALES[scale].spec.resolution.value * 1000)));
  const n = new Intl.NumberFormat(locale === 'uk' ? 'uk-UA' : 'en-GB', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(kg * 1000);
  return `${n} ${locale === 'uk' ? 'г' : 'g'}`;
}
