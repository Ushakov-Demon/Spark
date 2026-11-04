## fountain-model
fountain-model-command-apply = The stand holds the bottle from 10 cm below the nozzle to 50 cm above it.
fountain-model-command-apply-2 = So fast the water in the tube churns — the model does not hold here.
fountain-model-labfountain-where = { $head } cm below the nozzle
fountain-model-labfountain-where-2 = { $head } cm above the nozzle
fountain-model-say-uk = {" "}How high does the jet go?
fountain-model-labfountain-say = Set the bottle so that the water in it stands { $where } — and look at the nozzle.{ $value }
fountain-model-labfountain-button = { $value } The water in the bottle { $where }
fountain-model-labfountain-plan = the water in the bottle { $where }
fountain-model-ask = How high does the fountain go?
fountain-model-title = A model of a fountain
fountain-model-question = A plastic bottle with its bottom cut off hangs neck down on a stand. From the neck a silicone tube 1 m long goes down, along the table and up to a glass nozzle over a basin. We pour water into the bottle (topping it up so the level stays) and set it so that the water in it stands 5 cm below the nozzle, then 10, 30 and 50 cm above. Each time we measure with a ruler how high the jet goes. How high does the fountain go?
fountain-model-choices = Almost to the level of the water in the bottle — but a little lower
fountain-model-choices-2 = Above the level of the water in the bottle: falling through the tube, the water speeds up
fountain-model-choices-3 = Barely — a few centimetres: a metre of tube holds the water back
fountain-model-asides = The «Snake» fountain in Sofiyivka park in Uman, laid out in 1796, shoots 12–16 metres up without any pump: the water comes along a gravity-fed underground water pipe, and the top of the jet is only 1.5–2.5 metres below the level of the Upper Pond. The fountain’s head was made ten times narrower than the pipe — as our nozzle is narrower than the tube.
fountain-model-answer-why =
    The water in the bottle stands above the nozzle — it has potential energy. Running down the tube to the nozzle, it speeds up and flies out as fast as a body would after falling from the same height: v = √(2gH) (Torricelli’s law). And flying up, the jet trades its speed for height again: it can rise just h = v²/(2g) = H — to the level of the water in the bottle, and no higher: there is no more energy to be had. It is the same law as in communicating vessels: water seeks one level. So a bottle below the nozzle gives no fountain at all — the water in the tube only rises to the level in the bottle.

    The jet falls a little short of the level because of friction: the water rubs in the tube (the faster it flows, the more) and on the air. So the higher the bottle, the more centimetres the jet misses, though the share of the height stays almost the same.
fountain-model-answer-say = The jet nearly reached the water in the bottle: { $jet } cm of { $head }!
fountain-model-answer-say-2 = Let us look at how high the fountain went.
fountain-model-text-list = H = { $head } cm — h = { $jet } cm
fountain-model-text-tail = {" "}Without friction the water from under { $head } cm would leave at √(2gH) ≈ { $ideal } and rise the whole { $head } cm; in fact at { $speed }, which is v²/(2g) ≈ { $speed2 } cm: about { $loss } cm of height went into the tube’s friction (the flow in it is smooth, laminar: a Reynolds number of ≈ { $re }, below 2300).
fountain-model-text-head = The bottle below the nozzle — no jet: the water in the tube stood at the level of the water in the bottle.{" "}
fountain-model-text-head-2 = { $value }{ $list }. Each time the jet fell short of the water in the bottle: { $lost }.
fountain-model-answer-text = {" "}(The air’s drag is left out here: a real jet falls a little shorter still.)
fountain-model-setup = A plastic bottle with its bottom cut off on a stand, a silicone tube 1 m long (6 mm inside), a glass nozzle (2 mm), a basin, a ruler, water
fountain-model-busy = Setting the bottle — the water runs through the tube…
fountain-model-busy-2 = Lowering the bottle…
fountain-model-shown = no jet: the water in the tube stands at the level of the water in the bottle
fountain-model-shown-2 = H = { $head } cm — the jet { $value } cm high
fountain-model-say = Nothing shoots: the water in the tube rose only to the level of the water in the bottle — and stands.
fountain-model-say-2 = The water in the bottle is { $head } cm above the nozzle — and the jet goes { $value } cm up.
fountain-model-board-title = the bottle below the nozzle
fountain-model-board-numbers = no jet
fountain-model-board-title-2 = the water H = { $head } { $u } above the nozzle
