---
title: QA Testing Setup
description: Set up and run contract tests, functional tests, and API exploration for quality assurance
audience: [qa]
tools: [hurl, schemathesis, prism, docker]
prd: "0001"
user-stories: [US-007, US-008]
last-updated: 2026-04-03
---

# QA Testing Setup

> Run functional tests and contract tests against the API — locally with native tools or Docker fallbacks, and automatically in CI.

## Quick Start

```bash
npm install                            # Install all tools
npm run mock &                         # Start mock server (background)
sleep 3
npm run test:hurl:docker               # Functional tests (Docker — no install needed)
npm run test:contract                  # Contract tests (Docker — 600+ auto-generated)
kill $(lsof -t -i:4010) 2>/dev/null   # Cleanup
```

No Hurl install, no Python, no system libraries. Just Node.js + Docker.

## Overview

This guide covers setting up the full QA testing workflow. The scaffold provides three types of automated testing — all driven from the same OpenAPI spec:

1. **Functional tests (Hurl)** — hand-written scenario assertions ("when I create an order, status must be pending")
2. **Contract tests (Schemathesis)** — auto-generated from the spec (600+ tests, zero hand-written)
3. **API exploration (Scalar "Try it out")** — interactive playground in the browser

**Who this is for:** QA engineers testing the API locally and setting up test automation.

## Prerequisites

### What installs automatically

These tools install via `npm install` — no extra setup:

| Tool | What it does | Installed by |
|---|---|---|
| **Prism** | Mock server — returns spec examples or x-faker data | `npm install` |
| **Spectral** | Spec linting (not QA's concern, but available) | `npm install` |
| **Scalar CLI** | API docs with "Try it out" playground | `npm install` |

### What needs extra setup

These tools need additional installation. Each has a Docker fallback:

| Tool | Native install | Docker fallback | Needed for |
|---|---|---|---|
| **Hurl** | `brew install hurl` (macOS) or [download binary](https://hurl.dev/docs/installation.html) | `npm run test:hurl:docker` | Functional tests |
| **Schemathesis** | Not needed locally — always runs via Docker | `npm run test:contract` | Contract tests |
| **oasdiff** | `brew install oasdiff` or [download binary](https://github.com/Tufin/oasdiff/releases) | `npm run breaking:docker` | Breaking change detection |

### The Docker fallback story

Docker solves the "it won't install on my machine" problem for all three tools:

```bash
# Instead of installing Hurl natively:
npm run test:hurl           # Requires: brew install hurl (may fail on some systems)
npm run test:hurl:docker    # Requires: Docker only (always works)

# Schemathesis always uses Docker:
npm run test:contract       # Requires: Docker

# oasdiff via Docker:
npm run breaking:docker     # Requires: Docker
```

**Why some tools aren't npm packages:**
- **Hurl** is a Rust binary. It depends on system C libraries (`libxml2`). On macOS with Homebrew it installs cleanly. On Linux without sudo or on WSL, the binary may fail with missing shared libraries. The Docker fallback avoids this.
- **Schemathesis** is a Python tool. To avoid a Python/pip/venv dependency, it runs via Docker exclusively.
- **oasdiff** is a Go binary. No runtime dependencies — the native binary usually works, but Docker is available as a fallback.

### DX summary by setup level

| Setup level | What you can do | What you need |
|---|---|---|
| **`npm install` only** | Mock server, spec linting, API docs, TypeScript types | Node.js 18+ |
| **+ Docker** | All of the above + contract tests, functional tests, breaking changes | Node.js + Docker |
| **+ Hurl native** | Faster functional tests (no Docker overhead) | Node.js + Docker + `brew install hurl` |

For most QA work, **Node.js + Docker** covers everything.

## How It Works

### 1. Start the mock server

```bash
npm run mock &              # Static mode — returns spec examples
# or
npm run mock:dynamic &      # Dynamic mode — x-faker generates different data each call
```

The mock server runs on `http://localhost:4010`. It:
- Returns example responses from the spec (static mode)
- Returns different realistic data on each call (dynamic mode, uses `x-faker`)
- Validates request bodies against the spec (rejects invalid data with 400)
- Enforces security (requires `X-API-Key: test-key` header)
- Validates path parameters (orderId must be UUID format)

### 2. Run functional tests (Hurl)

```bash
# Native (if Hurl is installed):
npm run test:hurl

# Docker fallback (no install needed):
npm run test:hurl:docker

# Verbose output (good for debugging):
hurl --test --very-verbose tests/orders.hurl

# JUnit XML output (for CI reporting):
hurl --test --report-junit generated/hurl-results.xml tests/orders.hurl
```

The test file (`tests/orders.hurl`) contains 5 scenarios:

| Test | What it checks | Expected |
|---|---|---|
| List orders | GET /orders with pagination params | 200, data array, pagination object |
| Get single order | GET /orders/{uuid} with shape assertions | 200, all required fields present with correct types |
| Create order | POST /orders with valid body | 201, id exists, status is string |
| Missing field | POST /orders without required `items` | 400 (validation error) |
| Non-existent order | GET /orders/{zero-uuid} | 200 against mock (documented limitation — real API returns 404) |

### 3. Run contract tests (Schemathesis)

```bash
npm run test:contract                  # Positive tests (600+ cases)
npm run test:contract:negative         # Negative tests (sends invalid data)
```

Schemathesis auto-generates test cases from the spec. No hand-written tests. It:
- Fuzzes every endpoint with valid data matching the schema
- Checks response status codes, schemas, content types, headers
- Follows OpenAPI `links` — creates an order (POST), then fetches it (GET) using the returned ID
- In negative mode, sends schema-violating data and verifies 4xx rejection

### 4. Explore the API (Scalar)

```bash
npm run docs                           # Start Scalar docs with live reload
# Open http://localhost:8081
```

Click "Try it out" on any endpoint. Select from named examples (e.g., "Pending order", "Shipped order with tracking"). Send requests against the mock server directly from the docs.

### 5. Import into a desktop client (optional)

Import `specs/order-api.yaml` (or `specs/order-api.bundled.yaml`) into any API client:
- Bruno, Postman, Insomnia, Hoppscotch, Yaak
- All endpoints, parameters, and request bodies are pre-filled from the spec
- The scaffold doesn't mandate a specific client — use what you prefer

## Configuration

### npm scripts

```json
{
  "mock":                   "prism mock specs/order-api.bundled.yaml --port 4010",
  "mock:dynamic":           "prism mock -d specs/order-api.bundled.yaml --port 4010",
  "test:hurl":              "hurl --test tests/**/*.hurl",
  "test:hurl:docker":       "docker run --rm --network host -v $(pwd):/app ghcr.io/orange-opensource/hurl:latest --test /app/tests/**/*.hurl",
  "test:contract":          "docker run --rm --network host -v $(pwd):/app schemathesis/schemathesis run /app/specs/order-api.bundled.yaml --base-url http://localhost:4010 --checks all --stateful=links --hypothesis-max-examples=100 --set-header 'X-API-Key: test-key'",
  "test:contract:negative": "docker run --rm --network host -v $(pwd):/app schemathesis/schemathesis run /app/specs/order-api.bundled.yaml --base-url http://localhost:4010 --checks all --mode=negative --hypothesis-max-examples=50 --set-header 'X-API-Key: test-key'",
  "breaking:docker":        "docker run --rm -v $(pwd):/app tufin/oasdiff breaking /app/specs/order-api.yaml /app/specs/order-api-v2.yaml"
}
```

### Hurl test file conventions

```hurl
# Every request needs the API key
GET http://localhost:4010/orders/a1b2c3d4-e5f6-7890-abcd-ef1234567890
X-API-Key: test-key
HTTP 200
[Asserts]
jsonpath "$.id" isString
jsonpath "$.status" == "pending"
```

Key conventions:
- `X-API-Key: test-key` on every request (spec enforces security)
- Use valid UUIDs for orderId (Prism validates `format: uuid`)
- Separate tests with two blank lines
- Comment each test with its purpose

## Common Pitfalls

**1. Hurl binary won't install — missing libxml2**
- Problem: `hurl: error while loading shared libraries: libxml2.so.2` on Linux/WSL without sudo.
- Fix: Use `npm run test:hurl:docker` instead. Same tests, runs in Docker, no system library issues.

**2. All requests return 401**
- Problem: Forgot the `X-API-Key: test-key` header.
- Fix: Every Hurl test and Schemathesis command must include the auth header. Schemathesis uses `--set-header "X-API-Key: test-key"`.

**3. orderId returns 422 "must match format uuid"**
- Problem: Used a non-UUID string like `test-123` for orderId.
- Fix: Always use valid UUIDs (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).

**4. Prism returns 200 for non-existent resources**
- Problem: GET /orders/{random-uuid} returns 200 with the example, not 404.
- Fix: This is a mock limitation — Prism is stateless and returns examples for any valid path. Against a real API, this would be 404. The Hurl test documents this with a comment.

**5. Schemathesis finds "failures" in the mock**
- Problem: Prism may not perfectly implement all spec edge cases.
- Fix: Mock failures may be Prism limitations, not spec bugs. Run against the real API in QA to confirm.

**6. Docker `--network host` doesn't work on macOS**
- Problem: Docker on macOS doesn't support `--network host`. Schemathesis and Hurl Docker containers can't reach `localhost:4010`.
- Fix: Use `host.docker.internal` instead of `localhost`:
  ```bash
  docker run --rm -v $(pwd):/app schemathesis/schemathesis run \
    /app/specs/order-api.bundled.yaml \
    --base-url http://host.docker.internal:4010 \
    --checks all --set-header "X-API-Key: test-key"
  ```

**7. Contract tests are slow**
- Problem: `--hypothesis-max-examples=100` per endpoint takes time.
- Fix: Reduce to 20 for quick local feedback: `--hypothesis-max-examples=20`. Keep 100+ for CI.

## Multi-Environment Usage

Same tests, different base URL:

| Environment | Mock target | How to run |
|---|---|---|
| **Dev (mock)** | `http://localhost:4010` | `npm run mock & npm run test:hurl` |
| **QA (real API)** | `https://qa.yourcompany.com/v1` | `hurl --test --variable base_url=https://qa.yourcompany.com/v1 tests/orders.hurl` |
| **Acceptance** | `https://acp.yourcompany.com/v1` | Same pattern with acceptance URL |

For Hurl to support variable base URLs, update test files to use `{{base_url}}`:
```hurl
GET {{base_url}}/orders/a1b2c3d4-e5f6-7890-abcd-ef1234567890
X-API-Key: {{api_key}}
```

Then run: `hurl --test --variable base_url=https://qa.example.com --variable api_key=$QA_KEY tests/orders.hurl`

For Schemathesis, change `--base-url`:
```bash
docker run --rm schemathesis/schemathesis run \
  specs/order-api.bundled.yaml \
  --base-url https://qa.yourcompany.com/v1 \
  --checks all --set-header "X-API-Key: $QA_KEY"
```

## Alternatives

| Tool | When to use |
|---|---|
| **step-ci** | Node.js-based alternative to Hurl. YAML test files. Installs via npm (no system binary). |
| **httpYac** | VS Code extension + CLI. `.http` files. Good for devs who prefer IDE-based testing. |
| **Dredd** | Runs spec examples against the API. Simpler than Schemathesis. No fuzzing. |
| **Pact** | Consumer-driven contract testing. Best when multiple consumers depend on the same API. |
| **Newman** | CLI runner for Postman collections. JUnit output. Postman JSON not Git-friendly. |

## References

- Hurl docs: https://hurl.dev
- Hurl installation: https://hurl.dev/docs/installation.html
- Hurl Docker images: https://github.com/Orange-OpenSource/hurl/pkgs/container/hurl
- Schemathesis docs: https://schemathesis.readthedocs.io
- Schemathesis Docker: https://hub.docker.com/r/schemathesis/schemathesis
- Schemathesis GitHub Action: https://github.com/schemathesis/action
- Prism docs: https://docs.stoplight.io/docs/prism
- oasdiff GitHub: https://github.com/Tufin/oasdiff
- Scalar API client: https://scalar.com/products/api-client
