import { placeValue } from '../src/scenarios/presets.js';

/**
 * Finding a city by its name for the conditions of an experiment (the Earth's field there): the Open-Meteo geocoding
 * API (free for non-commercial and educational use, no key; places from GeoNames, CC BY 4.0). Only what is typed in
 * the field goes there, and only from three letters on; offline it finds nothing and the example stays.
 */
const API = 'https://geocoding-api.open-meteo.com/v1/search';

export interface FoundPlace {
  /** «Біла Церква, Київська область, Україна». */
  readonly label: string;
  /** «Біла Церква|49.7994|30.1165» — a place control's value. */
  readonly value: string;
}

interface ApiResult {
  readonly name?: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly admin1?: string;
  readonly country?: string;
}

let pending: AbortController | null = null;

/** Up to 8 places whose names start so; [] when there are none, the text is too short or the network is down. */
export async function searchPlaces(text: string, locale: 'uk' | 'en'): Promise<FoundPlace[]> {
  const name = text.trim();
  if (name.length < 3) return [];
  pending?.abort();
  const ctrl = new AbortController();
  pending = ctrl;
  try {
    const res = await fetch(`${API}?name=${encodeURIComponent(name)}&count=8&language=${locale}&format=json`, { signal: ctrl.signal });
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: ApiResult[] };
    const seen = new Set<string>();
    return (data.results ?? []).flatMap((r) =>
      r.name && Number.isFinite(r.latitude) && Number.isFinite(r.longitude)
        ? [{ label: [r.name, r.admin1, r.country].filter((x, i, a) => x && a.indexOf(x) === i).join(', '), value: placeValue({ name: r.name, lat: r.latitude!, lon: r.longitude! }) }]
        : [],
    ).filter((f) => !seen.has(f.label) && !!seen.add(f.label));
  } catch {
    return [];
  }
}
