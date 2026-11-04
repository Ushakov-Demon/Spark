import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both } from '../../scenarios/preset-kit.js';
import type { Locale } from '../../knowledge/i18n.js';
import { sig } from '../../explain/format.js';
import { SHEET } from './bench.js';

export const answer_scales_diy = (run: PresetRun): PresetAnswer => {
  const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.scales' && x.record.value !== null);
  const at = (step: string) => recs.find((x) => x.command['step'] === step)?.record;
  const check = at('check');
  const egg = at('egg');
  const g = (x: number, l: Locale) => `${sig(x * 1000, 3, l)} ${t(l, 'unit-sym-g')}`;
  return {
    ...(egg ? { correct: 'known' } : {}),
    why: msg('scales-diy-answer-why'),
    say: both((l) => (egg ? (t(l, 'scales-diy-answer-say', { value: g(egg.value!, l) })) : '')),
    text: both((l) => {
      const parts: string[] = [t(l, 'scales-diy-text-parts')];
      if (check) parts.push(t(l, 'scales-diy-answer-text', { water: check.inputs?.['water'], value: g(check.value!, l), value2: g(SHEET.value, l) }));
      if (egg) parts.push(t(l, 'scales-diy-answer-text-2', { sheets: egg.inputs?.['sheets'], water: egg.inputs?.['water'], value: g(egg.value!, l) }));
      return parts.join(' ');
    }),
  };
};
