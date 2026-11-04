## What the experiment says as it runs: its steps, board and answer. These texts come with the experiment when it opens; its card is in resistor-circuit.ftl.

resistor-circuit-command-apply = The source gives 0 to 6 V — no more than the voltmeter reads.
resistor-circuit-command-apply-2 = Which resistor?
resistor-circuit-command-apply-3 = The current is over 2 A — the ammeter would go off scale. Lower the voltage.
resistor-circuit-pair-command-apply = The source gives 0 to 6 V.
resistor-circuit-v = {"."}
resistor-circuit-where = the voltmeter across both resistors
resistor-circuit-where-2 = the voltmeter across resistor { $value }
resistor-circuit-where-3 = the ammeter before the fork
resistor-circuit-where-4 = the ammeter in the branch of resistor { $value }
resistor-circuit-labpair-say = { $c }{ $c2 }. Close the key and write down the ammeter and the voltmeter.
resistor-circuit-labpair-button = ⚡ { $c }
resistor-circuit-labcircuit-say = Set the source to { $source }, close the key and write down the ammeter and the voltmeter.
resistor-circuit-labcircuit-button = ⚡ Source { $source }: measure I and U
resistor-circuit-labcircuit-plan = source { $source } — measure I and U
resistor-circuit-conductor-resistance-question = We build a circuit: a source, a key, a resistor and an ammeter in series, and a voltmeter across the resistor. We set the source to 1.5, 3 and 4.5 V, write down the ammeter and the voltmeter each time, and find the resistance R = U / I. Will the conductor’s resistance change if the voltage across it is raised?
resistor-circuit-answer-conductor-resistance-why = The voltage is what makes charged particles (electrons, in a metal) move in an orderly way; the resistance is how much the conductor hinders that: the electrons keep running into the vibrating ions of the crystal lattice and are slowed. Twice the voltage drives the electrons twice as hard — they drift twice as fast, so the current is twice as large; the “obstacles” in the conductor are the same. So the ratio U / I stays — that is the resistance, a property of the conductor itself: it depends on the material, the length and the thickness of the wire, not on the instruments or the voltage. This holds while the conductor does not warm up: in a hot metal the ions vibrate harder, and the resistance grows (as in a lamp’s filament).
resistor-circuit-answer-conductor-resistance-say = R ≈ { $mean } Ω — at any voltage!
resistor-circuit-answer-conductor-resistance-text = { $list }. As the voltage rose, so did the current, and by as many times: the resistance R = U / I stayed about the same, ≈ { $mean } Ω. The spread comes from the divisions: the ammeter reads the current to 0.05 A, the voltmeter the voltage to 0.2 V, so the larger the readings, the more precise R. The current in a conductor is proportional to the voltage across it — Ohm’s law for part of a circuit: I = U / R.
resistor-circuit-consumer-power-question = The circuit has a source, a key, a resistor (the consumer), an ammeter and a voltmeter. We set the source to 1.5, 3 and 4.5 V, write down the instruments each time and find the power P = U · I. How many times does the power grow if the voltage across the resistor is doubled?
resistor-circuit-answer-consumer-power-why = Power is the product of two quantities: the voltage and the current. And the current in a resistor is itself proportional to the voltage (Ohm’s law: I = U/R). So, doubling the voltage, we double both factors: twice the voltage drives twice the current — and the power grows 2 · 2 = 4 times: P = U²/R. That is why a bulb made for 220 V glows barely at 110 V — a quarter of its power — and a device put on twice its voltage soon overheats.
resistor-circuit-answer-consumer-power-say = Twice the voltage — { $ratio } times the power!
resistor-circuit-answer-consumer-power-text = { $list }. The voltage doubled — the power grew { $ratio } times, almost four times (the difference comes from the instruments’ divisions); tripled — { $P } times, almost nine. A resistor’s power is proportional to the square of the voltage: P = U · I = U² / R.
resistor-circuit-say = The key is closed: the ammeter shows { $I }, the voltmeter { $U }.
resistor-circuit-board-title = the instruments (source { $source } V)
resistor-circuit-board-title-2 = the power of the consumer
resistor-circuit-board-title-3 = the resistance of the conductor
