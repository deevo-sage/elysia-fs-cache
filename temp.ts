import { Elysia } from "elysia";
import { cache } from "elysia-fs-cache";

export const app = new Elysia()
  .use(cache({ maxAge: 1000, folderPath: "/cache" }))
  .get("/", ({ cache }) => {
    cache.set({ hello: "world" });
    return cache.get();
  });
