import type { CommandHandler } from '../core/commands.js';
import { entityId } from '../core/ids.js';
import { err, ok } from '../core/result.js';
import type { MeasurementRecord } from '../core/trace.js';
import { cite, sv } from '../components/sourced.js';
import { COMPONENTS, type ComponentId } from '../components/index.js';
import { molesToMass } from '../domains/electrical/electrochem.js';
import { isSupply } from '../domains/electrical/entities.js';
import { SCALES, scaleReading } from '../equipment/scales.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import type { SourcedValue } from '../knowledge/types.js';
import { LAB_SUPPLY_ID } from './thermal-lab.js';

/**
 * Weighing an electrode (grade 9, lab work 3 — the electrochemical equivalent): the cathode is taken out of the
 * solution, dried and put on the laboratory balance — the plate and the metal the current has settled on it
 * (Faraday's law in the electrical domain gives how much).
 */

/** The plate: as wide as the electrodes of the lab, longer (a part above the liquid for the clamp), this thick. */
export const PLATE_HEIGHT = 0.08;
export const PLATE_THICKNESS: SourcedValue = sv(0.001, 'm', 'electrode plate', 'estimate', 0.5, [cite('spark', 'estimate', 'school electrode plates are about 0.5–1.5 mm', 0.001)], 'Estimate: the plate’s own mass cancels out in m₂ − m₁.');

/** Take the cathode out, dry it and weigh it on the laboratory balance. */
export interface CathodeCommand {
  readonly type: 'lab.cathode';
}

export const cathodeCommand: CommandHandler<CathodeCommand> = {
  type: 'lab.cathode',
  apply(state) {
    const sup = state.entities[entityId(LAB_SUPPLY_ID)];
    if (!sup || !isSupply(sup) || !sup.params.electrodes) return err({ uk: 'Електродів у посудині немає.', en: 'There are no electrodes in the vessel.' });
    const e = sup.params.electrodes;
    const plate = e.width * PLATE_HEIGHT * PLATE_THICKNESS.value * (COMPONENTS[e.material as ComponentId]?.phases.solid?.density?.value ?? 0);
    // The metal settled on it: what the current made at the cathode that is a metal (copper — not hydrogen, not a sludge).
    const metal = Object.entries(sup.state.made ?? {})
      .filter(([k]) => !k.startsWith('-') && !k.includes('|') && COMPONENTS[k as ComponentId]?.stateAtRoom === 'solid' && COMPONENTS[k as ComponentId]?.electrical?.conducts === 'metal')
      .reduce((a, [k, n]) => a + molesToMass(k as ComponentId, n), 0);
    const m = plate + metal;
    const balance = SCALES['lab-balance'];
    const record: MeasurementRecord = { kind: 'measurement', instrument: 'lab-balance', quantity: 'mass', value: scaleReading(balance, m), exact: m, entities: [], inputs: { charge: sup.state.charge, time: sup.state.time, metal, division: balance.spec.resolution.value } };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
  },
};

export const ELECTRODE_COMMANDS = [cathodeCommand] as const;

export const ELECTRODE_TEXT: Record<CathodeCommand['type'], () => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.cathode': () => ({
    say: { uk: 'Вийми катод (електрод «−»), обережно висуши й зваж на лабораторних терезах.', en: 'Take out the cathode (the “−” electrode), dry it carefully and weigh it on the laboratory balance.' },
    button: { uk: '⚖ Зважити катод', en: '⚖ Weigh the cathode' },
    plan: { uk: 'зважити катод', en: 'weigh the cathode' },
  }),
};
