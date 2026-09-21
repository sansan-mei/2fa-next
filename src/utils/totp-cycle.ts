import { getOTPTime, subscribeOTPClock } from "./otp-clock";

/** Refresh once per shared-clock 30-second cycle, including after a suspended tab resumes. */
export function watchTOTPCycle(refresh: () => void): () => void {
  let lastCycle: number | undefined;
  const tick = (force = false) => {
    if (document.visibilityState === "hidden") return;
    const cycle = Math.floor(getOTPTime() / 30_000);
    if (force || cycle !== lastCycle) {
      lastCycle = cycle;
      refresh();
    }
  };
  const onVisibility = () => tick(true);
  const unsubscribe = subscribeOTPClock(() => tick(true));
  tick();
  const timer = setInterval(tick, 250);
  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    clearInterval(timer);
    unsubscribe();
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
