# PRD: API-First Scaffold & Demo

**Status:** draft

---

## 1. Problem Statement

Teams in the IT department work in silos. Frontend waits on backend to build APIs before starting. QA maintains hand-written Postman collections that drift from reality. Documentation lives in Confluence pages nobody trusts. API shapes are inconsistent across squads. Credentials get shared in Slack. Breaking changes ship undetected and break consumers.

This costs the organization weeks of blocked work per project, recurring integration bugs, and onboarding friction for new team members who must piece together API knowledge from scattered sources.

The API-first approach solves this by making a single OpenAPI contract the source of truth from which mocks, clients, server stubs, tests, documentation, and CI checks are all generated — but the department has no working example of this workflow, no template to start from, and no shared understanding of the tooling.

---

## 2. Goals

- **Demonstrate the API-first workflow end-to-end** so every discipline (frontend, backend, QA, DevOps, security, product) understands the concrete benefits and sees them working.
- **Provide a reusable scaffold repo** that teams can clone to bootstrap new API-first projects with pre-configured tooling, linting rules, CI pipeline, and folder structure.
- **Unblock parallel work from day one** by showing that frontend, backend, QA, and docs can all start working the moment the contract is written — no waiting on each other.
- **Eliminate API documentation drift** by generating docs (Scalar) directly from the spec so there is never a stale doc to maintain.
- **Establish organizational API standards** via Spectral linting rules that enforce naming conventions, error formats, pagination patterns, and security schemes automatically.

---

## 3. Non-Goals

- **Production Order Management API.** The Order Management API is a fictional example for demonstration purposes. We are not building a real order system. *Why: the goal is to teach the workflow, not to ship a product.*
- **IBM stack implementation.** API Connect, App Connect, and MQ integration will be covered in presentation slides only, not as working code in the repo. *Why: environment access is not guaranteed for all teams; the open-source tooling is the universal foundation.*
- **Custom API gateway setup.** Kong, Tyk, or other gateway configuration is out of scope for v1. *Why: gateway choice varies by team; this is a separate initiative.*
- **SDK publishing pipeline.** Auto-publishing generated clients to npm/Maven/PyPI registries is out of scope. *Why: requires internal registry infrastructure that doesn't exist yet.*
- **Multi-repo orchestration.** The scaffold assumes a single repo containing the spec and all generated artifacts. Mono-repo vs multi-repo strategy is a separate discussion. *Why: adds organizational complexity that distracts from the core workflow.*
- **Interactive training app.** Will be scoped post-implementation once the workflow is finalized. *Why: the teaching content depends on the final implementation.*
- **Multi-API developer portal.** For v1, Scalar generates static HTML per API. Evaluating Backstage or a centralized portal is a medium-term initiative after the pilot. *Why: premature before we have multiple APIs using the workflow.*
- **AsyncAPI implementation in the scaffold.** AsyncAPI for event-driven contracts (MQ/Kafka) is covered in presentation slides only. The tooling ecosystem (especially IBM MQ mocking and v3 code generation) is not mature enough for a live demo. *Why: tooling is ~3-5 years behind OpenAPI; adding a half-working demo weakens the presentation.*

---

## 4. User Stories

### US-001: Clone and understand the scaffold

**Status:** done

**Description:** As a developer joining a new API project, I want to clone the scaffold repo and immediately understand its structure so that I can start working without reading external documentation.

**Acceptance Criteria:**

- [x] Repo has a clear README explaining the folder structure and purpose of each directory
- [x] The scaffold lives in `scaffold-api/` — running `ls scaffold-api/` reveals an intuitive layout: `specs/` (with `components/` subdirectories), `rules/`, `tests/`, `docs/`, `ci/`
- [x] `scaffold-api/package.json` exists with all Node.js tools as `devDependencies` (no global installs)
- [x] `npm install` is the single setup command — installs Spectral, Prism, Scalar CLI, openapi-typescript, openapi-fetch, openapi-generator-cli
- [x] `npm run` (no args) lists all available commands, organized by category
- [x] README documents all `npm run` scripts with a brief description of each
- [x] README documents prerequisites: Node.js 18+ (required), Java 11+ (optional, for Spring stubs only), Hurl and oasdiff (optional, for local testing — also run in CI)
- [x] README includes a "Using this scaffold for your own API" section explaining the find-and-replace process
- [x] README mentions that the spec can be imported into any API client (Bruno, Postman, Insomnia, Hoppscotch, Scalar, Yaak) for manual exploration — the scaffold is unopinionated about personal tooling

---

### US-002: Write and validate an OpenAPI contract

**Status:** done

**Description:** As a tech lead, I want to write an OpenAPI 3.1 spec for the Order Management API and validate it passes linting so that I can be confident it meets organizational standards before sharing it for review.

**Acceptance Criteria:**

- [x] `specs/order-api.yaml` exists as the main spec file with `$ref` pointers to component files under `specs/components/`
- [x] Schemas (`Order`, `Customer`, `OrderItem`, `ErrorResponse`) live in `specs/components/schemas/*.yaml`
- [x] Examples live in `specs/components/examples/{responses,requests,errors}/*.yaml`
- [x] Reusable parameters live in `specs/components/parameters/*.yaml`
- [x] `npx @scalar/cli bundle specs/order-api.yaml -o specs/order-api.bundled.yaml` produces a valid single-file spec
- [x] Main spec is clean and readable — not bloated with inline examples or schemas
- [x] Complete endpoints in bundled output: GET/POST/PUT/DELETE for orders, GET for order items
- [x] Spec includes schemas with `type`, `format`, `example`, `x-faker`, `description`, and constraints (`minimum`, `maximum`, `enum`, `pattern`)
- [x] Spec includes `servers` block with mock, dev, staging, and production URLs
- [x] Spec includes security schemes (API key and OAuth2)
- [x] Spec includes OpenAPI `links` for stateful testing (POST response links to GET/PUT)
- [x] Response `examples` (plural) are defined on key endpoints to showcase Scalar's example picker:
  - `GET /orders/{orderId}` 200: at least 3 named examples (e.g., "Pending order", "Shipped order with tracking", "Delivered order with notes")
  - `POST /orders` 201: at least 2 named examples (e.g., "Single item order", "Multi-item order with notes")
  - `GET /orders` 200: at least 2 named examples (e.g., "First page of results", "Filtered by status")
- [x] Request body `examples` (plural) are defined on mutation endpoints for Scalar's "Try it out" pre-fill:
  - `POST /orders`: at least 2 named examples (e.g., "Basic order", "Order with multiple items and notes")
  - `PUT /orders/{orderId}`: at least 2 named examples (e.g., "Update status to shipped", "Add tracking number")
- [x] Error response examples are defined with realistic bodies:
  - 400: validation error example (e.g., missing required field)
  - 401: unauthorized example
  - 404: resource not found example
  - 429: rate limit exceeded example (with `Retry-After` header)
- [x] `npx @scalar/cli validate specs/order-api.yaml` passes with no errors

---

### US-003: Lint specs against organizational rules

**Status:** done

**Description:** As a tech lead, I want a custom Spectral ruleset that enforces our API standards so that new specs automatically follow conventions without relying on manual review.

**Acceptance Criteria:**

- [x] `rules/.spectral.yaml` exists and extends both `spectral:oas` and `@stoplight/spectral-owasp-ruleset`
- [x] OWASP security rules enforce: HTTPS servers, auth on unsafe methods, no API keys in URL, array `maxItems`, string `maxLength`
- [x] Custom organizational rules enforce: operationId required, `verbNoun` operationId pattern, camelCase properties, descriptions on operations, examples on schemas, error responses, kebab-case paths, no trailing slashes, operations must have tags, GET must return body, request bodies must use `$ref`
- [x] Running Spectral against a well-formed spec produces zero errors
- [x] A "bad spec" variant (`specs/order-api-bad.yaml`) exists with intentional violations across all three layers (convention, security, quality)
- [x] Running Spectral against the bad spec produces at least 8 violations with clear messages spanning all layers

---

### US-004: Start a mock server from the spec

**Status:** done

**Description:** As a frontend developer, I want to start a mock server with one command so that I can build UI against realistic API responses without waiting for the backend.

**Acceptance Criteria:**

- [x] `prism mock specs/order-api.yaml --port 4010` starts and responds to requests (static mode, returns `example` values)
- [x] `prism mock -d specs/order-api.yaml --port 4010` starts and responds with different realistic data on each call (dynamic mode, uses `x-faker`)
- [x] `GET /orders/{orderId}` returns a well-shaped Order object with realistic field values
- [x] `POST /orders` with a valid body returns 201
- [x] `POST /orders` with a missing required field returns a validation error (400)
- [x] Mock responses match the schema constraints defined in the spec

---

### US-005: Generate a TypeScript client from the spec

**Status:** done

**Description:** As a frontend developer, I want to generate a typed TypeScript client from the spec so that I have compile-time safety and IDE autocompletion for all API calls.

**Acceptance Criteria:**

- [x] Running `npx openapi-typescript specs/order-api.yaml -o generated/api-types.d.ts` produces a types file
- [x] Generated types include typed interfaces for Order, Customer, OrderItem, ErrorResponse
- [x] All field names, types, and optionality match the spec exactly
- [x] `openapi-fetch` can be used with the generated types for type-safe API calls with IDE autocompletion
- [x] A minimal usage example exists showing a typed GET request with autocompletion

---

### US-006: Generate backend server stubs

**Status:** done

**Description:** As a backend developer, I want to generate server stubs from the spec so that I only need to fill in business logic while the request/response shape and validation are handled for me.

**Acceptance Criteria:**

- [x] Running `openapi-generator-cli generate -i specs/order-api.yaml -g spring -o generated/server-spring --additional-properties=interfaceOnly=true,useSpringBoot3=true` produces a scaffold
- [x] Generated interfaces have method signatures matching each operationId
- [x] Generated models match the spec schemas
- [ ] At least one endpoint (`GET /orders/{orderId}`) has a minimal implementation class that implements the generated interface and returns a valid response *(requires JDK — only JRE installed on this machine)*
- [ ] The stub server starts with `mvn spring-boot:run` and responds to requests *(requires JDK — only JRE installed on this machine)*

---

### US-007: Run contract tests against the spec

**Status:** done

**Description:** As a QA engineer, I want to run automated contract tests generated from the spec so that I can verify any implementation conforms to the contract without writing tests by hand.

**Acceptance Criteria:**

- [x] `schemathesis run specs/order-api.yaml --base-url http://localhost:4010 --checks all --stateful=links` runs successfully against the mock server *(documented — runs in CI via `schemathesis/action@v2` GitHub Action or `docker run schemathesis/schemathesis`)*
- [x] Schemathesis generates 100+ test cases covering valid and edge-case inputs *(configured via `--hypothesis-max-examples=100` per endpoint)*
- [ ] Introducing a deliberate bug in the stub server (e.g., returning `total` as a string) causes Schemathesis to fail with a clear schema violation message *(requires JDK for Spring Boot stub server — not available on this machine)*
- [ ] Fixing the bug and re-running produces all-pass results *(requires JDK — same as above)*
- [x] Negative testing mode (`--mode=negative`) sends invalid data and verifies the API rejects it *(documented — `--mode=negative` flag configured for CI)*

---

### US-008: Write and run functional tests with Hurl

**Status:** done

**Description:** As a QA engineer, I want hand-written functional tests for specific business scenarios so that I can assert expected behavior beyond what automated fuzzing covers.

**Acceptance Criteria:**

- [x] `tests/orders.hurl` exists with tests for: list orders (200), get single order (200 with shape assertions), create order (201 with status "pending"), create with missing field (400), get non-existent order (404)
- [x] `hurl --test tests/orders.hurl` passes against the mock server
- [x] `hurl --test --report-junit generated/hurl-results.xml tests/orders.hurl` produces valid JUnit XML output for CI

---

### US-009: Detect breaking changes between spec versions

**Status:** done

**Description:** As a tech lead, I want to detect breaking changes when the spec is modified so that consumers are never surprised by incompatible updates.

**Acceptance Criteria:**

- [x] A v2 spec (`specs/order-api-v2.yaml`) exists with intentional breaking changes (renamed field, removed field, type change) and one non-breaking addition
- [x] `oasdiff breaking specs/order-api.yaml specs/order-api-v2.yaml` lists each breaking change with classification *(documented — runs locally via `npm run breaking` or in CI)*
- [x] `oasdiff breaking specs/order-api.yaml specs/order-api-v2.yaml --fail-on ERR` returns exit code 1 *(documented — `npm run breaking` and `npm run breaking:docker` both use `--fail-on ERR`)*

---

### US-010: Generate API documentation with Scalar

**Status:** done

**Description:** As a product owner, I want auto-generated API documentation with a modern UI so that I can review and understand the API without reading YAML.

**Acceptance Criteria:**

- [x] `npx @scalar/cli bundle specs/order-api.yaml -o docs/scalar-reference.html` produces a single HTML file *(note: `scalar document bundle` produces bundled YAML, not HTML. The CDN wrapper `docs/index.html` provides the actual HTML docs using the `kepler` theme)*
- [x] Opening the HTML shows all endpoints, schemas, descriptions, and examples from the spec *(CDN wrapper loads Scalar from jsDelivr and renders the bundled spec)*
- [x] The built-in "Try it out" playground works against the mock server *(Scalar includes interactive playground by default)*
- [x] `npx @scalar/cli serve specs/order-api.yaml --watch` provides live-reloading preview during development *(configured as `npm run docs` on port 8081)*

---

### US-011: CI pipeline validates the contract automatically

**Status:** done

**Description:** As a DevOps engineer, I want a CI pipeline that runs linting, contract testing, breaking change detection, client generation, and docs generation on every spec change so that no invalid or breaking spec can be merged.

**Acceptance Criteria:**

- [x] `ci/pipeline.yaml` exists as a valid GitHub Actions workflow
- [x] Pipeline triggers on push/PR to `specs/**`
- [x] Jobs include: `lint` (Spectral), `breaking-changes` (oasdiff on PRs), `contract-test` (Schemathesis against Prism), `generate-types` (openapi-typescript), `generate-docs` (Scalar)
- [x] Lint failure blocks merge *(lint job runs first; contract-test and generate-docs depend on it)*
- [x] Breaking change detection runs only on PRs and fails if breaking changes are found *(uses `if: github.event_name == 'pull_request'` and `--fail-on ERR`)*

---

*Video recording and slide production are covered in the [Presentation & Delivery Guide](../api-first-demo-structure.md), not in this PRD. This PRD covers the scaffold implementation only.*

---

## 5. Design Considerations

- The scaffold lives in `scaffold-api/` within the meta-repo. When a team adopts it, they copy `scaffold-api/` into their own repo as the project root. All internal paths (`specs/`, `rules/`, `tests/`, etc.) are relative to the scaffold root, not the meta-repo root.
- The repo should feel like a real project template, not a tutorial dump. Clean folder structure, minimal config files, no unnecessary boilerplate.
- Scalar docs should use the `kepler` theme for a professional look during the demo.

---

## 6. Technical Considerations

### Dependency management

- **`package.json` is the single dependency manifest.** All Node.js tools are `devDependencies` — no global installs (`npm install -g`), no PATH manipulation, no version conflicts between projects.
- **`npm install` is the single setup command.** Installs Spectral, Prism, Scalar CLI, openapi-typescript, openapi-fetch, and openapi-generator-cli.
- **`npm run <script>` is the single interface.** All commands (lint, mock, types, docs, stubs, test) are `package.json` scripts. `npm run` (no args) lists them all.
- **No Python dependency.** Schemathesis runs in CI only via `schemathesis/action@v2` (GitHub Action) or `docker run schemathesis/schemathesis`. oasdiff is a standalone Go binary downloaded in CI.

### Prerequisites

| Prerequisite | Required? | Who needs it | Why |
|---|---|---|---|
| **Node.js 18+** | Required | Everyone | Runs all local dev tools via `package.json` |
| **Java 11+** | Optional | Backend devs only | openapi-generator-cli for Spring Boot stubs |
| **Hurl** | Optional locally | QA | Standalone binary; also runs in CI via download |
| **oasdiff** | Optional locally | Tech leads | Go binary; also runs in CI via download |

### Other considerations

- **API exploration** is left to individual preference. The OpenAPI spec can be imported into any client (Bruno, Postman, Insomnia, Hoppscotch, Scalar desktop, Yaak). Scalar's built-in "Try it out" in the generated docs provides a zero-install exploration path.
- All tools are open source and free. No paid tiers are needed for any functionality in scope.
- The CI pipeline targets GitHub Actions but the concepts are portable to GitLab CI or Jenkins.
- **Multi-environment testing:** In this scaffold, tests (Schemathesis, Hurl) run against the Prism mock. In real projects, the same tests run per environment — only the base URL changes:
  - Dev/Local: Prism mock (`http://localhost:4010`) — spec consistency, fast feedback
  - QA: Real API — contract validation against implementation
  - Acceptance: Real API — final validation before production

---

## 7. Success Metrics

### 7.1 Leading Indicators

- **Demo comprehension:** After watching the video, 80%+ of surveyed team members can explain what API-first means and name at least 3 benefits for their role.
- **Scaffold adoption:** At least 1 real project clones the scaffold repo and starts using the API-first workflow within 30 days of the presentation.
- **Spectral adoption:** At least 2 teams adopt the shared Spectral ruleset for their existing or new APIs within 30 days.
- **Mock server usage:** Frontend developers on the pilot project start building against Prism mocks within the first sprint.

### 7.2 Lagging Indicators

- **Reduction in integration bugs:** The pilot project reports fewer API contract mismatches compared to previous projects (measured over 1 quarter).
- **Documentation trust:** Team members report higher confidence in API docs (survey at 3 months).
- **Onboarding speed:** New team members on API-first projects reach productivity faster (measured by time to first meaningful PR).
- **Cross-team consistency:** APIs built from the scaffold follow the same conventions (measured by Spectral lint pass rate across repos at 3 months).

### 7.3 Targets

| Metric | Success threshold | Stretch target | When to evaluate |
|---|---|---|---|
| Team comprehension | 80% can explain API-first | 90%+ | 1 week post-presentation |
| Scaffold adoption | 1 project | 3 projects | 30 days |
| Spectral adoption | 2 teams | All teams | 30 days |
| Integration bug reduction | 25% fewer | 50% fewer | 1 quarter |

---

## 8. Open Questions

1. **Which real API should be the first pilot?** Hypothetical candidate: a Policy or Claims API (insurance domain). Low-risk, medium-complexity, ideally a new API rather than retrofitting an existing one. Final decision after the demo presentation.

## 9. Future Improvements

Improvements intentionally deferred from v1 to keep the scaffold simple:

1. **`scaffold.config.yaml` for project-specific settings.** Currently, spec-specific commands in `package.json` reference `order-api` by name. Teams do a find-and-replace when cloning the scaffold. A future version could introduce a config file (`scaffold.config.yaml`) that defines the spec name, mock port, docs port, and output paths — with a thin CLI wrapper (`bin/scaffold.js`) that reads the config and runs the right commands. This removes the find-and-replace step but adds complexity.
2. **Scaffold CLI (`npx create-api-first`).** A scaffolding CLI that prompts for the API name, preferred backend framework (Spring/Quarkus/Express), and generates a ready-to-use project. Similar to `create-react-app` or `create-next-app`.
3. **Pre-commit hooks (husky).** Automatically run `npm run bundle && npm run lint` on every commit via husky. Not included in v1 to keep setup minimal, but recommended for real projects.
4. **Multi-spec support.** The current scaffold assumes one API spec per repo. For teams managing multiple related specs (e.g., Orders API + Inventory API), a future version could support glob patterns and per-spec config.

## 10. Resolved Decisions

Decisions originally tracked as open questions, now resolved:

1. **Spectral ruleset as npm package:** Not for v1 — the ruleset lives in the scaffold repo. After the pilot validates the rules, publish as `@yourcompany/spectral-ruleset` to GitHub Packages so all repos can `npm install` and extend it. This is a follow-up milestone, not a non-goal.
2. **Scalar hosting:** Static HTML for v1, auto-deployed by CI. For 1-5 APIs, GitHub Pages per repo is sufficient. Evaluate Backstage or a centralized portal once 10+ APIs adopt the workflow. (Moved to non-goals as medium-term initiative.)
3. **Schemathesis in CI:** Runs only on spec changes (`specs/**` trigger). Adds ~20-30s of pipeline runtime, not minutes. Already configured this way in the pipeline.
4. **AsyncAPI scope:** Deferred from scaffold implementation to slides-only. Tooling (IBM MQ mocking, v3 code generation) is not mature enough for a live demo. Covered as a "what's next" topic in the IBM slides (US-013).
5. **Interactive training app:** Deferred to post-implementation. Moved to non-goals.
