---
title: API Conventions
description: Naming, structure, and design rules enforced by the scaffold's Spectral ruleset
audience: [frontend, backend, qa, devops]
tools: [spectral]
prd: "0001"
user-stories: [US-002, US-003]
last-updated: 2026-04-03
---

# API Conventions

> The rules every OpenAPI spec must follow. Enforced automatically by Spectral — if it violates a convention, the pipeline blocks it.

## Quick Reference

```bash
npm run lint                           # Check your spec against all conventions
npm run lint:bad                       # See what violations look like (demo)
```

## Overview

These conventions are enforced by three layers of Spectral rules (see `rules/.spectral.yaml`). They are not suggestions — the CI pipeline blocks any spec that violates an `error`-severity rule.

**Who this is for:** Everyone who writes, reviews, or consumes an OpenAPI spec.

---

## Naming Conventions

### Paths: kebab-case

```yaml
# CORRECT
/orders
/orders/{orderId}
/orders/{orderId}/items
/order-items
/shipping-addresses

# WRONG
/Orders              # PascalCase
/order_items         # snake_case
/orderItems          # camelCase
/getOrders           # verb in path (use HTTP method instead)
```

**Rule:** `paths-kebab-case` (error)
**Why:** URL paths are case-sensitive. Kebab-case is the REST convention, avoids confusion between `/orderItems` and `/order-items`.

### No trailing slashes

```yaml
# CORRECT
/orders
/orders/{orderId}

# WRONG
/orders/
/orders/{orderId}/
```

**Rule:** `path-keys-no-trailing-slash` (error)
**Why:** `/orders` and `/orders/` are different URLs. Trailing slashes cause routing issues and inconsistency.

### Properties: camelCase

```yaml
# CORRECT
properties:
  orderId:
  firstName:
  shippingAddress:
  unitPrice:

# WRONG
properties:
  order_id:           # snake_case
  FirstName:          # PascalCase
  UNIT_PRICE:         # UPPER_SNAKE
```

**Rule:** `camel-case-properties` (warn)
**Why:** JavaScript/TypeScript convention. Generated TypeScript types use the property names as-is — camelCase is idiomatic.

### operationId: verbNoun pattern

```yaml
# CORRECT
operationId: listOrders
operationId: getOrder
operationId: createOrder
operationId: updateOrder
operationId: deleteOrder
operationId: listOrderItems
operationId: searchCustomers
operationId: validatePayment

# WRONG
operationId: orders              # no verb
operationId: get_order           # snake_case
operationId: GetOrder            # PascalCase
operationId: fetchOrderData      # "fetch" not in allowed verbs
```

**Rule:** `operationId-pattern` (warn)
**Allowed verbs:** `list`, `get`, `create`, `update`, `delete`, `search`, `validate`, `cancel`, `submit`, `approve`, `reject`, `process`
**Why:** operationId drives code generation. `listOrders` becomes `client.listOrders()` in generated clients and `listOrders()` method in generated server interfaces. Consistent naming = consistent generated code.

---

## Structure Conventions

### Every operation must have an operationId

```yaml
# CORRECT
get:
  operationId: getOrder
  summary: Get an order by ID

# WRONG
get:
  summary: Get an order by ID
  # missing operationId
```

**Rule:** `operation-operationId` (error)
**Why:** operationId is required for code generation (client methods, server interfaces), documentation navigation, and OpenAPI links (stateful testing).

### Every operation must have tags

```yaml
# CORRECT
get:
  operationId: getOrder
  tags:
    - Orders

# WRONG
get:
  operationId: getOrder
  # missing tags
```

**Rule:** `operation-must-have-tag` (error)
**Why:** Tags group operations in generated documentation (Scalar, Swagger UI). Without tags, operations appear ungrouped and hard to navigate.

### GET 200 responses must define content

```yaml
# CORRECT
get:
  responses:
    "200":
      description: The order
      content:
        application/json:
          schema:
            $ref: "./components/schemas/Order.yaml"

# WRONG
get:
  responses:
    "200":
      description: The order
      # missing content — what does it return?
```

**Rule:** `get-must-return-body` (error)
**Why:** A GET endpoint that doesn't define its response body is useless for code generation, documentation, and contract testing.

### Request bodies must use $ref

```yaml
# CORRECT
post:
  requestBody:
    content:
      application/json:
        schema:
          $ref: "./components/schemas/Order.yaml"

# WRONG
post:
  requestBody:
    content:
      application/json:
        schema:
          type: object
          properties:
            name:
              type: string
            # inline schema — not reusable, not documented in components
```

**Rule:** `request-body-must-ref-component` (warn)
**Why:** Inline schemas create duplication, aren't visible in the components section of documentation, and make code generation produce anonymous types.

### Every operation should have error responses

```yaml
# CORRECT
post:
  responses:
    "201":
      description: Created
    "400":
      description: Validation error
      content:
        application/json:
          schema:
            $ref: "./components/schemas/ErrorResponse.yaml"
    "401":
      description: Unauthorized

# WRONG
post:
  responses:
    "201":
      description: Created
    # no error responses defined
```

**Rule:** `error-responses-required` (warn)
**Why:** Consumers need to know what errors to expect. Generated clients benefit from typed error responses. Contract tests validate error behavior.

---

## Quality Conventions

### Descriptions must not be empty

```yaml
# CORRECT
description: Retrieve the full details of a single order including all line items.

# WRONG
description: ""
description: " "
```

**Rule:** `no-empty-descriptions` (error)
**Why:** An empty description is worse than no description. It signals "someone was here and chose to say nothing." Either write a meaningful description or omit the field entirely.

### Schema properties should have examples

```yaml
# CORRECT
properties:
  email:
    type: string
    format: email
    example: "jane@example.com"

# WRONG
properties:
  email:
    type: string
    format: email
    # no example
```

**Rule:** `schema-properties-examples` (warn)
**Why:** Examples drive mock server responses (Prism static mode), documentation (Scalar "Try it out" pre-fill), and make the spec self-documenting.

### Use x-faker for dynamic mocking

```yaml
# RECOMMENDED
properties:
  email:
    type: string
    format: email
    example: "jane@example.com"       # For static docs/screenshots
    x-faker: internet.email           # For dynamic mocking (Prism -d mode)
  name:
    type: string
    example: "Jane Doe"
    x-faker: person.fullName
```

**Not enforced by Spectral** (no rule), but strongly recommended. `x-faker` gives Prism's dynamic mode realistic data — different on every call. Without it, dynamic mode generates random strings.

---

## Security Conventions

These are enforced by the OWASP Spectral ruleset layer.

### Servers must use HTTPS

```yaml
# CORRECT
servers:
  - url: https://api.example.com/v1

# WRONG
servers:
  - url: http://api.example.com/v1    # HTTP — insecure
```

**Rule:** `owasp:api8:2023-no-server-http` (error)
**Note:** The mock server (`http://localhost:4010`) is not listed in the servers block — it's accessed via `npm run mock`.

### POST/PUT/DELETE must have authentication

```yaml
# CORRECT (global security applies)
security:
  - apiKey: []

# WRONG
paths:
  /orders:
    post:
      security: []                     # Explicitly disables auth — flagged
```

**Rule:** `owasp:api2:2023-write-restricted` (error)
**Why:** Write operations without authentication are a critical security risk (OWASP API2:2023).

### API keys must not be in URL query parameters

```yaml
# CORRECT
components:
  securitySchemes:
    apiKey:
      type: apiKey
      in: header                       # In header — secure
      name: X-API-Key

# WRONG
components:
  securitySchemes:
    apiKey:
      type: apiKey
      in: query                        # In URL — leaks in logs, browser history, referrer headers
      name: api_key
```

**Rule:** `owasp:api2:2023-no-api-keys-in-url` (error)

### Arrays must define maxItems

```yaml
# CORRECT
items:
  type: array
  maxItems: 100
  items:
    $ref: "./OrderItem.yaml"

# WRONG
items:
  type: array
  items:
    $ref: "./OrderItem.yaml"
  # no maxItems — a client could send 10 million items
```

**Rule:** `owasp:api4:2023-array-limit` (error)
**Why:** Unbounded arrays enable denial-of-service attacks (OWASP API4:2023).

### Strings should define maxLength

```yaml
# CORRECT
notes:
  type: string
  maxLength: 500

# ACCEPTABLE (format implies length)
createdAt:
  type: string
  format: date-time

# WRONG
notes:
  type: string
  # no maxLength — a client could send a 1GB string
```

**Rule:** `owasp:api4:2023-string-limit` (warn)

---

## Multi-File Spec Conventions

### Schemas live in separate files

```
specs/
  order-api.yaml                       # Main spec — paths + $ref pointers
  components/
    schemas/
      Order.yaml                       # One file per schema
      Customer.yaml
      OrderItem.yaml
      ErrorResponse.yaml
    examples/
      responses/                       # Named examples per endpoint
      requests/                        # Request body examples
      errors/                          # Error response examples
    parameters/
      pagination.yaml                  # Reusable parameter sets
```

**Why:** Keeps the main spec clean and readable. Schemas, examples, and parameters are independently editable and reviewable.

### $ref paths are relative

```yaml
# CORRECT
schema:
  $ref: "./components/schemas/Order.yaml"

# WRONG
schema:
  $ref: "/absolute/path/to/Order.yaml"
  $ref: "https://example.com/schemas/Order.yaml"
```

### Bundle before consuming

```bash
npm run bundle
# Produces specs/order-api.bundled.yaml — single file for Prism, openapi-generator, Scalar
```

Most downstream tools (Prism, openapi-generator, Scalar) work with the bundled spec. Exception: `openapi-typescript` works better with the source spec (see [Frontend Guide](frontend-client-generation.md#how-it-works)).

---

## ID and Format Conventions

### IDs use UUID format

```yaml
properties:
  id:
    type: string
    format: uuid
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

**Why:** Auto-increment integer IDs leak information (OWASP API1:2023). UUID is the convention for API-exposed identifiers. Prism validates UUID format on path parameters — non-UUID values return 422.

### Server-assigned fields are readOnly

```yaml
properties:
  id:
    type: string
    readOnly: true                     # Server assigns this
  status:
    type: string
    readOnly: true                     # Server manages this
  createdAt:
    type: string
    readOnly: true
  updatedAt:
    type: string
    readOnly: true
```

**Why:** Without `readOnly: true`, generated TypeScript POST body types require `id`, `status`, `createdAt` — fields the client can't provide. The `--read-write-markers` flag in `openapi-typescript` uses this to separate request and response types.

---

## Error Response Convention

### Use a consistent error schema

```yaml
# ErrorResponse.yaml — RFC 7807 inspired
type: object
required: [status, title]
properties:
  status:
    type: integer
    description: HTTP status code
  title:
    type: string
    description: Short error summary
  detail:
    type: string
    description: Human-readable explanation
  type:
    type: string
    format: uri
    description: Error type URI
  instance:
    type: string
    description: Request path that caused the error
  errors:
    type: array
    description: Field-level validation errors
    items:
      type: object
      properties:
        field:
          type: string
        message:
          type: string
```

**Why:** A consistent error format across all endpoints means consumers write one error handler, not one per endpoint.

---

## Rule Severity Quick Reference

| Severity | Meaning | CI impact |
|---|---|---|
| **error** | Must fix — pipeline blocks | Merge blocked |
| **warn** | Should fix — best practice | Pipeline passes, but visible in output |
| **info** | Suggestion | No impact |

### Error-severity rules (must fix)

- `operation-operationId` — operationId required
- `path-keys-no-trailing-slash` — no trailing slashes
- `paths-kebab-case` — kebab-case paths
- `operation-must-have-tag` — tags required
- `get-must-return-body` — GET must define response content
- `no-empty-descriptions` — no empty descriptions
- `owasp:api8:2023-no-server-http` — HTTPS servers
- `owasp:api2:2023-write-restricted` — auth on writes
- `owasp:api2:2023-no-api-keys-in-url` — no API keys in URL
- `owasp:api4:2023-array-limit` — arrays need maxItems

### Warn-severity rules (should fix)

- `operationId-pattern` — verbNoun pattern
- `camel-case-properties` — camelCase property names
- `schema-properties-examples` — examples on properties
- `error-responses-required` — error responses defined
- `request-body-must-ref-component` — $ref not inline
- `owasp:api4:2023-string-limit` — strings need maxLength
- `owasp:api3:2023-no-additionalProperties` — set additionalProperties: false
- `owasp:api4:2023-rate-limit-responses-429` — define 429 responses

## References

- Spectral ruleset: `rules/.spectral.yaml` (in the scaffold)
- OpenAPI 3.1 spec: https://spec.openapis.org/oas/v3.1.0
- OWASP API Security Top 10: https://owasp.org/API-Security/
- Spectral OWASP ruleset: https://github.com/stoplightio/spectral-owasp-ruleset
- JSON Schema 2020-12: https://json-schema.org/specification
- RFC 7807 (Problem Details): https://www.rfc-editor.org/rfc/rfc7807
