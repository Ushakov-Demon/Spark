import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import type { Locale } from '../../knowledge/i18n.js';
import { sig } from '../../explain/format.js';

export const answer_electromagnet = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.magnet' && x.record.quantity === 'angle' && x.record.value !== null);
  const at = (current: number, core: boolean, reversed = false) => R.find((x) => Number(x.command['current']) === current && !!x.command['core'] === core && !!x.command['reversed'] === reversed)?.record;
  const earth = R[0]?.record.inputs?.['earth'] ?? 19.4e-6;
  const B = (deg: number) => earth * Math.tan((deg * Math.PI) / 180);
  const steps = [0.5, 1, 1.5].map((I) => ({ I, deg: at(I, true)?.value ?? 0 }));
  const back = at(1.5, true, true)?.value ?? 0;
  const bare = at(1.5, false)?.value ?? 0;
  const full = steps[2]!.deg;
  // A change counts if it is more than a compass division.
  const div = R[0]?.record.inputs?.['division'] ?? 2;
  const byCurrent = full - steps[0]!.deg > div;
  const byCore = full - bare > div;
  const correct = !R.length ? undefined : byCurrent && byCore ? 'both' : byCurrent ? 'current' : byCore ? 'core' : undefined;
  const deg = (x: number) => `${x}°`;
  const uT = (x: number, l: Locale) => `${sig(x * 1e6, 2, l)} ${t(l, 'unit-sym-uT')}`;
  const A = (x: number, l: Locale) => `${sig(x, 2, l)} ${t(l, 'unit-sym-A')}`;
  const list = (l: Locale) => steps.map((x) => `${A(x.I, l)} — ${deg(x.deg)} (B ≈ ${uT(B(x.deg), l)})`).map(stepLine).join(';') + STEPS_END;
  const turns = Number(R[0]?.command['turns'] ?? 100);
  const place = String(R[0]?.command['place'] ?? 'Київ');
  const where = (l: Locale) => `${place}${R[0]?.command['example'] ? t(l, 'electromagnet-question-uk') : ''}`;
  return {
    ...(correct ? { correct } : {}),
    why: msg('electromagnet-answer-why'),
    say: both((l) => (correct === 'both' ? t(l, 'electromagnet-answer-say') : t(l, 'electromagnet-answer-say-2'))),
    text: both((l) =>
      t(l, 'electromagnet-answer-text-4', { turns: String(turns), l: list(l), earth: uT(earth, l), l2: where(l), back: deg(Math.abs(back)), value: A(1.5, l), value2: back < 0 ? t(l, 'electromagnet-answer-text') : '', bare: Math.abs(bare) < div ? t(l, 'electromagnet-answer-text-2', { bare: deg(Math.abs(bare)) }) : t(l, 'electromagnet-answer-text-3', { bare: deg(Math.abs(bare)) }) }),
    ),
  };
};
