import { get } from "./request";

export function getNtpTime() {
  return get<{ time: string }>({
    url: "api/ntp",
  });
}
