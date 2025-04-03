import { generateTOTPCode } from "@/server-utils/totp";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { rsaDecrypt } from "../crypto/route";

const initialCodes: AuthItem[] = [];

export async function GET() {
  return NextResponse.json(initialCodes);
}

export async function POST(req: Request) {
  const { name, issuer, code } = await req.json();
  const privateKey = process.env.RSA_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("RSA private key not found in environment variables");
  }

  const decryptedCode = rsaDecrypt(code, privateKey);
  const result: AuthItem = {
    name,
    issuer,
    code: generateTOTPCode(decryptedCode),
    id: randomUUID(),
  };
  initialCodes.push(result);
  return NextResponse.json(result);
}
