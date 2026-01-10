# Codex Explainer: Stats Page Redesign Proposal

## Goals
- Make the Stats view faster to scan, less cluttered, and more professional.
- Split Pomodoro vs Web Usage data into separate segments for clarity.
- Keep the UX simple and predictable; avoid mixing concepts in one view.

## What data exists today
- Range + filter controls (Today/Week/Month, All/Blocked)
- Overview metrics: Focus time, Break time (est.), Tags completed, Distraction time
- Usage breakdown: donut + legend
- Top domains list
- Focus/distraction timeline (stacked bars)
- Hour heatmap
- Session history list
- Time Machine day picker + detail view
- Export buttons

## Current pain points
- Too many separate cards in a long vertical column.
- Controls are split across multiple cards, making the top of the page feel fragmented.
- Usage breakdown and Top domains are separate cards with similar visual weight.
- Timeline, heatmap, and sessions compete for attention because they are all equal-size cards.
- Time Machine is always expanded, which adds noise when not needed.

## Proposed structure (segmented Stats view)

### Segment Switch (always visible)
- Add a segmented control at the top of Stats:
  - **Pomodoro**
  - **Web Usage**
- The switch should remain visible during scroll.

### Pomodoro segment (minimal, ordered top → bottom)
1) **Focus Trend card**
   - Metrics: Today’s Focus, This Week, Daily Avg
   - Chart: stacked vertical bars by tag color (largest total at bottom).
2) **Tags card**
   - 2x2 grid of top tags + “Show all”.
3) **Summary metrics card**
   - Focus time, Break time, Tags completed, Distraction time.
4) **Export card**
   - Sessions CSV
   - Pomodoro CSV

### Web Usage segment (minimal, ordered top → bottom)
1) **Web Usage Trend card**
   - Metrics: Today’s Distraction, This Week, Daily Avg
   - Chart: stacked vertical bars per day with 3 colors:
     - Allowed sites
     - Blocked sites
     - Other sites
   - Tapping opens detail view (optional later).
2) **Usage Ring card**
   - Multi-color ring chart for top sites.
   - Legend list below with color dots, site name, and time.
   - Colors must match ring segments.
3) **Heatmap card**
   - Time-of-day intensity grid.
4) **Summary metrics card**
   - Total web time
   - Blocked sites time
   - Allowed sites time
   - Other sites time
5) **Export card**
   - Usage CSV
   - Blocked CSV

## Data logic (industry norm choices)
- **Ranges**: D = calendar day (local time), W = ISO week (Mon–Sun), M = calendar month, Y = calendar year.
- **Daily average**: total time / number of days in the selected range (not only active days).
- **% change**: compare to the **previous period of equal length** (e.g., this week vs last week).
- **Tag data**: use Pomodoro tags only for Pomodoro segment.
- **Web Usage data**: use domain/blocked usage for Web Usage segment.

## Best practices applied
- **Hierarchy**: highest-signal cards first; summaries are grouped.
- **Progressive disclosure**: detail views are optional; main views stay compact.
- **Consistency**: same card sizes, same chart language.
- **Scanability**: segmenting prevents mixing concepts and reduces cognitive load.

## Implementation plan (if approved)
1) Add the Stats segment switch + routing.
2) Build Pomodoro segment using existing cards and IDs.
3) Build Web Usage segment with:
   - stacked 3‑color usage trend card,
   - ring chart + legend,
   - heatmap,
   - summary metrics,
   - export card.
4) Wire export buttons per segment.

## Notes / assumptions
- We’re prioritizing UX clarity over showing every metric at once.
- Pomodoro and Web Usage are intentionally separated to avoid confusion.
- Detail views (tap to drill down) can be added after the main layout is in place.
