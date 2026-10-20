import type { LiquidKind } from './types.js';

/** Colours of the scene: vessel metals and liquids. */
export const METAL: Readonly<Record<string, { fill: string; edge: string }>> = {
  steel: { fill: '#b9c2cb', edge: '#7d8893' },
  'stainless-steel': { fill: '#c4ccd4', edge: '#808b96' },
  aluminium: { fill: '#d7dce1', edge: '#9aa3ac' },
  copper: { fill: '#c97a43', edge: '#8f4f24' },
  brass: { fill: '#d4af37', edge: '#9a7b1d' },
  'cast-iron': { fill: '#4b4f55', edge: '#2c2f33' },
  iron: { fill: '#5d6268', edge: '#363a3f' },
  enamel: { fill: '#eef1f4', edge: '#9aa3ac' },
  ceramic: { fill: '#f0e6d8', edge: '#b9a68c' },
};
export const isGlass = (m: string) => m === 'glass' || m === 'borosilicate-glass';

export const LIQUID: Readonly<Record<LiquidKind, string>> = {
  water: 'rgba(96, 170, 240, 0.55)',
  salt: 'rgba(120, 178, 205, 0.62)',
  alcohol: 'rgba(205, 228, 255, 0.4)',
  acid: 'rgba(238, 238, 214, 0.5)',
  oil: 'rgba(233, 188, 52, 0.78)',
  other: 'rgba(200, 210, 220, 0.5)',
};

/** Colour of a liquid on the drawing (also its swatch on the shelf). */
export const liquidColor = (kind: LiquidKind): string => LIQUID[kind];
