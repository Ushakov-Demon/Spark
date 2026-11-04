import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';

const N = (n: number, l: Locale) => formatMeasured('force', n, 0.1, l);

export const answer_adding_forces = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.forces' && x.record.value !== null);
  const of = (hold: string, at?: number) => R.filter((x) => x.command['hold'] === hold && (at === undefined || Math.abs(Number(x.command['at']) - at) < 1e-6)).map((x) => x.record.value!);
  const [one] = of('one');
  const twos = [...new Set(R.filter((x) => x.command['hold'] === 'two').map((x) => Number(x.command['at'])))].map((at) => ({ at, f: of('two', at) }));
  const down = of('down');
  const round = (x: number) => Math.round(x * 10) / 10;
  const sums = [...twos.map((x) => round((x.f[0] ?? 0) + (x.f[1] ?? 0))), ...(down.length === 2 ? [round(down[0]! - down[1]!)] : [])];
  const same = one !== undefined && sums.length > 0 && sums.every((x) => Math.abs(x - one) < 0.15);
  return {
    ...(same ? { correct: 'same' } : {}),
    why: msg('adding-forces-answer-why'),
    say: both((l) => (one !== undefined ? (t(l, 'adding-forces-answer-say', { sums: N(sums[0] ?? one, l) })) : '')),
    text: both((l) => {
      const parts = [
        ...(one !== undefined ? [t(l, 'adding-forces-text-parts', { one: N(one, l) })] : []),
        ...twos.map((x) =>
          t(l, 'adding-forces-text-parts-2', { at: String(Math.round(x.at * 100)), f: N(x.f[0] ?? 0, l), f2: N(x.f[1] ?? 0, l), f3: N(round((x.f[0] ?? 0) + (x.f[1] ?? 0)), l) }),
        ),
        ...(down.length === 2 ? [t(l, 'adding-forces-text-parts-3', { down: N(down[0]!, l), down2: N(down[1]!, l), down3: N(round(down[0]! - down[1]!), l) })] : []),
      ];
      const tail = same
        ? t(l, 'adding-forces-text-tail')
        : t(l, 'adding-forces-text-tail-2');
      return `${parts.map(stepLine).join(';') + STEPS_END}.${tail}`;
    }),
  };
};
