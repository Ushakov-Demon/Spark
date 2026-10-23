import { cite, sv } from '../components/sourced.js';
import type { SourcedValue } from '../knowledge/types.js';

/**
 * The stoppered test tube with sand of lab work 10 (grade 7, the conditions of floating): sand poured out of
 * it changes its mass, not its outer volume — so its mean density goes from that of a sinking body to one
 * that floats inside the water, then to one that comes up. It goes into the 100 mL measuring cylinder.
 */

/** A 12 × 75 mm round-bottomed tube: outer diameter and length, m; nominal capacity, m³. */
export const TUBE_DIAMETER: SourcedValue = sv(0.012, 'm', 'outer diameter', 'single-source', 0.02, [cite('corning-9820-12', '12 × 75 mm', '—', 0.012)]);
export const TUBE_LENGTH: SourcedValue = sv(0.075, 'm', 'length', 'single-source', 0.02, [cite('corning-9820-12', '12 × 75 mm', '—', 0.075)]);
export const TUBE_CAPACITY: SourcedValue = sv(5e-6, 'm³', 'nominal capacity', 'single-source', 0.1, [cite('corning-9820-12', '5 mL', '—', 5e-6)], 'Nominal: what it holds with a stopper in.');
/** Its glass wall, m: the listing gives none. */
export const TUBE_WALL: SourcedValue = sv(0.001, 'm', 'glass wall', 'estimate', 0.3, [cite('spark', 'estimate', 'listings say only «uniform walls»', 0.001)], 'Estimate: thin-walled culture tubes have walls of about 0.8–1.2 mm.');
export const BOROSILICATE_DENSITY: SourcedValue = sv(2230, 'kg/m³', 'borosilicate glass 3.3', 'single-source', 0.01, [cite('labbox-borosilicate-33', 'density 2.23 ± 0.02 g/cm³', '—', 2230)]);
/** Dry sand poured in (its bulk density: grains with the air between them). */
export const SAND_DENSITY: SourcedValue = sv(1555, 'kg/m³', 'dry sand, bulk', 'single-source', 0.05, [cite('engineeringtoolbox-dirt-densities', 'sand, dry 1555 kg/m³', '—', 1555)], 'Depends on the grains and how tightly they settle: 1440–1650 kg/m³ in other tables.');

/** Volume of a round-bottomed tube of this radius and length: a cylinder with a half-ball at the bottom. */
const roundTube = (r: number, l: number) => Math.PI * r * r * (l - r) + (2 / 3) * Math.PI * r ** 3;
/** Outer volume of the stoppered tube, m³ (the stopper pushed in level with the rim). */
export const tubeVolume = (): number => roundTube(TUBE_DIAMETER.value / 2, TUBE_LENGTH.value);
/** The glass of the empty tube, kg (the cork's fraction of a gram is left out — below what the scales tell). */
export const tubeGlass = (): number => (tubeVolume() - roundTube(TUBE_DIAMETER.value / 2 - TUBE_WALL.value, TUBE_LENGTH.value - TUBE_WALL.value)) * BOROSILICATE_DENSITY.value;
/** Sand in the tube filled to the brim, kg. */
export const sandFull = (): number => TUBE_CAPACITY.value * SAND_DENSITY.value;
/** Sand that makes the tube's mean density that of the liquid: it floats inside it, kg. */
export const sandToFloatInside = (liquid: number): number => liquid * tubeVolume() - tubeGlass();
