/**
 * The smoke run of the ready-made experiments in a real browser: each one is opened, a prediction picked, its plan
 * stepped through to the end, and the answer looked for. A run fails on a JavaScript error, on a step whose motion
 * never ends (the next button stays disabled), or on an answer that never comes. Each step's settled scene is saved,
 * so two runs (before and after a change) can be compared picture by picture.
 *
 *   npx vite web --port 5175 --strictPort --open false     (in another terminal)
 *   npx tsx scripts/smoke.ts [--base URL] [--only id,id] [--shots DIR] [--jobs N] [--compare DIR_A DIR_B [--png]]
 *
 * CHROME — the browser to drive (default /usr/bin/google-chrome).
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Browser } from 'playwright-core';
import { PRESETS } from '../src/scenarios/index.js';

const args = process.argv.slice(2);
const opt = (name: string): string | undefined => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

/** Two runs' bench drawings and words (`.svg`, `.txt`; with --png the screenshots too): the same files, the same bytes? */
function compare(a: string, b: string): number {
  const hash = (f: string) => createHash('sha1').update(readFileSync(f)).digest('hex');
  const kinds = args.includes('--png') ? ['.svg', '.txt', '.png'] : ['.svg', '.txt'];
  const names = new Set([...readdirSync(a), ...readdirSync(b)].filter((f) => kinds.some((k) => f.endsWith(k))));
  let differ = 0;
  for (const n of [...names].sort()) {
    const inA = existsSync(join(a, n));
    const inB = existsSync(join(b, n));
    if (!inA || !inB) console.log(`${inA ? 'only in A' : 'only in B'}: ${n}`);
    else if (hash(join(a, n)) !== hash(join(b, n))) console.log(`differs: ${n}`);
    else continue;
    differ++;
  }
  console.log(differ ? `${differ} of ${names.size} files differ` : `all ${names.size} files the same`);
  return differ;
}

const STEP_WAIT = 90_000;

async function smoke(browser: Browser, base: string, id: string, shots: string | undefined): Promise<string | null> {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  try {
    await page.goto(`${base}/experiments/${id}/?idle=9999`);
    await page.waitForTimeout(900);
    // The thermal experiments run in simulated time: as fast as it goes.
    if (await page.locator('#console-toggle').count()) {
      await page.click('#console-toggle');
      await page.locator('#console-wrap input').fill('speed 3600');
      await page.locator('#console-wrap input').press('Enter');
      await page.click('#console-toggle');
    }
    // A prediction, when it is asked at the start.
    const choice = page.locator('#quiz button[data-choice]:visible').first();
    if (await choice.count()) await choice.click();
    await page.waitForTimeout(300);
    for (let step = 0; step < 40; step++) {
      // Wait until the next step's button is enabled (the last motion, or the simulated run, has ended), or the
      // answer — or the choice that brings it — is there. While a thermal step runs there is no button at all.
      const t0 = Date.now();
      let state: 'step' | 'end' | 'stuck' = 'stuck';
      while (Date.now() - t0 < STEP_WAIT) {
        if (await page.locator('#quiz [data-plan]:not([disabled])').count()) {
          state = 'step';
          break;
        }
        if (await page.locator('#quiz .answer-text, #quiz [data-show-answer], #quiz .quiz-options.end button[data-choice]').count()) {
          state = 'end';
          break;
        }
        await page.waitForTimeout(200);
      }
      if (step > 0 && shots) {
        // Some benches go on moving a little after the reading is taken (a swing dying out, a block coming to rest):
        // the picture is taken once the drawing has stood still for half a second (at most 10 s).
        const bench = page.locator('#sc-bench');
        let still = await bench.innerHTML().catch(() => '');
        for (let k = 0, same = 0; k < 50 && same < 2; k++) {
          await page.waitForTimeout(200);
          const now = await bench.innerHTML().catch(() => '');
          same = now === still ? same + 1 : 0;
          still = now;
        }
        const name = join(shots, `${id}-${String(step).padStart(2, '0')}`);
        await page.locator('.scene').screenshot({ path: `${name}.png` });
        // The bench's drawing itself: the same markup — the same picture (the board's chalk and the Professor move on
        // their own time, so the screenshots alone differ between runs).
        writeFileSync(`${name}.svg`, (await page.locator('#sc-bench').innerHTML().catch(() => '')) + '\n');
        // What the Professor says, the protocol's lines and the board: the words of the step.
        const says = await page.locator('#sc-says').textContent().catch(() => '');
        const protocol = await page.locator('#protocol').innerText().catch(() => '');
        const board = await page.locator('#sc-board').textContent().catch(() => '');
        writeFileSync(`${name}.txt`, `${says ?? ''}\n---\n${protocol}\n---\n${board ?? ''}\n`);
      }
      if (state === 'end') break;
      if (state === 'stuck') {
        // (A plan done with the answer still to come is not stuck: that is looked at below.)
        if (await page.locator('#quiz [data-plan]').count()) return `step ${step + 1}: the button stays disabled`;
        break;
      }
      await page.locator('#quiz [data-plan]').first().click();
      await page.waitForTimeout(300);
    }
    // The answer: shown by itself, or after the conclusion is picked (choices at the end).
    for (let k = 0; k < 60 && !(await page.locator('#quiz .answer-text').count()); k++) {
      const end = page.locator('#quiz button[data-choice]:visible, #quiz [data-show-answer]').first();
      if (await end.count()) await end.click().catch(() => {});
      await page.waitForTimeout(250);
    }
    if (!(await page.locator('#quiz .answer-text').count())) return 'no answer';
    if (!(await page.locator('#quiz .answer-why').count())) return 'no «Чому так?»';
    return errors.length ? `JS: ${errors[0]}` : null;
  } catch (e) {
    return `crashed: ${(e as Error).message.split('\n')[0]}`;
  } finally {
    await page.close();
  }
}

async function main(): Promise<number> {
  const cmp = args.indexOf('--compare');
  if (cmp >= 0) return compare(args[cmp + 1]!, args[cmp + 2]!) ? 1 : 0;
  const base = opt('base') ?? 'http://127.0.0.1:5175';
  const only = opt('only')?.split(',');
  const shots = opt('shots');
  if (shots) mkdirSync(shots, { recursive: true });
  const jobs = Number(opt('jobs') ?? 4);
  const ids = PRESETS.map((p) => p.id).filter((id) => !only || only.includes(id));
  const browser = await chromium.launch({ executablePath: process.env['CHROME'] ?? '/usr/bin/google-chrome', headless: true });
  const bad: string[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: jobs }, async () => {
      while (next < ids.length) {
        const id = ids[next++]!;
        const t = Date.now();
        const fault = await smoke(browser, base, id, shots);
        console.log(`${fault ? 'BAD' : 'ok '} ${id} (${Math.round((Date.now() - t) / 1000)} s)${fault ? ` — ${fault}` : ''}`);
        if (fault) bad.push(id);
      }
    }),
  );
  await browser.close();
  console.log(bad.length ? `${bad.length} of ${ids.length} failed: ${bad.join(', ')}` : `all ${ids.length} passed`);
  return bad.length ? 1 : 0;
}

process.exit(await main());
