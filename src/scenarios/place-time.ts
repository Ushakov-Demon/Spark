import type { Place } from './place.js';

/**
 * The clock of a place: its offset from UTC at a moment, hours — from its IANA time zone by the tz database the
 * runtime carries (summer time included); a place without a zone keeps the solar time of the nearest whole hour.
 */
export function zoneOffset(place: Place, utcMs: number): number {
  if (place.zone) {
    try {
      const name = new Intl.DateTimeFormat('en-US', { timeZone: place.zone, timeZoneName: 'longOffset' }).formatToParts(new Date(utcMs)).find((x) => x.type === 'timeZoneName')?.value ?? '';
      // «GMT+05:30», «GMT-04:00», «GMT» (UTC itself).
      const m = /GMT(?:([+-])(\d{1,2}):?(\d{2})?)?$/.exec(name);
      if (m) return m[1] ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) + Number(m[3] ?? 0) / 60) : 0;
    } catch {
      // An unknown zone: by the longitude below.
    }
  }
  return Math.round(place.lon / 15);
}

/** «UTC+2», «UTC−4», «UTC+5:30». */
export function offsetText(hours: number): string {
  const sign = hours < 0 ? '−' : '+';
  const a = Math.abs(hours);
  const h = Math.floor(a);
  const m = Math.round((a - h) * 60);
  return `UTC${sign}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`;
}
