import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';
import { SUBSTANCES } from '../../substances/catalog.js';

export const answer_lever_balance = (run: PresetRun): PresetAnswer => {
  const r = (run.readings ?? []).filter((x) => x.command.type === 'lab.balance');
  const at = (what: string) => r.find((x) => x.command['what'] === what)?.record.value ?? null;
  const empty = at('vessel-empty');
  const full = at('vessel');
  const water = empty !== null && full !== null ? full - empty : null;
  const g = (kg: number, l: Locale) => formatMeasured('mass', kg, 0.00001, l);
  const name = (x: (typeof r)[number], l: Locale) => ((x.command['label'] as { uk: string; en: string } | undefined)?.[l] ?? '').toLowerCase();
  return {
    ...(water !== null ? { correct: 'diff' } : {}),
    why: msg('lever-balance-answer-why'),
    say: both((l) => (water !== null ? (t(l, 'lever-balance-answer-say', { water: g(water, l) })) : '—')),
    text: both((l) =>
      t(l, 'lever-balance-answer-text', { steps: r.map((x) => `${name(x, l)}: ${x.record.value !== null ? g(x.record.value, l) : '—'}`).map(stepLine).join(';') + STEPS_END, water: water !== null ? g(water, l) : '—' }),
    ),
  };
};

export const answer_liquid_density = (run: PresetRun): PresetAnswer => {
  const r = run.readings ?? [];
  const balance = (what: string, water: boolean) => r.find((x) => x.command.type === 'lab.balance' && x.command['what'] === what && !!x.command['substance'] === water)?.record;
  const empty = balance('vessel-empty', false)?.value ?? null;
  const filled = balance('vessel', true)?.value ?? null;
  const full = balance('vessel', false)?.value ?? null;
  // (Poured by measure: the volume is known, the same for both.)
  const V = balance('vessel', false)?.inputs?.['volume'] ?? null;
  const m = empty !== null && full !== null ? full - empty : null;
  const mWater = empty !== null && filled !== null ? filled - empty : null;
  const rho = m !== null && V ? m / V : null;
  const rhoWater = mWater !== null && V ? mWater / V : null;
  const correct = m === null || mWater === null ? undefined : m < mWater * 0.97 ? 'lighter' : m > mWater * 1.03 ? 'heavier' : 'same';
  // The liquid of this run, and its density in the tables.
  const liquid = SUBSTANCES[run.steps[0]!.params.substance];
  const table = liquid.liquid.density.value;
  const name = (l: Locale) => liquid.name[l];
  const g = (kg: number, l: Locale) => formatMeasured('mass', kg, 0.00001, l);
  const cmp = (l: Locale) => (correct === 'lighter' ? t(l, 'lever-balance-answer-liquid-density-cmp') : correct === 'heavier' ? t(l, 'lever-balance-answer-liquid-density-cmp-2') : t(l, 'lever-balance-answer-liquid-density-cmp-3'));
  return {
    ...(correct ? { correct } : {}),
    why: msg('lever-balance-answer-liquid-density-why'),
    say: both((l) => (rho !== null ? `ρ ≈ ${sig(rho, 3, l)} ${t(l, 'unit-sym-kg-per-m3')} — ${cmp(l)}!` : '—')),
    text: both((l) =>
      rho === null || rhoWater === null
        ? '—'
        : t(l, 'lever-balance-answer-liquid-density-text', { full: g(full!, l), filled: g(filled!, l), empty: g(empty!, l), m: g(m!, l), mWater: g(mWater!, l), V: sig(V! * 1e6, 3, l), rho: sig(rho / 1000, 3, l), rho2: sig(rho, 3, l), l: name(l).toLowerCase(), l2: cmp(l), WATER: sig(rhoWater, 3, l), table: sig(table, 3, l) }),
    ),
  };
};
