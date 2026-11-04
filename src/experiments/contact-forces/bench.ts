import type { CommandHandler } from '../../core/commands.js';
import { ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import { msg } from '../../knowledge/messages.js';

/**
 * Contact and non-contact forces (grade 7), watched rather than measured: a magnet pulls a paper clip on a thread
 * across a gap of air, and through a card; a rubbed comb pulls bits of paper; a block hung just above the table is
 * pulled along — no friction without touching; a weight let go falls — the Earth pulls it without touching it.
 * Each step's record says only whether the force acted and whether the bodies touched (1 or 0): no numbers.
 */

export type TouchCase = 'magnet' | 'card' | 'comb' | 'lifted' | 'fall';

/** What each case shows: does the force act, do the bodies touch. */
export const TOUCH_CASES: Readonly<Record<TouchCase, { readonly acts: boolean; readonly touch: boolean; readonly force: LocalizedText }>> = {
  magnet: { acts: true, touch: false, force: msg('contact-forces-magnet-force') },
  card: { acts: true, touch: false, force: msg('contact-forces-magnet-force') },
  comb: { acts: true, touch: false, force: msg('contact-forces-comb-force') },
  lifted: { acts: false, touch: false, force: msg('contact-forces-lifted-force') },
  fall: { acts: true, touch: false, force: msg('contact-forces-fall-force') },
};

/** Show one case; record whether the force acted, and whether the bodies touched. */
export interface TouchCommand {
  readonly type: 'lab.touch';
  readonly case: TouchCase;
}

export const touchCommand: CommandHandler<TouchCommand> = {
  type: 'lab.touch',
  apply(state, c) {
    const t = TOUCH_CASES[c.case];
    // (Not a measured quantity: 1 — the force acted, 0 — it did not; shown as words wherever it is shown.)
    const record: MeasurementRecord = { kind: 'measurement', instrument: 'eye', quantity: 'force', value: t.acts ? 1 : 0, exact: t.acts ? 1 : 0, entities: [], inputs: { acts: t.acts ? 1 : 0, touch: t.touch ? 1 : 0, observed: 1 } };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
  },
};

export const TOUCH_COMMANDS = [touchCommand] as const;

const CASE: Record<TouchCase, { say: LocalizedText; button: LocalizedText; plan: LocalizedText; seen: LocalizedText }> = {
  magnet: {
    say: msg('contact-forces-magnet-say'),
    button: msg('contact-forces-magnet-button'),
    plan: msg('contact-forces-magnet-plan'),
    seen: msg('contact-forces-magnet-seen'),
  },
  card: {
    say: msg('contact-forces-card-say'),
    button: msg('contact-forces-card-button'),
    plan: msg('contact-forces-card-plan'),
    seen: msg('contact-forces-card-seen'),
  },
  comb: {
    say: msg('contact-forces-comb-say'),
    button: msg('contact-forces-comb-button'),
    plan: msg('contact-forces-comb-plan'),
    seen: msg('contact-forces-comb-seen'),
  },
  lifted: {
    say: msg('contact-forces-lifted-say'),
    button: msg('contact-forces-lifted-button'),
    plan: msg('contact-forces-lifted-plan'),
    seen: msg('contact-forces-lifted-seen'),
  },
  fall: {
    say: msg('contact-forces-fall-say'),
    button: msg('contact-forces-fall-button'),
    plan: msg('contact-forces-fall-plan'),
    seen: msg('contact-forces-fall-seen'),
  },
};
export const touchSeen = (c: TouchCase) => CASE[c].seen;
export const touchPlan = (c: TouchCase) => CASE[c].plan;

export const TOUCH_TEXT: Record<TouchCommand['type'], (c: TouchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.touch': (x) => CASE[(x as TouchCommand).case],
};
