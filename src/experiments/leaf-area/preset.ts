import { NUMBER_LOCALE, type Locale } from '../../knowledge/i18n.js';
import { msg, NO_TEXT, t } from '../../knowledge/messages.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, ch, INTRO, room, STEPS_END, stepLine, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { formName, LEAF_FORMS, type LeafForm } from './bench.js';
import { cm2, sideText } from './words.js';

const FORMS = Object.keys(LEAF_FORMS) as LeafForm[];

export const preset_leaf_area: Preset = varied(
  {
    id: 'leaf-area',
    ask: msg('leaf-area-ask'),
    grade: 7,
    topic: INTRO,
    title: msg('leaf-area-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'area',
    choices: (['fine', 'coarse', 'same'] as const).map((id) => ch(id, msg(`leaf-area-choice-${id}`))),
    asides: [msg('leaf-area-aside-rhind')],
    formulas: ['mechanics.rectangle-area', 'mechanics.palette-area'],
    programs: [
      { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Вступ', match: 'same', quote: 'вимірювання фізичних величин (… площ …) за допомогою вимірювальних приладів' },
      { program: 'ua-nus-2023-kreminskyi', grade: 7, topic: 'Тема 1. Методи пізнання природи. Фізика як природнича наука', match: 'related', quote: 'Фізичні величини та їх вимірювання.' },
    ],
    expect: 'reached',
  },
  {
    // Any card, any leaf (its form and length), any two palettes.
    controls: [
      { id: 'a', label: msg('leaf-area-card-a'), kind: 'number', unit: 'm', min: 0.001, max: 1, step: 0, value: 0.06, units: [{ id: 'mm', factor: 0.001 }, { id: 'cm', factor: 0.01 }, { id: 'm', factor: 1 }] },
      { id: 'b', label: msg('leaf-area-card-b'), kind: 'number', unit: 'm', min: 0.001, max: 1, step: 0, value: 0.04, units: [{ id: 'mm', factor: 0.001 }, { id: 'cm', factor: 0.01 }, { id: 'm', factor: 1 }] },
      { id: 'form', label: msg('leaf-area-form'), kind: 'choice', value: 'ovate', options: FORMS.map((f) => ch(f, formName(f))) },
      { id: 'length', label: msg('leaf-area-length'), kind: 'number', unit: 'm', min: 0.01, max: 1, step: 0, value: 0.1, units: [{ id: 'mm', factor: 0.001 }, { id: 'cm', factor: 0.01 }, { id: 'm', factor: 1 }] },
      { id: 'side1', label: msg('leaf-area-side1'), kind: 'number', unit: 'm', min: 0.0005, max: 0.05, step: 0, value: 0.01, units: [{ id: 'mm', factor: 0.001 }, { id: 'cm', factor: 0.01 }] },
      { id: 'side2', label: msg('leaf-area-side2'), kind: 'number', unit: 'm', min: 0.0005, max: 0.05, step: 0, value: 0.005, units: [{ id: 'mm', factor: 0.001 }, { id: 'cm', factor: 0.01 }] },
    ],
    build: (v) => {
      const form = (FORMS as string[]).includes(String(v['form'])) ? (String(v['form']) as LeafForm) : 'ovate';
      const length = Number(v['length']);
      const sides = [Number(v['side1']), Number(v['side2'])];
      return {
        question: msg('leaf-area-question', { side1: (l) => sideText(sides[0]!, l), side2: (l) => sideText(sides[1]!, l), form: (l) => formName(form)[l] }),
        plan: [
          { kind: 'bench', command: { type: 'lab.area', step: 'card', a: Number(v['a']), b: Number(v['b']) } },
          ...sides.map((side) => ({ kind: 'bench', command: { type: 'lab.area', step: 'palette', form, length, side } }) as const),
        ],
      };
    },
  },
);

export const answer_leaf_area = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.area' && x.record.value !== null);
  const card = R.filter((x) => x.command['step'] === 'card').map((x) => x.record.value!);
  const palettes = R.filter((x) => x.command['step'] === 'palette').map((x) => ({ side: Number(x.command['side']), S: x.record.value!, exact: x.record.exact, whole: x.record.inputs?.['whole'] ?? 0, cut: x.record.inputs?.['cut'] ?? 0, division: x.record.inputs?.['division'] ?? 1e-4 }));
  const [p1, p2] = palettes;
  // The finer palette against the coarser: which came closer to the leaf's area (equal squares — the same palette).
  const fine = p1 && p2 ? (p1.side <= p2.side ? p1 : p2) : undefined;
  const coarse = fine === p1 ? p2 : p1;
  const off = (p: { S: number; exact: number }) => Math.abs(p.S - p.exact);
  const correct = !fine || !coarse ? undefined : fine.side === coarse.side || Math.abs(off(fine) - off(coarse)) < 1e-12 ? 'same' : off(fine) < off(coarse) ? 'fine' : 'coarse';
  const exact = p1?.exact ?? 0;
  const pct = (p: { S: number; exact: number }, l: Locale) => `${new Intl.NumberFormat(NUMBER_LOCALE[l], { maximumFractionDigits: 1 }).format((Math.abs(p.S - p.exact) / p.exact) * 100)} %`;
  const cardText = (l: Locale) => (card.length === 2 ? t(l, 'leaf-area-row-card', { a: formatMeasured('length', card[0]!, 0.001, l), b: formatMeasured('length', card[1]!, 0.001, l), S: cm2(card[0]! * card[1]!, l) }) : '');
  return {
    ...(correct ? { correct } : {}),
    why: msg('leaf-area-why'),
    say: fine && coarse ? msg('leaf-area-say', { exact: (l) => cm2(exact, l), closer: correct ?? 'same', fine: (l) => sideText(fine.side, l), coarse: (l) => sideText(coarse.side, l) }) : NO_TEXT,
    text: palettes.length
      ? msg('leaf-area-text', {
          rows: (l) => [cardText(l), ...palettes.map((p) => t(l, 'leaf-area-row-palette', { side: sideText(p.side, l), whole: p.whole, cut: p.cut, S: formatMeasured('area', p.S, p.division, l), off: pct(p, l) }))].filter(Boolean).map(stepLine).join(';') + STEPS_END,
          exact: (l) => cm2(exact, l, 4),
        })
      : NO_TEXT,
  };
};
