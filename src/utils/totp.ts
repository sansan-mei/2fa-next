import { TOTP } from "totp-generator";
import { getAllSecrets, getSecret } from "./idb";

export function generateTOTPCode(key: string) {
  try {
    const { otp } = TOTP.generate(key);
    return otp;
  } catch (error) {
    console.warn(error);
    return key;
  }
}

export async function generateToTpCodeByIDB(): Promise<AuthItem[]> {
  const ids = await getAllSecrets();
  const resultPromises = ids.map(async (id) => {
    const value = await getSecret(id);
    return {
      id: id as string,
      name: value!.title,
      issuer: value!.description,
      code: generateTOTPCode(value!.secret),
    };
  });
  return Promise.all(resultPromises);
}
