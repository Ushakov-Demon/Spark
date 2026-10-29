import type { CommandHandler } from '../core/commands.js';
import { err, ok } from '../core/result.js';
import type { MeasurementRecord } from '../core/trace.js';
import { cite, sv } from '../components/sourced.js';
import { COMPONENTS } from '../components/index.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import type { SourcedValue } from '../knowledge/types.js';

/**
 * Scales of one's own (grade 7, «конструювання: терез»): a 30 cm ruler hung by a thread at its middle, a yoghurt cup
 * on a thread at each end. The arms are equal, so the beam stays level when the masses in the cups are equal — any
 * body of known mass is a weight. Without a set of weights: a sheet of A4 office paper (80 g/m², 1/16 m²) is 5 g, and
 * 1 mL of water from a syringe is 1 g. First the empty cups are evened with a pinch of plasticine; then a folded sheet
 * against water from the syringe (5 mL — the scales agree with themselves); then an egg — sheets first, then water a
 * millilitre at a time, from larger to smaller, as with weights. The beam feels about half a gram (an estimate).
 */

/** A sheet of A4 (210 × 297 mm) of 80 g/m² office paper, kg. */
export const SHEET: SourcedValue = sv(0.210 * 0.297 * 0.080, 'kg', 'a sheet of A4, 80 g/m²', 'single-source', 0.03, [cite('papersizes-weights', 'A4, 80 gsm: 5 g (A0 = 1 m² by ISO 216; A4 = A0 halved four times)', '—', 0.005)], 'Paper of 80 g/m² varies by a few per cent.');
/** The egg: a medium one (the EU's class M is 53–63 g). */
export const EGG: SourcedValue = sv(0.0576, 'kg', 'a chicken egg, class M', 'estimate', 0.09, [cite('wikipedia-egg-sizes', 'EU: M — 53 g to under 63 g', '—', 0.058)], 'Estimate: an egg within class M; any other weighs its own.');
/** How much heavier one empty cup is than the other, kg (cups of one kind differ a little). */
export const CUPS_DIFFER: SourcedValue = sv(0.0014, 'kg', 'two yoghurt cups, the difference', 'estimate', 0.5, [cite('spark', 'estimate', 'cups of one kind differ by a gram or two', 0.0014)], 'Estimate: the plasticine evens out whatever it is.');
/** The least difference the beam visibly tilts at, kg (the thread's twist, the eye). */
export const SCALES_FEEL: SourcedValue = sv(0.0005, 'kg', 'home-made scales, the least difference seen', 'estimate', 0.5, [cite('spark', 'estimate', 'a ruler on a thread, by eye', 0.0005)], 'Estimate: it sets how close to level counts as level.');
/** The syringe: 1 mL a step. */
export const SYRINGE = 1e-6;
const water = () => COMPONENTS.water.phases.liquid!.density!.value;

/** The beam's tilt, degrees (+ — the left cup down): none within what it feels, then more with the difference. */
export function scalesTilt(left: number, right: number): number {
  const d = left - right;
  if (Math.abs(d) < SCALES_FEEL.value) return 0;
  return Math.sign(d) * Math.max(2.5, 14 * Math.tanh(Math.abs(d) / 0.004));
}

/** What lies in the cups. */
export interface ScalesLoad {
  readonly plasticine: boolean;
  readonly sheet: boolean;
  readonly egg: boolean;
  readonly sheets: number;
  /** Water in the right cup, mL. */
  readonly water: number;
}
/** The masses on the left and the right, kg (the right cup the heavier one, empty). */
export const scalesMasses = (l: ScalesLoad): { left: number; right: number } => ({
  left: (l.plasticine ? CUPS_DIFFER.value : 0) + (l.sheet ? SHEET.value : 0) + (l.egg ? EGG.value : 0),
  right: CUPS_DIFFER.value + l.sheets * SHEET.value + l.water * SYRINGE * water(),
});

/** How a step loads the cups, one addition after another (the last one levels the beam). */
export function scalesSequence(step: ScalesCommand['step']): ScalesLoad[] {
  const none: ScalesLoad = { plasticine: false, sheet: false, egg: false, sheets: 0, water: 0 };
  if (step === 'zero') return [none, { ...none, plasticine: true }];
  const from = { ...none, plasticine: true, ...(step === 'check' ? { sheet: true } : { egg: true }) };
  const out: ScalesLoad[] = [from];
  let s = from;
  // Sheets while the left is still heavier by a sheet; then water, a millilitre at a time, until level.
  if (step === 'egg') while (scalesMasses(s).left - scalesMasses(s).right >= SHEET.value) out.push((s = { ...s, sheets: s.sheets + 1 }));
  while (scalesTilt(scalesMasses(s).left, scalesMasses(s).right) > 0) out.push((s = { ...s, water: s.water + 1 }));
  return out;
}

/** A step: even the empty cups; a sheet against water; the egg. */
export interface ScalesCommand {
  readonly type: 'lab.scales';
  readonly step: 'zero' | 'check' | 'egg';
}

export const scalesCommand: CommandHandler<ScalesCommand> = {
  type: 'lab.scales',
  apply(state, c) {
    if (!(c.step === 'zero' || c.step === 'check' || c.step === 'egg')) return err({ uk: 'Такого кроку в досліді немає.', en: 'No such step in the experiment.' });
    const last = scalesSequence(c.step).at(-1)!;
    const { left, right } = scalesMasses(last);
    const inputs = { sheets: last.sheets, water: last.water, tilt: scalesTilt(left, right), exactLeft: left, exactRight: right };
    // The mass read off the weights: sheets at 5 g, water at 1 g a millilitre (the beam level); the empty cups — just level.
    const record: MeasurementRecord = c.step === 'zero'
      ? { kind: 'measurement', instrument: 'scales-diy', quantity: 'angle', value: 0, exact: scalesTilt(left, right), entities: [], inputs }
      : { kind: 'measurement', instrument: 'scales-diy', quantity: 'mass', value: (last.sheets * 5 + last.water) / 1000, exact: c.step === 'egg' ? EGG.value : SHEET.value, entities: [], inputs: { ...inputs, division: 0.001 } };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
  },
};

export const SCALES_COMMANDS = [scalesCommand] as const;

const STEP: Record<ScalesCommand['step'], { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  zero: {
    say: { uk: 'Терези готові: лінійка висить на нитці за середину, на кінцях — два стаканчики від йогурту. Але порожні стаканчики не врівноважені: один трохи важчий. Причепимо до легшого шматочок пластиліну — й відщипуватимемо, поки лінійка не стане рівно.', en: 'The scales are ready: a ruler hung by a thread at its middle, a yoghurt cup at each end. But the empty cups do not balance: one is a little heavier. We stick a bit of plasticine to the lighter one — and pinch it off until the ruler is level.' },
    button: { uk: '⚖ Зрівняти порожні стаканчики', en: '⚖ Even out the empty cups' },
    plan: { uk: 'зрівняти порожні стаканчики', en: 'even out the empty cups' },
  },
  check: {
    say: { uk: 'Перевіримо терези. Аркуш офісного паперу A4 (80 г на квадратний метр) важить 5 г — складемо його й покладемо в лівий стаканчик. А в правий наберемо шприцом води: 1 мл води — це 1 г. Скільки мілілітрів знадобиться?', en: 'We check the scales. A sheet of A4 office paper (80 g a square metre) weighs 5 g — we fold it and put it in the left cup. Into the right one we squirt water from a syringe: 1 mL of water is 1 g. How many millilitres will it take?' },
    button: { uk: '📄 Аркуш A4 проти води', en: '📄 A sheet of A4 against water' },
    plan: { uk: 'аркуш A4 проти води зі шприца', en: 'a sheet of A4 against water from a syringe' },
  },
  egg: {
    say: { uk: 'Тепер — куряче яйце. Як із гирями: спершу великі — аркуші по 5 г, поки яйце переважує; а тоді дрібні — воду зі шприца, по мілілітру, поки лінійка не стане рівно.', en: 'Now a hen’s egg. As with weights: the big ones first — sheets of 5 g while the egg outweighs them; then the small ones — water from the syringe, a millilitre at a time, until the ruler is level.' },
    button: { uk: '🥚 Зважити яйце', en: '🥚 Weigh the egg' },
    plan: { uk: 'зважити яйце аркушами й водою', en: 'weigh the egg with sheets and water' },
  },
};

export const SCALES_TEXT: Record<ScalesCommand['type'], (c: ScalesCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.scales': (x) => STEP[(x as ScalesCommand).step],
};
