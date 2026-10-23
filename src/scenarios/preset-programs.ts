import { getCurriculum } from '../knowledge/curricula.js';
import type { Subject } from '../knowledge/types.js';
import { tr, type Locale } from '../knowledge/i18n.js';
import { LAB_KNOWLEDGE } from './lab-knowledge.js';
import type { Preset, PresetProgram } from './presets.js';

/**
 * Every programme a ready-made experiment belongs to: what its formulas' curriculum quotes say
 * (the Ukrainian programmes), plus what the preset names itself (a required practical of another
 * country's course). Grouped by programme and grade — for the card and, later, for filtering.
 */
export function presetPrograms(p: Preset): PresetProgram[] {
  const formulas = new Map(LAB_KNOWLEDGE.formulas.map((f) => [f.id, f]));
  const fromFormulas: PresetProgram[] = p.formulas.flatMap((id) =>
    (formulas.get(id)?.curriculum ?? [])
      .filter((c) => !p.quoteHas || c.quote.includes(p.quoteHas))
      .map((c) => ({ program: c.program, grade: c.grade, match: 'same' as const, quote: c.quote })),
  );
  const out: PresetProgram[] = [];
  for (const x of [...fromFormulas, ...(p.programs ?? [])]) {
    if (!getCurriculum(x.program)) continue;
    const same = out.find((y) => y.program === x.program && y.grade === x.grade && y.item === x.item);
    if (!same) out.push(x);
    else {
      // The same programme and grade from two places (a formula's quote and the preset's own): one chip, keeping the topic and the textbook.
      const quote = same.quote.includes(x.quote) ? same.quote : `${same.quote} ${x.quote}`;
      out[out.indexOf(same)] = { ...x, ...same, quote, ...(same.topic ?? x.topic ? { topic: same.topic ?? x.topic! } : {}), ...(same.textbook ?? x.textbook ? { textbook: same.textbook ?? x.textbook! } : {}) };
    }
  }
  return out;
}

/**
 * The subjects an experiment belongs to: those of the programmes that have it as it is (not "≈"). One that is in
 * the physics and the chemistry programmes both (electrolysis) is under each.
 */
export function presetSubjects(p: Preset): Subject[] {
  const found = presetPrograms(p).flatMap((x) => (x.match === 'related' ? [] : [getCurriculum(x.program)?.subject ?? []].flat()));
  // (None named: physics, the lab's first subject.)
  return found.length ? [...new Set(found)] : ['physics'];
}

/**
 * The grade an experiment is under in a subject: that subject's programmes may put it elsewhere than the
 * experiment's own grade (salt on the roads: physics in the 8th, the chemistry of solutions in the 9th).
 * Of several programmes, the earliest grade; none named — the experiment's own.
 */
/**
 * Every grade an experiment is under in a subject: its programmes may put it in different grades (electrolysis —
 * the 8th in Holovko's, the 9th in Kreminskyi's), and schools work by either. None named — its own grade.
 */
export function presetGradesIn(p: Preset, subject: Subject): (number | null)[] {
  if (p.grade === null) return [null];
  const grades = presetPrograms(p).flatMap((x) => (x.match !== 'related' && x.grade !== undefined && getCurriculum(x.program)?.subject === subject ? [x.grade] : []));
  return grades.length ? [...new Set(grades)].sort((a, b) => a - b) : [p.grade];
}

export function presetGradeIn(p: Preset, subject: Subject): number | null {
  if (p.grade === null) return null;
  const grades = presetPrograms(p).flatMap((x) => (x.match !== 'related' && x.grade !== undefined && getCurriculum(x.program)?.subject === subject ? [x.grade] : []));
  return grades.length ? Math.min(...grades) : p.grade;
}

/**
 * The topic an experiment is under in a subject: that subject's programme names its own («Тема 2. Досліджуємо
 * хімічні реакції в розчинах» for salt on the roads, not «Теплові явища» of physics). The programmes' topics are
 * quoted in their own language (Ukrainian); in another language — the experiment's own topic.
 */
export function presetTopicIn(p: Preset, subject: Subject, locale: Locale): string {
  // Under its own subject (the first of its programmes) an experiment keeps its own topic.
  if (presetSubjects(p)[0] === subject) return tr(p.topic, locale);
  // (The chemistry programme's items are its topics: «Тема 2. Досліджуємо хімічні реакції в розчинах».)
  const topicOf = (x: PresetProgram) => x.topic ?? (x.item?.startsWith('Тема') ? x.item : undefined);
  const mine = presetPrograms(p).find((x) => x.match !== 'related' && topicOf(x) && getCurriculum(x.program)?.subject === subject);
  const own = mine && topicOf(mine);
  return own && locale === 'uk' ? own : tr(p.topic, locale);
}
