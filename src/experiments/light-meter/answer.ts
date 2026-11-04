import { sig } from '../../explain/format.js';
import { msg, NO_TEXT, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { STEPS_END, stepLine } from '../../scenarios/preset-kit.js';
import { BULB_RADIUS, type LuxmeterCommand } from './bench.js';
import { degText, fluxText, lengthText, reading } from './words.js';

/** Office lighting, lx: the middle of 320–500 (the answer finds the height for it). */
const OFFICE_LUX = 400;

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
