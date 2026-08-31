# Client importing server types: why typecheck broke, and how it was fixed

This note is for later. The setup is working now. Read this when you want to understand **what was wrong**, **what we changed**, and **why `exclude` did not help**.

## What we are trying to do

The React client needs tRPC types from the Express server, so the UI is typed against the real API:

```ts
import type { AppRouter } from "server/router";
import type { TrpcRouterOutputs } from "server/router";
```

That alias is defined in `client/tsconfig.json`:

```json
"paths": {
  "@/*": ["./src/*"],
  "server/*": ["../server/src/*"]
}
```

So `server/router` means `server/src/router.ts`. Those imports are **type-only**. Vite strips them at build time, so server implementation is not bundled into the browser. TypeScript still has to **resolve** the files to know the types.

That last part is what caused the pain.

## What went wrong

There are two packages, each with its own TypeScript rules:

|                         | Client                                 | Server                                     |
| ----------------------- | -------------------------------------- | ------------------------------------------ |
| Config                  | `client/tsconfig.json`                 | `server/tsconfig.json`                     |
| Module system           | bundler (`ESNext`, Vite)               | Node (`NodeNext`, `.js` import specifiers) |
| Libs                    | `DOM` + `DOM.Iterable` (browser)       | `ESNext` only (no `window`)                |
| Extra types             | `vite/client`                          | Node / Express / `express-session`         |
| Lint-style checks       | `noUnusedLocals`, `noUnusedParameters` | unused params allowed                      |
| Typecheck command (old) | `tsc --noEmit`                         | `tsc --noEmit`                             |

`pnpm --filter server typecheck` was **already clean**. Failures showed up when running **client** typecheck, and in the editor when a client file imported `server/router`.

### TypeScript follows imports, not folder boundaries

`client/tsconfig.json` `include` only covers files under `client/`. That does **not** mean server files stay out of the client program.

If a client file imports `../server/src/router.ts` (via the `server/*` path), TypeScript **adds that file and everything it imports** to the **client** program. Then it typechecks those server files with **client** `compilerOptions`.

An `exclude` like `"../server/src/**/*"` does **not** stop this. Official behavior: `exclude` only filters the `include` glob. It does not block a file that was pulled in by an `import`. So the exclude we tried was a no-op.

### Same `.ts` files, wrong rules

Once server sources were inside the client program, mismatches looked like “server is broken” even though server’s own `tsc` passed. Examples we actually saw:

1. **`Unused '@ts-expect-error'`** in `server/src/router.ts`  
   Server has no DOM lib, so `typeof window` is invalid and `@ts-expect-error` is needed. Client **has** DOM, so `window` exists, the directive is unused, and client `tsc` errors.

2. **`'x' is declared but its value is never read`** (`noUnusedLocals`)  
   Client turns that on. Server does not. Unused locals in server code became client errors.

3. **`Property 'user' does not exist on Session`** in `server/src/trpc.ts`  
   Session is augmented by `express-session` (and our app types) in the **server** project. The client program does not load those Node/Express types the same way (`types` is set to `["vite/client"]`). Checked as client code, `req.session.user` looks invalid.

4. **`ReadableStream` / `ArrayBuffer` assignability** in media upload code  
   Client `lib` includes browser DOM stream types. Server uses Node’s idea of streams. Same file, two different built-in types.

So: **typing across the package boundary was not “working” in the client project.** Server-only typecheck was fine. The editor yelled because it was using the client tsconfig for those imported server files.

## What we changed

TypeScript **project references**: treat server as a **dependency project**, not as extra files in the client program.

### 1. Server tsconfig is a referenced project (`composite`)

In `server/tsconfig.json`:

- `"composite": true` — required so another tsconfig can `references` this project. Also implies declaration emit (we already had `"declaration": true`).
- `"tsBuildInfoFile": "./dist/tsconfig.tsbuildinfo"` — incremental build cache (lives under `server/dist`, which is gitignored).

Server still uses NodeNext, no DOM, Express types, etc. That config is now the one that applies to `server/src/**/*.ts` even when the client imports those files for types.

### 2. Client tsconfig points at that project

In `client/tsconfig.json`:

```json
"references": [{ "path": "../server" }]
```

Meaning: “this client project depends on the server TypeScript project.” When TypeScript understands that, server files are checked with **server** options, not client options.

The `server/*` path alias is unchanged. Client code still writes `import type { AppRouter } from 'server/router'`.

### 3. Client typecheck uses build mode

In `client/package.json`:

```json
"typecheck": "tsc -b --pretty"
```

- `-b` / `--build` — use project references: typecheck/build **server first** with server config, then client with client config.
- `--pretty` — colored, formatted errors only. No behavior change.

Plain `tsc --noEmit` (old script) compiles **one** tsconfig and, without build mode, easily treats imported server `.ts` as part of the client program. That is the command that produced the false errors.

`tsc -b` may write server `dist/` (JS + `.d.ts`) as a side effect of client typecheck, because the referenced server project emits. That is expected for `--build`. Client itself still has `"noEmit": true`.

### 4. Gitignore

`*.tsbuildinfo` is gitignored on the client (`tsc -b` can emit `client/tsconfig.tsbuildinfo`). Server’s build info is already under gitignored `dist/`.

## How it works now (mental model)

```
client file
  import type { AppRouter } from 'server/router'
        │
        ▼
  path alias → server/src/router.ts
        │
        ▼
  that file belongs to the SERVER project (references + composite)
        │
        ▼
  TypeScript uses server/tsconfig.json for those files
  Client-only rules (DOM, unused locals, vite/client) do not apply there
```

Runtime is unchanged: `import type` is erased. tRPC still talks HTTP to `/api/trpc`. This is only about the typechecker and the editor.

## Commands

```bash
pnpm --filter client typecheck   # tsc -b --pretty  (client + referenced server)
pnpm --filter server typecheck   # tsc --noEmit     (server only)
```

If the editor still shows the old errors after a tsconfig change: Command Palette → **TypeScript: Restart TS Server**.

## What we did _not_ do

- We did not copy tRPC types into the client by hand.
- We did not weaken client `strict` / `noUnusedLocals` to silence server files.
- We did not rely on `exclude` (it cannot un-import a file).
- We did not change Vite to bundle server code. Type-only imports stay type-only.

## Files involved

| File                   | Role                                                     |
| ---------------------- | -------------------------------------------------------- |
| `client/tsconfig.json` | `references` → `../server`; `paths.server/*`             |
| `server/tsconfig.json` | `composite`, declaration emit, Node/server rules         |
| `client/package.json`  | `"typecheck": "tsc -b --pretty"`                         |
| `client/src/trpc.ts`   | `import type { AppRouter } from 'server/router'`         |
| Various client routes  | `import type { TrpcRouterOutputs } from 'server/router'` |

## If this breaks again

Typical causes:

1. Client typecheck was changed back to `tsc --noEmit` without `-b`.
2. `"references"` was removed from client tsconfig, or `"composite"` from server tsconfig.
3. A **value** import (not `import type`) from `server/...` — Vite may try to bundle server code. Keep imports type-only. `server/src/router.ts` already throws if `window` exists, as a guard against accidental bundling.

Official docs: [TypeScript project references](https://www.typescriptlang.org/docs/handbook/project-references.html).
