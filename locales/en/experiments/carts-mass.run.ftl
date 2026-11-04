## What the experiment says as it runs: its steps, board and answer. These texts come with the experiment when it opens; its card is in carts-mass.ftl.

carts-mass-command-apply = Up to three weights on the cart.
carts-mass-labcarts-say = Hang the first cart on the dynamometer. What force of gravity acts on it?
carts-mass-labcarts-button = ⚖ Dynamometer: cart 2
carts-mass-labcarts-button-2 = ⚖ Dynamometer: cart 1
carts-mass-labcarts-plan = cart 2 on the dynamometer
carts-mass-labcarts-plan-2 = cart 1 on the dynamometer
carts-mass-labcarts-say-2 = The carts are alike. We burn the thread — the spring pushes them apart. By the video’s frames we measure how far each went in 0.5 s.
carts-mass-labcarts-button-3 = 🔥 Alike carts
carts-mass-labcarts-plan-3 = alike carts
carts-mass-labcarts-say-3 = On the second cart — { $weights } of 100 g. Squeeze the spring again and burn the thread.
carts-mass-labcarts-button-4 = 🔥 Cart 2 + { $weights }
carts-mass-labcarts-plan-4 = cart 2 + { $weights }
carts-mass-answer-why = The spring acts on both carts alike, but the heavier cart is more inert — it gathers speed more slowly, so it ends up slower. So as many times smaller its speed, so many times greater its mass: m₂ / m₁ = v₁ / v₂. The carts set off together and went for the same time, so the ratio of the paths is the ratio of the speeds. This way mass can be measured without scales — by inertia. And the dynamometer shows that the force of gravity is as many times greater too: P = m·g. So mass measures both a body’s inertia and its pull to the Earth. The wheels’ friction over these 0.5 s is left out.
carts-mass-answer-say = The cart three times heavier went { $last } less — and gravity on it is { $P2 } greater.
carts-mass-text-parts = one weight
carts-mass-text-parts-2 = two weights
carts-mass-text-parts-3 = cart 2 + { $value }
carts-mass-text-parts-4 = { $value }: { $a } and { $b }, l₁ / l₂ ≈ { $a2 }
carts-mass-text-weigh = ; on the dynamometer: cart 1 — { $P1 }, cart 2 with two weights — { $P2 }, { $P22 } more
carts-mass-answer-text = {" "}(2.9 N, not 3.0 — the dynamometer reads to tenths: 2.94 N.)
carts-mass-busy = The thread burnt — the carts roll apart…
carts-mass-cm = {"."}
carts-mass-say = The dynamometer shows { $value }.
carts-mass-say-2 = In 0.5 s: the first cart — { $recs }, the second — { $recs2 }.
carts-mass-board-title = cart { $cart } on the dynamometer
carts-mass-board-title-2 = cart 2 + { $w } × 100 g
carts-mass-board-title-3 = { $value }: in 0.5 s
carts-mass-board-title-4 = as many times slower — so many times heavier
carts-mass-view-slow = slowed
carts-mass-weights = { $n ->
        [1] one weight
       *[other] { count-weights }
    }
carts-mass-second-say = And now the second cart with { carts-mass-weights }. How many times greater is the force of gravity?
carts-mass-times = { $x } times
