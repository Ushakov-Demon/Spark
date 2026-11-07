import type { Locale } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, STEPS_END, stepLine } from '../../scenarios/preset-kit.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { partName, type MandarinPart } from './bench.js';
import { densityOf, gcm3 } from './words.js';
import { tr } from '../../knowledge/i18n.js';

/** From the run: each part under the liquid — its density against the liquid's. */
export const answer_mandarin_float = (run: PresetRun): PresetAnswer => {
  const rows = (run.readings ?? [])
    .filter((x) => x.command.type === 'lab.mandarin' && x.command['step'] === 'dunk' && x.record.value !== null)
    .map((x) => ({ part: String(x.command['part']) as MandarinPart, salty: Number(x.command['salt']) > 0, rec: x.record as MeasurementRecord }));
  const of = (p: MandarinPart) => rows.find((x) => x.part === p && !x.salty);
  const whole = of('whole');
  const flesh = of('flesh');
  const peel = of('peel');
  // The flesh alone afloat — it was not the peel; otherwise it is the peel that keeps it up (or, too thin, could not).
  const correct = !flesh ? undefined : flesh.rec.inputs?.['floats'] ? 'flesh' : 'peel';
  const rho = (r: { rec: MeasurementRecord } | undefined, l: Locale) => (r ? gcm3(densityOf(r.rec), l) : '—');
  return {
    ...(correct ? { correct } : {}),
    why: msg('mandarin-float-answer-why'),
    say: both((l) => (whole && flesh ? t(l, 'mandarin-float-answer-say', { whole: whole.rec.inputs?.['floats'] ? 'yes' : 'no', flesh: flesh.rec.inputs?.['floats'] ? 'yes' : 'no' }) : '')),
    text: both((l) => {
      if (!rows.length) return '';
      const list = rows.map((x) => t(l, 'mandarin-float-answer-row', { part: tr(partName(x.part), l), liquid: x.salty ? 'salt' : 'water', rho: rho(x, l), floats: x.rec.inputs?.['floats'] ? 'yes' : 'no' }));
      return t(l, 'mandarin-float-answer-text', { whole: rho(whole, l), flesh: rho(flesh, l), peel: rho(peel, l), water: gcm3(whole?.rec.inputs?.['liquid'] ?? 998, l), steps: list.map(stepLine).join(';') + STEPS_END });
    }),
  };
};
