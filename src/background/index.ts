import type { Message } from "../shared/messages.js";
import type { StorageSchema } from "../shared/storageSchema.js";
import { ensureState, getState, setState } from "../shared/storage.js";
import { evaluateRules } from "../shared/rules.js";

const PAUSE_ALARM = "pauseResume";
const POMODORO_ALARM = "pomodoroPhase";
const POMODORO_HEARTBEAT = "pomodoroHeartbeat";
const STRICT_ALARM = "strictSessionEnd";
const USAGE_UPDATE_MS = 1000;
const SCHEDULE_PREFIX = "schedule";

let activeTabId: number | null = null;
let activeHost: string | null = null;
let activeStart: number | null = null;
let windowFocused = true;
let activeBlocked = false;

const normalizeHost = (host: string): string => {
  const lower = host.toLowerCase();
  return lower.startsWith("www.") ? lower.slice(4) : lower;
};

const getDayKey = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const shouldCount = (url?: string | null): boolean => {
  return Boolean(url && url.startsWith("http"));
};

const getTab = (tabId: number): Promise<chrome.tabs.Tab> => {
  return new Promise((resolve) => {
    chrome.tabs.get(tabId, (tab) => resolve(tab));
  });
};

const isBlockedByRules = (url: string, state: Awaited<ReturnType<typeof getState>>): boolean => {
  try {
    new URL(url);
  } catch {
    return false;
  }
  const result = evaluateRules(url, state.lists);
  return !result.allowed;
};

const recordUsage = async (host: string, deltaMs: number, blocked: boolean) => {
  if (deltaMs < USAGE_UPDATE_MS) {
    return;
  }
  const state = await getState();
  const dayKey = getDayKey();
  const hour = new Date().getHours();
  const day = state.analytics.byDay[dayKey] ?? {
    totalMs: 0,
    byDomain: {},
    blockedMs: 0,
    byDomainBlocked: {},
    byHourMs: {},
    byHourBlockedMs: {}
  };
  const nextDay = {
    ...day,
    totalMs: day.totalMs + deltaMs,
    byDomain: {
      ...day.byDomain,
      [host]: (day.byDomain[host] ?? 0) + deltaMs
    },
    blockedMs: (day.blockedMs ?? 0) + (blocked ? deltaMs : 0),
    byDomainBlocked: blocked
      ? {
          ...(day.byDomainBlocked ?? {}),
          [host]: (day.byDomainBlocked?.[host] ?? 0) + deltaMs
        }
      : day.byDomainBlocked,
    byHourMs: {
      ...(day.byHourMs ?? {}),
      [hour]: (day.byHourMs?.[hour] ?? 0) + deltaMs
    },
    byHourBlockedMs: blocked
      ? {
          ...(day.byHourBlockedMs ?? {}),
          [hour]: (day.byHourBlockedMs?.[hour] ?? 0) + deltaMs
        }
      : day.byHourBlockedMs
  };
  await setState({ analytics: { byDay: { ...state.analytics.byDay, [dayKey]: nextDay } } });
};

const flushActive = async (reason: string) => {
  if (!activeHost || !activeStart) {
    return;
  }
  const end = Date.now();
  const delta = end - activeStart;
  activeStart = end;
  let url: string | null | undefined = null;
  if (activeTabId) {
    try {
      const tab = await getTab(activeTabId);
      url = tab.url;
    } catch {
      url = null;
    }
  }
  if (!url || !shouldCount(url)) {
    return;
  }
  const state = await getState();
  const blocked = isBlockedByRules(url, state);
  activeBlocked = blocked;
  await recordUsage(activeHost, delta, blocked);
};

const setActiveTab = async (tabId: number | null) => {
  if (tabId === null) {
    await flushActive("clear");
    activeTabId = null;
    activeHost = null;
    activeStart = null;
    return;
  }

  const tab = await getTab(tabId);
  if (!shouldCount(tab.url ?? null)) {
    await flushActive("non-http");
    activeTabId = tabId;
    activeHost = null;
    activeStart = null;
    activeBlocked = false;
    return;
  }

  const host = normalizeHost(new URL(tab.url as string).hostname);
  if (activeHost && activeStart) {
    await flushActive("switch");
  }
  activeTabId = tabId;
  activeHost = host;
  activeStart = Date.now();
  const state = await getState();
  activeBlocked = isBlockedByRules(tab.url as string, state);
};

const clearScheduleAlarms = async () => {
  const alarms = await chrome.alarms.getAll();
  await Promise.all(
    alarms
      .filter((alarm) => alarm.name.startsWith(SCHEDULE_PREFIX))
      .map((alarm) => chrome.alarms.clear(alarm.name))
  );
};

const toDateForDay = (base: Date, day: number, minutes: number) => {
  const date = new Date(base);
  const diff = (day - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + diff);
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date;
};

const getNextOccurrence = (days: Array<0 | 1 | 2 | 3 | 4 | 5 | 6>, minutes: number) => {
  const now = new Date();
  const candidates = days.map((day) => toDateForDay(now, day, minutes));
  candidates.forEach((date) => {
    if (date.getTime() <= now.getTime()) {
      date.setDate(date.getDate() + 7);
    }
  });
  candidates.sort((a, b) => a.getTime() - b.getTime());
  return candidates[0];
};

const getNextEndOccurrence = (
  days: Array<0 | 1 | 2 | 3 | 4 | 5 | 6>,
  startMin: number,
  endMin: number
) => {
  const now = new Date();
  const candidates: Date[] = [];
  days.forEach((day) => {
    const endDate = toDateForDay(now, day, endMin);
    if (endMin <= startMin) {
      endDate.setDate(endDate.getDate() + 1);
    }
    const prevEnd = new Date(endDate);
    prevEnd.setDate(prevEnd.getDate() - 7);
    candidates.push(endDate, prevEnd);
  });
  const upcoming = candidates.filter((date) => date.getTime() >= now.getTime());
  const sorted = (upcoming.length ? upcoming : candidates).sort(
    (a, b) => a.getTime() - b.getTime()
  );
  if (!sorted[0]) {
    const fallback = new Date(now);
    fallback.setMinutes(now.getMinutes() + 1);
    return fallback;
  }
  if (sorted[0].getTime() < now.getTime()) {
    sorted[0].setDate(sorted[0].getDate() + 7);
  }
  return sorted[0];
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

const scheduleAllEntries = async () => {
  const state = await getState();
  await clearScheduleAlarms();
  state.schedule.entries
    .filter((entry) => entry.enabled && entry.days.length > 0)
    .forEach((entry) => {
      const nextStart = getNextOccurrence(entry.days, entry.startMin);
      const nextEnd = getNextEndOccurrence(entry.days, entry.startMin, entry.endMin);
      chrome.alarms.create(`${SCHEDULE_PREFIX}:start:${entry.id}`, { when: nextStart.getTime() });
      chrome.alarms.create(`${SCHEDULE_PREFIX}:end:${entry.id}`, { when: nextEnd.getTime() });
    });
};

const applyScheduleState = async () => {
  const state = await getState();
  if (state.strictSession.active) {
    return;
  }
  if (state.pomodoro.running) {
    return;
  }
  const hasEnabled = state.schedule.entries.some(
    (entry) => entry.enabled && entry.days.length > 0
  );
  if (!hasEnabled) {
    return;
  }
  const active = state.schedule.entries.some(
    (entry) => entry.enabled && isScheduleEntryActive(entry, new Date())
  );
  await setState({ focusEnabled: active });
};

const schedulePauseAlarm = async () => {
  const state = await getState();
  const until = state.pause.pauseEndAt ?? null;
  const isPaused = state.pause.isPaused;
  await chrome.alarms.clear(PAUSE_ALARM);

  if (!isPaused || typeof until !== "number") {
    return;
  }

  const now = Date.now();
  if (until <= now) {
    await setState({ pause: { isPaused: false, pauseType: null, pauseEndAt: null } });
    return;
  }

  chrome.alarms.create(PAUSE_ALARM, { when: until });
};

const scheduleStrictAlarm = async () => {
  const state = await getState();
  const endsAt = state.strictSession.endsAt ?? null;
  const active = state.strictSession.active;
  await chrome.alarms.clear(STRICT_ALARM);
  if (!active || typeof endsAt !== "number") {
    return;
  }
  const now = Date.now();
  if (endsAt <= now) {
    await setState({ strictSession: { active: false, endsAt: undefined, startedAt: undefined } });
    return;
  }
  chrome.alarms.create(STRICT_ALARM, { when: endsAt });
};

let pomodoroHandling = false;
let lastHandledPhase: "work" | "break" | "" = "";
let lastHandledEndsAt = 0;

const schedulePomodoroAlarm = async () => {
  const state = await getState();
  const running = state.pomodoro.running;
  await chrome.alarms.clear(POMODORO_ALARM);
  if (!running || running.paused) {
    return;
  }
  const endsAt = running.endsAt;
  if (typeof endsAt !== "number") {
    return;
  }
  const now = Date.now();
  if (endsAt <= now) {
    await handlePomodoroPhaseEnd();
    return;
  }
  chrome.alarms.create(POMODORO_ALARM, { when: endsAt });
};

const schedulePomodoroHeartbeat = async () => {
  await chrome.alarms.clear(POMODORO_HEARTBEAT);
  chrome.alarms.create(POMODORO_HEARTBEAT, { periodInMinutes: 0.5 });
};

const logPomodoroSession = async (
  state: Awaited<ReturnType<typeof getState>>,
  startedAt: number,
  endedAt: number
) => {
  const session = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    startedAt,
    endedAt,
    type: "pomodoro" as const,
    taskId: state.pomodoro.running?.linkedTaskId ?? null,
    focusEnabledDuring: state.focusEnabled,
    distractions: 0
  };
  const sessions = [...state.analytics.sessions, session];
  const linkedTaskId = session.taskId ?? null;
  let updatedTasks = state.tasks;
  if (linkedTaskId) {
    let changed = false;
    const items = state.tasks.items.map((item) => {
      if (item.id !== linkedTaskId || item.doneAt) {
        return item;
      }
      changed = true;
      return { ...item, focusSessionsCompleted: item.focusSessionsCompleted + 1 };
    });
    if (changed) {
      updatedTasks = { ...state.tasks, items };
    }
  }
  if (updatedTasks !== state.tasks) {
    await setState({ analytics: { sessions }, tasks: { items: updatedTasks.items } });
    return;
  }
  await setState({ analytics: { sessions } });
};

const handlePomodoroPhaseEnd = async () => {
  if (pomodoroHandling) {
    return;
  }
  const state = await getState();
  const running = state.pomodoro.running;
  if (!running || running.paused || typeof running.endsAt !== "number") {
    return;
  }
  if (Date.now() < running.endsAt) {
    return;
  }
  if (running.phase === lastHandledPhase && running.endsAt <= lastHandledEndsAt) {
    return;
  }
  pomodoroHandling = true;
  lastHandledPhase = running.phase;
  lastHandledEndsAt = running.endsAt;
  if (state.strictSession.active) {
    pomodoroHandling = false;
    return;
  }
  const now = Date.now();
  if (running.phase === "work") {
    const startedAt = running.startedAt ?? now - state.pomodoro.workMin * 60 * 1000;
    await logPomodoroSession(state, startedAt, now);
    const nextCycle = running.cycleIndex + 1;
    const nextEnd = now + state.pomodoro.breakMin * 60 * 1000;
    await setState({
      pomodoro: {
        running: {
          phase: "break",
          startedAt: now,
          endsAt: nextEnd,
          cycleIndex: nextCycle,
          paused: false,
          linkedTaskId: running.linkedTaskId ?? null
        }
      },
      focusEnabled: state.pomodoro.blockDuringBreak ? true : false
    });
    await schedulePomodoroAlarm();
    pomodoroHandling = false;
    return;
  }

  if (state.pomodoro.cycles > 0 && running.cycleIndex >= state.pomodoro.cycles) {
    await setState({ pomodoro: { running: null } });
    await applyScheduleState();
    pomodoroHandling = false;
    return;
  }

  const nextEnd = now + state.pomodoro.workMin * 60 * 1000;
  await setState({
    pomodoro: {
      running: {
        phase: "work",
        startedAt: now,
        endsAt: nextEnd,
        cycleIndex: running.cycleIndex,
        paused: false,
        linkedTaskId: running.linkedTaskId ?? null
      }
    },
    focusEnabled: state.pomodoro.autoBlockDuringWork ? true : state.focusEnabled
  });
  await schedulePomodoroAlarm();
  pomodoroHandling = false;
};

chrome.runtime.onMessage.addListener((message: Message<"ping">) => {
  if (message?.type === "ping") {
    console.log("FocusBoss background ping", message.payload.time);
  }
});

chrome.runtime.onMessage.addListener(
  (message: { type?: string }, sender, sendResponse: (response?: { ok: boolean }) => void) => {
    if (message?.type !== "pomodoroTick") {
      return;
    }
    void handlePomodoroPhaseEnd().then(() => sendResponse({ ok: true }));
    return true;
  }
);

chrome.runtime.onMessage.addListener(
  (
    message: { type?: string; prevUrl?: string },
    sender,
    sendResponse: (response?: { ok: boolean }) => void
  ) => {
    if (message?.type !== "redirectToIntervention" || !message.prevUrl) {
      return;
    }
    const target = chrome.runtime.getURL(`tab.html?prev=${encodeURIComponent(message.prevUrl)}`);
    const tabId = sender.tab?.id;

    if (tabId) {
      chrome.tabs.update(tabId, { url: target }, () => sendResponse({ ok: true }));
      return true;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeId = tabs[0]?.id;
      if (activeId) {
        chrome.tabs.update(activeId, { url: target }, () => sendResponse({ ok: true }));
      } else {
        sendResponse({ ok: false });
      }
    });

    return true;
  }
);

chrome.runtime.onMessage.addListener(
  (
    message: { type?: string; prevUrl?: string; minutes?: number },
    sender,
    sendResponse: (response?: { ok: boolean }) => void
  ) => {
    if (message?.type !== "temporaryAllow") {
      return;
    }
    const prevUrl = message.prevUrl;
    const minutes = message.minutes;
    if (!prevUrl || typeof minutes !== "number") {
      return;
    }
    void getState().then((state) => {
      if (state.strictSession.active) {
        sendResponse({ ok: false });
        return;
      }
      let host: string | null = null;
      try {
        const url = new URL(prevUrl);
        host = url.hostname.toLowerCase().replace(/^www\./, "");
      } catch {
        sendResponse({ ok: false });
        return;
      }

      const until = Date.now() + minutes * 60 * 1000;
      const updateTab = () => {
        const tabId = sender.tab?.id;
        if (tabId) {
          chrome.tabs.update(tabId, { url: prevUrl }, () => sendResponse({ ok: true }));
          return;
        }
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const activeId = tabs[0]?.id;
          if (activeId) {
            chrome.tabs.update(activeId, { url: prevUrl }, () => sendResponse({ ok: true }));
          } else {
            sendResponse({ ok: false });
          }
        });
      };

      const ensureWritten = (attemptsLeft: number) => {
        getState().then((state) => {
          const entry = state.temporaryAllow?.[host as string];
          if (entry?.until === until) {
            updateTab();
            return;
          }
          if (attemptsLeft <= 0) {
            updateTab();
            return;
          }
          setTimeout(() => ensureWritten(attemptsLeft - 1), 80);
        });
      };

      const next = { ...state.temporaryAllow, [host as string]: { until } };
      void setState({ temporaryAllow: next }).then(() => ensureWritten(5));
    });

    return true;
  }
);

chrome.runtime.onInstalled.addListener(() => {
  void ensureState()
    .then(schedulePauseAlarm)
    .then(scheduleStrictAlarm)
    .then(schedulePomodoroAlarm)
    .then(schedulePomodoroHeartbeat);
});

chrome.runtime.onStartup.addListener(() => {
  void ensureState()
    .then(schedulePauseAlarm)
    .then(scheduleStrictAlarm)
    .then(schedulePomodoroAlarm)
    .then(schedulePomodoroHeartbeat);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") {
    return;
  }
  if (changes.focusBossState) {
    const oldState = changes.focusBossState.oldValue as StorageSchema | undefined;
    const newState = changes.focusBossState.newValue as StorageSchema | undefined;
    const scheduleChanged =
      oldState?.schedule?.entries !== newState?.schedule?.entries ||
      oldState?.schedule?.entries?.length !== newState?.schedule?.entries?.length;
    const strictChanged = oldState?.strictSession?.active !== newState?.strictSession?.active;
    const pomodoroChanged =
      oldState?.pomodoro?.running?.endsAt !== newState?.pomodoro?.running?.endsAt ||
      oldState?.pomodoro?.running?.paused !== newState?.pomodoro?.running?.paused ||
      oldState?.pomodoro?.running?.phase !== newState?.pomodoro?.running?.phase;
    void schedulePauseAlarm();
    void scheduleStrictAlarm();
    if (pomodoroChanged) {
      void schedulePomodoroAlarm();
      if (!newState?.pomodoro?.running) {
        lastHandledPhase = "";
        lastHandledEndsAt = 0;
        pomodoroHandling = false;
        void applyScheduleState();
      }
    }
    if (scheduleChanged) {
      void scheduleAllEntries().then(applyScheduleState);
    }
    if (strictChanged) {
      void applyScheduleState();
      if (newState?.strictSession?.active && newState.focusEnabled === false) {
        void setState({ focusEnabled: true });
      }
    }
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === PAUSE_ALARM) {
    void getState().then((state) => {
      const until = state.pause.pauseEndAt;
      if (state.pause.isPaused && typeof until === "number" && Date.now() >= until) {
        void setState({ pause: { isPaused: false, pauseType: null, pauseEndAt: null } });
      }
    });
  }
  if (alarm.name === POMODORO_ALARM) {
    void handlePomodoroPhaseEnd();
  }
  if (alarm.name === POMODORO_HEARTBEAT) {
    void handlePomodoroPhaseEnd();
  }
  if (alarm.name === STRICT_ALARM) {
    void getState().then((state) => {
      const endsAt = state.strictSession.endsAt;
      if (state.strictSession.active && typeof endsAt === "number" && Date.now() >= endsAt) {
        void setState({
          strictSession: { active: false, endsAt: undefined, startedAt: undefined }
        }).then(
          applyScheduleState
        );
      }
    });
  }
  if (alarm.name.startsWith(`${SCHEDULE_PREFIX}:start:`)) {
    void applyScheduleState().then(scheduleAllEntries);
  }
  if (alarm.name.startsWith(`${SCHEDULE_PREFIX}:end:`)) {
    void applyScheduleState().then(scheduleAllEntries);
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  if (!windowFocused) {
    return;
  }
  void setActiveTab(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (tabId !== activeTabId) {
    return;
  }
  if (changeInfo.url) {
    void setActiveTab(tabId);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeTabId) {
    void setActiveTab(null);
  }
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    windowFocused = false;
    void flushActive("window-blur");
    return;
  }
  windowFocused = true;
  chrome.tabs.query({ active: true, windowId }, (tabs) => {
    const tabId = tabs[0]?.id ?? null;
    void setActiveTab(tabId);
  });
});

setInterval(() => {
  if (windowFocused && activeHost) {
    void flushActive("heartbeat");
  }
}, 15000);

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tabId = tabs[0]?.id ?? null;
  void setActiveTab(tabId);
});

void ensureState()
  .then(schedulePauseAlarm)
  .then(scheduleStrictAlarm)
  .then(schedulePomodoroAlarm)
  .then(schedulePomodoroHeartbeat)
  .then(scheduleAllEntries)
  .then(applyScheduleState);
console.log("FocusBoss service worker running");
