import { getState, setState } from "../shared/storage.js";
import { getInterventionLabel, pickIntervention } from "../shared/interventions.js";

const nameEl = document.getElementById("interventionName");
const messageEl = document.getElementById("interventionMessage");
const metaEl = document.getElementById("interventionMeta");
const actionsEl = document.getElementById("interventionActions");
const backButton = document.getElementById("interventionBack");
const tempAllowSection = document.getElementById("tempAllowSection");
const tempAllowButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-allow-min]")
);

const renderEmpty = () => {
  if (nameEl) nameEl.textContent = "No interventions enabled";
  if (messageEl) messageEl.textContent = "Enable an intervention in the popup.";
  if (metaEl) metaEl.textContent = "";
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

const render = async () => {
  const state = await getState();
  const result = pickIntervention(state.interventions);

  if (!result) {
    renderEmpty();
    return;
  }

  tempAllowSection?.classList.remove("hidden");

  await setState({
    interventions: { randomization: { lastPicked: result.nextLastPicked } }
  });

  const key = result.key;
  const config = state.interventions.configs[key];

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

  actionsEl?.classList.toggle("hidden", key !== "instantBlock");

};

wireBackButton();
wireTempAllow();
void render();
