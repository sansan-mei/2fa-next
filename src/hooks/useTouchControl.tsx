import { useEffect, useRef, useState } from "react";

interface TouchState {
  startTime: number;
  startX: number;
  startY: number;
  duration: number;
  distance: number;
  isHolding: boolean;
}

export const useTouchControl = () => {
  const ref = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(null);
  const stateRef = useRef<TouchState>({
    startTime: 0,
    startX: 0,
    startY: 0,
    duration: 0,
    distance: 0,
    isHolding: false,
  });
  const [displayState, setDisplayState] = useState(stateRef.current);

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      stateRef.current = {
        startTime: performance.now(),
        startX: touch.clientX,
        startY: touch.clientY,
        duration: 0,
        distance: 0,
        isHolding: true,
      };
      setDisplayState(stateRef.current);

      const updateTimer = () => {
        if (!stateRef.current.isHolding) return;

        const duration = performance.now() - stateRef.current.startTime;
        stateRef.current.duration = Math.floor(duration);

        // 每 60ms 更新一次显示状态（约等于 16.6fps）
        if (duration % 30 < 30) {
          setDisplayState({ ...stateRef.current });
        }

        animationFrameRef.current = requestAnimationFrame(updateTimer);
      };

      animationFrameRef.current = requestAnimationFrame(updateTimer);
    };

    let lastMoveTime = 0;
    const handleTouchMove = (e: TouchEvent) => {
      if (!stateRef.current.isHolding) return;

      // 节流：每 60ms 最多执行一次
      const now = performance.now();
      if (now - lastMoveTime < 30) return;
      lastMoveTime = now;

      const touch = e.touches[0];
      const deltaX = touch.clientX - stateRef.current.startX;
      const deltaY = touch.clientY - stateRef.current.startY;
      stateRef.current.distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      setDisplayState({ ...stateRef.current });
    };

    const handleTouchEnd = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      stateRef.current.isHolding = false;
      setDisplayState({ ...stateRef.current });
    };

    // 添加事件监听
    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: true });
    element.addEventListener("touchend", handleTouchEnd);
    element.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  useEffect(() => {
    const element = ref.current!;
    if (displayState.duration > 200 && displayState.distance < 10) {
      element.style.touchAction = "none";
    } else {
      element.style.touchAction = "";
    }
  }, [displayState]);

  return {
    ref,
    pressedTime: displayState.duration,
    movedDistance: displayState.distance,
    isHolding: displayState.isHolding,
  };
};
