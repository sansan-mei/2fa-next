import { getAllSecrets, getSecret, saveSecret } from "./idb";
import { generateQRCodeDataURL } from "./qr";

/**
 * 将数据转换为Base64编码的JSON字符串
 * @param data 要导出的数据数组
 * @returns Base64编码的JSON字符串
 */
export function dataToBase64(data: ExportDataItem[]): string {
  try {
    const jsonString = JSON.stringify(data);
    return btoa(encodeURIComponent(jsonString));
  } catch (error) {
    console.error("数据编码失败:", error);
    throw error;
  }
}

/**
 * 从Base64字符串解析数据
 * @param base64String Base64编码的字符串
 * @returns 解析后的数据数组
 */
export function parseBase64Data(base64String: string): ExportDataItem[] {
  try {
    // 尝试多种解码方式以提高健壮性
    let jsonString;
    try {
      // 首先尝试标准的Base64解码方法
      jsonString = decodeURIComponent(atob(base64String));
    } catch (decodeError) {
      console.error("标准Base64解码失败:", decodeError);

      // 尝试替代方法
      try {
        // 尝试直接解码
        jsonString = atob(base64String);
      } catch {
        // 如果还是失败，尝试修复Base64字符串
        const fixedBase64 = base64String.replace(/-/g, "+").replace(/_/g, "/");
        jsonString = atob(fixedBase64);
      }
    }

    const data = JSON.parse(jsonString) as ExportDataItem[];

    if (!Array.isArray(data)) {
      throw new Error("无效的数据格式，不是数组");
    }

    return data;
  } catch (error) {
    console.error("Base64解析失败:", error);
    throw error;
  }
}

/**
 * 生成数据导出二维码的数据URL
 * @param data 要导出的数据
 * @returns Promise包含二维码的dataURL
 */
export async function generateExportQRCode(
  data: ExportDataItem[]
): Promise<string> {
  try {
    const base64String = dataToBase64(data);
    return await generateQRCodeDataURL(base64String);
  } catch (error) {
    console.error("生成导出二维码失败:", error);
    throw error;
  }
}

/**
 * 导入数据到存储中
 * @param data 要导入的数据数组
 * @returns 成功导入的项目数量
 */
export async function importData(data: ExportDataItem[]): Promise<number> {
  let importedCount = 0;

  for (const item of data) {
    try {
      await saveSecret(item.id, {
        secret: item.secret,
        title: item.title,
        description: item.description,
      });
      importedCount++;
    } catch (error) {
      console.error("保存项目失败:", error, "项目:", item);
    }
  }

  return importedCount;
}

// 点击导出二维码时的处理函数
export const handleDownloadQRCode = (exportDataUrl: string | null) => {
  if (!exportDataUrl) return;

  const link = document.createElement("a");
  link.href = exportDataUrl;
  link.download = "2fa-backup.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 导出dnd-kit的配置
export const dndConfig = () => {
  return {
    activationConstraint: {
      distance: 5, // 增加触发距离
      delay: 400, // 减少延迟时间
      tolerance: 5, // 添加容差值
      pressure: 0.5, // 添加压力阈值
    },
  };
};

/**
 * 生成 WebRTC peerId 的二维码
 * @param peerId RTC连接ID
 * @returns Promise包含二维码的dataURL
 */
export async function generatePeerIdQRCode(peerId: string): Promise<string> {
  try {
    return await generateQRCodeDataURL(`rtc://${peerId}`);
  } catch (error) {
    console.error("生成peerId二维码失败:", error);
    throw error;
  }
}

/**
 * 导出所有数据Json
 * @param isSource 是否返回源数据
 * @returns 当isSource为true时返回ExportDataItem[]，否则返回string
 */
export async function exportAllDataJson(
  isSource: true
): Promise<ExportDataItem[]>;
export async function exportAllDataJson(isSource: false): Promise<string>;
export async function exportAllDataJson(
  isSource: boolean
): Promise<string | ExportDataItem[]> {
  const ids = await getAllSecrets();

  // 收集所有数据
  const exportData: ExportDataItem[] = [];
  for (const id of ids) {
    const value = await getSecret(id);
    if (value) {
      exportData.push({
        id: id as string,
        secret: value.secret,
        title: value.title,
        description: value.description,
        order: value.order,
      });
    }
  }
  const jsonString = JSON.stringify(exportData);
  // 计算导出数据的内存大小,用buffer
  const size = Buffer.from(jsonString).length;
  console.log("导出数据的大小:", size / 1024, "KB");
  return isSource ? exportData : jsonString;
}
