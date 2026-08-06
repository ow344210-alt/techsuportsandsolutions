import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface FormDraft<T> {
  values: T;
  updatedAt: string;
  version: number;
}

export interface UseFormDraftOptions<T> {
  formName: string;
  id?: string | null;
  values: T;
  active: boolean;
  recordUpdatedAt?: string | null;
  debounceMs?: number;
  onRestore?: (values: T, draft: FormDraft<T>) => void;
}

const DEFAULT_DEBOUNCE_MS = 600;

function storageKeyFor(formName: string, id?: string | null): string {
  return id ? `admin-${formName}-edit-draft-${id}` : `admin-${formName}-create-draft`;
}

function isValidDraft<T>(value: unknown): value is FormDraft<T> {
  if (typeof value !== "object" || value === null) return false;
  const draft = value as Record<string, unknown>;
  if (typeof draft.values !== "object" || draft.values === null) return false;
  if (typeof draft.updatedAt !== "string" || Number.isNaN(Date.parse(draft.updatedAt))) return false;
  if (typeof draft.version !== "number" || !Number.isFinite(draft.version)) return false;
  return true;
}

function readDraft<T>(key: string): FormDraft<T> | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidDraft<T>(parsed)) {
      window.localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // storage unavailable (private mode, quota)
    }
    return null;
  }
}

function writeDraft<T>(key: string, values: T, previous: FormDraft<T> | null, lastPersisted: string | null): string | null {
  const json = JSON.stringify(values);
  if (json === lastPersisted) return lastPersisted;
  const next: FormDraft<T> = {
    values,
    updatedAt: new Date().toISOString(),
    version: previous ? previous.version + 1 : 1,
  };
  try {
    window.localStorage.setItem(key, JSON.stringify(next));
  } catch {
    return lastPersisted;
  }
  return json;
}

export function useFormDraft<T>(options: UseFormDraftOptions<T>) {
  const {
    formName,
    id,
    values,
    active,
    recordUpdatedAt = null,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    onRestore,
  } = options;

  const key = useMemo(() => storageKeyFor(formName, id), [formName, id]);

  const [draft, setDraft] = useState<FormDraft<T> | null>(null);
  const [restored, setRestored] = useState(false);

  const baselineRef = useRef<string | null>(null);
  const lastPersistedRef = useRef<string | null>(null);
  const restoredOnceRef = useRef(false);

  useEffect(() => {
    (async () => {
      if (!active) {
        baselineRef.current = null;
        lastPersistedRef.current = null;
        restoredOnceRef.current = false;
        setDraft(null);
        setRestored(false);
        return;
      }
      baselineRef.current = null;
      lastPersistedRef.current = null;
      const stored = readDraft<T>(key);
      if (stored) {
        lastPersistedRef.current = JSON.stringify(stored.values);
      }
      setDraft(stored);
      setRestored(false);
      restoredOnceRef.current = false;
    })();
  }, [active, key]);

  useEffect(() => {
    if (!active || !draft || restored || restoredOnceRef.current) return;
    restoredOnceRef.current = true;
    setRestored(true);
    onRestore?.(draft.values, draft);
  }, [active, draft, restored, onRestore]);

  useEffect(() => {
    if (!active) return;
    const json = JSON.stringify(values);
    if (baselineRef.current === null) {
      baselineRef.current = json;
      return;
    }
    if (json === baselineRef.current) return;
    const timer = window.setTimeout(() => {
      lastPersistedRef.current = writeDraft(key, values, readDraft<T>(key), lastPersistedRef.current);
    }, debounceMs);
    return () => window.clearTimeout(timer);
  }, [values, active, key, debounceMs]);

  const clear = useCallback(() => {
    restoredOnceRef.current = true;
    setDraft(null);
    setRestored(true);
    lastPersistedRef.current = null;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // storage unavailable (private mode, quota)
    }
  }, [key]);

  const isConflict = useMemo(() => {
    if (!draft || !recordUpdatedAt) return false;
    return Date.parse(recordUpdatedAt) > Date.parse(draft.updatedAt);
  }, [draft, recordUpdatedAt]);

  return {
    key,
    hasDraft: draft !== null,
    isConflict,
    draftUpdatedAt: draft?.updatedAt ?? null,
    draftVersion: draft?.version ?? null,
    restored,
    clear,
  };
}
