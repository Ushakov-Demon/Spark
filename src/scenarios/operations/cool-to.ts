import { both, capital, K, T } from './helpers.js';
import type { Operation } from './types.js';

export const COOL_TO: Operation = {
  id: 'cool-to',
  label: { uk: 'Охолодити до…', en: 'Cool to…' },
  uses: 'cooler',
  direction: 'cooling',
  target: { default: 5, min: -30, max: 300 },
  speed: 600,
  startTemp: () => 60,
  reached: (b, p) => p.target !== undefined && b.state.temperature <= K(p.target) + 1e-6,
  impossible({ p, surroundingTemp, where }) {
    if (p.target === undefined || p.target > surroundingTemp) return undefined;
    return both((l) =>
      l === 'uk'
        ? `${capital(where(l))} ${T(surroundingTemp, l)}: тіло не може охолонути нижче за температуру того, що його оточує.`
        : `It is ${T(surroundingTemp, l)} ${where(l)}: a body cannot cool below the temperature of its surroundings.`,
    );
  },
  needs: ({ p, surroundingTemp }) => (p.target !== undefined && p.target <= surroundingTemp ? { colderThan: p.target, target: { min: Math.floor(surroundingTemp) + 1 } } : undefined),
  markers: ['freezing', 'target'],
  verbs: {
    past: { uk: { f: 'охолола до', m: 'охолов до', n: 'охололо до' }, en: 'cooled down to' },
    future: { uk: 'охолоне до', en: 'cool down to' },
  },
};
