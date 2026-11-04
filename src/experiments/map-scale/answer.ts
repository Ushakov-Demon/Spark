import { EARTH_MEAN_RADIUS } from '../../domains/mechanics/constants.js';
import { groundDistance } from '../../domains/mechanics/formulas.js';
import type { Locale } from '../../knowledge/i18n.js';
import { msg, NO_TEXT, t } from '../../knowledge/messages.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { parsePlace } from '../../scenarios/place.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { STEPS_END, stepLine } from '../../scenarios/preset-kit.js';
import { scaleText } from './bench.js';
import { halfMillimetre, km } from './words.js';

export const answer_map_scale = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.map' && x.record.value !== null);
  const rows = R.map((x) => {
    const N = Number(x.command['scale']);
    const l = x.record.value!;
    return { N, l, L: groundDistance(l, N), truth: x.record.inputs?.['ground'] ?? 0 };
  });
  const [m1, m2] = rows;
  const correct = !m1 || !m2 ? undefined : m1.N === m2.N ? 'same' : 'large';
  const truth = m1?.truth ?? 0;
  const from = String(R[0]?.command['from'] ?? '');
  const to = String(R[0]?.command['to'] ?? '');
  const names = `${parsePlace(from)?.name ?? '?'} — ${parsePlace(to)?.name ?? '?'}`;
  const cm = (x: number, l: Locale) => formatMeasured('length', x, 0.001, l);
  return {
    ...(correct ? { correct } : {}),
    why: msg('map-scale-why'),
    say: m1 && m2 ? msg('map-scale-say', { towns: names, truth: (l) => km(truth, Math.min(m1.N, m2.N), l), nearer: m1.N < m2.N ? 'first' : 'second' }) : NO_TEXT,
    text: rows.length
      ? msg('map-scale-text', {
          towns: names,
          rows: (l) => rows.map((x) => t(l, 'map-scale-row', { scale: scaleText(x.N, l), onMap: cm(x.l, l), ground: km(x.L, x.N, l), error: halfMillimetre(x.N, l) })).map(stepLine).join(';') + STEPS_END,
          truth: (l) => km(truth, 1000, l),
          radius: Math.round(EARTH_MEAN_RADIUS.value / 1000),
        })
      : NO_TEXT,
  };
};
