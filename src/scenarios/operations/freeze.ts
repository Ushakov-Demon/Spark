import { NACL_SOLUTE } from '../../components/index.js';
import { tr } from '../../knowledge/i18n.js';
import { both, capital, lower, T } from './helpers.js';
import type { Operation } from './types.js';

export const FREEZE: Operation = {
  id: 'freeze',
  label: { uk: 'Заморозити', en: 'Freeze' },
  icon: 'freeze',
  uses: 'cooler',
  direction: 'cooling',
  speed: 600,
  accepts: (sub) => sub.freezing !== undefined,
  startTemp: () => 20,
  reached: (b) => (b.state.solidFraction ?? 0) >= 1,
  impossible({ sub, surroundingTemp, where }) {
    if (!sub.freezing) {
      return both((l) => (l === 'uk' ? `Для речовини «${tr(sub.name, l)}» ми не знайшли даних про застигання, тому модель не може показати замерзання.` : `We found no freezing data for ${lower(sub, l)}, so the model cannot show it freezing.`));
    }
    const tf = sub.freezing.point.value;
    // A solution freezes gradually: completely only below the eutectic.
    const te = NACL_SOLUTE.eutectic.t;
    if (sub.mixture && surroundingTemp >= te && surroundingTemp < tf) {
      return both((l) =>
        l === 'uk'
          ? `${capital(where(l))} ${T(surroundingTemp, l)}: лід почне утворюватися, але замерзає лише прісна вода, а розсіл, що лишається, стає дедалі солонішим і замерзає дедалі холодніше. Повністю солона вода замерзає тільки нижче ${T(te, l)}.`
          : `It is ${T(surroundingTemp, l)} ${where(l)}: ice will start to form, but only fresh water freezes, and the remaining brine gets ever saltier and freezes ever colder. Salt water freezes completely only below ${T(te, l)}.`,
      );
    }
    if (surroundingTemp < tf) return undefined;
    return both((l) =>
      l === 'uk'
        ? `${capital(where(l))} лише ${T(surroundingTemp, l)}, а ${lower(sub, l)} замерзає при ${T(tf, l)} — холоду не вистачить.`
        : `It is only ${T(surroundingTemp, l)} ${where(l)}, but ${lower(sub, l)} freezes at ${T(tf, l)} — not cold enough.`,
    );
  },
  needs({ sub, surroundingTemp }) {
    if (!sub.freezing) return undefined;
    // A solution freezes completely only below the eutectic; pure substances below their freezing point.
    const below = sub.mixture ? NACL_SOLUTE.eutectic.t : sub.freezing.point.value;
    return surroundingTemp >= below ? { colderThan: below } : undefined;
  },
  markers: ['freezing'],
  verbs: {
    past: { uk: { f: 'повністю замерзла', m: 'повністю замерз', n: 'повністю замерзло' }, en: 'froze completely' },
    future: { uk: 'повністю замерзне', en: 'freeze completely' },
    negative: { uk: 'замерзне', en: 'freeze' },
  },
  // Brine above the eutectic: part of it freezes, a salty pocket stays liquid.
  impossibleHeadline(b, subject, locale) {
    const s = b.state.solidFraction ?? 0;
    if (!b.state.mixture || !(s > 0)) return undefined;
    const part = Math.round(s * 100);
    return locale === 'uk' ? `${subject} замерзне лише частково: льодом стало ${part} % води.` : `${subject} will freeze only partly: ${part} % of the water turned to ice.`;
  },
  heatGivenNote: { uk: ', з них більшу частину — приховану теплоту замерзання', en: ', most of it the latent heat of freezing' },
};
