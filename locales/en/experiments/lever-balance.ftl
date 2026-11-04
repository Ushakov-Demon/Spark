## lever-balance
lever-balance-command-apply = What to weigh?
lever-balance-text-name = the empty vessel
lever-balance-text-name-2 = the vessel with the liquid
lever-balance-text-name-3 = the body
lever-balance-text-say = Put { $name } on the left pan and balance it, adding weights with tweezers on the right — from larger to smaller.
lever-balance-text-button = ⚖ Weigh: { $name }
lever-balance-text-plan = weigh { $name }
lever-balance-title = Weighing on a lever balance
lever-balance-question = On a lever balance we weigh an aluminium cylinder, a wooden block, an empty glass and the glass with water. The load goes on the left pan, and on the right — weights from the set with tweezers, from larger to smaller, until the balance is level. How much water is in the glass?
lever-balance-command-label = Aluminium cylinder
lever-balance-command-label-2 = Wooden block
lever-balance-command-label-3 = Empty glass
lever-balance-command-label-4 = Glass with water
lever-balance-choices = The difference of weighings: the glass with water minus the empty glass
lever-balance-choices-2 = As much as the balance showed with the glass of water
lever-balance-choices-3 = As much as the empty glass weighs
lever-balance-answer-why = A lever balance is a lever with equal arms: the pans hang at equal distances from the axis. So the beam is level when the forces on both sides are equal, that is, the masses are — the Earth pulls each gram alike. The balance compares masses, not weights: on the Moon it would show the same, as the body and the weights would both get lighter alike.
lever-balance-answer-say = The glass holds { $water } of water!
lever-balance-answer-text = { $steps }. The water’s mass is the difference of two weighings: m = m₂ − m₁ = { $water }. The smallest weight of the set is 10 mg, so that is how precisely each body was weighed. The water’s mass is less precise: in a difference of two weighings the errors add up. Loads go on the left pan, weights on the right, with tweezers, from larger to smaller; nothing dirty or wet goes on the pans, and a liquid is weighed only in a vessel.
lever-balance-liquid-density-ask = Is the liquid lighter or heavier than water, for equal volumes?
lever-balance-liquid-density-title = What is the density of a liquid?
lever-balance-liquid-label = Liquid
lever-balance-volume-label = How much to pour
lever-balance-command-label-5 = Empty cylinder
lever-balance-build-choices = Lighter
lever-balance-build-choices-2 = The same
lever-balance-build-choices-3 = Heavier
lever-balance-answer-liquid-density-cmp = lighter than water
lever-balance-answer-liquid-density-cmp-2 = heavier than water
lever-balance-answer-liquid-density-cmp-3 = about as dense as water
lever-balance-answer-liquid-density-why = Density is the mass per unit volume: ρ = m/V. Two weighings give the liquid’s mass — the cylinder’s own mass cancels (m = m₂ − m₁) — and the marks give the volume. Different liquids pack a different mass into the same volume: the particles of oil or alcohol are lighter and packed more loosely than water’s, glycerol’s more tightly. A liquid lighter than water floats on it: oil gathers on top.
lever-balance-answer-liquid-density-text = The liquid’s mass is the difference of the weighings: m = { $full } − { $empty } = { $m }. Its volume comes from the cylinder’s marks: V = { $V } cm³. The density ρ = m/V ≈ { $rho } g/cm³ = { $rho2 } kg/m³ ({ $l } is { $l2 }; water has { $WATER } kg/m³). The table gives { $table } kg/m³. The least precise thing here is the volume: the cylinder shows it only to a division. A liquid lighter than water that does not mix with it floats on it as a layer; a heavier one sinks.
lever-balance-setup = A lever balance, a set of weights, tweezers
lever-balance-busy = Picking the weights — from larger to smaller…
lever-balance-say = The set of weights is not enough — the load is too heavy for this balance (up to 211 g).
lever-balance-say-2 = The balance is level: { $set } = { $value }.
lever-balance-board-title = lever balance: { $label }
lever-balance-board-title-2 = the mass of the liquid — the difference of two weighings
## $name — the liquid's name; $gen — in the genitive.
lever-balance-liquid-question = We weigh an empty measuring cylinder on a lever balance, pour ≈ { $volume } mL of { $gen } into it, weigh it again and read on the marks how much we poured. For equal volumes, is it lighter or heavier than water?
lever-balance-cylinder-label = Cylinder with { $gen }
