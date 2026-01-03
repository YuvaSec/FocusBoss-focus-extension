// Rule engine for FocusBoss blocking logic.

export type BlockReason =
  | { type: "allowed"; rule?: string }
  | { type: "advanced-exclude"; rule: string }
  | { type: "advanced-block"; rule: string }
  | { type: "blocked-domain"; rule: string }
  | { type: "blocked-keyword"; rule: string };

export type RuleLists = {
  blockedDomains: string[];
  blockedKeywords: string[];
  allowedDomains: string[];
  allowedKeywords: string[];
  advancedRulesText: string;
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
    if (clean && clean === normalized) {
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

  const allowedDomain = matchDomainList(host, lists.allowedDomains);
  if (allowedDomain) {
    return { allowed: true, reason: { type: "allowed", rule: allowedDomain } };
  }

  const allowedKeyword = matchKeywordList(href, lists.allowedKeywords);
  if (allowedKeyword) {
    return { allowed: true, reason: { type: "allowed", rule: allowedKeyword } };
  }

  const advancedExclude = matchAdvanced(pathTarget, advanced, true);
  if (advancedExclude) {
    return { allowed: true, reason: { type: "advanced-exclude", rule: advancedExclude } };
  }

  const advancedBlock = matchAdvanced(pathTarget, advanced, false);
  if (advancedBlock) {
    return { allowed: false, reason: { type: "advanced-block", rule: advancedBlock } };
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
