import { getNetworkTime } from "ntp-client";

export async function getNtpTime() {
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
