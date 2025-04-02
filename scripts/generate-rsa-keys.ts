import fs from "fs";
import NodeRSA from "node-rsa";
import path from "path";

// 生成新的密钥对
const key = new NodeRSA({ b: 2048 });
const publicKey = key.exportKey("public");
const privateKey = key.exportKey("private");

// 读取现有的.env文件
const envPath = path.join(process.cwd(), ".env");
let envContent = "";
try {
  envContent = fs.readFileSync(envPath, "utf8");
} catch {
  console.log("Creating new .env file");
}

// 更新RSA密钥
const newEnvContent = envContent
  .replace(
    /RSA_PRIVATE_KEY=".*"/g,
    `RSA_PRIVATE_KEY="${privateKey.replace(/\n/g, "\\n")}"`
  )
  .replace(
    /RSA_PUBLIC_KEY=".*"/g,
    `RSA_PUBLIC_KEY="${publicKey.replace(/\n/g, "\\n")}"`
  );

// 如果没有找到密钥配置，就添加新的
if (!envContent.includes("RSA_PRIVATE_KEY")) {
  envContent += `\nRSA_PRIVATE_KEY="${privateKey.replace(/\n/g, "\\n")}"`;
}
if (!envContent.includes("RSA_PUBLIC_KEY")) {
  envContent += `\nRSA_PUBLIC_KEY="${publicKey.replace(/\n/g, "\\n")}"`;
}

// 写入.env文件
fs.writeFileSync(envPath, newEnvContent || envContent);
console.log("RSA keys have been generated and saved to .env file");
