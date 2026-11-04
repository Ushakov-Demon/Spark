import { COMPONENTS } from '../../components/index.js';
import { ZERO_CELSIUS_IN_KELVIN } from '../../core/units.js';
import { sig } from '../../explain/format.js';
import { msg, NO_TEXT, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { STEPS_END, stepLine } from '../../scenarios/preset-kit.js';
import { bulb, GLASS_WATER } from './bench.js';
import { degC, reading, timeText } from './words.js';

export const answer_read_thermometer = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.thermometer' && x.record.value !== null);
  const dips = R.filter((x) => x.command['step'] === 'dip');
  const still = dips.filter((x) => !x.command['stir']);
  const stirred = dips.find((x) => x.command['stir']);
  const first = still[0];
  if (!first) return { why: msg('read-thermometer-why'), say: NO_TEXT, text: NO_TEXT };
  const water = Number(first.command['water']);
  const roomT = Number(first.command['room']);
  const div = first.record.inputs?.['division'] ?? 1;
  const deg = (x: (typeof R)[number]) => Math.round(((x.record.value ?? 0) - ZERO_CELSIUS_IN_KELVIN) / div) * div;
  // All the readings the same — the water's: no waiting was needed (it was short, or there was nothing to reach).
  const same = still.every((x) => deg(x) === deg(first)) && Math.abs(deg(first) - water) <= div / 2;
  const correct = same ? (Number(first.command['t']) <= 3 ? 'at-once' : 'any') : 'wait';
  const { tau, C } = bulb();
  // How long to wait: till the bulb's excess is within half a division; and how little the water gave away for it.
  const gap = Math.abs(water - roomT);
  const wait = gap > div / 2 ? tau * Math.log(gap / (div / 2)) : 0;
  const water1 = GLASS_WATER.value * COMPONENTS.water.phases.liquid!.specificHeat!.value;
  const lost = (C * gap) / water1;
  const reached = still.find((x) => Math.abs(deg(x) - water) <= div / 2);
  return {
    correct,
    why: msg('read-thermometer-why', { tau: (l) => timeText(tau, l, 2), wait: (l) => timeText(wait, l, 2), stirTau: (l) => timeText(bulb(true).tau, l, 2), lost: (l) => degC(lost, l, 3), C: (l) => sig(C, 2, l) }),
    say: msg('read-thermometer-say', { water: (l) => degC(water, l), first: (l) => reading(first.record, l), t1: (l) => timeText(Number(first.command['t']), l), reached: reached ? 'yes' : 'no', t: (l) => (reached ? timeText(Number(reached.command['t']), l) : '') }),
    text: msg('read-thermometer-text', {
      rows: (l) =>
        [...still, ...(stirred ? [stirred] : [])].map((x) => t(l, 'read-thermometer-row', { t: timeText(Number(x.command['t']), l), T: reading(x.record, l), stir: x.command['stir'] ? 'yes' : 'no' })).map(stepLine).join(';') + STEPS_END,
      water: (l) => degC(water, l),
    }),
  };
};
