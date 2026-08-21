import { api } from './api';
import { getApiKey, subscribeApiKey } from './apiKeyStore';
import { parseSubscription, type NaiSubscription } from './naiAccount';

let snapshot: NaiSubscription | null = null;
let error: string | null = null;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

export function getNaiSubscription(): NaiSubscription | null {
  return snapshot;
}

export function getNaiAccountError(): string | null {
  return error;
}

export async function refreshNaiAccount(): Promise<void> {
  const apiKey = getApiKey().trim();
  if (!apiKey) {
    snapshot = null;
    error = null;
    emit();
    return;
  }
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const raw = await api.get('/nai/subscription', { Authorization: `Bearer ${apiKey}` });
      snapshot = parseSubscription(raw);
      error = null;
    } catch (err) {
      snapshot = null;
      error = err instanceof Error ? err.message : '无法读取 NovelAI 账户';
    } finally {
      inflight = null;
      emit();
    }
  })();
  return inflight;
}

export function subscribeNaiAccount(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

subscribeApiKey(() => {
  void refreshNaiAccount();
});
