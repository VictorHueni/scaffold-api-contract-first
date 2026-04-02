# API-First Demo Structure
## Convincing a Pluridisciplinary Team

---

## Overall Narrative Arc

**Opening hook (2 min):** Start with a "wall of pain" slide. List real problems the team has faced: frontend blocked by backend, QA testing against stale specs, docs nobody trusts, credentials shared in Slack, inconsistent API shapes across squads. Ask the audience to raise hands if they've lived through any of these. Then say: "Every single one of these disappears with one shift in how we work."

**Core thesis:** One contract file drives everything. Mocks, clients, stubs, tests, docs, security checks, gateway config, monitoring. Write it once, generate the rest. Every role starts working on day one.

**Closing:** Side-by-side timeline. Traditional approach vs API-first. Show how parallel work compresses delivery by weeks.

---

## TIER 1: Core Lifecycle

This is the main walkthrough. Each phase feeds into the next. The audience should see artifacts flowing from the contract like branches from a trunk.

---

### Phase 1: The Contract (OpenAPI Specification)

**What you showcase:**

- A real OpenAPI 3.1 YAML file describing an Order Management API (3-4 endpoints, request/response schemas, error models, auth)
- Live editing in a visual editor with instant preview
- Schema reuse with `$ref` to show DRY principle
- The spec as a PR in Git: reviewable, versionable, diffable
- Multiple roles reviewing the same PR (product owner checks field names, security checks auth schemes, QA checks error codes)

**Recommended stack/tools:**

| Piece | Tool | Why |
|---|---|---|
| Spec format | OpenAPI 3.1 (YAML) | Latest standard, JSON Schema alignment |
| Visual editor | Stoplight Studio (free desktop) | Best visual editor, no YAML knowledge needed for reviewers |
| Alternative editor | Swagger Editor (web) | Free, instant, nothing to install |
| Lightweight editor | VS Code + OpenAPI extension (42Crunch) | For devs who prefer code |
| Version control | Git + GitHub/GitLab | PR-based review with all roles as reviewers |
| Spec preview in PR | Redocly CLI (`redocly preview-docs`) | Renders beautiful docs from the PR branch |

---

### Phase 2: Mock Server

**What you showcase:**

- Start the mock server with one command, pointing at the contract
- Frontend dev hits the mock and gets realistic responses instantly
- Dynamic examples: show how the mock respects schemas, enums, and constraints
- Validation mode: send a malformed request and watch the mock reject it with the exact error the real API will return
- Callback/webhook simulation if relevant

**Recommended stack/tools:**

| Piece | Tool | Why |
|---|---|---|
| Mock server | Prism (by Stoplight) | Industry standard, reads OpenAPI directly, supports dynamic mocking and validation proxy mode |
| Alternative | WireMock + OpenAPI plugin | More enterprise-grade, supports stateful scenarios |
| Alternative | Mockoon | Desktop GUI, good for non-technical team members |
| Request testing | curl / Bruno / Hoppscotch | Show requests hitting the mock live |
| Docker wrapper | Docker Compose with Prism | One `docker-compose up` to spin up the mock |

---

### Phase 3: Client Code Generation

**What you showcase:**

- Run the generator against the contract, get a fully typed TypeScript client in seconds
- Show the generated types: every field, every enum, every optional marker matches the spec
- IDE autocompletion working out of the box from the generated client
- Compare: hand-written fetch calls with typos vs generated client with compile-time safety
- Show generation for multiple languages in one pass (TypeScript + Java + Python)

**Recommended stack/tools:**

| Piece | Tool | Why |
|---|---|---|
| Generator | openapi-generator-cli | Supports 50+ languages/frameworks, most mature option |
| TypeScript-specific | openapi-typescript + openapi-fetch | Lighter weight, excellent TS inference, no code bloat |
| Alternative | Orval | React Query / SWR hooks generated from spec, great DX |
| Alternative | Kiota (Microsoft) | Excellent for .NET ecosystems |
| CI integration | GitHub Actions / GitLab CI | Auto-regenerate clients on spec change |

---

### Phase 4: Backend Stubs and Server Generation

**What you showcase:**

- Generate server stubs with controller interfaces and data models
- The developer's job: fill in the business logic inside pre-shaped functions
- Show the generated validation middleware: request validation happens automatically based on the spec
- Input that violates the schema is rejected before it reaches your code
- Show how the contract enforces the response shape too

**Recommended stack/tools:**

| Piece | Tool | Why |
|---|---|---|
| Node/Express stubs | openapi-generator (nodejs-express-server) | Full scaffold with validation |
| Spring Boot stubs | openapi-generator (spring) | Generates interfaces, devs implement them |
| .NET stubs | NSwag or Kiota | Strong typing, middleware generation |
| Request validation | express-openapi-validator | Middleware that validates every request/response against the spec at runtime |
| Alternative validation | Connexion (Python/Flask) | Routes + validates directly from the spec |

---

### Phase 5: Contract Testing

**What you showcase:**

- Run contract tests against the real backend: does it actually return what the spec says?
- Break something on purpose (rename a field, change a type) and watch the test fail
- Show the CI pipeline blocking the merge
- Provider vs consumer testing: both sides tested independently against the contract
- Show a "contract drift report" highlighting mismatches

**Recommended stack/tools:**

| Piece | Tool | Why |
|---|---|---|
| Spec-based testing | Schemathesis | Auto-generates test cases from OpenAPI, finds edge cases humans miss |
| Alternative | Dredd | Runs spec examples against the live API, straightforward |
| Consumer-driven | Pact | When multiple consumers depend on your API, each consumer defines what they need |
| CI integration | GitHub Actions / GitLab CI | Block merges on test failure |
| Runtime validation | express-openapi-validator (proxy mode) | Continuous validation in staging |

---

### Phase 6: Auto-Generated Documentation

**What you showcase:**

- Run one command, get a complete interactive API reference site
- "Try it out" feature: developers can make real requests from the docs page
- Show that the docs are always current because they come from the spec (no manual sync)
- Compare: a stale Confluence page vs auto-generated docs. Ask "which do you trust?"
- Customization: branding, custom descriptions, usage guides alongside the reference

**Recommended stack/tools:**

| Piece | Tool | Why |
|---|---|---|
| Documentation renderer | Redoc (MIT) | Beautiful, responsive, single HTML file output |
| Interactive docs | Swagger UI (Apache-2.0) | Industry standard, "Try it out" feature built in |
| Alternative | Scalar (MIT) | Modern, beautiful, fully open source |
| CI deployment | GitHub Pages / Netlify | Auto-deploy docs on spec change |

---

### Phase 7: Environments and Credentials

**What you showcase:**

- The `servers` block in the spec defining dev, staging, prod URLs
- Security schemes declared in the contract (API key, OAuth2 with scopes, JWT)
- Show how each environment has its own credential set, managed centrally
- Environment switching in the generated client: one config change, not a code change
- Secret management integration: credentials never in the repo

**Recommended stack/tools:**

| Piece | Tool | Why |
|---|---|---|
| Spec servers block | OpenAPI `servers` array | Native multi-environment support |
| Secret management | HashiCorp Vault | Open source, centralized, audited credential storage |
| Env config | dotenv + per-environment files | Simple, understood by everyone |
| API key management | Kong Gateway | Gateway-level key provisioning and rotation |
| OAuth2 flows | Keycloak | Open source (CNCF), full OAuth2/OIDC provider |

---

## TIER 2: Governance Layer

These phases show maturity and scalability. They answer the question: "What happens when we have 10 teams building 50 APIs?"

---

### Phase 8: Linting and API Style Enforcement (Spectral)

**What you showcase:**

- A custom Spectral ruleset encoding your organization's API standards
- Rules for: naming conventions (camelCase vs snake_case), required pagination pattern, mandatory error schema, required versioning header, description length minimums
- Run Spectral against a "bad" spec and show all violations
- Fix them live and watch the linter go green
- Show CI integration: the PR is blocked until the spec passes linting
- Show how a new team member can't accidentally break conventions

**Recommended stack/tools:**

| Piece | Tool | Why |
|---|---|---|
| Linter | Spectral (by Stoplight) | Open source, extensible, massive rule ecosystem |
| Custom rulesets | .spectral.yaml in repo root | Version-controlled, shared across all API repos |
| Pre-built rules | Spectral OAS ruleset (built-in) | 25+ rules out of the box |
| Additional rules | @stoplight/spectral-owasp-ruleset | Security-focused linting |
| CI integration | spectral lint in GitHub Actions | Block PRs that violate standards |
| IDE integration | VS Code Spectral extension | Developers see violations as they type |

---

### Phase 9: Breaking Change Detection

**What you showcase:**

- Compare two versions of the spec (before and after a PR)
- Tool flags: removed endpoint, renamed field, changed required/optional, narrowed enum values
- Classify changes: breaking vs non-breaking vs deprecation
- Show a PR comment auto-generated by CI listing all breaking changes
- Show the policy: breaking changes require a major version bump and a migration guide

**Recommended stack/tools:**

| Piece | Tool | Why |
|---|---|---|
| Diff tool | oasdiff | Purpose-built for OpenAPI diff, classifies breaking vs non-breaking |
| Alternative | Optic | Tracks API changes over time, visual changelog |
| CI integration | oasdiff in GitHub Actions | Auto-comment on PRs with breaking change warnings |
| Changelog generation | Optic | Auto-generated API changelog per version |

---

### Phase 10: Security Scanning from the Contract

**What you showcase:**

- Run a security audit on the OpenAPI spec itself, before any code exists
- Findings: missing auth on endpoints, overly permissive schemas (accepts `additionalProperties`), no rate limiting declared, sensitive data in query params
- Show OWASP API Top 10 mapping
- Fix issues at design time, not after a penetration test

**Recommended stack/tools:**

| Piece | Tool | Why |
|---|---|---|
| Spec security audit | Spectral OWASP ruleset | Open source linting rules mapped to OWASP API Top 10 |
| Runtime scanning | OWASP ZAP with OpenAPI import | ZAP reads the spec and auto-generates attack scenarios |
| CI integration | Spectral + ZAP in CI pipeline | Block deployment if security rules fail |

---

### Phase 11: API Design Consistency Across Teams

**What you showcase:**

- A shared API style guide document (the human-readable version of the Spectral rules)
- Show two APIs from different teams that follow the same patterns: same pagination, same error format, same auth headers, same naming
- A developer switching between APIs notices zero friction
- Internal API catalog showing all APIs in one place
- Governance dashboard: which APIs are compliant, which need work

**Recommended stack/tools:**

| Piece | Tool | Why |
|---|---|---|
| Style guide | Written guide + Spectral ruleset | Human-readable + machine-enforced |
| API catalog | Backstage (Spotify) | Internal developer portal, aggregates all APIs |
| Alternative catalog | Apicurio Registry | Open source schema and API registry |
| Governance dashboard | Optic | Track compliance across all API specs |

---

## TIER 3: Ecosystem Integrations

These show the compounding value. Each one is a "and also..." moment that builds excitement.

---

### Phase 12: Gateway Configuration from Spec

**What you showcase:**

- Import the OpenAPI spec into the API gateway
- Gateway auto-configures: routes, rate limits, CORS policies, auth validation
- No manual gateway config, no drift between spec and gateway
- Show a request being rate-limited based on the spec's `x-rate-limit` extension

**Recommended stack/tools:**

| Piece | Tool | Why |
|---|---|---|
| API Gateway | Kong Gateway | Open source, OpenAPI import, plugins for rate limiting, auth, transforms |
| Alternative | Tyk | Open source, strong OpenAPI support |
| Alternative | APISIX | Apache 2.0, CNCF project, high performance |
| Rate limiting config | Kong rate-limiting plugin via spec extensions | Declared in spec, enforced by gateway |
| CORS config | Gateway auto-config from spec | No manual CORS setup |

---

### Phase 13: SDK Publishing Pipeline

**What you showcase:**

- CI pipeline: spec changes trigger client SDK regeneration
- SDKs auto-published to internal npm / Maven / PyPI registry
- Consuming teams bump a package version instead of hand-editing API calls
- Show a changelog attached to each SDK release
- Semantic versioning aligned with the spec version

**Recommended stack/tools:**

| Piece | Tool | Why |
|---|---|---|
| Generator | openapi-generator-cli in CI | Automated, multi-language |
| npm registry | Verdaccio (self-hosted) or GitHub Packages | Internal package registry |
| Maven registry | Nexus or GitHub Packages | For Java SDKs |
| PyPI registry | devpi or GitHub Packages | For Python SDKs |
| CI pipeline | GitHub Actions with matrix builds | Generate + publish for all languages in parallel |
| Versioning | Release-please or semantic-release | Auto-version based on spec changes |

---

### Phase 14: API Client & Functional Test Generation

**What you showcase:**

- Import the OpenAPI spec into Bruno to auto-generate a collection for manual exploration
- Bruno collections stored as plain text files in Git, versioned alongside the spec
- Write targeted functional assertions with Hurl (plain text HTTP test files)
- Run Hurl tests in CI with a single binary, no runtime dependencies
- Show that QA has both exploratory tooling (Bruno) and automated assertions (Hurl) from the same spec

**Recommended stack/tools:**

| Piece | Tool | Why |
|---|---|---|
| API client (desktop) | Bruno (MIT license) | Open source, offline-first, Git-friendly, imports OpenAPI directly |
| Functional test runner | Hurl (Apache-2.0) | Plain text HTTP tests, built on libcurl, single binary, CI-native |
| Alternative client | Hoppscotch (MIT) | Fully open source web-based API client |
| Interactive testing | Swagger UI "Try it out" | Already in your docs, no extra tool needed |
| CI runner | Hurl CLI | Returns exit codes, outputs JUnit XML, no Node.js required |

---

### Phase 15: Collaboration and Review Workflow

**What you showcase:**

- A PR that modifies the spec: show the rendered diff (visual, not raw YAML)
- Required reviewers from each discipline: frontend, backend, QA, security, product
- Automated checks on the PR: linting passes, no breaking changes, security audit passes
- Show how a one-line spec change triggers all downstream regeneration
- Design review meeting workflow: everyone looks at the rendered spec, not code

**Recommended stack/tools:**

| Piece | Tool | Why |
|---|---|---|
| Visual diff | Redocly CLI or oasdiff | Human-readable spec diffs in PRs |
| PR automation | GitHub Actions / GitLab CI | Orchestrate all checks |
| Review process | GitHub CODEOWNERS | Require sign-off from each discipline |
| Notification | Slack/Teams webhook on spec change | Alert all stakeholders |
| Design review | Swagger Editor or VS Code + OpenAPI extension | Non-technical reviewers can use the visual editor |

---

### Phase 16: Event-Driven Extension (AsyncAPI)

**What you showcase:**

- AsyncAPI spec for event-driven APIs (Kafka topics, RabbitMQ queues, WebSocket channels)
- Same contract-first philosophy applied to messages, not just HTTP endpoints
- Code generation, documentation, and validation for event schemas
- Show how REST API and event API specs live side by side in the same repo

**Recommended stack/tools:**

| Piece | Tool | Why |
|---|---|---|
| Spec format | AsyncAPI 3.0 | The OpenAPI equivalent for event-driven architectures |
| Editor | AsyncAPI Studio | Visual editor for event specs |
| Docs | AsyncAPI Generator | Auto-generated event docs matching your API docs style |
| Code generation | AsyncAPI Generator templates | Generate consumer/producer code from the spec |
| Schema registry | Confluent Schema Registry or Apicurio | Centralized event schema management |

---

## Demo Flow Summary

| # | Phase | Duration | Key Takeaway |
|---|---|---|---|
| 0 | Wall of Pain | 2 min | These problems are real and expensive |
| 1 | Contract | 5 min | One file to rule them all |
| 2 | Mock Server | 3 min | Frontend unblocked on day one |
| 3 | Client Codegen | 3 min | No more hand-written API calls |
| 4 | Backend Stubs | 3 min | Shape is guaranteed, just add logic |
| 5 | Contract Testing | 4 min | Drift is caught automatically |
| 6 | Auto Docs | 2 min | Docs are never stale again |
| 7 | Environments | 3 min | Credentials managed, not scattered |
| 8 | Spectral Linting | 4 min | Standards enforced by machines |
| 9 | Breaking Changes | 3 min | No more surprise breakages |
| 10 | Security Scanning | 3 min | Shift security left to design time |
| 11 | Cross-team Consistency | 2 min | 50 APIs, one experience |
| 12 | Gateway Config | 2 min | Infra from the spec |
| 13 | SDK Pipeline | 2 min | Consumers just bump a version |
| 14 | API Client & Tests | 2 min | QA explores in Bruno, asserts in Hurl |
| 15 | Collaboration | 3 min | Every role reviews one diff |
| 16 | AsyncAPI | 2 min | Same philosophy for events |
| -- | Timeline Comparison | 3 min | Traditional vs API-first side by side |
|   | **Total** | **~50 min** | |

---

## Role Impact Matrix

Show this at the end to drive home how every discipline benefits:

| Role | Without API-First | With API-First |
|---|---|---|
| **Frontend Dev** | Blocked until backend is ready, guesses field names | Works from day one with mocks and typed clients |
| **Backend Dev** | Builds API shape by gut feeling, breaks consumers | Implements against a validated contract |
| **QA Engineer** | Maintains API collections by hand, tests late | Auto-generated contract tests in CI, Bruno collections from spec, Hurl assertions in pipeline |
| **DevOps** | Configures gateway manually, manages env sprawl | Gateway imports spec, environments declared centrally |
| **Security** | Reviews after deployment, expensive fixes | Scans the spec before code exists |
| **Tech Lead** | Polices conventions in code review, inconsistency creeps in | Spectral enforces standards automatically |
| **Product Owner** | Reads code to understand the API | Reviews a visual spec, no code needed |
| **New Team Member** | Reads scattered docs and Slack threads | Reads the spec and generated docs, productive in hours |
