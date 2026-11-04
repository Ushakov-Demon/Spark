import { NUMBER_LOCALE, type Locale } from '../../knowledge/i18n.js';
import { msg, NO_TEXT, t } from '../../knowledge/messages.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { STEPS_END, stepLine } from '../../scenarios/preset-kit.js';
import { cm2, sideText } from './words.js';

export const answer_leaf_area = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.area' && x.record.value !== null);
  const card = R.filter((x) => x.command['step'] === 'card').map((x) => x.record.value!);
  const palettes = R.filter((x) => x.command['step'] === 'palette').map((x) => ({ side: Number(x.command['side']), S: x.record.value!, exact: x.record.exact, whole: x.record.inputs?.['whole'] ?? 0, cut: x.record.inputs?.['cut'] ?? 0, division: x.record.inputs?.['division'] ?? 1e-4 }));
  const [p1, p2] = palettes;
  // The finer palette against the coarser: which came closer to the leaf's area (equal squares — the same palette).
  const fine = p1 && p2 ? (p1.side <= p2.side ? p1 : p2) : undefined;
  const coarse = fine === p1 ? p2 : p1;
  const off = (p: { S: number; exact: number }) => Math.abs(p.S - p.exact);
  const correct = !fine || !coarse ? undefined : fine.side === coarse.side || Math.abs(off(fine) - off(coarse)) < 1e-12 ? 'same' : off(fine) < off(coarse) ? 'fine' : 'coarse';
  const exact = p1?.exact ?? 0;
  const pct = (p: { S: number; exact: number }, l: Locale) => `${new Intl.NumberFormat(NUMBER_LOCALE[l], { maximumFractionDigits: 1 }).format((Math.abs(p.S - p.exact) / p.exact) * 100)} %`;
  const cardText = (l: Locale) => (card.length === 2 ? t(l, 'leaf-area-row-card', { a: formatMeasured('length', card[0]!, 0.001, l), b: formatMeasured('length', card[1]!, 0.001, l), S: cm2(card[0]! * card[1]!, l) }) : '');
  return {
    ...(correct ? { correct } : {}),
    why: msg('leaf-area-why'),
    say: fine && coarse ? msg('leaf-area-say', { exact: (l) => cm2(exact, l), closer: correct ?? 'same', fine: (l) => sideText(fine.side, l), coarse: (l) => sideText(coarse.side, l) }) : NO_TEXT,
    text: palettes.length
      ? msg('leaf-area-text', {
          rows: (l) => [cardText(l), ...palettes.map((p) => t(l, 'leaf-area-row-palette', { side: sideText(p.side, l), whole: p.whole, cut: p.cut, S: formatMeasured('area', p.S, p.division, l), off: pct(p, l) }))].filter(Boolean).map(stepLine).join(';') + STEPS_END,
          exact: (l) => cm2(exact, l, 4),
        })
      : NO_TEXT,
  };
};
