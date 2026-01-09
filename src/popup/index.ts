import { getState, setState, subscribeState } from "../shared/storage.js";
import {
  BREATHING_TECHNIQUES,
  INTERVENTION_DEFS,
  type InterventionKey
} from "../shared/interventions.js";
import type { StorageSchema } from "../shared/storageSchema.js";

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
const confirmToggle = document.getElementById("confirmToggle") as HTMLInputElement | null;
const focusOffConfirm = document.getElementById("focusOffConfirm") as HTMLButtonElement | null;
const focusOffCancel = document.getElementById("focusOffCancel") as HTMLButtonElement | null;
const reviewLink = document.getElementById("reviewLink") as HTMLAnchorElement | null;
const versionLabel = document.getElementById("versionLabel");
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
const statsFocusButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("#statsFocusToggle button")
);
const statsSummaryView = document.getElementById("statsSummaryView");
const statsTrendView = document.getElementById("statsTrendView");
const statsTaskView = document.getElementById("statsTaskView");
const statsBack = document.getElementById("statsBack") as HTMLButtonElement | null;
const statsTaskBack = document.getElementById("statsTaskBack") as HTMLButtonElement | null;
const statsShowAll = document.getElementById("statsShowAll") as HTMLButtonElement | null;
const statsTrendCard = document.querySelector<HTMLElement>(".stats-trend-card");
const statsSummaryTasks = document.getElementById("statsSummaryTasks");
const statsTrendTasks = document.getElementById("statsTrendTasks");
const statsTaskTitle = document.getElementById("statsTaskTitle");
const statsSummaryToday = document.getElementById("statsSummaryToday");
const statsSummaryTodayChange = document.getElementById("statsSummaryTodayChange");
const statsSummaryWeek = document.getElementById("statsSummaryWeek");
const statsSummaryWeekChange = document.getElementById("statsSummaryWeekChange");
const statsSummaryAvg = document.getElementById("statsSummaryAvg");
const statsSummaryChart = document.getElementById("statsSummaryChart");
const statsDateLabel = document.getElementById("statsDateLabel");
const statsDatePrev = document.getElementById("statsDatePrev") as HTMLButtonElement | null;
const statsDateNext = document.getElementById("statsDateNext") as HTMLButtonElement | null;
const statsDateRange = document.getElementById("statsDateRange");
const statsTrendRangeButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("#statsTrendRange button")
);
const statsTrendChart = document.getElementById("statsTrendChart");
const statsTaskDateLabel = document.getElementById("statsTaskDateLabel");
const statsTaskDatePrev = document.getElementById("statsTaskDatePrev") as HTMLButtonElement | null;
const statsTaskDateNext = document.getElementById("statsTaskDateNext") as HTMLButtonElement | null;
const statsTaskRange = document.getElementById("statsTaskRange");
const statsTaskRangeButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("#statsTaskRangeToggle button")
);
const statsTaskChart = document.getElementById("statsTaskChart");
const statsTrendTotal = document.getElementById("statsTrendTotal");
const statsTrendChange = document.getElementById("statsTrendChange");
const statsTrendAvg = document.getElementById("statsTrendAvg");
const statsTrendAvgChange = document.getElementById("statsTrendAvgChange");
const statsTaskTotal = document.getElementById("statsTaskTotal");
const statsTaskChange = document.getElementById("statsTaskChange");
const statsTaskAvg = document.getElementById("statsTaskAvg");
const statsTaskAvgChange = document.getElementById("statsTaskAvgChange");
const metricFocus = document.getElementById("metricFocus");
const metricBreak = document.getElementById("metricBreak");
const metricTasks = document.getElementById("metricTasks");
const metricDistraction = document.getElementById("metricDistraction");
const statsSessions = document.getElementById("statsSessions");
const timeMachineDays = document.getElementById("timeMachineDays");
const timeMachineDetails = document.getElementById("timeMachineDetails");
const exportSessionsCsv = document.getElementById("exportSessionsCsv") as HTMLButtonElement | null;
const exportUsageCsv = document.getElementById("exportUsageCsv") as HTMLButtonElement | null;
const scheduleAdd = document.getElementById("scheduleAdd");
const scheduleList = document.getElementById("scheduleList");
const scheduleTitle = document.getElementById("scheduleTitle");
const scheduleName = document.getElementById("scheduleName") as HTMLInputElement | null;
const scheduleStart = document.getElementById("scheduleStart") as HTMLInputElement | null;
const scheduleEnd = document.getElementById("scheduleEnd") as HTMLInputElement | null;
const scheduleDays = document.getElementById("scheduleDays");
const scheduleSave = document.getElementById("scheduleSave");
const pomodoroTaskPill = document.getElementById("pomodoroTaskPill");
const pomodoroRing = document.getElementById("pomodoroRing") as SVGCircleElement | null;
const pomodoroTimerValue = document.getElementById("pomodoroTimerValue");
const pomodoroPhasePill = document.getElementById("pomodoroPhasePill");
const pomodoroCyclePill = document.getElementById("pomodoroCyclePill");
const pomodoroStart = document.getElementById("pomodoroStart") as HTMLButtonElement | null;
const pomodoroPause = document.getElementById("pomodoroPause") as HTMLButtonElement | null;
const pomodoroStop = document.getElementById("pomodoroStop") as HTMLButtonElement | null;
const pomodoroAutoBlock = document.getElementById("pomodoroAutoBlock") as HTMLInputElement | null;
const pomodoroBlockBreak = document.getElementById("pomodoroBlockBreak") as HTMLInputElement | null;
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
const interventionDisclosure = document.querySelector<HTMLElement>("[data-intervention-disclosure]");
const interventionToggle = document.getElementById("interventionToggle") as HTMLButtonElement | null;
const interventionCurrent = document.getElementById("interventionCurrent");
const interventionPanel = document.getElementById("interventionPanel");
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
const taskActiveDetail = document.getElementById("taskActiveDetail");
const taskActiveDot = document.getElementById("taskActiveDot");
const taskActiveSettings = document.getElementById("taskActiveSettings") as HTMLButtonElement | null;
const taskNameDisplay = document.getElementById("taskNameDisplay");
const pomodoroFocusValue = document.getElementById("pomodoroFocusValue");
const pomodoroBreakValue = document.getElementById("pomodoroBreakValue");
const pomodoroCycleValue = document.getElementById("pomodoroCycleValue");
const taskQuickGrid = document.getElementById("taskQuickGrid");
const taskShowAll = document.getElementById("taskShowAll") as HTMLButtonElement | null;
const taskAllGrid = document.getElementById("taskAllGrid");
const taskSelectLabel = document.getElementById("taskSelectLabel");
const taskSelectConfirm = document.getElementById("taskSelectConfirm") as HTMLButtonElement | null;
const taskAdd = document.getElementById("taskAdd") as HTMLButtonElement | null;
const taskModalTitle = document.getElementById("taskModalTitle");
const taskName = document.getElementById("taskName") as HTMLInputElement | null;
const taskWork = document.getElementById("taskWork") as HTMLInputElement | null;
const taskBreak = document.getElementById("taskBreak") as HTMLInputElement | null;
const taskCycles = document.getElementById("taskCycles") as HTMLInputElement | null;
const taskEndless = document.getElementById("taskEndless") as HTMLInputElement | null;
const taskColor = document.getElementById("taskColor") as HTMLInputElement | null;
const taskSave = document.getElementById("taskSave");
const taskDelete = document.getElementById("taskDelete");
const taskDeleteConfirm = document.getElementById("taskDeleteConfirm") as HTMLButtonElement | null;
const taskDeleteCancel = document.getElementById("taskDeleteCancel") as HTMLButtonElement | null;
const PAUSE_TYPES = ["1h", "eod", "manual"] as const;
type PauseType = (typeof PAUSE_TYPES)[number];

const DEFAULT_POMODORO = {
  workMin: 25,
  breakMin: 5,
  cycles: 0
};

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

const truncateLabel = (value: string, maxChars: number) => {
  if (value.length <= maxChars) {
    return value;
  }
  if (maxChars <= 1) {
    return "…";
  }
  return `${value.slice(0, maxChars - 1)}…`;
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
let currentStatsSubview: "summary" | "trend" | "task" = "summary";
let currentStatsTaskId: string | null = null;
let currentTrendRange: "day" | "week" | "month" | "year" = "week";
let currentTrendOffset = 0;
let currentTaskRange: "day" | "week" | "month" | "year" = "week";
let currentTaskOffset = 0;
let currentFocusView: "focus" | "distraction" = "focus";
let currentTimeMachineDay = "";
let pendingFocusOff = false;
const REVIEW_URL = "";
let currentScheduleId: string | null = null;
let currentStrictMinutes = 1;
let currentStrictActive = false;
let currentStrictEndsAt: number | null = null;
let currentStrictStartedAt: number | null = null;
let strictOverlayDismissed = false;
let currentPomodoro: Awaited<ReturnType<typeof getState>>["pomodoro"] | null = null;
let pomodoroTicker: number | null = null;
let currentTasks: Awaited<ReturnType<typeof getState>>["tasks"] | null = null;
let lastTasksKey = "";
let currentTaskEditId: string | null = null;
let currentTaskDeleteId: string | null = null;
let pendingTaskSelectId: string | null | undefined = undefined;
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
    button.disabled = strictActive || timerControlsFocus || !focusEnabled;
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
    const radius = Number(strictRing.getAttribute("r") ?? "0");
    const circumference = 2 * Math.PI * radius;
    const progress = 1 - remainingMs / totalMs;
    const offset = circumference * (1 - Math.min(1, Math.max(0, progress)));
    strictRing.style.strokeDasharray = String(circumference);
    strictRing.style.strokeDashoffset = String(offset);
  }
};

const renderPomodoro = (
  pomodoro: Awaited<ReturnType<typeof getState>>["pomodoro"],
  strictActive: boolean
) => {
  currentPomodoro = pomodoro;
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

  const updateRing = (remainingMs: number, totalMs: number) => {
    if (!pomodoroRing) {
      return;
    }
    const radius = Number(pomodoroRing.getAttribute("r") ?? "0");
    const circumference = 2 * Math.PI * radius;
    const progress = totalMs > 0 ? Math.min(1, Math.max(0, 1 - remainingMs / totalMs)) : 0;
    pomodoroRing.style.strokeDasharray = String(circumference);
    pomodoroRing.style.strokeDashoffset = String(
      circumference - progress * circumference
    );
  };

  const activeTaskName = (() => {
    if (!pomodoro.lastTaskId || !currentTasks) {
      return "Default";
    }
    const task = currentTasks.items.find((item) => item.id === pomodoro.lastTaskId);
    return task?.title ?? "Default";
  })();
  if (pomodoroTaskPill) {
    pomodoroTaskPill.textContent = truncateLabel(activeTaskName, 16);
    pomodoroTaskPill.setAttribute("title", activeTaskName);
  }

  if (!running) {
    const idleTotalMs = pomodoro.workMin * 60 * 1000;
    if (pomodoroTimerValue) {
      pomodoroTimerValue.textContent = formatCountdown(idleTotalMs);
    }
    updateRing(idleTotalMs, idleTotalMs);
    pomodoroPhasePill?.classList.add("hidden");
    pomodoroCyclePill?.classList.add("hidden");
    return;
  }

  const phaseLabel = running.phase === "work" ? "Focus" : "Break";
  const totalMs =
    (running.phase === "work" ? pomodoro.workMin : pomodoro.breakMin) * 60 * 1000;
  const remaining = running.paused
    ? running.remainingMs ?? totalMs
    : Math.max(0, running.endsAt - Date.now());
  updateRing(remaining, totalMs);
  const cycleLabel =
    pomodoro.cycles > 0
      ? `${Math.min(running.cycleIndex + 1, pomodoro.cycles)}|${pomodoro.cycles}`
      : "Endless";
  if (pomodoroTimerValue) {
    pomodoroTimerValue.textContent = formatCountdown(remaining);
  }
  if (pomodoroPhasePill) {
    pomodoroPhasePill.textContent = phaseLabel;
    pomodoroPhasePill.classList.remove("hidden");
  }
  if (pomodoroCyclePill) {
    if (cycleLabel) {
      pomodoroCyclePill.textContent = cycleLabel;
      pomodoroCyclePill.classList.remove("hidden");
    } else {
      pomodoroCyclePill.classList.add("hidden");
    }
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

const getTaskPickerKey = (
  tasks: Awaited<ReturnType<typeof getState>>["tasks"],
  pomodoro: Awaited<ReturnType<typeof getState>>["pomodoro"]
) => {
  const itemsKey = tasks.items
    .map(
      (item) =>
        `${item.id}:${item.title}:${item.color}:${item.pomodoroWorkMin}:${item.pomodoroBreakMin}:${item.pomodoroCycles}`
    )
    .join("|");
  return `${pomodoro.lastTaskId ?? "default"}::${itemsKey}`;
};

const renderTasks = (
  tasks: Awaited<ReturnType<typeof getState>>["tasks"],
  pomodoro: Awaited<ReturnType<typeof getState>>["pomodoro"]
) => {
  const nextKey = getTaskPickerKey(tasks, pomodoro);
  if (nextKey === lastTasksKey) {
    return;
  }
  lastTasksKey = nextKey;
  currentTasks = tasks;
  const isRunning = Boolean(pomodoro.running);
  const activeTask = pomodoro.lastTaskId
    ? tasks.items.find((item) => item.id === pomodoro.lastTaskId) ?? null
    : null;
  if (pomodoro.lastTaskId && !activeTask) {
    void setState({
      pomodoro: isRunning
        ? { lastTaskId: null }
        : {
            lastTaskId: null,
            workMin: DEFAULT_POMODORO.workMin,
            breakMin: DEFAULT_POMODORO.breakMin,
            cycles: DEFAULT_POMODORO.cycles
          }
    });
  } else if (
    !isRunning &&
    !activeTask &&
    (pomodoro.workMin !== DEFAULT_POMODORO.workMin ||
      pomodoro.breakMin !== DEFAULT_POMODORO.breakMin ||
      pomodoro.cycles !== DEFAULT_POMODORO.cycles)
  ) {
    void setState({
      pomodoro: {
        workMin: DEFAULT_POMODORO.workMin,
        breakMin: DEFAULT_POMODORO.breakMin,
        cycles: DEFAULT_POMODORO.cycles
      }
    });
  }

  if (taskNameDisplay) {
    taskNameDisplay.textContent = activeTask ? activeTask.title : "Default";
    taskNameDisplay.setAttribute("title", activeTask ? activeTask.title : "Default");
  }
  const activeConfig = getTaskPomodoroConfig(activeTask);
  if (taskActiveDetail) {
    taskActiveDetail.textContent = formatTaskPomodoro(activeConfig);
  }
  if (taskActiveDot) {
    taskActiveDot.style.background = activeTask?.color ?? "var(--color-accent)";
  }
  if (taskActiveSettings) {
    if (activeTask) {
      taskActiveSettings.classList.remove("hidden");
      taskActiveSettings.setAttribute("data-task-settings", activeTask.id);
    } else {
      taskActiveSettings.classList.add("hidden");
      taskActiveSettings.removeAttribute("data-task-settings");
    }
  }
  if (pomodoroFocusValue) {
    pomodoroFocusValue.textContent = `${activeConfig.workMin}m`;
  }
  if (pomodoroBreakValue) {
    pomodoroBreakValue.textContent = `${activeConfig.breakMin}m`;
  }
  if (pomodoroCycleValue) {
    pomodoroCycleValue.textContent =
      activeConfig.cycles === 0 ? "Endless" : `${activeConfig.cycles}`;
  }

  const buildCard = (item: { id: string | null; title: string; color: string; detail: string }) => {
    const isDefault = item.id === null;
    const gear = isDefault
      ? ""
      : `
        <button class="task-gear" type="button" data-task-settings="${item.id}" aria-label="Open settings">
          <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <path d="M10 6.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Zm7.1 3.8a7 7 0 0 0-.1-1.2l2-1.5-1.8-3.1-2.4.9a7 7 0 0 0-2-1.2l-.4-2.6H7.6l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-.9L1 7.3l2 1.5a7 7 0 0 0 0 2.4L1 12.7l1.8 3.1 2.4-.9a7 7 0 0 0 2 1.2l.4 2.6h4.8l.4-2.6a7 7 0 0 0 2-1.2l2.4.9 1.8-3.1-2-1.5c.1-.4.1-.8.1-1.2Z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      `;
    const dataAttr = isDefault ? 'data-task-default="true"' : `data-task-id="${item.id}"`;
    return `
      <div class="task-quick-card" data-task-select ${dataAttr}>
        <div class="task-quick-top">
          <span class="task-color-dot" style="background:${item.color}"></span>
          ${gear}
        </div>
        <div class="task-title" title="${item.title}">${item.title}</div>
        <p class="task-desc">${item.detail}</p>
      </div>
    `;
  };

  type TaskCardItem = {
    id: string | null;
    title: string;
    color: string;
    detail: string;
  };

  const defaultItem: TaskCardItem = {
    id: null,
    title: "Default",
    color: "var(--color-accent)",
    detail: formatTaskPomodoro(DEFAULT_POMODORO)
  };

  if (taskQuickGrid) {
    const quickItems: TaskCardItem[] = [];
    if (activeTask) {
      quickItems.push(defaultItem);
    }
    tasks.items
      .filter((item) => item.id !== activeTask?.id)
      .forEach((item) => {
        quickItems.push({
          id: item.id,
          title: item.title,
          color: item.color ?? "var(--color-accent)",
          detail: formatTaskPomodoro(getTaskPomodoroConfig(item))
        });
      });
    const quickCards = quickItems.slice(0, 4).map(buildCard).join("");
    taskQuickGrid.innerHTML = quickCards
      ? quickCards
      : `<p class="list-sub" style="grid-column: 1 / -1;">No tasks yet.</p>`;
  }

  if (taskAllGrid) {
    const allItems = [
      defaultItem,
      ...tasks.items.map((item) => ({
        id: item.id,
        title: item.title,
        color: item.color ?? "var(--color-accent)",
        detail: formatTaskPomodoro(getTaskPomodoroConfig(item))
      }))
    ];
    taskAllGrid.innerHTML = allItems.map(buildCard).join("");
  }
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

const formatDateLabel = (key: string): string => {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const endOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const addYears = (date: Date, years: number) => {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
};

const getWeekStart = (date: Date) => {
  const day = date.getDay();
  const offset = (day + 6) % 7;
  return startOfDay(addDays(date, -offset));
};

const getRangeWindow = (
  range: "day" | "week" | "month" | "year",
  offset: number
) => {
  const now = new Date();
  if (range === "day") {
    const base = addDays(now, offset);
    return { start: startOfDay(base), end: endOfDay(base) };
  }
  if (range === "week") {
    const base = addDays(now, offset * 7);
    const start = getWeekStart(base);
    const end = endOfDay(addDays(start, 6));
    return { start, end };
  }
  if (range === "month") {
    const base = addMonths(now, offset);
    const start = new Date(base.getFullYear(), base.getMonth(), 1);
    const end = endOfDay(new Date(base.getFullYear(), base.getMonth() + 1, 0));
    return { start, end };
  }
  const base = addYears(now, offset);
  const start = new Date(base.getFullYear(), 0, 1);
  const end = endOfDay(new Date(base.getFullYear(), 11, 31));
  return { start, end };
};

const getRangeKeysBetween = (start: Date, end: Date) => {
  const keys: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    keys.push(getDayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
};

const formatRangeLabel = (start: Date, end: Date) => {
  const startLabel = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (startLabel === endLabel) {
    return startLabel;
  }
  return `${startLabel} - ${endLabel}`;
};
const formatTimeLabel = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
};

const buildTaskTotals = (state: StorageSchema, keys: string[]) => {
  const keySet = new Set(keys);
  const totals = new Map<string, number>();
  state.analytics.sessions.forEach((session) => {
    if (session.type !== "pomodoro" || !session.taskId) {
      return;
    }
    const key = getDayKey(new Date(session.startedAt));
    if (!keySet.has(key)) {
      return;
    }
    const duration = Math.max(0, session.endedAt - session.startedAt);
    totals.set(session.taskId, (totals.get(session.taskId) ?? 0) + duration);
  });
  const taskLookup = new Map(state.tasks.items.map((item) => [item.id, item.title]));
  const items = Array.from(totals.entries())
    .map(([id, totalMs]) => ({
      id,
      title: taskLookup.get(id) ?? "Task",
      totalMs
    }))
    .sort((a, b) => b.totalMs - a.totalMs);
  const totalAll = items.reduce((sum, item) => sum + item.totalMs, 0);
  return { items, totalAll };
};

const buildFocusTotals = (
  state: StorageSchema,
  keys: string[],
  taskId?: string | null
) => {
  const keySet = new Set(keys);
  let totalMs = 0;
  state.analytics.sessions.forEach((session) => {
    if (session.type !== "pomodoro") {
      return;
    }
    if (taskId && session.taskId !== taskId) {
      return;
    }
    const key = getDayKey(new Date(session.startedAt));
    if (!keySet.has(key)) {
      return;
    }
    totalMs += Math.max(0, session.endedAt - session.startedAt);
  });
  const dailyAvg = keys.length ? totalMs / keys.length : 0;
  return { totalMs, dailyAvg };
};

const buildStackedTrendBuckets = (
  state: StorageSchema,
  range: "day" | "week" | "month" | "year",
  start: Date,
  end: Date,
  taskId?: string | null
) => {
  const taskLookup = new Map(state.tasks.items.map((item) => [item.id, item]));
  const totals = new Map<string, number>();
  const bucketCount = range === "year" ? 12 : range === "day" ? 6 : range === "week" ? 7 : 5;
  const bucketMaps = new Array(bucketCount).fill(0).map(() => new Map<string, number>());
  const labels =
    range === "year"
      ? new Array(12).fill("").map((_, idx) =>
          new Date(start.getFullYear(), idx, 1).toLocaleDateString(undefined, { month: "short" })
        )
      : range === "day"
        ? ["0", "4", "8", "12", "16", "20"]
        : range === "week"
          ? new Array(7).fill("").map((_, idx) => {
              const day = addDays(start, idx);
              return day.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1);
            })
          : new Array(5).fill("").map((_, idx) => `W${idx + 1}`);

  const getBucketIndex = (date: Date) => {
    if (range === "year") {
      return date.getMonth();
    }
    if (range === "day") {
      return Math.min(5, Math.floor(date.getHours() / 4));
    }
    if (range === "week") {
      const index = Math.floor((startOfDay(date).getTime() - start.getTime()) / 86400000);
      return Math.min(6, Math.max(0, index));
    }
    const day = date.getDate();
    return Math.min(4, Math.floor((day - 1) / 7));
  };

  state.analytics.sessions.forEach((session) => {
    if (session.type !== "pomodoro") return;
    if (!session.taskId) return;
    if (taskId && session.taskId !== taskId) return;
    const date = new Date(session.startedAt);
    if (date < start || date > end) return;
    const index = getBucketIndex(date);
    if (index < 0 || index >= bucketMaps.length) return;
    const duration = Math.max(0, session.endedAt - session.startedAt);
    const map = bucketMaps[index];
    map.set(session.taskId, (map.get(session.taskId) ?? 0) + duration);
    totals.set(session.taskId, (totals.get(session.taskId) ?? 0) + duration);
  });

  const orderedTaskIds = taskId
    ? [taskId]
    : Array.from(totals.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id);

  return labels.map((label, idx) => {
    const bucketMap = bucketMaps[idx];
    const segments = orderedTaskIds
      .map((id) => {
        const value = bucketMap.get(id) ?? 0;
        if (value <= 0) {
          return null;
        }
        const task = taskLookup.get(id);
        return {
          id,
          title: task?.title ?? "Task",
          color: task?.color ?? "var(--color-accent)",
          value
        };
      })
      .filter((segment): segment is { id: string; title: string; color: string; value: number } =>
        Boolean(segment)
      );
    const total = segments.reduce((sum, seg) => sum + seg.value, 0);
    return { label, total, segments };
  });
};

const renderTrendChart = (
  target: HTMLElement | null,
  buckets: Array<{ label: string; total: number; segments: Array<{ id: string; color: string; value: number }> }>
) => {
  if (!target) return;
  const max = Math.max(1, ...buckets.map((b) => b.total));
  target.innerHTML = `
    <div class="trend-bars">
      ${buckets
        .map((bucket) => {
          const segments = bucket.segments
            .map((segment, index) => {
              const pct = (segment.value / max) * 100;
              const isBottom = index === 0;
              const isTop = index === bucket.segments.length - 1;
              return `
                <span
                  class="trend-segment ${isBottom ? "is-bottom" : ""} ${isTop ? "is-top" : ""}"
                  style="height: ${pct}%; background: ${segment.color};"
                  title="${segment.value ? formatDuration(segment.value) : ""}"
                ></span>
              `;
            })
            .join("");
          return `
            <div class="trend-bar">
              <div class="trend-bar-track">
                ${bucket.total > 0 ? `<div class="trend-bar-stack">${segments}</div>` : `<span class="trend-bar-dot"></span>`}
              </div>
              <span class="trend-label">${bucket.label}</span>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
};

const getDayKey = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

const renderMetrics = (state: StorageSchema, keys: string[]) => {
  const keySet = new Set(keys);
  const sessionsInRange = state.analytics.sessions.filter((session) => {
    const dateKey = getDayKey(new Date(session.startedAt));
    return keySet.has(dateKey);
  });
  const focusMs = sessionsInRange.reduce(
    (acc, session) => acc + Math.max(0, session.endedAt - session.startedAt),
    0
  );
  const pomodoroSessions = sessionsInRange.filter((session) => session.type === "pomodoro").length;
  const breakMsEst = pomodoroSessions * state.pomodoro.breakMin * 60 * 1000;
  const tasksCompleted = state.tasks.items.filter((item) => {
    if (!item.doneAt) {
      return false;
    }
    const dateKey = getDayKey(new Date(item.doneAt));
    return keySet.has(dateKey);
  }).length;
  const distractionMs = keys.reduce((acc, key) => acc + (state.analytics.byDay[key]?.blockedMs ?? 0), 0);

  if (metricFocus) metricFocus.textContent = formatDuration(focusMs);
  if (metricBreak) metricBreak.textContent = formatDuration(breakMsEst);
  if (metricTasks) metricTasks.textContent = String(tasksCompleted);
  if (metricDistraction) metricDistraction.textContent = formatDuration(distractionMs);
};

const renderSessions = (state: StorageSchema, keys: string[]) => {
  if (!statsSessions) {
    return;
  }
  const keySet = new Set(keys);
  const taskLookup = new Map(state.tasks.items.map((item) => [item.id, item.title]));
  const sessions = [...state.analytics.sessions]
    .filter((session) => keySet.has(getDayKey(new Date(session.startedAt))))
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, 12);

  if (sessions.length === 0) {
    statsSessions.innerHTML = `<p class="list-sub">No sessions logged yet.</p>`;
    return;
  }

  statsSessions.innerHTML = sessions
    .map((session) => {
      const duration = Math.max(0, session.endedAt - session.startedAt);
      const taskTitle = session.taskId ? taskLookup.get(session.taskId) : null;
      const label = session.type === "strict" ? "Strict session" : "Pomodoro focus";
      const timeLabel = `${formatTimeLabel(session.startedAt)} · ${formatDuration(duration)}`;
      return `
        <div class="list-item">
          <div class="session-item">
            <div class="session-title">${label}</div>
            <div class="session-meta">
              <span>${timeLabel}</span>
              ${taskTitle ? `<span>Task: ${taskTitle}</span>` : ""}
            </div>
          </div>
        </div>
      `;
    })
    .join("");
};

const renderTaskLists = (state: StorageSchema, keys: string[]) => {
  const { items, totalAll } = buildTaskTotals(state, keys);
  const renderList = (target: HTMLElement | null, limit?: number, compact?: boolean) => {
    if (!target) {
      return;
    }
    const sliced = typeof limit === "number" ? items.slice(0, limit) : items;
    if (sliced.length === 0) {
      target.innerHTML = `<p class="list-sub">No task data yet.</p>`;
      return;
    }
    target.innerHTML = sliced
      .map((item) => {
        const pct = totalAll ? Math.round((item.totalMs / totalAll) * 100) : 0;
        if (compact) {
          return `
            <div class="stats-task-card" data-task-id="${item.id}">
              <div class="stats-task-title">${item.title}</div>
              <div class="stats-task-meta">
                <span>${formatDuration(item.totalMs)}</span>
                <span>·</span>
                <span>${pct}%</span>
              </div>
            </div>
          `;
        }
        return `
          <div class="list-item stats-task-row" data-task-id="${item.id}">
            <div>
              <div class="list-title">${item.title}</div>
              <div class="list-sub">${formatDuration(item.totalMs)} · ${pct}%</div>
            </div>
            <div class="stats-pill">${pct}%</div>
          </div>
        `;
      })
      .join("");
  };
  renderList(statsSummaryTasks, 4, true);
  renderList(statsTrendTasks);
};

const renderTimeline = (state: StorageSchema, keys: string[]) => {
  if (!statsStacked) {
    return;
  }
  const rows = keys
    .map((key) => {
      const day = state.analytics.byDay[key];
      const blocked = day?.blockedMs ?? 0;
      const total = day?.totalMs ?? 0;
      const focus = Math.max(0, total - blocked);
      return { key, focus, blocked };
    })
    .reverse();
  const maxValue = Math.max(
    1,
    ...rows.map((row) => (currentFocusView === "focus" ? row.focus : row.blocked))
  );
  statsStacked.innerHTML = rows
    .map((row) => {
      const value = currentFocusView === "focus" ? row.focus : row.blocked;
      const pct = Math.round((value / maxValue) * 100);
      return `
        <div class="timeline-row">
          <div class="row" style="gap: 8px;">
            <span>${formatDateLabel(row.key)}</span>
            <span class="list-sub">${formatDuration(value)}</span>
          </div>
          <div class="timeline-bar">
            <span style="width: ${pct}%;"></span>
          </div>
        </div>
      `;
    })
    .join("");
};

const renderTimeMachine = (state: StorageSchema) => {
  if (!timeMachineDays || !timeMachineDetails) {
    return;
  }
  const days = getRangeKeys("week").slice(0, 7);
  if (!currentTimeMachineDay) {
    currentTimeMachineDay = days[0] ?? getDayKey();
  }
  timeMachineDays.innerHTML = days
    .map((key) => {
      const active = key === currentTimeMachineDay ? "active" : "";
      return `<button class="chip ${active}" data-day="${key}">${formatDateLabel(key)}</button>`;
    })
    .join("");

  const day = state.analytics.byDay[currentTimeMachineDay];
  const usageEntries = Object.entries(day?.byDomain ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const sessions = state.analytics.sessions
    .filter((session) => getDayKey(new Date(session.startedAt)) === currentTimeMachineDay)
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, 6);

  const usageHtml = usageEntries.length
    ? usageEntries
        .map(
          ([host, value]) =>
            `<div class="row" style="justify-content: space-between;"><span>${host}</span><span class="list-sub">${formatDuration(value)}</span></div>`
        )
        .join("")
    : `<p class="list-sub">No web usage recorded.</p>`;

  const sessionHtml = sessions.length
    ? sessions
        .map((session) => {
          const duration = Math.max(0, session.endedAt - session.startedAt);
          return `<div class="row" style="justify-content: space-between;"><span>${session.type}</span><span class="list-sub">${formatDuration(duration)}</span></div>`;
        })
        .join("")
    : `<p class="list-sub">No sessions logged.</p>`;

  timeMachineDetails.innerHTML = `
    <div class="card" style="padding: 10px;">
      <p class="list-sub">Top sites</p>
      <div style="margin-top: 6px; display: grid; gap: 6px;">
        ${usageHtml}
      </div>
      <p class="list-sub" style="margin-top: 10px;">Sessions</p>
      <div style="margin-top: 6px; display: grid; gap: 6px;">
        ${sessionHtml}
      </div>
    </div>
  `;
};

const renderStats = (state: StorageSchema) => {
  const analytics = state.analytics;
  statsRangeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.range === currentStatsRange);
  });
  statsFilterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === currentStatsFilter);
  });
  statsThemeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.theme === currentStatsTheme);
  });
  statsFocusButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.focusMode === currentFocusView);
  });

  if (statsSummaryView || statsTrendView || statsTaskView) {
    setStatsSubview(currentStatsSubview);
  }
  const rangeLabel =
    currentStatsRange === "today"
      ? "Today"
      : currentStatsRange === "week"
        ? "This week"
        : "This month";
  const summaryDate = document.getElementById("statsSummaryDate");
  if (summaryDate) {
    summaryDate.textContent = rangeLabel;
  }
  if (statsThemeControl) {
    statsThemeControl.classList.toggle("hidden", currentStatsPanel !== "usage");
  }
  statsPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === currentStatsPanel);
  });
  statsTrendRangeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.range === currentTrendRange);
  });
  statsTaskRangeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.range === currentTaskRange);
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

  if (statsList) {
    const entries = Object.entries(listSource).sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (!entries.length) {
      statsList.innerHTML = `<p style="color: var(--color-muted); font-size: var(--font-small);">No data yet.</p>`;
      renderDonut([], 0, currentStatsTheme);
    } else {
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
    }
  }

  if (statsStacked) {
    renderTimeline(state, keys);
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
  renderTaskLists(state, keys);
  renderMetrics(state, keys);
  renderSessions(state, keys);
  renderTimeMachine(state);

  const todayWindow = getRangeWindow("day", 0);
  const yesterdayWindow = getRangeWindow("day", -1);
  const weekWindow = getRangeWindow("week", 0);
  const prevWeekWindow = getRangeWindow("week", -1);
  const todayKeys = getRangeKeysBetween(todayWindow.start, todayWindow.end);
  const yesterdayKeys = getRangeKeysBetween(yesterdayWindow.start, yesterdayWindow.end);
  const weekKeys = getRangeKeysBetween(weekWindow.start, weekWindow.end);
  const prevWeekKeys = getRangeKeysBetween(prevWeekWindow.start, prevWeekWindow.end);
  const todayTotals = buildFocusTotals(state, todayKeys);
  const yesterdayTotals = buildFocusTotals(state, yesterdayKeys);
  const weekTotals = buildFocusTotals(state, weekKeys);
  const prevWeekTotals = buildFocusTotals(state, prevWeekKeys);
  const todayChange =
    yesterdayTotals.totalMs > 0
      ? Math.round(((todayTotals.totalMs - yesterdayTotals.totalMs) / yesterdayTotals.totalMs) * 100)
      : 0;
  const weekChange =
    prevWeekTotals.totalMs > 0
      ? Math.round(((weekTotals.totalMs - prevWeekTotals.totalMs) / prevWeekTotals.totalMs) * 100)
      : 0;
  if (statsSummaryToday) {
    statsSummaryToday.textContent = formatDuration(todayTotals.totalMs);
  }
  if (statsSummaryTodayChange) {
    statsSummaryTodayChange.textContent = `${todayChange}% vs yesterday`;
  }
  if (statsSummaryWeek) {
    statsSummaryWeek.textContent = formatDuration(weekTotals.totalMs);
  }
  if (statsSummaryWeekChange) {
    statsSummaryWeekChange.textContent = `${weekChange}% vs last week`;
  }
  if (statsSummaryAvg) {
    statsSummaryAvg.textContent = formatDuration(weekTotals.dailyAvg);
  }
  const weekBuckets = buildStackedTrendBuckets(state, "week", weekWindow.start, weekWindow.end);
  renderTrendChart(statsSummaryChart, weekBuckets);

  const renderTrendView = (
    range: "day" | "week" | "month" | "year",
    offset: number,
    taskId: string | null,
    chartEl: HTMLElement | null,
    labelEl: HTMLElement | null,
    rangeEl: HTMLElement | null,
    titleEl?: HTMLElement | null,
    totalEl?: HTMLElement | null,
    changeEl?: HTMLElement | null,
    avgEl?: HTMLElement | null,
    avgChangeEl?: HTMLElement | null
  ) => {
    const { start, end } = getRangeWindow(range, offset);
    const keys = getRangeKeysBetween(start, end);
    const prevWindow = getRangeWindow(range, offset - 1);
    const prevKeys = getRangeKeysBetween(prevWindow.start, prevWindow.end);
    const currentTotals = buildFocusTotals(state, keys, taskId);
    const prevTotals = buildFocusTotals(state, prevKeys, taskId);
    const pctChange =
      prevTotals.totalMs > 0
        ? Math.round(((currentTotals.totalMs - prevTotals.totalMs) / prevTotals.totalMs) * 100)
        : 0;
    const avgChange =
      prevTotals.dailyAvg > 0
        ? Math.round(((currentTotals.dailyAvg - prevTotals.dailyAvg) / prevTotals.dailyAvg) * 100)
        : 0;
    if (labelEl) {
      labelEl.textContent =
        range === "day" && offset === 0 ? "Today" : formatRangeLabel(start, end);
    }
    if (rangeEl) {
      rangeEl.textContent = formatRangeLabel(start, end);
    }
    if (titleEl && taskId) {
      const task = state.tasks.items.find((item) => item.id === taskId);
      titleEl.textContent = task?.title ?? "Task";
    }
    const buckets = buildStackedTrendBuckets(state, range, start, end, taskId);
    renderTrendChart(chartEl, buckets);
    if (totalEl) {
      totalEl.textContent = formatDuration(currentTotals.totalMs);
    }
    if (changeEl) {
      changeEl.textContent = `${pctChange}% vs last`;
    }
    if (avgEl) {
      avgEl.textContent = formatDuration(currentTotals.dailyAvg);
    }
    if (avgChangeEl) {
      avgChangeEl.textContent = `${avgChange}% vs last`;
    }
  };

  renderTrendView(
    currentTrendRange,
    currentTrendOffset,
    null,
    statsTrendChart,
    statsDateLabel,
    statsDateRange,
    null,
    statsTrendTotal,
    statsTrendChange,
    statsTrendAvg,
    statsTrendAvgChange
  );
  renderTrendView(
    currentTaskRange,
    currentTaskOffset,
    currentStatsTaskId,
    statsTaskChart,
    statsTaskDateLabel,
    statsTaskRange,
    statsTaskTitle,
    statsTaskTotal,
    statsTaskChange,
    statsTaskAvg,
    statsTaskAvgChange
  );
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

const renderConfirmationPrompt = (enabled: boolean) => {
  if (confirmToggle) {
    confirmToggle.checked = enabled;
  }
};


const renderLinks = () => {
  if (reviewLink) {
    if (!REVIEW_URL) {
      reviewLink.removeAttribute("href");
      reviewLink.setAttribute("aria-disabled", "true");
      reviewLink.textContent = "Review (coming soon)";
    } else {
      reviewLink.href = REVIEW_URL;
      reviewLink.target = "_blank";
      reviewLink.rel = "noreferrer";
      reviewLink.removeAttribute("aria-disabled");
      reviewLink.textContent = "Review";
    }
  }
  if (versionLabel) {
    const version = chrome.runtime.getManifest().version;
    versionLabel.textContent = `Version ${version}`;
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

  const active = INTERVENTION_DEFS.find((item) => interventions.enabled[item.key]);
  if (interventionCurrent) {
    interventionCurrent.textContent = active ? active.label : "None";
  }

  interventionList.innerHTML = INTERVENTION_DEFS.map((item) => {
    const enabled = interventions.enabled[item.key];
    return `
      <div class="intervention-card" data-intervention="${item.key}">
        <div class="intervention-title">${item.label}</div>
        <p class="intervention-desc">${item.detail}</p>
        <div class="intervention-controls">
          <label class="intervention-pill">
            <input
              type="radio"
              name="interventionMode"
              data-toggle="${item.key}"
              ${enabled ? "checked" : ""}
            />
            <span class="${enabled ? "is-active" : "is-inactive"}">${enabled ? "Active" : "Inactive"}</span>
          </label>
          <button class="intervention-gear" type="button" data-intervention-settings="${item.key}" aria-label="Open settings">
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
               <path d="M10 6.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Zm7.1 3.8a7 7 0 0 0-.1-1.2l2-1.5-1.8-3.1-2.4.9a7 7 0 0 0-2-1.2l-.4-2.6H7.6l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-.9L1 7.3l2 1.5a7 7 0 0 0 0 2.4L1 12.7l1.8 3.1 2.4-.9a7 7 0 0 0 2 1.2l.4 2.6h4.8l.4-2.6a7 7 0 0 0 2-1.2l2.4.9 1.8-3.1-2-1.5c.1-.4.1-.8.1-1.2Z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" /> 
<!--              <path d="M10 6.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Zm7.1 3.8a7 7 0 0 0-.1-1.2l2-1.5-1.8-3.1-2.4.9a7 7 0 0 0-2-1.2l-.4-2.6H7.6l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-.9L1 7.3l2 1.5a7 7 0 0 0 0 2.4L1 12.7l1.8 3.1 2.4-.9a7 7 0 0 0 2 1.2l.4 2.6h4.8l.4-2.6a7 7 0 0 0 2-1.2l2.4.9 1.8-3.1-2-1.5c.1-.4.1-.8.1-1.2Z" fill="currentColor" />-->
            </svg>
          </button>
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

const setInterventionDisclosure = (open: boolean) => {
  if (!interventionDisclosure || !interventionToggle) {
    return;
  }
  interventionDisclosure.classList.toggle("is-open", open);
  interventionToggle.setAttribute("aria-expanded", open ? "true" : "false");
  if (interventionPanel) {
    interventionPanel.setAttribute("aria-hidden", open ? "false" : "true");
  }
};

const getTaskPomodoroConfig = (task: StorageSchema["tasks"]["items"][number] | null) => {
  if (!task) {
    return { ...DEFAULT_POMODORO };
  }
  return {
    workMin:
      typeof task.pomodoroWorkMin === "number"
        ? task.pomodoroWorkMin
        : DEFAULT_POMODORO.workMin,
    breakMin:
      typeof task.pomodoroBreakMin === "number"
        ? task.pomodoroBreakMin
        : DEFAULT_POMODORO.breakMin,
    cycles:
      typeof task.pomodoroCycles === "number"
        ? task.pomodoroCycles
        : DEFAULT_POMODORO.cycles
  };
};

const formatTaskPomodoro = (config: { workMin: number; breakMin: number; cycles: number }) => {
  const cycleLabel = config.cycles === 0 ? "Endless" : `${config.cycles} cycles`;
  return `${config.workMin}m focus · ${config.breakMin}m break · ${cycleLabel}`;
};


const deleteTaskById = async (taskId: string) => {
  const state = await getState();
  const items = state.tasks.items.filter((item) => item.id !== taskId);
  const isActive = state.pomodoro.lastTaskId === taskId;
  const pomodoroUpdate = isActive
    ? state.pomodoro.running
      ? { lastTaskId: null }
      : {
          lastTaskId: null,
          workMin: DEFAULT_POMODORO.workMin,
          breakMin: DEFAULT_POMODORO.breakMin,
          cycles: DEFAULT_POMODORO.cycles
        }
    : { lastTaskId: state.pomodoro.lastTaskId ?? null };
  await setState({
    tasks: { items },
    pomodoro: pomodoroUpdate
  });
};

const syncTaskCyclesInput = () => {
  if (!taskCycles || !taskEndless) {
    return;
  }
  const endlessOn = taskEndless.checked;
  taskCycles.disabled = endlessOn;
};

const openTaskModal = (task: StorageSchema["tasks"]["items"][number] | null) => {
  currentTaskEditId = task?.id ?? null;
  if (taskModalTitle) {
    taskModalTitle.textContent = task ? "Edit task" : "New task";
  }
  if (taskName) {
    taskName.value = task?.title ?? "";
  }
  const config = getTaskPomodoroConfig(task);
  if (taskWork) {
    taskWork.value = String(config.workMin);
  }
  if (taskBreak) {
    taskBreak.value = String(config.breakMin);
  }
  if (taskEndless) {
    taskEndless.checked = config.cycles === 0;
  }
  if (taskCycles) {
    taskCycles.value = String(config.cycles === 0 ? 1 : config.cycles);
  }
  if (taskColor) {
    taskColor.value = task?.color ?? "#9cff3a";
  }
  syncTaskCyclesInput();
  if (taskDelete) {
    taskDelete.classList.toggle("hidden", !task);
  }
  openModal("task");
};

const openTaskSelectPrompt = (taskId: string | null) => {
  const title = taskId
    ? currentTasks?.items.find((item) => item.id === taskId)?.title ?? "Task"
    : "Default";
  pendingTaskSelectId = taskId;
  if (taskSelectLabel) {
    taskSelectLabel.textContent = `Set "${title}" as active?`;
  }
  openModal("taskSelectConfirm");
};

const setActiveTask = async (taskId: string | null) => {
  const state = await getState();
  const task = taskId
    ? state.tasks.items.find((item) => item.id === taskId) ?? null
    : null;
  const config = getTaskPomodoroConfig(task);
  if (state.pomodoro.running) {
    await setState({
      pomodoro: {
        lastTaskId: task ? task.id : null
      }
    });
  } else {
    await setState({
      pomodoro: {
        lastTaskId: task ? task.id : null,
        workMin: config.workMin,
        breakMin: config.breakMin,
        cycles: config.cycles
      }
    });
  }
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

  if (viewId === "stats") {
    setStatsSubview(currentStatsSubview);
  }
};

const setStatsSubview = (view: "summary" | "trend" | "task") => {
  currentStatsSubview = view;
  statsSummaryView?.classList.toggle("active", view === "summary");
  statsTrendView?.classList.toggle("active", view === "trend");
  statsTaskView?.classList.toggle("active", view === "task");
};

const openTaskStats = async (taskId: string) => {
  const state = await getState();
  const task = state.tasks.items.find((item) => item.id === taskId);
  currentStatsTaskId = taskId;
  if (statsTaskTitle) {
    statsTaskTitle.textContent = task?.title ?? "Task";
  }
  setStatsSubview("task");
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
    if (!next) {
      const state = await getState();
      if (state.confirmationPrompt) {
        pendingFocusOff = true;
        if (toggleEl) {
          toggleEl.checked = true;
        }
        openModal("focusOffConfirm");
        return;
      }
    }
    await setState({
      focusEnabled: next,
      pause: { isPaused: false, pauseType: null, pauseEndAt: null }
    });
  });

  overlayToggle?.addEventListener("change", async () => {
    await setState({ overlayMode: overlayToggle.checked });
  });

  confirmToggle?.addEventListener("change", async () => {
    await setState({ confirmationPrompt: confirmToggle.checked });
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

  pomodoroStart?.addEventListener("click", async () => {
    if (currentStrictActive) {
      return;
    }
    const state = await getState();
    const activeTask = state.pomodoro.lastTaskId
      ? state.tasks.items.find((item) => item.id === state.pomodoro.lastTaskId) ?? null
      : null;
    const config = getTaskPomodoroConfig(activeTask);
    const now = Date.now();
    const endsAt = now + config.workMin * 60 * 1000;
    await setState({
      focusEnabled: state.pomodoro.autoBlockDuringWork ? true : currentFocusEnabled,
      pomodoro: {
        workMin: config.workMin,
        breakMin: config.breakMin,
        cycles: config.cycles,
        autoBlockDuringWork: state.pomodoro.autoBlockDuringWork,
        blockDuringBreak: state.pomodoro.blockDuringBreak,
        lastTaskId: activeTask?.id ?? null,
        running: {
          phase: "work",
          startedAt: now,
          endsAt,
          cycleIndex: 0,
          paused: false,
          linkedTaskId: activeTask?.id ?? null,
          prevFocusEnabled: currentFocusEnabled
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

  taskAdd?.addEventListener("click", () => {
    openTaskModal(null);
  });

  taskShowAll?.addEventListener("click", () => {
    openModal("taskPicker");
  });

  taskActiveSettings?.addEventListener("click", () => {
    const taskId = taskActiveSettings.getAttribute("data-task-settings");
    if (!taskId || !currentTasks) {
      return;
    }
    const task = currentTasks.items.find((item) => item.id === taskId) ?? null;
    if (!task) {
      return;
    }
    openTaskModal(task);
  });

  taskEndless?.addEventListener("change", () => {
    syncTaskCyclesInput();
    if (taskCycles && taskEndless && !taskEndless.checked && !taskCycles.value) {
      taskCycles.value = "1";
    }
  });

  taskSave?.addEventListener("click", async () => {
    const name = taskName?.value.trim() ?? "";
    if (!name) {
      return;
    }
    const work = clamp(Number(taskWork?.value ?? DEFAULT_POMODORO.workMin), 1, 120);
    const rest = clamp(Number(taskBreak?.value ?? DEFAULT_POMODORO.breakMin), 1, 60);
    const cycles = taskEndless?.checked
      ? 0
      : clamp(Number(taskCycles?.value ?? 1), 1, 12);
    const color = taskColor?.value ?? "#9cff3a";
    const state = await getState();
    const items = [...state.tasks.items];
    if (currentTaskEditId) {
      const index = items.findIndex((item) => item.id === currentTaskEditId);
      if (index >= 0) {
        items[index] = {
          ...items[index],
          title: name,
          color,
          pomodoroWorkMin: work,
          pomodoroBreakMin: rest,
          pomodoroCycles: cycles,
          estimateMin: items[index].estimateMin ?? work
        };
      }
    } else {
      const newTask = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title: name,
        color,
        pomodoroWorkMin: work,
        pomodoroBreakMin: rest,
        pomodoroCycles: cycles,
        estimateMin: work,
        createdAt: Date.now(),
        focusSessionsCompleted: 0
      };
      items.push(newTask);
    }
    const isActive = state.pomodoro.lastTaskId === currentTaskEditId;
    const pomodoroUpdate =
      isActive && !state.pomodoro.running
        ? { workMin: work, breakMin: rest, cycles, lastTaskId: currentTaskEditId }
        : { lastTaskId: state.pomodoro.lastTaskId ?? null };
    await setState({ tasks: { items }, pomodoro: pomodoroUpdate });
    closeModal("task");
  });

  taskDelete?.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!currentTaskEditId) {
      return;
    }
    currentTaskDeleteId = currentTaskEditId;
    openModal("taskDeleteConfirm");
  });

  taskDeleteConfirm?.addEventListener("click", async () => {
    if (!currentTaskDeleteId) {
      return;
    }
    await deleteTaskById(currentTaskDeleteId);
    currentTaskDeleteId = null;
    closeModal("taskDeleteConfirm");
    closeModal("task");
  });

  taskDeleteCancel?.addEventListener("click", () => {
    currentTaskDeleteId = null;
    closeModal("taskDeleteConfirm");
  });

  const handleTaskSelectClick = (event: MouseEvent, closePicker?: boolean) => {
    const target = event.target as HTMLElement;
    const settingsButton = target.closest<HTMLElement>("[data-task-settings]");
    if (settingsButton) {
      const taskId = settingsButton.getAttribute("data-task-settings");
      if (!taskId || !currentTasks) {
        return;
      }
      const task = currentTasks.items.find((item) => item.id === taskId) ?? null;
      if (!task) {
        return;
      }
      openTaskModal(task);
      return;
    }
    const card = target.closest<HTMLElement>("[data-task-select]");
    if (!card) {
      return;
    }
    const isDefault = card.hasAttribute("data-task-default");
    const taskId = isDefault ? null : card.getAttribute("data-task-id");
    if (!isDefault && !taskId) {
      return;
    }
    if (closePicker) {
      closeModal("taskPicker");
    }
    openTaskSelectPrompt(taskId);
  };

  taskQuickGrid?.addEventListener("click", (event) => {
    handleTaskSelectClick(event);
  });

  taskAllGrid?.addEventListener("click", (event) => {
    handleTaskSelectClick(event, true);
  });

  taskSelectConfirm?.addEventListener("click", async () => {
    if (pendingTaskSelectId === undefined) {
      return;
    }
    await setActiveTask(pendingTaskSelectId ?? null);
    pendingTaskSelectId = undefined;
    closeModal("taskSelectConfirm");
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
      strictSession: { active: true, endsAt, startedAt, prevFocusEnabled: currentFocusEnabled }
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

  focusOffConfirm?.addEventListener("click", async () => {
    pendingFocusOff = false;
    await setState({
      focusEnabled: false,
      pause: { isPaused: false, pauseType: null, pauseEndAt: null }
    });
    closeModal("focusOffConfirm");
  });

  focusOffCancel?.addEventListener("click", () => {
    pendingFocusOff = false;
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
      renderStats(state);
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
      renderStats(state);
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
      renderStats(state);
    });
  });

  statsFocusButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const mode = button.dataset.focusMode as "focus" | "distraction" | undefined;
      if (!mode) {
        return;
      }
      currentFocusView = mode;
      const state = await getState();
      renderStats(state);
    });
  });

  statsShowAll?.addEventListener("click", () => {
    setStatsSubview("trend");
  });

  statsTrendCard?.addEventListener("click", () => {
    setStatsSubview("trend");
  });

  statsTrendCard?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    setStatsSubview("trend");
  });

  statsBack?.addEventListener("click", () => {
    setStatsSubview("summary");
  });

  statsTaskBack?.addEventListener("click", () => {
    setStatsSubview("trend");
  });

  statsTrendRangeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const range = button.dataset.range as "day" | "week" | "month" | "year" | undefined;
      if (!range) {
        return;
      }
      currentTrendRange = range;
      currentTrendOffset = 0;
      statsTrendRangeButtons.forEach((btn) => {
        btn.classList.toggle("active", btn === button);
      });
      void getState().then((nextState) => renderStats(nextState));
    });
  });

  statsTaskRangeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const range = button.dataset.range as "day" | "week" | "month" | "year" | undefined;
      if (!range) {
        return;
      }
      currentTaskRange = range;
      currentTaskOffset = 0;
      statsTaskRangeButtons.forEach((btn) => {
        btn.classList.toggle("active", btn === button);
      });
      void getState().then((nextState) => renderStats(nextState));
    });
  });

  statsDatePrev?.addEventListener("click", () => {
    currentTrendOffset -= 1;
    void getState().then((nextState) => renderStats(nextState));
  });

  statsDateNext?.addEventListener("click", () => {
    currentTrendOffset += 1;
    void getState().then((nextState) => renderStats(nextState));
  });

  statsTaskDatePrev?.addEventListener("click", () => {
    currentTaskOffset -= 1;
    void getState().then((nextState) => renderStats(nextState));
  });

  statsTaskDateNext?.addEventListener("click", () => {
    currentTaskOffset += 1;
    void getState().then((nextState) => renderStats(nextState));
  });

  statsSummaryTasks?.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const row = target.closest<HTMLElement>(".stats-task-row");
    const taskId = row?.getAttribute("data-task-id");
    if (!taskId) {
      return;
    }
    void openTaskStats(taskId);
  });

  statsTrendTasks?.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const row = target.closest<HTMLElement>(".stats-task-row");
    const taskId = row?.getAttribute("data-task-id");
    if (!taskId) {
      return;
    }
    void openTaskStats(taskId);
  });

  timeMachineDays?.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>("[data-day]");
    if (!button) {
      return;
    }
    const dayKey = button.dataset.day ?? "";
    if (!dayKey) {
      return;
    }
    currentTimeMachineDay = dayKey;
    const state = await getState();
    renderTimeMachine(state);
  });

  const csvEscape = (value: string | number | null | undefined) => {
    const raw = value === null || value === undefined ? "" : String(value);
    if (raw.includes(",") || raw.includes("\"") || raw.includes("\n")) {
      return `"${raw.replace(/\"/g, "\"\"")}"`;
    }
    return raw;
  };

  const downloadCsv = (filename: string, rows: Array<Array<string | number | null | undefined>>) => {
    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  exportSessionsCsv?.addEventListener("click", async () => {
    const state = await getState();
    const keys = getRangeKeys(currentStatsRange);
    const keySet = new Set(keys);
    const taskLookup = new Map(state.tasks.items.map((item) => [item.id, item.title]));
    const rows: Array<Array<string | number | null | undefined>> = [
      ["id", "type", "startedAt", "endedAt", "durationMin", "task", "focusEnabledDuring", "distractions"]
    ];
    state.analytics.sessions
      .filter((session) => keySet.has(getDayKey(new Date(session.startedAt))))
      .forEach((session) => {
        const durationMin = Math.round(
          Math.max(0, session.endedAt - session.startedAt) / 60000
        );
        rows.push([
          session.id,
          session.type,
          new Date(session.startedAt).toISOString(),
          new Date(session.endedAt).toISOString(),
          durationMin,
          session.taskId ? taskLookup.get(session.taskId) ?? "" : "",
          session.focusEnabledDuring ? "true" : "false",
          session.distractions
        ]);
      });
    downloadCsv(`focusboss-sessions-${currentStatsRange}.csv`, rows);
  });

  exportUsageCsv?.addEventListener("click", async () => {
    const state = await getState();
    const keys = getRangeKeys(currentStatsRange);
    const rows: Array<Array<string | number | null | undefined>> = [
      ["day", "domain", "totalMs", "blockedMs"]
    ];
    keys.forEach((key) => {
      const day = state.analytics.byDay[key];
      if (!day) {
        return;
      }
      const blockedByDomain = day.byDomainBlocked ?? {};
      Object.entries(day.byDomain ?? {}).forEach(([host, value]) => {
        rows.push([key, host, value, blockedByDomain[host] ?? 0]);
      });
    });
    downloadCsv(`focusboss-usage-${currentStatsRange}.csv`, rows);
  });

  interventionToggle?.addEventListener("click", () => {
    const isOpen = interventionDisclosure?.classList.contains("is-open");
    setInterventionDisclosure(!isOpen);
  });

  const setActiveIntervention = async (key: InterventionKey) => {
    const enabled = Object.fromEntries(
      INTERVENTION_DEFS.map((item) => [item.key, item.key === key])
    ) as StorageSchema["interventions"]["enabled"];
    await setState({ interventions: { enabled } });
    setInterventionDisclosure(false);
  };

  interventionList?.addEventListener("change", async (event) => {
    const target = event.target as HTMLInputElement;
    const key = target.dataset.toggle as InterventionKey | undefined;
    if (!key) {
      return;
    }
    await setActiveIntervention(key);
  });

  interventionList?.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;
    const settingsButton = target.closest<HTMLElement>("[data-intervention-settings]");
    if (settingsButton) {
      const key = settingsButton.getAttribute("data-intervention-settings") as InterventionKey | null;
      if (!key) {
        return;
      }
      const state = await getState();
      showInterventionDetail(key, state.interventions);
      return;
    }
    if (target.closest("label")) {
      return;
    }
    const card = target.closest<HTMLElement>("[data-intervention]");
    const key = card?.getAttribute("data-intervention") as InterventionKey | null;
    if (!key) {
      return;
    }
    await setActiveIntervention(key);
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
        if (modalId === "focusOffConfirm") {
          pendingFocusOff = false;
        }
        closeModal(modalId);
      }
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const modal = document.querySelector(".modal:not(.hidden)");
      const modalId = modal?.getAttribute("data-modal");
      if (modalId) {
        if (modalId === "focusOffConfirm") {
          pendingFocusOff = false;
        }
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

const syncUiFromState = (state: Awaited<ReturnType<typeof getState>>) => {
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
  renderConfirmationPrompt(state.confirmationPrompt);
  currentStatsRange = state.analytics.chartRange;
  currentStatsFilter = state.analytics.chartFilter;
  currentStatsTheme = normalizeThemeId(state.analytics.chartThemeId);
  renderStrictSession(state.strictSession);
  renderStrictOverlay(state.strictSession);
  renderTasks(state.tasks, state.pomodoro);
  renderPomodoro(state.pomodoro, state.strictSession.active);
  renderLists(state.lists);
  renderInterventions(state.interventions);
  renderStats(state);
  renderSchedules(state.schedule);
};

// --- Bootstrap (initial load + subscriptions) ---
const bootstrap = async () => {
  bindEvents();
  const state = await getState();
  try {
    syncUiFromState(state);
    renderLinks();
    setActiveView("home");
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
    syncUiFromState(nextState);
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
