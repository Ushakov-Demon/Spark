/**
 * Prints the trust status of all reference data: what is cross-checked,
 * what rests on one source, what is an estimate, which texts await review.
 * Run: npm run knowledge:report
 */
import { CONVECTION, MATERIALS } from '../src/domains/thermal/materials.js';
import { THERMAL_FORMULAS } from '../src/domains/thermal/catalog.js';
import { verifySourcedValue } from '../src/knowledge/verify.js';
import type { SourcedValue } from '../src/knowledge/types.js';

const rows: [string, SourcedValue][] = [
  ...Object.values(MATERIALS).flatMap((m): [string, SourcedValue][] => [
    [`${m.name.uk} · c`, m.specificHeat],
    [`${m.name.uk} · k`, m.conductivity],
  ]),
  ...Object.entries(CONVECTION).map(([k, v]): [string, SourcedValue] => [`h · ${k}`, v]),
];

const mark = { 'cross-checked': '✅', 'single-source': '⚠️ ', estimate: '❓' } as const;
let problems = 0;

console.log('\nДанные материалов\n');
for (const [name, v] of rows) {
  const issues = verifySourcedValue(v);
  problems += issues.length;
  const sources = new Set(v.citations.map((c) => c.source)).size;
  console.log(
    `${mark[v.verification]} ${name.padEnd(28)} ${String(v.value).padStart(7)} ${v.unit.padEnd(12)} ±${(v.tolerance * 100).toFixed(0).padStart(2)}%  источников: ${sources}` +
      (issues.length ? `  ❌ ${issues.map((i) => i.message).join('; ')}` : ''),
  );
  if (v.verification !== 'cross-checked' && v.note) console.log(`     ↳ ${v.note}`);
}

console.log('\nКаталог формул\n');
for (const s of THERMAL_FORMULAS) {
  console.log(`${s.reviewed ? '✅' : '📝'} ${s.title.uk.padEnd(52)} ${s.curriculum.length ? `UA: ${[...new Set(s.curriculum.map((r) => r.grade))].join(', ')} клас` : 'поза програмою'}`);
}

const count = (v: SourcedValue['verification']) => rows.filter(([, r]) => r.verification === v).length;
console.log(
  `\nИтого: ${count('cross-checked')} сверено, ${count('single-source')} из одного источника, ${count('estimate')} оценок; ` +
    `${THERMAL_FORMULAS.filter((s) => !s.reviewed).length}/${THERMAL_FORMULAS.length} текстов ждут проверки учителем.`,
);
if (problems) {
  console.error(`\n❌ Нарушений: ${problems}`);
  process.exit(1);
}
