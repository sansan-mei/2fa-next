import { IDBPDatabase, openDB } from "idb";

const DB_NAME = "2fa-storage";
const STORE_NAME = "secrets";

let dbPromise: Promise<IDBPDatabase<unknown>> | null = null;

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

// 看下db里面有没有值
export async function hasSecret() {
  if (!dbPromise) return false;
  const db = await dbPromise;
  return (await db.count(STORE_NAME)) > 0;
}

// 获取所有secret
export async function getAllSecrets() {
  if (!dbPromise) return [];
  const db = await dbPromise;
  return await db.getAll(STORE_NAME);
}
