import type { Locale } from '../../knowledge/i18n.js';
import { msg } from '../../knowledge/messages.js';
import { both, capital, K, T } from './helpers.js';
import type { Operation } from './types.js';

export const COOL_TO: Operation = {
  id: 'cool-to',
  label: msg('op-cool-to-cool-to-label'),
  icon: 'cool-down',
  uses: 'cooler',
  direction: 'cooling',
  target: { default: 5, min: -30, max: 300 },
  speed: 600,
  startTemp: () => 60,
  reached: (b, p) => p.target !== undefined && b.state.temperature <= K(p.target) + 1e-6,
  impossible({ p, surroundingTemp, where }) {
    if (p.target === undefined || p.target > surroundingTemp) return undefined;
    return msg('op-cool-to-below-room', { where: (l: Locale) => where(l), Where: (l: Locale) => capital(where(l)), around: (l: Locale) => T(surroundingTemp, l) });
  },
  needs: ({ p, surroundingTemp }) => (p.target !== undefined && p.target <= surroundingTemp ? { colderThan: p.target, target: { min: Math.floor(surroundingTemp) + 1 } } : undefined),
  markers: ['freezing', 'target'],
  verbs: {
    past: 'op-cool-to-past',
    future: msg('op-cool-to-cool-to-verbs-future'),
  },
};
