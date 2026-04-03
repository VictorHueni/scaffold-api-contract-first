---
title: CI Testing & Quality Gates
description: Run contract tests, functional tests, linting, and breaking change detection in CI/CD pipelines
audience: [devops]
tools: [schemathesis, hurl, spectral, oasdiff, prism, github-actions]
prd: "0001"
user-stories: [US-007, US-008, US-009, US-010, US-011]
last-updated: 2026-04-03
---

# CI Testing & Quality Gates

> Same tests, same spec, same assertions across all environments. Only the base URL changes.

## Quick Start

```bash
npm run lint                           # Lint spec (3-layer Spectral)
npm run mock &                         # Start Prism mock server
sleep 3
npm run test:contract                  # Schemathesis contract tests (Docker required)
npm run test:contract:negative         # Negative tests (sends invalid data)
hurl --test tests/orders.hurl          # Hurl functional tests
npm run breaking:docker                # Breaking change detection (Docker)
kill $(lsof -t -i:4010) 2>/dev/null   # Cleanup
```

## Overview

This guide covers running the full quality gate pipeline: contract testing (Schemathesis), functional testing (Hurl), linting (Spectral), and breaking change detection (oasdiff). All tools derive their expectations from the same OpenAPI spec — no hand-written test logic for contract validation.

**Who this is for:** QA engineers setting up test automation and DevOps engineers configuring CI pipelines.

## Prerequisites

| Tool | Version | Install | Required? |
|---|---|---|---|
| Node.js | 18+ | System install | Yes |
| Docker | Latest | System install | For Schemathesis locally (not needed in CI — GitHub Action) |
| Hurl | 5.x | `brew install hurl` or GitHub releases | For functional tests |
| oasdiff | Latest | `brew install oasdiff` or GitHub releases | For breaking change detection |
| Prism | 5.x | `devDependency` (already in package.json) | Yes (mock target for tests) |
| Spectral | 6.x | `devDependency` (already in package.json) | Yes |

## How It Works

### Testing strategy

| Layer | Tool | What it catches | How many tests |
|---|---|---|---|
| **Contract** | Schemathesis | Schema violations, edge cases, stateful inconsistencies | 600+ auto-generated |
| **Negative** | Schemathesis `--mode=negative` | Missing validation, improper error handling | 300+ auto-generated |
| **Functional** | Hurl | Business logic assertions, specific expected behavior | Hand-written (5 in scaffold) |
| **Linting** | Spectral | Convention, security, quality violations in the spec itself | 40+ rules |
| **Breaking** | oasdiff | Field removal, type changes, renamed properties between versions | Diff-based |

### Schemathesis vs Hurl — complementary, not competing

| | Schemathesis | Hurl |
|---|---|---|
| Test generation | Automatic from spec | Hand-written |
| What it catches | "Does the API crash with a 50-char name?" | "When I create an order, status must be pending" |
| Analogy | Fuzzing / property-based testing | Scenario / acceptance testing |

**Use both:** Schemathesis catches what you didn't think of. Hurl validates what you specifically expect.

### Schemathesis contract tests

```bash
npm run test:contract
# Runs: docker run --rm --network host -v $(pwd):/app schemathesis/schemathesis run
#   /app/specs/order-api.bundled.yaml
#   --base-url http://localhost:4010
#   --checks all --stateful=links
#   --hypothesis-max-examples=100
#   --set-header "X-API-Key: test-key"
```

**Key flags:**

| Flag | What it does |
|---|---|
| `--checks all` | 5 checks: not_a_server_error, status_code_conformance, content_type_conformance, response_schema_conformance, response_headers_conformance |
| `--stateful=links` | Follows OpenAPI `links` — POST creates an order, GET uses the returned ID. Avoids UUID validation failures. |
| `--hypothesis-max-examples=100` | Up to 100 test cases per endpoint (6 endpoints = 600 max) |
| `--set-header "X-API-Key: test-key"` | The spec enforces security. Without this, all requests return 401. |
| `--mode=negative` | Sends schema-violating payloads to verify proper 4xx rejection |

### Hurl functional tests

```bash
hurl --test tests/orders.hurl                                          # Run tests
hurl --test --very-verbose tests/orders.hurl                           # Verbose output
hurl --test --report-junit generated/hurl-results.xml tests/orders.hurl # JUnit XML for CI
```

**Important Hurl conventions:**
- All requests include `X-API-Key: test-key` header
- All orderId values are valid UUIDs
- Prism returns 422 (not 400) for validation errors — documented in test comments
- Prism returns 200 for any valid UUID (stateless mock) — 404 test adapted accordingly

### Spectral linting

```bash
npm run lint                           # Lint good spec — expect 0 errors
npm run lint:bad                       # Lint bad spec — expect 8+ violations
```

Three layers: OpenAPI standard (25+ rules) + OWASP security (7 rules) + custom organizational (9 rules). See `rules/.spectral.yaml`.

### Breaking change detection

```bash
npm run breaking                       # Native oasdiff (if installed)
npm run breaking:docker                # Docker fallback
# Exit code 1 = breaking changes found
```

In CI, compare current spec against the main branch:

```bash
git show origin/main:scaffold-api/specs/order-api.yaml > /tmp/old-spec.yaml
oasdiff breaking /tmp/old-spec.yaml specs/order-api.yaml --fail-on ERR
```

## Configuration

### npm scripts

```json
{
  "lint":                   "spectral lint specs/order-api.yaml --ruleset rules/.spectral.yaml --ignore-unknown-format",
  "lint:bad":               "spectral lint specs/order-api-bad.yaml --ruleset rules/.spectral.yaml --ignore-unknown-format",
  "test:contract":          "docker run --rm --network host -v $(pwd):/app schemathesis/schemathesis run /app/specs/order-api.bundled.yaml --base-url http://localhost:4010 --checks all --stateful=links --hypothesis-max-examples=100 --set-header 'X-API-Key: test-key'",
  "test:contract:negative": "docker run --rm --network host -v $(pwd):/app schemathesis/schemathesis run /app/specs/order-api.bundled.yaml --base-url http://localhost:4010 --checks all --mode=negative --hypothesis-max-examples=50 --set-header 'X-API-Key: test-key'",
  "test:hurl":              "hurl --test tests/**/*.hurl"
}
```

### GitHub Actions pipeline

```yaml
lint:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: npm install
    - run: npm run lint

breaking-changes:
  runs-on: ubuntu-latest
  if: github.event_name == 'pull_request'
  steps:
    - uses: actions/checkout@v4
      with: { fetch-depth: 0 }
    - run: |
        curl -sSL https://github.com/Tufin/oasdiff/releases/latest/download/oasdiff_linux_amd64 -o oasdiff && chmod +x oasdiff
        git show origin/main:scaffold-api/specs/order-api.yaml > /tmp/old-spec.yaml
        ./oasdiff breaking /tmp/old-spec.yaml specs/order-api.yaml --fail-on ERR

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

### CI pipeline flow

```
Spec change → lint (Spectral) ──→ contract test (Schemathesis) ──→ generate types + docs
                ↓ (PR only)
           breaking changes (oasdiff) ──→ block if breaking
```

## Common Pitfalls

**1. Schemathesis returns 401 on all requests**
- Problem: Forgot `--set-header "X-API-Key: test-key"`.
- Fix: Always include the auth header. The spec enforces security.

**2. Schemathesis 422 on path parameter endpoints**
- Problem: Random strings for orderId fail UUID validation.
- Fix: Use `--stateful=links` to get valid IDs from POST responses.

**3. Hurl test expects 400 but Prism returns 422**
- Problem: Prism's built-in request validation returns 422, not the spec's 400.
- Fix: Use `HTTP 422` in Hurl tests against Prism. Document the difference. Against a real API, use `HTTP 400`.

**4. Hurl test expects 404 but Prism returns 200**
- Problem: Prism is stateless — any valid UUID gets the example response.
- Fix: Accept 200 against Prism with a comment. Against a real API, expect 404.

**5. Schemathesis finds "failures" in the mock**
- Problem: Prism may not perfectly implement all spec edge cases.
- Fix: Run against the real API in QA to confirm. Mock failures may be Prism limitations, not spec bugs.

**6. oasdiff fails on multi-file spec**
- Problem: oasdiff may not resolve `$ref` pointers in multi-file specs.
- Fix: Run against the bundled spec, or use the source spec if oasdiff supports `$ref` resolution.

## Multi-Environment Usage

Same tests, different base URL:

| Environment | Target | Command |
|---|---|---|
| **Dev (mock)** | `http://localhost:4010` | `npm run mock & npm run test:contract` |
| **QA** | `https://qa.yourcompany.com/v1` | Override `--base-url` in Schemathesis, `--variable base_url=...` in Hurl |
| **Acceptance** | `https://acp.yourcompany.com/v1` | Same overrides |

```bash
# Schemathesis against QA
docker run --rm schemathesis/schemathesis run \
  https://qa.yourcompany.com/v1/openapi.yaml \
  --checks all --set-header "X-API-Key: $QA_API_KEY"

# Hurl against QA (use variables)
hurl --test --variable base_url=https://qa.yourcompany.com/v1 tests/orders.hurl
```

If tests pass against the mock but fail against QA — the implementation drifts from the spec. That's exactly what contract testing catches.

## Alternatives

| Tool | When to use |
|---|---|
| **Dredd** | Simpler than Schemathesis — runs spec examples against the API. No fuzzing. |
| **Pact** | Consumer-driven contract testing. Multiple consumers define what they need. |
| **Newman** | CLI runner for Postman collections. JUnit output. Postman JSON not Git-friendly. |
| **Optic** | Visual API changelog + breaking change detection. More visual than oasdiff. |

## References

- Schemathesis docs: https://schemathesis.readthedocs.io
- Schemathesis GitHub Action: https://github.com/schemathesis/action
- Schemathesis stateful testing: https://schemathesis.readthedocs.io/en/stable/stateful.html
- Hurl docs: https://hurl.dev
- Spectral docs: https://docs.stoplight.io/docs/spectral
- oasdiff GitHub: https://github.com/Tufin/oasdiff
