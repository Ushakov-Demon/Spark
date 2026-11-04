## A leaf’s area: the palette (grade 7, introduction — measuring areas).
## $side — a palette square’s side («1 cm», «5 mm»); $form — the leaf’s form; lengths and areas come with their units.

leaf-area-title = A leaf’s area: the palette
leaf-area-ask = Which palette gives the leaf’s area more accurately?
leaf-area-question = A card’s area is found with a ruler: its length times its width. But the leaf, { $form } in form, is no rectangle, so we lay a palette on it: first one of { $side1 } squares, then one of { $side2 }. We count the whole squares and those the edge cuts, and compare with the leaf’s true area. { leaf-area-ask }
leaf-area-setup = A card, a leaf, two palettes, a ruler

leaf-area-choice-fine = The palette of smaller squares: fewer of them are cut by the edge
leaf-area-choice-coarse = The palette of larger squares: less to count — fewer mistakes
leaf-area-choice-same = The same: halving the cut squares evens it all out

leaf-area-aside-rhind = About 1550 BC the Egyptian scribe Ahmes copied an older handbook of mathematics — now called the Rhind papyrus; since 1865 it has been kept in the British Museum. Among its problems is how to find the area of rectangular and triangular fields and of trapezoids. And the Egyptians took a circle’s area to stand to that of its circumscribing square as 64 : 81 — the same as π ≈ 3.16, less than 1 % off.

leaf-area-card-a = Card: length
leaf-area-card-b = Card: width
leaf-area-form = The leaf’s form
leaf-area-length = The leaf’s length
leaf-area-side1 = First palette: square
leaf-area-side2 = Second palette: square
leaf-area-form-ovate = ovate
leaf-area-form-lanceolate = lanceolate
leaf-area-form-orbicular = orbicular

leaf-area-bad-card = The card’s sides must be more than zero.
leaf-area-bad-length = The leaf’s length must be more than zero.
leaf-area-bad-side = A palette’s square is 0.2 mm at the least: finer lines cannot be made out.
leaf-area-too-fine = Squares so fine take thousands of rows on this leaf: nobody would count them. Take a coarser palette.

leaf-area-card-say = The card: lay the ruler along it and across — its length and its width.
leaf-area-card-button = 📏 Card
leaf-area-card-plan = measure the card
leaf-area-card-busy = Laying the ruler on…
leaf-area-card-shown = a = { $a }, b = { $b } → S = { $S }
leaf-area-card-said = The card is { $a } by { $b }: S = a·b = { $S }.
leaf-area-palette-say = We lay a palette of { $side } squares on the { $form } leaf and count: the whole ones inside — and those the edge cuts.
leaf-area-palette-button = 🔲 Palette { $side }
leaf-area-palette-plan = lay the { $side } palette
leaf-area-palette-busy = Counting the squares…
leaf-area-palette-shown = N = { $whole }, n = { $cut } → S ≈ { $S }
leaf-area-palette-said = Whole squares — { $whole }, cut by the edge — { $cut }: S ≈ ({ $whole } + { $cut }/2) · { $square } ≈ { $S }.
leaf-area-board-card = the card
leaf-area-board-palette = the { $side } palette

leaf-area-why =
    An area is how many unit squares a figure holds. A rectangle’s need not be counted: a rows of b — so S = a·b. A leaf is no rectangle, and here a palette helps: a transparent sheet ruled in squares. The whole squares inside are counted in full, those the edge cuts — by half: on average half such a square is on the leaf, half off it.

    The error is only in the cut squares. They lie along the edge, so there are about as many of them as squares fit round the leaf’s outline — and as many whole ones as fit in its area. The smaller the squares, the smaller the share of cut ones, and the smaller the error — but the longer the count. Any measurement works so: the finer the division, the more accurate, but the more carefully it has to be read.
leaf-area-say = The leaf’s true area is { $exact }: { $closer ->
        [fine] the { $fine } palette is nearer
        [coarse] this time the { $coarse } palette is nearer — that is how the edge squares fell
       *[same] both palettes are equally far from it
    }.
leaf-area-row-card = the card { $a } × { $b }: S = { $S }
leaf-area-row-palette = the { $side } palette: N = { $whole }, n = { $cut } → S ≈ { $S } ({ $off } off)
leaf-area-text = Measured:{ $rows }. The leaf’s true area is { $exact } (from its drawing).
leaf-area-scene-fine = { $side } squares — too fine to draw
