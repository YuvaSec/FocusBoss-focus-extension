# Focus Extension — Master Build Plan (Merged Spec + Innovation Blueprint) 🧠🛡️⏱️

**Purpose:** This is the single “source of truth” document to hand to Codex to build your focus Chrome extension **one feature at a time**, without missing anything from the two source documents:

- **Doc A:** *Focus Extension – Feature Analysis & Innovation Blueprint* (Otto-style focus timer + tasks + analytics + product philosophy + innovation ideas)
- **Doc B:** *FocusMode-style Website Blocker Extension — Parity Spec* (FocusMode-like blocker UX, interventions, schedules, strict sessions, stats, settings)

✅ **Rule:** If two docs overlap, we unify the requirement once and keep the stricter/more detailed behavior.

---

## 0) Legal & ethics (non-negotiable)

- **Do not copy** proprietary code, branding, names, icons, or assets. Recreate the *behavior + interaction patterns* using original assets.
- Implement **offline-first**, no external server required for MVP.
- If you add paid/PRO gating, implement as **feature flags** (no real licensing system needed for MVP).

---

## 1) Product identity: what you’re building

### 1.1 Core value proposition
A focus system that can act as:
1) **Coach Mode** (gentle, reflective)  
2) **Gatekeeper Mode** (simple friction and habit boundaries)  
3) **Warden Mode** (strict, irreversible deep focus sessions)

### 1.2 MVP goal (first shippable)
A Chrome extension (MV3, TypeScript) that combines:
- **Focus-mode website blocking** with FocusMode-like **interventions** (Doc B)
- **Pomodoro-style focus timer + tasks** with friendly UX (Doc A)
- **Usage analytics** (focus time + distraction time) and export (Doc A + Doc B)

### 1.3 Key user journeys
1) Toggle Focus ON → attempt blocked site → get intervention → optionally “Let me continue” temporarily  
2) Set blocked/allowed/advanced rules → rules enforce reliably  
3) Start a **Strict Session** → cannot cancel → blocks until ends  
4) Start **Pomodoro Focus** → optional AutoBlock + task linkage  
5) Review **usage charts + focus graphs** → adjust behavior

---

## 2) Visual style guide (match the “feel”)

### 2.1 Overall UI vibe
- Clean, compact, “mobile-app-like”
- Rounded corners everywhere
- Subtle borders + soft shadows (very light)
- Strong typographic hierarchy (big titles, medium section headers, small muted helper text)
- Smooth micro-animations (toggles, tabs, progress)
- **Dark mode first**, but support light mode too
- Accent color: vivid lime/green for “NEW”, selected chips, badges

### 2.2 Component language (standardize tokens)
**Use a design token file** and apply everywhere.

- Border radius:
  - `--r-card: 16px`
  - `--r-control: 12px`
  - `--r-chip: 999px`
- Shadows:
  - `--shadow-card: 0 4px 16px rgba(0,0,0,0.08)` (lighter in dark)
- Borders:
  - `--border: 1px solid rgba(255,255,255,0.08)` (dark mode)
  - `--border-light: 1px solid rgba(0,0,0,0.08)` (light mode)

**Reusable components:**
- iOS-style toggles with animation
- Segmented controls/tabs
- Pill chips (days, durations, filters)
- Chevron rows (tap to open detail screen)
- “PRO” badge inline on gated features
- Soft empty states (friendly copy + icon/mascot)

### 2.3 Navigation
Bottom navigation bar with **4–5 icons**:
- Home (Focus)
- Lists (Block/Allow/Advanced)
- Timer (Pomodoro / Strict)
- Stats (Usage/Insights)
- Settings

---

## 3) Technical architecture (MV3, TypeScript-first)

### 3.1 Extension surfaces
1) **Popup UI**: quick actions, overview, small navigation
2) **Full-page internal UI** (recommended): a richer SPA view for lists/schedule/stats (optional but makes parity easier)
3) **Intervention page** (`tab.html`) for redirect mode
4) **Content script overlay** for overlay mode

### 3.2 Core runtime modules
- **Service worker (background)**  
  - Global state: focusEnabled, temp-off windows, strict session, schedules, temporary allow
  - Alarms: schedule start/stop, strict session end, temporary allow expiry
  - Usage tracking: per-domain time
  - Messaging hub between UI + content scripts

- **Content script (all URLs)**  
  - Evaluate rule engine (allowed > advanced exclude > advanced block > blocked list)
  - If blocked: render overlay OR request redirect
  - Collect lightweight signals for stats (active URL, visibility changes)

- **UI (React recommended, but not required)**  
  - Reads/writes storage via background messaging
  - Renders all screens with shared components

### 3.3 Permissions (minimum)
- `storage`
- `tabs` (redirect + active tab)
- `alarms` (schedules + timers)
- Host permissions: `<all_urls>`
- Optional: `notifications`

---

## 4) Unified data model (single schema, versioned)

**Use one `StorageSchema` object with migrations.**  
Below merges Doc B schema and adds Doc A modules (timer/tasks/analytics/workflows).

```ts
type SchemaVersion = 2;

type StorageSchema = {
  schemaVersion: SchemaVersion;

  // Core focus state
  focusEnabled: boolean;
  focusTempOffUntil?: number | null; // if now < until => treat focus off

  // Blocking mode selection
  overlayMode: boolean; // overlay vs redirect

  // Confirmation + protection
  confirmationPrompt: boolean;
  pinProtectionEnabled: boolean;
  pinHash?: string | null; // salted hash (never store raw PIN)

  // Lists
  lists: {
    blockedDomains: string[];
    blockedKeywords: string[];
    allowedDomains: string[];
    allowedKeywords: string[];
    advancedRulesText: string; // multiline rules w/ comments
  };

  // Interventions
  interventions: {
    enabled: {
      instantBlock: boolean;
      holdToComplete: boolean;
      slideInOut: boolean;
      pixelated: boolean;
      breathing: boolean;
    };
    configs: {
      instantBlock: { text: string; pausable: boolean };
      holdToComplete: { text: string; durationSec: number };
      slideInOut: { text: string; durationSec: number };
      pixelated: { text: string; durationSec: number };
      breathing: {
        text: string;
        technique: "4-7-8" | "5-0-5" | "7-1-1" | "box";
      };
    };
    randomization: {
      avoidRepeatN: number; // e.g. 2
      lastPicked?: string[];
    };
  };

  // Temporary allow (Let me continue)
  temporaryAllow: Record<string, { until: number }>; // key = hostname

  // Schedule
  schedule: {
    entries: Array<{
      id: string;
      name: string;
      startMin: number; // minutes since midnight
      endMin: number;
      days: Array<0|1|2|3|4|5|6>; // Sun..Sat
      enabled: boolean;
    }>;
    freeTierLimitDaysPerWeek?: number; // default 3 if you enforce gating
  };

  // Strict session (Warden Mode)
  strictSession: {
    active: boolean;
    endsAt?: number;
    blockedSnapshot?: {
      blockedDomains: string[];
      blockedKeywords: string[];
      advancedRulesText: string;
    };
  };

  // Pomodoro focus timer (Coach Mode)
  pomodoro: {
    enabled: boolean;
    workMin: number;   // default 25
    breakMin: number;  // default 5
    cycles: number;    // optional
    autoBlockDuringWork: boolean;
    blockDuringBreak: boolean; // optional
    sounds: boolean;
    alwaysOnTop: boolean; // only if using side panel / separate window
    running?: {
      phase: "work"|"break";
      endsAt: number;
      cycleIndex: number;
      paused: boolean;
      remainingMs?: number; // when paused
      linkedTaskId?: string | null;
    };
  };

  // Tasks (Doc A)
  tasks: {
    activeLimit: number; // default 3
    items: Array<{
      id: string;
      title: string;
      estimateMin: number; // slider-based
      createdAt: number;
      doneAt?: number;
      focusSessionsCompleted: number;
    }>;
  };

  // Workflow automation (Doc A)
  workflows: {
    enabled: boolean;
    rules: Array<{
      id: string;
      trigger: "pomodoroStarted"|"workPhaseStarted"|"breakStarted"|"strictSessionStarted"|"focusEnabled";
      actions: Array<
        | { type: "enableFocusMode"; value: boolean }
        | { type: "setOverlayMode"; value: boolean }
        | { type: "enableAutoBlock"; value: boolean }
        | { type: "toggleBlockDuringBreak"; value: boolean }
        | { type: "showNotification"; value: boolean }
      >;
    }>;
  };

  // Analytics (Doc A + Doc B)
  analytics: {
    // Web usage aggregation (Doc B)
    byDay: Record<string, {
      totalMs: number;
      byDomain: Record<string, number>;
      blockedMs?: number;
      distractionsCount?: number; // visits to blocked
    }>;

    // Focus session history (Doc A)
    sessions: Array<{
      id: string;
      startedAt: number;
      endedAt: number;
      type: "pomodoro"|"strict";
      taskId?: string | null;
      focusEnabledDuring: boolean;
      distractions: number;
      notes?: string;
      emotionTag?: "calm"|"frustrated"|"energized"|"distracted";
    }>;

    // Dashboard prefs (Doc B)
    showWebUsage: boolean;
    chartThemeId: string;
    chartRange: "today"|"week"|"month";
    chartFilter: "all"|"blocked";
  };

  // Monetization stub (optional)
  pro: { enabled: boolean };
};
```

---

## 5) Rule engine: blocking precedence + matching rules

### 5.1 Precedence (required)
1) **Allowed List** always wins (allow)
2) **Advanced exclude** rules (`!pattern`) win (allow)
3) **Advanced block** rules apply next (block)
4) **Blocked list** (domain + keyword) applies last (block)

### 5.2 Domain matching rules (important detail)
- Normalize host:
  - lowercase
  - strip leading `www.`
- Blocked domain entries match **exact host only**.
  - Example: blocking `example.com` does **not** block `news.example.com`
  - Subdomains require explicit add or Advanced patterns

### 5.3 Keyword blocking rules
- Case-insensitive substring match against:
  - full URL string (`href`)
  - (optional) page title (v2)

### 5.4 Advanced rules syntax (compatibility)
- Ignore empty lines and lines starting with `#`
- `!` prefix = exclude (allow)
- Wildcards:
  - `*` any sequence
  - `?` exactly one character
  - `*.example.com` subdomain wildcard
- Support path patterns:
  - `example.com/` main page only
  - `example.com/*` any page
  - `example.com/app/*` etc.

Implementation requirement:
- Parse once, compile to RegExp, cache results.
- Evaluate fast: avoid expensive operations on every navigation.

---

## 6) Feature inventory (merged, no omissions)

### 6.1 Blocking & focus state (Doc B)
- Quick Focus (Focus Mode) ON/OFF toggle
- “Turn off until…” options:
  - 1 hour
  - end of day
  - until manually turned on
- Overlay mode vs redirect mode
- Blocked List:
  - Website tab
  - Keyword tab
- Allowed List (whitelist)
- Advanced List (Beta) pattern matching + comments + `!` excludes
- Temporary allow (“Let me continue” 1/5/10/15 minutes)
- Blocked-site intervention experience:
  - intervention tabs/pills
  - message + “You have spent Xm Ys on domain today.”
  - optional top sites list and percentages
  - footer rate prompt

### 6.2 Interventions system (Doc B)
- Intervention selector screen with randomization:
  - Instant Block (0s)
  - Hold to Complete (duration options 3/8/15/30/45/60)
  - Slide In Out (same duration options)
  - Pixelated (3/5/8/10/12/15)
  - Breathing (techniques 4-7-8, 5-0-5, 7-1-1, box)
- Each has:
  - enable toggle
  - PRO badge (optional gating)
  - detail screen with text input + duration/technique selection
- Random selection among enabled interventions with anti-repeat

### 6.3 Schedule (Doc B)
- Multiple schedule entries
- Add/edit:
  - name
  - start time → end time (supports overnight)
  - day selection chips
- Enforcement via alarms
- Optional free tier limits:
  - max 3 days/week in free

### 6.4 Strict Session (Doc B + aligns with Warden mode)
- Duration presets (1m,10m,20m,30m, 1–4h)
- Confirmation modal:
  - “No way back once started”
- While active:
  - cannot disable Focus Mode
  - temporary allow disabled (recommended)
- Persists across restarts (`endsAt`)

### 6.5 Pomodoro focus timer (Doc A)
- Work/break cycles (default 25/5)
- Start/pause/stop
- Early break switch
- Visual progress bar
- Session-based focus tracking
- Optional: block during break toggle
- Sounds toggle

### 6.6 Task management (Doc A)
- Create tasks with estimated duration (slider)
- Task list + friendly empty state
- Limit active tasks (default 3)
- Link a task to a focus session
- Increment task progress by completed focus sessions

### 6.7 Workflow automation (Doc A)
- Workflow toggle
- Rule-based behavior:
  - start timer → enable focus mode + autoblock
  - break → optionally relax blocking
  - strict session start → warden enforcement

### 6.8 Analytics & insights dashboard (Doc A + Doc B)
- Overview metrics:
  - total focus time
  - total break time
  - total tasks
  - total distractions
- Time-series focus graph (daily)
- Distraction vs focus toggle
- Session history list
- CSV export
- “Time Machine” historical navigation
- Web usage:
  - today/week/month
  - all vs blocked filter
  - donut chart + legend
  - chart themes saved

### 6.9 UI/UX extras (Doc A + Doc B)
- Friendly mascot-based feedback (optional; can be replaced with generic illustration for MVP)
- Always-on-top option (if using a separate window or side panel)
- Lightweight popup-first design + full page for deep settings
- Settings screen:
  - Overlay mode toggle
  - PIN protection toggle + set PIN screen
  - Confirmation prompt toggle
  - Review link
  - Discord link
  - Version footer
  - Promo/upgrade banner (optional stub)

---

## 7) Feature-by-feature build plan (Codex: implement in this exact order)

> **Golden rule for Codex:** Finish *one feature* completely (UI + storage + background + tests) before starting the next.

### Phase 0 — Repo + scaffold
**Goal:** A working MV3 TS extension that loads in Chrome.

**Do:**
- Set up MV3 with TypeScript build (Vite/webpack OK)
- Create service worker, content script, popup, internal pages
- Add a shared `src/shared` module for types + helpers
- Add message bus helpers

**Done when:**
- `Load unpacked` works
- Popup opens
- Content script logs on pages

---

### Phase 1 — Storage + schema + migrations
**Goal:** Stable state layer.

**Do:**
- Implement `StorageSchema` defaults
- Create `getState()`, `setState(partial)`, `subscribeState()`
- Add schema migration framework

**Done when:**
- UI reads/writes `focusEnabled`
- Schema version stored and upgrades safely

---

### Phase 2 — UI foundation + navigation
**Goal:** Shared UI system.

**Do:**
- Implement design tokens
- Build reusable components:
  - Card, Toggle, SegmentedControl, Chip, RowChevron, Modal, TextInput
- Build bottom navigation layout (popup + full page)

**Done when:**
- Navigation works between Home / Lists / Timer / Stats / Settings
- Dark + light theme toggle works (even if hidden)

---

### Phase 3 — Focus Mode state + “turn off until…”
**Goal:** Global focus toggle + temporary off modes.

**Do:**
- Implement focusEnabled toggle on Home
- Implement temp-off choices: 1h / end-of-day / manual
- Ensure temp-off overrides focusEnabled without erasing it

**Done when:**
- Focus state reflects correctly across popup + full page
- Temp-off expires automatically

---

### Phase 4 — Rule engine (Blocked/Allowed/Advanced) ✅ critical
**Goal:** Accurate, fast matching.

**Do:**
- Build parser/compiler for Advanced rules
- Implement matching functions:
  - `isAllowed(url)`
  - `isBlocked(url)`
  - `getBlockReason(url)` (for UI copy)
- Add unit tests for tricky patterns

**Done when:**
- Precedence rules match spec
- Subdomain behavior matches spec

---

### Phase 5 — Lists UI (Blocked / Allowed / Advanced)
**Goal:** User can manage rules.

**Do:**
- Tabs:
  - Blocked List / Allowed List / Advanced List (Beta)
- Blocked & Allowed:
  - Website / Keyword toggle
  - add input + list rendering + delete
- Advanced:
  - textarea
  - examples shown
  - comments supported

**Done when:**
- Lists persist in storage
- Changes take effect immediately

---

### Phase 6 — Blocking enforcement (overlay vs redirect)
**Goal:** Blocked pages reliably show intervention.

**Do:**
- Content script evaluates every navigation and on page load
- If blocked and focus active:
  - overlay mode: inject full-screen overlay and prevent interaction
  - redirect mode: request background to navigate to `tab.html?prev=...`

**Done when:**
- Blocked pages cannot be used in both modes
- Allowed list exceptions work immediately

---

### Phase 7 — Intervention system (random + configuration)
**Goal:** FocusMode-like “signature UX”.

**Do:**
- Implement Interventions list UI + toggles + detail screens:
  - Instant Block
  - Hold to Complete
  - Slide In Out
  - Pixelated
  - Breathing
- Implement random selection among enabled interventions with anti-repeat
- Implement `tab.html` intervention page UI:
  - shows selected intervention tabs
  - shows message + usage line
  - shows “Let me continue” section collapsed

**Done when:**
- Each intervention has correct durations/techniques
- Randomization works and persists choices

---

### Phase 8 — Temporary allow (“Let me continue” 1/5/10/15)
**Goal:** Controlled bypass.

**Do:**
- Add durations chips/buttons
- Store temporary allow `{hostname: until}`
- In rule engine, treat as allowed if now < until
- Alarm cleanup on expiry

**Done when:**
- Temporary allow works for current domain
- Automatically re-blocks after expiry

---

### Phase 9 — Usage tracking (web usage)
**Goal:** Domain usage totals for Today/Week/Month.

**Do:**
- Background tracks active tab hostname time:
  - onActivated, onUpdated, windows focus changes, idle detection
- Aggregate into `analytics.byDay[YYYY-MM-DD].byDomain`
- Provide API to get chart data
- Build Stats UI:
  - today/week/month
  - all vs blocked
  - donut chart + list
  - chart themes persisted

**Done when:**
- Time counts are plausible and stable across day boundaries
- Charts render and settings persist

---

### Phase 10 — Schedule engine
**Goal:** Auto enable/disable focus.

**Do:**
- Schedule list UI + edit UI
- Alarm scheduling for each entry, including overnight spans
- Apply at start: set focus ON
- Apply at end: set focus OFF (unless strict session active)

**Done when:**
- Schedule triggers correctly on selected days
- Edge case: overnight schedule works

---

### Phase 11 — Strict Session (Warden Mode)
**Goal:** Irreversible deep focus.

**Do:**
- Strict Session screen with presets
- Confirmation modal
- When active:
  - lock focus on
  - disable turning off focus and temporary allow
  - store endsAt, set alarm
- When ends:
  - unlock UI
  - log session to analytics

**Done when:**
- Cannot cancel strict session
- Persists after browser restart

---

### Phase 12 — Pomodoro timer (Coach Mode) + session logging
**Goal:** Focus timer integrated with blocking.

**Do:**
- Pomodoro UI:
  - configure work/break
  - start/pause/stop
  - early break
  - progress bar
- Integrate:
  - work phase can auto-enable focus + blocking
  - break phase can optionally relax blocking
- Log each completed work session to analytics.sessions

**Done when:**
- Timer runs accurately
- Focus mode reacts based on workflow settings

---

### Phase 13 — Tasks + linking to sessions
**Goal:** Task-driven focus.

**Do:**
- Task list UI + add task (slider estimate)
- Active task limit = 3
- Link a task to a Pomodoro run
- Increment focusSessionsCompleted when session ends

**Done when:**
- Tasks persist
- Task progress updates per completed session

---

### Phase 14 — Dashboard & exports (Insights)
**Goal:** The “why” layer.

**Do:**
- Overview metrics cards
- Time-series focus graph by day
- Distraction vs focus toggle
- Session history list (with “Time Machine” navigation)
- CSV export:
  - sessions CSV
  - web usage CSV

**Done when:**
- Export produces correct CSV
- History navigation works

---

### Phase 15 — Settings polish + protection
**Goal:** Harden behavior and polish UI.

**Do:**
- Overlay mode toggle
- Confirmation prompt before turning off
- PIN protection:
  - set PIN (4-digit)
  - verify PIN when disabling focus or editing schedule (as per spec)
  - store salted hash
- Sounds toggle
- Always-on-top (if supported via window mode)
- Review link + Discord link
- Version footer

**Done when:**
- Protection cannot be bypassed via UI
- Settings persist

---

## 8) Innovation backlog (add after parity MVP)

These are **not required** for parity, but come from Doc A as differentiation.

### 8.1 Intent-Aware Focus Engine
- Pre-session “one sentence goal”
- NLP intent tags influence blocking strictness
- Post-session reflection

### 8.2 Cognitive Drift Detection (privacy-safe)
- Signals: rapid tab switching, revisit loops
- Gentle nudge or auto-pause

### 8.3 Adaptive Pomodoro Length
- Adjust work length based on fatigue + success rate

### 8.4 Focus debt/credit system
- Distractions create “debt”; deep work earns “credit”
- Uses to scale strictness or unlock rewards

### 8.5 Semantic / feature-level blocking
- YouTube allow tutorials but block Shorts/home
- DOM heuristics + URL patterns

### 8.6 Focus Replay (Time Machine++)
- Session timeline: phases + tab changes + distraction spikes

### 8.7 Emotional tagging
- After session: calm/frustrated/energized/distracted
- Correlate with performance

### 8.8 Invisible mode
- No UI during focus; only daily summary

### 8.9 Focus contracts (commitment device)
- “If I open X, block for 24h” irreversible locally

### 8.10 AI focus coach (offline-first)
- Weekly narrative insights derived locally

---

## 9) QA checklist (minimum)

### 9.1 Blocking correctness
- Allowed list overrides everything ✅
- Advanced `!` excludes override blocks ✅
- Subdomains not blocked unless explicitly added ✅
- Temporary allow works and expires ✅

### 9.2 Strict session enforcement
- Cannot disable focus while strict active ✅
- No “Let me continue” while strict active ✅
- Restart browser still enforces until endsAt ✅

### 9.3 Usage tracking sanity
- Doesn’t count when window not focused
- Handles tab switching
- Day rollover correct (YYYY-MM-DD)

### 9.4 Performance
- Content script work per navigation is minimal
- Advanced rule regex compiled and cached

### 9.5 Security
- PIN stored only as salted hash
- No external network calls in MVP

---

## 10) Codex operating instructions (how to use this doc)

For each Phase above:

1) **Create a feature branch**: `feat/phase-<n>-<name>`
2) Implement:
   - storage changes
   - background logic
   - UI screens
   - tests/checklist
3) Provide:
   - files changed list
   - manual test steps
4) Only then proceed to next phase.

---

## Appendix A — Default copy text (suggested)
- Focus ON: “Turned on”
- Focus OFF: “Turned off”
- Instant block text default: “Get back to work!”
- Hold/Slide/Pixel default: “Are you sure you want to enter this site?”
- Breathing default: “Slowly breathe, follow the pace of the animation”
- Usage line: “You have spent **{Xm Ys}** on **{domain}** today.”

---

## Appendix B — Intervention durations (must match)
- Hold / Slide: `3s, 8s, 15s, 30s, 45s, 60s`
- Pixelated: `3s, 5s, 8s, 10s, 12s, 15s`
- Temporary allow: `1m, 5m, 10m, 15m`
- Strict presets: `1m, 10m, 20m, 30m, 1h, 2h, 3h, 4h`

---

## Appendix C — Overlap resolution notes
- “Strict Session” overlaps conceptually with “Warden/commitment device” — treat Strict Session as the MVP version.
- “Analytics” overlaps: merge web-usage donut charts (Doc B) with focus-session graphs + exports (Doc A).
- “Blocking” overlaps: unify under one rule engine with precedence rules (Doc B is authoritative for matching/precedence details).

---
