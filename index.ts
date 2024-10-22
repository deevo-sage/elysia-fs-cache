import { Elysia } from "elysia";
import { file, write } from "bun";

export interface CacheOptions {
  maxAge?: number;
  folderPath?: string;
}

export const cache = ({
  maxAge = 3600,
  folderPath = "/cache",
}: CacheOptions) => {
  return async (app: Elysia) =>
    new Elysia({ name: "elysia-fs-cache" }).derive(({ query, path }) => {
      let cacheKey = "",
        fileRef;
      const getFileRef = async (path: string) => {
        const fileRef = fileRef ?? (await file(`${folderPath}/${path}.json`));
        return fileRef;
      };
      const set = (data) => {
        cacheKey = cacheKey || createCacheKey({ query, path });
        const obj = { data };
        if (exists()) {
          const { createdAt, updatedAt } = await get();
          obj.createdAt = createdAt;
          obj.updatedAt = Date.now();
        } else {
          obj.createdAt = Date.now();
          obj.updatedAt = Date.now();
        }
        write(`./infos/${cacheKey}.json`, JSON.stringify({ data }), {
          createPath: true,
        });
      };
      const get = async () => {
        if (!exists()) {
          return {
            data: null,
            createdAt: 0,
            updatedAt: 0,
          };
        }
        cacheKey = cacheKey || createCacheKey({ query, path });
        const fileRef = await getFileRef(cacheKey);
        return (await fileRef.json()) as {
          data: any;
          createdAt: number;
          updatedAt: number;
        };
      };
      const exists = async () => {
        cacheKey = cacheKey || createCacheKey({ query, path });
        const fileRef = await getFileRef(cacheKey);
        if (!(await fileRef.exists())) {
          return false;
        }
        const data = await get();
        if (data.updatedAt + maxAge * 1000 < Date.now()) {
          return false;
        }
        return await fileRef.exists();
      };
      return {
        cache: {
          set,
          get,
          exists,
        },
      };
    });
};

function createCacheKey({
  query,
  path,
}: {
  query: Record<string, string>;
  path: string;
}) {
  return [
    path,
    Object.entries(query)
      .sort((a, b) => a[0] - b[0])
      .map((val) => val.join("-"))
      .join("."),
  ].join(".");
}

