import { getNtpTime } from "@/server-utils/ntp";
import { NextResponse } from "next/server";

// 缓存 Map，存储 IP 和对应的 NTP 时间
const ntpCache = new Map<string, { time: Date; timestamp: number }>();

// 缓存过期时间 (1小时)
const CACHE_EXPIRY = 60 * 60 * 1000;

export async function GET(request: Request) {
  // 获取客户端 IP
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0] : "unknown";

  // 检查缓存
  const cached = ntpCache.get(ip);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_EXPIRY) {
    return NextResponse.json({ time: cached.time.toISOString(), cached: true });
  }

  // 获取新的 NTP 时间
  const time = await getNtpTime();

  // 更新缓存
  ntpCache.set(ip, { time, timestamp: now });

  return NextResponse.json({ time: time.toISOString(), cached: false });
}
