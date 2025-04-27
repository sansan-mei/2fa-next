import { Snowflake } from "@theinternetfolks/snowflake";
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
      order: value!.order,
    };
  });
  return Promise.all(resultPromises).then((result) =>
    result.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  );
}

/**
 * 增量加载TOTP代码，每加载一个就立即返回
 * @param callback 每加载一项时的回调函数
 */
export async function generateToTpCodeIncremental(
  callback: (items: AuthItem[]) => void
): Promise<void> {
  const ids = await getAllSecrets();
  const items: AuthItem[] = [];

  // 如果没有数据，直接返回空数组
  if (ids.length === 0) {
    callback([]);
    return;
  }

  // 一个一个处理ID，而不是并行处理
  for (const id of ids) {
    const value = await getSecret(id);
    if (value) {
      const item = {
        id: id as string,
        name: value.title,
        issuer: value.description,
        code: generateTOTPCode(value.secret),
        order: value.order ?? 0,
      };

      // 立即将这个项添加到列表中
      items.push(item);

      // 对items进行排序并通过回调返回当前所有项
      const sortedItems = [...items].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      );
      callback(sortedItems);
    }
  }
}

export function generateSnowflake() {
  return Snowflake.generate();
}
