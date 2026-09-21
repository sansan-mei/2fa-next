/**
 * 验证TOTP密钥是否有效
 * @param value 待验证的密钥字符串
 * @returns 返回验证结果对象，包含是否有效及错误信息
 */
export function validateTOTPKey(value: string): {
  isValid: boolean;
  error: string;
} {
  // 移除空格
  const cleanKey = formatTOTPKey(value);

  // Base32 字符集验证（A-Z 和 2-7）
  if (!/^[A-Z2-7]+$/.test(cleanKey)) {
    return {
      isValid: false,
      error: "密钥只能包含字母 A-Z 和数字 2-7",
    };
  }

  // Base32 编码完整字节后，未填充长度只能有这些余数。
  if (![0, 2, 4, 5, 7].includes(cleanKey.length % 8)) {
    return {
      isValid: false,
      error: "密钥不是有效的 Base32 编码长度",
    };
  }

  return {
    isValid: true,
    error: "",
  };
}

/**
 * 格式化TOTP密钥，移除空格并转为大写
 * @param key 原始密钥
 * @returns 格式化后的密钥
 */
export function formatTOTPKey(key: string): string {
  return key.replace(/\s/g, "").toUpperCase();
}
