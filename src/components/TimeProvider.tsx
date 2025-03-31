"use client";

import { createContext, useContext, useEffect, useState } from "react";

const TimeContext = createContext<number>(0);

export function useTimeRemaining() {
  return useContext(TimeContext);
}

export function TimeProvider({ children }: { children: React.ReactNode }) {
  const [timeRemaining, setTimeRemaining] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 30));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <TimeContext.Provider value={timeRemaining}>
      {children}
    </TimeContext.Provider>
  );
}
