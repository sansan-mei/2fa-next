/**
 * 计算当前时间到下一个30秒周期的剩余秒数
 * @returns 剩余秒数(0-30)
 */
export function getTimeRemainingToNextCycle(): number {
  const now = new Date();
  const seconds = now.getSeconds();
  const remaining = 30 - (seconds % 30);
  return remaining;
}

/**
 * 计算剩余时间的百分比值
 * @returns 剩余时间的百分比(0-100)
 */
export function getTimeRemainingPercentage(): number {
  const remaining = getTimeRemainingToNextCycle();
  return (remaining / 30) * 100;
}
