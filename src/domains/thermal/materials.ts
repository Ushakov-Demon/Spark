import {
  heatTransferCoeff,
  specificHeat,
  thermalConductivity,
  type HeatTransferCoeff,
  type SpecificHeat,
  type ThermalConductivity,
} from '../../core/units.js';

export interface ThermalMaterial {
  readonly name: string;
  readonly specificHeat: SpecificHeat;
  readonly conductivity: ThermalConductivity;
}

const material = (name: string, c: number, k: number): ThermalMaterial => ({
  name,
  specificHeat: specificHeat(c),
  conductivity: thermalConductivity(k),
});

/** Reference values at ~20 °C (school textbook tables). */
export const MATERIALS = {
  water: material('Вода', 4186, 0.6),
  ice: material('Лёд', 2100, 2.2),
  air: material('Воздух', 1005, 0.026),
  aluminium: material('Алюминий', 897, 237),
  copper: material('Медь', 385, 401),
  iron: material('Железо', 449, 80),
  steel: material('Сталь', 460, 50),
  glass: material('Стекло', 840, 1.0),
  brick: material('Кирпич', 840, 0.7),
  wood: material('Дерево', 1700, 0.15),
} as const satisfies Record<string, ThermalMaterial>;

export type MaterialName = keyof typeof MATERIALS;

/** Typical convective coefficients h, W/(m²·K). */
export const CONVECTION = {
  stillAir: heatTransferCoeff(10),
  wind: heatTransferCoeff(50),
  stillWater: heatTransferCoeff(500),
  boilingWater: heatTransferCoeff(5000),
} as const satisfies Record<string, HeatTransferCoeff>;
