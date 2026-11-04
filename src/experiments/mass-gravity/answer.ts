import { sig } from '../../explain/format.js';
import { tr, type Locale } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { MgCommand } from './bench.js';
import { blockOf, massText } from './shared.js';

export const answer_mass_gravity = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.mg' && x.record.value !== null).map((x) => ({ c: x.command as unknown as MgCommand, F: x.record.value!, division: x.record.inputs?.['division'] ?? 0.1 }));
  const bodies = R.filter((x) => x.c.body === 'weights');
  const block = R.find((x) => x.c.body !== 'weights');
  // The force on each kilogram, from the readings: the same for every body — within what the instruments can tell.
  const ratios = bodies.map((x) => x.F / x.c.mass);
  const mean = ratios.reduce((a, b) => a + b, 0) / Math.max(1, ratios.length);
  const slack = Math.max(0.05, ...bodies.map((x) => x.division / 2 / x.F)) * 2;
  const same = ratios.every((r) => Math.abs(r - mean) <= slack * mean);
  // (Else: does the force per kilogram fall or rise with the mass?)
  const byMass = [...bodies].sort((a, b) => a.c.mass - b.c.mass).map((x) => x.F / x.c.mass);
  const correct = same || byMass.length < 2 ? 'proportional' : byMass[byMass.length - 1]! < byMass[0]! ? 'slower' : 'proportional';
  const N = (x: { F: number; division: number }, l: Locale) => formatMeasured('force', x.F, x.division, l);
  const g = (l: Locale) => sig(mean, 2, l);
  const twin = block ? bodies.find((x) => x.c.mass === block.c.mass) : undefined;
  return {
    correct,
    why: msg('mass-gravity-why', { g }),
    say: msg('mass-gravity-answer-say', { g, has: block ? 'yes' : 'no', block: block?.c.body ?? '', of: (l) => (block && block.c.body !== 'weights' ? tr(blockOf(block.c.body), l).toLowerCase() : ''), same: block && twin && block.F === twin.F ? 'yes' : 'no' }),
    text: both((l) => {
      const rows = R.map((x) => `${x.c.body === 'weights' ? massText(x.c.mass, l) : t(l, 'mass-gravity-block', { block: x.c.body, of: tr(blockOf(x.c.body), l).toLowerCase(), mass: massText(x.c.mass, l) })} — ${N(x, l)}`);
      return t(l, 'mass-gravity-text', { rows: rows.map(stepLine).join(';') + STEPS_END, g: g(l) });
    }),
  };
};
