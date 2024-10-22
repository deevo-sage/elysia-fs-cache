# elysia-fs-cache

To install:

```bash
bun install elysia-fs-cache
```

Example:

```ts
import { Elysia } from "elysia";
import { cache } from "elysia-fs-cache";

export const app = new Elysia()
  .use(cache({ maxAge: 1000, folderPath: "/cache" }))
  .get("/", ({ cache }) => {
    await cache.set({ hello: "world" });
    return cache.get();
  });
```

This project was created to scale request based local cache for my [elysia](https://elysiajs.com) backend @helium.
