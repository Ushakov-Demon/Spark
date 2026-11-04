import { msg, t } from '../../knowledge/messages.js';
import { beaker, ch, MAGNETIC, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { earthField, modelYear } from '../../domains/electrical/wmm.js';
import type { Locale } from '../../knowledge/i18n.js';
import { parsePlace } from '../../scenarios/place.js';
import { defineCard } from '../types.js';

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

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'magnet', setup: msg('electromagnet-setup'), presets: [preset_electromagnet] });
