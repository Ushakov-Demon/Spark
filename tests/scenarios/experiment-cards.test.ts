import { FluentBundle } from '@fluent/bundle';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CARDS } from '../../src/experiments/cards.js';
import { LOCALES, tr } from '../../src/knowledge/i18n.js';
import { presetAsk, presetPrograms, withValues } from '../../src/scenarios/index.js';
import { defaultValues } from '../../src/scenarios/preset-kit.js';
import { catalogHtml } from '../../web/site.js';
import { presetEquipment, presetTopic } from '../../web/experiment-sheet.js';
import { EXPERIMENTS } from '../../src/experiments/index.js';
import { experimentLoaded, experimentOf } from '../../src/experiments/registry.js';

const DIR = join(import.meta.dirname, '../../src/experiments');
const LOCALES_DIR = join(import.meta.dirname, '../../locales');
const FOLDERS = readdirSync(DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

describe('experiment cards: what the page has before an experiment opens', () => {
  it('every module has its card, in the same order: the same bench, setup and presets', () => {
    expect(CARDS.map((c) => c.kind)).toEqual(EXPERIMENTS.map((m) => m.kind));
    EXPERIMENTS.forEach((m, i) => {
      expect(m.setup, m.kind).toBe(CARDS[i]!.setup);
      expect(m.presets, m.kind).toEqual(CARDS[i]!.presets);
    });
  });

  it('a card is light: preset.ts and shared.ts import no commands, words, answers or another module but its shared.ts', () => {
    const heavy = /from '\.\.?\/(?:[a-z-]+\/)?(bench|words|answer|index|preset)\.js'/g;
    for (const folder of FOLDERS)
      for (const file of ['preset.ts', 'shared.ts']) {
        let text: string;
        try {
          text = readFileSync(join(DIR, folder, file), 'utf8');
        } catch {
          continue;
        }
        // Types only are erased: they load nothing.
        const values = text.split('\n').filter((l) => l.startsWith('import ') && !l.startsWith('import type '));
        expect(values.filter((l) => l.match(heavy)), `${folder}/${file}`).toEqual([]);
      }
  });

  it('a card is worded from the card files: nothing it reads is in a .run.ftl (those come only when the experiment opens)', () => {
    const run = new Map<string, string>();
    for (const f of readdirSync(join(LOCALES_DIR, 'uk/experiments')).filter((x) => x.endsWith('.run.ftl')))
      for (const m of readFileSync(join(LOCALES_DIR, 'uk/experiments', f), 'utf8').matchAll(/^([a-z][\w-]*) =/gm)) run.set(m[1]!, f);
    const read = new Set<string>();
    const proto = FluentBundle.prototype as unknown as { getMessage(id: string): unknown };
    const get = proto.getMessage;
    proto.getMessage = function (this: FluentBundle, id: string) {
      read.add(id);
      return get.call(this, id);
    };
    try {
      const word = (x: unknown) => x && typeof x === 'object' && LOCALES.forEach((l) => tr(x as never, l));
      for (const card of CARDS) {
        word(card.setup);
        for (const p of card.presets) {
          const controls = p.vary?.controls ?? [];
          const variants: Record<string, unknown>[] = [{}, ...controls.flatMap((c) => (c.kind === 'number' ? [c.min, c.max] : c.kind === 'place' ? [c.value, c.en] : c.options.map((o) => o.id)).map((v) => ({ [c.id]: v })))];
          for (const c of controls) [c.label, ...(c.kind === 'choice' ? c.options.map((o) => o.label) : [])].forEach(word);
          for (const l of LOCALES)
            for (const v of variants) {
              const q = withValues(p, { ...defaultValues(p, l), ...v } as never);
              [q.title, q.question, q.topic, presetAsk(q), q.benchSetup, ...(q.choices ?? []).map((c) => c.label), ...(q.plan ?? []).map((st) => ('optional' in st ? st.optional : undefined))].forEach(word);
              presetPrograms(q);
              presetEquipment(q, l);
              presetTopic(q, l);
            }
        }
      }
      for (const l of LOCALES) catalogHtml(l, (x) => x);
    } finally {
      proto.getMessage = get;
    }
    // (The cards were worded at all: the messages were seen being read.)
    expect(read.has('newton-cannon-question')).toBe(true);
    expect([...read].filter((id) => run.has(id)).map((id) => `${run.get(id)}: ${id}`)).toEqual([]);
  });

  it('every module is registered: its commands are found, its bench loaded', () => {
    for (const m of EXPERIMENTS) {
      expect(experimentLoaded(m.kind), m.kind).toBe(true);
      for (const h of m.commands) expect(experimentOf(h.type), h.type).toBe(m);
    }
  });
});
