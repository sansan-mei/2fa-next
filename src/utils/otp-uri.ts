import { formatTOTPKey, validateTOTPKey } from "./validators";

/** Reject unsupported OTP configurations instead of silently using defaults. */
export function parseTOTPQRCode(url: string): {
  account: string;
  secret: string;
  issuer: string;
} {
  const parsed = new URL(url);
  if (parsed.protocol !== "otpauth:") throw new Error("不是有效的 OTP 二维码");
  if (parsed.hostname !== "totp") throw new Error("暂不支持 HOTP 或其他 OTP 类型，请使用 TOTP 二维码");
  const params = parsed.searchParams;
  for (const name of ["secret", "issuer", "algorithm", "digits", "period"]) {
    if (params.getAll(name).length > 1) throw new Error(`二维码参数 ${name} 重复`);
  }
  const algorithm = params.get("algorithm") ?? "SHA1";
  const digits = params.get("digits") ?? "6";
  const period = params.get("period") ?? "30";
  if (algorithm.toUpperCase() !== "SHA1" || digits !== "6" || period !== "30") {
    throw new Error("暂仅支持 SHA-1、6 位、30 秒的 TOTP，此二维码的参数不受支持");
  }
  const secret = formatTOTPKey(params.get("secret") ?? "");
  const validation = validateTOTPKey(secret);
  if (!validation.isValid) throw new Error(validation.error);
  // URLSearchParams already decodes query values; decode the path exactly once.
  const label = decodeURIComponent(parsed.pathname.slice(1));
  const separator = label.indexOf(":");
  const account = (separator < 0 ? label : label.slice(separator + 1)).trim();
  const issuer = params.get("issuer") ?? (separator < 0 ? "" : label.slice(0, separator));
  if (!account) throw new Error("二维码缺少账户名称");
  return { account, secret, issuer };
}
