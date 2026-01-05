import { getState, setState } from "../shared/storage.js";
import { getInterventionLabel, pickIntervention } from "../shared/interventions.js";

const nameEl = document.getElementById("interventionName");
const messageEl = document.getElementById("interventionMessage");
const metaEl = document.getElementById("interventionMeta");
const usageEl = document.getElementById("interventionUsage");
const stageEl = document.getElementById("interventionStage");
const actionsEl = document.getElementById("interventionActions");
const backButton = document.getElementById("interventionBack") as HTMLButtonElement | null;
const tempAllowSection = document.getElementById("tempAllowSection");
const tempAllowButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-allow-min]")
);
const pendingTimeouts: number[] = [];

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

const renderEmpty = () => {
  if (nameEl) nameEl.textContent = "No interventions enabled";
  if (messageEl) messageEl.textContent = "Enable an intervention in the popup.";
  if (metaEl) metaEl.textContent = "";
  if (usageEl) usageEl.textContent = "";
  if (stageEl) stageEl.innerHTML = "";
  actionsEl?.classList.add("hidden");
  tempAllowSection?.classList.add("hidden");
};

const getPrevUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("prev");
};

const wireBackButton = () => {
  backButton?.addEventListener("click", () => {
    const prev = getPrevUrl();
    if (prev) {
      window.location.replace(prev);
    } else {
      window.close();
    }
  });
};

const wireTempAllow = () => {
  tempAllowButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const minutes = Number(button.dataset.allowMin ?? "0");
      if (!minutes) {
        return;
      }
      const prev = getPrevUrl();
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
  if (backButton) {
    backButton.disabled = locked;
  }
  if (tempAllowSection) {
    tempAllowSection.classList.toggle("hidden", strictActive || locked);
  }
};

const renderInstantStage = () => {
  if (stageEl) {
    stageEl.innerHTML = `<p class="list-sub">Access is blocked until Focus Mode is turned off.</p>`;
  }
};

const renderHoldStage = (durationSec: number, strictActive: boolean) => {
  if (!stageEl) {
    return;
  }
  stageEl.innerHTML = `
    <div class="hold-stage">
      <button id="holdUnlock" class="btn btn-large btn-primary" type="button">Hold to unlock</button>
      <div class="hold-progress"><span></span></div>
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
  stageEl.innerHTML = `
    <div class="breath-stage">
      <div class="breath-circle" aria-hidden="true"></div>
      <p id="breathLabel" class="list-sub">Get ready...</p>
    </div>
  `;

  const circle = stageEl.querySelector<HTMLElement>(".breath-circle");
  const label = stageEl.querySelector<HTMLElement>("#breathLabel");
  if (!circle || !label) {
    return;
  }

  const phases = getBreathPhases(technique);
  setLocked(true, strictActive);

  const runPhase = (index: number) => {
    if (index >= phases.length) {
      label.textContent = "Unlocked. Choose what to do next.";
      setLocked(false, strictActive);
      return;
    }
    const phase = phases[index];
    if (phase.seconds <= 0) {
      runPhase(index + 1);
      return;
    }
    label.textContent = `${phase.label} ${phase.seconds}s`;
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
  const result = pickIntervention(state.interventions);

  if (!result) {
    renderEmpty();
    return;
  }

  if (state.strictSession.active) {
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
      metaEl.textContent = "Access is blocked during Focus Mode.";
    } else if (key === "breathing" && "technique" in config) {
      metaEl.textContent = `Technique: ${config.technique ?? "4-7-8"}`;
    } else if ("durationSec" in config) {
      metaEl.textContent = `Duration: ${config.durationSec ?? 8}s`;
    } else {
      metaEl.textContent = "";
    }
  }

  const prevUrl = getPrevUrl();
  let host: string | null = null;
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
void render();
