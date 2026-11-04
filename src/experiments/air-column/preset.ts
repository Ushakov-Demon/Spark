import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, PLACE_KYIV, PLACE_NEW_YORK, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { airPlace, AIRSHIP, type AirWhere } from './bench.js';
import type { Locale } from '../../knowledge/i18n.js';
import { parsePlace } from '../../scenarios/place.js';
import { sig } from '../../explain/format.js';

export const preset_air_column: Preset = varied(
  {
    ask: msg('air-column-ask'),
    id: 'air-column',
    grade: 7,
    topic: INTERACTION,
    title: msg('air-column-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'air',
    choices: [ch('nothing', msg('air-column-choices')), ch('car', msg('air-column-choices-2')), ch('tonnes', msg('air-column-choices-3'))],
    answerOnBoard: ['am:'],
    formulas: ['mechanics.pressure', 'mechanics.hydrostatic-pressure'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'впливу земного тяжіння на організми, газову оболонку Землі' }],
    expect: 'reached',
  },
  {
    // The town: its height above the sea sets the readings (the higher the town, the less air above it).
    controls: [{ id: 'place', label: msg('air-column-place-label'), kind: 'place', value: PLACE_KYIV, en: PLACE_NEW_YORK }],
    build: (v) => {
      const value = String(v['place']);
      const name = parsePlace(value)?.name ?? 'Київ';
      return {
        question: msg('air-column-build-question', { name }),
        plan: (['ground', 'ninth', 'airship', 'high'] as const).map((where) => ({ kind: 'bench', command: { type: 'lab.air', place: value, where } }) as const),
      };
    },
  },
);

export const answer_air_column = (run: PresetRun): PresetAnswer => {
  const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.air' && x.record.value !== null);
  const at = (w: AirWhere) => recs.find((x) => x.command['where'] === w)?.record ?? null;
  const town = airPlace(String(recs[0]?.command['place'] ?? ''));
  const p1 = at('ground');
  const p2 = at('ninth');
  const p3 = at('airship');
  const p4 = at('high');
  const g = p1?.inputs?.['g'] ?? 9.80665;
  const m = p1 ? p1.value! / g : null;
  const correct = m === null ? undefined : m > 5000 ? 'tonnes' : m > 300 ? 'car' : 'nothing';
  const hPa = (x: number, l: Locale) => `${sig(x / 100, 6, l)} ${t(l, 'air-column-answer-h-pa')}`;
  const rho = p1 && p2 ? (p1.value! - p2.value!) / (g * ((p2.inputs?.['height'] ?? 0) - (p1.inputs?.['height'] ?? 0))) : null;
  return {
    ...(correct ? { correct } : {}),
    why: msg('air-column-answer-why'),
    say: both((l) => (m === null ? '' : t(l, 'air-column-answer-say', { m: sig(m / 1000, 2, l) }))),
    text: both((l) => {
      if (!p1) return '';
      const parts: string[] = [t(l, 'air-column-text-parts', { name: town.name, elevation: String(Math.round(town.elevation ?? 0)), value: hPa(p1.value!, l), value2: sig(p1.value!, 5, l), m: sig(m!, 3, l) })];
      if (p2 && rho !== null) {
        const dp = p1.value! - p2.value!;
        const dh = (p2.inputs?.['height'] ?? 0) - (p1.inputs?.['height'] ?? 0);
        parts.push(t(l, 'air-column-answer-text', { dh: sig(dh, 3, l), value: hPa(p2.value!, l), dp: sig(dp / 100, 3, l), rho: sig(rho, 3, l) }));
      }
      if (p3) parts.push(t(l, 'air-column-answer-text-2', { value: hPa(p3.value!, l) }));
      if (p4) parts.push(t(l, 'air-column-answer-text-3', { value: hPa(p4.value!, l), value2: sig(((p1.value! - p4.value!) / p1.value!) * 100, 2, l) }));
      if (rho !== null) parts.push(t(l, 'air-column-answer-text-4', { volume: sig(AIRSHIP.volume.value, 4, l), volume2: sig((AIRSHIP.volume.value * rho) / 1000, 2, l) }));
      return parts.join(' ');
    }),
  };
};
