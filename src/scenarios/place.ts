/** A place on the Earth, chosen by its name (a place control's value). */
export interface Place {
  readonly name: string;
  readonly lat: number;
  readonly lon: number;
  /** Height above the sea, m (from the geocoder; absent in older values). */
  readonly elevation?: number;
  /** The IANA time zone («Europe/Kyiv»; absent in older values). */
  readonly zone?: string;
}
/** «Київ|50.45|30.52» or «Київ|50.45|30.52|179|Europe/Kyiv» → the place (null — not a place). */
export function parsePlace(s: unknown): Place | null {
  if (typeof s !== 'string') return null;
  const [name, a, b, e, z] = s.split('|');
  const lat = Number(a);
  const lon = Number(b);
  const elevation = e === undefined || e === '' ? NaN : Number(e);
  if (!(name && Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180)) return null;
  return { name, lat, lon, ...(Number.isFinite(elevation) ? { elevation } : {}), ...(z ? { zone: z } : {}) };
}
export const placeValue = (p: Place): string => [p.name.replace(/\|/g, ' '), p.lat.toFixed(4), p.lon.toFixed(4), ...(p.elevation !== undefined || p.zone ? [p.elevation === undefined ? '' : String(Math.round(p.elevation)), p.zone ?? ''] : [])].join('|');
