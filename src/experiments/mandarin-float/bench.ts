import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import { COMPONENTS } from '../../components/index.js';
import { cite, sv } from '../../components/sourced.js';
import { density } from '../../domains/mechanics/formulas.js';
import { amountsOf, solubilityAt, solutionDensity } from '../../domains/thermal/mixture.js';
import { SCALES } from '../../equipment/scales.js';
import { VESSELS } from '../../equipment/vessels.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import { msg } from '../../knowledge/messages.js';
import type { SourcedValue } from '../../knowledge/types.js';
import { measured } from '../../scenarios/bench-kit.js';
import { mmText, sizeText } from './shared.js';

/**
 * Why a mandarin in its peel does not sink (grade 7, Holovko, topic 3, «Робота в групі для розв’язання проблем: …
 * Чому не тоне мандарин із шкуринкою?»): the mandarin is weighed, put into a beaker of water on a tared balance — it
 * floats — and pushed under with a thin rod: the balance shows the water it pushes aside, its volume. Then it is
 * peeled: the flesh and the peel each weighed and put under the same way. The flesh is denser than water, the spongy
 * peel much lighter; together — lighter than water. «А якщо?» — the peeled one into salt water.
 *
 * The mandarin is a body of this experiment (like the balls of `ball-bounce`), not a substance of the catalogue: its
 * flesh is taken as its juice, a sugar solution (the thermal domain's solution density, sucrose from the catalogue);
 * the peel's density is an estimate from a measured fruit. The pupil chooses the mandarin's size and its peel.
 */

/** A W. Murcott mandarin: 69–82 mm across, its peel 3.5–4.65 mm; the default — 7 cm, 4 mm. */
export const MANDARIN_DIAMETER: SourcedValue = sv(0.07, 'm', 'a mandarin, across', 'single-source', 0.1, [cite('rehal-2017-murcott', 'Conclusion: «fruit diameter varied from 81.82-68.97 mm»', 'W. Murcott', 0.07)], 'Within the measured range; other mandarins are smaller — the pupil chooses.');
export const MANDARIN_PEEL: SourcedValue = sv(0.004, 'm', 'a mandarin’s peel, thick', 'single-source', 0.15, [cite('rehal-2017-murcott', 'Results: «The thickness of the peel varied from 3.5-4.65 mm»', 'W. Murcott', 0.004)], 'Within the measured range.');
/** The juice's sugar: total soluble solids 10.8 °Brix — taken as sucrose by mass. */
export const MANDARIN_SUGAR: SourcedValue = sv(0.108, '', 'mandarin juice, sugar by mass', 'single-source', 0.1, [cite('rehal-2017-murcott', 'Results: «The TSS … was found to be 10.8° B»', 'W. Murcott', 0.108)], 'About 85 % of the solids are sugars (the same paper); taken all as sucrose — the juice’s density changes little by it.');
/**
 * The peel: spongy, its white inner layer full of air. Derived from one measured fruit: 177.1 g whole, 88.21 g
 * peeled, 750 kg/m³ whole (water displacement) — so the peel is 88.9 g in 236 − 85 = 151 cm³, about 590 kg/m³.
 */
export const PEEL_DENSITY: SourcedValue = {
  value: 590,
  unit: 'kg/m³',
  conditions: 'mandarin peel, fresh',
  verification: 'estimate',
  tolerance: 0.25,
  citations: [{ source: 'rehal-2017-murcott', locator: 'Results: 177.1 g with peel, 88.21 g without; true density 750 kg/m³ by water displacement', conditions: 'derived: the flesh taken as its juice', range: [500, 750] }],
  note: 'Estimate: no measurement of the peel alone was found; the same paper’s volume by mean diameter would give a denser fruit. A peel 3–5 mm thick at this density keeps a 7 cm mandarin afloat, as it is seen to be.',
};

export type MandarinPart = 'whole' | 'flesh' | 'peel';
export type MandarinCommand =
  | { readonly type: 'lab.mandarin'; readonly step: 'weigh'; readonly diameter: number; readonly peel: number }
  | { readonly type: 'lab.mandarin'; readonly step: 'peel'; readonly diameter: number; readonly peel: number }
  | { readonly type: 'lab.mandarin'; readonly step: 'dunk'; readonly part: MandarinPart; readonly diameter: number; readonly peel: number; readonly salt: number };

const ball = (d: number) => (Math.PI / 6) * d ** 3;
const water = () => COMPONENTS.water.phases.liquid!.density!.value;
/** The flesh: its juice, a sugar solution (the thermal domain), kg/m³. */
export const fleshDensity = (): number => solutionDensity(amountsOf(1 - MANDARIN_SUGAR.value, 0, [{ component: 'sucrose', mass: MANDARIN_SUGAR.value, crystals: 0 }]));
/**
 * The liquid: water, or `salt` kg of salt to a litre (a kilogram) of water — what does not dissolve (beyond the
 * solubility at 20 °C) lies on the bottom.
 */
export const liquidDensity = (salt: number): number => {
  if (!(salt > 0)) return water();
  const most = solubilityAt('sodium-chloride', 20) / 100;
  return solutionDensity(amountsOf(1, 0, [{ component: 'sodium-chloride', mass: salt, crystals: Math.max(0, salt - most) }]));
};

/** The mandarin's parts: their volumes, m³, and masses, kg. */
export function mandarinParts(diameter: number, peel: number): Record<MandarinPart, { volume: number; mass: number }> {
  const V = ball(diameter);
  const Vf = ball(diameter - 2 * peel);
  const flesh = { volume: Vf, mass: Vf * fleshDensity() };
  const skin = { volume: V - Vf, mass: (V - Vf) * PEEL_DENSITY.value };
  return { whole: { volume: V, mass: flesh.mass + skin.mass }, flesh, peel: skin };
}

/**
 * The beaker under it: the smallest that holds three times the body (a bigger vessel beyond a litre), half full;
 * what stands on the balance — the beaker, the water, the body and the push.
 */
export function beakerFor(volume: number): { size: number; load: number } {
  const b = VESSELS.beaker.spec;
  const size = b.sizes.find((s) => s / 1000 >= 3 * volume) ?? 3000 * volume;
  return { size, load: b.massModel.base + b.massModel.perLiter * size + (size / 2000) * water() };
}

/** The balance that takes this load: the lab balance (0.01 g, 620 g), the kitchen scales (1 g, 5 kg), or scales read to three figures. */
export function balanceFor(load: number): { instrument: string; division: number } {
  for (const id of ['lab-balance', 'kitchen-scale'] as const) {
    const s = SCALES[id].spec;
    if (load <= s.capacity.value) return { instrument: id, division: s.resolution.value };
  }
  return { instrument: 'scales', division: 10 ** (Math.floor(Math.log10(load)) - 2) };
}
const read = (x: number, d: number) => Math.round(x / d) * d;

export const mandarinCommand: CommandHandler<MandarinCommand> = {
  type: 'lab.mandarin',
  apply(state, c) {
    if (!(c.diameter > 0)) return err(msg('mandarin-float-command-diameter'));
    if (!(c.peel > 0 && 2 * c.peel < c.diameter)) return err(msg('mandarin-float-command-peel'));
    const parts = mandarinParts(c.diameter, c.peel);
    const done = (...r: ReturnType<typeof measured>[]) => ok({ state, kind: 'measurement' as const, externalEnergy: 0, trace: r });
    if (c.step === 'weigh') {
      const m = parts.whole.mass;
      const b = balanceFor(m);
      return done(measured(b.instrument, 'mass', read(m, b.division), m, { division: b.division }));
    }
    if (c.step === 'peel') {
      // The flesh on the balance, the peel beside: weighed one after the other.
      const b = balanceFor(parts.flesh.mass);
      const p = balanceFor(parts.peel.mass);
      return done(measured(b.instrument, 'mass', read(parts.flesh.mass, b.division), parts.flesh.mass, { division: b.division }), measured(p.instrument, 'mass', read(parts.peel.mass, p.division), parts.peel.mass, { division: p.division, peel: 1 }));
    }
    if (!(c.salt >= 0)) return err(msg('mandarin-float-command-salt'));
    // Into the beaker on the tared balance: a body that floats shows its whole mass; held right under (pushed with a
    // rod, or on a thread), it shows the liquid it pushes aside — ρ_р·V.
    const part = parts[c.part];
    const rho = liquidDensity(c.salt);
    const own = density(part.mass, part.volume);
    const beaker = beakerFor(part.volume);
    const b = balanceFor(beaker.load + Math.max(part.mass, rho * part.volume));
    const under = rho * part.volume;
    const md = balanceFor(part.mass).division;
    return done(measured(b.instrument, 'mass', read(under, b.division), under, { mass: read(part.mass, md), massDivision: md, liquid: rho, own, floats: own < rho ? 1 : 0, share: Math.min(1, own / rho), volume: part.volume, beaker: beaker.size, division: b.division }));
  },
};

const PART: Record<MandarinPart, LocalizedText> = {
  whole: msg('mandarin-float-part-whole'),
  flesh: msg('mandarin-float-part-flesh'),
  peel: msg('mandarin-float-part-peel'),
};
export const partName = (p: MandarinPart): LocalizedText => PART[p];

const DUNK_KEYS: Record<MandarinPart, readonly [string, string, string]> = {
  whole: ['mandarin-float-dunk-say-whole', 'mandarin-float-dunk-button-whole', 'mandarin-float-dunk-plan-whole'],
  flesh: ['mandarin-float-dunk-say-flesh', 'mandarin-float-dunk-button-flesh', 'mandarin-float-dunk-plan-flesh'],
  peel: ['mandarin-float-dunk-say-peel', 'mandarin-float-dunk-button-peel', 'mandarin-float-dunk-plan-peel'],
};

export const MANDARIN_TEXT: Record<MandarinCommand['type'], (c: MandarinCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.mandarin': (x) => {
    const c = x as MandarinCommand;
    if (c.step === 'weigh') return { say: msg('mandarin-float-weigh-say', { d: (l) => sizeText(c.diameter, l), peel: (l) => mmText(c.peel, l) }), button: msg('mandarin-float-weigh-button'), plan: msg('mandarin-float-weigh-plan') };
    if (c.step === 'peel') return { say: msg('mandarin-float-peel-say'), button: msg('mandarin-float-peel-button'), plan: msg('mandarin-float-peel-plan') };
    const k = DUNK_KEYS[c.part];
    const liquid = c.salt > 0 ? 'salt' : 'water';
    return { say: msg(k[0], { liquid }), button: msg(k[1], { liquid }), plan: msg(k[2], { liquid }) };
  },
};
