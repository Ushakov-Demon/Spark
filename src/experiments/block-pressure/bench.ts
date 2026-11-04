import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg } from '../../knowledge/messages.js';
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
    if (e === undefined) return err(msg('block-pressure-edge-command-apply'));
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured('ruler', 'length', ruler(e), e, { edge: c.edge, division: RULER_DIVISION })] });
  },
};

/** A step's button, its line in the plan, and what the Professor says doing it. */
export const EDGE_TEXT = (c: EdgeCommand): { say: LocalizedText; button: LocalizedText; plan: LocalizedText } => {
    const e = c.edge;
    const what = [msg('block-pressure-edge-text-what'), msg('block-pressure-edge-text-what-2'), msg('block-pressure-edge-text-what-3')][e]!;
    return { say: msg('block-pressure-edge-text-say', { what: (l: Locale) => what[l] }), button: msg('block-pressure-edge-text-button', { what: (l: Locale) => what[l] }), plan: msg('block-pressure-edge-text-plan', { what: (l: Locale) => what[l] }) };
  };
