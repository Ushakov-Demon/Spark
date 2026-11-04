## lab-board
lab-board-lines-ice-name = ice
lab-board-lines-what = the solution
lab-board-lines-title = warming the { $what }
lab-board-lines-title-2 = cooling the { $what }
lab-board-lines-title-3 = mixing: the temperature of the mixture
lab-board-lines-name = body
lab-board-lines-title-4 = cooling
lab-board-lines-title-5 = warming
lab-board-balance-lines-title = heat balance: what was given was taken (the rest went into the vessel and the air)
lab-board-boil-lines-title = : { $steam } g boiled off
lab-board-boil-lines-title-2 = boiling{ $steam }
lab-board-ohm-lines-title = current in the liquid
lab-board-joule-lines-title = heat from the current
lab-board-heater-lines-title = the heater gave
lab-board-efficiency-lines-title = efficiency: what the substance got
lab-board-weigh-lines-title = weighing: vessel + contents
lab-board-dissolving-heat-lines-title = taken in
lab-board-dissolving-heat-lines-title-2 = given off
lab-board-dissolving-heat-lines-title-3 = dissolving { $what }: heat { $value }
lab-board-dissolving-heat-lines-numbers = mol
lab-board-dissolving-heat-lines-numbers-2 = kJ/mol
lab-board-mass-fraction-lines-title = the mass fraction of { $what } in the solution
lab-board-mass-fraction-lines-formula = w = m(substance) / m(solution)
lab-board-liquid-density-line-title = the density of the liquid
lab-board-measured-lines-title = the coil’s resistance at { $t } °C
lab-board-measured-lines-title-2 = the temperature coefficient (warmed by { $dt } °C)
lab-board-measured-lines-title-3 = the cathode before
lab-board-measured-lines-title-4 = the cathode after
lab-board-measured-lines-title-5 = the copper settled on the cathode
lab-board-measured-lines-title-6 = the electrochemical equivalent (I ≈ { $I } A, t = { $t } min)
lab-board-measured-lines-numbers = mg/C
lab-board-measured-lines-title-7 = the level after the body went in
lab-board-measured-lines-title-8 = the level by the marks
lab-board-measured-lines-title-9 = how far the liquid rose — the volume of water pushed aside
lab-board-measured-lines-title-10 = how the level changed
lab-board-measured-lines-title-11 = the scales with the substance added
lab-board-measured-lines-title-12 = the scales with the body
lab-board-measured-lines-title-13 = the scales
lab-board-measured-lines-title-14 = the mass of the substance added — how much the reading grew
lab-board-measured-lines-title-15 = the mass of the body — how much the reading grew
lab-board-measured-lines-title-16 = the weight of the body in the air
lab-board-measured-lines-numbers-2 = dynamometer
lab-board-measured-lines-title-17 = the body floats: the buoyant force equals its weight
lab-board-measured-lines-title-18 = the buoyant force — from the dynamometer
lab-board-measured-lines-title-19 = the buoyant force — by Archimedes
lab-board-measured-lines-title-20 = the mean density of the body
lab-board-measured-lines-title-21 = the density of the body
## $grams — how much froze or melted (none: nothing yet); $melt — a metal or salt (yes) or ice (no).
lab-board-freezing = freezing{ $grams ->
        [none] {""}
       *[other] : { $grams } g froze
    }
lab-board-melting = melting{ $grams ->
        [none] {""}
       *[other] : { $grams } g melted
    }
