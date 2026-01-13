// Rule engine for FocusBoss blocking logic.

export type BlockReason =
  | { type: "allowed"; rule?: string }
  | { type: "advanced-exclude"; rule: string }
  | { type: "advanced-block"; rule: string }
  | { type: "blocked-youtube-video"; rule: string }
  | { type: "blocked-youtube-playlist"; rule: string }
  | { type: "blocked-domain"; rule: string }
  | { type: "blocked-keyword"; rule: string };

export type RuleLists = {
  blockedDomains: string[];
  blockedKeywords: string[];
  allowedDomains: string[];
  allowedKeywords: string[];
  advancedRulesText: string;
  youtubeExceptions?: {
    allowedVideos: string[];
    blockedVideos: string[];
    allowedPlaylists: string[];
    blockedPlaylists: string[];
  };
};

type CompiledAdvancedRule = {
  raw: string;
  isExclude: boolean;
  regex: RegExp;
};

const normalizeHost = (host: string): string => {
  const lower = host.toLowerCase();
  return lower.startsWith("www.") ? lower.slice(4) : lower;
};

const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const wildcardToRegex = (pattern: string): RegExp => {
  const escaped = pattern
    .split("*")
    .map((segment) => segment.split("?").map(escapeRegex).join("."))
    .join(".*");
  return new RegExp(`^${escaped}$`, "i");
};

const parseAdvancedRules = (text: string): CompiledAdvancedRule[] => {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => {
      const isExclude = line.startsWith("!");
      const raw = isExclude ? line.slice(1).trim() : line;
      return {
        raw,
        isExclude,
        regex: wildcardToRegex(raw)
      };
    });
};

const matchAdvanced = (
  href: string,
  compiled: CompiledAdvancedRule[],
  wantExclude: boolean
): string | null => {
  for (const rule of compiled) {
    if (rule.isExclude !== wantExclude) {
      continue;
    }
    if (rule.regex.test(href)) {
      return rule.raw;
    }
  }
  return null;
};

const matchDomainList = (host: string, list: string[]): string | null => {
  const normalized = normalizeHost(host);
  for (const entry of list) {
    const clean = normalizeHost(entry.trim());
    if (
      clean &&
      (clean === normalized || (normalized === "m.youtube.com" && clean === "youtube.com"))
    ) {
      return entry;
    }
  }
  return null;
};

const matchKeywordList = (href: string, list: string[]): string | null => {
  const haystack = href.toLowerCase();
  for (const entry of list) {
    const needle = entry.trim().toLowerCase();
    if (needle && haystack.includes(needle)) {
      return entry;
    }
  }
  return null;
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

export const evaluateRules = (
  url: string,
  lists: RuleLists,
  compiled?: CompiledAdvancedRule[]
): { allowed: boolean; reason?: BlockReason } => {
  const href = url.toLowerCase();
  const urlObj = new URL(url);
  const host = normalizeHost(urlObj.hostname);
  const pathTarget = `${host}${urlObj.pathname}${urlObj.search}`.toLowerCase();
  const advanced = compiled ?? parseAdvancedRules(lists.advancedRulesText);
  const youtubeExceptions = lists.youtubeExceptions ?? {
    allowedVideos: [],
    blockedVideos: [],
    allowedPlaylists: [],
    blockedPlaylists: []
  };
  const youtubeId = extractYoutubeVideoId(urlObj);
  const playlistId = extractYoutubePlaylistId(urlObj);

  const allowedDomain = matchDomainList(host, lists.allowedDomains);
  if (allowedDomain) {
    return { allowed: true, reason: { type: "allowed", rule: allowedDomain } };
  }

  const allowedKeyword = matchKeywordList(href, lists.allowedKeywords);
  if (allowedKeyword) {
    return { allowed: true, reason: { type: "allowed", rule: allowedKeyword } };
  }

  if (youtubeId && youtubeExceptions.allowedVideos.includes(youtubeId)) {
    return { allowed: true, reason: { type: "allowed", rule: youtubeId } };
  }
  if (playlistId && youtubeExceptions.allowedPlaylists.includes(playlistId)) {
    return { allowed: true, reason: { type: "allowed", rule: playlistId } };
  }

  const advancedExclude = matchAdvanced(pathTarget, advanced, true);
  if (advancedExclude) {
    return { allowed: true, reason: { type: "advanced-exclude", rule: advancedExclude } };
  }

  const advancedBlock = matchAdvanced(pathTarget, advanced, false);
  if (advancedBlock) {
    return { allowed: false, reason: { type: "advanced-block", rule: advancedBlock } };
  }

  if (youtubeId && youtubeExceptions.blockedVideos.includes(youtubeId)) {
    return { allowed: false, reason: { type: "blocked-youtube-video", rule: youtubeId } };
  }
  if (playlistId && youtubeExceptions.blockedPlaylists.includes(playlistId)) {
    return { allowed: false, reason: { type: "blocked-youtube-playlist", rule: playlistId } };
  }

  const blockedDomain = matchDomainList(host, lists.blockedDomains);
  if (blockedDomain) {
    return { allowed: false, reason: { type: "blocked-domain", rule: blockedDomain } };
  }

  const blockedKeyword = matchKeywordList(href, lists.blockedKeywords);
  if (blockedKeyword) {
    return { allowed: false, reason: { type: "blocked-keyword", rule: blockedKeyword } };
  }

  return { allowed: true };
};

export const compileAdvancedRules = (text: string): CompiledAdvancedRule[] => {
  return parseAdvancedRules(text);
};
