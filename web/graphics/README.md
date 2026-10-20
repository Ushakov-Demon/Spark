# Graphics of the lab

Every picture of the page lives here, by what it shows. Everything is drawn as SVG — no bitmaps.

| Folder | What | How |
|---|---|---|
| `icons/operations/` | buttons of the actions: heat, boil, freeze, wait for equilibrium… | `.svg` files, 24 × 24, `currentColor` |
| `icons/vessels/` | vessels on the shelf cards: pot, beaker, calorimeter, measuring cylinder… | `.svg` files |
| `icons/devices/` | heaters, coolers, power sources, "just the room" | `.svg` files |
| `icons/instruments/` | scales and the dynamometer | `.svg` files |
| `professor/` | the Professor: `front.ts` (moods, idle scenes), `side.ts` (reading the board), `preview.html` (all moods on one page) | code: the face and the pose change |
| `scene/` | the lab table: `vessels.ts`, `devices.ts`, `instruments.ts` (scales, dynamometer), `bodies.ts` (blocks and balls in a liquid), `colors.ts`, `constants.ts`, `types.ts` | code: sizes, colours and readings come from the experiment |
| `shelf/` | pictures of the shelf cards: reagent bottles, jars, blocks, balls | code: colour and formula |

A new icon is a new `.svg` file in its folder; its file name is the name operations and equipment use (`icon`, `look`). The scene itself (`web/scene.ts`) only puts these drawings together and moves their live parts.
