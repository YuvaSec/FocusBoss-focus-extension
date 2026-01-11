# FocusBoss

FocusBoss is a MV3 Chrome extension that helps you reduce distractions with focus mode, Pomodoro sessions, and analytics. The UI is designed to be calm and minimal while still surfacing the right control at the right time.

## Features

- Focus Mode toggle with temporary off states.
- Blocked/Allowed lists for domains and keywords, plus advanced rule patterns.
- Pomodoro timer with auto‑block during work and optional blocking during breaks.
- Tag-based Pomodoro presets and quick switching.
- Strict Mode sessions that lock focus until the timer ends.
- Intervention styles (overlay vs redirect) for blocked pages.
- Usage analytics: trends, heatmaps, top sites, and tag breakdowns.
- Schedules to auto-enable focus by time.
- CSV export for sessions and usage data.

## Architecture

- `public/` — UI markup, styles, and the MV3 manifest.
- `src/popup/` — Popup UI logic (state, navigation, charts, modals).
- `src/background/` — Service worker that tracks usage, schedules, and alarms.
- `src/content/` — Content script that enforces blocking and overlays.
- `src/tab/` — Blocking/redirect page logic.
- `src/shared/` — Storage, rules engine, schema, and messaging utilities.

## Tech stack

- Manifest V3 Chrome extension
- TypeScript (no framework)
- Custom CSS UI

## Permissions

- `storage` for settings and analytics.
- `tabs` for usage tracking and redirects.
- `alarms` for Pomodoro, strict mode, and schedules.
- `host_permissions: <all_urls>` for blocking and usage tracking.

## Data & storage

- Primary state is stored in `chrome.storage.local`.
- Small UI preferences (e.g., widget placement) use `chrome.storage.sync` where applicable.

## Development

Install dependencies:

```bash
npm install
```

Build into `dist/`:

```bash
npm run build
```

Watch mode:

```bash
npm run watch
```

Load the extension:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist/` folder

## Testing

```bash
npm test
```

## Notes

- The popup UI is built from `public/popup.html` + `public/ui.css`.
- `scripts/copy.mjs` moves static assets into `dist/` after build.
