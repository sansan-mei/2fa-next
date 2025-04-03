import { TOTP } from "totp-generator";

export function generateTOTPCode(secret: string): string {
  return TOTP.generate(secret).otp;
}
