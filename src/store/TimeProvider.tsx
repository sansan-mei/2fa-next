"use client";

import { synchronizeOTPClock } from "@/utils/api";
import { subscribeOTPClock } from "@/utils/otp-clock";
import { getTimeRemainingToNextCycle } from "@/utils/time";
import { createContext, useContext, useEffect, useState } from "react";

const TimeContext = createContext<number>(0);

export function useTimeRemaining() {
  return useContext(TimeContext);
}

export function TimeProvider({ children }: { children: React.ReactNode }) {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const update = () => setTimeRemaining(getTimeRemainingToNextCycle());
    update();
    const timer = setInterval(update, 250);
    const unsubscribe = subscribeOTPClock(update);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(timer);
      unsubscribe();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  useEffect(() => {
    let pending: AbortController | undefined;
    const sync = async () => {
      if (!navigator.onLine || pending) return;
      const controller = new AbortController();
      pending = controller;
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        await synchronizeOTPClock(controller.signal);
      } finally {
        clearTimeout(timeout);
        pending = undefined;
      }
    };
    void sync();
    window.addEventListener("online", sync);
    return () => {
      pending?.abort();
      window.removeEventListener("online", sync);
    };
  }, []);

  return <TimeContext.Provider value={timeRemaining}>{children}</TimeContext.Provider>;
}
