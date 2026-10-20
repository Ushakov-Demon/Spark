import { mixtureBoilingPoint } from '../../domains/thermal/mixture.js';
import { K } from './helpers.js';
import type { Operation } from './types.js';

export const BOIL: Operation = {
  id: 'boil',
  label: { uk: 'Закип’ятити', en: 'Boil' },
  icon: 'boil',
  uses: 'heater',
  direction: 'heating',
  speed: 60,
  // Boils — or, like oil, heats up until it smokes (the lab explains that it does not boil).
  accepts: (sub) => sub.boiling !== undefined || sub.decomposes !== undefined,
  startTemp: () => 20,
  reached(b, _p, sub) {
    const T = b.state.temperature;
    const solid = b.state.solidFraction ?? 0;
    // A salt solution boils at its own, composition-dependent temperature.
    const mix = b.state.mixture;
    const tb = mix ? mixtureBoilingPoint(mix) : sub.boiling ? K(sub.boiling.point.value) : undefined;
    // Boiling = bubbles in the whole volume (mass boils away), not just reaching the number:
    // surface evaporation can keep the liquid a hair below the boiling point while it boils.
    if (tb !== undefined) return ((b.state.boiledOff ?? 0) > 0 || T >= tb - 1e-6) && solid === 0;
    // Does not boil (oil): the run ends when it starts to smoke.
    return sub.decomposes !== undefined && T >= K(sub.decomposes.value);
  },
  endsInstead: (sub) => (sub.boiling ? undefined : 'decomposes'),
  paper: (_p, sub) => {
    const end = sub.boiling?.point.value ?? sub.decomposes?.value;
    return end === undefined ? undefined : { end };
  },
  markers: ['freezing', 'boiling', 'smoke'],
  verbs: {
    past: { uk: { f: 'закипіла', m: 'закипів', n: 'закипіло' }, en: 'boiled' },
    future: { uk: 'закипить', en: 'boil' },
  },
};
