/**
 * A ready-made experiment written as a lab work is written in a notebook — kind, grade, title, topic,
 * aim, what it takes, the steps, the formulas, a blank for the conclusion, the programmes. No DOM: the
 * lab shows it in its notebook window, and the site's pages (one per experiment, and the catalogue of
 * them all) are written from it at build time, for people and for search engines alike. No spoilers:
 * the aim is the question; what the steps show is not written.
 */
import { formatQuantity } from '../src/explain/index.js';
import { tr, type Locale } from '../src/knowledge/i18n.js';
import { getCurriculum } from '../src/knowledge/curricula.js';
import { getSource } from '../src/knowledge/sources.js';
import { SCALES } from '../src/equipment/scales.js';
import { SUBSTANCES } from '../src/substances/index.js';
import { BENCH_SETUP, BENCH_TEXT, guidedPlan, LAB_KNOWLEDGE, labSubject, OPERATIONS, presetAsk, presetPrograms, type Preset, type ProtocolStep } from '../src/scenarios/index.js';
import { UI } from './ui-text.js';

export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
/** «Тема 2. Механічний рух» → «Механічний рух»: the numbers differ from book to book. */
export const TOPIC_NUMBER = /^Тема\s*\d+\.\s*/;

/**
 * The steps that may be shown before a prediction is answered: up to the first operation (heating,
 * freezing) or the first «start afresh» — what comes after tells the answer («pour the salt into a crucible, put
 * it in a furnace» says the stove will not melt it). Measurements alone give nothing away and are all shown.
 */
export function unspoiledSteps(steps: readonly ProtocolStep[], predicting: boolean): { shown: readonly ProtocolStep[]; hidden: number } {
  if (!predicting) return { shown: steps, hidden: 0 };
  const fresh = steps.findIndex((s) => s.kind === 'fresh');
  const op = steps.findIndex((s) => s.kind === 'operation');
  const cut = Math.min(fresh < 0 ? steps.length : fresh, op < 0 ? steps.length : op + 1);
  return { shown: steps.slice(0, cut), hidden: steps.length - cut };
}
/** Is the experiment's question a prediction asked before it runs (so its later steps would tell the answer)? */
export const predictsFirst = (p: Preset) => !!p.choices && p.choicesAt !== 'end';

/** A step still to do, as the protocol (and an experiment's description) names it. */
export function planStepLabel(s: ProtocolStep, locale: Locale): string {
  const u = UI[locale];
  return s.kind === 'add' ? u.added(tr(s.label ?? SUBSTANCES[s.substance].name, locale).toLowerCase(), formatQuantity(s.mass, 'kg', { locale, level: 'school' }))
    : s.kind === 'weigh' ? u.weigh.button
    : s.kind === 'level' ? u.measure.level
    : s.kind === 'hang' ? (s.into === 'air' ? u.measure.hangAir : u.measure.hangLiquid)
    : s.kind === 'bench' ? tr(BENCH_TEXT[s.command.type](s.command).button, locale)
    : s.kind === 'fresh' ? `🔄 ${tr(s.label ?? { uk: 'Почати знову', en: 'Start afresh' }, locale)}`
    : `${s.label ? tr(s.label, locale) : tr(OPERATIONS[s.action].label, locale).replace('…', '')}${s.target !== undefined && OPERATIONS[s.action].target ? ` ${s.target} °C` : ''}`;
}

/** The topic of the experiment as its programme names it (without the book's number), or its own. */
export function presetTopic(p: Preset, locale: Locale): string {
  // (The programmes' topics are quoted in Ukrainian: in another language, the experiment's own topic.)
  if (locale !== 'uk') return tr(p.topic, locale);
  const progs = presetPrograms(p);
  return progs.map((x) => x.topic ?? (x.item?.startsWith('Тема') ? x.item : undefined)).find(Boolean)?.replace(TOPIC_NUMBER, '') ?? tr(p.topic, locale);
}

/** What is on the table: the bench's things, the sample, the scales, what goes in. */
export function presetEquipment(p: Preset, locale: Locale): string[] {
  const d = UI[locale].details;
  const things = new Set<string>();
  if (p.bench) for (const x of tr(BENCH_SETUP[p.bench], locale).split(', ')) things.add(x);
  if (!p.bench || p.bench === 'balance') things.add(labSubject(p.params, locale));
  for (const s of guidedPlan(p)) {
    if (s.kind === 'weigh') things.add(tr(SCALES[s.scale].name, locale));
    else if (s.kind === 'hang') things.add(tr(SCALES.dynamometer.name, locale));
    // (A stoppered tube with sand is one thing on the table, whatever is in it each run.)
    else if (s.kind === 'add') things.add(s.volume ? d.tubeWithSand : tr(s.label ?? SUBSTANCES[s.substance].name, locale));
  }
  return [...things];
}

/** «Лабораторна робота № 10» where a programme numbers it. */
export const presetLabNumber = (p: Preset) => presetPrograms(p).map((x) => x.item?.match(/ЛР № (\d+)/)?.[1]).find(Boolean);

export interface SheetOptions {
  /** Shown while it runs: no start button. */
  readonly running?: boolean;
  /** Are the later steps hidden, because they would tell the answer to a prediction still to be made? */
  readonly predicting?: boolean;
  /** Instead of the start button (on the site's page: none — the lab is right above). */
  readonly actions?: string;
}

export function labSheetHtml(p: Preset, locale: Locale, o: SheetOptions = {}): string {
  const u = UI[locale];
  const d = u.details;
  const progs = presetPrograms(p);
  const plan = guidedPlan(p);
  // A step as written in a notebook: no pictograms; what goes in — «Опустити: …». What comes of the steps is not
  // written here (no spoilers): the aim is the question; the formulas without the conditions that answer it.
  const stepText = (s: ProtocolStep) => esc(s.kind === 'add' ? `${d.put}: ${tr(s.label ?? SUBSTANCES[s.substance].name, locale).toLowerCase()}` : planStepLabel(s, locale).replace(/^[^\p{L}\p{N}]+/u, ''));
  // F_A = ρ_рідини · g · V → subscripts.
  const formula = (x: string) => esc(x).replace(/_([^/·=()+−<>;,—&]+?)(?=\s*(?:[/·=()+−<>;,—&]|$))/g, '<sub>$1</sub>');
  const number = presetLabNumber(p);
  const formulas = new Map(LAB_KNOWLEDGE.formulas.map((f) => [f.id, f]));
  const fs = p.formulas.map((id) => formulas.get(id)).filter((f): f is NonNullable<typeof f> => !!f);
  const programs = progs
    .map((x) => {
      const c = getCurriculum(x.program)!;
      const book = x.textbook ? getSource(x.textbook.source) : undefined;
      return `<li>${esc(tr(c.short ?? c.name, locale))}${x.grade !== undefined ? `, ${u.grade(x.grade)}` : ''}${x.item && !x.item.startsWith('Тема') ? `, ${esc(x.item)}` : ''}${x.match === 'related' ? ` (${d.related})` : ''}: «${esc(x.quote)}»${book && x.textbook ? ` — ${esc(book.title.split('. —')[0] ?? '')}, ${esc(x.textbook.at)}` : ''}</li>`;
    })
    .join('');
  const steps = unspoiledSteps(plan, o.predicting ?? false);
  const line = (label: string, body: string) => `<p class="ls-line"><span class="ls-label">${label}.</span> ${body}</p>`;
  return `
    <header class="ls-head"><span class="ls-kind">${number ? d.labWork(number) : d.experiment}</span><span class="ls-grade">${p.grade === null ? u.forEveryone : u.grade(p.grade)}</span></header>
    <h2 class="ls-title">${esc(tr(p.title, locale))}</h2>
    ${line(d.topic, esc(presetTopic(p, locale)))}
    ${line(d.aim, esc(tr(presetAsk(p), locale)))}
    ${line(d.takes, esc(presetEquipment(p, locale).join('; ')))}
    <h3 class="ls-sub">${d.steps}</h3>
    <ol class="ls-steps">${steps.shown.map((s) => `<li>${stepText(s)}</li>`).join('')}${steps.hidden ? `<li class="ls-later">${u.moreSteps(steps.hidden)}</li>` : ''}</ol>
    ${fs.length ? `<h3 class="ls-sub">${d.formulas}</h3><ul class="ls-formulas">${fs.map((f) => `<li><span class="ls-formula">${formula(f.plain.replace(/\s*\(.*\)\s*$/, ''))}</span> — ${esc(tr(f.title, locale).toLowerCase())}</li>`).join('')}</ul>` : ''}
    <h3 class="ls-sub">${d.conclusion}</h3>
    <p class="ls-blank">${d.conclusionHint}</p>
    ${programs ? `<footer class="ls-foot"><span>${u.programs}:</span><ul>${programs}</ul></footer>` : ''}
    ${o.actions ?? (o.running ? '' : `<div class="ls-actions"><button type="button" class="primary" data-ls-start="1">${u.presetStart}</button></div>`)}`;
}
