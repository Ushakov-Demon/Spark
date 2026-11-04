import { bodyMass } from '../../domains/thermal/entities.js';
import { formatQuantity } from '../../explain/format.js';
import { msg, t } from '../../knowledge/messages.js';
import { both, capital } from './helpers.js';
import { tr, type Locale } from '../../knowledge/i18n.js';
import type { Operation } from './types.js';

export const EVAPORATE: Operation = {
  id: 'evaporate',
  label: msg('op-evaporate-label'),
  icon: 'evaporate',
  uses: 'heater',
  direction: 'heating',
  speed: 60,
  accepts: (sub) => sub.boiling !== undefined,
  startTemp: () => 20,
  // Boiled dry: no water left (a salt solution leaves its salt behind).
  reached: (b) => (b.state.mixture ? b.state.mixture.water <= 1e-6 : bodyMass(b) <= 1e-6),
  impossible({ sub }) {
    if (sub.boiling) return undefined;
    return msg('op-evaporate-does-not-boil', { name: (l: Locale) => tr(sub.name, l), Name: (l: Locale) => capital(tr(sub.name, l)) });
  },
  paper: (_p, sub, mass) =>
    sub.boiling ? { end: sub.boiling.point.value, extra: mass * (1 - (sub.mixture?.saltFraction ?? 0)) * sub.boiling.latentHeat.value } : undefined,
  massIsProgress: true,
  markers: ['freezing', 'boiling'],
  verbs: {
    past: 'op-evaporate-past',
    future: msg('op-evaporate-verbs-future'),
  },
  reachedNotes({ sample: b, locale }) {
    const crystals = b.state.mixture?.crystals ?? 0;
    if (!(crystals > 0)) return [];
    const g = formatQuantity(crystals, 'kg', { locale, level: 'school' });
    return [
      t(locale, 'op-evaporate-reached-notes', { g }),
    ];
  },
};
