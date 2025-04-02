import { get } from "./request";

export async function getData() {
  const res = await get<AuthItem[]>({
    url: "http://127.0.0.1:3000/api/totp",
  });
  return res;
}
