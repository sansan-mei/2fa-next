import jsQR from "jsqr";
import { QRCodeToDataURLOptions, toDataURL } from "qrcode";

/**
 * 从图像数据中扫描二维码
 * @param imageData 图像数据
 * @returns 返回扫描结果，未找到则返回null
 */
export function scanQRCode(imageData: ImageData): string | null {
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "dontInvert",
  });

  return code ? code.data : null;
}

/**
 * 从图像中扫描二维码
 * @param file 图像文件
 * @returns Promise包含扫描结果，未找到则返回null
 */
export async function scanQRCodeFromImage(file: File): Promise<string | null> {
  try {
    // 创建图像对象
    const imgBitmap = await createImageBitmap(file);

    // 创建canvas处理图像
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("无法创建canvas上下文");
    }

    // 设置canvas尺寸并绘制图像
    canvas.width = imgBitmap.width;
    canvas.height = imgBitmap.height;
    context.drawImage(imgBitmap, 0, 0, imgBitmap.width, imgBitmap.height);

    // 获取图像数据并扫描
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    return scanQRCode(imageData);
  } catch (error) {
    console.error("扫描QR码失败:", error);
    return null;
  }
}

/**
 * 生成二维码数据URL
 * @param data 要编码的数据
 * @param options 二维码选项
 * @returns Promise包含二维码的dataURL
 */
export async function generateQRCodeDataURL(
  data: string,
  options?: QRCodeToDataURLOptions
): Promise<string> {
  try {
    return await toDataURL(data, {
      margin: 1,
      width: 300,
      ...options,
    });
  } catch (error) {
    console.error("生成QR码失败:", error);
    throw error;
  }
}

/**
 * 解析TOTP二维码URL
 * @param url otpauth://totp URL
 * @returns 解析后的对象，包含账户、密钥和发行者信息
 */
export function parseTOTPQRCode(url: string): {
  account: string;
  secret: string;
  issuer: string;
} | null {
  try {
    if (!url.startsWith("otpauth://")) {
      return null;
    }

    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== "otpauth:") {
      return null;
    }

    // 解析URL中的参数
    const params = new URLSearchParams(parsedUrl.search);
    const secret = params.get("secret");

    if (!secret) {
      return null;
    }

    // 解析账户信息 (otpauth://totp/issuer:account?secret=xxx&issuer=xxx)
    const path = decodeURIComponent(parsedUrl.pathname.substring(1)); // 移除开头的斜杠并解码
    let issuer = params.get("issuer")
      ? decodeURIComponent(params.get("issuer")!)
      : "";
    let account = path;

    // 如果路径包含 issuer:account 格式
    if (path.includes(":")) {
      const parts = path.split(":");
      if (!issuer) issuer = decodeURIComponent(parts[0]);
      account = decodeURIComponent(parts[1]);
    }

    return {
      account,
      secret,
      issuer,
    };
  } catch (error) {
    console.error("解析TOTP QR码失败:", error);
    return null;
  }
}
