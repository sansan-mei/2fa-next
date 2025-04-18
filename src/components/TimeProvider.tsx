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
    let animationFrameId: number;
    let lastUpdateTime = Date.now();

    const updateTimeRemaining = () => {
      const currentTime = Date.now();
      // 确保至少每 200ms 更新一次，避免过于频繁的更新
      if (currentTime - lastUpdateTime >= 200) {
        const remaining = getTimeRemainingToNextCycle(timeOffset);
        setTimeRemaining(remaining);
        lastUpdateTime = currentTime;
      }
      animationFrameId = requestAnimationFrame(updateTimeRemaining);
    };

    // 处理页面可见性变化
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // 页面重新可见时，立即更新一次时间
        const remaining = getTimeRemainingToNextCycle(timeOffset);
        setTimeRemaining(remaining);
        lastUpdateTime = Date.now();
      }
    };

    // 初始计算
    updateTimeRemaining();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
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
