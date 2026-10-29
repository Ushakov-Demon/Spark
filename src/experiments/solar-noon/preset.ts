import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, PLACE_KYIV, PLACE_NEW_YORK, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { clockText, equalShadowsNoon, GNOMON_HEIGHT, gnomonClock, gnomonPlace, latitudeFrom, sunOf } from './bench.js';
import type { Locale } from '../../knowledge/i18n.js';
import { offsetText } from '../../scenarios/place-time.js';
import { parsePlace } from '../../scenarios/place.js';
import { sig } from '../../explain/format.js';

export const preset_solar_noon: Preset = varied(
  {
    id: 'solar-noon',
    ask: { uk: 'О котрій годині за годинником настає справжній полудень?', en: 'At what time by the clock does the true noon come?' },
    grade: 7,
    topic: INTERACTION,
    title: { uk: 'Гномон: полудень, годинник і широта', en: 'A gnomon: the noon, the clock and the latitude' },
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'gnomon',
    choices: [ch('noon', 'Рівно о 12:00 — на те він і полудень', 'At 12:00 sharp — that is what noon is'), ch('later', 'Пізніше 12:00', 'Later than 12:00'), ch('earlier', 'Раніше 12:00', 'Earlier than 12:00')],
    answerOnBoard: ['gn:'],
    formulas: ['mechanics.noon-latitude'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'закономірностей руху небесних тіл і обліком часу' }],
    expect: 'reached',
  },
  {
    // The place: any town (by its name): its longitude, latitude and clock decide the noon and the shadow.
    controls: [{ id: 'place', label: { uk: 'Місто', en: 'City' }, kind: 'place', value: PLACE_KYIV, en: PLACE_NEW_YORK }],
    build: (v) => {
      const value = String(v['place']);
      const name = parsePlace(value)?.name ?? 'Київ';
      return {
        question: {
          uk: `20 березня 2026 року — день весняного рівнодення. На шкільному подвір’ї (${name}) ставимо прямовисно метрову палицю — гномон — і рулеткою щопівгодини міряємо її тінь, за місцевим годинником. Найкоротша тінь — справжній полудень: Сонце стоїть найвище за день. О котрій годині за годинником він настане?`,
          en: `20 March 2026 is the spring equinox. In a school yard (${name}) we stand a metre stick — a gnomon — upright and measure its shadow with a tape every half hour by the local clock. The shortest shadow is the true noon: the Sun stands highest of the day. At what time by the clock will it come?`,
        },
        plan: (['morning', 'noon', 'afternoon'] as const).map((series) => ({ kind: 'bench', command: { type: 'lab.gnomon', place: value, series } }) as const),
      };
    },
  },
);

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
  const min = (x: number, l: Locale) => `${sig(Math.abs(x), 2, l)} ${l === 'uk' ? 'хв' : 'min'}`;
  const deg = (x: number, l: Locale, k = 3) => `${sig(x, k, l).replace('-', '−')}°`;
  const lonText = (x: number, l: Locale) => `${sig(Math.abs(x), 3, l)}° ${x >= 0 ? (l === 'uk' ? 'сх. д.' : 'E') : l === 'uk' ? 'зх. д.' : 'W'}`;
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      l === 'uk'
        ? `Сонце за добу обходить небо, бо Земля обертається: 360° за 24 години, тобто 1° за 4 хвилини. Справжній полудень настає, коли Сонце найвище над саме твоїм місцем, — тому в кожному меридіані він свій. Щоб не мати в кожному місті свого часу, годинники цілої зони йдуть за одним меридіаном: на кожну годину від Гринвіча — 15°. Місто, що лежить на схід від свого меридіана, бачить полудень раніше, на захід — пізніше, на 4 хвилини на кожен градус. Ще кілька хвилин додає рівняння часу: Земля обходить Сонце нерівномірно (орбіта — еліпс) і з нахиленою віссю, тож справжня сонячна доба протягом року то трохи довша, то коротша за 24 години; на початку весни сонячний полудень запізнюється на 7–8 хвилин. А де годинники переводять на літній час, полудень за годинником настає ще на годину пізніше.\n\nЗ тієї самої тіні знаходять і широту. У полудень Сонце найвище: h = arctg(H/L). У день рівнодення воно над екватором, і його висота опівдні дорівнює 90° мінус широта; в інші дні — поправка на схилення δ. На північ від тропіків полуденна тінь падає на північ, у південній півкулі — на південь. Так мореплавці визначали широту за полуденним Сонцем.`
        : `The Sun goes round the sky in a day because the Earth turns: 360° in 24 hours, 1° in 4 minutes. The true noon comes when the Sun is highest over your very place — so each meridian has its own. Not to have a time of its own in every town, a whole zone's clocks keep one meridian: 15° for each hour from Greenwich. A town east of its meridian sees noon earlier, west of it later, by 4 minutes a degree. A few more minutes come from the equation of time: the Earth goes round the Sun unevenly (the orbit is an ellipse) and with its axis tilted, so the true solar day is a little longer or shorter than 24 hours through the year; in early spring the solar noon is 7–8 minutes late. And where the clocks go to summer time, noon by the clock comes an hour later still.\n\nThe same shadow gives the latitude. At noon the Sun is highest: h = arctan(H/L). On an equinox it stands over the equator, and its noon height is 90° less the latitude; on other days, a correction for the declination δ. North of the tropics the noon shadow points north, in the southern hemisphere south. That is how sailors found their latitude by the noon Sun.`,
    ),
    say: both((l) => (noon === null ? '' : l === 'uk' ? `Справжній полудень (${place.name}) — о ${clockText(noon)} за годинником!` : `The true noon (${place.name}) — at ${clockText(noon)} by the clock!`)),
    text: both((l) => {
      if (noon === null || !found) return '';
      const uk = l === 'uk';
      const p0 = found.pairs[0]!;
      const lonPart = Math.abs(byLon) < 0.5 ? (uk ? 'майже на ньому самому' : 'almost on it') : uk ? `${byLon < 0 ? 'на схід' : 'на захід'} від нього на ${deg(Math.abs(meridian - place.lon), l, 2)} — полудень ${byLon < 0 ? 'раніше' : 'пізніше'} на ${min(byLon, l)}` : `${byLon < 0 ? 'east' : 'west'} of it by ${deg(Math.abs(meridian - place.lon), l, 2)} — noon ${byLon < 0 ? 'earlier' : 'later'} by ${min(byLon, l)}`;
      const total = byLon + (summer ? 60 : 0) - eq;
      return uk
        ? `Найкоротша тінь — ${sig(L, 3, l)} м, на ${south ? 'південь' : 'північ'}. Рівні тіні: ${clockText(p0.t1)} і ≈ ${clockText(p0.t2)} (${sig(p0.length, 3, l)} м), посередині — ${clockText((p0.t1 + p0.t2) / 2)}; у середньому з ${found.pairs.length} пар полудень настав о ${clockText(noon)}. Годинники тут показують ${offsetText(zone)}${summer ? ' — літній час, на годину вперед' : ''}; поясний меридіан — ${lonText(meridian, l)}, а місто (${lonText(place.lon, l)}) — ${lonPart}. Рівняння часу 20 березня додає ще ${min(eq, l)} (за формулою NOAA). Разом: 12:00 ${total >= 0 ? '+' : '−'} ${min(total, l)} ≈ ${clockText(720 + total)}. Висота Сонця опівдні h = arctg(1 / ${sig(L, 3, l)}) ≈ ${deg(h, l)}, широта ≈ ${deg(phi, l)} (δ ≈ ${deg(d, l, 1)}); насправді — ${deg(place.lat, l, 4)}.`
        : `The shortest shadow — ${sig(L, 3, l)} m, pointing ${south ? 'south' : 'north'}. Equal shadows: ${clockText(p0.t1)} and ≈ ${clockText(p0.t2)} (${sig(p0.length, 3, l)} m), midway — ${clockText((p0.t1 + p0.t2) / 2)}; the mean of ${found.pairs.length} pairs puts noon at ${clockText(noon)}. The clocks here keep ${offsetText(zone)}${summer ? ' — summer time, an hour on' : ''}; the zone's meridian is ${lonText(meridian, l)}, and the town (${lonText(place.lon, l)}) lies ${lonPart}. The equation of time on 20 March adds ${min(eq, l)} more (NOAA's formula). Together: 12:00 ${total >= 0 ? '+' : '−'} ${min(total, l)} ≈ ${clockText(720 + total)}. The Sun's noon height h = arctan(1 / ${sig(L, 3, l)}) ≈ ${deg(h, l)}, the latitude ≈ ${deg(phi, l)} (δ ≈ ${deg(d, l, 1)}); in fact ${deg(place.lat, l, 4)}.`;
    }),
  };
};
