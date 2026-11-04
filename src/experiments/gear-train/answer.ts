import { sig } from '../../explain/format.js';
import type { Locale } from '../../knowledge/i18n.js';
import { msg, t, t as tl } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, STEPS_END, stepLine } from '../../scenarios/preset-kit.js';

export const answer_gear_train = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.gears' && x.command['step'] === 'turn' && x.record.value !== null);
  const rows = R.map((x) => {
    const i = x.record.inputs ?? {};
    return { train: (x.command['train'] as number[]) ?? [], n1: i['driver'] ?? 1, n2: x.record.value!, z1: i['first'] ?? 0, z2: i['last'] ?? 0, same: i['same'] === 1 };
  });
  const fits = rows.every((x) => Math.abs(x.n2 / x.n1 - x.z1 / x.z2) < 0.05);
  const pairsReverse = rows.filter((x) => x.train.length === 2).every((x) => !x.same);
  const correct = !rows.length ? undefined : fits && pairsReverse ? 'teeth' : 'same';
  const way = (same: boolean, l: Locale) => ((same ? tl(l, 'gear-train-way') : tl(l, 'gear-train-answer-way')));
  return {
    ...(correct ? { correct } : {}),
    why: msg('gear-train-answer-why'),
    say: both((l) => (correct === 'teeth' ? t(l, 'gear-train-answer-say') : t(l, 'gear-train-answer-say-2'))),
    text: both((l) => {
      if (!rows.length) return '';
      const list = rows.map((x) => t(l, 'gear-train-text-list', { train: x.train.join(' → '), n1: sig(x.n1, 3, l), n2: sig(x.n2, 3, l), z1: String(x.z1), z2: String(x.z2), z12: sig(x.z1 / x.z2, 3, l), same: way(x.same, l) }));
      return t(l, 'gear-train-answer-text', { steps: list.map(stepLine).join(';') + STEPS_END });
    }),
  };
};
