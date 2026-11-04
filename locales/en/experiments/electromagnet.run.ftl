## What the experiment says as it runs: its steps, board and answer. These texts come with the experiment when it opens; its card is in electromagnet.ftl.

electromagnet-magnet-command-apply = The ammeter reads up to 2 A.
electromagnet-magnet-command-apply-2 = Wind 10 to 300 turns.
electromagnet-magnet-command-apply-3 = Here the Earth’s field is almost vertical: a compass does not work.
electromagnet-labmagnet-say = The key is open, there is no current. Where does the compass needle point?
electromagnet-labmagnet-button = 🧭 No current: look at the compass
electromagnet-labmagnet-plan = look at the compass with no current
electromagnet-labmagnet-say-2 = Pull the nail out — the coil stays on a plastic straw. Again { $current }. What does the compass show now?
electromagnet-labmagnet-button-2 = 🪛 No nail: { $current }
electromagnet-labmagnet-plan-2 = pull the nail out, { $current }
electromagnet-labmagnet-say-3 = Swap the wires at the source’s terminals — the current goes the other way. Again { $current }. Which way does the needle turn now?
electromagnet-labmagnet-button-3 = ⇄ The current reversed: { $current }
electromagnet-labmagnet-plan-3 = reverse the current, { $current }
electromagnet-labmagnet-say-4 = Close the key and set { $current } with the rheostat. How many degrees did the compass needle turn?
electromagnet-labmagnet-button-4 = ⚡ { $current }: look at the compass
electromagnet-labmagnet-plan-4 = set the current to { $current }
electromagnet-answer-why = The current in the wire makes a magnetic field, and each turn’s field adds to the others’ — so it is proportional to the current and to the number of turns. But the coil alone is a weak magnet. Iron, though, is made of tiny “magnets” that turn along the coil’s field and add their own — tens of times stronger. That is where the electromagnet’s strength comes from. Reverse the current — the coil’s field, and the nail’s with it, turns the other way: the north and south poles swap.
electromagnet-answer-say = Three times the current — three times the field, and without the nail the needle hardly moved!
electromagnet-answer-say-2 = Let us look at the compass.
electromagnet-answer-text = , but the other way
electromagnet-answer-text-2 = hardly moved ({ $bare })
electromagnet-answer-text-3 = turned only { $bare }
electromagnet-answer-text-4 = { $turns } turns on the nail. With no current the needle looked north. With a current: { $l } — the field B = B_E·tg θ (B_E ≈ { $earth }: { $l2 }) grew in proportion to the current, though the angle did not. The current reversed — the needle turned { $back }{ $value2 }: the electromagnet’s poles swapped. Without the nail at the same { $value } the needle { $bare }: the iron core strengthens the field tens of times.
electromagnet-busy = The compass needle is still swinging — wait…
electromagnet-busy-2 = Slowly pulling the nail out of the coil…
electromagnet-say = No current — the needle looks north.
electromagnet-say-2 = hardly moved
electromagnet-say-3 = turned only { $deg }°
electromagnet-say-4 = Without the nail the needle { $value }.
electromagnet-say-5 = The needle turned { $deg }° — but the other way!
electromagnet-say-6 = The compass needle turned { $deg }°.
electromagnet-board-what = no current
electromagnet-board-what-2 = , reversed
electromagnet-board-what-3 = , no nail
electromagnet-m0-title = the compass, { $what }
electromagnet-m-e-title = the Earth’s field{ $where }
electromagnet-board-title = the electromagnet’s field: { $what }
