/**
 * The World Magnetic Model WMM-2025 (NOAA NCEI and the British Geological Survey; a work of the US government, in the
 * public domain): the Earth's main field as spherical harmonics to degree 12, good for 2025.0–2030.0. Its
 * coefficients (n, m, g, h in nT and their yearly change) are those of WMM.COF, released 13 November 2024. The
 * synthesis follows the model's technical report: the geodetic point is turned into geocentric spherical
 * coordinates on the WGS 84 ellipsoid; the Schmidt semi-normalized associated Legendre functions and the field's
 * north (X), east (Y) and down (Z) parts are summed there and turned back to the geodetic frame.
 */

const EPOCH = 2025;
/** n, m, g, h (nT), ġ, ḣ (nT a year). */
const COEFFICIENTS: readonly (readonly [number, number, number, number, number, number])[] = [
  [1, 0, -29351.8, 0.0, 12.0, 0.0],
  [1, 1, -1410.8, 4545.4, 9.7, -21.5],
  [2, 0, -2556.6, 0.0, -11.6, 0.0],
  [2, 1, 2951.1, -3133.6, -5.2, -27.7],
  [2, 2, 1649.3, -815.1, -8.0, -12.1],
  [3, 0, 1361.0, 0.0, -1.3, 0.0],
  [3, 1, -2404.1, -56.6, -4.2, 4.0],
  [3, 2, 1243.8, 237.5, 0.4, -0.3],
  [3, 3, 453.6, -549.5, -15.6, -4.1],
  [4, 0, 895.0, 0.0, -1.6, 0.0],
  [4, 1, 799.5, 278.6, -2.4, -1.1],
  [4, 2, 55.7, -133.9, -6.0, 4.1],
  [4, 3, -281.1, 212.0, 5.6, 1.6],
  [4, 4, 12.1, -375.6, -7.0, -4.4],
  [5, 0, -233.2, 0.0, 0.6, 0.0],
  [5, 1, 368.9, 45.4, 1.4, -0.5],
  [5, 2, 187.2, 220.2, 0.0, 2.2],
  [5, 3, -138.7, -122.9, 0.6, 0.4],
  [5, 4, -142.0, 43.0, 2.2, 1.7],
  [5, 5, 20.9, 106.1, 0.9, 1.9],
  [6, 0, 64.4, 0.0, -0.2, 0.0],
  [6, 1, 63.8, -18.4, -0.4, 0.3],
  [6, 2, 76.9, 16.8, 0.9, -1.6],
  [6, 3, -115.7, 48.8, 1.2, -0.4],
  [6, 4, -40.9, -59.8, -0.9, 0.9],
  [6, 5, 14.9, 10.9, 0.3, 0.7],
  [6, 6, -60.7, 72.7, 0.9, 0.9],
  [7, 0, 79.5, 0.0, -0.0, 0.0],
  [7, 1, -77.0, -48.9, -0.1, 0.6],
  [7, 2, -8.8, -14.4, -0.1, 0.5],
  [7, 3, 59.3, -1.0, 0.5, -0.8],
  [7, 4, 15.8, 23.4, -0.1, 0.0],
  [7, 5, 2.5, -7.4, -0.8, -1.0],
  [7, 6, -11.1, -25.1, -0.8, 0.6],
  [7, 7, 14.2, -2.3, 0.8, -0.2],
  [8, 0, 23.2, 0.0, -0.1, 0.0],
  [8, 1, 10.8, 7.1, 0.2, -0.2],
  [8, 2, -17.5, -12.6, 0.0, 0.5],
  [8, 3, 2.0, 11.4, 0.5, -0.4],
  [8, 4, -21.7, -9.7, -0.1, 0.4],
  [8, 5, 16.9, 12.7, 0.3, -0.5],
  [8, 6, 15.0, 0.7, 0.2, -0.6],
  [8, 7, -16.8, -5.2, -0.0, 0.3],
  [8, 8, 0.9, 3.9, 0.2, 0.2],
  [9, 0, 4.6, 0.0, -0.0, 0.0],
  [9, 1, 7.8, -24.8, -0.1, -0.3],
  [9, 2, 3.0, 12.2, 0.1, 0.3],
  [9, 3, -0.2, 8.3, 0.3, -0.3],
  [9, 4, -2.5, -3.3, -0.3, 0.3],
  [9, 5, -13.1, -5.2, 0.0, 0.2],
  [9, 6, 2.4, 7.2, 0.3, -0.1],
  [9, 7, 8.6, -0.6, -0.1, -0.2],
  [9, 8, -8.7, 0.8, 0.1, 0.4],
  [9, 9, -12.9, 10.0, -0.1, 0.1],
  [10, 0, -1.3, 0.0, 0.1, 0.0],
  [10, 1, -6.4, 3.3, 0.0, 0.0],
  [10, 2, 0.2, 0.0, 0.1, -0.0],
  [10, 3, 2.0, 2.4, 0.1, -0.2],
  [10, 4, -1.0, 5.3, -0.0, 0.1],
  [10, 5, -0.6, -9.1, -0.3, -0.1],
  [10, 6, -0.9, 0.4, 0.0, 0.1],
  [10, 7, 1.5, -4.2, -0.1, 0.0],
  [10, 8, 0.9, -3.8, -0.1, -0.1],
  [10, 9, -2.7, 0.9, -0.0, 0.2],
  [10, 10, -3.9, -9.1, -0.0, -0.0],
  [11, 0, 2.9, 0.0, 0.0, 0.0],
  [11, 1, -1.5, 0.0, -0.0, -0.0],
  [11, 2, -2.5, 2.9, 0.0, 0.1],
  [11, 3, 2.4, -0.6, 0.0, -0.0],
  [11, 4, -0.6, 0.2, 0.0, 0.1],
  [11, 5, -0.1, 0.5, -0.1, -0.0],
  [11, 6, -0.6, -0.3, 0.0, -0.0],
  [11, 7, -0.1, -1.2, -0.0, 0.1],
  [11, 8, 1.1, -1.7, -0.1, -0.0],
  [11, 9, -1.0, -2.9, -0.1, 0.0],
  [11, 10, -0.2, -1.8, -0.1, 0.0],
  [11, 11, 2.6, -2.3, -0.1, 0.0],
  [12, 0, -2.0, 0.0, 0.0, 0.0],
  [12, 1, -0.2, -1.3, 0.0, -0.0],
  [12, 2, 0.3, 0.7, -0.0, 0.0],
  [12, 3, 1.2, 1.0, -0.0, -0.1],
  [12, 4, -1.3, -1.4, -0.0, 0.1],
  [12, 5, 0.6, -0.0, -0.0, -0.0],
  [12, 6, 0.6, 0.6, 0.1, -0.0],
  [12, 7, 0.5, -0.1, -0.0, -0.0],
  [12, 8, -0.1, 0.8, 0.0, 0.0],
  [12, 9, -0.4, 0.1, 0.0, -0.0],
  [12, 10, -0.2, -1.0, -0.1, -0.0],
  [12, 11, -1.3, 0.1, -0.0, 0.0],
  [12, 12, -0.7, 0.2, -0.1, -0.1],
];
const N = 12;
/** The model's reference radius and the WGS 84 ellipsoid, km. */
const RE = 6371.2;
const A = 6378.137;
const F = 1 / 298.257223563;

/** Schmidt semi-normalized P_n^m(sin φ) for n ≤ 12. */
function legendre(sinPhi: number): number[][] {
  const cosPhi = Math.sqrt(Math.max(0, 1 - sinPhi * sinPhi));
  const p = Array.from({ length: N + 1 }, () => new Array<number>(N + 1).fill(0));
  p[0]![0] = 1;
  for (let n = 1; n <= N; n++) {
    for (let m = 0; m <= n; m++) {
      if (n === m) p[n]![n] = n === 1 ? cosPhi : Math.sqrt((2 * n - 1) / (2 * n)) * cosPhi * p[n - 1]![n - 1]!;
      else p[n]![m] = ((2 * n - 1) * sinPhi * p[n - 1]![m]! - (n >= 2 ? Math.sqrt((n - 1) ** 2 - m * m) * p[n - 2]![m]! : 0)) / Math.sqrt(n * n - m * m);
    }
  }
  return p;
}

export interface EarthField {
  /** North, east, down and horizontal parts, the total, T. */
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly h: number;
  readonly f: number;
  /** Inclination (down from the horizontal) and declination (east of true north), degrees. */
  readonly inclination: number;
  readonly declination: number;
}

/** The Earth's main field at a place (geodetic latitude and longitude, degrees; height above the ellipsoid, km) and a decimal year. */
export function earthField(lat: number, lon: number, year: number, heightKm = 0): EarthField {
  const t = year - EPOCH;
  const phi = (lat * Math.PI) / 180;
  const lambda = (lon * Math.PI) / 180;
  // Geodetic to geocentric spherical.
  const e2 = F * (2 - F);
  const rc = A / Math.sqrt(1 - e2 * Math.sin(phi) ** 2);
  const px = (rc + heightKm) * Math.cos(phi);
  const pz = (rc * (1 - e2) + heightKm) * Math.sin(phi);
  const r = Math.hypot(px, pz);
  const phiC = Math.asin(pz / r);
  const step = 1e-6;
  const p = legendre(Math.sin(phiC));
  const pUp = legendre(Math.sin(phiC + step));
  const pDown = legendre(Math.sin(phiC - step));
  let X = 0;
  let Y = 0;
  let Z = 0;
  for (const [n, m, g0, h0, gd, hd] of COEFFICIENTS) {
    const g = g0 + t * gd;
    const h = h0 + t * hd;
    const k = (RE / r) ** (n + 2);
    const cos = Math.cos(m * lambda);
    const sin = Math.sin(m * lambda);
    const dP = (pUp[n]![m]! - pDown[n]![m]!) / (2 * step);
    X -= k * (g * cos + h * sin) * dP;
    Y += (k * m * (g * sin - h * cos) * p[n]![m]!) / Math.cos(phiC);
    Z -= (n + 1) * k * (g * cos + h * sin) * p[n]![m]!;
  }
  // Back to the geodetic frame: the vertical differs by φ' − φ.
  const d = phiC - phi;
  const x = X * Math.cos(d) - Z * Math.sin(d);
  const z = X * Math.sin(d) + Z * Math.cos(d);
  const hor = Math.hypot(x, Y);
  const nT = 1e-9;
  return { x: x * nT, y: Y * nT, z: z * nT, h: hor * nT, f: Math.hypot(hor, z) * nT, inclination: (Math.atan2(z, hor) * 180) / Math.PI, declination: (Math.atan2(Y, x) * 180) / Math.PI };
}

/** A decimal year within the model's life span. */
export const modelYear = (date: Date): number => Math.min(2030, Math.max(EPOCH, date.getUTCFullYear() + date.getUTCMonth() / 12));
