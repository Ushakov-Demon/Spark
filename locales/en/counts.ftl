## Counted things: the number and the word in the form the number asks for ($n — a number).

count-weights = { $n ->
        [one] { $n } weight
       *[other] { $n } weights
    }
count-turns = { $n ->
        [one] { $n } turn
       *[other] { $n } turns
    }
count-frames = { $n ->
        [one] { $n } frame
       *[other] { $n } frames
    }
count-days = { $n ->
        [one] { $n } day
       *[other] { $n } days
    }
count-days-calendar = { count-days }
count-times = { $v } times
count-records = { $n ->
        [one] { $n } row
       *[other] { $n } rows
    }
count-steps = { $n ->
        [one] { $n } step
       *[other] { $n } steps
    }
count-experiments = { $n ->
        [one] { $n } experiment
       *[other] { $n } experiments
    }
count-entries = { $n ->
        [one] { $n } entry
       *[other] { $n } entries
    }
