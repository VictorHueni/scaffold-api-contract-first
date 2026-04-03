# Frontend Client Generation Guide

Practical guide for generating and using typed TypeScript API clients from OpenAPI specs. Based on lessons learned during scaffold implementation.

**Used by:** [`0001_prd_api-first-scaffold.md`](../product-specs/0001_prd_api-first-scaffold.md) (US-005)

---

## Stack

| Tool | Purpose | npm |
|---|---|---|
| **openapi-typescript** | Generate TypeScript types from OpenAPI spec | `openapi-typescript` (7.x) |
| **openapi-fetch** | Lightweight type-safe fetch wrapper (6kb) | `openapi-fetch` (0.17.x) |
| **TypeScript** | Type checking | `typescript` (5.x) |

This combination generates **types only** — no runtime code, no bloated SDK, no Java dependency. The `openapi-fetch` wrapper uses the generated types for autocompletion and compile-time safety.

---

## Generating Types

### Use the source spec, not the bundled spec

```bash
# CORRECT — use source spec (multi-file with $ref)
npx openapi-typescript specs/order-api.yaml -o generated/api-types.d.ts

# WRONG — bundled spec contains x-ext artifacts from Scalar CLI bundler
npx openapi-typescript specs/order-api.bundled.yaml -o generated/api-types.d.ts
```

**Why:** The Scalar CLI bundler (`scalar document bundle`) resolves `$ref` pointers and replaces `x-faker` extensions with internal `x-ext` hash references. These `x-ext` references generate invalid TypeScript type references (e.g., `x-ext["c8ae298"]["page"]`) that cause hundreds of compilation errors. `openapi-typescript` can resolve `$ref` pointers itself — let it work from the source files.

### Use --read-write-markers for proper POST/PUT body types

```bash
# CORRECT — separates readOnly fields from writable fields
npx openapi-typescript specs/order-api.yaml -o generated/api-types.d.ts --read-write-markers

# WITHOUT this flag — POST body type requires server-assigned fields (id, status, createdAt)
npx openapi-typescript specs/order-api.yaml -o generated/api-types.d.ts
```

**Why:** OpenAPI specs mark server-assigned fields with `readOnly: true` (e.g., `id`, `status`, `total`, `createdAt`, `updatedAt`). Without `--read-write-markers`, the generated POST/PUT body type includes these fields as required — you'd have to provide an `id` when creating an order, which makes no sense. With the flag, `openapi-fetch` automatically uses the `$Write` variant for request bodies and the `$Read` variant for responses.

### The npm script

```json
{
  "types": "openapi-typescript specs/order-api.yaml -o generated/api-types.d.ts --read-write-markers"
}
```

### Other useful flags

| Flag | When to use |
|---|---|
| `--enum` | Export true TypeScript enums instead of string unions. Use if your codebase prefers enums. |
| `--immutable` | Generate `readonly` on all properties. Use for strict immutability. |
| `--export-type` | Export `type` instead of `interface` at top level. Use if you prefer types over interfaces. |
| `--path-params-as-types` | Convert path parameters to template literal types. Enables `client.GET("/orders/${id}")` without params object. |
| `--alphabetize` | Sort object keys alphabetically. Makes diffs cleaner. |
| `--root-types` | Export schema types at root level (not nested under `components.schemas`). Enables `import type { Order } from "./api-types"`. |

---

## Using openapi-fetch

### Basic setup

```typescript
import createClient from "openapi-fetch";
import type { paths } from "../generated/api-types";

const client = createClient<paths>({
  baseUrl: "http://localhost:4010",
  headers: {
    "X-API-Key": "your-api-key-here",
  },
});
```

### GET with query parameters

```typescript
const { data, error } = await client.GET("/orders", {
  params: {
    query: {
      page: 1,
      limit: 20,
      status: "pending",  // TypeScript knows this must be a valid enum value
    },
  },
});

// data is fully typed — IDE shows all fields with autocompletion
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
        street: "123 Main St",
        city: "Zurich",
        state: "ZH",
        postalCode: "8001",
        country: "CH",
      },
    },
    items: [
      {
        productId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        productName: "Wireless Headphones",
        quantity: 1,
        unitPrice: 89.99,
      },
    ],
    currency: "CHF",
    notes: "Please deliver before noon",
    // id, status, total, createdAt, updatedAt are NOT required here
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

// data is guaranteed to be defined here (TypeScript narrows the type)
console.log(data.id);
```

---

## TypeScript Configuration

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

**Key settings:**
- `moduleResolution: "bundler"` — required for `openapi-fetch` imports to resolve correctly
- `skipLibCheck: true` — skips type checking of `.d.ts` files in `node_modules`; without this, some `openapi-fetch` internal types may cause errors
- `noEmit: true` — this is a type-checking config, not a build config; your bundler (Vite, webpack, etc.) handles transpilation
- `include` does NOT include `generated/**/*.d.ts` — the generated types are pulled in via `import type { paths }` in your source files; adding them to `include` would cause them to be type-checked directly, which can surface internal type issues

---

## Common Pitfalls

### 1. Don't generate from the bundled spec

**Problem:** `scalar document bundle` creates `x-ext` hash references for resolved extensions. These generate invalid TypeScript.

**Fix:** Always generate from the source spec (`specs/order-api.yaml`). `openapi-typescript` resolves `$ref` pointers internally.

### 2. Don't forget --read-write-markers

**Problem:** Without this flag, POST body types require `id`, `status`, `createdAt` — fields the server assigns.

**Fix:** Always use `--read-write-markers`. This makes `openapi-fetch` use `$Write` types for request bodies and `$Read` types for responses automatically.

### 3. Don't commit generated types

**Problem:** `generated/api-types.d.ts` is derived from the spec. Committing it creates merge conflicts and stale types.

**Fix:** The `generated/` directory is in `.gitignore`. Run `npm run types` after `npm install` or when the spec changes. Consider adding it to a `postinstall` script:

```json
{
  "scripts": {
    "postinstall": "npm run types"
  }
}
```

### 4. Don't include generated types in tsconfig include

**Problem:** Adding `generated/**/*.d.ts` to tsconfig `include` makes tsc type-check the generated file directly, which can surface internal type artifacts.

**Fix:** Only include your source files (`examples/**/*.ts`, `src/**/*.ts`). The generated types are pulled in via `import type` statements.

### 5. Security headers in API calls

**Problem:** The spec defines security schemes (API key, OAuth2). Prism enforces them. Forgetting the `X-API-Key` header returns 401.

**Fix:** Set headers in `createClient`:

```typescript
const client = createClient<paths>({
  baseUrl: "http://localhost:4010",
  headers: { "X-API-Key": "your-api-key-here" },
});
```

For OAuth2, use an interceptor to attach the bearer token dynamically.

### 6. UUID format for path parameters

**Problem:** The spec defines `orderId` as `format: uuid`. Prism validates this — non-UUID strings return 422.

**Fix:** Always use valid UUIDs for order IDs:

```typescript
// WRONG — Prism returns 422
client.GET("/orders/{orderId}", { params: { path: { orderId: "test-123" } } });

// CORRECT
client.GET("/orders/{orderId}", { params: { path: { orderId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" } } });
```

---

## Alternatives

If `openapi-typescript` + `openapi-fetch` don't fit your needs:

| Tool | When to use | npm downloads/week |
|---|---|---|
| **@hey-api/openapi-ts** | Want a full generated SDK with method calls, not just types. Plugin system supports TanStack Query, Zod validation. | ~2M |
| **Orval** | React-heavy team wanting generated TanStack Query / SWR hooks directly from the spec. | ~1.1M |
| **openapi-generator-cli (typescript-fetch)** | Need a traditional code generator supporting 50+ languages. Java dependency, heavier output. | ~1.2M |
| **Kiota (Microsoft)** | .NET ecosystem or Microsoft Graph API patterns. | ~52K |

---

## References

- openapi-typescript docs: https://openapi-ts.dev
- openapi-fetch docs: https://openapi-ts.dev/openapi-fetch/
- openapi-typescript GitHub: https://github.com/openapi-ts/openapi-typescript
- TypeScript handbook: https://www.typescriptlang.org/docs/
