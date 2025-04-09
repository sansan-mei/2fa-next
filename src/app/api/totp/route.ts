import { rsaDecrypt } from "@/server-utils/crypto";
import { generateTOTPCode } from "@/server-utils/totp";
import { NextResponse } from "next/server";
import { Worker } from "snowflake-uuid";

const initialCodes: AuthItem[] = [];

const generator = new Worker(0, 1, {
  workerIdBits: 5,
  datacenterIdBits: 5,
  sequenceBits: 12,
});

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
    id: generator.nextId().toString(),
  };
  initialCodes.push(result);
  return NextResponse.json(result);
}
