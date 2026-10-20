import { tr } from '../../knowledge/i18n.js';
import { both, capital, K, lower, T } from './helpers.js';
import type { Operation } from './types.js';

export const MELT: Operation = {
  id: 'melt',
  label: { uk: 'Розплавити', en: 'Melt' },
  icon: 'melt',
  uses: 'either',
  direction: 'heating',
  speed: 600,
  // Start frozen: 10 °C below the melting point.
  startTemp: (sub) => (sub.freezing ? Math.round(sub.freezing.point.value - 10) : 20),
  reached: (b, _p, sub) => (b.state.solidFraction ?? 0) <= 0 && sub.freezing !== undefined && b.state.temperature >= K(sub.freezing.point.value) - 1e-6,
  impossible({ p, sub, surroundingTemp, where }) {
    if (!sub.freezing) {
      return both((l) => (l === 'uk' ? `Для речовини «${tr(sub.name, l)}» немає даних про застигання, тому твердого стану в моделі немає й розтоплювати нічого.` : `No freezing data for ${lower(sub, l)}: the model has no solid state to melt.`));
    }
    const tm = sub.freezing.point.value;
    if (p.heater || surroundingTemp > tm) return undefined;
    return both((l) =>
      l === 'uk'
        ? `${capital(where(l))} лише ${T(surroundingTemp, l)} — не тепліше за температуру плавлення (${T(tm, l)}), тож без нагрівача нічого не розтане.`
        : `It is only ${T(surroundingTemp, l)} ${where(l)} — not warmer than the melting point (${T(tm, l)}), so nothing melts without a heater.`,
    );
  },
  needs: ({ p, sub, surroundingTemp }) => (sub.freezing && !p.heater && surroundingTemp <= sub.freezing.point.value ? { heatAbove: sub.freezing.point.value } : undefined),
  paper: (_p, sub) => (sub.freezing ? { end: sub.freezing.point.value } : undefined),
  markers: ['freezing'],
  subjectIsSolid: true,
  verbs: {
    past: { uk: { f: 'повністю розтанула', m: 'повністю розтанув', n: 'повністю розтануло' }, en: 'melted completely' },
    future: { uk: 'повністю розтане', en: 'melt completely' },
    negative: { uk: 'розтане', en: 'melt' },
  },
};
