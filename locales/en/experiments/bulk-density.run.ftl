## What the experiment says while it runs: steps, board, answer. These come with the experiment when it is opened; its card is in bulk-density.ftl.

bulk-density-command-substance = There is no such granular substance on the table.
bulk-density-pour-say = Pour the { $substance ->
        [sucrose] sugar
        [sodium-bicarbonate] baking soda
        [calcium-carbonate] chalk powder
        [copper-sulfate] copper sulfate
        [iron] iron filings
       *[other] table salt
    } into the measuring cylinder to the 100 mL mark (the balance tared with the cylinder) and weigh it.
bulk-density-pour-button = ⚖ Pour and weigh
bulk-density-pour-plan = pour to 100 mL and weigh
bulk-density-fill-say = { $liquid ->
        [oil] Pour sunflower oil in from another cylinder — up to the grains’ top. Why not water? Water would dissolve this substance.
       *[water] Pour water in from another cylinder — up to the grains’ top. Water hardly dissolves this substance.
    }
bulk-density-fill-button = { $liquid ->
        [oil] 🫗 Pour in oil
       *[water] 🫗 Pour in water
    }
bulk-density-fill-plan = { $liquid ->
        [oil] pour oil in up to the grains’ top
       *[water] pour water in up to the grains’ top
    }
bulk-density-shake-say = Now pour as much of the dry substance and tap the cylinder on the table till the grains settle no more.
bulk-density-shake-button = 🫨 Shake down
bulk-density-shake-plan = shake down the same amount
bulk-density-busy-pour = Pouring…
bulk-density-busy-fill = Pouring in…
bulk-density-busy-shake = Tapping…
bulk-density-say-pour = { $m } in { $V }: the mass over the volume is { $rho }. That is the bulk density.
bulk-density-say-shake = It settled to { $V }: the bulk density is { $rho } now — more, and the substance is the same.
bulk-density-say-fill = { $Vl } of { $liquid ->
        [oil] oil
       *[water] water
    } went in — that much room there was between the grains. The grains themselves are { $Vg }, and their density ≈ { $rho } (the table gives { $table }).
bulk-density-board-bulk = bulk density: { $what }
bulk-density-board-shaken = shaken down: { $what }
bulk-density-board-grains = the grains’ own volume: { $what }
bulk-density-board-density = the substance’s density: { $what }
bulk-density-asides = How do you pack equal balls most tightly? In 1606 the English mathematician Thomas Harriot, who counted stacked cannonballs for Sir Walter Raleigh, wrote about it with Johannes Kepler. In 1611, in «On the six-cornered snowflake», Kepler supposed that nothing is tighter than a stack of cannonballs — there the balls fill about 74 % of the volume. Only Thomas Hales managed to prove it: in 1998 he announced a proof in which a computer went through a great many cases, and in 2014 its full computer check was completed. Grains poured at random fill noticeably less — about 60 %.
bulk-density-answer-why =
    Density is the mass in a unit of the substance’s own volume. Poured into a cylinder, a substance does not fill it all: there is air between the grains. So the mass over the volume poured is the bulk density, and it is less than the substance’s own: grains poured at random fill only about 60 % of the volume.

    To find the grains’ own volume, the gaps are filled with a liquid: as much of it goes in as there was air. The grains’ volume is the volume poured minus the liquid’s. But the liquid must not dissolve the substance: salt, sugar, soda, copper sulfate dissolve in water, so oil is taken for them. Chalk and iron filings can be covered with water — or simply poured into water to see how far the level rises.

    Shake the cylinder — and the grains lie tighter: the bulk density grows. But the density of the substance itself does not change.
bulk-density-answer-say = The bulk density is { $bulk }, and the substance itself — { $own }: there was air between the grains.
bulk-density-answer-row-bulk = bulk density ≈ { $rho }
bulk-density-answer-row-own = with { $liquid ->
        [oil] oil
       *[water] water
    } in the gaps the substance’s density ≈ { $rho } (the table gives { $table })
bulk-density-answer-row-shaken = shaken down — ≈ { $rho }
bulk-density-answer-text = The substance: { $what }. { $steps }
