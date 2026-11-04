import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both } from '../../scenarios/preset-kit.js';
import { clockText, equalShadowsNoon, GNOMON_HEIGHT, gnomonClock, gnomonPlace, latitudeFrom, sunOf } from './bench.js';
import type { Locale } from '../../knowledge/i18n.js';
import { offsetText } from '../../scenarios/place-time.js';
import { sig } from '../../explain/format.js';

export const answer_solar_noon = (run: PresetRun): PresetAnswer => {
  const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.gnomon' && x.record.value !== null);
  const place = gnomonPlace(String(recs[0]?.command['place'] ?? ''));
  const shadows = recs.map((x) => ({ time: x.record.inputs?.['time'] ?? 0, length: x.record.value! }));
  const found = shadows.length ? equalShadowsNoon(shadows) : null;
  const noon = found?.noon ?? null;
  const correct = noon === null ? undefined : Math.abs(noon - 720) < 1 ? 'noon' : noon > 720 ? 'later' : 'earlier';
  const { zone, summer } = gnomonClock(place);
  const standard = summer ? zone - 1 : zone;
  const meridian = 15 * standard;
  const byLon = 4 * (meridian - place.lon);
  const eq = sunOf(720, zone).eqtime;
  const south = recs[0]?.record.inputs?.['south'] === 1;
  const L = shadows.length ? Math.min(...shadows.map((x) => x.length)) : 0;
  const h = L ? Math.atan(GNOMON_HEIGHT / L) / (Math.PI / 180) : 0;
  const d = sunOf(noon ?? 720, zone).decl;
  const phi = latitudeFrom(h, d, south);
  const min = (x: number, l: Locale) => `${sig(Math.abs(x), 2, l)} ${t(l, 'unit-sym-min')}`;
  const deg = (x: number, l: Locale, k = 3) => `${sig(x, k, l).replace('-', '−')}°`;
  const lonText = (x: number, l: Locale) => `${sig(Math.abs(x), 3, l)}° ${x >= 0 ? t(l, 'solar-noon-answer-lon-text') : t(l, 'solar-noon-answer-lon-text-2')}`;
  return {
    ...(correct ? { correct } : {}),
    why: msg('solar-noon-answer-why'),
    say: both((l) => (noon === null ? '' : t(l, 'solar-noon-answer-say', { name: place.name, noon: clockText(noon) }))),
    text: both((l) => {
      if (noon === null || !found) return '';
      const p0 = found.pairs[0]!;
      const lonPart = Math.abs(byLon) < 0.5 ? t(l, 'solar-noon-text-lon-part') : t(l, 'solar-noon-text-lon-part-6', { meridian: deg(Math.abs(meridian - place.lon), l, 2), byLon: min(byLon, l), value: byLon < 0 ? t(l, 'solar-noon-text-lon-part-2') : t(l, 'solar-noon-text-lon-part-3'), value2: byLon < 0 ? t(l, 'solar-noon-text-lon-part-4') : t(l, 'solar-noon-text-lon-part-5') });
      const total = byLon + (summer ? 60 : 0) - eq;
      return t(l, 'solar-noon-answer-text-4', { L: sig(L, 3, l), t1: clockText(p0.t1), t2: clockText(p0.t2), length: sig(p0.length, 3, l), t12: clockText((p0.t1 + p0.t2) / 2), pairs: String(found.pairs.length), noon: clockText(noon), zone: offsetText(zone), meridian: lonText(meridian, l), lon: lonText(place.lon, l), lonPart, eq: min(eq, l), value: total >= 0 ? '+' : '−', total: min(total, l), value2: clockText(720 + total), h: deg(h, l), phi: deg(phi, l), d: deg(d, l, 1), lat: deg(place.lat, l, 4), value3: south ? t(l, 'solar-noon-answer-text') : t(l, 'solar-noon-answer-text-2'), value4: summer ? t(l, 'solar-noon-answer-text-3') : '' });
    }),
  };
};
