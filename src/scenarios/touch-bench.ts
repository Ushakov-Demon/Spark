import type { CommandHandler } from '../core/commands.js';
import { ok } from '../core/result.js';
import type { MeasurementRecord } from '../core/trace.js';
import type { LocalizedText } from '../knowledge/i18n.js';

/**
 * Contact and non-contact forces (grade 7), watched rather than measured: a magnet pulls a paper clip on a thread
 * across a gap of air, and through a card; a rubbed comb pulls bits of paper; a block hung just above the table is
 * pulled along — no friction without touching; a weight let go falls — the Earth pulls it without touching it.
 * Each step's record says only whether the force acted and whether the bodies touched (1 or 0): no numbers.
 */

export type TouchCase = 'magnet' | 'card' | 'comb' | 'lifted' | 'fall';

/** What each case shows: does the force act, do the bodies touch. */
export const TOUCH_CASES: Readonly<Record<TouchCase, { readonly acts: boolean; readonly touch: boolean; readonly force: LocalizedText }>> = {
  magnet: { acts: true, touch: false, force: { uk: 'магнітна сила', en: 'the magnetic force' } },
  card: { acts: true, touch: false, force: { uk: 'магнітна сила', en: 'the magnetic force' } },
  comb: { acts: true, touch: false, force: { uk: 'електрична сила', en: 'the electric force' } },
  lifted: { acts: false, touch: false, force: { uk: 'сила тертя', en: 'friction' } },
  fall: { acts: true, touch: false, force: { uk: 'сила тяжіння', en: 'gravity' } },
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
    say: { uk: 'Скріпка висить на нитці. Підносимо магніт — так, щоб між ними лишалося 2 см повітря. Що станеться?', en: 'A paper clip hangs on a thread. We bring a magnet up — leaving 2 cm of air between them. What happens?' },
    button: { uk: '🧲 Магніт за 2 см', en: '🧲 A magnet 2 cm away' },
    plan: { uk: 'магніт за 2 см від скріпки', en: 'a magnet 2 cm from the clip' },
    seen: { uk: 'скріпка відхилилася до магніту, не торкаючись його', en: 'the clip leaned towards the magnet without touching it' },
  },
  card: {
    say: { uk: 'Тепер між магнітом і скріпкою ставимо картонку.', en: 'Now a card goes between the magnet and the clip.' },
    button: { uk: '🧲 Крізь картон', en: '🧲 Through a card' },
    plan: { uk: 'магніт крізь картон', en: 'the magnet through a card' },
    seen: { uk: 'скріпка так само тягнеться до магніту — крізь картон', en: 'the clip is pulled just the same — through the card' },
  },
  comb: {
    say: { uk: 'Потремо пластиковий гребінець об волосся й піднесемо до дрібних шматочків паперу на столі.', en: 'Rub a plastic comb on hair and bring it to small bits of paper on the table.' },
    button: { uk: '🪮 Гребінець і папірці', en: '🪮 A comb and bits of paper' },
    plan: { uk: 'наелектризований гребінець над папірцями', en: 'a rubbed comb over bits of paper' },
    seen: { uk: 'папірці підстрибнули до гребінця', en: 'the bits of paper jumped up to the comb' },
  },
  lifted: {
    say: { uk: 'Брусок, що ковзав по столу з тертям, підвішуємо на нитці так, щоб він ледь не торкався стола, і тягнемо вбік. Чи діє тертя?', en: 'The block that slid on the table with friction is hung on a thread just clear of the table and pulled aside. Does friction act?' },
    button: { uk: '🧱 Брусок над столом', en: '🧱 The block above the table' },
    plan: { uk: 'брусок над столом: тертя?', en: 'the block above the table: friction?' },
    seen: { uk: 'брусок рухається вільно: тертя об стіл немає', en: 'the block moves freely: no friction on the table' },
  },
  fall: {
    say: { uk: 'І наостанок: відпускаємо тягарець над столом.', en: 'And at last: let a weight go above the table.' },
    button: { uk: '⬇ Відпустити тягарець', en: '⬇ Let a weight go' },
    plan: { uk: 'відпустити тягарець', en: 'let a weight go' },
    seen: { uk: 'тягарець падає — Земля тягне його, не торкаючись', en: 'the weight falls — the Earth pulls it without touching' },
  },
};
export const touchSeen = (c: TouchCase) => CASE[c].seen;
export const touchPlan = (c: TouchCase) => CASE[c].plan;

export const TOUCH_TEXT: Record<TouchCommand['type'], (c: TouchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.touch': (x) => CASE[(x as TouchCommand).case],
};
