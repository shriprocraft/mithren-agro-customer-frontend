"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

// Demo persistence for the frontend-only preview (docs/ARCHITECTURE.md, "State and persistence").
// Browser storage is treated as an external store read with useSyncExternalStore: the server and the
// hydration render see no saved value (so HTML always matches), then the client re-renders with it.
// Every component that reads a key stays in sync, in this tab (custom event) and in others ("storage").
// If storage is blocked (private mode, quota), values live in memory for the session and `set`
// reports that they were not persisted.

type StorageKind = "local" | "session";

const CHANGE_EVENT = "mithren:storage";
const memory = new Map<string, string>();

function storageFor(kind: StorageKind): Storage | null {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function readRaw(kind: StorageKind, key: string): string | null {
  try {
    return storageFor(kind)?.getItem(key) ?? memory.get(`${kind}:${key}`) ?? null;
  } catch {
    return memory.get(`${kind}:${key}`) ?? null;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

const noopSubscribe = () => () => {};

/** True after hydration on the client; false on the server and during the hydration render. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

function decode<T>(raw: string | null, initial: T, parse: (value: unknown) => T | null): T {
  if (raw == null) return initial;
  try {
    return parse(JSON.parse(raw)) ?? initial;
  } catch {
    return initial; // corrupt JSON
  }
}

/**
 * Returns [value, set, hydrated]. Stored JSON is untrusted: `parse` validates it and returns null to
 * fall back to `initial`. Pass module-level `initial` and `parse` so their identities are stable.
 * `set` writes synchronously and returns whether the value was persisted, so callers that must not
 * report success without saving (order creation) can check it. Pages that depend on saved data show
 * a loading state until `hydrated` is true.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
  parse: (value: unknown) => T | null,
  kind: StorageKind = "local",
) {
  const raw = useSyncExternalStore(subscribe, () => readRaw(kind, key), () => null);
  const value = useMemo(() => decode(raw, initial, parse), [raw, initial, parse]);
  const hydrated = useHydrated();

  const set = useCallback(
    (next: T | ((current: T) => T)): boolean => {
      const current = decode(readRaw(kind, key), initial, parse);
      const resolved = typeof next === "function" ? (next as (value: T) => T)(current) : next;
      const json = JSON.stringify(resolved);
      let persisted = false;
      try {
        const storage = storageFor(kind);
        if (storage) {
          storage.setItem(key, json);
          persisted = storage.getItem(key) === json;
        }
      } catch {
        persisted = false;
      }
      if (persisted) memory.delete(`${kind}:${key}`);
      else memory.set(`${kind}:${key}`, json);
      window.dispatchEvent(new Event(CHANGE_EVENT));
      return persisted;
    },
    [key, kind, initial, parse],
  );

  return [value, set, hydrated] as const;
}

let storageProbe: boolean | undefined;

/**
 * Whether this browser lets the site keep data in localStorage (false in some private modes or when
 * site data is blocked). Checked once per page load; true on the server and during hydration.
 */
export function useStorageAvailable(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => {
      if (storageProbe === undefined) {
        try {
          const storage = storageFor("local");
          storage?.setItem("mithren.storage-probe", "1");
          storage?.removeItem("mithren.storage-probe");
          storageProbe = storage !== null;
        } catch {
          storageProbe = false;
        }
      }
      return storageProbe;
    },
    () => true,
  );
}
