import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { cite, sv } from '../../components/sourced.js';
import { CARBON_STEEL_MU, compassDeflection, EARTH_HORIZONTAL, electromagnetField } from '../../domains/electrical/magnet.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import type { SourcedValue } from '../../knowledge/types.js';
import { AMMETER } from '../resistor-circuit/bench.js';

/**
 * An electromagnet (grade 9, lab work 4 — «Виготовлення електромагніта та вивчення його магнітного поля»): insulated
 * wire wound on a steel nail, in a circuit with the source, a rheostat and the ammeter. The coil lies with its axis
 * east–west; a compass on that axis, 15 cm from the coil's middle, points north while there is no current. The
 * current's field across the Earth's turns the needle: tg θ = B / B_Earth. The current is set to 0.5, 1, 1.5 A, then
 * turned the other way (the electromagnet's poles swap), then the nail is pulled out (a coil on a plastic straw).
 */

/** The nail: 10 cm long, 4 mm thick; the winding over it — 6 cm long, its turns 2.2 mm from the axis. */
export const NAIL: { readonly length: SourcedValue; readonly radius: SourcedValue; readonly coil: SourcedValue } = {
  length: sv(0.1, 'm', 'a 100 mm nail', 'estimate', 0.1, [cite('spark', 'estimate', 'a common 100 mm nail, 4 mm thick', 0.1)], 'Estimate.'),
  radius: sv(0.0022, 'm', 'the winding’s radius', 'estimate', 0.2, [cite('spark', 'estimate', 'a 4 mm nail with one layer of 0.3–0.4 mm wire', 0.0022)], 'Estimate.'),
  coil: sv(0.06, 'm', 'the winding’s length', 'estimate', 0.2, [cite('spark', 'estimate', 'a few layers wound over 6 cm of the nail', 0.06)], 'Estimate.'),
};
/** The compass on the coil's axis, from its middle. */
export const COMPASS_DISTANCE = 0.15;
/** A school compass: marks every 2°. */
export const COMPASS_DIVISION = 2;

/** Set the current (the rheostat; 0 — the key open), its direction, the nail in or out; read the ammeter and the compass. */
export interface MagnetCommand {
  readonly type: 'lab.magnet';
  readonly current: number;
  readonly turns: number;
  readonly core: boolean;
  readonly reversed?: boolean;
  /** The horizontal part of the Earth's field where the lab is, T, and the place's name (an example, or the one given). */
  readonly earth?: number;
  readonly place?: string;
  readonly example?: boolean;
}

export const magnetCommand: CommandHandler<MagnetCommand> = {
  type: 'lab.magnet',
  apply(state, c) {
    if (!(c.current >= 0 && c.current <= AMMETER.max.value)) return err({ uk: 'Амперметр показує до 2 А.', en: 'The ammeter reads up to 2 A.' });
    if (!(Number.isInteger(c.turns) && c.turns >= 10 && c.turns <= 300)) return err({ uk: 'Намотують від 10 до 300 витків.', en: 'Wind 10 to 300 turns.' });
    const B = electromagnetField({ turns: c.turns, current: c.current, coilLength: NAIL.coil.value, radius: NAIL.radius.value, ...(c.core ? { core: { length: NAIL.length.value, mur: CARBON_STEEL_MU.value } } : {}) }, COMPASS_DISTANCE);
    const signed = c.reversed ? -B : B;
    const earth = c.earth ?? EARTH_HORIZONTAL.value;
    if (!(earth > 1e-6 && earth < 50e-6)) return err({ uk: 'Тут поле Землі майже вертикальне: компас не працює.', en: 'Here the Earth’s field is almost vertical: a compass does not work.' });
    const angle = compassDeflection(signed, earth);
    const inputs = { turns: c.turns, core: c.core ? 1 : 0, reversed: c.reversed ? 1 : 0, field: signed, earth, distance: COMPASS_DISTANCE, division: COMPASS_DIVISION };
    const compass: MeasurementRecord = { kind: 'measurement', instrument: 'compass', quantity: 'angle', value: Math.round(angle / COMPASS_DIVISION) * COMPASS_DIVISION, exact: angle, entities: [], inputs };
    const div = AMMETER.division.value;
    const ammeter: MeasurementRecord = { kind: 'measurement', instrument: 'ammeter', quantity: 'current', value: Math.round(c.current / div) * div, exact: c.current, entities: [], inputs: { division: div } };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: c.current > 0 ? [ammeter, compass] : [compass] });
  },
};

export const MAGNET_COMMANDS = [magnetCommand] as const;

const amps = (x: number, uk: boolean) => `${String(x).replace('.', uk ? ',' : '.')} ${uk ? 'А' : 'A'}`;
export const MAGNET_TEXT: Record<MagnetCommand['type'], (c: MagnetCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.magnet': (x) => {
    const c = x as MagnetCommand;
    if (c.current === 0)
      return {
        say: { uk: 'Ключ розімкнений, струму немає. Куди показує стрілка компаса?', en: 'The key is open, there is no current. Where does the compass needle point?' },
        button: { uk: '🧭 Без струму: подивитися на компас', en: '🧭 No current: look at the compass' },
        plan: { uk: 'подивитися на компас без струму', en: 'look at the compass with no current' },
      };
    if (!c.core)
      return {
        say: { uk: `Витягни цвях — котушка лишається на пластиковій трубочці. Знову струм ${amps(c.current, true)}. Що тепер показує компас?`, en: `Pull the nail out — the coil stays on a plastic straw. Again ${amps(c.current, false)}. What does the compass show now?` },
        button: { uk: `🪛 Без цвяха: ${amps(c.current, true)}`, en: `🪛 No nail: ${amps(c.current, false)}` },
        plan: { uk: `витягти цвях і пустити ${amps(c.current, true)}`, en: `pull the nail out, ${amps(c.current, false)}` },
      };
    if (c.reversed)
      return {
        say: { uk: `Поміняй місцями дроти на клемах джерела — струм піде в інший бік. Знову ${amps(c.current, true)}. Куди тепер відхилиться стрілка?`, en: `Swap the wires at the source’s terminals — the current goes the other way. Again ${amps(c.current, false)}. Which way does the needle turn now?` },
        button: { uk: `⇄ Струм в інший бік: ${amps(c.current, true)}`, en: `⇄ The current reversed: ${amps(c.current, false)}` },
        plan: { uk: `змінити напрям струму, ${amps(c.current, true)}`, en: `reverse the current, ${amps(c.current, false)}` },
      };
    return {
      say: { uk: `Замкни ключ і реостатом встанови струм ${amps(c.current, true)}. На скільки градусів відхилилася стрілка компаса?`, en: `Close the key and set ${amps(c.current, false)} with the rheostat. How many degrees did the compass needle turn?` },
      button: { uk: `⚡ Струм ${amps(c.current, true)}: подивитися на компас`, en: `⚡ ${amps(c.current, false)}: look at the compass` },
      plan: { uk: `встановити струм ${amps(c.current, true)}`, en: `set the current to ${amps(c.current, false)}` },
    };
  },
};
