## What the experiment says as it runs: its steps, board and answer. These texts come with the experiment when it opens; its card is in sliding-friction.ftl.

sliding-friction-pull-command-apply = Put 0 to 3 weights on the block.
sliding-friction-pull-text-say = Now stand the block on its narrower side face — less area touching the board — and pull it steadily again.
sliding-friction-pull-text-button = ➡ The block on its narrower face
sliding-friction-pull-text-plan = the block on its narrower face
sliding-friction-pull-text-say-2 = Lay a sheet of paper on the board and pull the block over it — on the same wide face.
sliding-friction-pull-text-button-2 = ➡ The block over paper
sliding-friction-pull-text-plan-2 = the block over a sheet of paper
sliding-friction-pull-text-say-3 = Lay the block on its widest face on the board and pull it at a steady speed with the dynamometer. What does it show?
sliding-friction-say-uk = a weight
sliding-friction-say-uk-2 = { $n } weights
sliding-friction-say-uk-3 = pull it on its wide face along the board steadily
sliding-friction-say-uk-4 = pull it steadily again
sliding-friction-pull-text-say-4 = Put { $value } on the block and { $value2 }.
sliding-friction-button-uk = {" "}(+{ $n } × 100 g)
sliding-friction-pull-text-button-3 = ➡ Pull the block{ $n }
sliding-friction-plan-uk = {" "}with a weight
sliding-friction-plan-uk-2 = {" "}with { $n } weights
sliding-friction-pull-text-plan-3 = pull the block{ $value }
sliding-friction-plan-label = Wooden block
sliding-friction-factors-trick = Most people think the block is easier to pull on its narrower face.
sliding-friction-answer-factors-why =
    It seems easier to pull the block on its narrower face: less area, less friction. Most people think so. But the area of a face is not yet the area of contact. Even surfaces that look smooth touch only at the tips of their bumps, and the real area of contact is a very small fraction of the face. On the wide face the block’s weight is shared among many bumps, each pressed lightly. On the narrower face there are fewer bumps, but each is pressed harder and squashed deeper. The real area of contact comes out about the same: it is set not by the size of the face but by how hard the block is pressed to the board. The weight has not changed — so neither has the friction. The materials are another matter: paper catches on wood differently from wood on wood. And the weights press the block harder — the bumps are squashed more, and the friction grows in proportion to the pressing force.

    Mind: all this is about solid bodies (wood, metal, plastic, glass). For sticky and soft materials the rule fails: adhesive tape holds even when nothing presses it, and the wider the strip, the better it holds — here the area of contact matters. That is why drag racers have wide, sticky tyres. And even for solid bodies the law is approximate: friction grows with the load not strictly in proportion.
sliding-friction-answer-factors-say = For solid bodies the area does not matter — the materials and the pressing force do!
sliding-friction-answer-factors-text = The block with its weight on the wide face — { $wide }, on the narrower one — { $narrow }: one and a half times less area touching, the same friction. Over a sheet of paper — { $paper }: another pair of materials, μ = F / N ≈ { $value } (the textbook’s table: paper on wood 0.40, wood on wood 0.25). With three weights — { $heavy }: the pressing force grew from { $wide2 } to { $heavy2 } N, { $heavy3 } times, and the friction about as much. This is the Amontons–Coulomb law: sliding friction does not depend on the area of contact and is proportional to the normal force, F = μN, where μ depends on the materials and how the surfaces are finished. Leonardo da Vinci noticed it first (1493), but his notes were not published; in 1699 G. Amontons discovered the law anew, and C. Coulomb checked it. The law is about solid bodies: for sticky and soft materials (adhesive tape, racing tyres) the area of contact does affect friction.
sliding-friction-answer-coefficient-why = Even surfaces that look smooth touch only at their bumps. The harder the block is pressed to the board, the more bumps meet and catch — the real area of contact, and with it the friction, grows in proportion to the pressing force. So the ratio F/N stays the same for a pair of materials — the coefficient of friction: it depends on what the surfaces are and how they are finished, not on the block’s weight.
sliding-friction-answer-coefficient-say = μ ≈ { $mean } — for wood on wood!
sliding-friction-answer-coefficient-text = ≈ 1.4 N
sliding-friction-answer-coefficient-text-2 = N = { $N } N → F = { $F }, μ ≈ { $F2 }
sliding-friction-answer-coefficient-text-3 = The block weighs { $P }; on a level board the normal force N equals the weight of the block with its weights. { $steps }. The friction grows with the load, while their ratio — the coefficient of friction — stays about the same: μ ≈ { $mean }. The textbook’s table gives 0.25 for wood on wood. The spread is there because the dynamometer reads only tenths of a newton, and pulling steadily is not easy. The coefficient depends on the materials and how the surfaces are finished, not on the block’s weight.
sliding-friction-busy = Pulling the block steadily…
sliding-friction-say = On its narrower face the block slides steadily — the dynamometer shows { $F }.
sliding-friction-say-2 = Over the paper the block slides steadily — the dynamometer shows { $F }.
sliding-friction-board-how = , narrower face
sliding-friction-board-how-2 = , over paper
sliding-friction-board-title = alone
sliding-friction-board-title-2 = and { $weights } × 100 g
sliding-friction-board-title-3 = sliding friction: the block { $value }{ $how }
sliding-friction-view-paper = a sheet of paper
sliding-friction-say-weights = The block{ $n ->
        [0] {""}
       *[other] {" "}with { count-weights }
    } slides steadily — the dynamometer shows { $F }. That is the force of sliding friction.
sliding-friction-aside-egypt-sand = A painting in the tomb of the Egyptian noble Djehutihotep shows a huge statue dragged on a sledge while a man in front pours water on the sand. In 2014 physicists in Daniel Bonn’s group in Amsterdam tested this in the lab: with just the right dampness the force needed is halved, because the sand stiffens and does not pile up in front of the runners. With too much water the friction rises again.
sliding-friction-aside-leonardo-scribbles = Where exactly Leonardo da Vinci first wrote down the laws of friction was worked out only in 2016. The Cambridge professor Ian Hutchings found it on a page of a tiny notebook (Codex Forster III) that had been dismissed as “irrelevant scribbles”.
