import type { CommandHandler } from '../core/commands.js';
import { err, ok } from '../core/result.js';
import type { MeasurementRecord } from '../core/trace.js';
import { cite, sv } from '../components/sourced.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import type { SourcedValue } from '../knowledge/types.js';

/**
 * A model of the Solar System (grade 7, «моделювання руху планет»): the Sun is a 20 cm ball on a school field; one
 * scale for everything, k = 20 cm / the Sun's diameter, puts each planet at k·a from it and makes it k·D across —
 * the Earth a grain of 1.8 mm 21.5 m away, Neptune 650 m off. Then the planets go round: from NASA's table, the
 * square of the period over the cube of the distance, T²/a³ (in years and the Earth's distances), comes out the same
 * for all of them — Kepler's third law. At last the view of Voyager 1 on 14 February 1990: 40.5 times the Earth's
 * distance away — 870 m in the model — turned back, the Earth less than a pixel (Pale Blue Dot).
 */

export type PlanetId = 'mercury' | 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune';
const nasa = (what: string, v: number) => cite('nasa-planetary-factsheet', what, '—', v);
const P = (name: LocalizedText, d: number, a: number, t: number) => ({
  name,
  diameter: sv(d, 'km', `${name.en}, diameter`, 'single-source', 0, [nasa('Diameter (km)', d)]),
  distance: sv(a, '10⁶ km', `${name.en}, distance from the Sun`, 'single-source', 0, [nasa('Distance from Sun (10⁶ km)', a)]),
  period: sv(t, 'd', `${name.en}, orbital period`, 'single-source', 0, [nasa('Orbital Period (days)', t)]),
});
export const PLANETS: Readonly<Record<PlanetId, { readonly name: LocalizedText; readonly diameter: SourcedValue; readonly distance: SourcedValue; readonly period: SourcedValue }>> = {
  mercury: P({ uk: 'Меркурій', en: 'Mercury' }, 4879, 57.9, 88.0),
  venus: P({ uk: 'Венера', en: 'Venus' }, 12104, 108.2, 224.7),
  earth: P({ uk: 'Земля', en: 'Earth' }, 12756, 149.6, 365.2),
  mars: P({ uk: 'Марс', en: 'Mars' }, 6792, 228.0, 687.0),
  jupiter: P({ uk: 'Юпітер', en: 'Jupiter' }, 142984, 778.5, 4331),
  saturn: P({ uk: 'Сатурн', en: 'Saturn' }, 120536, 1432.0, 10747),
  uranus: P({ uk: 'Уран', en: 'Uranus' }, 51118, 2867.0, 30589),
  neptune: P({ uk: 'Нептун', en: 'Neptune' }, 49528, 4515.0, 59800),
};
export const INNER: readonly PlanetId[] = ['mercury', 'venus', 'earth', 'mars'];
export const OUTER: readonly PlanetId[] = ['jupiter', 'saturn', 'uranus', 'neptune'];
export const SUN_RADIUS: SourcedValue = sv(695700, 'km', 'the Sun, volumetric mean radius', 'single-source', 0, [cite('nasa-sun-factsheet', 'Volumetric mean radius (km)', '—', 695700)]);
/** The ball that is the Sun: 20 cm across (the condition of the model). */
export const SUN_BALL = 0.2;
/** Voyager 1 on 14 February 1990: so many of the Earth's distances from the Earth. */
export const VOYAGER_AU: SourcedValue = sv(40.5, 'AU', 'Voyager 1 from the Earth, Pale Blue Dot', 'single-source', 0, [cite('wikipedia-pale-blue-dot', 'over 6 billion kilometers (40.5 AU)', '14 February 1990', 40.5)]);
/** The model's scale: metres of the model per metre of the sky. */
export const modelScale = (): number => SUN_BALL / (2 * SUN_RADIUS.value * 1000);
/** A planet in the model: its distance from the ball, m, and its size, m. */
export const modelOf = (p: PlanetId): { distance: number; size: number } => ({ distance: modelScale() * PLANETS[p].distance.value * 1e9, size: modelScale() * PLANETS[p].diameter.value * 1000 });
/** Kepler's T²/a³ in the Earth's year and distance. */
export const keplerRatio = (p: PlanetId): number => (PLANETS[p].period.value / PLANETS.earth.period.value) ** 2 / (PLANETS[p].distance.value / PLANETS.earth.distance.value) ** 3;

/** A step of the model: measure the ball; lay out the inner or the outer planets; set them going; fly off with Voyager. */
export interface PlanetsCommand {
  readonly type: 'lab.planets';
  readonly step: 'ball' | 'inner' | 'outer' | 'kepler' | 'voyager';
}

/** The tape on the field: tenths of a metre; the ruler at the ball: millimetres. */
const TAPE = 0.1;
const RULER = 0.001;

export const planetsCommand: CommandHandler<PlanetsCommand> = {
  type: 'lab.planets',
  apply(state, c) {
    const rec = (quantity: MeasurementRecord['quantity'], value: number, division: number, inputs: Record<string, number>): MeasurementRecord => ({ kind: 'measurement', instrument: quantity === 'ratio' ? 'calculation' : 'tape', quantity, value: Math.round(value / division) * division, exact: value, entities: [], inputs: { ...inputs, division } });
    const ids = Object.keys(PLANETS) as PlanetId[];
    switch (c.step) {
      case 'ball':
        return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [rec('length', SUN_BALL, RULER, { scale: modelScale() })] });
      case 'inner':
      case 'outer':
        return ok({ state, kind: 'measurement', externalEnergy: 0, trace: (c.step === 'inner' ? INNER : OUTER).map((p) => rec('length', modelOf(p).distance, TAPE, { planet: ids.indexOf(p), size: modelOf(p).size })) });
      case 'kepler':
        return ok({ state, kind: 'measurement', externalEnergy: 0, trace: ids.map((p) => rec('ratio', keplerRatio(p), 0.001, { planet: ids.indexOf(p), a: PLANETS[p].distance.value / PLANETS.earth.distance.value, t: PLANETS[p].period.value / PLANETS.earth.period.value })) });
      case 'voyager': {
        const d = modelScale() * VOYAGER_AU.value * PLANETS.earth.distance.value * 1e9;
        return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [rec('length', d, TAPE, { au: VOYAGER_AU.value, earth: modelOf('earth').size })] });
      }
      default:
        return err({ uk: 'Такого кроку в моделі немає.', en: 'No such step in the model.' });
    }
  },
};

export const PLANETS_COMMANDS = [planetsCommand] as const;
export const planetIds = (): PlanetId[] => Object.keys(PLANETS) as PlanetId[];

const STEP: Record<PlanetsCommand['step'], { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  ball: {
    say: { uk: 'Наше Сонце — м’яч. Лінійкою міряємо його діаметр: звідси й масштаб усієї моделі.', en: 'Our Sun is a ball. A ruler measures its diameter: that gives the scale of the whole model.' },
    button: { uk: '☀ Виміряти м’яч-Сонце', en: '☀ Measure the Sun-ball' },
    plan: { uk: 'виміряти м’яч-Сонце', en: 'measure the Sun-ball' },
  },
  inner: {
    say: { uk: 'Рулеткою відміряємо від м’яча відстані до Меркурія, Венери, Землі й Марса — у тому самому масштабі — і кладемо планети, теж у масштабі.', en: 'With a tape we measure from the ball the distances to Mercury, Venus, the Earth and Mars — at the same scale — and lay the planets, to scale too.' },
    button: { uk: '🌍 Меркурій, Венера, Земля, Марс', en: '🌍 Mercury, Venus, the Earth, Mars' },
    plan: { uk: 'розкласти внутрішні планети', en: 'lay out the inner planets' },
  },
  outer: {
    say: { uk: 'А тепер — велетні: Юпітер, Сатурн, Уран і Нептун. Доведеться йти далеко.', en: 'And now the giants: Jupiter, Saturn, Uranus and Neptune. It is a long walk.' },
    button: { uk: '🪐 Юпітер, Сатурн, Уран, Нептун', en: '🪐 Jupiter, Saturn, Uranus, Neptune' },
    plan: { uk: 'розкласти зовнішні планети', en: 'lay out the outer planets' },
  },
  kepler: {
    say: { uk: 'Запустимо планети по орбітах. Що далі планета від Сонця, то довше вона обходить коло. Чи є тут закономірність? Порахуємо для кожної T²/a³ — у роках і відстанях Землі.', en: 'Let the planets go round. The further a planet is from the Sun, the longer it takes. Is there a rule? We work out T²/a³ for each — in the Earth’s years and distances.' },
    button: { uk: '🔄 Запустити планети', en: '🔄 Set the planets going' },
    plan: { uk: 'планети на орбітах: T²/a³', en: 'the planets in orbit: T²/a³' },
  },
  voyager: {
    say: { uk: '14 лютого 1990 року зонд «Вояджер-1» за ідеєю Карла Сагана востаннє сфотографував Землю — з відстані понад 6 мільярдів кілометрів, у 40,5 раза далі, ніж Земля від Сонця. Відійдемо туди в нашій моделі — й обернемося.', en: 'On 14 February 1990 the Voyager 1 probe, on Carl Sagan’s idea, took one last picture of the Earth — from over 6 billion kilometres, 40.5 times further than the Earth is from the Sun. We walk there in our model — and turn round.' },
    button: { uk: '🛰 Туди, де був «Вояджер-1»', en: '🛰 Where Voyager 1 was' },
    plan: { uk: 'туди, де був «Вояджер-1»', en: 'where Voyager 1 was' },
  },
};

export const PLANETS_TEXT: Record<PlanetsCommand['type'], (c: PlanetsCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.planets': (x) => STEP[(x as PlanetsCommand).step],
};
