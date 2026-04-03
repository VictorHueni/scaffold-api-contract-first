# Guides

Practical how-to guides organized by role. Each guide follows a consistent structure: Quick Start, Overview, Prerequisites, How It Works, Configuration, Common Pitfalls, Multi-Environment Usage, Alternatives, References.

## By Audience

### Frontend Developers

| Guide | Description |
|---|---|
| [Frontend Client Generation](frontend-client-generation.md) | Generate TypeScript types + use openapi-fetch for type-safe API calls |

### Backend Developers

| Guide | Description |
|---|---|
| [Backend Server Generation](backend-server-generation.md) | Generate Spring Boot interfaces with interfaceOnly pattern |

### QA Engineers & DevOps

| Guide | Description |
|---|---|
| [CI Testing & Quality Gates](ci-testing.md) | Schemathesis contract tests, Hurl functional tests, Spectral linting, oasdiff breaking changes |

## Quick Reference

| I want to... | Guide | Command |
|---|---|---|
| Generate TypeScript types | [Frontend](frontend-client-generation.md) | `npm run types` |
| Use a typed API client | [Frontend](frontend-client-generation.md) | See `examples/client-usage.ts` |
| Generate Spring Boot stubs | [Backend](backend-server-generation.md) | `npm run stubs` |
| Lint the spec | [CI Testing](ci-testing.md) | `npm run lint` |
| Run contract tests | [CI Testing](ci-testing.md) | `npm run mock & npm run test:contract` |
| Run functional tests | [CI Testing](ci-testing.md) | `npm run mock & hurl --test tests/orders.hurl` |
| Check for breaking changes | [CI Testing](ci-testing.md) | `npm run breaking` |
| Start mock server | All guides | `npm run mock` |

## Reference Material

For specifications, standards, and pattern catalogs, see [`docs/reference/`](../reference/):

| Reference | Description |
|---|---|
| [EIP Patterns for API Mediation](../reference/eip-patterns-for-api-mediation.md) | 20 Enterprise Integration Patterns translated to API mediation |
| [OpenAPI Overlay Specification](../reference/openapi-overlay-specification.md) | Full Overlay spec reference for annotating specs you don't own |
