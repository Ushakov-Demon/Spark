import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both } from '../../scenarios/preset-kit.js';
import type { Locale } from '../../knowledge/i18n.js';
import { sig } from '../../explain/format.js';

export const answer_diode_black_box = (run: PresetRun): PresetAnswer => {
  const rows = (run.readings ?? []).filter((x) => x.command.type === 'lab.box' && x.record.value !== null).map((x) => ({ U: Number(x.command['source']), back: !!x.command['reversed'], I: x.record.value!, div: x.record.inputs?.['division'] ?? 0.0001 }));
  const there = rows.filter((x) => !x.back);
  const back = rows.filter((x) => x.back);
  // Lets the current through only one way: some current one way, none (below a division) the other — a diode.
  const flows = (list: typeof rows) => list.length > 0 && list.some((x) => x.I >= x.div);
  const oneWay = flows(there) !== flows(back);
  const twoWays = flows(there) && flows(back);
  const correct = !rows.length ? undefined : oneWay ? 'diode' : twoWays ? 'resistor' : 'open';
  const mA = (x: number, l: Locale) => `${(x * 1000).toFixed(1).replace('.', t(l, 'diode-black-box-volts'))} ${t(l, 'unit-sym-mA')}`;
  const Om = (x: number, l: Locale) => `${sig(x, 2, l)} ${t(l, 'unit-sym-ohm')}`;
  // How much more current at the highest voltage than at the lowest, the way it flows (a resistor: as much as the voltage).
  const fwd = (flows(there) ? there : back).filter((x) => x.I >= x.div);
  const lo = fwd[0];
  const hi = fwd[fwd.length - 1];
  const ratio = lo && hi && lo !== hi ? hi.I / lo.I : 0;
  const times = lo && hi && lo !== hi ? hi.U / lo.U : 0;
  const list = (xs: typeof rows, l: Locale) => xs.map((x) => `${x.U} ${t(l, 'unit-sym-V')} — ${mA(x.I, l)}${x.I >= x.div ? ` (R ≈ ${Om(x.U / x.I, l)})` : ''}`).join(', ');
  return {
    ...(correct ? { correct } : {}),
    why: msg('diode-black-box-answer-why'),
    say: both((l) => (correct === 'diode' ? t(l, 'diode-black-box-answer-say') : t(l, 'diode-black-box-answer-say-2'))),
    text: both((l) =>
      t(l, 'diode-black-box-answer-text', { there: list(there, l), back: list(back, l), U: String(hi?.U ?? 0), times: sig(times, 2, l), ratio: sig(ratio, 2, l), U2: String(lo?.U ?? 0) }),
    ),
  };
};
