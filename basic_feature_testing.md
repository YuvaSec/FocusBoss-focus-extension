# FocusBoss Feature Expansion Plan

Goal: Add network-level blocking, notifications, offscreen timer/audio, storage expansion, exports, and a lighter-permission injection mode while keeping the current widget and popup UX stable.

## Scope and outcomes
- Stronger blocking: use Declarative Net Request (DNR) rules for HTTP/S navigation before page render.
- Cross-tab widget consistency: scripting injection for existing tabs, plus optional active-tab-only mode.
- System notifications: focus/break start/end and strict-session reminders.
- Offscreen runtime: reliable timers and optional soundscapes even with no visible tabs.
- Analytics storage: longer retention, exportable reports, and performance-safe writes.
- Export: CSV/JSON reports for stats and tasks.

## Required permissions and rationale
- declarativeNetRequest: apply dynamic block/allow rules; faster than DOM overlays.
- notifications: show system alerts for session events.
- offscreen: run audio or timers without any active tab.
- unlimitedStorage: keep longer analytics history and exports.
- scripting: inject widget into already-open tabs.
- activeTab (optional): allow "inject only current tab" mode for privacy-first users.
- downloads (optional): enable report export to file.

## Milestones and tasks

### 1) DNR blocking (network-level) [in progress]
Deliverable: block/allow rules enforced before page load, with a clean interstitial page.
- [x] Add DNR rule builder that compiles blocked/allowed domains and keyword rules.
- [ ] Use dynamic rules for user lists; reserve static rules for extension-owned pages.
- [x] Create a dedicated block/interstitial page (with "temporary allow" and "return" actions).
- [x] Ensure Focus state toggles DNR rules on/off.
- [x] Keep current overlay as a fallback if DNR fails (edge cases, Chrome limitations).
- [x] Interstitial shows block reason (domain/keyword/advanced).

### 2) Cross-tab widget consistency [done]
Deliverable: widget appears and syncs across all existing tabs without reload.
- [x] Keep content script in manifest for auto-inject on new tabs.
- [x] Use scripting injection for all currently open http/https tabs on install, startup, and Pomodoro start/stop.
- [x] Add single-instance guard in the content script to avoid duplicate DOM.

### 3) Notifications [planned]
Deliverable: system notifications for important session events.
- Emit notifications on focus start, break start, break end, strict end, and pomodoro complete.
- Add per-event toggle in settings.
- Include quick actions (e.g., "Start break", "Extend focus") where supported.

### 4) Offscreen runtime + audio [done]
Deliverable: timers and audio continue even if no tabs are open.
- [x] Create offscreen document to host audio playback and timed cues.
- [x] Background service worker sends events to offscreen to play start/end sounds.
- [x] Use custom audio files for start/break/stop/complete sounds.
- [x] Add a Settings toggle to enable/disable pomodoro sounds.

### 5) Long-term analytics and storage [in progress]
Deliverable: longer stats history and safe storage growth.
- [x] Add retention settings (90/180/365/forever).
- [x] Add a background cleanup job (alarms) to prune old data.
- [x] Clamp stats range buttons based on retention (3M/6M/Y).
- [ ] Move heavy analytics to indexed by day/month keys.
- [ ] Enable export routines to produce CSV/JSON.

### 6) Exports [planned]
Deliverable: user can download reports and backups.
- Add "Export CSV" and "Export JSON" in Stats.
- Add "Backup/Restore" in Settings.
- Use downloads API for file output; fallback to copy-to-clipboard if disabled.

## UI/UX changes
- Settings: add permissions explanation for DNR, notifications, offscreen, scripting, downloads.
- Stats: add export buttons and a retention control.
- Blocking: show an interstitial page with a clear timer for temporary allow.
- Widget: status badge for DNR active.
- Interstitial: show reason for block (domain/keyword/advanced) plus today’s usage.
- Widget completion: auto-dismiss completed screen after timeout with “Keep showing” option.

## Data model updates
- Add settings flags for notifications, sounds, retention, and export format.
- Store DNR rule IDs and last applied hash to avoid unnecessary updates.

## Implementation order (suggested)
1) DNR engine + interstitial page.
2) Widget sync across tabs (scripting + single-instance guard).
3) Offscreen audio runtime.
4) Analytics retention + export.
5) Notifications framework.
6) Settings UI integration and copy.

## Risks and mitigations
- DNR limits on rule count: compress rules, prefer domain-level rules, avoid per-keyword explosion.
- Background service worker sleeping: use alarms + offscreen for time-sensitive events.
- Permission friction: explain benefits and offer privacy mode for less intrusive behavior.

## Testing plan (expanded)
- DNR: add/remove domain and verify immediate block/unblock without reload.
- Interstitial: temporary allow returns to original URL and respects strict mode.
- Widget sync: start pomodoro and verify widget appears in already-open tabs.
- Notifications: verify each event type, and toggles disable notifications.
- Offscreen audio: start/stop/pause and confirm sounds play reliably.
- Analytics retention: simulate old data, verify prune job.
- Exports: generate CSV/JSON and verify file content.
- Completion screen: verify auto-dismiss timer and “Keep showing” behavior.
- Block reason: verify reason text matches rule (domain/keyword/advanced).
