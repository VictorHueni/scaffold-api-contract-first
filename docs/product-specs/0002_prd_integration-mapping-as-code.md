# PRD: Integration Mapping as Code

**Status:** exploration

**Related:**
- [`0001_prd_api-first-scaffold.md`](./0001_prd_api-first-scaffold.md) — this PRD extends the contract-first approach from single API documentation to the integration layer between APIs.
- [`../reference/eip-patterns-for-api-mediation.md`](../reference/eip-patterns-for-api-mediation.md) — reference catalog of Enterprise Integration Patterns (Hohpe & Woolf) with coverage analysis against this mapping spec.
- [`../reference/openapi-overlay-specification.md`](../reference/openapi-overlay-specification.md) — reference for the OpenAPI Overlay Specification used to annotate API specs with mapping metadata.

---

## 1. Problem Statement

In any integration architecture — whether SOA/ESB, microservices, or event-driven — OpenAPI documents the edges: the consumer API exposed on the API gateway and the provider API(s) on the backend. But the middle layer — the integration platform that transforms, maps, transcodifies, and routes data between these APIs through a canonical data model — is the most complex, most fragile, and least documented part of the system.

Today, mapping documentation lives in Excel spreadsheets, Confluence pages, or buried inside platform-specific artifacts (message maps, XSLT stylesheets, DataWeave scripts, ESQL code, Camel routes) that only integration developers can read. When a field is renamed, a code table changes, or a new provider is added, the documentation drifts immediately. Nobody trusts it. New team members spend weeks reverse-engineering the mapping from implementation code.

**There is no industry standard for documenting data mappings between APIs.** No "OpenAPI for mappings" exists. This PRD explores building one — a platform-agnostic, machine-readable, version-controlled, lintable mapping specification that lives in Git alongside the OpenAPI specs it connects.

### Architecture Context

```
Consumer API  →  API Gateway  →  Integration Layer  →  Provider API(s)
(OpenAPI)                        ↕                      (OpenAPI)
                           Canonical Model
                           (JSON Schema)

Integration layer may be:
├── ESB (IBM ACE, MuleSoft, WSO2, Azure Logic Apps)
├── Integration framework (Apache Camel, Spring Integration)
├── API gateway with transformation (Kong, Tyk, APISIX)
├── Custom middleware (Node.js, Python, Java)
└── iPaaS (Workato, Boomi, Celigo)

What needs documentation (regardless of platform):
├── Field-level mapping (consumer ↔ canonical ↔ provider)
├── Transformation rules (split, concat, convert, conditional)
├── Transcodification (code table mapping between systems)
├── Routing logic (which provider based on request content)
└── Canonical data model (the shared model in between)
```

### Who experiences this problem

- **Integration developers** — write mapping code but have no formal spec to implement against
- **API consumers** — don't know how their fields map to provider fields, can't predict transformation behavior
- **QA engineers** — test mappings manually, no contract to assert against
- **New team members** — reverse-engineer mappings from platform-specific code or ask someone who knows
- **Architects** — can't see the full data flow across APIs without reading implementation code
- **Platform migration teams** — when switching integration platforms (e.g., ESB to microservices), there is no portable mapping spec to carry over

---

## 2. Goals

- **Define a platform-agnostic, machine-readable mapping specification** (YAML-based) that documents field-level mappings, transformations, transcodifications, and routing rules between consumer and provider APIs through a canonical model.
- **Make mapping documentation "doc as code"** — version-controlled in Git, reviewed in PRs, validated in CI, generated into human-readable output.
- **Link mapping specs to OpenAPI specs** using OpenAPI Overlays and `x-mapping` extensions, so the mapping documentation is discoverable from the API spec itself.
- **Enable CI validation** — Spectral custom rules that check mapping completeness (every consumer field mapped, every enum value transcodified, every `$ref` resolves).
- **Enable platform bridges** — parsers that read platform-specific artifacts (message maps, XSLT, DataWeave, Camel routes, etc.) and validate them against the mapping spec, ensuring docs match implementation regardless of which integration platform is used.

---

## 3. Non-Goals

- **Replacing any integration platform.** The mapping spec documents what the platform does — it does not replace the runtime engine. The integration platform remains the execution layer.
- **Building a visual mapping editor.** For v1, the mapping spec is authored in YAML in a code editor. A visual UI is a future initiative.
- **Runtime message validation.** The mapping spec is a design-time/CI-time artifact. Runtime validation of messages flowing through the integration layer is a separate concern.
- **Standardizing the spec externally.** For v1, this is an internal specification. Publishing it as an open standard (RFC, Linux Foundation, etc.) is a future possibility if it proves valuable.
- **Replacing platform-native transformation languages.** The mapping spec uses JSONata for documenting transformation expressions. This does not replace XSLT, DataWeave, ESQL, or any other platform-native language at runtime.

---

## 4. Research: Existing Standards and Tools

### 4.1 Formal Standards (closest matches)

| Standard | What it does | Relevance | Limitation |
|---|---|---|---|
| **FHIR StructureMap** (HL7) | Declarative field mapping with transformation rules, conditionals, nested rule invocation | Conceptually the closest model for field-level mapping specs | Coupled to healthcare terminology; not generalizable without adaptation |
| **FHIR ConceptMap** (HL7) | Code-to-code transcodification with relationships (equivalent, narrower, broader, not-related) and unmapped code handling | Best formal model for transcodification tables | Healthcare-specific vocabulary |
| **OpenAPI Arazzo** (v1.0.1) | API workflow sequencing with data flow between steps using runtime expressions (`$steps.x.outputs.y`) | Covers routing and orchestration between API calls | Does not handle field-level transformation rules |
| **OpenAPI Overlay** (v1.0.0) | Adds metadata to OpenAPI specs without modifying originals, using JSONPath targeting | The mechanism for linking `x-mapping` annotations to API specs as separate files | New standard, limited tooling |
| **W3C R2RML / RML** | Maps relational data to RDF using triples maps | Formal mapping language with W3C backing | Wrong mental model (DB→RDF, not API→API); RDF/Turtle syntax is a hard sell |
| **ISO/IEC 11179** | Metadata registry standard for data elements | Relevant for canonical model registry | Does not cover mapping rules |

**References:**
- FHIR StructureMap: https://hl7.org/fhir/structuremap.html
- FHIR ConceptMap: https://hl7.org/fhir/conceptmap.html
- OpenAPI Arazzo: https://spec.openapis.org/arazzo/latest.html
- OpenAPI Overlay: https://spec.openapis.org/overlay/latest.html
- W3C R2RML: https://www.w3.org/TR/r2rml/

### 4.2 Transformation Languages (self-documenting)

| Language | Readability | Platform | Use as |
|---|---|---|---|
| **JSONata** | Excellent — `FirstName & ' ' & Surname` | Platform-agnostic (Node.js, Java, Go, Python bindings) | Recommended expression language for mapping specs |
| **JOLT** (bazaarvoice) | Good — JSON spec defines JSON-to-JSON transforms | Java ecosystem | Declarative transformation specs |
| **jq** | Compact but cryptic for complex logic | CLI, any platform | Simple one-liner transforms |
| **XSLT 3.0** (W3C) | XML-heavy, poor readability for JSON use cases | Universal (XML-based platforms) | Legacy XML transformations |
| **DataWeave** (MuleSoft) | Excellent readability and power | MuleSoft only (proprietary) | Reference for DSL design inspiration |
| **ESQL** (IBM ACE) | Procedural, platform-specific | IBM ACE only | Bridge target (parse, don't author) |
| **SpEL** (Spring) | Good for Java teams | Spring ecosystem | Spring Integration expressions |

**References:**
- JSONata: https://jsonata.org
- JOLT: https://github.com/bazaarvoice/jolt
- jq: https://jqlang.github.io/jq/

### 4.3 Enterprise Approaches

| Organization / Tool | Approach | Relevance |
|---|---|---|
| **FINOS Legend** (Goldman Sachs, open source) | Pure language for data models AND mappings with formal syntax and visual Studio IDE | The most advanced enterprise approach — treats mapping as a first-class, version-controlled artifact |
| **MuleSoft DataWeave** | Declarative transformation language with multi-format support | Gold standard of transformation DSL design, but proprietary |
| **AtlasMap** (formerly Red Hat / Syndesis) | Open-source visual data mapping tool for Java, XML, JSON; mapping definitions stored as JSON | Closest open-source visual mapper |
| **Apache Camel** | Route-based integration with data transformation DSL | Widely used in Java shops; routes are code, not specs |
| **Banking/Insurance (typical)** | Excel spreadsheets and Confluence pages | The reality in most large enterprises; constant drift |
| **TMForum** (Telecom) | Canonical data models (Open Digital Framework) with no standard mapping format | Canonical model standard without mapping standard |

**References:**
- FINOS Legend: https://legend.finos.org
- AtlasMap: https://www.atlasmap.io
- Apache Camel: https://camel.apache.org
- TMForum Open Digital Framework: https://www.tmforum.org/open-digital-framework/

### 4.4 Data Lineage Platforms (complementary)

| Platform | What it offers | Use as |
|---|---|---|
| **DataHub** (LinkedIn, open source) | Column-level lineage, metadata ingestion via Python SDK | Runtime store for mapping metadata; discoverability layer |
| **OpenMetadata** | Column-level lineage, no-code data dictionary, 84+ connectors | Alternative to DataHub |
| **OpenLineage** (Linux Foundation) | Open standard for lineage events, extensible via facets | Batch/streaming lineage; adaptable for API mediation |

**References:**
- DataHub: https://datahubproject.io
- OpenMetadata: https://open-metadata.org
- OpenLineage: https://openlineage.io

### 4.5 Semantic Web Approaches

| Technology | What it offers | Limitation |
|---|---|---|
| **JSON-LD** `@context` | Maps local field names to shared vocabularies, establishing semantic equivalence | Defines "what means what" but not "how to transform" |
| **SHACL** | Validation constraints on data shapes (cardinality, types, patterns) | Good for canonical model validation; not for mapping rules |

---

## 5. Proposed Specification Design

### 5.1 Canonical Model (JSON Schema)

The shared data model between consumer and provider, defined as JSON Schema files:

```
specs/
  canonical/
    Order.yaml
    Customer.yaml
    OrderItem.yaml
    StatusCodes.yaml        # Transcodification reference table
```

Each schema can include `x-` annotations for business semantics:

```yaml
# specs/canonical/Customer.yaml
type: object
properties:
  firstName:
    type: string
    description: "Customer's given name"
    x-business-term: "Given Name"
    x-data-owner: "CRM Team"
  lastName:
    type: string
    description: "Customer's family name"
```

### 5.2 Mapping Specification (Custom YAML DSL)

One mapping file per integration flow, stored in `mappings/`:

```yaml
# mappings/create-order.mapping.yaml
apiVersion: mapping/v1
kind: IntegrationMapping
metadata:
  name: create-order
  description: "Maps consumer create-order request to provider(s) via canonical model"
  consumer:
    spec: specs/consumer-api.yaml
    operation: createOrder
  canonical:
    schema: specs/canonical/Order.yaml
  providers:
    - name: acme-orders
      spec: specs/provider-acme-api.yaml
      operation: createAcmeOrder
    - name: eu-orders
      spec: specs/provider-eu-api.yaml
      operation: createEuOrder

routing:
  description: "Route based on region header and order type"
  rules:
    - condition: "request.header['X-Region'] == 'EU'"
      provider: eu-orders
      description: "European orders routed to EU provider for GDPR compliance"
    - condition: "request.body.orderType == 'DIGITAL'"
      provider: digital-orders
      description: "Digital orders skip physical fulfillment"
    - default: acme-orders

mappings:
  # Simple 1:1 mapping
  - source: "Order.id"
    canonical: "Order.orderId"
    target: "order_ref"
    transform: null
    description: "Direct pass-through, field rename only"

  # Transformation: split
  - source: "Order.fullName"
    canonical: "Customer.firstName"
    target: "given_name"
    transform:
      expression: "$split(source, ' ')[0]"
      language: jsonata
    description: "Extract first name from full name"

  - source: "Order.fullName"
    canonical: "Customer.lastName"
    target: "family_name"
    transform:
      expression: "$join($split(source, ' ')[1..], ' ')"
      language: jsonata
    description: "Extract last name (everything after first space)"

  # Transformation: type conversion
  - source: "Order.total"
    canonical: "Order.totalAmount"
    target: "amount_cents"
    transform:
      expression: "source * 100"
      language: jsonata
    description: "Convert decimal amount to cents (integer)"

  # Transformation: conditional default
  - source: "Order.notes"
    canonical: "Order.comments"
    target: "internal_notes"
    transform:
      expression: "source ? source : 'No notes provided'"
      language: jsonata
    description: "Default to 'No notes provided' if field is empty"

  # Transformation: date format
  - source: "Order.createdAt"
    canonical: "Order.creationDate"
    target: "created_date"
    transform:
      expression: "$substringBefore(source, 'T')"
      language: jsonata
    description: "Convert ISO 8601 datetime to date-only (provider expects YYYY-MM-DD)"

transcodifications:
  - name: order-status
    description: "Order status code mapping across all three systems"
    source:
      path: "Order.status"
      codeSystem: "consumer-status"
    canonical:
      path: "Order.orderStatus"
      codeSystem: "canonical-status"
    target:
      path: "order_status_code"
      codeSystem: "provider-status"
    codes:
      - source: "A"
        canonical: "ACTIVE"
        target: "1"
        relationship: equivalent
      - source: "I"
        canonical: "INACTIVE"
        target: "0"
        relationship: equivalent
      - source: "S"
        canonical: "SUSPENDED"
        target: "-1"
        relationship: equivalent
      - source: "C"
        canonical: "CANCELLED"
        target: "-2"
        relationship: equivalent
    unmapped:
      strategy: use-default
      default:
        canonical: "UNKNOWN"
        target: "99"
      description: "Unmapped consumer codes default to UNKNOWN/99 and trigger an alert"

  - name: payment-method
    description: "Payment method transcodification"
    source:
      path: "Order.paymentMethod"
      codeSystem: "consumer-payment"
    canonical:
      path: "Order.paymentType"
      codeSystem: "canonical-payment"
    target:
      path: "pay_type"
      codeSystem: "provider-payment"
    codes:
      - source: "CC"
        canonical: "CREDIT_CARD"
        target: "credit"
        relationship: equivalent
      - source: "DD"
        canonical: "DIRECT_DEBIT"
        target: "debit"
        relationship: equivalent
      - source: "INV"
        canonical: "INVOICE"
        target: "invoice_30"
        relationship: narrower
        description: "Consumer 'INV' maps to provider's 30-day invoice specifically"
    unmapped:
      strategy: reject
      description: "Unknown payment methods are rejected — no default"
```

### 5.3 OpenAPI Overlays (linking specs to mappings)

Separate overlay files annotate OpenAPI specs without modifying them:

```yaml
# overlays/consumer-mapping-overlay.yaml
overlay: 1.0.0
info:
  title: Consumer API Mapping Annotations
  version: 1.0.0
actions:
  - target: "$.components.schemas.Order.properties.fullName"
    update:
      x-mapping-ref: "mappings/create-order.mapping.yaml#/mappings/1"
      x-mapping-note: "Split into firstName + lastName in canonical model"
  - target: "$.components.schemas.Order.properties.status"
    update:
      x-mapping-ref: "mappings/create-order.mapping.yaml#/transcodifications/0"
      x-mapping-note: "Transcodified to canonical ACTIVE/INACTIVE/SUSPENDED/CANCELLED"
  - target: "$.paths./orders.post"
    update:
      x-routing-ref: "mappings/create-order.mapping.yaml#/routing"
      x-routing-note: "Routed by X-Region header and orderType field"
```

### 5.4 API Spec References (apis.lock.yaml)

The integration repo does not own consumer or provider API specs. It **references** them by URL or repo path. Specs are downloaded/synced into `apis/` (gitignored), and `apis.lock.yaml` (committed) records the sources:

```yaml
# apis.lock.yaml — committed, version-controlled
specs:
  - name: consumer-order-api
    source: https://github.com/your-org/order-api/raw/main/specs/order-api.bundled.yaml
    version: 1.2.0
    sha256: a1b2c3d4e5f6...
    downloaded: apis/consumer-order-api.yaml

  - name: provider-acme-api
    source: https://github.com/your-org/acme-backend/raw/main/specs/acme-api.yaml
    version: 3.0.1
    sha256: e5f6g7h8i9j0...
    downloaded: apis/provider-acme-api.yaml

  - name: provider-eu-api
    source: https://partner.example.com/api/v2/openapi.yaml
    version: 2.1.0
    sha256: k1l2m3n4o5p6...
    downloaded: apis/provider-eu-api.yaml
```

A sync script (`scripts/sync-apis.sh`) downloads specs from their sources, verifies checksums, and places them in `apis/`. CI runs this before validation. When a consumer or provider team releases a new spec version, the integration team bumps the version in `apis.lock.yaml` and the pipeline validates that all mappings still hold.

### 5.5 Folder Structure

The integration scaffold lives in `scaffold-integration/` within the meta-repo. When a team adopts it, they copy `scaffold-integration/` into their own repo as the project root. All internal paths are relative to the scaffold root.

```
scaffold-integration/                  # Integration scaffold template
  apis/                                # Referenced API specs (downloaded, gitignored)
    consumer-order-api.yaml            #   ← downloaded from consumer team's repo
    provider-acme-api.yaml             #   ← downloaded from provider team's repo
    provider-eu-api.yaml               #   ← downloaded from external partner URL
  apis.lock.yaml                       # Source URLs + versions (committed, lockfile)
  canonical/                           # Canonical model (owned by this repo)
    Order.yaml                         #   JSON Schema
    Customer.yaml                      #   JSON Schema
    StatusCodes.yaml                   #   Transcodification reference
  mappings/                            # Mapping specs (owned by this repo)
    create-order.mapping.yaml          #   one per integration flow
    get-order.mapping.yaml
    update-order.mapping.yaml
  overlays/                            # OpenAPI Overlays (owned by this repo)
    consumer-mapping-overlay.yaml      #   links consumer spec fields to mappings
    provider-acme-mapping-overlay.yaml #   links provider spec fields to mappings
  schemas/                             # Meta-schemas
    mapping-spec-schema.json           #   JSON Schema for the mapping DSL (US-002)
  rules/                               # Spectral rulesets
    .spectral-mappings.yaml            #   structural + completeness rules
    functions/                         #   custom Spectral functions (JS)
      all-consumer-fields-mapped.js
      all-enum-values-transcodified.js
      canonical-field-exists.js
  scripts/
    sync-apis.sh                       # Download/sync API specs from lock file
    generate-docs.js                   # Generate mapping documentation (HTML/Markdown)
  ci/
    pipeline.yaml                      # CI pipeline
  .vscode/
    settings.json                      # YAML schema association for IDE
  .gitignore                           # apis/, generated/
  README.md
```

**Ownership model:**

| Directory | Owned by | Committed? |
|---|---|---|
| `apis/` | Consumer and provider teams (referenced) | No (gitignored, downloaded from lock) |
| `apis.lock.yaml` | Integration team | Yes (lockfile) |
| `canonical/` | Integration team / data architecture | Yes |
| `mappings/` | Integration team | Yes |
| `overlays/` | Integration team | Yes |
| `schemas/` | Integration team | Yes |
| `rules/` | Integration team / platform team | Yes |

---

## 6. Validation and Tooling

### 6.1 Spectral Custom Rules for Mapping Specs

Spectral can lint any YAML/JSON, not just OpenAPI. Two categories of rules:

**Category 1: Structural rules** (pure Spectral — JSONPath + built-in functions)

These validate that mapping files follow the DSL structure. They work with Spectral alone, no custom JS needed:

| Rule | What it checks | Severity |
|---|---|---|
| `mapping-has-metadata` | Every mapping file has `apiVersion`, `kind`, `metadata` | error |
| `mapping-has-consumer-ref` | `metadata.consumer.spec` is defined and non-empty | error |
| `mapping-has-canonical-ref` | `metadata.canonical.schema` is defined and non-empty | error |
| `mapping-entry-complete` | Every mapping entry has `source`, `canonical`, `target` | error |
| `transform-language-valid` | `transform.language` is one of `jsonata`, `jolt`, `jq` | error |
| `transcodification-has-unmapped` | Every transcodification defines an `unmapped.strategy` | warn |
| `transcodification-has-relationship` | Every code row has a `relationship` value | warn |
| `routing-has-default` | Routing rules include a `default` route | warn |
| `routing-rules-have-description` | Every routing rule has a `description` | warn |
| `mapping-has-description` | Every mapping entry has a `description` | warn |

**Category 2: Completeness rules** (custom Spectral functions — JavaScript plugins)

These cross-reference the mapping YAML against the actual OpenAPI specs in `apis/` and canonical schemas in `canonical/`. They require custom JS functions that Spectral loads as plugins:

| Rule | What it checks | Severity | Custom function |
|---|---|---|---|
| `all-consumer-fields-mapped` | Every field in the consumer spec schema has a mapping entry | warn | `functions/all-consumer-fields-mapped.js` |
| `all-provider-fields-mapped` | Every required field in the provider spec is a mapping target | error | `functions/all-provider-fields-mapped.js` |
| `all-enum-values-transcodified` | Every enum value in a transcodified field has a row in the table | error | `functions/all-enum-values-transcodified.js` |
| `no-orphan-mappings` | Every `source` path exists in consumer spec, every `target` path exists in provider spec | error | `functions/no-orphan-mappings.js` |
| `canonical-field-exists` | Every `canonical` path exists in the canonical model schema | error | `functions/canonical-field-exists.js` |
| `consumer-spec-exists` | `metadata.consumer.spec` resolves to a file in `apis/` | error | `functions/spec-file-exists.js` |
| `provider-spec-exists` | Every `metadata.providers[].spec` resolves to a file in `apis/` | error | `functions/spec-file-exists.js` |

**Example Spectral config** (`rules/.spectral-mappings.yaml`):

```yaml
functionsDir: ./functions
formats: []  # Not OpenAPI — custom YAML

rules:
  # --- Category 1: Structural (built-in functions) ---
  mapping-has-metadata:
    severity: error
    given: "$"
    then:
      - field: apiVersion
        function: truthy
      - field: kind
        function: truthy
      - field: metadata
        function: truthy

  mapping-entry-complete:
    severity: error
    given: "$.mappings[*]"
    then:
      - field: source
        function: truthy
      - field: canonical
        function: truthy
      - field: target
        function: truthy

  transform-language-valid:
    severity: error
    given: "$.mappings[*].transform.language"
    then:
      function: enumeration
      functionOptions:
        values: [jsonata, jolt, jq]

  transcodification-has-unmapped:
    severity: warn
    given: "$.transcodifications[*]"
    then:
      field: unmapped
      function: truthy

  routing-has-default:
    severity: warn
    given: "$.routing"
    then:
      field: default
      function: truthy

  # --- Category 2: Completeness (custom functions) ---
  all-consumer-fields-mapped:
    severity: warn
    given: "$"
    then:
      function: all-consumer-fields-mapped

  all-enum-values-transcodified:
    severity: error
    given: "$"
    then:
      function: all-enum-values-transcodified

  canonical-field-exists:
    severity: error
    given: "$.mappings[*].canonical"
    then:
      function: canonical-field-exists
```

### 6.2 Documentation Generator

A custom script (Node.js or Python) reads the mapping YAML and generates:

- **Mapping table** (HTML/Markdown): source field → canonical field → target field, with transformation rule and description
- **Transcodification table**: source code → canonical code → target code, with relationship type
- **Routing diagram**: decision tree showing which provider is called under which conditions
- **Coverage report**: which consumer fields are mapped, which are unmapped, which have no transformation

### 6.3 Platform Bridge (pluggable)

A bridge parser validates that the actual integration platform implementation matches the mapping spec. The bridge is a pluggable architecture — one adapter per platform:

| Platform | Artifacts to parse | What to extract |
|---|---|---|
| **IBM ACE** | `.msgmap` (XML), `.esql` files | Field assignments, transformation logic |
| **MuleSoft** | DataWeave `.dwl` files, Mule XML configs | Field mappings, transformation expressions |
| **Apache Camel** | Route XML/YAML, Bean definitions | Route conditions, processor chains |
| **WSO2** | Synapse XML configs, data mapper configs | Mediation sequences, field mappings |
| **Spring Integration** | Java config, SpEL expressions | Transformer beans, router conditions |
| **Custom middleware** | Source code (Node.js/Python/Java) | Function-level field assignments |

Each bridge adapter:
1. Reads platform-specific artifacts from the Git repo
2. Extracts field-level mappings into a normalized format
3. Compares extracted mappings against the YAML mapping spec
4. Reports discrepancies: "mapping spec says `fullName` → `firstName + lastName`, but implementation maps `fullName` → `customerName`"

For v1, build one bridge adapter for the team's primary integration platform. Additional adapters are added as other platforms are encountered.

### 6.4 CI Pipeline Integration

```yaml
# In ci/pipeline.yaml
mapping-validation:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: bash scripts/sync-apis.sh          # Download API specs from apis.lock.yaml
    - run: |
        spectral lint mappings/*.mapping.yaml \
          --ruleset rules/.spectral-mappings.yaml
        # Runs both structural rules (Category 1) and
        # completeness rules (Category 2 — custom functions
        # cross-reference against downloaded specs in apis/)
    - run: node scripts/generate-docs.js      # Generate mapping documentation
    - run: node scripts/bridge-validate.js    # Compare platform implementation vs mapping spec (optional)
```

The pipeline runs in order:
1. **Sync** — download consumer/provider specs from lock file
2. **Lint** — Spectral validates structure + cross-references field completeness
3. **Generate** — produce mapping tables, transcodification tables, routing trees
4. **Bridge** — (optional) compare against platform implementation

---

## 7. User Stories

### US-001: Define a canonical data model

**Status:** pending

**Description:** As an architect, I want to define a canonical data model as JSON Schema files so that all integration mappings reference a shared, version-controlled model.

**Acceptance Criteria:**

- [ ] Canonical model schemas exist in `specs/canonical/` as JSON Schema YAML files
- [ ] Each schema property has `type`, `description`, and business context annotations
- [ ] Schemas are valid JSON Schema (2020-12)

---

### US-002: Formalize the mapping DSL as a JSON Schema

**Status:** pending

**Description:** As an integration developer, I want a JSON Schema that defines the mapping YAML structure so that my IDE provides autocompletion, typo detection, required field validation, and hover documentation as I author mapping specs.

**Acceptance Criteria:**

- [ ] `schemas/mapping-spec-schema.json` exists as a valid JSON Schema (2020-12)
- [ ] Schema defines all top-level fields: `apiVersion`, `kind`, `metadata`, `routing`, `mappings`, `transcodifications`
- [ ] Required fields are marked (`apiVersion`, `kind`, `metadata.name`, `metadata.consumer`, `mappings[].source`, `mappings[].canonical`, `mappings[].target`)
- [ ] `transform.language` is constrained to `enum: ["jsonata", "jolt", "jq"]`
- [ ] `transcodifications[].codes[].relationship` is constrained to `enum: ["equivalent", "narrower", "broader", "not-related"]`
- [ ] `transcodifications[].unmapped.strategy` is constrained to `enum: ["reject", "use-default", "pass-through"]`
- [ ] VS Code YAML extension recognizes `.mapping.yaml` files via `.vscode/settings.json` schema association
- [ ] Autocompletion, validation, and hover docs work in VS Code with the YAML extension

---

### US-003: Write a mapping specification

**Status:** pending

**Description:** As an integration developer, I want to write a YAML mapping spec (validated against the JSON Schema from US-002) that documents field-level mappings, transformations, and transcodifications so that the mapping logic is version-controlled and reviewable.

**Acceptance Criteria:**

- [ ] Mapping YAML files exist in `mappings/` following the `apiVersion: mapping/v1` format
- [ ] Each mapping entry specifies source, canonical, and target field paths
- [ ] Transformations use JSONata expressions
- [ ] Transcodification tables list all code values with relationships
- [ ] Routing rules are declarative with conditions and descriptions

---

### US-004: Link mapping specs to OpenAPI specs

**Status:** pending

**Description:** As a developer, I want mapping annotations linked to the consumer and provider OpenAPI specs so that I can discover mapping information from the API spec itself.

**Acceptance Criteria:**

- [ ] OpenAPI Overlay files exist in `overlays/`
- [ ] Overlays add `x-mapping-ref` and `x-routing-ref` extensions to relevant schema properties and operations
- [ ] Overlay files do not modify the original OpenAPI specs

---

### US-005: Validate mapping completeness in CI

**Status:** pending

**Description:** As a tech lead, I want CI to validate that every consumer field is mapped, every enum is transcodified, and every spec reference resolves so that mapping drift is caught automatically.

**Acceptance Criteria:**

- [ ] Spectral custom rules lint mapping YAML files for structural correctness
- [ ] A validation script checks that every property in the consumer schema has a mapping entry
- [ ] A validation script checks that every enum value in transcodified fields has a row in the transcodification table
- [ ] All `$ref` and file path references in the mapping spec resolve to existing files

---

### US-006: Generate human-readable mapping documentation

**Status:** pending

**Description:** As a product owner or new team member, I want to view mapping documentation as tables and diagrams so that I can understand the data flow without reading YAML or platform-specific code.

**Acceptance Criteria:**

- [ ] A generator script produces HTML or Markdown from the mapping YAML
- [ ] Output includes: field mapping table, transcodification tables, routing decision tree
- [ ] Output includes a coverage summary (mapped vs unmapped fields)

---

### US-007: Validate platform implementation against mapping spec

**Status:** pending

**Description:** As an integration developer, I want a bridge that compares the integration platform implementation against the mapping spec so that I can detect when the code drifts from the documented contract.

**Acceptance Criteria:**

- [ ] A bridge adapter reads platform-specific artifacts and extracts field mappings
- [ ] Extracted mappings are compared against the YAML mapping spec
- [ ] Discrepancies are reported with clear messages (expected vs actual)
- [ ] The bridge is pluggable — one adapter per integration platform

---

## 8. User Experience

Five personas interact with the mapping spec. Each has a different primary interface.

### 8.1 Personas and Primary Interfaces

| Persona | Primary task | Primary interface | Frequency |
|---|---|---|---|
| **Integration developer** | Author and maintain mapping specs | IDE (VS Code / IntelliJ) with YAML + JSON Schema autocompletion | Daily |
| **Architect** | Review mappings, validate completeness, approve changes | PR diff view + generated documentation | Per PR |
| **QA engineer** | Understand what to test, verify coverage | Generated mapping tables + coverage report | Per sprint |
| **Product owner / BA** | Understand data flow, validate field names and business rules | Generated visual documentation (web) | Ad hoc |
| **New team member** | Onboard and understand existing integrations | Generated documentation + interactive explorer | First weeks |

### 8.2 Authoring Experience (Integration Developer)

**IDE-first, YAML-native.** The mapping spec is authored as YAML files in a code editor.

**What makes it productive:**

1. **JSON Schema for the mapping DSL** (`mapping-spec-schema.json`) — enables:
   - Autocompletion of mapping YAML structure (`apiVersion`, `kind`, `metadata`, `mappings`, `transcodifications`, `routing`)
   - Inline validation (red squiggles for missing required fields, wrong types)
   - Hover documentation (what each field means)
   - Works in VS Code (YAML extension + schema association) and IntelliJ (built-in YAML schema support)

2. **Spec-aware autocompletion** (future) — a VS Code extension that:
   - Reads the consumer and provider OpenAPI specs referenced in `metadata`
   - Suggests field paths in `source` and `target` from the actual schemas
   - Warns if a referenced field path doesn't exist in the spec
   - Suggests enum values for transcodification tables from the spec's `enum` definitions

3. **JSONata expression preview** — a VS Code extension or CLI command that:
   - Parses JSONata expressions inline and shows validation errors
   - Allows testing an expression against a sample payload
   - Example: type `$split(source, ' ')[0]`, hover, see "Result: 'Jane'" for sample input "Jane Doe"

4. **Snippets** — VS Code snippets for common patterns:
   - `mapping-new` → scaffold a new mapping file with metadata + empty sections
   - `field-1to1` → simple 1:1 field mapping
   - `field-split` → split transformation with JSONata
   - `transcodification-new` → new transcodification table with codes template
   - `routing-cbr` → content-based routing rules

**File example (what the developer sees in the IDE):**

```yaml
# mappings/create-order.mapping.yaml
apiVersion: mapping/v1          # ← autocompleted from schema
kind: IntegrationMapping        # ← autocompleted from schema
metadata:
  name: create-order
  consumer:
    spec: specs/consumer-api.yaml    # ← validated: file exists
    operation: createOrder           # ← validated: operationId exists in spec
  canonical:
    schema: specs/canonical/Order.yaml
  providers:
    - name: acme-orders
      spec: specs/provider-acme-api.yaml
      operation: createAcmeOrder

mappings:
  - source: "Order.fullName"         # ← autocomplete from consumer spec schema
    canonical: "Customer.firstName"  # ← autocomplete from canonical schema
    target: "given_name"             # ← autocomplete from provider spec schema
    transform:
      expression: "$split(source, ' ')[0]"  # ← validated: valid JSONata
      language: jsonata
    description: "Extract first name from full name"
```

### 8.3 Review Experience (Architect)

**PR-native.** Mapping changes are reviewed in the same PR workflow as code changes.

**What the architect sees in a PR:**

1. **YAML diff** — the raw change to the mapping file. Because it's YAML (not Java code or XML message maps), the diff is readable:
   ```diff
   mappings:
   + - source: "Order.loyaltyTier"
   +   canonical: "Customer.loyaltyLevel"
   +   target: "customer_tier"
   +   transform: null
   +   description: "New loyalty tier field - direct pass-through"
   ```

2. **CI checks on the PR** (automated):
   - Spectral lint: "mapping file is structurally valid"
   - Coverage check: "all consumer fields have a mapping entry"
   - Transcodification check: "all enum values have a row"
   - Spec reference check: "all file paths and field paths resolve"

3. **Generated documentation comment** (CI posts as a PR comment):
   - A rendered mapping table showing what changed
   - A coverage diff: "Coverage went from 95% to 97% (+2 fields mapped)"
   - Transcodification table showing new or changed code mappings

### 8.4 Visualization Experience (Product Owner / BA / New Team Member)

**Generated web documentation.** A static HTML site generated from the mapping YAML, auto-deployed by CI.

**Views:**

**View 1: Field Mapping Table**

The core view. Three-column table showing the complete data flow:

```
┌──────────────────────┬──────────────────────┬──────────────────────┬──────────────────────┐
│ Consumer Field       │ Canonical Field      │ Provider Field       │ Transformation       │
├──────────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
│ Order.fullName       │ Customer.firstName   │ given_name           │ split(' ')[0]        │
│ Order.fullName       │ Customer.lastName    │ family_name          │ split(' ')[1:]        │
│ Order.total          │ Order.totalAmount    │ amount_cents         │ × 100 (to cents)     │
│ Order.status         │ Order.orderStatus    │ order_status_code    │ Transcodification ⤵  │
│ Order.createdAt      │ Order.creationDate   │ created_date         │ Date only (YYYY-MM-DD)│
│ Order.notes          │ Order.comments       │ internal_notes       │ Default if empty      │
│ —                    │ Customer.creditLimit │ —                    │ Enriched from CRM API│
└──────────────────────┴──────────────────────┴──────────────────────┴──────────────────────┘
```

- Color-coded rows: green = direct pass-through, amber = transformation, blue = enrichment, red = filtered/dropped
- Click a row to expand: see the full JSONata expression, description, data types on both sides, nullability
- Search/filter by field name

**View 2: Transcodification Tables**

Side-by-side code tables with relationship indicators:

```
Order Status Mapping
┌───────────┬─────────────┬──────────┬──────────────┐
│ Consumer  │ Canonical   │ Provider │ Relationship │
├───────────┼─────────────┼──────────┼──────────────┤
│ A         │ ACTIVE      │ 1        │ ≡ equivalent │
│ I         │ INACTIVE    │ 0        │ ≡ equivalent │
│ S         │ SUSPENDED   │ -1       │ ≡ equivalent │
│ C         │ CANCELLED   │ -2       │ ≡ equivalent │
│ (other)   │ UNKNOWN     │ 99       │ ⚠ default    │
└───────────┴─────────────┴──────────┴──────────────┘
```

- Highlight unmapped values with warnings
- Show the unmapped strategy (reject vs default vs pass-through)
- Link to the canonical code system definition

**View 3: Routing Decision Tree**

Visual decision tree for content-based routing:

```
                    Incoming Request
                         │
                ┌────────┴────────┐
                │ X-Region = EU?  │
                └────────┬────────┘
               yes ╱           ╲ no
              ╱                   ╲
    ┌─────────────┐      ┌────────┴────────┐
    │  eu-orders  │      │ orderType =     │
    │  (EU GDPR)  │      │ DIGITAL?        │
    └─────────────┘      └────────┬────────┘
                        yes ╱           ╲ no
                       ╱                   ╲
              ┌──────────────┐    ┌──────────────┐
              │digital-orders│    │ acme-orders  │
              │              │    │  (default)   │
              └──────────────┘    └──────────────┘
```

- Each node links to its provider spec
- Each edge shows the condition expression
- Highlight the default route

**View 4: Data Flow Diagram**

A visual showing the end-to-end flow from consumer to provider(s):

```
┌──────────────┐     ┌───────────────┐     ┌───────────────┐     ┌──────────────┐
│ Consumer API │────▶│   Canonical   │────▶│   Routing     │────▶│ Provider API │
│              │     │   Model       │     │   Decision    │     │ (acme)       │
│ 6 fields     │     │ 8 fields      │     │               │────▶│              │
│              │     │ (+2 enriched) │     │               │     │ Provider API │
│              │     │               │     │               │     │ (eu)         │
└──────────────┘     └───────────────┘     └───────────────┘     └──────────────┘
     fullName ─────▶ firstName ──────────────────────────────────▶ given_name
                     lastName  ──────────────────────────────────▶ family_name
     total ────────▶ totalAmount ────────────────────────────────▶ amount_cents (×100)
     status ───────▶ orderStatus ────────────────────────────────▶ order_status_code (transco)
```

- Hover a field to highlight its full path from consumer to provider
- Click to see transformation details
- Enriched fields (from external callouts) shown with a different color/icon

**View 5: Coverage Report**

Dashboard showing mapping completeness:

```
Coverage Summary: create-order
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Consumer fields:  6/6 mapped  (100%) ✓
Canonical fields: 8/8 defined (100%) ✓
Provider fields:  7/7 mapped  (100%) ✓
Transcodifications: 2 tables, 9 codes, 0 unmapped ✓
Routing rules: 3 (2 conditions + 1 default) ✓

Missing:
  (none — all fields covered)
```

- Red/amber/green indicators
- Lists unmapped fields explicitly
- Shows transcodification gaps (enum values without a row)

### 8.5 Interactive Explorer (Future — v2)

A web application where users can:

1. **Click a consumer field** → see its full journey: consumer → canonical → provider(s), with transformation at each step
2. **Click a provider field** → trace it back to the consumer field(s) it comes from (reverse lineage)
3. **Search** across all mapping specs: "where does `customerId` appear?"
4. **Compare versions** — diff two versions of a mapping spec visually (before/after a PR)
5. **Simulate** — paste a sample consumer JSON payload, see the canonical model and provider payload that would result (by executing the JSONata expressions client-side)

This is the equivalent of what AtlasMap provides visually but driven by the YAML mapping spec as the source of truth.

### 8.6 Interaction Summary by Phase

| Phase | Who | Interface | What they do |
|---|---|---|---|
| **Author** | Integration dev | IDE + YAML + JSON Schema | Write mapping spec with autocompletion |
| **Validate** | CI | Spectral + custom scripts | Lint, check coverage, verify references |
| **Review** | Architect | PR diff + CI comment | Review YAML diff + generated tables |
| **Understand** | PO / BA / new member | Generated web docs | Browse mapping tables, routing trees, flow diagrams |
| **Explore** | Anyone | Interactive explorer (v2) | Click-through field lineage, simulate payloads |
| **Verify** | Integration dev | Bridge adapter | Compare implementation vs spec |

## 9. Design Considerations (Architecture)

---

## 9. Technical Considerations

- **JSONata** expressions can be validated at CI time using the `jsonata` npm package (parse without executing). Bindings exist for Java (`dashjoin/jsonata-java`), Go, Python, and .NET.
- **OpenAPI Overlay** is a newly standardized spec (v1.0.0). Tooling support is limited but growing. Redocly CLI supports overlays.
- **Spectral** can lint any YAML/JSON file, not just OpenAPI — custom rulesets for mapping files use the same infrastructure already in place for API linting.
- **Bridge adapters** depend on platform-specific file formats. Most integration platforms store configuration as XML or YAML in Git-compatible structures, making parsing feasible.
- **The mapping YAML DSL is formalized as a JSON Schema** (`schemas/mapping-spec-schema.json`) — see US-002 and Resolved Decision #1.

---

## 10. Success Metrics

### Leading Indicators

- **Mapping spec adoption:** At least 1 integration flow documented using the mapping YAML format within 30 days of tooling availability.
- **CI validation active:** Mapping completeness checks run on every PR that touches `mappings/` or `specs/`.
- **New team member onboarding:** A new integration developer can understand an existing mapping by reading the YAML spec + generated docs, without asking someone or reading platform-specific code.

### Lagging Indicators

- **Mapping drift reduction:** Fewer incidents where the platform implementation doesn't match documented behavior (measured over 1 quarter).
- **Review quality:** Integration PRs that include mapping spec changes get more meaningful review feedback from architects.
- **Transcodification bugs:** Fewer production bugs caused by missing or incorrect code table entries.
- **Platform migration readiness:** When evaluating a platform migration, the mapping spec provides a complete, portable inventory of all field mappings, transformations, and transcodifications — independent of the source or target platform.

---

## 11. Open Questions

1. **Which integration flow should be the first pilot?** Pick a low-complexity, well-understood mapping to validate the approach. Hypothetical candidate: a Policy or Claims flow (insurance domain).
2. **Which bridge adapter to build first?** Depends on the team's primary integration platform. The adapter validates implementation against the mapping spec.

## 12. Resolved Decisions

1. **JSON Schema for the mapping DSL:** Yes — `mapping-spec-schema.json` will be created as part of v1. It is the foundation for IDE autocompletion, typo detection, required field validation, hover documentation, Spectral linting, and CI validation. Without it, the authoring experience described in section 8.2 does not work.
2. **Canonical model independence:** Define the canonical model independently from any existing platform schemas. Starting from platform models inherits tech debt and couples the canonical model to one implementation. The entire point is platform-agnostic portability.
3. **FINOS Legend:** Not for v1. Legend's Pure language provides formal semantics but requires Java infrastructure and a different authoring model (code, not YAML). Evaluate as a future alternative if the YAML DSL proves insufficient for complex financial/regulatory mappings.
4. **DataHub integration:** Not for v1. Useful at scale (10+ integration flows) for cross-team discoverability. Follow-up milestone after the mapping spec is validated by a pilot team.
5. **External transcodification references:** Inline code tables for v1. External references to MDM systems (e.g., `$ref: "mdm://code-tables/order-status"`) are a v2 feature. Enterprise code tables are too large and too frequently updated to inline long-term, but inline works for proving the spec format.

---

## 12. References

### Specifications

- FHIR StructureMap — https://hl7.org/fhir/structuremap.html
- FHIR ConceptMap — https://hl7.org/fhir/conceptmap.html
- OpenAPI Arazzo Specification — https://spec.openapis.org/arazzo/latest.html
- OpenAPI Overlay Specification — https://spec.openapis.org/overlay/latest.html
- W3C R2RML — https://www.w3.org/TR/r2rml/
- JSON Schema 2020-12 — https://json-schema.org/specification
- ISO/IEC 11179 — https://www.iso.org/standard/78914.html

### Transformation Languages

- JSONata — https://jsonata.org
- JSONata Java binding — https://github.com/dashjoin/jsonata-java
- JOLT — https://github.com/bazaarvoice/jolt
- jq — https://jqlang.github.io/jq/
- MuleSoft DataWeave — https://docs.mulesoft.com/dataweave/latest/

### Enterprise Platforms and Tools

- FINOS Legend — https://legend.finos.org
- AtlasMap — https://www.atlasmap.io
- Apache Camel — https://camel.apache.org
- TMForum Open Digital Framework — https://www.tmforum.org/open-digital-framework/

### Data Lineage

- DataHub — https://datahubproject.io
- OpenMetadata — https://open-metadata.org
- OpenLineage — https://openlineage.io

### Integration Platforms (bridge adapter targets)

- IBM ACE — https://www.ibm.com/products/app-connect
- MuleSoft Anypoint — https://www.mulesoft.com/platform/enterprise-integration
- WSO2 Micro Integrator — https://wso2.com/micro-integrator/
- Apache Camel — https://camel.apache.org
- Spring Integration — https://spring.io/projects/spring-integration

### Case Studies

- HDI Global SE (insurance) — AsyncAPI + OpenAPI for API catalog transparency — https://www.asyncapi.com/blog/hdi-global-interview
