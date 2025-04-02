import NodeRSA from "node-rsa";

// RSA加密 (使用公钥加密)
export function rsaEncrypt(text: string, pubKey: string) {
  const key = new NodeRSA(pubKey);
  return key.encrypt(text, "base64");
}
