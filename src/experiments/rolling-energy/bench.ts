import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import { COMPONENTS } from '../../components/index.js';
import { cite, sv } from '../../components/sourced.js';
import { G, SOLID_BALL_INERTIA } from '../../domains/mechanics/constants.js';
import { kineticEnergy, potentialEnergy, rollingSpeed } from '../../domains/mechanics/formulas.js';
import { SCALES, scaleReading } from '../../equipment/scales.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import type { SourcedValue } from '../../knowledge/types.js';
import { measured, ruler, RULER_DIVISION } from '../../scenarios/bench-kit.js';

/**
 * Kinetic and potential energy (grade 7, «визначення: кінетичної та потенціальної енергії тіл»): a steel ball is let go
 * on a groove from a height h over the table, rolls down and on along the table between two chalk marks 50 cm apart,
 * filmed by a phone in slow motion: its speed from the frames between the marks. Its kinetic energy m·v²/2 is set
 * against the potential energy m·g·h it lost. The physics is the domain's: the ball rolls without slipping, its spin
 * taking its share (rollingSpeed, a solid ball's I = 2/5·m·r²); its mass from steel's density in the catalogue.
 * Rolling friction and the air are left out.
 */

/** A steel ball from a ball bearing, its diameter. */
export const ENERGY_BALL: SourcedValue = sv(0.025, 'm', 'steel bearing ball', 'estimate', 0.2, [cite('spark', 'estimate', 'a 25 mm bearing ball is a common size', 0.025)], 'Estimate: the balance weighs it all the same.');
/** The chalk marks on the table: the speed is taken between them. */
export const ENERGY_PATH = 0.5;
/** A phone's slow motion: frames a second. */
export const SLOW_MOTION: SourcedValue = sv(240, '1/s', 'a phone’s slow-motion video', 'estimate', 0.5, [cite('spark', 'estimate', 'many phones film slow motion at 120 or 240 frames a second', 240)], 'Estimate: the frame rate is in the video’s properties.');

export type EnergyCommand = { readonly type: 'lab.energy'; readonly step: 'weigh' } | { readonly type: 'lab.energy'; readonly step: 'roll'; readonly height: number };

const ballMass = () => COMPONENTS.steel.phases.solid!.density!.value * (Math.PI / 6) * ENERGY_BALL.value ** 3;

export const energyCommand: CommandHandler<EnergyCommand> = {
  type: 'lab.energy',
  apply(state, c) {
    const m = ballMass();
    if (c.step === 'weigh') return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured('lab-balance', 'mass', scaleReading(SCALES['lab-balance'], m), m, {})] });
    if (!(c.height >= 0.02 && c.height <= 0.3)) return err({ uk: 'Кульку пускають з висоти від 2 до 30 см.', en: 'The ball is let go from 2 to 30 cm up.' });
    const v = rollingSpeed(G, c.height, SOLID_BALL_INERTIA.value);
    // Between the marks: so many frames of the slow-motion video.
    const fps = SLOW_MOTION.value;
    const t = ENERGY_PATH / v;
    const frames = Math.round(t * fps);
    const inputs = { height: c.height, mass: m, speed: v, frames, fps, path: ENERGY_PATH, kinetic: kineticEnergy(m, v), potential: potentialEnergy(m, G, c.height), g: G };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured('ruler', 'length', ruler(c.height), c.height, { ...inputs, which: 1, division: RULER_DIVISION }), measured('video', 'time', frames / fps, t, { ...inputs, which: 2, division: 1 / fps })] });
  },
};

const cm = (x: number) => Math.round(x * 100);
export const ENERGY_TEXT: Record<EnergyCommand['type'], (c: EnergyCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.energy': (x) => {
    const c = x as EnergyCommand;
    if (c.step === 'weigh')
      return {
        say: { uk: 'Зваж сталеву кульку на лабораторних терезах.', en: 'Weigh the steel ball on the laboratory balance.' },
        button: { uk: '⚖ Зважити кульку', en: '⚖ Weigh the ball' },
        plan: { uk: 'зважити кульку', en: 'weigh the ball' },
      };
    return {
      say: { uk: `Пусти кульку з жолоба з висоти ${cm(c.height)} см над столом. Телефон знімає сповільнено: скільки кадрів вона котиться від крейдяної риски до риски (50 см)?`, en: `Let the ball go on the groove ${cm(c.height)} cm above the table. The phone films in slow motion: how many frames does it take from one chalk mark to the other (50 cm)?` },
      button: { uk: `🎥 Пустити з ${cm(c.height)} см`, en: `🎥 Let go from ${cm(c.height)} cm` },
      plan: { uk: `пустити кульку з ${cm(c.height)} см і зняти сповільнено`, en: `let the ball go from ${cm(c.height)} cm and film in slow motion` },
    };
  },
};
