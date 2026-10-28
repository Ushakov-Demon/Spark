import type { CommandHandler } from '../core/commands.js';
import { err, ok } from '../core/result.js';
import type { MeasurementRecord } from '../core/trace.js';
import { cite, sv } from '../components/sourced.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import type { SourcedValue } from '../knowledge/types.js';
import { STOPWATCH_DIVISION } from './motion-bench.js';

/**
 * Measuring the speed of the air (grade 7): outdoors, on three days with different winds, a soap bubble is blown at
 * one mark and timed to another 6 m downwind (a tape measure along the ground). A bubble is so light that it moves
 * with the air: v = l / t is the wind's speed. Each day's wind is named by the Beaufort scale's signs — and the
 * speed measured is checked against the scale's range for them.
 */

/** The marks are this far apart, along the wind. */
export const WIND_TRACK = 6;

/** The Beaufort forces met here: their names, speed ranges (m/s) and signs on land. */
export const BEAUFORT: Readonly<Record<1 | 2 | 3, { readonly name: LocalizedText; readonly from: number; readonly to: number; readonly signs: LocalizedText }>> = {
  1: { name: { uk: 'тихий', en: 'light air' }, from: 0.3, to: 1.5, signs: { uk: 'дим «пливе», флюгер не обертається', en: 'smoke drifts, the wind vane does not turn' } },
  2: { name: { uk: 'легкий', en: 'light breeze' }, from: 1.6, to: 3.4, signs: { uk: 'вітер відчувається обличчям, шелестить листя', en: 'the wind is felt on the face, leaves rustle' } },
  3: { name: { uk: 'слабкий', en: 'gentle breeze' }, from: 3.4, to: 5.4, signs: { uk: 'тріпоче листя, хитаються дрібні гілки, майорять прапори', en: 'leaves and small twigs move all the time, light flags fly' } },
};

/** The days' winds: in the middle of each force's range (the conditions of the experiment, not measured values). */
export const WIND_DAYS: Readonly<Record<1 | 2 | 3, SourcedValue>> = {
  1: sv(1.0, 'm/s', 'a light air (Beaufort 1)', 'single-source', 0, [cite('wikipedia-uk-beaufort', '1 бал, «тихий»: 0,3–1,5 м/с', '—', 1.0), cite('wikipedia-beaufort', 'Light air 0.3–1.5 m/s', '—', 1.0)], 'Within the range of force 1.'),
  2: sv(2.5, 'm/s', 'a light breeze (Beaufort 2)', 'single-source', 0, [cite('wikipedia-uk-beaufort', '2 бали, «легкий»: 1,6–3,4 м/с', '—', 2.5), cite('wikipedia-beaufort', 'Light breeze 1.6–3.3 m/s', '—', 2.5)], 'Within the range of force 2.'),
  3: sv(4.4, 'm/s', 'a gentle breeze (Beaufort 3)', 'single-source', 0, [cite('wikipedia-uk-beaufort', '3 бали, «слабкий»: 3,4–5,4 м/с', '—', 4.4), cite('wikipedia-beaufort', 'Gentle breeze 3.4–5.4 m/s', '—', 4.4)], 'Within the range of force 3.'),
};

/** Time a bubble over the marks on the day with this wind. */
export interface WindCommand {
  readonly type: 'lab.wind';
  readonly day: 1 | 2 | 3;
}

/** The Beaufort force a speed falls in (of the three here; 0 — slower, 4 — faster). */
export function beaufortOf(v: number): number {
  if (v < BEAUFORT[1].from) return 0;
  return v <= BEAUFORT[1].to ? 1 : v < BEAUFORT[2].to ? 2 : v <= BEAUFORT[3].to ? 3 : 4;
}

export const windCommand: CommandHandler<WindCommand> = {
  type: 'lab.wind',
  apply(state, c) {
    const wind = WIND_DAYS[c.day];
    if (!wind) return err({ uk: 'Такого дня в досліді немає.', en: 'No such day in the experiment.' });
    const t = WIND_TRACK / wind.value;
    const div = STOPWATCH_DIVISION.value;
    const record: MeasurementRecord = { kind: 'measurement', instrument: 'stopwatch', quantity: 'time', value: Math.round(t / div) * div, exact: t, entities: [], inputs: { track: WIND_TRACK, wind: wind.value, day: c.day, division: div } };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
  },
};

export const WIND_COMMANDS = [windCommand] as const;

const DAY: Record<1 | 2 | 3, { uk: string; en: string }> = { 1: { uk: 'Перший день', en: 'The first day' }, 2: { uk: 'Другий день', en: 'The second day' }, 3: { uk: 'Третій день', en: 'The third day' } };

export const WIND_TEXT: Record<WindCommand['type'], (c: WindCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.wind': (x) => {
    const c = x as WindCommand;
    const b = BEAUFORT[c.day];
    return {
      say: { uk: `${DAY[c.day].uk}: ${b.signs.uk}. Видуй бульбашку біля першої позначки й засічи, коли вона мине другу, за 6 м.`, en: `${DAY[c.day].en}: ${b.signs.en}. Blow a bubble at the first mark and time it to the second, 6 m on.` },
      button: { uk: `🫧 ${DAY[c.day].uk}: ${b.signs.uk.split(',')[c.day === 1 ? 0 : 1]!.trim()}`, en: `🫧 ${DAY[c.day].en}: ${b.signs.en.split(',')[c.day === 1 ? 0 : 1]!.trim()}` },
      plan: { uk: `${DAY[c.day].uk.toLowerCase()}: бульбашка на 6 м`, en: `${DAY[c.day].en.toLowerCase()}: a bubble over 6 m` },
    };
  },
};
