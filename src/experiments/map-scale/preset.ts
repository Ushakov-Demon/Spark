import { EARTH_MEAN_RADIUS } from '../../domains/mechanics/constants.js';
import { groundDistance } from '../../domains/mechanics/formulas.js';
import type { Locale } from '../../knowledge/i18n.js';
import { msg, NO_TEXT, t } from '../../knowledge/messages.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { parsePlace } from '../../scenarios/place.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, MOTION, PLACE_KYIV, PLACE_NEW_YORK, room, STEPS_END, stepLine, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { PLACE_BOSTON, PLACE_LVIV, scaleText } from './bench.js';
import { halfMillimetre, km } from './words.js';

export const preset_map_scale: Preset = varied(
  {
    id: 'map-scale',
    ask: msg('map-scale-ask'),
    grade: 7,
    topic: MOTION,
    title: msg('map-scale-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'map',
    choices: (['large', 'small', 'same'] as const).map((id) => ({ id, label: msg(`map-scale-choice-${id}`) })),
    asides: [msg('map-scale-aside-beauplan')],
    formulas: ['mechanics.map-scale'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 1. Механічний рух', match: 'same', quote: 'вимірювання: … відстаней на планах і картах' }],
    expect: 'reached',
  },
  {
    // Any two towns (found by name, online) and any two maps.
    controls: [
      { id: 'from', label: msg('map-scale-from'), kind: 'place', value: PLACE_KYIV, en: PLACE_NEW_YORK },
      { id: 'to', label: msg('map-scale-to'), kind: 'place', value: PLACE_LVIV, en: PLACE_BOSTON },
      { id: 'scale1', label: msg('map-scale-scale1'), kind: 'number', unit: '', min: 1, max: 1e9, step: 0, value: 2_000_000 },
      { id: 'scale2', label: msg('map-scale-scale2'), kind: 'number', unit: '', min: 1, max: 1e9, step: 0, value: 10_000_000 },
    ],
    build: (v) => {
      const from = String(v['from']);
      const to = String(v['to']);
      const s1 = Number(v['scale1']);
      const s2 = Number(v['scale2']);
      return {
        question: msg('map-scale-question', { scale1: (l) => scaleText(s1, l), scale2: (l) => scaleText(s2, l), from: parsePlace(from)?.name ?? '?', to: parsePlace(to)?.name ?? '?' }),
        plan: [s1, s2].map((scale) => ({ kind: 'bench', command: { type: 'lab.map', from, to, scale } }) as const),
      };
    },
  },
);

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
