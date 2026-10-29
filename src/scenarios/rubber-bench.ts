import type { CommandHandler } from '../core/commands.js';
import { err, ok } from '../core/result.js';
import type { MeasurementRecord } from '../core/trace.js';
import { cite, sv } from '../components/sourced.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import type { SourcedValue } from '../knowledge/types.js';

/**
 * A rubber-band motor (grade 7, «конструювання: механізму на «гумовому двигуні»»): a little car whose rubber band is
 * hooked to the front axle and wound round the back one — a pencil. First the band's stiffness by the home-made
 * dynamometer (stretched 10 cm, it pulls with 2.0 N); then the car is wound 3, 6, 9 turns and let go, and the tape
 * measures how far it went. Each turn winds π·d of band on: wound twice as far, the band pulls twice as hard and for
 * twice as long a way, so the car goes four times as far — s = k·x² / (2·F), the band's store spent against the
 * resistance F. The band is taken as obeying Hooke's law all the way, and nothing of its store as lost — a model:
 * a real band gives back somewhat less.
 */

/** The pencil the band winds round, its diameter. */
export const PENCIL: SourcedValue = sv(0.007, 'm', 'a pencil, diameter', 'estimate', 0.1, [cite('spark', 'estimate', 'a usual wooden pencil', 0.007)], 'Estimate: it sets how much band each turn winds on.');
/** The band: stretched 10 cm on the home-made dynamometer, it shows 2.0 N. */
export const BAND_STRETCH = 0.1;
export const BAND_K: SourcedValue = sv(20, 'N/m', 'an office rubber band, stiffness', 'estimate', 0.3, [cite('spark', 'estimate', 'a band of the usual kind, read on the home-made dynamometer', 20)], 'Estimate: bands differ; the distances follow it, their ratios do not.');
/** What holds the car back: friction in the axles and the wheels rolling, N. */
export const CAR_DRAG: SourcedValue = sv(0.1, 'N', 'a toy car, the resistance to its motion', 'estimate', 0.5, [cite('spark', 'estimate', 'axles in cardboard, wheels of bottle caps on a floor', 0.1)], 'Estimate: it sets the distances, not their ratios.');
export const RUBBER_TURNS = [3, 6, 9] as const;

/** How far the band is wound on by N turns, m. */
export const woundOn = (turns: number): number => turns * Math.PI * PENCIL.value;
/** How far the car goes on N turns, m: the band's store ½·k·x² spent against the resistance. */
export const carDistance = (turns: number): number => (BAND_K.value * woundOn(turns) ** 2) / (2 * CAR_DRAG.value);

/** A step: the band on the dynamometer; the car wound N turns and let go. */
export interface RubberCommand {
  readonly type: 'lab.rubber';
  readonly step: 'band' | 'run';
  readonly turns?: number;
}

export const rubberCommand: CommandHandler<RubberCommand> = {
  type: 'lab.rubber',
  apply(state, c) {
    if (c.step === 'band') {
      const F = BAND_K.value * BAND_STRETCH;
      const record: MeasurementRecord = { kind: 'measurement', instrument: 'dynamometer-diy', quantity: 'force', value: Math.round(F / 0.1) * 0.1, exact: F, entities: [], inputs: { stretch: BAND_STRETCH, division: 0.1 } };
      return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
    }
    if (c.step === 'run' && c.turns && c.turns > 0 && c.turns <= 12) {
      const s = carDistance(c.turns);
      const record: MeasurementRecord = { kind: 'measurement', instrument: 'tape', quantity: 'length', value: Math.round(s / 0.01) * 0.01, exact: s, entities: [], inputs: { turns: c.turns, wound: woundOn(c.turns), k: BAND_K.value, drag: CAR_DRAG.value, division: 0.01 } };
      return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
    }
    return err({ uk: 'Такого кроку в досліді немає.', en: 'No such step in the experiment.' });
  },
};

export const RUBBER_COMMANDS = [rubberCommand] as const;

/** «3 оберти», «6 обертів». */
export const turnsText = (n: number, uk: boolean): string => (uk ? `${n} ${n % 10 === 1 && n % 100 !== 11 ? 'оберт' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'оберти' : 'обертів'}` : `${n} turn${n === 1 ? '' : 's'}`);

export const RUBBER_TEXT: Record<RubberCommand['type'], (c: RubberCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.rubber': (x) => {
    const c = x as RubberCommand;
    if (c.step === 'band')
      return {
        say: { uk: 'Спершу дізнаємося, наскільки жорстка наша гумка. Почепимо її на саморобний динамометр і розтягнемо на 10 см.', en: 'First we find out how stiff our band is. We hang it on the home-made dynamometer and stretch it 10 cm.' },
        button: { uk: '🪢 Гумка на динамометрі', en: '🪢 The band on the dynamometer' },
        plan: { uk: 'гумка на динамометрі: розтягнути на 10 см', en: 'the band on the dynamometer: stretched 10 cm' },
      };
    const n = c.turns ?? 0;
    const first = n === RUBBER_TURNS[0];
    return {
      say: first
        ? { uk: `Машинка: гумка одним кінцем зачеплена за передню вісь, другим — за задню, олівець. Крутимо задні колеса назад — гумка намотується на олівець. ${turnsText(n, true).replace(/^./, (s) => s.toUpperCase())} — відпускаємо! Рулеткою міряємо, скільки проїхала.`, en: `The car: the band is hooked to the front axle at one end and to the back one, a pencil, at the other. We turn the back wheels backwards — the band winds onto the pencil. ${turnsText(n, false).replace(/^./, (s) => s.toUpperCase())} — and let go! The tape measures how far it went.` }
        : { uk: `Тепер — ${turnsText(n, true)}. Відпускаємо!`, en: `Now — ${turnsText(n, false)}. Let go!` },
      button: { uk: `🚗 Закрутити на ${turnsText(n, true)}`, en: `🚗 Wind ${turnsText(n, false)}` },
      plan: { uk: `машинка: ${turnsText(n, true)}`, en: `the car: ${turnsText(n, false)}` },
    };
  },
};
