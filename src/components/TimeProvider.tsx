"use client";

import { getNtpTime } from "@/utils/api";
import { getTimeRemainingToNextCycle } from "@/utils/time";
import { createContext, useContext, useEffect, useState } from "react";

const TimeContext = createContext<number>(0);

export function useTimeRemaining() {
  return useContext(TimeContext);
}

export function TimeProvider({ children }: { children: React.ReactNode }) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timeOffset, setTimeOffset] = useState(0);

  useEffect(() => {
    // 只在初始化时校准一次时间
    _getNtpTime();
  }, []);

  useEffect(() => {
    // 使用utils中的函数计算当前时间到下一个30秒整点的剩余时间
    const updateTimeRemaining = () => {
      const remaining = getTimeRemainingToNextCycle(timeOffset);
      setTimeRemaining(remaining);
    };

    // 初始计算
    updateTimeRemaining();

    // 每秒更新一次（对齐实际时间）
    const timer = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(timer);
  }, [timeOffset]);

  async function _getNtpTime() {
    try {
      const startTime = Date.now();
      const { time } = await getNtpTime();
      const endTime = Date.now();
      const latency = endTime - startTime;

      const serverTime = new Date(time).getTime();
      // 直接用服务器时间减去本地时间，再加上完整的延迟
      const offset = serverTime - startTime;
      setTimeOffset(offset + latency);
      console.log(
        "Time offset:",
        offset,
        "ms",
        "Latency:",
        latency,
        "ms",
        "total",
        offset + latency
      );
    } catch (error) {
      console.error("Failed to get NTP time:", error);
    }
  }
  return (
    <TimeContext.Provider value={timeRemaining}>
      {children}
    </TimeContext.Provider>
  );
}
