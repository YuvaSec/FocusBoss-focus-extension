export type SchemaVersion = 3;

export type StorageSchema = {
  schemaVersion: SchemaVersion;
  focusEnabled: boolean;
  pause: {
    isPaused: boolean;
    pauseType: "1h" | "eod" | "manual" | null;
    pauseEndAt: number | null;
  };
  overlayMode: boolean;
  confirmationPrompt: boolean;
  lists: {
    blockedDomains: string[];
    blockedKeywords: string[];
    allowedDomains: string[];
    allowedKeywords: string[];
    advancedRulesText: string;
  };
  interventions: {
    enabled: {
      instantBlock: boolean;
      holdToComplete: boolean;
      slideInOut: boolean;
      breathing: boolean;
    };
    configs: {
      instantBlock: { text: string; pausable: boolean };
      holdToComplete: { text: string; durationSec: number };
      slideInOut: { text: string; durationSec: number };
      breathing: {
        text: string;
        technique: "4-7-8" | "5-0-5" | "7-1-1" | "box";
      };
    };
    randomization: {
      avoidRepeatN: number;
      lastPicked?: string[];
    };
  };
  temporaryAllow: Record<string, { until: number }>;
  schedule: {
    entries: Array<{
      id: string;
      name: string;
      startMin: number;
      endMin: number;
      days: Array<0 | 1 | 2 | 3 | 4 | 5 | 6>;
      enabled: boolean;
    }>;
    freeTierLimitDaysPerWeek?: number;
  };
  strictSession: {
    active: boolean;
    endsAt?: number;
    startedAt?: number;
    prevFocusEnabled?: boolean;
    blockedSnapshot?: {
      blockedDomains: string[];
      blockedKeywords: string[];
      advancedRulesText: string;
    };
  };
  pomodoro: {
    enabled: boolean;
    workMin: number;
    breakMin: number;
    cycles: number;
    autoBlockDuringWork: boolean;
    blockDuringBreak: boolean;
    sounds: boolean;
    alwaysOnTop: boolean;
    lastTagId?: string | null;
    running?: {
      phase: "work" | "break";
      startedAt?: number;
      endsAt: number;
      cycleIndex: number;
      paused: boolean;
      remainingMs?: number;
      linkedTagId?: string | null;
      prevFocusEnabled?: boolean;
    } | null;
  };
  tags: {
    activeLimit: number;
    items: Array<{
      id: string;
      title: string;
      color: string;
      pomodoroWorkMin: number;
      pomodoroBreakMin: number;
      pomodoroCycles: number;
      estimateMin: number;
      createdAt: number;
      doneAt?: number;
      focusSessionsCompleted: number;
    }>;
  };
  workflows: {
    enabled: boolean;
    rules: Array<{
      id: string;
      trigger:
        | "pomodoroStarted"
        | "workPhaseStarted"
        | "breakStarted"
        | "strictSessionStarted"
        | "focusEnabled";
      actions: Array<
        | { type: "enableFocusMode"; value: boolean }
        | { type: "setOverlayMode"; value: boolean }
        | { type: "enableAutoBlock"; value: boolean }
        | { type: "toggleBlockDuringBreak"; value: boolean }
        | { type: "showNotification"; value: boolean }
      >;
    }>;
  };
  analytics: {
    byDay: Record<
      string,
      {
        totalMs: number;
        byDomain: Record<string, number>;
        blockedMs?: number;
        byDomainBlocked?: Record<string, number>;
        byHourMs?: Record<string, number>;
        byHourBlockedMs?: Record<string, number>;
        distractionsCount?: number;
      }
    >;
    sessions: Array<{
      id: string;
      startedAt: number;
      endedAt: number;
      type: "pomodoro" | "strict";
      tagId?: string | null;
      focusEnabledDuring: boolean;
      distractions: number;
      notes?: string;
      emotionTag?: "calm" | "frustrated" | "energized" | "distracted";
    }>;
    showWebUsage: boolean;
    chartThemeId: string;
    chartRange: "today" | "week" | "month";
    chartFilter: "all" | "blocked";
  };
  ui: {
    theme: "dark" | "light" | "system";
  };
  pro: { enabled: boolean };
};

export const SCHEMA_VERSION: SchemaVersion = 3;

export const defaultState: StorageSchema = {
  schemaVersion: SCHEMA_VERSION,
  focusEnabled: false,
  pause: {
    isPaused: false,
    pauseType: null,
    pauseEndAt: null
  },
  overlayMode: true,
  confirmationPrompt: true,
  lists: {
    blockedDomains: [],
    blockedKeywords: [],
    allowedDomains: [],
    allowedKeywords: [],
    advancedRulesText: ""
  },
  interventions: {
    enabled: {
      instantBlock: true,
      holdToComplete: false,
      slideInOut: false,
      breathing: false
    },
    configs: {
      instantBlock: { text: "Get back to work!", pausable: false },
      holdToComplete: {
        text: "Are you sure you want to enter this site?",
        durationSec: 8
      },
      slideInOut: {
        text: "Are you sure you want to enter this site?",
        durationSec: 8
      },
      breathing: {
        text: "Slowly breathe, follow the pace of the animation",
        technique: "4-7-8"
      }
    },
    randomization: {
      avoidRepeatN: 2,
      lastPicked: []
    }
  },
  temporaryAllow: {},
  schedule: {
    entries: [],
    freeTierLimitDaysPerWeek: 3
  },
  strictSession: {
    active: false,
    startedAt: undefined,
    prevFocusEnabled: undefined
  },
  pomodoro: {
    enabled: false,
    workMin: 25,
    breakMin: 5,
    cycles: 0,
    autoBlockDuringWork: true,
    blockDuringBreak: false,
    sounds: true,
    alwaysOnTop: false,
    lastTagId: null
  },
  tags: {
    activeLimit: 3,
    items: []
  },
  workflows: {
    enabled: false,
    rules: []
  },
  analytics: {
    byDay: {},
    sessions: [],
    showWebUsage: true,
    chartThemeId: "default",
    chartRange: "week",
    chartFilter: "all"
  },
  ui: {
    theme: "dark"
  },
  pro: { enabled: false }
};
