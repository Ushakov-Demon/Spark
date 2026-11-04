## gear-train
gear-train-command-apply = A train is made of 2–4 gears of the set (8, 24, 40 teeth).
gear-train-command-apply-2 = The handle is turned from a part of a turn to 10 turns.
gear-train-labgears-say = Count the teeth on the set’s three gears.
gear-train-labgears-button = ⚙ Count the teeth
gear-train-labgears-plan = count the gears’ teeth
gear-train-labgears-say-2 = Now put one more gear between them: { $chain }. Turn the driver ({ $train } teeth) { $turns }. How many turns will the last one make — and which way?
gear-train-labgears-say-3 = Mesh the gears { $chain }. Turn the driver ({ $train } teeth) { $turns } and count the driven one’s ({ $train2 }) turns by its chalk mark. Which way does it turn?
gear-train-labgears-button-2 = ⚙ { $chain }: the driver { $turns }
gear-train-labgears-plan-2 = { $chain }: turn the driver { $turns }
gear-train-ask = How does a gear train change the speed and the direction of turning?
gear-train-title = A gear train: faster, slower, which way
gear-train-question = Gears of a construction set on the pins of a board: we count their teeth. We mesh a 24-tooth gear with an 8-tooth one and turn the driver one turn by its handle; then 8 → 40, five turns; and then we put a 40-tooth gear between the 24 and the 8. Each time we count the last gear’s turns by its chalk mark and see which way it turns. How does a gear train change the speed and the direction of turning?
gear-train-choices = A small gear turns faster — as many times as it has fewer teeth; each pair reverses the direction
gear-train-choices-2 = The speed is the same — the teeth are meshed; and so is the direction
gear-train-choices-3 = The big gear turns faster — it is bigger
gear-train-asides = Gear trains are two thousand years older than pendulum clocks. In 1901, off the Greek island of Antikythera, the wreck of a ship was raised from the sea floor, and among it a bronze mechanism of the 2nd century BC with at least 30 gears (modern scans count about 35). Turning its crank, one could show where the Sun and the Moon stood in the sky, predict eclipses decades ahead and even follow the four-year cycle of the games. It is called the oldest known analogue computer.
gear-train-answer-why =
    The teeth of meshing gears go in between each other, so in the same time as many teeth of both pass the point where the gears touch. A 24-tooth gear passes 24 teeth in a turn — and an 8-tooth gear has to turn three times for that: n₁·z₁ = n₂·z₂, so n₂ = n₁·z₁/z₂. From a big gear to a small one the train speeds the turning up, from a small to a big one it slows it down.

    And the direction? At the point of contact the teeth move together — so the gears themselves turn towards each other: each pair reverses the direction. An intermediate gear between them does not change the ratio of the turns (only the first and the last count), but it reverses the direction once more — so the last one again turns the way the driver does. That is how clocks, bicycles and mixers change the speed and the direction of turning.
gear-train-answer-say = The turns go inversely as the teeth, and each pair reverses the direction!
gear-train-answer-say-2 = Let us look at how the gears turned.
gear-train-text-list = { $train }: the driver — { $n1 } turns, the last — { $n2 } turns ({ $z1 }/{ $z2 } = { $z12 }), { $same }
gear-train-answer-text = The last gear’s turns each time equalled the driver’s times the ratio of the first and the last gear’s teeth:{ $steps }. With the 40-tooth gear in between the ratio stayed 24/8 = 3, and the direction came back.
gear-train-setup = A board with pins, three gears of a construction set (8, 24 and 40 teeth), a handle on the driving gear, chalk
gear-train-busy = Turning the handle…
gear-train-shown = {" "}teeth
gear-train-shown-2 = the driven one — { $value }, { $same }
gear-train-say = Teeth: { $value }.
gear-train-say-2 = {" "}— faster!
gear-train-say-3 = {" "}— slower.
gear-train-say-4 = The driver — { $driver }, and the last one — { $n }, { $same }{ $value }
gear-train-board-title = the gears’ teeth
gear-train-board-title-2 = { $chain }: the turns
gear-train-board-title-3 = { $chain }: how many times, which way
gear-train-view-read = {"."}
gear-train-turns = turn
gear-train-turns-2 = turns
gear-train-way = the same way
gear-train-way-2 = the other way
gear-train-answer-way = the other way
