import { bodyMass } from '../../domains/thermal/entities.js';
import { formatQuantity } from '../../explain/format.js';
import { both, capital } from './helpers.js';
import { tr } from '../../knowledge/i18n.js';
import type { Operation } from './types.js';

export const EVAPORATE: Operation = {
  id: 'evaporate',
  label: { uk: 'Випарити досуха', en: 'Boil dry' },
  icon: 'evaporate',
  uses: 'heater',
  direction: 'heating',
  speed: 60,
  startTemp: () => 20,
  // Boiled dry: no water left (a salt solution leaves its salt behind).
  reached: (b) => (b.state.mixture ? b.state.mixture.water <= 1e-6 : bodyMass(b) <= 1e-6),
  impossible({ sub }) {
    if (sub.boiling) return undefined;
    return both((l) =>
      l === 'uk'
        ? `Речовина «${tr(sub.name, l)}» не кипить: задовго до того вона почне димітися й розкладатися, тож випарити її досуха не вийде.`
        : `${capital(tr(sub.name, l))} does not boil: long before that it starts to smoke and break down, so it cannot be boiled dry.`,
    );
  },
  paper: (_p, sub, mass) =>
    sub.boiling ? { end: sub.boiling.point.value, extra: mass * (1 - (sub.mixture?.saltFraction ?? 0)) * sub.boiling.latentHeat.value } : undefined,
  massIsProgress: true,
  markers: ['freezing', 'boiling'],
  verbs: {
    past: { uk: { f: 'википіла досуха', m: 'википів досуха', n: 'википіло досуха' }, en: 'boiled dry' },
    future: { uk: 'википить досуха', en: 'boil dry' },
  },
  reachedNotes({ sample: b, locale }) {
    const crystals = b.state.mixture?.crystals ?? 0;
    if (!(crystals > 0)) return [];
    const g = formatQuantity(crystals, 'kg', { locale, level: 'school' });
    return [
      locale === 'uk'
        ? `Вода пішла парою, а на дні залишилося ${g} кристалів солі — стільки ж, скільки її було розчинено.`
        : `The water left as steam, and ${g} of salt crystals remained on the bottom — as much as was dissolved.`,
    ];
  },
};
