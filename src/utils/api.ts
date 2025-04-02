export async function getData(): Promise<AuthItem[]> {
  const res = await fetch("http://127.0.0.1:3000/api/totp");

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }
  return res.json();
}
