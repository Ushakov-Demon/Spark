import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { cite, sv } from '../../components/sourced.js';
import { SUBSTANCES } from '../../substances/catalog.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import type { SourcedValue } from '../../knowledge/types.js';

/**
 * Communicating vessels (grade 7, «Сполучені посудини»): a glass U-tube with water — its levels stand alike in
 * both arms. Oil poured into the left arm floats on the water as a column of its own; the water below the boundary
 * balances it: at the boundary's level the pressures in both arms are equal, ρ_oil·g·h_oil = ρ_water·g·h_water,
 * where h is each column's height above that level. The ruler reads both heights to a millimetre.
 */

/** The U-tube's inner diameter: 10 ml of oil make a column of about 5 cm. */
export const UTUBE_DIAMETER: SourcedValue = sv(0.016, 'm', 'glass U-tube, inside', 'estimate', 0.3, [cite('spark', 'estimate', 'school U-tubes are 1–2 cm wide inside', 0.016)], 'Estimate: the heights are measured all the same.');
export const UTUBE_RULER_DIVISION = 0.001;

/** Water in the U-tube, and so many millilitres of a second liquid (oil) poured into its left arm; read the ruler. */
export interface UtubeCommand {
  readonly type: 'lab.utube';
  /** mL of the second liquid poured in so far (0 — water alone). */
  readonly poured: number;
  /** The second liquid: lighter than water and not mixing with it. */
  readonly liquid: 'sunflower-oil';
}

const read = (x: number) => Math.round(x / UTUBE_RULER_DIVISION) * UTUBE_RULER_DIVISION;

export const utubeCommand: CommandHandler<UtubeCommand> = {
  type: 'lab.utube',
  apply(state, c) {
    if (!(c.poured >= 0 && c.poured <= 40)) return err({ uk: 'У коліно трубки влізе до 40 мл.', en: 'The arm takes up to 40 mL.' });
    const area = Math.PI * (UTUBE_DIAMETER.value / 2) ** 2;
    const rhoW = SUBSTANCES.water.liquid.density.value;
    const rhoO = SUBSTANCES[c.liquid].liquid.density.value;
    // The oil's column; the water in the other arm stands above the boundary so much that the pressures balance.
    const hO = (c.poured * 1e-6) / area;
    const hW = (hO * rhoO) / rhoW;
    const rec = (what: 'oil' | 'water', h: number): MeasurementRecord => ({ kind: 'measurement', instrument: 'ruler', quantity: 'length', value: read(h), exact: h, entities: [], inputs: { which: what === 'oil' ? 1 : 0, poured: c.poured, rhoWater: rhoW, rhoOil: rhoO, division: UTUBE_RULER_DIVISION } });
    // Water alone: the difference of its levels in the two arms (none).
    if (c.poured === 0) return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [{ ...rec('water', 0), inputs: { which: 2, poured: 0, rhoWater: rhoW, rhoOil: rhoO, division: UTUBE_RULER_DIVISION } }] });
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [rec('oil', hO), rec('water', hW)] });
  },
};

export const UTUBE_COMMANDS = [utubeCommand] as const;

export const UTUBE_TEXT: Record<UtubeCommand['type'], (c: UtubeCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.utube': (x) => {
    const c = x as UtubeCommand;
    return c.poured === 0
      ? {
          say: { uk: 'Налий у U-подібну трубку води й порівняй лінійкою її рівні в обох колінах.', en: 'Pour water into the U-tube and compare its levels in the two arms with the ruler.' },
          button: { uk: '💧 Налити воду й порівняти рівні', en: '💧 Pour water, compare the levels' },
          plan: { uk: 'налити воду й порівняти рівні', en: 'pour water, compare the levels' },
        }
      : {
          say: { uk: `Долий у ліве коліно олії — щоб її стало ${c.poured} мл. Виміряй лінійкою висоту стовпа олії й висоту води в правому коліні — обидві від рівня межі між олією й водою.`, en: `Pour oil into the left arm — ${c.poured} mL of it in all. Measure the height of the oil column and of the water in the right arm — both from the level of the boundary between the oil and the water.` },
          button: { uk: `🫗 Олії ${c.poured} мл: виміряти висоти`, en: `🫗 ${c.poured} mL of oil: measure the heights` },
          plan: { uk: `долити олії до ${c.poured} мл і виміряти висоти`, en: `pour oil to ${c.poured} mL, measure the heights` },
        };
  },
};
