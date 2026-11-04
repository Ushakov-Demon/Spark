import { HUMAN_POWER_BRIEF, HUMAN_POWER_SUSTAINED, METRIC_HORSEPOWER } from '../../domains/mechanics/constants.js';
import { sig } from '../../explain/format.js';
import type { Locale } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both } from '../../scenarios/preset-kit.js';

export const answer_stairs_power = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.stairs' && x.command['step'] === 'climb' && x.record.value !== null);
  const climbs = R.map((x) => {
    const i = x.record.inputs ?? {};
    return { run: i['run'] === 1, time: x.record.value!, work: i['work'] ?? 0, power: i['power'] ?? 0, mass: i['mass'] ?? 0, height: i['height'] ?? 0 };
  });
  const walk = climbs.find((x) => !x.run);
  const dash = climbs.find((x) => x.run);
  const hp = METRIC_HORSEPOWER.value;
  const correct = !dash ? undefined : dash.power < hp ? 'less' : 'more';
  const W = (x: number, l: Locale) => `${Math.round(x)} ${t(l, 'unit-sym-W')}`;
  const J = (x: number, l: Locale) => `${Math.round(x)} ${t(l, 'unit-sym-J')}`;
  const sec = (x: number, l: Locale) => `${sig(x, 3, l)} ${t(l, 'unit-sym-s')}`;
  const hpOf = (x: number, l: Locale) => `${sig(x / hp, 2, l)} ${t(l, 'stairs-power-answer-hp-of')}`;
  return {
    ...(correct ? { correct } : {}),
    why: msg('stairs-power-answer-why'),
    say: both((l) => (dash ? (t(l, 'stairs-power-answer-say', { power: W(dash.power, l), power2: hpOf(dash.power, l) })) : t(l, 'stairs-power-answer-say-2'))),
    text: both((l) => {
      if (!walk || !dash) return '';
      const k = dash.power / Math.max(1e-9, walk.power);
      const ref = t(l, 'stairs-power-text-ref', { value: W(HUMAN_POWER_SUSTAINED.value, l), value2: W(HUMAN_POWER_BRIEF.value, l), hp: W(hp, l) });
      return t(l, 'stairs-power-answer-text', { mass: sig(walk.mass, 3, l), height: sig(walk.height, 3, l), work: J(walk.work, l), time: sec(walk.time, l), power: W(walk.power, l), power2: hpOf(walk.power, l), time2: sec(dash.time, l), power3: W(dash.power, l), power4: hpOf(dash.power, l), k: sig(k, 2, l), ref });
    }),
  };
};
