import CryptoJS from "crypto-js";
import NodeRSA from "node-rsa";

// AES加密
export function encrypt(text: string, secretKey: string) {
  return CryptoJS.AES.encrypt(text, secretKey).toString();
}

// AES解密
export function decrypt(ciphertext: string, secretKey: string) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// 生成密钥对
const key = new NodeRSA({ b: 2048 });
export const publicKey = key.exportKey("public");
export const privateKey = key.exportKey("private");

// RSA解密 (使用私钥解密)
export function rsaDecrypt(ciphertext: string, privKey: string) {
  const key = new NodeRSA(privKey);
  return key.decrypt(ciphertext, "utf8");
}
