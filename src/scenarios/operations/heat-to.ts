import { both, K, lower, pronounUk, T } from './helpers.js';
import type { Operation } from './types.js';

export const HEAT_TO: Operation = {
  id: 'heat-to',
  label: { uk: 'Нагріти до…', en: 'Heat to…' },
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
    return both((l) =>
      l === 'uk'
        ? `У відкритому посуді ${lower(sub, l)} не нагріється вище ${T(tb, l)}: при цій температурі ${pronounUk(sub)} кипить, і вся теплота йде на пароутворення.`
        : `In an open vessel ${lower(sub, l)} will not get hotter than ${T(tb, l)}: at that temperature it boils and all the heat goes into vaporisation.`,
    );
  },
  needs({ p, sub }) {
    const tb = sub.boiling?.point.value;
    return p.target !== undefined && tb !== undefined && p.target > tb ? { target: { max: Math.floor(tb) } } : undefined;
  },
  paper: (p) => (p.target === undefined ? undefined : { end: p.target }),
  markers: ['freezing', 'boiling', 'target'],
  verbs: {
    past: { uk: { f: 'нагрілася до', m: 'нагрівся до', n: 'нагрілося до' }, en: 'heated up to' },
    future: { uk: 'нагріється до', en: 'heat up to' },
  },
};
