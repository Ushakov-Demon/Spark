/**
 * A small body moving steadily through a liquid (grade 7: a bubble rising in a bottle, a ball sinking in a cylinder):
 * its weight less the buoyant force is balanced by the liquid's drag, (ρ_body − ρ_liquid)·g·πd³/6 = C_d·ρ_liquid·v²/2·πd²/4.
 * Slow (Re = ρ_liquid·v·d/μ < 1) the drag is Stokes's, C_d = 24/Re, so v = (ρ_body − ρ_liquid)·g·d²/(18μ); faster —
 * the Schiller–Naumann correlation C_d = 24/Re·(1 + 0.15·Re^0.687), good up to Re ≈ 800. In a narrow vessel the walls
 * slow a slow body down: Faxén's factor 1 − 2.10443λ + 2.08877λ³ − 0.94813λ⁵ (λ = d/D) — used in Stokes's range only.
 * A bubble in a liquid with soap in it moves like a solid ball: the soap stiffens its surface.
 */

export interface Settling {
  /** The body's diameter, m, and density, kg/m³ (air — a bubble). */
  readonly diameter: number;
  readonly bodyDensity: number;
  /** The liquid's density, kg/m³, and viscosity, Pa·s. */
  readonly density: number;
  readonly viscosity: number;
  readonly g: number;
  /** The vessel's inner diameter, m (none — far from any wall). */
  readonly vessel?: number;
}

/** The drag coefficient of a sphere at a Reynolds number (Stokes below 1, Schiller–Naumann above). */
export const sphereDrag = (re: number): number => (re < 1 ? 24 / re : (24 / re) * (1 + 0.15 * re ** 0.687));

/** Faxén's wall factor for a sphere on the axis of a tube, λ = d/D. */
export const faxenFactor = (lambda: number): number => 1 - 2.10443 * lambda + 2.08877 * lambda ** 3 - 0.94813 * lambda ** 5;

/** The steady speed, m/s (positive — the way the body goes: down if heavier than the liquid, up if lighter), and its Reynolds number. */
export function terminalVelocity(s: Settling): { readonly speed: number; readonly reynolds: number } {
  const dRho = Math.abs(s.bodyDensity - s.density);
  const d = s.diameter;
  // Stokes first; then the balance solved for v with C_d at the current Re, a few rounds (it settles quickly).
  let v = (dRho * s.g * d * d) / (18 * s.viscosity);
  for (let i = 0; i < 60; i++) {
    const re = (s.density * v * d) / s.viscosity;
    if (re < 1) break;
    const next = Math.sqrt((4 * dRho * s.g * d) / (3 * sphereDrag(re) * s.density));
    if (Math.abs(next - v) < 1e-9) break;
    v = (v + next) / 2;
  }
  const reynolds = (s.density * v * d) / s.viscosity;
  const walls = s.vessel && reynolds < 1 ? faxenFactor(d / s.vessel) : 1;
  return { speed: v * walls, reynolds };
}
