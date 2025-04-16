/**
 * 计算当前时间到下一个30秒周期的剩余秒数
 * @param offset 时间偏移量(毫秒)
 * @returns 剩余秒数(0-30)
 */
export function getTimeRemainingToNextCycle(offset: number = 0): number {
  const now = new Date(Date.now() + offset);
  const seconds = now.getSeconds();
  const remaining = 30 - (seconds % 30);
  return remaining;
}

/**
 * 计算剩余时间的百分比值
 * @param offset 时间偏移量(毫秒)
 * @returns 剩余时间的百分比(0-100)
 */
export function getTimeRemainingPercentage(offset: number = 0): number {
  const remaining = getTimeRemainingToNextCycle(offset);
  return (remaining / 30) * 100;
}
