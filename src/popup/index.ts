import { getState, setState, subscribeState } from "../shared/storage.js";
import {
  BREATHING_TECHNIQUES,
  INTERVENTION_DEFS,
  type InterventionKey
} from "../shared/interventions.js";
import { SCHEMA_VERSION, defaultState, type StorageSchema } from "../shared/storageSchema.js";

// --- DOM references (grab once, reuse) ---
const statusPillText = document.getElementById("statusPillText");
const statusInfoTitle = document.getElementById("statusInfoTitle");
const statusInfoBody = document.getElementById("statusInfoBody");
const statusElements = Array.from(document.querySelectorAll<HTMLElement>(".status"));
const toggleEl = document.getElementById("focusToggle") as HTMLInputElement | null;
const appRoot = document.querySelector(".app");
const toastRegion = document.getElementById("toastRegion");
const rootEl = document.documentElement;
const navButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(".nav-btn"));
const navBar = document.querySelector<HTMLElement>(".app-nav");
const views = Array.from(document.querySelectorAll<HTMLElement>(".view"));
const themeControl = document.getElementById("themeControl");
const blockingStyleButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("#blockingStyleControl button")
);

const STORAGE_KEY = "focusBossState";
const POPUP_VIEW_KEY = "focusBossPopupView";
const POPUP_TAG_SETTINGS_KEY = "focusBossPopupTagSettings";
const TRASH_ICON_SVG = `
  <svg class="list-delete-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M4 7h16" />
    <path d="M9 7V5h6v2" />
    <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
`;
const confirmToggle = document.getElementById("confirmToggle") as HTMLInputElement | null;
const strictEmergencyToggle = document.getElementById(
  "strictEmergencyToggle"
) as HTMLInputElement | null;
const focusOffConfirm = document.getElementById("focusOffConfirm") as HTMLButtonElement | null;
const focusOffCancel = document.getElementById("focusOffCancel") as HTMLButtonElement | null;
const reviewLink = document.getElementById("reviewLink") as HTMLAnchorElement | null;
const versionLabel = document.getElementById("versionLabel");
const statsPomodoroRangeButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("#statsPomodoroRange button")
);
const statsUsageSummaryRangeButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("#statsUsageSummaryRange button")
);
const statsFocusSummaryRangeButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("#statsFocusSummaryRange button")
);
const statsTotalValue = document.getElementById("statsTotalValue");
const statsList = document.getElementById("statsList");
const domainStatsTitle = document.getElementById("domainStatsTitle");
const domainStatsBody = document.getElementById("domainStatsBody");
const statsStacked = document.getElementById("statsStacked");
const statsHeatmap = document.getElementById("statsHeatmap");
const statsCardTabs = document.getElementById("statsCardTabs");
const statsPanels = Array.from(
  document.querySelectorAll<HTMLElement>(".stats-panel")
);
const statsFocusButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("#statsFocusToggle button")
);
const statsSummaryView = document.getElementById("statsSummaryView");
const statsSegmentToggle = document.getElementById("statsSegmentToggle");
const statsSegmentButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("#statsSegmentToggle button")
);
const statsPomodoroSegment = document.getElementById("statsPomodoroSegment");
const statsFocusSegment = document.getElementById("statsFocusSegment");
const statsUsageSegment = document.getElementById("statsUsageSegment");
const statsTrendView = document.getElementById("statsTrendView");
const statsUsageTrendView = document.getElementById("statsUsageTrendView");
const statsTagView = document.getElementById("statsTagView");
const statsBack = document.getElementById("statsBack") as HTMLButtonElement | null;
const statsUsageBack = document.getElementById("statsUsageBack") as HTMLButtonElement | null;
const statsTagBack = document.getElementById("statsTagBack") as HTMLButtonElement | null;
const statsShowAll = document.getElementById("statsShowAll") as HTMLButtonElement | null;
const statsTrendCard = document.querySelector<HTMLElement>(".stats-trend-card");
const statsUsageTrendCard = document.getElementById("statsUsageTrendCard");
const statsSummaryTags = document.getElementById("statsSummaryTags");
const statsUsageToday = document.getElementById("statsUsageToday");
const statsUsageTodayChange = document.getElementById("statsUsageTodayChange");
const statsUsageWeek = document.getElementById("statsUsageWeek");
const statsUsageWeekChange = document.getElementById("statsUsageWeekChange");
const statsUsageAvg = document.getElementById("statsUsageAvg");
const statsUsageChart = document.getElementById("statsUsageChart");
const statsUsageHeatmap = document.getElementById("statsUsageHeatmap");
const statsUsageDate = document.getElementById("statsUsageDate");
const statsFocusDate = document.getElementById("statsFocusDate");
const statsFocusTotalTime = document.getElementById("statsFocusTotalTime");
const statsFocusManualTime = document.getElementById("statsFocusManualTime");
const statsFocusManualCount = document.getElementById("statsFocusManualCount");
const statsFocusPauseTime = document.getElementById("statsFocusPauseTime");
const statsFocusPauseCount = document.getElementById("statsFocusPauseCount");
const statsFocusStrictTime = document.getElementById("statsFocusStrictTime");
const statsFocusStrictCount = document.getElementById("statsFocusStrictCount");
const statsFocusPomodoroTime = document.getElementById("statsFocusPomodoroTime");
const statsFocusPomodoroCount = document.getElementById("statsFocusPomodoroCount");
const statsFocusReliability = document.getElementById("statsFocusReliability");
const statsFocusScheduleReliability = document.getElementById("statsFocusScheduleReliability");
const statsFocusLongestStreak = document.getElementById("statsFocusLongestStreak");
const statsFocusFirstPause = document.getElementById("statsFocusFirstPause");
const usageTotal = document.getElementById("usageTotal");
const usageBlocked = document.getElementById("usageBlocked");
const usageAllowed = document.getElementById("usageAllowed");
const usageOther = document.getElementById("usageOther");
const statsTrendTags = document.getElementById("statsTrendTags");
const statsTagTitle = document.getElementById("statsTagTitle");
const statsSummaryToday = document.getElementById("statsSummaryToday");
const statsSummaryTodayChange = document.getElementById("statsSummaryTodayChange");
const statsSummaryWeek = document.getElementById("statsSummaryWeek");
const statsSummaryWeekChange = document.getElementById("statsSummaryWeekChange");
const statsSummaryAvg = document.getElementById("statsSummaryAvg");
const statsSummaryChart = document.getElementById("statsSummaryChart");
const statsUsageTrendTotal = document.getElementById("statsUsageTrendTotal");
const statsUsageTrendChange = document.getElementById("statsUsageTrendChange");
const statsUsageTrendAvg = document.getElementById("statsUsageTrendAvg");
const statsUsageTrendAvgChange = document.getElementById("statsUsageTrendAvgChange");
const pomodoroSummaryTabButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("#pomodoroSummaryTabs button")
);
const pomodoroSummaryGroups = Array.from(
  document.querySelectorAll<HTMLElement>(".pomodoro-summary-group")
);
const focusSummaryTabButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("#focusSummaryTabs button")
);
const focusSummaryGroups = Array.from(
  document.querySelectorAll<HTMLElement>(".focus-summary-group")
);
const statsUsageTrendChart = document.getElementById("statsUsageTrendChart");
const statsUsageTrendRangeButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("#statsUsageTrendRange button")
);
const statsUsageTrendFilterButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("#statsUsageTrendFilter button")
);
const statsUsageDateLabel = document.getElementById("statsUsageDateLabel");
const statsUsageDatePrev = document.getElementById("statsUsageDatePrev") as HTMLButtonElement | null;
const statsUsageDateNext = document.getElementById("statsUsageDateNext") as HTMLButtonElement | null;
const statsDateLabel = document.getElementById("statsDateLabel");
const statsDatePrev = document.getElementById("statsDatePrev") as HTMLButtonElement | null;
const statsDateNext = document.getElementById("statsDateNext") as HTMLButtonElement | null;
const statsDateRange = document.getElementById("statsDateRange");
const statsTrendRangeButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("#statsTrendRange button")
);
const statsTrendChart = document.getElementById("statsTrendChart");
const statsTagDateLabel = document.getElementById("statsTagDateLabel");
const statsTagDatePrev = document.getElementById("statsTagDatePrev") as HTMLButtonElement | null;
const statsTagDateNext = document.getElementById("statsTagDateNext") as HTMLButtonElement | null;
const statsTagRange = document.getElementById("statsTagRange");
const statsTagRangeButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("#statsTagRangeToggle button")
);
const statsTagChart = document.getElementById("statsTagChart");
const statsTrendTotal = document.getElementById("statsTrendTotal");
const statsTrendChange = document.getElementById("statsTrendChange");
const statsTrendAvg = document.getElementById("statsTrendAvg");
const statsTrendAvgChange = document.getElementById("statsTrendAvgChange");
const statsTagTotal = document.getElementById("statsTagTotal");
const statsTagChange = document.getElementById("statsTagChange");
const statsTagAvg = document.getElementById("statsTagAvg");
const statsTagAvgChange = document.getElementById("statsTagAvgChange");
const metricFocus = document.getElementById("metricFocus");
const metricBreak = document.getElementById("metricBreak");
const metricTags = document.getElementById("metricTags");
const metricTagsInterrupted = document.getElementById("metricTagsInterrupted");
const metricDistraction = document.getElementById("metricDistraction");
const metricPomodoroTime = document.getElementById("metricPomodoroTime");
const metricPomodoroReliability = document.getElementById("metricPomodoroReliability");
const metricPomodoroPauseBurden = document.getElementById("metricPomodoroPauseBurden");
const statsSessions = document.getElementById("statsSessions");
const timeMachineDays = document.getElementById("timeMachineDays");
const timeMachineDetails = document.getElementById("timeMachineDetails");
const exportSessionsCsv = document.getElementById("exportSessionsCsv") as HTMLButtonElement | null;
const exportPomodoroJson = document.getElementById("exportPomodoroJson") as HTMLButtonElement | null;
const exportFocusCsv = document.getElementById("exportFocusCsv") as HTMLButtonElement | null;
const exportFocusJson = document.getElementById("exportFocusJson") as HTMLButtonElement | null;
const exportUsageCsv = document.getElementById("exportUsageCsv") as HTMLButtonElement | null;
const exportUsageJson = document.getElementById("exportUsageJson") as HTMLButtonElement | null;
const exportBlockedCsv = document.getElementById("exportBlockedCsv") as HTMLButtonElement | null;
const scheduleAdd = document.getElementById("scheduleAdd");
const scheduleList = document.getElementById("scheduleList");
const scheduleTitle = document.getElementById("scheduleTitle");
const scheduleName = document.getElementById("scheduleName") as HTMLInputElement | null;
const scheduleStart = document.getElementById("scheduleStart") as HTMLInputElement | null;
const scheduleEnd = document.getElementById("scheduleEnd") as HTMLInputElement | null;
const scheduleDays = document.getElementById("scheduleDays");
const scheduleSave = document.getElementById("scheduleSave");
const backupIncludeAnalytics = document.getElementById(
  "backupIncludeAnalytics"
) as HTMLInputElement | null;
const backupDownload = document.getElementById("backupDownload") as HTMLButtonElement | null;
const restoreFile = document.getElementById("restoreFile") as HTMLInputElement | null;
const restoreFileButton = document.getElementById("restoreFileButton") as HTMLButtonElement | null;
const restoreFileName = document.getElementById("restoreFileName");
const restoreFileMeta = document.getElementById("restoreFileMeta");
const restoreIncludeAnalytics = document.getElementById(
  "restoreIncludeAnalytics"
) as HTMLInputElement | null;
const restoreModeButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("#restoreModeControl button")
);
const restoreApply = document.getElementById("restoreApply") as HTMLButtonElement | null;
const pomodoroTagPill = document.getElementById("pomodoroTagPill");
const pomodoroRing = document.getElementById("pomodoroRing") as SVGCircleElement | null;
const pomodoroTimerValue = document.getElementById("pomodoroTimerValue");
const pomodoroPhasePill = document.getElementById("pomodoroPhasePill");
const pomodoroCyclePill = document.getElementById("pomodoroCyclePill");
const pomodoroStart = document.getElementById("pomodoroStart") as HTMLButtonElement | null;
const pomodoroPause = document.getElementById("pomodoroPause") as HTMLButtonElement | null;
const pomodoroStop = document.getElementById("pomodoroStop") as HTMLButtonElement | null;
const pomodoroAutoBlock = document.getElementById("pomodoroAutoBlock") as HTMLInputElement | null;
const pomodoroBlockBreak = document.getElementById("pomodoroBlockBreak") as HTMLInputElement | null;
const pomodoroSounds = document.getElementById("pomodoroSounds") as HTMLInputElement | null;
const analyticsRetention = document.getElementById(
  "analyticsRetention"
) as HTMLSelectElement | null;
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
const strictOverlayUntil = document.getElementById("strictOverlayUntil");
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
const LIST_PREFILL_TTL_MS = 10_000;
let lastListPrefillAt = 0;
type AdvancedDraft = { source: string; allow: string[]; block: string[] };
let advancedDraft: AdvancedDraft | null = null;
let latestAdvancedText = "";
type AdvancedPatternMode = "allow" | "block";
let advancedPatternMode: AdvancedPatternMode = "allow";
type YoutubeExceptionMode = "allowed" | "blocked";
type YoutubeExceptionKind = "video" | "playlist";
let youtubeExceptionMode: YoutubeExceptionMode = "allowed";

const prefillListInputFromTab = async () => {
  if (!listInput) {
    return;
  }
  if (listInput.value.trim().length > 0) {
    return;
  }
  const tabUrl = await new Promise<string | null>((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]?.url ?? null);
    });
  });
  if (!tabUrl || (!tabUrl.startsWith("http://") && !tabUrl.startsWith("https://"))) {
    return;
  }
  if (currentEntryType === "domain") {
    try {
      listInput.value = new URL(tabUrl).hostname.replace(/^www\./i, "");
    } catch {
      return;
    }
  } else {
    listInput.value = tabUrl;
  }
};

const maybePrefillListInput = () => {
  const now = Date.now();
  if (now - lastListPrefillAt < LIST_PREFILL_TTL_MS) {
    return;
  }
  lastListPrefillAt = now;
  void prefillListInputFromTab();
};

const escapeHtml = (value: string) => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const buildAdvancedDraft = (text: string): AdvancedDraft => {
  const allow: string[] = [];
  const block: string[] = [];
  text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .forEach((line) => {
      if (line.startsWith("!")) {
        allow.push(line.slice(1).trim());
      } else {
        block.push(line);
      }
    });
  return { source: text, allow, block };
};

const ensureAdvancedDraft = (text: string) => {
  if (!advancedDraft || advancedDraft.source !== text) {
    advancedDraft = buildAdvancedDraft(text);
  }
};

const renderAdvancedList = (
  container: HTMLElement | null,
  values: string[],
  type: "allow" | "block"
) => {
  if (!container) {
    return;
  }
  if (values.length === 0) {
    container.innerHTML = "<p class=\"list-sub\" style=\"margin: 0;\">No rules yet.</p>";
    return;
  }
  container.innerHTML = values
    .map((value, index) => {
      const safe = escapeHtml(value);
      return `
        <div class="advanced-item" data-adv-type="${type}" data-index="${index}">
          <input class="text-input" value="${safe}" placeholder="example.com/path/*" />
          <button class="icon-btn icon-only list-delete-btn" type="button" data-adv-remove="true" aria-label="Remove rule">
            ${TRASH_ICON_SVG}
          </button>
        </div>
      `;
    })
    .join("");
};

const renderAdvancedDraft = () => {
  if (!advancedDraft) {
    return;
  }
  renderAdvancedList(advancedAllowList, advancedDraft.allow, "allow");
  renderAdvancedList(advancedBlockList, advancedDraft.block, "block");
};

const setAdvancedDraftValue = (type: "allow" | "block", index: number, value: string) => {
  if (!advancedDraft) {
    return;
  }
  const list = type === "allow" ? advancedDraft.allow : advancedDraft.block;
  if (index < 0 || index >= list.length) {
    return;
  }
  list[index] = value;
};

const removeAdvancedDraftValue = (type: "allow" | "block", index: number) => {
  if (!advancedDraft) {
    return;
  }
  const list = type === "allow" ? advancedDraft.allow : advancedDraft.block;
  list.splice(index, 1);
  renderAdvancedDraft();
};

const renderAdvancedPatternMode = () => {
  advancedPatternModeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === advancedPatternMode);
  });
  if (advancedAllowList) {
    advancedAllowList.classList.toggle("hidden", advancedPatternMode !== "allow");
  }
  if (advancedBlockList) {
    advancedBlockList.classList.toggle("hidden", advancedPatternMode !== "block");
  }
  advancedAllowExamples?.classList.toggle("hidden", advancedPatternMode !== "allow");
  advancedBlockExamples?.classList.toggle("hidden", advancedPatternMode !== "block");
};

const normalizeAdvancedValue = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      return `${url.hostname.replace(/^www\./i, "")}${url.pathname}${url.search}`;
    } catch {
      return trimmed;
    }
  }
  return trimmed.replace(/^www\./i, "");
};

const prefillAdvancedInputFromTab = async () => {
  if (!advancedPatternInput || advancedPatternInput.value.trim().length > 0) {
    return;
  }
  const tabUrl = await new Promise<string | null>((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]?.url ?? null);
    });
  });
  if (!tabUrl || (!tabUrl.startsWith("http://") && !tabUrl.startsWith("https://"))) {
    return;
  }
  try {
    const url = new URL(tabUrl);
    advancedPatternInput.value = `${url.hostname.replace(/^www\./i, "")}${url.pathname}${url.search}`;
  } catch {
    return;
  }
};

const extractYoutubeId = (kind: YoutubeExceptionKind, raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    const host = url.hostname.replace(/^www\./i, "");
    if (!host.endsWith("youtube.com") && host !== "youtu.be") {
      return trimmed;
    }
    if (kind === "video") {
      if (host === "youtu.be") {
        return url.pathname.replace("/", "").trim();
      }
      return url.searchParams.get("v") ?? "";
    }
    if (kind === "playlist") {
      return url.searchParams.get("list") ?? "";
    }
  } catch {
    return trimmed;
  }
  return trimmed;
};

const prefillYoutubeExceptionFromTab = async () => {
  if (!youtubeExceptionInput || !youtubeExceptionType) {
    return;
  }
  const tabUrl = await new Promise<string | null>((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]?.url ?? null);
    });
  });
  if (!tabUrl || (!tabUrl.startsWith("http://") && !tabUrl.startsWith("https://"))) {
    return;
  }
  const kind = youtubeExceptionType.value as YoutubeExceptionKind;
  const parsed = extractYoutubeId(kind, tabUrl);
  youtubeExceptionInput.value = parsed || tabUrl;
  youtubeExceptionInput.focus();
};

const getYoutubeListKey = (mode: YoutubeExceptionMode, kind: YoutubeExceptionKind) => {
  if (mode === "allowed") {
    return kind === "video" ? "allowedVideos" : "allowedPlaylists";
  }
  return kind === "video" ? "blockedVideos" : "blockedPlaylists";
};

const renderYoutubeExceptions = (lists: StorageSchema["lists"]) => {
  if (!youtubeExceptionItems || !youtubeExceptionType) {
    return;
  }
  youtubeModeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === youtubeExceptionMode);
  });
  const kind = (youtubeExceptionType.value as YoutubeExceptionKind) ?? "video";
  const youtubeLists = lists.youtubeExceptions ?? {
    allowedVideos: [],
    blockedVideos: [],
    allowedPlaylists: [],
    blockedPlaylists: []
  };
  const allowedCount = youtubeLists.allowedVideos.length + youtubeLists.allowedPlaylists.length;
  const blockedCount = youtubeLists.blockedVideos.length + youtubeLists.blockedPlaylists.length;
  youtubeModeButtons.forEach((button) => {
    if (button.dataset.mode === "allowed") {
      button.textContent = `Allowed (${allowedCount})`;
    } else if (button.dataset.mode === "blocked") {
      button.textContent = `Blocked (${blockedCount})`;
    }
  });
  const key = getYoutubeListKey(youtubeExceptionMode, kind);
  const items = youtubeLists[key];
  const kindLabel = kind === "video" ? "Video" : "Playlist";
  youtubeExceptionItems.innerHTML = items.length
    ? items
        .map(
          (value) => {
            const tooltip =
              kind === "video"
                ? `https://www.youtube.com/watch?v=${value}`
                : `https://www.youtube.com/playlist?list=${value}`;
            return `<div class="list-item"><div class="list-item-group"><span class="list-item-text" title="${tooltip}">${value}</span><span class="list-item-badge">${kindLabel}</span></div><button class="icon-btn icon-only list-delete-btn" type="button" data-youtube-kind="${kind}" data-youtube-value="${value}" aria-label="Remove entry">
              ${TRASH_ICON_SVG}
            </button></div>`
          }
        )
        .join("")
    : `<p style="color: var(--color-muted); font-size: var(--font-small);">No entries yet.</p>`;
};
const listItems = document.getElementById("listItems");
const advancedEditor = document.getElementById("advancedEditor");
const advancedAllowList = document.getElementById("advancedAllowList");
const advancedBlockList = document.getElementById("advancedBlockList");
const advancedSave = document.getElementById("advancedSave");
const advancedDisclosure = document.getElementById("advancedExceptions");
const advancedPatternModeButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("#advancedPatternMode button")
);
const advancedPatternInput = document.getElementById(
  "advancedPatternInput"
) as HTMLInputElement | null;
const advancedPatternAdd = document.getElementById("advancedPatternAdd");
const advancedAllowExamples = document.getElementById("advancedAllowExamples");
const advancedBlockExamples = document.getElementById("advancedBlockExamples");
const youtubeDisclosure = document.getElementById("youtubeExceptions");
const youtubePanel = document.getElementById("youtubePanel");
const youtubeModeButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("#youtubeExceptionMode button")
);
const youtubeExceptionInput = document.getElementById(
  "youtubeExceptionInput"
) as HTMLInputElement | null;
const youtubeExceptionType = document.getElementById(
  "youtubeExceptionType"
) as HTMLSelectElement | null;
const youtubeExceptionAdd = document.getElementById("youtubeExceptionAdd");
const youtubeExceptionItems = document.getElementById("youtubeExceptionItems");
const youtubeExceptionUseTab = document.getElementById("youtubeExceptionUseTab");
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
const tagActiveDetail = document.getElementById("tagActiveDetail");
const tagActiveDot = document.getElementById("tagActiveDot");
const tagActiveSettings = document.getElementById("tagActiveSettings") as HTMLButtonElement | null;
const tagNameDisplay = document.getElementById("tagNameDisplay");
const pomodoroFocusValue = document.getElementById("pomodoroFocusValue");
const pomodoroBreakValue = document.getElementById("pomodoroBreakValue");
const pomodoroCycleValue = document.getElementById("pomodoroCycleValue");
const tagQuickGrid = document.getElementById("tagQuickGrid");
const tagShowAll = document.getElementById("tagShowAll") as HTMLButtonElement | null;
const tagAllGrid = document.getElementById("tagAllGrid");
const tagSelectLabel = document.getElementById("tagSelectLabel");
const tagSelectConfirm = document.getElementById("tagSelectConfirm") as HTMLButtonElement | null;
const tagAdd = document.getElementById("tagAdd") as HTMLButtonElement | null;
const tagModalTitle = document.getElementById("tagModalTitle");
const tagName = document.getElementById("tagName") as HTMLInputElement | null;
const tagWork = document.getElementById("tagWork") as HTMLInputElement | null;
const tagBreak = document.getElementById("tagBreak") as HTMLInputElement | null;
const tagCycles = document.getElementById("tagCycles") as HTMLInputElement | null;
const tagEndless = document.getElementById("tagEndless") as HTMLInputElement | null;
const tagColor = document.getElementById("tagColor") as HTMLInputElement | null;
const tagSave = document.getElementById("tagSave");
const tagApplyNow = document.getElementById("tagApplyNow") as HTMLButtonElement | null;
const tagApplyLater = document.getElementById("tagApplyLater") as HTMLButtonElement | null;
const tagDelete = document.getElementById("tagDelete");
const tagDeleteConfirm = document.getElementById("tagDeleteConfirm") as HTMLButtonElement | null;
const tagDeleteCancel = document.getElementById("tagDeleteCancel") as HTMLButtonElement | null;
const listDeleteConfirm = document.getElementById("listDeleteConfirm") as HTMLButtonElement | null;
const listDeleteCancel = document.getElementById("listDeleteCancel") as HTMLButtonElement | null;
const listDeleteValue = document.getElementById("listDeleteValue");
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
let currentPomodoroSummaryRange: "today" | "week" | "month" = "today";
let currentUsageSummaryRange: "today" | "week" | "month" = "today";
let currentFocusSummaryRange: "today" | "week" | "month" = "today";
let currentStatsPanel: "usage" | "domains" = "usage";
let currentStatsSubview: "summary" | "trend" | "usage-trend" | "tag" = "summary";
let currentStatsSegment: "pomodoro" | "focus" | "usage" = "focus";
let currentPomodoroSummaryTab: "quality" | "volume" = "quality";
let currentFocusSummaryTab: "quality" | "volume" | "interruptions" = "quality";
let currentStatsTagId: string | null = null;
type TrendRange = "day" | "week" | "month" | "year" | "3m" | "6m";

let currentTrendRange: TrendRange = "week";
let currentTrendOffset = 0;
let currentUsageTrendRange: TrendRange = "week";
let currentUsageTrendOffset = 0;
let currentUsageTrendFilter: "all" | "allowed" | "blocked" = "all";
let currentTagRange: TrendRange = "week";
let currentTagOffset = 0;
let currentFocusView: "focus" | "distraction" = "focus";
let currentTimeMachineDay = "";
let pendingFocusOff = false;
const REVIEW_URL = "";
let currentScheduleId: string | null = null;
let currentStrictMinutes = 1;
let currentStrictActive = false;
let currentStrictEndsAt: number | null = null;
let currentStrictStartedAt: number | null = null;
let currentScheduleActive = false;
let strictOverlayDismissed = false;
let currentPomodoro: Awaited<ReturnType<typeof getState>>["pomodoro"] | null = null;
let pomodoroTicker: number | null = null;
let currentTags: Awaited<ReturnType<typeof getState>>["tags"] | null = null;
let lastTagsKey = "";
let currentTagEditId: string | null = null;
let currentTagDeleteId: string | null = null;
type ListDeleteKey = "blockedDomains" | "blockedKeywords" | "allowedDomains" | "allowedKeywords";
let pendingListDeleteValue: string | null = null;
let pendingListDeleteKey: ListDeleteKey | null = null;
let pendingTagSelectId: string | null | undefined = undefined;
let pendingTagApplyConfig:
  | { workMin: number; breakMin: number; cycles: number; tagId: string | null }
  | null = null;
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

const isScheduleEntryActive = (
  entry: { startMin: number; endMin: number; days: Array<0 | 1 | 2 | 3 | 4 | 5 | 6> },
  now: Date
) => {
  const minutes = now.getHours() * 60 + now.getMinutes();
  const day = now.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const prevDay = ((day + 6) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  if (entry.days.length === 0) {
    return false;
  }
  if (entry.endMin > entry.startMin) {
    return entry.days.includes(day) && minutes >= entry.startMin && minutes < entry.endMin;
  }
  return (
    (entry.days.includes(day) && minutes >= entry.startMin) ||
    (entry.days.includes(prevDay) && minutes < entry.endMin)
  );
};

const isScheduleActive = (schedule: Awaited<ReturnType<typeof getState>>["schedule"]) => {
  const hasEnabled = schedule.entries.some((entry) => entry.enabled && entry.days.length > 0);
  if (!hasEnabled) {
    return false;
  }
  return schedule.entries.some(
    (entry) => entry.enabled && isScheduleEntryActive(entry, new Date())
  );
};

const renderFocus = (
  focusEnabled: boolean,
  isPaused: boolean,
  pauseType: PauseType | null,
  pauseEndAt: number | null,
  strictActive: boolean,
  strictEndsAt: number | null,
  pomodoro: Awaited<ReturnType<typeof getState>>["pomodoro"] | null,
  scheduleActive: boolean
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
    toggleEl.disabled =
      strictActive || timerControlsFocus || (pauseActive && focusEnabled) || scheduleActive;
  }
  if (strictActive) {
    const untilLabel =
      typeof strictEndsAt === "number" ? `Strict until ${formatUntil(strictEndsAt)}` : "Strict active";
    setStatus("strict", "Strict", `${untilLabel} · Focus is locked until the strict timer ends.`);
  } else if (pauseActive && focusEnabled) {
    const untilLabel =
      pauseType === "manual"
        ? "Paused (manual)"
        : `Paused until ${formatUntil(pauseEndAt ?? now)}`;
    setStatus("paused", "Paused", `${untilLabel} · Focus will resume automatically.`);
  } else if (scheduleActive) {
    setStatus("pomodoro", "Scheduled", "Schedule is active. Focus is locked on.");
  } else if (timerControlsFocus) {
    setStatus(
      "pomodoro",
      "Pomodoro",
      "Pomodoro controls focus. Pause or stop the timer to change focus."
    );
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

const renderStrictSession = (
  strictSession: { active: boolean; endsAt?: number },
  pomodoroRunning: boolean
) => {
  currentStrictActive = strictSession.active;
  currentStrictEndsAt = typeof strictSession.endsAt === "number" ? strictSession.endsAt : null;
  const strictBlocked = strictSession.active || pomodoroRunning;
  if (strictStatus) {
    strictStatus.textContent = strictSession.active
      ? `Running until ${formatUntil(currentStrictEndsAt ?? Date.now())}`
      : "No strict session running.";
  }
  strictDurationButtons.forEach((button) => {
    const value = Number(button.dataset.strictMin ?? "0");
    button.classList.toggle("active", value === currentStrictMinutes);
    button.disabled = strictBlocked;
  });
  if (strictStart) {
    strictStart.disabled = strictBlocked;
  }
  if (strictConfirmText) {
    if (strictSession.active) {
      strictConfirmText.textContent = "Strict session is already running.";
    } else if (pomodoroRunning) {
      strictConfirmText.textContent = "Stop the Pomodoro before starting strict mode.";
    } else {
      strictConfirmText.textContent = `You won’t be able to turn Focus off for ${currentStrictMinutes} minutes.`;
    }
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
  const hintText = currentStatusDetail || "Strict session in progress.";
  const [untilText, detailText] = hintText.split(" · ");
  if (strictOverlayUntil) {
    strictOverlayUntil.textContent = untilText || "Strict session";
  }
  if (strictOverlayHint) {
    strictOverlayHint.textContent = detailText || untilText || hintText;
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
  if (pomodoroSounds) {
    pomodoroSounds.checked = pomodoro.sounds;
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

  const activeTagName = (() => {
    if (!pomodoro.lastTagId || !currentTags) {
      return "Default";
    }
    const tag = currentTags.items.find((item) => item.id === pomodoro.lastTagId);
    return tag?.title ?? "Default";
  })();
  if (pomodoroTagPill) {
    pomodoroTagPill.textContent = truncateLabel(activeTagName, 16);
    pomodoroTagPill.setAttribute("title", activeTagName);
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

const getTagPickerKey = (
  tags: Awaited<ReturnType<typeof getState>>["tags"],
  pomodoro: Awaited<ReturnType<typeof getState>>["pomodoro"]
) => {
  const itemsKey = tags.items
    .map(
      (item) =>
        `${item.id}:${item.title}:${item.color}:${item.pomodoroWorkMin}:${item.pomodoroBreakMin}:${item.pomodoroCycles}`
    )
    .join("|");
  return `${pomodoro.lastTagId ?? "default"}::${itemsKey}`;
};

const renderTags = (
  tags: Awaited<ReturnType<typeof getState>>["tags"],
  pomodoro: Awaited<ReturnType<typeof getState>>["pomodoro"]
) => {
  const nextKey = getTagPickerKey(tags, pomodoro);
  if (nextKey === lastTagsKey) {
    return;
  }
  lastTagsKey = nextKey;
  currentTags = tags;
  const isRunning = Boolean(pomodoro.running);
  const activeTag = pomodoro.lastTagId
    ? tags.items.find((item) => item.id === pomodoro.lastTagId) ?? null
    : null;
  if (pomodoro.lastTagId && !activeTag) {
    void setState({
      pomodoro: isRunning
        ? { lastTagId: null }
        : {
            lastTagId: null,
            workMin: DEFAULT_POMODORO.workMin,
            breakMin: DEFAULT_POMODORO.breakMin,
            cycles: DEFAULT_POMODORO.cycles
          }
    });
  } else if (
    !isRunning &&
    !activeTag &&
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

  if (tagNameDisplay) {
    tagNameDisplay.textContent = activeTag ? activeTag.title : "Default";
    tagNameDisplay.setAttribute("title", activeTag ? activeTag.title : "Default");
  }
  const activeConfig = getTagPomodoroConfig(activeTag);
  if (tagActiveDetail) {
    tagActiveDetail.textContent = formatTagPomodoro(activeConfig);
  }
  if (tagActiveDot) {
    tagActiveDot.style.background = activeTag?.color ?? "var(--color-accent)";
  }
  if (tagActiveSettings) {
    if (activeTag) {
      tagActiveSettings.classList.remove("hidden");
      tagActiveSettings.setAttribute("data-tag-settings", activeTag.id);
    } else {
      tagActiveSettings.classList.add("hidden");
      tagActiveSettings.removeAttribute("data-tag-settings");
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
        <button class="tag-gear" type="button" data-tag-settings="${item.id}" aria-label="Open settings">
          <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <path d="M10 6.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Zm7.1 3.8a7 7 0 0 0-.1-1.2l2-1.5-1.8-3.1-2.4.9a7 7 0 0 0-2-1.2l-.4-2.6H7.6l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-.9L1 7.3l2 1.5a7 7 0 0 0 0 2.4L1 12.7l1.8 3.1 2.4-.9a7 7 0 0 0 2 1.2l.4 2.6h4.8l.4-2.6a7 7 0 0 0 2-1.2l2.4.9 1.8-3.1-2-1.5c.1-.4.1-.8.1-1.2Z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      `;
    const dataAttr = isDefault ? 'data-tag-default="true"' : `data-tag-id="${item.id}"`;
    return `
      <div class="tag-quick-card" data-tag-select ${dataAttr}>
        <div class="tag-quick-top">
          <span class="tag-color-dot" style="background:${item.color}"></span>
          ${gear}
        </div>
        <div class="tag-title" title="${item.title}">${item.title}</div>
        <p class="tag-desc">${item.detail}</p>
      </div>
    `;
  };

  type TagCardItem = {
    id: string | null;
    title: string;
    color: string;
    detail: string;
  };

  const defaultItem: TagCardItem = {
    id: null,
    title: "Default",
    color: "var(--color-accent)",
    detail: formatTagPomodoro(DEFAULT_POMODORO)
  };

  if (tagQuickGrid) {
    const quickItems: TagCardItem[] = [];
    if (activeTag) {
      quickItems.push(defaultItem);
    }
    tags.items
      .filter((item) => item.id !== activeTag?.id)
      .forEach((item) => {
        quickItems.push({
          id: item.id,
          title: item.title,
          color: item.color ?? "var(--color-accent)",
          detail: formatTagPomodoro(getTagPomodoroConfig(item))
        });
      });
    const quickCards = quickItems.slice(0, 4).map(buildCard).join("");
    tagQuickGrid.innerHTML = quickCards
      ? quickCards
      : `<p class="list-sub" style="grid-column: 1 / -1;">No tags yet.</p>`;
  }

  if (tagAllGrid) {
    const allItems = [
      defaultItem,
      ...tags.items.map((item) => ({
        id: item.id,
        title: item.title,
        color: item.color ?? "var(--color-accent)",
        detail: formatTagPomodoro(getTagPomodoroConfig(item))
      }))
    ];
    tagAllGrid.innerHTML = allItems.map(buildCard).join("");
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

const getRangeWindow = (range: TrendRange, offset: number) => {
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
  if (range === "month" || range === "3m" || range === "6m") {
    const span = range === "3m" ? 3 : range === "6m" ? 6 : 1;
    const base = addMonths(now, offset * span);
    const start = new Date(base.getFullYear(), base.getMonth(), 1);
    const end = endOfDay(new Date(base.getFullYear(), base.getMonth() + span, 0));
    return { start, end };
  }
  const base = addYears(now, offset);
  const start = new Date(base.getFullYear(), 0, 1);
  const end = endOfDay(new Date(base.getFullYear(), 11, 31));
  return { start, end };
};

const getRetentionRanges = (retentionDays: number): TrendRange[] => {
  if (!Number.isFinite(retentionDays) || retentionDays <= 0 || retentionDays >= 365) {
    return ["day", "week", "month", "year"];
  }
  if (retentionDays <= 90) {
    return ["day", "week", "month", "3m"];
  }
  if (retentionDays <= 180) {
    return ["day", "week", "month", "6m"];
  }
  return ["day", "week", "month", "year"];
};

const clampRange = (range: TrendRange, options: TrendRange[]) => {
  return options.includes(range) ? range : options[options.length - 1];
};

const updateRangeButtons = (
  buttons: HTMLButtonElement[],
  attrName: "data-range" | "data-usage-trend-range",
  options: TrendRange[]
) => {
  const lastButton = buttons[3];
  if (!lastButton) {
    return;
  }
  if (options.length < 4) {
    lastButton.classList.add("hidden");
    lastButton.removeAttribute(attrName);
    return;
  }
  const lastOption = options[3];
  lastButton.classList.remove("hidden");
  lastButton.setAttribute(attrName, lastOption);
  lastButton.textContent =
    lastOption === "year" ? "Y" : lastOption === "3m" ? "3M" : "6M";
};

const applyRetentionToRanges = (retentionDays: number) => {
  const options = getRetentionRanges(retentionDays);
  const nextTrend = clampRange(currentTrendRange, options);
  const nextUsageTrend = clampRange(currentUsageTrendRange, options);
  const nextTagRange = clampRange(currentTagRange, options);
  if (nextTrend !== currentTrendRange) {
    currentTrendRange = nextTrend;
    currentTrendOffset = 0;
  }
  if (nextUsageTrend !== currentUsageTrendRange) {
    currentUsageTrendRange = nextUsageTrend;
    currentUsageTrendOffset = 0;
  }
  if (nextTagRange !== currentTagRange) {
    currentTagRange = nextTagRange;
    currentTagOffset = 0;
  }
  updateRangeButtons(statsTrendRangeButtons, "data-range", options);
  updateRangeButtons(statsUsageTrendRangeButtons, "data-usage-trend-range", options);
  updateRangeButtons(statsTagRangeButtons, "data-range", options);
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

const minutesFromMs = (ms: number): number => {
  return Math.round(ms / 60000);
};

const minutesFromMsPrecise = (ms: number): number => {
  return Math.round((ms / 60000) * 100) / 100;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const mergeDefaults = (defaults: unknown, existing: unknown): unknown => {
  if (Array.isArray(defaults)) {
    return Array.isArray(existing) ? existing : defaults;
  }
  if (isPlainObject(defaults)) {
    const result: Record<string, unknown> = { ...(isPlainObject(existing) ? existing : {}) };
    for (const key of Object.keys(defaults)) {
      result[key] = mergeDefaults(defaults[key], isPlainObject(existing) ? existing[key] : undefined);
    }
    return result;
  }
  return existing === undefined ? defaults : existing;
};

const mergePatch = (base: unknown, patch: unknown): unknown => {
  if (patch === undefined) {
    return base;
  }
  if (patch === null) {
    return null;
  }
  if (Array.isArray(base) || Array.isArray(patch)) {
    return Array.isArray(patch) ? patch : base;
  }
  if (isPlainObject(base) && isPlainObject(patch)) {
    const result: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) {
        continue;
      }
      result[key] = mergePatch(result[key], value);
    }
    return result;
  }
  return patch ?? base;
};

const getMonthKey = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const buildSessionIndexes = (sessions: StorageSchema["analytics"]["sessions"]) => {
  const byDay: Record<string, StorageSchema["analytics"]["sessions"]> = {};
  const byMonth: Record<string, StorageSchema["analytics"]["sessions"]> = {};
  sessions.forEach((session) => {
    const when = new Date(session.startedAt ?? session.endedAt);
    const dayKey = getDayKey(when);
    const monthKey = getMonthKey(when);
    if (!byDay[dayKey]) {
      byDay[dayKey] = [];
    }
    if (!byMonth[monthKey]) {
      byMonth[monthKey] = [];
    }
    byDay[dayKey].push(session);
    byMonth[monthKey].push(session);
  });
  return { byDay, byMonth };
};

const normalizeAnalytics = (analytics: StorageSchema["analytics"]) => {
  const sessions = Array.isArray(analytics.sessions) ? analytics.sessions : [];
  const sessionsByDay =
    isPlainObject(analytics.sessionsByDay) ? analytics.sessionsByDay : {};
  const flattenedSessions =
    sessions.length > 0
      ? sessions
      : Object.values(sessionsByDay).flatMap((items) =>
          Array.isArray(items) ? items : []
        );
  const indexes = buildSessionIndexes(flattenedSessions);
  return {
    ...analytics,
    byDay: isPlainObject(analytics.byDay) ? analytics.byDay : {},
    sessions: flattenedSessions,
    sessionsByDay: indexes.byDay,
    sessionsByMonth: indexes.byMonth
  };
};

const sanitizeBackupState = (state: StorageSchema, includeAnalytics: boolean) => {
  const analytics =
    isPlainObject(state.analytics) ? state.analytics : defaultState.analytics;
  const nextAnalytics = includeAnalytics
    ? normalizeAnalytics(analytics)
    : {
        ...analytics,
        byDay: {},
        sessions: [],
        sessionsByDay: {},
        sessionsByMonth: {}
      };

  return {
    ...state,
    schemaVersion: SCHEMA_VERSION,
    pause: { isPaused: false, pauseType: null, pauseEndAt: null, pauseStartedAt: undefined },
    temporaryAllow: {},
    strictSession: {
      ...state.strictSession,
      active: false,
      endsAt: undefined,
      startedAt: undefined,
      prevFocusEnabled: undefined,
      blockedSnapshot: undefined
    },
    pomodoro: {
      ...state.pomodoro,
      running: null,
      lastCompletion: undefined
    },
    analytics: nextAnalytics
  };
};

const hasAnalyticsData = (analytics: StorageSchema["analytics"] | undefined) => {
  if (!analytics) {
    return false;
  }
  if (Array.isArray(analytics.sessions) && analytics.sessions.length > 0) {
    return true;
  }
  if (
    isPlainObject(analytics.sessionsByDay) &&
    Object.keys(analytics.sessionsByDay).length > 0
  ) {
    return true;
  }
  return isPlainObject(analytics.byDay) && Object.keys(analytics.byDay).length > 0;
};

const writeFullState = async (state: StorageSchema) => {
  await new Promise<void>((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: state }, () => resolve());
  });
};

const buildRestoreState = (
  backupState: StorageSchema,
  includeAnalytics: boolean,
  mode: "merge" | "overwrite",
  currentState: StorageSchema
) => {
  const sanitized = sanitizeBackupState(backupState, includeAnalytics);
  if (mode === "overwrite") {
    const withDefaults = mergeDefaults(defaultState, sanitized) as StorageSchema;
    return { ...withDefaults, schemaVersion: SCHEMA_VERSION };
  }
  const analyticsSettingsOnly = includeAnalytics
    ? sanitized.analytics
    : {
        showWebUsage: sanitized.analytics.showWebUsage,
        chartRange: sanitized.analytics.chartRange,
        chartFilter: sanitized.analytics.chartFilter,
        retentionDays: sanitized.analytics.retentionDays
      };
  const patch = {
    ...sanitized,
    analytics: analyticsSettingsOnly
  };
  const merged = mergePatch(currentState, patch) as StorageSchema;
  return { ...merged, schemaVersion: SCHEMA_VERSION };
};

const getSessionsForKeys = (state: StorageSchema, keys: string[]) => {
  const byDay = state.analytics.sessionsByDay ?? {};
  const sessions: StorageSchema["analytics"]["sessions"] = [];
  keys.forEach((key) => {
    const daySessions = byDay[key];
    if (Array.isArray(daySessions)) {
      sessions.push(...daySessions);
    }
  });
  if (sessions.length > 0 || Object.keys(byDay).length > 0) {
    return sessions;
  }
  const keySet = new Set(keys);
  return state.analytics.sessions.filter((session) =>
    keySet.has(getDayKey(new Date(session.startedAt)))
  );
};

const buildTagTotals = (state: StorageSchema, keys: string[]) => {
  const totals = new Map<string, number>();
  const sessions = getSessionsForKeys(state, keys);
  sessions.forEach((session) => {
    if (session.type !== "pomodoro" || !session.tagId) {
      return;
    }
    const duration = Math.max(0, session.endedAt - session.startedAt);
    totals.set(session.tagId, (totals.get(session.tagId) ?? 0) + duration);
  });
  const tagLookup = new Map(state.tags.items.map((item) => [item.id, item.title]));
  const items = Array.from(totals.entries())
    .map(([id, totalMs]) => ({
      id,
      title: tagLookup.get(id) ?? "Tag",
      totalMs
    }))
    .sort((a, b) => b.totalMs - a.totalMs);
  const totalAll = items.reduce((sum, item) => sum + item.totalMs, 0);
  return { items, totalAll };
};

const buildUsageTotals = (state: StorageSchema, keys: string[]) => {
  const allowedSet = new Set(state.lists.allowedDomains.map((host) => host.toLowerCase()));
  let totalMs = 0;
  let blockedMs = 0;
  let allowedMs = 0;
  keys.forEach((key) => {
    const day = state.analytics.byDay[key];
    if (!day) {
      return;
    }
    totalMs += day.totalMs ?? 0;
    blockedMs += day.blockedMs ?? 0;
    Object.entries(day.byDomain ?? {}).forEach(([host, value]) => {
      if (allowedSet.has(host.toLowerCase())) {
        allowedMs += value;
      }
    });
  });
  const otherMs = Math.max(0, totalMs - allowedMs - blockedMs);
  return { totalMs, blockedMs, allowedMs, otherMs };
};

const buildFocusSummaryMetricsForKeys = (
  state: StorageSchema,
  keys: string[]
) => {
  const sessions = getSessionsForKeys(state, keys);
  const focusSessions = sessions.filter((session) => session.type === "focus");
  const strictSessions = sessions.filter((session) => session.type === "strict");
  const pomodoroSessions = sessions.filter((session) => session.type === "pomodoro");
  const pauseSessions = sessions.filter((session) => session.type === "pause");
  const sumDuration = (items: typeof sessions) =>
    items.reduce((sum, session) => sum + Math.max(0, session.endedAt - session.startedAt), 0);
  const totalFocusMs = sumDuration(focusSessions) + sumDuration(strictSessions);
  const manualFocusMs = sumDuration(focusSessions);
  const pauseMs = sumDuration(pauseSessions);
  const strictMs = sumDuration(strictSessions);
  const pomodoroMs = sumDuration(pomodoroSessions);
  const pomodoroCount = pomodoroSessions.length;
  const denom = totalFocusMs + pauseMs;
  const reliability = denom > 0 ? clamp((totalFocusMs - pauseMs) / denom, 0, 1) : 0;
  const focusWindows = [...focusSessions, ...strictSessions, ...pomodoroSessions];
  const firstPauseDeltas: number[] = [];
  focusWindows.forEach((session) => {
    const firstPause = pauseSessions
      .filter(
        (pause) => pause.startedAt >= session.startedAt && pause.startedAt <= session.endedAt
      )
      .sort((a, b) => a.startedAt - b.startedAt)[0];
    if (firstPause) {
      firstPauseDeltas.push(Math.max(0, firstPause.startedAt - session.startedAt));
    }
  });
  const avgFirstPause =
    firstPauseDeltas.length > 0
      ? Math.round(firstPauseDeltas.reduce((sum, value) => sum + value, 0) / firstPauseDeltas.length)
      : null;
  const scheduleIntervals = buildScheduleIntervals(state.schedule, keys);
  const scheduleTotalMs = scheduleIntervals.reduce(
    (sum, interval) => sum + Math.max(0, interval.end - interval.start),
    0
  );
  const focusDuringScheduleMs = scheduleIntervals.length
    ? [...focusSessions, ...strictSessions].reduce((sum, session) => {
        const sessionStart = session.startedAt;
        const sessionEnd = session.endedAt;
        if (sessionEnd <= sessionStart) {
          return sum;
        }
        const overlap = scheduleIntervals.reduce((acc, interval) => {
          const start = Math.max(sessionStart, interval.start);
          const end = Math.min(sessionEnd, interval.end);
          return acc + Math.max(0, end - start);
        }, 0);
        return sum + overlap;
      }, 0)
    : 0;
  const scheduleReliability =
    scheduleTotalMs > 0 ? clamp(focusDuringScheduleMs / scheduleTotalMs, 0, 1) : null;
  const streakSessions = sessions
    .filter((session) =>
      ["focus", "strict", "pomodoro", "pause"].includes(session.type)
    )
    .map((session) => ({
      start: session.startedAt,
      end: Math.max(session.startedAt, session.endedAt)
    }))
    .filter((session) => session.end > session.start)
    .sort((a, b) => a.start - b.start);
  let longestStreakMs = 0;
  if (streakSessions.length > 0) {
    let currentStart = streakSessions[0].start;
    let currentEnd = streakSessions[0].end;
    for (let i = 1; i < streakSessions.length; i += 1) {
      const next = streakSessions[i];
      if (next.start <= currentEnd) {
        currentEnd = Math.max(currentEnd, next.end);
      } else {
        longestStreakMs = Math.max(longestStreakMs, currentEnd - currentStart);
        currentStart = next.start;
        currentEnd = next.end;
      }
    }
    longestStreakMs = Math.max(longestStreakMs, currentEnd - currentStart);
  }
  return {
    keys,
    totalFocusMs,
    manualFocusMs,
    manualCount: focusSessions.length,
    strictMs,
    strictCount: strictSessions.length,
    pauseMs,
    pauseCount: pauseSessions.length,
    pomodoroMs,
    pomodoroCount,
    reliability,
    scheduleReliability,
    longestStreakMs,
    avgFirstPause
  };
};

const buildFocusSummaryMetrics = (
  state: StorageSchema,
  range: "today" | "week" | "month"
) => buildFocusSummaryMetricsForKeys(state, getRangeKeys(range));

const buildPomodoroSummaryMetrics = (state: StorageSchema, keys: string[]) => {
  const sessionsInRange = getSessionsForKeys(state, keys);
  const pomodoroSessions = sessionsInRange.filter((session) => session.type === "pomodoro");
  const workMsEst = pomodoroSessions.length * state.pomodoro.workMin * 60 * 1000;
  const breakMsEst = pomodoroSessions.length * state.pomodoro.breakMin * 60 * 1000;
  const pomodoroMs = workMsEst + breakMsEst;
  const pauseMs = sessionsInRange
    .filter((session) => session.type === "pause" && session.source === "pomodoro")
    .reduce((acc, session) => acc + Math.max(0, session.endedAt - session.startedAt), 0);
  const completions = pomodoroSessions.filter(
    (session) => session.outcome === "completed" || session.outcome === "interrupted"
  );
  const expectedFullMs =
    (state.pomodoro.cycles > 0 ? state.pomodoro.cycles : 1) *
    (state.pomodoro.workMin + state.pomodoro.breakMin) *
    60 *
    1000;
  const isInterrupted = (session: StorageSchema["analytics"]["sessions"][number]) => {
    if (session.outcome === "interrupted") {
      return true;
    }
    if (session.outcome === "completed") {
      return false;
    }
    const duration = Math.max(0, session.endedAt - session.startedAt);
    return duration + 1000 < expectedFullMs;
  };
  const interruptedCount =
    completions.length > 0
      ? completions.filter((session) => session.outcome === "interrupted").length
      : pomodoroSessions.filter(isInterrupted).length;
  const completedCount =
    completions.length > 0
      ? completions.filter((session) => session.outcome === "completed").length
      : pomodoroSessions.length - interruptedCount;
  const reliability =
    pomodoroSessions.length > 0 ? completedCount / pomodoroSessions.length : 0;
  const pauseBurden = pomodoroMs + pauseMs > 0 ? pauseMs / (pomodoroMs + pauseMs) : 0;
  const tagsCompleted =
    completions.length > 0
      ? completions.filter((session) => session.outcome === "completed").length
      : pomodoroSessions.filter((session) => !isInterrupted(session)).length;
  const tagsInterrupted =
    completions.length > 0
      ? completions.filter((session) => session.outcome === "interrupted").length
      : pomodoroSessions.filter(isInterrupted).length;
  return {
    pomodoroMs,
    workMsEst,
    breakMsEst,
    reliability,
    pauseBurden,
    tagsCompleted,
    tagsInterrupted
  };
};

const buildUsageTrendBuckets = (
  state: StorageSchema,
  range: TrendRange,
  start: Date,
  end: Date,
  filter: "all" | "allowed" | "blocked"
) => {
  const allowedSet = new Set(state.lists.allowedDomains.map((host) => host.toLowerCase()));
  const bucketCount =
    range === "year"
      ? 12
      : range === "day"
        ? 6
        : range === "week"
          ? 7
          : range === "3m"
            ? 3
            : range === "6m"
              ? 6
              : 5;
  const buckets = new Array(bucketCount).fill(0).map(() => ({
    allowedMs: 0,
    blockedMs: 0,
    otherMs: 0
  }));
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
          : range === "3m" || range === "6m"
            ? new Array(bucketCount).fill("").map((_, idx) =>
                addMonths(start, idx).toLocaleDateString(undefined, { month: "short" })
              )
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
    if (range === "3m" || range === "6m") {
      const monthIndex =
        (date.getFullYear() - start.getFullYear()) * 12 + (date.getMonth() - start.getMonth());
      return Math.min(bucketCount - 1, Math.max(0, monthIndex));
    }
    const day = date.getDate();
    return Math.min(4, Math.floor((day - 1) / 7));
  };

  const dayBuckets = new Map<string, { totalMs: number; blockedMs: number; allowedMs: number }>();
  if (range === "day") {
    const dayKey = getDayKey(start);
    const day = state.analytics.byDay[dayKey];
    if (day) {
      const totalMs = day.totalMs ?? 0;
      const blockedMs = day.blockedMs ?? 0;
      const allowedMs = Object.entries(day.byDomain ?? {}).reduce((sum, [host, value]) => {
        return allowedSet.has(host.toLowerCase()) ? sum + value : sum;
      }, 0);
      dayBuckets.set(dayKey, { totalMs, blockedMs, allowedMs });
      const hourTotals = day.byHourMs ?? {};
      const hourBlocked = day.byHourBlockedMs ?? {};
      Object.entries(hourTotals).forEach(([hour, value]) => {
        const date = new Date(start);
        date.setHours(Number(hour), 0, 0, 0);
        const index = getBucketIndex(date);
        const blocked = hourBlocked[hour] ?? 0;
        const allowedRatio = totalMs > 0 ? allowedMs / totalMs : 0;
        const allowed = value * allowedRatio;
        const other = Math.max(0, value - blocked - allowed);
        buckets[index].allowedMs += allowed;
        buckets[index].blockedMs += blocked;
        buckets[index].otherMs += other;
      });
    }
  } else {
    const cursor = new Date(start);
    while (cursor <= end) {
      const dayKey = getDayKey(cursor);
      const day = state.analytics.byDay[dayKey];
      if (day) {
        const totalMs = day.totalMs ?? 0;
        const blockedMs = day.blockedMs ?? 0;
        const allowedMs = Object.entries(day.byDomain ?? {}).reduce((sum, [host, value]) => {
          return allowedSet.has(host.toLowerCase()) ? sum + value : sum;
        }, 0);
        const index = getBucketIndex(cursor);
        const otherMs = Math.max(0, totalMs - allowedMs - blockedMs);
        buckets[index].allowedMs += allowedMs;
        buckets[index].blockedMs += blockedMs;
        buckets[index].otherMs += otherMs;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return buckets.map((bucket, idx) => {
    const segments =
      filter === "allowed"
        ? [{ id: "allowed", color: "var(--usage-allowed)", value: bucket.allowedMs }]
        : filter === "blocked"
          ? [{ id: "blocked", color: "var(--usage-blocked)", value: bucket.blockedMs }]
          : [
              { id: "allowed", color: "var(--usage-allowed)", value: bucket.allowedMs },
              { id: "other", color: "var(--usage-other)", value: bucket.otherMs },
              { id: "blocked", color: "var(--usage-blocked)", value: bucket.blockedMs }
            ];
    return {
      label: labels[idx],
      total: bucket.allowedMs + bucket.otherMs + bucket.blockedMs,
      segments: segments.filter((segment) => segment.value > 0)
    };
  });
};

const buildFocusTotals = (
  state: StorageSchema,
  keys: string[],
  tagId?: string | null
) => {
  let totalMs = 0;
  const sessions = getSessionsForKeys(state, keys);
  sessions.forEach((session) => {
    if (session.type !== "pomodoro") {
      return;
    }
    if (tagId && session.tagId !== tagId) {
      return;
    }
    totalMs += Math.max(0, session.endedAt - session.startedAt);
  });
  const dailyAvg = keys.length ? totalMs / keys.length : 0;
  return { totalMs, dailyAvg };
};

const buildStackedTrendBuckets = (
  state: StorageSchema,
  range: TrendRange,
  start: Date,
  end: Date,
  tagId?: string | null
) => {
  const tagLookup = new Map(state.tags.items.map((item) => [item.id, item]));
  const totals = new Map<string, number>();
  const bucketCount =
    range === "year"
      ? 12
      : range === "day"
        ? 6
        : range === "week"
          ? 7
          : range === "3m"
            ? 3
            : range === "6m"
              ? 6
              : 5;
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
          : range === "3m" || range === "6m"
            ? new Array(bucketCount).fill("").map((_, idx) =>
                addMonths(start, idx).toLocaleDateString(undefined, { month: "short" })
              )
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
    if (range === "3m" || range === "6m") {
      const monthIndex =
        (date.getFullYear() - start.getFullYear()) * 12 + (date.getMonth() - start.getMonth());
      return Math.min(bucketCount - 1, Math.max(0, monthIndex));
    }
    const day = date.getDate();
    return Math.min(4, Math.floor((day - 1) / 7));
  };

  const keys = getRangeKeysBetween(start, end);
  const keySet = new Set(keys);
  const sessions = getSessionsForKeys(state, keys);
  sessions.forEach((session) => {
    if (session.type !== "pomodoro") return;
    if (!session.tagId) return;
    if (tagId && session.tagId !== tagId) return;
    const date = new Date(session.startedAt);
    const dayKey = getDayKey(date);
    if (!keySet.has(dayKey)) return;
    const index = getBucketIndex(date);
    if (index < 0 || index >= bucketMaps.length) return;
    const duration = Math.max(0, session.endedAt - session.startedAt);
    const map = bucketMaps[index];
    map.set(session.tagId, (map.get(session.tagId) ?? 0) + duration);
    totals.set(session.tagId, (totals.get(session.tagId) ?? 0) + duration);
  });

  const orderedTagIds = tagId
    ? [tagId]
    : Array.from(totals.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id);

  return labels.map((label, idx) => {
    const bucketMap = bucketMaps[idx];
    const segments = orderedTagIds
      .map((id) => {
        const value = bucketMap.get(id) ?? 0;
        if (value <= 0) {
          return null;
        }
        const tag = tagLookup.get(id);
        return {
          id,
          title: tag?.title ?? "Tag",
          color: tag?.color ?? "var(--color-accent)",
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
  const axisLabels = [max, max / 2, 0].map((value) => formatDuration(value));
  target.innerHTML = `
    <div class="trend-chart">
      <div class="trend-axis">
        ${axisLabels.map((label) => `<span>${label}</span>`).join("")}
      </div>
      <div class="trend-bars">
        <div class="trend-grid">
          <span></span>
          <span></span>
          <span></span>
        </div>
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
    </div>
  `;
};

const getDayKey = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDayKey = (key: string): Date => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const buildScheduleIntervals = (
  schedule: StorageSchema["schedule"],
  keys: string[]
): Array<{ start: number; end: number }> => {
  const entries = schedule.entries.filter((entry) => entry.enabled && entry.days.length > 0);
  if (entries.length === 0 || keys.length === 0) {
    return [];
  }
  const keySet = new Set(keys);
  const intervals: Array<{ start: number; end: number }> = [];
  keys.forEach((key) => {
    const date = parseDayKey(key);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const dayOfWeek = date.getDay();
    entries.forEach((entry) => {
      if (!entry.days.includes(dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6)) {
        return;
      }
      const startMin = entry.startMin;
      const endMin = entry.endMin;
      const start = dayStart + startMin * 60 * 1000;
      if (endMin > startMin) {
        intervals.push({ start, end: dayStart + endMin * 60 * 1000 });
        return;
      }
      if (endMin < startMin) {
        const dayEnd = dayStart + 24 * 60 * 60 * 1000;
        intervals.push({ start, end: dayEnd });
        const nextKey = getDayKey(new Date(dayEnd));
        if (keySet.has(nextKey)) {
          intervals.push({ start: dayEnd, end: dayEnd + endMin * 60 * 1000 });
        }
      }
    });
  });
  return intervals;
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


const renderMetrics = (state: StorageSchema, keys: string[]) => {
    const summary = buildPomodoroSummaryMetrics(state, keys);

    if (metricFocus) metricFocus.textContent = formatDuration(summary.workMsEst);
    if (metricBreak) metricBreak.textContent = formatDuration(summary.breakMsEst);
    if (metricTags) metricTags.textContent = String(summary.tagsCompleted);
    if (metricTagsInterrupted) metricTagsInterrupted.textContent = String(summary.tagsInterrupted);
    if (metricPomodoroTime) metricPomodoroTime.textContent = formatDuration(summary.pomodoroMs);
    if (metricPomodoroReliability) {
      metricPomodoroReliability.textContent = `${Math.round(summary.reliability * 100)}%`;
    }
    if (metricPomodoroPauseBurden) {
      metricPomodoroPauseBurden.textContent = `${Math.round(summary.pauseBurden * 100)}%`;
    }
  };

const renderSessions = (state: StorageSchema, keys: string[]) => {
  if (!statsSessions) {
    return;
  }
  const tagLookup = new Map(state.tags.items.map((item) => [item.id, item.title]));
  const sessions = getSessionsForKeys(state, keys)
    .filter((session) => session.type === "pomodoro" || session.type === "strict")
    .slice()
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, 12);

  if (sessions.length === 0) {
    statsSessions.innerHTML = `<p class="list-sub">No sessions logged yet.</p>`;
    return;
  }

  statsSessions.innerHTML = sessions
    .map((session) => {
      const duration = Math.max(0, session.endedAt - session.startedAt);
      const tagTitle = session.tagId ? tagLookup.get(session.tagId) : null;
      const label = session.type === "strict" ? "Strict session" : "Pomodoro focus";
      const timeLabel = `${formatTimeLabel(session.startedAt)} · ${formatDuration(duration)}`;
      return `
        <div class="list-item">
          <div class="session-item">
            <div class="session-title">${label}</div>
            <div class="session-meta">
              <span>${timeLabel}</span>
              ${tagTitle ? `<span>Tag: ${tagTitle}</span>` : ""}
            </div>
          </div>
        </div>
      `;
    })
    .join("");
};

const renderTagLists = (
  state: StorageSchema,
  summaryKeys: string[],
  trendKeys: string[]
) => {
  const renderGrid = (
    target: HTMLElement | null,
    items: Array<{ id: string; title: string; totalMs: number }>,
    totalAll: number,
    limit?: number
  ) => {
    if (!target) {
      return;
    }
    const sliced = typeof limit === "number" ? items.slice(0, limit) : items;
    if (sliced.length === 0) {
      target.innerHTML = `<p class="list-sub">No tag data yet.</p>`;
      return;
    }
    target.innerHTML = sliced
      .map((item) => {
        const pct = totalAll ? Math.round((item.totalMs / totalAll) * 100) : 0;
        const color =
          state.tags.items.find((tag) => tag.id === item.id)?.color ?? "var(--color-accent)";
        return `
          <div class="stats-tag-card" data-tag-id="${item.id}">
            <div class="stats-tag-title">
              <span class="stats-tag-dot" style="background:${color};"></span>
              ${item.title}
            </div>
            <div class="stats-tag-meta">
              <span>${formatDuration(item.totalMs)}</span>
              <span>·</span>
              <span>${pct}%</span>
            </div>
          </div>
        `;
      })
      .join("");
  };
  const summaryTotals = buildTagTotals(state, summaryKeys);
  const trendTotals = buildTagTotals(state, trendKeys);
  renderGrid(statsSummaryTags, summaryTotals.items, summaryTotals.totalAll, 4);
  renderGrid(statsTrendTags, trendTotals.items, trendTotals.totalAll);
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
  const sessions = getSessionsForKeys(state, [currentTimeMachineDay])
    .slice()
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

const renderFocusSummary = (state: StorageSchema) => {
  const summary = buildFocusSummaryMetrics(state, currentFocusSummaryRange);

  if (statsFocusTotalTime) statsFocusTotalTime.textContent = formatDuration(summary.totalFocusMs);
  if (statsFocusManualTime) statsFocusManualTime.textContent = formatDuration(summary.manualFocusMs);
  if (statsFocusManualCount) statsFocusManualCount.textContent = String(summary.manualCount);
  if (statsFocusPauseTime) statsFocusPauseTime.textContent = formatDuration(summary.pauseMs);
  if (statsFocusPauseCount) statsFocusPauseCount.textContent = String(summary.pauseCount);
  if (statsFocusStrictTime) statsFocusStrictTime.textContent = formatDuration(summary.strictMs);
  if (statsFocusStrictCount) statsFocusStrictCount.textContent = String(summary.strictCount);
  if (statsFocusPomodoroTime) statsFocusPomodoroTime.textContent = formatDuration(summary.pomodoroMs);
  if (statsFocusPomodoroCount) statsFocusPomodoroCount.textContent = String(summary.pomodoroCount);
  if (statsFocusReliability) {
    statsFocusReliability.textContent = `${Math.round(summary.reliability * 100)}%`;
  }
  if (statsFocusScheduleReliability) {
    statsFocusScheduleReliability.textContent =
      summary.scheduleReliability === null ? "--" : `${Math.round(summary.scheduleReliability * 100)}%`;
  }
  if (statsFocusLongestStreak) {
    statsFocusLongestStreak.textContent =
      summary.longestStreakMs > 0 ? formatDuration(summary.longestStreakMs) : "--";
  }
  if (statsFocusFirstPause) {
    statsFocusFirstPause.textContent =
      summary.avgFirstPause === null ? "--" : formatDuration(summary.avgFirstPause);
  }

  if (statsFocusDate) {
    statsFocusDate.textContent =
      currentFocusSummaryRange === "today"
        ? "Today"
        : currentFocusSummaryRange === "week"
          ? "This week"
          : "This month";
  }
};

const renderStats = (state: StorageSchema) => {
  const analytics = state.analytics;
  applyRetentionToRanges(analytics.retentionDays ?? 90);
  statsPomodoroRangeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.range === currentPomodoroSummaryRange);
  });
  setPomodoroSummaryTab(currentPomodoroSummaryTab);
  setFocusSummaryTab(currentFocusSummaryTab);
  statsUsageSummaryRangeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.range === currentUsageSummaryRange);
  });
  statsFocusSummaryRangeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.range === currentFocusSummaryRange);
  });
  statsFocusButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.focusMode === currentFocusView);
  });

  if (statsSummaryView || statsTrendView || statsUsageTrendView || statsTagView) {
    setStatsSubview(currentStatsSubview, { scroll: "none" });
  }
  setStatsSegment(currentStatsSegment);
  const pomodoroRangeLabel =
    currentPomodoroSummaryRange === "today"
      ? "Today"
      : currentPomodoroSummaryRange === "week"
        ? "This week"
        : "This month";
  const summaryDate = document.getElementById("statsSummaryDate");
  if (summaryDate) {
    summaryDate.textContent = pomodoroRangeLabel;
  }
  renderFocusSummary(state);
  const usageRangeLabel =
    currentUsageSummaryRange === "today"
      ? "Today"
      : currentUsageSummaryRange === "week"
        ? "This week"
        : "This month";
  if (statsUsageDate) {
    statsUsageDate.textContent = usageRangeLabel;
  }
  statsPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === currentStatsPanel);
  });
  statsTrendRangeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.range === currentTrendRange);
  });
  statsUsageTrendRangeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.usageTrendRange === currentUsageTrendRange);
  });
  statsUsageTrendFilterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.usageTrendFilter === currentUsageTrendFilter);
  });
  statsTagRangeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.range === currentTagRange);
  });

  const pomodoroKeys = getRangeKeys(currentPomodoroSummaryRange);
  const usageSummaryKeys = getRangeKeys(currentUsageSummaryRange);
  let totalMs = 0;
  const byDomain: Record<string, number> = {};

  usageSummaryKeys.forEach((key) => {
    const day = analytics.byDay[key];
    if (!day) {
      return;
    }
    totalMs += day.totalMs ?? 0;
    Object.entries(day.byDomain ?? {}).forEach(([host, value]) => {
      byDomain[host] = (byDomain[host] ?? 0) + value;
    });
  });

  const listSource = byDomain;
  const listTotal = totalMs;

  if (statsTotalValue) {
    statsTotalValue.textContent = formatDuration(listTotal);
  }

  if (statsList) {
    const entries = Object.entries(listSource).sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (!entries.length) {
      statsList.innerHTML = `<p style="color: var(--color-muted); font-size: var(--font-small);">No data yet.</p>`;
    } else {
      const topEntries = Object.entries(listSource)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([label, value]) => ({ label, value }));
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
    renderTimeline(state, usageSummaryKeys);
  }

  if (statsUsageHeatmap) {
    const hourTotals = new Array(24).fill(0);
    const hourBlocked = new Array(24).fill(0);
    const heatmapKeys = getRangeKeys("week");
    heatmapKeys.forEach((key) => {
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
    statsUsageHeatmap.innerHTML = hourTotals
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
  const tagListKeys = getRangeKeys("week");
  const trendWindow = getRangeWindow(currentTrendRange, currentTrendOffset);
  const trendKeys = getRangeKeysBetween(trendWindow.start, trendWindow.end);
  renderTagLists(state, tagListKeys, trendKeys);
  renderMetrics(state, pomodoroKeys);
  renderSessions(state, pomodoroKeys);
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

  const usageToday = buildUsageTotals(state, todayKeys);
  const usageYesterday = buildUsageTotals(state, yesterdayKeys);
  const usageWeek = buildUsageTotals(state, weekKeys);
  const usagePrevWeek = buildUsageTotals(state, prevWeekKeys);
  const usageTodayChange =
    usageYesterday.blockedMs > 0
      ? Math.round(((usageToday.blockedMs - usageYesterday.blockedMs) / usageYesterday.blockedMs) * 100)
      : 0;
  const usageWeekChange =
    usagePrevWeek.blockedMs > 0
      ? Math.round(((usageWeek.blockedMs - usagePrevWeek.blockedMs) / usagePrevWeek.blockedMs) * 100)
      : 0;
  const usageDailyAvg = weekKeys.length ? usageWeek.blockedMs / weekKeys.length : 0;
  if (statsUsageToday) {
    statsUsageToday.textContent = formatDuration(usageToday.blockedMs);
  }
  if (statsUsageTodayChange) {
    statsUsageTodayChange.textContent = `${usageTodayChange}% vs yesterday`;
  }
  if (statsUsageWeek) {
    statsUsageWeek.textContent = formatDuration(usageWeek.blockedMs);
  }
  if (statsUsageWeekChange) {
    statsUsageWeekChange.textContent = `${usageWeekChange}% vs last week`;
  }
  if (statsUsageAvg) {
    statsUsageAvg.textContent = formatDuration(usageDailyAvg);
  }
  const usageBuckets = buildUsageTrendBuckets(
    state,
    "week",
    weekWindow.start,
    weekWindow.end,
    "all"
  );
  renderTrendChart(statsUsageChart, usageBuckets);

  if (usageTotal || usageBlocked || usageAllowed || usageOther) {
    const usageTotals = buildUsageTotals(state, usageSummaryKeys);
    if (usageTotal) {
      usageTotal.textContent = formatDuration(usageTotals.totalMs);
    }
    if (usageBlocked) {
      usageBlocked.textContent = formatDuration(usageTotals.blockedMs);
    }
    if (usageAllowed) {
      usageAllowed.textContent = formatDuration(usageTotals.allowedMs);
    }
    if (usageOther) {
      usageOther.textContent = formatDuration(usageTotals.otherMs);
    }
  }


  const renderTrendView = (
    range: TrendRange,
    offset: number,
    tagId: string | null,
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
    const currentTotals = buildFocusTotals(state, keys, tagId);
    const prevTotals = buildFocusTotals(state, prevKeys, tagId);
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
    if (titleEl && tagId) {
      const tag = state.tags.items.find((item) => item.id === tagId);
      const title = tag?.title ?? "Tag";
      titleEl.textContent = truncateLabel(title, 18);
      titleEl.setAttribute("title", title);
    }
    const buckets = buildStackedTrendBuckets(state, range, start, end, tagId);
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

  const renderUsageTrendView = () => {
    const { start, end } = getRangeWindow(currentUsageTrendRange, currentUsageTrendOffset);
    const keys = getRangeKeysBetween(start, end);
    const prevWindow = getRangeWindow(currentUsageTrendRange, currentUsageTrendOffset - 1);
    const prevKeys = getRangeKeysBetween(prevWindow.start, prevWindow.end);
    const currentTotals = buildUsageTotals(state, keys);
    const prevTotals = buildUsageTotals(state, prevKeys);
    const pctChange =
      prevTotals.blockedMs > 0
        ? Math.round(((currentTotals.blockedMs - prevTotals.blockedMs) / prevTotals.blockedMs) * 100)
        : 0;
    const currentAvg = keys.length ? currentTotals.blockedMs / keys.length : 0;
    const prevAvg = prevKeys.length ? prevTotals.blockedMs / prevKeys.length : 0;
    const avgChange =
      prevAvg > 0 ? Math.round(((currentAvg - prevAvg) / prevAvg) * 100) : 0;
    if (statsUsageDateLabel) {
      statsUsageDateLabel.textContent =
        currentUsageTrendRange === "day" && currentUsageTrendOffset === 0
          ? "Today"
          : formatRangeLabel(start, end);
    }
    const buckets = buildUsageTrendBuckets(
      state,
      currentUsageTrendRange,
      start,
      end,
      currentUsageTrendFilter
    );
    renderTrendChart(statsUsageTrendChart, buckets);
    if (statsUsageTrendTotal) {
      statsUsageTrendTotal.textContent = formatDuration(currentTotals.blockedMs);
    }
    if (statsUsageTrendChange) {
      statsUsageTrendChange.textContent = `${pctChange}% vs last`;
    }
    if (statsUsageTrendAvg) {
      statsUsageTrendAvg.textContent = formatDuration(currentAvg);
    }
    if (statsUsageTrendAvgChange) {
      statsUsageTrendAvgChange.textContent = `${avgChange}% vs last`;
    }
  };

  renderUsageTrendView();
  renderTrendView(
    currentTagRange,
    currentTagOffset,
    currentStatsTagId,
    statsTagChart,
    statsTagDateLabel,
    statsTagRange,
    statsTagTitle,
    statsTagTotal,
    statsTagChange,
    statsTagAvg,
    statsTagAvgChange
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
              ${TRASH_ICON_SVG}
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
  if (!blockingStyleButtons.length) {
    return;
  }
  blockingStyleButtons.forEach((button) => {
    const isOverlay = button.dataset.blockingStyle === "overlay";
    button.classList.toggle("active", isOverlay === overlayMode);
  });
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

const getSimpleListKey = () => {
  if (currentListType === "blocked") {
    return currentEntryType === "domain" ? "blockedDomains" : "blockedKeywords";
  }
  return currentEntryType === "domain" ? "allowedDomains" : "allowedKeywords";
};

const buildListEmptyState = () => {
  const isBlocked = currentListType === "blocked";
  const isDomain = currentEntryType === "domain";
  const noun = isDomain ? "website" : "keyword";
  const pluralNoun = isDomain ? "websites" : "keywords";
  const title = `${isBlocked ? "Blocked" : "Allowed"} ${pluralNoun} will show up here.`;
  const hint = `Try ${isBlocked ? "blocking" : "allowing"} a ${noun} like`;
  const example = isDomain
    ? isBlocked
      ? "youtube.com"
      : "calendar.google.com"
    : isBlocked
      ? "news"
      : "tutorial";
  const safeExample = escapeHtml(example);
  return `
    <div class="list-empty">
      <p class="list-empty-title">${title}</p>
      <p class="list-empty-hint">${hint}</p>
      <div class="list-empty-actions">
        <button class="chip list-example-chip" type="button" data-list-example="${safeExample}">${safeExample}</button>
      </div>
    </div>
  `;
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

  if (!listItems) {
    return;
  }

  if (isAdvanced) {
    listItems.innerHTML = "";
    latestAdvancedText = lists.advancedRulesText ?? "";
    ensureAdvancedDraft(latestAdvancedText);
    renderAdvancedDraft();
    renderYoutubeExceptions(lists);
    renderAdvancedPatternMode();
    void prefillAdvancedInputFromTab();
    return;
  }

  const key = getListKey();
  const items = lists[key as "blockedDomains" | "blockedKeywords" | "allowedDomains" | "allowedKeywords"];

  listItems.innerHTML = items.length
    ? items
        .map(
          (value) =>
            `<div class=\"list-item\"><span class=\"list-item-text\" title=\"${value}\">${value}</span><button class=\"icon-btn icon-only list-delete-btn\" type=\"button\" data-value=\"${value}\" aria-label=\"Remove entry\">
              ${TRASH_ICON_SVG}
            </button></div>`
        )
        .join("")
    : buildListEmptyState();

  maybePrefillListInput();
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

const getTagPomodoroConfig = (tag: StorageSchema["tags"]["items"][number] | null) => {
  if (!tag) {
    return { ...DEFAULT_POMODORO };
  }
  return {
    workMin:
      typeof tag.pomodoroWorkMin === "number"
        ? tag.pomodoroWorkMin
        : DEFAULT_POMODORO.workMin,
    breakMin:
      typeof tag.pomodoroBreakMin === "number"
        ? tag.pomodoroBreakMin
        : DEFAULT_POMODORO.breakMin,
    cycles:
      typeof tag.pomodoroCycles === "number"
        ? tag.pomodoroCycles
        : DEFAULT_POMODORO.cycles
  };
};

const formatTagPomodoro = (config: { workMin: number; breakMin: number; cycles: number }) => {
  const cycleLabel = config.cycles === 0 ? "Endless" : `${config.cycles} cycles`;
  return `${config.workMin}m focus · ${config.breakMin}m break · ${cycleLabel}`;
};


const deleteTagById = async (tagId: string) => {
  const state = await getState();
  const items = state.tags.items.filter((item) => item.id !== tagId);
  const isActive = state.pomodoro.lastTagId === tagId;
  const pomodoroUpdate = isActive
    ? state.pomodoro.running
      ? { lastTagId: null }
      : {
          lastTagId: null,
          workMin: DEFAULT_POMODORO.workMin,
          breakMin: DEFAULT_POMODORO.breakMin,
          cycles: DEFAULT_POMODORO.cycles
        }
    : { lastTagId: state.pomodoro.lastTagId ?? null };
  await setState({
    tags: { items },
    pomodoro: pomodoroUpdate
  });
};

const syncTagCyclesInput = () => {
  if (!tagCycles || !tagEndless) {
    return;
  }
  const endlessOn = tagEndless.checked;
  tagCycles.disabled = endlessOn;
};

const openTagModal = (tag: StorageSchema["tags"]["items"][number] | null) => {
  currentTagEditId = tag?.id ?? null;
  if (tagModalTitle) {
    tagModalTitle.textContent = tag ? "Edit tag" : "New tag";
  }
  if (tagName) {
    tagName.value = tag?.title ?? "";
  }
  const config = getTagPomodoroConfig(tag);
  if (tagWork) {
    tagWork.value = String(config.workMin);
  }
  if (tagBreak) {
    tagBreak.value = String(config.breakMin);
  }
  if (tagEndless) {
    tagEndless.checked = config.cycles === 0;
  }
  if (tagCycles) {
    tagCycles.value = String(config.cycles === 0 ? 1 : config.cycles);
  }
  if (tagColor) {
    tagColor.value = tag?.color ?? "#9cff3a";
  }
  syncTagCyclesInput();
  if (tagDelete) {
    tagDelete.classList.toggle("hidden", !tag);
  }
  openModal("tag");
};

const openTagSelectPrompt = (tagId: string | null) => {
  const title = tagId
    ? currentTags?.items.find((item) => item.id === tagId)?.title ?? "Tag"
    : "Default";
  pendingTagSelectId = tagId;
  if (tagSelectLabel) {
    tagSelectLabel.textContent = `Set "${title}" as active?`;
  }
  openModal("tagSelectConfirm");
};

const setActiveTag = async (tagId: string | null) => {
  const state = await getState();
  const tag = tagId
    ? state.tags.items.find((item) => item.id === tagId) ?? null
    : null;
  const config = getTagPomodoroConfig(tag);
  if (state.pomodoro.running) {
    await setState({
      pomodoro: {
        lastTagId: tag ? tag.id : null
      }
    });
  } else {
    await setState({
      pomodoro: {
        lastTagId: tag ? tag.id : null,
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

const validViews = new Set(["home", "timer", "lists", "stats", "settings"]);

const applyView = (viewId: string, behavior: ScrollBehavior = "smooth") => {
  if (!validViews.has(viewId)) {
    return;
  }
  setActiveView(viewId);
  scrollAppMainToTop(behavior);
};

const getPopupViewOnce = async (): Promise<string | null> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(POPUP_VIEW_KEY, (stored) => {
      const value = stored[POPUP_VIEW_KEY];
      if (typeof value !== "string" || !validViews.has(value)) {
        resolve(null);
        return;
      }
      chrome.storage.local.remove(POPUP_VIEW_KEY, () => resolve(value));
    });
  });
};

const getPopupTagSettingsOnce = async (): Promise<string | null> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(POPUP_TAG_SETTINGS_KEY, (stored) => {
      const value = stored[POPUP_TAG_SETTINGS_KEY];
      if (typeof value !== "string" || !value) {
        resolve(null);
        return;
      }
      chrome.storage.local.remove(POPUP_TAG_SETTINGS_KEY, () => resolve(value));
    });
  });
};

const scrollAppMainToTop = (behavior: ScrollBehavior = "smooth") => {
  const main = document.querySelector<HTMLElement>(".app-main");
  if (!main) {
    return;
  }
  if (typeof main.scrollTo === "function") {
    main.scrollTo({ top: 0, behavior });
  } else {
    main.scrollTop = 0;
  }
};

let toastTimeout: number | null = null;
let toastExitTimeout: number | null = null;
const showToast = (message: string) => {
  if (!toastRegion) {
    return;
  }
  toastRegion.textContent = "";
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toastRegion.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.add("is-visible");
  });
  if (toastTimeout !== null) {
    window.clearTimeout(toastTimeout);
  }
  if (toastExitTimeout !== null) {
    window.clearTimeout(toastExitTimeout);
  }
  toastTimeout = window.setTimeout(() => {
    toast.classList.remove("is-visible");
    toast.classList.add("is-exiting");
    toastExitTimeout = window.setTimeout(() => {
      toast.remove();
    }, 340);
  }, 1700);
};

const scrollAppMainToElement = (element: HTMLElement, behavior: ScrollBehavior = "smooth") => {
  const main = document.querySelector<HTMLElement>(".app-main");
  if (!main) {
    return;
  }
  const mainRect = main.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const offsetTop = elementRect.top - mainRect.top;
  const targetTop = main.scrollTop + offsetTop;
  if (typeof main.scrollTo === "function") {
    main.scrollTo({ top: targetTop, behavior });
  } else {
    main.scrollTop = targetTop;
  }
};

const setStatsSubview = (
  view: "summary" | "trend" | "usage-trend" | "tag",
  options?: { scroll?: "top" | "none" | "element"; element?: HTMLElement | null }
) => {
  currentStatsSubview = view;
  statsSummaryView?.classList.toggle("active", view === "summary");
  statsTrendView?.classList.toggle("active", view === "trend");
  statsUsageTrendView?.classList.toggle("active", view === "usage-trend");
  statsTagView?.classList.toggle("active", view === "tag");
  const scrollMode = options?.scroll ?? "top";
  if (scrollMode === "top") {
    scrollAppMainToTop("smooth");
  } else if (scrollMode === "element" && options?.element) {
    scrollAppMainToElement(options.element, "smooth");
  }
};

const setStatsSegment = (segment: "pomodoro" | "focus" | "usage") => {
  currentStatsSegment = segment;
  statsSegmentButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.segment === segment);
  });
  statsPomodoroSegment?.classList.toggle("active", segment === "pomodoro");
  statsFocusSegment?.classList.toggle("active", segment === "focus");
  statsUsageSegment?.classList.toggle("active", segment === "usage");
};

const setPomodoroSummaryTab = (tab: "quality" | "volume") => {
  currentPomodoroSummaryTab = tab;
  pomodoroSummaryTabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });
  pomodoroSummaryGroups.forEach((group) => {
    group.classList.toggle("is-active", group.dataset.tab === tab);
  });
};

const setFocusSummaryTab = (tab: "quality" | "volume" | "interruptions") => {
  currentFocusSummaryTab = tab;
  focusSummaryTabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });
  focusSummaryGroups.forEach((group) => {
    group.classList.toggle("is-active", group.dataset.tab === tab);
  });
};

const openTagStats = async (tagId: string) => {
  const state = await getState();
  const tag = state.tags.items.find((item) => item.id === tagId);
  currentStatsTagId = tagId;
  if (statsTagTitle) {
    const title = tag?.title ?? "Tag";
    statsTagTitle.textContent = truncateLabel(title, 18);
    statsTagTitle.setAttribute("title", title);
  }
  setStatsSubview("tag");
  renderStats(state);
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
      const main = document.querySelector<HTMLElement>(".app-main");
      if (main) {
        main.scrollTop = 0;
      }
    });
  });

  toggleEl?.addEventListener("change", async () => {
    if (currentStrictActive || currentScheduleActive) {
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
      focusSessionStartedAt: next ? Date.now() : undefined,
      focusSessionSource: next ? "manual" : undefined,
      pause: { isPaused: false, pauseType: null, pauseEndAt: null, pauseStartedAt: undefined }
    });
  });

  blockingStyleButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const nextMode = button.dataset.blockingStyle === "overlay";
      await setState({ overlayMode: nextMode });
      blockingStyleButtons.forEach((btn) => btn.classList.toggle("active", btn === button));
    });
  });


  confirmToggle?.addEventListener("change", async () => {
    await setState({ confirmationPrompt: confirmToggle.checked });
  });

  strictEmergencyToggle?.addEventListener("change", async () => {
    await setState({ ui: { allowEmergencyInStrict: strictEmergencyToggle.checked } });
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
        await setState({
          pause: { isPaused: false, pauseType: null, pauseEndAt: null, pauseStartedAt: undefined }
        });
        return;
      }
      if (kind === "1h") {
        await setState({
          focusEnabled: true,
          pause: {
            isPaused: true,
            pauseType: "1h",
            pauseEndAt: now + 60 * 60 * 1000,
            pauseStartedAt: now
          }
        });
      } else if (kind === "eod") {
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        await setState({
          focusEnabled: true,
          pause: {
            isPaused: true,
            pauseType: "eod",
            pauseEndAt: end.getTime(),
            pauseStartedAt: now
          }
        });
      } else if (kind === "manual") {
        await setState({
          focusEnabled: true,
          pause: { isPaused: true, pauseType: "manual", pauseEndAt: null, pauseStartedAt: now }
        });
      }
    });
  });

  pomodoroStart?.addEventListener("click", async () => {
    if (currentStrictActive) {
      return;
    }
    const state = await getState();
    const activeTag = state.pomodoro.lastTagId
      ? state.tags.items.find((item) => item.id === state.pomodoro.lastTagId) ?? null
      : null;
    const config = getTagPomodoroConfig(activeTag);
    const now = Date.now();
    const endsAt = now + config.workMin * 60 * 1000;
    await setState({
      focusEnabled: state.pomodoro.autoBlockDuringWork ? true : currentFocusEnabled,
      pomodoro: {
        workMin: config.workMin,
        breakMin: config.breakMin,
        cycles: config.cycles,
        pendingConfig: null,
        autoBlockDuringWork: state.pomodoro.autoBlockDuringWork,
        blockDuringBreak: state.pomodoro.blockDuringBreak,
        lastTagId: activeTag?.id ?? null,
        running: {
          phase: "work",
          startedAt: now,
          endsAt,
          cycleIndex: 0,
          paused: false,
          linkedTagId: activeTag?.id ?? null,
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
          running: {
            ...running,
            paused: false,
            endsAt,
            remainingMs: undefined,
            pauseStartedAt: undefined
          }
        }
      });
      return;
    }
    const remaining = Math.max(0, running.endsAt - Date.now());
    await setState({
      pomodoro: {
        running: {
          ...running,
          paused: true,
          remainingMs: remaining,
          pauseStartedAt: Date.now()
        }
      }
    });
  });

  pomodoroStop?.addEventListener("click", async () => {
    const state = await getState();
    const running = state.pomodoro.running;
    if (!running) {
      return;
    }
    const cycleIndex = running.cycleIndex ?? 0;
    const completedCycles = Math.max(0, cycleIndex);
    const elapsedMs = running.startedAt ? Math.max(0, Date.now() - running.startedAt) : 0;
    const perCycleMs = (state.pomodoro.workMin + state.pomodoro.breakMin) * 60 * 1000;
    const totalMs = completedCycles * perCycleMs + elapsedMs;
    const completionMinutes = Math.max(1, Math.ceil(totalMs / 60000));
    const completionCycles = Math.max(0, completedCycles);
    const pendingConfig = state.pomodoro.pendingConfig ?? null;
    const baseUpdate = pendingConfig
      ? {
          workMin: pendingConfig.workMin,
          breakMin: pendingConfig.breakMin,
          cycles: pendingConfig.cycles,
          pendingConfig: null
        }
      : {};
    await setState({
      pomodoro: {
        running: null,
        lastCompletion: {
          mode: "interrupted",
          minutes: completionMinutes,
          cycles: completionCycles,
          endedAt: Date.now(),
          tagId: running.linkedTagId ?? null
        },
        ...baseUpdate
      }
    });
  });

  pomodoroAutoBlock?.addEventListener("change", async () => {
    await setState({ pomodoro: { autoBlockDuringWork: pomodoroAutoBlock.checked } });
  });

  pomodoroBlockBreak?.addEventListener("change", async () => {
    await setState({ pomodoro: { blockDuringBreak: pomodoroBlockBreak.checked } });
  });

  pomodoroSounds?.addEventListener("change", async () => {
    await setState({ pomodoro: { sounds: pomodoroSounds.checked } });
  });

  analyticsRetention?.addEventListener("change", async () => {
    const value = Number(analyticsRetention.value);
    await setState({ analytics: { retentionDays: Number.isFinite(value) ? value : 90 } });
  });

  tagAdd?.addEventListener("click", () => {
    openTagModal(null);
  });

  tagShowAll?.addEventListener("click", () => {
    openModal("tagPicker");
  });

  tagActiveSettings?.addEventListener("click", () => {
    const tagId = tagActiveSettings.getAttribute("data-tag-settings");
    if (!tagId || !currentTags) {
      return;
    }
    const tag = currentTags.items.find((item) => item.id === tagId) ?? null;
    if (!tag) {
      return;
    }
    openTagModal(tag);
  });

  tagEndless?.addEventListener("change", () => {
    syncTagCyclesInput();
    if (tagCycles && tagEndless && !tagEndless.checked && !tagCycles.value) {
      tagCycles.value = "1";
    }
  });

  tagSave?.addEventListener("click", async () => {
    const name = tagName?.value.trim() ?? "";
    if (!name) {
      return;
    }
    const work = clamp(Number(tagWork?.value ?? DEFAULT_POMODORO.workMin), 1, 120);
    const rest = clamp(Number(tagBreak?.value ?? DEFAULT_POMODORO.breakMin), 1, 60);
    const cycles = tagEndless?.checked
      ? 0
      : clamp(Number(tagCycles?.value ?? 1), 1, 12);
    const color = tagColor?.value ?? "#9cff3a";
    const state = await getState();
    const items = [...state.tags.items];
    if (currentTagEditId) {
      const index = items.findIndex((item) => item.id === currentTagEditId);
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
      const newTag = {
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
      items.push(newTag);
    }
    const isActive = Boolean(currentTagEditId && state.pomodoro.lastTagId === currentTagEditId);
    const isRunning = Boolean(state.pomodoro.running);
    if (isActive && isRunning) {
      await setState({ tags: { items } });
      pendingTagApplyConfig = { workMin: work, breakMin: rest, cycles, tagId: currentTagEditId };
      closeModal("tag");
      openModal("tagApplyPrompt");
      showToast("Saved. Choose when to apply.");
      return;
    }
    const pomodoroUpdate = isActive
      ? { workMin: work, breakMin: rest, cycles, lastTagId: currentTagEditId, pendingConfig: null }
      : { lastTagId: state.pomodoro.lastTagId ?? null };
    await setState({ tags: { items }, pomodoro: pomodoroUpdate });
    closeModal("tag");
    showToast("Saved!");
  });

  tagApplyNow?.addEventListener("click", async () => {
    if (!pendingTagApplyConfig) {
      closeModal("tagApplyPrompt");
      return;
    }
    const { workMin, breakMin, cycles, tagId } = pendingTagApplyConfig;
    const state = await getState();
    const running = state.pomodoro.running;
    const baseUpdate = {
      workMin,
      breakMin,
      cycles,
      lastTagId: tagId,
      pendingConfig: null
    };
    if (running) {
      const cycleIndex = running.cycleIndex ?? 0;
      const completedCycles = Math.max(0, cycleIndex);
      const elapsedMs = running.startedAt ? Math.max(0, Date.now() - running.startedAt) : 0;
      const perCycleMs = (state.pomodoro.workMin + state.pomodoro.breakMin) * 60 * 1000;
      const totalMs = completedCycles * perCycleMs + elapsedMs;
      const completionMinutes = Math.max(1, Math.ceil(totalMs / 60000));
      const completionCycles = Math.max(0, completedCycles);
      await setState({
        pomodoro: {
          running: null,
          lastCompletion: {
            mode: "interrupted",
            minutes: completionMinutes,
            cycles: completionCycles,
            endedAt: Date.now(),
            tagId: running.linkedTagId ?? null
          },
          ...baseUpdate
        }
      });
    } else {
      await setState({ pomodoro: baseUpdate });
    }
    pendingTagApplyConfig = null;
    closeModal("tagApplyPrompt");
    showToast("Applied.");
  });

  tagApplyLater?.addEventListener("click", async () => {
    if (!pendingTagApplyConfig) {
      closeModal("tagApplyPrompt");
      return;
    }
    const { workMin, breakMin, cycles } = pendingTagApplyConfig;
    await setState({
      pomodoro: {
        pendingConfig: {
          workMin,
          breakMin,
          cycles
        }
      }
    });
    pendingTagApplyConfig = null;
    closeModal("tagApplyPrompt");
    showToast("Will apply after this session.");
  });

  tagDelete?.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!currentTagEditId) {
      return;
    }
    currentTagDeleteId = currentTagEditId;
    openModal("tagDeleteConfirm");
  });

  tagDeleteConfirm?.addEventListener("click", async () => {
    if (!currentTagDeleteId) {
      return;
    }
    await deleteTagById(currentTagDeleteId);
    currentTagDeleteId = null;
    closeModal("tagDeleteConfirm");
    closeModal("tag");
  });

  tagDeleteCancel?.addEventListener("click", () => {
    currentTagDeleteId = null;
    closeModal("tagDeleteConfirm");
  });

  listDeleteConfirm?.addEventListener("click", async () => {
    if (!pendingListDeleteValue || !pendingListDeleteKey) {
      return;
    }
    const state = await getState();
    const list = [...state.lists[pendingListDeleteKey]] as string[];
    const next = list.filter((entry) => entry !== pendingListDeleteValue);
    await setState({ lists: { [pendingListDeleteKey]: next } });
    pendingListDeleteValue = null;
    pendingListDeleteKey = null;
    if (listDeleteValue) {
      listDeleteValue.textContent = "";
    }
    closeModal("listDeleteConfirm");
  });

  listDeleteCancel?.addEventListener("click", () => {
    pendingListDeleteValue = null;
    pendingListDeleteKey = null;
    if (listDeleteValue) {
      listDeleteValue.textContent = "";
    }
    closeModal("listDeleteConfirm");
  });

  const handleTagSelectClick = (event: MouseEvent, closePicker?: boolean) => {
    const target = event.target as HTMLElement;
    const settingsButton = target.closest<HTMLElement>("[data-tag-settings]");
    if (settingsButton) {
      const tagId = settingsButton.getAttribute("data-tag-settings");
      if (!tagId || !currentTags) {
        return;
      }
      const tag = currentTags.items.find((item) => item.id === tagId) ?? null;
      if (!tag) {
        return;
      }
      if (closePicker) {
        closeModal("tagPicker");
      }
      openTagModal(tag);
      return;
    }
    const card = target.closest<HTMLElement>("[data-tag-select]");
    if (!card) {
      return;
    }
    const isDefault = card.hasAttribute("data-tag-default");
    const tagId = isDefault ? null : card.getAttribute("data-tag-id");
    if (!isDefault && !tagId) {
      return;
    }
    if (closePicker) {
      closeModal("tagPicker");
    }
    openTagSelectPrompt(tagId);
  };

  tagQuickGrid?.addEventListener("click", (event) => {
    handleTagSelectClick(event);
  });

  tagAllGrid?.addEventListener("click", (event) => {
    handleTagSelectClick(event, true);
  });

  tagSelectConfirm?.addEventListener("click", async () => {
    if (pendingTagSelectId === undefined) {
      return;
    }
    await setActiveTag(pendingTagSelectId ?? null);
    pendingTagSelectId = undefined;
    closeModal("tagSelectConfirm");
  });

  strictDurationButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (currentStrictActive || currentPomodoro?.running) {
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
    if (currentStrictActive || currentPomodoro?.running) {
      return;
    }
    openModal("strictConfirm");
  });

  strictConfirm?.addEventListener("click", async () => {
    if (currentStrictActive || currentPomodoro?.running) {
      return;
    }
    const startedAt = Date.now();
    const endsAt = startedAt + currentStrictMinutes * 60 * 1000;
    await setState({
      focusEnabled: true,
      pause: { isPaused: false, pauseType: null, pauseEndAt: null, pauseStartedAt: undefined },
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

  youtubeDisclosure?.querySelector<HTMLButtonElement>(".youtube-toggle")?.addEventListener(
    "click",
    () => {
      const open = youtubeDisclosure.classList.toggle("is-open");
      const toggle = youtubeDisclosure.querySelector<HTMLButtonElement>(".youtube-toggle");
      toggle?.setAttribute("aria-expanded", String(open));
    }
  );

  advancedDisclosure
    ?.querySelector<HTMLButtonElement>(".advanced-toggle")
    ?.addEventListener("click", () => {
      const open = advancedDisclosure.classList.toggle("is-open");
      const toggle = advancedDisclosure.querySelector<HTMLButtonElement>(".advanced-toggle");
      toggle?.setAttribute("aria-expanded", String(open));
      if (open) {
        void prefillAdvancedInputFromTab();
      }
    });

  advancedPatternModeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.mode as AdvancedPatternMode | undefined;
      if (!mode) {
        return;
      }
      advancedPatternMode = mode;
      renderAdvancedPatternMode();
      void prefillAdvancedInputFromTab();
    });
  });

  advancedPatternAdd?.addEventListener("click", () => {
    if (!advancedPatternInput) {
      return;
    }
    const value = normalizeAdvancedValue(advancedPatternInput.value);
    if (!value) {
      return;
    }
    ensureAdvancedDraft(latestAdvancedText);
    if (!advancedDraft) {
      return;
    }
    const list = advancedPatternMode === "allow" ? advancedDraft.allow : advancedDraft.block;
    if (list.includes(value)) {
      return;
    }
    list.push(value);
    advancedPatternInput.value = "";
    renderAdvancedDraft();
    renderAdvancedPatternMode();
  });

  youtubeModeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.mode as YoutubeExceptionMode | undefined;
      if (!mode) {
        return;
      }
      youtubeExceptionMode = mode;
      void getState().then((state) => renderYoutubeExceptions(state.lists));
    });
  });

  youtubeExceptionType?.addEventListener("change", () => {
    void getState().then((state) => renderYoutubeExceptions(state.lists));
  });

  youtubeExceptionUseTab?.addEventListener("click", () => {
    void prefillYoutubeExceptionFromTab();
  });

  youtubeExceptionAdd?.addEventListener("click", async () => {
    if (!youtubeExceptionInput || !youtubeExceptionType) {
      return;
    }
    const kind = youtubeExceptionType.value as YoutubeExceptionKind;
    const parsed = extractYoutubeId(kind, youtubeExceptionInput.value);
    if (!parsed) {
      return;
    }
    const state = await getState();
    const current = state.lists.youtubeExceptions ?? {
      allowedVideos: [],
      blockedVideos: [],
      allowedPlaylists: [],
      blockedPlaylists: []
    };
    const key = getYoutubeListKey(youtubeExceptionMode, kind);
    const list = [...current[key]] as string[];
    if (list.includes(parsed)) {
      return;
    }
    list.push(parsed);
    youtubeExceptionInput.value = "";
    const next = { ...current, [key]: list };
    await setState({ lists: { youtubeExceptions: next } });
    renderYoutubeExceptions({ ...state.lists, youtubeExceptions: next });
  });

  youtubeExceptionItems?.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>("[data-youtube-kind]");
    if (!button) {
      return;
    }
    const kind = button.dataset.youtubeKind as YoutubeExceptionKind | undefined;
    const value = button.dataset.youtubeValue;
    if (!kind || !value) {
      return;
    }
    const state = await getState();
    const current = state.lists.youtubeExceptions ?? {
      allowedVideos: [],
      blockedVideos: [],
      allowedPlaylists: [],
      blockedPlaylists: []
    };
    const key = getYoutubeListKey(youtubeExceptionMode, kind);
    const list = current[key].filter((entry) => entry !== value);
    const next = { ...current, [key]: list };
    await setState({ lists: { youtubeExceptions: next } });
    renderYoutubeExceptions({ ...state.lists, youtubeExceptions: next });
  });

  const handleAdvancedInput = (event: Event) => {
    const input = event.target as HTMLInputElement | null;
    if (!input) {
      return;
    }
    const row = input.closest<HTMLElement>(".advanced-item");
    const type = row?.dataset.advType as "allow" | "block" | undefined;
    const index = Number(row?.dataset.index ?? "-1");
    if (!type || Number.isNaN(index)) {
      return;
    }
    setAdvancedDraftValue(type, index, input.value);
  };

  const handleAdvancedRemove = (event: Event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-adv-remove]");
    if (!button) {
      return;
    }
    const row = button.closest<HTMLElement>(".advanced-item");
    const type = row?.dataset.advType as "allow" | "block" | undefined;
    const index = Number(row?.dataset.index ?? "-1");
    if (!type || Number.isNaN(index)) {
      return;
    }
    removeAdvancedDraftValue(type, index);
  };

  advancedAllowList?.addEventListener("input", handleAdvancedInput);
  advancedAllowList?.addEventListener("click", handleAdvancedRemove);
  advancedBlockList?.addEventListener("input", handleAdvancedInput);
  advancedBlockList?.addEventListener("click", handleAdvancedRemove);

  listAddButton?.addEventListener("click", async () => {
    if (currentListType === "advanced") {
      return;
    }
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
    const key = getSimpleListKey();
    const list = [...state.lists[key]] as string[];
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
    const exampleButton = target.closest<HTMLButtonElement>("[data-list-example]");
    if (exampleButton) {
      const example = exampleButton.dataset.listExample;
      if (example && listInput) {
        listInput.value = example;
        listInput.focus();
      }
      return;
    }
    const button = target.closest("button");
    const value = button?.getAttribute("data-value");
    if (!value) {
      return;
    }
    pendingListDeleteValue = value;
    pendingListDeleteKey = getSimpleListKey() as ListDeleteKey;
    if (listDeleteValue) {
      listDeleteValue.textContent = value;
    }
    openModal("listDeleteConfirm");
  });

  advancedSave?.addEventListener("click", async () => {
    const allowLines = (advancedDraft?.allow ?? [])
      .map((value) => normalizeAdvancedValue(value))
      .filter((value) => value.length > 0)
      .map((value) => `!${value.replace(/^!+/, "")}`);
    const blockLines = (advancedDraft?.block ?? [])
      .map((value) => normalizeAdvancedValue(value))
      .filter((value) => value.length > 0)
      .map((value) => value.replace(/^!+/, ""));
    const text = [...allowLines, ...blockLines].join("\n");
    await setState({ lists: { advancedRulesText: text } });
    latestAdvancedText = text;
    advancedDraft = buildAdvancedDraft(text);
    renderAdvancedDraft();
    showToast("Saved!");
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
    showToast("Saved!");
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
      focusSessionStartedAt: undefined,
      focusSessionSource: undefined,
      pause: { isPaused: false, pauseType: null, pauseEndAt: null, pauseStartedAt: undefined }
    });
    closeModal("focusOffConfirm");
  });

  focusOffCancel?.addEventListener("click", () => {
    pendingFocusOff = false;
  });

  statsPomodoroRangeButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const range = button.dataset.range as "today" | "week" | "month" | undefined;
      if (!range) {
        return;
      }
      currentPomodoroSummaryRange = range;
      await setState({ analytics: { chartRange: range } });
      const state = await getState();
      renderStats(state);
    });
  });

  statsUsageSummaryRangeButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const range = button.dataset.range as "today" | "week" | "month" | undefined;
      if (!range) {
        return;
      }
      currentUsageSummaryRange = range;
      const state = await getState();
      renderStats(state);
    });
  });

  statsFocusSummaryRangeButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const range = button.dataset.range as "today" | "week" | "month" | undefined;
      if (!range) {
        return;
      }
      currentFocusSummaryRange = range;
      const state = await getState();
      renderStats(state);
    });
  });

  statsSegmentButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const segment = button.dataset.segment as "pomodoro" | "focus" | "usage" | undefined;
      if (!segment) {
        return;
      }
      setStatsSegment(segment);
      void getState().then((state) => renderStats(state));
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
    void panel;
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

  pomodoroSummaryTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tab = button.dataset.tab as "quality" | "volume" | undefined;
      if (!tab) {
        return;
      }
      setPomodoroSummaryTab(tab);
    });
  });

  focusSummaryTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tab = button.dataset.tab as "quality" | "volume" | "interruptions" | undefined;
      if (!tab) {
        return;
      }
      setFocusSummaryTab(tab);
    });
  });

  statsShowAll?.addEventListener("click", () => {
    const tagsCard = statsTrendTags?.closest(".card") as HTMLElement | null;
    setStatsSubview("trend", {
      scroll: tagsCard ? "element" : "top",
      element: tagsCard
    });
  });

  statsUsageTrendCard?.addEventListener("click", () => {
    setStatsSubview("usage-trend");
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

  statsUsageTrendCard?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    setStatsSubview("usage-trend");
  });

  statsBack?.addEventListener("click", () => {
    setStatsSubview("summary");
  });

  statsUsageBack?.addEventListener("click", () => {
    setStatsSubview("summary");
  });

  statsTagBack?.addEventListener("click", () => {
    setStatsSubview("trend");
  });

  statsTrendRangeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const range = button.dataset.range as TrendRange | undefined;
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

  statsUsageTrendRangeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const range = button.dataset.usageTrendRange as TrendRange | undefined;
      if (!range) {
        return;
      }
      currentUsageTrendRange = range;
      currentUsageTrendOffset = 0;
      void getState().then((nextState) => renderStats(nextState));
    });
  });

  statsUsageTrendFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.usageTrendFilter as "all" | "allowed" | "blocked" | undefined;
      if (!filter) {
        return;
      }
      currentUsageTrendFilter = filter;
      void getState().then((nextState) => renderStats(nextState));
    });
  });

  statsUsageDatePrev?.addEventListener("click", () => {
    currentUsageTrendOffset -= 1;
    void getState().then((nextState) => renderStats(nextState));
  });

  statsUsageDateNext?.addEventListener("click", () => {
    currentUsageTrendOffset += 1;
    void getState().then((nextState) => renderStats(nextState));
  });

  statsTagRangeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const range = button.dataset.range as TrendRange | undefined;
      if (!range) {
        return;
      }
      currentTagRange = range;
      currentTagOffset = 0;
      statsTagRangeButtons.forEach((btn) => {
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

  statsTagDatePrev?.addEventListener("click", () => {
    currentTagOffset -= 1;
    void getState().then((nextState) => renderStats(nextState));
  });

  statsTagDateNext?.addEventListener("click", () => {
    currentTagOffset += 1;
    void getState().then((nextState) => renderStats(nextState));
  });

  statsSummaryTags?.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const row = target.closest<HTMLElement>(".stats-tag-card");
    const tagId = row?.getAttribute("data-tag-id");
    if (!tagId) {
      return;
    }
    void openTagStats(tagId);
  });

  statsTrendTags?.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const row = target.closest<HTMLElement>(".stats-tag-card");
    const tagId = row?.getAttribute("data-tag-id");
    if (!tagId) {
      return;
    }
    void openTagStats(tagId);
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

  const downloadJson = (filename: string, payload: unknown) => {
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
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
    const rangeKeys = getRangeKeys(currentPomodoroSummaryRange);
    const keys = rangeKeys.slice().reverse();
    const rows: Array<Array<string | number | null | undefined>> = [
      [
        "Day",
        "Pomodoro reliability (%)",
        "Pause burden (%)",
        "Tags completed",
        "Tags interrupted",
        "Total pomodoro time (min)",
        "Focus time (min)",
        "Break time (min)"
      ]
    ];
    keys.forEach((key) => {
      const summary = buildPomodoroSummaryMetrics(state, [key]);
      rows.push([
        key,
        Math.round(summary.reliability * 100),
        Math.round(summary.pauseBurden * 100),
        summary.tagsCompleted,
        summary.tagsInterrupted,
        minutesFromMs(summary.pomodoroMs),
        minutesFromMs(summary.workMsEst),
        minutesFromMs(summary.breakMsEst)
      ]);
    });
    if (currentPomodoroSummaryRange !== "today") {
      const summary = buildPomodoroSummaryMetrics(state, rangeKeys);
      rows.push([
        "Total",
        Math.round(summary.reliability * 100),
        Math.round(summary.pauseBurden * 100),
        summary.tagsCompleted,
        summary.tagsInterrupted,
        minutesFromMs(summary.pomodoroMs),
        minutesFromMs(summary.workMsEst),
        minutesFromMs(summary.breakMsEst)
      ]);
    }
    downloadCsv(`focusboss-pomodoro-summary-${currentPomodoroSummaryRange}.csv`, rows);
  });

  exportPomodoroJson?.addEventListener("click", async () => {
    const state = await getState();
    const rangeKeys = getRangeKeys(currentPomodoroSummaryRange);
    const summary = buildPomodoroSummaryMetrics(state, rangeKeys);
    const days = rangeKeys.slice().reverse().map((key) => {
      const daySummary = buildPomodoroSummaryMetrics(state, [key]);
      return {
        Day: key,
        "Pomodoro reliability (%)": Math.round(daySummary.reliability * 100),
        "Pause burden (%)": Math.round(daySummary.pauseBurden * 100),
        "Tags completed": daySummary.tagsCompleted,
        "Tags interrupted": daySummary.tagsInterrupted,
        "Total pomodoro time (ms)": daySummary.pomodoroMs,
        "Focus time (ms)": daySummary.workMsEst,
        "Break time (ms)": daySummary.breakMsEst
      };
    });
    const payload = {
      Range: currentPomodoroSummaryRange,
      Summary: {
        "Pomodoro reliability (%)": Math.round(summary.reliability * 100),
        "Pause burden (%)": Math.round(summary.pauseBurden * 100),
        "Tags completed": summary.tagsCompleted,
        "Tags interrupted": summary.tagsInterrupted,
        "Total pomodoro time (ms)": summary.pomodoroMs,
        "Focus time (ms)": summary.workMsEst,
        "Break time (ms)": summary.breakMsEst
      },
      Days: days,
      "Generated at": new Date().toISOString()
    };
    downloadJson(`focusboss-pomodoro-summary-${currentPomodoroSummaryRange}.json`, payload);
  });

  exportFocusCsv?.addEventListener("click", async () => {
    const state = await getState();
    const rangeKeys = getRangeKeys(currentFocusSummaryRange);
    const keys = rangeKeys.slice().reverse();
    const rows: Array<Array<string | number | null | undefined>> = [
      [
        "Day",
        "Focus reliability (%)",
        "Schedule reliability (%)",
        "Longest focus streak (min)",
        "Total focus time (min)",
        "Manual focus time (min)",
        "Manual sessions",
        "Strict time (min)",
        "Strict sessions",
        "Pause time (min)",
        "Total pauses",
        "Time to first pause (min)"
      ]
    ];
    keys.forEach((key) => {
      const summary = buildFocusSummaryMetricsForKeys(state, [key]);
      rows.push([
        key,
        Math.round(summary.reliability * 100),
        summary.scheduleReliability === null
          ? null
          : Math.round(summary.scheduleReliability * 100),
        minutesFromMs(summary.longestStreakMs),
        minutesFromMs(summary.totalFocusMs),
        minutesFromMs(summary.manualFocusMs),
        summary.manualCount,
        minutesFromMs(summary.strictMs),
        summary.strictCount,
        minutesFromMs(summary.pauseMs),
        summary.pauseCount,
        summary.avgFirstPause === null ? null : minutesFromMsPrecise(summary.avgFirstPause)
      ]);
    });
    if (currentFocusSummaryRange !== "today") {
      const summary = buildFocusSummaryMetricsForKeys(state, rangeKeys);
      rows.push([
        "Total",
        Math.round(summary.reliability * 100),
        summary.scheduleReliability === null
          ? null
          : Math.round(summary.scheduleReliability * 100),
        minutesFromMs(summary.longestStreakMs),
        minutesFromMs(summary.totalFocusMs),
        minutesFromMs(summary.manualFocusMs),
        summary.manualCount,
        minutesFromMs(summary.strictMs),
        summary.strictCount,
        minutesFromMs(summary.pauseMs),
        summary.pauseCount,
        summary.avgFirstPause === null ? null : minutesFromMsPrecise(summary.avgFirstPause)
      ]);
    }
    downloadCsv(`focusboss-focus-summary-${currentFocusSummaryRange}.csv`, rows);
  });

  exportFocusJson?.addEventListener("click", async () => {
    const state = await getState();
    const rangeKeys = getRangeKeys(currentFocusSummaryRange);
    const summary = buildFocusSummaryMetricsForKeys(state, rangeKeys);
    const days = rangeKeys.slice().reverse().map((key) => {
      const daySummary = buildFocusSummaryMetricsForKeys(state, [key]);
      return {
        Day: key,
        "Focus reliability (%)": Math.round(daySummary.reliability * 100),
        "Schedule reliability (%)":
          daySummary.scheduleReliability === null
            ? null
            : Math.round(daySummary.scheduleReliability * 100),
        "Longest focus streak (ms)": daySummary.longestStreakMs,
        "Total focus time (ms)": daySummary.totalFocusMs,
        "Manual focus time (ms)": daySummary.manualFocusMs,
        "Manual sessions": daySummary.manualCount,
        "Strict time (ms)": daySummary.strictMs,
        "Strict sessions": daySummary.strictCount,
        "Pause time (ms)": daySummary.pauseMs,
        "Total pauses": daySummary.pauseCount,
        "Time to first pause (ms)": daySummary.avgFirstPause
      };
    });
    const payload = {
      Range: currentFocusSummaryRange,
      Summary: {
        "Focus reliability (%)": Math.round(summary.reliability * 100),
        "Schedule reliability (%)":
          summary.scheduleReliability === null
            ? null
            : Math.round(summary.scheduleReliability * 100),
        "Longest focus streak (ms)": summary.longestStreakMs,
        "Total focus time (ms)": summary.totalFocusMs,
        "Manual focus time (ms)": summary.manualFocusMs,
        "Manual sessions": summary.manualCount,
        "Strict time (ms)": summary.strictMs,
        "Strict sessions": summary.strictCount,
        "Pause time (ms)": summary.pauseMs,
        "Total pauses": summary.pauseCount,
        "Time to first pause (ms)": summary.avgFirstPause
      },
      Days: days,
      "Generated at": new Date().toISOString()
    };
    downloadJson(`focusboss-focus-summary-${currentFocusSummaryRange}.json`, payload);
  });

  backupDownload?.addEventListener("click", async () => {
    const state = await getState();
    const includeAnalytics = Boolean(backupIncludeAnalytics?.checked);
    const backup = {
      version: 1,
      schemaVersion: SCHEMA_VERSION,
      createdAt: new Date().toISOString(),
      includeAnalytics,
      state: sanitizeBackupState(state, includeAnalytics)
    };
    downloadJson(`focusboss-backup-${getDayKey(new Date())}.json`, backup);
    closeModal("backup");
  });

  restoreApply?.addEventListener("click", async () => {
    const file = restoreFile?.files?.[0];
    if (!file) {
      window.alert("Select a backup file first.");
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      window.alert("Invalid backup file.");
      return;
    }
    const backupState = isPlainObject(parsed) && isPlainObject(parsed.state)
      ? (parsed.state as StorageSchema)
      : isPlainObject(parsed)
        ? (parsed as StorageSchema)
        : null;
    if (!backupState) {
      window.alert("Backup file is missing data.");
      return;
    }
    const backupIncludesAnalytics =
      isPlainObject(parsed) && typeof parsed.includeAnalytics === "boolean"
        ? parsed.includeAnalytics
        : hasAnalyticsData(backupState.analytics);
    const wantsAnalytics = Boolean(restoreIncludeAnalytics?.checked);
    if (wantsAnalytics && !backupIncludesAnalytics) {
      window.alert("This backup does not include analytics data.");
    }
    const includeAnalytics = wantsAnalytics && backupIncludesAnalytics;
    const mode =
      restoreModeButtons.find((button) => button.classList.contains("active"))
        ?.dataset.restoreMode === "overwrite"
        ? "overwrite"
        : "merge";
    const currentState = await getState();
    const nextState = buildRestoreState(backupState, includeAnalytics, mode, currentState);
    await writeFullState(nextState);
    const refreshed = await getState();
    syncUiFromState(refreshed);
    closeModal("restore");
  });

  restoreFileButton?.addEventListener("click", () => {
    restoreFile?.click();
  });

  restoreFile?.addEventListener("change", () => {
    if (!restoreFileName) {
      return;
    }
    restoreFileName.textContent =
      restoreFile.files?.[0]?.name ?? "No file selected";
    if (restoreFileMeta) {
      restoreFileMeta.textContent = "Backup schema: -- · Created: --";
    }
    const file = restoreFile.files?.[0];
    if (!file || !restoreFileMeta) {
      return;
    }
    file
      .text()
      .then((text) => {
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          restoreFileMeta.textContent = "Backup schema: -- · Created: --";
          return;
        }
        if (!isPlainObject(parsed)) {
          restoreFileMeta.textContent = "Backup schema: -- · Created: --";
          return;
        }
        const schema =
          typeof parsed.schemaVersion === "number"
            ? `v${parsed.schemaVersion}`
            : "--";
        const created =
          typeof parsed.createdAt === "string" && parsed.createdAt
            ? new Date(parsed.createdAt).toLocaleString()
            : "--";
        restoreFileMeta.textContent = `Backup schema: ${schema} · Created: ${created}`;
      })
      .catch(() => {
        restoreFileMeta.textContent = "Backup schema: -- · Created: --";
      });
  });

  restoreModeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      restoreModeButtons.forEach((btn) => btn.classList.toggle("active", btn === button));
    });
  });

  exportUsageCsv?.addEventListener("click", async () => {
    const state = await getState();
    const rangeKeys = getRangeKeys(currentUsageSummaryRange);
    const keys = rangeKeys.slice().reverse();
    const rows: Array<Array<string | number | null | undefined>> = [
      [
        "Day",
        "Total web time (min)",
        "Blocked time (min)",
        "Allowed time (min)",
        "Other time (min)",
        "Blocked change vs yesterday (%)",
        "Blocked change vs last week (%)"
      ]
    ];
    keys.forEach((key) => {
      const totals = buildUsageTotals(state, [key]);
      const date = parseDayKey(key);
      const prevDayKey = getDayKey(addDays(date, -1));
      const prevWeekKey = getDayKey(addDays(date, -7));
      const prevDayTotals = buildUsageTotals(state, [prevDayKey]);
      const prevWeekTotals = buildUsageTotals(state, [prevWeekKey]);
      const changeDayPct =
        prevDayTotals.blockedMs > 0
          ? Math.round(((totals.blockedMs - prevDayTotals.blockedMs) / prevDayTotals.blockedMs) * 100)
          : null;
      const changeWeekPct =
        prevWeekTotals.blockedMs > 0
          ? Math.round(((totals.blockedMs - prevWeekTotals.blockedMs) / prevWeekTotals.blockedMs) * 100)
          : null;
      rows.push([
        key,
        minutesFromMs(totals.totalMs),
        minutesFromMs(totals.blockedMs),
        minutesFromMs(totals.allowedMs),
        minutesFromMs(totals.otherMs),
        changeDayPct,
        changeWeekPct
      ]);
    });
    if (currentUsageSummaryRange !== "today") {
      const totals = buildUsageTotals(state, rangeKeys);
      rows.push([
        "Total",
        minutesFromMs(totals.totalMs),
        minutesFromMs(totals.blockedMs),
        minutesFromMs(totals.allowedMs),
        minutesFromMs(totals.otherMs),
        null,
        null
      ]);
    }
    downloadCsv(`focusboss-usage-summary-${currentUsageSummaryRange}.csv`, rows);
  });

  exportUsageJson?.addEventListener("click", async () => {
    const state = await getState();
    const rangeKeys = getRangeKeys(currentUsageSummaryRange);
    const summaryTotals = buildUsageTotals(state, rangeKeys);
    const days = rangeKeys.slice().reverse().map((key) => {
      const totals = buildUsageTotals(state, [key]);
      const date = parseDayKey(key);
      const prevDayKey = getDayKey(addDays(date, -1));
      const prevWeekKey = getDayKey(addDays(date, -7));
      const prevDayTotals = buildUsageTotals(state, [prevDayKey]);
      const prevWeekTotals = buildUsageTotals(state, [prevWeekKey]);
      const changeDayPct =
        prevDayTotals.blockedMs > 0
          ? Math.round(((totals.blockedMs - prevDayTotals.blockedMs) / prevDayTotals.blockedMs) * 100)
          : null;
      const changeWeekPct =
        prevWeekTotals.blockedMs > 0
          ? Math.round(((totals.blockedMs - prevWeekTotals.blockedMs) / prevWeekTotals.blockedMs) * 100)
          : null;
      return {
        Day: key,
        "Total web time (ms)": totals.totalMs,
        "Blocked time (ms)": totals.blockedMs,
        "Allowed time (ms)": totals.allowedMs,
        "Other time (ms)": totals.otherMs,
        "Blocked change vs yesterday (%)": changeDayPct,
        "Blocked change vs last week (%)": changeWeekPct
      };
    });
    const payload = {
      Range: currentUsageSummaryRange,
      Summary: {
        "Total web time (ms)": summaryTotals.totalMs,
        "Blocked time (ms)": summaryTotals.blockedMs,
        "Allowed time (ms)": summaryTotals.allowedMs,
        "Other time (ms)": summaryTotals.otherMs
      },
      Days: days,
      "Generated at": new Date().toISOString()
    };
    downloadJson(`focusboss-usage-summary-${currentUsageSummaryRange}.json`, payload);
  });

  exportBlockedCsv?.addEventListener("click", async () => {
    const state = await getState();
    const keys = getRangeKeys(currentUsageSummaryRange);
    const rows: Array<Array<string | number | null | undefined>> = [
      ["day", "domain", "blockedMs"]
    ];
    keys.forEach((key) => {
      const day = state.analytics.byDay[key];
      if (!day) {
        return;
      }
      Object.entries(day.byDomainBlocked ?? {}).forEach(([host, value]) => {
        rows.push([key, host, value]);
      });
    });
    downloadCsv(`focusboss-blocked-${currentUsageSummaryRange}.csv`, rows);
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
        if (modalId === "listDeleteConfirm") {
          pendingListDeleteValue = null;
          pendingListDeleteKey = null;
          if (listDeleteValue) {
            listDeleteValue.textContent = "";
          }
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
        if (modalId === "listDeleteConfirm") {
          pendingListDeleteValue = null;
          pendingListDeleteKey = null;
          if (listDeleteValue) {
            listDeleteValue.textContent = "";
          }
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
    showToast("Saved!");
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
  currentScheduleActive = isScheduleActive(state.schedule);
  renderFocus(
    state.focusEnabled,
    state.pause.isPaused,
    state.pause.pauseType,
    state.pause.pauseEndAt,
    state.strictSession.active,
    state.strictSession.endsAt ?? null,
    state.pomodoro,
    currentScheduleActive
  );
  renderTheme(state.ui.theme);
  renderOverlayMode(state.overlayMode);
  renderConfirmationPrompt(state.confirmationPrompt);
  if (strictEmergencyToggle) {
    strictEmergencyToggle.checked = Boolean(state.ui.allowEmergencyInStrict);
  }
  if (analyticsRetention) {
    analyticsRetention.value = String(state.analytics.retentionDays ?? 90);
  }
  currentPomodoroSummaryRange = state.analytics.chartRange;
    renderStrictSession(state.strictSession, Boolean(state.pomodoro.running));
  renderStrictOverlay(state.strictSession);
  renderTags(state.tags, state.pomodoro);
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
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get("view");
    if (viewParam) {
      applyView(viewParam, "auto");
    }
    const popupView = await getPopupViewOnce();
    if (popupView) {
      applyView(popupView, "auto");
    }
    const popupTagSettingsId = await getPopupTagSettingsOnce();
    if (popupTagSettingsId) {
      const tag = state.tags.items.find((item) => item.id === popupTagSettingsId) ?? null;
      if (tag) {
        openTagModal(tag);
      }
    }
    const tagSettingsId = params.get("tagSettings");
    if (tagSettingsId) {
      const tag = state.tags.items.find((item) => item.id === tagSettingsId) ?? null;
      if (tag) {
        openTagModal(tag);
      }
    }
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
