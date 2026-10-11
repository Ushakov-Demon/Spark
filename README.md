# Spark

Ядро научной лаборатории-песочницы для школьников (начинаем с физики): ученик сам ставит опыт, при желании — прогноз или цель, и получает честный разбор результата.
UI-независимый TypeScript-движок: работает в Node, браузере и Web Worker.

## Лабораторія в браузері

```bash
npm install
npm run web        # відкриє http://localhost:5173 — дослід «нагрій воду»: 6 нагрівачів, ручка-крутилка, графік, пояснення (uk/en)
npm run web:build  # статичний сайт у dist-web/ (можна викласти на GitHub Pages)
```

## Консоль

```bash
npm install
npm test        # vitest: физика проверяется против аналитических решений
npm run demo    # консольное демо: закипание чайника
npm run experiment -- --level school --lang uk   # дослід з поясненням: novice|school|advanced|expert|all, uk|en
npm run lab -- --goal 40 --pot glass                    # лаборатория: смешивание воды, прогноз/цель по желанию
npm run knowledge:report               # насколько надёжны данные
npm run typecheck
```

```ts
import { createSimulation, seconds } from './src/core/index.js';
import { createThermalSolver } from './src/domains/thermal/index.js';
import { kettleScenario } from './src/scenarios/index.js';

const sim = createSimulation({ solvers: [createThermalSolver()], fixedDt: seconds(0.1) });
const after60s = sim.run(kettleScenario(), seconds(60));
```

Архитектура и план — [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Откуда берутся данные — [docs/DATA_POLICY.md](docs/DATA_POLICY.md) (`npm run knowledge:report`).
