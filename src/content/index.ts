const STORAGE_KEY = "focusBossState";
const WIDGET_STORAGE_KEY = "focusBossWidget";
const DEFAULT_WIDGET_POSITION = { x: 24, y: 24 };
const DEFAULT_POMODORO = { workMin: 25, breakMin: 5, cycles: 0 };

type StorageState = {
  focusEnabled: boolean;
  overlayMode: boolean;
  lists: {
    blockedDomains: string[];
    blockedKeywords: string[];
    allowedDomains: string[];
    allowedKeywords: string[];
    advancedRulesText?: string;
  };
  pomodoro: {
    workMin: number;
    breakMin: number;
    cycles: number;
    autoBlockDuringWork: boolean;
    blockDuringBreak: boolean;
    lastTagId: string | null;
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
  };
};

type WidgetPrefs = {
  position?: { x: number; y: number };
  dismissed?: boolean;
  seen?: boolean;
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

const matchAdvanced = (target: string, compiled: ReturnType<typeof parseAdvancedRules>, exclude: boolean) => {
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
  return list.some((entry) => normalizeHost(entry.trim()) === normalized);
};

const matchKeywordList = (href: string, list: string[]) => {
  const haystack = href.toLowerCase();
  return list.some((entry) => {
    const needle = entry.trim().toLowerCase();
    return needle.length > 0 && haystack.includes(needle);
  });
};

const isBlockedByRules = (href: string, lists: any): boolean => {
  const urlObj = new URL(href);
  const host = normalizeHost(urlObj.hostname);
  const target = `${host}${urlObj.pathname}${urlObj.search}`.toLowerCase();
  const advanced = parseAdvancedRules(lists.advancedRulesText ?? "");

  if (matchDomainList(host, lists.allowedDomains ?? [])) {
    return false;
  }
  if (matchKeywordList(href, lists.allowedKeywords ?? [])) {
    return false;
  }
  if (matchAdvanced(target, advanced, true)) {
    return false;
  }
  if (matchAdvanced(target, advanced, false)) {
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
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (stored) => {
      resolve((stored[STORAGE_KEY] as StorageState) ?? null);
    });
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
    chrome.storage.local.set({ [STORAGE_KEY]: merged }, () => resolve());
  });
  return merged;
};

const subscribeState = (callback: (state: StorageState) => void) => {
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
  return new Promise((resolve) => {
    chrome.storage.sync.get(WIDGET_STORAGE_KEY, (stored) => {
      resolve((stored[WIDGET_STORAGE_KEY] ?? {}) as WidgetPrefs);
    });
  });
};

const saveWidgetPrefs = async (patch: WidgetPrefs) => {
  const current = await getWidgetPrefs();
  await new Promise<void>((resolve) => {
    chrome.storage.sync.set(
      {
        [WIDGET_STORAGE_KEY]: {
          ...current,
          ...patch
        }
      },
      () => resolve()
    );
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
  if (document.getElementById("focusboss-pomodoro-widget")) {
    return;
  }

  const root = document.createElement("div");
  root.id = "focusboss-pomodoro-widget";
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
        height: 232px;
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
        transition: transform 200ms ease, opacity 200ms ease;
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
      .fb-close {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 0;
        background: rgba(255,255,255,0.16);
        color: rgba(255,255,255,0.7);
        font-size: 12px;
        cursor: pointer;
        display: grid;
        place-items: center;
        position: absolute;
        top: 8px;
        right: 8px;
      }
      .fb-ring-wrap {
        position: relative;
        display: grid;
        place-items: center;
      }
      .fb-ring {
        width: 160px;
        height: 160px;
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
        padding: 7px 0;
        border-radius: 999px;
        font-size: 10px;
        letter-spacing: 0.04em;
        cursor: pointer;
      }
      .fb-btn[disabled] {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .fb-footer {
        display: grid;
        gap: 8px;
      }
      .fb-corner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .fb-cycle {
        font-size: 10px;
        padding: 4px 8px;
        border-radius: 999px;
        background: rgba(255,255,255,0.12);
        color: rgba(255,255,255,0.7);
      }
      .fb-gear {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        border: 0;
        background: rgba(255,255,255,0.12);
        color: rgba(255,255,255,0.7);
        display: grid;
        place-items: center;
        cursor: pointer;
      }
      .fb-gear svg {
        width: 14px;
        height: 14px;
      }
      .fb-idle {
        display: none;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        width: 100%;
      }
      .fb-idle span {
        font-size: 12px;
        color: rgba(255,255,255,0.8);
      }
      .fb-idle button {
        border: 0;
        background: rgba(255,255,255,0.18);
        color: #fff;
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 11px;
        cursor: pointer;
      }
      .fb-widget.is-idle .fb-ring-wrap,
      .fb-widget.is-idle .fb-controls,
      .fb-widget.is-idle .fb-corner {
        display: none;
      }
      .fb-widget.is-idle .fb-handle {
        position: absolute;
        inset: 0;
        display: flex;
      }
      .fb-widget.is-idle .fb-handle span {
        display: none;
      }
      .fb-widget.is-idle .fb-idle {
        display: flex;
      }
    </style>
    <div class="fb-widget is-hidden">
      <div class="fb-handle">
        <span>Pomodoro</span>
        <button class="fb-close" type="button" aria-label="Hide">×</button>
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
        <div class="fb-time">25:00</div>
        <div class="fb-phase">Focus</div>
      </div>
      <div class="fb-footer">
        <div class="fb-controls">
          <button class="fb-btn" data-action="start" type="button">Start</button>
          <button class="fb-btn" data-action="pause" type="button">Pause</button>
          <button class="fb-btn" data-action="stop" type="button">Stop</button>
        </div>
        <div class="fb-corner">
          <span class="fb-cycle">Cycle 1/1</span>
          <button class="fb-gear" data-action="settings" type="button" aria-label="Edit tag">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3.5"></circle>
              <path d="M19.4 15a1.8 1.8 0 0 0 .36 2l.04.04a2 2 0 1 1-2.83 2.83l-.04-.04a1.8 1.8 0 0 0-2-.36 1.8 1.8 0 0 0-1 1.62V22a2 2 0 1 1-4 0v-.06a1.8 1.8 0 0 0-1-1.62 1.8 1.8 0 0 0-2 .36l-.04.04a2 2 0 1 1-2.83-2.83l.04-.04a1.8 1.8 0 0 0 .36-2 1.8 1.8 0 0 0-1.62-1H2a2 2 0 1 1 0-4h.06a1.8 1.8 0 0 0 1.62-1 1.8 1.8 0 0 0-.36-2l-.04-.04a2 2 0 1 1 2.83-2.83l.04.04a1.8 1.8 0 0 0 2 .36h0A1.8 1.8 0 0 0 9.94 2H10a2 2 0 1 1 4 0v.06a1.8 1.8 0 0 0 1 1.62h0a1.8 1.8 0 0 0 2-.36l.04-.04a2 2 0 1 1 2.83 2.83l-.04.04a1.8 1.8 0 0 0-.36 2v0A1.8 1.8 0 0 0 22 10h.06a2 2 0 1 1 0 4H22a1.8 1.8 0 0 0-1.6 1z"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="fb-idle">
        <span>Start next</span>
        <button data-action="start" type="button">Start</button>
      </div>
    </div>
  `;

  document.documentElement.appendChild(root);

  const widget = shadow.querySelector(".fb-widget") as HTMLDivElement;
  const handle = shadow.querySelector(".fb-handle") as HTMLDivElement;
  const closeButton = shadow.querySelector(".fb-close") as HTMLButtonElement;
  const timeEl = shadow.querySelector(".fb-time") as HTMLDivElement;
  const phaseEl = shadow.querySelector(".fb-phase") as HTMLDivElement;
  const cycleEl = shadow.querySelector(".fb-cycle") as HTMLSpanElement;
  const progressCircle = shadow.querySelector(".fb-ring-progress") as SVGCircleElement;
  const buttons = Array.from(shadow.querySelectorAll<HTMLButtonElement>("[data-action]"));

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

  const applyPosition = () => {
    const maxX = window.innerWidth - widget.offsetWidth - 8;
    const maxY = window.innerHeight - widget.offsetHeight - 8;
    position = {
      x: clamp(position.x, 8, Math.max(8, maxX)),
      y: clamp(position.y, 8, Math.max(8, maxY))
    };
    root.style.left = `${position.x}px`;
    root.style.top = `${position.y}px`;
  };

  const updateProgress = (remainingMs: number, totalMs: number) => {
    const progress = totalMs > 0 ? clamp(1 - remainingMs / totalMs, 0, 1) : 0;
    progressCircle.style.strokeDashoffset = `${circumference * (1 - progress)}`;
  };

  const updateWidget = async (state: StorageState) => {
    latestState = state;
    const running = state.pomodoro.running;
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
    const shouldShow = !dismissed && (seen || Boolean(running));
    widget.classList.toggle("is-hidden", !shouldShow);
    widget.classList.toggle("is-idle", !running && shouldShow);

    if (!running) {
      timeEl.textContent = formatTimer(state.pomodoro.workMin * 60 * 1000);
      phaseEl.textContent = "Focus";
      cycleEl.textContent = state.pomodoro.cycles === 0 ? "Endless" : `Cycle 1/${state.pomodoro.cycles}`;
      updateProgress(state.pomodoro.workMin * 60 * 1000, state.pomodoro.workMin * 60 * 1000);
      buttons.forEach((button) => {
        if (button.dataset.action === "start") {
          button.disabled = false;
        }
        if (button.dataset.action === "pause") {
          button.textContent = "Pause";
          button.disabled = true;
        }
        if (button.dataset.action === "stop") {
          button.disabled = true;
        }
      });
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

    if (state.pomodoro.cycles === 0) {
      cycleEl.textContent = "Endless";
    } else {
      const currentCycle =
        running.phase === "work" ? running.cycleIndex + 1 : running.cycleIndex;
      const safeCycle = clamp(currentCycle, 1, state.pomodoro.cycles);
      cycleEl.textContent = `Cycle ${safeCycle}/${state.pomodoro.cycles}`;
    }

    buttons.forEach((button) => {
      if (button.dataset.action === "pause") {
        button.textContent = running.paused ? "Resume" : "Pause";
        button.disabled = false;
      }
      if (button.dataset.action === "start") {
        button.disabled = true;
      }
      if (button.dataset.action === "stop") {
        button.disabled = false;
      }
    });
  };

  const handleAction = async (action: string) => {
    if (action === "start") {
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
      await setState({ pomodoro: { running: null } });
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

  closeButton.addEventListener("click", async (event) => {
    event.stopPropagation();
    dismissed = true;
    await saveWidgetPrefs({ dismissed: true });
    widget.classList.add("is-hidden");
  });
  closeButton.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });

  handle.addEventListener("pointerdown", (event) => {
    event.preventDefault();
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
      await saveWidgetPrefs({ position });
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
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
  chrome.runtime.sendMessage(
    { type: "redirectToIntervention", prevUrl: href },
    (response: { ok?: boolean } | undefined) => {
      if (chrome.runtime.lastError || !response?.ok) {
        const target = chrome.runtime.getURL(`tab.html?prev=${encodeURIComponent(href)}`);
        window.location.replace(target);
      }
    }
  );
};

const evaluate = async () => {
  if (!location.href.startsWith("http")) {
    return;
  }
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  const state = stored[STORAGE_KEY];
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
    redirectToIntervention(location.href);
  }
};

void evaluate();
void initPomodoroWidget();
