const STORAGE_KEY = 'nai_api_key';

let memoryKey: string | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

function readStorage(storage: Storage | undefined): string {
  if (!storage) return '';
  try {
    return storage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function writeLocal(value: string | null) {
  try {
    if (typeof localStorage === 'undefined') return;
    if (value) localStorage.setItem(STORAGE_KEY, value);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  const remembered = readStorage(typeof localStorage === 'undefined' ? undefined : localStorage);
  if (remembered) {
    memoryKey = remembered;
    return;
  }
  // One-time migrate leftover sessionStorage keys, then drop them
  // so a refresh no longer keeps a session-only key.
  const session = readStorage(typeof sessionStorage === 'undefined' ? undefined : sessionStorage);
  if (session) {
    memoryKey = session;
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
}

export function getApiKey(): string {
  hydrate();
  return memoryKey ?? '';
}

export function hasApiKey(): boolean {
  return getApiKey().trim().length > 0;
}

export function isApiKeyRemembered(): boolean {
  return readStorage(typeof localStorage === 'undefined' ? undefined : localStorage).length > 0;
}

/** remember=true → localStorage; remember=false → in-memory only (refresh loses it). */
export function setApiKey(key: string, remember: boolean): void {
  hydrated = true;
  const trimmed = key.trim();
  memoryKey = trimmed;
  writeLocal(remember && trimmed ? trimmed : null);
  emit();
}

export function clearApiKey(): void {
  hydrated = true;
  memoryKey = '';
  writeLocal(null);
  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  emit();
}

export function subscribeApiKey(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
