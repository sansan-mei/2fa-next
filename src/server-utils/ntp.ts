import { getNetworkTime } from "ntp-client";

// 存储时间偏差（毫秒）
let timeOffset = 0;
// 上次更新时间
let lastUpdateTime = 0;
// 更新间隔（1小时）
const UPDATE_INTERVAL = 120 * 60 * 1000;

// 初始化时间偏差
export async function initializeTimeOffset(): Promise<void> {
  try {
    const ntpTime = await getNtpTime();
    const localTime = Date.now();
    timeOffset = ntpTime.getTime() - localTime;
    lastUpdateTime = localTime;
    console.log(`Time offset initialized: ${timeOffset}ms`);
  } catch (error) {
    console.error("Failed to initialize time offset:", error);
    // 如果初始化失败，使用0作为默认偏差
    timeOffset = 0;
  }
}

// 获取当前时间（考虑偏差）
export function getAdjustedTime(): Date {
  return new Date(Date.now() + timeOffset);
}

// 检查并更新时间偏差
export async function checkAndUpdateTimeOffset(): Promise<void> {
  const now = Date.now();
  if (now - lastUpdateTime >= UPDATE_INTERVAL) {
    try {
      const ntpTime = await getNtpTime();
      const localTime = now;
      timeOffset = ntpTime.getTime() - localTime;
      lastUpdateTime = localTime;
      console.log(`Time offset updated: ${timeOffset}ms`);
    } catch (error) {
      console.error("Failed to update time offset:", error);
    }
  }
}

// 获取NTP时间（内部使用）
async function getNtpTime(): Promise<Date> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    getNetworkTime("cn.pool.ntp.org", 123, (err, date) => {
      if (err || !date) {
        reject(err || new Error("Failed to get NTP time"));
      } else {
        const endTime = Date.now();
        const processingTime = endTime - startTime;
        // 补偿服务器处理时间
        const adjustedTime = new Date(date.getTime() + processingTime);
        resolve(adjustedTime);
      }
    });
  });
}
