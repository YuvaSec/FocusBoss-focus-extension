import { SCHEMA_VERSION, defaultState, type StorageSchema } from "./storageSchema.js";

const STORAGE_KEY = "focusBossState";

type StorageResult = {
  state: StorageSchema;
  needsWrite: boolean;
};

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends (infer U)[]
    ? U[]
    : T[K] extends object
    ? DeepPartial<T[K]>
    : T[K];
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const hasMissingKeys = (defaults: unknown, existing: unknown): boolean => {
  if (Array.isArray(defaults)) {
    return existing === undefined;
  }

  if (isPlainObject(defaults)) {
    if (!isPlainObject(existing)) {
      return true;
    }

    for (const key of Object.keys(defaults)) {
      const defaultValue = defaults[key];
      const existingValue = (existing as Record<string, unknown>)[key];
      if (existingValue === undefined) {
        return true;
      }
      if (hasMissingKeys(defaultValue, existingValue)) {
        return true;
      }
    }
  }

  return false;
};

const mergeDefaults = (defaults: unknown, existing: unknown): unknown => {
  if (Array.isArray(defaults)) {
    return Array.isArray(existing) ? existing : defaults;
  }

  if (isPlainObject(defaults)) {
    const result: Record<string, unknown> = { ...(isPlainObject(existing) ? existing : {}) };
    for (const key of Object.keys(defaults)) {
      const defaultValue = defaults[key];
      const existingValue = isPlainObject(existing) ? existing[key] : undefined;
      result[key] = mergeDefaults(defaultValue, existingValue);
    }
    return result;
  }

  return existing === undefined ? defaults : existing;
};

const mergePatch = (base: unknown, patch: unknown): unknown => {
  if (patch === undefined) {
    return base;
  }
  if (patch === null) {
    return null;
  }

  if (Array.isArray(base) || Array.isArray(patch)) {
    return Array.isArray(patch) ? patch : base;
  }

  if (isPlainObject(base) && isPlainObject(patch)) {
    const result: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) {
        continue;
      }
      result[key] = mergePatch(result[key], value);
    }
    return result;
  }

  return patch ?? base;
};

const getStoredState = async (): Promise<unknown> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (stored) => {
      resolve(stored[STORAGE_KEY]);
    });
  });
};

const migrateState = (existing: unknown): StorageResult => {
  const baseState = mergeDefaults(defaultState, existing) as StorageSchema;
  const schemaVersion = isPlainObject(existing) ? existing.schemaVersion : undefined;

  let migratedState = { ...baseState };

  let hasLegacyPause = false;
  if (isPlainObject(existing)) {
    const legacyTempOffUntil = existing.focusTempOffUntil;
    const legacyPreset = isPlainObject(existing.ui) ? existing.ui.tempOffPreset : null;
    const hasPauseAlready = isPlainObject(existing.pause);

    hasLegacyPause = legacyTempOffUntil !== undefined || legacyPreset !== null;

    if (!hasPauseAlready) {
      if (legacyPreset === "manual") {
        migratedState = {
          ...migratedState,
          pause: { isPaused: true, pauseType: "manual", pauseEndAt: null }
        };
      } else if (typeof legacyTempOffUntil === "number") {
        const pauseType = legacyPreset === "eod" || legacyPreset === "1h" ? legacyPreset : "1h";
        migratedState = {
          ...migratedState,
          pause: { isPaused: true, pauseType, pauseEndAt: legacyTempOffUntil }
        };
      }
    }
  }

  const needsWrite =
    !isPlainObject(existing) ||
    schemaVersion !== SCHEMA_VERSION ||
    hasMissingKeys(defaultState, existing) ||
    hasLegacyPause;

  return {
    state: { ...migratedState, schemaVersion: SCHEMA_VERSION },
    needsWrite
  };
};

const writeState = async (state: StorageSchema): Promise<void> => {
  await new Promise<void>((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: state }, () => resolve());
  });
};

export const ensureState = async (): Promise<StorageSchema> => {
  const existing = await getStoredState();
  const { state, needsWrite } = migrateState(existing);
  const now = Date.now();
  const pauseExpired =
    state.pause.isPaused &&
    typeof state.pause.pauseEndAt === "number" &&
    now >= state.pause.pauseEndAt;
  const strictExpired =
    state.strictSession.active &&
    typeof state.strictSession.endsAt === "number" &&
    now >= state.strictSession.endsAt;
  const strictEndedAt =
    strictExpired && typeof state.strictSession.endsAt === "number"
      ? state.strictSession.endsAt
      : null;
  const strictStartedAt =
    strictExpired && typeof state.strictSession.startedAt === "number"
      ? state.strictSession.startedAt
      : strictEndedAt
        ? Math.max(0, strictEndedAt - 60 * 1000)
        : null;
  const cleanedTempAllow = Object.fromEntries(
    Object.entries(state.temporaryAllow ?? {}).filter(
      ([, value]) => typeof value?.until === "number" && value.until > now
    )
  );
  const tempAllowChanged =
    Object.keys(cleanedTempAllow).length !== Object.keys(state.temporaryAllow ?? {}).length;
  const pauseInvalid = state.pause.isPaused && !state.focusEnabled;
  const nextState = pauseExpired || pauseInvalid
    ? { ...state, pause: { isPaused: false, pauseType: null, pauseEndAt: null } }
    : state;
  const prevFocusEnabled = nextState.strictSession.prevFocusEnabled;
  const shouldRestoreFocus = typeof prevFocusEnabled === "boolean";
  const restoredFocusEnabled = shouldRestoreFocus ? prevFocusEnabled : nextState.focusEnabled;
  const strictSessionLogged =
    strictExpired && strictEndedAt !== null
      ? [
          ...nextState.analytics.sessions,
          {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            startedAt: strictStartedAt ?? strictEndedAt,
            endedAt: strictEndedAt,
            type: "strict" as const,
            focusEnabledDuring: true,
            distractions: 0
          }
        ]
      : null;
  const strictCleared = strictExpired
    ? {
        ...nextState,
        focusEnabled: restoredFocusEnabled,
        analytics: strictSessionLogged
          ? { ...nextState.analytics, sessions: strictSessionLogged }
          : nextState.analytics,
        strictSession: {
          active: false,
          endsAt: undefined,
          startedAt: undefined,
          prevFocusEnabled: undefined
        }
      }
    : nextState;
  const mergedState = tempAllowChanged
    ? { ...strictCleared, temporaryAllow: cleanedTempAllow }
    : strictCleared;
  if (needsWrite || pauseExpired || pauseInvalid || tempAllowChanged || strictExpired) {
    await writeState(mergedState);
  }
  return mergedState;
};

export const getState = async (): Promise<StorageSchema> => {
  return ensureState();
};

export const setState = async (partial: DeepPartial<StorageSchema>): Promise<StorageSchema> => {
  const current = await ensureState();
  const merged = mergePatch(current, partial) as StorageSchema;
  await writeState(merged);
  return merged;
};

export const subscribeState = (
  callback: (state: StorageSchema) => void
): (() => void) => {
  const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
    const change = changes[STORAGE_KEY];
    if (change?.newValue) {
      callback(change.newValue as StorageSchema);
    }
  };

  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
};
