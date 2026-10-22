import { isThermalBody, type ThermalBody } from '../../domains/thermal/entities.js';
import { formatQuantity } from '../../explain/format.js';
import { K } from './helpers.js';
import type { Operation } from './types.js';

/**
 * How close the temperatures must come to call it equilibrium, K — about what a
 * school thermometer can tell apart. Closer than that the block only trails the
 * water, which keeps cooling slowly in the room.
 */
const CLOSE = 0.3;

/**
 * Wait until everything in the vessel has one temperature: hot water poured
 * into cold, a metal block from boiling water dropped in. Heat goes from the
 * hotter body to the colder one until their temperatures meet — the heat
 * balance of grade 8. No device: the vessel stands in the room (or a cooler).
 */
export const SETTLE: Operation = {
  id: 'settle',
  label: { uk: 'Дочекатися рівноваги', en: 'Wait for equilibrium' },
  icon: 'balance',
  uses: 'either',
  // Neither heating nor cooling as such: the contents may go either way; "cooling" keeps heater fixes away.
  direction: 'cooling',
  speed: 60, // one of the page's speeds (1, 10, 60, 300, 600, 3600)
  startTemp: () => 20,
  reached(sample, p, _sub, state) {
    // Every piece put into the liquid (a block, a lump of ice) has come to the liquid's temperature — a melted
    // ice cube too: its cold water mixes in, and until it has, the thermometer would not show the common temperature.
    const pieces = Object.values(state.entities).filter((e): e is ThermalBody => isThermalBody(e) && e.id.startsWith(`${sample.id}+`));
    if (!pieces.every((e) => isThermalBody(e) && Math.abs(e.state.temperature - sample.state.temperature) < CLOSE)) return false;
    // A body was put in (a block, ice): it was what we waited for. Only plain mixing waits for the walls.
    if (Object.keys(state.entities).some((id) => id.startsWith(`${sample.id}+`))) return true;
    // …and, for plain mixing, so have the vessel's walls (hot water poured into a cold glass warms the glass too). A wall
    // stays a little colder than the liquid while the room cools them both: once the gap is under a tenth of the way to the room (glass settles at ≈ 5 %, steel ≈ 2.5 %), the walls have caught up.
    const vessel = state.entities['vessel' as never];
    if (!vessel || !isThermalBody(vessel)) return true;
    const around = K(p.cooler ? p.cooler.setpoint : p.roomTemp);
    return Math.abs(vessel.state.temperature - sample.state.temperature) < Math.max(CLOSE, 0.1 * Math.abs(sample.state.temperature - around));
  },
  markers: [],
  verbs: {
    past: { uk: { f: 'прийшла до теплової рівноваги', m: 'прийшов до теплової рівноваги', n: 'прийшло до теплової рівноваги' }, en: 'came to thermal equilibrium' },
    future: { uk: 'прийде до теплової рівноваги', en: 'come to thermal equilibrium' },
  },
  reachedNotes: ({ sample, locale }) => [
    locale === 'uk'
      ? `Спільна температура — ${formatQuantity(sample.state.temperature, 'K', { locale, level: 'school' })}.`
      : `The common temperature is ${formatQuantity(sample.state.temperature, 'K', { locale, level: 'school' })}.`,
  ],
  needsAdded: {
    uk: 'Щоб чекати рівноваги, спершу поклади щось у воду: гарячий металевий брусок або долий окропу (праворуч, «Додати під час досліду»).',
    en: 'To wait for equilibrium, first put something into the water: a hot metal block, or pour in boiling water (on the right, “Add during the experiment”).',
  },
  says: {
    uk: 'Теплота переходить від гарячішого тіла до холоднішого — аж поки температури не зрівняються.',
    en: 'Heat flows from the hotter body to the colder one — until their temperatures are equal.',
  },
};
