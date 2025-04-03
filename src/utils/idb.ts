import { openDB } from "idb";

const DB_NAME = "2fa-storage";
const STORE_NAME = "secrets";

let dbPromise: Promise<any> | null = null;

// 只在浏览器环境初始化
if (typeof window !== "undefined") {
  dbPromise = openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME);
    },
  });
}

export async function saveSecret(id: string, secret: string) {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.put(STORE_NAME, secret, id);
}

export async function getSecret(id: string) {
  if (!dbPromise) return null;
  const db = await dbPromise;
  return db.get(STORE_NAME, id);
}

export async function deleteSecret(id: string) {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.delete(STORE_NAME, id);
}
