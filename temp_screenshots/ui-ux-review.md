# FocusBoss UI/UX review from screenshots 1-9

This review is based on the screenshots in `temp_screenshots` (1.png to 9.png). I looked at each tab flow and noted layout, hierarchy, spacing, and interaction clarity.

## Overall themes across the UI
- Hierarchy is a bit flat. Many cards use similar size, weight, and color, so the primary action is not always obvious.
- Spacing and alignment are mostly consistent, but some cards feel crowded (toggle rows, tag cards) while other areas feel empty (lists page). Rebalancing spacing will improve perceived quality.
- Status and control states are sometimes too subtle (active, disabled, selected). A stronger state system (color, shadow, icon, text) will reduce confusion.
- The nav bar works well, but the active item feels like a separate pill that floats. Consider a tighter, more anchored active style.

## Screenshot 1: Home / Focus Mode
What works
- Clear top status and main Focus Mode card.
- Chips for "Turn off until" are readable and consistent.

Suggestions
- Focus Mode toggle is on the right but small. Consider enlarging the toggle or adding an explicit "On/Off" label for clarity.
- "Friction Modes" card looks like a separate feature but visually similar to the main focus card. Consider grouping it or increasing its hierarchy (icon, tone, or accent) so users understand it is related.
- The "HARD STOP" pill looks clickable but the arrow implies navigation. Pick one pattern: either the whole row is a link, or the pill is the action.
- The Focus Mode card content could use a clearer vertical rhythm: title, description, action (toggle), then secondary controls (turn off chips).

## Screenshot 2: Lists / Blocked
What works
- Segmented control for Blocked/Allowed/Advanced is clear.
- Input + Add button placement is straightforward.

Suggestions
- The "Websites / Keywords" segment sits under another segmented control with similar styling. Consider reducing the visual weight of the second segment or adding a label to differentiate levels.
- List entries (like youtube.com) look like disabled inputs. Use a list row style with a clear remove icon or button, rather than a secondary input style.
- The Add button is small relative to the input. Align heights and consider a stronger primary button treatment.
- The page feels sparse under the list. If there are more list sections (imports, suggestions), reserve that space or add an empty-state helper.

## Screenshot 3: Pomodoro (top)
What works
- Timer and controls are central and easy to identify.
- Control icons are large enough for quick tap.

Suggestions
- The top control cluster (pause, play, stop) feels crowded next to the timer and title. Consider placing it below the timer or aligning it in a single row with consistent spacing.
- The large timer circle is visually heavy compared to the rest of the card. Consider a slightly slimmer ring or lighter inner shadow.
- The nav bar active state is strong, but the focus ring around the icon is visible (blue focus). Consider custom focus styling for consistency.

## Screenshot 4: Pomodoro tags
What works
- Tag cards are readable and show configuration context.
- "Add tag" is well placed.

Suggestions
- The active tag badge and the gear icon compete. Consider grouping controls on the right (active badge, gear) with a bit more spacing.
- Tag cards look dense. Increase vertical spacing within cards or add subtle separators between title and details.
- The "Show all" button reads like a primary CTA but is not a primary action. Consider using a secondary style and place it as a row link.

## Screenshot 5: Pomodoro toggles and tags
What works
- Placement of toggles below focus/break/cycles makes sense.

Suggestions
- The two toggles are compressed. Increase toggle width and card padding to reduce visual tension (already in progress).
- The toggle labels wrap and create uneven heights. Consider making both rows single-line by slightly reducing label size or increasing the toggle row height.
- There is a subtle scrollbar visible. If possible, reduce vertical overflow by tightening the tags card spacing or collapsing rarely used sections.

## Screenshot 6: Stats (Pomodoro trend)
What works
- The Pomodoro/Web Usage segment is clear.
- The "Focus Trend" card is well organized.

Suggestions
- The small "View details" pill looks like a text input. Consider a link style or a ghost button.
- KPI values are strong but the supporting text is small. Increase contrast or size of the deltas ("-64% vs yesterday") so they are not overlooked.
- The chart starts below the fold. Consider reducing padding or placing a smaller chart preview above the KPIs.

## Screenshot 7: Stats (chart + tags)
What works
- The stacked bar chart is visually distinct and colorful.
- Tag cards map to chart colors, which helps comprehension.

Suggestions
- The chart has no axis labels or value markers. Add a small legend or y-axis ticks so users can read scale.
- The day labels are tiny. Increase letter spacing or size for readability.
- Tag cards are asymmetrical. Make color dots align with text vertically and give cards consistent padding.

## Screenshot 8: Stats summary
What works
- Summary KPIs are clear and evenly spaced.
- Day/Week/Month segment is in the right spot.

Suggestions
- The summary cards are all the same size but not ordered by importance. Consider ranking (Focus time, Break time, Distraction time, Tags completed) and highlighting the most important.
- The Export section feels detached. Consider moving it to a footer area or using a lighter card style.
- The segment control styling is strong; consider using the same control style for the top stats tabs to reduce pattern drift.

## Screenshot 9: Settings
What works
- Settings are grouped into cards with clear labels.
- The theme switcher is readable.

Suggestions
- The theme segmented control is very high contrast compared to the rest of the settings. Consider lowering its shadow or border to match the cards.
- "Blocking style" has a switch and a text value. Consider placing the value on the right as a badge or making the switch label reflect the value to reduce redundancy.
- The Confirm toggle card is good, but the toggle alignment could be tighter with the label and description (consistent vertical alignment).
- The Schedules card reads empty. Add a small empty state hint ("Create schedules to auto-enable focus") and a subtle icon.

## Priority changes (high impact)
- Strengthen visual hierarchy: increase contrast for primary actions and reduce for secondary ones.
- Make list rows and tag cards read as lists, not inputs.
- Add clearer chart labeling and axis context for stats.
- Normalize spacing and alignment in toggle rows and tag cards.

## Quick wins
- Slightly increase padding in toggle rows and tag cards.
- Update list item styling and remove input-like appearance.
- Adjust "Show all" and "View details" buttons to a secondary style.

If you want, I can turn these into a set of concrete UI tasks and map each to CSS selectors for faster implementation.
