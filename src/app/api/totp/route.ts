import { generateTOTPCode } from "@/utils/totp";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

const initialCodes: AuthItem[] = [];

export async function GET() {
  return NextResponse.json(initialCodes);
}

export async function POST(req: Request) {
  const { name, issuer, code } = await req.json();
  const result = {
    name,
    issuer,
    code: generateTOTPCode(code),
    id: randomUUID(),
    sourceKey: code,
  };
  initialCodes.push(result);
  return NextResponse.json(result);
}
