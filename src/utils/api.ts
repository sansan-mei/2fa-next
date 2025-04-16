import { get, post } from "./request";

export function getPublicKey() {
  return get<{ publicKey: string }>({
    url: "api/crypto",
  });
}

export function postToTp(data: { name: string; issuer: string; code: string }) {
  return post<AuthItem>({
    url: "api/totp",
    data,
  });
}

export function getNtpTime() {
  return get<{ time: string }>({
    url: "api/ntp",
  });
}
