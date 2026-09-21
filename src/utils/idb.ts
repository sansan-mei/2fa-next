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

export async function saveSecret(id: string, value: IDBValue) {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.put(STORE_NAME, value, id);
}

export async function getSecret(
  id: string | IDBValidKey
): Promise<IDBValue | null> {
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
  return await db.getAllKeys(STORE_NAME);
}

/** Read keys and values from one consistent snapshot, without per-item transactions. */
export async function getSecretEntries(): Promise<{ id: string; value: IDBValue }[]> {
  if (!dbPromise) return [];
  const db = await dbPromise;
  const tx = db.transaction(STORE_NAME, "readonly");
  const [keys, values] = await Promise.all([
    tx.store.getAllKeys(),
    tx.store.getAll(),
    tx.done,
  ]);
  return keys.map((key, index) => ({ id: String(key), value: values[index] }));
}

/** Reject conflicts and commit the entire backup atomically. */
export async function importSecrets(items: ExportDataItem[]): Promise<number> {
  if (!dbPromise) throw new Error("当前环境无法访问本地数据库");
  const db = await dbPromise;
  const tx = db.transaction(STORE_NAME, "readwrite");
  try {
    const conflicts: string[] = [];
    for (const item of items) {
      if (await tx.store.get(item.id)) conflicts.push(item.title);
    }
    if (conflicts.length) {
      throw new Error(`有 ${conflicts.length} 项与现有记录 ID 冲突（${conflicts.slice(0, 3).join("、")}），未导入任何数据，请先处理重复记录`);
    }
    for (const { id, ...value } of items) {
      await tx.store.add(value, id);
    }
    await tx.done;
    return items.length;
  } catch (error) {
    try { tx.abort(); } catch { /* The transaction may already be aborted. */ }
    await tx.done.catch(() => {});
    throw error;
  }
}
