/**
 * Branded SI quantities.
 *
 * At runtime these are plain numbers (zero cost), but the compiler refuses to
 * pass Celsius where Kelvin is expected or Watts where Joules are expected.
 * All values inside the engine are stored in SI base units; conversions to
 * "school" units (°C, g, kJ) happen only at the edges (factories, UI).
 */
declare const unit: unique symbol;
export type Quantity<U extends string> = number & { readonly [unit]: U };

export type Seconds = Quantity<'s'>;
export type Meters = Quantity<'m'>;
export type SquareMeters = Quantity<'m2'>;
export type Kilograms = Quantity<'kg'>;
export type Kelvin = Quantity<'K'>;
export type Joules = Quantity<'J'>;
export type Watts = Quantity<'W'>;
/** Density ρ, kg/m³ */
export type Density = Quantity<'kg/m3'>;
export type CubicMeters = Quantity<'m3'>;
/** Specific heat capacity c, J/(kg·K) */
export type SpecificHeat = Quantity<'J/(kg*K)'>;
/** Heat capacity C = m·c, J/K */
export type HeatCapacity = Quantity<'J/K'>;
/** Thermal conductance G, W/K (heat flow per kelvin of difference) */
export type ThermalConductance = Quantity<'W/K'>;
/** Thermal conductivity k, W/(m·K) — material property */
export type ThermalConductivity = Quantity<'W/(m*K)'>;
/** Convective heat transfer coefficient h, W/(m²·K) */
export type HeatTransferCoeff = Quantity<'W/(m2*K)'>;

const as = <Q extends Quantity<string>>(v: number): Q => v as Q;

export const seconds = (v: number): Seconds => as(v);
export const meters = (v: number): Meters => as(v);
export const squareMeters = (v: number): SquareMeters => as(v);
export const kilograms = (v: number): Kilograms => as(v);
export const density = (v: number): Density => as(v);
export const cubicMeters = (v: number): CubicMeters => as(v);
export const liters = (l: number): CubicMeters => cubicMeters(l / 1000);
export const kelvin = (v: number): Kelvin => as(v);
export const joules = (v: number): Joules => as(v);
export const watts = (v: number): Watts => as(v);
export const specificHeat = (v: number): SpecificHeat => as(v);
export const heatCapacity = (v: number): HeatCapacity => as(v);
export const thermalConductance = (v: number): ThermalConductance => as(v);
export const thermalConductivity = (v: number): ThermalConductivity => as(v);
export const heatTransferCoeff = (v: number): HeatTransferCoeff => as(v);

export const ZERO_CELSIUS_IN_KELVIN = 273.15;
export const celsius = (c: number): Kelvin => kelvin(c + ZERO_CELSIUS_IN_KELVIN);
export const toCelsius = (k: Kelvin): number => k - ZERO_CELSIUS_IN_KELVIN;
export const grams = (g: number): Kilograms => kilograms(g / 1000);
