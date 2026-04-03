# Enterprise Integration Patterns for API Mediation

A reference catalog of the most common EIP patterns (from Hohpe & Woolf, "Enterprise Integration Patterns", 2003) that appear in 80%+ of ESB/integration implementations. Each pattern is translated to API/REST mediation terminology with documentation guidance.

**Used by:** [`0002_prd_integration-mapping-as-code.md`](../product-specs/0002_prd_integration-mapping-as-code.md)

---

## Data Transformation Patterns

These patterns describe what happens to the message payload (request/response body) as it flows through the integration layer.

---

### 1. Message Translator

**EIP Book Name:** Message Translator
**Book Category:** Message Transformation

**What it does:** Converts a message from one data structure to another so that systems using different data models can communicate. This is the foundational transformation pattern — every field mapping is an instance of it.

**API mediation example:** Consumer sends `{ "fullName": "Jane Doe", "total": 42.50 }`. ESB transforms to provider format: `{ "given_name": "Jane", "family_name": "Doe", "amount_cents": 4250 }`. Field names change, structure changes, types change.

**How typically documented today:** Excel spreadsheets with columns for source field, target field, transformation rule, and comments. In better shops, Confluence pages with mapping tables. In most shops, not documented at all — the mapping lives only in platform-specific code (ESQL, DataWeave, XSLT, Java processors).

**What the architect must specify:**
- Source field path and data type
- Target field path and data type
- Transformation expression (split, concat, type conversion, default value)
- Nullability rules (required? default if null?)
- Direction: request only, response only, or both

**Mapping spec coverage:** `mappings[].transform` with JSONata expressions.

---

### 2. Content Enricher

**EIP Book Name:** Content Enricher
**Book Category:** Message Transformation

**What it does:** Augments the incoming message with additional data obtained from an external source (another API, database, cache) that the original sender did not provide but the receiver requires.

**API mediation example:** Consumer sends `{ "customerId": "C-123", "orderId": "O-456" }`. The ESB calls a Customer API to fetch credit limit and address, then sends to the provider: `{ "customerId": "C-123", "orderId": "O-456", "creditLimit": 50000, "shippingAddress": { ... } }`.

**How typically documented today:** Often buried in platform flow diagrams as a "callout" step. Sometimes a Confluence page describes which external calls are made, but the field-level enrichment (which fields are added from which source) is rarely documented explicitly.

**What the architect must specify:**
- Which external service/API to call (endpoint, method)
- Which fields from the incoming message are used as lookup keys
- Which fields from the external response are injected into the enriched message
- Timeout and fallback behavior if the enrichment call fails
- Caching strategy (cache the result? for how long?)

**Mapping spec coverage:** Not yet covered — needs an `enrichments` section.

---

### 3. Content Filter

**EIP Book Name:** Content Filter
**Book Category:** Message Transformation

**What it does:** Removes unwanted or unnecessary fields from a message, passing through only the data the downstream system needs. The inverse of Content Enricher.

**API mediation example:** Consumer sends a full customer profile with 40 fields. The provider only needs `customerId`, `email`, and `shippingAddress`. The ESB strips the other 37 fields. Also used for security: stripping PII fields before routing to a provider that should not see them.

**How typically documented today:** Rarely documented as a distinct pattern. Usually implicit in the mapping table — fields not in the mapping are assumed to be dropped. Sometimes enforced by the provider's OpenAPI schema validation rejecting unknown fields.

**What the architect must specify:**
- Whitelist (fields to keep) or blacklist (fields to remove)
- Whether filtering is for payload optimization or security/compliance (PII stripping)
- Whether filtered fields should be logged or silently dropped

**Mapping spec coverage:** Implicit — unmapped fields are dropped. Could be made explicit with a `filter` directive.

---

### 4. Claim Check

**EIP Book Name:** Claim Check
**Book Category:** Message Transformation

**What it does:** Replaces a large payload (or portion) with a reference key, stores the full data externally, and allows retrieval later using the key. Reduces message size for intermediate processing steps.

**API mediation example:** Consumer uploads a 10MB document as base64 in the request body. The ESB stores the document in object storage (S3/Azure Blob), replaces the base64 content with a storage URL, and forwards the lightweight message to the provider.

**How typically documented today:** Documented in architecture diagrams showing the storage component. The actual claim check logic is typically in platform-specific code.

**What the architect must specify:**
- Which fields are checked out (replaced with references)
- Storage backend (S3, Redis, database)
- Reference format (URL, key, UUID)
- TTL/expiry policy
- Who retrieves the checked-out data (provider pulls, or ESB rehydrates)
- Size threshold triggering the claim check

**Mapping spec coverage:** Not covered — infrastructure concern, not field-level mapping.

---

### 5. Normalizer

**EIP Book Name:** Normalizer
**Book Category:** Message Transformation

**What it does:** Routes messages from different sources (each with its own format) through format-specific translators to produce a single canonical message format. Combines a router with multiple Message Translators.

**API mediation example:** Three consumer APIs send order data in different formats: Consumer A sends JSON with `fullName`, Consumer B sends XML with `<FirstName>` and `<LastName>`, Consumer C sends CSV. The Normalizer detects the source, applies the appropriate translator, and produces the canonical Order model.

**How typically documented today:** Architecture diagrams showing "inbound adapters" per consumer. Individual translations documented (or not) as separate mapping tables. The routing-to-translator logic is often implicit in platform configuration.

**What the architect must specify:**
- How to detect/identify the source format (content-type header, source system ID, message structure)
- One mapping specification per source format to canonical
- The canonical model schema all sources normalize into

**Mapping spec coverage:** `metadata.consumer` identifies which translator to apply. Multiple mapping files, one per consumer format.

---

### 6. Canonical Data Model

**EIP Book Name:** Canonical Data Model
**Book Category:** Message Transformation

**What it does:** Defines a shared, application-independent data model that sits between all consumers and providers. Each system maps to/from the canonical model rather than mapping directly to every other system. Reduces N-to-N mappings to N-to-1 + 1-to-N.

**API mediation example:** Instead of mapping Consumer A's `fullName` directly to Provider X's `given_name` and separately to Provider Y's `first_name`, you map Consumer A to Canonical `firstName` once, and Canonical `firstName` to each provider once.

**How typically documented today:** In well-run shops, JSON Schema or XSD files maintained by a data architecture team. In most shops, informal — living in people's heads, buried in a Confluence wiki, or implicit in the ESB's internal message format.

**What the architect must specify:**
- The canonical model schema itself
- Governance rules (who owns it, how changes are approved)
- Versioning strategy
- A mapping spec for each consumer-to-canonical and canonical-to-provider transformation

**Mapping spec coverage:** `specs/canonical/*.yaml` — the three-column mapping (`source` → `canonical` → `target`) is built around this pattern.

---

### 7. Envelope Wrapper / Unwrapper

**EIP Book Name:** Envelope Wrapper
**Book Category:** Message Transformation

**What it does:** Wraps a message inside a transport-specific envelope (adding headers, metadata, routing information) or unwraps an incoming envelope to extract the business payload.

**API mediation example:** Provider API returns `{ "orderId": "123", "status": "shipped" }`. The ESB wraps this in the consumer's expected envelope: `{ "data": { ... }, "meta": { "timestamp": "...", "correlationId": "..." }, "errors": [] }`. Or the reverse: consumer sends a SOAP envelope, ESB extracts the body and forwards as REST JSON.

**How typically documented today:** SOAP-to-REST unwrapping in architecture diagrams. REST envelope wrapping often implicit in the consumer's OpenAPI schema. Rarely documented as a separate transformation step.

**What the architect must specify:**
- Envelope schema structure (metadata fields: correlationId, timestamp, pagination, errors)
- Which fields come from where (message body vs. transport headers vs. generated)
- Unwrapping rules (where in the incoming structure is the business payload)

**Mapping spec coverage:** Not explicitly covered — could be a standard envelope template referenced from the mapping spec.

---

### 8. Transcodification

**EIP Book Name:** Not a named EIP pattern — a specialized form of Message Translator. In enterprise practice, always treated as a distinct concern.
**Book Category:** Message Transformation (sub-pattern)

**What it does:** Maps coded values (enums, status codes, category codes) from one code system to another. Unlike field mapping (structural), transcodification maps the meaning of values within a field.

**API mediation example:** Consumer `status: "A"` → Canonical `orderStatus: "ACTIVE"` → Provider `order_status_code: "1"`. The transcodification table: A = ACTIVE = 1, I = INACTIVE = 0, S = SUSPENDED = -1.

**How typically documented today:** Excel spreadsheets. This is the one area where Excel is almost universal across enterprises. "Code table mapping spreadsheet" is a genre of document. Sometimes maintained in a database or MDM system. Rarely version-controlled.

**What the architect must specify:**
- Source code system name and values
- Canonical code system name and values
- Target code system name and values
- Relationship type per mapping (equivalent, narrower, broader)
- Unmapped value strategy (reject, use-default, pass-through)
- Who owns the code table (which team maintains it)

**Mapping spec coverage:** `transcodifications[]` — with relationship types borrowed from FHIR ConceptMap and unmapped strategies.

---

## Routing Patterns

These patterns describe how the integration layer decides where to send a message.

---

### 9. Content-Based Router

**EIP Book Name:** Content-Based Router
**Book Category:** Message Routing

**What it does:** Inspects message content (field values, headers) and routes to the appropriate downstream provider based on rules. The single most common routing pattern in ESB implementations.

**API mediation example:** `if request.header['X-Region'] == 'EU' → eu-orders`, `if request.body.orderType == 'DIGITAL' → digital-orders`, `else → acme-orders`.

**How typically documented today:** Confluence decision tables or flowcharts. Visio/Lucidchart diagrams with diamond decision nodes. In platform code: Camel `choice()/when()`, MuleSoft Choice router, ACE Route node. Often the best-documented routing pattern.

**What the architect must specify:**
- Routing criteria (which fields/headers to inspect)
- Routing rules (condition → destination, in priority order)
- Default route (if no rule matches)
- Whether rules are first-match or all-matches
- Error handling per route (what if the selected provider is down)

**Mapping spec coverage:** `routing.rules[]` — declarative conditions with provider references.

---

### 10. Message Filter

**EIP Book Name:** Message Filter
**Book Category:** Message Routing

**What it does:** Examines a message and either passes it through or drops it entirely based on criteria. Unlike Content-Based Router (different destinations), Message Filter has only two outcomes: pass or discard.

**API mediation example:** ESB receives webhook notifications. It filters out `eventType: "HEARTBEAT"` (monitoring noise) and only forwards `ORDER_CREATED`, `ORDER_UPDATED` events. Also used for deduplication: drop messages with an already-seen `idempotencyKey`.

**How typically documented today:** Often implicit in routing logic. Sometimes a Confluence "filter rules" table. Frequently not documented at all.

**What the architect must specify:**
- Filter criteria (pass condition or drop condition)
- Whether dropped messages should be logged/audited or silently discarded
- Dead letter handling for filtered messages

**Mapping spec coverage:** Not explicitly covered — could be a `filters` section.

---

### 11. Recipient List

**EIP Book Name:** Recipient List
**Book Category:** Message Routing

**What it does:** Sends a copy of the message to multiple recipients (providers), where the list is determined dynamically based on message content or configuration.

**API mediation example:** Consumer creates a new customer. The ESB sends customer data to CRM (Salesforce), Billing (SAP), and Email Marketing (Mailchimp) simultaneously. Which systems receive the message may depend on the customer's subscription tier.

**How typically documented today:** Architecture diagrams showing fan-out arrows. Confluence pages listing "downstream systems" per event type.

**What the architect must specify:**
- How the recipient list is determined (static, dynamic from content, or lookup)
- Whether all deliveries must succeed (all-or-nothing) or partial is acceptable
- Timeout per recipient
- Whether different recipients need different transformations

**Mapping spec coverage:** `metadata.providers[]` partially covers this. Full recipient list with dynamic determination is not yet in the spec.

---

### 12. Splitter

**EIP Book Name:** Splitter
**Book Category:** Message Routing

**What it does:** Takes a single message containing a collection (array) and breaks it into individual messages, one per element. Each is processed independently.

**API mediation example:** Consumer sends `POST /orders` with `{ "orders": [order1, order2, order3] }` (batch). The provider only accepts single orders. The ESB splits into three separate `POST /order` calls.

**How typically documented today:** Platform flow diagrams. Confluence describes batch-to-individual decomposition. The aggregation step (reassembling results) is poorly documented.

**What the architect must specify:**
- Which field contains the collection to split
- Maximum batch size (to protect the provider)
- Sequential or parallel processing
- Error handling per item (fail-fast or continue-on-error)
- Correlation strategy for matching results back
- Aggregation strategy for the response (see Aggregator)

**Mapping spec coverage:** Not covered — needs a `split` directive.

---

### 13. Aggregator

**EIP Book Name:** Aggregator
**Book Category:** Message Routing

**What it does:** Collects and combines multiple related messages into a single message. The inverse of Splitter. Handles correlation (which messages belong together), completeness (when all have arrived), and aggregation logic (how to combine).

**API mediation example:** After splitting a batch order into 3 provider calls, the ESB collects all 3 responses and assembles a batch response: `{ "results": [{ "orderId": "O-1", "status": "created" }, { "orderId": "O-2", "status": "failed", "error": "..." }] }`.

**How typically documented today:** The hardest pattern to document well. Platform flow diagrams show an "aggregate" step but rarely capture completeness conditions, timeout behavior, or partial failure handling.

**What the architect must specify:**
- Correlation strategy (correlation ID, request index)
- Completeness condition (expected count, timeout, or both)
- Aggregation logic (merge into array, sum values, pick latest)
- Timeout behavior (partial results or fail)
- Partial failure handling (include failed items with error, or fail entire batch)

**Mapping spec coverage:** Not covered — needs an `aggregate` directive paired with `split`.

---

### 14. Dynamic Router

**EIP Book Name:** Dynamic Router
**Book Category:** Message Routing

**What it does:** Routes messages based on rules that can change at runtime without redeploying. Rules are externalized (database, config service, feature flags) rather than hardcoded.

**API mediation example:** API gateway routes requests to different backend API versions based on a feature flag in LaunchDarkly. When a new provider version is deployed, the routing rule is updated without touching the integration code.

**How typically documented today:** Architecture diagrams show the routing mechanism. Actual rules are in the external system (feature flag UI, database). Often a documentation gap because rules are "operational" rather than "architectural."

**What the architect must specify:**
- Where routing rules are stored (database, config service, rules engine)
- Rule format and evaluation logic
- How rule changes propagate (polling, push)
- Fallback when rule source is unavailable
- Governance (who can change routing rules in production)

**Mapping spec coverage:** Not covered — runtime concern. The mapping spec documents the static routing contract; dynamic routing is an operational overlay.

---

### 15. Routing Slip

**EIP Book Name:** Routing Slip
**Book Category:** Message Routing

**What it does:** Attaches a list of processing steps to the message itself. Each step processes the message and forwards it to the next. The sequence can vary per message.

**API mediation example:** A loan application needs different processing by type: all go through identity verification + credit check, but mortgages also go through property valuation + flood zone check. The routing slip is determined at intake.

**How typically documented today:** Rarely documented as an explicit slip. Usually implemented as conditional workflow, documented in platform-specific flow diagrams or BPMN.

**What the architect must specify:**
- Full catalog of available processing steps
- Rules for which steps apply per message type
- Step ordering constraints
- Error handling per step (skip, abort, retry)
- How the slip is attached to the message

**Mapping spec coverage:** Not covered — OpenAPI Arazzo may complement this for multi-step orchestration.

---

## Composition Patterns

These patterns describe complex multi-step processing combining routing and transformation.

---

### 16. Scatter-Gather

**EIP Book Name:** Scatter-Gather
**Book Category:** Message Routing

**What it does:** Sends the same request to multiple providers simultaneously (scatter), waits for all responses, and aggregates results into a single response (gather). Combines Recipient List + Aggregator.

**API mediation example:** Consumer calls a price comparison API. The ESB queries 4 supplier APIs in parallel, collects all price quotes, returns a consolidated response with best price, average, and individual quotes.

**How typically documented today:** Architecture diagrams showing parallel fan-out and fan-in. The aggregation logic (merge/rank/select) is typically in code.

**What the architect must specify:**
- Providers to scatter to (static or dynamic)
- Whether all must respond or partial results are acceptable
- Timeout per provider and overall timeout
- Aggregation/merge strategy (best-of, merge-all, weighted scoring)
- Transformation per provider response (if formats differ)

**Mapping spec coverage:** Not covered — extends beyond current scope.

---

### 17. Composed Message Processor

**EIP Book Name:** Composed Message Processor
**Book Category:** Message Routing

**What it does:** Splits a composite message by type, routes each part to its appropriate handler, processes independently, and re-aggregates. Combines Splitter + Router + Aggregator.

**API mediation example:** Order contains physical products, digital downloads, and subscriptions. ESB splits by line item type, routes physical → warehouse API, digital → content delivery API, subscriptions → billing API, then aggregates all confirmations.

**How typically documented today:** Complex orchestration diagrams (BPMN). In most shops, lives entirely in the integration developer's head and platform code.

**What the architect must specify:**
- How the message is decomposed (split criteria)
- Routing rules per part type
- Transformation per part (each provider may have a different schema)
- Aggregation strategy for the combined response
- Error handling (if warehouse fails but billing succeeds)
- Transaction/compensation semantics

**Mapping spec coverage:** Not covered — would require combining `split`, `routing`, and `aggregate` directives.

---

### 18. Process Manager

**EIP Book Name:** Process Manager
**Book Category:** Message Routing

**What it does:** Maintains state and controls multi-step processing, making dynamic decisions based on results of previous steps. More powerful than Routing Slip because the next step depends on the previous step's outcome.

**API mediation example:** Order processing: validate → check inventory → charge payment → create shipment. If any step fails, execute compensating actions (refund, release hold). The Process Manager tracks the order's state across steps.

**How typically documented today:** BPMN diagrams, state machine diagrams, or sequence diagrams. Sometimes implemented as a saga pattern in microservices. One of the better-documented patterns because it has business visibility.

**What the architect must specify:**
- State machine (all states and transitions)
- API calls at each step with request/response transformations
- Success/failure criteria per step
- Compensating actions for rollback
- Timeout and retry policies per step
- State persistence strategy
- Idempotency requirements

**Mapping spec coverage:** Not covered — OpenAPI Arazzo is designed for this concern. The mapping spec handles field-level transformation at each step; Arazzo handles the orchestration between steps.

---

### 19. Pipes and Filters

**EIP Book Name:** Pipes and Filters
**Book Category:** Messaging Systems (architectural style)

**What it does:** Decomposes complex processing into a sequence of independent, reusable steps (filters) connected by channels (pipes). Each filter performs one concern and passes the result to the next.

**API mediation example:** Incoming request flows through: validate schema → authenticate → normalize dates → enrich with customer data → transform to provider format → call provider. Each filter is independently testable and reusable.

**How typically documented today:** Architecture diagrams showing the pipeline. In code: Camel routes, Spring Integration chains, ACE message flows. The pipeline structure is visible in tooling but rarely documented in a platform-agnostic way.

**What the architect must specify:**
- Ordered list of processing steps (filters)
- What each filter does (validate, transform, enrich, route)
- Input/output contract of each filter
- Error handling per filter
- Which filters are reusable across flows

**Mapping spec coverage:** Not explicitly covered — more of an architectural style. Individual filters (transformation, enrichment, routing) are covered by other sections of the mapping spec.

---

### 20. Wire Tap

**EIP Book Name:** Wire Tap
**Book Category:** System Management

**What it does:** Sends a copy of the message to a secondary destination for monitoring, auditing, or analytics without affecting the primary flow.

**API mediation example:** Every request/response through the ESB is wire-tapped to an audit log service for compliance. The message is copied (with PII redacted) and sent to Elasticsearch/Splunk while the primary flow continues.

**How typically documented today:** Architecture diagrams as a side-channel. Usually an infrastructure concern configured once for all flows. Rarely documented at the individual mapping level.

**What the architect must specify:**
- What is tapped (full message, headers only, specific fields)
- Tap destination (audit service, log aggregator, analytics)
- Fields to redact before tapping (PII, credentials)
- Synchronous (blocks primary) or asynchronous (fire-and-forget)
- Which flows are tapped (all, or based on rules)

**Mapping spec coverage:** Not covered — cross-cutting infrastructure concern.

---

## Summary: Mapping Spec Coverage Matrix

| # | Pattern | Category | Mapping Spec Section | Coverage |
|---|---|---|---|---|
| 1 | Message Translator | Data | `mappings[].transform` | Covered |
| 2 | Content Enricher | Data | — | **Gap** (needs `enrichments`) |
| 3 | Content Filter | Data | Implicit (unmapped = dropped) | Partial |
| 4 | Claim Check | Data | — | Out of scope (infrastructure) |
| 5 | Normalizer | Data | `metadata.consumer` | Covered (multi-file) |
| 6 | Canonical Data Model | Data | `specs/canonical/*.yaml` | Covered |
| 7 | Envelope Wrapper | Data | — | Gap (needs envelope template) |
| 8 | Transcodification | Data | `transcodifications[]` | Covered |
| 9 | Content-Based Router | Routing | `routing.rules[]` | Covered |
| 10 | Message Filter | Routing | — | Gap (needs `filters`) |
| 11 | Recipient List | Routing | `metadata.providers[]` | Partial |
| 12 | Splitter | Routing | — | Gap (needs `split`) |
| 13 | Aggregator | Routing | — | Gap (needs `aggregate`) |
| 14 | Dynamic Router | Routing | — | Out of scope (runtime) |
| 15 | Routing Slip | Routing | — | Out of scope (Arazzo) |
| 16 | Scatter-Gather | Composition | — | Out of scope (v2) |
| 17 | Composed Msg Processor | Composition | — | Out of scope (v2) |
| 18 | Process Manager | Composition | — | Out of scope (Arazzo) |
| 19 | Pipes and Filters | Composition | — | Architectural style |
| 20 | Wire Tap | Composition | — | Out of scope (infrastructure) |

### What the mapping spec covers well (v1)

- **Message Translator** — field mapping + transformation (the core)
- **Canonical Data Model** — the three-column structure (source → canonical → target)
- **Transcodification** — code table mapping with relationships
- **Content-Based Router** — declarative routing rules

### Priority gaps for v2

- **Content Enricher** — almost every integration has at least one external callout for data enrichment
- **Splitter / Aggregator** — batch processing is universal
- **Message Filter** — drop/pass criteria should be explicitly documented

### Complementary specs (not in mapping spec, handled elsewhere)

- **Process Manager / Routing Slip** — OpenAPI Arazzo handles multi-step orchestration
- **Claim Check / Wire Tap** — infrastructure concerns, not mapping concerns
- **Dynamic Router** — runtime operational concern

---

## References

- Hohpe, G. & Woolf, B. (2003). *Enterprise Integration Patterns: Designing, Building, and Deploying Messaging Solutions*. Addison-Wesley.
- EIP Pattern Catalog: https://www.enterpriseintegrationpatterns.com/patterns/messaging/
- Apache Camel EIP Components: https://camel.apache.org/components/latest/eips/enterprise-integration-patterns.html
- MuleSoft EIP Reference: https://docs.mulesoft.com/mule-runtime/latest/about-components
- Spring Integration EIP: https://docs.spring.io/spring-integration/reference/overview.html
