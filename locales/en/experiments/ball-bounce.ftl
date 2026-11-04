## ball-bounce
ball-bounce-command-apply = Watch 1 to 5 bounces.
ball-bounce-name-pingpong = the table tennis ball
ball-bounce-name-tennis = the tennis ball
ball-bounce-name-clay = the plasticine ball
ball-bounce-labbounce-plan = { $name } from 1 m: the first bounce
ball-bounce-ask = Why does the ball bounce lower each time?
ball-bounce-title = Mechanical energy changing form: a ball’s bounce
ball-bounce-question = A metre stick stands by a steel plate. We let a table tennis ball go from 1 m and mark how high it bounces — after the first impact, the second, the third. Then the same with a tennis ball and a plasticine ball. At the top the ball has potential energy Eₚ = m·g·h, proportional to the height. Why does the ball bounce lower each time?
ball-bounce-choices = At each impact part of the energy becomes internal: the ball and the plate warm a little, and part goes as sound
ball-bounce-choices-2 = At each impact part of the energy simply vanishes
ball-bounce-choices-3 = The Earth pulls the ball harder each time
ball-bounce-answer-why = At the top the ball has potential energy Eₚ = m·g·h. Falling, it speeds up: potential energy turns into kinetic. Hitting the plate, the ball is squashed for a moment, then straightens and pushes off — and, rising, trades kinetic energy back for potential. But the squashing does not give everything back: part of the energy warms the ball and the plate (becomes internal energy), part goes as the sound of the impact. So there is less mechanical energy each time, and the ball rises lower: the height shows the share of energy it kept. Energy does not vanish — it only turns into other forms: this is the conservation of energy. A springy table tennis ball keeps about 80 % per impact, a tennis ball a little over half, and plasticine, squashed, stays on the plate: all its mechanical energy became internal. The Earth pulls the ball just the same at any of these heights.
ball-bounce-answer-say = From a metre the table tennis ball bounced to { $h } cm — it kept { $h } % of its energy; each time about the same share of the one before.
ball-bounce-text-parts = { $h } cm
ball-bounce-text-parts-2 = The table tennis ball from 1 m: { $value2 } — an energy of { $m } at the top, { $value } after the impacts
ball-bounce-text-parts-3 = , it kept { $h } % of its energy
ball-bounce-text-parts-4 = : all the energy became internal
ball-bounce-answer-text = {" "}The shares are from the balls’ tests under the ITTF and ITF rules; the air’s drag is left out.
ball-bounce-setup = A metre stick on a stand, a steel plate, a table tennis ball, a tennis ball, a plasticine ball
ball-bounce-busy = Letting the ball go — watch how high it bounces…
ball-bounce-say = { $ball } flattened and stayed on the plate — no bounce at all.
ball-bounce-say-2 = It bounced
ball-bounce-say-3 = Bounce { $bounce }
ball-bounce-say-4 = { $value } — to { $h } cm.
ball-bounce-board-title = bounce { $k }: h = { $h }
ball-bounce-board-title-2 = { $what } at the top: h₀ = 1 m
ball-bounce-board-formula = Eₚ = m·g·h
ball-bounce-view-labels = heat
## $n — which bounce; $ball — pingpong, tennis, clay.
ball-bounce-ordinal = { $n ->
        [1] first
        [2] second
        [3] third
        [4] fourth
        [5] fifth
       *[other] { $n }th
    }
ball-bounce-again-say = From a metre again — and now watch the { ball-bounce-ordinal } bounce. How much lower is it?
ball-bounce-again-button = { $icon } The { ball-bounce-ordinal } bounce
ball-bounce-again-plan = { $name }: the { ball-bounce-ordinal } bounce
ball-bounce-first-say = { $name }: let go from 1 m above the plate. How high will it bounce?
ball-bounce-first-button = { $icon } { $name } from 1 m
