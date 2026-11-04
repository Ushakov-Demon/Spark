## windlass
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
windlass-ask = How many turns does the spool make while the load goes down 30 cm?
windlass-title = Building a windlass: straight motion and turning
windlass-question = We build a windlass on a stand, like a well’s: a cotton reel (2 cm across, measured by a ruler) goes on an axis with a handle, a thread is wound on it, a small load at its end. We let the load down by 30 cm and count the reel’s turns by a mark on it, then the same with a pencil (8 mm) instead of the reel. And then the other way — we turn the handle 5 times and measure how far the load rose. How many turns does the spool make while the load goes down 30 cm?
windlass-choices = As many as the spool’s circumference (π·d) fits into 30 cm
windlass-choices-2 = As many as the spool’s diameter fits into 30 cm
windlass-choices-3 = Any spool makes the same number of turns
windlass-answer-why = The thread lies on the spool in rings. One turn of the spool unwinds one ring — the spool’s circumference, C = π·d. So the load, going down by l, turns the spool n = l / (π·d) times: the load’s straight motion becomes the spool’s turning. And back: turning the handle n times winds n·π·d of thread — turning becomes the load’s straight motion. The thin pencil has a shorter circumference, so it turns more times for the same 30 cm, and lifts the load less in the same 5 turns. This is how a well’s windlass, a fishing reel, a tape measure work; a rack and pinion or a rolling wheel do the same without a thread. The thread’s thickness is left out here — with it each ring is a little longer.
windlass-answer-say = { $spool }: { $v } turns for 30 cm — as many times as π·d fits into the thread.
windlass-text-parts = { $spool }, the load down { $amount } — { $v } turns (l / (π·d) = { $amount2 })
windlass-text-parts-2 = { $spool }, { $amount } turns of the handle — the load rose { $v } (π·d·n = { $PI })
windlass-answer-text = {" "}The turns are counted by a mark — to a quarter turn.
windlass-setup = A windlass on a stand: an axis with a handle, a cotton reel (d = 2 cm) or a pencil (d = 8 mm), a thread with a load, a ruler
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
