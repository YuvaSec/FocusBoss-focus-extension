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
# Schedule — Phase 10 Manual Test Checklist

## Goal
Confirm schedule entries trigger Focus Mode correctly, including overnight spans and overlapping schedules.

## Test 1: Basic schedule window
1. Create a schedule for today with start = now + 1 minute, end = now + 3 minutes.
2. Wait for the start time.
3. Verify Focus Mode turns ON automatically.
4. Wait for the end time.
5. Verify Focus Mode turns OFF automatically.

Expected:
- Focus switches ON at start.
- Focus switches OFF at end.

## Test 2: Overnight span
1. Create a schedule for today with start = 23:00, end = 01:00.
2. Ensure today is selected in the day chips.
3. If current time is between 00:00–01:00 (next day), verify Focus Mode is ON.
4. At 01:00, verify Focus Mode turns OFF automatically.

Expected:
- Focus remains ON across midnight until the end time.

## Test 3: Overlapping schedules
1. Create two schedules that overlap for the same day.
2. Wait for the first schedule to end while the second is still active.
3. Verify Focus Mode stays ON until the second schedule ends.

Expected:
- End of one schedule does not disable Focus if another active schedule exists.

## Test 4: Restart behavior
1. Ensure a schedule is currently active.
2. Reload the extension (or restart the browser).
3. Verify Focus Mode turns ON immediately on startup.

Expected:
- Focus Mode reflects the current schedule window after restart.

---

# Strict Session (Phase 11)

## What it is
A “Warden Mode” focus lock. Once started, Focus Mode is forced ON and cannot be turned off until the timer ends. Temporary allow (“Let me continue”) is disabled during this time.

## How it works (simple)
1. Pick a duration in the Timer tab.
2. Click Start and confirm.
3. Focus Mode locks ON immediately.
4. When the timer ends, the strict session clears and normal controls return.

## Behavior details
- Focus toggle is disabled while strict mode is active.
- Pause chips are disabled while strict mode is active.
- Temporary allow buttons are hidden on the intervention page during strict mode.
- On browser restart, strict mode continues until the end time.
- When strict ends, focus returns to schedule state (if any schedule is active).

## Manual test checklist
1. Start a 1-minute strict session → Focus should lock ON.
2. Try to toggle Focus OFF → should be disabled.
3. Open a blocked site → “Let me continue” should be unavailable.
4. Wait for the timer to end → controls unlock automatically.
5. Restart the extension mid-session → strict should still be active until it expires.

---

# Pomodoro Timer (Phase 12)

## What it is
A focus timer that alternates between Work and Break phases. It can automatically enable Focus Mode during work sessions and optionally keep blocking active during breaks.

## How it works (simple)
1. Set Work minutes, Break minutes, and optional Cycles.
2. Press Start to begin the Work phase.
3. The timer automatically switches between Work and Break.
4. When cycles are complete, the Pomodoro run ends.

## Behavior details
- Start/Pause/Stop controls manage the current run.
- Progress bar shows completion of the current phase.
- Auto‑block during work turns Focus Mode on when Work starts.
- Block during break keeps Focus Mode on during breaks.
- If no cycles are set (0), the timer runs indefinitely until stopped.
- Completed Work phases log sessions in analytics.

## Manual test checklist
1. Start a 1‑minute Work session → countdown should tick and progress bar should fill.
2. Pause → status should change to “paused” and time should stop decreasing.
3. Resume → time continues from where it left off.
4. Let Work finish → it should switch to Break automatically.
5. Set cycles to 1 → after Break ends, the run should stop.
6. Toggle Auto‑block → Focus Mode should turn on at Work start.
