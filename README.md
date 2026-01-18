# FocusBoss

FocusBoss is a Manifest V3 Chrome extension built to help you protect focus. It combines fast site blocking, a polished Pomodoro workflow, and rich analytics into a single, calm interface that stays out of the way until you need it.

## Highlights

- Focus Mode with domain/keyword allowlists and blocklists.
- Advanced rule patterns, plus YouTube video/playlist exceptions.
- Pomodoro cycles with optional auto-blocking and sound cues.
- Strict Sessions that lock focus until the timer ends.
- Interventions for blocked pages (instant block, hold-to-complete, slide gate, breathing reset).
- Scheduling to auto-enable focus by time and day.
- Analytics for usage trends, heatmaps, and tag performance.
- CSV/JSON exports for sessions and usage data.

## How It Works

FocusBoss uses a background service worker to enforce rules, track usage, and manage timers. Content scripts apply overlays and interventions directly on pages. A dedicated "tab" UI handles the focused blocking experience, while the popup provides configuration, charts, and exports.

## Architecture

- `public/` - Static UI assets, CSS, and `manifest.json`.
- `src/background/` - Service worker logic (rules, alarms, analytics, schedule).
- `src/content/` - Page-level blocking, overlays, and widget UI.
- `src/popup/` - Popup UI, navigation, analytics views, exports.
- `src/tab/` - Blocked/redirected page UI and interactions.
- `src/shared/` - Storage schema, rules engine, and shared utilities.

## Permissions

FocusBoss requests only what it needs:

- `storage` - Settings, sessions, and analytics.
- `tabs` - Usage tracking and redirects.
- `alarms` - Pomodoro, strict sessions, and schedules.
- `scripting` - Injecting content scripts when needed.
- `declarativeNetRequest` - High-performance blocking rules.
- `offscreen` - Audio playback for timer cues.
- `webNavigation` - Track blocked navigations accurately.
- `host_permissions: <all_urls>` - Required to evaluate and block any page.

## Data and Privacy

- All data is stored locally in `chrome.storage.local`.
- Lightweight UI preferences may be synced via `chrome.storage.sync`.
- No external services or analytics are used by default.

## Installation (Development)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the extension:
   ```bash
   npm run build
   ```
3. Load it in Chrome:
   - Open `chrome://extensions`
   - Enable **Developer mode**
   - Click **Load unpacked**
   - Select the `dist/` folder

## Development Workflow

- Build once:
  ```bash
  npm run build
  ```
- Watch TypeScript changes:
  ```bash
  npm run watch
  ```
- Run tests:
  ```bash
  npm test
  ```

## Configuration Guide

FocusBoss is built around a few core systems:

- Rules: Define domains/keywords to allow or block, plus advanced patterns.
- Pomodoro: Configure work/break length, cycles, and sound cues.
- Strict Sessions: Lock focus for a set duration.
- Interventions: Choose how to interrupt access to blocked pages.
- Scheduling: Automatically enable focus on a weekly schedule.

## Exporting Data

From the popup Analytics view, you can export:

- Pomodoro sessions (CSV/JSON)
- Focus sessions (CSV/JSON)
- Usage by site (CSV/JSON)
- Blocked usage (CSV/JSON)

## Tech Stack

- TypeScript (no framework)
- Chrome Extension Manifest V3
- Custom CSS UI

## Project Notes

- Popup UI uses `public/popup.html` and `public/ui.css`.
- Static assets are copied into `dist/` by `scripts/copy.mjs` after build.
