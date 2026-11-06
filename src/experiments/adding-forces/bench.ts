import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { cite, sv } from '../../components/sourced.js';
import { G } from '../../domains/mechanics/constants.js';
import { weight } from '../../domains/mechanics/formulas.js';
import { SCALES } from '../../equipment/scales.js';
import type { LocalizedText, Locale } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { SourcedValue } from '../../knowledge/types.js';
import { BENCH_WEIGHT, forceDivision } from '../../scenarios/bench-kit.js';

/**
 * Adding forces along one line (grade 7): one load — weights on a light ruler — held by one dynamometer,
 * then by two at the ruler's ends (the load in the middle, then nearer one end), then by one pulling up while the
 * other pulls it down. At rest the forces on the load balance: the dynamometers' resultant equals the load's weight
 * each time, R = F₁ + F₂ (the same way) or R = F₁ − F₂ (opposite ways). How the load shares itself between two ends
 * follows from the balance of moments about either end: F₁ = P·(L − x)/L + P_ruler/2.
 */

/** The ruler the weights hang on. */
export const FORCES_RULER: { readonly length: SourcedValue; readonly mass: SourcedValue } = {
  length: sv(0.3, 'm', 'a school wooden ruler', 'estimate', 0, [cite('spark', 'estimate', 'the usual 30 cm ruler', 0.3)], 'Estimate.'),
  mass: sv(0.02, 'kg', 'a 30 cm wooden ruler', 'estimate', 0.5, [cite('spark', 'estimate', 'a 30 × 3 × 0.3 cm strip of wood, some 600 kg/m³: ≈ 16 g', 0.02)], 'Estimate: its weight is in every reading alike — the first one, by a single dynamometer, includes it.'),
};
/** The load by default: two 100 g weights. */
export const FORCES_MASS = 2 * BENCH_WEIGHT.value;
/** What a force is read to: the lab dynamometer within its 5 N; beyond, a force gauge, to three figures. */
export const forcesDivision = (F: number): number => (F <= SCALES.dynamometer.spec.capacity.value ? SCALES.dynamometer.spec.resolution.value : forceDivision(F));

/**
 * How the load is held: by one dynamometer at the ruler's middle; by two at its ends, the weights `at` metres
 * from the left end; by one at the middle pulling up while the other pulls the weights down with `down` newtons.
 */
export interface ForcesCommand {
  readonly type: 'lab.forces';
  readonly hold: 'one' | 'two' | 'down';
  readonly at?: number;
  readonly down?: number;
  /** The load, kg. */
  readonly mass?: number;
  /** The weights moved along the ruler by hand, on the scene: their place is what the knob shows. */
  readonly again?: boolean;
}

export const forcesLoad = (mass: number = FORCES_MASS): { readonly weights: number; readonly ruler: number } => ({ weights: weight(mass, G), ruler: weight(FORCES_RULER.mass.value, G) });

/**
 * How two dynamometers share the load, the weights `at` metres from the left end. Moments about the right end give the
 * left one's share, and the other way round; the ruler's own weight halves.
 */
export function forcesShares(mass: number, at: number): readonly [number, number] {
  const L = FORCES_RULER.length.value;
  const { weights: P, ruler: Pr } = forcesLoad(mass);
  return [(P * (L - at)) / L + Pr / 2, (P * at) / L + Pr / 2];
}

/** Where the weights are, said from the ruler's middle (the same whichever way they went). */
export function forcesPlace(at: number, l: Locale): string {
  const off = Math.round(Math.abs(at - FORCES_RULER.length.value / 2) * 100);
  return off === 0 ? t(l, 'adding-forces-at-middle') : t(l, 'adding-forces-at-off', { cm: String(off) });
}

export const forcesCommand: CommandHandler<ForcesCommand> = {
  type: 'lab.forces',
  apply(state, c) {
    const L = FORCES_RULER.length.value;
    const mass = c.mass ?? FORCES_MASS;
    if (!(mass > 0 && Number.isFinite(mass))) return err(msg('adding-forces-bad-mass'));
    const { weights: P, ruler: Pr } = forcesLoad(mass);
    const read = (which: number, F: number, inputs: Record<string, number> = {}): MeasurementRecord => {
      const division = forcesDivision(F);
      return { kind: 'measurement', instrument: F <= SCALES.dynamometer.spec.capacity.value ? 'dynamometer' : 'force-gauge', quantity: 'force', value: Math.round(F / division) * division, exact: F, entities: [], inputs: { which, load: P + Pr, mass, division, ...inputs } };
    };
    const trace = (records: MeasurementRecord[]) => ok({ state, kind: 'measurement' as const, externalEnergy: 0, trace: records });
    if (c.hold === 'one') return trace([read(0, P + Pr)]);
    if (c.hold === 'two') {
      const x = c.at ?? L / 2;
      if (!(x >= 0 && x <= L)) return err(msg('adding-forces-command-apply'));
      const [left, right] = forcesShares(mass, x);
      return trace([read(0, left, { at: x }), read(1, right, { at: x })]);
    }
    const down = c.down ?? 1;
    if (!(down > 0 && down <= 1.5)) return err(msg('adding-forces-command-apply-2'));
    // The upper one holds the load and the lower one's pull as well.
    return trace([read(0, P + Pr + down), read(1, down, { down: 1 })]);
  },
};

export const FORCES_COMMANDS = [forcesCommand] as const;

const N = (x: number, l: Locale) => `${String(x).replace('.', t(l, 'unit-sym-dot'))} ${t(l, 'unit-sym-N')}`;

export const FORCES_TEXT: Record<ForcesCommand['type'], (c: ForcesCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.forces': (x) => {
    const c = x as ForcesCommand;
    if (c.hold === 'one')
      return {
        say: msg('adding-forces-labforces-say'),
        button: msg('adding-forces-labforces-button'),
        plan: msg('adding-forces-labforces-plan'),
      };
    if (c.again) return { say: msg('adding-forces-again-say'), button: msg('adding-forces-again-button'), plan: msg('adding-forces-again-plan') };
    if (c.hold === 'two') {
      const mid = Math.abs((c.at ?? 0.15) - FORCES_RULER.length.value / 2) < 1e-6;
      return mid
        ? {
            say: msg('adding-forces-labforces-say-2'),
            button: msg('adding-forces-labforces-button-2'),
            plan: msg('adding-forces-labforces-plan-2'),
          }
        : {
            say: msg('adding-forces-labforces-say-3'),
            button: msg('adding-forces-labforces-button-3'),
            plan: msg('adding-forces-labforces-plan-3'),
          };
    }
    const d = { d: (l: Locale) => N(c.down ?? 1, l) };
    return { say: msg('adding-forces-labforces-say-4', d), button: msg('adding-forces-labforces-button-4', d), plan: msg('adding-forces-labforces-plan-4', d) };
  },
};
