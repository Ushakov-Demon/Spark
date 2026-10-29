import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { cite, sv } from '../../components/sourced.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import type { SourcedValue } from '../../knowledge/types.js';

/**
 * The method of rows (grade 7, the introduction): a pea, a millet grain, a thread are smaller than a ruler can
 * measure well — a single one is read to a millimetre at best. So many of them are laid in a row (pressed
 * together between two toothpicks), or the thread is wound turn to turn on a rod, and the whole row is measured:
 * d = L / N. The ruler's half-division error is shared among N, and so is the scatter of the bodies' sizes.
 */

/** The bodies: their mean size (a pea and a grain — the geometric mean of length, width and thickness). */
export const ROW_BODIES: Readonly<Record<RowBody, SourcedValue>> = {
  pea: sv(0.00652, 'm', 'a dry pea, (7.80 × 6.41 × 5.55)^(1/3) mm', 'single-source', 0.1, [cite('yalcin-2007-pea', 'length 7.80, width 6.41, thickness 5.55 mm at 10.06 % moisture', '—', 0.00652)], 'The geometric mean of the three sizes; cultivars differ.'),
  millet: sv(0.00217, 'm', 'a proso millet grain, geometric mean diameter', 'single-source', 0.05, [cite('singh-2018-proso-millet', 'geometric mean diameter 2.07–2.27 mm', '—', 0.00217)], 'The middle of the range measured.'),
  thread: sv(0.0004, 'm', 'a № 10 cotton thread', 'estimate', 0.3, [cite('spark', 'estimate', 'a thick sewing thread is a few tenths of a millimetre across', 0.0004)], 'Estimate: threads of one number differ; the method measures whatever it is.'),
};
/** How much the bodies of one batch differ: a few per cent (none for the turns of one thread). */
export const ROW_SCATTER: SourcedValue = sv(0.06, '', 'seeds of one batch, relative spread', 'estimate', 0.5, [cite('spark', 'estimate', 'seeds of one bag differ by several per cent', 0.06)], 'Estimate.');
/** The ruler: millimetre divisions. */
export const ROW_DIVISION = 0.001;

export type RowBody = 'pea' | 'millet' | 'thread';

/** Lay so many bodies in a row (wind so many turns) and measure the row with the ruler. */
export interface RowsCommand {
  readonly type: 'lab.rows';
  readonly body: RowBody;
  readonly count: number;
}

/** The sizes of the bodies in the row, one by one: the same batch every time (a fixed sequence, not random). */
export function rowSizes(body: RowBody, count: number): number[] {
  const mean = ROW_BODIES[body].value;
  if (body === 'thread') return Array.from({ length: count }, () => mean);
  let x = body === 'pea' ? 7 : 13;
  return Array.from({ length: count }, () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return mean * (1 + ROW_SCATTER.value * (2 * (x / 2147483648) - 1));
  });
}

export const rowsCommand: CommandHandler<RowsCommand> = {
  type: 'lab.rows',
  apply(state, c) {
    if (!(Number.isInteger(c.count) && c.count >= 1 && c.count <= 60)) return err({ uk: 'У ряд — від 1 до 60.', en: 'In a row: 1 to 60.' });
    const sizes = rowSizes(c.body, c.count);
    const L = sizes.reduce((a, x) => a + x, 0);
    const value = Math.round(L / ROW_DIVISION) * ROW_DIVISION;
    const record: MeasurementRecord = { kind: 'measurement', instrument: 'ruler', quantity: 'length', value, exact: L, entities: [], inputs: { count: c.count, mean: L / c.count, division: ROW_DIVISION } };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
  },
};

export const ROWS_COMMANDS = [rowsCommand] as const;

const NAME: Record<RowBody, { one: LocalizedText; many: (n: number) => LocalizedText }> = {
  pea: { one: { uk: 'горошину', en: 'a pea' }, many: (n) => ({ uk: `${n} горошин`, en: `${n} peas` }) },
  millet: { one: { uk: 'пшоняне зернятко', en: 'a millet grain' }, many: (n) => ({ uk: `${n} зерняток пшона`, en: `${n} millet grains` }) },
  thread: { one: { uk: 'нитку', en: 'the thread' }, many: (n) => ({ uk: `${n} витків нитки`, en: `${n} turns of thread` }) },
};
export const rowName = (b: RowBody, n: number): LocalizedText => (n === 1 ? NAME[b].one : NAME[b].many(n));

export const ROWS_TEXT: Record<RowsCommand['type'], (c: RowsCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.rows': (x) => {
    const c = x as RowsCommand;
    const what = rowName(c.body, c.count);
    if (c.count === 1)
      return {
        say: { uk: `Приклади лінійку до однієї горошини. Скільки міліметрів?`, en: `Put the ruler to a single pea. How many millimetres?` },
        button: { uk: '📏 Одна горошина', en: '📏 One pea' },
        plan: { uk: 'виміряти одну горошину', en: 'measure one pea' },
      };
    if (c.body === 'thread')
      return {
        say: { uk: `Намотай на стрижень ${what.uk} — щільно, виток до витка, — і виміряй ширину намотки.`, en: `Wind ${what.en} on the rod — tightly, turn to turn — and measure the width of the winding.` },
        button: { uk: `🧵 ${what.uk} на стрижні`, en: `🧵 ${what.en} on the rod` },
        plan: { uk: `намотати ${what.uk} і виміряти`, en: `wind ${what.en} and measure` },
      };
    return {
      say: { uk: `Виклади вздовж лінійки ${what.uk} впритул, притисни ряд зубочистками й виміряй його довжину.`, en: `Lay ${what.en} along the ruler close together, press the row with the toothpicks and measure its length.` },
      button: { uk: `📏 Ряд: ${what.uk}`, en: `📏 A row: ${what.en}` },
      plan: { uk: `виміряти ряд: ${what.uk}`, en: `measure a row: ${what.en}` },
    };
  },
};
