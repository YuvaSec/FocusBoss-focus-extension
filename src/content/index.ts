const STORAGE_KEY = "focusBossState";

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
  if (isTemporarilyAllowed(location.href, state.temporaryAllow ?? {})) {
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
