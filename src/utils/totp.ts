import { TOTP } from "totp-generator";

export function generateTOTPCode(key: string) {
  try {
    const { otp } = TOTP.generate(key);
    return otp;
  } catch (error) {
    console.warn(error);
    return key;
  }
}
