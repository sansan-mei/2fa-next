import { getNtpTime } from "@/server-utils/ntp";
import { NextResponse } from "next/server";

export async function GET() {
  const time = await getNtpTime();
  return NextResponse.json({ time });
}
