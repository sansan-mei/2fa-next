import { get } from "./request";

export function getPublicKey() {
  return get<{ publicKey: string }>({
    url: "api/crypto",
  });
}

export function getNtpTime() {
  return get<{ time: string }>({
    url: "api/ntp",
  });
}
