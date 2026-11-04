import type { Locale } from '../../knowledge/i18n.js';
import { msg } from '../../knowledge/messages.js';
import { both, K, lower, T } from './helpers.js';
import type { Operation } from './types.js';

export const HEAT_TO: Operation = {
  id: 'heat-to',
  label: msg('op-heat-to-heat-to-label'),
  icon: 'heat-up',
  uses: 'heater',
  direction: 'heating',
  target: { default: 60, min: -30, max: 300 },
  thermostat: true,
  solids: true,
  speed: 60,
  startTemp: () => 20,
  // A liquid must be all liquid (ice at 0 °C is not "heated to 0 °C" yet); a solid heated below its melting point stays solid.
  reached: (b, p, sub) => p.target !== undefined && b.state.temperature >= K(p.target) - 1e-6 && ((b.state.solidFraction ?? 0) === 0 || (sub.melt !== undefined && p.target < sub.melt.point.value)),
  impossible({ p, sub }) {
    const tb = sub.boiling?.point.value;
    if (p.target === undefined || tb === undefined || p.target <= tb) return undefined;
    return msg('op-heat-to-boils-first', { lower: (l: Locale) => lower(sub, l), tb: (l: Locale) => T(tb, l), gender: sub.gender });
  },
  needs({ p, sub }) {
    const tb = sub.boiling?.point.value;
    return p.target !== undefined && tb !== undefined && p.target > tb ? { target: { max: Math.floor(tb) } } : undefined;
  },
  paper: (p) => (p.target === undefined ? undefined : { end: p.target }),
  markers: ['freezing', 'boiling', 'target'],
  verbs: {
    past: 'op-heat-to-past',
    future: msg('op-heat-to-heat-to-verbs-future'),
  },
};
