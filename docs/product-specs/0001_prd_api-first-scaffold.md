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

---

## 4. User Stories

### US-001: Clone and understand the scaffold

**Status:** pending

**Description:** As a developer joining a new API project, I want to clone the scaffold repo and immediately understand its structure so that I can start working without reading external documentation.

**Acceptance Criteria:**

- [ ] Repo has a clear README explaining the folder structure and purpose of each directory
- [ ] Running `ls` at the root reveals an intuitive layout: `specs/`, `rules/`, `tests/`, `docs/`, `ci/`
- [ ] README lists all prerequisites and a single setup command to install dependencies
- [ ] README mentions that the spec can be imported into any API client (Bruno, Postman, Insomnia, Hoppscotch, Scalar, Yaak) for manual exploration — the scaffold is unopinionated about personal tooling

---

### US-002: Write and validate an OpenAPI contract

**Status:** pending

**Description:** As a tech lead, I want to write an OpenAPI 3.1 spec for the Order Management API and validate it passes linting so that I can be confident it meets organizational standards before sharing it for review.

**Acceptance Criteria:**

- [ ] `specs/order-api.yaml` exists with complete endpoints: GET/POST/PUT/DELETE for orders, GET for order items
- [ ] Spec includes schemas with `type`, `format`, `example`, `x-faker`, `description`, and constraints (`minimum`, `maximum`, `enum`, `pattern`)
- [ ] Spec includes `servers` block with mock, dev, staging, and production URLs
- [ ] Spec includes security schemes (API key and OAuth2)
- [ ] Spec includes OpenAPI `links` for stateful testing (POST response links to GET/PUT)
- [ ] `npx @scalar/cli validate specs/order-api.yaml` passes with no errors
- [ ] `spectral lint specs/order-api.yaml --ruleset rules/.spectral.yaml` passes with no errors

---

### US-003: Lint specs against organizational rules

**Status:** pending

**Description:** As a tech lead, I want a custom Spectral ruleset that enforces our API standards so that new specs automatically follow conventions without relying on manual review.

**Acceptance Criteria:**

- [ ] `rules/.spectral.yaml` exists and extends `spectral:oas`
- [ ] Rules enforce: operationId required, camelCase property names, descriptions on operations, examples on schema properties, error responses on all operations
- [ ] Running Spectral against a well-formed spec produces zero errors
- [ ] A "bad spec" variant (`specs/order-api-bad.yaml`) exists with intentional violations (snake_case field, missing operationId, missing error response)
- [ ] Running Spectral against the bad spec produces at least 3 violations with clear messages

---

### US-004: Start a mock server from the spec

**Status:** pending

**Description:** As a frontend developer, I want to start a mock server with one command so that I can build UI against realistic API responses without waiting for the backend.

**Acceptance Criteria:**

- [ ] `prism mock specs/order-api.yaml --port 4010` starts and responds to requests (static mode, returns `example` values)
- [ ] `prism mock -d specs/order-api.yaml --port 4010` starts and responds with different realistic data on each call (dynamic mode, uses `x-faker`)
- [ ] `GET /orders/{orderId}` returns a well-shaped Order object with realistic field values
- [ ] `POST /orders` with a valid body returns 201
- [ ] `POST /orders` with a missing required field returns a validation error (400)
- [ ] Mock responses match the schema constraints defined in the spec

---

### US-005: Generate a TypeScript client from the spec

**Status:** pending

**Description:** As a frontend developer, I want to generate a typed TypeScript client from the spec so that I have compile-time safety and IDE autocompletion for all API calls.

**Acceptance Criteria:**

- [ ] Running `npx openapi-typescript specs/order-api.yaml -o generated/api-types.d.ts` produces a types file
- [ ] Generated types include typed interfaces for Order, Customer, OrderItem, ErrorResponse
- [ ] All field names, types, and optionality match the spec exactly
- [ ] `openapi-fetch` can be used with the generated types for type-safe API calls with IDE autocompletion
- [ ] A minimal usage example exists showing a typed GET request with autocompletion

---

### US-006: Generate backend server stubs

**Status:** pending

**Description:** As a backend developer, I want to generate server stubs from the spec so that I only need to fill in business logic while the request/response shape and validation are handled for me.

**Acceptance Criteria:**

- [ ] Running `openapi-generator-cli generate -i specs/order-api.yaml -g nodejs-express-server -o generated/server-stubs` produces a scaffold
- [ ] Generated controllers have method signatures matching each operationId
- [ ] Generated models match the spec schemas
- [ ] At least one endpoint (`GET /orders/{orderId}`) has a minimal hardcoded implementation that returns a valid response
- [ ] The stub server starts with `npm start` and responds to requests

---

### US-007: Run contract tests against the spec

**Status:** pending

**Description:** As a QA engineer, I want to run automated contract tests generated from the spec so that I can verify any implementation conforms to the contract without writing tests by hand.

**Acceptance Criteria:**

- [ ] `schemathesis run specs/order-api.yaml --base-url http://localhost:4010 --checks all --stateful=links` runs successfully against the mock server
- [ ] Schemathesis generates 100+ test cases covering valid and edge-case inputs
- [ ] Introducing a deliberate bug in the stub server (e.g., returning `total` as a string) causes Schemathesis to fail with a clear schema violation message
- [ ] Fixing the bug and re-running produces all-pass results
- [ ] Negative testing mode (`--mode=negative`) sends invalid data and verifies the API rejects it

---

### US-008: Write and run functional tests with Hurl

**Status:** pending

**Description:** As a QA engineer, I want hand-written functional tests for specific business scenarios so that I can assert expected behavior beyond what automated fuzzing covers.

**Acceptance Criteria:**

- [ ] `tests/orders.hurl` exists with tests for: list orders (200), get single order (200 with shape assertions), create order (201 with status "pending"), create with missing field (400), get non-existent order (404)
- [ ] `hurl --test tests/orders.hurl` passes against the mock server
- [ ] `hurl --test --report-junit generated/hurl-results.xml tests/orders.hurl` produces valid JUnit XML output for CI

---

### US-009: Detect breaking changes between spec versions

**Status:** pending

**Description:** As a tech lead, I want to detect breaking changes when the spec is modified so that consumers are never surprised by incompatible updates.

**Acceptance Criteria:**

- [ ] A v2 spec (`specs/order-api-v2.yaml`) exists with intentional breaking changes (renamed field, removed field, type change) and one non-breaking addition
- [ ] `oasdiff breaking specs/order-api.yaml specs/order-api-v2.yaml` lists each breaking change with classification
- [ ] `oasdiff breaking specs/order-api.yaml specs/order-api-v2.yaml --fail-on ERR` returns exit code 1

---

### US-010: Generate API documentation with Scalar

**Status:** pending

**Description:** As a product owner, I want auto-generated API documentation with a modern UI so that I can review and understand the API without reading YAML.

**Acceptance Criteria:**

- [ ] `npx @scalar/cli bundle specs/order-api.yaml -o docs/scalar-reference.html` produces a single HTML file
- [ ] Opening the HTML shows all endpoints, schemas, descriptions, and examples from the spec
- [ ] The built-in "Try it out" playground works against the mock server
- [ ] `npx @scalar/cli serve specs/order-api.yaml --watch` provides live-reloading preview during development

---

### US-011: CI pipeline validates the contract automatically

**Status:** pending

**Description:** As a DevOps engineer, I want a CI pipeline that runs linting, contract testing, breaking change detection, client generation, and docs generation on every spec change so that no invalid or breaking spec can be merged.

**Acceptance Criteria:**

- [ ] `ci/pipeline.yaml` exists as a valid GitHub Actions workflow
- [ ] Pipeline triggers on push/PR to `specs/**`
- [ ] Jobs include: `lint` (Spectral), `breaking-changes` (oasdiff on PRs), `contract-test` (Schemathesis against Prism), `generate-types` (openapi-typescript), `generate-docs` (Scalar)
- [ ] Lint failure blocks merge
- [ ] Breaking change detection runs only on PRs and fails if breaking changes are found

---

### US-012: Record a video walkthrough of the full workflow

**Status:** pending

**Description:** As the presenter, I want to record a polished video demo walking through each phase of the API-first workflow so that the IT department can watch and understand the approach.

**Acceptance Criteria:**

- [ ] Video covers: problem statement, contract writing, linting, mocking (static + dynamic), codegen, server stubs, contract testing (with intentional bug), breaking change detection, Scalar docs (with "Try it out"), Hurl functional tests, CI pipeline, IBM stack (slides only), role impact summary
- [ ] Each section is recorded as a separate clip for easy re-recording
- [ ] Terminal font is 16pt+ and readable at 1080p
- [ ] Total final video is 35-40 minutes after editing
- [ ] IBM stack integration is presented via slides, not live terminal

---

### US-013: Present IBM stack integration via slides

**Status:** pending

**Description:** As the presenter, I want slides covering API Connect publishing, Developer Portal, App Connect import, and AsyncAPI/MQ so that the audience understands the IBM integration path without requiring live environment access.

**Acceptance Criteria:**

- [ ] Slides cover: `apic products:publish` workflow, Developer Portal screenshot/mockup, App Connect OpenAPI import flow, AsyncAPI spec for MQ events
- [ ] Slides reference the actual spec file in the repo so viewers know it is the same contract
- [ ] No live IBM environment is required during the presentation

---

## 5. Design Considerations

- The repo should feel like a real project template, not a tutorial dump. Clean folder structure, minimal config files, no unnecessary boilerplate.
- Scalar docs should use the `kepler` theme for a professional look during the demo.
- An interactive training app will be built post-implementation as a companion learning tool (see Open Questions #6).

---

## 6. Technical Considerations

- **Node.js 18+** is required for Prism, Spectral, openapi-typescript, openapi-fetch, openapi-generator-cli (server stubs only), and Scalar CLI.
- **Python 3.8+** is required for Schemathesis and oasdiff.
- **Hurl** is a standalone binary with no runtime dependencies.
- **API exploration** is left to individual preference. The OpenAPI spec can be imported into any client (Bruno, Postman, Insomnia, Hoppscotch, Scalar desktop, Yaak). Scalar's built-in "Try it out" in the generated docs provides a zero-install exploration path.
- **Docker** is optional (for Swagger UI if needed as a fallback) but not required for the core workflow.
- All tools are open source and free. No paid tiers are needed for any functionality in scope.
- The CI pipeline targets GitHub Actions but the concepts are portable to GitLab CI or Jenkins.

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

1. **Which real API should be the first pilot?** Picking a low-risk, medium-complexity API for the first real adoption would validate the workflow without excessive risk.
2. **Should the Spectral ruleset be published as a shared npm package?** This would make it easy for all repos to depend on a single versioned ruleset.
3. **Do we need a shared internal Scalar instance?** Or is static HTML deployed to GitHub Pages / internal hosting sufficient?
4. **What is the team's appetite for Schemathesis in CI?** It adds significant test coverage but also adds pipeline runtime. Should it run on every push or only on spec changes?
5. **AsyncAPI scope:** The implementation plan includes an AsyncAPI spec for MQ events. Should this be included in the scaffold as a template, or is it purely a slide topic?
6. **Interactive training material:** Once the full implementation is complete, build a small interactive web app (React or similar) that walks users through the API-first workflow hands-on — e.g., the x-faker progression from bare spec to realistic mocks. To be scoped after all increments are delivered.
