# API-First Scaffold

A reusable project template for contract-first API development. Write an OpenAPI spec, generate everything else.

## Quick Start

```bash
npm install
npm run mock        # Start mock server — frontend starts building immediately
```

## Prerequisites

| Prerequisite | Required? | Who needs it |
|---|---|---|
| **Node.js 18+** | Required | Everyone |
| **Java 11+** | Optional | Backend devs (Spring Boot stub generation only) |
| **Docker** | Optional | QA (Schemathesis contract tests — also runs in CI via GitHub Action) |
| **Hurl** | Optional | QA (`brew install hurl` — also runs in CI) |
| **oasdiff** | Optional | Tech leads (`brew install oasdiff` — also runs in CI) |

## Folder Structure

```
specs/                       # OpenAPI spec (multi-file with $ref)
  order-api.yaml             #   Main spec — paths, servers, security
  components/
    schemas/                 #   Order, Customer, OrderItem, ErrorResponse
    examples/                #   Named examples for Scalar "Try it out"
      responses/             #     GET/POST response examples
      requests/              #     POST/PUT request body examples
      errors/                #     400, 401, 404, 429 error examples
    parameters/              #   Reusable pagination params
rules/                       # Spectral linting ruleset (OAS + OWASP + custom)
tests/                       # Hurl functional tests
examples/                    # openapi-fetch usage example (TypeScript)
mocks/                       # Saved Prism response samples
docs/                        # Scalar API reference (generated + CDN wrapper)
ci/                          # GitHub Actions pipeline
generated/                   # TypeScript types, Spring stubs (gitignored)
```

## Available Scripts

### Spec

| Command | Description |
|---|---|
| `npm run bundle` | Bundle multi-file spec into single `order-api.bundled.yaml` |
| `npm run validate` | Validate spec structure |

### Quality

| Command | Description |
|---|---|
| `npm run lint` | Lint spec against 3 layers: OpenAPI standard + OWASP security + custom org rules |
| `npm run lint:bad` | Lint the intentionally bad spec (demo: shows violations) |

### Development

| Command | Description |
|---|---|
| `npm run mock` | Start Prism mock server (static mode — returns spec examples) |
| `npm run mock:dynamic` | Start Prism mock server (dynamic mode — x-faker generated data) |
| `npm run types` | Generate TypeScript types from spec (openapi-typescript) |
| `npm run docs` | Start Scalar docs with live reload (--watch) |
| `npm run docs:build` | Build static Scalar API reference HTML |

### Testing

| Command | Description | Requires |
|---|---|---|
| `npm run test:hurl` | Run Hurl functional tests against mock server | Hurl binary |
| `npm run test:hurl:docker` | Same as above via Docker (no Hurl install needed) | Docker |
| `npm run test:contract` | Run Schemathesis contract tests (600+ auto-generated) | Docker + Prism on :4010 |
| `npm run test:contract:negative` | Schemathesis negative tests — sends invalid data | Docker + Prism on :4010 |
| `npm run breaking:docker` | Breaking change detection via Docker | Docker |

> **Note:** Start the mock server first: `npm run mock &`. Schemathesis and Hurl have Docker fallbacks for environments where native binaries can't be installed. In CI, everything runs via GitHub Actions — no local install needed. See the [QA Testing Guide](../docs/guides/qa-testing.md) for detailed setup instructions.

### Backend

| Command | Description |
|---|---|
| `npm run stubs` | Generate Spring Boot server interfaces (requires Java 11+) |

### Precheck

| Command | Description |
|---|---|
| `npm run precheck` | Bundle + lint (run before committing) |

## Using This Scaffold for Your Own API

1. Copy `scaffold-api/` into your own repo
2. Find-and-replace `order-api` with your API name in `package.json`
3. Replace `specs/order-api.yaml` and `specs/components/` with your schemas and examples
4. Update `rules/.spectral.yaml` if you need different organizational rules
5. Run `npm install && npm run mock` — start building

## API Exploration

The OpenAPI spec can be imported into any API client for manual exploration:

- **Scalar "Try it out"** — built into the generated docs (`npm run docs`), zero install
- **Bruno, Postman, Insomnia, Hoppscotch, Yaak** — import `specs/order-api.yaml` (or the bundled file)

The scaffold is opinionated about automation (Spectral, Prism, Schemathesis, Hurl, Scalar, CI) and unopinionated about personal exploration tools.
