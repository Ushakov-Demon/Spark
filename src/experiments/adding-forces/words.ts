import type { MeasurementRecord } from '../../core/trace.js';
import { type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { FORCES_TEXT, type ForcesCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Штатив, два динамометри (до 5 Н), дерев’яна лінійка, два тягарці по 100 г', en: 'A stand, two dynamometers (up to 5 N), a wooden ruler, two 100 g weights' };

export const text = (c: ForcesCommand): StepText => FORCES_TEXT['lab.forces'](c);

export const busy = (): LocalizedText => ({ uk: 'Пружини ще коливаються — чекаємо, поки заспокояться…', en: 'The springs are still bouncing — wait until they settle…' });

export const shown = (_c: ForcesCommand, recs: readonly MeasurementRecord[], locale: Locale): string => recs.map((x) => formatMeasured('force', x.value, 0.1, locale)).join(' · ');

/** What the dynamometers show — one, both, or up and down. */
export function say(c: ForcesCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const fs = recs.map((x) => formatMeasured('force', x.value, 0.1, locale));
  if (c.hold === 'one') return uk ? `Один динамометр показує ${fs[0]}.` : `One dynamometer shows ${fs[0]}.`;
  if (c.hold === 'two') return uk ? `Лівий показує ${fs[0]}, правий — ${fs[1]}.` : `The left one shows ${fs[0]}, the right one ${fs[1]}.`;
  return uk ? `Верхній показує ${fs[0]}, нижній тягне вниз із силою ${fs[1]}.` : `The upper one shows ${fs[0]}; the lower one pulls down with ${fs[1]}.`;
}

/** The board's lines for a done step. */
export function board(c: ForcesCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const out: BoardLine[] = [];
  const recs = trace.filter((x): x is MeasurementRecord => x.kind === 'measurement' && x.quantity === 'force' && x.value !== null);
  const F = (x: MeasurementRecord | undefined) => formatMeasured('force', x?.value ?? 0, 0.1, locale);
  const [a, b] = recs;
  if (!a) return out;
  if (c.hold === 'one') {
    out.push({ id: `fw:${i}`, title: uk ? 'вантаж на одному динамометрі' : 'the load on one dynamometer', formula: `F = ${F(a)}` });
    return out;
  }
  if (!b) return out;
  if (c.hold === 'two') {
    const at = Math.round(Number(c.at) * 100);
    out.push({ id: `ft:${i}`, title: uk ? `два динамометри, тягарці на ${at} см` : `two dynamometers, the weights at ${at} cm`, formula: `F₁ = ${F(a)}; F₂ = ${F(b)}` });
    out.push({ id: `rs:${i}`, title: uk ? 'рівнодійна: обидві сили вгору' : 'the resultant: both forces up', formula: 'R = F₁ + F₂', numbers: `${F(a)} + ${F(b)} = ${formatMeasured('force', a.value! + b.value!, 0.1, locale)}` });
    return out;
  }
  out.push({ id: `fd:${i}`, title: uk ? 'один тягне вгору, другий униз' : 'one pulls up, the other down', formula: `F₁ = ${F(a)} ↑; F₂ = ${F(b)} ↓` });
  out.push({ id: `rs:${i}`, title: uk ? 'рівнодійна: сили протилежні' : 'the resultant: opposite forces', formula: 'R = F₁ − F₂', numbers: `${F(a)} − ${F(b)} = ${formatMeasured('force', a.value! - b.value!, 0.1, locale)}` });
  return out;
}
