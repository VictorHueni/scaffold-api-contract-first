# Manual Smoke Test

Copy-paste curl commands to walk through every scaffold feature locally. Start to finish in ~10 minutes.

## Prerequisites

- Node.js 18+
- Docker (optional — for contract tests, Hurl via Docker, breaking change detection)

## Step 1 — Install and bundle

```bash
cd scaffold-api
npm install
npm run bundle
```

## Step 2 — Lint the spec

```bash
# Should pass clean
npm run lint

# Intentionally bad spec — shows what violations look like
npm run lint:bad
```

## Step 3 — Start the mock server

```bash
npm run mock
```

Leave this running. Open a **second terminal** for the curl commands below.

> For randomized faker data instead of static examples: `npm run mock:dynamic`

## Step 4 — Hit the API with curl

### List orders (GET /orders)

```bash
curl -s "http://localhost:4010/orders?page=1&limit=20" \
  -H "X-API-Key: test-key" | jq .
```

Expected: 200 with `data` array and `pagination` object.

### Get a single order (GET /orders/{orderId})

The `orderId` path parameter requires **UUID format**.

```bash
curl -s http://localhost:4010/orders/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "X-API-Key: test-key" | jq .
```

Expected: 200 with a full order object (id, customer, items, status, total, createdAt).

### Create an order (POST /orders)

```bash
curl -s -X POST http://localhost:4010/orders \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key" \
  -d '{
    "customer": {
      "name": "Bob Williams",
      "email": "bob.williams@example.com",
      "shippingAddress": {
        "street": "789 Pine Road",
        "city": "Austin",
        "state": "TX",
        "postalCode": "73301",
        "country": "US"
      }
    },
    "items": [
      {
        "productId": "4d5e6f7a-8b9c-0123-defa-234567890123",
        "productName": "USB-C Charging Cable",
        "quantity": 1,
        "unitPrice": 12.99
      }
    ]
  }' | jq .
```

Expected: 201 with the created order (status "pending", server-generated id/total/createdAt).

### Create a multi-item order (POST /orders)

```bash
curl -s -X POST http://localhost:4010/orders \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key" \
  -d '{
    "customer": {
      "name": "Carol Martinez",
      "email": "carol.martinez@example.com",
      "phone": "+15553216789",
      "shippingAddress": {
        "street": "321 Maple Drive, Suite 100",
        "city": "Chicago",
        "state": "IL",
        "postalCode": "60601",
        "country": "US"
      }
    },
    "items": [
      {
        "productId": "5e6f7a8b-9c0d-1234-efab-345678901234",
        "productName": "Mechanical Keyboard",
        "quantity": 1,
        "unitPrice": 129.99
      },
      {
        "productId": "6f7a8b9c-0d1e-2345-fabc-456789012345",
        "productName": "Wireless Mouse",
        "quantity": 2,
        "unitPrice": 39.99
      },
      {
        "productId": "7a8b9c0d-1e2f-3456-abcd-567890123456",
        "productName": "Mouse Pad XL",
        "quantity": 1,
        "unitPrice": 19.99
      }
    ],
    "notes": "Gift wrap all items please.",
    "currency": "EUR"
  }' | jq .
```

### Update an order (PUT /orders/{orderId})

```bash
curl -s -X PUT http://localhost:4010/orders/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key" \
  -d '{
    "customer": {
      "name": "Alice Johnson",
      "email": "alice.johnson@example.com",
      "shippingAddress": {
        "street": "456 Oak Avenue",
        "city": "Portland",
        "state": "OR",
        "postalCode": "97201",
        "country": "US"
      }
    },
    "items": [
      {
        "productId": "2b3c4d5e-6f7a-8901-bcde-f12345678901",
        "productName": "Stainless Steel Water Bottle",
        "quantity": 3,
        "unitPrice": 24.99
      }
    ],
    "trackingNumber": "9400111899223100012345",
    "notes": "Shipped via USPS Priority Mail."
  }' | jq .
```

### Delete an order (DELETE /orders/{orderId})

```bash
curl -s -X DELETE http://localhost:4010/orders/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "X-API-Key: test-key" -w "\nHTTP status: %{http_code}\n"
```

Expected: 204 No Content.

### Trigger a validation error (POST with missing required field)

```bash
curl -s -X POST http://localhost:4010/orders \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key" \
  -d '{
    "customer": {
      "name": "Incomplete Order",
      "email": "incomplete@example.com",
      "shippingAddress": {
        "street": "123 Missing Items Street",
        "city": "Nowhere",
        "state": "CA",
        "postalCode": "90210",
        "country": "US"
      }
    }
  }' | jq .
```

Expected: 400 with a validation error body (missing `items` array).

## Step 5 — Browse API docs (Scalar)

```bash
npm run docs
```

Opens interactive docs at http://localhost:8081 with live reload.

To use "Try it out":

1. In the Scalar UI, open the **server dropdown** (top of the page) and select **"Local mock server (Prism)"** (`http://localhost:4010`)
2. Open the **Authentication** section and enter any value (e.g., `test-key`) as the API key
3. Now "Try it out" sends requests to your local Prism mock

> If you skip the server selection, Scalar defaults to `https://dev.api.example.com/v1` which doesn't exist — you'll get a 403 or network error.

## Step 6 — Generate TypeScript types

```bash
npm run types
cat generated/api-types.d.ts | head -50
```

## Step 7 — Run functional tests

With the mock server still running on :4010:

> **Important:** Hurl tests assert on exact values from the spec examples (specific UUIDs, status `"pending"`, etc.). They only pass against **static mode** (`npm run mock`). If you started the mock with `npm run mock:dynamic`, the tests will fail because Prism returns randomized faker data instead of the fixed examples.

```bash
# Native (requires hurl binary)
npm run test:hurl

# Docker fallback (no install needed)
npm run test:hurl:docker
```

## Step 8 — Run contract tests (Docker)

```bash
npm run test:contract
```

Schemathesis generates ~600 requests from the spec and validates all responses. Requires Docker + mock server on :4010.

> **Mock vs real API:** `test:contract` uses a reduced set of checks (schema conformance, status codes, content types, no server errors) that are meaningful against a stateless mock. Prism doesn't enforce auth, doesn't track state (use-after-free), and returns 405 without `Allow` headers — so checks like `ignored_auth`, `use_after_free`, and `unsupported_method` will false-positive against it. When testing against a **real API implementation**, use `npm run test:contract:full` which enables all checks.

For negative testing (sends invalid data, verifies the API rejects it):

```bash
npm run test:contract:negative
```

| Command | Use against | Checks |
|---|---|---|
| `npm run test:contract` | Mock server (Prism) | Mock-compatible subset |
| `npm run test:contract:full` | Real API implementation | All checks |
| `npm run test:contract:negative` | Mock server (Prism) | Mock-compatible subset, invalid data |

## Step 9 — Breaking change detection (Docker)

```bash
npm run breaking:docker
```

Compares `api.yaml` vs `api-v2.yaml` and reports what would break consumers.

## Step 10 — Generate Spring Boot stubs (requires Java 11+)

```bash
npm run stubs
ls generated/server-spring/src/main/java/org/openapitools/api/
```

## Gotchas

- **orderId must be UUID** — `ord-001` will get a 422. Use `a1b2c3d4-e5f6-7890-abcd-ef1234567890`.
- **POST body needs a full `customer` object** — not just a `customerId` string.
- **`productId` must be UUID** — same format constraint as orderId.
- **Prism is stateless** — POST doesn't actually create anything; GET always returns the same examples. This is expected for a mock server.
- **X-API-Key header is required** — the spec enforces API key security. Use any value (e.g., `test-key`).
- **Bundle first** — `npm run mock` reads the bundled spec. If you edit the spec, re-run `npm run bundle`.
