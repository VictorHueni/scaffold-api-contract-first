# Contract-First Maturity Model

A practical roadmap for evolving an API-first, contract-first workflow from quick wins to full organizational maturity. Each level builds on the previous one. Items within a level can be tackled in any order.

---

## L1 - Foundation

Low-barrier, high-impact capabilities that a single team can activate in days. No cross-team coordination required.

### Shared Mock Server

**What:** A centralized Prism instance fed from the OpenAPI spec examples. Frontend developers, ACE integration developers, and QA engineers all hit the same mock server instead of maintaining their own stubs.

**Why it matters:** Eliminates the classic "I built against my own fake JSON" problem. Everyone works against the same contract from day one, before the real backend exists. Divergence is caught immediately because the mock is generated from the spec, not hand-written.

**How to activate:** Run `prism mock openapi.yaml` on a shared dev server, or let each developer run it locally. The spec is the single source of truth; update the spec and the mock updates automatically.

**Tools:**

- [Prism](https://stoplight.io/open-source/prism) - Open-source mock server from Stoplight
- [Prism documentation](https://docs.stoplight.io/docs/prism)

---

### AI-Assisted Specification

**What:** A Claude Code scaffold pre-loaded with business context (domain glossary, naming conventions, existing schemas) and all contract-first tools (Spectral, oasdiff, Prism). Developers and business analysts design OpenAPI specs with AI guidance that enforces standards and suggests best practices in real time.

**Why it matters:** Removes the blank-page problem. Instead of a developer guessing at endpoint naming or schema structure, the AI provides contextual suggestions grounded in your organization's conventions. BAs can participate in spec design without needing to learn OpenAPI syntax. The AI catches common mistakes (inconsistent naming, missing descriptions, non-standard error responses) before the spec ever reaches a pull request.

**How to activate:** Set up a Claude Code project with your Spectral ruleset, domain glossary, and existing spec examples as context. Share it with the team. The investment is mostly in curating the right context, not in tooling.

**Tools:**

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) - AI coding assistant from Anthropic
- [Spectral](https://spectral.stoplight.io/) - OpenAPI linter with custom rulesets
- [Spectral OWASP ruleset](https://github.com/stoplightio/spectral-owasp-ruleset) - Security linting rules

---

### Seamless Auth for Testing

**What:** Wire your existing Vault (or equivalent secrets manager) credentials into the tools developers and testers use daily: Scalar's "try it out" panel, Hurl test files, Schemathesis CLI runs. Anyone on the team can test an API endpoint without hunting for tokens.

**Why it matters:** Credential friction is one of the biggest silent productivity killers. A developer opens the API docs, clicks "try it out," and gets a 401 because they don't have the right token. They then spend 20 minutes on Slack asking around, finding a wiki page that's outdated, generating a new token manually. Multiply this by every developer, every day. Seamless auth removes that entire loop.

**How to activate:** Your organization already manages secrets with Vault (or similar) for deployments. The gap is the "last mile" - making those same credentials available in development and testing contexts:

- Pre-configure Scalar's authentication settings to pull from a shared dev token
- Use Hurl's `[Options]` section or environment variables for auth headers
- Pass auth via Schemathesis CLI flags or a `.env` file

The infrastructure exists. This is a wiring and convention exercise, not a new platform.

**Tools:**

- [HashiCorp Vault](https://developer.hashicorp.com/vault) - Secrets management
- [Scalar Authentication](https://docs.scalar.com/openapi-editor/authentication) - API docs auth configuration
- [Hurl options](https://hurl.dev/docs/request.html) - HTTP test runner auth

---

## L2 - Automate

Capabilities that add automated safety nets and visibility. Require some pipeline integration but no cross-team coordination.

### Dynamic Security Scanning (OWASP ZAP)

**What:** ZAP (Zed Attack Proxy) runs active security attacks against your mock server or running API. It probes for injection vulnerabilities, authentication bypass, and the full OWASP API Security Top 10 at runtime.

**Why it matters:** Your pipeline already runs the Spectral OWASP ruleset for static spec linting - that catches design-time security gaps (missing auth definitions, unbounded arrays, sensitive data in URLs). ZAP complements this by testing the actual implementation: can I inject SQL through that query parameter? Does the auth actually reject invalid tokens? Does the API leak stack traces on errors?

**Static vs dynamic:** Think of it as two angles on the same problem. Spectral OWASP checks the blueprint. ZAP tests the building. Both are free and open source.

**How to activate:** ZAP has a Docker image and an automation framework that integrates with CI. Point it at your mock or staging URL, define a scan policy (API scan mode), and add it as a GitHub Actions step. Start with a baseline scan (passive, fast) and graduate to active scanning as you tune the false positives.

**Tools:**

- [OWASP ZAP](https://www.zaproxy.org/) - Free, open-source security scanner
- [ZAP Docker](https://www.zaproxy.org/docs/docker/) - Containerized scanning
- [ZAP Automation Framework](https://www.zaproxy.org/docs/automate/) - CI/CD integration
- [OWASP API Security Top 10](https://owasp.org/API-Security/) - The vulnerability list ZAP tests against

---

### API Observability (ELK Stack)

**What:** Pipe APIC gateway access logs and ACE monitoring events into your existing ELK stack (Elasticsearch, Logstash/Filebeat, Kibana). Build dashboards that show call volume per endpoint, latency percentiles, error rate heatmaps, consumer breakdown, and deprecation signals.

**Why it matters:** APIC has built-in analytics, but it's limited to what goes through the gateway and the dashboards are not always flexible enough. With ELK, you get full control: custom visualizations, cross-correlation with ACE flow metrics, alerting on anomalies, and the ability to answer questions like "which endpoints had zero calls in 90 days?" with a simple query. Since the ELK stack is already running in your org, this is about building new dashboards on existing infrastructure, not deploying new tools.

**How to activate:**

1. Configure APIC to export access logs via syslog or Filebeat
2. Set up ACE monitoring events to flow to Logstash
3. Define Elasticsearch index patterns for API traffic
4. Build Kibana dashboards: volume, latency (p50/p95/p99), errors, consumer usage
5. Set up alerts for error spikes or SLA breaches

**Tools:**

- [Kibana](https://www.elastic.co/kibana) - Visualization and dashboarding
- [Filebeat](https://www.elastic.co/beats/filebeat) - Lightweight log shipper
- [Logstash](https://www.elastic.co/logstash) - Log processing pipeline

---

## L3 - Scale

Capabilities that extend the contract-first approach across the organization. Require cross-team alignment, shared standards, and broader infrastructure investment.

### AsyncAPI for Event-Driven APIs

**What:** Apply the same contract-first philosophy to event-driven communication: Kafka topics, IBM MQ queues, MQTT channels. Write AsyncAPI specs that define message schemas, channel bindings, and protocol-specific details. Lint them with Spectral, generate documentation, and produce typed consumers.

**Why it matters:** If your architecture uses IBM MQ and Kafka alongside REST APIs (and it does), those event-driven contracts are currently undocumented or documented ad hoc. Teams discover message formats by reading code or asking on Slack. AsyncAPI brings the same rigor you now have for REST to the async world: a spec is the source of truth, tooling validates it, and consumers can be generated from it.

**Effort and maturity of tooling:** AsyncAPI tooling is less mature than OpenAPI's. The spec itself is solid (v3 is out), Spectral supports it natively, and the generator produces decent TypeScript/Java consumers. But the ecosystem is smaller, community examples are fewer, and you'll hit edge cases. Budget for some trial and error.

**How to activate:** Start with one high-traffic Kafka topic or MQ queue. Write the AsyncAPI spec, lint it, generate docs. Prove the value on one contract before rolling it out across the org.

**Tools:**

- [AsyncAPI](https://www.asyncapi.com/) - The specification format
- [AsyncAPI Generator](https://www.asyncapi.com/tools/generator) - Code and doc generation
- [AsyncAPI Studio](https://github.com/asyncapi/studio) - Visual editor
- [Spectral AsyncAPI ruleset](https://docs.stoplight.io/docs/spectral/01baf06bdd05a-rulesets) - Linting

---

### Schema Registry

**What:** A central, versioned catalog where all contracts live: OpenAPI specs, AsyncAPI specs, GraphQL schemas, Protobuf definitions, JSON Schemas. Teams discover existing APIs and schemas without asking on Slack, detect duplicate or conflicting definitions, and govern shared models (like `Address` or `Customer`) across the organization.

**Why it matters:** Discoverability is a real pain point. When a team needs a customer endpoint, they shouldn't have to ask around to find out if one exists. When two teams independently define an `Address` schema with slightly different fields, nobody catches it until integration testing. A registry makes all contracts visible, searchable, and comparable.

**How it differs from what you already have:**

- **Scalar docs** = reading one API's documentation
- **IBM Developer Portal** = subscribing to APIs managed by APIC
- **Schema Registry** = discovering and governing all contracts across the org, regardless of protocol or gateway

The Developer Portal is a storefront for consumers. The Schema Registry is a governance tool for producers and architects.

**How to activate:** Options range from lightweight (a well-structured Git monorepo with a static site generator) to full platforms (Apicurio Registry, Backstage with the API plugin). Start with whatever matches your org's complexity. If you have 15 APIs, Git + a search page is fine. If you have 50+, invest in Apicurio or Backstage.

**Tools:**

- [Apicurio Registry](https://www.apicur.io/registry/) - Open-source schema registry (Red Hat)
- [Backstage](https://backstage.io/) - Developer portal with API catalog plugin (Spotify)
- [Backstage API docs plugin](https://backstage.io/docs/features/software-catalog/descriptor-format#kind-api)

---

### SDK Generation

**What:** Auto-generate typed client SDKs (TypeScript, Java, Python, etc.) from the OpenAPI spec and publish them to internal registries (npm, Maven). Consumers import the SDK instead of hand-writing HTTP calls.

**Why it matters:** When a consumer uses a generated SDK, the compiler tells them what broke when the spec changes. No more runtime surprises from renamed fields or changed types. It also enforces consistency: everyone calls the API the same way, with the same error handling.

**Why L3 and not earlier:** SDK generation itself is technically easy (run the generator, get code). But making it useful requires coordination: you need a publishing pipeline (CI builds the SDK on spec change, publishes to a registry), consumer buy-in (teams must actually adopt the SDK instead of their hand-written clients), versioning strategy (do you pin SDK versions or auto-update?), and a support model (who fixes bugs in generated code?). That's cross-team coordination, which is L3 territory.

**Tools:**

- [OpenAPI Generator](https://openapi-generator.tech/) - Multi-language code generator
- [Kiota](https://learn.microsoft.com/en-us/openapi/kiota/) - Microsoft's OpenAPI SDK generator
- [openapi-typescript](https://github.com/drwpow/openapi-typescript) - TypeScript-specific, lighter weight

---

### Prod Data as Test Fixtures

**What:** Capture real production payloads, classify and strip PII (names, account numbers, personal identifiers), and feed the anonymized data back as OpenAPI spec examples and test fixtures. Tests run against realistic data instead of hand-crafted fakes.

**Why it matters:** Hand-written test fixtures inevitably miss edge cases that real data contains: unicode characters in names, unexpectedly long strings, null values where you didn't expect them, date formats that vary by locale. Anonymized prod data gives you realistic coverage without compliance risk. It also keeps your spec examples honest - they reflect what the API actually returns, not what someone imagined it returns.

**Why L3:** The technical challenge (data masking) is solvable, but the organizational challenge is significant. You need compliance/legal buy-in for capturing production data, a pipeline to anonymize it reliably, classification rules for what constitutes PII in your domain, and a process to refresh fixtures as the data evolves. This is cross-functional work.

**Tools:**

- [Tonic.ai](https://www.tonic.ai/) - Synthetic data generation from production schemas
- [ARX](https://github.com/arx-deidentification/arx) - Open-source data anonymization
- [Faker](https://fakerjs.dev/) - Generating realistic fake data (lighter alternative)

---

## L4 - Mastery

Ambitious capabilities that represent full maturity. These are either large-scale infrastructure investments or independent product-level efforts. They make sense once everything else is working smoothly.

### Full CI/CD Pipeline

**What:** End-to-end automation from pull request to production: PR triggers spec linting (Spectral), breaking change detection (oasdiff), mock generation (Prism), contract tests (Schemathesis), functional tests (Hurl), BAR file build (ace-maven-plugin), deployment to CP4i (GitOps), smoke tests, and promotion to production. No human in the loop from merge to prod.

**Why it matters:** Every manual step is a source of delay and error. Full CI/CD means a spec change goes from code to production in minutes, with every safety net running automatically. It's the end state that all the other capabilities build toward.

**Why L4:** You're already building pieces of this (slide 7 covers the IBM CI/CD components). "Full" means all the pieces are wired together and trusted enough to deploy without human approval. In the IBM world with CP4i, this is hard because BAR deployments, Integration Server configuration, and APIC product publishing all need orchestrating. It requires all the L1-L3 capabilities to be solid first.

**Tools:**

- [GitHub Actions](https://github.com/features/actions) - CI/CD orchestration
- [Tekton](https://tekton.dev/) - Kubernetes-native CI/CD
- [ace-maven-plugin](https://github.com/ot4i/ace-maven-plugin) - BAR file build
- [CP4i GitOps patterns](https://github.com/IBM/cloudpak-gitops) - IBM deployment automation

---

### Visual Mapping IDE (OSS Project)

**What:** A vendor-neutral, open-source mapping tool where you import any contract (OpenAPI, WSDL, AsyncAPI, GraphQL, JSON Schema), visually link fields between source and target on a canvas, define transformations, and generate output for any runtime: ACE message maps, DataPower stylesheets, MuleSoft DataWeave, Kafka Connect SMTs, and more.

**Why it matters:** Every ESB, middleware, and ETL tool has its own proprietary way of defining mappings. When you switch platforms or need to support multiple runtimes, you're locked in. A visual, agnostic mapping IDE decouples the mapping logic from the execution engine. Define once, generate for any target.

**Why L4:** This is an independent OSS product, not a pipeline addition. It requires its own architecture, UI framework, plugin system for output formats, community building, and sustained development. It's the most ambitious item on the roadmap, but also potentially the most impactful for the broader integration community.

**Status:** PRD in progress. See `prd_integration-mapping-as-code.md` in this repository.

---

### Traffic Validation

**What:** A proxy or sidecar deployed in non-prod environments captures live request/response pairs and validates them against the OpenAPI spec. Every mismatch (undocumented field, wrong type, missing header) is flagged as contract drift.

**Why it matters:** Even with good CI, some drift slips through: an endpoint returning an extra field nobody tested for, a date format that changed subtly, an error response that doesn't match the spec schema. Traffic validation is the ultimate safety net that catches what tests miss.

**Why L4 (and not higher priority):** With a solid CI pipeline running Schemathesis and Hurl against every PR, the vast majority of drift is caught at the source. Traffic validation adds value at scale (dozens of APIs, incomplete test coverage) or for legacy APIs that were deployed without contract tests. For most teams, it's insurance on top of insurance. A real CI pipeline drastically reduces the need for this.

**Tools:**

- [Optic](https://www.useoptic.com/) - API traffic diff and validation
- [APIClarity](https://github.com/openclarity/apiclarity) - Open-source API traffic analysis (ex-Cisco)

---

## Summary

| Level | Items | Theme |
|-------|-------|-------|
| **L1 Foundation** | Shared Mocks, AI-Assisted Spec, Seamless Auth | One team, quick wins, days not weeks |
| **L2 Automate** | Dynamic Security (ZAP), API Observability (ELK) | Automated safety nets on existing infra |
| **L3 Scale** | AsyncAPI, Schema Registry, SDK Generation, Prod Data Fixtures | Cross-team, cross-protocol, org-wide |
| **L4 Mastery** | Full CI/CD, Mapping IDE, Traffic Validation | End-state vision, major investments |
