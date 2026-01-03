import { getState, setState, subscribeState } from "../shared/storage.js";
import {
  BREATHING_TECHNIQUES,
  INTERVENTION_DEFS,
  type InterventionKey
} from "../shared/interventions.js";

// --- DOM references (grab once, reuse) ---
const statusEl = document.getElementById("status");
const toggleEl = document.getElementById("focusToggle") as HTMLInputElement | null;
const appRoot = document.querySelector(".app");
const rootEl = document.documentElement;
const navButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(".nav-btn"));
const navBar = document.querySelector<HTMLElement>(".app-nav");
const views = Array.from(document.querySelectorAll<HTMLElement>(".view"));
const themeControl = document.getElementById("themeControl");
const overlayToggle = document.getElementById("overlayToggle") as HTMLInputElement | null;
const overlayLabel = document.getElementById("overlayLabel");
const statsRangeButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("#statsRange button")
);
const statsFilterButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("#statsFilter button")
);
const statsTotalValue = document.getElementById("statsTotalValue");
const statsList = document.getElementById("statsList");
const domainStatsTitle = document.getElementById("domainStatsTitle");
const domainStatsBody = document.getElementById("domainStatsBody");
const statsStacked = document.getElementById("statsStacked");
const statsHeatmap = document.getElementById("statsHeatmap");
const scheduleAdd = document.getElementById("scheduleAdd");
const scheduleList = document.getElementById("scheduleList");
const scheduleTitle = document.getElementById("scheduleTitle");
const scheduleName = document.getElementById("scheduleName") as HTMLInputElement | null;
const scheduleStart = document.getElementById("scheduleStart") as HTMLInputElement | null;
const scheduleEnd = document.getElementById("scheduleEnd") as HTMLInputElement | null;
const scheduleDays = document.getElementById("scheduleDays");
const scheduleSave = document.getElementById("scheduleSave");
const pomodoroStatus = document.getElementById("pomodoroStatus");
const pomodoroProgress = document.getElementById("pomodoroProgress");
const pomodoroStart = document.getElementById("pomodoroStart") as HTMLButtonElement | null;
const pomodoroPause = document.getElementById("pomodoroPause") as HTMLButtonElement | null;
const pomodoroStop = document.getElementById("pomodoroStop") as HTMLButtonElement | null;
const pomodoroWork = document.getElementById("pomodoroWork") as HTMLInputElement | null;
const pomodoroBreak = document.getElementById("pomodoroBreak") as HTMLInputElement | null;
const pomodoroCycles = document.getElementById("pomodoroCycles") as HTMLInputElement | null;
const pomodoroAutoBlock = document.getElementById("pomodoroAutoBlock") as HTMLInputElement | null;
const pomodoroBlockBreak = document.getElementById("pomodoroBlockBreak") as HTMLInputElement | null;
const strictStatus = document.getElementById("strictStatus");
const strictStart = document.getElementById("strictStart") as HTMLButtonElement | null;
const strictConfirm = document.getElementById("strictConfirm") as HTMLButtonElement | null;
const strictConfirmText = document.getElementById("strictConfirmText");
const strictDurationButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-strict-min]")
);
const tempOffButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-temp-off]")
);
const listTypeButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("#listTypeControl button")
);
const entryTypeButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("#entryTypeRow button")
);
const entryTypeRow = document.getElementById("entryTypeRow");
const listEditor = document.getElementById("listEditor");
const listInput = document.getElementById("listInput") as HTMLInputElement | null;
const listAddButton = document.getElementById("listAddButton");
const listItems = document.getElementById("listItems");
const advancedEditor = document.getElementById("advancedEditor");
const advancedRules = document.getElementById("advancedRules") as HTMLTextAreaElement | null;
const advancedSave = document.getElementById("advancedSave");
const interventionList = document.getElementById("interventionList");
const interventionModal = document.getElementById("interventionModal");
const interventionTitle = document.getElementById("interventionTitle");
const interventionHint = document.getElementById("interventionHint");
const interventionText = document.getElementById("interventionText") as HTMLInputElement | null;
const interventionDuration = document.getElementById(
  "interventionDuration"
) as HTMLSelectElement | null;
const interventionTechnique = document.getElementById(
  "interventionTechnique"
) as HTMLSelectElement | null;
const interventionPausable = document.getElementById(
  "interventionPausable"
) as HTMLInputElement | null;
const interventionSave = document.getElementById("interventionSave");
const interventionClose = document.getElementById("interventionClose");
const durationRow = document.getElementById("durationRow");
const techniqueRow = document.getElementById("techniqueRow");
const pausableRow = document.getElementById("pausableRow");
const PAUSE_TYPES = ["1h", "eod", "manual"] as const;
type PauseType = (typeof PAUSE_TYPES)[number];

const isPauseType = (value: string | undefined | null): value is PauseType => {
  return Boolean(value) && PAUSE_TYPES.includes(value as PauseType);
};

let currentPauseType: PauseType | null = null;
let currentPauseUntil: number | null = null;
let currentIsPaused = false;
let currentFocusEnabled = false;
let currentListType: "blocked" | "allowed" | "advanced" = "blocked";
let currentEntryType: "domain" | "keyword" = "domain";
let currentInterventionKey: InterventionKey | null = null;
let currentStatsRange: "today" | "week" | "month" = "today";
let currentStatsFilter: "all" | "blocked" = "all";
let currentScheduleId: string | null = null;
let currentStrictMinutes = 10;
let currentStrictActive = false;
let currentStrictEndsAt: number | null = null;
let currentPomodoro: Awaited<ReturnType<typeof getState>>["pomodoro"] | null = null;
let pomodoroTicker: number | null = null;

// --- Rendering helpers (update UI from state) ---
const formatUntil = (until: number) => {
  const date = new Date(until);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const formatCountdown = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

const setInputValue = (input: HTMLInputElement | null, value: number) => {
  if (!input) {
    return;
  }
  if (document.activeElement === input) {
    return;
  }
  input.value = String(value);
};

const renderFocus = (
  focusEnabled: boolean,
  isPaused: boolean,
  pauseType: PauseType | null,
  pauseEndAt: number | null,
  strictActive: boolean,
  strictEndsAt: number | null
) => {
  const now = Date.now();
  const pauseActive =
    isPaused && (pauseType === "manual" || (typeof pauseEndAt === "number" && pauseEndAt > now));
  const effectiveEnabled = strictActive ? true : focusEnabled && !pauseActive;

  currentFocusEnabled = focusEnabled;
  currentIsPaused = strictActive ? false : pauseActive;
  currentPauseType = pauseType;
  currentPauseUntil = typeof pauseEndAt === "number" ? pauseEndAt : null;

  if (toggleEl) {
    toggleEl.checked = effectiveEnabled;
    toggleEl.disabled = strictActive || (pauseActive && focusEnabled);
  }
  if (statusEl) {
    if (strictActive) {
      statusEl.textContent =
        typeof strictEndsAt === "number"
          ? `Strict session active until ${formatUntil(strictEndsAt)}.`
          : "Strict session active.";
    } else if (pauseActive && focusEnabled) {
      const label =
        pauseType === "manual"
          ? "Focus enabled, paused until you resume."
          : `Focus enabled, paused until ${formatUntil(pauseEndAt ?? now)}.`;
      statusEl.textContent = label;
    } else {
      statusEl.textContent = focusEnabled ? "Focus is on." : "Focus is off.";
    }
  }

  tempOffButtons.forEach((button) => {
    const selected = pauseActive && pauseType === (button.dataset.tempOff ?? null);
    button.classList.toggle("active", selected);
    button.disabled = strictActive;
  });
};

const renderStrictSession = (strictSession: { active: boolean; endsAt?: number }) => {
  currentStrictActive = strictSession.active;
  currentStrictEndsAt = typeof strictSession.endsAt === "number" ? strictSession.endsAt : null;
  if (strictStatus) {
    strictStatus.textContent = strictSession.active
      ? `Running until ${formatUntil(currentStrictEndsAt ?? Date.now())}`
      : "No strict session running.";
  }
  strictDurationButtons.forEach((button) => {
    const value = Number(button.dataset.strictMin ?? "0");
    button.classList.toggle("active", value === currentStrictMinutes);
    button.disabled = strictSession.active;
  });
  if (strictStart) {
    strictStart.disabled = strictSession.active;
  }
  if (strictConfirmText) {
    strictConfirmText.textContent = strictSession.active
      ? "Strict session is already running."
      : `You won’t be able to turn Focus off for ${currentStrictMinutes} minutes.`;
  }
};

const renderPomodoro = (
  pomodoro: Awaited<ReturnType<typeof getState>>["pomodoro"],
  strictActive: boolean
) => {
  currentPomodoro = pomodoro;
  setInputValue(pomodoroWork, pomodoro.workMin);
  setInputValue(pomodoroBreak, pomodoro.breakMin);
  setInputValue(pomodoroCycles, pomodoro.cycles);
  if (pomodoroAutoBlock) {
    pomodoroAutoBlock.checked = pomodoro.autoBlockDuringWork;
  }
  if (pomodoroBlockBreak) {
    pomodoroBlockBreak.checked = pomodoro.blockDuringBreak;
  }

  const running = pomodoro.running;
  const isRunning = Boolean(running);
  const isPaused = Boolean(running?.paused);
  if (pomodoroStart) {
    pomodoroStart.disabled = strictActive || isRunning;
  }
  if (pomodoroPause) {
    pomodoroPause.disabled = strictActive || !isRunning;
    pomodoroPause.setAttribute("aria-label", isPaused ? "Resume" : "Pause");
  }
  if (pomodoroStop) {
    pomodoroStop.disabled = !isRunning;
  }

  if (!running || !pomodoroStatus || !pomodoroProgress) {
    if (pomodoroStatus) {
      pomodoroStatus.textContent = "Ready for your next session.";
    }
    if (pomodoroProgress) {
      pomodoroProgress.style.width = "0%";
    }
    return;
  }

  const phaseLabel = running.phase === "work" ? "Work" : "Break";
  const totalMs =
    (running.phase === "work" ? pomodoro.workMin : pomodoro.breakMin) * 60 * 1000;
  const remaining = running.paused
    ? running.remainingMs ?? totalMs
    : Math.max(0, running.endsAt - Date.now());
  const progress = totalMs > 0 ? Math.min(1, Math.max(0, 1 - remaining / totalMs)) : 0;
  pomodoroProgress.style.width = `${Math.round(progress * 100)}%`;
  const cycleLabel =
    pomodoro.cycles > 0 ? ` · Cycle ${Math.min(running.cycleIndex + 1, pomodoro.cycles)}/${pomodoro.cycles}` : "";
  const statusPrefix = running.paused ? `${phaseLabel} paused` : phaseLabel;
  pomodoroStatus.textContent = `${statusPrefix} · ${formatCountdown(remaining)}${cycleLabel}`;
};

const renderTheme = (theme: "dark" | "light" | "system") => {
  const nextTheme = theme === "system" ? getSystemTheme() : theme;
  rootEl.setAttribute("data-theme", nextTheme);
  appRoot?.setAttribute("data-theme", nextTheme);

  const buttons = themeControl?.querySelectorAll<HTMLButtonElement>("button") ?? [];
  buttons.forEach((button) => {
    const isActive = button.dataset.theme === theme;
    button.classList.toggle("active", isActive);
  });
};

const formatDuration = (ms: number) => {
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const getRangeKeys = (range: "today" | "week" | "month") => {
  const days = range === "today" ? 1 : range === "week" ? 7 : 30;
  const keys: string[] = [];
  const today = new Date();
  for (let i = 0; i < days; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    keys.push(`${year}-${month}-${day}`);
  }
  return keys;
};

const renderStats = (analytics: Awaited<ReturnType<typeof getState>>["analytics"]) => {
  statsRangeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.range === currentStatsRange);
  });
  statsFilterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === currentStatsFilter);
  });

  const keys = getRangeKeys(currentStatsRange);
  let totalMs = 0;
  let blockedMs = 0;
  const byDomain: Record<string, number> = {};
  const byDomainBlocked: Record<string, number> = {};

  keys.forEach((key) => {
    const day = analytics.byDay[key];
    if (!day) {
      return;
    }
    totalMs += day.totalMs ?? 0;
    blockedMs += day.blockedMs ?? 0;
    Object.entries(day.byDomain ?? {}).forEach(([host, value]) => {
      byDomain[host] = (byDomain[host] ?? 0) + value;
    });
    Object.entries(day.byDomainBlocked ?? {}).forEach(([host, value]) => {
      byDomainBlocked[host] = (byDomainBlocked[host] ?? 0) + value;
    });
  });

  const listSource = currentStatsFilter === "blocked" ? byDomainBlocked : byDomain;
  const listTotal = currentStatsFilter === "blocked" ? blockedMs : totalMs;

  if (statsTotalValue) {
    statsTotalValue.textContent = formatDuration(listTotal);
  }

  if (!statsList) {
    return;
  }

  const entries = Object.entries(listSource).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (!entries.length) {
    statsList.innerHTML = `<p style="color: var(--color-muted); font-size: var(--font-small);">No data yet.</p>`;
    return;
  }
  const left = entries.slice(0, 4);
  const right = entries.slice(4, 8);
  const renderEntry = ([host, value]: [string, number]) => {
    const percent = listTotal ? Math.round((value / listTotal) * 100) : 0;
    const minutes = Math.max(1, Math.round(value / 60000));
    return `
      <div class="list-item">
        <div class="stats-item">
          <div class="stats-label">
            <span class="stats-pill">${minutes}m</span>
            <span class="stats-domain" data-host="${host}">${host}</span>
          </div>
          <div class="stats-bar fixed"><span style="width: ${percent}%;"></span></div>
        </div>
      </div>
    `;
  };
  statsList.innerHTML = `
    <div class="stats-grid">
      <div class="stats-column">
        ${left.map(renderEntry).join("")}
      </div>
      <div class="stats-column">
        ${right.map(renderEntry).join("")}
      </div>
    </div>
  `;

  if (statsStacked) {
    const rows = keys
      .map((key) => {
        const day = analytics.byDay[key];
        if (!day) {
          return { key, focus: 0, blocked: 0 };
        }
        const blocked = day.blockedMs ?? 0;
        const total = day.totalMs ?? 0;
        return { key, blocked, focus: Math.max(0, total - blocked) };
      })
      .reverse();

    const todayRows = getRangeKeys("today")
      .map((key) => {
        const day = analytics.byDay[key];
        if (!day) {
          return { key, focus: 0, blocked: 0 };
        }
        const blocked = day.blockedMs ?? 0;
        const total = day.totalMs ?? 0;
        return { key, blocked, focus: Math.max(0, total - blocked) };
      })
      .reverse();
    statsStacked.innerHTML = todayRows
      .map((row) => {
        const total = row.focus + row.blocked;
        let focusPct = total ? Math.round((row.focus / total) * 100) : 0;
        let blockedPct = total ? Math.round((row.blocked / total) * 100) : 0;
        if (blockedPct > 0 && blockedPct < 4) {
          blockedPct = 4;
          focusPct = Math.max(0, 100 - blockedPct);
        }
        return `
          <div class="stacked-row">
            <div class="row" style="gap: 8px;">
              <span>${row.key}</span>
              <span class="list-sub">${formatDuration(total)}</span>
            </div>
            <div class="stacked-bars">
              <div class="focus" style="width: ${focusPct}%;"></div>
              <div class="blocked" style="width: ${blockedPct}%;"></div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  if (statsHeatmap) {
    const hourTotals = new Array(24).fill(0);
    const hourBlocked = new Array(24).fill(0);
    keys.forEach((key) => {
      const day = analytics.byDay[key];
      if (!day) {
        return;
      }
      Object.entries(day.byHourMs ?? {}).forEach(([hour, value]) => {
        hourTotals[Number(hour)] += value;
      });
      Object.entries(day.byHourBlockedMs ?? {}).forEach(([hour, value]) => {
        hourBlocked[Number(hour)] += value;
      });
    });

    const maxHour = Math.max(...hourTotals, 1);
    statsHeatmap.innerHTML = hourTotals
      .map((value, hour) => {
        const intensity = value / maxHour;
        const blocked = hourBlocked[hour];
        const blockedRatio = value ? blocked / value : 0;
        const base = 0.2 + intensity * 0.7;
        const red = Math.round(255 * blockedRatio);
        const green = Math.round(156 * (1 - blockedRatio));
        return `
          <div class="heat-cell" style="background: rgba(${red}, ${green}, 90, ${base});">
            ${hour}
          </div>
        `;
      })
      .join("");
  }
};

const renderSchedules = (schedule: Awaited<ReturnType<typeof getState>>["schedule"]) => {
  if (!scheduleList) {
    return;
  }
  if (schedule.entries.length === 0) {
    scheduleList.innerHTML = `<p style="color: var(--color-muted); font-size: var(--font-small);">No schedules yet.</p>`;
    return;
  }
  scheduleList.innerHTML = schedule.entries
    .map((entry) => {
      const days = entry.days
        .map((day) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day])
        .join(", ");
      const start = `${Math.floor(entry.startMin / 60)
        .toString()
        .padStart(2, "0")}:${String(entry.startMin % 60).padStart(2, "0")}`;
      const end = `${Math.floor(entry.endMin / 60)
        .toString()
        .padStart(2, "0")}:${String(entry.endMin % 60).padStart(2, "0")}`;
      return `
        <div class="list-item">
          <div>
            <div class="list-title">${entry.name}</div>
            <div class="list-sub">${days} · ${start}–${end}</div>
          </div>
          <div class="row" style="gap: 8px;">
            <label class="toggle small">
              <input type="checkbox" data-toggle-schedule="${entry.id}" ${
                entry.enabled ? "checked" : ""
              } />
              <span></span>
            </label>
            <button class="icon-btn icon-only" type="button" data-edit-schedule="${entry.id}" aria-label="Edit schedule">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="M16.862 3.487a2.25 2.25 0 013.182 3.182L8.25 18.463l-4.5 1.125 1.125-4.5 11.987-11.601zM19.5 6.75l-2.25-2.25" />
              </svg>
            </button>
            <button class="icon-btn icon-only" type="button" data-delete-schedule="${entry.id}" aria-label="Delete schedule">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="M9.75 3a.75.75 0 00-.75.75V4.5H5.25a.75.75 0 000 1.5h.75l.624 12.06A2.25 2.25 0 008.87 20.25h6.26a2.25 2.25 0 002.246-2.19L18 6h.75a.75.75 0 000-1.5H15v-.75A.75.75 0 0014.25 3h-4.5zM9 8.25a.75.75 0 011.5 0v8.25a.75.75 0 01-1.5 0V8.25zm4.5 0a.75.75 0 011.5 0v8.25a.75.75 0 01-1.5 0V8.25zM10.5 4.5h3v.75h-3V4.5z" />
              </svg>
            </button>
          </div>
        </div>
      `;
    })
    .join("");
};

const openScheduleModal = (
  entry?: Awaited<ReturnType<typeof getState>>["schedule"]["entries"][number]
) => {
  currentScheduleId = entry?.id ?? null;
  if (scheduleTitle) {
    scheduleTitle.textContent = entry ? "Edit schedule" : "New schedule";
  }
  if (scheduleName) {
    scheduleName.value = entry?.name ?? "";
  }
  if (scheduleStart) {
    const start = entry?.startMin ?? 9 * 60;
    scheduleStart.value = `${String(Math.floor(start / 60)).padStart(2, "0")}:${String(
      start % 60
    ).padStart(2, "0")}`;
  }
  if (scheduleEnd) {
    const end = entry?.endMin ?? 17 * 60;
    scheduleEnd.value = `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(
      2,
      "0"
    )}`;
  }
  const selectedDays = new Set(entry?.days ?? [1, 2, 3, 4, 5]);
  scheduleDays?.querySelectorAll<HTMLButtonElement>("[data-day]").forEach((button) => {
    const day = Number(button.dataset.day);
    button.classList.toggle("active", selectedDays.has(day));
  });
  openModal("schedule");
};

const renderOverlayMode = (overlayMode: boolean) => {
  if (overlayToggle) {
    overlayToggle.checked = overlayMode;
  }
  if (overlayLabel) {
    overlayLabel.textContent = overlayMode ? "Overlay" : "Redirect";
  }
};

// --- Lists rendering (build list UI from storage) ---
const getListKey = () => {
  if (currentListType === "blocked") {
    return currentEntryType === "domain" ? "blockedDomains" : "blockedKeywords";
  }
  if (currentListType === "allowed") {
    return currentEntryType === "domain" ? "allowedDomains" : "allowedKeywords";
  }
  return "advancedRulesText";
};

const renderLists = (lists: Awaited<ReturnType<typeof getState>>["lists"]) => {
  const isAdvanced = currentListType === "advanced";
  entryTypeRow?.classList.toggle("hidden", isAdvanced);
  listEditor?.classList.toggle("hidden", isAdvanced);
  advancedEditor?.classList.toggle("hidden", !isAdvanced);

  listTypeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.list === currentListType);
  });
  entryTypeButtons.forEach((button) => {
    const disabled = button.hasAttribute("disabled");
    if (!disabled) {
      button.classList.toggle("active", button.dataset.entry === currentEntryType);
    }
  });

  if (advancedRules) {
    advancedRules.value = lists.advancedRulesText ?? "";
  }

  if (!listItems) {
    return;
  }

  if (isAdvanced) {
    listItems.innerHTML = "";
    return;
  }

  const key = getListKey();
  const items = lists[key as "blockedDomains" | "blockedKeywords" | "allowedDomains" | "allowedKeywords"];

  listItems.innerHTML = items.length
    ? items
        .map(
          (value) =>
            `<div class=\"list-item\"><span>${value}</span><button data-value=\"${value}\">Remove</button></div>`
        )
        .join("")
    : `<p style=\"color: var(--color-muted); font-size: var(--font-small);\">No entries yet.</p>`;
};

const renderInterventions = (
  interventions: Awaited<ReturnType<typeof getState>>["interventions"]
) => {
  if (!interventionList) {
    return;
  }

  interventionList.innerHTML = INTERVENTION_DEFS.map((item) => {
    const enabled = interventions.enabled[item.key];
    return `
      <div class="list-item" data-intervention="${item.key}">
        <div>
          <div class="list-title">${item.label}</div>
          <div class="list-sub">${item.description}</div>
        </div>
        <div class="row" style="gap: 8px;">
          <label class="toggle small">
            <input type="checkbox" data-toggle="${item.key}" ${enabled ? "checked" : ""} />
            <span></span>
          </label>
          <button class="btn btn-small" data-config="${item.key}">Configure</button>
        </div>
      </div>
    `;
  }).join("");
};

// --- Modal helpers (shared) ---
const openModal = (id: string) => {
  const modal = document.querySelector<HTMLElement>(`[data-modal="${id}"]`);
  if (!modal) {
    return;
  }
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
};

const closeModal = (id: string) => {
  const modal = document.querySelector<HTMLElement>(`[data-modal="${id}"]`);
  if (!modal) {
    return;
  }
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  const anyOpen = document.querySelector(".modal:not(.hidden)");
  if (!anyOpen) {
    document.body.classList.remove("modal-open");
  }
};

const showInterventionDetail = (
  key: InterventionKey,
  interventions: Awaited<ReturnType<typeof getState>>["interventions"]
) => {
  const def = INTERVENTION_DEFS.find((item) => item.key === key);
  if (!def || !interventionModal) {
    return;
  }
  currentInterventionKey = key;
  if (interventionTitle) {
    interventionTitle.textContent = def.label;
  }
  if (interventionHint) {
    interventionHint.textContent = def.description;
  }

  const config = interventions.configs[key];
  if (interventionText) {
    interventionText.value = config.text ?? "";
  }

  const showDuration = Boolean(def.durationOptions?.length);
  durationRow?.classList.toggle("hidden", !showDuration);
  if (showDuration && interventionDuration && def.durationOptions) {
    interventionDuration.innerHTML = def.durationOptions
      .map((value) => `<option value="${value}">${value}s</option>`)
      .join("");
    const durationSec = "durationSec" in config ? config.durationSec : def.durationOptions[0];
    interventionDuration.value = String(durationSec ?? def.durationOptions[0] ?? 8);
  }

  const showBreathing = Boolean(def.usesBreathing);
  techniqueRow?.classList.toggle("hidden", !showBreathing);
  if (showBreathing && interventionTechnique) {
    interventionTechnique.innerHTML = BREATHING_TECHNIQUES.map(
      (item) => `<option value="${item.value}">${item.label}</option>`
    ).join("");
    const technique = "technique" in config ? config.technique : BREATHING_TECHNIQUES[0].value;
    interventionTechnique.value = technique ?? BREATHING_TECHNIQUES[0].value;
  }

  const showPausable = Boolean(def.usesPausable);
  pausableRow?.classList.toggle("hidden", !showPausable);
  if (showPausable && interventionPausable) {
    interventionPausable.checked = "pausable" in config ? Boolean(config.pausable) : false;
  }

  openModal("intervention");
};

const hideInterventionDetail = () => {
  currentInterventionKey = null;
  closeModal("intervention");
};

// --- Navigation (show one view at a time) ---
const setActiveView = (viewId: string) => {
  views.forEach((view) => {
    view.classList.toggle("hidden", view.dataset.view !== viewId);
  });

  navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.target === viewId);
  });

  const active = navButtons.find((button) => button.dataset.target === viewId);
  const index = active?.dataset.i ?? "0";
  navBar?.style.setProperty("--i", index);
};

// --- Theme utilities (sync with OS setting) ---
const getSystemTheme = (): "dark" | "light" => {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const watchSystemTheme = (callback: (theme: "dark" | "light") => void) => {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => callback(getSystemTheme());
  media.addEventListener("change", handler);
  return () => media.removeEventListener("change", handler);
};

// --- Event wiring (connect UI to storage) ---
const bindEvents = () => {
  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.target ?? "home";
      setActiveView(target);
    });
  });

  toggleEl?.addEventListener("change", async () => {
    if (currentStrictActive) {
      if (toggleEl) {
        toggleEl.checked = true;
      }
      return;
    }
    const next = toggleEl.checked;
    await setState({
      focusEnabled: next,
      pause: { isPaused: false, pauseType: null, pauseEndAt: null }
    });
  });

  overlayToggle?.addEventListener("change", async () => {
    await setState({ overlayMode: overlayToggle.checked });
  });

  tempOffButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      if (currentStrictActive) {
        return;
      }
      const kind = button.dataset.tempOff;
      if (!isPauseType(kind)) {
        return;
      }
      const now = Date.now();
      if (currentIsPaused && currentPauseType === kind) {
        await setState({ pause: { isPaused: false, pauseType: null, pauseEndAt: null } });
        return;
      }
      if (kind === "1h") {
        await setState({
          focusEnabled: true,
          pause: { isPaused: true, pauseType: "1h", pauseEndAt: now + 60 * 1000 }
        });
      } else if (kind === "eod") {
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        await setState({
          focusEnabled: true,
          pause: { isPaused: true, pauseType: "eod", pauseEndAt: end.getTime() }
        });
      } else if (kind === "manual") {
        await setState({
          focusEnabled: true,
          pause: { isPaused: true, pauseType: "manual", pauseEndAt: null }
        });
      }
    });
  });

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const readPomodoroConfig = () => {
    const work = clamp(Number(pomodoroWork?.value ?? 25), 1, 120);
    const rest = clamp(Number(pomodoroBreak?.value ?? 5), 1, 60);
    const cycles = clamp(Number(pomodoroCycles?.value ?? 0), 0, 12);
    const autoBlock = Boolean(pomodoroAutoBlock?.checked);
    const blockBreak = Boolean(pomodoroBlockBreak?.checked);
    return { work, rest, cycles, autoBlock, blockBreak };
  };

  pomodoroStart?.addEventListener("click", async () => {
    if (currentStrictActive) {
      return;
    }
    const config = readPomodoroConfig();
    const now = Date.now();
    const endsAt = now + config.work * 60 * 1000;
    await setState({
      focusEnabled: config.autoBlock ? true : currentFocusEnabled,
      pomodoro: {
        workMin: config.work,
        breakMin: config.rest,
        cycles: config.cycles,
        autoBlockDuringWork: config.autoBlock,
        blockDuringBreak: config.blockBreak,
        running: {
          phase: "work",
          startedAt: now,
          endsAt,
          cycleIndex: 0,
          paused: false
        }
      }
    });
  });

  pomodoroPause?.addEventListener("click", async () => {
    const state = await getState();
    const running = state.pomodoro.running;
    if (!running) {
      return;
    }
    if (running.paused) {
      const remaining = running.remainingMs ?? 0;
      const endsAt = Date.now() + remaining;
      await setState({
        pomodoro: {
          running: { ...running, paused: false, endsAt, remainingMs: undefined }
        }
      });
      return;
    }
    const remaining = Math.max(0, running.endsAt - Date.now());
    await setState({
      pomodoro: {
        running: { ...running, paused: true, remainingMs: remaining }
      }
    });
  });

  pomodoroStop?.addEventListener("click", async () => {
    await setState({ pomodoro: { running: null } });
  });

  pomodoroAutoBlock?.addEventListener("change", async () => {
    await setState({ pomodoro: { autoBlockDuringWork: pomodoroAutoBlock.checked } });
  });

  pomodoroBlockBreak?.addEventListener("change", async () => {
    await setState({ pomodoro: { blockDuringBreak: pomodoroBlockBreak.checked } });
  });

  pomodoroWork?.addEventListener("change", async () => {
    const value = clamp(Number(pomodoroWork.value), 1, 120);
    pomodoroWork.value = String(value);
    await setState({ pomodoro: { workMin: value } });
  });

  pomodoroBreak?.addEventListener("change", async () => {
    const value = clamp(Number(pomodoroBreak.value), 1, 60);
    pomodoroBreak.value = String(value);
    await setState({ pomodoro: { breakMin: value } });
  });

  pomodoroCycles?.addEventListener("change", async () => {
    const value = clamp(Number(pomodoroCycles.value), 0, 12);
    pomodoroCycles.value = String(value);
    await setState({ pomodoro: { cycles: value } });
  });

  strictDurationButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (currentStrictActive) {
        return;
      }
      const minutes = Number(button.dataset.strictMin ?? "0");
      if (!minutes) {
        return;
      }
      currentStrictMinutes = minutes;
      strictDurationButtons.forEach((chip) => {
        chip.classList.toggle("active", chip === button);
      });
      if (strictConfirmText) {
        strictConfirmText.textContent = `You won’t be able to turn Focus off for ${minutes} minutes.`;
      }
    });
  });

  strictStart?.addEventListener("click", () => {
    if (currentStrictActive) {
      return;
    }
    openModal("strictConfirm");
  });

  strictConfirm?.addEventListener("click", async () => {
    if (currentStrictActive) {
      return;
    }
    const endsAt = Date.now() + currentStrictMinutes * 60 * 1000;
    await setState({
      focusEnabled: true,
      pause: { isPaused: false, pauseType: null, pauseEndAt: null },
      strictSession: { active: true, endsAt }
    });
    closeModal("strictConfirm");
  });

  listTypeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.list as "blocked" | "allowed" | "advanced" | undefined;
      if (!type) {
        return;
      }
      currentListType = type;
      void getState().then((state) => renderLists(state.lists));
    });
  });

  entryTypeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.entry as "domain" | "keyword" | undefined;
      if (!type || button.hasAttribute("disabled")) {
        return;
      }
      currentEntryType = type;
      void getState().then((state) => renderLists(state.lists));
    });
  });

  listAddButton?.addEventListener("click", async () => {
    let value = listInput?.value.trim();
    if (!value) {
      return;
    }
    if (currentEntryType === "domain") {
      value = value
        .replace(/^https?:\/\//i, "")
        .replace(/^www\./i, "")
        .split("/")[0]
        .trim();
      if (!value) {
        return;
      }
    }
    const state = await getState();
    const key = getListKey();
    const list = [...state.lists[key as keyof typeof state.lists]] as string[];
    if (list.includes(value)) {
      return;
    }
    list.push(value);
    if (listInput) {
      listInput.value = "";
    }
    await setState({ lists: { [key]: list } });
  });

  listItems?.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;
    const button = target.closest("button");
    const value = button?.getAttribute("data-value");
    if (!value) {
      return;
    }
    const state = await getState();
    const key = getListKey();
    const list = [...state.lists[key as keyof typeof state.lists]] as string[];
    const next = list.filter((entry) => entry !== value);
    await setState({ lists: { [key]: next } });
  });

  scheduleAdd?.addEventListener("click", async () => {
    openScheduleModal();
  });

  scheduleList?.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;
    const editButton = target.closest<HTMLButtonElement>("[data-edit-schedule]");
    if (editButton) {
      const id = editButton.getAttribute("data-edit-schedule");
      if (!id) {
        return;
      }
      const state = await getState();
      const entry = state.schedule.entries.find((item) => item.id === id);
      if (entry) {
        openScheduleModal(entry);
      }
      return;
    }
    const deleteButton = target.closest<HTMLButtonElement>("[data-delete-schedule]");
    if (!deleteButton) {
      return;
    }
    const id = deleteButton.getAttribute("data-delete-schedule");
    if (!id) {
      return;
    }
    const state = await getState();
    const entries = state.schedule.entries.filter((item) => item.id !== id);
    await setState({ schedule: { entries } });
  });

  scheduleList?.addEventListener("change", async (event) => {
    const target = event.target as HTMLElement;
    const input = target.closest<HTMLInputElement>("input[data-toggle-schedule]");
    if (!input) {
      return;
    }
    const id = input.dataset.toggleSchedule;
    if (!id) {
      return;
    }
    const state = await getState();
    const entries = state.schedule.entries.map((item) =>
      item.id === id ? { ...item, enabled: input.checked } : item
    );
    await setState({ schedule: { entries } });
  });

  scheduleDays?.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>("[data-day]");
    if (!button) {
      return;
    }
    button.classList.toggle("active");
  });

  scheduleSave?.addEventListener("click", async () => {
    const name = scheduleName?.value.trim() ?? "";
    const start = scheduleStart?.value ?? "09:00";
    const end = scheduleEnd?.value ?? "17:00";
    const parseTime = (value: string) => {
      const [h, m] = value.split(":").map(Number);
      return h * 60 + m;
    };
    const selectedDays = Array.from(
      scheduleDays?.querySelectorAll<HTMLButtonElement>("[data-day].active") ?? []
    ).map((button) => Number(button.dataset.day));
    if (!name || selectedDays.length === 0) {
      return;
    }
    const entry = {
      id: currentScheduleId ?? crypto.randomUUID(),
      name,
      startMin: parseTime(start),
      endMin: parseTime(end),
      days: selectedDays as Array<0 | 1 | 2 | 3 | 4 | 5 | 6>,
      enabled: true
    };
    const state = await getState();
    const entries = currentScheduleId
      ? state.schedule.entries.map((item) => (item.id === currentScheduleId ? entry : item))
      : [...state.schedule.entries, entry];
    await setState({ schedule: { entries } });
    closeModal("schedule");
  });

  statsList?.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;
    const domain = target.closest(".stats-domain");
    if (!domain) {
      return;
    }
    const host = domain.getAttribute("data-host");
    if (!host) {
      return;
    }
    const state = await getState();
    const sumFor = (keys: string[]) =>
      keys.reduce((acc, key) => acc + (state.analytics.byDay[key]?.byDomain?.[host] ?? 0), 0);
    const totals = [
      { label: "Today", value: sumFor(getRangeKeys("today")) },
      { label: "Week", value: sumFor(getRangeKeys("week")) },
      { label: "Month", value: sumFor(getRangeKeys("month")) }
    ];
    const max = Math.max(...totals.map((item) => item.value), 1);
    if (domainStatsTitle) {
      domainStatsTitle.textContent = host;
    }
    if (domainStatsBody) {
      domainStatsBody.innerHTML = totals
        .map((item) => {
          const pct = Math.round((item.value / max) * 100);
          return `
            <div class="stats-item" style="margin-bottom: 10px;">
              <div class="row" style="gap: 8px;">
                <span class="stats-pill">${item.label}</span>
                <span class="list-sub">${formatDuration(item.value)}</span>
              </div>
              <div class="stats-bar fixed"><span style="width: ${pct}%;"></span></div>
            </div>
          `;
        })
        .join("");
    }
    openModal("domainStats");
  });

  statsRangeButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const range = button.dataset.range as "today" | "week" | "month" | undefined;
      if (!range) {
        return;
      }
      currentStatsRange = range;
      await setState({ analytics: { chartRange: range } });
      const state = await getState();
      renderStats(state.analytics);
    });
  });

  statsFilterButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const filter = button.dataset.filter as "all" | "blocked" | undefined;
      if (!filter) {
        return;
      }
      currentStatsFilter = filter;
      await setState({ analytics: { chartFilter: filter } });
      const state = await getState();
      renderStats(state.analytics);
    });
  });

  interventionList?.addEventListener("change", async (event) => {
    const target = event.target as HTMLInputElement;
    const key = target.dataset.toggle as InterventionKey | undefined;
    if (!key) {
      return;
    }
    await setState({ interventions: { enabled: { [key]: target.checked } } });
  });

  interventionList?.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;
    const button = target.closest("button");
    const key = button?.getAttribute("data-config") as InterventionKey | null;
    if (!key) {
      return;
    }
    const state = await getState();
    showInterventionDetail(key, state.interventions);
  });

  interventionClose?.addEventListener("click", () => hideInterventionDetail());

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const openId = target.closest("[data-open-modal]")?.getAttribute("data-open-modal");
    if (openId) {
      openModal(openId);
      return;
    }
    const closeTarget = target.closest("[data-close-modal]");
    if (closeTarget) {
      const modal = target.closest(".modal");
      const modalId = modal?.getAttribute("data-modal");
      if (modalId) {
        closeModal(modalId);
      }
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const modal = document.querySelector(".modal:not(.hidden)");
      const modalId = modal?.getAttribute("data-modal");
      if (modalId) {
        closeModal(modalId);
      }
    }
  });

  interventionSave?.addEventListener("click", async () => {
    if (!currentInterventionKey) {
      return;
    }
    const def = INTERVENTION_DEFS.find((item) => item.key === currentInterventionKey);
    if (!def) {
      return;
    }
    const updates: Record<string, unknown> = {
      text: interventionText?.value ?? ""
    };
    if (def.durationOptions && interventionDuration) {
      updates.durationSec = Number(interventionDuration.value);
    }
    if (def.usesBreathing && interventionTechnique) {
      updates.technique = interventionTechnique.value;
    }
    if (def.usesPausable && interventionPausable) {
      updates.pausable = interventionPausable.checked;
    }
    await setState({ interventions: { configs: { [currentInterventionKey]: updates } } });
    hideInterventionDetail();
  });

  advancedSave?.addEventListener("click", async () => {
    const text = advancedRules?.value ?? "";
    await setState({ lists: { advancedRulesText: text } });
  });

  themeControl?.addEventListener("click", async (event) => {
    const button = (event.target as HTMLElement).closest("button");
    const theme = button?.dataset.theme as "dark" | "light" | "system" | undefined;
    if (!theme) {
      return;
    }
    await setState({ ui: { theme } });
    renderTheme(theme);
  });
};

// --- Bootstrap (initial load + subscriptions) ---
const bootstrap = async () => {
  const state = await getState();
  renderFocus(
    state.focusEnabled,
    state.pause.isPaused,
    state.pause.pauseType,
    state.pause.pauseEndAt,
    state.strictSession.active,
    state.strictSession.endsAt ?? null
  );
  renderTheme(state.ui.theme);
  renderOverlayMode(state.overlayMode);
  currentStatsRange = state.analytics.chartRange;
  currentStatsFilter = state.analytics.chartFilter;
  renderStrictSession(state.strictSession);
  renderPomodoro(state.pomodoro, state.strictSession.active);
  setActiveView("home");
  renderLists(state.lists);
  renderInterventions(state.interventions);
  renderStats(state.analytics);
  renderSchedules(state.schedule);
  bindEvents();
  if (pomodoroTicker) {
    window.clearInterval(pomodoroTicker);
  }
  pomodoroTicker = window.setInterval(() => {
    if (currentPomodoro) {
      renderPomodoro(currentPomodoro, currentStrictActive);
    }
  }, 1000);

  subscribeState((nextState) => {
    renderFocus(
      nextState.focusEnabled,
      nextState.pause.isPaused,
      nextState.pause.pauseType,
      nextState.pause.pauseEndAt,
      nextState.strictSession.active,
      nextState.strictSession.endsAt ?? null
    );
    renderStrictSession(nextState.strictSession);
    renderLists(nextState.lists);
    renderInterventions(nextState.interventions);
    renderTheme(nextState.ui.theme);
    renderOverlayMode(nextState.overlayMode);
    renderStats(nextState.analytics);
    renderSchedules(nextState.schedule);
    renderPomodoro(nextState.pomodoro, nextState.strictSession.active);
  });

  watchSystemTheme(() => {
    void getState().then((nextState) => {
      if (nextState.ui.theme === "system") {
        renderTheme("system");
      }
    });
  });
};

void bootstrap();
