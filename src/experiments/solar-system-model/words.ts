import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingsOf } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { PLANETS, PLANETS_TEXT, planetIds, SUN_RADIUS, type PlanetsCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'М’яч діаметром 20 см (Сонце), лінійка, рулетка, шкільний стадіон і довга вулиця; таблиця NASA з розмірами, відстанями й періодами планет', en: 'A 20 cm ball (the Sun), a ruler, a tape measure, a school field and a long street; NASA’s table of the planets’ sizes, distances and periods' };

export const text = (c: PlanetsCommand): StepText => PLANETS_TEXT['lab.planets'](c);

export const busy = (c: PlanetsCommand): LocalizedText =>
  c.step === 'kepler' ? { uk: 'Планети біжать по орбітах — дивимося…', en: 'The planets run round their orbits — watch…' } : c.step === 'voyager' ? { uk: 'Ідемо туди, де був «Вояджер-1»…', en: 'Walking out to where Voyager 1 was…' } : { uk: 'Відміряємо рулеткою — крок за кроком…', en: 'Measuring with the tape — step by step…' };


export function shown(c: PlanetsCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const ids = planetIds();
  const one = (x: number, d = 1) => new Intl.NumberFormat(uk ? 'uk-UA' : 'en-GB', { maximumFractionDigits: d }).format(x);
  const name = (r: MeasurementRecord) => tr(PLANETS[ids[r.inputs?.['planet'] ?? 0]!].name, locale);
  if (c.step === 'ball') return uk ? `м’яч — ${one((recs[0]?.value ?? 0) * 100)} см: масштаб 1 : ${one(1 / (recs[0]?.inputs?.['scale'] ?? 1) / 1e9)} млрд` : `the ball — ${one((recs[0]?.value ?? 0) * 100)} cm: the scale 1 : ${one(1 / (recs[0]?.inputs?.['scale'] ?? 1) / 1e9)} bn`;
  const two = (x: number) => new Intl.NumberFormat(uk ? 'uk-UA' : 'en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(x);
  if (c.step === 'kepler') return `T²/a³: ${recs.map((r) => `${name(r)} ${two(r.value ?? 0)}`).join(', ')}`;
  if (c.step === 'voyager') return uk ? `до «Вояджера-1» — ${one(recs[0]?.value ?? 0, 0)} м. Обертаємося…` : `to Voyager 1 — ${one(recs[0]?.value ?? 0, 0)} m. We turn round…`;
  return recs.map((r) => `${name(r)} — ${one(r.value ?? 0)} ${uk ? 'м' : 'm'}, ${one((r.inputs?.['size'] ?? 0) * 1000)} ${uk ? 'мм' : 'mm'}`).join('; ');
}

/** The board's lines for a done step. */
export function board(c: PlanetsCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  void before;
  const recs = trace;
  const ids = planetIds();
  const nm = (k: number) => tr(PLANETS[ids[k]!]!.name, locale);
  const m = uk ? 'м' : 'm';
  const mm = (x: number) => `${n(x * 1000, 2)} ${uk ? 'мм' : 'mm'}`;
  const step = c.step;
  if (step === 'ball') {
    const scale = recs[0]?.inputs?.['scale'] ?? 1;
    out.push({ id: `pb:${i}`, title: uk ? `м’яч-Сонце: d = ${n(recs[0]!.value! * 100, 3)} см — масштаб моделі` : `the Sun-ball: d = ${n(recs[0]!.value! * 100, 3)} cm — the model's scale`, formula: 'k = d / D☉', numbers: `${n(recs[0]!.value!, 2)} ${m} / ${n(2 * SUN_RADIUS.value, 7)} ${uk ? 'км' : 'km'} ≈ 1 : ${n(1 / scale / 1e9, 2)} ${uk ? 'млрд' : 'bn'}` });
  } else if (step === 'inner' || step === 'outer') {
    // (One planet a step on the board — the Earth, Neptune; all of them are in the protocol.)
    const key = recs.find((x) => ids[x.inputs?.['planet'] ?? -1] === (step === 'inner' ? 'earth' : 'neptune'));
    if (key) out.push({ id: `${step === 'inner' ? 'pe' : 'po'}:${i}`, title: uk ? `${nm(key.inputs?.['planet'] ?? 0)}: відстань від м’яча й діаметр` : `${nm(key.inputs?.['planet'] ?? 0)}: distance from the ball and diameter`, formula: 'L = k·a, d = k·D', numbers: `${n(key.value!, 3)} ${m}; ${mm(key.inputs?.['size'] ?? 0)}` });
  } else if (step === 'kepler') {
    const v = recs.map((x) => x.value!);
    const f2 = (x: number) => new Intl.NumberFormat(uk ? 'uk-UA' : 'en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(x);
    out.push({ id: `pk:${i}`, title: uk ? 'T²/a³ у роках і відстанях Землі — для всіх восьми планет' : 'T²/a³ in the Earth’s years and distances — for all eight planets', formula: 'T² / a³ ≈ 1', numbers: `${f2(Math.min(...v))} … ${f2(Math.max(...v))}` });
  } else if (step === 'voyager') {
    out.push({ id: `pv:${i}`, title: uk ? '«Вояджер-1», 14.02.1990: у 40,5 раза далі, ніж Земля від Сонця' : 'Voyager 1, 14.02.1990: 40.5 times further than the Earth from the Sun', formula: 'L = k · 40,5 · a⊕'.replace(',', uk ? ',' : '.'), numbers: `≈ ${n(recs[0]!.value!, 3)} ${m}; ${uk ? 'Земля звідти — крупинка' : 'the Earth from there — a grain of'} ${mm(recs[0]!.inputs?.['earth'] ?? 0)}` });
  }
  return out;
}
