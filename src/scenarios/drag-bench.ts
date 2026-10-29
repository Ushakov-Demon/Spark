import type { CommandHandler } from '../core/commands.js';
import { err, ok } from '../core/result.js';
import type { MeasurementRecord } from '../core/trace.js';
import { cite, sv } from '../components/sourced.js';
import { COMPONENTS } from '../components/index.js';
import { G } from '../domains/mechanics/constants.js';
import { AIR_DENSITY } from '../domains/thermal/evaporation.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import type { SourcedValue } from '../knowledge/types.js';

/**
 * The form of a body, the medium, and the drag (grade 7): three bodies moulded from the same 5 g of plasticine — a
 * ball, a cube, a flat square plate — are let go at the water's surface in an aquarium and filmed; frame by frame,
 * the time between two marks 20 cm apart (the first 5 cm below the surface) gives the speed. Then the same ball is
 * dropped in the air past the same marks. The drag F = C_d·ρ·v²·A/2 (quadratic: Re ≈ 5·10³–9·10³ here) grows as the
 * body speeds up until it balances the weight less the buoyant force; falling from rest, the distance is
 * x(t) = ln cosh(t·√(g′k)) / k, k = ρ·C_d·A / (2m), g′ = g·(1 − ρ/ρ_body). The plate is taken to fall flat
 * (in truth it rocks from side to side); the water's added mass at the start is left out.
 */

/** The plasticine: one piece of 5 g for every body. */
export const DRAG_MASS = 0.005;
export const PLASTICINE_DENSITY: SourcedValue = sv(1600, 'kg/m³', 'modelling plasticine', 'estimate', 0.15, [cite('spark', 'estimate', 'school texts take 1.5 g/cm³; makes filled with chalk or gypsum are heavier', 1600)], 'Estimate: it sets how fast the bodies go, not their order.');
/** The plate is pressed out this thick. */
export const DRAG_PLATE = 0.005;
/** The marks: the first so far below the surface (the start), the second so much further. */
export const DRAG_START = 0.05;
export const DRAG_TRACK = 0.2;
/** A phone films 30 frames a second. */
export const DRAG_FPS = 30;

export type DragShape = 'ball' | 'cube' | 'plate';
export type DragMedium = 'water' | 'air';

/** Measured drag coefficients (a ball, a cube face-on, a flat plate across the flow). */
export const DRAG_COEFFICIENTS: Readonly<Record<DragShape, SourcedValue>> = {
  ball: sv(0.47, '', 'a sphere', 'single-source', 0.1, [cite('wikimedia-drag-shapes', 'Sphere 0.47', 'Re 10⁴–10⁶', 0.47)], 'Nearly the same from Re ≈ 10³ to 2·10⁵.'),
  cube: sv(1.05, '', 'a cube, a face to the flow', 'single-source', 0.1, [cite('wikimedia-drag-shapes', 'Cube 1.05', 'Re 10⁴–10⁶', 1.05)], 'A bluff body: the drag hardly changes with the speed.'),
  plate: sv(1.28, '', 'a flat plate across the flow', 'single-source', 0.1, [cite('wikipedia-drag-coefficient', 'Flat plate perpendicular to flow (3D) 1.28', '—', 1.28)], 'Falling flat; in truth a plate rocks and slides aside.'),
};

/** Let one body go and film it past the marks. */
export interface DragCommand {
  readonly type: 'lab.drag';
  readonly shape: DragShape;
  readonly medium: DragMedium;
}

export const mediumDensity = (m: DragMedium): number => (m === 'air' ? AIR_DENSITY.value : COMPONENTS.water.phases.liquid!.density!.value);

/** The body's size across (m) and the area it shows to the flow (m²), moulded from the plasticine. */
export function dragBody(shape: DragShape): { across: number; area: number; volume: number } {
  const volume = DRAG_MASS / PLASTICINE_DENSITY.value;
  if (shape === 'ball') {
    const d = Math.cbrt((6 * volume) / Math.PI);
    return { across: d, area: (Math.PI * d * d) / 4, volume };
  }
  if (shape === 'cube') {
    const a = Math.cbrt(volume);
    return { across: a, area: a * a, volume };
  }
  const side = Math.sqrt(volume / DRAG_PLATE);
  return { across: side, area: side * side, volume };
}

/** Falling from rest: how far in t seconds; the time to x; the steady speed (m/s) — all with quadratic drag. */
export function dragFall(shape: DragShape, medium: DragMedium): { at: (t: number) => number; timeTo: (x: number) => number; steady: number; drag: (v: number) => number } {
  const rho = mediumDensity(medium);
  const { area } = dragBody(shape);
  const k = (rho * DRAG_COEFFICIENTS[shape].value * area) / (2 * DRAG_MASS);
  const g = G * (1 - rho / PLASTICINE_DENSITY.value);
  const q = Math.sqrt(g * k);
  return {
    at: (t) => Math.log(Math.cosh(q * t)) / k,
    timeTo: (x) => Math.acosh(Math.exp(k * x)) / q,
    steady: Math.sqrt(g / k),
    drag: (v) => (rho * DRAG_COEFFICIENTS[shape].value * area * v * v) / 2,
  };
}

export const dragCommand: CommandHandler<DragCommand> = {
  type: 'lab.drag',
  apply(state, c) {
    if (!(c.shape in DRAG_COEFFICIENTS) || !(c.medium === 'water' || c.medium === 'air')) return err({ uk: 'Такого тіла чи середовища в досліді немає.', en: 'No such body or medium in the experiment.' });
    const f = dragFall(c.shape, c.medium);
    const t = f.timeTo(DRAG_START + DRAG_TRACK) - f.timeTo(DRAG_START);
    // (Counted in frames: the time is a whole number of 1/30 s.)
    const frames = Math.round(t * DRAG_FPS);
    const record: MeasurementRecord = { kind: 'measurement', instrument: 'video', quantity: 'time', value: frames / DRAG_FPS, exact: t, entities: [], inputs: { frames, fps: DRAG_FPS, track: DRAG_TRACK, steady: f.steady, area: dragBody(c.shape).area, cd: DRAG_COEFFICIENTS[c.shape].value, rho: mediumDensity(c.medium) } };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
  },
};

export const DRAG_COMMANDS = [dragCommand] as const;

const SHAPE: Record<DragShape, { name: LocalizedText; icon: string }> = {
  ball: { name: { uk: 'кулька', en: 'the ball' }, icon: '⚫' },
  cube: { name: { uk: 'кубик', en: 'the cube' }, icon: '◼' },
  plate: { name: { uk: 'пластинка', en: 'the plate' }, icon: '▬' },
};
export const dragShapeName = (s: DragShape) => SHAPE[s].name;
/** «1 кадр», «4 кадри», «11 кадрів». */
export const framesText = (n: number, uk: boolean): string => {
  if (!uk) return `${n} frame${n === 1 ? '' : 's'}`;
  const d = n % 10;
  const teen = n % 100 >= 11 && n % 100 <= 14;
  return `${n} ${!teen && d === 1 ? 'кадр' : !teen && d >= 2 && d <= 4 ? 'кадри' : 'кадрів'}`;
};

export const DRAG_TEXT: Record<DragCommand['type'], (c: DragCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.drag': (x) => {
    const c = x as DragCommand;
    const n = SHAPE[c.shape].name;
    if (c.medium === 'air')
      return {
        say: { uk: 'А тепер ту саму кульку відпустимо в повітрі — біля таких самих позначок — і знімемо так само.', en: 'And now the same ball is let go in the air — past the same marks — and filmed the same way.' },
        button: { uk: '⚫ Кулька в повітрі', en: '⚫ The ball in the air' },
        plan: { uk: 'кулька в повітрі', en: 'the ball in the air' },
      };
    const say: Record<DragShape, LocalizedText> = {
      ball: { uk: 'Скачаємо з 5 г пластиліну кульку й відпустимо її біля поверхні води. Знімаємо телефоном: за кадрами відео знайдемо, скільки часу вона йде між позначками.', en: 'Roll 5 g of plasticine into a ball and let it go at the water’s surface. We film it: the video’s frames will tell how long it takes between the marks.' },
      cube: { uk: 'Ту саму грудку пластиліну зліпимо в кубик і відпустимо так само.', en: 'The same lump of plasticine is moulded into a cube and let go the same way.' },
      plate: { uk: 'А тепер розплющимо її в пласку квадратну пластинку й відпустимо плазом.', en: 'Now it is pressed into a flat square plate and let go lying flat.' },
    };
    return {
      say: say[c.shape],
      button: { uk: `${SHAPE[c.shape].icon} ${n.uk[0]!.toUpperCase()}${n.uk.slice(1)} у воді`, en: `${SHAPE[c.shape].icon} ${n.en[0]!.toUpperCase()}${n.en.slice(1)} in water` },
      plan: { uk: `${n.uk} у воді`, en: `${n.en} in water` },
    };
  },
};
