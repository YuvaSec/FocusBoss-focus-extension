import { getState, setState, subscribeState } from "../shared/storage.js";
import {
  BREATHING_TECHNIQUES,
  INTERVENTION_DEFS,
  type InterventionKey
} from "../shared/interventions.js";

// --- DOM references (grab once, reuse) ---
const statusPillText = document.getElementById("statusPillText");
const statusInfoTitle = document.getElementById("statusInfoTitle");
const statusInfoBody = document.getElementById("statusInfoBody");
const statusElements = Array.from(document.querySelectorAll<HTMLElement>(".status"));
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
const statsDonut = document.getElementById("statsDonut");
const statsLegend = document.getElementById("statsLegend");
const statsThemeButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("#statsTheme button")
);
const statsThemeControl = document.getElementById("statsTheme");
const statsCardTabs = document.getElementById("statsCardTabs");
const statsPanels = Array.from(
  document.querySelectorAll<HTMLElement>(".stats-panel")
);
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
const pomodoroTaskSelect = document.getElementById("pomodoroTaskSelect") as HTMLSelectElement | null;
const pomodoroTaskHint = document.getElementById("pomodoroTaskHint");
const strictStatus = document.getElementById("strictStatus");
const strictStart = document.getElementById("strictStart") as HTMLButtonElement | null;
const strictConfirm = document.getElementById("strictConfirm") as HTMLButtonElement | null;
const strictConfirmText = document.getElementById("strictConfirmText");
const strictDurationButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-strict-min]")
);
const strictOverlay = document.getElementById("strictOverlay");
const strictOverlayTime = document.getElementById("strictOverlayTime");
const strictOverlayClose = document.getElementById("strictOverlayClose");
const strictRing = document.getElementById("strictRing");
const strictOverlayHint = document.getElementById("strictOverlayHint");
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
const taskTitle = document.getElementById("taskTitle") as HTMLInputElement | null;
const taskEstimate = document.getElementById("taskEstimate") as HTMLInputElement | null;
const taskEstimateValue = document.getElementById("taskEstimateValue");
const taskAdd = document.getElementById("taskAdd") as HTMLButtonElement | null;
const taskList = document.getElementById("taskList");
const taskEmpty = document.getElementById("taskEmpty");
const taskSubtitle = document.getElementById("taskSubtitle");
const PAUSE_TYPES = ["1h", "eod", "manual"] as const;
type PauseType = (typeof PAUSE_TYPES)[number];

const isPauseType = (value: string | undefined | null): value is PauseType => {
  return Boolean(value) && PAUSE_TYPES.includes(value as PauseType);
};

const reportUiError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("FocusBoss UI error:", error);
  statusElements.forEach((el) => {
    el.dataset.status = "error";
  });
  if (statusPillText) {
    statusPillText.textContent = "Error";
  }
  currentStatusDetail = message;
  if (statusInfoTitle) {
    statusInfoTitle.textContent = "UI error";
  }
  if (statusInfoBody) {
    statusInfoBody.textContent = message;
  }
};

window.addEventListener("error", (event) => {
  reportUiError(event.error ?? event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  reportUiError(event.reason);
});

let currentPauseType: PauseType | null = null;
let currentPauseUntil: number | null = null;
let currentIsPaused = false;
let currentFocusEnabled = false;
let currentStatusDetail = "";
let currentListType: "blocked" | "allowed" | "advanced" = "blocked";
let currentEntryType: "domain" | "keyword" = "domain";
let currentInterventionKey: InterventionKey | null = null;
let currentStatsRange: "today" | "week" | "month" = "today";
let currentStatsFilter: "all" | "blocked" = "all";
let currentStatsTheme: "default" | "citrus" | "ocean" | "warm" = "default";
let currentStatsPanel: "usage" | "domains" = "usage";
let currentScheduleId: string | null = null;
let currentStrictMinutes = 10;
let currentStrictActive = false;
let currentStrictEndsAt: number | null = null;
let currentStrictStartedAt: number | null = null;
let strictOverlayDismissed = false;
let currentPomodoro: Awaited<ReturnType<typeof getState>>["pomodoro"] | null = null;
let pomodoroTicker: number | null = null;
let currentTasks: Awaited<ReturnType<typeof getState>>["tasks"] | null = null;
let selectedTaskId: string | null = null;
let lastTasksKey = "";
let lastTaskLinkKey = "";
let lastPomodoroAdvanceKey = "";
let lastPomodoroAdvanceAttemptAt = 0;

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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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
  strictEndsAt: number | null,
  pomodoro: Awaited<ReturnType<typeof getState>>["pomodoro"] | null
) => {
  const now = Date.now();
  const pauseActive =
    isPaused && (pauseType === "manual" || (typeof pauseEndAt === "number" && pauseEndAt > now));
  const effectiveEnabled = strictActive ? true : focusEnabled && !pauseActive;
  const running = pomodoro?.running ?? null;
  const timerControlsFocus = Boolean(
    running &&
      ((running.phase === "work" && pomodoro?.autoBlockDuringWork) ||
        (running.phase === "break" && pomodoro?.blockDuringBreak))
  );

  currentFocusEnabled = focusEnabled;
  currentIsPaused = strictActive ? false : pauseActive;
  currentPauseType = pauseType;
  currentPauseUntil = typeof pauseEndAt === "number" ? pauseEndAt : null;

  const setStatus = (
    status: "on" | "off" | "paused" | "strict" | "pomodoro",
    short: string,
    detail: string
  ) => {
    statusElements.forEach((el) => {
      el.dataset.status = status;
    });
    if (statusPillText) {
      statusPillText.textContent = short;
    }
    currentStatusDetail = detail;
    if (statusInfoTitle) {
      statusInfoTitle.textContent = short;
    }
    if (statusInfoBody) {
      statusInfoBody.textContent = detail;
    }
  };

  if (toggleEl) {
    toggleEl.checked = effectiveEnabled;
    toggleEl.disabled = strictActive || timerControlsFocus || (pauseActive && focusEnabled);
  }
  if (strictActive) {
    const untilLabel =
      typeof strictEndsAt === "number" ? `Strict until ${formatUntil(strictEndsAt)}` : "Strict active";
    setStatus("strict", "Strict", `${untilLabel} · Focus is locked until the strict timer ends.`);
  } else if (timerControlsFocus) {
    setStatus(
      "pomodoro",
      "Pomodoro",
      "Pomodoro controls focus. Pause or stop the timer to change focus."
    );
  } else if (pauseActive && focusEnabled) {
    const untilLabel =
      pauseType === "manual"
        ? "Paused (manual)"
        : `Paused until ${formatUntil(pauseEndAt ?? now)}`;
    setStatus("paused", "Paused", `${untilLabel} · Focus will resume automatically.`);
  } else {
    setStatus(
      focusEnabled ? "on" : "off",
      focusEnabled ? "Focus on" : "Focus off",
      focusEnabled ? "Focus is on. Blocking is active." : "Focus is off. Blocking is inactive."
    );
  }

  tempOffButtons.forEach((button) => {
    const selected = pauseActive && pauseType === (button.dataset.tempOff ?? null);
    button.classList.toggle("active", selected);
    button.disabled = strictActive || timerControlsFocus;
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

const renderStrictOverlay = (
  strictSession: Awaited<ReturnType<typeof getState>>["strictSession"]
) => {
  if (!strictOverlay) {
    return;
  }
  if (!strictSession.active) {
    strictOverlayDismissed = false;
    strictOverlay.classList.add("hidden");
    strictOverlay.setAttribute("aria-hidden", "true");
    currentStrictStartedAt = null;
    return;
  }
  if (strictOverlayDismissed) {
    strictOverlay.classList.add("hidden");
    strictOverlay.setAttribute("aria-hidden", "true");
    return;
  }
  strictOverlay.classList.remove("hidden");
  strictOverlay.setAttribute("aria-hidden", "false");
  currentStrictStartedAt =
    typeof strictSession.startedAt === "number" ? strictSession.startedAt : currentStrictStartedAt;

  const now = Date.now();
  const endsAt = strictSession.endsAt ?? now;
  const startedAt =
    currentStrictStartedAt ?? Math.max(0, endsAt - currentStrictMinutes * 60 * 1000);
  const totalMs = Math.max(1, endsAt - startedAt);
  const remainingMs = Math.max(0, endsAt - now);
  if (strictOverlayTime) {
    strictOverlayTime.textContent = formatCountdown(remainingMs);
  }
  if (strictOverlayHint) {
    strictOverlayHint.textContent = currentStatusDetail || "Strict session in progress.";
  }
  if (strictRing) {
    const progress = 1 - remainingMs / totalMs;
    const circumference = 2 * Math.PI * 46;
    const offset = circumference * (1 - Math.min(1, Math.max(0, progress)));
    strictRing.setAttribute("stroke-dasharray", String(circumference));
    strictRing.setAttribute("stroke-dashoffset", String(offset));
  }
};

const renderPomodoro = (
  pomodoro: Awaited<ReturnType<typeof getState>>["pomodoro"],
  strictActive: boolean
) => {
  currentPomodoro = pomodoro;
  setInputValue(pomodoroWork, pomodoro.workMin);
  setInputValue(pomodoroBreak, pomodoro.breakMin);
  setInputValue(pomodoroCycles, clamp(pomodoro.cycles, 1, 12));
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
    if (currentTasks) {
      renderTaskLinker(currentTasks, pomodoro);
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
  if (currentTasks) {
    renderTaskLinker(currentTasks, pomodoro);
  }
};

const requestPomodoroAdvance = async () => {
  const state = await getState();
  const running = state.pomodoro.running;
  if (!running || running.paused || typeof running.endsAt !== "number") {
    return;
  }
  const now = Date.now();
  if (now < running.endsAt) {
    return;
  }
  const advanceKey = `${running.phase}:${running.endsAt}`;
  if (advanceKey === lastPomodoroAdvanceKey && now - lastPomodoroAdvanceAttemptAt < 1500) {
    return;
  }
  lastPomodoroAdvanceKey = advanceKey;
  lastPomodoroAdvanceAttemptAt = now;
  chrome.runtime.sendMessage({ type: "pomodoroTick" }, async () => {
    const nextState = await getState();
    renderPomodoro(nextState.pomodoro, nextState.strictSession.active);
  });
};

const getTaskLinkKey = (
  tasks: Awaited<ReturnType<typeof getState>>["tasks"],
  pomodoro: Awaited<ReturnType<typeof getState>>["pomodoro"]
) => {
  const activeTasks = tasks.items.filter((item) => !item.doneAt);
  const running = pomodoro.running;
  const activeKey = activeTasks.map((item) => `${item.id}:${item.title}`).join("|");
  const runKey = running
    ? `${running.phase}:${running.paused ? "p" : "r"}:${running.linkedTaskId ?? ""}`
    : "idle";
  return `${activeKey}::${runKey}::${selectedTaskId ?? ""}`;
};

const renderTaskLinker = (
  tasks: Awaited<ReturnType<typeof getState>>["tasks"],
  pomodoro: Awaited<ReturnType<typeof getState>>["pomodoro"]
) => {
  if (!pomodoroTaskSelect) {
    return;
  }
  const nextKey = getTaskLinkKey(tasks, pomodoro);
  if (nextKey === lastTaskLinkKey) {
    return;
  }
  lastTaskLinkKey = nextKey;

  const activeTasks = tasks.items.filter((item) => !item.doneAt);
  const runningLinkedId = pomodoro.running?.linkedTaskId ?? null;
  const linkedTask = runningLinkedId
    ? tasks.items.find((item) => item.id === runningLinkedId)
    : null;
  const hasRunning = Boolean(pomodoro.running);
  if (selectedTaskId && !activeTasks.some((item) => item.id === selectedTaskId)) {
    selectedTaskId = null;
  }
  const fallbackId = pomodoro.lastTaskId ?? null;
  const selectedId = hasRunning ? runningLinkedId : selectedTaskId ?? fallbackId;
  pomodoroTaskSelect.innerHTML = "";

  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = "No task";
  pomodoroTaskSelect.appendChild(emptyOption);

  if (runningLinkedId && !activeTasks.some((item) => item.id === runningLinkedId)) {
    const linkedOption = document.createElement("option");
    linkedOption.value = runningLinkedId;
    linkedOption.textContent = linkedTask ? `${linkedTask.title} (done)` : "Linked task";
    pomodoroTaskSelect.appendChild(linkedOption);
  }

  activeTasks.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.title;
    pomodoroTaskSelect.appendChild(option);
  });

  pomodoroTaskSelect.value = selectedId ?? "";
  if (!hasRunning) {
    selectedTaskId = selectedId ?? null;
  }
  pomodoroTaskSelect.disabled = hasRunning || activeTasks.length === 0;

  if (pomodoroTaskHint) {
    if (hasRunning) {
      const label = linkedTask ? `Linked to ${linkedTask.title}.` : "Running without a linked task.";
      pomodoroTaskHint.textContent = label;
    } else if (activeTasks.length === 0) {
      pomodoroTaskHint.textContent = "Add a task to link it to your session.";
    } else {
      pomodoroTaskHint.textContent = "Optional: link a task before starting.";
    }
  }
};

const getTasksKey = (tasks: Awaited<ReturnType<typeof getState>>["tasks"]) => {
  const itemsKey = tasks.items
    .map(
      (item) =>
        `${item.id}:${item.title}:${item.estimateMin}:${item.focusSessionsCompleted}:${item.doneAt ?? ""}`
    )
    .join("|");
  return `${tasks.activeLimit}::${itemsKey}`;
};

const renderTasks = (
  tasks: Awaited<ReturnType<typeof getState>>["tasks"],
  pomodoro: Awaited<ReturnType<typeof getState>>["pomodoro"]
) => {
  const nextKey = getTasksKey(tasks);
  if (nextKey === lastTasksKey) {
    renderTaskLinker(tasks, pomodoro);
    return;
  }
  lastTasksKey = nextKey;
  currentTasks = tasks;
  const estimateValue = Number(taskEstimate?.value || 30);
  setInputValue(taskEstimate, clamp(estimateValue, 15, 180));
  if (taskEstimateValue && taskEstimate) {
    taskEstimateValue.textContent = `${taskEstimate.value}m`;
  }
  const activeTasks = tasks.items.filter((item) => !item.doneAt);
  const activeCount = activeTasks.length;
  if (taskSubtitle) {
    taskSubtitle.textContent = `Active tasks: ${activeCount}/${tasks.activeLimit}.`;
  }
  const atLimit = activeCount >= tasks.activeLimit;
  if (taskAdd) {
    taskAdd.disabled = atLimit;
  }
  if (taskTitle) {
    taskTitle.disabled = atLimit;
  }
  if (taskEstimate) {
    taskEstimate.disabled = atLimit;
  }

  if (taskList) {
    taskList.innerHTML = "";
    tasks.items.forEach((item) => {
      const row = document.createElement("div");
      row.className = `list-item task-item${item.doneAt ? " task-done" : ""}`;
      row.dataset.taskId = item.id;

      const main = document.createElement("div");
      main.className = "task-main";

      const title = document.createElement("div");
      title.className = "task-title";
      title.textContent = item.title;

      const meta = document.createElement("div");
      meta.className = "task-meta";
      const sessions = item.focusSessionsCompleted;
      const doneLabel = item.doneAt ? " · Done" : "";
      meta.textContent = `Est. ${item.estimateMin}m · Sessions ${sessions}${doneLabel}`;

      main.appendChild(title);
      main.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "task-actions";

      if (!item.doneAt) {
        const doneButton = document.createElement("button");
        doneButton.type = "button";
        doneButton.textContent = "Done";
        doneButton.dataset.action = "done";
        actions.appendChild(doneButton);
      }

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.textContent = "Remove";
      removeButton.dataset.action = "remove";
      actions.appendChild(removeButton);

      row.appendChild(main);
      row.appendChild(actions);
      taskList.appendChild(row);
    });
  }

  if (taskEmpty) {
    taskEmpty.classList.toggle("hidden", tasks.items.length > 0);
  }

  renderTaskLinker(tasks, pomodoro);
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

const THEME_COLORS: Record<"default" | "citrus" | "ocean" | "warm", string[]> = {
  default: ["#9CFF3A", "#4BC6FF", "#FF9F40", "#FF5A5F", "#F7B267"],
  citrus: ["#F9D423", "#FF4E50", "#F7B733", "#FC913A", "#E94E77"],
  ocean: ["#00C6FF", "#0072FF", "#00F5D4", "#48BFE3", "#5390D9"],
  warm: ["#FF6B6B", "#FFD93D", "#FF9F1C", "#F25C54", "#F7B267"]
};

const normalizeThemeId = (value: unknown): "default" | "citrus" | "ocean" | "warm" => {
  return value === "citrus" || value === "ocean" || value === "warm" ? value : "default";
};

const renderDonut = (
  entries: Array<{ label: string; value: number }>,
  total: number,
  themeId: "default" | "citrus" | "ocean" | "warm"
) => {
  if (!statsDonut || !statsLegend) {
    return;
  }
  const donutSvg = statsDonut.querySelector(".donut-svg") as HTMLElement | null;
  if (!donutSvg) {
    return;
  }

  if (!entries.length || total <= 0) {
    donutSvg.innerHTML = `
      <svg viewBox="0 0 42 42" role="img" aria-label="No data">
        <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="rgba(255,255,255,0.12)" stroke-width="6"></circle>
      </svg>
    `;
    statsLegend.innerHTML = `<p class="list-sub">No data yet.</p>`;
    return;
  }

  const colors = THEME_COLORS[themeId];
  const segments = entries.map((entry) => ({
    ...entry,
    pct: total ? (entry.value / total) * 100 : 0
  }));
  const otherValue = Math.max(
    0,
    total - segments.reduce((acc, seg) => acc + seg.value, 0)
  );
  if (otherValue > 0) {
    segments.push({ label: "Other", value: otherValue, pct: (otherValue / total) * 100 });
  }

  let offset = 0;
  const circles = segments
    .map((seg, idx) => {
      const pct = Math.max(0, Math.min(100, seg.pct));
      const dash = `${pct} ${100 - pct}`;
      const color = colors[idx % colors.length];
      const circle = `
        <circle
          cx="21"
          cy="21"
          r="15.9155"
          fill="transparent"
          stroke="${color}"
          stroke-width="6"
          stroke-dasharray="${dash}"
          stroke-dashoffset="${offset}"
        ></circle>
      `;
      offset -= pct;
      return circle;
    })
    .join("");

  donutSvg.innerHTML = `
    <svg viewBox="0 0 42 42" role="img" aria-label="Usage breakdown">
      <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="rgba(255,255,255,0.12)" stroke-width="6"></circle>
      ${circles}
    </svg>
  `;

  statsLegend.innerHTML = segments
    .map((seg, idx) => {
      const color = colors[idx % colors.length];
      return `
        <div class="legend-item">
          <span class="legend-dot" style="background:${color}"></span>
          <span class="legend-label">${seg.label}</span>
          <span class="legend-value">${formatDuration(seg.value)}</span>
        </div>
      `;
    })
    .join("");
};

const renderStats = (analytics: Awaited<ReturnType<typeof getState>>["analytics"]) => {
  statsRangeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.range === currentStatsRange);
  });
  statsFilterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === currentStatsFilter);
  });
  statsThemeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.theme === currentStatsTheme);
  });
  if (statsThemeControl) {
    statsThemeControl.classList.toggle("hidden", currentStatsPanel !== "usage");
  }
  statsPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === currentStatsPanel);
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
    renderDonut([], 0, currentStatsTheme);
    return;
  }
  const topEntries = Object.entries(listSource)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, value]) => ({ label, value }));
  renderDonut(topEntries, listTotal, currentStatsTheme);
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
      const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const allDaysSelected = entry.days.length === 7;
      const dayPills = allDaysSelected
        ? `<span class="day-pill">All</span>`
        : entry.days
            .map((day) => `<span class="day-pill">${dayLabels[day]}</span>`)
            .join("");
      const start = `${Math.floor(entry.startMin / 60)
        .toString()
        .padStart(2, "0")}:${String(entry.startMin % 60).padStart(2, "0")}`;
      const end = `${Math.floor(entry.endMin / 60)
        .toString()
        .padStart(2, "0")}:${String(entry.endMin % 60).padStart(2, "0")}`;
      return `
        <div class="list-item schedule-item" data-edit-schedule="${entry.id}">
          <div class="schedule-meta">
            <div class="schedule-title">
              <span class="list-title schedule-name">${entry.name}</span>
              <span class="time-pill">${start}–${end}</span>
            </div>
            <div class="schedule-days">${dayPills}</div>
          </div>
          <div class="schedule-actions">
            <label class="toggle small">
              <input type="checkbox" data-toggle-schedule="${entry.id}" ${
                entry.enabled ? "checked" : ""
              } />
              <span></span>
            </label>
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
      <div class="intervention-card" data-intervention="${item.key}">
        <div class="intervention-title">${item.label}</div>
        <label class="toggle small intervention-toggle">
          <input type="checkbox" data-toggle="${item.key}" ${enabled ? "checked" : ""} />
          <span></span>
        </label>
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
    interventionHint.textContent = def.detail;
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

  const readPomodoroConfig = () => {
    const work = clamp(Number(pomodoroWork?.value ?? 25), 1, 120);
    const rest = clamp(Number(pomodoroBreak?.value ?? 5), 1, 60);
    const cycles = clamp(Number(pomodoroCycles?.value ?? 1), 1, 12);
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
        lastTaskId: selectedTaskId ?? currentPomodoro?.lastTaskId ?? null,
        running: {
          phase: "work",
          startedAt: now,
          endsAt,
          cycleIndex: 0,
          paused: false,
          linkedTaskId: selectedTaskId ?? null
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
    const value = clamp(Number(pomodoroCycles.value), 1, 12);
    pomodoroCycles.value = String(value);
    await setState({ pomodoro: { cycles: value } });
  });

  pomodoroTaskSelect?.addEventListener("change", async () => {
    const value = pomodoroTaskSelect.value;
    selectedTaskId = value ? value : null;
    await setState({ pomodoro: { lastTaskId: selectedTaskId } });
  });

  taskEstimate?.addEventListener("input", () => {
    if (taskEstimateValue) {
      taskEstimateValue.textContent = `${taskEstimate.value}m`;
    }
  });

  taskAdd?.addEventListener("click", async () => {
    const title = taskTitle?.value.trim() ?? "";
    if (!title) {
      return;
    }
    const state = await getState();
    const activeCount = state.tasks.items.filter((item) => !item.doneAt).length;
    if (activeCount >= state.tasks.activeLimit) {
      return;
    }
    const estimate = clamp(Number(taskEstimate?.value ?? 30), 15, 180);
    const newTask = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title,
      estimateMin: estimate,
      createdAt: Date.now(),
      focusSessionsCompleted: 0
    };
    await setState({ tasks: { items: [...state.tasks.items, newTask] } });
    if (taskTitle) {
      taskTitle.value = "";
    }
  });

  taskList?.addEventListener("click", async (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
    const action = button?.dataset.action;
    if (!action) {
      return;
    }
    const row = button?.closest<HTMLElement>("[data-task-id]");
    const taskId = row?.dataset.taskId;
    if (!taskId) {
      return;
    }
    const state = await getState();
    const items = state.tasks.items;
    if (action === "done") {
      const updated = items.map((item) =>
        item.id === taskId && !item.doneAt ? { ...item, doneAt: Date.now() } : item
      );
      const shouldClear =
        selectedTaskId === taskId || state.pomodoro.lastTaskId === taskId;
      if (selectedTaskId === taskId) {
        selectedTaskId = null;
      }
      await setState({
        tasks: { items: updated },
        pomodoro: { lastTaskId: shouldClear ? null : state.pomodoro.lastTaskId ?? null }
      });
    } else if (action === "remove") {
      const updated = items.filter((item) => item.id !== taskId);
      const shouldClear =
        selectedTaskId === taskId || state.pomodoro.lastTaskId === taskId;
      if (selectedTaskId === taskId) {
        selectedTaskId = null;
      }
      await setState({
        tasks: { items: updated },
        pomodoro: { lastTaskId: shouldClear ? null : state.pomodoro.lastTaskId ?? null }
      });
    }
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
    const startedAt = Date.now();
    const endsAt = startedAt + currentStrictMinutes * 60 * 1000;
    await setState({
      focusEnabled: true,
      pause: { isPaused: false, pauseType: null, pauseEndAt: null },
      strictSession: { active: true, endsAt, startedAt }
    });
    closeModal("strictConfirm");
  });

  strictOverlayClose?.addEventListener("click", () => {
    strictOverlayDismissed = true;
    strictOverlay?.classList.add("hidden");
    strictOverlay?.setAttribute("aria-hidden", "true");
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
    const deleteButton = target.closest<HTMLButtonElement>("[data-delete-schedule]");
    if (deleteButton) {
      const id = deleteButton.getAttribute("data-delete-schedule");
      if (!id) {
        return;
      }
      const state = await getState();
      const entries = state.schedule.entries.filter((item) => item.id !== id);
      await setState({ schedule: { entries } });
      return;
    }
    if (target.closest("label")) {
      return;
    }
    const scheduleItem = target.closest<HTMLElement>("[data-edit-schedule]");
    if (!scheduleItem) {
      return;
    }
    const id = scheduleItem.getAttribute("data-edit-schedule");
    if (!id) {
      return;
    }
    const state = await getState();
    const entry = state.schedule.entries.find((item) => item.id === id);
    if (entry) {
      openScheduleModal(entry);
    }
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

  statsCardTabs?.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-stats-panel]");
    const panel = button?.dataset.statsPanel as "usage" | "domains" | undefined;
    if (!panel) {
      return;
    }
    currentStatsPanel = panel;
    const tabButtons = statsCardTabs.querySelectorAll<HTMLButtonElement>("button");
    tabButtons.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.statsPanel === panel);
    });
    statsPanels.forEach((panelEl) => {
      panelEl.classList.toggle("active", panelEl.dataset.panel === panel);
    });
    if (statsThemeControl) {
      statsThemeControl.classList.toggle("hidden", panel !== "usage");
    }
  });

  statsThemeButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const theme = button.dataset.theme as "default" | "citrus" | "ocean" | "warm" | undefined;
      if (!theme) {
        return;
      }
      currentStatsTheme = theme;
      await setState({ analytics: { chartThemeId: theme } });
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
    if (target.closest("label")) {
      return;
    }
    const card = target.closest<HTMLElement>("[data-intervention]");
    const key = card?.getAttribute("data-intervention") as InterventionKey | null;
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
  bindEvents();
  const state = await getState();
  try {
    renderFocus(
      state.focusEnabled,
      state.pause.isPaused,
      state.pause.pauseType,
      state.pause.pauseEndAt,
      state.strictSession.active,
      state.strictSession.endsAt ?? null,
      state.pomodoro
    );
    renderTheme(state.ui.theme);
    renderOverlayMode(state.overlayMode);
    currentStatsRange = state.analytics.chartRange;
    currentStatsFilter = state.analytics.chartFilter;
    currentStatsTheme = normalizeThemeId(state.analytics.chartThemeId);
    renderStrictSession(state.strictSession);
    renderStrictOverlay(state.strictSession);
    renderPomodoro(state.pomodoro, state.strictSession.active);
    renderTasks(state.tasks, state.pomodoro);
    setActiveView("home");
    renderLists(state.lists);
    renderInterventions(state.interventions);
    renderStats(state.analytics);
    renderSchedules(state.schedule);
  } catch (error) {
    reportUiError(error);
  }
  if (pomodoroTicker) {
    window.clearInterval(pomodoroTicker);
  }
  pomodoroTicker = window.setInterval(() => {
    if (currentPomodoro) {
      renderPomodoro(currentPomodoro, currentStrictActive);
      const running = currentPomodoro.running;
      if (running && !running.paused && Date.now() >= running.endsAt) {
        void requestPomodoroAdvance();
      }
    }
    if (currentStrictActive) {
      void getState().then((nextState) => renderStrictOverlay(nextState.strictSession));
    }
  }, 1000);

  subscribeState((nextState) => {
    renderFocus(
      nextState.focusEnabled,
      nextState.pause.isPaused,
      nextState.pause.pauseType,
      nextState.pause.pauseEndAt,
      nextState.strictSession.active,
      nextState.strictSession.endsAt ?? null,
      nextState.pomodoro
    );
    renderStrictSession(nextState.strictSession);
    renderStrictOverlay(nextState.strictSession);
    renderLists(nextState.lists);
    renderInterventions(nextState.interventions);
    renderTheme(nextState.ui.theme);
    renderOverlayMode(nextState.overlayMode);
    currentStatsTheme = normalizeThemeId(nextState.analytics.chartThemeId);
    renderStats(nextState.analytics);
    renderSchedules(nextState.schedule);
    renderPomodoro(nextState.pomodoro, nextState.strictSession.active);
    renderTasks(nextState.tasks, nextState.pomodoro);
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
