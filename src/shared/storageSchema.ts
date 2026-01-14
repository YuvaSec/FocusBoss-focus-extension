export type SchemaVersion = 3;

export type AnalyticsSession = {
  id: string;
  startedAt: number;
  endedAt: number;
  type: "pomodoro" | "strict" | "focus" | "pause";
  tagId?: string | null;
  source?: "manual" | "schedule" | "pomodoro";
  outcome?: "completed" | "interrupted";
  focusEnabledDuring: boolean;
  distractions: number;
  notes?: string;
  emotionTag?: "calm" | "frustrated" | "energized" | "distracted";
};

export type StorageSchema = {
  schemaVersion: SchemaVersion;
  focusEnabled: boolean;
  focusSessionStartedAt?: number;
  focusSessionSource?: "manual" | "schedule";
  pause: {
    isPaused: boolean;
    pauseType: "1h" | "eod" | "manual" | null;
    pauseEndAt: number | null;
    pauseStartedAt?: number;
  };
  overlayMode: boolean;
  confirmationPrompt: boolean;
  lists: {
    blockedDomains: string[];
    blockedKeywords: string[];
    allowedDomains: string[];
    allowedKeywords: string[];
    advancedRulesText: string;
    youtubeExceptions: {
      allowedVideos: string[];
      blockedVideos: string[];
      allowedPlaylists: string[];
      blockedPlaylists: string[];
    };
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
    lastCompletion?: {
      mode: "completed" | "interrupted";
      minutes: number;
      cycles: number;
      endedAt: number;
      tagId?: string | null;
    };
    running?: {
      phase: "work" | "break";
      startedAt?: number;
      endsAt: number;
      cycleIndex: number;
      paused: boolean;
      remainingMs?: number;
      linkedTagId?: string | null;
      prevFocusEnabled?: boolean;
      pauseStartedAt?: number;
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
    sessions: AnalyticsSession[];
    sessionsByDay: Record<string, AnalyticsSession[]>;
    sessionsByMonth: Record<string, AnalyticsSession[]>;
    showWebUsage: boolean;
    chartThemeId: string;
    chartRange: "today" | "week" | "month";
    chartFilter: "all" | "blocked";
    retentionDays: number;
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
  focusSessionStartedAt: undefined,
  focusSessionSource: undefined,
  pause: {
    isPaused: false,
    pauseType: null,
    pauseEndAt: null,
    pauseStartedAt: undefined
  },
  overlayMode: false,
  confirmationPrompt: true,
  lists: {
    blockedDomains: [],
    blockedKeywords: [],
    allowedDomains: [],
    allowedKeywords: [],
    advancedRulesText: "",
    youtubeExceptions: {
      allowedVideos: [],
      blockedVideos: [],
      allowedPlaylists: [],
      blockedPlaylists: []
    }
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
    lastTagId: null,
    lastCompletion: undefined
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
    sessionsByDay: {},
    sessionsByMonth: {},
    showWebUsage: true,
    chartThemeId: "default",
    chartRange: "week",
    chartFilter: "all",
    retentionDays: 90
  },
  ui: {
    theme: "dark"
  },
  pro: { enabled: false }
};
