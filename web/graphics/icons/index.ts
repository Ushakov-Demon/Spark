/// <reference types="vite/client" />
/**
 * Small line icons (24 × 24, drawn with currentColor), one .svg file each, in folders by what they
 * show: operations/, vessels/, devices/, instruments/. Operations and equipment name their icon in
 * their own data (`icon`, `look`); a new icon is a new file — nothing to register.
 */
const FILES = import.meta.glob<string>('./*/*.svg', { query: '?raw', import: 'default', eager: true });

/** The inside of each icon's <svg>, by file name. */
const INNER: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(FILES).map(([path, svg]) => [path.replace(/^.*\/([^/]+)\.svg$/, '$1'), svg.replace(/^[\s\S]*?<svg[^>]*>|<\/svg>\s*$/g, '')]),
);

export const icon = (name: string | undefined, cls = 'ic'): string =>
  name && INNER[name] ? `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${INNER[name]}</svg>` : '';
