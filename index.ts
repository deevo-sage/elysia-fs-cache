import { Elysia } from "elysia";
import { BunFile, file, write } from "bun";

export interface CacheOptions {
  maxAge?: number;
  folderPath?: string;
}

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

export const cache = ({
  maxAge = 3600,
  folderPath = "/cache",
}: CacheOptions) => {
  return async (app: Elysia) =>
    app.derive(({ query, path }) => {
      try {
        let cacheKey = "",
          fileRef: BunFile;
        async function getFileRef(path: string) {
          fileRef = fileRef ?? (await file(`${folderPath}/${path}.json`));
          return fileRef;
        }
        async function set(data) {
          cacheKey = cacheKey || createCacheKey({ query, path });
          const obj = { data };
          if (await exists()) {
            const { createdAt, updatedAt } = await get();
            obj.createdAt = createdAt;
            obj.updatedAt = Date.now();
          } else {
            obj.createdAt = Date.now();
            obj.updatedAt = Date.now();
          }
          await write(`./infos/${cacheKey}.json`, JSON.stringify({ data }), {
            createPath: true,
          });
        }
        async function get() {
          if (!exists()) {
            return {
              data: null,
              createdAt: 0,
              updatedAt: 0,
            };
          }
          cacheKey = cacheKey || createCacheKey({ query, path });
          fileRef = await getFileRef(cacheKey);
          return (await fileRef.json()) as {
            data: any;
            createdAt: number;
            updatedAt: number;
          };
        }
        async function exists() {
          cacheKey = cacheKey || createCacheKey({ query, path });
          fileRef = await getFileRef(cacheKey);
          if (!(await fileRef.exists())) {
            return false;
          }
          const data = await get();
          if (data.updatedAt + maxAge * 1000 < Date.now()) {
            return false;
          }
          return await fileRef.exists();
        }
        return {
          cache: {
            set,
            get,
            exists,
          },
        };
      } catch (e) {
        return {
          cache: {
            set: () => {},
            get: () => {},
            exists: () => false,
          },
        };
        console.log(e);
      }
    });
};

