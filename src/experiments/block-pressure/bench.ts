import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import { BENCH_BLOCK, measured, ruler, RULER_DIVISION } from '../../scenarios/bench-kit.js';

/** The pressure of a block (grade 7): its edges measured with a ruler, its weight with a dynamometer. */

/** Measure one edge of the block with the ruler (0 — length, 1 — width, 2 — height). */
export interface EdgeCommand {
  readonly type: 'lab.edge';
  readonly edge: 0 | 1 | 2;
}

export const edgeCommand: CommandHandler<EdgeCommand> = {
  type: 'lab.edge',
  apply(state, c) {
    const e = BENCH_BLOCK.edges[c.edge];
    if (e === undefined) return err({ uk: 'У бруска три ребра: довжина, ширина, висота.', en: 'A block has three edges: length, width, height.' });
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured('ruler', 'length', ruler(e), e, { edge: c.edge, division: RULER_DIVISION })] });
  },
};

/** A step's button, its line in the plan, and what the Professor says doing it. */
export const EDGE_TEXT = (c: EdgeCommand): { say: LocalizedText; button: LocalizedText; plan: LocalizedText } => {
    const e = c.edge;
    const what = [{ uk: 'довжину', en: 'the length' }, { uk: 'ширину', en: 'the width' }, { uk: 'висоту', en: 'the height' }][e]!;
    return { say: { uk: `Приклади лінійку й виміряй ${what.uk} бруска.`, en: `Put the ruler to the block and measure ${what.en}.` }, button: { uk: `📏 Виміряти ${what.uk}`, en: `📏 Measure ${what.en}` }, plan: { uk: `виміряти ${what.uk}`, en: `measure ${what.en}` } };
  };
