import type { CommandHandler } from '../../core/commands.js';
import { ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import { grooveAcceleration, ROLL_PATH } from '../../scenarios/motion-bench.js';

/**
 * Distances on stroboscopic photos (grade 7): the ball of lab work 1 photographed in the dark under a stroboscope
 * flashing at equal intervals — rolling down the groove from rest, and then along the table after it. On the photo
 * every flash left an image of the ball; the photo is 1 : 5. A ruler on the photo gives the gaps between the
 * images, in millimetres; five times that is the real distance, and over the flashes' interval — the speed. Equal
 * gaps — the ball moved uniformly; growing ones — it sped up.
 */

/** The stroboscope flashes four times a second. */
export const STROBE_INTERVAL = 0.25;
/** The photo is five times smaller than life. */
export const STROBE_SCALE = 5;
/** The ruler on the photo: millimetres. */
export const STROBE_DIVISION = 0.001;
/** So many gaps are measured on each photo. */
export const STROBE_GAPS = 4;

export type StrobePhoto = 'table' | 'groove';

/** Measure the gaps between the ball's images on a photo. */
export interface StrobeCommand {
  readonly type: 'lab.strobe';
  readonly photo: StrobePhoto;
}

/** Where the ball is (m, real) at each flash: down the groove from rest, s = a·t²/2; along the table at the speed it left the groove with. */
export function strobePositions(photo: StrobePhoto): number[] {
  const a = grooveAcceleration();
  const v = Math.sqrt(2 * a * ROLL_PATH);
  return Array.from({ length: STROBE_GAPS + 1 }, (_, k) => {
    const t = k * STROBE_INTERVAL;
    return photo === 'groove' ? (a * t * t) / 2 : v * t;
  });
}

export const strobeCommand: CommandHandler<StrobeCommand> = {
  type: 'lab.strobe',
  apply(state, c) {
    const x = strobePositions(c.photo);
    const trace: MeasurementRecord[] = x.slice(1).map((p, k) => {
      const gap = (p - x[k]!) / STROBE_SCALE;
      return { kind: 'measurement', instrument: 'ruler', quantity: 'length', value: Math.round(gap / STROBE_DIVISION) * STROBE_DIVISION, exact: gap, entities: [], inputs: { which: k, scale: STROBE_SCALE, interval: STROBE_INTERVAL, division: STROBE_DIVISION } };
    });
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace });
  },
};

export const STROBE_COMMANDS = [strobeCommand] as const;

export const STROBE_TEXT: Record<StrobeCommand['type'], (c: StrobeCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.strobe': (x) => {
    const c = x as StrobeCommand;
    return c.photo === 'table'
      ? {
          say: { uk: 'Перше фото: кулька, скотившись із жолоба, котиться по столу. Приклади лінійку до фото й виміряй проміжки між зображеннями кульки.', en: 'The first photo: the ball, down from the groove, rolls along the table. Put a ruler to the photo and measure the gaps between the ball’s images.' },
          button: { uk: '📷 Фото: кулька на столі', en: '📷 Photo: the ball on the table' },
          plan: { uk: 'фото кульки на столі: проміжки', en: 'the photo of the ball on the table: the gaps' },
        }
      : {
          say: { uk: 'Друге фото: кулька скочується жолобом без початкової швидкості. Виміряй проміжки між зображеннями й тут.', en: 'The second photo: the ball rolls down the groove from rest. Measure the gaps between the images here too.' },
          button: { uk: '📷 Фото: кулька на жолобі', en: '📷 Photo: the ball in the groove' },
          plan: { uk: 'фото кульки на жолобі: проміжки', en: 'the photo of the ball in the groove: the gaps' },
        };
  },
};
