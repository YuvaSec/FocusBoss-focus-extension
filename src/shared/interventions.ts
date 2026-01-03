import type { StorageSchema } from "./storageSchema.js";

export type InterventionKey = keyof StorageSchema["interventions"]["enabled"];

export type InterventionDefinition = {
  key: InterventionKey;
  label: string;
  description: string;
  durationOptions?: number[];
  usesPausable?: boolean;
  usesBreathing?: boolean;
};

export const INTERVENTION_DEFS: InterventionDefinition[] = [
  {
    key: "instantBlock",
    label: "Hard Stop",
    description: "Immediate block with a short message.",
    usesPausable: true
  },
  {
    key: "holdToComplete",
    label: "Commit Press",
    description: "Hold to confirm before entering.",
    durationOptions: [3, 8, 15, 30, 45, 60]
  },
  {
    key: "slideInOut",
    label: "Gate Slide",
    description: "Timed gate animation before entry.",
    durationOptions: [3, 8, 15, 30, 45, 60]
  },
  {
    key: "pixelated",
    label: "Blur Shield",
    description: "Obscure content for a short delay.",
    durationOptions: [3, 5, 8, 10, 12, 15]
  },
  {
    key: "breathing",
    label: "Pulse Breath",
    description: "A short breathing reset before entry.",
    usesBreathing: true
  }
];

export const BREATHING_TECHNIQUES = [
  { value: "4-7-8", label: "4-7-8" },
  { value: "5-0-5", label: "5-0-5" },
  { value: "7-1-1", label: "7-1-1" },
  { value: "box", label: "Box" }
];

export const getInterventionLabel = (key: InterventionKey): string => {
  return INTERVENTION_DEFS.find((item) => item.key === key)?.label ?? key;
};

export const pickIntervention = (
  interventions: StorageSchema["interventions"]
): { key: InterventionKey; nextLastPicked: InterventionKey[] } | null => {
  const enabled = INTERVENTION_DEFS.filter(
    (item) => interventions.enabled[item.key]
  ).map((item) => item.key);

  if (enabled.length === 0) {
    return null;
  }

  const avoidN = Math.max(0, interventions.randomization.avoidRepeatN ?? 0);
  const lastPicked = (interventions.randomization.lastPicked ?? []) as InterventionKey[];
  const blocked = new Set(lastPicked.slice(0, avoidN));
  const pool = enabled.filter((key) => !blocked.has(key));
  const candidates = pool.length > 0 ? pool : enabled;
  const next = candidates[Math.floor(Math.random() * candidates.length)];
  const nextLastPicked = [next, ...lastPicked.filter((item) => item !== next)].slice(0, 10);

  return { key: next, nextLastPicked };
};
