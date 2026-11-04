## cartesian-diver
cartesian-diver-command-apply = A hand squeezes a bottle up to a few tens of kilopascals.
cartesian-diver-labdiver-say = Weigh the diver — the dropper with its rubber cap — on the laboratory balance.
cartesian-diver-labdiver-button = ⚖ Weigh the diver
cartesian-diver-labdiver-plan = weigh the diver
cartesian-diver-labdiver-say-2 = Let a little water into the dropper so that the diver just floats, and push it under on a thin wire in the measuring cylinder: how far did the water rise?
cartesian-diver-labdiver-button-2 = 🧪 The diver’s volume in the cylinder
cartesian-diver-labdiver-plan-2 = take the diver’s volume with the cylinder
cartesian-diver-labdiver-say-3 = The diver floats in the full bottle, its cap screwed on. Squeeze the bottle lightly — and watch the water in the dropper’s tube.
cartesian-diver-labdiver-say-4 = Now squeeze the bottle hard — and watch the diver and the water in the tube.
cartesian-diver-labdiver-button-3 = ✊ Squeeze the bottle lightly
cartesian-diver-labdiver-button-4 = ✊ Squeeze the bottle hard
cartesian-diver-labdiver-plan-3 = squeeze the bottle lightly
cartesian-diver-labdiver-plan-4 = squeeze the bottle hard
cartesian-diver-labdiver-say-5 = Let the bottle go. What happens to the diver?
cartesian-diver-labdiver-button-5 = 🖐 Let the bottle go
cartesian-diver-labdiver-plan-5 = let the bottle go
cartesian-diver-ask = What happens to the diver in the bottle when the bottle is squeezed — and why?
cartesian-diver-title = The Cartesian diver: a submarine and a fish
cartesian-diver-question = A glass dropper with a rubber cap — the “diver”: a little water and a little air in it, and it just floats. We weigh it, take its volume with a measuring cylinder, then put it into a plastic bottle full of water and screw the cap on. We squeeze the bottle lightly, then hard, and let it go — watching the diver and the water in its glass tube. What happens to the diver when the bottle is squeezed — and why?
cartesian-diver-choices = It dives: water gets into the dropper, the air there is squeezed, and the diver’s mean density grows above the water’s
cartesian-diver-choices-2 = It dives: the hand presses on the water, and the water presses on the diver from above and pushes it down
cartesian-diver-choices-3 = Nothing: water does not compress, so the bottle cannot be squeezed
cartesian-diver-asides = The diver is called Cartesian — after Cartesius, that is René Descartes: it is said to be his invention. But the first to describe it was the Italian Raffaello Magiotti, often in touch with Galileo, in 1648, in a book «Renitenza certissima dell’acqua alla compressione» — «Very firm resistance of water to compression». Magiotti held water to be quite incompressible. There he was wrong: water compresses too, only some 20 thousand times less than air at the Earth’s surface — so the diver dives all the same.
cartesian-diver-what-act = Let go at the bottom
cartesian-diver-what-act-2 = Squeezed lightly (≈{" "}
cartesian-diver-what-act-3 = Squeezed hard (≈{" "}
cartesian-diver-answer-what = it stayed at the bottom
cartesian-diver-answer-what-2 = above the water’s, the diver dived
cartesian-diver-answer-what-3 = below the water’s, the diver came up
cartesian-diver-answer-what-4 = still below the water’s, the diver floats
cartesian-diver-answer-what-5 = { $act }: the water in the tube rose { $h }, so { $dV } came in; ρ = { $value } / { $V } ≈ { $rho } — { $value2 }.
cartesian-diver-answer-why =
    A body in a liquid sinks if its mean density is greater than the liquid’s and comes up if it is less. The diver’s mean density is its mass (glass and rubber) over all the room it takes in the water: the glass, the rubber and the air in the dropper. The water inside the dropper is not its own: it is part of the water in the bottle anyway.

    Squeezing the bottle, we raise the pressure in the water — and by Pascal’s law it passes on in all directions alike, into the dropper as well, onto the air there. Water hardly compresses, but air does easily: its volume shrinks, water comes into the dropper, and the same mass takes less room. The mean density grows; once above the water’s, the diver dives. Let go — the air expands, pushes the water out, and the diver comes up. The hand does not “push it down” from above: the extra pressure is the same from all sides.

    This is how submarines dive and surface: sea water is let into the ballast tanks — the boat gets heavier than the same volume of water and goes down; to surface, the water is blown out of the tanks with compressed air. The diver with the water in its dropper is such a tank. And a fish has a swim bladder of gas: squeezing or widening it, it changes its volume — and its mean density, like our diver.
cartesian-diver-answer-say = Squeezed — and the diver’s density ≈ { $rho } rose above the water’s!
cartesian-diver-answer-say-2 = Let us look at what the diver did.
cartesian-diver-text-head = The diver weighs { $value }, its volume with the air is { $value2 }: a mean density of { $rho0 } — less than the water’s ({ $water }), so it floats.
cartesian-diver-text-tail = {" "}The air shrank because the pressure in the bottle grew; at the bottom the water above it presses as well — { $extra } Pa 25 cm down — but that is too little to hold the diver down. (The water in the tube is taken by its diameter, 4 mm; the hand’s pressure is an estimate.)
cartesian-diver-setup = A glass dropper with a rubber cap (the diver), a full 1.5 L plastic bottle with its cap, a laboratory balance, a 10 mL measuring cylinder, a thin wire, a ruler
cartesian-diver-busy = Squeezing the bottle…
cartesian-diver-busy-2 = Letting the bottle go…
cartesian-diver-shown = sinks
cartesian-diver-shown-2 = floats
cartesian-diver-shown-3 = the water in the tube up by { $value }; the diver { $value2 }
cartesian-diver-shown-4 = stays at the bottom
cartesian-diver-shown-5 = comes up
cartesian-diver-shown-6 = the water in the tube went down — only { $value } above where it began; the diver { $value2 }
cartesian-diver-say = The diver weighs { $r }.
cartesian-diver-say-2 = The water in the cylinder rose by { $r } — the diver’s volume with its air.
cartesian-diver-say-3 = The water in the tube rose { $value } — and the diver dived to the bottom!
cartesian-diver-say-4 = The water in the tube rose { $value }, and the diver floats as before.
cartesian-diver-say-5 = The diver stayed at the bottom!
cartesian-diver-say-6 = The water left the dropper — and the diver comes up!
cartesian-diver-board-title = the diver’s mass
cartesian-diver-out-title = the diver’s volume with its air
cartesian-diver-board-title-2 = the diver’s mean density
cartesian-diver-board-what = let go at the bottom
cartesian-diver-board-what-2 = squeezed lightly
cartesian-diver-board-what-3 = squeezed hard
cartesian-diver-out-title-2 = above where it began by
cartesian-diver-out-title-3 = up by
cartesian-diver-out-title-4 = { $what }: the water in the tube (d = { $d } mm) { $value }
cartesian-diver-board-title-3 = the diver’s density (water { $rho } { $gcm })
