import { sig } from '../../explain/format.js';
import type { Locale } from '../../knowledge/i18n.js';
import { msg, NO_TEXT, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, ch, MOTION, room, STEPS_END, stepLine, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { SNAIL_PATH, SNAIL_TIME } from '../snail-speed/bench.js';
import { DAY, HOUR, MOSO_GROWTH, TRAP_CLOSE, type PlantCommand } from './bench.js';
import { heightText, mmPerS, spanText } from './words.js';

const HOURS = [{ id: 'min', factor: 1 / 60 }, { id: 'h', factor: 1 }, { id: 'day', factor: 24 }];
/** The snail by which the shoot is measured: on a flat plastic sheet (the snail-speed experiment). */
const snailSpeed = () => SNAIL_PATH.flat.value / SNAIL_TIME;
/** Two speeds this close (within a tenth) count as the same. */
const SAME = 0.1;

export const preset_plant_motion: Preset = varied(
  {
    id: 'plant-motion',
    ask: msg('plant-motion-ask'),
    grade: 7,
    topic: MOTION,
    title: msg('plant-motion-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'plant',
    choices: (['snail', 'bamboo', 'same'] as const).map((id) => ch(id, msg(`plant-motion-choice-${id}`))),
    answerOnBoard: ['pm-shoot:', 'pm-trap:'],
    asides: [msg('plant-motion-aside-darwin')],
    formulas: ['mechanics.average-speed'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 1. Механічний рух', match: 'same', quote: 'моделювання: відносності руху; реальних природних рухів; рухів тварин і рослин' }],
    expect: 'reached',
  },
  {
    // Any two moments for the photos after the first, in minutes, hours or days — up to 23 days, when the shoot reaches
    // the tallest moso's 28 m (0,5 m + 1,19 m a day); any slow-motion camera.
    controls: [
      { id: 't1', label: msg('plant-motion-t1'), kind: 'number', unit: 'h', min: 0, max: 552, step: 0, value: 6, units: HOURS },
      { id: 't2', label: msg('plant-motion-t2'), kind: 'number', unit: 'h', min: 0, max: 552, step: 0, value: 24, units: HOURS },
      { id: 'fps', label: msg('plant-motion-fps'), kind: 'number', unit: '', min: 10, max: 1e6, step: 0, value: 240 },
    ],
    build: (v) => {
      const times = [Number(v['t1']), Number(v['t2'])].sort((a, b) => a - b).map((h) => h * HOUR);
      const fps = Number(v['fps']);
      return {
        question: msg('plant-motion-question', { t1: (l) => spanText(times[0]!, l), t2: (l) => spanText(times[1]!, l), snail: (l) => mmPerS(snailSpeed(), l) }),
        plan: [
          { kind: 'bench', command: { type: 'lab.plant', step: 'shoot', t: 0 } },
          ...times.map((tt) => ({ kind: 'bench', command: { type: 'lab.plant', step: 'shoot', t: tt } }) as const),
          // The «what if…»: the quickest plant movement there is, filmed in slow motion.
          { kind: 'bench', command: { type: 'lab.plant', step: 'trap', fps }, optional: msg('plant-motion-optional-trap') },
        ],
      };
    },
  },
);

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
