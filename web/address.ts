import type { Locale } from '../src/knowledge/i18n.js';

/**
 * The parts of a site's address, without knowing the experiments (site.ts's `parsePath` makes a route of them): the
 * site's root (it may live in a folder), the language the address names (none for Ukrainian), the section and the id
 * after it. Light on purpose: the page's start reads its language here before the lab's code has come.
 */
export function addressParts(pathname: string): { readonly root: string; readonly locale: Locale | null; readonly section: string | undefined; readonly id: string | undefined } | null {
  const m = /^(.*?\/)(?:(en)\/)?(?:(experiments|glossary|substances|equipment|about)(?:\/(?:([a-z0-9-]+)\/?)?)?)?(?:index\.html)?$/.exec(pathname);
  if (!m) return null;
  const [, root = '/', lang, section, id] = m;
  return { root, locale: lang === 'en' ? 'en' : null, section, id };
}
