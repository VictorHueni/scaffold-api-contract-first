# Implementation Plan: API-First Scaffold & Demo

## Summary

Build a reusable API-first scaffold repository and record a video walkthrough demonstrating the full contract-first workflow to the IT department. The demo uses a fictional Order Management API as the running example. IBM stack integration is covered via slides only.

**Source PRD:** [`docs/product-specs/0001_prd_api-first-scaffold.md`](../../../docs/product-specs/0001_prd_api-first-scaffold.md)

Principles:

1. One increment equals one coherent change set.
2. Every increment has an explicit test gate.
3. Each increment produces a demonstrable artifact — no "setup-only" increments that can't be verified.
4. The OpenAPI spec is the foundation; everything downstream depends on it.
5. IBM stack is slides-only — no implementation, no environment dependency.

**Overall Status:** pending
**Current Increment:** --

---

## Increment Plan

### Increment 01: Project structure and prerequisites

**Status:** pending

> PRD ref: US-001

Scope:

1. Create the full directory scaffold: `specs/`, `rules/`, `mocks/`, `tests/`, `docs/`, `ci/`
2. Create a README.md with folder purpose descriptions, prerequisites list (Node.js 18+, Python 3.8+, Hurl), and a single setup script. Include a note that the spec can be imported into any API client (Bruno, Postman, Insomnia, Hoppscotch, Scalar, Yaak) for manual exploration.
3. Create a `setup.sh` that installs all global tools (`prism-cli`, `spectral-cli`, `@scalar/cli`, `schemathesis`, `oasdiff`) and project-level dependencies (`openapi-typescript`, `openapi-fetch`, `openapi-generator-cli` for server stubs)
4. Add `.gitignore` entries for `generated/`, `node_modules/`, `*.Zone.Identifier`

Primary files:

1. `README.md`
2. `setup.sh`
3. `.gitignore`

Test gate:

1. `ls specs rules mocks tests docs ci` — all directories exist
2. `cat README.md | head -5` — file exists and has content
3. `bash -n setup.sh` — script is syntactically valid

Exit criteria:

1. A developer cloning the repo sees an intuitive layout and can run `setup.sh` to install all dependencies
2. README explains each directory's purpose

---

### Increment 02: Write the OpenAPI spec (schemas and endpoints)

**Status:** pending

> PRD ref: US-002

Scope:

1. Create multi-file spec structure under `specs/`:

   ```
   specs/
     order-api.yaml                       # Main spec — paths, info, servers, security, $ref pointers
     components/
       schemas/
         Order.yaml
         Customer.yaml
         OrderItem.yaml
         ErrorResponse.yaml
       examples/
         responses/
           pending-order.yaml             # GET /orders/{id} — order in pending state
           shipped-order.yaml             # GET /orders/{id} — shipped with tracking
           delivered-order.yaml           # GET /orders/{id} — delivered with notes
           single-item-order.yaml         # POST /orders 201 — one item
           multi-item-order.yaml          # POST /orders 201 — multiple items
           orders-first-page.yaml         # GET /orders — first page
           orders-filtered.yaml           # GET /orders — filtered by status
         requests/
           create-basic-order.yaml        # POST /orders body — minimal
           create-multi-item-order.yaml   # POST /orders body — multiple items + notes
           update-status-shipped.yaml     # PUT /orders/{id} body — status change
           update-add-tracking.yaml       # PUT /orders/{id} body — add tracking number
         errors/
           validation-error.yaml          # 400 — missing required field
           unauthorized.yaml              # 401 — invalid API key
           not-found.yaml                 # 404 — order not found
           rate-limited.yaml              # 429 — with Retry-After header
       parameters/
         pagination.yaml                  # Reusable page, limit, status filter params
   ```

2. Main `specs/order-api.yaml` references components via `$ref`:
   - Schemas: `$ref: ./components/schemas/Order.yaml`
   - Examples: `$ref: ./components/examples/responses/pending-order.yaml`
   - Parameters: `$ref: ./components/parameters/pagination.yaml`
3. Define `info`, `servers` (mock, dev, staging, production), and `security` blocks in main spec
4. Define security schemes: API key (`X-API-Key` header) and OAuth2 (client credentials)
5. Each schema has `type`, `format`, `example`, `x-faker`, `description`, and constraints
6. Define endpoints: `GET /orders` (paginated), `GET /orders/{orderId}`, `POST /orders`, `PUT /orders/{orderId}`, `DELETE /orders/{orderId}`, `GET /orders/{orderId}/items`
7. Each endpoint has `operationId`, `tags`, parameters, request body (where applicable), success + error responses
8. Add OpenAPI `links` on `POST /orders` 201 response for stateful testing
9. Bundle into a single file for downstream tools: `npx @scalar/cli bundle specs/order-api.yaml -o specs/order-api.bundled.yaml`

Primary files:

1. `specs/order-api.yaml` (main spec with `$ref` pointers)
2. `specs/components/schemas/*.yaml` (4 schema files)
3. `specs/components/examples/**/*.yaml` (15 example files)
4. `specs/components/parameters/pagination.yaml`
5. `specs/order-api.bundled.yaml` (generated — single file for tools)

Test gate:

1. `npx @scalar/cli validate specs/order-api.yaml` — exits 0 (validates multi-file spec)
2. `npx @scalar/cli bundle specs/order-api.yaml -o specs/order-api.bundled.yaml` — exits 0, bundled file exists
3. `grep -c "\\$ref:" specs/order-api.yaml` — at least 15 `$ref` pointers in main spec
4. `grep -c "examples:" specs/order-api.bundled.yaml` — at least 5 `examples` blocks in bundled output

Exit criteria:

1. Main spec is clean and readable — schemas, examples, and parameters live in separate files
2. Bundled spec is valid OpenAPI 3.1 with all 6 endpoints, 4 schemas, security schemes, and x-faker annotations
3. Every schema property has `type`, `format` (where applicable), `example`, and `x-faker`
4. Key endpoints have multiple named examples for both responses and request bodies
5. Error responses (400, 401, 404, 429) have realistic example bodies
6. All downstream tools (Prism, Schemathesis, openapi-typescript, openapi-generator, Scalar) consume the bundled file

---

### Increment 03: Spectral linting ruleset and bad spec variant

**Status:** pending

> PRD ref: US-003

Scope:

1. Install `@stoplight/spectral-owasp-ruleset` as a dependency
2. Create `rules/.spectral.yaml` with three layers:

   **Layer 1 — OpenAPI standard** (extends `spectral:oas`, 25+ built-in rules)

   **Layer 2 — OWASP security** (extends `@stoplight/spectral-owasp-ruleset`) with key rules promoted to error:
   - `owasp:api-security:security-hosts-https-oas3` (error) — servers must use HTTPS
   - `owasp:api-security:protection-global-unsafe` (error) — POST/PUT/DELETE must have auth
   - `owasp:api-security:no-api-keys-in-url` (error) — API keys not in query params
   - `owasp:api-security:array-limit` (error) — arrays must define `maxItems`
   - `owasp:api-security:string-limit` (warn) — strings should define `maxLength`
   - `owasp:api-security:no-additionalProperties` (warn) — objects should set `additionalProperties: false`
   - `owasp:api-security:rate-limit-responses-429` (warn) — operations should define 429 responses

   **Layer 3 — Organizational custom rules:**
   - `operationId` required on all operations (error)
   - `operationId-pattern` — must follow `verbNoun` pattern e.g. `listOrders`, `createOrder` (warn)
   - camelCase property names (warn)
   - Descriptions on operations (warn)
   - `no-empty-descriptions` — empty descriptions are worse than none (error)
   - Examples on schema properties (warn)
   - Error responses required on all operations (warn)
   - `paths-kebab-case` — path segments must be kebab-case (error)
   - `no-trailing-slash` — paths must not end with `/` (error)
   - `operation-must-have-tag` — every operation must be tagged (error)
   - `get-must-return-body` — GET 200 responses must define content (error)
   - `request-body-must-ref-component` — request bodies should use `$ref` not inline schemas (warn)

3. Run Spectral against `specs/order-api.yaml` and fix any violations
4. Create `specs/order-api-bad.yaml` with intentional violations covering all three layers:
   - **Convention violations:** `order_status` (snake_case), missing `operationId`, trailing slash in path, verb in path (`/getOrders`), missing tag
   - **Security violations:** server using `http://` not `https://`, missing auth on a POST, API key in query param, array without `maxItems`
   - **Quality violations:** empty description, inline request body schema, missing error response

Primary files:

1. `rules/.spectral.yaml`
2. `specs/order-api-bad.yaml`
3. `package.json` (for `@stoplight/spectral-owasp-ruleset` dependency)

Test gate:

1. `spectral lint specs/order-api.yaml --ruleset rules/.spectral.yaml` — exits 0, zero errors
2. `spectral lint specs/order-api-bad.yaml --ruleset rules/.spectral.yaml 2>&1 | grep -c "warning\|error"` — returns 8 or more violations across all 3 layers

Alternatives:

- **@ibm-cloud/openapi-ruleset** — IBM's enterprise ruleset with 80+ rules (pagination patterns, error format, etag, snake_case). The most comprehensive community ruleset. Can replace the custom rules layer.
- **@apisyouwonthate/style-guide** — opinionated ruleset covering pagination, naming, error format (RFC 7807), versioning.
- **Redocly CLI lint** — alternative linter with built-in rules and custom plugin support.
- **VS Code Spectral extension** — gives developers real-time linting feedback as they edit the spec.

Exit criteria:

1. Good spec passes all three layers (standard + OWASP + custom) cleanly
2. Bad spec triggers violations from each layer — conventions, security, and quality
3. Security violations are clearly flagged with OWASP rule names

---

### Increment 04: Mock server validation (Prism static + dynamic)

**Status:** pending

> PRD ref: US-004

Scope:

1. Start Prism in static mode and verify it returns `example` values from the spec
2. Start Prism in dynamic mode and verify it returns different `x-faker`-generated values on each call
3. Verify Prism rejects an invalid POST request with a 400 validation error
4. Save sample responses to `mocks/static-response.json` and `mocks/dynamic-response.json` for reference

Primary files:

1. `mocks/static-response.json`
2. `mocks/dynamic-response.json`

Test gate:

1. `prism mock specs/order-api.bundled.yaml --port 4010 &` then `curl -sf http://localhost:4010/orders/test-123 | jq .id` — returns the static example ID
2. `prism mock -d specs/order-api.bundled.yaml --port 4011 &` then run `curl` twice and diff outputs — responses differ
3. `curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:4010/orders -H 'Content-Type: application/json' -d '{"customer":{"name":"Test"}}'` — returns 400

Alternatives:

- **WireMock + OpenAPI plugin** — more enterprise-grade, supports stateful scenarios and request matching. Better for complex mock workflows.
- **Mockoon** — desktop GUI for mocking. Good for non-technical team members who don't want to use the terminal.

Exit criteria:

1. Static mode returns exact `example` values from the spec
2. Dynamic mode returns varied realistic data using `x-faker`
3. Invalid requests are rejected with proper validation errors

---

### Increment 05: TypeScript types and client generation

**Status:** pending

> PRD ref: US-005

Scope:

1. Run `npx openapi-typescript specs/order-api.bundled.yaml -o generated/api-types.d.ts` to generate TypeScript types from the bundled spec
2. Install `openapi-fetch` and create a minimal usage example (`examples/client-usage.ts`) showing a typed GET request with autocompletion
3. Verify generated types include interfaces for Order, Customer, OrderItem, ErrorResponse
4. Verify all field names, types, and optionality match the spec exactly

Primary files:

1. `generated/api-types.d.ts` (generated, not committed)
2. `examples/client-usage.ts` (committed — shows how to use the types)

Test gate:

1. `npx openapi-typescript specs/order-api.bundled.yaml -o generated/api-types.d.ts` — exits 0
2. `grep -c "Order\|Customer\|OrderItem\|ErrorResponse" generated/api-types.d.ts` — all 4 schemas present
3. `npx tsc --noEmit examples/client-usage.ts` — usage example compiles without errors

Alternatives:

- **@hey-api/openapi-ts** — generates full SDK client code + types with plugin support (TanStack Query, Zod). Use when you want generated method calls, not just types. Fastest-growing codegen tool (~2M downloads/week).
- **Orval** — generates React Query / SWR hooks from the spec. Best for React-heavy frontends.
- **openapi-generator-cli (typescript-fetch)** — full runtime client generation. Supports 50+ languages but produces heavier output with a Java dependency.
- **Kiota (Microsoft)** — excellent for .NET ecosystems.

Exit criteria:

1. Generated types file contains typed interfaces matching every schema in the spec
2. Usage example compiles and demonstrates type-safe API calls with `openapi-fetch`

---

### Increment 06: Spring Boot server stubs with minimal implementation

**Status:** pending

> PRD ref: US-006

Scope:

1. Run `openapi-generator-cli generate` with `spring` generator and `interfaceOnly=true,useSpringBoot3=true`
2. Create a minimal implementation class that implements the generated `OrdersApi` interface for `GET /orders/{orderId}` with a hardcoded Order response
3. Verify the stub server starts and responds to requests

Primary files:

1. `generated/server-spring/` (generated, not committed)
2. `generated/server-spring/src/main/java/.../OrdersApiImpl.java` (hand-written implementation)

Test gate:

1. `openapi-generator-cli generate -i specs/order-api.bundled.yaml -g spring -o generated/server-spring --additional-properties=interfaceOnly=true,useSpringBoot3=true` — exits 0
2. `cd generated/server-spring && mvn spring-boot:run &` then `curl -sf http://localhost:8080/orders/test-123 | jq .id` — returns a valid order ID

Alternatives:

- **Quarkus (JAX-RS)** — `openapi-generator-cli generate -i specs/order-api.bundled.yaml -g jaxrs-spec -o generated/server-quarkus`. Same tool, generates JAX-RS interfaces for Quarkus. Same spec, same workflow.
- **Node.js Express** — `openapi-generator-cli generate -g nodejs-express-server`. Full scaffold with validation middleware. Use for Node-based teams.
- **Connexion (Python/Flask)** — routes and validates directly from the spec. Good for Python shops.
- **NSwag / Kiota (.NET)** — strong typing and middleware generation for .NET teams.

Exit criteria:

1. Spring Boot interfaces are generated for every operationId
2. At least one endpoint has an implementation returning a valid, spec-conforming response
3. Server starts with `mvn spring-boot:run` without errors

---

### Increment 07: Contract testing with Schemathesis

**Status:** pending

> PRD ref: US-007

Scope:

1. Run Schemathesis against the Prism mock server with `--checks all --stateful=links`
2. Verify 100+ test cases are generated and pass
3. Introduce a deliberate bug in the stub server (change `total` to string), run Schemathesis against it, verify it catches the violation
4. Fix the bug and verify Schemathesis passes
5. Run negative testing mode (`--mode=negative`) and verify invalid data is rejected

Primary files:

1. (No new files — uses existing spec and servers)

Test gate:

1. `schemathesis run specs/order-api.bundled.yaml --base-url http://localhost:4010 --checks all --stateful=links --hypothesis-max-examples=100` — all pass
2. Schemathesis output shows 100+ test cases
3. Against the buggy stub server — Schemathesis reports schema violation for `total`

Alternatives:

- **Dredd** — runs spec examples against the live API. Simpler than Schemathesis but no fuzzing.
- **Pact** — consumer-driven contract testing. Each consumer defines what it needs from the provider. Best when multiple consumers depend on the same API.
- **express-openapi-validator (proxy mode)** — continuous runtime validation in staging, complementary to CI-time testing.

Exit criteria:

1. Contract tests pass against the mock server
2. Contract tests catch an intentional schema violation in the stub server
3. Negative testing confirms the API rejects invalid input

---

### Increment 08: Hurl functional tests

**Status:** pending

> PRD ref: US-008

Scope:

1. Create `tests/orders.hurl` with 5 tests: list orders (200), get single order (200 with shape assertions), create order (201 with status "pending"), create with missing field (400), get non-existent order (404)
2. Run tests against the mock server
3. Verify JUnit XML output generation works

Primary files:

1. `tests/orders.hurl`

Test gate:

1. `hurl --test tests/orders.hurl` (with Prism running on 4010) — all tests pass
2. `hurl --test --report-junit generated/hurl-results.xml tests/orders.hurl` — exits 0 and `generated/hurl-results.xml` exists

Alternatives:

- **Newman** — CLI runner for Postman collections. Runs automated collection tests in CI with JUnit output. Good if the team already uses Postman, but Postman collections are JSON blobs not designed for Git.
- For manual API exploration, the scaffold recommends using Scalar's built-in "Try it out" (zero install) or any desktop client of choice (Bruno, Postman, Insomnia, Hoppscotch, Yaak).

Exit criteria:

1. All 5 Hurl tests pass against the mock server
2. JUnit XML output is valid for CI consumption

---

### Increment 09: Breaking change detection

**Status:** pending

> PRD ref: US-009

Scope:

1. Create `specs/order-api-v2.yaml` by copying the original spec and introducing breaking changes: rename `customer.name` to `customer.fullName`, remove `notes` field, change `quantity` type from integer to number
2. Add one non-breaking change: new optional `trackingNumber` field
3. Run `oasdiff breaking` and verify all breaking changes are detected
4. Verify `--fail-on ERR` returns exit code 1

Primary files:

1. `specs/order-api-v2.yaml`

Test gate:

1. `oasdiff breaking specs/order-api.yaml specs/order-api-v2.yaml` — lists breaking changes
2. `oasdiff breaking specs/order-api.yaml specs/order-api-v2.yaml --fail-on ERR; echo $?` — returns 1

Alternatives:

- **Optic** — tracks API changes over time, generates visual changelogs per version. Better for long-lived APIs with many versions. More visual than oasdiff's CLI output.

Exit criteria:

1. oasdiff detects all 3 breaking changes and classifies them
2. Non-breaking addition is listed separately
3. CI exit code behavior is verified

---

### Increment 10: Scalar API documentation

**Status:** pending

> PRD ref: US-010

Scope:

1. Generate Scalar docs from the bundled spec: `npx @scalar/cli bundle specs/order-api.bundled.yaml -o docs/scalar-reference.html`
2. Create a CDN-based HTML wrapper (`docs/index.html`) using the `kepler` theme
3. Verify `npx @scalar/cli serve` provides live preview with `--watch`
4. Document the docs generation in the README

Primary files:

1. `docs/scalar-reference.html` (generated)
2. `docs/index.html`

Test gate:

1. `npx @scalar/cli bundle specs/order-api.bundled.yaml -o docs/scalar-reference.html` — exits 0, file exists
2. `cat docs/index.html | grep "scalar"` — HTML references Scalar CDN
3. `npx @scalar/cli serve specs/order-api.bundled.yaml --port 8081 &` then `curl -sf http://localhost:8081 | grep -i "order"` — docs serve successfully

Alternatives:

- **Redoc (BSD-3)** — three-panel layout with expandable schema tree view. Better for deeply nested or complex models. No free "Try it out" (paid Redocly feature). Still a solid choice if interactive testing is not needed in docs.
- **Swagger UI (Apache-2.0)** — industry standard, "Try it out" built in. Less modern UI than Scalar but universally recognized.

Exit criteria:

1. Static HTML docs render all endpoints, schemas, and examples
2. "Try it out" playground works against the mock server
3. Live preview with `--watch` reflects spec changes

---

### Increment 11: CI pipeline (GitHub Actions)

**Status:** pending

> PRD ref: US-011

Scope:

1. Create `ci/pipeline.yaml` as a GitHub Actions workflow triggering on push/PR to `specs/**`
2. Jobs: `lint` (Spectral), `breaking-changes` (oasdiff, PR-only), `contract-test` (Schemathesis against Prism), `generate-types` (openapi-typescript), `generate-docs` (Scalar)
3. Remove the IBM `publish-apic` job (out of scope — slides only)
4. Validate the YAML is syntactically correct

Primary files:

1. `ci/pipeline.yaml`

Test gate:

1. `python3 -c "import yaml; yaml.safe_load(open('ci/pipeline.yaml'))"` — valid YAML
2. `grep -c "jobs:" ci/pipeline.yaml` — contains jobs section
3. `grep "spectral\|oasdiff\|schemathesis\|scalar\|openapi-typescript" ci/pipeline.yaml | wc -l` — all 5 tools referenced

Alternatives:

- **GitLab CI** — same concepts, different YAML syntax. Pipeline is portable.
- **Jenkins** — Jenkinsfile equivalent. More setup but common in enterprise environments.
- **Spectral OWASP ruleset** (`@stoplight/spectral-owasp-ruleset`) — add as an optional CI job for security-focused linting against OWASP API Top 10.

Exit criteria:

1. Pipeline YAML is valid and contains all 5 jobs
2. Breaking change detection is PR-only (`if: github.event_name == 'pull_request'`)
3. No IBM-specific jobs — IBM is slides only

---

### Increment 12: Pre-recording checklist and dry run

**Status:** pending

> PRD ref: US-012 (preparation)

Scope:

1. Execute the full pre-recording checklist: validate spec, lint good/bad specs, start Prism (static + dynamic), generate TS types with openapi-typescript, verify openapi-fetch usage example compiles, generate Spring Boot stubs, run `mvn spring-boot:run`, run Schemathesis, run Hurl, run oasdiff, bundle Scalar docs, verify "Try it out" works
2. Fix any issues found during the dry run
3. Pre-populate terminal history with all demo commands
4. Set up terminal (dark theme, 16pt+ font) and browser (incognito, bookmarks)

Primary files:

1. (No new files — verification of all prior increments)

Test gate:

1. Every item in the pre-recording checklist passes end-to-end without manual intervention
2. All demo commands can be recalled via terminal history (arrow-up)

Exit criteria:

1. The full workflow works end-to-end on the recording machine
2. Terminal and browser are configured for recording

---

### Increment 13: Record video clips (core workflow)

**Status:** pending

> PRD ref: US-012

Scope:

1. Record Clip 1: The Problem (2 min, slides)
2. Record Clip 2: The Contract (5 min, editor + spec walkthrough)
3. Record Clip 3: Linting (3 min, Spectral bad spec → fix → pass)
4. Record Clip 4: Mock Server (4 min, static → dynamic → validation error)
5. Record Clip 5: Code Generation (3 min, openapi-typescript + openapi-fetch)
6. Record Clip 6: Backend Stubs (3 min, Spring Boot interfaces → implement → test)
7. Record Clip 7: Contract Testing (5 min, Schemathesis pass → bug → catch → fix)
8. Record Clip 8: Breaking Change Detection (3 min, oasdiff)
9. Record Clip 9: Documentation + API Exploration (4 min, Scalar UI + "Try it out" + live import into 1-2 desktop clients)
10. Record Clip 10: Hurl Functional Tests (2 min, hurl --test)
11. Record Clip 11: CI Pipeline (2 min, pipeline.yaml walkthrough)

Primary files:

1. Video clip files (stored outside repo)

Test gate:

1. Each clip is a self-contained recording file that starts and ends cleanly
2. Terminal is readable at 1080p in all clips
3. All commands execute successfully on camera

Exit criteria:

1. 11 clips covering the full open-source workflow are recorded (Clips 9 and 10 now cover Scalar exploration and Hurl tests separately)
2. No IBM terminal demos — that is handled by slides

---

### Increment 14: Record IBM slides and closing

**Status:** pending

> PRD ref: US-013, US-012

Scope:

1. Create or finalize slides covering: API Connect publishing workflow, Developer Portal, App Connect OpenAPI import, AsyncAPI spec for MQ events
2. Record Clip 12: IBM Stack (3-5 min, slides + narration)
3. Record Clip 13: The Payoff (3 min, Role Impact Matrix + timeline comparison)
4. Slides reference the spec file in the repo

Primary files:

1. Slide deck (external to repo)

Test gate:

1. Slides reference `specs/order-api.yaml` by name
2. Clips 12 and 13 are recorded and self-contained

Exit criteria:

1. IBM integration is presented via slides with no live environment dependency
2. Closing clip shows the Role Impact Matrix and timeline comparison

---

### Increment 15: Video editing and final delivery

**Status:** pending

> PRD ref: US-012

Scope:

1. Assemble all clips in sequence with section title cards (2s each, text on dark background)
2. Cut pauses and retakes
3. Add progress bar or chapter markers
4. Export at 1080p, 30fps
5. Upload to internal platform
6. Share companion materials: repo URL, spec, ruleset, CI pipeline, tool links

Primary files:

1. Final video file (external to repo)

Test gate:

1. Final video plays start-to-finish without errors
2. Total runtime is 35-40 minutes
3. Chapter markers allow jumping to each section

Exit criteria:

1. Video is uploaded and accessible to the IT department
2. Companion materials (repo, spec, ruleset, pipeline YAML, tool links) are shared alongside the video

---

## Delivery Rules

1. One increment per commit.
2. Each increment must be independently verifiable via its test gate.
3. No IBM environment dependencies in any increment — IBM is slides only.
4. The OpenAPI spec source lives in `specs/order-api.yaml` + `specs/components/` (multi-file, committed). The bundled file `specs/order-api.bundled.yaml` is generated and gitignored — all downstream tools consume the bundled file.
5. API exploration tooling is bring-your-own — the scaffold is opinionated about automation (Spectral, Prism, Schemathesis, Hurl, Scalar, CI) and unopinionated about personal clients (Bruno, Postman, Insomnia, etc.).
6. All tools used are open source and free tier. No paid licenses required.
7. Video clips are recorded as separate files and edited together — never as one continuous take.

---

## Milestone Chunks (Standalone Delivery Groups)

| Milestone | Increments | Status | Coherent Outcome | Standalone Test Gate | Exit Criteria | Commit Guidance |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M1: Foundation | 01-02 | pending | Scaffold repo with valid OpenAPI spec | `npx @scalar/cli validate specs/order-api.yaml` passes, all directories exist | A developer can clone the repo, understand the structure, and read a valid spec | `feat: scaffold project structure` then `feat: add Order Management OpenAPI spec` |
| M2: Quality Gates | 03-04 | pending | Linting + mock server working | Spectral passes on good spec, fails on bad spec; Prism serves mock responses | Spec quality is enforceable; frontend can start building against mocks | `feat: add Spectral linting rules` then `feat: validate Prism mock responses` |
| M3: Code Generation | 05-06 | pending | TypeScript types + Spring Boot server stubs | Generated types match spec; openapi-fetch usage example compiles; Spring Boot stub server starts and responds | Both frontend and backend have generated starting points from the spec | `feat: generate TypeScript types with openapi-typescript` then `feat: generate Spring Boot server stubs` |
| M4: Testing | 07-08 | pending | Contract tests + functional tests working | Schemathesis passes 100+ tests; Hurl tests pass with JUnit output | Automated quality assurance is in place with zero hand-written contract tests | `feat: add Schemathesis contract testing` then `feat: add Hurl functional tests` |
| M5: Ecosystem | 09-10 | pending | Breaking change detection, Scalar docs with "Try it out" | oasdiff detects breaking changes; Scalar HTML renders with working playground | Full tooling ecosystem is operational around the spec | `feat: add breaking change detection` then `feat: add Scalar API docs` |
| M6: CI & Verification | 11-12 | pending | CI pipeline + full dry run | Valid pipeline YAML with all jobs; pre-recording checklist passes | Everything works end-to-end, ready to record | `feat: add GitHub Actions CI pipeline` then `chore: pre-recording dry run` |
| M7: Video Production | 13-15 | pending | Recorded and edited video + companion materials | Final video is 35-40 min, 1080p, with chapter markers | IT department can watch the video and access all materials | Commits not applicable (video is external) |
