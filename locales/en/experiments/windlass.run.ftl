## What the experiment says as it runs: its steps, board and answer. These texts come with the experiment when it opens; its card is in windlass.ftl.

windlass-winch-command-apply = The load goes down up to 50 cm.
windlass-winch-command-apply-2 = Turn the handle up to 20 times.
windlass-spool-reel = the cotton reel (d = 2 cm)
windlass-spool-pencil = the pencil (d = 8 mm)
windlass-labwinch-say = The thread is wound on { $sp }. Let the load down by { $cm } cm and count the turns by the mark on the spool.
windlass-button-uk = the reel
windlass-button-uk-2 = the pencil
windlass-labwinch-button = ⬇ Let down { $cm } cm: { $value }
windlass-labwinch-plan = { $sp }: let the load down { $cm } cm
windlass-labwinch-say-2 = And now the other way: turn the handle — { $sp } — { $amount } times and measure by the ruler how far the load rose.
windlass-labwinch-button-2 = 🔄 { $amount } turns of the handle: { $value }
windlass-labwinch-plan-2 = { $sp }: { $amount } turns of the handle
windlass-answer-why = The thread lies on the spool in rings. One turn of the spool unwinds one ring — the spool’s circumference, C = π·d. So the load, going down by l, turns the spool n = l / (π·d) times: the load’s straight motion becomes the spool’s turning. And back: turning the handle n times winds n·π·d of thread — turning becomes the load’s straight motion. The thin pencil has a shorter circumference, so it turns more times for the same 30 cm, and lifts the load less in the same 5 turns. This is how a well’s windlass, a fishing reel, a tape measure work; a rack and pinion or a rolling wheel do the same without a thread. The thread’s thickness is left out here — with it each ring is a little longer.
windlass-answer-say = { $spool }: { $v } turns for 30 cm — as many times as π·d fits into the thread.
windlass-text-parts = { $spool }, the load down { $amount } — { $v } turns (l / (π·d) = { $amount2 })
windlass-text-parts-2 = { $spool }, { $amount } turns of the handle — the load rose { $v } (π·d·n = { $PI })
windlass-answer-text = {" "}The turns are counted by a mark — to a quarter turn.
windlass-busy = The spool is turning — counting the turns…
windlass-shown = {"."}
windlass-board-what = pencil, d = 8 mm
windlass-board-what-2 = reel, d = 2 cm
windlass-board-title = { $what }: the load down { $amount }
windlass-board-title-2 = a turn — the circumference
windlass-board-numbers = 3.14
windlass-board-title-3 = { $what }: { $amount } turns of the handle

## $spool — pencil, reel; $count — the turns as counted; $n — their number (for the word's form).
windlass-say-turns = { $spool ->
        [pencil] The pencil
       *[reel] The reel
    } made { $count } turns.
windlass-say-rose = The load rose { $cm } cm.
windlass-aside-herodotus = The windlass is an old machine. Herodotus writes that when the Persian king Xerxes bridged the Hellespont, the cables were pulled taut from the shore with wooden devices, which translators call windlasses or capstans. How exactly it was done is still argued over.
