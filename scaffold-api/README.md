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
  api.yaml                   #   Main spec — paths, servers, security
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
.github/workflows/           # GitHub Actions CI (ci.yml — out-of-the-box)
generated/                   # TypeScript types, Spring stubs (gitignored)
```

## Available Scripts

### Spec

| Command | Description |
|---|---|
| `npm run bundle` | Bundle multi-file spec into single `api.bundled.yaml` |
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
| `npm run docs` | Start Scalar docs with live reload on port 8081 (--watch) |
| `npm run docs:build` | Static docs info — open `docs/index.html` (CDN-based Scalar wrapper, requires `npm run bundle` first) |

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

## API Documentation (Scalar)

The scaffold generates interactive API documentation using [Scalar](https://scalar.com/) with the `kepler` theme.

### Live preview (development)

```bash
npm run docs     # Opens Scalar docs at http://localhost:8081 with live reload
```

Edit the spec, save, and the docs update automatically via `--watch`.

### Static HTML (deployment)

A CDN-based HTML wrapper is included at `docs/index.html`. It loads Scalar from the jsDelivr CDN and renders the bundled spec. To use it:

1. Run `npm run bundle` to generate `specs/api.bundled.yaml`
2. Serve the `scaffold-api/` directory with any static file server (e.g., `npx serve .`)
3. Open `docs/index.html` in a browser

The HTML references the bundled spec via a relative path (`../specs/api.bundled.yaml`), so it works with any static file server without configuration.

### "Try it out" playground

Scalar's built-in playground lets you send requests directly from the docs. Point it at the Prism mock server (`http://localhost:4010`) to test endpoints interactively without any additional tooling.

## Using This Scaffold for Your Own API

1. Copy `scaffold-api/` into your own repo
2. Replace `specs/api.yaml` and `specs/components/` with your schemas and examples
3. Update `rules/.spectral.yaml` if you need different organizational rules
4. Delete the demo-only files: `specs/api-bad.yaml`, `specs/api-v2.yaml`
5. Run `npm install && npm run mock` — start building

## API Exploration

The OpenAPI spec can be imported into any API client for manual exploration:

- **Scalar "Try it out"** — built into the generated docs (`npm run docs`), zero install
- **Bruno, Postman, Insomnia, Hoppscotch, Yaak** — import `specs/api.yaml` (or the bundled file)

The scaffold is opinionated about automation (Spectral, Prism, Schemathesis, Hurl, Scalar, CI) and unopinionated about personal exploration tools.
