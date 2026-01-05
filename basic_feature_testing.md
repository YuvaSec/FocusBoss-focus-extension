# Basic Feature Testing

Use this checklist to confirm the popup UI behaves the same after changes.

## Startup / initial render
- Open the popup and verify: status pill, focus toggle state, strict status text, pomodoro info, tasks list, and schedule list all match the saved state.
- Switch to each tab (Home, Lists, Stats, Schedule, Settings if present) and verify content renders immediately.

## Focus + pause
- Toggle Focus ON/OFF and confirm status pill and button state update immediately.
- Set a pause (“Turn off until 1h” or “End of day”) and confirm UI shows paused state.
- Resume and verify the pause clears.

## Strict mode
- Select a strict duration chip and click Start; confirm the strict overlay appears and status shows “Strict”.
- Wait for the strict timer to end (use 1m if available) and confirm Focus returns to the previous state and UI updates.

## Interventions
- Select different friction modes (radio buttons) and verify only one is selected.
- Click an intervention card to open the details modal; change settings and save, then reopen to confirm the changes persisted.

## Lists
- Add and remove a blocked domain; verify it appears/disappears immediately and persists after closing/reopening the popup.

## Tasks
- Add a task, mark it done, remove it; ensure list updates properly and persists.

## Pomodoro
- Start a pomodoro, pause, resume, and stop; verify timer and UI controls reflect each state.
- Stop behavior: confirm Focus restores to its pre-pomodoro state, unless a schedule is active.
- Manual Focus ON + no schedule: start pomodoro, stop, Focus stays ON.
- Manual Focus OFF + no schedule: start pomodoro, stop, Focus turns OFF.
- Schedule active: start pomodoro, stop, Focus stays ON.
- Schedule inactive: start pomodoro, stop, Focus restores to previous manual state.

## Stats
- Change range (Today/Week/Month) and filter (All/Blocked); confirm charts and lists update.
- Click a domain to open its detail modal and confirm values render.

## Theme
- Switch theme (dark/light/system) and confirm the UI changes immediately and persists.
