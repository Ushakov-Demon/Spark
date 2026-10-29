import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingsOf } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { SCALES_TEXT, type ScalesCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Лінійка 30 см, нитка, два стаканчики від йогурту, пластилін, аркуші офісного паперу A4 (80 г/м²), шприц на 10 мл і склянка води, куряче яйце', en: 'A 30 cm ruler, thread, two yoghurt cups, plasticine, sheets of A4 office paper (80 g/m²), a 10 mL syringe and a glass of water, a hen’s egg' };

export const text = (c: ScalesCommand): StepText => SCALES_TEXT['lab.scales'](c);

export const busy = (): LocalizedText => ({ uk: 'Кладу по одному — дивимося на лінійку…', en: 'Adding one at a time — watching the ruler…' });


export function shown(c: ScalesCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const r = recs[0];
  const V = r?.inputs?.['water'] ?? 0;
  const N = r?.inputs?.['sheets'] ?? 0;
  const m = formatMeasured('mass', r?.value ?? null, 0.001, locale);
  if (c.step === 'zero') return uk ? 'лінійка стоїть рівно: стаканчики врівноважено' : 'the ruler is level: the cups balance';
  if (c.step === 'check') return uk ? `рівно при ${V} мл води: аркуш — ${m}` : `level at ${V} mL of water: the sheet — ${m}`;
  return uk ? `рівно при ${N} аркушах і ${V} мл води: яйце — ${m}` : `level at ${N} sheets and ${V} mL of water: the egg — ${m}`;
}

/** The board's lines for a done step. */
export function board(c: ScalesCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const e = { trace };
  void before;
  const r = e.trace.find((x): x is MeasurementRecord => x.kind === 'measurement' && x.value !== null);
  const step = c.step;
  if (!r || step === 'zero') return out;
  const N = r.inputs?.['sheets'] ?? 0;
  const V = r.inputs?.['water'] ?? 0;
  const g = (x: number) => `${n(x, 3)} ${uk ? 'г' : 'g'}`;
  if (step === 'check') out.push({ id: `sc:${i}`, title: uk ? 'аркуш A4 = вода зі шприца' : 'a sheet of A4 = water from the syringe', formula: uk ? 'm = V·1 г/мл' : 'm = V·1 g/mL', numbers: `${V} ${uk ? 'мл' : 'mL'} → ${g(V)}` });
  else out.push({ id: `sg:${i}`, title: uk ? 'яйце: аркуші по 5 г і вода' : 'the egg: sheets of 5 g and water', formula: 'm = N·5 + V', numbers: `${N}·5 + ${V} = ${g(N * 5 + V)}` });
  return out;
}
