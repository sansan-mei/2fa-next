"use client";

import { getTimeRemainingToNextCycle } from "@/utils/time";
import { createContext, useContext, useEffect, useState } from "react";

const TimeContext = createContext<number>(0);

export function useTimeRemaining() {
  return useContext(TimeContext);
}

export function TimeProvider({ children }: { children: React.ReactNode }) {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    // 使用utils中的函数计算当前时间到下一个30秒整点的剩余时间
    const updateTimeRemaining = () => {
      const remaining = getTimeRemainingToNextCycle();
      setTimeRemaining(remaining);
    };

    // 初始计算
    updateTimeRemaining();

    // 每秒更新一次（对齐实际时间）
    const timer = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <TimeContext.Provider value={timeRemaining}>
      {children}
    </TimeContext.Provider>
  );
}
