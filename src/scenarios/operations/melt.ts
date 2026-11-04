import { tr, type Locale } from '../../knowledge/i18n.js';
import { msg } from '../../knowledge/messages.js';
import { both, capital, K, lower, T } from './helpers.js';
import type { Operation } from './types.js';

export const MELT: Operation = {
  id: 'melt',
  label: msg('op-melt-label'),
  icon: 'melt',
  uses: 'either',
  direction: 'heating',
  speed: 600,
  solids: true,
  // A frozen liquid starts 10 °C below its melting point; a metal or salt — at room temperature.
  accepts: (sub) => sub.freezing !== undefined,
  startTemp: (sub) => (sub.melt ? 20 : sub.freezing ? Math.round(sub.freezing.point.value - 10) : 20),
  reached: (b, _p, sub) => (b.state.solidFraction ?? 0) <= 0 && sub.freezing !== undefined && b.state.temperature >= K(sub.freezing.point.value) - 1e-6,
  impossible({ p, sub, surroundingTemp, where }) {
    if (!sub.freezing) {
      return msg('op-melt-no-data', { name: (l: Locale) => tr(sub.name, l), lower: (l: Locale) => lower(sub, l) });
    }
    const tm = sub.freezing.point.value;
    if (p.heater || surroundingTemp > tm) return undefined;
    return msg('op-melt-not-warm', { where: (l: Locale) => where(l), Where: (l: Locale) => capital(where(l)), around: (l: Locale) => T(surroundingTemp, l), tm: (l: Locale) => T(tm, l) });
  },
  needs: ({ p, sub, surroundingTemp }) => (sub.freezing && !p.heater && surroundingTemp <= sub.freezing.point.value ? { heatAbove: sub.freezing.point.value } : undefined),
  paper: (_p, sub) => (sub.freezing ? { end: sub.freezing.point.value } : undefined),
  markers: ['freezing'],
  subjectIsSolid: true,
  verbs: {
    past: 'op-melt-past',
    future: msg('op-melt-verbs-future'),
    negative: msg('op-melt-verbs-negative'),
  },
  verbsMolten: {
    past: 'op-melt-past-molten',
    future: msg('op-melt-verbs-molten-future'),
    negative: msg('op-melt-verbs-molten-negative'),
  },
};
