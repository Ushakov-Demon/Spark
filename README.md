# Spark

Ядро образовательной физической песочницы: собери установку из приборов — получи реальную симуляцию.
UI-независимый TypeScript-движок: работает в Node, браузере и Web Worker.

```bash
npm install
npm test        # vitest: физика проверяется против аналитических решений
npm run demo    # консольное демо: закипание чайника
npm run typecheck
```

```ts
import { createSimulation, seconds } from './src/core/index.js';
import { createThermalSolver } from './src/domains/thermal/index.js';
import { kettleScenario } from './src/scenarios/index.js';

const sim = createSimulation({ solvers: [createThermalSolver()], fixedDt: seconds(0.1) });
const after60s = sim.run(kettleScenario(), seconds(60));
```

Архитектура и план — [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
