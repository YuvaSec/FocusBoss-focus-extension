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
const views = Array.from(document.querySelectorAll<HTMLElement>(".view"));
const themeControl = document.getElementById("themeControl");
const overlayToggle = document.getElementById("overlayToggle") as HTMLInputElement | null;
const overlayLabel = document.getElementById("overlayLabel");
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

// --- Rendering helpers (update UI from state) ---
const formatUntil = (until: number) => {
  const date = new Date(until);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const renderFocus = (
  focusEnabled: boolean,
  isPaused: boolean,
  pauseType: PauseType | null,
  pauseEndAt: number | null
) => {
  const now = Date.now();
  const pauseActive =
    isPaused && (pauseType === "manual" || (typeof pauseEndAt === "number" && pauseEndAt > now));
  const effectiveEnabled = focusEnabled && !pauseActive;

  currentFocusEnabled = focusEnabled;
  currentIsPaused = pauseActive;
  currentPauseType = pauseType;
  currentPauseUntil = typeof pauseEndAt === "number" ? pauseEndAt : null;

  if (toggleEl) {
    toggleEl.checked = effectiveEnabled;
    toggleEl.disabled = pauseActive && focusEnabled;
  }
  if (statusEl) {
    if (pauseActive && focusEnabled) {
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
  });
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
    state.pause.pauseEndAt
  );
  renderTheme(state.ui.theme);
  renderOverlayMode(state.overlayMode);
  setActiveView("home");
  renderLists(state.lists);
  renderInterventions(state.interventions);
  bindEvents();

  subscribeState((nextState) => {
    renderFocus(
      nextState.focusEnabled,
      nextState.pause.isPaused,
      nextState.pause.pauseType,
      nextState.pause.pauseEndAt
    );
    renderLists(nextState.lists);
    renderInterventions(nextState.interventions);
    renderTheme(nextState.ui.theme);
    renderOverlayMode(nextState.overlayMode);
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
