# Gemini's Suggestions for Improving FocusBoss

This file contains detailed explanations for proposed improvements to the FocusBoss extension.

## Part 1: Feature & Refactoring Ideas

### 1. Code Refactoring for Maintainability

**The Problem:** The file `src/popup/index.ts` is currently a "monolith." It handles everything from rendering stats, managing the Pomodoro timer, handling user input, and updating the UI. As you add more features, this single file will become increasingly large, complex, and difficult to manage. This can lead to bugs being harder to find and new features being harder to implement.

**The Solution:** Break down `src/popup/index.ts` into smaller, more focused modules. Each module would be responsible for a specific feature.

**Proposed File Structure:**

*   `src/popup/`
    *   `index.ts`: (The main entry point) This file would be much smaller, responsible only for initializing the other modules and tying them together.
    *   `stats.ts`: All logic related to the "stats" tab would go here. This includes fetching the analytics data, calculating stats for different time periods, and rendering the charts. Functions like `renderStats`, `renderDonut`, etc., would move here.
    *   `pomodoro.ts`: All logic for the Pomodoro timer would live here. This includes starting, stopping, and resetting the timer, as well as managing the timer state.
    *   `ui.ts`: This module would handle general UI updates, like switching between the main view and the stats view, handling dark mode, and other purely visual concerns.
    *   `events.ts`: This module would be responsible for setting up all the event listeners (e.g., for button clicks) and dispatching actions to the other modules.

**Benefits:**

*   **Separation of Concerns:** Each part of your application has a clear and distinct responsibility.
*   **Easier Debugging:** When a bug occurs in the stats tab, you'll know to look in `stats.ts`.
*   **Improved Reusability:** You might be able to reuse some of these modules in other parts of your extension later.
*   **Parallel Development:** If you were working with a team, one person could work on the stats feature while another works on the Pomodoro timer without creating conflicts.

### 2. Custom Date Ranges

**The Problem:** The current stats view only allows users to see their data for "Today," "This Week," or "This Month." This is a good start, but it's not very flexible. A user might want to see how their habits have changed over a specific two-week period, or look at their data from last month.

**The Solution:** Add a feature that allows users to select a custom start and end date.

**Implementation Steps:**

1.  **UI for Date Selection:** In `public/popup.html`, add two input fields of `type="date"` to let users pick a start and end date. You could place this near the existing "Today," "Week," and "Month" buttons.
2.  **Update Event Handling:** In the refactored `src/popup/events.ts` (or `src/popup/index.ts` if you don't refactor), add an event listener to these new date inputs. When the dates change, it should trigger a re-rendering of the stats.
3.  **Modify Data Filtering Logic:** In `src/popup/stats.ts`, update the function that calculates the stats. It currently has logic to determine the start date for "Today," "Week," and "Month." You'll need to add a new case that takes the user-selected start and end dates and filters the `analytics.byDay` data from storage to only include the days within that range.

### 3. Website Categorization

**The Problem:** The stats currently show time spent on individual websites. While useful, it doesn't give a high-level overview of a user's habits. For example, a user might spend 30 minutes on Facebook, 20 minutes on Twitter, and 15 minutes on Instagram. The stats will show these as three separate entries, but the real insight is that they spent 65 minutes on "Social Media."

**The Solution:** Allow users to create categories (e.g., "Work," "Social," "Entertainment") and assign websites to them.

**Implementation Steps:**

1.  **Update Storage:** In `src/shared/storageSchema.ts`, add a new field to the storage schema to hold the categories, for example: `websiteCategories: { [hostname: string]: string }`.
2.  **Create a Category Management UI:** In `public/popup.html`, create a new section (perhaps in the settings) where users can manage their categories. This UI would:
    *   Show a list of all websites the user has visited.
    *   Allow the user to assign each website to a category from a dropdown.
    *   Allow the user to create new categories.
3.  **Save Categories:** In `src/popup/index.ts` (or a new `categories.ts` module), add the logic to save the user's category assignments to storage when they make changes in the UI.
4.  **Update Stats Calculation:** In `src/popup/stats.ts`, when you process the analytics data, you will first look up the category for each website. Then, you will aggregate the time spent by category instead of by individual website. The donut chart would then show slices for "Work," "Social," etc., instead of `youtube.com`, `facebook.com`, etc.

### 4. Goal Setting

**The Problem:** The stats are currently passive; they show the user what they've done. To make the extension more of a "coach," it could help users be more proactive about their time.

**The Solution:** Allow users to set goals for how much time they want to spend on certain categories of websites.

**Implementation Steps:**

1.  **Update Storage:** In `src/shared/storageSchema.ts`, add a new field to store goals, for example: `goals: { [category: string]: { limit: number; timeframe: 'daily' | 'weekly' } }`.
2.  **Create a Goal Setting UI:** In the popup, create a new UI where users can set their goals. For example, a user could select the "Social" category and set a limit of 60 minutes per day.
3.  **Display Goal Progress:** In `src/popup/stats.ts`, when rendering the stats, you would also fetch the user's goals. For each category, you would compare the time spent to the goal and visualize the progress. This could be a simple text display ("You've used 45 of 60 minutes for 'Social' today") or a progress bar.
4.  **(Advanced) Proactive Notifications:** You could enhance the background script (`src/background/index.ts`). While it's tracking usage, it could check if a user is nearing a goal limit. If so, it could use the `chrome.notifications` API to send a notification to the user, for example: "You've almost reached your daily limit for 'Social' websites."

---

## Part 2: Stats Tab UI Redesign Implementation Plan

This is a detailed plan to implement the proposed UI redesign for the Stats tab. The goal is to create a more professional, compact, and scannable layout by restructuring the HTML in `public/popup.html` and updating the styles in `public/ui.css`. All existing `id` attributes will be preserved to ensure the JavaScript logic in `src/popup/index.ts` continues to function correctly.

### 1. Stats Header (Single Bar)
*   **Goal:** Consolidate all top-level controls into a single, clean header.
*   **HTML (`public/popup.html`):**
    1.  A new `<header class="stats-header">` will be created at the top of the `<section data-view="stats">`.
    2.  This header will contain a main title: `<h2>Stats</h2>`.
    3.  The existing "Range" (`Today`, `Week`, `Month`) and "Filter" (`All`, `Blocked`) segmented controls will be moved inside this header, to the right of the title. This will involve relocating the divs that currently wrap these controls.
*   **CSS (`public/ui.css`):**
    1.  The `.stats-header` class will use `display: flex`, `justify-content: space-between`, and `align-items: center` to arrange the title and controls on a single line.
    2.  Styles will be adjusted to ensure the segmented controls are compact and fit well in the new header.

### 2. Primary Summary (Hero Card)
*   **Goal:** Create a prominent "hero" card that displays the most important, high-level metrics.
*   **HTML (`public/popup.html`):**
    1.  The four separate cards for "Focus," "Break," "Tasks completed," and "Distraction" will be removed.
    2.  A new, single `<div class="card primary-summary">` will be created to replace them.
    3.  The core elements (the `<span>` with the metric and the `<span>` with the label) from the old cards will be moved inside this new card.
*   **CSS (`public/ui.css`):**
    1.  The `.primary-summary` card will be styled to be visually prominent.
    2.  `display: grid` and `grid-template-columns: 1fr 1fr` will be used to arrange the four metrics neatly in a 2x2 grid, making efficient use of space.

### 3. Usage Card (Combined Donut + Top Domains)
*   **Goal:** Combine the donut chart and the list of top domains into one logical unit, as they represent the same data in different ways.
*   **HTML (`public/popup.html`):**
    1.  The separate cards and tab-like controls for "Usage breakdown" and "Top domains" will be removed.
    2.  A new `<div class="card usage-card">` will be created.
    3.  Inside this card, a two-column layout will be established. The left column will contain the donut chart (`<div id="statsDonut">`), and the right column will contain the list of top domains (`<ul id="statsTopDomains">`).
*   **CSS (`public/ui.css`):**
    1.  The `.usage-card` will be styled with `display: grid` or `display: flex` to create the two-column layout. This will place the visual chart and the detailed list side-by-side for easy comparison.

### 4. Timeline Card (Self-Contained)
*   **Goal:** Make the timeline a strong, self-contained visual element with its controls integrated.
*   **HTML (`public/popup.html`):**
    1.  The existing card for the "Focus/Distraction timeline" will be kept.
    2.  The "Focus" / "Distraction" toggle controls will be moved from their current location into the header of this card, making it clear they control this specific chart.
    3.  The chart's legend will also be moved into the header for a more compact design.
*   **CSS (`public/ui.css`):**
    1.  The card header's CSS will be updated to accommodate the toggle and legend using flexbox.

### 5. Heatmap + Session History
*   **Goal:** Group these two dense, informational sections together.
*   **HTML (`public/popup.html`):**
    1.  The cards for the "Hour heatmap" and "Session history" will be moved to be adjacent in the HTML structure. They will be stacked vertically, one after the other.
*   **CSS (`public/ui.css`):**
    1.  The bottom margin of the heatmap card will be adjusted to create a tight, logical grouping with the session history card below it.

### 6. Time Machine (Collapsible)
*   **Goal:** Hide this secondary feature by default to clean up the main view.
*   **HTML (`public/popup.html`):**
    1.  The entire "Time Machine" section will be wrapped in an HTML `<details>` element.
    2.  A `<summary>` element will be added with the text "Time Machine: Pick a day". This will be the visible part that users click to expand.
    3.  The rest of the Time Machine content (day picker, details) will be inside the `<details>` tag, making it initially hidden.
*   **CSS (`public/ui.css`):**
    1.  The `<summary>` element will be styled to look like a clean, clickable section header, inviting interaction without cluttering the page.

### 7. Export Footer
*   **Goal:** Demote the export buttons to a simple, final action card.
*   **HTML (`public/popup.html`):**
    1.  A new, simple `<div class="card export-footer">` will be created at the very end of the stats section.
    2.  The export buttons will be moved inside this card.
*   **CSS (`public/ui.css`):**
    1.  The `.export-footer` card will be styled minimally, with less padding and margin, to signify it as a footer/utility section rather than a primary content card.