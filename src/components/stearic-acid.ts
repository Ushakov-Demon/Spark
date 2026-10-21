import type { Component } from './types.js';
import { cite, estimate, sv } from './sourced.js';

/** Stearic acid: a waxy fatty acid that melts at 69 °C — the classic cooling-curve substance. */
export const STEARIC_ACID = {
  id: 'stearic-acid',
  kind: 'compound',
  group: 'material',
  name: { uk: 'Стеаринова кислота', en: 'Stearic acid' },
  genitive: { uk: 'стеаринової кислоти', en: 'stearic acid' },
  gender: 'f',
  formula: 'C₁₈H₃₆O₂',
  composition: { C: 18, H: 36, O: 2 },
  stateAtRoom: 'solid',
  phases: {
    solid: {
      density: sv(940.8, 'kg/m³', 'solid, 20 °C', 'single-source', 0.01, [cite('wikipedia-stearic-acid', 'Chembox: density 0.9408 g/cm³ (20 °C)', '20 °C', 940.8)], 'Only the Wikipedia chembox checked so far.'),
      specificHeat: sv(1763, 'J/(kg·K)', 'solid, 25 °C', 'single-source', 0.02, [cite('nist-stearic-acid', 'Cp,solid 501.55 J/(mol·K) at 298.15 K (Schaake et al., 1982) ÷ 0.284484 kg/mol', '298.15 K', 1763), cite('wikipedia-stearic-acid', 'Chembox: heat capacity 501.5 J/(mol·K)', '25 °C', 1763)], 'NIST also lists 561.9 J/(mol·K) (Singleton et al., 1950), 12 % more; the newer measurement is used.'),
    },
    liquid: {
      density: sv(847, 'kg/m³', 'liquid, 70 °C', 'single-source', 0.01, [cite('wikipedia-stearic-acid', 'Chembox: density 0.847 g/cm³ (70 °C)', '70 °C', 847)], 'Only the Wikipedia chembox checked so far.'),
      specificHeat: estimate(2300, 'J/(kg·K)', 'liquid, near the melting point', 2000, 2600, 'No table checked yet: molten fats and fatty acids hold ≈ 2.0–2.5 kJ/(kg·K). It only changes how fast the melt cools before it starts to set.'),
    },
  },
  melting: {
    point: sv(69.3, '°C', '1 atm', 'cross-checked', 0.03, [cite('wikipedia-stearic-acid', 'Chembox: melting point 69.3 °C', '—', 69.3), cite('nist-stearic-acid', 'Tfus 342.5 K (Domalski and Hearing, 1996)', '—', 69.35)]),
    latentHeat: sv(215_200, 'J/kg', 'at the melting point', 'single-source', 0.03, [cite('nist-stearic-acid', 'ΔfusH 61.21 kJ/mol (Domalski and Hearing, 1996) ÷ 0.284484 kg/mol', '342.5 K', 215_160), cite('nist-stearic-acid', 'ΔfusH 61.30 kJ/mol (Sato et al., 1990)', '342.75 K', 215_480)], 'NIST lists eight measurements, 51–68 kJ/mol; most lie at 60–63.'),
  },
  hazards: { flashPoint: sv(205, '°C', 'not stated', 'single-source', 0.02, [cite('wikipedia-stearic-acid', 'Chembox: flash point 205 °C', '—', 205)], 'Only the Wikipedia chembox checked so far.') },
  description: {
    novice: { uk: 'Білий воскоподібний порошок або грудочки. Плавиться в гарячій воді (при 69 °C), з неї роблять свічки й мило.', en: 'A white waxy powder or lumps. It melts in hot water (at 69 °C); candles and soap are made of it.' },
    school: { uk: 'Поки розплавлена стеаринова кислота твердне, вона віддає приховану теплоту, і її температура тримається біля 69 °C — на графіку охолодження з’являється «полиця».', en: 'While molten stearic acid sets, it gives off latent heat and its temperature stays near 69 °C — the cooling graph shows a flat “shelf”.' },
  },
  safety: { school: { uk: 'Розплав гарячий (понад 69 °C) — можна обпектися. Вище 200 °C пара може зайнятися.', en: 'The melt is hot (over 69 °C) — it can burn. Above 200 °C its vapour can catch fire.' } },
  media: [],
} as const satisfies Component;
