import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, STEPS_END, stepLine } from '../../scenarios/preset-kit.js';
import { gcm3, nameOf } from './words.js';

/** From the run: the bulk density, the grains' own (and the table's), shaken. */
export const answer_bulk_density = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.bulk' && x.record.value !== null);
  const step = (s: string) => R.find((x) => x.command['step'] === s);
  const pour = step('pour');
  const fill = step('fill');
  const shake = step('shake');
  const substance = String(pour?.command['substance'] ?? 'sodium-chloride');
  const correct = fill ? 'gaps' : undefined;
  return {
    ...(correct ? { correct } : {}),
    why: msg('bulk-density-answer-why'),
    say: both((l) => (pour && fill ? t(l, 'bulk-density-answer-say', { bulk: gcm3(pour.record.inputs?.['bulk'] ?? 0, l), own: gcm3(fill.record.inputs?.['density'] ?? 0, l) }) : '')),
    text: both((l) => {
      if (!pour) return '';
      const list = [
        t(l, 'bulk-density-answer-row-bulk', { rho: gcm3(pour.record.inputs?.['bulk'] ?? 0, l) }),
        ...(fill ? [t(l, 'bulk-density-answer-row-own', { liquid: fill.record.inputs?.['oil'] ? 'oil' : 'water', rho: gcm3(fill.record.inputs?.['density'] ?? 0, l), table: gcm3(fill.record.inputs?.['table'] ?? 0, l) })] : []),
        ...(shake ? [t(l, 'bulk-density-answer-row-shaken', { rho: gcm3(shake.record.inputs?.['bulk'] ?? 0, l) })] : []),
      ];
      return t(l, 'bulk-density-answer-text', { what: nameOf(substance, l), steps: list.map(stepLine).join(';') + STEPS_END });
    }),
  };
};
