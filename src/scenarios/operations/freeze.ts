import { solutionEutectic } from '../../domains/thermal/mixture.js';
import { tr, type Locale } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import { both, capital, lower, T } from './helpers.js';
import type { Operation } from './types.js';

export const FREEZE: Operation = {
  id: 'freeze',
  label: msg('op-freeze-label'),
  icon: 'freeze',
  uses: 'cooler',
  direction: 'cooling',
  speed: 600,
  // A melt sets too (tin, stearic acid): a solid that was melted can be the sample.
  solids: true,
  accepts: (sub) => sub.freezing !== undefined,
  startTemp: () => 20,
  reached: (b) => (b.state.solidFraction ?? 0) >= 1,
  impossible({ sub, surroundingTemp, where }) {
    if (!sub.freezing) {
      return msg('op-freeze-no-data', { name: (l: Locale) => tr(sub.name, l), lower: (l: Locale) => lower(sub, l) });
    }
    const tf = sub.freezing.point.value;
    // A solution freezes gradually: completely only below the eutectic.
    const te = sub.mixture ? solutionEutectic(sub.mixture.saltFraction) : -Infinity;
    if (sub.mixture && surroundingTemp >= te && surroundingTemp < tf) {
      return msg('op-freeze-brine', { where: (l: Locale) => where(l), Where: (l: Locale) => capital(where(l)), around: (l: Locale) => T(surroundingTemp, l), eutectic: (l: Locale) => T(te, l) });
    }
    if (surroundingTemp < tf) return undefined;
    return msg('op-freeze-not-cold', { where: (l: Locale) => where(l), Where: (l: Locale) => capital(where(l)), around: (l: Locale) => T(surroundingTemp, l), name: (l: Locale) => tr(sub.name, l), lower: (l: Locale) => lower(sub, l), tf: (l: Locale) => T(tf, l) });
  },
  needs({ sub, surroundingTemp }) {
    if (!sub.freezing) return undefined;
    // A solution freezes completely only below the eutectic; pure substances below their freezing point.
    const below = sub.mixture ? solutionEutectic(sub.mixture.saltFraction) : sub.freezing.point.value;
    return surroundingTemp >= below ? { colderThan: below } : undefined;
  },
  markers: ['freezing'],
  verbs: {
    past: 'op-freeze-past',
    future: msg('op-freeze-verbs-future'),
    negative: msg('op-freeze-verbs-negative'),
  },
  // A melt (tin, stearic acid) sets — it does not "freeze".
  verbsMolten: {
    past: 'op-freeze-past-molten',
    future: msg('op-freeze-verbs-molten-future'),
    negative: msg('op-freeze-verbs-molten-negative'),
  },
  // Brine above the eutectic: part of it freezes, a salty pocket stays liquid.
  impossibleHeadline(b, subject, locale) {
    const s = b.state.solidFraction ?? 0;
    if (!b.state.mixture || !(s > 0)) return undefined;
    const part = Math.round(s * 100);
    return t(locale, 'op-freeze-impossible-headline', { subject, part: String(part) });
  },
  heatGivenNote: msg('op-freeze-heat-given-note'),
  heatGivenNoteMolten: msg('op-freeze-heat-given-note-molten'),
};
