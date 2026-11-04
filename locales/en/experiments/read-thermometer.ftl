## Measuring temperature with a thermometer (grade 7, introduction — measuring temperature).
## $t — the time since the thermometer went into the water («3 s», «1.5 min»); temperatures come with their units; $stir — yes when the water is stirred.

read-thermometer-title = Measuring the water’s temperature with a thermometer
read-thermometer-ask = When is a thermometer put into water to be read?
read-thermometer-question = The glass holds water at { $water }. We put into it a lab thermometer that was in the room and look at its column a few times: after { $t1 } and later, up to { $t3 }. { read-thermometer-ask }
read-thermometer-setup = A glass of water, a lab thermometer on a stand, a stopwatch

read-thermometer-choice-wait = When the column stops moving
read-thermometer-choice-at-once = At once: a thermometer shows the temperature as soon as it touches the water
read-thermometer-choice-any = Any time: the reading does not change

read-thermometer-aside-celsius = In 1742 the Swedish astronomer Anders Celsius proposed a scale on which water boiled at 0 degrees and ice melted at 100. It was turned over after his death: the scale we know — 0 for ice, 100 for boiling water — was taken up by the botanist Carl Linnaeus, and such a thermometer for his greenhouses was made by the instrument maker Daniel Ekström.

read-thermometer-water = The water’s temperature
read-thermometer-room = The room’s temperature
read-thermometer-t1 = First look: after
read-thermometer-t2 = Second look: after
read-thermometer-t3 = Third look: after
read-thermometer-optional-stir = And if the water is stirred? Another such thermometer — into the same water, only it is stirred all the time.

read-thermometer-bad-room = The room’s temperature must be on the thermometer’s scale — from 0 to 100 °C.
read-thermometer-bad-water = Water is liquid from 0 to 100 °C (at the usual pressure).
read-thermometer-bad-time = A time cannot be negative.

read-thermometer-scale-say = First the scale: count the divisions between two neighbouring numbered marks — that gives the value of one division. The thermometer is still in the air: what does it show?
read-thermometer-scale-button = 🔍 The division
read-thermometer-scale-plan = find the value of a division
read-thermometer-scale-busy = Counting the divisions…
read-thermometer-scale-shown = in the room { $T }
read-thermometer-scale-said = Between the numbered marks there are { $n } divisions: one division is { $c }. In the room the thermometer shows { $T }.
read-thermometer-dip-say = { $stir ->
        [yes] Another such thermometer — into the same water, and we stir it. What will it show after { $t }?
       *[no] The thermometer is in water at { $water }. What will it show { $t } after it went in?
    }
read-thermometer-dip-button = { $stir ->
        [yes] 🥄 Stirring: after { $t }
       *[no] 🌡 After { $t }
    }
read-thermometer-dip-plan = { $stir ->
        [yes] stirring, look after { $t }
       *[no] look after { $t }
    }
read-thermometer-dip-busy = The column is moving…
read-thermometer-dip-shown = after { $t }: { $T }
read-thermometer-dip-said = After { $t } the thermometer shows { $T }. { $there ->
        [yes] As much as the water: the column has stopped.
       *[no] And the water is at { $water }: the column is still moving.
    }
read-thermometer-board-scale = the value of a division
read-thermometer-board-dip = { $stir ->
        [yes] stirring, after { $t }
       *[no] after { $t } in the water
    }

read-thermometer-why =
    A thermometer shows not the water’s temperature but its own — that of the liquid in its bulb. Put into the water, it is at first at the room’s temperature, and heat goes from the water into the bulb through the glass. The smaller the difference of temperatures, the slower the heat goes: so the column runs at first and only creeps at the end. For this thermometer the difference between the water and the bulb becomes almost three times smaller (e ≈ 2.7 times) every { $tau }, and it comes within a division of the water’s temperature in about { $wait }.

    So a thermometer is read when its column has stopped. Stirred water brings heat to the bulb faster, and the column gets there sooner: the difference falls threefold every { $stirTau }. And the water itself hardly changes because of the thermometer: its bulb is small (a heat capacity of about { $C } J/K), so a glass of water gives it less than { $lost }.
read-thermometer-say = The water is at { $water }. After { $t1 } the thermometer showed { $first }. { $reached ->
        [yes] It showed the water’s temperature after { $t }.
       *[no] It never got to show the water’s temperature — it needed a longer wait.
    }
read-thermometer-row = { $stir ->
        [yes] stirring, after { $t }: { $T }
       *[no] after { $t }: { $T }
    }
read-thermometer-text = Measured:{ $rows }The water is at { $water }.
