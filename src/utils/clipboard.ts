/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 * @returns 包含复制是否成功的Promise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);
    return false;
  }
}
