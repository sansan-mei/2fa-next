import NodeRSA from "node-rsa";

// 生成密钥对
const key = new NodeRSA({ b: 2048 });
export const publicKey = key.exportKey("public");
export const privateKey = key.exportKey("private");

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
