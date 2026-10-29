# Spark

The core of a science sandbox lab for school students (starting with physics): the student sets up an experiment, optionally makes a prediction or sets a goal, and gets an honest breakdown of the result.
A UI-independent TypeScript engine: it runs in Node, in the browser and in a Web Worker.

## What it looks like

![The lab: on the left, experiments by subject and grade; water frozen in the freezer; on the board, the formulas of each phase with the experiment's numbers](docs/screenshots/lab-desktop.png)

| | |
|---|---|
| ![The Professor reads the board: the instruments moved aside, all the formulas in view](docs/screenshots/board-reading.png) | ![Heat balance in a calorimeter: the aluminium gave, the water received](docs/screenshots/heat-balance.png) |
| The Professor reads the board | Heat balance in a calorimeter |
| ![Which metal is it: ρ = m/V from the scales and the measuring cylinder](docs/screenshots/density.png) | ![The buoyant force: a dynamometer in water](docs/screenshots/archimedes.png) |
| The density of an unknown metal | The buoyant force |
| ![«Науковий вісник» — the Professor's newspaper](docs/screenshots/newspaper.png) | ![On a phone](docs/screenshots/lab-phone.png) |
| «До речі!..» — the Professor's newspaper | On a phone |
| ![The sandbox: the hotplate already on the table, the vessels to choose from above it](docs/screenshots/choose-over-table.png) | ![Grade 7: a steel ball sinks in glycerol, the stopwatch is running](docs/screenshots/ball-in-liquids.png) |
| The sandbox: choose above the table — and put it down | A ball in liquids of different densities |

## The lab in the browser

**Option 1 — for development** (code changes show at once):

```bash
npm install
npm run web        # the browser opens by itself at http://127.0.0.1:5173 ; stop with Ctrl+C
```

The page works only while `npm run web` is running in the terminal.

**Option 2 — a single file** (open it with a double click or send it to students):

```bash
npm run web:offline  # builds dist-offline/index.html — one self-contained file
```

**Option 3 — a website** (for hosting: a page for each experiment, a catalogue, meta tags for search and sharing):

```bash
SPARK_SITE_URL=https://site.address npm run web:build  # builds dist-web/: the pages, sitemap.xml, robots.txt
```

Without `SPARK_SITE_URL` the site still builds, but without `sitemap.xml`, `canonical` and `og:url`: they need the full address. The site may also live in a subfolder (on GitHub Pages, for example).

Opening the file `web/index.html` itself will not work: it is source code, and the browser will not run it.

## The console

```bash
npm install
npm test        # vitest: the physics is checked against analytical solutions
npm run demo    # a console demo: a kettle coming to the boil
npm run experiment -- --level school --lang uk   # an experiment with its explanation: novice|school|advanced|expert|all, uk|en
npm run lab -- --goal 40 --pot glass                    # the lab: mixing water, with an optional prediction or goal
npm run knowledge:report               # how reliable the data are
npm run typecheck
npx tsx scripts/smoke.ts               # every ready-made experiment in a real browser (needs the lab running and Chrome)
```

```ts
import { createSimulation, seconds } from './src/core/index.js';
import { createThermalSolver } from './src/domains/thermal/index.js';
import { kettleScenario } from './src/scenarios/index.js';

const sim = createSimulation({ solvers: [createThermalSolver()], fixedDt: seconds(0.1) });
const after60s = sim.run(kettleScenario(), seconds(60));
```

The architecture and the plan — [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Where the data come from — [docs/DATA_POLICY.md](docs/DATA_POLICY.md) (`npm run knowledge:report`).
