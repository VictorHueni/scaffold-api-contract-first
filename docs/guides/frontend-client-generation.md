---
title: Frontend Client Generation
description: Generate typed TypeScript API clients from OpenAPI specs using openapi-typescript + openapi-fetch
audience: [frontend]
tools: [openapi-typescript, openapi-fetch, typescript]
prd: "0001"
user-stories: [US-005]
last-updated: 2026-04-03
---

# Frontend Client Generation

> Generate TypeScript types from your OpenAPI spec and use them with a 6kb type-safe fetch wrapper. No runtime codegen, no bloated SDK, no Java dependency.

## Quick Start

```bash
npm run types                          # Generate TypeScript types from spec
cat generated/api-types.d.ts           # Inspect generated types
npx tsc --noEmit                       # Verify everything compiles
npm run mock &                         # Start mock server
# Use openapi-fetch in your code — see examples/client-usage.ts
```

## Overview

This guide covers generating and using typed TypeScript API clients from the scaffold's OpenAPI spec. The stack uses `openapi-typescript` (types only, ~3M downloads/week) paired with `openapi-fetch` (lightweight fetch wrapper, ~3M downloads/week). Together they provide compile-time safety and IDE autocompletion with zero generated runtime code.

**Who this is for:** Frontend developers building against the API spec.

## Prerequisites

| Tool | Version | Install | Required? |
|---|---|---|---|
| Node.js | 18+ | System install | Yes |
| openapi-typescript | 7.x | `devDependency` (already in package.json) | Yes |
| openapi-fetch | 0.17.x | `devDependency` (already in package.json) | Yes |
| TypeScript | 5.x | `devDependency` (already in package.json) | Yes |

All tools install via `npm install` — no additional setup.

## How It Works

### Generating types

```bash
npm run types
# Runs: openapi-typescript specs/api.yaml -o generated/api-types.d.ts --read-write-markers
```

**Two critical flags:**

1. **Use the source spec, not the bundled spec.** The Scalar CLI bundler creates `x-ext` hash references that generate invalid TypeScript. `openapi-typescript` resolves `$ref` pointers internally — let it work from the source files.

2. **Use `--read-write-markers`.** Without this flag, POST/PUT body types require server-assigned fields (`id`, `status`, `createdAt`). With it, `openapi-fetch` automatically uses `$Write` types for request bodies (excluding `readOnly` fields) and `$Read` types for responses.

### Using openapi-fetch

```typescript
import createClient from "openapi-fetch";
import type { paths } from "../generated/api-types";

const client = createClient<paths>({
  baseUrl: "http://localhost:4010",
  headers: { "X-API-Key": "your-api-key-here" },
});
```

### GET with query parameters

```typescript
const { data, error } = await client.GET("/orders", {
  params: {
    query: { page: 1, limit: 20, status: "pending" },
  },
});

if (data) {
  console.log(data.data);       // Order[]
  console.log(data.pagination); // { page, limit, totalItems, totalPages }
}
```

### GET with path parameters

```typescript
const { data, error } = await client.GET("/orders/{orderId}", {
  params: {
    path: { orderId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" },
  },
});
// TypeScript knows: data.id is string, data.status is enum, data.customer is Customer
```

### POST with typed body

```typescript
const { data, error } = await client.POST("/orders", {
  body: {
    customer: {
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "+41791234567",
      shippingAddress: {
        street: "123 Main St", city: "Zurich",
        state: "ZH", postalCode: "8001", country: "CH",
      },
    },
    items: [{
      productId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      productName: "Wireless Headphones",
      quantity: 1, unitPrice: 89.99,
    }],
    currency: "CHF",
    notes: "Please deliver before noon",
    // id, status, total, createdAt, updatedAt NOT required
    // (readOnly fields excluded by --read-write-markers)
  },
});
```

### Error handling

```typescript
const { data, error } = await client.GET("/orders/{orderId}", {
  params: { path: { orderId } },
});

if (error) {
  // error is typed as ErrorResponse (from the spec)
  console.error(error.title);   // "Not Found"
  console.error(error.detail);  // "Order with ID ... does not exist"
  console.error(error.status);  // 404
  return;
}
// data is guaranteed defined here (TypeScript narrows the type)
console.log(data.id);
```

## Configuration

### npm script

```json
{ "types": "openapi-typescript specs/api.yaml -o generated/api-types.d.ts --read-write-markers" }
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  },
  "include": ["examples/**/*.ts"]
}
```

Key settings:
- `moduleResolution: "bundler"` — required for `openapi-fetch` imports
- `skipLibCheck: true` — avoids errors from `openapi-fetch` internal types
- `include` does NOT list `generated/**/*.d.ts` — types are pulled in via `import type`

### openapi-typescript flags

| Flag | When to use |
|---|---|
| `--read-write-markers` | **Always.** Separates readOnly fields from writable fields. |
| `--enum` | Export true TypeScript enums instead of string unions |
| `--immutable` | Generate `readonly` on all properties |
| `--export-type` | Export `type` instead of `interface` at top level |
| `--path-params-as-types` | Template literal types for paths |
| `--alphabetize` | Sort keys alphabetically (cleaner diffs) |
| `--root-types` | Export schema types at root level (`import type { Order }`) |

## Common Pitfalls

**1. Generated from bundled spec breaks TypeScript**
- Problem: `scalar document bundle` creates `x-ext` hash references that generate invalid TypeScript type references (`x-ext["c8ae298"]["page"]`).
- Fix: Always generate from `specs/api.yaml` (source), not `specs/api.bundled.yaml`.

**2. POST body requires server-assigned fields**
- Problem: Without `--read-write-markers`, POST body type includes `id`, `status`, `createdAt` as required.
- Fix: Always use `--read-write-markers`.

**3. Committed generated types cause merge conflicts**
- Problem: `generated/api-types.d.ts` drifts and creates conflicts.
- Fix: `generated/` is in `.gitignore`. Run `npm run types` after spec changes. Consider `"postinstall": "npm run types"`.

**4. tsconfig includes generated types directly**
- Problem: Adding `generated/**/*.d.ts` to tsconfig `include` surfaces internal type artifacts.
- Fix: Only include source files. Types are pulled in via `import type` statements.

**5. Missing X-API-Key header returns 401**
- Problem: The spec enforces security. Prism rejects unauthenticated requests.
- Fix: Set `headers: { "X-API-Key": "your-api-key-here" }` in `createClient`. For OAuth2, use an interceptor.

**6. Non-UUID orderId returns 422**
- Problem: The spec defines `orderId` as `format: uuid`. Prism validates this.
- Fix: Always use valid UUIDs (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).

## Multi-Environment Usage

The same client code works across environments — only `baseUrl` changes:

```typescript
const client = createClient<paths>({
  baseUrl: process.env.API_BASE_URL || "http://localhost:4010",
  headers: { "X-API-Key": process.env.API_KEY || "test-key" },
});
```

| Environment | `API_BASE_URL` |
|---|---|
| Dev (mock) | `http://localhost:4010` |
| QA | `https://qa.yourcompany.com/v1` |
| Acceptance | `https://acp.yourcompany.com/v1` |
| Production | `https://api.yourcompany.com/v1` |

## Alternatives

| Tool | When to use | Downloads/week |
|---|---|---|
| **@hey-api/openapi-ts** | Full generated SDK with method calls + TanStack Query / Zod plugins | ~2M |
| **Orval** | React-heavy team wanting generated TanStack Query / SWR hooks | ~1.1M |
| **openapi-generator-cli** | Traditional codegen, 50+ languages, Java dependency | ~1.2M |
| **Kiota (Microsoft)** | .NET ecosystem or Microsoft Graph patterns | ~52K |

## References

- openapi-typescript docs: https://openapi-ts.dev
- openapi-fetch docs: https://openapi-ts.dev/openapi-fetch/
- openapi-typescript GitHub: https://github.com/openapi-ts/openapi-typescript
- TypeScript handbook: https://www.typescriptlang.org/docs/
