## balloon-lift

balloon-lift-gas-name-helium = helium
balloon-lift-gas-name-hydrogen = hydrogen
balloon-lift-gas-name-hot-air = hot air
balloon-lift-ask = What decides whether a balloon flies?
balloon-lift-title = The lifting force of a balloon
balloon-lift-choices = On whether the gas with the shell is lighter than the same volume of air: a big helium balloon flies, a small one maybe not
balloon-lift-choices-2 = Only on the gas: any helium balloon flies, however small
balloon-lift-choices-3 = A balloon of air flies too, only weaker: air is light
balloon-lift-gas-label = Gas
balloon-lift-gas-options = Helium
balloon-lift-gas-options-2 = Hydrogen
balloon-lift-gas-options-3 = Hot air
balloon-lift-diameter-label = The balloon’s diameter
balloon-lift-shell-label = The shell’s mass
balloon-lift-hot-label = Hot air, t
balloon-lift-setup = A balloon’s shell with its string, a gas cylinder (or a burner), a balance with a weight, a tape; for a big balloon — a force gauge on its tether
balloon-lift-question = We weigh an empty balloon (a { $shell } shell), fill it with { $gas }{ $heated ->
        [no] {""}
       *[other] {" "}(heated to { $heated } °C)
    } to { $size } across and tie it to a weight on a balance: how much less will it show? Then the same balloon half as wide, and one blown up with plain air. What decides whether a balloon flies?
