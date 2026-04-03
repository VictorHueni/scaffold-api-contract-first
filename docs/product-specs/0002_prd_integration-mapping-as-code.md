# PRD: Integration Mapping as Code

**Status:** exploration

**Related:** [`0001_prd_api-first-scaffold.md`](./0001_prd_api-first-scaffold.md) — this PRD extends the contract-first approach from single API documentation to the integration layer between APIs.

---

## 1. Problem Statement

In a SOA/ESB architecture, OpenAPI documents the edges — the consumer API exposed on the API gateway and the provider API(s) on the backend. But the middle layer — the ESB (IBM App Connect Enterprise) — transforms, maps, transcodifies, and routes data between these APIs through a canonical data model. This integration logic is the most complex, most fragile, and least documented part of the system.

Today, mapping documentation lives in Excel spreadsheets, Confluence pages, or buried inside IBM ACE message maps (`.msgmap` XML files) and ESQL code that only integration developers can read. When a field is renamed, a code table changes, or a new provider is added, the documentation drifts immediately. Nobody trusts it. New team members spend weeks reverse-engineering the mapping from ACE code.

**There is no industry standard for documenting data mappings between APIs.** No "OpenAPI for mappings" exists. This PRD explores building one — a machine-readable, version-controlled, lintable mapping specification that lives in Git alongside the OpenAPI specs it connects.

### Architecture Context

```
Consumer API  →  API Gateway  →  ESB (IBM ACE)  →  Provider API(s)
(OpenAPI)                        ↕                  (OpenAPI)
                           Canonical Model
                           (JSON Schema)

What needs documentation:
├── Field-level mapping (consumer ↔ canonical ↔ provider)
├── Transformation rules (split, concat, convert, conditional)
├── Transcodification (code table mapping between systems)
├── Routing logic (which provider based on request content)
└── Canonical data model (the shared model in between)
```

### Who experiences this problem

- **Integration developers** — write the ACE mapping code but have no formal spec to implement against
- **API consumers** — don't know how their fields map to provider fields, can't predict transformation behavior
- **QA engineers** — test mappings manually, no contract to assert against
- **New team members** — reverse-engineer mappings from ESQL code or ask someone who knows
- **Architects** — can't see the full data flow across APIs without reading implementation code

---

## 2. Goals

- **Define a machine-readable mapping specification** (YAML-based) that documents field-level mappings, transformations, transcodifications, and routing rules between consumer and provider APIs through a canonical model.
- **Make mapping documentation "doc as code"** — version-controlled in Git, reviewed in PRs, validated in CI, generated into human-readable output.
- **Link mapping specs to OpenAPI specs** using OpenAPI Overlays and `x-mapping` extensions, so the mapping documentation is discoverable from the API spec itself.
- **Enable CI validation** — Spectral custom rules that check mapping completeness (every consumer field mapped, every enum value transcodified, every `$ref` resolves).
- **Bridge to IBM ACE** — a parser that reads `.msgmap` and `.esql` files and validates them against the mapping spec, ensuring docs match implementation.

---

## 3. Non-Goals

- **Replacing IBM ACE.** The mapping spec documents what ACE does — it does not replace ACE as the runtime engine. ACE remains the ESB.
- **Building a visual mapping editor.** For v1, the mapping spec is authored in YAML in a code editor. A visual UI is a future initiative.
- **Runtime message validation.** The mapping spec is a design-time/CI-time artifact. Runtime validation of messages flowing through ACE is a separate concern.
- **Standardizing the spec externally.** For v1, this is an internal specification. Publishing it as an open standard (RFC, Linux Foundation, etc.) is a future possibility if it proves valuable.

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

| Language | Readability | IBM ACE compatible? | Use as |
|---|---|---|---|
| **JSONata** | Excellent — `FirstName & ' ' & Surname` | Yes (Node-RED ecosystem) | Transformation expressions in mapping spec |
| **JOLT** (bazaarvoice) | Good — JSON spec defines JSON-to-JSON transforms | Possible | Declarative transformation specs |
| **jq** | Compact but cryptic for complex logic | CLI only | Simple one-liner transforms |
| **XSLT 3.0** (W3C) | XML-heavy, poor readability for JSON use cases | Native in ACE | Legacy XML transformations |
| **ESQL** (IBM ACE) | Procedural, only readable by ACE developers | IS the implementation | Bridge target (parse, don't author) |
| **DataWeave** (MuleSoft) | Excellent readability and power | No (proprietary to MuleSoft) | Reference for DSL design inspiration |

**References:**
- JSONata: https://jsonata.org
- JOLT: https://github.com/bazaarvoice/jolt
- jq: https://jqlang.github.io/jq/

### 4.3 Enterprise Approaches

| Organization | Approach | Relevance |
|---|---|---|
| **FINOS Legend** (Goldman Sachs, open source) | Pure language for data models AND mappings with formal syntax and visual Studio IDE | The most advanced enterprise approach — treats mapping as a first-class, version-controlled artifact |
| **MuleSoft DataWeave** | Declarative transformation language with multi-format support | Gold standard of transformation DSL design, but proprietary |
| **AtlasMap** (formerly Red Hat / Syndesis) | Open-source visual data mapping tool for Java, XML, JSON; mapping definitions stored as JSON | Closest open-source visual mapper |
| **Banking/Insurance (typical)** | Excel spreadsheets and Confluence pages | The reality in most large enterprises; constant drift |
| **TMForum** (Telecom) | Canonical data models (Open Digital Framework) with no standard mapping format | Canonical model standard without mapping standard |

**References:**
- FINOS Legend: https://legend.finos.org
- AtlasMap: https://www.atlasmap.io
- TMForum Open Digital Framework: https://www.tmforum.org/open-digital-framework/

### 4.4 Data Lineage Platforms (complementary)

| Platform | What it offers | Use as |
|---|---|---|
| **DataHub** (LinkedIn, open source) | Column-level lineage, metadata ingestion via Python SDK | Runtime store for mapping metadata; discoverability layer |
| **OpenMetadata** | Column-level lineage, no-code data dictionary, 84+ connectors | Alternative to DataHub |
| **OpenLineage** (Linux Foundation) | Open standard for lineage events, extensible via facets | Batch/streaming lineage; less relevant for API mediation |

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

### 5.4 Folder Structure

```
specs/
  consumer-api.yaml                    # Consumer OpenAPI spec
  provider-acme-api.yaml               # Provider OpenAPI spec
  provider-eu-api.yaml                 # EU provider OpenAPI spec
  canonical/
    Order.yaml                         # Canonical Order model (JSON Schema)
    Customer.yaml                      # Canonical Customer model
    StatusCodes.yaml                   # Transcodification reference
mappings/
  create-order.mapping.yaml            # Mapping spec per integration flow
  get-order.mapping.yaml
  update-order.mapping.yaml
overlays/
  consumer-mapping-overlay.yaml        # Links consumer spec to mappings
  provider-acme-mapping-overlay.yaml   # Links provider spec to mappings
rules/
  .spectral-mappings.yaml              # Spectral rules for mapping YAML
```

---

## 6. Validation and Tooling

### 6.1 Spectral Custom Rules for Mapping Specs

Spectral can lint any YAML/JSON, not just OpenAPI. Custom rules for mapping files:

- Every field in the consumer spec schema has a corresponding mapping entry
- Every enum value in a transcodified field has a row in the transcodification table
- Every `$ref` to a spec file resolves to an existing file
- Every `language` field uses a supported expression language (jsonata, jolt, jq)
- Every routing rule has a `description`
- No mapping has both `transform: null` and a `description` saying it transforms (consistency check)
- Unmapped strategy is defined for every transcodification

### 6.2 Documentation Generator

A custom script (Node.js or Python) reads the mapping YAML and generates:

- **Mapping table** (HTML/Markdown): source field → canonical field → target field, with transformation rule and description
- **Transcodification table**: source code → canonical code → target code, with relationship type
- **Routing diagram**: decision tree showing which provider is called under which conditions
- **Coverage report**: which consumer fields are mapped, which are unmapped, which have no transformation

### 6.3 IBM ACE Bridge

A parser that reads IBM ACE artifacts from Git and validates against the mapping spec:

- Read `.msgmap` files (XML) — extract source/target field references and transformation logic
- Read `.esql` files — parse `SET OutputRoot...` statements to extract field mappings
- Compare extracted mappings against the YAML mapping spec
- Report discrepancies: "mapping spec says `fullName` → `firstName + lastName`, but ESQL maps `fullName` → `customerName`"

### 6.4 CI Pipeline Integration

```yaml
# In ci/pipeline.yaml
mapping-validation:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: spectral lint mappings/*.mapping.yaml --ruleset rules/.spectral-mappings.yaml
    - run: node scripts/validate-mapping-coverage.js  # Check all consumer fields are mapped
    - run: node scripts/validate-transcodification-completeness.js  # Check all enums covered
```

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

### US-002: Write a mapping specification

**Status:** pending

**Description:** As an integration developer, I want to write a YAML mapping spec that documents field-level mappings, transformations, and transcodifications so that the mapping logic is version-controlled and reviewable.

**Acceptance Criteria:**

- [ ] Mapping YAML files exist in `mappings/` following the `apiVersion: mapping/v1` format
- [ ] Each mapping entry specifies source, canonical, and target field paths
- [ ] Transformations use JSONata expressions
- [ ] Transcodification tables list all code values with relationships
- [ ] Routing rules are declarative with conditions and descriptions

---

### US-003: Link mapping specs to OpenAPI specs

**Status:** pending

**Description:** As a developer, I want mapping annotations linked to the consumer and provider OpenAPI specs so that I can discover mapping information from the API spec itself.

**Acceptance Criteria:**

- [ ] OpenAPI Overlay files exist in `overlays/`
- [ ] Overlays add `x-mapping-ref` and `x-routing-ref` extensions to relevant schema properties and operations
- [ ] Overlay files do not modify the original OpenAPI specs

---

### US-004: Validate mapping completeness in CI

**Status:** pending

**Description:** As a tech lead, I want CI to validate that every consumer field is mapped, every enum is transcodified, and every spec reference resolves so that mapping drift is caught automatically.

**Acceptance Criteria:**

- [ ] Spectral custom rules lint mapping YAML files for structural correctness
- [ ] A validation script checks that every property in the consumer schema has a mapping entry
- [ ] A validation script checks that every enum value in transcodified fields has a row in the transcodification table
- [ ] All `$ref` and file path references in the mapping spec resolve to existing files

---

### US-005: Generate human-readable mapping documentation

**Status:** pending

**Description:** As a product owner or new team member, I want to view mapping documentation as tables and diagrams so that I can understand the data flow without reading YAML or ESQL.

**Acceptance Criteria:**

- [ ] A generator script produces HTML or Markdown from the mapping YAML
- [ ] Output includes: field mapping table, transcodification tables, routing decision tree
- [ ] Output includes a coverage summary (mapped vs unmapped fields)

---

### US-006: Validate IBM ACE implementation against mapping spec

**Status:** pending

**Description:** As an integration developer, I want a bridge that compares the ACE implementation (`.msgmap` and `.esql` files) against the mapping spec so that I can detect when the code drifts from the documented contract.

**Acceptance Criteria:**

- [ ] A parser reads `.msgmap` XML files and extracts field mappings
- [ ] A parser reads `.esql` files and extracts `SET OutputRoot...` field assignments
- [ ] Extracted mappings are compared against the YAML mapping spec
- [ ] Discrepancies are reported with clear messages (expected vs actual)

---

## 8. Design Considerations

- The mapping YAML DSL borrows concepts from FHIR StructureMap (field mapping structure), FHIR ConceptMap (transcodification with relationships), and OpenAPI Arazzo (routing/workflow).
- JSONata is the recommended transformation expression language — lightweight, readable, and compatible with the Node-RED / IBM ecosystem.
- The mapping spec is a design-time artifact. It does not execute transformations at runtime — IBM ACE remains the runtime engine.
- This spec could eventually be generalized beyond IBM ACE to any ESB or integration platform (MuleSoft, WSO2, Azure Logic Apps).

---

## 9. Technical Considerations

- **JSONata** expressions can be validated at CI time using the `jsonata` npm package (parse without executing).
- **OpenAPI Overlay** is a newly standardized spec (v1.0.0). Tooling support is limited but growing. Redocly CLI supports overlays.
- **Spectral** can lint any YAML/JSON file, not just OpenAPI — custom rulesets for mapping files use the same infrastructure.
- **IBM ACE** projects store `.msgmap` and `.esql` files in Git-compatible structures. No IBM API exists to query mappings programmatically; parsing must be done at the file level.

---

## 10. Success Metrics

### Leading Indicators

- **Mapping spec adoption:** At least 1 integration flow documented using the mapping YAML format within 30 days of tooling availability.
- **CI validation active:** Mapping completeness checks run on every PR that touches `mappings/` or `specs/`.
- **New team member onboarding:** A new integration developer can understand an existing mapping by reading the YAML spec + generated docs, without asking someone or reading ESQL.

### Lagging Indicators

- **Mapping drift reduction:** Fewer incidents where ACE implementation doesn't match documented behavior (measured over 1 quarter).
- **Review quality:** Integration PRs that include mapping spec changes get more meaningful review feedback from architects.
- **Transcodification bugs:** Fewer production bugs caused by missing or incorrect code table entries.

---

## 11. Open Questions

1. **Should the mapping YAML DSL be formalized as a JSON Schema?** This would enable validation of mapping files themselves (schema for the schema).
2. **Which integration flow should be the first pilot?** Pick a low-complexity, well-understood mapping to validate the approach.
3. **Should the canonical model be defined independently or derived from existing IBM ACE schemas?** Starting from existing ACE models may be faster but risks inheriting tech debt.
4. **FINOS Legend evaluation:** Is Legend's Pure language a viable alternative to the custom YAML DSL? It would require Java infrastructure but provides more formal semantics.
5. **DataHub integration:** Should mapping metadata be published to a data lineage platform for cross-team discoverability?

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
- JOLT — https://github.com/bazaarvoice/jolt
- jq — https://jqlang.github.io/jq/
- MuleSoft DataWeave — https://docs.mulesoft.com/dataweave/latest/

### Enterprise Platforms

- FINOS Legend — https://legend.finos.org
- AtlasMap — https://www.atlasmap.io
- TMForum Open Digital Framework — https://www.tmforum.org/open-digital-framework/

### Data Lineage

- DataHub — https://datahubproject.io
- OpenMetadata — https://open-metadata.org
- OpenLineage — https://openlineage.io

### IBM ACE

- IBM ACE Message Maps — https://www.ibm.com/docs/en/app-connect/12.0?topic=maps-message
- IBM ACE ESQL — https://www.ibm.com/docs/en/app-connect/12.0?topic=esql-overview

### Case Studies

- HDI Global SE (insurance) — AsyncAPI + OpenAPI for API catalog transparency — https://www.asyncapi.com/blog/hdi-global-interview
