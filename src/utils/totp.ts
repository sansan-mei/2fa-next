import { TOTP } from "totp-generator";
import { getSecret } from "./idb";

export function generateTOTPCode(key: string) {
  try {
    const { otp } = TOTP.generate(key);
    return otp;
  } catch (error) {
    console.warn(error);
    return key;
  }
}

export async function generateToTpCodeByList(list: AuthItem[]) {
  return Promise.all(
    list.map(async (item) => {
      const sourceKey = await getSecret(item.id);
      if (!sourceKey) {
        return item;
      }
      return {
        ...item,
        code: generateTOTPCode(sourceKey),
      };
    })
  );
}
