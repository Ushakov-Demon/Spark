import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import { cite, sv } from '../../components/sourced.js';
import type { SourcedValue } from '../../knowledge/types.js';
import type { SubstanceId } from '../../substances/catalog.js';
import { measured } from '../../scenarios/bench-kit.js';
import { weigh } from '../../scenarios/weighing.js';

/** The lever balance with its set of weights: a body, or a vessel empty and with a liquid. */

/** Weigh on the lever balance: a body, the vessel with what is in it, or the empty vessel (before it was filled). */
export interface BalanceCommand {
  readonly type: 'lab.balance';
  readonly what: 'body' | 'vessel' | 'vessel-empty';
  readonly substance?: SubstanceId;
  readonly mass?: number;
  readonly label?: LocalizedText;
}

/**
 * The set of weights for a school lever balance, kg: nominal values in the sequence (1; 2; 2; 5) × 10ⁿ that
 * OIML R 111 allows for a set, from 100 g down to 10 mg (211.1 g in all).
 */
export const WEIGHT_SET: readonly number[] = [100, 50, 20, 20, 10, 5, 2, 2, 1, 0.5, 0.2, 0.2, 0.1, 0.05, 0.02, 0.02, 0.01].map((g) => g / 1000);
export const WEIGHT_SET_SOURCE: SourcedValue = sv(0.00001, 'kg', 'the smallest weight of the set', 'single-source', 0.01, [cite('oiml-r111', 'R 111-1 (2004), 4.3.1: weight sequences (1; 2; 2; 5) × 10ⁿ kg', '—', 0.00001)], 'The set itself (100 g … 10 mg) is the usual school one; the standard fixes only the sequence of nominal values.');
/** "100 г + 20 г + 5 г + 200 мг": the weights on the pan. */
export function weightsText(weights: readonly number[], uk: boolean): string {
  return weights.map((w) => (w >= 0.001 ? `${Math.round(w * 1000)} ${uk ? 'г' : 'g'}` : `${Math.round(w * 1e6)} ${uk ? 'мг' : 'mg'}`)).join(' + ');
}
/** The weights that balance a load, largest first (as one puts them on with tweezers); null — the set is not enough. */
export function balanceWeights(mass: number): number[] | null {
  let left = mass;
  const out: number[] = [];
  for (const w of WEIGHT_SET) {
    if (w <= left + 0.000005) {
      out.push(w);
      left -= w;
    }
  }
  return left > 0.00001 ? null : out;
}

export const balanceCommand: CommandHandler<BalanceCommand> = {
  type: 'lab.balance',
  apply(state, c) {
    let m: number;
    if (c.what === 'body') {
      if (!c.substance || !(c.mass && c.mass > 0)) return err({ uk: 'Що зважувати?', en: 'What to weigh?' });
      m = c.mass;
    } else {
      const w = weigh(state, 'lab-balance');
      m = c.what === 'vessel' ? w.exact.total : w.exact.vessel;
    }
    const set = balanceWeights(m);
    const value = set ? set.reduce((a, b) => a + b, 0) : null;
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured('lever-balance', 'mass', value, m, { division: 0.00001 })] });
  },
};

/** A step's button, its line in the plan, and what the Professor says doing it. */
export const BALANCE_TEXT = (c: BalanceCommand): { say: LocalizedText; button: LocalizedText; plan: LocalizedText } => {
    const b = c as BalanceCommand;
    const name = b.label ?? (b.what === 'vessel-empty' ? { uk: 'порожня посудина', en: 'the empty vessel' } : b.what === 'vessel' ? { uk: 'посудина з рідиною', en: 'the vessel with the liquid' } : { uk: 'тіло', en: 'the body' });
    return {
      say: { uk: `Поклади на ліву шальку ${name.uk.toLowerCase()} і зрівноваж терези, додаючи пінцетом важки на праву — від більших до менших.`, en: `Put ${name.en.toLowerCase()} on the left pan and balance it, adding weights with tweezers on the right — from larger to smaller.` },
      button: { uk: `⚖ Зважити: ${name.uk.toLowerCase()}`, en: `⚖ Weigh: ${name.en.toLowerCase()}` },
      plan: { uk: `зважити: ${name.uk.toLowerCase()}`, en: `weigh ${name.en.toLowerCase()}` },
    };
  };
