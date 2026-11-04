import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, MAGNETIC, room, stepLine, STEPS_END, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { earthField, modelYear } from '../../domains/electrical/wmm.js';
import type { Locale } from '../../knowledge/i18n.js';
import { parsePlace } from '../../scenarios/place.js';
import { sig } from '../../explain/format.js';

/** The electromagnet's examples: where the Earth's field is taken unless another city is given. */
const MAGNET_KYIV = 'Київ|50.4500|30.5200';
const MAGNET_NEW_YORK = 'New York|40.7128|-74.0060';

export const preset_electromagnet: Preset = varied(
  {
    id: 'electromagnet',
    ask: msg('electromagnet-ask'),
    grade: 9,
    topic: MAGNETIC,
    title: msg('electromagnet-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'magnet',
    choices: [ch('both', msg('electromagnet-choices')), ch('current', msg('electromagnet-choices-2')), ch('core', msg('electromagnet-choices-3'))],
    choicesAt: 'end',
    answerOnBoard: ['mB:'],
    formulas: ['electrical.compass-field'],
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 9, item: 'ЛР № 4', topic: 'Тема 2. Магнітні та електромагнітні явища', match: 'same', quote: '№ 4. Виготовлення електромагніта та вивчення його магнітного поля.' }],
    expect: 'reached',
  },
  {
    // How many turns are wound on the nail: the field grows with them as with the current. Where the lab is: the
    // Earth's field that holds the needle north differs from place to place (Kyiv and New York — examples).
    controls: [
      { id: 'turns', label: msg('electromagnet-turns-label'), kind: 'number', unit: '', min: 50, max: 150, step: 50, value: 100 },
      { id: 'place', label: msg('electromagnet-place-label'), kind: 'place', value: MAGNET_KYIV, en: MAGNET_NEW_YORK },
    ],
    build: (v) => {
      const turns = Number(v['turns']);
      const place = parsePlace(v['place']) ?? parsePlace(MAGNET_KYIV)!;
      const example = v['place'] === MAGNET_KYIV || v['place'] === MAGNET_NEW_YORK;
      const earth = earthField(place.lat, place.lon, modelYear(new Date())).h;
      const uT = (l: 'uk' | 'en') => (earth * 1e6).toFixed(1).replace('.', t(l, 'electromagnet-amps'));
      const at = { place: place.name, earth, ...(example ? { example: true } : {}) };
      return {
        question: msg('electromagnet-build-question', { turns: String(turns), name: place.name, value: (l: Locale) => uT(l), value2: (l: Locale) => example ? t(l, 'electromagnet-question-uk') : '' }),
        plan: [
          { kind: 'bench', command: { type: 'lab.magnet', current: 0, turns, core: true, ...at } },
          ...[0.5, 1, 1.5].map((current) => ({ kind: 'bench', command: { type: 'lab.magnet', current, turns, core: true, ...at } }) as const),
          { kind: 'bench', command: { type: 'lab.magnet', current: 1.5, turns, core: true, reversed: true, ...at } },
          { kind: 'bench', command: { type: 'lab.magnet', current: 1.5, turns, core: false, ...at } },
        ],
      };
    },
  },
);

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
