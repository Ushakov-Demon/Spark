/** Longest page of the bubble, in characters: about five lines at its width (a phone's bubble is narrower). */
export const BUBBLE_PAGE = 150;
export const BUBBLE_PAGE_PHONE = 90;

/**
 * A long line in pages for the bubble: whole sentences, as many as fit in a page.
 * A sentence longer than a page is parted after its commas, colons and dashes,
 * with «…» where it goes on; a word is never cut.
 */
export function bubblePages(text: string, max = BUBBLE_PAGE): string[] {
  const sentences = text.trim().split(/(?<=[.!?…»])\s+(?=\S)/u).filter(Boolean);
  const pieces = sentences.flatMap((s) => {
    if (s.length <= max) return [s];
    const parts = pack(s.split(/(?<=[,;:])\s+|\s+(?=— )/u), max - 2);
    return parts.map((x, i) => `${i ? '…' : ''}${x}${i < parts.length - 1 ? '…' : ''}`);
  });
  return pack(pieces, max);
}

/** Pieces of text joined into pages of at most `max` characters (a longer piece is a page of its own). */
function pack(pieces: readonly string[], max: number): string[] {
  const pages: string[] = [];
  for (const s of pieces) {
    const last = pages[pages.length - 1];
    if (last !== undefined && last.length + 1 + s.length <= max) pages[pages.length - 1] = `${last} ${s}`;
    else pages.push(s);
  }
  return pages.length ? pages : [''];
}
