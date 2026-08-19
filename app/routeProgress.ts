type Listener = (active: boolean, width: number) => void;

const listeners = new Set<Listener>();
let timer: ReturnType<typeof setInterval> | null = null;
let width = 0;
let active = false;

function emit() {
  for (const fn of listeners) fn(active, width);
}

export function subscribeRouteProgress(fn: Listener): () => void {
  listeners.add(fn);
  fn(active, width);
  return () => { listeners.delete(fn); };
}

export function startRouteProgress() {
  if (timer) clearInterval(timer);
  active = true;
  width = 12;
  emit();
  timer = setInterval(() => {
    width = Math.min(92, width + Math.max(1.2, (92 - width) * 0.08));
    emit();
  }, 180);
}

export function doneRouteProgress() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  width = 100;
  emit();
  globalThis.setTimeout(() => {
    active = false;
    width = 0;
    emit();
  }, 240);
}
