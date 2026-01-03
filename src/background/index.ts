import type { Message } from "../shared/messages.js";
import { ensureState, getState, setState } from "../shared/storage.js";

const PAUSE_ALARM = "pauseResume";

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

chrome.runtime.onMessage.addListener((message: Message<"ping">) => {
  if (message?.type === "ping") {
    console.log("FocusBoss background ping", message.payload.time);
  }
});

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
    if (message?.type !== "temporaryAllow" || !message.prevUrl || !message.minutes) {
      return;
    }
    let host: string | null = null;
    try {
      const url = new URL(message.prevUrl);
      host = url.hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      sendResponse({ ok: false });
      return;
    }

    const until = Date.now() + message.minutes * 60 * 1000;
    const updateTab = () => {
      const tabId = sender.tab?.id;
      if (tabId) {
        chrome.tabs.update(tabId, { url: message.prevUrl }, () => sendResponse({ ok: true }));
        return;
      }
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeId = tabs[0]?.id;
        if (activeId) {
          chrome.tabs.update(activeId, { url: message.prevUrl }, () => sendResponse({ ok: true }));
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

    getState().then((state) => {
      const next = { ...state.temporaryAllow, [host as string]: { until } };
      void setState({ temporaryAllow: next }).then(() => ensureWritten(5));
    });

    return true;
  }
);

chrome.runtime.onInstalled.addListener(() => {
  void ensureState().then(schedulePauseAlarm);
});

chrome.runtime.onStartup.addListener(() => {
  void ensureState().then(schedulePauseAlarm);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") {
    return;
  }
  if (changes.focusBossState) {
    void schedulePauseAlarm();
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
});

void ensureState().then(schedulePauseAlarm);
console.log("FocusBoss service worker running");
