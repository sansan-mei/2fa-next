import { TOTP } from "totp-generator";

export interface AuthItem {
  id: string;
  name: string;
  issuer: string;
  code: string;
  sourceKey: string;
}

export function generateTOTPCode(secret: string): string {
  return TOTP.generate(secret).otp;
}
