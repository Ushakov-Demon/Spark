import type { Component } from './types.js';
import { cite, estimate, sv } from './sourced.js';

/** Tin: melts at 232 °C — low enough for a spirit lamp. The classic melting graph of grade 8. */
export const TIN = {
  id: 'tin',
  kind: 'element',
  group: 'metal',
  name: { uk: 'Олово', en: 'Tin' },
  genitive: { uk: 'олова', en: 'tin' },
  gender: 'n',
  formula: 'Sn',
  composition: { Sn: 1 },
  wikidata: 'Q1096',
  stateAtRoom: 'solid',
  phases: {
    solid: {
      density: sv(7289, 'kg/m³', 'white tin, 20 °C', 'cross-checked', 0.01, [cite('wikipedia-tin', 'Infobox: density, white (β) at 20 °C 7.289 g/cm³', '20 °C', 7289), cite('engineeringtoolbox-solids-density', 'Tin 7.28 ×10³ kg/m³', 'not stated', 7280)]),
      specificHeat: sv(228, 'J/(kg·K)', 'white tin, 25 °C', 'cross-checked', 0.06, [cite('wikipedia-tin', 'Infobox: molar heat capacity 27.112 J/(mol·K) ÷ 0.11871 kg/mol', '25 °C', 228.4), cite('engineeringtoolbox-specific-heat-solids', 'Tin 0.24 kJ/(kg·K)', 'not stated', 240)]),
      conductivity: sv(66.8, 'W/(m·K)', 'solid, ≈ 300 K', 'single-source', 0.02, [cite('wikipedia-tin', 'Infobox: thermal conductivity 66.8 W/(m·K)', '—', 66.8)], 'Only the Wikipedia infobox checked so far.'),
    },
    liquid: {
      density: sv(6990, 'kg/m³', 'liquid at the melting point', 'single-source', 0.01, [cite('wikipedia-tin', 'Infobox: density when liquid (at m.p.) 6.99 g/cm³', '232 °C', 6990)], 'Only the Wikipedia infobox checked so far.'),
      specificHeat: estimate(240, 'J/(kg·K)', 'liquid, near the melting point', 228, 260, 'No table checked yet: liquid metals hold ≈ 25–31 J/(mol·K), close to the solid (Dulong–Petit), so the solid value is used, rounded up.'),
    },
  },
  melting: {
    point: sv(231.93, '°C', '1 atm', 'cross-checked', 0.002, [cite('wikipedia-tin', 'Infobox: melting point 505.08 K', '—', 231.93), cite('nist-tin', 'Tfus 505.11 K', '—', 231.96)]),
    latentHeat: sv(59_220, 'J/kg', 'at the melting point', 'single-source', 0.01, [cite('wikipedia-tin', 'Infobox: heat of fusion, white (β) 7.03 kJ/mol ÷ 0.11871 kg/mol', '—', 59_220)], 'Only the Wikipedia infobox checked so far.'),
  },
  boiling: { point: sv(2602, '°C', '1 atm', 'single-source', 0.01, [cite('wikipedia-tin', 'Infobox: boiling point 2875 K', '—', 2602)], 'Only the Wikipedia infobox checked so far.') },
  electrical: { conducts: 'metal', resistivity: sv(115e-9, 'Ω·m', 'solid, 0 °C', 'single-source', 0.01, [cite('wikipedia-tin', 'Infobox: electrical resistivity at 0 °C, 115 nΩ·m', '0 °C', 115e-9)], 'Only the Wikipedia infobox checked so far.') },
  magnetic: 'paramagnetic',
  description: {
    novice: { uk: 'Сріблястий м’який метал. Плавиться вже при 232 °C — його можна розплавити навіть над спиртівкою. Оловом паяють дроти.', en: 'A soft silvery metal. It melts at just 232 °C — even a spirit lamp can melt it. Tin is used to solder wires.' },
    school: { uk: 'Олово плавиться при 231,9 °C, питома теплота плавлення ≈ 59 кДж/кг. Поки олово плавиться, його температура не змінюється — на графіку нагрівання з’являється «полиця».', en: 'Tin melts at 231.9 °C; its latent heat of fusion is ≈ 59 kJ/kg. While it melts its temperature stays the same — the heating graph shows a flat “shelf”.' },
  },
  safety: {
    school: { uk: 'Розплавлене олово дуже гаряче (понад 230 °C) і спричиняє сильні опіки. Вода в розплаві миттєво закипає й розбризкує метал.', en: 'Molten tin is very hot (over 230 °C) and causes bad burns. Water in the melt boils at once and spatters the metal.' },
  },
  media: [],
} as const satisfies Component;
