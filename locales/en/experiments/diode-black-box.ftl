## diode-black-box
diode-black-box-command-apply = The source gives 0 to 6 V.
diode-black-box-volts = {"."}
diode-black-box-way-uk = the box turned round
diode-black-box-way-uk-2 = the box as it stands
diode-black-box-labbox-say = Set the source to { $source } ({ $way }), close the circuit and look at the milliammeter.
diode-black-box-labbox-button = { $value } { $source }: measure the current
diode-black-box-plan-uk = , the box turned round
diode-black-box-labbox-plan = measure the current at { $source }{ $value }
diode-black-box-ask = What is hidden in the “black box”?
diode-black-box-title = What is in the “black box”?
diode-black-box-question = Here is a closed box with two terminals, A and B. We connect it into a circuit with a source, a key, a 100 Ω protective resistor and a multimeter as a milliammeter. We set the source to 1, 2 and 3 V and write down the current, then turn the box round — swap its terminals — and do the same again. From the voltage and the current we find the circuit’s resistance R = U / I. What is inside the box?
diode-black-box-choices = A resistor
diode-black-box-choices-2 = A semiconductor diode
diode-black-box-choices-3 = Nothing — the circuit is broken
diode-black-box-answer-why = A diode is a crystal of a semiconductor whose two parts conduct differently: in one the current is carried by electrons, in the other by “holes” (places where an electron is missing). At the boundary a thin layer forms with no free charges. Connected one way, the diode narrows that layer — charges get through, the resistance is small; the other way it widens it, and there is next to no current. A resistor cannot do that: it does not care which way the current goes.
diode-black-box-answer-say = One way the current flows, the other way not: it is a diode!
diode-black-box-answer-say-2 = Let us look at what the instruments showed.
diode-black-box-answer-text = The box as it stands: { $there }. Turned round: { $back }. One way the circuit’s resistance is small and even falls with the voltage (at { $U } V the current is not { $times } but { $ratio } times that at { $U2 } V); the other way the milliammeter shows zero: a huge resistance. A resistor would let the current through both ways alike, a broken circuit neither way. Only a semiconductor diode behaves so.
diode-black-box-setup = A “black box” with two terminals, a source, a key, a 100 Ω protective resistor, a multimeter (a milliammeter), connecting wires
diode-black-box-say = The box turned round — and the milliammeter shows zero!
diode-black-box-say-2 = The box turned round — the milliammeter shows { $I }.
diode-black-box-say-3 = The key is closed: the milliammeter shows { $I }.
diode-black-box-board-title = the current at { $U } V{ $way }
diode-black-box-board-title-2 = the circuit’s resistance{ $way }
diode-black-box-board-formula = I ≈ 0 → R very large
