import { describe, expect, it } from 'vitest';
import { barMagnetAxisField, barMagnetFieldDirection, barMagnetPullOnBall, MU0 } from '../src/domains/electrical/magnet.js';
import { magnetLoss, magnetPull } from '../src/experiments/contact-forces/bench.js';

describe('a bar magnet and an iron ball', () => {
  it('far off, the axial field is a dipole’s: B = μ₀·m / (2π·z³)', () => {
    const [Br, L, R, s] = [0.38, 0.1, 0.008, 2];
    const m = (Br / MU0) * Math.PI * R * R * L;
    expect(barMagnetAxisField(Br, L, R, s)).toBeCloseTo((MU0 * m) / (2 * Math.PI * (s + L / 2) ** 3), 9);
  });

  it('the pull is a soft ball’s: 3·V/μ₀ · B·dB/ds at the limit of a large μ', () => {
    const [Br, L, R, gap, r] = [0.38, 0.1, 0.008, 0.02, 0.004];
    const h = 1e-6;
    const B = (x: number) => barMagnetAxisField(Br, L, R, x);
    const expected = ((3 * (4 / 3) * Math.PI * r ** 3) / MU0) * B(gap + r) * Math.abs((B(gap + r + h) - B(gap + r - h)) / (2 * h));
    expect(barMagnetPullOnBall(Br, L, R, gap, r, 1e9) / expected).toBeCloseTo(1, 5);
  });

  it('the lines leave the north end and come into the south end, and turn back at the side', () => {
    expect(barMagnetFieldDirection(10, 0.8, 0, 6)[1]).toBeGreaterThan(0.99);
    expect(barMagnetFieldDirection(10, 0.8, 0, -6)[1]).toBeGreaterThan(0.99);
    expect(barMagnetFieldDirection(10, 0.8, 4, 0)[1]).toBeLessThan(-0.9);
  });

  it('on the scales: fades fast with the gap; a neodymium magnet of the same size pulls ≈ (Br ratio)² as hard', () => {
    expect(magnetLoss(0.02, 'ferrite')).toBeGreaterThan(1e-5);
    expect(magnetPull(0.01, 'ferrite') / magnetPull(0.02, 'ferrite')).toBeGreaterThan(5);
    expect(magnetPull(0.02, 'neodymium') / magnetPull(0.02, 'ferrite')).toBeCloseTo((1.2 / 0.38) ** 2, 6);
    expect(magnetLoss(1, 'ferrite')).toBe(0);
  });
});
