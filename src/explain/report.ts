import type { Command, ExperimentResult, FormulaApplication, Simulation, TraceRecord } from '../core/index.js';
import { sampleAt, traceTick } from '../core/experiment.js';
import type { EntityId } from '../core/ids.js';
import type { SystemState } from '../core/state.js';
import { atLeast, LEVEL_INFO, textFor, type Level } from '../knowledge/levels.js';
import { getSource } from '../knowledge/sources.js';
import type { FormulaSpec, LawSpec, SourcedValue } from '../knowledge/types.js';
import { h, list, note, p, type Block } from './blocks.js';
import type { DomainKnowledge } from './domain.js';
import { formatQuantity, formatTime, sig, unitLabel } from './format.js';

export interface ReportInput<C extends Command> {
  readonly title: string;
  readonly level: Level;
  readonly result: ExperimentResult<C>;
  readonly simulation: Simulation;
  readonly domain: DomainKnowledge<C>;
  /** Moment to explain step by step (default: middle of the run). */
  readonly focusTime?: number;
}

const ru = (t: { ru: string }) => t.ru;
const VERIFICATION_RU = { 'cross-checked': 'сверено', 'single-source': 'один источник', estimate: 'оценка' } as const;

export const entityLabel = (s: SystemState, id: EntityId | string): string => s.entities[id as EntityId]?.label ?? id;

/**
 * Builds the explanation of a finished experiment for a reader of `level`.
 * Everything listed under "laws" comes from what the engine actually traced.
 */
export function buildReport<C extends Command>(input: ReportInput<C>): Block[] {
  const { level, result, domain, simulation } = input;
  const formulas = new Map(domain.formulas.map((f) => [f.id, f]));
  const out: Block[] = [];

  out.push(h(1, input.title));
  out.push(p(`Уровень объяснения: ${LEVEL_INFO[level].name} (${LEVEL_INFO[level].audience}).`));

  // 1. What happened
  out.push(h(2, 'Что произошло'));
  out.push(...domain.timeline(result, level));

  // 2. Experimenter's actions
  if (result.log.length) {
    out.push(h(2, 'Ваши действия'));
    const items: string[] = [];
    for (const e of result.log) {
      let line = `${formatTime(e.time)} — ${domain.describeCommand(e, level, result.final)}`;
      if (!e.ok) line += ` — не получилось: ${e.error}`;
      else if (atLeast(level, 'school')) {
        for (const r of e.trace) if (r.kind === 'formula') line += `\n    ${describeApplication(r, formulas, result.final, level)}`;
      }
      items.push(line);
    }
    out.push(list(items));
  }

  // 3. Laws that were actually used
  out.push(h(2, 'Какие законы физики работали'));
  const usedFormulaIds = new Set(result.usage.keys());
  const laws = domain.laws.filter((l) => domain.formulas.some((f) => f.law === l.id && usedFormulaIds.has(f.id)));
  if (!atLeast(level, 'school')) {
    out.push(p('Компьютер не «рисует» результат, а считает его по настоящим законам физики:'));
  }
  for (const law of laws) {
    const used = domain.formulas.filter((f) => f.law === law.id && usedFormulaIds.has(f.id));
    out.push(...explainLaw(law, used, level, result));
  }

  // 4. A moment in detail
  if (atLeast(level, 'school')) {
    const t = input.focusTime ?? result.final.time / 2;
    const snapshot = sampleAt(result.samples, t);
    const { records } = traceTick(simulation, snapshot);
    out.push(h(2, `Как посчитан один шаг: момент ${formatTime(snapshot.time)}`));
    out.push(
      p(
        atLeast(level, 'expert')
          ? 'Ниже — фактические записи трассировки одного шага (пересчитан из снимка состояния; физика детерминирована).'
          : 'Компьютер повторяет такой расчёт тысячи раз подряд. Вот что он посчитал за один короткий шаг:',
      ),
    );
    out.push(list(records.flatMap((r) => describeRecord(r, formulas, snapshot, level))));
  }

  // 5. Energy balance
  out.push(...domain.energyBalance(result, level));

  // 6. Simplifications
  const assumptions = simulation.solvers.flatMap((s) => s.assumptions ?? []);
  const shown = level === 'novice' ? assumptions.filter((a) => a.text.novice) : assumptions;
  if (shown.length) {
    out.push(h(2, level === 'novice' ? 'В жизни будет немного иначе' : 'Что модель упрощает'));
    out.push(list(shown.map((a) => ru(textFor(a.text, level)))));
  }

  // 7. Data provenance
  const data = domain.dataUsed(result.final);
  const estimates = data.filter((d) => d.origin === 'scenario' || d.sourced.verification !== 'cross-checked');
  if (atLeast(level, 'advanced')) {
    out.push(h(2, 'Откуда взяты числа'));
    out.push(list(data.map((d) => describeData(d, level))));
  } else if (atLeast(level, 'school') && estimates.length) {
    out.push(note('warning', `Примерные значения: ${estimates.map((d) => d.label).join('; ')}. Поэтому в жизни результат может немного отличаться.`));
  }

  if (atLeast(level, 'expert')) {
    const unreviewed = [...usedFormulaIds].map((id) => formulas.get(id)).filter((f): f is FormulaSpec => !!f && !f.reviewed);
    if (unreviewed.length) out.push(note('warning', `Тексты ${unreviewed.length} формул ещё не проверены учителем физики (reviewed: false).`));
  }
  return out;
}

function explainLaw<C extends Command>(law: LawSpec, used: readonly FormulaSpec[], level: Level, result: ExperimentResult<C>): Block[] {
  const out: Block[] = [];
  const kind = law.kind === 'definition' && atLeast(level, 'advanced') ? ' (определение)' : '';
  out.push(h(3, `${ru(law.name)}${kind}`));
  out.push(p(ru(textFor(law.statement, level))));

  const { history } = law;
  if (history.people.length) {
    const names = history.people.map((x) => ru(x.name));
    if (level === 'novice') {
      const who = history.role === 'discovered' ? 'Открыл' : 'Связано с именами';
      out.push(p(history.story.novice ? ru(history.story.novice) : `${who}: ${names.join(', ')} (${history.when}).`));
    } else {
      if (atLeast(level, 'advanced')) {
        const people = history.people.map((x) => `${ru(x.name)} (${x.born}–${x.died})`).join(', ');
        const who = history.role === 'discovered' ? 'Кто открыл' : 'Связано с именами';
        out.push(p(`${who}: ${people}. Когда: ${history.when}.${history.work ? ` Работа: ${history.work}.` : ''}`));
      }
      out.push(p(ru(textFor(history.story, level))));
    }
  } else if (atLeast(level, 'school')) {
    out.push(p(ru(textFor(history.story, level))));
  }

  if (law.limits && atLeast(level, 'advanced')) out.push(p(`Когда перестаёт работать: ${ru(textFor(law.limits, level))}`));

  if (atLeast(level, 'expert') && history.citations.length) {
    out.push(list(history.citations.map((c) => `источник: ${getSource(c.source)?.title ?? c.source} [${c.locator}] — ${c.claim}`)));
  }

  for (const f of used) {
    if (level === 'novice') {
      if (f.explanation.novice) out.push(p(`• ${ru(f.explanation.novice)}`));
      continue;
    }
    out.push({ kind: 'formula', plain: f.plain, latex: f.latex });
    const vars = Object.entries(f.variables)
      .filter(([, v]) => v.unit !== '' || atLeast(level, 'advanced'))
      .map(([sym, v]) => {
        const meaning = v.meaning ? ` — ${ru(textFor(v.meaning, level))}` : '';
        const unit = v.unit ? `, ${unitLabel(v.unit, level)}` : '';
        return `${sym} — ${ru(v.name)}${unit}${meaning}`;
      });
    out.push(list(vars));
    out.push(p(ru(textFor(f.explanation, level))));
    if (atLeast(level, 'expert')) {
      const u = result.usage.get(f.id);
      if (u) out.push(p(`Применена ${u.count} раз; объекты: ${[...u.entities].map((id) => entityLabel(result.final, id)).join(', ')}.`));
    }
  }
  return out;
}

function describeApplication(r: FormulaApplication, formulas: ReadonlyMap<string, FormulaSpec>, s: SystemState, level: Level): string {
  const f = formulas.get(r.formula);
  if (!f) return `${r.formula}: ${sig(r.output, 4)}`;
  const resultVar = f.variables[f.resultSymbol];
  const who = r.entities.map((id) => entityLabel(s, id)).join(' → ');
  const args = f.argSymbols
    .map((sym, i) => {
      const v = r.args[i];
      const unit = f.variables[sym]?.unit ?? '';
      if (typeof v === 'number') return `${sym} = ${formatQuantity(v, unit, level)}`;
      if (Array.isArray(v)) {
        return v
          .map((b: { mass: number; specificHeat: number; temperature: number }) =>
            `[m = ${formatQuantity(b.mass, 'kg', level)}, c = ${formatQuantity(b.specificHeat, 'J/(kg·K)', level)}, t = ${formatQuantity(b.temperature, 'K', level)}]`,
          )
          .join(' + ');
      }
      return `${sym} = ?`;
    })
    .join(', ');
  return `${ru(f.title)} (${who}): ${f.plain} → ${f.resultSymbol} = ${formatQuantity(r.output, resultVar?.unit ?? '', level)}, где ${args}`;
}

function describeRecord(r: TraceRecord, formulas: ReadonlyMap<string, FormulaSpec>, s: SystemState, level: Level): string[] {
  if (r.kind === 'numerics') {
    return atLeast(level, 'expert')
      ? [`Численный метод: ${r.method}, шаг dt = ${formatTime(r.dt)} разбит на ${r.substeps} подшаг(а) по ${sig(r.dt / r.substeps, 3)} с`]
      : [`Шаг по времени: ${formatTime(r.dt)}`];
  }
  return [describeApplication(r, formulas, s, level)];
}

function describeData(d: ReturnType<DomainKnowledge<Command>['dataUsed']>[number], level: Level): string {
  if (d.origin === 'scenario') {
    return `${d.label}: ${formatQuantity(d.value, d.unit, level)} — задано в сценарии, источника нет (оценка)`;
  }
  const v: SourcedValue = d.sourced;
  const sources = new Set(v.citations.map((c) => c.source));
  let line = `${d.label}: ${formatQuantity(v.value, v.unit, level)} — ${VERIFICATION_RU[v.verification]}, источников: ${sources.size}`;
  if (atLeast(level, 'expert')) {
    line += `; условия: ${v.conditions}; допуск ±${sig(v.tolerance * 100, 2)} %`;
    for (const c of v.citations) {
      const what = 'value' in c ? sig(c.value, 5) : `${sig(c.range[0], 4)}–${sig(c.range[1], 4)}`;
      line += `\n    ${getSource(c.source)?.title ?? c.source} [${c.locator}, ${c.conditions}]: ${what}`;
    }
    if (v.note) line += `\n    примечание: ${v.note}`;
  } else if (v.verification !== 'cross-checked' && v.note) {
    line += ` (${v.note})`;
  }
  return line;
}
