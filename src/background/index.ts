import type { Message } from "../shared/messages.js";
import type { StorageSchema } from "../shared/storageSchema.js";
import { ensureState, getState, setState } from "../shared/storage.js";
import { evaluateRules } from "../shared/rules.js";

const PAUSE_ALARM = "pauseResume";
const POMODORO_ALARM = "pomodoroPhase";
const POMODORO_HEARTBEAT = "pomodoroHeartbeat";
const STRICT_ALARM = "strictSessionEnd";
const ANALYTICS_RETENTION_ALARM = "analyticsRetention";
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

const parseDayKey = (key: string): number | null => {
  const [yearStr, monthStr, dayStr] = key.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!year || !month || !day) {
    return null;
  }
  return Date.UTC(year, month - 1, day);
};

const pruneAnalytics = async (state: StorageSchema) => {
  const retentionDays = Number(state.analytics.retentionDays ?? 90);
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) {
    return;
  }
  const cutoffMs = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const cutoffDay = new Date(cutoffMs);
  cutoffDay.setUTCHours(0, 0, 0, 0);
  const cutoffDayMs = cutoffDay.getTime();

  const nextByDayEntries = Object.entries(state.analytics.byDay).filter(([key]) => {
    const dayMs = parseDayKey(key);
    if (dayMs === null) {
      return true;
    }
    return dayMs >= cutoffDayMs;
  });
  const nextByDay = Object.fromEntries(nextByDayEntries);
  const nextSessions = state.analytics.sessions.filter(
    (session) => session.endedAt >= cutoffMs
  );

  const byDayChanged =
    Object.keys(nextByDay).length !== Object.keys(state.analytics.byDay).length;
  const sessionsChanged = nextSessions.length !== state.analytics.sessions.length;

  if (byDayChanged || sessionsChanged) {
    await setState({
      analytics: {
        byDay: nextByDay,
        sessions: nextSessions
      }
    });
  }
};

const scheduleAnalyticsRetention = async () => {
  await chrome.alarms.clear(ANALYTICS_RETENTION_ALARM);
  chrome.alarms.create(ANALYTICS_RETENTION_ALARM, { periodInMinutes: 60 * 12 });
};

const shouldCount = (url?: string | null): boolean => {
  return Boolean(url && url.startsWith("http"));
};

const getTab = (tabId: number): Promise<chrome.tabs.Tab> => {
  return new Promise((resolve) => {
    chrome.tabs.get(tabId, (tab) => resolve(tab));
  });
};

const ensureOffscreenDocument = async () => {
  if (!chrome.offscreen) {
    return;
  }
  const hasDoc = await chrome.offscreen.hasDocument();
  if (hasDoc) {
    return;
  }
  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
    justification: "Play FocusBoss timer sounds."
  });
};

const playOffscreenSound = async (sound: "work" | "break" | "complete" | "stop") => {
  if (!chrome.offscreen) {
    return;
  }
  await ensureOffscreenDocument();
  chrome.runtime.sendMessage({ type: "playSound", sound });
};

type DnrRule = chrome.declarativeNetRequest.Rule;

const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const normalizeDomain = (value: string): string => {
  return normalizeHost(value.trim());
};

const wildcardToRegex = (pattern: string): RegExp => {
  const escaped = pattern
    .split("*")
    .map((segment) => segment.split("?").map(escapeRegex).join("."))
    .join(".*");
  return new RegExp(`^${escaped}$`, "i");
};

const parseAdvancedRules = (text: string) => {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => {
      const isExclude = line.startsWith("!");
      const raw = isExclude ? line.slice(1).trim() : line;
      return { raw, isExclude, regex: wildcardToRegex(raw) };
    });
};

const buildFullUrlRegex = (inner: string) => {
  return `^https?://${inner}$`;
};

const buildDomainRegex = (domain: string) => {
  return `(?:www\\.)?${escapeRegex(domain)}(?:/.*)?`;
};

const buildKeywordRegex = (keyword: string) => {
  return `.*${escapeRegex(keyword)}.*`;
};

const buildAdvancedRegex = (pattern: string) => {
  const regex = wildcardToRegex(pattern);
  const inner = regex.source.replace(/^\\^/, "").replace(/\\$$/, "");
  return `(?:www\\.)?${inner}`;
};

const buildAllowRule = (id: number, regexFilter: string): DnrRule => {
  return {
    id,
    priority: 100,
    action: { type: chrome.declarativeNetRequest.RuleActionType.ALLOW },
    condition: {
      regexFilter,
      isUrlFilterCaseSensitive: false,
      resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME]
    }
  };
};

const buildRedirectRule = (id: number, regexFilter: string, target: string): DnrRule => {
  return {
    id,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: { regexSubstitution: target }
    },
    condition: {
      regexFilter,
      isUrlFilterCaseSensitive: false,
      resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME]
    }
  };
};

const buildDnrRules = (state: StorageSchema): DnrRule[] => {
  const pause = state.pause ?? { isPaused: false };
  const active = state.focusEnabled && !pause.isPaused && !state.overlayMode;
  if (!active) {
    return [];
  }

  const rules: DnrRule[] = [];
  let id = 1;
  const extensionTarget = `chrome-extension://${chrome.runtime.id}/tab.html#$1`;
  const lists = state.lists;
  const advanced = parseAdvancedRules(lists.advancedRulesText ?? "");

  const allowDomains = (lists.allowedDomains ?? [])
    .map(normalizeDomain)
    .filter((value) => value.length > 0);
  const allowKeywords = (lists.allowedKeywords ?? [])
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  const blockDomains = (lists.blockedDomains ?? [])
    .map(normalizeDomain)
    .filter((value) => value.length > 0);
  const blockKeywords = (lists.blockedKeywords ?? [])
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const tempAllowHosts = state.strictSession.active
    ? []
    : Object.entries(state.temporaryAllow ?? {})
        .filter(([, entry]) => typeof entry?.until === "number" && Date.now() < entry.until)
        .map(([host]) => normalizeDomain(host))
        .filter((value) => value.length > 0);

  for (const domain of allowDomains) {
    rules.push(buildAllowRule(id++, buildFullUrlRegex(buildDomainRegex(domain))));
  }
  for (const keyword of allowKeywords) {
    rules.push(buildAllowRule(id++, buildFullUrlRegex(buildKeywordRegex(keyword))));
  }
  for (const host of tempAllowHosts) {
    rules.push(buildAllowRule(id++, buildFullUrlRegex(buildDomainRegex(host))));
  }
  for (const rule of advanced) {
    if (rule.isExclude) {
      rules.push(buildAllowRule(id++, buildFullUrlRegex(buildAdvancedRegex(rule.raw))));
    }
  }

  for (const rule of advanced) {
    if (!rule.isExclude) {
      rules.push(
        buildRedirectRule(
          id++,
          `(${buildFullUrlRegex(buildAdvancedRegex(rule.raw))})`,
          extensionTarget
        )
      );
    }
  }
  for (const domain of blockDomains) {
    rules.push(
      buildRedirectRule(id++, `(${buildFullUrlRegex(buildDomainRegex(domain))})`, extensionTarget)
    );
  }
  for (const keyword of blockKeywords) {
    rules.push(
      buildRedirectRule(id++, `(${buildFullUrlRegex(buildKeywordRegex(keyword))})`, extensionTarget)
    );
  }

  return rules;
};

const applyDnrRules = async (state: StorageSchema) => {
  if (!chrome.declarativeNetRequest) {
    return;
  }
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existing.map((rule) => rule.id);
  const addRules = buildDnrRules(state);
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules });
};

const injectContentScript = (tabId: number) => {
  return new Promise<void>((resolve) => {
    chrome.scripting.executeScript({ target: { tabId }, files: ["content/index.js"] }, () => {
      void chrome.runtime.lastError;
      resolve();
    });
  });
};

const ensureContentScriptInjected = (mode: "all" | "active" = "all") => {
  const query =
    mode === "active"
      ? { active: true, currentWindow: true }
      : { url: ["http://*/*", "https://*/*"] };
  chrome.tabs.query(query, (tabs) => {
    tabs.forEach((tab) => {
      const tabId = tab.id;
      if (typeof tabId !== "number") {
        return;
      }
      chrome.tabs.sendMessage(tabId, { type: "focusBossPing" }, (response) => {
        if (chrome.runtime.lastError || !response?.ok) {
          void injectContentScript(tabId);
        }
      });
    });
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

const serializeScheduleEntries = (
  entries: StorageSchema["schedule"]["entries"] | undefined
): string => JSON.stringify(entries ?? []);

const isScheduleActive = (state: StorageSchema): boolean => {
  const hasEnabled = state.schedule.entries.some(
    (entry) => entry.enabled && entry.days.length > 0
  );
  if (!hasEnabled) {
    return false;
  }
  return state.schedule.entries.some(
    (entry) => entry.enabled && isScheduleEntryActive(entry, new Date())
  );
};

const resolveFocusAfterPomodoroStop = (
  state: StorageSchema,
  prevFocusEnabled?: boolean
): boolean => {
  if (state.strictSession.active) {
    return state.focusEnabled;
  }
  if (isScheduleActive(state)) {
    return true;
  }
  if (typeof prevFocusEnabled === "boolean") {
    return prevFocusEnabled;
  }
  return state.focusEnabled;
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
    const prevFocusEnabled = state.strictSession.prevFocusEnabled;
    await setState({
      focusEnabled:
        typeof prevFocusEnabled === "boolean" ? prevFocusEnabled : state.focusEnabled,
      strictSession: {
        active: false,
        endsAt: undefined,
        startedAt: undefined,
        prevFocusEnabled: undefined
      }
    });
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
    tagId: state.pomodoro.running?.linkedTagId ?? null,
    focusEnabledDuring: state.focusEnabled,
    distractions: 0
  };
  const sessions = [...state.analytics.sessions, session];
  const linkedTagId = session.tagId ?? null;
  let updatedTags = state.tags;
  if (linkedTagId) {
    let changed = false;
    const items = state.tags.items.map((item) => {
      if (item.id !== linkedTagId || item.doneAt) {
        return item;
      }
      changed = true;
      return { ...item, focusSessionsCompleted: item.focusSessionsCompleted + 1 };
    });
    if (changed) {
      updatedTags = { ...state.tags, items };
    }
  }
  if (updatedTags !== state.tags) {
    await setState({ analytics: { sessions }, tags: { items: updatedTags.items } });
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
          linkedTagId: running.linkedTagId ?? null,
          prevFocusEnabled: running.prevFocusEnabled
        }
      },
      focusEnabled: state.pomodoro.blockDuringBreak ? true : false
    });
    await schedulePomodoroAlarm();
    pomodoroHandling = false;
    return;
  }

  if (state.pomodoro.cycles > 0 && running.cycleIndex >= state.pomodoro.cycles) {
    const desiredFocus = resolveFocusAfterPomodoroStop(state, running.prevFocusEnabled);
    await setState({
      pomodoro: {
        running: null,
        lastCompletion: {
          mode: "completed",
          minutes: state.pomodoro.workMin * state.pomodoro.cycles,
          cycles: state.pomodoro.cycles,
          endedAt: now,
          tagId: running.linkedTagId ?? null
        }
      },
      focusEnabled: desiredFocus
    });
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
        linkedTagId: running.linkedTagId ?? null,
        prevFocusEnabled: running.prevFocusEnabled
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

chrome.runtime.onMessage.addListener(
  (
    message: { type?: string; tagId?: string | null },
    sender,
    sendResponse: (response?: { ok: boolean }) => void
  ) => {
    if (message?.type !== "openTagSettings") {
      return;
    }
    const tagId = message.tagId ? String(message.tagId) : "";
    const url = chrome.runtime.getURL(
      `popup.html${tagId ? `?tagSettings=${encodeURIComponent(tagId)}` : ""}`
    );
    chrome.tabs.create({ url }, () => sendResponse({ ok: true }));
    return true;
  }
);

chrome.runtime.onInstalled.addListener(() => {
  void ensureState()
    .then(schedulePauseAlarm)
    .then(scheduleStrictAlarm)
    .then(schedulePomodoroAlarm)
    .then(schedulePomodoroHeartbeat)
    .then(getState)
    .then((state) => {
      void applyDnrRules(state);
      ensureContentScriptInjected("all");
      void scheduleAnalyticsRetention();
      void pruneAnalytics(state);
      return state;
    });
});

chrome.runtime.onStartup.addListener(() => {
  void ensureState()
    .then(schedulePauseAlarm)
    .then(scheduleStrictAlarm)
    .then(schedulePomodoroAlarm)
    .then(schedulePomodoroHeartbeat)
    .then(getState)
    .then((state) => {
      void applyDnrRules(state);
      ensureContentScriptInjected("all");
      void scheduleAnalyticsRetention();
      void pruneAnalytics(state);
      return state;
    });
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") {
    return;
  }
  if (changes.focusBossState) {
    const oldState = changes.focusBossState.oldValue as StorageSchema | undefined;
    const newState = changes.focusBossState.newValue as StorageSchema | undefined;
    if (newState) {
      void applyDnrRules(newState);
      ensureContentScriptInjected("all");
      const soundsEnabled = Boolean(newState.pomodoro.sounds);
      if (soundsEnabled) {
        const oldRunning = oldState?.pomodoro?.running ?? null;
        const newRunning = newState.pomodoro.running ?? null;
        if (!oldRunning && newRunning) {
          void playOffscreenSound(newRunning.phase === "break" ? "break" : "work");
        } else if (oldRunning && newRunning && oldRunning.phase !== newRunning.phase) {
          void playOffscreenSound(newRunning.phase === "break" ? "break" : "work");
        } else if (oldRunning && !newRunning) {
          const lastCompletion = newState.pomodoro.lastCompletion;
          const prevCompletion = oldState?.pomodoro?.lastCompletion;
          if (lastCompletion?.endedAt && lastCompletion.endedAt !== prevCompletion?.endedAt) {
            void playOffscreenSound(
              lastCompletion.mode === "completed" ? "complete" : "stop"
            );
          }
        }
      }
      if (oldState?.analytics?.retentionDays !== newState.analytics.retentionDays) {
        void pruneAnalytics(newState);
      }
    }
    const scheduleChanged =
      serializeScheduleEntries(oldState?.schedule?.entries) !==
      serializeScheduleEntries(newState?.schedule?.entries);
    const strictChanged = oldState?.strictSession?.active !== newState?.strictSession?.active;
    const pomodoroChanged =
      oldState?.pomodoro?.running?.endsAt !== newState?.pomodoro?.running?.endsAt ||
      oldState?.pomodoro?.running?.paused !== newState?.pomodoro?.running?.paused ||
      oldState?.pomodoro?.running?.phase !== newState?.pomodoro?.running?.phase;
    void schedulePauseAlarm();
    void scheduleStrictAlarm();
    if (pomodoroChanged) {
      void schedulePomodoroAlarm();
      ensureContentScriptInjected();
      if (!newState?.pomodoro?.running) {
        lastHandledPhase = "";
        lastHandledEndsAt = 0;
        pomodoroHandling = false;
        const prevFocusEnabled = oldState?.pomodoro?.running?.prevFocusEnabled;
        const desiredFocus =
          newState ? resolveFocusAfterPomodoroStop(newState, prevFocusEnabled) : null;
        if (newState && typeof desiredFocus === "boolean" && desiredFocus !== newState.focusEnabled) {
          void setState({ focusEnabled: desiredFocus });
        }
      }
    }
    if (scheduleChanged) {
      const hasEnabledSchedules = Boolean(
        newState?.schedule?.entries?.some((entry) => entry.enabled && entry.days.length > 0)
      );
      if (
        newState &&
        !hasEnabledSchedules &&
        !newState.strictSession.active &&
        !newState.pomodoro.running &&
        newState.focusEnabled
      ) {
        void setState({ focusEnabled: false });
      }
      void scheduleAllEntries().then(applyScheduleState);
    }
    if (strictChanged) {
      if (newState?.strictSession?.active && newState.focusEnabled === false) {
        void setState({ focusEnabled: true });
      }
      if (!newState?.strictSession?.active) {
        void applyScheduleState();
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
        const prevFocusEnabled = state.strictSession.prevFocusEnabled;
        void setState({
          focusEnabled:
            typeof prevFocusEnabled === "boolean" ? prevFocusEnabled : state.focusEnabled,
          strictSession: {
            active: false,
            endsAt: undefined,
            startedAt: undefined,
            prevFocusEnabled: undefined
          }
        });
      }
    });
  }
  if (alarm.name === ANALYTICS_RETENTION_ALARM) {
    void getState().then(pruneAnalytics);
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
  .then(getState)
  .then((state) => {
    void applyDnrRules(state);
    ensureContentScriptInjected("all");
    void scheduleAnalyticsRetention();
    void pruneAnalytics(state);
    return state;
  })
  .then(scheduleAllEntries)
  .then(applyScheduleState);
console.log("FocusBoss service worker running");
