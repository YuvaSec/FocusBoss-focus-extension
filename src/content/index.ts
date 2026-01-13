(() => {
const STORAGE_KEY = "focusBossState";
const WIDGET_STORAGE_KEY = "focusBossWidget";
const DEFAULT_WIDGET_POSITION = { x: 24, y: 24 };
const DEFAULT_POMODORO = { workMin: 25, breakMin: 5, cycles: 0 };
const isExtensionContextValid = () => {
  try {
    return Boolean(chrome?.runtime?.id);
  } catch {
    return false;
  }
};

const initTarget = window as typeof window & { __focusBossContentInitialized?: boolean };
if (initTarget.__focusBossContentInitialized) {
  return;
}
initTarget.__focusBossContentInitialized = true;
if (!isExtensionContextValid()) {
  return;
}

type StorageState = {
  focusEnabled: boolean;
  overlayMode: boolean;
  lists: {
    blockedDomains: string[];
    blockedKeywords: string[];
    allowedDomains: string[];
    allowedKeywords: string[];
    advancedRulesText?: string;
    youtubeExceptions?: {
      allowedVideos: string[];
      blockedVideos: string[];
      allowedPlaylists: string[];
      blockedPlaylists: string[];
    };
  };
  pomodoro: {
    workMin: number;
    breakMin: number;
    cycles: number;
    autoBlockDuringWork: boolean;
    blockDuringBreak: boolean;
    lastTagId: string | null;
    lastCompletion?: {
      mode: "completed" | "interrupted";
      minutes: number;
      cycles: number;
      endedAt: number;
      tagId?: string | null;
    };
    running: null | {
      phase: "work" | "break";
      startedAt: number;
      endsAt: number;
      cycleIndex: number;
      paused: boolean;
      remainingMs?: number;
      linkedTagId?: string | null;
      prevFocusEnabled?: boolean;
    };
  };
  tags: {
    items: Array<{
      id: string;
      title: string;
      color?: string;
      pomodoroWorkMin?: number;
      pomodoroBreakMin?: number;
      pomodoroCycles?: number;
    }>;
  };
  pause?: {
    isPaused: boolean;
  };
  strictSession?: {
    active: boolean;
    endsAt?: number;
    startedAt?: number;
  };
  temporaryAllow?: Record<string, { until: number }>;
};

type WidgetPrefs = {
  position?: { x: number; y: number };
  dismissed?: boolean;
  completionDismissedAt?: number;
  seen?: boolean;
  minimized?: boolean;
  ultraMinimized?: boolean;
  ultraSide?: "left" | "right";
  ultraY?: number;
};

const normalizeHost = (host: string): string => {
  const lower = host.toLowerCase();
  return lower.startsWith("www.") ? lower.slice(4) : lower;
};

const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&");
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

const matchAdvanced = (
  target: string,
  compiled: ReturnType<typeof parseAdvancedRules>,
  exclude: boolean
) => {
  for (const rule of compiled) {
    if (rule.isExclude !== exclude) {
      continue;
    }
    if (rule.regex.test(target)) {
      return true;
    }
  }
  return false;
};

const matchDomainList = (host: string, list: string[]) => {
  const normalized = normalizeHost(host);
  return list.some((entry) => {
    const clean = normalizeHost(entry.trim());
    return (
      clean === normalized || (normalized === "m.youtube.com" && clean === "youtube.com")
    );
  });
};

const matchKeywordList = (href: string, list: string[]) => {
  const haystack = href.toLowerCase();
  return list.some((entry) => {
    const needle = entry.trim().toLowerCase();
    return needle.length > 0 && haystack.includes(needle);
  });
};

const extractYoutubeVideoId = (url: URL): string | null => {
  const host = normalizeHost(url.hostname);
  if (host === "youtu.be") {
    const id = url.pathname.replace("/", "").trim();
    return id || null;
  }
  if (host.endsWith("youtube.com") && url.pathname === "/watch") {
    const id = url.searchParams.get("v");
    return id || null;
  }
  return null;
};

const extractYoutubePlaylistId = (url: URL): string | null => {
  const host = normalizeHost(url.hostname);
  if (!host.endsWith("youtube.com") && host !== "youtu.be") {
    return null;
  }
  const id = url.searchParams.get("list");
  return id || null;
};

const truncateLabel = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, Math.max(0, maxLength - 1))}…`;
};

const isBlockedByRules = (href: string, lists: any): boolean => {
  const urlObj = new URL(href);
  const host = normalizeHost(urlObj.hostname);
  const target = `${host}${urlObj.pathname}${urlObj.search}`.toLowerCase();
  const advanced = parseAdvancedRules(lists.advancedRulesText ?? "");
  const youtubeExceptions = lists.youtubeExceptions ?? {
    allowedVideos: [],
    blockedVideos: [],
    allowedPlaylists: [],
    blockedPlaylists: []
  };
  const youtubeId = extractYoutubeVideoId(urlObj);
  const playlistId = extractYoutubePlaylistId(urlObj);

  if (matchDomainList(host, lists.allowedDomains ?? [])) {
    return false;
  }
  if (matchKeywordList(href, lists.allowedKeywords ?? [])) {
    return false;
  }
  if (youtubeId && youtubeExceptions.allowedVideos.includes(youtubeId)) {
    return false;
  }
  if (playlistId && youtubeExceptions.allowedPlaylists.includes(playlistId)) {
    return false;
  }
  if (matchAdvanced(target, advanced, true)) {
    return false;
  }
  if (matchAdvanced(target, advanced, false)) {
    return true;
  }
  if (youtubeId && youtubeExceptions.blockedVideos.includes(youtubeId)) {
    return true;
  }
  if (playlistId && youtubeExceptions.blockedPlaylists.includes(playlistId)) {
    return true;
  }
  if (matchDomainList(host, lists.blockedDomains ?? [])) {
    return true;
  }
  if (matchKeywordList(href, lists.blockedKeywords ?? [])) {
    return true;
  }
  return false;
};

const isTemporarilyAllowed = (href: string, temporaryAllow: Record<string, { until: number }>) => {
  const host = normalizeHost(new URL(href).hostname);
  const entry = temporaryAllow[host];
  return typeof entry?.until === "number" && Date.now() < entry.until;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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

const getState = async (): Promise<StorageState | null> => {
  if (!isExtensionContextValid()) {
    return null;
  }
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(STORAGE_KEY, (stored) => {
        resolve((stored[STORAGE_KEY] as StorageState) ?? null);
      });
    } catch {
      resolve(null);
    }
  });
};

type StoragePatch = {
  focusEnabled?: boolean;
  overlayMode?: boolean;
  lists?: StorageState["lists"];
  pomodoro?: Partial<StorageState["pomodoro"]>;
  tags?: Partial<StorageState["tags"]>;
  pause?: StorageState["pause"];
  strictSession?: StorageState["strictSession"];
};

const setState = async (partial: StoragePatch) => {
  const current = await getState();
  if (!current) {
    return null;
  }
  const merged = mergePatch(current, partial) as StorageState;
  await new Promise<void>((resolve) => {
    try {
      chrome.storage.local.set({ [STORAGE_KEY]: merged }, () => resolve());
    } catch {
      resolve();
    }
  });
  return merged;
};

const subscribeState = (callback: (state: StorageState) => void) => {
  if (!isExtensionContextValid()) {
    return () => undefined;
  }
  const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
    const change = changes[STORAGE_KEY];
    if (change?.newValue) {
      callback(change.newValue as StorageState);
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
};

const getWidgetPrefs = async (): Promise<WidgetPrefs> => {
  if (!isExtensionContextValid()) {
    return {};
  }
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(WIDGET_STORAGE_KEY, (stored) => {
        const localPrefs = stored[WIDGET_STORAGE_KEY] as WidgetPrefs | undefined;
        if (localPrefs && Object.keys(localPrefs).length > 0) {
          resolve(localPrefs);
          return;
        }
        chrome.storage.sync.get(WIDGET_STORAGE_KEY, (syncStored) => {
          resolve((syncStored[WIDGET_STORAGE_KEY] ?? {}) as WidgetPrefs);
        });
      });
    } catch {
      resolve({});
    }
  });
};

const saveWidgetPrefs = async (patch: WidgetPrefs) => {
  if (!isExtensionContextValid()) {
    return;
  }
  const current = await getWidgetPrefs();
  await new Promise<void>((resolve) => {
    try {
      const nextPrefs = { ...current, ...patch };
      chrome.storage.local.set({ [WIDGET_STORAGE_KEY]: nextPrefs }, () => {
        chrome.storage.sync.set({ [WIDGET_STORAGE_KEY]: nextPrefs }, () => resolve());
      });
    } catch {
      resolve();
    }
  });
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const formatTimer = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const getTagPomodoroConfig = (tag: StorageState["tags"]["items"][number] | null) => {
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

const initPomodoroWidget = async () => {
  const existing = document.getElementById("focusboss-pomodoro-widget");
  if (existing) {
    existing.remove();
  }

  const root = document.createElement("div");
  root.id = "focusboss-pomodoro-widget";
  root.dataset.fbActive = "true";
  root.style.position = "fixed";
  root.style.left = `${DEFAULT_WIDGET_POSITION.x}px`;
  root.style.top = `${DEFAULT_WIDGET_POSITION.y}px`;
  root.style.zIndex = "2147483646";
  root.style.pointerEvents = "auto";
  root.style.userSelect = "none";

  const shadow = root.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      :host {
        all: initial;
        font-family: "Poppins", "Segoe UI", system-ui, sans-serif;
      }
      * {
        box-sizing: border-box;
      }
      .fb-widget {
        width: 232px;
        height: 248px;
        border-radius: 26px;
        background:
          radial-gradient(140% 120% at 20% 15%, rgba(255, 110, 64, 0.35), rgba(0,0,0,0) 55%),
          #0b0b0d;
        box-shadow: 0 20px 40px rgba(0,0,0,0.45), 0 0 45px rgba(255, 110, 64, 0.25);
        color: #f5f5f5;
        display: grid;
        grid-template-rows: 28px 1fr auto;
        padding: 8px 10px 12px;
        gap: 8px;
        position: relative;
        transition: transform 200ms ease, opacity 200ms ease, width 220ms ease, height 220ms ease,
          padding 220ms ease, box-shadow 220ms ease;
      }
      .fb-widget::before {
        content: "";
        position: absolute;
        top: 8px;
        left: 50%;
        transform: translateX(-50%);
        width: 48px;
        height: 6px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.18);
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
        opacity: 0;
        transition: opacity 200ms ease;
        pointer-events: none;
      }
      .fb-widget:hover::before {
        opacity: 0.9;
      }
      .fb-widget.is-ultra::before {
        display: none;
      }
      .fb-widget.is-hidden {
        opacity: 0;
        pointer-events: none;
        transform: translateY(6px);
      }
      .fb-widget.is-idle {
        width: 170px;
        height: 54px;
        border-radius: 999px;
        grid-template-rows: 1fr;
        padding: 8px 12px;
      }
      .fb-handle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        cursor: grab;
      }
      .fb-handle span {
        font-size: 10px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: rgba(255,255,255,0.45);
      }
      .fb-window-actions {
        position: absolute;
        top: 10px;
        right: 10px;
        display: flex;
        gap: 6px;
      }
      .fb-window-actions [data-action="ultra-minimize"] {
        display: none;
      }
      .fb-minimize {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 0;
        background: rgba(255,255,255,0.16);
        color: rgba(255,255,255,0.7);
        cursor: pointer;
        display: grid;
        place-items: center;
        padding: 0;
      }
      .fb-minimize svg {
        width: 14px;
        height: 14px;
        display: block;
      }
      .fb-ring-wrap {
        position: relative;
        display: grid;
        place-items: center;
      }
      .fb-ring {
        width: 150px;
        height: 150px;
      }
      .fb-ring-bg {
        fill: none;
        stroke: rgba(255,255,255,0.08);
        stroke-width: 10;
      }
      .fb-ring-progress {
        fill: none;
        stroke: url(#fb-ring-gradient);
        stroke-width: 10;
        stroke-linecap: round;
        filter: url(#fb-ring-glow);
        transform: rotate(-90deg);
        transform-origin: 50% 50%;
        transition: stroke-dashoffset 400ms linear;
      }
      .fb-time {
        position: absolute;
        font-size: 30px;
        font-weight: 600;
        letter-spacing: 0.02em;
      }
      .fb-phase {
        position: absolute;
        top: 62%;
        font-size: 11px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: rgba(255,255,255,0.6);
      }
      .fb-cycle {
        position: absolute;
        top: 24%;
        font-size: 9px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: rgba(255,255,255,0.5);
      }
      .fb-controls {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        width: 100%;
      }
      .fb-btn {
        border: 0;
        background: rgba(255,255,255,0.12);
        color: #f5f5f5;
        height: 30px;
        padding: 6px 0;
        border-radius: 999px;
        display: grid;
        place-items: center;
        cursor: pointer;
      }
      .fb-btn svg {
        width: 12px;
        height: 12px;
      }
      .fb-btn.is-primary svg {
        width: 16px;
        height: 16px;
      }
      .fb-btn[disabled] {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .fb-footer {
        display: grid;
        gap: 8px;
      }
      .fb-complete {
        display: none;
        align-items: center;
        justify-items: center;
        gap: 12px;
        width: 100%;
      }
      .fb-complete-panel {
        width: 100%;
        min-height: 132px;
        border-radius: 18px;
        border: 1px solid rgba(120, 255, 210, 0.16);
        background:
          linear-gradient(135deg, rgba(36, 90, 80, 0.45), rgba(8, 12, 12, 0.95)),
          radial-gradient(120% 100% at 15% 10%, rgba(120, 255, 210, 0.22), rgba(0,0,0,0) 55%);
        box-shadow: 0 18px 36px rgba(0,0,0,0.35), 0 0 22px rgba(70, 220, 190, 0.2);
        display: grid;
        place-items: center;
        text-align: center;
        padding: 18px 16px;
        gap: 8px;
      }
      .fb-complete.is-interrupted .fb-complete-panel {
        border-color: rgba(255, 120, 120, 0.18);
        background:
          linear-gradient(135deg, rgba(92, 32, 36, 0.55), rgba(8, 12, 12, 0.95)),
          radial-gradient(120% 100% at 15% 10%, rgba(255, 120, 120, 0.22), rgba(0,0,0,0) 55%);
        box-shadow: 0 18px 36px rgba(0,0,0,0.35), 0 0 22px rgba(255, 120, 120, 0.18);
      }
      .fb-complete-tag {
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgba(190, 255, 235, 0.65);
      }
      .fb-complete-title {
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgba(230, 255, 245, 0.95);
      }
      .fb-complete-stats {
        display: grid;
        gap: 4px;
        font-size: 12px;
        color: rgba(190, 255, 235, 0.75);
      }
      .fb-complete-actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        width: 100%;
      }
      .fb-complete-actions .fb-btn {
        background: rgba(120, 255, 210, 0.12);
        font-size: 11px;
        letter-spacing: 0.04em;
        padding: 7px 0;
      }
      .fb-complete.is-interrupted .fb-complete-tag,
      .fb-complete.is-interrupted .fb-complete-title,
      .fb-complete.is-interrupted .fb-complete-stats {
        color: rgba(255, 220, 220, 0.85);
      }
      .fb-complete.is-interrupted .fb-complete-actions .fb-btn {
        background: rgba(255, 120, 120, 0.12);
      }
      .fb-confetti {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: visible;
      }
      .fb-confetti-piece {
        position: absolute;
        width: 4px;
        height: 6px;
        border-radius: 2px;
        opacity: 0;
        left: 50%;
        top: 62%;
        transform: translate(-50%, -50%) rotate(0deg);
        animation: fb-confetti-pop 3200ms ease-out forwards;
      }
      @keyframes fb-confetti-pop {
        0% {
          opacity: 1;
          transform: translate(-50%, -50%) rotate(0deg);
        }
        20% {
          opacity: 1;
          transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y-up))) rotate(calc(var(--r) * 0.6));
        }
        100% {
          opacity: 0;
          transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y-down))) rotate(var(--r));
        }
      }
      .fb-mini {
        display: none;
        width: 100%;
        flex-direction: column;
        gap: 12px;
      }
      .fb-mini-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .fb-mini-actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .fb-mini-meta {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
      }
      .fb-mini-tag {
        font-size: 12px;
        font-weight: 400;
        color: rgba(255,255,255,0.55);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 120px;
      }
      .fb-mini-cycle {
        font-size: 10px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgba(255,255,255,0.38);
        white-space: nowrap;
      }
      .fb-mini-ultra {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 0;
        background: rgba(255,255,255,0.12);
        color: rgba(255,255,255,0.7);
        display: grid;
        place-items: center;
        cursor: pointer;
        padding: 0;
      }
      .fb-mini-maximize {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 0;
        background: rgba(255,255,255,0.12);
        color: rgba(255,255,255,0.7);
        display: grid;
        place-items: center;
        cursor: pointer;
        padding: 0;
      }
      .fb-mini-ultra svg {
        width: 14px;
        height: 14px;
        display: block;
      }
      .fb-mini-maximize svg {
        width: 14px;
        height: 14px;
        display: block;
      }
      .fb-mini-row {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
      }
      .fb-mini-toggle {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: 0;
        background: rgba(255,255,255,0.16);
        color: #f5f5f5;
        display: grid;
        place-items: center;
        cursor: pointer;
      }
      .fb-mini-toggle svg {
        width: 16px;
        height: 16px;
      }
      .fb-mini-body {
        display: grid;
        gap: 4px;
        flex: 1;
        min-width: 0;
      }
      .fb-mini-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .fb-mini-title {
        font-size: 13px;
        font-weight: 600;
        color: #f5f5f5;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .fb-mini-time {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 999px;
        background: rgba(255,255,255,0.14);
        color: rgba(255,255,255,0.75);
        white-space: nowrap;
      }
      .fb-mini-progress {
        height: 8px;
        border-radius: 999px;
        background: rgba(255,255,255,0.12);
        overflow: hidden;
      }
      .fb-mini-progress-fill {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #ff8a4c, #ff2f2f);
        transition: width 400ms linear;
      }
      .fb-mini-settings {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 0;
        background: rgba(255,255,255,0.12);
        color: rgba(255,255,255,0.7);
        display: grid;
        place-items: center;
        cursor: pointer;
      }
      .fb-mini-settings svg {
        width: 14px;
        height: 14px;
      }
      .fb-ultra {
        display: none;
        align-items: center;
        gap: 8px;
        width: 100%;
      }
      .fb-ultra.is-compact {
        justify-content: center;
      }
      .fb-ultra-time {
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.02em;
        flex: 1;
        text-align: center;
      }
      .fb-ultra-actions {
        display: flex;
        align-items: center;
        gap: 6px;
        width: 58px;
        overflow: hidden;
        transform: translateX(0);
        opacity: 1;
        transition: width 220ms cubic-bezier(0.2, 0.8, 0.2, 1), transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 220ms ease;
      }
      .fb-ultra.is-compact .fb-ultra-actions {
        transform: translateX(-18px);
        opacity: 0;
        pointer-events: none;
        width: 0;
        gap: 0;
      }
      .fb-ultra-btn {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        border: 0;
        background: rgba(255,255,255,0.12);
        color: rgba(255,255,255,0.7);
        display: grid;
        place-items: center;
        cursor: pointer;
        padding: 0;
      }
      .fb-ultra-btn svg {
        width: 14px;
        height: 14px;
        display: block;
      }
      .fb-ultra-notch {
        width: 4px;
        height: 14px;
        border-radius: 999px;
        background: rgba(255,255,255,0.18);
        margin-left: 6px;
        flex-shrink: 0;
      }
      .fb-widget.is-complete .fb-ring-wrap,
      .fb-widget.is-complete .fb-footer,
      .fb-widget.is-complete .fb-mini,
      .fb-widget.is-complete .fb-ultra,
      .fb-widget.is-complete .fb-handle {
        display: none;
      }
      .fb-widget.is-complete .fb-complete {
        display: grid;
      }
      .fb-widget.is-complete {
        height: 200px;
        grid-template-rows: 1fr;
        padding: 12px;
      }
      .fb-widget.is-minimized {
        height: 118px;
        grid-template-rows: 6px 1fr;
        padding: 8px 12px 12px;
        gap: 8px;
      }
      .fb-widget.is-minimized .fb-ring-wrap,
      .fb-widget.is-minimized .fb-footer {
        display: none;
      }
      .fb-widget.is-minimized .fb-minimize[data-action="minimize"] {
        display: none;
      }
      .fb-widget.is-minimized .fb-handle {
        align-items: flex-start;
      }
      .fb-widget.is-minimized .fb-handle span {
        display: none;
      }
      .fb-widget.is-minimized .fb-mini {
        display: flex;
      }
      .fb-widget.is-ultra {
        width: 148px;
        height: 44px;
        border-radius: 999px;
        grid-template-rows: 1fr;
        padding: 8px 10px;
        gap: 0;
        box-shadow: 0 14px 28px rgba(0,0,0,0.38), 0 0 18px rgba(255, 110, 64, 0.18);
      }
      .fb-widget.is-ultra.is-compact {
        width: 88px;
      }
      .fb-widget.is-ultra .fb-handle,
      .fb-widget.is-ultra .fb-ring-wrap,
      .fb-widget.is-ultra .fb-footer,
      .fb-widget.is-ultra .fb-mini {
        display: none;
      }
      .fb-widget.is-ultra .fb-window-actions {
        display: none;
      }
      .fb-widget.is-ultra .fb-ultra {
        display: flex;
      }
    </style>
    <div class="fb-widget is-hidden">
      <div class="fb-confetti" aria-hidden="true"></div>
      <div class="fb-handle">
        <span>Pomodoro</span>
        <div class="fb-window-actions">
          <button class="fb-minimize" type="button" aria-label="Minimize" data-action="minimize">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M19.1429 10H14M14 10V4.85714M14 10L20 4"></path>
              <path d="M4.99996 14H9.99996M9.99996 14V19M9.99996 14L4 20"></path>
            </svg>
          </button>
          <button class="fb-minimize" type="button" aria-label="Ultra minimize" data-action="ultra-minimize">
            <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
              <path d="M320.106 172.772c.031.316.09.622.135.933.054.377.098.755.172 1.13.071.358.169.705.258 1.056.081.323.152.648.249.968.104.345.234.678.355 1.015.115.319.22.641.35.956.131.315.284.618.43.925.152.323.296.65.466.967.158.294.337.574.508.86.186.311.362.626.565.93.211.316.447.613.674.917.19.253.365.513.568.759.892 1.087 1.889 2.085 2.977 2.977.246.202.506.378.759.567.304.228.601.463.918.675.303.203.618.379.929.565.286.171.566.351.861.509.317.17.644.314.968.466.307.145.609.298.924.429.315.13.637.236.957.35.337.121.669.25 1.013.354.32.097.646.168.969.249.351.089.698.187 1.055.258.375.074.753.119 1.13.173.311.044.617.104.932.135.7.069 1.403.106 2.105.106H448c11.782 0 21.333-9.551 21.333-21.333 0-11.782-9.551-21.333-21.333-21.333h-55.163L505.752 36.418c8.331-8.331 8.331-21.839 0-30.17-8.331-8.331-21.839-8.331-30.17 0L362.667 119.163V64c0-11.782-9.551-21.333-21.333-21.333C329.551 42.667 320 52.218 320 64v106.667s0 .001 0 .001c0 .702.037 1.404.106 2.104zM170.667 42.667c-11.782 0-21.333 9.551-21.333 21.333v55.163L36.418 6.248c-8.331-8.331-21.839-8.331-30.17 0-8.331 8.331-8.331 21.839 0 30.17l112.915 112.915H64c-11.782 0-21.333 9.551-21.333 21.333C42.667 182.449 52.218 192 64 192h106.667c.703 0 1.405-.037 2.105-.106.316-.031.622-.09.933-.135.377-.054.755-.098 1.13-.172.358-.071.705-.169 1.056-.258.323-.081.648-.152.968-.249.345-.104.678-.234 1.015-.355.319-.115.641-.22.956-.35.315-.131.618-.284.925-.43.323-.152.65-.296.967-.466.295-.158.575-.338.862-.509.311-.185.625-.361.928-.564.317-.212.615-.448.92-.676.252-.189.511-.364.757-.566 1.087-.892 2.084-1.889 2.977-2.977.202-.246.377-.505.566-.757.228-.305.464-.603.676-.92.203-.303.378-.617.564-.928.171-.286.351-.567.509-.862.17-.317.313-.643.466-.967.145-.307.299-.61.43-.925.13-.315.235-.636.35-.956.121-.337.25-.67.355-1.015.097-.32.168-.645.249-.968.089-.351.187-.698.258-1.056.074-.375.118-.753.172-1.13.044-.311.104-.618.135-.933.069-.7.106-1.402.106-2.104 0 0 0-.001 0-.001V64c0-11.782-9.551-21.333-21.333-21.333zm21.227 296.561c-.031-.316-.09-.622-.135-.933-.054-.377-.098-.755-.172-1.13-.071-.358-.169-.705-.258-1.056-.081-.323-.152-.648-.249-.968-.104-.345-.234-.678-.355-1.015-.115-.319-.22-.641-.35-.956-.131-.315-.284-.618-.43-.925-.152-.323-.296-.65-.466-.967-.158-.295-.338-.575-.509-.862-.185-.311-.361-.625-.564-.928-.212-.317-.448-.615-.676-.92-.189-.252-.364-.511-.566-.757-.892-1.087-1.889-2.084-2.977-2.977-.246-.202-.505-.377-.757-.566-.305-.228-.603-.464-.92-.676-.303-.203-.617-.378-.928-.564-.286-.171-.567-.351-.862-.509-.317-.17-.643-.313-.967-.466-.307-.145-.61-.299-.925-.43-.315-.13-.636-.235-.956-.35-.337-.121-.67-.25-1.015-.355-.32-.097-.645-.168-.968-.249-.351-.089-.698-.187-1.056-.258-.375-.074-.753-.118-1.13-.172-.311-.044-.618-.104-.933-.135-.7-.069-1.403-.106-2.105-.106H64c-11.782 0-21.333 9.551-21.333 21.333 0 11.782 9.551 21.333 21.333 21.333h55.163L6.248 475.582c-8.331 8.331-8.331 21.839 0 30.17 8.331 8.331 21.839 8.331 30.17 0l112.915-112.915V448c0 11.782 9.551 21.333 21.333 21.333 11.782 0 21.333-9.551 21.333-21.333V341.333s0-.001 0-.001c0-.702-.037-1.404-.106-2.104zm200.943 23.439H448c11.782 0 21.333-9.551 21.333-21.333 0-11.782-9.551-21.333-21.333-21.333H341.333c-.703 0-1.405.037-2.105.106-.315.031-.621.09-.932.135-.378.054-.756.098-1.13.173-.358.071-.704.169-1.055.258-.324.081-.649.152-.969.249-.344.104-.677.233-1.013.354-.32.115-.642.22-.957.35-.315.131-.617.284-.924.429-.324.153-.65.296-.968.466-.295.158-.575.338-.861.509-.311.186-.626.362-.929.565-.316.212-.614.447-.918.675-.253.19-.512.365-.759.567-1.087.892-2.085 1.889-2.977 2.977-.202.246-.378.506-.568.759-.227.304-.463.601-.674.917-.203.304-.379.619-.565.93-.171.286-.351.566-.508.86-.17.317-.313.643-.466.967-.145.307-.299.61-.43.925-.13.315-.235.636-.35.956-.121.337-.25.67-.355 1.015-.097.32-.168.645-.249.968-.089.351-.187.698-.258 1.056-.074.374-.118.753-.172 1.13-.044.311-.104.618-.135.933-.069.7-.106 1.402-.106 2.104 0 0 0 .001 0 .001V448c0 11.782 9.551 21.333 21.333 21.333 11.782 0 21.333-9.551 21.333-21.333v-55.163l112.915 112.915c8.331 8.331 21.839 8.331 30.17 0 8.331-8.331 8.331-21.839 0-30.17L392.837 362.667z"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="fb-ring-wrap">
        <svg class="fb-ring" viewBox="0 0 160 160" aria-hidden="true">
          <defs>
            <linearGradient id="fb-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ff8a4c"></stop>
              <stop offset="100%" stop-color="#ff2f2f"></stop>
            </linearGradient>
            <filter id="fb-ring-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.6" result="coloredBlur"></feGaussianBlur>
              <feMerge>
                <feMergeNode in="coloredBlur"></feMergeNode>
                <feMergeNode in="SourceGraphic"></feMergeNode>
              </feMerge>
            </filter>
          </defs>
          <circle class="fb-ring-bg" cx="80" cy="80" r="64"></circle>
          <circle class="fb-ring-progress" cx="80" cy="80" r="64"></circle>
        </svg>
        <div class="fb-cycle">Cycle 1/1</div>
        <div class="fb-time">25:00</div>
        <div class="fb-phase">Focus</div>
      </div>
      <div class="fb-footer">
        <div class="fb-controls">
          <button class="fb-btn is-primary fb-btn-toggle" data-action="pause" type="button" aria-label="Pause">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6.5" y="5" width="4.5" height="14" rx="1.2"></rect>
              <rect x="13" y="5" width="4.5" height="14" rx="1.2"></rect>
            </svg>
          </button>
          <button class="fb-btn fb-btn-stop" data-action="stop" type="button" aria-label="Stop">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6.5" y="6.5" width="11" height="11" rx="1.6"></rect>
            </svg>
          </button>
          <button class="fb-btn" data-action="settings" type="button" aria-label="Edit tag">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3.5"></circle>
              <path d="M19.4 15a1.8 1.8 0 0 0 .36 2l.04.04a2 2 0 1 1-2.83 2.83l-.04-.04a1.8 1.8 0 0 0-2-.36 1.8 1.8 0 0 0-1 1.62V22a2 2 0 1 1-4 0v-.06a1.8 1.8 0 0 0-1-1.62 1.8 1.8 0 0 0-2 .36l-.04.04a2 2 0 1 1-2.83-2.83l.04-.04a1.8 1.8 0 0 0 .36-2 1.8 1.8 0 0 0-1.62-1H2a2 2 0 1 1 0-4h.06a1.8 1.8 0 0 0 1.62-1 1.8 1.8 0 0 0-.36-2l-.04-.04a2 2 0 1 1 2.83-2.83l.04.04a1.8 1.8 0 0 0 2 .36h0A1.8 1.8 0 0 0 9.94 2H10a2 2 0 1 1 4 0v.06a1.8 1.8 0 0 0 1 1.62h0a1.8 1.8 0 0 0 2-.36l.04-.04a2 2 0 1 1 2.83 2.83l-.04.04a1.8 1.8 0 0 0-.36 2v0A1.8 1.8 0 0 0 22 10h.06a2 2 0 1 1 0 4H22a1.8 1.8 0 0 0-1.6 1z"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="fb-complete">
        <div class="fb-complete-panel">
          <div class="fb-complete-tag">Default</div>
          <div class="fb-complete-title">Completed</div>
          <div class="fb-complete-stats">
            <span class="fb-complete-mins">25 mins</span>
            <span class="fb-complete-cycles">1 cycle</span>
          </div>
        </div>
        <div class="fb-complete-actions">
          <button class="fb-btn" data-action="start" type="button">Continue</button>
          <button class="fb-btn" data-action="dismiss" type="button">Close</button>
        </div>
      </div>
      <div class="fb-mini">
        <div class="fb-mini-header">
          <div class="fb-mini-meta">
            <span class="fb-mini-tag">Default</span>
            <span class="fb-mini-cycle">Cycle 1/1</span>
          </div>
          <div class="fb-mini-actions">
            <button class="fb-mini-maximize" type="button" aria-label="Maximize" data-action="maximize">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 21L10.5 13.5M3 21V15.4M3 21H8.6"></path>
                <path d="M21.0711 3L13.5 10.5M21.0711 3V8.65685M21.0711 3H15.4142"></path>
              </svg>
            </button>
            <button class="fb-mini-ultra" type="button" aria-label="Ultra minimize" data-action="ultra-minimize">
              <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
                <path d="M320.106 172.772c.031.316.09.622.135.933.054.377.098.755.172 1.13.071.358.169.705.258 1.056.081.323.152.648.249.968.104.345.234.678.355 1.015.115.319.22.641.35.956.131.315.284.618.43.925.152.323.296.65.466.967.158.294.337.574.508.86.186.311.362.626.565.93.211.316.447.613.674.917.19.253.365.513.568.759.892 1.087 1.889 2.085 2.977 2.977.246.202.506.378.759.567.304.228.601.463.918.675.303.203.618.379.929.565.286.171.566.351.861.509.317.17.644.314.968.466.307.145.609.298.924.429.315.13.637.236.957.35.337.121.669.25 1.013.354.32.097.646.168.969.249.351.089.698.187 1.055.258.375.074.753.119 1.13.173.311.044.617.104.932.135.7.069 1.403.106 2.105.106H448c11.782 0 21.333-9.551 21.333-21.333 0-11.782-9.551-21.333-21.333-21.333h-55.163L505.752 36.418c8.331-8.331 8.331-21.839 0-30.17-8.331-8.331-21.839-8.331-30.17 0L362.667 119.163V64c0-11.782-9.551-21.333-21.333-21.333C329.551 42.667 320 52.218 320 64v106.667s0 .001 0 .001c0 .702.037 1.404.106 2.104zM170.667 42.667c-11.782 0-21.333 9.551-21.333 21.333v55.163L36.418 6.248c-8.331-8.331-21.839-8.331-30.17 0-8.331 8.331-8.331 21.839 0 30.17l112.915 112.915H64c-11.782 0-21.333 9.551-21.333 21.333C42.667 182.449 52.218 192 64 192h106.667c.703 0 1.405-.037 2.105-.106.316-.031.622-.09.933-.135.377-.054.755-.098 1.13-.172.358-.071.705-.169 1.056-.258.323-.081.648-.152.968-.249.345-.104.678-.234 1.015-.355.319-.115.641-.22.956-.35.315-.131.618-.284.925-.43.323-.152.65-.296.967-.466.295-.158.575-.338.862-.509.311-.185.625-.361.928-.564.317-.212.615-.448.92-.676.252-.189.511-.364.757-.566 1.087-.892 2.084-1.889 2.977-2.977.202-.246.377-.505.566-.757.228-.305.464-.603.676-.92.203-.303.378-.617.564-.928.171-.286.351-.567.509-.862.17-.317.313-.643.466-.967.145-.307.299-.61.43-.925.13-.315.235-.636.35-.956.121-.337.25-.67.355-1.015.097-.32.168-.645.249-.968.089-.351.187-.698.258-1.056.074-.375.118-.753.172-1.13.044-.311.104-.618.135-.933.069-.7.106-1.402.106-2.104 0 0 0-.001 0-.001V64c0-11.782-9.551-21.333-21.333-21.333zm21.227 296.561c-.031-.316-.09-.622-.135-.933-.054-.377-.098-.755-.172-1.13-.071-.358-.169-.705-.258-1.056-.081-.323-.152-.648-.249-.968-.104-.345-.234-.678-.355-1.015-.115-.319-.22-.641-.35-.956-.131-.315-.284-.618-.43-.925-.152-.323-.296-.65-.466-.967-.158-.295-.338-.575-.509-.862-.185-.311-.361-.625-.564-.928-.212-.317-.448-.615-.676-.92-.189-.252-.364-.511-.566-.757-.892-1.087-1.889-2.084-2.977-2.977-.246-.202-.505-.377-.757-.566-.305-.228-.603-.464-.920-.676-.303-.203-.617-.378-.928-.564-.286-.171-.567-.351-.862-.509-.317-.17-.643-.313-.967-.466-.307-.145-.61-.299-.925-.43-.315-.13-.636-.235-.956-.35-.337-.121-.67-.25-1.015-.355-.32-.097-.645-.168-.968-.249-.351-.089-.698-.187-1.056-.258-.375-.074-.753-.118-1.13-.172-.311-.044-.618-.104-.933-.135-.7-.069-1.403-.106-2.105-.106H64c-11.782 0-21.333 9.551-21.333 21.333 0 11.782 9.551 21.333 21.333 21.333h55.163L6.248 475.582c-8.331 8.331-8.331 21.839 0 30.17 8.331 8.331 21.839 8.331 30.17 0l112.915-112.915V448c0 11.782 9.551 21.333 21.333 21.333 11.782 0 21.333-9.551 21.333-21.333V341.333s0-.001 0-.001c0-.702-.037-1.404-.106-2.104zm200.943 23.439H448c11.782 0 21.333-9.551 21.333-21.333 0-11.782-9.551-21.333-21.333-21.333H341.333c-.703 0-1.405.037-2.105.106-.315.031-.621.09-.932.135-.378.054-.756.098-1.13.173-.358.071-.704.169-1.055.258-.324.081-.649.152-.969.249-.344.104-.677.233-1.013.354-.32.115-.642.22-.957.35-.315.131-.617.284-.924.429-.324.153-.65.296-.968.466-.295.158-.575.338-.861.509-.311.186-.626.362-.929.565-.316.212-.614.447-.918.675-.253.19-.512.365-.759.567-1.087.892-2.085 1.889-2.977 2.977-.202.246-.378.506-.568.759-.227.304-.463.601-.674.917-.203.304-.379.619-.565.93-.171.286-.351.566-.508.86-.17.317-.313.643-.466.967-.145.307-.299.61-.43.925-.13.315-.235.636-.35.956-.121.337-.25.67-.355 1.015-.097.32-.168.645-.249.968-.089.351-.187.698-.258 1.056-.074.374-.118.753-.172 1.13-.044.311-.104.618-.135.933-.069.7-.106 1.402-.106 2.104 0 0 0 .001 0 .001V448c0 11.782 9.551 21.333 21.333 21.333 11.782 0 21.333-9.551 21.333-21.333v-55.163l112.915 112.915c8.331 8.331 21.839 8.331 30.17 0 8.331-8.331 8.331-21.839 0-30.17L392.837 362.667z"></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="fb-mini-row">
          <button class="fb-mini-toggle" type="button" aria-label="Pause" data-action="pause">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6.5" y="5" width="4.5" height="14" rx="1.2"></rect>
              <rect x="13" y="5" width="4.5" height="14" rx="1.2"></rect>
            </svg>
          </button>
          <div class="fb-mini-body">
            <div class="fb-mini-top">
              <span class="fb-mini-title">Focus</span>
              <span class="fb-mini-time">25 min</span>
            </div>
            <div class="fb-mini-progress">
              <div class="fb-mini-progress-fill"></div>
            </div>
          </div>
          <button class="fb-mini-settings" data-action="settings" type="button" aria-label="Edit tag">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3.5"></circle>
              <path d="M19.4 15a1.8 1.8 0 0 0 .36 2l.04.04a2 2 0 1 1-2.83 2.83l-.04-.04a1.8 1.8 0 0 0-2-.36 1.8 1.8 0 0 0-1 1.62V22a2 2 0 1 1-4 0v-.06a1.8 1.8 0 0 0-1-1.62 1.8 1.8 0 0 0-2 .36l-.04.04a2 2 0 1 1-2.83-2.83l.04-.04a1.8 1.8 0 0 0 .36-2 1.8 1.8 0 0 0-1.62-1H2a2 2 0 1 1 0-4h.06a1.8 1.8 0 0 0 1.62-1 1.8 1.8 0 0 0-.36-2l-.04-.04a2 2 0 1 1 2.83-2.83l.04.04a1.8 1.8 0 0 0 2 .36h0A1.8 1.8 0 0 0 9.94 2H10a2 2 0 1 1 4 0v.06a1.8 1.8 0 0 0 1 1.62h0a1.8 1.8 0 0 0 2-.36l.04-.04a2 2 0 1 1 2.83 2.83l-.04.04a1.8 1.8 0 0 0-.36 2v0A1.8 1.8 0 0 0 22 10h.06a2 2 0 1 1 0 4H22a1.8 1.8 0 0 0-1.6 1z"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="fb-ultra">
        <div class="fb-ultra-actions">
          <button class="fb-ultra-btn" type="button" aria-label="Maximize" data-action="maximize">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 21L10.5 13.5M3 21V15.4M3 21H8.6"></path>
              <path d="M21.0711 3L13.5 10.5M21.0711 3V8.65685M21.0711 3H15.4142"></path>
            </svg>
          </button>
          <button class="fb-ultra-btn" type="button" aria-label="Ultra maximize" data-action="ultra-maximize">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M14 10L20 4M20 4H15.5M20 4V8.5M4 4L10 10M4 4V8.5M4 4H8.5M14 14L20 20M20 20V15.5M20 20H15.5M10 14L4 20M4 20H8.5M4 20L4 15.5"></path>
            </svg>
          </button>
        </div>
        <span class="fb-ultra-time">25:00</span>
        <span class="fb-ultra-notch" aria-hidden="true"></span>
      </div>
    </div>
  `;

  document.documentElement.appendChild(root);

  const widget = shadow.querySelector(".fb-widget") as HTMLDivElement;
  const handle = shadow.querySelector(".fb-handle") as HTMLDivElement;
  const timeEl = shadow.querySelector(".fb-time") as HTMLDivElement;
  const phaseEl = shadow.querySelector(".fb-phase") as HTMLDivElement;
  const cycleEl = shadow.querySelector(".fb-cycle") as HTMLSpanElement;
  const progressCircle = shadow.querySelector(".fb-ring-progress") as SVGCircleElement;
  const buttons = Array.from(shadow.querySelectorAll<HTMLButtonElement>("[data-action]"));
  const toggleButton = shadow.querySelector(".fb-btn-toggle") as HTMLButtonElement;
  const stopButton = shadow.querySelector(".fb-btn-stop") as HTMLButtonElement;
  const miniToggleButton = shadow.querySelector(".fb-mini-toggle") as HTMLButtonElement;
  const miniTitleEl = shadow.querySelector(".fb-mini-title") as HTMLSpanElement;
  const miniTimeEl = shadow.querySelector(".fb-mini-time") as HTMLSpanElement;
  const miniTagEl = shadow.querySelector(".fb-mini-tag") as HTMLSpanElement;
  const miniCycleEl = shadow.querySelector(".fb-mini-cycle") as HTMLSpanElement;
  const miniProgressEl = shadow.querySelector(".fb-mini-progress-fill") as HTMLDivElement;
  const confetti = shadow.querySelector(".fb-confetti") as HTMLDivElement;
  const ultraTimeEl = shadow.querySelector(".fb-ultra-time") as HTMLSpanElement;
  const ultraBar = shadow.querySelector(".fb-ultra") as HTMLDivElement;
  const completeTagEl = shadow.querySelector(".fb-complete-tag") as HTMLDivElement;
  const completeTitleEl = shadow.querySelector(".fb-complete-title") as HTMLDivElement;
  const completeWrap = shadow.querySelector(".fb-complete") as HTMLDivElement;
  const completeMinsEl = shadow.querySelector(".fb-complete-mins") as HTMLSpanElement;
  const completeCyclesEl = shadow.querySelector(".fb-complete-cycles") as HTMLSpanElement;

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  progressCircle.style.strokeDasharray = `${circumference}`;
  progressCircle.style.strokeDashoffset = `${circumference}`;

  let prefs = await getWidgetPrefs();
  let latestState = await getState();
  if (!latestState) {
    return;
  }
  let dismissed = Boolean(prefs.dismissed);
  let seen = Boolean(prefs.seen);
  let position = prefs.position ?? { ...DEFAULT_WIDGET_POSITION };
  let minimized = Boolean(prefs.minimized);
  let ultraMinimized = Boolean(prefs.ultraMinimized);
  let ultraSide: "left" | "right" = prefs.ultraSide ?? "right";
  let ultraY = prefs.ultraY ?? position.y;
  let ultraCollapseTimer: number | null = null;
  let ultraDragMoved = false;
  let isDragging = false;
  let completionActive = false;
  let completionMinutes = 0;
  let completionCycles = 0;
  let completionMode: "completed" | "interrupted" = "completed";
  let completionBursted = false;
  let lastRunning: StorageState["pomodoro"]["running"] | null = null;

  const applyPosition = () => {
    const maxX = window.innerWidth - widget.offsetWidth - 8;
    const maxY = window.innerHeight - widget.offsetHeight - 8;
    if (!isDragging) {
      root.style.transition = ultraMinimized
        ? "right 200ms ease, left 200ms ease, top 200ms ease"
        : "left 200ms ease, top 200ms ease";
    }
    if (ultraMinimized) {
      ultraY = clamp(ultraY, 8, Math.max(8, maxY));
      root.style.top = `${ultraY}px`;
      if (ultraSide === "left") {
        root.style.left = "0px";
        root.style.right = "";
      } else {
        root.style.right = "0px";
        root.style.left = "";
      }
      return;
    }
    position = {
      x: clamp(position.x, 8, Math.max(8, maxX)),
      y: clamp(position.y, 8, Math.max(8, maxY))
    };
    root.style.right = "";
    root.style.left = `${position.x}px`;
    root.style.top = `${position.y}px`;
  };

  const updateProgress = (remainingMs: number, totalMs: number) => {
    const progress = totalMs > 0 ? clamp(1 - remainingMs / totalMs, 0, 1) : 0;
    progressCircle.style.strokeDashoffset = `${circumference * (1 - progress)}`;
  };

  const triggerConfetti = () => {
    if (!confetti || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const colors = ["#ff6b6b", "#ffd93d", "#6bcB77", "#4d96ff", "#9b5de5", "#f15bb5"];
    confetti.innerHTML = "";
    for (let i = 0; i < 40; i += 1) {
      const piece = document.createElement("span");
      piece.className = "fb-confetti-piece";
      const x = Math.round((Math.random() * 220 - 110) * 10) / 10;
      const yUp = Math.round((Math.random() * -150 - 50) * 10) / 10;
      const yDown = Math.round((Math.random() * 170 + 90) * 10) / 10;
      const r = Math.round(Math.random() * 360);
      const delay = Math.round(Math.random() * 150);
      const color = colors[i % colors.length];
      piece.style.setProperty("--x", `${x}px`);
      piece.style.setProperty("--y-up", `${yUp}px`);
      piece.style.setProperty("--y-down", `${yDown}px`);
      piece.style.setProperty("--r", `${r}deg`);
      piece.style.background = color;
      piece.style.animationDelay = `${delay}ms`;
      confetti.appendChild(piece);
    }
    window.setTimeout(() => {
      confetti.innerHTML = "";
    }, 1400);
  };

  const playIcon = `
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5-11-6.5z"></path>
    </svg>
  `;
  const pauseIcon = `
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6.5" y="5" width="4.5" height="14" rx="1.2"></rect>
      <rect x="13" y="5" width="4.5" height="14" rx="1.2"></rect>
    </svg>
  `;

  const updateWidget = async (state: StorageState) => {
    latestState = state;
    const running = state.pomodoro.running;
    if (running) {
      completionActive = false;
      completionBursted = false;
    }
    const storedCompletion = state.pomodoro.lastCompletion;
    if (!running && storedCompletion?.endedAt) {
      completionActive = true;
      completionMode = storedCompletion.mode;
      completionMinutes = storedCompletion.minutes;
      completionCycles = storedCompletion.cycles;
      minimized = false;
      ultraMinimized = false;
      await saveWidgetPrefs({ minimized: false, ultraMinimized: false });
      if (completionMode === "completed" && !completionBursted) {
        triggerConfetti();
        completionBursted = true;
      }
    }
    if (!running && lastRunning && typeof lastRunning.endsAt === "number" && lastRunning.endsAt > Date.now()) {
      lastRunning = null;
    }
    if (running) {
      if (!seen) {
        seen = true;
        await saveWidgetPrefs({ seen: true });
      }
      if (dismissed) {
        dismissed = false;
        await saveWidgetPrefs({ dismissed: false, seen: true });
      }
    }
    const shouldShow =
      !dismissed && (ultraMinimized || minimized || completionActive || seen || Boolean(running));
    const detectCompletion =
      !running &&
      !completionActive &&
      Boolean(lastRunning) &&
      state.pomodoro.cycles > 0 &&
      lastRunning?.phase === "break" &&
      (lastRunning?.cycleIndex ?? 0) >= state.pomodoro.cycles &&
      typeof lastRunning?.endsAt === "number" &&
      Date.now() >= lastRunning.endsAt;
    if (detectCompletion) {
      completionActive = true;
      completionMode = "completed";
      completionMinutes = state.pomodoro.workMin * state.pomodoro.cycles;
      completionCycles = state.pomodoro.cycles;
      minimized = false;
      ultraMinimized = false;
      await saveWidgetPrefs({ minimized: false, ultraMinimized: false });
      if (!completionBursted) {
        triggerConfetti();
        completionBursted = true;
      }
    }
    if (shouldShow && !root.isConnected) {
      document.documentElement.appendChild(root);
    }
    if (!shouldShow) {
      widget.classList.add("is-hidden");
      root.style.pointerEvents = "none";
      if (dismissed && root.isConnected) {
        root.remove();
      }
    } else {
      root.style.pointerEvents = "auto";
    }
    widget.classList.toggle("is-hidden", !shouldShow);
    widget.classList.toggle("is-minimized", minimized && !ultraMinimized);
    widget.classList.toggle("is-ultra", ultraMinimized);
    widget.classList.toggle(
      "is-complete",
      completionActive && shouldShow && !minimized && !ultraMinimized
    );
    applyPosition();

    const activeTag = state.pomodoro.lastTagId
      ? state.tags.items.find((item) => item.id === state.pomodoro.lastTagId) ?? null
      : null;
    const fullTagLabel = activeTag?.title ?? "Default";
    miniTagEl.textContent = truncateLabel(fullTagLabel, 12);
    miniTagEl.setAttribute("title", fullTagLabel);
    completeTagEl.textContent = truncateLabel(fullTagLabel, 16);
    completeTagEl.setAttribute("title", fullTagLabel);

    if (!running) {
      timeEl.textContent = formatTimer(state.pomodoro.workMin * 60 * 1000);
      phaseEl.textContent = "Focus";
      const idleCycleLabel =
        state.pomodoro.cycles === 0 ? "Endless" : `Cycle 1/${state.pomodoro.cycles}`;
      cycleEl.textContent = idleCycleLabel;
      updateProgress(state.pomodoro.workMin * 60 * 1000, state.pomodoro.workMin * 60 * 1000);
      ultraTimeEl.textContent = `${state.pomodoro.workMin} min`;
      if (completionActive) {
        const cyclesLabel = `${completionCycles} cycle${completionCycles === 1 ? "" : "s"}`;
        completeTitleEl.textContent =
          completionMode === "interrupted" ? "Interrupted" : "Completed";
        completeWrap.classList.toggle("is-interrupted", completionMode === "interrupted");
        completeMinsEl.textContent = `${completionMinutes} mins`;
        completeCyclesEl.textContent = cyclesLabel;
      }
      miniTitleEl.textContent = "Focus";
      miniTimeEl.textContent = `${state.pomodoro.workMin} min`;
      miniCycleEl.textContent = idleCycleLabel;
      miniProgressEl.style.width = "0%";
      toggleButton.dataset.action = "start";
      toggleButton.setAttribute("aria-label", "Play");
      toggleButton.innerHTML = playIcon;
      toggleButton.disabled = false;
      stopButton.disabled = true;
      miniToggleButton.dataset.action = "start";
      miniToggleButton.setAttribute("aria-label", "Play");
      miniToggleButton.innerHTML = playIcon;
      return;
    }

    const phase = running.phase === "work" ? "Focus" : "Break";
    phaseEl.textContent = phase;
    const totalMs =
      (running.phase === "work" ? state.pomodoro.workMin : state.pomodoro.breakMin) * 60 * 1000;
    const remainingMs = running.paused
      ? running.remainingMs ?? Math.max(0, running.endsAt - Date.now())
      : Math.max(0, running.endsAt - Date.now());
    timeEl.textContent = formatTimer(remainingMs);
    updateProgress(remainingMs, totalMs);
    ultraTimeEl.textContent = formatTimer(remainingMs);

    if (state.pomodoro.cycles === 0) {
      cycleEl.textContent = "Endless";
      miniCycleEl.textContent = "Endless";
    } else {
      const currentCycle =
        running.phase === "work" ? running.cycleIndex + 1 : running.cycleIndex;
      const safeCycle = clamp(currentCycle, 1, state.pomodoro.cycles);
      const cycleLabel = `Cycle ${safeCycle}/${state.pomodoro.cycles}`;
      cycleEl.textContent = cycleLabel;
      miniCycleEl.textContent = cycleLabel;
    }

    toggleButton.dataset.action = "pause";
    toggleButton.setAttribute("aria-label", running.paused ? "Play" : "Pause");
    toggleButton.innerHTML = running.paused ? playIcon : pauseIcon;
    toggleButton.disabled = false;
    stopButton.disabled = false;
    miniTitleEl.textContent = phase;
    miniTimeEl.textContent = `${Math.max(1, Math.ceil(remainingMs / 60000))} min`;
    miniProgressEl.style.width = `${clamp(1 - remainingMs / totalMs, 0, 1) * 100}%`;
    miniToggleButton.dataset.action = "pause";
    miniToggleButton.setAttribute("aria-label", running.paused ? "Play" : "Pause");
    miniToggleButton.innerHTML = running.paused ? playIcon : pauseIcon;
    lastRunning = running;
  };

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync" && areaName !== "local") {
      return;
    }
    const change = changes[WIDGET_STORAGE_KEY];
    if (!change?.newValue) {
      return;
    }
    prefs = change.newValue as WidgetPrefs;
    if (typeof prefs.dismissed === "boolean") {
      dismissed = prefs.dismissed;
    }
    if (typeof prefs.seen === "boolean") {
      seen = prefs.seen;
    }
    if (prefs.position) {
      position = { ...prefs.position };
    }
    if (typeof prefs.minimized === "boolean") {
      minimized = prefs.minimized;
      widget.classList.toggle("is-minimized", minimized && !ultraMinimized);
    }
    if (typeof prefs.ultraMinimized === "boolean") {
      ultraMinimized = prefs.ultraMinimized;
      widget.classList.toggle("is-ultra", ultraMinimized);
    }
    if (prefs.ultraSide === "left" || prefs.ultraSide === "right") {
      ultraSide = prefs.ultraSide;
    }
    if (typeof prefs.ultraY === "number") {
      ultraY = prefs.ultraY;
    }
    applyPosition();
    if (latestState) {
      void updateWidget(latestState);
    }
  });

  const handleAction = async (action: string) => {
    if (action === "start") {
      completionActive = false;
      const state = await getState();
      if (!state || state.pomodoro.running) {
        return;
      }
      const activeTag = state.pomodoro.lastTagId
        ? state.tags.items.find((item) => item.id === state.pomodoro.lastTagId) ?? null
        : null;
      const config = getTagPomodoroConfig(activeTag);
      const now = Date.now();
      const endsAt = now + config.workMin * 60 * 1000;
      await setState({
        focusEnabled: state.pomodoro.autoBlockDuringWork ? true : state.focusEnabled,
        pomodoro: {
          workMin: config.workMin,
          breakMin: config.breakMin,
          cycles: config.cycles,
          autoBlockDuringWork: state.pomodoro.autoBlockDuringWork,
          blockDuringBreak: state.pomodoro.blockDuringBreak,
          lastTagId: activeTag?.id ?? null,
          lastCompletion: undefined,
          running: {
            phase: "work",
            startedAt: now,
            endsAt,
            cycleIndex: 0,
            paused: false,
            linkedTagId: activeTag?.id ?? null,
            prevFocusEnabled: state.focusEnabled
          }
        }
      });
      return;
    }

    if (action === "pause") {
      const state = await getState();
      if (!state) {
        return;
      }
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
      return;
    }

    if (action === "stop") {
      const state = await getState();
      if (state) {
        const running = state.pomodoro.running;
        const cycleIndex = running?.cycleIndex ?? 0;
        const completedCycles = Math.max(0, cycleIndex);
        const elapsedMs = running?.startedAt ? Math.max(0, Date.now() - running.startedAt) : 0;
        const perCycleMs = (state.pomodoro.workMin + state.pomodoro.breakMin) * 60 * 1000;
        const totalMs = completedCycles * perCycleMs + elapsedMs;
        completionMinutes = Math.max(1, Math.ceil(totalMs / 60000));
        completionCycles = Math.max(0, completedCycles);
        completionMode = "interrupted";
        completionActive = true;
        minimized = false;
        ultraMinimized = false;
        widget.classList.toggle("is-minimized", false);
        widget.classList.toggle("is-ultra", false);
        await saveWidgetPrefs({ minimized: false, ultraMinimized: false });
        await setState({
          pomodoro: {
            running: null,
            lastCompletion: {
              mode: "interrupted",
              minutes: completionMinutes,
              cycles: completionCycles,
              endedAt: Date.now(),
              tagId: running?.linkedTagId ?? null
            }
          }
        });
      }
      return;
    }

    if (action === "minimize") {
      minimized = !minimized;
      ultraMinimized = false;
      widget.classList.toggle("is-minimized", minimized);
      widget.classList.toggle("is-ultra", false);
      await saveWidgetPrefs({ minimized, ultraMinimized: false });
      applyPosition();
      return;
    }

    if (action === "maximize") {
      if (ultraMinimized) {
        ultraMinimized = false;
        minimized = true;
        widget.classList.toggle("is-ultra", false);
        widget.classList.toggle("is-minimized", true);
        await saveWidgetPrefs({ ultraMinimized: false, minimized: true });
      } else {
        minimized = false;
        widget.classList.toggle("is-minimized", false);
        await saveWidgetPrefs({ minimized: false });
      }
      applyPosition();
      return;
    }

    if (action === "ultra-maximize") {
      ultraMinimized = false;
      minimized = false;
      widget.classList.toggle("is-ultra", false);
      widget.classList.toggle("is-minimized", false);
      widget.classList.toggle("is-compact", false);
      ultraBar.classList.toggle("is-compact", false);
      await saveWidgetPrefs({ ultraMinimized: false, minimized: false });
      applyPosition();
      return;
    }

    if (action === "ultra-minimize") {
      ultraMinimized = true;
      minimized = false;
      widget.classList.toggle("is-ultra", true);
      widget.classList.toggle("is-minimized", false);
      widget.classList.toggle("is-compact", true);
      ultraBar.classList.toggle("is-compact", true);
      await saveWidgetPrefs({ ultraMinimized: true, minimized: false, ultraSide, ultraY });
      applyPosition();
      return;
    }

    if (action === "dismiss") {
      dismissed = true;
      completionActive = false;
      lastRunning = null;
      await saveWidgetPrefs({ dismissed: true });
      widget.classList.add("is-hidden");
      root.style.pointerEvents = "none";
      root.remove();
      return;
    }

    if (action === "settings") {
      const state = await getState();
      if (!state) {
        return;
      }
      const tagId =
        state.pomodoro.running?.linkedTagId ?? state.pomodoro.lastTagId ?? null;
      chrome.runtime.sendMessage({ type: "openTagSettings", tagId });
    }
  };

  buttons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const action = button.dataset.action;
      if (action) {
        void handleAction(action);
      }
    });
  });


  handle.addEventListener("pointerdown", (event) => {
    if ((event.target as HTMLElement | null)?.closest(".fb-window-actions")) {
      return;
    }
    event.preventDefault();
    isDragging = true;
    root.style.transition = "none";
    const startX = event.clientX;
    const startY = event.clientY;
    const originX = position.x;
    const originY = position.y;
    handle.setPointerCapture(event.pointerId);
    const onMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      position = { x: originX + deltaX, y: originY + deltaY };
      applyPosition();
    };
    const onUp = async () => {
      handle.releasePointerCapture(event.pointerId);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      isDragging = false;
      root.style.transition = "left 200ms ease, top 200ms ease";
      await saveWidgetPrefs({ position });
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  });

  ultraBar.addEventListener("pointerdown", (event) => {
    if (!ultraMinimized) {
      return;
    }
    if ((event.target as HTMLElement | null)?.closest("button")) {
      return;
    }
    if (ultraCollapseTimer !== null) {
      window.clearTimeout(ultraCollapseTimer);
      ultraCollapseTimer = null;
    }
    event.preventDefault();
    const startY = event.clientY;
    const originY = ultraY;
    ultraDragMoved = false;
    isDragging = true;
    root.style.transition = "none";
    ultraBar.setPointerCapture(event.pointerId);
    const onMove = (moveEvent: PointerEvent) => {
      const deltaY = moveEvent.clientY - startY;
      ultraY = originY + deltaY;
      if (Math.abs(deltaY) > 3) {
        ultraDragMoved = true;
      }
      applyPosition();
    };
    const onUp = async (upEvent: PointerEvent) => {
      ultraBar.releasePointerCapture(event.pointerId);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      ultraSide = upEvent.clientX < window.innerWidth / 2 ? "left" : "right";
      isDragging = false;
      root.style.transition = "right 200ms ease, left 200ms ease, top 200ms ease";
      await saveWidgetPrefs({ ultraSide, ultraY });
      applyPosition();
      window.setTimeout(() => {
        ultraDragMoved = false;
      }, 80);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  });

  ultraBar.addEventListener(
    "click",
    (event) => {
      if (ultraDragMoved) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true
  );

  ultraBar.addEventListener("mouseenter", () => {
    if (!ultraMinimized) {
      return;
    }
    if (ultraCollapseTimer !== null) {
      window.clearTimeout(ultraCollapseTimer);
      ultraCollapseTimer = null;
    }
    widget.classList.toggle("is-compact", false);
    ultraBar.classList.toggle("is-compact", false);
  });

  ultraBar.addEventListener("mouseleave", () => {
    if (!ultraMinimized) {
      return;
    }
    if (ultraCollapseTimer !== null) {
      window.clearTimeout(ultraCollapseTimer);
    }
    ultraCollapseTimer = window.setTimeout(() => {
      widget.classList.toggle("is-compact", true);
      ultraBar.classList.toggle("is-compact", true);
      ultraCollapseTimer = null;
    }, 600);
  });

  applyPosition();
  await updateWidget(latestState);

  subscribeState((state) => {
    void updateWidget(state);
  });

  window.setInterval(() => {
    if (latestState) {
      void updateWidget(latestState);
    }
  }, 1000);
};

const injectOverlay = () => {
  if (document.getElementById("focusboss-overlay")) {
    return;
  }
  const overlay = document.createElement("div");
  overlay.id = "focusboss-overlay";
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.background = "rgba(8, 10, 10, 0.92)";
  overlay.style.zIndex = "2147483647";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.color = "#f5f5f5";
  overlay.style.fontFamily = "Poppins, Arial, sans-serif";
  overlay.style.textAlign = "center";
  overlay.innerHTML = `
    <div style="max-width: 320px; padding: 24px; border-radius: 16px; background: rgba(22, 26, 26, 0.9); border: 1px solid rgba(255,255,255,0.1);">
      <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">FocusBoss</div>
      <div style="font-size: 13px; color: #a4abac;">This site is blocked while Focus Mode is on.</div>
    </div>
  `;
  document.documentElement.appendChild(overlay);
};

const redirectToIntervention = (href: string) => {
  return new Promise<boolean>((resolve) => {
    if (!isExtensionContextValid()) {
      resolve(false);
      return;
    }
    try {
      chrome.runtime.sendMessage(
        { type: "redirectToIntervention", prevUrl: href },
        (response: { ok?: boolean } | undefined) => {
          if (chrome.runtime.lastError || !response?.ok) {
            try {
              const target = chrome.runtime.getURL(`tab.html?prev=${encodeURIComponent(href)}`);
              window.location.replace(target);
              resolve(true);
            } catch {
              resolve(false);
            }
            return;
          }
          resolve(true);
        }
      );
    } catch {
      resolve(false);
    }
  });
};

const evaluate = async () => {
  if (!location.href.startsWith("http")) {
    return;
  }
  if (!isExtensionContextValid()) {
    return;
  }
  let stored: Record<string, unknown> | undefined;
  try {
    stored = await chrome.storage.local.get(STORAGE_KEY);
  } catch {
    return;
  }
  const state = stored?.[STORAGE_KEY] as StorageState | undefined;
  if (!state) {
    return;
  }
  const focusEnabled = Boolean(state.focusEnabled);
  const pause = state.pause ?? { isPaused: false };
  const isPaused = Boolean(pause.isPaused);
  const active = focusEnabled && !isPaused;
  if (!active) {
    return;
  }
  const lists = state.lists;
  if (!lists) {
    return;
  }
  if (!state.strictSession?.active && isTemporarilyAllowed(location.href, state.temporaryAllow ?? {})) {
    return;
  }
  const blocked = isBlockedByRules(location.href, lists);
  if (!blocked) {
    return;
  }
  if (state.overlayMode) {
    injectOverlay();
  } else {
    const redirected = await redirectToIntervention(location.href);
    if (!redirected) {
      injectOverlay();
    }
  }
};

void evaluate();
void initPomodoroWidget();
const startSpaWatcher = () => {
  let lastHref = location.href;
  const maybeRun = () => {
    if (location.href === lastHref) {
      return;
    }
    lastHref = location.href;
    void evaluate();
  };
  const wrapHistory = (method: "pushState" | "replaceState") => {
    const original = history[method];
    history[method] = function (...args) {
      const result = original.apply(this, args as any);
      maybeRun();
      return result;
    };
  };
  wrapHistory("pushState");
  wrapHistory("replaceState");
  window.addEventListener("popstate", maybeRun);
  window.setInterval(maybeRun, 1000);
};
startSpaWatcher();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "focusBossPing") {
    return;
  }
  sendResponse({ ok: true });
});
})();
