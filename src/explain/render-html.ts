import type { Block } from './blocks.js';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Multi-line list items (continuation lines) become line breaks. */
const lines = (s: string): string => esc(s).replace(/\n\s*/g, '<br>');

/** Renders explanation blocks as plain semantic HTML (styled by the page). */
export function renderHtml(blocks: readonly Block[]): string {
  return blocks
    .map((b) => {
      switch (b.kind) {
        case 'heading':
          return `<h${b.depth + 1}>${esc(b.text)}</h${b.depth + 1}>`;
        case 'paragraph':
          return `<p>${lines(b.text)}</p>`;
        case 'formula':
          return `<p class="formula"><code>${esc(b.plain)}</code></p>`;
        case 'list':
          return `<ul>${b.items.map((i) => `<li>${lines(i)}</li>`).join('')}</ul>`;
        case 'note':
          return `<p class="note ${b.tone}">${lines(b.text)}</p>`;
        case 'summary':
          return `<div class="summary ${b.tone}">${b.lines.map((l, i) => (i === 0 ? `<p class="lead">${lines(l)}</p>` : `<p>${lines(l)}</p>`)).join('')}</div>`;
        case 'details':
          return `<details class="more"><summary>${esc(b.summary)}</summary>${renderHtml(b.blocks)}</details>`;
        case 'table':
          return `<div class="table-wrap"><table><thead><tr>${b.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.rows
            .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
            .join('')}</tbody></table></div>`;
      }
    })
    .join('\n');
}
