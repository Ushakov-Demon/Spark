import { sig } from '../../explain/format.js';
import { msg, NO_TEXT, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, ch, INTRO, room, STEPS_END, stepLine, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { BULB_RADIUS, lampFlux, type LuxmeterCommand } from './bench.js';
import type { LampKind } from '../../equipment/lamps.js';
import { degText, fluxText, lengthText, reading, wattText } from './words.js';

/** Where the lamp stands for the three looks, unless it is dragged elsewhere: 30, 60 and 90 cm. */
const HEIGHTS = [0.3, 0.6, 0.9];
/** Office lighting, lx: the middle of 320–500 (the answer finds the height for it). */
const OFFICE_LUX = 400;

export const preset_light_meter: Preset = varied(
  {
    id: 'light-meter',
    ask: msg('light-meter-ask'),
    grade: 7,
    topic: INTRO,
    title: msg('light-meter-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'luxmeter',
    choices: (['linear', 'square', 'same'] as const).map((id) => ch(id, msg(`light-meter-choice-${id}`))),
    answerOnBoard: ['lm-at:', 'lm-ratio:'],
    asides: [msg('light-meter-aside-bouguer')],
    formulas: ['optics.illuminance'],
    programs: [
      { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Вступ', match: 'same', quote: 'вимірювання фізичних величин (маси, розмірів малих тіл, площ, відстаней, об’ємів, температури, освітленості)' },
      { program: 'ua-nus-2023-kreminskyi', grade: 7, topic: 'Тема 1. Методи пізнання природи. Фізика як природнича наука', match: 'related', quote: 'Фізичні величини та їх вимірювання.' },
    ],
    expect: 'reached',
  },
  {
    // Any lamp of any power; the heights — where the lamp is dragged (30, 60, 90 cm if it is not); and the «what
    // if…» — the meter tilted.
    controls: [
      { id: 'lamp', label: msg('light-meter-lamp'), kind: 'choice', value: 'led', options: (['led', 'incandescent'] as const).map((id) => ch(id, msg(`light-meter-lamp-${id}`))) },
      { id: 'power', label: msg('light-meter-power'), kind: 'number', unit: 'W', min: 0.1, max: 1e5, step: 0, value: 8 },
      { id: 'tilt', label: msg('light-meter-tilt'), kind: 'number', unit: 'deg', min: 0, max: 89, step: 0, value: 60 },
    ],
    build: (v) => {
      const lamp = String(v['lamp']) as LampKind;
      const power = Number(v['power']);
      const flux = lampFlux(lamp, power);
      const r = HEIGHTS;
      const tilt = Number(v['tilt']);
      return {
        question: msg('light-meter-question', { lamp, power: (l) => wattText(power, l), flux: (l) => fluxText(flux, l) }),
        plan: [
          ...r.map((x) => ({ kind: 'bench', command: { type: 'lab.luxmeter', lamp, power, r: x } }) as const),
          // The «what if…»: the lamp back at the first height, the meter tilted.
          { kind: 'bench', command: { type: 'lab.luxmeter', lamp, power, r: r[0]!, tilt }, optional: msg('light-meter-optional-tilt', { tilt: (l) => degText(tilt, l) }) },
        ],
      };
    },
  },
);

export const answer_light_meter = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.luxmeter' && x.record.value !== null);
  const cmd = (x: (typeof R)[number]) => x.command as unknown as LuxmeterCommand;
  const face = R.filter((x) => !cmd(x).tilt);
  const tilted = R.find((x) => cmd(x).tilt);
  if (face.length === 0) return { why: msg('light-meter-why'), say: NO_TEXT, text: NO_TEXT };
  const flux = face[face.length - 1]!.record.inputs?.['flux'] ?? 0;
  // The nearest and the farthest looks: how many times farther, how many times less light.
  const near = face.reduce((a, b) => (cmd(b).r < cmd(a).r ? b : a));
  const far = face.reduce((a, b) => (cmd(b).r > cmd(a).r ? b : a));
  const rr = cmd(far).r / cmd(near).r;
  // (The lamp's power may have been turned between the looks: the light compared per lumen of the lamp.)
  const per = (x: (typeof R)[number]) => (x.record.value ?? 0) / (x.record.inputs?.['flux'] || 1);
  const er = per(near) / (per(far) || 1);
  // The power of the distance the light fell by: 0 — not at all, 1 — as the distance, 2 — as its square.
  const n = rr > 1 + 1e-6 && er > 0 ? Math.log(er) / Math.log(rr) : 0;
  const correct = rr <= 1 + 1e-6 ? 'same' : n < 0.5 ? 'same' : n < 1.5 ? 'linear' : 'square';
  const office = Math.sqrt(flux / (4 * Math.PI * OFFICE_LUX));
  return {
    correct,
    why: msg('light-meter-why', { office: (l) => lengthText(Math.max(office, BULB_RADIUS.value), l), flux: (l) => fluxText(flux, l) }),
    say: msg('light-meter-say', { same: rr <= 1 + 1e-6 ? 'yes' : 'no', rr: Number(rr.toPrecision(2)), er: Number(er.toPrecision(2)), sq: (l) => sig(rr * rr, 2, l) }),
    text: msg('light-meter-text', {
      rows: (l) => [...face, ...(tilted ? [tilted] : [])].map((x) => t(l, 'light-meter-row', { r: lengthText(cmd(x).r, l), tilt: degText(cmd(x).tilt ?? 0, l), tilted: cmd(x).tilt ? 'yes' : 'no', E: reading(x.record, l) })).map(stepLine).join(';') + STEPS_END,
      flux: (l) => fluxText(flux, l),
    }),
  };
};
