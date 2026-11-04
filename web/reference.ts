/**
 * The reference card ("довідка") that slides over the lab: what a substance or a
 * piece of equipment is, its physical and chemical properties, each value with
 * its conditions, how well it is checked and where it comes from.
 * Everything is read from the component models and the equipment catalog.
 */
import { COMPONENTS, molarMass, type Component, type ComponentId, type Phase, type PhaseProps } from '../src/components/index.js';
import type { EquipmentItem } from '../src/equipment/types.js';
import { MATERIALS } from '../src/domains/thermal/materials.js';
import { formatQuantity, sig } from '../src/explain/format.js';
import { tr, type Locale, type LocalizedText } from '../src/knowledge/i18n.js';
import { textFor, type Level } from '../src/knowledge/levels.js';
import { msg, t as tl } from '../src/knowledge/messages.js';
import { getSource } from '../src/knowledge/sources.js';
import type { SourcedValue } from '../src/knowledge/types.js';
import { RECIPES, type RecipeId } from '../src/recipes/index.js';
import type { SubstanceItem } from '../src/substances/types.js';

export type RefTarget = { readonly kind: 'substance'; readonly item: SubstanceItem } | { readonly kind: 'component'; readonly id: ComponentId } | { readonly kind: 'equipment'; readonly item: EquipmentItem };

interface Ctx {
  readonly locale: Locale;
  readonly level: Level;
}

const T = {
  passport: msg('reference-t-passport'),
  formula: msg('reference-t-formula'),
  molar: msg('reference-t-molar'),
  madeOf: msg('reference-t-made-of'),
  kind: msg('reference-t-kind'),
  kinds: { element: msg('reference-kinds-element'), compound: msg('reference-kinds-compound'), material: msg('reference-kinds-material') },
  atRoom: msg('reference-t-at-room'),
  states: { solid: msg('reference-states-solid'), liquid: msg('reference-states-liquid'), gas: msg('reference-states-gas') },
  phases: msg('reference-t-phases'),
  density: msg('reference-t-density'),
  heat: msg('reference-t-heat'),
  cond: msg('reference-t-cond'),
  transitions: msg('reference-t-transitions'),
  melting: msg('reference-t-melting'),
  boiling: msg('reference-t-boiling'),
  sublimation: msg('reference-t-sublimation'),
  decomposes: msg('reference-t-decomposes'),
  latent: msg('reference-t-latent'),
  water: msg('reference-t-water'),
  solubility: msg('reference-t-solubility'),
  miscible: msg('reference-t-miscible'),
  immiscible: msg('reference-t-immiscible'),
  ions: msg('reference-t-ions'),
  electric: msg('reference-t-electric'),
  conducts: { metal: msg('reference-conducts-metal'), 'ions-in-solution': msg('reference-conducts-ions-in-solution'), insulator: msg('reference-conducts-insulator') },
  resistivity: msg('reference-t-resistivity'),
  conductivity: msg('reference-t-conductivity'),
  magnetic: { ferromagnetic: msg('reference-magnetic-ferromagnetic'), paramagnetic: msg('reference-magnetic-paramagnetic'), diamagnetic: msg('reference-magnetic-diamagnetic') },
  hazards: msg('reference-t-hazards'),
  flags: { flammable: msg('reference-flags-flammable'), corrosive: msg('reference-flags-corrosive'), irritant: msg('reference-flags-irritant'), oxidizer: msg('reference-flags-oxidizer'), asphyxiant: msg('reference-flags-asphyxiant') },
  flash: msg('reference-t-flash'),
  notes: msg('reference-t-notes'),
  sources: msg('reference-t-sources'),
  recipe: msg('reference-t-recipe'),
  recipeNote: msg('reference-t-recipe-note'),
  spec: msg('reference-t-spec'),
  verification: { 'cross-checked': msg('reference-verification-cross-checked'), 'single-source': msg('reference-verification-single-source'), estimate: msg('reference-verification-estimate') },
};

const t = (x: LocalizedText, c: Ctx) => tr(x, c.locale);
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** Collects the sources cited on the card, in order of first use. */
class Cites {
  readonly ids: string[] = [];
  mark(v: SourcedValue): string {
    const nums = [...new Set(v.citations.map((c) => c.source))].map((id) => {
      if (!this.ids.includes(id)) this.ids.push(id);
      return this.ids.indexOf(id) + 1;
    });
    return nums.map((n) => `<sup>[${n}]</sup>`).join('');
  }
}

/** A value in the reader's units; measurement conditions and data notes (kept in English in the data) only for advanced readers. */
function value(v: SourcedValue, c: Ctx, cites: Cites, unit = v.unit): string {
  const badge = v.verification === 'cross-checked' ? 'ok' : v.verification === 'estimate' ? 'est' : 'one';
  const shown = unit === '' ? sig(v.value, 4, c.locale) : unit === 'm' && v.value < 0.1 ? `${sig(v.value * 1000, 3, c.locale)} ${tl(c.locale, 'unit-sym-mm')}` : unit === '°C' ? `${sig(v.value, 4, c.locale)} °C` : formatQuantity(v.value, unit, { locale: c.locale, level: 'school' });
  const deep = c.level === 'advanced' || c.level === 'expert';
  return `<span class="v">${esc(shown)}</span>${cites.mark(v)} <span class="ver ${badge}">${esc(t(T.verification[v.verification], c))}</span>${deep && v.conditions ? `<small> · ${esc(v.conditions)}</small>` : ''}${deep && v.note ? `<div class="vnote">${esc(v.note)}</div>` : ''}`;
}

const row = (label: string, html: string) => `<tr><th>${esc(label)}</th><td>${html}</td></tr>`;
const section = (title: string, rows: string[]) => (rows.length ? `<h3>${esc(title)}</h3><table class="ref-table">${rows.join('')}</table>` : '');

function phaseRows(p: PhaseProps | undefined, c: Ctx, cites: Cites): string[] {
  if (!p) return [];
  return [
    ...(p.density ? [row(t(T.density, c), value(p.density, c, cites))] : []),
    ...(p.specificHeat ? [row(t(T.heat, c), value(p.specificHeat, c, cites))] : []),
    ...(p.conductivity ? [row(t(T.cond, c), value(p.conductivity, c, cites))] : []),
  ];
}

function componentHtml(comp: Component, c: Ctx, cites: Cites): string {
  const parts: string[] = [];
  const m = molarMass(comp);
  parts.push(
    section(t(T.passport, c), [
      ...(comp.formula ? [row(t(T.formula, c), `<b>${esc(comp.formula)}</b>`)] : []),
      row(t(T.kind, c), esc(t(T.kinds[comp.kind], c))),
      ...(m ? [row(t(T.molar, c), `${sig(m * 1000, 5, c.locale)} ${tl(c.locale, 'reference-molar-unit')}`)] : []),
      ...(comp.madeOf ? [row(t(T.madeOf, c), esc(comp.madeOf.map((x) => `${t(x.part, c)}${x.fraction ? ` ≈ ${Math.round(x.fraction * 100)} %` : ''}`).join(', ')))] : []),
      row(t(T.atRoom, c), esc(t(T.states[comp.stateAtRoom], c))),
    ]),
  );
  for (const ph of ['solid', 'liquid', 'gas'] as Phase[]) {
    const p = comp.phases[ph];
    const rows = phaseRows(p, c, cites);
    if (rows.length) parts.push(section(`${t(T.phases, c)}: ${p?.name ? t(p.name, c).toLowerCase() : t(T.states[ph], c)}`, rows));
  }
  const tr2: string[] = [];
  if (comp.melting) tr2.push(row(t(T.melting, c), value(comp.melting.point, c, cites) + (comp.melting.latentHeat ? `<div>${esc(t(T.latent, c))}: ${value(comp.melting.latentHeat, c, cites)}</div>` : '')));
  if (comp.boiling) tr2.push(row(t(T.boiling, c), value(comp.boiling.point, c, cites) + (comp.boiling.latentHeat ? `<div>${esc(t(T.latent, c))}: ${value(comp.boiling.latentHeat, c, cites)}</div>` : '')));
  if (comp.sublimation) tr2.push(row(t(T.sublimation, c), value(comp.sublimation.point, c, cites)));
  if (comp.decomposes) tr2.push(row(t(T.decomposes, c), value(comp.decomposes.point, c, cites) + (comp.decomposes.into ? `<div>→ ${esc(t(comp.decomposes.into, c))}</div>` : '')));
  parts.push(section(t(T.transitions, c), tr2));
  const w = comp.inWater;
  if (w) {
    const sol = w.solubility === 'miscible' ? esc(t(T.miscible, c)) : w.solubility === 'immiscible' ? esc(t(T.immiscible, c)) : value(w.solubility, c, cites);
    parts.push(section(t(T.water, c), [row(t(T.solubility, c), sol), ...(w.ions ? [row(t(T.ions, c), esc(w.ions.join(' + ')))] : [])]));
  }
  const e = comp.electrical;
  const el: string[] = [];
  if (e) {
    el.push(row(t(T.conductivity, c), esc(t(T.conducts[e.conducts], c)) + (e.conductivity ? `<div>${value(e.conductivity, c, cites)}</div>` : '')));
    if (e.resistivity) el.push(row(t(T.resistivity, c), value(e.resistivity, c, cites)));
  }
  if (comp.magnetic) el.push(row(tl(c.locale, 'reference-magnetism'), esc(t(T.magnetic[comp.magnetic], c))));
  parts.push(section(t(T.electric, c), el));
  const h = comp.hazards;
  const flags = h ? (Object.keys(T.flags) as (keyof typeof T.flags)[]).filter((k) => h[k]).map((k) => t(T.flags[k], c)) : [];
  const hz: string[] = [];
  if (flags.length) hz.push(row(tl(c.locale, 'reference-flags'), esc(flags.join(', '))));
  if (h?.flashPoint) hz.push(row(t(T.flash, c), value(h.flashPoint, c, cites)));
  if (comp.safety) hz.push(row('⚠', esc(t(textFor(comp.safety, c.level), c))));
  parts.push(section(t(T.hazards, c), hz));
  if (comp.modelNotes?.length) parts.push(`<h3>${esc(t(T.notes, c))}</h3><ul>${comp.modelNotes.map((n) => `<li>${esc(t(n, c))}</li>`).join('')}</ul>`);
  return parts.join('');
}

function equipmentHtml(item: EquipmentItem, c: Ctx, cites: Cites): string {
  const rows: string[] = [];
  const add = (label: string, html: string) => rows.push(row(label, html));
  switch (item.kind) {
    case 'heater': {
      const s = item.spec;
      add(tl(c.locale, 'reference-ratings'), `${s.ratings.map((r) => `${sig(r, 4, c.locale)} ${tl(c.locale, 'unit-sym-W')}`).join(' / ')}${cites.mark(s.ratingData)}`);
      if (s.vesselShare) add(tl(c.locale, 'reference-vessel-share'), value(s.vesselShare, c, cites));
      if (s.contactConductance) add(tl(c.locale, 'reference-base-contact'), value(s.contactConductance, c, cites));
      break;
    }
    case 'vessel': {
      const s = item.spec;
      add(tl(c.locale, 'reference-materials'), esc(s.materials.map((m) => (m in MATERIALS ? t(MATERIALS[m as keyof typeof MATERIALS].name, c).toLowerCase() : m)).join(', ')));
      add(tl(c.locale, 'reference-volume'), esc(s.sizes.map((z) => (z < 1 ? `${Math.round(z * 1000)} ${tl(c.locale, 'unit-sym-mL')}` : `${z} ${tl(c.locale, 'unit-sym-L')}`)).join(', ')));
      add(tl(c.locale, 'reference-wall'), value(s.wallThickness, c, cites));
      add(tl(c.locale, 'reference-lid'), s.lid === 'optional' ? (tl(c.locale, 'reference-lid-optional')) : tl(c.locale, 'reference-lid-none'));
      break;
    }
    case 'cooler': {
      const s = item.spec;
      add(tl(c.locale, 'reference-temperature'), `${s.setpoint.min === s.setpoint.max ? `${s.setpoint.default} °C` : `${s.setpoint.min}…${s.setpoint.max} °C`}${cites.mark(s.setpoint.data)}`);
      break;
    }
    case 'scale': {
      const s = item.spec;
      add(tl(c.locale, 'reference-capacity'), value(s.capacity, c, cites));
      add(tl(c.locale, 'reference-division'), value(s.resolution, c, cites));
      break;
    }
    case 'supply': {
      const s = item.spec;
      add(tl(c.locale, 'reference-voltage'), `${s.voltage.min === s.voltage.max ? `${s.voltage.max} ${tl(c.locale, 'unit-sym-V')}` : `${s.voltage.min}–${s.voltage.max} ${tl(c.locale, 'unit-sym-V')}`}${cites.mark(s.voltage.data)}`);
      add(tl(c.locale, 'reference-current-limit'), value(s.currentLimit, c, cites));
      if (s.internalResistance) add(tl(c.locale, 'reference-internal-resistance'), value(s.internalResistance, c, cites));
      if (s.capacity) add(tl(c.locale, 'reference-battery-capacity'), value(s.capacity, c, cites));
      break;
    }
  }
  return section(t(T.spec, c), rows) + (item.safety ? `<h3>${esc(t(T.hazards, c))}</h3><p>⚠ ${esc(t(textFor(item.safety, c.level), c))}</p>` : '');
}

/** The card's HTML. `open(id)` links lead to the components of a recipe. */
export function referenceHtml(target: RefTarget, c: Ctx): string {
  const cites = new Cites();
  let title = '';
  let lead = '';
  let body = '';
  if (target.kind === 'equipment') {
    title = t(target.item.name, c);
    lead = t(textFor(target.item.description, c.level), c);
    body = equipmentHtml(target.item, c, cites);
  } else {
    const sub = target.kind === 'substance' ? target.item : undefined;
    const compId = target.kind === 'component' ? target.id : (sub?.component as ComponentId | undefined);
    const recipe = sub?.recipe ? RECIPES[sub.recipe as RecipeId] : undefined;
    if (recipe) {
      title = t(recipe.name, c);
      lead = t(textFor(recipe.description, c.level), c);
      const parts = recipe.parts.map((p) => `<li><button type="button" class="link" data-ref="${p.component}">${esc(t(COMPONENTS[p.component].name, c))}</button> — ${sig(p.fraction * 100, 3, c.locale)} %</li>`).join('');
      // The proportion's own source (sea water salinity), then what the model computes for the mix.
      const basis = recipe.basis
        ? `<p>${tl(c.locale, 'reference-salinity')}: <b>${sig(recipe.basis.value * 100, 3, c.locale)} %</b>${cites.mark(recipe.basis)}</p>`
        : '';
      const mix = sub
        ? section(tl(c.locale, 'reference-mix'), [
            row(t(T.density, c), value(sub.liquid.density, c, cites)),
            row(t(T.heat, c), value(sub.liquid.specificHeat, c, cites)),
            ...(sub.freezing ? [row(tl(c.locale, 'reference-mix-freezes'), value(sub.freezing.point, c, cites))] : []),
            ...(sub.boiling ? [row(tl(c.locale, 'reference-mix-boils'), value(sub.boiling.point, c, cites))] : []),
          ])
        : '';
      body = `<h3>${esc(t(T.recipe, c))}</h3><ul>${parts}</ul><p class="muted small">${esc(t(T.recipeNote, c))}</p>${basis}${mix}${(recipe.notes ?? []).map((n) => `<p class="muted small">ℹ ${esc(t(n, c))}</p>`).join('')}`;
    } else if (compId && COMPONENTS[compId]) {
      const comp = COMPONENTS[compId];
      title = sub ? t(sub.name, c) : t(comp.name, c);
      lead = t(textFor(comp.description, c.level), c);
      body = componentHtml(comp, c, cites);
    }
  }
  const sources = cites.ids.length
    ? `<h3>${esc(t(T.sources, c))}</h3><ol class="ref-sources">${cites.ids
        .map((id) => {
          const s = getSource(id);
          return `<li>${s ? (s.url ? `<a href="${s.url}" target="_blank" rel="noopener">${esc(s.title)}</a>` : esc(s.title)) : esc(id)}</li>`;
        })
        .join('')}</ol>`
    : '';
  return `<h2>${esc(title)}</h2><p class="ref-lead">${esc(lead)}</p>${body}${sources}`;
}
