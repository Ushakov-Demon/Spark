import type { Block } from './blocks.js';

/** Visible width of a string in a monospace terminal (good enough for Cyrillic and symbols). */
const width = (s: string): number => [...s].length;
const pad = (s: string, n: number): string => s + ' '.repeat(Math.max(0, n - width(s)));

/** Plain-text renderer for consoles and logs. */
export function renderText(blocks: readonly Block[], options: { readonly expand?: boolean } = {}): string {
  const out: string[] = [];
  for (const b of blocks) {
    switch (b.kind) {
      case 'heading':
        if (b.depth === 1) out.push('', '═'.repeat(width(b.text) + 4), `  ${b.text}`, '═'.repeat(width(b.text) + 4));
        else if (b.depth === 2) out.push('', `▌ ${b.text}`, '');
        else out.push('', `◆ ${b.text}`);
        break;
      case 'paragraph':
        out.push(b.text);
        break;
      case 'formula':
        out.push(`    ${b.plain}`);
        break;
      case 'list':
        for (const item of b.items) out.push(`  • ${item}`);
        break;
      case 'note':
        out.push(`${b.tone === 'warning' ? '⚠' : 'ℹ'} ${b.text}`);
        break;
      case 'summary': {
        const mark = b.tone === 'success' ? '✅' : b.tone === 'failure' ? '⛔' : '▶';
        out.push('', ...b.lines.map((l, i) => (i === 0 ? `${mark} ${l}` : `   ${l}`)));
        break;
      }
      case 'details':
        // Consoles cannot collapse: show a hint, or everything with `expand`.
        if (options.expand) out.push(`  ▾ ${b.summary}`, renderText(b.blocks, options));
        else out.push(`  ▸ ${b.summary}`);
        break;
      case 'table': {
        const cols = b.head.map((head, i) => Math.max(width(head), ...b.rows.map((r) => width(r[i] ?? ''))));
        const line = (cells: readonly string[]) => '  ' + cells.map((c, i) => pad(c, cols[i]!)).join(' │ ');
        out.push(line(b.head), '  ' + cols.map((w) => '─'.repeat(w)).join('─┼─'));
        for (const r of b.rows) out.push(line(r));
        break;
      }
    }
  }
  // Collapse runs of blank lines.
  return out.filter((l, i) => !(l === '' && out[i - 1] === '')).join('\n');
}
