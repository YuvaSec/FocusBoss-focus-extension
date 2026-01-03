# Feature: Turn Off Until

This feature lets you pause Focus Mode for a limited time without losing your
previous Focus Mode setting. It is useful when you need a short break.

## How it works (simple version)
- Focus Mode can be ON or OFF.
- “Turn off until…” temporarily pauses Focus Mode.
- When the time expires, Focus Mode resumes automatically.

## What happens under the hood
We store pause values in storage:

1) `focusEnabled`
- This is your main Focus Mode switch (ON or OFF).

2) `pause`
- `pause.isPaused` (boolean)
- `pause.pauseType` ("1h" | "eod" | "manual")
- `pause.pauseEndAt` (timestamp for timed pauses, null for manual)

3) Effective Focus Mode
- If `focusEnabled` is ON **and** `pause.isPaused` is true, then the UI
  shows “paused” and blocking is skipped.
- If `focusEnabled` is OFF, Focus Mode is OFF regardless of pause.

## The three buttons
- **1h** → sets `pause.pauseType = "1h"` and `pause.pauseEndAt = now + 1 hour`.
- **End of day** → sets `pause.pauseType = "eod"` and `pause.pauseEndAt` to today at 23:59:59.
- **Manual** → sets `pause.pauseType = "manual"` and `pause.pauseEndAt = null`.

## Automatic cleanup
- When the pause time ends, an alarm clears the pause state.
- On startup, we also clear it if it already expired.

## Why bugs can happen
Common issues to watch for:
- If the system time changes, the pause timing can look wrong.
- If a popup is open across the expiry time, the UI may need a refresh.
- If Focus Mode is OFF, the pause buttons do not matter until you turn it on.

## How to test
1) Turn Focus Mode ON.
2) Click **1h**. The status should say it is paused.
3) Toggle Focus Mode OFF and ON. The pause should clear.
4) Set **End of day**, then reload the popup to confirm it is still paused.

If you can describe the bug you see, I can fix it quickly.

# Feature: Rule Engine (Phase 4)

## What it does
The rule engine decides whether a page should be allowed or blocked.
It applies all rule lists in a single, consistent order.

## Why it matters
Without a rule engine, the blocker would behave unpredictably.
This phase ensures the same URL always produces the same result and the UI
can explain *why* a page was blocked or allowed.

## Precedence (the order that wins)
1) Allowed list
2) Advanced exclude rules (lines starting with `!`)
3) Advanced block rules
4) Blocked list (domains + keywords)

If a rule matches earlier in the list, later rules do not apply.

## What is supported
- Domain matching (exact host, no subdomain by default)
- Keyword blocking (case-insensitive substring match)
- Advanced rules with wildcards:
  - `*` for any sequence
  - `?` for one character
  - `!pattern` for excludes
  - `#` comments

## What you get now
- A reusable module that takes a URL and all lists and returns:
  - allowed / blocked
  - the rule that matched
- Unit tests that cover tricky cases and precedence

## How this helps later phases
- Phase 5 (Lists UI) can write to storage and the rule engine already knows
  how to interpret them.
- Phase 6 (Blocking enforcement) can call the rule engine from the content
  script to decide when to block a page.

# Feature: Interventions (Phase 7)

## What it does
Interventions are the “moment of friction” when a blocked site is reached.
Instead of a generic block page, FocusBoss chooses a short, customizable
experience to interrupt the distraction.

## What was added
- A renamed, original set of interventions (user-facing only):
  - Hard Stop (Instant Block)
  - Commit Press (Hold to Complete)
  - Gate Slide (Slide In/Out)
  - Blur Shield (Pixelated)
  - Pulse Breath (Breathing)
- A configuration UI in the Lists screen:
  - Toggle each intervention on/off
  - Configure message text
  - Configure duration or breathing technique where applicable
- A random picker with anti-repeat so the same intervention is not repeated
  too often.
- An intervention page (`tab.html`) that displays the selected intervention
  name and its current settings.

## Why it matters
Interventions create the unique feel of FocusBoss. Users can control how
strict or gentle the interruption feels, and the randomization prevents
habituation.

## How it works (high-level)
- The popup saves intervention settings in storage.
- The intervention page reads the settings, randomly selects an enabled
  intervention, and renders it.
- The last-picked list is stored to avoid immediate repeats.
 
## What’s next
In later phases, the blocking flow will route users into this intervention
page and show the “Let me continue” controls.
