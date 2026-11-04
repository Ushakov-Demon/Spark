import { sig } from '../../explain/format.js';
import type { Locale } from '../../knowledge/i18n.js';
import { msg, NO_TEXT, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { STEPS_END, stepLine } from '../../scenarios/preset-kit.js';
import { DAY, MOSO_GROWTH, TRAP_CLOSE, type PlantCommand } from './bench.js';
import { heightText, mmPerS, spanText } from './words.js';
import { snailSpeed } from './preset.js';

/** Two speeds this close (within a tenth) count as the same. */
const SAME = 0.1;

export const answer_plant_motion = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.plant' && x.record.value !== null);
  const cmd = (x: (typeof R)[number]) => x.command as unknown as PlantCommand;
  const photos = R.filter((x) => cmd(x).step === 'shoot');
  const trap = R.find((x) => cmd(x).step === 'trap');
  const first = photos[0];
  const last = photos[photos.length - 1];
  const snail = snailSpeed();
  const why = msg('plant-motion-why', { snail: (l) => mmPerS(snail, l), day: (l) => heightText(MOSO_GROWTH.value, l), bamboo: (l) => mmPerS(MOSO_GROWTH.value / DAY, l), ratio: (l) => sig(snail / (MOSO_GROWTH.value / DAY), 2, l), trap: (l) => `${sig(TRAP_CLOSE.value, 2, l)} ${t(l, 'unit-sym-s')}` });
  if (!first || !last) return { why, say: NO_TEXT, text: NO_TEXT };
  const tOf = (x: (typeof R)[number]) => x.record.inputs?.['t'] ?? 0;
  // The shoot's speed over all the photos, by the pole's readings.
  const dt = tOf(last) - tOf(first);
  const v = dt > 0 ? ((last.record.value ?? 0) - (first.record.value ?? 0)) / dt : 0;
  const ratio = v > 0 ? snail / v : Infinity;
  const correct = Math.abs(ratio - 1) <= SAME ? 'same' : ratio > 1 ? 'snail' : 'bamboo';
  const trapV = trap ? (trap.record.inputs?.['path'] ?? 0) / (trap.record.value || 1) : 0;
  const times = (x: number, l: Locale) => sig(x, 2, l);
  return {
    correct,
    why,
    say: msg('plant-motion-say', { v: (l) => mmPerS(v, l), snail: (l) => mmPerS(snail, l), times: Number.isFinite(ratio) ? Number((ratio >= 1 ? ratio : 1 / ratio).toPrecision(2)) : 0, who: correct, grew: dt > 0 ? 'yes' : 'no', trap: trap ? 'yes' : 'no', trapV: (l) => mmPerS(trapV, l), trapTimes: (l) => times(trapV / snail, l) }),
    text: msg('plant-motion-text', {
      rows: (l) =>
        [...photos.map((x) => t(l, 'plant-motion-row', { t: spanText(tOf(x), l), h: heightText(x.record.value ?? 0, l) })), ...(trap ? [t(l, 'plant-motion-row-trap', { n: trap.record.inputs?.['frames'] ?? 0, v: mmPerS(trapV, l) })] : [])].map(stepLine).join(';') + STEPS_END,
      v: (l) => mmPerS(v, l),
    }),
  };
};
