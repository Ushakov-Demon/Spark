import { isSupply } from '../../domains/electrical/entities.js';
import { electrolysisGases } from '../../domains/electrical/gases.js';
import { cellReading } from '../../domains/electrical/conductivity.js';
import { isThermalBody } from '../../domains/thermal/entities.js';
import { COMPONENTS } from '../../components/index.js';
import { formatQuantity, sig } from '../../explain/format.js';
import { tr } from '../../knowledge/i18n.js';
import type { SystemState } from '../../core/state.js';
import type { Operation } from './types.js';

const supplyOf = (s: SystemState) => Object.values(s.entities).find(isSupply);

/**
 * Pass a direct current through the liquid for a set time: two electrodes, a
 * power supply. The current heats the liquid (Joule–Lenz) and, above the
 * decomposition voltage, splits it (Faraday: gases at the electrodes).
 */
export const PASS_CURRENT: Operation = {
  id: 'pass-current',
  label: { uk: 'Пропустити струм', en: 'Pass a current' },
  uses: 'supply',
  direction: 'heating',
  duration: { default: 10, min: 1, max: 600 },
  speed: 60,
  startTemp: () => 20,
  reached: (_b, p, _sub, state) => (supplyOf(state)?.state.time ?? 0) >= (p.duration ?? 10) * 60 - 1e-6,
  markers: ['boiling'],
  durationWord: { uk: '', en: '' },
  verbs: {
    past: { uk: { f: 'пробула під струмом', m: 'пробув під струмом', n: 'пробуло під струмом' }, en: 'was under current for' },
    future: { uk: 'пробуде під струмом', en: 'be under current for' },
  },
  reachedNotes({ sample, state, initial, locale }) {
    const uk = locale === 'uk';
    const supply = supplyOf(state);
    if (!supply) return [];
    const q = (v: number, unit: string) => formatQuantity(v, unit, { locale, level: 'school' });
    const out: string[] = [];
    const s0 = initial.entities[supply.id];
    const charge0 = s0 && isSupply(s0) ? s0.state.charge : 0;
    const charge = supply.state.charge - charge0;
    const time = supply.state.time - (s0 && isSupply(s0) ? s0.state.time : 0);
    const mean = time > 0 ? charge / time : 0;
    if (!(mean > 1e-4)) {
      const reading = cellReading(sample);
      const insulating = reading.conductivity < 1e-3;
      out.push(
        uk
          ? insulating
            ? 'Струм майже не йшов: ця рідина майже не проводить електрику — у ній мало йонів, які могли б переносити заряд.'
            : `Струм майже не йшов: напруги не вистачає навіть на те, щоб почати розкладати рідину (потрібно щонайменше ${sig(reading.electrolysis?.voltage.value ?? 0, 3, 'uk')} В).`
          : insulating
            ? 'Almost no current flowed: this liquid barely conducts electricity — it has few ions to carry the charge.'
            : `Almost no current flowed: the voltage is not even enough to start splitting the liquid (at least ${sig(reading.electrolysis?.voltage.value ?? 0, 3, 'en')} V is needed).`,
      );
      return out;
    }
    const R = supply.state.resistance;
    out.push(
      uk
        ? `Середній струм ${q(mean, 'A')}${R !== null ? `, опір рідини між електродами зараз ${q(R, 'Ω')}` : ''}. Через рідину пройшов заряд ${q(charge, 'C')}.`
        : `Mean current ${q(mean, 'A')}${R !== null ? `, the liquid between the electrodes now has ${q(R, 'Ω')}` : ''}. A charge of ${q(charge, 'C')} passed through the liquid.`,
    );
    const b0 = initial.entities[sample.id];
    if (b0 && isThermalBody(b0)) {
      const dT = sample.state.temperature - b0.state.temperature;
      if (Math.abs(dT) >= 0.1) {
        out.push(
          uk
            ? `Струм нагрів рідину на ${sig(dT, 2, 'uk')} °C — це теплота Джоуля–Ленца: що більший струм, то сильніше гріє (Q = I²Rt).`
            : `The current warmed the liquid by ${sig(dT, 2, 'en')} °C — Joule heat: the larger the current, the stronger the heating (Q = I²Rt).`,
        );
      }
    }
    const e = cellReading(sample).electrolysis;
    if (e) {
      const gases = electrolysisGases(e, charge, b0 && isThermalBody(b0) ? b0.state.temperature : 293.15);
      const list = gases.map((g) => `${q(g.volume * 1e6, 'mL')} ${tr(COMPONENTS[g.component].genitive ?? COMPONENTS[g.component].name, locale).toLowerCase()}`).join(uk ? ' і ' : ' and ');
      out.push(uk ? `На електродах виділилося приблизно ${list} (закон Фарадея).` : `About ${list} formed at the electrodes (Faraday's law).`);
      if (e.note) out.push(tr(e.note, locale));
      const anode = COMPONENTS[e.anode.component as keyof typeof COMPONENTS];
      if (anode?.hazards?.irritant && anode.safety?.school) out.push(`⚠ ${tr(anode.safety.school, locale)}`);
    }
    if (supply.params.capacity !== undefined && supply.state.charge >= supply.params.capacity) {
      out.push(uk ? 'Батарейка розрядилася — струм припинився.' : 'The battery ran flat — the current stopped.');
    }
    return out;
  },
};
