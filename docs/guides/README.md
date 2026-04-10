# Guides

Practical how-to guides organized by role. For prerequisites, scripts, and folder structure, see [`scaffold-api/README.md`](../../scaffold-api/README.md). For the WHY behind contract-first, see the [PRD problem statement](../product-specs/0001_prd_api-first-scaffold.md#1-problem-statement).

> **New here?** Start with the [Manual Smoke Test](manual-smoke-test.md) — a 10-minute copy-paste walkthrough that exercises every feature. Then read the guide for your role below.

## For Everyone

| Guide | Description |
|---|---|
| [API Conventions](conventions.md) | Naming rules, structure rules, security rules, quality rules — all enforced by Spectral |
| [Manual Smoke Test](manual-smoke-test.md) | Copy-paste curl commands to walk through every scaffold feature locally in ~10 minutes |

## By Audience

### Frontend Developers

| Guide | Description |
|---|---|
| [Frontend Client Generation](frontend-client-generation.md) | Generate TypeScript types + use openapi-fetch for type-safe API calls |

### Backend Developers

| Guide | Description |
|---|---|
| [Backend Server Generation](backend-server-generation.md) | Generate Spring Boot interfaces with interfaceOnly pattern |

### QA Engineers

| Guide | Description |
|---|---|
| [QA Testing Setup](qa-testing.md) | Local test setup, Docker fallbacks, Hurl functional tests, Schemathesis contract tests, API exploration |

### DevOps Engineers

| Guide | Description |
|---|---|
| [CI Testing & Quality Gates](ci-testing.md) | CI pipeline configuration — Schemathesis, Hurl, Spectral, oasdiff in GitHub Actions |

## Quick Reference (task-oriented)

For the full command reference, see [`scaffold-api/README.md`](../../scaffold-api/README.md#available-scripts).

| I want to... | Guide | Command |
|---|---|---|
| Generate TypeScript types | [Frontend](frontend-client-generation.md) | `npm run types` |
| Use a typed API client | [Frontend](frontend-client-generation.md) | See `examples/client-usage.ts` |
| Generate Spring Boot stubs | [Backend](backend-server-generation.md) | `npm run stubs` |
| Lint the spec | [CI Testing](ci-testing.md) | `npm run lint` |
| Run contract tests | [QA Testing](qa-testing.md) | `npm run mock & npm run test:contract` |
| Run functional tests (native) | [QA Testing](qa-testing.md) | `npm run mock & npm run test:hurl` |
| Run functional tests (Docker) | [QA Testing](qa-testing.md) | `npm run mock & npm run test:hurl:docker` |
| Check for breaking changes | [CI Testing](ci-testing.md) | `npm run breaking:docker` |
| Explore the API interactively | [QA Testing](qa-testing.md) | `npm run docs` → "Try it out" |
| Run a quick manual smoke test | [Manual Smoke Test](manual-smoke-test.md) | Follow the curl walkthrough |

## Reference Material

For specifications, standards, and pattern catalogs, see [`../reference/`](../reference/).
