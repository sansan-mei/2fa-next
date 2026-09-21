// Session-only correction: offline cold starts always work with the device clock.
let offset = 0;
const listeners = new Set<() => void>();

export function getOTPTime(): number {
  return Date.now() + offset;
}

export function subscribeOTPClock(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Estimate offset at the HTTP midpoint; reject invalid or very slow samples. */
export function applyTimeSample(time: string, start: number, end: number): boolean {
  const server = Date.parse(time);
  const latency = end - start;
  if (!Number.isFinite(server) || !Number.isFinite(latency) || latency < 0 || latency > 2000) {
    return false;
  }
  offset = server - (start + end) / 2;
  listeners.forEach((listener) => listener());
  return true;
}
