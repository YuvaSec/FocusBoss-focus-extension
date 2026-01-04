# Troubleshoot

## Problem
Chrome failed to load the extension and showed:

"Could not load javascript 'content/index.js' for script."

## Why it happened
The build script ran TypeScript first, which wrote compiled files into `dist/`.
Then the copy script deleted `dist/` and only copied the `public/` files.
That removed the compiled `content/index.js`, so Chrome could not find it.

## Fix
I changed the copy step to stop deleting `dist/`. Now it only copies `public/`
into the existing `dist/` folder so the compiled JS stays there.

## How to verify
1) Run `npm run build`.
2) Check that `dist/content/index.js` exists.
3) Load `dist/` in Chrome as an unpacked extension.

## Problem
Chrome failed to load the service worker and showed:

"Service worker registration failed. Status code: 3" with
"An unknown error occurred when fetching the script."

## Why it happened
MV3 service workers use JavaScript modules. In module mode, Chrome requires
relative imports to include the file extension (for example `./storage.js`).
TypeScript emitted imports without the `.js` extension, so Chrome could not
resolve them.

## Fix
I updated the TypeScript config and imports to use explicit `.js` extensions
so the emitted files match what Chrome expects.

## How to verify
1) Run `npm run build`.
2) Check that `dist/background/index.js` contains imports that end in `.js`.
3) Reload the extension; the service worker should register normally.

## Problem
The popup UI looked squished and cut off in a very narrow column.

## Why it happened
Chrome can render the popup at a smaller width than expected. Without a
minimum size, the layout collapses and the content becomes unreadable.

## Fix
I set a minimum width and height on the popup body and allowed the main
content area to scroll if needed.

## How to verify
1) Run `npm run build`.
2) Reload the extension popup.
3) The layout should have enough space and no longer collapse.

## Problem
TypeScript failed to build with errors like:
"Property 'theme' is missing" or "Property 'tempOffPreset' is missing".

## Why it happened
`setState` accepted `Partial<StorageSchema>`, which is only shallow. When we
updated `ui` with just one field (like `ui: { tempOffPreset: "1h" }`),
TypeScript expected *all* required fields inside `ui`, including `theme`.

## Fix
I introduced a `DeepPartial` type so nested updates can include only the
fields we want to change. `setState` now accepts `DeepPartial<StorageSchema>`.

## How to verify
1) Run `npm run build`.
2) The TypeScript errors should be gone.

## Problem
Pause buttons would start a pause, but clicking the same button again did not
cancel the pause. The UI stayed highlighted and Focus stayed paused.

## Why it happened
Pause state was split between different fields and UI-only flags, so the
second click never reliably cleared the real pause state in storage. The
source of truth was unclear.

## Fix
I refactored pause to a single stored object:
- `pause.isPaused`
- `pause.pauseType`
- `pause.pauseEndAt`

The popup now toggles pause by reading/writing this state directly:
- If the same pause type is active, it clears pause immediately.
- If a different pause type is clicked, it replaces the active pause.

The background schedules and clears the pause alarm based on this state.

## How to verify
1) Turn Focus Mode ON.
2) Click `1h` → pause starts and the chip highlights.
3) Click `1h` again → pause clears and the chip un-highlights.
4) Repeat for `End of day` and `Manual`.

## Problem
After reload, the Manual pause chip was always active and the status said
"Focus enabled, paused until you resume." Timed pauses (like 1 minute) never
auto-resumed and the UI snapped back to Manual.

## Why it happened
Old (legacy) pause fields were still stored in Chrome storage from earlier
versions. On every startup, the migration logic re-read those legacy fields
and forced the pause state back to Manual, overwriting the new pause state.

## Fix
I updated the migration to only use legacy pause fields once:
- If the new `pause` object already exists, legacy fields are ignored.
- When legacy fields are detected, we force a write to storage so they are
  cleared and no longer override the new state.

## How to verify
1) Run `npm run build`.
2) Reload the extension popup.
3) Manual should no longer be selected by default.
4) Timed pauses should resume correctly after the timer ends.

## Problem
Blocking a site by pasting a full URL (like `https://www.instagram.com/`) did
not work, while `instagram.com` or `www.instagram.com` did.

## Why it happened
The blocker matches exact hostnames. When a full URL was saved in the list,
it did not match the normalized hostname check.

## Fix
I normalized domain inputs before saving:
- Strip `http://` or `https://`
- Strip leading `www.`
- Remove any path

Now URLs like `https://www.instagram.com/` are saved as `instagram.com`.

## How to verify
1) Add `https://www.instagram.com/` to Blocked → Websites.
2) It saves as `instagram.com`.
3) Visit Instagram with Focus ON and it should be blocked.

## Problem
The build failed with many TypeScript errors in the new intervention UI:
- Invalid characters / unterminated strings
- Possible null references
- Config fields (duration/technique/pausable) not existing on every type

## Why it happened
The template strings were added with escaped quotes that broke the syntax,
and the intervention config types were a union. That means fields like
`durationSec` or `technique` only exist on some interventions, so TypeScript
requires checks before access.

## Fix
- Rewrote the template strings with normal quotes and `.join("")`.
- Added null guards for DOM elements.
- Added safe type guards when reading `durationSec`, `technique`, and `pausable`.

## How to verify
1) Run `npm run build`.
2) TypeScript should compile with no errors.

## Problem
Redirect mode sent the tab to `extension://invalid/` and Edge showed
"ERR_BLOCKED_BY_CLIENT" instead of loading the intervention page.

## Why it happened
The content script tried to navigate directly with `window.location.replace`,
which Edge can block. When the background listener didn’t reliably update the
active tab, the fallback path still fired and caused the invalid URL error.

## Fix
I routed redirects through the background script using `chrome.tabs.update` and
made it fall back only if the background update fails. The background now also
queries the active tab if `sender.tab` is missing.

## How to verify
1) Turn Focus ON and set blocking style to Redirect.
2) Visit a blocked site.
3) The tab should open `tab.html` and show the intervention screen.

## Problem
The popup showed a vertical scrollbar on the outer frame instead of inside the
content area (behind the bottom nav), which looked messy.

## Why it happened
The popup is a flex column layout. Without `min-height: 0` on the flex
container and scrollable child, the child can overflow and force the outer
window to scroll.

## Fix
I constrained the flex layout so only the content area scrolls:
- `.app` uses `height: 100%` and `min-height: 0`
- `.app-main` uses `min-height: 0` and `overflow-y: auto`

This keeps the scrollbar inside the content area.

## How to verify
1) Run `npm run build`.
2) Reload the popup.
3) Scroll should stay inside the main content, not on the outer frame.
# Focus Toggle Doesn’t Respond

**Symptom**
- Focus toggle and “Turn off until” chips don’t react, even when Pomodoro is off.

**Cause**
- The schedule engine was forcing `focusEnabled` to `false` whenever there were **no enabled schedules**.
- That immediately overwrote any manual toggle or pause state.

**Fix**
- `applyScheduleState()` now exits early if there are no enabled schedules, leaving manual focus control intact.

**Where**
- `src/background/index.ts` (`applyScheduleState`)
