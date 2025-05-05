import { checkAndUpdateTimeOffset, getAdjustedTime } from "@/server-utils/ntp";
import { NextResponse } from "next/server";

export async function GET() {
  // 检查并更新时间偏差
  await checkAndUpdateTimeOffset();

  // 获取调整后的时间
  const time = getAdjustedTime();

  // 创建响应
  const response = NextResponse.json({ time: time.toISOString() });

  // 设置缓存控制头
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("Surrogate-Control", "no-store");

  return response;
}
