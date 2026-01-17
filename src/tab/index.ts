import { getState, setState, subscribeState } from "../shared/storage.js";
import { evaluateRules } from "../shared/rules.js";
import { getInterventionLabel, pickIntervention } from "../shared/interventions.js";

const nameEl = document.getElementById("interventionName");
const messageEl = document.getElementById("interventionMessage");
const metaEl = document.getElementById("interventionMeta");
const reasonEl = document.getElementById("interventionReason");
const usageEl = document.getElementById("interventionUsage");
const stageEl = document.getElementById("interventionStage");
const actionsEl = document.getElementById("interventionActions");
const backButton = document.getElementById("interventionBack") as HTMLButtonElement | null;
const tempAllowSection = document.getElementById("tempAllowSection");
const themeButton = document.querySelector<HTMLButtonElement>(".intervention-theme-btn");
const interventionChip = document.getElementById("interventionChip") as HTMLButtonElement | null;
const appRoot = document.querySelector<HTMLElement>(".app");
const rootEl = document.documentElement;
const tempAllowButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-allow-min]")
);
const pendingTimeouts: number[] = [];
let currentLocked = false;
let canEnableBack = false;
let allowEmergencyInStrict = false;
let currentThemeSetting: "dark" | "light" | "system" = "dark";

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

const formatUsage = (ms: number): string => {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}m ${seconds}s`;
};

const getSystemTheme = (): "dark" | "light" => {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const watchSystemTheme = (callback: (theme: "dark" | "light") => void) => {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => callback(getSystemTheme());
  media.addEventListener("change", handler);
  return () => media.removeEventListener("change", handler);
};

const renderTheme = (theme: "dark" | "light" | "system") => {
  currentThemeSetting = theme;
  const nextTheme = theme === "system" ? getSystemTheme() : theme;
  rootEl.setAttribute("data-theme", nextTheme);
  appRoot?.setAttribute("data-theme", nextTheme);
};

const renderEmpty = () => {
  if (nameEl) nameEl.textContent = "No interventions enabled";
  if (messageEl) messageEl.textContent = "Enable an intervention in the popup.";
  if (metaEl) metaEl.textContent = "";
  if (reasonEl) reasonEl.textContent = "";
  if (usageEl) usageEl.textContent = "";
  if (stageEl) stageEl.innerHTML = "";
  actionsEl?.classList.add("hidden");
  tempAllowSection?.classList.add("hidden");
};

const decodeMaybe = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

let cachedPrevUrl: string | null = null;

const getPrevUrlFromLocation = () => {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("prev");
  if (fromQuery) {
    return decodeMaybe(fromQuery);
  }
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) {
    return null;
  }
  if (hash.startsWith("prev=")) {
    return decodeMaybe(hash.slice(5));
  }
  return decodeMaybe(hash);
};

const fetchPrevUrl = async (): Promise<string | null> => {
  if (cachedPrevUrl !== null) {
    return cachedPrevUrl;
  }
  cachedPrevUrl = getPrevUrlFromLocation();
  if (cachedPrevUrl) {
    return cachedPrevUrl;
  }
  const tab = await new Promise<chrome.tabs.Tab | undefined>((resolve) => {
    chrome.tabs.getCurrent((current) => resolve(current));
  });
  const tabId = tab?.id;
  if (typeof tabId !== "number") {
    return null;
  }
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "getBlockedNav", tabId }, (response) => {
      cachedPrevUrl = response?.url ?? null;
      resolve(cachedPrevUrl);
    });
  });
};

const wireBackButton = () => {
  backButton?.addEventListener("click", () => {
    void (async () => {
      const prev = await fetchPrevUrl();
      if (prev) {
        window.location.replace(prev);
      } else {
        window.close();
      }
    })();
  });
};

const wireTempAllow = () => {
  tempAllowButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const minutes = Number(button.dataset.allowMin ?? "0");
      if (!minutes) {
        return;
      }
      const prev = await fetchPrevUrl();
      if (!prev) {
        return;
      }
      chrome.runtime.sendMessage({ type: "temporaryAllow", prevUrl: prev, minutes }, () => {
        if (chrome.runtime.lastError) {
          window.location.replace(prev);
        }
      });
    });
  });
};

const wireThemeButton = () => {
  themeButton?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "openPopup", view: "settings" }, () => {
      if (chrome.runtime.lastError) {
        // Ignore; popup opening is best-effort.
      }
    });
  });
};

const wireInterventionChip = () => {
  interventionChip?.addEventListener("click", () => {
    chrome.runtime.sendMessage(
      { type: "openPopup", view: "home", settingsSection: "interventions" },
      () => {
        if (chrome.runtime.lastError) {
          // Ignore; popup opening is best-effort.
        }
      }
    );
  });
};

const clearPendingTimeouts = () => {
  while (pendingTimeouts.length > 0) {
    const handle = pendingTimeouts.pop();
    if (typeof handle === "number") {
      window.clearTimeout(handle);
    }
  }
};

const withTimeout = (handler: () => void, delayMs: number) => {
  const handle = window.setTimeout(handler, delayMs);
  pendingTimeouts.push(handle);
};

const setLocked = (locked: boolean, strictActive: boolean) => {
  currentLocked = locked;
  if (tempAllowSection) {
    tempAllowSection.classList.toggle("hidden", locked || (strictActive && !allowEmergencyInStrict));
  }
  updateBackButtonState(canEnableBack);
};

const updateBackButtonState = (canEnable: boolean) => {
  canEnableBack = canEnable;
  if (!backButton) {
    return;
  }
  backButton.disabled = !canEnable;
  backButton.setAttribute("aria-disabled", backButton.disabled ? "true" : "false");
};

const renderInstantStage = () => {
  if (!stageEl) {
    return;
  }
  stageEl.innerHTML = `
    <div class="stop-stage">
      <div class="stop-signal" aria-hidden="true">
        <span class="stop-pulse"></span>
        <span class="stop-text">STOP</span>
      </div>
      <p class="stop-title">Hard stop engaged.</p>
      <p class="stop-sub list-sub">This site is blocked while Focus Mode is active.</p>
    </div>
  `;
};

const renderHoldStage = (durationSec: number, strictActive: boolean) => {
  if (!stageEl) {
    return;
  }
  stageEl.innerHTML = `
    <div class="hold-stage">
      <div class="hold-progress"><span></span></div>
      <button id="holdUnlock" class="btn btn-extra-large btn-primary" type="button">Hold to unlock</button>
      
      <p id="holdHint" class="list-sub">Hold for ${durationSec}s to continue.</p>
    </div>
  `;

  const holdButton = stageEl.querySelector<HTMLButtonElement>("#holdUnlock");
  const progress = stageEl.querySelector<HTMLElement>(".hold-progress span");
  const hint = stageEl.querySelector<HTMLElement>("#holdHint");
  if (!holdButton || !progress || !hint) {
    return;
  }

  const totalMs = Math.max(1, durationSec * 1000);
  let holdStart: number | null = null;
  let holdTimer: number | null = null;

  const resetHold = () => {
    holdStart = null;
    progress.style.width = "0%";
    if (holdTimer) {
      window.clearInterval(holdTimer);
      holdTimer = null;
    }
    hint.textContent = `Hold for ${durationSec}s to continue.`;
  };

  const finishHold = () => {
    if (holdTimer) {
      window.clearInterval(holdTimer);
      holdTimer = null;
    }
    progress.style.width = "100%";
    hint.textContent = "Unlocked. Choose what to do next.";
    setLocked(false, strictActive);
  };

  const startHold = () => {
    if (holdTimer) {
      return;
    }
    holdStart = Date.now();
    hint.textContent = "Keep holding...";
    holdTimer = window.setInterval(() => {
      if (!holdStart) {
        return;
      }
      const elapsed = Date.now() - holdStart;
      const pct = Math.min(100, Math.round((elapsed / totalMs) * 100));
      progress.style.width = `${pct}%`;
      if (elapsed >= totalMs) {
        finishHold();
      }
    }, 50);
  };

  holdButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    startHold();
  });
  holdButton.addEventListener("pointerup", resetHold);
  holdButton.addEventListener("pointerleave", resetHold);
  holdButton.addEventListener("pointercancel", resetHold);
};

const renderSlideStage = (durationSec: number, strictActive: boolean) => {
  if (!stageEl) {
    return;
  }
  stageEl.innerHTML = `
    <div class="gate-stage" style="--gate-duration: ${durationSec}s;">
      <div class="gate-panel"></div>
      <p class="list-sub">Gate opening in ${durationSec}s...</p>
    </div>
  `;
  setLocked(true, strictActive);
  withTimeout(() => setLocked(false, strictActive), durationSec * 1000);
};

type BreathPhase = { label: string; seconds: number; type: "inhale" | "hold" | "exhale" };

const getBreathPhases = (technique: string): BreathPhase[] => {
  if (technique === "5-0-5") {
    return [
      { label: "Inhale", seconds: 5, type: "inhale" },
      { label: "Exhale", seconds: 5, type: "exhale" }
    ];
  }
  if (technique === "7-1-1") {
    return [
      { label: "Inhale", seconds: 7, type: "inhale" },
      { label: "Hold", seconds: 1, type: "hold" },
      { label: "Exhale", seconds: 1, type: "exhale" }
    ];
  }
  if (technique === "box") {
    return [
      { label: "Inhale", seconds: 4, type: "inhale" },
      { label: "Hold", seconds: 4, type: "hold" },
      { label: "Exhale", seconds: 4, type: "exhale" },
      { label: "Hold", seconds: 4, type: "hold" }
    ];
  }
  return [
    { label: "Inhale", seconds: 4, type: "inhale" },
    { label: "Hold", seconds: 7, type: "hold" },
    { label: "Exhale", seconds: 8, type: "exhale" }
  ];
};

const renderBreathingStage = (technique: string, strictActive: boolean) => {
  if (!stageEl) {
    return;
  }
  const phases = getBreathPhases(technique);
  stageEl.innerHTML = `
    <div class="breath-stage" data-phase="ready">
      <div class="breath-visual">
        <div class="breath-halo" aria-hidden="true"></div>
        <div class="breath-orbit" aria-hidden="true"></div>
        <div class="breath-core" aria-hidden="true"></div>
      </div>
      <div class="breath-status">
        <p id="breathLabel" class="list-sub breath-label">Get ready...</p>
        <p class="breath-hint">Slow your breath to reset attention.</p>
      </div>
      <div class="breath-steps" aria-hidden="true">
        ${phases
          .map(
            (phase) =>
              `<span class="breath-step">${phase.label} ${phase.seconds}s</span>`
          )
          .join("")}
      </div>
    </div>
  `;

  const stage = stageEl.querySelector<HTMLElement>(".breath-stage");
  const circle = stageEl.querySelector<HTMLElement>(".breath-core");
  const label = stageEl.querySelector<HTMLElement>("#breathLabel");
  if (!circle || !label) {
    return;
  }

  setLocked(true, strictActive);

  const runPhase = (index: number) => {
    if (index >= phases.length) {
      label.textContent = "Unlocked. Choose what to do next.";
      stage?.setAttribute("data-phase", "done");
      setLocked(false, strictActive);
      return;
    }
    const phase = phases[index];
    if (phase.seconds <= 0) {
      runPhase(index + 1);
      return;
    }
    label.textContent = `${phase.label} ${phase.seconds}s`;
    stage?.setAttribute("data-phase", phase.type);
    circle.style.transitionDuration = `${phase.seconds}s`;
    if (phase.type === "inhale") {
      circle.style.transform = "scale(1)";
    } else if (phase.type === "exhale") {
      circle.style.transform = "scale(0.6)";
    }
    withTimeout(() => runPhase(index + 1), phase.seconds * 1000);
  };

  runPhase(0);
};

const render = async () => {
  const state = await getState();
  allowEmergencyInStrict = Boolean(state.ui.allowEmergencyInStrict);
  renderTheme(state.ui.theme);
  const result = pickIntervention(state.interventions);

  if (!result) {
    renderEmpty();
    return;
  }

  if (state.strictSession.active && !allowEmergencyInStrict) {
    tempAllowSection?.classList.add("hidden");
  } else {
    tempAllowSection?.classList.remove("hidden");
  }

  await setState({
    interventions: { randomization: { lastPicked: result.nextLastPicked } }
  });

  const key = result.key;
  const config = state.interventions.configs[key];
  clearPendingTimeouts();

  if (nameEl) nameEl.textContent = getInterventionLabel(key);
  if (messageEl) messageEl.textContent = config.text ?? "Stay focused.";

  if (metaEl) {
    if (key === "instantBlock") {
      metaEl.textContent = "";
    } else if (key === "breathing" && "technique" in config) {
      metaEl.textContent = `Technique: ${config.technique ?? "4-7-8"}`;
    } else if ("durationSec" in config) {
      metaEl.textContent = `Duration: ${config.durationSec ?? 8}s`;
    } else {
      metaEl.textContent = "";
    }
  }

  const prevUrl = await fetchPrevUrl();
  let host: string | null = null;
  if (reasonEl) {
    if (prevUrl) {
      try {
        const result = evaluateRules(prevUrl, state.lists);
        if (result.allowed) {
          reasonEl.textContent = "";
        } else {
          const reason = result.reason;
          if (reason?.type === "blocked-domain") {
            reasonEl.textContent = `Blocked by domain: ${reason.rule}`;
          } else if (reason?.type === "blocked-keyword") {
            reasonEl.textContent = `Blocked by keyword: ${reason.rule}`;
          } else if (reason?.type === "advanced-block") {
            reasonEl.textContent = `Blocked by exception rule: ${reason.rule}`;
          } else if (reason?.type === "blocked-youtube-video") {
            reasonEl.textContent = `Blocked YouTube video: ${reason.rule}`;
          } else if (reason?.type === "blocked-youtube-playlist") {
            reasonEl.textContent = `Blocked YouTube playlist: ${reason.rule}`;
          } else {
            reasonEl.textContent = "Blocked by Focus rules.";
          }
        }
      } catch {
        reasonEl.textContent = "";
      }
    } else {
      reasonEl.textContent = "";
    }
  }
  if (prevUrl) {
    try {
      host = normalizeHost(new URL(prevUrl).hostname);
    } catch {
      host = null;
    }
  }
  if (usageEl) {
    if (!host) {
      usageEl.textContent = "";
    } else {
      const day = state.analytics.byDay[getDayKey()];
      const ms = day?.byDomain?.[host] ?? 0;
      usageEl.textContent = `You have spent ${formatUsage(ms)} on ${host} today.`;
    }
  }

  actionsEl?.classList.remove("hidden");
  setLocked(key !== "instantBlock", state.strictSession.active);
  updateBackButtonState(!state.focusEnabled || state.pause.isPaused);

  if (key === "instantBlock") {
    renderInstantStage();
  } else if (key === "holdToComplete" && "durationSec" in config) {
    renderHoldStage(config.durationSec ?? 8, state.strictSession.active);
  } else if (key === "slideInOut" && "durationSec" in config) {
    renderSlideStage(config.durationSec ?? 8, state.strictSession.active);
  } else if (key === "breathing" && "technique" in config) {
    renderBreathingStage(config.technique ?? "4-7-8", state.strictSession.active);
  } else if (stageEl) {
    stageEl.innerHTML = "";
  }

};

wireBackButton();
wireTempAllow();
wireThemeButton();
wireInterventionChip();
void render();
subscribeState((state) => {
  updateBackButtonState(!state.focusEnabled || state.pause.isPaused);
  allowEmergencyInStrict = Boolean(state.ui.allowEmergencyInStrict);
  renderTheme(state.ui.theme);
});

watchSystemTheme(() => {
  if (currentThemeSetting === "system") {
    renderTheme("system");
  }
});
