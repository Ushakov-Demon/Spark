## What the experiment says while it runs: steps, board, answer. These come with the experiment when it is opened; its card is in mandarin-float.ftl.

mandarin-float-command-diameter = The mandarin’s diameter must be more than zero.
mandarin-float-command-peel = The peel must be thinner than half the diameter: there must be flesh inside.
mandarin-float-command-salt = There cannot be less than no salt.
mandarin-float-part-whole = the mandarin
mandarin-float-part-flesh = the flesh
mandarin-float-part-peel = the peel
mandarin-float-weigh-say = A mandarin { $d } across, its peel { $peel }. Weigh it.
mandarin-float-weigh-button = ⚖ Weigh the mandarin
mandarin-float-weigh-plan = weigh the mandarin
mandarin-float-peel-say = Now peel the mandarin and weigh the flesh and the peel apart.
mandarin-float-peel-button = 🍊 Peel and weigh
mandarin-float-peel-plan = peel it; weigh the flesh and the peel
mandarin-float-dunk-say-whole = Put the mandarin into the beaker of water on the balance (tared with the beaker) and push it under with the rod.
mandarin-float-dunk-button-whole = 💧 Mandarin into water
mandarin-float-dunk-plan-whole = the mandarin into water — and under with the rod
mandarin-float-dunk-say-flesh = { $liquid ->
        [salt] Now the peeled mandarin — into the salty water.
       *[water] Lower the peeled mandarin into the water — on a thread, not touching the bottom.
    }
mandarin-float-dunk-button-flesh = { $liquid ->
        [salt] 🧂 Flesh into salty water
       *[water] 💧 Flesh into water
    }
mandarin-float-dunk-plan-flesh = { $liquid ->
        [salt] the flesh into salty water
       *[water] the flesh into water
    }
mandarin-float-dunk-say-peel = Now the peel — into the water, and push it under with the rod too.
mandarin-float-dunk-button-peel = 💧 Peel into water
mandarin-float-dunk-plan-peel = the peel into water — and under with the rod
mandarin-float-busy-weigh = Onto the balance…
mandarin-float-busy-peel = Peeling…
mandarin-float-busy-dunk = Into the water…
mandarin-float-shown-peel = flesh { $flesh }, peel { $peel }
mandarin-float-shown-dunk = { $floats ->
        [yes] floats
       *[no] sinks
    }; V ≈ { $V }, ρ ≈ { $rho }
mandarin-float-say-weigh = The mandarin weighs { $m }.
mandarin-float-say-peel = The flesh — { $flesh }, the peel — { $peel }.
mandarin-float-say-dunk = { $floats ->
        [yes] It floats: { $share } % of it under water.
       *[no] It sinks!
    } Right under, the balance showed { $dm } — that much liquid it pushes aside: its volume is { $V }, its density ≈ { $rho } (the liquid’s — { $liquid }).
mandarin-float-board-mass = the mandarin’s mass
mandarin-float-board-parts = the flesh’s and the peel’s mass
mandarin-float-board-volume = volume: { $part } ({ $liquid ->
        [salt] in salty water
       *[water] in water
    })
mandarin-float-board-density = density: { $part }
mandarin-float-asides = A mandarin’s peel keeps it afloat just as cork keeps up a life jacket. A cork life jacket was on sale as early as 1804: The Sporting Magazine advertised one. The modern life jacket is credited to Captain John Ross Ward, Inspector of Lifeboats of the British RNLI: in 1854 he made a brown cork vest for lifeboat crews — against the weather and to keep them afloat. In 1904 the rigid cork gave way to watertight pouches of kapok, a light plant fibre.
mandarin-float-answer-why =
    A body floats when its mean density is less than the liquid’s: then the buoyant force ρ_l·g·V balances its weight before it is all under. So what matters is the density of the whole mandarin — the flesh and the peel together.

    The flesh is mostly juice, sugar dissolved in water, and a little denser than water: a peeled mandarin sinks. But the peel is spongy: its white layer is full of air, and it is much lighter than water. With it the mandarin has a larger volume for nearly the same mass — and its mean density falls below the water’s. The peel is the mandarin’s life jacket.

    A peeled mandarin can be made to float too: dissolve enough salt in the water to make it denser than the flesh. And a mandarin with a very thin peel may sink even whole — there is too little air in the peel to make up for the heavier flesh.
mandarin-float-answer-say = { $whole ->
        [yes] The mandarin in its peel floats,
       *[no] The mandarin sinks even in its peel,
    } and { $flesh ->
        [yes] peeled — it floats too!
       *[no] peeled — it sinks: the peel held it up.
    }
mandarin-float-answer-row = { $part } { $liquid ->
        [salt] in salty water
       *[water] in water
    }: ρ ≈ { $rho } — { $floats ->
        [yes] floats
       *[no] sinks
    }
mandarin-float-answer-text = The density of the mandarin in its peel ≈ { $whole }, of the flesh ≈ { $flesh }, of the peel ≈ { $peel }; of water — { $water }. { $steps }
