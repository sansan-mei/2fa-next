import { validateTOTPKey, formatTOTPKey } from "./validators";

/** All import channels use the same validation before any database writes. */
export function validateImportData(data: unknown): ExportDataItem[] {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("备份必须是非空数组");
  }
  const ids = new Set<string>();
  return data.map((item, index) => {
    const prefix = `第${index + 1}项`;
    if (!item || typeof item !== "object") throw new Error(`${prefix}格式错误`);
    if (typeof item.id !== "string" || !item.id.trim()) {
      throw new Error(`${prefix}缺少有效的id`);
    }
    if (ids.has(item.id)) throw new Error(`${prefix}的id在备份中重复`);
    ids.add(item.id);
    if (typeof item.title !== "string" || !item.title.trim()) {
      throw new Error(`${prefix}缺少有效的标题`);
    }
    if (typeof item.secret !== "string") throw new Error(`${prefix}缺少密钥`);
    const validation = validateTOTPKey(item.secret);
    if (!validation.isValid) throw new Error(`${prefix}：${validation.error}`);
    if (item.description !== undefined && typeof item.description !== "string") {
      throw new Error(`${prefix}的描述必须是字符串`);
    }
    if (item.order !== undefined && (!Number.isSafeInteger(item.order) || item.order < 0)) {
      throw new Error(`${prefix}的排序必须是非负整数`);
    }
    if ((item.type !== undefined && item.type !== "totp") ||
        (item.algorithm !== undefined && item.algorithm !== "SHA1") ||
        (item.digits !== undefined && item.digits !== 6) ||
        (item.period !== undefined && item.period !== 30)) {
      throw new Error(`${prefix}：仅支持 SHA-1、6 位、30 秒的 TOTP`);
    }
    return {
      id: item.id,
      title: item.title,
      secret: formatTOTPKey(item.secret),
      description: item.description ?? "",
      order: item.order ?? index,
    };
  });
}
