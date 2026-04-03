# CI Testing Guide

Practical guide for running contract tests, functional tests, and quality checks in CI/CD pipelines. Based on lessons learned during scaffold implementation.

**Used by:** [`0001_prd_api-first-scaffold.md`](../product-specs/0001_prd_api-first-scaffold.md) (US-007, US-008, US-011)

---

## Testing Strategy Overview

| Layer | Tool | What it catches | Runs in |
|---|---|---|---|
| **Contract testing** | Schemathesis | Spec violations, edge cases, stateful inconsistencies | CI (Docker or GitHub Action) |
| **Negative testing** | Schemathesis `--mode=negative` | Missing validation, improper error handling | CI |
| **Functional testing** | Hurl | Business logic assertions, specific scenarios | CI + locally |
| **Linting** | Spectral | Convention, security, quality violations in the spec | CI + locally |
| **Breaking changes** | oasdiff | Field removal, type changes, renamed properties | CI (PR-only) |

### When each test runs

| Environment | What runs | Against |
|---|---|---|
| **Local (dev)** | Spectral lint, Hurl tests | Prism mock (localhost:4010) |
| **CI (every push)** | Spectral lint, Schemathesis, Hurl, type generation | Prism mock (in pipeline) |
| **CI (PR only)** | oasdiff breaking change detection | Spec diff (current vs main branch) |
| **QA** | Schemathesis, Hurl | Real API server |
| **Acceptance** | Schemathesis, Hurl | Real API server |

The same tests, same spec, same assertions — only the base URL changes between environments.

---

## Schemathesis (Contract Testing)

### What it does

Schemathesis auto-generates test cases from the OpenAPI spec. It fuzzes every endpoint with valid and invalid data, checks response schemas, status codes, content types, and headers — all without writing a single test.

### How to run locally (Docker)

```bash
# 1. Start the mock server
npm run mock &
sleep 3

# 2. Run contract tests
npm run test:contract

# 3. Run negative tests (sends invalid data, expects 4xx)
npm run test:contract:negative

# 4. Cleanup
kill $(lsof -t -i:4010) 2>/dev/null
```

### The npm scripts

```json
{
  "test:contract": "docker run --rm --network host -v $(pwd):/app schemathesis/schemathesis run /app/specs/order-api.bundled.yaml --base-url http://localhost:4010 --checks all --stateful=links --hypothesis-max-examples=100 --set-header 'X-API-Key: test-key'",
  "test:contract:negative": "docker run --rm --network host -v $(pwd):/app schemathesis/schemathesis run /app/specs/order-api.bundled.yaml --base-url http://localhost:4010 --checks all --mode=negative --hypothesis-max-examples=50 --set-header 'X-API-Key: test-key'"
}
```

### How to run in CI (GitHub Action)

```yaml
contract-test:
  runs-on: ubuntu-latest
  needs: lint
  steps:
    - uses: actions/checkout@v4
    - run: npm install
    - run: npx prism mock specs/order-api.bundled.yaml --port 4010 &
    - run: sleep 3
    - uses: schemathesis/action@v2
      with:
        schema: specs/order-api.bundled.yaml
        base-url: http://localhost:4010
        checks: all
        args: '--stateful=links --hypothesis-max-examples=100 --set-header "X-API-Key: test-key"'
```

No Docker needed in CI — the `schemathesis/action@v2` GitHub Action handles it.

### Key flags explained

| Flag | What it does | Why |
|---|---|---|
| `--checks all` | Enables all 5 built-in checks | Maximum coverage |
| `--stateful=links` | Follows OpenAPI `links` from POST response to GET/PUT | Tests create → get → update flows using real IDs from responses |
| `--hypothesis-max-examples=100` | Up to 100 test cases per endpoint | 6 endpoints × 100 = up to 600 total cases |
| `--set-header "X-API-Key: test-key"` | Passes authentication header | The spec enforces security — without this, all requests return 401 |
| `--mode=negative` | Sends schema-violating payloads | Verifies the API properly rejects invalid input with 4xx |

### The 5 built-in checks (`--checks all`)

| Check | What it verifies |
|---|---|
| `not_a_server_error` | No 5xx responses |
| `status_code_conformance` | Response status codes match what the spec declares |
| `content_type_conformance` | Response Content-Type matches the spec |
| `response_schema_conformance` | Response body matches the declared schema |
| `response_headers_conformance` | Response headers match the spec |

### Stateful testing with OpenAPI links

The spec defines `links` on the POST /orders 201 response:

```yaml
links:
  GetCreatedOrder:
    operationId: getOrder
    parameters:
      orderId: $response.body#/id
  UpdateCreatedOrder:
    operationId: updateOrder
    parameters:
      orderId: $response.body#/id
```

With `--stateful=links`, Schemathesis:
1. POST /orders → gets back `id: "a1b2c3d4-..."`
2. GET /orders/a1b2c3d4-... → uses the real ID from step 1
3. PUT /orders/a1b2c3d4-... → same real ID

This avoids UUID validation failures (Prism rejects non-UUID orderId values) and tests realistic multi-step workflows.

### Running against a real API (QA/Acceptance)

Same command, different base URL:

```bash
# Against QA
docker run --rm --network host schemathesis/schemathesis run \
  specs/order-api.bundled.yaml \
  --base-url https://qa.yourcompany.com/v1 \
  --checks all \
  --stateful=links \
  --hypothesis-max-examples=100 \
  --set-header "X-API-Key: $QA_API_KEY"

# Against Acceptance
docker run --rm --network host schemathesis/schemathesis run \
  specs/order-api.bundled.yaml \
  --base-url https://acp.yourcompany.com/v1 \
  --checks all \
  --stateful=links \
  --hypothesis-max-examples=100 \
  --set-header "X-API-Key: $ACP_API_KEY"
```

### Common issues

**1. 401 on all requests**
Forgot `--set-header "X-API-Key: test-key"`. The spec enforces security.

**2. 422 on path parameter endpoints**
The spec defines `orderId` as `format: uuid`. Schemathesis without `--stateful=links` generates random strings. Use `--stateful=links` to get valid IDs from POST responses.

**3. Schemathesis finds "failures" in the mock**
Prism's mock may not perfectly implement all spec edge cases (e.g., it may return 200 for a request that should return 404). These are mock limitations, not spec bugs. Run against the real API in QA to confirm.

**4. Test count seems low**
`--hypothesis-max-examples=100` is per endpoint, not total. With 6 endpoints, expect up to 600 test cases. Increase for more thorough testing: `--hypothesis-max-examples=500`.

---

## Hurl (Functional Testing)

### What it does

Hurl runs hand-written HTTP tests with assertions. Unlike Schemathesis (which generates random tests), Hurl validates specific business scenarios you define.

### How to run locally

```bash
# With Prism running on :4010
npm run test:hurl

# Verbose output (good for debugging)
hurl --test --very-verbose tests/orders.hurl

# JUnit XML output (for CI reporting)
hurl --test --report-junit generated/hurl-results.xml tests/orders.hurl
```

### Hurl test file structure

```hurl
# Test: Get single order returns expected shape
GET http://localhost:4010/orders/a1b2c3d4-e5f6-7890-abcd-ef1234567890
X-API-Key: test-key
HTTP 200
[Asserts]
jsonpath "$.id" exists
jsonpath "$.status" isString
jsonpath "$.customer.name" isString
jsonpath "$.customer.email" matches /\S+@\S+/
jsonpath "$.items" isCollection
jsonpath "$.items" count >= 1
jsonpath "$.total" isFloat
```

**Key points:**
- `X-API-Key: test-key` header is required (spec enforces security)
- Use UUID values for orderId (Prism validates format)
- `[Asserts]` section contains assertions — shape, types, patterns, counts
- Each test is separated by a blank line

### Schemathesis vs Hurl — complementary, not competing

| | Schemathesis | Hurl |
|---|---|---|
| **Test generation** | Automatic (1000+ from spec) | Hand-written |
| **What it catches** | Schema violations, edge cases, unexpected 5xx | Business logic errors, specific expected behavior |
| **Example** | "Does the API crash with a 50-char name?" | "When I create an order, status must be pending" |
| **Analogy** | Fuzzing / property-based testing | Scenario / acceptance testing |

**Use both:** Schemathesis catches what you didn't think of. Hurl validates what you specifically expect.

### Running against a real API

```bash
# Override the base URL with --variable
hurl --test --variable base_url=https://qa.yourcompany.com/v1 tests/orders.hurl
```

For this to work, Hurl test files should use `{{base_url}}` instead of hardcoded `http://localhost:4010`:

```hurl
GET {{base_url}}/orders/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

## Spectral (Linting in CI)

### How to run in CI

```yaml
lint:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: npm install
    - run: npm run lint
```

### What it catches

Three layers (see the Spectral ruleset at `rules/.spectral.yaml`):

1. **OpenAPI standard** — structural issues (25+ rules)
2. **OWASP security** — HTTPS, auth on writes, input limits, no API keys in URL
3. **Custom organizational** — kebab-case paths, verbNoun operationIds, tags required, etc.

### Failing the pipeline

Spectral exits with code 1 if any **error**-severity rule fails. Warnings produce output but don't fail the pipeline.

---

## oasdiff (Breaking Change Detection)

### How to run in CI (PR-only)

```yaml
breaking-changes:
  runs-on: ubuntu-latest
  if: github.event_name == 'pull_request'
  steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
    - run: |
        # Download oasdiff binary
        curl -sSL https://github.com/Tufin/oasdiff/releases/latest/download/oasdiff_linux_amd64 -o oasdiff
        chmod +x oasdiff
        # Compare current spec against main branch
        git show origin/main:scaffold-api/specs/order-api.yaml > /tmp/old-spec.yaml
        ./oasdiff breaking /tmp/old-spec.yaml scaffold-api/specs/order-api.yaml --fail-on ERR
```

### What it catches

| Change type | Example | Breaking? |
|---|---|---|
| Field removed | Delete `notes` from Order | Yes |
| Field renamed | `customer.name` → `customer.fullName` | Yes |
| Type changed | `quantity: integer` → `quantity: number` | Yes |
| Required field added | New required field on request body | Yes |
| Optional field added | New optional `trackingNumber` | No |
| Enum value added | Add `"returned"` to status enum | No |

### Exit codes

- `0` — no breaking changes (or only non-breaking changes)
- `1` — breaking changes detected → pipeline blocks the PR

---

## CI Pipeline Architecture

```
                    Spec change pushed
                          │
              ┌───────────┴───────────┐
              │                       │
         ┌────▼────┐           ┌──────▼──────┐
         │  Lint   │           │  Breaking   │
         │Spectral │           │  Changes    │
         │         │           │  (PR only)  │
         └────┬────┘           └──────┬──────┘
              │ pass                  │ no breaks
              │                       │
         ┌────▼────┐                  │
         │Contract │                  │
         │  Test   │◄─────────────────┘
         │Prism +  │
         │Schemathesis                │
         └────┬────┘                  │
              │ pass                  │
    ┌─────────┼─────────┐            │
    │         │         │            │
┌───▼───┐ ┌──▼──┐ ┌────▼───┐       │
│ Types │ │Docs │ │  Hurl  │       │
│  gen  │ │ gen │ │ Tests  │       │
└───┬───┘ └──┬──┘ └────┬───┘       │
    │        │         │            │
    └────────┴─────┬───┘            │
                   │                │
              ┌────▼────┐           │
              │Artifacts│           │
              │uploaded │           │
              └─────────┘           │
```

### Job dependencies

1. **lint** — always runs first
2. **breaking-changes** — runs on PRs only, in parallel with lint
3. **contract-test** — needs lint to pass
4. **generate-types**, **generate-docs**, **hurl-tests** — need contract-test to pass
5. **artifacts** — uploaded after generation

---

## Multi-Environment Testing

The same tests work across environments — only the base URL changes:

```bash
# Dev (mock)
npm run mock & sleep 3
npm run test:contract
npm run test:hurl

# QA
SCHEMATHESIS_BASE_URL=https://qa.example.com npm run test:contract
hurl --test --variable base_url=https://qa.example.com tests/orders.hurl

# Acceptance
SCHEMATHESIS_BASE_URL=https://acp.example.com npm run test:contract
hurl --test --variable base_url=https://acp.example.com tests/orders.hurl
```

Tests validate the same contract regardless of environment. If they pass against the mock but fail against QA, the implementation drifts from the spec — which is exactly what contract testing catches.

---

## References

- Schemathesis docs: https://schemathesis.readthedocs.io
- Schemathesis GitHub Action: https://github.com/schemathesis/action
- Schemathesis Docker: https://hub.docker.com/r/schemathesis/schemathesis
- Hurl docs: https://hurl.dev
- Spectral docs: https://docs.stoplight.io/docs/spectral
- oasdiff docs: https://github.com/Tufin/oasdiff
- OpenAPI stateful testing (links): https://schemathesis.readthedocs.io/en/stable/stateful.html
