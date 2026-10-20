import type { Command, ExperimentResult, FormulaApplication, Simulation, TraceRecord } from '../core/index.js';
import { sampleAt, traceTick } from '../core/experiment.js';
import type { EntityId } from '../core/ids.js';
import type { SystemState } from '../core/state.js';
import { getCurriculum } from '../knowledge/curricula.js';
import { tr, type Locale } from '../knowledge/i18n.js';
import { atLeast, LEVEL_INFO, textFor, type Level } from '../knowledge/levels.js';
import { getSource } from '../knowledge/sources.js';
import type { FormulaSpec, LawSpec } from '../knowledge/types.js';
import { h, list, note, p, type Block } from './blocks.js';
import type { DataUsage, DomainKnowledge } from './domain.js';
import { formatQuantity, formatTime, sig, unitLabel, type ExplainContext } from './format.js';
import { REPORT_MESSAGES } from './messages.js';

export interface ReportInput<C extends Command> {
  readonly title: string;
  readonly level: Level;
  readonly locale: Locale;
  /** ISO country code whose school programmes to relate formulas to (e.g. 'UA'). Omit to skip. */
  readonly country?: string;
  readonly result: ExperimentResult<C>;
  readonly simulation: Simulation;
  readonly domain: DomainKnowledge<C>;
  /** Moment to explain step by step (default: middle of the run). */
  readonly focusTime?: number;
  /** Headline result written by the scenario ("Water in an aluminium pot on a gas hob boiled in …"). Shown first. */
  readonly summary?: readonly Block[];
}

export const entityLabel = (s: SystemState, id: EntityId | string, locale: Locale): string => {
  const label = s.entities[id as EntityId]?.label;
  return label ? tr(label, locale) : id;
};

/**
 * Builds the explanation of a finished experiment for a reader of `level`, in `locale`.
 * Everything listed under "laws" comes from what the engine actually traced.
 */
export function buildReport<C extends Command>(input: ReportInput<C>): Block[] {
  const { level, locale, result, domain, simulation } = input;
  const ctx: ExplainContext = { level, locale };
  const m = REPORT_MESSAGES[locale];
  const t = (x: Parameters<typeof tr>[0]) => tr(x, locale);
  const formulas = new Map(domain.formulas.map((f) => [f.id, f]));
  const out: Block[] = [];

  out.push(h(1, input.title));
  if (input.summary) out.push(...input.summary);
  out.push(p(m.level(t(LEVEL_INFO[level].name), t(LEVEL_INFO[level].audience))));

  // 1. What happened
  out.push(h(2, m.whatHappened));
  out.push(...domain.timeline(result, ctx));

  // 2. Experimenter's actions
  if (result.log.length) {
    out.push(h(2, m.yourActions));
    const items: string[] = [];
    for (const e of result.log) {
      let line = `${formatTime(e.time, locale)} — ${domain.describeCommand(e, ctx, result.final)}`;
      if (!e.ok) line += ` — ${m.failed(t(e.error))}`;
      else if (atLeast(level, 'school')) {
        for (const r of e.trace) if (r.kind === 'formula') line += `\n    ${describeApplication(r, formulas, result.final, ctx)}`;
      }
      items.push(line);
    }
    out.push(list(items));
  }

  // 3. Laws that were actually used
  out.push(h(2, m.lawsUsed));
  const usedFormulaIds = new Set(result.usage.keys());
  const laws = domain.laws.filter((l) => domain.formulas.some((f) => f.law === l.id && usedFormulaIds.has(f.id)));
  if (!atLeast(level, 'school')) out.push(p(m.lawsIntroNovice));
  for (const law of laws) {
    const used = domain.formulas.filter((f) => f.law === law.id && usedFormulaIds.has(f.id));
    out.push(...explainLaw(law, used, ctx, result, input.country));
  }

  // 4. A moment in detail
  if (atLeast(level, 'school')) {
    const snapshot = sampleAt(result.samples, input.focusTime ?? result.final.time / 2);
    const { records } = traceTick(simulation, snapshot);
    out.push(h(2, m.oneStep(formatTime(snapshot.time, locale))));
    out.push(p(atLeast(level, 'expert') ? m.oneStepIntroExpert : m.oneStepIntro));
    out.push(list(records.flatMap((r) => describeRecord(r, formulas, snapshot, ctx))));
  }

  // 5. Energy balance
  out.push(...domain.energyBalance(result, ctx));

  // 6. Simplifications
  const assumptions = simulation.solvers.flatMap((s) => s.assumptions ?? []);
  const shown = level === 'novice' ? assumptions.filter((a) => a.text.novice) : assumptions;
  if (shown.length) {
    out.push(h(2, level === 'novice' ? m.simplificationsNovice : m.simplifications));
    out.push(list(shown.map((a) => t(textFor(a.text, level)))));
  }

  // 7. Data provenance
  const data = domain.dataUsed(result.final);
  const estimates = data.filter((d) => d.origin === 'scenario' || d.sourced.verification !== 'cross-checked');
  if (atLeast(level, 'advanced')) {
    out.push(h(2, m.dataTitle));
    out.push(list(data.map((d) => describeData(d, ctx))));
  } else if (atLeast(level, 'school') && estimates.length) {
    out.push(note('warning', m.estimatesWarning(estimates.map((d) => t(d.label)).join('; '))));
  }

  if (atLeast(level, 'expert')) {
    const unreviewed = [...usedFormulaIds].map((id) => formulas.get(id)).filter((f): f is FormulaSpec => !!f && !f.reviewed);
    if (unreviewed.length) out.push(note('warning', m.unreviewed(unreviewed.length)));
  }
  return out;
}

function explainLaw<C extends Command>(
  law: LawSpec,
  used: readonly FormulaSpec[],
  ctx: ExplainContext,
  result: ExperimentResult<C>,
  country: string | undefined,
): Block[] {
  const { level, locale } = ctx;
  const m = REPORT_MESSAGES[locale];
  const t = (x: Parameters<typeof tr>[0]) => tr(x, locale);
  const out: Block[] = [];
  out.push(h(3, `${t(law.name)}${law.kind === 'definition' && atLeast(level, 'advanced') ? m.definitionTag : ''}`));
  out.push(p(t(textFor(law.statement, level))));

  const { history } = law;
  const who = history.role === 'discovered' ? m.discoveredBy : m.associatedWith;
  if (history.people.length) {
    if (level === 'novice') {
      const names = history.people.map((x) => t(x.name)).join(', ');
      out.push(p(history.story.novice ? t(history.story.novice) : `${who}: ${names} (${history.when}).`));
    } else {
      if (atLeast(level, 'advanced')) {
        const people = history.people.map((x) => `${t(x.name)} (${x.born}–${x.died})`).join(', ');
        out.push(p(`${who}: ${people}. ${m.when}: ${history.when}.${history.work ? ` ${m.work}: ${history.work}.` : ''}`));
      }
      out.push(p(t(textFor(history.story, level))));
    }
  } else if (atLeast(level, 'school')) {
    out.push(p(t(textFor(history.story, level))));
  }

  if (law.limits && atLeast(level, 'advanced')) out.push(p(`${m.limits}: ${t(textFor(law.limits, level))}`));
  if (atLeast(level, 'expert') && history.citations.length) {
    out.push(list(history.citations.map((c) => `${m.source}: ${getSource(c.source)?.title ?? c.source} [${c.locator}] — ${c.claim}`)));
  }

  for (const f of used) {
    if (level === 'novice') {
      if (f.explanation.novice) out.push(p(`• ${t(f.explanation.novice)}`));
      continue;
    }
    out.push({ kind: 'formula', plain: f.plain, latex: f.latex });
    const vars = Object.entries(f.variables)
      .filter(([, v]) => v.unit !== '' || atLeast(level, 'advanced'))
      .map(([sym, v]) => {
        const meaning = v.meaning ? ` — ${t(textFor(v.meaning, level))}` : '';
        const unit = v.unit ? `, ${unitLabel(v.unit, ctx)}` : '';
        return `${sym} — ${t(v.name)}${unit}${meaning}`;
      });
    out.push(list(vars));
    out.push(p(t(textFor(f.explanation, level))));
    if (country) out.push(...curriculumBlock(f, country, ctx));
    if (atLeast(level, 'expert')) {
      const u = result.usage.get(f.id);
      if (u) out.push(p(m.appliedTimes(u.count, [...u.entities].map((id) => entityLabel(result.final, id, locale)).join(', '))));
    }
  }
  return out;
}

/** "In the school curriculum: grade 8 — «…»" for the chosen country. */
function curriculumBlock(f: FormulaSpec, country: string, ctx: ExplainContext): Block[] {
  const m = REPORT_MESSAGES[ctx.locale];
  const refs = f.curriculum.filter((r) => getCurriculum(r.program)?.country === country);
  if (!refs.length) return f.beyondCurriculum ? [p(`${m.curriculumBeyond}: ${tr(f.beyondCurriculum, ctx.locale)}`)] : [];
  const items = refs.map((r) => {
    const program = getCurriculum(r.program);
    const depth = r.depth === 'qualitative' ? ` (${m.qualitative})` : '';
    const base = `${m.grade(r.grade)}${depth}`;
    return atLeast(ctx.level, 'advanced') && program ? `${base} — «${r.quote}» — ${tr(program.name, ctx.locale)}` : base;
  });
  const unique = [...new Set(items)];
  return [p(`${m.curriculum}: ${unique.join('; ')}`)];
}

function describeApplication(r: FormulaApplication, formulas: ReadonlyMap<string, FormulaSpec>, s: SystemState, ctx: ExplainContext): string {
  const { locale } = ctx;
  const f = formulas.get(r.formula);
  if (!f) return `${r.formula}: ${sig(r.output, 4, locale)}`;
  const resultVar = f.variables[f.resultSymbol];
  const who = r.entities.map((id) => entityLabel(s, id, locale)).join(' → ');
  const args = f.argSymbols
    .map((sym, i) => {
      const v = r.args[i];
      const unit = f.variables[sym]?.unit ?? '';
      if (typeof v === 'number') return `${sym} = ${formatQuantity(v, unit, ctx)}`;
      if (Array.isArray(v)) {
        return v
          .map(
            (b: { mass: number; specificHeat: number; temperature: number }) =>
              `[m = ${formatQuantity(b.mass, 'kg', ctx)}, c = ${formatQuantity(b.specificHeat, 'J/(kg·K)', ctx)}, t = ${formatQuantity(b.temperature, 'K', ctx)}]`,
          )
          .join(' + ');
      }
      return `${sym} = ?`;
    })
    .join(', ');
  return `${tr(f.title, locale)} (${who}): ${f.plain} → ${f.resultSymbol} = ${formatQuantity(r.output, resultVar?.unit ?? '', ctx)}, ${REPORT_MESSAGES[locale].where} ${args}`;
}

function describeRecord(r: TraceRecord, formulas: ReadonlyMap<string, FormulaSpec>, s: SystemState, ctx: ExplainContext): string[] {
  const m = REPORT_MESSAGES[ctx.locale];
  if (r.kind === 'numerics') {
    return atLeast(ctx.level, 'expert')
      ? [m.numerics(r.method, formatTime(r.dt, ctx.locale), r.substeps, formatQuantity(r.dt / r.substeps, 's', ctx))]
      : [m.timeStep(formatTime(r.dt, ctx.locale))];
  }
  if (r.kind === 'transfer' || r.kind === 'measurement') return []; // shown in the energy balance / debrief and the protocol instead
  return [describeApplication(r, formulas, s, ctx)];
}

function describeData(d: DataUsage, ctx: ExplainContext): string {
  const { locale } = ctx;
  const m = REPORT_MESSAGES[locale];
  const label = tr(d.label, locale);
  if (d.origin === 'scenario') return `${label}: ${formatQuantity(d.value, d.unit, ctx)} — ${m.scenarioValue}`;
  const v = d.sourced;
  const sources = new Set(v.citations.map((c) => c.source));
  let line = `${label}: ${formatQuantity(v.value, v.unit, ctx)} — ${m.verification[v.verification]}, ${m.sources(sources.size)}`;
  if (atLeast(ctx.level, 'expert')) {
    line += `; ${m.conditions}: ${v.conditions}; ${m.tolerance} ±${sig(v.tolerance * 100, 2, locale)} %`;
    for (const c of v.citations) {
      const what = 'value' in c ? sig(c.value, 5, locale) : `${sig(c.range[0], 4, locale)}–${sig(c.range[1], 4, locale)}`;
      line += `\n    ${getSource(c.source)?.title ?? c.source} [${c.locator}, ${c.conditions}]: ${what}`;
    }
    if (v.note) line += `\n    ${m.noteLabel}: ${v.note}`;
  } else if (v.verification !== 'cross-checked' && v.note) {
    line += ` (${v.note})`;
  }
  return line;
}
