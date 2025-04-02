import NodeRSA from "node-rsa";

// RSA加密 (使用公钥加密)
export function rsaEncrypt(text: string, pubKey: string) {
  const key = new NodeRSA(pubKey, "public");
  // 设置加密配置
  key.setOptions({
    encryptionScheme: "pkcs1_oaep", // 使用更安全的 OAEP padding
    environment: "browser",
  });
  return key.encrypt(text, "base64");
}

// RSA解密 (使用私钥解密)
export function rsaDecrypt(ciphertext: string, privKey: string) {
  const key = new NodeRSA(privKey, "private");
  // 设置解密配置
  key.setOptions({
    encryptionScheme: "pkcs1_oaep", // 使用更安全的 OAEP padding
    environment: "node",
  });
  return key.decrypt(ciphertext, "utf8");
}

// 前端只需要公钥，用这个API获取
export async function GET() {
  const publicKey = process.env.RSA_PUBLIC_KEY;
  debugger;
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
