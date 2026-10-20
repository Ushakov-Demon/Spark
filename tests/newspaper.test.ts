import { afterEach, describe, expect, it, vi } from 'vitest';
import { LAB_KNOWLEDGE } from '../src/scenarios/index.js';
import { fetchArticle, labTopics, offlineArticle, paperHtml } from '../web/newspaper.js';

describe('the Professor’s newspaper', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('takes its topics from the lab: substances and the people behind its laws', () => {
    const ids = labTopics(LAB_KNOWLEDGE.laws);
    expect(ids.length).toBeGreaterThan(20);
    for (const id of ids) expect(id).toMatch(/^Q\d+$/);
    for (const l of LAB_KNOWLEDGE.laws) for (const p of l.history.people) expect(ids).toContain(p.wikidata);
  });

  it('without the internet tells a story from the history of a law, with its people and sources', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')));
    const a = await fetchArticle('uk', LAB_KNOWLEDGE.laws, 'school');
    expect(a.kicker).toMatch(/^З історії науки/);
    expect(a.text.length).toBeGreaterThan(60);
    expect(a.source.label).toMatch(/^Spark/);
    expect(a.source.url).toBeUndefined();
  });

  it('a page escapes the text it shows and names its source', () => {
    const a = offlineArticle(LAB_KNOWLEDGE.laws, 'en', 'novice');
    const html = paperHtml({ ...a, title: '<b>x</b>' }, 'en', new Date(2026, 9, 20));
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
    expect(html).toContain('October 20');
    expect(html).toContain('paper-source');
  });
});
