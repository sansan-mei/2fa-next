import { rsaDecrypt } from "@/server-utils/crypto";

// 前端只需要公钥，用这个API获取
export async function GET() {
  const publicKey = process.env.RSA_PUBLIC_KEY;
  if (!publicKey) {
    throw new Error("RSA public key not found in environment variables");
  }
  return Response.json({ publicKey });
}

// POST接口用于解密数据
export async function POST(req: Request) {
  const privateKey = process.env.RSA_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("RSA private key not found in environment variables");
  }

  const { encryptedData } = await req.json();
  const decryptedData = rsaDecrypt(encryptedData, privateKey);

  return Response.json({ decryptedData });
}
