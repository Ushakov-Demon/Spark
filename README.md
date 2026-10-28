# Spark

Ядро научной лаборатории-песочницы для школьников (начинаем с физики): ученик сам ставит опыт, при желании — прогноз или цель, и получает честный разбор результата.
UI-независимый TypeScript-движок: работает в Node, браузере и Web Worker.

## Як це виглядає

![Лабораторія: ліворуч — досліди за предметами й класами; вода замерзла в морозилці; на дошці — формули кожної фази з числами досліду](docs/screenshots/lab-desktop.png)

| | |
|---|---|
| ![Професор читає дошку: прилади відсунуто, видно всі формули](docs/screenshots/board-reading.png) | ![Тепловий баланс у калориметрі: алюміній віддав — вода отримала](docs/screenshots/heat-balance.png) |
| Професор читає дошку | Тепловий баланс у калориметрі |
| ![Що це за метал: ρ = m/V за терезами й мензуркою](docs/screenshots/density.png) | ![Архімедова сила: динамометр у воді](docs/screenshots/archimedes.png) |
| Густина невідомого металу | Архімедова сила |
| ![«Науковий вісник» — газета Професора](docs/screenshots/newspaper.png) | ![На телефоні](docs/screenshots/lab-phone.png) |
| «До речі!..» — газета Професора | На телефоні |
| ![Пісочниця: плита вже на столі, над ним — посуд на вибір](docs/screenshots/choose-over-table.png) | ![7 клас: сталева кулька тоне в гліцерині, секундомір іде](docs/screenshots/ball-in-liquids.png) |
| Пісочниця: обираємо над столом — і ставимо | Кулька в рідинах різної густини |

## Лабораторія в браузері

**Варіант 1 — для розробки** (зміни в коді видно одразу):

```bash
npm install
npm run web        # браузер відкриється сам на http://127.0.0.1:5173 ; зупинити — Ctrl+C
```

Сторінка працює, лише поки в терміналі запущено `npm run web`.

**Варіант 2 — один файл** (можна відкрити подвійним клацанням або надіслати учням):

```bash
npm run web:offline  # створить dist-offline/index.html — один самодостатній файл
```

**Варіант 3 — сайт** (для хостингу: сторінка кожного досліду, каталог, мета-теги для пошуку й поширення):

```bash
SPARK_SITE_URL=https://адреса.сайту npm run web:build  # створить dist-web/: 100 сторінок, sitemap.xml, robots.txt
```

Без `SPARK_SITE_URL` сайт теж збереться, але без `sitemap.xml`, `canonical` і `og:url`: їм потрібна повна адреса. Сайт може лежати й у підпапці (наприклад, на GitHub Pages).

Відкривати сам файл `web/index.html` не можна: це вихідний код, браузер його не виконає.

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
