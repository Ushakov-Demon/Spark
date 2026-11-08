import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import { cite, sv } from '../../components/sourced.js';
import { G } from '../../domains/mechanics/constants.js';
import { supportForce, weight } from '../../domains/mechanics/formulas.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import { msg } from '../../knowledge/messages.js';
import type { SourcedValue } from '../../knowledge/types.js';
import { forceDivision, measured } from '../../scenarios/bench-kit.js';
import { massText } from './shared.js';

/**
 * How to set 8 paper cups so they bear a person (grade 7, Holovko, topic 3, «Робота в групі для розв’язання проблем: Як
 * розташувати 8 паперових стаканів, щоб вони витримали вагу дитини?»): one cup is pressed down with a force gauge till
 * it buckles — standing, and lying on its side; the Professor is weighed; then a board is laid on the cups and he stands
 * on it — the cups standing in two rows, him in the middle and at the board’s end; the cups on their sides. The board
 * shares his weight among the cups (the mechanics domain: the forces on equal supports, from the balance of forces and
 * moments); a cup holds while its share is below what it bears. The pupil chooses his mass and how many cups.
 *
 * The cups are bodies of this experiment, not substances of the catalogue: what one bears is a measured cup’s.
 */

/** A 250 mL paper cup squeezed along its height (between two plates): a good cup bears 350 N and more. */
export const CUP_UPRIGHT: SourcedValue = sv(350, 'N', 'a 250 mL paper cup, squeezed along its height between plates', 'single-source', 0.3, [cite('toppan-us10358253', 'Abstract: «the paper cup has a buckling strength of 350 N or more» (after five 1 m drops; opening up, between two parallel plates)', '250 mL, paperboard 260 g/m²', 350)], 'The patent’s bar for a strong cup; a thin cheap cup buckles at less.');
/** The same cup on its side: its thin round wall is flattened at a small force. */
export const CUP_SIDE: SourcedValue = {
  value: 20,
  unit: 'N',
  conditions: 'a 250 mL paper cup on its side, pressed across',
  verification: 'estimate',
  tolerance: 0.6,
  citations: [{ source: 'spark', locator: 'estimate', conditions: 'a cup squeezed across flattens in the hand', range: [5, 50] }],
  note: 'Estimate: makers test a cup’s side only by how far it gives (at hundreds of grams), not when it is flattened; along its height it bears tens of times more.',
};
/** The cups stand in two rows, this far apart (a 250 mL cup is some 8 cm across its rim), m. */
export const CUP_PITCH: SourcedValue = sv(0.09, 'm', 'cups side by side, centre to centre', 'estimate', 0.2, [cite('spark', 'estimate', 'a 250 mL cup is about 8 cm across the rim; a centimetre between', 0.09)], 'Estimate: only the spacing of the rows matters, not its size.');
/** The floor scales: to 0.1 kg. */
export const FLOOR_DIVISION = 0.1;

export type CupWay = 'upright' | 'side';
export type CupsCommand =
  | { readonly type: 'lab.cups'; readonly step: 'press'; readonly way: CupWay }
  | { readonly type: 'lab.cups'; readonly step: 'weigh'; readonly mass: number }
  | { readonly type: 'lab.cups'; readonly step: 'stand'; readonly way: CupWay; readonly at: 'middle' | 'end'; readonly mass: number; readonly cups: number };

/** The cups under the board: two rows across, so many along; where each stands along the board from the middle, m. */
export function cupPlaces(n: number): number[] {
  const cols = Math.ceil(n / 2);
  const along = Array.from({ length: cols }, (_, i) => (i - (cols - 1) / 2) * CUP_PITCH.value);
  return Array.from({ length: n }, (_, i) => along[Math.floor(i / 2)]!);
}

/** What each cup bears, N: the weight `P` shared by the board, standing at `e` from the middle (a cup cannot pull). */
export function cupForces(P: number, n: number, e: number): number[] {
  const xs = cupPlaces(n);
  const sum = xs.reduce((a, x) => a + x * x, 0);
  return xs.map((x) => Math.max(0, supportForce(P, n, e, x, sum)));
}

const strength = (way: CupWay) => (way === 'upright' ? CUP_UPRIGHT : CUP_SIDE).value;
const read = (x: number, d: number) => Math.round(x / d) * d;

export const cupsCommand: CommandHandler<CupsCommand> = {
  type: 'lab.cups',
  apply(state, c) {
    const done = (...r: ReturnType<typeof measured>[]) => ok({ state, kind: 'measurement' as const, externalEnergy: 0, trace: r });
    if (c.step === 'press') {
      // Pressed down with a force gauge till the cup gives: what it shows then.
      const F = strength(c.way);
      const d = forceDivision(F);
      return done(measured(F <= 5 ? 'dynamometer' : 'force-gauge', 'force', read(F, d), F, { division: d, upright: c.way === 'upright' ? 1 : 0 }));
    }
    if (!(c.mass > 0)) return err(msg('paper-cups-command-mass'));
    if (c.step === 'weigh') return done(measured('floor-scales', 'mass', read(c.mass, FLOOR_DIVISION), c.mass, { division: FLOOR_DIVISION }));
    if (!(Number.isInteger(c.cups) && c.cups >= 1)) return err(msg('paper-cups-command-cups'));
    // The Professor on the board: in its middle, or over the end row of cups.
    const P = weight(c.mass, G);
    const xs = cupPlaces(c.cups);
    const e = c.at === 'end' ? Math.max(...xs) : 0;
    const forces = cupForces(P, c.cups, e);
    const most = Math.max(...forces);
    const bears = strength(c.way);
    const holds = most <= bears;
    return done(measured('eye', 'ratio', holds ? 1 : 0, holds ? 1 : 0, { weight: P, most, share: P / c.cups, bears, cups: c.cups, at: e, crushed: forces.filter((f) => f > bears).length }));
  },
};

const WAY: Record<CupWay, LocalizedText> = { upright: msg('paper-cups-way-upright'), side: msg('paper-cups-way-side') };
export const wayName = (w: CupWay): LocalizedText => WAY[w];

export const CUPS_TEXT: Record<CupsCommand['type'], (c: CupsCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.cups': (x) => {
    const c = x as CupsCommand;
    if (c.step === 'press') return { say: msg('paper-cups-press-say', { way: c.way }), button: msg('paper-cups-press-button', { way: c.way }), plan: msg('paper-cups-press-plan', { way: c.way }) };
    if (c.step === 'weigh') return { say: msg('paper-cups-weigh-say'), button: msg('paper-cups-weigh-button'), plan: msg('paper-cups-weigh-plan') };
    const args = { way: c.way, at: c.at, cups: String(c.cups), m: (l: 'uk' | 'en') => massText(c.mass, l) };
    return { say: msg('paper-cups-stand-say', args), button: msg('paper-cups-stand-button', args), plan: msg('paper-cups-stand-plan', args) };
  },
};
