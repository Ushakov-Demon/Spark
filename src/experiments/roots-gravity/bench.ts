import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { cite, sv } from '../../components/sourced.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import type { SourcedValue } from '../../knowledge/types.js';

/**
 * Gravity and living things (grade 7, «впливу земного тяжіння на організми»): maize seedlings behind a wet paper
 * towel in a glass jar, their roots grown straight down. The jar is laid on its side, and a photo every 20 minutes for
 * two hours shows the root tips turning down again: after a lag of about 25 min they curve at about 1.4° a minute and
 * reach about 90° by about 110 min (maize, Ishikawa, Hasenstein & Evans, 1991). Then the jar on a clinostat — turning
 * slowly about a horizontal axis, so that «down» keeps going round: the roots do not bend.
 */

/** Maize roots laid on their side: the lag, the rate, the time to about 90° (Planta 183, 1991; means). */
export const ROOT_LAG: SourcedValue = sv(25, 'min', 'maize roots, the lag before curving', 'single-source', 0.3, [cite('ishikawa-1991-maize-roots', 'curvature began 25 ± 7 min after gravistimulation', '—', 25)]);
export const ROOT_RATE: SourcedValue = sv(1.4, '°/min', 'maize roots, the rate of curving', 'single-source', 0.35, [cite('ishikawa-1991-maize-roots', 'curvature at 1.4 ± 0.5 degrees min⁻¹', '—', 1.4)]);
export const ROOT_FULL: SourcedValue = sv(110, 'min', 'maize roots, the time to about 90°', 'single-source', 0.3, [cite('ishikawa-1991-maize-roots', 'a final angle of about 90° reached 110 ± 35 min after the start', '—', 110)]);
/** Photos every 20 min for 2 h; the angle read with a protractor on the photo, to 5°. */
export const PHOTO_EVERY = 20;
export const PHOTO_TIMES = [0, 20, 40, 60, 80, 100, 120] as const;
export const PROTRACTOR = 5;

/**
 * The root's bend down from the horizontal, degrees, t minutes after the jar was laid down: none during the lag,
 * then rising at the measured rate and easing to 90° at the measured time (the easing is the model's own).
 */
export function rootBend(t: number): number {
  const span = ROOT_FULL.value - ROOT_LAG.value;
  if (t <= ROOT_LAG.value) return 0;
  const x = Math.min(1, (t - ROOT_LAG.value) / span);
  const p = (ROOT_RATE.value * span) / 90;
  return 90 * (1 - (1 - x) ** p);
}

/** A step: the jar standing; laid on its side; on the clinostat. */
export interface GraviCommand {
  readonly type: 'lab.gravi';
  readonly step: 'upright' | 'side' | 'clino';
}

export const graviCommand: CommandHandler<GraviCommand> = {
  type: 'lab.gravi',
  apply(state, c) {
    if (!(c.step === 'upright' || c.step === 'side' || c.step === 'clino')) return err({ uk: 'Такого кроку в досліді немає.', en: 'No such step in the experiment.' });
    const rec = (time: number, bend: number): MeasurementRecord => ({ kind: 'measurement', instrument: 'protractor', quantity: 'angle', value: Math.round(bend / PROTRACTOR) * PROTRACTOR, exact: bend, entities: [], inputs: { time, division: PROTRACTOR } });
    // Upright: the roots straight down — one photo. On the side: the bend from the horizontal. On the clinostat: none.
    const trace = c.step === 'upright' ? [rec(0, 0)] : PHOTO_TIMES.map((t) => rec(t, c.step === 'side' ? rootBend(t) : 0));
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace });
  },
};


const STEP: Record<GraviCommand['step'], { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  upright: {
    say: { uk: 'Зерна кукурудзи проросли в скляній банці між склом і вологим паперовим рушником. Банка стоїть — і корінці ростуть прямо вниз.', en: 'Maize grains have sprouted in a glass jar, between the glass and a wet paper towel. The jar stands upright — and the roots grow straight down.' },
    button: { uk: '🌱 Банка стоїть', en: '🌱 The jar upright' },
    plan: { uk: 'банка стоїть: корінці вниз', en: 'the jar upright: roots down' },
  },
  side: {
    say: { uk: 'Кладемо банку на бік: тепер корінці лежать горизонтально. Фотографуємо їх кожні 20 хвилин дві години поспіль і транспортиром міряємо на знімках, на скільки градусів загнувся кінчик кореня.', en: 'We lay the jar on its side: now the roots lie level. We photograph them every 20 minutes for two hours and measure on the photos with a protractor how many degrees the root tip has bent.' },
    button: { uk: '↪ Покласти банку на бік', en: '↪ Lay the jar on its side' },
    plan: { uk: 'банка на боці: знімки кожні 20 хвилин', en: 'the jar on its side: photos every 20 minutes' },
  },
  clino: {
    say: { uk: 'А тепер — нова банка з прямими корінцями, і кладемо її на клиностат: моторчик повільно обертає її навколо горизонтальної осі, раз на хвилину. Низ для корінців весь час обходить коло. Знову знімаємо дві години.', en: 'Now a new jar with straight roots, laid on a clinostat: a little motor turns it slowly about a level axis, once a minute. For the roots, «down» keeps going round. Again we photograph for two hours.' },
    button: { uk: '🔄 Банка на клиностаті', en: '🔄 The jar on a clinostat' },
    plan: { uk: 'банка на клиностаті', en: 'the jar on a clinostat' },
  },
};

export const GRAVI_TEXT: Record<GraviCommand['type'], (c: GraviCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.gravi': (x) => STEP[(x as GraviCommand).step],
};
