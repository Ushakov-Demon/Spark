import { getCurriculum } from '../knowledge/curricula.js';
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
    else if (!same.quote.includes(x.quote)) out[out.indexOf(same)] = { ...same, quote: `${same.quote} ${x.quote}` };
  }
  return out;
}
