import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { DRAG_MASS, DRAG_TEXT, dragBody, type DragCommand, dragShapeName, framesText } from './bench.js';
import { G } from '../../domains/mechanics/constants.js';

export const setup: LocalizedText = { uk: 'Акваріум з водою, на склі — дві позначки на відстані 20 см, 5 г пластиліну, лінійка, камера телефона (30 кадрів за секунду)', en: 'An aquarium of water with two marks 20 cm apart on the glass, 5 g of plasticine, a ruler, a phone camera (30 frames a second)' };

export const text = (c: DragCommand): StepText => DRAG_TEXT['lab.drag'](c);

export const busy = (): LocalizedText => ({ uk: 'Тіло тоне — телефон знімає…', en: 'The body sinks — the phone is filming…' });

export const shown = (_c: DragCommand, recs: readonly MeasurementRecord[], locale: Locale): string =>
  `${framesText(recs[0]?.inputs?.['frames'] ?? 0, locale === 'uk')} ≈ ${formatMeasured('time', recs[0]?.value ?? null, 0.01, locale)}`;

/** The frames between the marks, the time. */
export function say(c: DragCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const name = tr(dragShapeName(c.shape), locale);
  const f = framesText(recs[0]?.inputs?.['frames'] ?? 0, uk);
  const t = formatMeasured('time', recs[0]?.value ?? null, 0.01, locale);
  return uk ? `${name.charAt(0).toUpperCase()}${name.slice(1)} ${c.medium === 'air' ? 'в повітрі' : 'у воді'} ${c.shape === 'cube' ? 'пройшов' : 'пройшла'} між позначками за ${f} — ${t}.` : `${name.charAt(0).toUpperCase()}${name.slice(1)} ${c.medium === 'air' ? 'in the air' : 'in water'} went between the marks in ${f} — ${t}.`;
}

/** The board's lines for a done step. */
export function board(c: DragCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const frames = r.inputs?.['frames'] ?? 0;
  const fps = r.inputs?.['fps'] ?? 30;
  const track = r.inputs?.['track'] ?? 0.2;
  const shape = dragShapeName(c.shape)[uk ? 'uk' : 'en'];
  const air = c.medium === 'air';
  const t = formatMeasured('time', r.value, 0.01, locale);
  out.push({ id: `dt:${i}`, title: uk ? `${shape} ${air ? 'в повітрі' : 'у воді'}: ${framesText(frames, true)} між позначками` : `${shape} ${air ? 'in the air' : 'in water'}: ${framesText(frames, false)} between the marks`, formula: `t = ${frames} / ${fps} ${uk ? 'с' : 's'} ≈ ${t}` });
  out.push({ id: `dv:${i}`, title: uk ? 'швидкість між позначками' : 'the speed between the marks', formula: 'v = s / t', numbers: `${n(track, 2)} ${uk ? 'м' : 'm'} / ${t} ≈ ${n(track / r.value!, 2)} ${uk ? 'м/с' : 'm/s'}` });
  if (c.shape === 'ball' && !air) {
    const { volume } = dragBody('ball');
    const rho = r.inputs?.['rho'] ?? 1000;
    const P = DRAG_MASS * G;
    const Fa = rho * G * volume;
    out.push({ id: `df:${i}`, title: uk ? 'тіло йде рівномірно: сила опору = вага − архімедова сила' : 'the body goes steadily: the drag = the weight − the buoyant force', formula: uk ? 'F_оп = m·g − ρ_в·g·V' : 'F_d = m·g − ρ_w·g·V', numbers: `${n(P, 2)} − ${n(Fa, 2)} ≈ ${n(P - Fa, 2)} ${uk ? 'Н' : 'N'}` });
  }
  return out;
}
