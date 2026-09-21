import { applyTimeSample } from "./otp-clock";

export async function getNtpTime(signal?: AbortSignal): Promise<{ time: string }> {
  // A unique challenge also rejects stale replies from an older service worker.
  const nonce = crypto.randomUUID();
  const response = await fetch(`/api/ntp?nonce=${nonce}`, { cache: "no-store", signal });
  if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
  const data = await response.json();
  if (data.nonce !== nonce || typeof data.time !== "string") {
    throw new Error("无效或过期的校时响应");
  }
  return { time: data.time };
}

/** A failed background sync leaves the current local/session clock untouched. */
export async function synchronizeOTPClock(signal?: AbortSignal): Promise<boolean> {
  const start = Date.now();
  try {
    const { time } = await getNtpTime(signal);
    if (signal?.aborted) return false;
    return applyTimeSample(time, start, Date.now());
  } catch {
    return false;
  }
}
