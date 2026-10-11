export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export const vec2 = (x: number, y: number): Vec2 => ({ x, y });
export const ORIGIN: Vec2 = vec2(0, 0);
export const add = (a: Vec2, b: Vec2): Vec2 => vec2(a.x + b.x, a.y + b.y);
export const sub = (a: Vec2, b: Vec2): Vec2 => vec2(a.x - b.x, a.y - b.y);
export const scale = (a: Vec2, k: number): Vec2 => vec2(a.x * k, a.y * k);
export const length = (a: Vec2): number => Math.hypot(a.x, a.y);
