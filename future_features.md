# Future Features (Ideas + How to Build)

1) Intent-Aware Focus Engine
- What: Prompt for a one-sentence goal before sessions and adapt strictness.
- How: Add a pre-session modal, simple keyword classifier, store tags in analytics.

2) Cognitive Drift Detection
- What: Detect rapid tab switches/revisits and nudge the user.
- How: Track tab change frequency and revisit loops locally, trigger gentle overlay.

3) Adaptive Pomodoro Length
- What: Auto-adjust work/break durations based on success rate.
- How: Analyze completed sessions vs. interruptions, update defaults gradually.

4) Focus Debt/Credit System
- What: Distractions create "debt", deep work creates "credit".
- How: Compute a daily balance from blocked time vs. focus time, show a balance card.

5) Semantic/Feature-Level Blocking
- What: Allow YouTube search/tutorials but block Shorts/home.
- How: DOM checks + URL patterns in content script with per-site rules.

6) Focus Replay (Time Machine++)
- What: Timeline of session phases and tab changes.
- How: Record tab URL changes during focus sessions and render a timeline view.

7) Emotional Tagging
- What: Post-session mood tag (calm/frustrated/etc.).
- How: Add a quick post-session modal, store tag in analytics.sessions.

8) Invisible Mode
- What: No UI during focus; summary afterward.
- How: Hide popups/overlays during focus, show daily summary card.

9) Focus Contracts
- What: Commitment rules like "If I open X, block 24h".
- How: Add irreversible rules in storage with expiry timestamps.

10) AI Focus Coach (offline-first)
- What: Weekly narrative insights, local only.
- How: Generate summaries from analytics data with templated rules.

11) Adaptive Intervention Rotation
- What: Choose interventions based on user success rate.
- How: Track intervention outcomes (continue vs. back) and reweight randomization.

12) Smart Whitelisting
- What: Auto-suggest allowed sites for work sessions.
- How: Suggest from usage patterns during focus sessions, one-tap allow.

13) Task Energy Matching
- What: Suggest tasks based on time of day and past completion.
- How: Record completion times, show "best time" hints.

14) Focus Milestones
- What: Streaks, badges, milestones for motivation.
- How: Count consecutive focus days and show achievements in stats.

15) Distraction Radar
- What: Live widget showing top distractors today.
- How: Use analytics.byDay and render a compact list in Home view.

16) Smart Break Activities
- What: Suggest healthy break actions.
- How: Simple curated list with random rotation, optional user list.

17) Focus Soundscapes (offline)
- What: White noise or ambient sounds during focus.
- How: Bundle a few audio files and toggle in settings.

18) Lightweight Notifications
- What: Optional notifications at phase changes.
- How: Use chrome.notifications when enabled, no network.

19) Deep Work Mode Presets
- What: One-tap presets (e.g., "Deep Work", "Admin", "Study").
- How: Save configurations of lists + timer + interventions, apply in UI.

20) Domain-Specific Goals
- What: Set time budgets per domain.
- How: Track per-domain usage and alert when exceeding daily budget.

21) Focus Heatmap by Weekday
- What: Heatmap of focus by weekday/hour.
- How: Aggregate analytics.byDay with weekday bucketing.

22) Session Notes
- What: Add short notes to sessions.
- How: Add optional text input after session ends, store in sessions.

23) Quick Capture Inbox
- What: One-tap "capture thought" during focus.
- How: Simple text input storing notes in local storage.

24) Multi-Profile Modes
- What: Separate work/personal profiles.
- How: Store multiple schemas keyed by profile ID and switch in UI.

25) Device-Aware Scheduling
- What: Different schedules for laptop vs. desktop.
- How: Use a local profile ID and separate schedule sets.

26) Focus Widgets (Side Panel)
- What: Keep timer/tasks visible in a side panel.
- How: Add MV3 side panel page and share state with popup.

27) URL Pattern Wizard
- What: Guided advanced rule builder.
- How: UI for building patterns and previewing matches.

28) Focus Groups
- What: Group sites into categories (social/news/entertainment).
- How: Tag lists and allow group-level toggles.

29) Import/Export Rules
- What: Backup and share rules as JSON.
- How: Serialize lists/interventions and download/upload JSON.

30) Local Sync Across Browsers
- What: Manual export/import to sync devices.
- How: Reuse rule export, optionally QR code or file import.

31) Strict Session Escalation
- What: Increase strictness after repeated distractions.
- How: Count blocked hits and auto-toggle stricter intervention.

32) Focus Readiness Check
- What: Short checklist before starting strict mode.
- How: Add a modal with checkboxes and a "start" button.

33) Attention Budgeting
- What: Allocate daily minutes for "allowed" distractions.
- How: Track allowed domain time and warn at limits.

34) Habit Review
- What: Weekly insights on best focus hours.
- How: Compute top hours from analytics and show summary card.

35) Flow Mode
- What: Extend session if uninterrupted.
- How: Detect no distractions and auto-extend pomodoro by 5–10 minutes.

