import assert from "node:assert/strict";
import { compileAdvancedRules, evaluateRules } from "./rules.js";

const lists = {
  blockedDomains: ["example.com"],
  blockedKeywords: ["social"],
  allowedDomains: ["allowed.com"],
  allowedKeywords: ["doc"],
  advancedRulesText: ""
};

const testAllowedDomain = () => {
  const result = evaluateRules("https://allowed.com/home", lists);
  assert.equal(result.allowed, true);
  assert.equal(result.reason?.type, "allowed");
};

const testBlockedDomain = () => {
  const result = evaluateRules("https://example.com", lists);
  assert.equal(result.allowed, false);
  assert.equal(result.reason?.type, "blocked-domain");
};

const testSubdomainNotBlocked = () => {
  const result = evaluateRules("https://news.example.com", lists);
  assert.equal(result.allowed, true);
};

const testKeywordBlock = () => {
  const result = evaluateRules("https://any.com/social/feed", lists);
  assert.equal(result.allowed, false);
  assert.equal(result.reason?.type, "blocked-keyword");
};

const testAdvancedExclude = () => {
  const advanced = compileAdvancedRules("!example.com/private/*\nexample.com/*");
  const result = evaluateRules(
    "https://example.com/private/page",
    { ...lists, advancedRulesText: "!example.com/private/*\nexample.com/*" },
    advanced
  );
  assert.equal(result.allowed, true);
  assert.equal(result.reason?.type, "advanced-exclude");
};

const testAdvancedBlock = () => {
  const advanced = compileAdvancedRules("example.com/*");
  const result = evaluateRules(
    "https://example.com/news",
    { ...lists, advancedRulesText: "example.com/*" },
    advanced
  );
  assert.equal(result.allowed, false);
  assert.equal(result.reason?.type, "advanced-block");
};

const run = () => {
  testAllowedDomain();
  testBlockedDomain();
  testSubdomainNotBlocked();
  testKeywordBlock();
  testAdvancedExclude();
  testAdvancedBlock();
  console.log("rules tests passed");
};

run();
