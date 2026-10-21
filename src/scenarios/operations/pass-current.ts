import { isSupply } from '../../domains/electrical/entities.js';
import { cellReaction, GAS_CONSTANT, molesToMass, type Supply } from '../../domains/electrical/index.js';
import { SUBSTANCES, type SubstanceId } from '../../substances/catalog.js';
import type { ComponentId } from '../../components/index.js';
import type { ThermalBody } from '../../domains/thermal/entities.js';
import type { Locale } from '../../knowledge/i18n.js';
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
  icon: 'current',
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
    out.push(...electrolysisLines(supply, s0 && isSupply(s0) ? s0 : undefined, sample, state, b0 && isThermalBody(b0) ? b0.state.temperature : 293.15, locale));
    if (supply.params.capacity !== undefined && supply.state.charge >= supply.params.capacity) {
      out.push(uk ? 'Батарейка розрядилася — струм припинився.' : 'The battery ran flat — the current stopped.');
    }
    return out;
  },
};

/**
 * What the current made, from the cell's own record (Faraday at each electrode, step by step):
 * gases, an anode that dissolved, a sludge, metal lying in the liquid that became an electrode itself.
 */
function electrolysisLines(supply: Supply, before: Supply | undefined, sample: ThermalBody, state: SystemState, T: number, locale: Locale): string[] {
  const uk = locale === 'uk';
  const out: string[] = [];
  const now = supply.state.made ?? {};
  const was = before?.state.made ?? {};
  const made = (key: string) => (now[key] ?? 0) - (was[key] ?? 0);
  // Only the first letter: «гідроксиду заліза(II)» keeps its numeral.
  const name = (c: string, gen = true) => lowerFirst(tr((gen ? COMPONENTS[c as ComponentId]?.genitive : undefined) ?? COMPONENTS[c as ComponentId]?.name ?? { uk: c, en: c }, locale));
  const V = (x: number) => `${sig(x, 3, locale).replace('-', '−')} ${uk ? 'В' : 'V'}`;
  const mL = (moles: number) => formatQuantity(((moles * GAS_CONSTANT * T) / 101_325) * 1e6, 'mL', { locale, level: 'school' });
  const g = (c: string, moles: number) => `${sig(molesToMass(c as ComponentId, moles) * 1000, 3, locale)} ${uk ? 'г' : 'g'}`;
  const gases = (prefix: string) => (['hydrogen', 'chlorine', 'oxygen'] as const).filter((c) => made(prefix + c) > 1e-9);
  // The electrodes.
  const reading = cellReading(sample);
  const reaction = reading.electrolysis ? cellReaction(reading.electrolysis, supply.params.electrodes?.material) : undefined;
  const g0 = gases('');
  if (g0.length) {
    const list = g0.map((c) => `${mL(made(c))} ${name(c)}`).join(uk ? ' і ' : ' and ');
    out.push(uk ? `На електродах виділилося приблизно ${list} (закон Фарадея).` : `About ${list} formed at the electrodes (Faraday's law).`);
  }
  const metals = Object.keys(now).filter((k) => k.startsWith('-') && made(k) > 1e-9);
  for (const k of metals) {
    const metal = k.slice(1);
    const e = COMPONENTS[metal as ComponentId]?.electrical?.electrode;
    const ion = e && 'ion' in e ? e.ion : '';
    const liquidAnode = reading.electrolysis?.anode;
    const material = supply.params.electrodes?.material ?? metal;
    const formula = COMPONENTS[metal as ComponentId]?.formula ?? '';
    const z = e && 'electrons' in e ? e.electrons : 2;
    const E = e && 'potential' in e ? e.potential.value : 0;
    out.push(
      uk
        ? `Анод розчинявся (він із матеріалу «${name(material, false)}»): у розчин перейшло ${g(metal, made(k))} ${name(metal)} (${formula} → ${ion} + ${z}e⁻).${liquidAnode ? ` ${name(liquidAnode.component, false).replace(/^./, (x) => x.toUpperCase())} не виділявся: метал окиснюється легше (E° = ${V(E)} проти ${V(liquidAnode.potential?.value ?? 0)}).` : ''}`
        : `The anode (made of ${name(material, false)}) dissolved: ${g(metal, made(k))} of ${name(metal)} went into solution (${formula} → ${ion} + ${z}e⁻).${liquidAnode ? ` No ${name(liquidAnode.component, false)} formed: the metal is oxidised more easily (E° = ${V(E)} against ${V(liquidAnode.potential?.value ?? 0)}).` : ''}`,
    );
  }
  // A metal that settles on the cathode (copper from copper sulfate) is a coating, not a sludge.
  const isMetal = (c: string) => COMPONENTS[c as ComponentId]?.group === 'metal';
  for (const k of Object.keys(now).filter((x) => !x.includes('|') && !x.startsWith('-') && isMetal(x) && made(x) > 1e-9)) {
    const ion = COMPONENTS[k as ComponentId]?.formula ?? '';
    out.push(uk ? `На катоді осіла ${name(k, false)}: ${g(k, made(k))} (${ion}²⁺ + 2e⁻ → ${ion}) — катод вкрився шаром металу.` : `${name(k, false).replace(/^./, (x) => x.toUpperCase())} settled on the cathode: ${g(k, made(k))} (${ion}²⁺ + 2e⁻ → ${ion}) — the cathode is coated with metal.`);
  }
  const sludges = Object.keys(now).filter((k) => !k.includes('|') && !k.startsWith('-') && !isMetal(k) && COMPONENTS[k as ComponentId]?.stateAtRoom === 'solid' && made(k) > 1e-9);
  for (const c of sludges) out.push(sludgeLine(c, g(c, made(c)), locale));
  // Metal lying in the liquid: a bipolar electrode.
  const pieceIds = [...new Set(Object.keys(now).filter((k) => k.includes('|')).map((k) => k.split('|')[0]!))];
  for (const id of pieceIds) {
    const piece = state.entities[id as never] as ThermalBody | undefined;
    const label = piece?.label ? tr(piece.label, locale) : id;
    const lost = Object.keys(now).filter((k) => k.startsWith(`${id}|-`)).reduce((a, k) => a + molesToMass(k.split('|-')[1] as ComponentId, made(k)), 0);
    const gas = Object.keys(now).filter((k) => k.startsWith(`${id}|`) && ['hydrogen', 'chlorine', 'oxygen'].includes(k.split('|')[1]!));
    const sludge = Object.keys(now).filter((k) => k.startsWith(`${id}|`) && !k.includes('|-') && COMPONENTS[k.split('|')[1] as ComponentId]?.stateAtRoom === 'solid');
    if (!(lost > 1e-9)) continue;
    out.push(
      uk
        ? `Шматок «${label}» у розчині сам став електродом, хоча його ні до чого не під’єднували: бік, звернений до катода, розчинявся (втратив ${sig(lost * 1000, 3, locale)} г), а на боці, зверненому до анода, виділялося ${gas.map((k) => `${mL(made(k))} ${name(k.split('|')[1]!)}`).join(' і ')}.`
        : `The piece “${label}” in the solution became an electrode itself, though wired to nothing: its side facing the cathode dissolved (lost ${sig(lost * 1000, 3, locale)} g), and ${gas.map((k) => `${mL(made(k))} of ${name(k.split('|')[1]!)}`).join(' and ')} formed on its side facing the anode.`,
    );
    for (const k of sludge) out.push(sludgeLine(k.split('|')[1]!, g(k.split('|')[1]!, made(k)), locale));
  }
  // Metal in the liquid that would react too, but the model has no data on how.
  if (reaction && (supply.state.charge - (before?.state.charge ?? 0)) > 0) {
    for (const e of Object.values(state.entities)) {
      if (!e.id.startsWith(`${sample.id}+`) || pieceIds.includes(e.id)) continue;
      const sub = 'params' in e && (e.params as { substance?: string }).substance ? SUBSTANCES[(e.params as { substance: string }).substance as SubstanceId] : undefined;
      if (sub?.category !== 'solid.metal') continue;
      const comp = sub.component ? COMPONENTS[sub.component as ComponentId] : undefined;
      if (comp?.electrical?.electrode) continue;
      const label = e.label ? tr(e.label, locale) : tr(sub.name, locale);
      out.push(uk ? `Шматок «${label}» у розчині під струмом теж реагував би (метал у розчині стає електродом), але як саме — модель для цього металу поки не вміє рахувати.` : `The piece “${label}” in the solution would react under the current too (metal in a solution becomes an electrode), but the model cannot yet compute how for this metal.`);
    }
  }
  if (reaction?.note && !metals.length) out.push(tr(reaction.note, locale));
  if (made('chlorine') > 1e-9) {
    const cl = COMPONENTS.chlorine;
    if (cl.hazards?.irritant && cl.safety?.school) out.push(`⚠ ${tr(cl.safety.school, locale)}`);
  }
  return out;
}

/** "A greenish sludge of iron(II) hydroxide fell out: 1.2 g" — with what the component says about it. */
function sludgeLine(c: string, mass: string, locale: Locale): string {
  const comp = COMPONENTS[c as ComponentId];
  const name = lowerFirst(tr(comp?.genitive ?? comp?.name ?? { uk: c, en: c }, locale));
  const formula = comp?.formula ? ` ${comp.formula}` : '';
  return locale === 'uk'
    ? `Йони металу зустріли гідроксид-йони, які утворюються біля катода, — випав осад ${name}${formula}: ${mass}. ${comp ? tr(comp.description.novice ?? comp.description.school, locale) : ''}`
    : `The metal ions met the hydroxide ions formed at the cathode — a sludge of ${name}${formula} fell out: ${mass}. ${comp ? tr(comp.description.novice ?? comp.description.school, locale) : ''}`;
}

const lowerFirst = (x: string) => x.charAt(0).toLowerCase() + x.slice(1);
